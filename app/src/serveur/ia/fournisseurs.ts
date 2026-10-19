import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI, { toFile } from "openai";
import { MODELES, MODELE_DES_IMAGES, type IdModele } from "./modeles";

/**
 * L'appel à un fournisseur, et rien d'autre : une consigne fixe, un message, une réponse en
 * JSON conforme à un schéma. Ni les plafonds, ni le journal, ni la simulation des essais ne
 * sont ici (`demander.ts`). Les clés se lisent dans l'environnement du serveur et ne quittent
 * jamais ce fichier.
 *
 * Rien n'est gardé chez OpenAI (`store: false`) ; Anthropic ne garde pas les requêtes de l'API
 * au-delà de sa durée de rétention ordinaire.
 */

export type Schema = { nom: string; schema: Record<string, unknown> };

export type Requete = {
  modele: IdModele;
  /** Consigne fixe de l'aide, la même d'un appel à l'autre */
  systeme: string;
  /** Ce qui change : le contexte et la demande */
  message: string;
  schema: Schema;
  /** Borne de la réponse elle-même, raisonnement non compris */
  sortieMax: number;
  signal: AbortSignal;
};

export type Reponse = { json: unknown; jetonsEntree: number; jetonsSortie: number };

/** La réponse n'est pas utilisable : refus du modèle, réponse coupée, JSON invalide. */
export class ReponseInutilisable extends Error {}

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

const cle = (nom: "ANTHROPIC_API_KEY" | "OPENAI_API_KEY"): string => {
  const valeur = process.env[nom];
  if (!valeur) throw new ReponseInutilisable(`Clé absente : ${nom}`);
  return valeur;
};

// Une seule nouvelle tentative : au-delà, l'adulte attendrait plus que les soixante secondes
const clientAnthropic = () => (anthropic ??= new Anthropic({ apiKey: cle("ANTHROPIC_API_KEY"), maxRetries: 1 }));
const clientOpenAI = () => (openai ??= new OpenAI({ apiKey: cle("OPENAI_API_KEY"), maxRetries: 1 }));

function lireJson(texte: string): unknown {
  try {
    return JSON.parse(texte);
  } catch {
    throw new ReponseInutilisable("La réponse n'est pas du JSON.");
  }
}

async function appelerAnthropic(r: Requete): Promise<Reponse> {
  const m = MODELES[r.modele];
  // Le raisonnement compte dans max_tokens : de la place en plus quand le modèle réfléchit
  const reponse = await clientAnthropic().messages.create(
    {
      model: m.id,
      max_tokens: m.effort ? r.sortieMax * 2 + 2000 : r.sortieMax,
      system: r.systeme,
      messages: [{ role: "user", content: r.message }],
      output_config: { format: { type: "json_schema", schema: r.schema.schema }, ...(m.effort ? { effort: m.effort } : {}) },
    },
    { signal: r.signal },
  );
  const jetonsEntree = reponse.usage.input_tokens + (reponse.usage.cache_creation_input_tokens ?? 0) + (reponse.usage.cache_read_input_tokens ?? 0);
  const jetonsSortie = reponse.usage.output_tokens;
  if (reponse.stop_reason !== "end_turn") throw Object.assign(new ReponseInutilisable(`Arrêt : ${reponse.stop_reason}`), { jetonsEntree, jetonsSortie });
  const texte = reponse.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return { json: lireJson(texte), jetonsEntree, jetonsSortie };
}

async function appelerOpenAI(r: Requete): Promise<Reponse> {
  const m = MODELES[r.modele];
  const reponse = await clientOpenAI().responses.create(
    {
      model: m.id,
      instructions: r.systeme,
      input: r.message,
      text: { format: { type: "json_schema", name: r.schema.nom, schema: r.schema.schema, strict: true } },
      ...(m.effort ? { reasoning: { effort: m.effort } } : {}),
      max_output_tokens: m.effort ? r.sortieMax * 2 + 2000 : r.sortieMax,
      store: false,
    },
    { signal: r.signal },
  );
  const jetonsEntree = reponse.usage?.input_tokens ?? 0;
  const jetonsSortie = reponse.usage?.output_tokens ?? 0;
  if (reponse.status !== "completed") throw Object.assign(new ReponseInutilisable(`Arrêt : ${reponse.status}`), { jetonsEntree, jetonsSortie });
  return { json: lireJson(reponse.output_text), jetonsEntree, jetonsSortie };
}

/** Appelle le vrai fournisseur du modèle. Jamais pendant les essais automatiques (`demander.ts`). */
export function appelerLeFournisseur(r: Requete): Promise<Reponse> {
  return MODELES[r.modele].fournisseur === "anthropic" ? appelerAnthropic(r) : appelerOpenAI(r);
}

/** Les jetons d'une réponse inutilisable, quand le fournisseur les a dits : ils se paient aussi. */
export const jetonsDe = (e: unknown): { jetonsEntree: number; jetonsSortie: number } => {
  const o = e && typeof e === "object" ? (e as Record<string, unknown>) : {};
  return {
    jetonsEntree: typeof o.jetonsEntree === "number" ? o.jetonsEntree : 0,
    jetonsSortie: typeof o.jetonsSortie === "number" ? o.jetonsSortie : 0,
  };
};

export type RequeteImages = {
  prompt: string;
  /** « 1024x1536 » : largeur et hauteur multiples de 16 */
  taille: string;
  qualite: "normale" | "haute";
  nombre: 1 | 2;
  /** Sur fond transparent, en PNG (l'image détourée) */
  transparente?: boolean;
  /**
   * Les portraits et les images de référence des personnages et des objets retenus (F10.2) :
   * avec eux, l'image se crée par l'édition d'OpenAI, qui les reçoit en entrée. Chacune se paie
   * en jetons d'image d'entrée.
   */
  references?: { octets: Uint8Array; format: "jpeg" | "png" | "webp" }[];
  signal: AbortSignal;
};

export type ReponseImages = { images: Uint8Array[]; texteEntree: number; imageEntree: number; sortie: number };

/**
 * Crée une ou deux images chez OpenAI (F10.1, F10.2), en JPEG. « Normale » est la qualité
 * « medium » du modèle, « haute » sa qualité « high ». Jamais pendant les essais automatiques.
 */
export async function creerDesImages(r: RequeteImages): Promise<ReponseImages> {
  const commun = {
    model: MODELE_DES_IMAGES.id,
    prompt: r.prompt,
    size: r.taille,
    quality: r.qualite === "haute" ? ("high" as const) : ("medium" as const),
    n: r.nombre,
    ...(r.transparente
      ? { output_format: "png" as const, background: "transparent" as const }
      : { output_format: "jpeg" as const, output_compression: 92, background: "opaque" as const }),
  };
  const reponse = r.references?.length
    ? await clientOpenAI().images.edit(
        {
          ...commun,
          image: await Promise.all(r.references.map((x, i) => toFile(Buffer.from(x.octets), `reference-${i + 1}.${x.format === "jpeg" ? "jpg" : x.format}`, { type: `image/${x.format}` }))),
        },
        { signal: r.signal },
      )
    : await clientOpenAI().images.generate(commun, { signal: r.signal });
  const u = reponse.usage;
  const imageEntree = u?.input_tokens_details?.image_tokens ?? 0;
  const jetons = { texteEntree: Math.max(0, (u?.input_tokens ?? 0) - imageEntree), imageEntree, sortie: u?.output_tokens ?? 0 };
  const images = (reponse.data ?? []).flatMap((d) => (d.b64_json ? [new Uint8Array(Buffer.from(d.b64_json, "base64"))] : []));
  if (!images.length) throw Object.assign(new ReponseInutilisable("Aucune image rendue."), { jetonsImages: jetons });
  return { images, ...jetons };
}
