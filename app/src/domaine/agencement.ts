/**
 * L'ordre des passages et les blancs (F11.3, F11.5) : « Réordonner les passages », le passage
 * suggéré pour combler une page peu remplie, et le doute sur l'ordre (F11.6). Tout se calcule
 * sur les hauteurs mesurées par la dernière composition du livre, non par compositions
 * répétées : c'est un modèle approché de la mise en page, qui laisse des blancs que les
 * retouches réduisent ensuite (« Limites annoncées »).
 */

import { groupesDeMelange, ouvertureDe, type PlanNumerote } from "./numeros";

/** Ce que la composition a mesuré d'un passage, en millimètres */
export type Mesure = {
  /** Toute sa hauteur, l'espace au-dessus de son numéro compris */
  h: number;
  /** Sans blocs mesurés (mesure ancienne) : ce qui ne se coupe pas à sa fin, son groupe de choix avec deux lignes */
  queue: number;
  /** Il porte une image pleine page */
  pleinePage: boolean;
  /**
   * Ses blocs dans l'ordre, s'ils sont mesurés : « t » se coupe entre deux lignes (paragraphe,
   * groupe de choix), « i » ne se coupe pas (image, action, fin), « n » (numéro) reste avec ce qui
   * le suit. Sans eux, le passage s'écoule d'un seul tenant jusqu'à sa queue.
   */
  blocs?: [string, number][];
};

/** Un passage dans l'ordre imprimé, tel que l'agencement le voit */
export type PassageOrdonne = {
  sceneId: string;
  numero: number;
  /** Son groupe de mélange, par rang */
  groupe: number;
  /** Il garde sa place : départ, numéro fixé, ouverture en tête de groupe, nouvelle page */
  tenu: boolean;
  /** Il commence en haut d'une page : nouvelle page demandée, ou partie qui s'ouvre sur une page */
  saut: boolean;
};

export type Modele = {
  /** La hauteur utile d'une page */
  hauteur: number;
  /** La hauteur d'une ligne du récit */
  ligne: number;
  /** La page où commence le récit : la parité des doubles pages en dépend */
  premiere: number;
  mesures: Record<string, Mesure>;
  /** Les chemins du récit : chaque passage et ceux où il mène */
  liens: Record<string, string[]>;
};

type Etat = { page: number; y: number; blanc: number; ici: Map<string, number[]> };

/** La double page d'une page : 2 et 3 se font face, 4 et 5… */
const doublePage = (page: number) => Math.floor(page / 2);

/**
 * Poser un passage à la suite : sa tête (numéro et deux lignes) doit tenir, son corps s'écoule
 * de page en page, sa queue ne se coupe pas. Rend le blanc laissé au bas d'une page.
 */
function poser(e: Etat, m: Modele, id: string, saut: boolean): { etat: Etat; blanc: number } {
  const me = m.mesures[id] ?? { h: 3 * m.ligne, queue: 0, pleinePage: false };
  let { page, y } = e;
  let blanc = 0;
  const pages: number[] = [];
  const nouvellePage = (compte: boolean) => {
    if (y > 0) {
      if (compte) blanc += m.hauteur - y;
      page += 1;
      y = 0;
    }
  };
  if (saut) nouvellePage(false);
  if (me.blocs?.length && !me.pleinePage) {
    // Les unités qui ne se coupent pas, et le texte qui s'écoule entre elles
    for (const u of unites(me.blocs, m.ligne)) {
      if (u.coupe) {
        // Deux lignes au moins de chaque côté d'une coupure (F11-AC35)
        let reste = u.h;
        while (reste > 0) {
          const place = m.hauteur - y;
          if (reste <= place + 0.5) {
            y += reste;
            reste = 0;
          } else if (place < 2 * m.ligne || reste < 4 * m.ligne) {
            nouvellePage(true);
            if (!pages.includes(page)) pages.push(page);
            if (reste > m.hauteur) {
              reste -= m.hauteur;
              page += 1;
              pages.push(page);
            } else {
              y = reste;
              reste = 0;
            }
          } else {
            const pose = Math.min(Math.floor(place / m.ligne) * m.ligne, reste - 2 * m.ligne);
            blanc += place - pose;
            reste -= pose;
            page += 1;
            y = 0;
            pages.push(page);
          }
        }
      } else {
        if (m.hauteur - y < u.h && y > 0) nouvellePage(true);
        if (!pages.includes(page)) pages.push(page);
        // Plus haute qu'une page, l'unité se coupe malgré tout (« Règle impossible à tenir »)
        y += u.h;
        while (y > m.hauteur) {
          y -= m.hauteur;
          page += 1;
          pages.push(page);
        }
      }
    }
    const ici = new Map(e.ici);
    ici.set(id, pages.length ? pages : [page]);
    return { etat: { page, y, blanc: e.blanc + blanc, ici }, blanc };
  }
  const tete = Math.min(me.h, 3 * m.ligne);
  if (m.hauteur - y < tete) nouvellePage(true);
  pages.push(page);
  if (me.pleinePage) {
    // L'image pleine page est seule sur sa page : le blanc qui la précède compte
    const avant = Math.max(0, me.h - m.hauteur - me.queue);
    y += Math.min(avant, m.hauteur - y);
    nouvellePage(true);
    pages.push(page);
    page += 1;
    y = 0;
    y += me.queue;
  } else {
    let corps = Math.max(0, me.h - me.queue - tete) + tete;
    while (y + corps > m.hauteur) {
      corps -= m.hauteur - y;
      page += 1;
      y = 0;
      pages.push(page);
    }
    y += corps;
    if (me.queue > 0) {
      if (m.hauteur - y < me.queue) nouvellePage(true);
      if (!pages.includes(page)) pages.push(page);
      y += me.queue;
    }
  }
  const ici = new Map(e.ici);
  ici.set(id, pages);
  return { etat: { page, y, blanc: e.blanc + blanc, ici }, blanc };
}

/**
 * Les blocs d'un passage en unités : le texte qui se coupe, et ce qui ne se coupe pas. Le numéro
 * reste avec les deux premières lignes ou le bloc qui le suit ; rien d'autre ne se regroupe
 * (F11.2, révisé le 22 octobre 2026).
 */
function unites(blocs: [string, number][], ligne: number): { coupe: boolean; h: number }[] {
  const u: { coupe: boolean; h: number }[] = [];
  let tete = 0;
  for (const [sorte, h] of blocs) {
    if (sorte === "n") {
      tete += h;
      continue;
    }
    if (sorte === "t" && tete && h > 4 * ligne) u.push({ coupe: false, h: tete + 2 * ligne }, { coupe: true, h: h - 2 * ligne });
    else u.push({ coupe: sorte === "t" && h > 4 * ligne && !tete, h: tete + h });
    tete = 0;
  }
  if (tete) u.push({ coupe: false, h: tete });
  return u;
}

/** Le passage serait-il sur la double page d'un passage qui y mène ? (F11-AC66) */
function tropPres(e: Etat, m: Modele, id: string, pages: number[]): boolean {
  const vis = new Set(pages.map(doublePage));
  for (const [autre, sesPages] of e.ici) {
    if (autre === id || !(m.liens[autre] ?? []).includes(id)) continue;
    if (sesPages.some((p) => vis.has(doublePage(p)))) return true;
  }
  return false;
}

/** Le blanc que laisse un ordre, selon le modèle (sans la dernière page, ni avant un saut demandé). */
export function blancDe(ordre: PassageOrdonne[], m: Modele): number {
  let e: Etat = { page: m.premiere, y: 0, blanc: 0, ici: new Map() };
  for (const p of ordre) e = poser(e, m, p.sceneId, p.saut).etat;
  return Math.round(e.blanc);
}

/**
 * « Réordonner les passages » : un nouvel ordre dans chaque groupe de mélange, pour laisser le
 * moins de blanc possible. Chaque passage tenu garde sa place ; à chaque place libre, on pose
 * celui des passages restants du groupe qui laisse le moins de blanc, sans le mettre sur la
 * double page d'un passage qui y mène quand un autre convient (effort au mieux). Rend, pour
 * chaque groupe, la suite de ses passages libres.
 */
export function agencer(ordre: PassageOrdonne[], m: Modele): { suites: Map<number, string[]>; avant: number; apres: number } {
  const restants = new Map<number, string[]>();
  for (const p of ordre) if (!p.tenu) restants.set(p.groupe, [...(restants.get(p.groupe) ?? []), p.sceneId]);
  const suites = new Map<number, string[]>();
  let e: Etat = { page: m.premiere, y: 0, blanc: 0, ici: new Map() };
  for (const p of ordre) {
    if (p.tenu) {
      e = poser(e, m, p.sceneId, p.saut).etat;
      continue;
    }
    const pool = restants.get(p.groupe)!;
    let choisi = pool[0];
    let meilleur = Number.POSITIVE_INFINITY;
    for (const id of pool) {
      const essai = poser(e, m, id, false);
      const loin = tropPres(e, m, id, essai.etat.ici.get(id)!) ? 1 : 0;
      // Le blanc d'abord, puis l'écart des passages liés, puis l'ordre actuel
      const cout = essai.blanc + loin * 1000;
      if (cout < meilleur - 0.5) {
        meilleur = cout;
        choisi = id;
      }
    }
    restants.set(p.groupe, pool.filter((x) => x !== choisi));
    suites.set(p.groupe, [...(suites.get(p.groupe) ?? []), choisi]);
    e = poser(e, m, choisi, false).etat;
  }
  const nouveau = ordre.map((p) => (p.tenu ? p : { ...p, sceneId: "" }));
  const curseurs = new Map<number, number>();
  for (const p of nouveau) {
    if (p.sceneId) continue;
    const i = curseurs.get(p.groupe) ?? 0;
    p.sceneId = suites.get(p.groupe)![i];
    curseurs.set(p.groupe, i + 1);
  }
  return { suites, avant: blancDe(ordre, m), apres: blancDe(nouveau, m) };
}

// ——— Passage suggéré (F11.3, F11-AC67, AC68, AC74) ———

export type Blanc = {
  page: number;
  mm: number;
  /** Le dernier passage de la page */
  apres: string | null;
  /** Ce passage continue sur la page suivante : le blanc est à l'intérieur de lui */
  dedans: boolean;
};

export type Candidat = { sceneId: string; numero: number; h: number; reste: number };

/**
 * Trois candidats au plus pour combler le blanc d'une page : plus loin dans le même groupe,
 * libres de bouger, sans nouvelle page ni image pleine page, assez courts, le plus haut
 * d'abord ; jamais sur la double page d'un passage qui y mène.
 */
export function candidats(
  blanc: Blanc,
  o: { ordre: PassageOrdonne[]; nouvellesPages: ReadonlySet<string>; mesures: Record<string, Mesure>; pageDe: Record<string, number>; liens: Record<string, string[]> },
): { candidats: Candidat[]; raison: "dedans" | "aucun" | null } {
  if (blanc.dedans) return { candidats: [], raison: "dedans" };
  const apres = o.ordre.find((p) => p.sceneId === blanc.apres);
  if (!apres) return { candidats: [], raison: "aucun" };
  const voisins = new Set(Object.entries(o.pageDe).filter(([, page]) => doublePage(page) === doublePage(blanc.page)).map(([id]) => id));
  voisins.add(apres.sceneId);
  const menent = new Set([...voisins].flatMap((id) => o.liens[id] ?? []));
  const liste = o.ordre
    .filter((p) => p.groupe === apres.groupe && p.numero > apres.numero && !p.tenu && !o.nouvellesPages.has(p.sceneId))
    .flatMap((p): Candidat[] => {
      const m = o.mesures[p.sceneId];
      if (!m || m.pleinePage || m.h > blanc.mm || menent.has(p.sceneId)) return [];
      return [{ sceneId: p.sceneId, numero: p.numero, h: Math.round(m.h), reste: Math.round(blanc.mm - m.h) }];
    })
    .sort((a, b) => b.h - a.h || a.numero - b.numero)
    .slice(0, 3);
  return { candidats: liste, raison: liste.length ? null : "aucun" };
}

// ——— Doute sur l'ordre (F11.6, F11-AC86) ———

/**
 * Le doute naît quand, l'ordre décidé, un passage a changé de page depuis la décision, ou
 * quand le livre gagne ou perd un passage. Une coquille sans effet sur les pages ne le fait
 * pas naître (F11-AC65).
 */
export function doute(reference: Record<string, number> | null, actuel: Record<string, number> | null): boolean {
  if (!reference || !actuel) return false;
  const a = Object.keys(reference);
  const b = Object.keys(actuel);
  if (a.length !== b.length) return true;
  return a.some((id) => actuel[id] !== reference[id]);
}

// ——— Du plan au modèle ———

/**
 * Les passages du livre dans l'ordre imprimé, tels que l'agencement les voit : leur groupe de
 * mélange, s'ils gardent leur place, s'ils commencent une page. `passages` est l'ordre imprimé
 * de la composition, avec ses titres de partie et ses nouvelles pages.
 */
export function passagesOrdonnes(
  plan: PlanNumerote,
  passages: { sceneId: string; numero: number | null; nouvellePage: boolean; partie: { nouvellePage: boolean } | null }[],
): PassageOrdonne[] {
  const groupeDe = new Map<string, number>();
  const tenus = new Set<string>();
  groupesDeMelange(plan).forEach((groupe, g) => {
    const tete = ouvertureDe(groupe[0]);
    if (tete) tenus.add(tete);
    for (const partie of groupe) for (const c of partie.chapitres) for (const s of c.scenes) {
      groupeDe.set(s.id, g);
      if (s.numeroFixe !== null) tenus.add(s.id);
    }
  });
  if (plan.departSceneId) tenus.add(plan.departSceneId);
  return passages.flatMap((p) =>
    p.numero === null
      ? []
      : [{ sceneId: p.sceneId, numero: p.numero, groupe: groupeDe.get(p.sceneId) ?? 0, tenu: tenus.has(p.sceneId) || p.nouvellePage, saut: p.nouvellePage || Boolean(p.partie?.nouvellePage) }],
  );
}

/** Les chemins du récit, d'origine en destinations. */
export const liensDuPlan = (liens: { sceneId: string; cibleId: string | null }[]): Record<string, string[]> => {
  const r: Record<string, string[]> = {};
  for (const l of liens) if (l.cibleId) r[l.sceneId] = [...(r[l.sceneId] ?? []), l.cibleId];
  return r;
};

/** Ce que la composition a mesuré, mis à la forme du modèle : ses blocs, ou sa hauteur et sa queue (mesure ancienne). */
export const mesuresDuModele = (mesures: Record<string, { h: number; choix: number; pleinePage: boolean; blocs?: [string, number][] }>, ligne: number): Record<string, Mesure> =>
  Object.fromEntries(
    Object.entries(mesures).map(([id, m]) => [id, { h: m.h, queue: m.choix > 0 ? m.choix + 2 * ligne : 0, pleinePage: m.pleinePage, ...(m.blocs ? { blocs: m.blocs } : {}) }]),
  );

/**
 * Les rangs gardés qui donnent un ordre : pour chaque groupe, l'ouverture en tête, puis ses
 * passages sans numéro fixé dans l'ordre voulu, puis ceux dont le numéro est fixé. Rien ne
 * change hors des groupes touchés.
 */
export function rangsDeLOrdre(plan: PlanNumerote, suites: Map<number, string[]>, ordre: PassageOrdonne[]): Record<string, number> {
  const rangs: Record<string, number> = {};
  const groupes = groupesDeMelange(plan);
  const curseurs = new Map<number, number>();
  // L'ordre voulu : chaque place libre reçoit le suivant de sa suite
  const voulu = ordre.map((p) => {
    if (p.tenu) return p.sceneId;
    const i = curseurs.get(p.groupe) ?? 0;
    curseurs.set(p.groupe, i + 1);
    return suites.get(p.groupe)?.[i] ?? p.sceneId;
  });
  groupes.forEach((groupe, g) => {
    if (!suites.has(g)) return;
    const scenes = groupe.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
    const fixes = new Set(scenes.filter((s) => s.numeroFixe !== null || s.id === plan.departSceneId).map((s) => s.id));
    const ids = new Set(scenes.map((s) => s.id));
    let r = Math.min(...scenes.map((s) => s.rangLivre ?? 0));
    const tete = ouvertureDe(groupe[0]);
    if (tete && !fixes.has(tete)) rangs[tete] = r++;
    for (const id of voulu) if (ids.has(id) && !fixes.has(id) && id !== tete) rangs[id] = r++;
    for (const id of fixes) if (ids.has(id)) rangs[id] = r++;
  });
  return rangs;
}
