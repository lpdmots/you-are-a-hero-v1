/**
 * Charge dans la base locale, pour le compte local, un petit livre à choix où figure chaque cas
 * des contrôles du livre (F09.2), pour juger « Vérifier les chemins » : un départ, une impasse,
 * un choix sans destination, un choix vers une scène supprimée, un autre vers une scène exclue,
 * une scène prête mais vide, une énigme sans autre issue dont le numéro fixé n'existe pas, une
 * boucle sans fin, une scène où rien ne mène et celle qu'on n'atteint qu'à travers elle, une
 * scène à finir, des actions de jeu sans feuille d'aventure.
 *
 *   npm run livre:essai                « Le phare aux énigmes », projet personnel
 *   npm run livre:essai -- --refaire   le retire, avec ce qui y a été écrit, puis le recharge
 *
 * Base locale seulement : cette commande ne sait pas parler à la vraie base.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

const racine = resolve(__dirname, "..");
config({ path: resolve(racine, ".env.local"), quiet: true });
const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};
const adresseBase = process.env.BASE_LOCALE_URL ?? "";
if (!locale(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") || !locale(adresseBase)) {
  console.error("Cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
  process.exit(1);
}
const refaire = process.argv.includes("--refaire");
const compteLocal = resolve(racine, ".compte-local");
// La première ligne de .compte-local est l'adresse du compte ; la seconde, son mot de passe, n'est pas lue
const courriel = existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "";

export const TITRE = "Le phare aux énigmes";

type Etat = "cours" | "prete";
type SceneDuLivre = {
  ref: number; chapitre: "cote" | "phare"; titre: string; texte?: string[]; etat?: Etat; fin?: boolean; hors?: boolean; supprimee?: boolean; fixe?: number;
  /** Les choix : libellé et référence visée, null sans destination */
  choix?: [string, number | null][];
  cachee?: { vers: number; libelle: string };
  action?: string;
};

/** Chaque scène, et le cas qu'elle porte. */
export const SCENES: SceneDuLivre[] = [
  { ref: 1, chapitre: "cote", titre: "Plage — le matin du départ", texte: ["Le phare clignote encore, alors qu’il fait jour. Mila serre son sac contre elle."], choix: [["Longer les falaises", 2], ["Entrer dans la grotte", 3], ["Fouiller le bateau échoué", 10]] },
  // Un choix sans destination ; une action de jeu, sans feuille d'aventure
  { ref: 2, chapitre: "cote", titre: "Falaises — le sentier des goélands", texte: ["Le sentier est étroit. Un goéland crie au-dessus de la mer."], action: "Ajoute la corde à ton inventaire.", choix: [["Monter vers le phare", 4], ["Suivre le goéland", null]] },
  // Un choix vers une scène exclue, un autre vers une scène supprimée
  { ref: 3, chapitre: "cote", titre: "Grotte — l’eau qui goutte", texte: ["Il fait froid. Une lueur bleue danse au fond de la grotte."], choix: [["Approcher de la lueur", 5], ["Frapper à la cabane", 13], ["Descendre au port", 15], ["Revenir sur la plage", 1]] },
  // Seule suite : une énigme, dont le numéro fixé dépasse le livre
  { ref: 4, chapitre: "phare", titre: "Phare — la porte aux trois serrures", texte: ["Trois serrures, trois symboles : une vague, une étoile, une clé. Additionne leurs valeurs pour trouver le passage."], action: "Retire un point de courage à ton héros.", cachee: { vers: 6, libelle: "Ouvrir la porte" } },
  { ref: 5, chapitre: "cote", titre: "Grotte — le trésor oublié", texte: ["Un coffre rouillé, vide depuis longtemps."], fin: true, hors: true },
  { ref: 6, chapitre: "phare", titre: "Phare — l’escalier en colimaçon", texte: ["Cent vingt marches. Des mouettes tournent derrière les vitres."], fixe: 40, choix: [["Monter jusqu’à la lanterne", 7], ["Écouter les mouettes", 8], ["Ouvrir la petite porte", 14]] },
  { ref: 7, chapitre: "phare", titre: "Phare — la lanterne rallumée", texte: ["La lumière balaie la mer. Le bateau perdu retrouve son chemin."], fin: true },
  // Une boucle dont on ne sort plus
  { ref: 8, chapitre: "phare", titre: "Galerie — le cercle des mouettes", texte: ["Les mouettes tournent, tournent. Mila tourne avec elles."], choix: [["Suivre la plus grande", 9]] },
  { ref: 9, chapitre: "phare", titre: "Galerie — le nid", texte: ["Un nid de plumes et de cordages. Les mouettes reviennent."], choix: [["Faire encore le tour", 8]] },
  // Une impasse
  { ref: 10, chapitre: "cote", titre: "Plage — le bateau échoué", texte: ["La coque est fendue. Il n’y a rien à faire ici, et pourtant Mila reste."] },
  // Rien n'y mène ; la scène suivante ne s'atteint qu'à travers elle
  { ref: 11, chapitre: "cote", titre: "Crique — l’entrée cachée", texte: ["Derrière les rochers, une crique que personne ne connaît."], choix: [["Passer sous l’arche", 12]] },
  { ref: 12, chapitre: "cote", titre: "Crique — le passage secret", texte: ["L’arche mène tout droit au pied du phare."], fin: true },
  // Déclarée prête, mais vide
  { ref: 13, chapitre: "cote", titre: "Cabane — le gardien absent" },
  // À finir : ses défauts d'écriture ne sont pas présentés
  { ref: 14, chapitre: "phare", titre: "Phare — la réserve d’huile", texte: ["Des bidons, une odeur forte…"], etat: "cours" },
  { ref: 15, chapitre: "cote", titre: "Port — les filets", texte: ["Le port est désert."], fin: true, supprimee: true },
];

const CHAPITRES = { cote: { titre: "La côte", couleur: 4 }, phare: { titre: "Le phare", couleur: 6 } } as const;

const bloc = (type: string, reste: Record<string, unknown>) => ({ type, id: randomUUID(), ...reste });

async function principal(): Promise<void> {
  if (!courriel) throw new Error("Aucun compte local : lancez « npm run compte:local ».");
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  const q = async <T = Record<string, unknown>>(texte: string, valeurs: unknown[] = []): Promise<T[]> => (await base.query(texte, valeurs)).rows as T[];
  try {
    const [compte] = await q<{ id: string }>("select e.id from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel]);
    if (!compte) throw new Error("Le compte local n'est pas dans la base locale : lancez « npm run compte:local ».");
    const [schema] = await q<{ pret: boolean }>("select to_regclass('public.avertissements_acceptes') is not null as pret");
    if (!schema?.pret) throw new Error("Le schéma de la base locale n'est pas à jour : appliquez d'abord les migrations.");
    const deja = await q<{ id: string }>("select id from public.projets where enseignant_id = $1 and titre = $2", [compte.id, TITRE]);
    if (deja.length && !refaire) throw new Error(`« ${TITRE} » est déjà chargé. Pour le remettre à neuf, ajoutez « --refaire ».`);

    await q("begin");
    try {
      for (const p of deja) await q("delete from public.projets where id = $1", [p.id]);
      const projetId = randomUUID();
      await q("insert into public.projets (id, enseignant_id, organisation, recit, titre) values ($1, $2, 'personnel', 'choix', $3)", [projetId, compte.id, TITRE]);
      // Une rubrique de jeu, des formules, et pas de feuille d'aventure
      await q("update public.preparations set rubrique_jeu = true where projet_id = $1", [projetId]);
      const partieId = randomUUID();
      await q("insert into public.parties (id, projet_id, enseignant_id, titre, rang) values ($1, $2, $3, $4, 0)", [partieId, projetId, compte.id, "Le phare"]);
      const chapitres: Record<string, string> = {};
      for (const [rang, [cle, c]] of Object.entries(CHAPITRES).entries()) {
        chapitres[cle] = randomUUID();
        await q("insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur) values ($1, $2, $3, $4, $5, $6, $7)", [
          chapitres[cle], partieId, projetId, compte.id, c.titre, rang, c.couleur,
        ]);
      }
      const ids = new Map(SCENES.map((s) => [s.ref, randomUUID()]));
      const lignes = SCENES.map((s, i) => ({
        id: ids.get(s.ref), chapitre: chapitres[s.chapitre], reference: s.ref, titre: s.titre, rang: i, fin: s.fin === true, hors: s.hors === true,
        etat: s.etat ?? "prete", fixe: s.fixe ?? null, supprime: s.supprimee === true,
      }));
      await q(
        `insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, titre, rang, fin, hors_livre, etat, numero_fixe, supprime_le)
         select x.id, x.chapitre, $1, $2, x.reference, x.titre, x.rang, x.fin, x.hors, x.etat, x.fixe, case when x.supprime then now() end
         from jsonb_to_recordset($3::jsonb) as x(id uuid, chapitre uuid, reference integer, titre text, rang integer, fin boolean, hors boolean, etat text, fixe integer, supprime boolean)`,
        [projetId, compte.id, JSON.stringify(lignes)],
      );
      await q("update public.projets set reference_suivante = $2, depart_scene_id = $3 where id = $1", [projetId, SCENES.length + 1, ids.get(1)]);
      // Les textes, une fois toutes les scènes en place : les liens du récit s'en déduisent
      const textes = SCENES.map((s) => ({
        id: ids.get(s.ref),
        texte: [
          ...(s.texte ?? []).map((t) => bloc("p", { children: [{ text: t }] })),
          ...(s.action ? [bloc("action", { children: [{ text: s.action }] })] : []),
          ...(s.choix ?? []).map(([libelle, vers]) => bloc("choix", { auto: true, libelle, construction: "neutre", cible: vers === null ? null : ids.get(vers), children: [{ text: "" }] })),
          ...(s.cachee ? [bloc("liaison", { cible: ids.get(s.cachee.vers), libelle: s.cachee.libelle, children: [{ text: "" }] })] : []),
        ],
      })).filter((t) => t.texte.length);
      await q(
        "update public.scenes s set texte = x.texte, version = 1, ecrit_le = now() from jsonb_to_recordset($1::jsonb) as x(id uuid, texte jsonb) where s.id = x.id",
        [JSON.stringify(textes)],
      );
      await q("commit");
    } catch (erreur) {
      await q("rollback");
      throw erreur;
    }
    console.log(`« ${TITRE} » chargé pour le compte local, base locale : ${SCENES.length} scènes, dont une dans la corbeille et une hors du livre.`);
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(erreur.message);
  process.exit(1);
});
