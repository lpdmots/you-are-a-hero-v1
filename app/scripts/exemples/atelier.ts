/**
 * L'atelier des livres d'exemple : les aides de l'application appelées sur le projet de travail
 * de la base locale, par les fonctions mêmes du serveur (mêmes prompts, mêmes modèles, même
 * contexte relu dans la base), connecté comme le compte local. Ce que chaque aide propose est
 * gardé, comme l'adulte le ferait d'un clic, et noté dans essais-ia/livres/<livre>.json (hors de
 * Git) pour l'analyse. La dépense se lit dans le journal des appels de la base locale.
 *
 *   npm run livres:atelier -- passeurs corriger [refs]   correction (degré et longueur de la conception ; 5 et 115 mots à défaut)
 *   npm run livres:atelier -- passeurs ecrire [refs]     « ✦ Écrire » des scènes vides, dans l'ordre du récit
 *   npm run livres:atelier -- passeurs textes            les textes du moment, dans essais-ia/livres/<livre>-textes.json,
 *                                                        et dans <livre>-arrivees.txt, chacun sous la fin des passages qui y mènent
 *   npm run livres:atelier -- passeurs appliquer         remplace le récit des scènes par essais-ia/livres/<livre>-relus.json
 *   npm run livres:atelier -- passeurs portraits         fiches visuelles et portraits des personnages
 *   npm run livres:atelier -- passeurs images [refs]     description puis image de chaque scène illustrée, posée
 *   npm run livres:atelier -- passeurs images refaire 21 l'image déjà posée est retirée, puis refaite
 *   npm run livres:atelier -- passeurs titre             l'image du projet (d'après l'univers), pour la page de titre
 *   npm run livres:atelier -- passeurs depense           ce que l'atelier a coûté depuis son premier appel
 *
 * En local seulement : la clé d'API vient de .env.local, jamais affichée.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { lireReglagesIa } from "@/domaine/aides-ia";
import { paragraphesACorriger } from "@/domaine/correction";
import { LARGEURS, type Texte } from "@/domaine/copie";
import type { Cadrage } from "@/domaine/illustration";
import type { Enseignant } from "@/serveur/adulte";
import { demanderUneEcriture, mettreUneEcriture } from "@/serveur/aides-de-la-scene";
import { demanderUneCorrection, garderUneCorrection, remplacerSiInchange } from "@/serveur/correction";
import { texteDeScene } from "@/serveur/copie";
import { demandeParId, demanderLaReference, demanderLeReperage, demanderLImageDeScene, fermerLaDemande, proposerLaDescription } from "@/serveur/images-creees";
import { cheminImage, cheminVignette, lireImage, SEAU } from "@/serveur/images";
import { cheminProposition, preciserLaFiche } from "@/serveur/personnages";
import { clientService } from "@/serveur/supabase";
import type { Conception } from "./conception";
import { livre as dragon } from "./dragon";
import * as passeurs from "./passeurs-de-brume";

const racine = resolve(__dirname, "../..");
config({ path: resolve(racine, ".env.local"), quiet: true });
delete process.env.IA_SIMULEE;

const LIVRES: Record<string, Conception> = { passeurs, dragon };
const [cle, etape, ...reste] = process.argv.slice(2);
if (!(cle in LIVRES)) throw new Error(`Nommez le livre : ${Object.keys(LIVRES).join(", ")}.`);
const c = LIVRES[cle];
const refaire = reste.includes("refaire");
const refs = reste.filter((r) => r !== "refaire");
const refsDemandees = refs.length ? new Set(refs.flatMap((r) => r.split(",")).map(Number)) : null;
const voulue = (ref: number) => !refsDemandees || refsDemandees.has(ref);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw new Error("L'atelier ne travaille qu'avec la base locale.");

const dossier = resolve(racine, "essais-ia/livres");
mkdirSync(dossier, { recursive: true });
const fichierJournal = resolve(dossier, `${cle}.json`);
type Entree = { quand: string; etape: string; ref?: number; avant?: unknown; apres?: unknown; message?: string };
const journal: Entree[] = existsSync(fichierJournal) ? JSON.parse(readFileSync(fichierJournal, "utf8")) : [];
const noter = (e: Omit<Entree, "quand">) => {
  journal.push({ quand: new Date().toISOString(), ...e });
  writeFileSync(fichierJournal, JSON.stringify(journal, null, 2));
};

/** Le compte local, connecté par son mot de passe : la base le voit comme dans l'application. */
async function connecter(): Promise<Enseignant> {
  const [courriel, motDePasse] = readFileSync(resolve(racine, ".compte-local"), "utf8").split("\n").map((l) => l.trim());
  const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email: courriel, password: motDePasse });
  if (error || !data.user) throw new Error("Connexion du compte local impossible.");
  const { data: ligne } = await supabase.from("enseignants").select("id, nom_affiche, dernier_projet_id, aides_masquees, reglages_ia, etoiles, createur").eq("id", data.user.id).single();
  if (!ligne) throw new Error("Le compte local n'est pas un compte d'adulte.");
  // Une image par création : l'atelier garde la première, comme on choisirait
  const reglagesIa = { ...lireReglagesIa(ligne.reglages_ia), proposer: true, imagesParCreation: 1 as const };
  return {
    id: ligne.id, courriel, nomAffiche: ligne.nom_affiche, dernierProjetId: ligne.dernier_projet_id, aidesMasquees: ligne.aides_masquees ?? [],
    reglagesIa, etoiles: ligne.etoiles, createur: ligne.createur, supabase,
  };
}

type Scene = { id: string; reference: number; version: number };
async function lePlan(e: Enseignant): Promise<{ projetId: string; scenes: Map<number, Scene> }> {
  const { data: projets } = await e.supabase.from("projets").select("id").in("titre", [c.TITRE, ...(c.ANCIENS_TITRES ?? [])]).eq("organisation", "classe").is("classe_id", null);
  if (projets?.length !== 1) throw new Error(`Il faut un seul « ${c.TITRE} » d'exemple dans la base locale (« npm run livres:exemple -- ${cle} --brouillon »).`);
  const projetId = projets[0].id as string;
  const { data } = await e.supabase.from("scenes").select("id, reference, version").eq("projet_id", projetId).is("supprime_le", null);
  return { projetId, scenes: new Map((data ?? []).map((s) => [s.reference as number, s as Scene])) };
}

const recit = (t: Texte) => paragraphesACorriger(t).map((p) => p.texte);
const mots = (ps: string[]) => ps.join(" ").split(/\s+/).filter(Boolean).length;

async function corriger(e: Enseignant, scenes: Map<number, Scene>) {
  // Les textes de base ; sans eux, tous les textes écrits
  const deBase = Object.keys(c.TEXTES_DE_BASE).map(Number);
  const degre = c.CORRECTION?.degre ?? 5;
  for (const ref of (deBase.length ? deBase : [...scenes.keys()].sort((a, b) => a - b)).filter(voulue)) {
    const s = scenes.get(ref)!;
    const t = await texteDeScene(e, s.id);
    if (!t) continue;
    const avant = recit(t.texte);
    if (!avant.length) continue;
    const cible = c.CORRECTION ? c.CORRECTION.mots : Math.max(115, Math.round(mots(avant) * 1.4));
    const r = await demanderUneCorrection(e, s.id, t.version, degre, null, cible ? { mots: cible } : { facteur: 1 });
    if (!r.ok) {
      noter({ etape: "corriger", ref, message: r.message });
      console.log(`S${ref} : ${r.message}`);
      continue;
    }
    const garde = await garderUneCorrection(e, s.id, r.version, r.propositions, []);
    const apres = r.propositions.map((p) => p.apres);
    noter({ etape: "corriger", ref, avant, apres, message: garde.ok ? undefined : garde.message });
    console.log(`S${ref} : ${mots(avant)} → ${mots(apres)} mots${garde.ok ? "" : ` (non gardé : ${garde.message})`}`);
  }
}

async function ecrire(e: Enseignant, scenes: Map<number, Scene>) {
  for (const ref of c.A_ECRIRE.filter(voulue)) {
    const s = scenes.get(ref)!;
    const t = await texteDeScene(e, s.id);
    if (!t) continue;
    const r = await demanderUneEcriture(e, s.id, t.version, c.MOTS?.[ref] ?? c.MOTS_PAR_DEFAUT ?? 120);
    if (!r.ok) {
      noter({ etape: "ecrire", ref, message: r.message });
      console.log(`S${ref} : ${r.message}`);
      continue;
    }
    const mis = await mettreUneEcriture(e, s.id, r.version, r.paragraphes);
    noter({ etape: "ecrire", ref, apres: r.paragraphes, message: mis.ok ? undefined : mis.message });
    console.log(`S${ref} : ${mots(r.paragraphes)} mots${mis.ok ? "" : ` (non mis : ${mis.message})`}`);
  }
}

async function textes(e: Enseignant, scenes: Map<number, Scene>) {
  const sortie: Record<number, string[]> = {};
  for (const [ref, s] of [...scenes].sort(([a], [b]) => a - b)) {
    const t = await texteDeScene(e, s.id);
    sortie[ref] = t ? recit(t.texte) : [];
  }
  writeFileSync(resolve(dossier, `${cle}-textes.json`), JSON.stringify(sortie, null, 2));
  // Chaque texte sous la fin de chacun des passages qui y mènent, et le choix qui y conduit :
  // un passage où l'on arrive de plusieurs façons ne doit supposer aucune d'elles
  const plan = c.PARTIES.flatMap((p) => p.chapitres.flatMap((ch) => ch.scenes));
  const lignes: string[] = [];
  for (const s of plan) {
    lignes.push(`=== S${s.ref} ${s.titre} (${mots(sortie[s.ref] ?? [])} mots)`);
    for (const o of plan) {
      for (const [libelle, vers] of o.choix ?? []) {
        if (vers === s.ref) lignes.push(`  ← S${o.ref}, « ${libelle} » : …${(sortie[o.ref] ?? []).join(" ").slice(-160)}`);
      }
    }
    lignes.push(...(sortie[s.ref] ?? []).map((p) => `  ${p}`), "");
  }
  writeFileSync(resolve(dossier, `${cle}-arrivees.txt`), lignes.join("\n"));
  console.log(`${Object.keys(sortie).length} textes dans essais-ia/livres/${cle}-textes.json et ${cle}-arrivees.txt.`);
}

/** Les textes relus : le récit de chaque scène nommée est remplacé, ses autres blocs gardés à leur place. */
async function appliquer(e: Enseignant, scenes: Map<number, Scene>) {
  const relus = JSON.parse(readFileSync(resolve(dossier, `${cle}-relus.json`), "utf8")) as Record<string, string[]>;
  for (const [ref, paragraphes] of Object.entries(relus).filter(([r]) => voulue(Number(r)))) {
    const s = scenes.get(Number(ref))!;
    const t = await texteDeScene(e, s.id);
    if (!t) continue;
    if (JSON.stringify(recit(t.texte)) === JSON.stringify(paragraphes)) continue;
    // Les paragraphes de récit cèdent la place aux relus, à l'endroit du premier
    const premier = t.texte.findIndex((b) => b.type === "p");
    const autres = t.texte.filter((b) => b.type !== "p");
    const nouveaux = paragraphes.map((p) => ({ type: "p", id: randomUUID(), children: [{ text: p }] })) as Texte;
    const texte = [...autres.slice(0, Math.max(0, premier)), ...nouveaux, ...autres.slice(Math.max(0, premier))];
    const r = await remplacerSiInchange(e, s.id, t.version, texte);
    console.log(`S${ref} : ${r.ok ? "relu" : r.message}`);
  }
}

/** Attend la fin d'une demande d'image, déjà lancée. */
async function attendre(e: Enseignant, lancee: { ok: true; demande: string; travail: () => Promise<void> }) {
  await lancee.travail();
  return demandeParId(e, lancee.demande);
}

async function portraits(e: Enseignant, projetId: string) {
  const { data } = await e.supabase.from("personnages").select("id, nom, fiche, portrait_id").eq("projet_id", projetId).order("rang");
  for (const p of data ?? []) {
    const voulu = c.PERSONNAGES.find((x) => x.nom === p.nom);
    if (!voulu) continue;
    if (!String(p.fiche ?? "").trim()) {
      const f = await preciserLaFiche(e, "personnage", p.id);
      if (!f.ok) {
        console.log(`${p.nom} : ${f.message}`);
        continue;
      }
      await e.supabase.from("personnages").update({ fiche: f.fiche }).eq("id", p.id);
      noter({ etape: "fiche", message: p.nom, apres: f.fiche });
      console.log(`${p.nom} : fiche visuelle`);
    }
    if (voulu.portrait && !p.portrait_id) {
      const l = await demanderLaReference(e, "personnage", p.id);
      if (!l.ok) {
        console.log(`${p.nom} : ${l.message}`);
        continue;
      }
      const d = await attendre(e, l);
      noter({ etape: "portrait", message: `${p.nom} : ${d?.etat}${d?.message ? ` (${d.message})` : ""}` });
      console.log(`${p.nom} : portrait ${d?.etat}`);
    }
  }
}

/** Inscrit une proposition parmi les images du projet, comme la page le fait en la gardant. */
async function inscrire(e: Enseignant, projetId: string, proposition: string): Promise<string> {
  const stockage = clientService().storage.from(SEAU);
  const { data, error } = await stockage.download(cheminProposition(e.id, projetId, proposition));
  if (error || !data) throw new Error("Proposition introuvable.");
  const octets = new Uint8Array(await data.arrayBuffer());
  const lu = lireImage(octets);
  if (!lu) throw new Error("Proposition illisible.");
  const id = randomUUID();
  for (const ch of [cheminImage(e.id, projetId, id), cheminVignette(e.id, projetId, id)]) {
    const r = await stockage.upload(ch, octets, { contentType: lu.format === "png" ? "image/png" : "image/jpeg", upsert: false });
    if (r.error) throw new Error(`Image non déposée : ${r.error.message}`);
  }
  const { error: e2 } = await e.supabase.from("images").insert({
    id, projet_id: projetId, enseignant_id: e.id, chemin: cheminImage(e.id, projetId, id), chemin_vignette: cheminVignette(e.id, projetId, id),
    largeur: lu.largeur, hauteur: lu.hauteur, format: lu.format,
  });
  if (e2) throw new Error(`Image non inscrite : ${e2.message}`);
  await stockage.remove([cheminProposition(e.id, projetId, proposition)]);
  return id;
}

async function images(e: Enseignant, projetId: string, scenes: Map<number, Scene>) {
  const { data: persos } = await e.supabase.from("personnages").select("id, nom").eq("projet_id", projetId);
  const idDe = (nom: string) => (persos ?? []).find((p) => p.nom === nom)?.id as string | undefined;
  for (const im of c.IMAGES.filter((i) => voulue(i.ref))) {
    const s = scenes.get(im.ref)!;
    const avant = await texteDeScene(e, s.id);
    if (avant?.texte.some((b) => b.type === "image")) {
      if (!refaire || !refsDemandees) {
        console.log(`S${im.ref} : déjà illustrée`);
        continue;
      }
      // L'image reste parmi celles du projet ; seul son bloc quitte le texte
      const r = await remplacerSiInchange(e, s.id, avant.version, avant.texte.filter((b) => b.type !== "image"));
      if (!r.ok) {
        console.log(`S${im.ref} : ${r.message}`);
        continue;
      }
    }
    const cadrage: Cadrage = im.cadrage === "page" ? "pleine-page" : "3:2";
    const badges = im.badges.flatMap((n) => idDe(n) ?? []);
    await e.supabase.from("scenes").update({ idee_image: im.idee }).eq("id", s.id);
    const d = await proposerLaDescription(e, s.id, { cadrage, badges });
    if (!d.ok) {
      console.log(`S${im.ref} : ${d.message}`);
      continue;
    }
    await e.supabase.from("scenes").update({ description_image: d.description }).eq("id", s.id);
    noter({ etape: "description", ref: im.ref, avant: im.idee, apres: d.description });
    const l = await demanderLImageDeScene(e, s.id, { cadrage, badges, alt: "" });
    if (!l.ok) {
      console.log(`S${im.ref} : ${l.message}`);
      continue;
    }
    const fini = await attendre(e, l);
    if (!fini || fini.etat !== "prete" || !fini.propositions.length) {
      noter({ etape: "image", ref: im.ref, message: fini?.message ?? "échec" });
      console.log(`S${im.ref} : ${fini?.message ?? "échec"}`);
      continue;
    }
    const imageId = await inscrire(e, projetId, fini.propositions[0]);
    await fermerLaDemande(e, l.demande).catch(() => undefined);
    // Pleine page en tête du passage (F10-AC36) ; les autres après le premier paragraphe, en pleine largeur
    const t = (await texteDeScene(e, s.id))!;
    const figure = { type: "image", id: randomUUID(), image: imageId, largeur: LARGEURS.pleine, ...(cadrage === "pleine-page" ? { page: true } : {}), children: [{ text: "" }] };
    const apres = cadrage === "pleine-page" ? 0 : Math.max(1, t.texte.findIndex((b) => b.type === "p") + 1);
    const texte = [...t.texte.slice(0, apres), figure, ...t.texte.slice(apres)];
    const r = await remplacerSiInchange(e, s.id, t.version, texte);
    noter({ etape: "image", ref: im.ref, message: r.ok ? "posée" : r.message });
    console.log(`S${im.ref} : image ${r.ok ? "posée" : r.message}`);
  }
}

async function titre(e: Enseignant, projetId: string) {
  const l = await demanderLeReperage(e, "projet", projetId);
  if (!l.ok) return console.log(l.message);
  const d = await attendre(e, l);
  noter({ etape: "titre", message: `${d?.etat}${d?.message ? ` (${d.message})` : ""}` });
  console.log(`Image du projet : ${d?.etat}`);
}

async function depense(e: Enseignant) {
  const { data } = await clientService().from("appels_ia").select("aide, sorte, cout_usd, commence_le, issue").eq("enseignant_id", e.id).gte("commence_le", journal[0]?.quand ?? new Date().toISOString());
  const lignes = data ?? [];
  const total = lignes.reduce((n, l) => n + Number(l.cout_usd ?? 0), 0);
  const parAide = new Map<string, { n: number; cout: number }>();
  for (const l of lignes) {
    const a = parAide.get(l.aide) ?? { n: 0, cout: 0 };
    parAide.set(l.aide, { n: a.n + 1, cout: a.cout + Number(l.cout_usd ?? 0) });
  }
  for (const [aide, { n, cout }] of parAide) console.log(`${aide.padEnd(20)} ${String(n).padStart(3)} appels  ${cout.toFixed(3)} $`);
  console.log(`Total depuis le premier appel de l'atelier : ${total.toFixed(3)} $ (${lignes.length} appels).`);
}

async function principal() {
  const e = await connecter();
  if (etape === "depense") return depense(e);
  const { projetId, scenes } = await lePlan(e);
  if (journal.length === 0) noter({ etape: "debut" });
  if (etape === "corriger") return corriger(e, scenes);
  if (etape === "ecrire") return ecrire(e, scenes);
  if (etape === "textes") return textes(e, scenes);
  if (etape === "appliquer") return appliquer(e, scenes);
  if (etape === "portraits") return portraits(e, projetId);
  if (etape === "images") return images(e, projetId, scenes);
  if (etape === "titre") return titre(e, projetId);
  throw new Error("Étapes : corriger, ecrire, textes, appliquer, portraits, images, titre, depense.");
}

principal().catch((erreur: Error) => {
  console.error(erreur.message);
  process.exit(1);
});
