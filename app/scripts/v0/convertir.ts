/**
 * Conversion d'une histoire de la V0 (documents Sanity) en livre de la V1 : plan, textes des
 * scènes en blocs, numéros du livre imprimé, objets. Rien ici ne parle à une base : les
 * identités des scènes et des images de la V1 sont données par qui appelle.
 *
 * La V0 savait vérifier des règles de jeu (conditions, effets, jets) ; la V1 les écrit en
 * texte, sans les vérifier (F04.2). Les textes que l'auteur avait écrits à la main passent
 * tels quels ; ceux que la V0 composait d'office sont réécrits en phrases de la V1.
 */
import { randomUUID } from "node:crypto";
import type { Lettres } from "@/domaine/copie";
import type { SigneAction } from "@/domaine/preparation";

// ——— Les documents de la V0, tels que Sanity les rend ———

type Ref = { _ref: string };
type Span = { _type: "span"; text?: string; marks?: string[] };
export type BlocV0 =
  | { _type: "block"; _key: string; style?: string; listItem?: "bullet" | "number"; children?: Span[] }
  | { _type: "imageRef"; _key: string; imageKey: string; widthPct?: number; caption?: string }
  | { _type: "outcomeCard"; _key: string; choiceKey: string; mode?: "auto" | "custom"; customText?: string }
  | { _type: "effectCard"; _key: string; stableId: string; mode?: "auto" | "custom"; customText?: string }
  | { _type: string; _key: string };
type RegleV0 = { kind: "hasItem" | "flagIs" | "statGte" | "skillGte"; key: string; operator?: string; value?: string; qty?: number };
type ConditionV0 = { mode?: "all" | "any"; rules?: RegleV0[] };
export type IssueV0 =
  | { _type: "outcomeDirect"; toScene?: Ref }
  | { _type: "outcomeBranch"; branches?: { when?: ConditionV0; toScene?: Ref }[]; defaultToScene?: Ref }
  | { _type: "outcomeDiceCheck"; dc?: number; bonusComponents?: { kind: string; key?: string; value?: number }[]; successToScene?: Ref; failToScene?: Ref }
  | { _type: "outcomeRollTable"; entries?: { range?: { min?: number; max?: number }; toScene?: Ref }[]; defaultToScene?: Ref };
export type ChoixV0 = { _key: string; label?: string; condition?: ConditionV0; outcome?: IssueV0[] };
type EffetV0 = { _key: string; kind: string; payload?: { itemKey?: string; flagKey?: string; statKey?: string; skillKey?: string; qty?: number; value?: string }; condition?: ConditionV0 };
export type SceneV0 = {
  _id: string; title: string; chapter?: Ref; lifecycle?: string; writingPrompt?: string;
  body?: BlocV0[]; bodyFinal?: BlocV0[]; images?: { _key: string; image?: { asset?: Ref } }[];
  choices?: ChoixV0[]; effects?: EffetV0[];
};
export type ChapitreV0 = { _id: string; title: string; image?: { asset?: Ref }; sections?: { items?: { scene?: Ref }[] }[] };
type DefinitionV0 = { key: string; label: string; description?: string };
export type HistoireV0 = {
  _id: string; title: string; image?: { asset?: Ref }; coverImages?: { asset?: Ref }[];
  startScene?: Ref; prefaceScenes?: Ref[]; chapters?: Ref[];
  definitions?: { items?: DefinitionV0[]; stats?: DefinitionV0[]; skills?: DefinitionV0[]; flags?: DefinitionV0[] };
};
export type PlanV0 = {
  distribution?: { chapterGroups?: { chapters?: Ref[] }[] };
  paragraphs?: { n: number; scene?: Ref }[];
  paragraphNumberOverrides?: { fixedN: number; scene?: Ref }[];
};
export type DonneesV0 = { histoire: HistoireV0; chapitres: ChapitreV0[]; scenes: SceneV0[]; plan: PlanV0 | null };

// ——— Le livre de la V1 qui en sort ———

/** Un bloc de la copie de la V1, avant le contrôle de `nettoyerTexte`. */
export type BlocV1 = Record<string, unknown> & { type: string; id: string };
export type SceneV1 = {
  v0: string; titre: string; consigne: string; texte: BlocV1[]; fin: boolean; horsLivre: boolean;
  /** Le numéro du livre imprimé par la V0, et celui qu'elle avait fixé */
  numeroV0: number | null; numeroFixe: number | null;
};
export type LivreV1 = {
  titre: string;
  departV0: string | null;
  /** Une partie par groupe de chapitres du livre de la V0 ; l'ouverture est la première scène de son groupe */
  parties: { titre: string; ouvertureV0: string | null; chapitres: { titre: string; image: string | null; scenes: SceneV1[] }[] }[];
  objets: { nom: string; description: string }[];
  avertissements: string[];
};

const LIBELLE_PAR_DEFAUT = "continuer";

/** Le texte d'une scène pour le livre : la version finale, sinon le premier texte (comme la V0). */
export const corpsDuLivre = (s: SceneV0): BlocV0[] => (s.bodyFinal?.length ? s.bodyFinal : (s.body ?? []));

/** Les images d'une histoire : chaque fichier de Sanity, et s'il sert dans une scène. */
export function imagesDe(d: DonneesV0, scenes: SceneV0[]): Map<string, { dansUneScene: boolean }> {
  const images = new Map<string, { dansUneScene: boolean }>();
  const ajouter = (ref: string | undefined, dansUneScene: boolean) => {
    if (!ref) return;
    images.set(ref, { dansUneScene: dansUneScene || images.get(ref)?.dansUneScene === true });
  };
  for (const c of d.chapitres) ajouter(c.image?.asset?._ref, false);
  for (const s of scenes) {
    const parCle = new Map((s.images ?? []).map((i) => [i._key, i.image?.asset?._ref]));
    for (const b of corpsDuLivre(s)) if (b._type === "imageRef") ajouter(parCle.get((b as { imageKey: string }).imageKey), true);
  }
  return images;
}

// ——— Phrases : conditions, effets, issues ———

type Lexique = { objet: (k: string) => string; stat: (k: string) => string; competence: (k: string) => string; marqueur: (k: string) => string };

function lexiqueDe(h: HistoireV0): Lexique {
  const nom = (liste: DefinitionV0[] | undefined) => {
    const parCle = new Map((liste ?? []).map((x) => [x.key, x.label]));
    return (k: string) => parCle.get(k) ?? k;
  };
  return { objet: nom(h.definitions?.items), stat: nom(h.definitions?.stats), competence: nom(h.definitions?.skills), marqueur: nom(h.definitions?.flags) };
}

const minuscule = (t: string): string => t.charAt(0).toLocaleLowerCase("fr") + t.slice(1);
const majuscule = (t: string): string => t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);
/** « La pioche » devient « la pioche » ; « Pierre » reste un nom d'objet. */
const nomCommun = (t: string): string => (/^(le|la|les|l['’]|un|une|des)\b/i.test(t) ? minuscule(t) : t);
const COMPARAISON: Record<string, string> = { ">": "est supérieure à", "<": "est inférieure à", "=": "est égale à" };

function clause(r: RegleV0, l: Lexique): string {
  if (r.kind === "hasItem") return `tu as ${nomCommun(l.objet(r.key))}`;
  if (r.kind === "skillGte") return `ton héros est ${minuscule(l.competence(r.key))}`;
  if (r.kind === "flagIs") return `tu as noté « ${l.marqueur(r.key)} »`;
  const stat = minuscule(l.stat(r.key));
  if (r.value === "0" && r.operator === "=") return `tu n'as plus de points de ${stat}`;
  return `ta ${stat} ${COMPARAISON[r.operator ?? ">"] ?? "est d'au moins"} ${r.value ?? ""}`.trim();
}

/** « tu as la pioche et ton héros est agile » ; rien sans règle. */
export function condition(c: ConditionV0 | undefined, l: Lexique): string | null {
  const regles = c?.rules ?? [];
  if (!regles.length) return null;
  return regles.map((r) => clause(r, l)).join(c?.mode === "any" ? " ou " : " et ");
}

/** La phrase d'un effet que la V0 composait d'office, et son signe. */
export function phraseDEffet(e: EffetV0, l: Lexique): string {
  const p = e.payload ?? {};
  const qte = Number(p.qty ?? p.value ?? 1) || 1;
  const points = (stat: string) => `${qte} point${qte > 1 ? "s" : ""} de ${minuscule(l.stat(stat))}`;
  const phrases: Record<string, () => string> = {
    gainItem: () => `ajoute ${nomCommun(l.objet(p.itemKey ?? ""))} à ton inventaire.`,
    loseItem: () => `retire ${nomCommun(l.objet(p.itemKey ?? ""))} de ton inventaire.`,
    setItem: () => `note ${nomCommun(l.objet(p.itemKey ?? ""))} dans ton inventaire.`,
    incStat: () => `ajoute ${points(p.statKey ?? "")}.`,
    decStat: () => `retire ${points(p.statKey ?? "")}.`,
    setStat: () => `ta ${minuscule(l.stat(p.statKey ?? ""))} passe à ${p.value ?? ""}.`,
    setFlag: () => `note « ${l.marqueur(p.flagKey ?? "")} » sur ta feuille.`,
    setSkill: () => `ton héros devient ${minuscule(l.competence(p.skillKey ?? ""))}.`,
    note: () => `${p.value ?? ""}`,
  };
  const phrase = (phrases[e.kind] ?? (() => ""))();
  const si = condition(e.condition, l);
  return si ? `Si ${si}, ${phrase}` : majuscule(phrase);
}

export const signeDEffet = (kind: string | undefined): SigneAction =>
  kind?.endsWith("Stat") ? "coeur" : kind?.endsWith("Item") ? "sac" : "crayon";

/** Les destinations d'une issue, dans l'ordre où la V0 les numérotait ([§1], [§2]…). */
export function destinations(issue: IssueV0 | undefined): (string | null)[] {
  if (!issue) return [];
  const ref = (r: Ref | undefined) => r?._ref ?? null;
  if (issue._type === "outcomeDirect") return [ref(issue.toScene)];
  if (issue._type === "outcomeDiceCheck") return [ref(issue.successToScene), ref(issue.failToScene)];
  if (issue._type === "outcomeBranch") return [...(issue.branches ?? []).map((b) => ref(b.toScene)), ...(issue.defaultToScene ? [ref(issue.defaultToScene)] : [])];
  return [...(issue.entries ?? []).map((e) => ref(e.toScene)), ...(issue.defaultToScene ? [ref(issue.defaultToScene)] : [])];
}

/** La phrase d'un choix que la V0 composait d'office, avec ses renvois en [§n]. */
export function phraseDeChoixV0(c: ChoixV0, l: Lexique): string {
  const issue = c.outcome?.[0];
  if (issue?._type === "outcomeBranch") {
    const branches = (issue.branches ?? []).map((b, i) => `si ${condition(b.when, l) ?? "tu le choisis"}, va au [§${i + 1}]`);
    if (issue.defaultToScene) branches.push(`va au [§${branches.length + 1}]`);
    return majuscule(branches.join(". Sinon, ")) + ".";
  }
  if (issue?._type === "outcomeDiceCheck") {
    const bonus = (issue.bonusComponents ?? []).map((b) => (b.kind === "skill" ? ` (+${b.value ?? 1} si ton héros est ${minuscule(l.competence(b.key ?? ""))})` : "")).join("");
    return `Lance le dé${bonus} : si tu fais ${issue.dc ?? 4} ou plus, va au [§1]. Sinon, va au [§2].`;
  }
  if (issue?._type === "outcomeRollTable") {
    const entrees = (issue.entries ?? []).map((e, i) => {
      const { min, max } = e.range ?? {};
      return `${min === max ? `sur ${min}` : `de ${min} à ${max}`}, va au [§${i + 1}]`;
    });
    return `Lance le dé : ${entrees.join(" ; ")}${issue.defaultToScene ? ` ; sinon, va au [§${entrees.length + 1}]` : ""}.`;
  }
  const si = condition(c.condition, l);
  const libelle = c.label?.trim() ?? "";
  if (si) return `Si ${si}, tu peux ${minuscule(libelle || "continuer")} : rends-toi au [§].`;
  return "Rends-toi au [§].";
}

// ——— Les blocs ———

/** « **gras** » écrit dans une carte de la V0 : la V1 met les phrases de choix et les actions en valeur elle-même. */
const sansEtoiles = (t: string): string => t.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

const MARQUES: Record<string, keyof Omit<Lettres, "text">> = { strong: "bold", em: "italic", underline: "underline" };

/** Un bloc de texte de la V0 : un paragraphe par ligne, la mise en forme gardée. */
export function paragraphes(b: { _key: string; style?: string; listItem?: string; children?: Span[] }, puce: string): Lettres[][] {
  const lignes: Lettres[][] = [[]];
  const titre = !!b.style && b.style !== "normal";
  for (const span of b.children ?? []) {
    const marques: Omit<Lettres, "text"> = titre ? { bold: true } : {};
    for (const m of span.marks ?? []) if (MARQUES[m]) marques[MARQUES[m]] = true;
    (span.text ?? "").split("\n").forEach((morceau, i) => {
      if (i > 0) lignes.push([]);
      if (morceau) lignes[lignes.length - 1].push({ text: morceau, ...marques });
    });
  }
  const pleines = lignes.filter((l) => l.some((x) => x.text.trim()));
  if (puce && pleines[0]) pleines[0].unshift({ text: puce });
  return pleines;
}

const FIN = /^\s*fin(\s+de\s+l['’]\s*histoire)?\s*[.!]*\s*$/i;

/** Le texte d'une scène de la V0 en blocs de la V1. */
export function texteDeLaScene(
  s: SceneV0,
  l: Lexique,
  o: { scene: (v0: string) => string | null; image: (ref: string) => string | null; avertir: (m: string) => void; construction: () => "si" | "pour" },
): { texte: BlocV1[]; fin: boolean } {
  const corps = corpsDuLivre(s);
  const choix = new Map((s.choices ?? []).map((c) => [c._key, c]));
  const effets = new Map((s.effects ?? []).map((e) => [e._key, e]));
  const images = new Map((s.images ?? []).map((i) => [i._key, i.image?.asset?._ref]));
  const texte: BlocV1[] = [];
  const places = { choix: new Set<string>(), effets: new Set<string>() };
  let numero = 0;

  const renvoi = (v0: string | null): BlocV1 => {
    const cible = v0 ? o.scene(v0) : null;
    if (!cible) o.avertir(`« ${s.title} » : un renvoi ${v0 ? "mène à une scène qui n'est pas importée" : "n'a pas de destination"}.`);
    return { type: "renvoi", id: randomUUID(), cible, children: [{ text: "" }] };
  };

  /** Une phrase écrite avec ses [§n] : le texte entre les renvois, sans mise en forme. */
  const phrasePerso = (c: ChoixV0, gabarit: string): BlocV1 | null => {
    const dest = destinations(c.outcome?.[0]);
    if (!dest.length || dest.every((d) => !d)) {
      o.avertir(`« ${s.title} » : le choix « ${c.label ?? ""} » n'a aucune destination, il n'est pas repris.`);
      return null;
    }
    const enfants: Record<string, unknown>[] = [];
    const morceaux = sansEtoiles(gabarit).split(/(\[§[^\]]*\])/);
    if (!morceaux.some((m) => m.startsWith("[§"))) morceaux.push(" ", "[§1]");
    for (const m of morceaux) {
      const jeton = /^\[§([^\]]*)\]$/.exec(m);
      if (!jeton) {
        if (m) enfants.push({ text: m });
        continue;
      }
      const rangs = jeton[1].includes("..") ? dest.map((_, i) => i) : [Math.max(1, Number(jeton[1] || "1")) - 1];
      rangs.forEach((r, i) => {
        if (i > 0) enfants.push({ text: ", " });
        enfants.push(renvoi(dest[r] ?? null));
      });
    }
    return { type: "choix", id: randomUUID(), libelle: (c.label ?? "").trim(), children: enfants };
  };

  const blocDeChoix = (c: ChoixV0, carte: { _key: string; mode?: string; customText?: string } | null): BlocV1 | null => {
    if (carte?.mode === "custom" && carte.customText?.trim()) return phrasePerso(c, carte.customText);
    const issue = c.outcome?.[0];
    const libelle = c.label?.trim() ?? "";
    // Un choix direct au libellé parlant devient une phrase automatique de la V1
    if (issue?._type === "outcomeDirect" && libelle && libelle.toLowerCase() !== LIBELLE_PAR_DEFAUT && !condition(c.condition, l)) {
      const v0 = issue.toScene?._ref ?? null;
      const cible = v0 ? o.scene(v0) : null;
      if (!cible) {
        o.avertir(`« ${s.title} » : le choix « ${libelle} » n'a pas de destination importée, il n'est pas repris.`);
        return null;
      }
      return { type: "choix", id: randomUUID(), auto: true, libelle, construction: o.construction(), cible, children: [{ text: "" }] };
    }
    return phrasePerso(c, phraseDeChoixV0(c, l));
  };

  const action = (e: EffetV0 | undefined, phrase: string): BlocV1 => {
    const signe = signeDEffet(e?.kind);
    return { type: "action", id: randomUUID(), ...(signe !== "crayon" ? { signe } : {}), children: [{ text: phrase }] };
  };

  for (const b of corps) {
    if (b._type === "block") {
      const bloc = b as Extract<BlocV0, { _type: "block" }>;
      numero = bloc.listItem === "number" ? numero + 1 : 0;
      const puce = bloc.listItem === "bullet" ? "• " : bloc.listItem === "number" ? `${numero}. ` : "";
      paragraphes(bloc, puce).forEach((p) => texte.push({ type: "p", id: randomUUID(), children: p }));
    } else if (b._type === "imageRef") {
      const r = b as Extract<BlocV0, { _type: "imageRef" }>;
      const ref = images.get(r.imageKey);
      const id = ref ? o.image(ref) : null;
      if (!id) {
        o.avertir(`« ${s.title} » : une image introuvable n'est pas reprise.`);
        continue;
      }
      const legende = r.caption?.trim();
      texte.push({ type: "image", id: randomUUID(), image: id, largeur: r.widthPct ?? 100, ...(legende ? { legende } : {}), children: [{ text: "" }] });
    } else if (b._type === "outcomeCard") {
      const carte = b as Extract<BlocV0, { _type: "outcomeCard" }>;
      const c = choix.get(carte.choiceKey);
      if (!c) continue;
      places.choix.add(c._key);
      const bloc = blocDeChoix(c, carte);
      if (bloc) texte.push(bloc);
    } else if (b._type === "effectCard") {
      const carte = b as Extract<BlocV0, { _type: "effectCard" }>;
      const e = effets.get(carte.stableId.replace(/^effect:/, ""));
      if (e) places.effets.add(e._key);
      const phrase = carte.mode === "custom" && carte.customText?.trim() ? sansEtoiles(carte.customText) : e ? phraseDEffet(e, l) : "";
      if (phrase) texte.push(action(e, phrase));
    }
  }
  // Comme le livre de la V0 : les effets puis les choix qui n'avaient pas de place dans le texte, à la fin
  for (const e of s.effects ?? []) if (!places.effets.has(e._key)) texte.push(action(e, phraseDEffet(e, l)));
  for (const c of s.choices ?? []) {
    if (places.choix.has(c._key)) continue;
    const bloc = blocDeChoix(c, null);
    if (bloc) texte.push(bloc);
  }

  // Une scène sans suite est une fin : « FIN DE L'HISTOIRE », écrit à la main, devient la marque de fin de la V1
  const fin = !texte.some((b) => b.type === "choix");
  if (fin) {
    while (texte.length && texte[texte.length - 1].type === "p" && FIN.test((texte[texte.length - 1].children as Lettres[]).map((x) => x.text).join(""))) texte.pop();
  }
  return { texte, fin };
}

// ——— Le livre entier ———

export function convertir(
  d: DonneesV0,
  o: { scene: (v0: string) => string | null; image: (ref: string) => string | null; titresDesParties: string[] },
): LivreV1 {
  const avertissements: string[] = [];
  const l = lexiqueDe(d.histoire);
  const parId = new Map(d.scenes.map((s) => [s._id, s]));
  const numeroV0 = new Map((d.plan?.paragraphs ?? []).flatMap((p) => (p.scene ? [[p.scene._ref, p.n] as const] : [])));
  const fixe = new Map((d.plan?.paragraphNumberOverrides ?? []).flatMap((x) => (x.scene ? [[x.scene._ref, x.fixedN] as const] : [])));
  let tour = 0;
  const construction = () => ((tour += 1) % 2 ? "si" : "pour") as "si" | "pour";

  const chapitres = (d.histoire.chapters ?? []).map((r) => d.chapitres.find((c) => c._id === r._ref)).filter((c): c is ChapitreV0 => !!c);
  // Les groupes du livre de la V0 ; un chapitre qu'aucun groupe ne cite rejoint le dernier
  const groupes = (d.plan?.distribution?.chapterGroups ?? []).map((g) => (g.chapters ?? []).map((c) => c._ref));
  if (!groupes.length) groupes.push([]);
  const groupeDe = (id: string) => {
    const i = groupes.findIndex((g) => g.includes(id));
    return i >= 0 ? i : groupes.length - 1;
  };

  const parties: LivreV1["parties"] = groupes.map((_, i) => ({ titre: o.titresDesParties[i] ?? `Partie ${i + 1}`, ouvertureV0: null, chapitres: [] }));
  for (const c of chapitres) {
    // L'ordre des scènes : celui des sections du chapitre, puis celles qu'aucune section ne cite
    const ordre = (c.sections ?? []).flatMap((x) => (x.items ?? []).map((i) => i.scene?._ref ?? ""));
    const scenes = d.scenes
      .filter((s) => s.chapter?._ref === c._id && s.lifecycle !== "trash")
      .sort((a, b) => {
        const [ia, ib] = [ordre.indexOf(a._id), ordre.indexOf(b._id)];
        return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
      });
    parties[groupeDe(c._id)].chapitres.push({
      titre: c.title.trim().slice(0, 120),
      image: c.image?.asset?._ref ?? null,
      scenes: scenes.map((s) => {
        const { texte, fin } = texteDeLaScene(s, l, { scene: o.scene, image: o.image, avertir: (m) => avertissements.push(m), construction });
        const n = numeroV0.get(s._id) ?? null;
        // Une scène que le livre de la V0 n'imprimait pas reste hors du livre
        if (n === null) avertissements.push(`« ${s.title} » n'était pas dans le livre de la V0 : elle est importée hors du livre.`);
        return {
          v0: s._id, titre: s.title.trim().slice(0, 120) || "Sans titre", consigne: (s.writingPrompt ?? "").slice(0, 4000),
          texte, fin, horsLivre: n === null, numeroV0: n, numeroFixe: fixe.get(s._id) ?? null,
        };
      }),
    });
  }
  // L'ouverture d'une partie : la scène de plus petit numéro de son groupe
  for (const p of parties) {
    const scenes = p.chapitres.flatMap((c) => c.scenes).filter((s) => s.numeroV0 !== null);
    p.ouvertureV0 = scenes.sort((a, b) => a.numeroV0! - b.numeroV0!)[0]?.v0 ?? null;
  }

  const objets = (d.histoire.definitions?.items ?? []).map((x) => ({ nom: x.label.trim().slice(0, 60), description: (x.description ?? "").trim().slice(0, 120) }));
  const depart = d.histoire.startScene?._ref ?? null;
  if (depart && !parId.has(depart)) avertissements.push("La scène de départ de la V0 est introuvable.");
  return {
    titre: d.histoire.title.trim(),
    departV0: depart,
    parties: parties.filter((p) => p.chapitres.length),
    objets,
    avertissements,
  };
}

/** Les pages de présentation tirées d'une préface de la V0 : ses paragraphes, en texte léger. */
export function texteLeger(s: SceneV0): { titre: string; paragraphes: Lettres[][] }[] {
  // Découpée à chaque titre (h1, h2, h3) : de quoi répartir la préface entre « Comment lire » et les règles
  const parties: { titre: string; paragraphes: Lettres[][] }[] = [{ titre: "", paragraphes: [] }];
  let numero = 0;
  for (const b of corpsDuLivre(s)) {
    if (b._type !== "block") continue;
    const bloc = b as Extract<BlocV0, { _type: "block" }>;
    numero = bloc.listItem === "number" ? numero + 1 : 0;
    const puce = bloc.listItem === "bullet" ? "• " : bloc.listItem === "number" ? `${numero}. ` : "";
    const lignes = paragraphes(bloc, puce);
    if (bloc.style && bloc.style !== "normal") parties.push({ titre: lignes.map((x) => x.map((y) => y.text).join("")).join(" "), paragraphes: [] });
    parties[parties.length - 1].paragraphes.push(...lignes);
  }
  return parties.filter((p) => p.paragraphes.length);
}
