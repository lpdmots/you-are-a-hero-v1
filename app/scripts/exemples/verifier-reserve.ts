/**
 * Vérifie le plan d'un livre d'exemple à réserve (« Les passeurs de brume ») en jouant tous les
 * chemins depuis le départ, sans base ni IA :
 *   npx tsx scripts/exemples/verifier-reserve.ts passeurs
 *
 * Une action « Raye … » retire une réserve, « Ajoute … » en ajoute une. Une perte qui peut trouver
 * la réserve vide doit porter sa vérification (un choix vers une fin, pris si la réserve était
 * vide) ; une perte qui ne le peut jamais n'en porte pas (« les premières pertes ne demandent
 * rien »). Dit aussi : chaque scène atteinte, chaque fin atteinte, et combien d'erreurs mènent à
 * la fin sur chaque route.
 */
import { livre as passeurs } from "./passeurs-de-brume";
import type { Conception, SceneExemple } from "./conception";

const LIVRES: Record<string, Conception> = { passeurs };
const c = LIVRES[process.argv[2] ?? ""];
if (!c) throw new Error(`Nommez le livre : ${Object.keys(LIVRES).join(", ")}.`);

const scenes = new Map<number, SceneExemple>(c.PARTIES.flatMap((p) => p.chapitres.flatMap((ch) => ch.scenes)).map((s) => [s.ref, s]));
const depart = c.FEUILLE.sections.flatMap((s) => (s.type === "compteurs" ? s.compteurs : []))[0]?.depart ?? 0;
const delta = (ref: number) => (c.ACTIONS[ref] ?? []).reduce((n, a) => n + (/^Raye/.test(a) ? -1 : /^Ajoute/.test(a) ? 1 : 0), 0);
const estFin = (ref: number) => scenes.get(ref)?.fin === true;
const versFin = (s: SceneExemple) => (s.choix ?? []).find(([, v]) => estFin(v))?.[1];

const problemes: string[] = [];
const atteintes = new Set<number>();
const minAvant = new Map<number, number>();
type Route = { chemin: string[]; pertes: number; fin: number };
const routes: Route[] = [];

function jouer(ref: number, reserve: number, chemin: string[], pertes: number, vus: Set<number>) {
  const s = scenes.get(ref);
  if (!s) return void problemes.push(`Un choix mène à S${ref}, absent du plan.`);
  if (vus.has(ref)) return void problemes.push(`Boucle : ${[...chemin, `S${ref}`].join(" → ")}`);
  atteintes.add(ref);
  minAvant.set(ref, Math.min(minAvant.get(ref) ?? Infinity, reserve));
  const d = delta(ref);
  const ici = [...chemin, `S${ref}(${reserve})`];
  const suite = new Set(vus).add(ref);
  if (s.fin) return void routes.push({ chemin: ici, pertes, fin: ref });
  if (d < 0 && reserve === 0) {
    const fin = versFin(s);
    if (!fin) return void problemes.push(`S${ref} retire une réserve vide sans vérification : ${ici.join(" → ")}`);
    return jouer(fin, 0, ici, pertes + 1, suite);
  }
  const apres = reserve + d;
  for (const [i, [, vers]] of (s.choix ?? []).entries()) {
    if (s.condition?.choix === i && !vus.has(s.condition.apres)) continue; // réservé au lecteur passé par là
    if (d < 0 && estFin(vers)) continue; // la vérification n'est prise que si la réserve était vide
    jouer(vers, apres, ici, pertes + (d < 0 ? 1 : 0), suite);
  }
}
jouer(c.DEPART, depart, [], 0, new Set());

for (const [ref, s] of scenes) {
  if (!atteintes.has(ref)) problemes.push(`S${ref} « ${s.titre} » n'est jamais atteinte.`);
  const verifie = versFin(s) !== undefined && delta(ref) < 0;
  if (delta(ref) < 0 && (minAvant.get(ref) ?? 1) > 0 && verifie) problemes.push(`S${ref} vérifie la réserve alors qu'elle n'y est jamais vide (au moins ${minAvant.get(ref)}).`);
  if (!s.fin && !(s.choix ?? []).length) problemes.push(`S${ref} n'a ni choix ni fin.`);
  if (versFin(s) !== undefined && (s.choix ?? []).length > 1 && delta(ref) >= 0) problemes.push(`S${ref} mène à une fin sans perte de réserve.`);
}

console.log(`${scenes.size} scènes, réserve de départ ${depart}, ${routes.length} chemins.`);
console.log("\nRéserve au plus bas en arrivant sur chaque perte :");
for (const [ref] of scenes) if (delta(ref) !== 0) console.log(`  S${ref} ${delta(ref) > 0 ? "+1" : "−1"}  au plus bas ${minAvant.get(ref)}${versFin(scenes.get(ref)!) ? "  (vérifiée)" : ""}`);
const parFin = new Map<number, Route[]>();
for (const r of routes) parFin.set(r.fin, [...(parFin.get(r.fin) ?? []), r]);
console.log("\nFins :");
for (const [fin, rs] of parFin) {
  const pertes = rs.map((r) => r.pertes);
  console.log(`  S${fin} « ${scenes.get(fin)!.titre} » : ${rs.length} chemins, de ${Math.min(...pertes)} à ${Math.max(...pertes)} pertes`);
}
// Le moins d'erreurs qui vide la réserve, selon le don au vieil homme et le chemin du pont
const bonne = [...scenes.values()].find((s) => s.numero)?.ref;
const echecs = routes.filter((r) => r.fin !== bonne);
const route = (r: Route) => (r.chemin.some((x) => x.startsWith("S6(")) ? (r.chemin.some((x) => x.startsWith("S9(")) ? "don, puis la barque à l’est" : "don, puis le pont") : "refus");
const auMoins = new Map<string, number>();
const auPlus = new Map<string, number>();
for (const r of echecs) auMoins.set(route(r), Math.min(auMoins.get(route(r)) ?? Infinity, r.pertes - (route(r) === "refus" ? 0 : 1)));
for (const r of routes.filter((x) => x.fin === bonne)) auPlus.set(route(r), Math.max(auPlus.get(route(r)) ?? 0, r.pertes - (route(r) === "refus" ? 0 : 1)));
console.log("\nErreurs (le don au vieil homme n'en est pas une) :");
for (const k of new Set([...auMoins.keys(), ...auPlus.keys()])) console.log(`  ${k} : la bonne fin passe avec ${auPlus.get(k)} erreurs au plus ; la réserve lâche à ${auMoins.get(k)} erreurs`);

if (problemes.length) {
  console.log(`\n${problemes.length} problème(s) :`);
  for (const p of problemes) console.log(`  ${p}`);
  process.exit(1);
}
console.log("\nAucun problème.");
