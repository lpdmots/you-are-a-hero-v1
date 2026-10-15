import { describe, expect, it } from "vitest";
import { CESURE, corpsDuLivre, couperMot, couperTexte, type LivreACompose } from "@/domaine/composition";
import { action, choix, id, image, imageId, liaison, livreDe, p, recit, type Decrite } from "../livre/fabrique";

/**
 * Étape 6 du plan, lot 1 : ce que le livre composé contient et dans quel ordre (F11.2, F11.5),
 * sans navigateur. La mise en pages elle-même est essayée dans `tests/livre`.
 */

const html = (l: LivreACompose, travail = false) => corpsDuLivre(l, { travail, etatDu: "état du 15 octobre, 10 h 00", image: (x) => `/images/${x}` });
const numeroDe = (l: LivreACompose, ref: number) => l.passages.find((x) => x.sceneId === id(ref))?.numero ?? null;
const sansCesure = (t: string) => t.replaceAll(CESURE, "");

/** A (1) mène à 2 et 3 ; trois parties, rangs gardés donnés à la main. L'ouverture d'une partie reste en tête de son groupe. */
function trois(o: { groupes?: number[]; rangs?: Record<number, number> } = {}): LivreACompose {
  const scenes: Decrite[] = [
    { ref: 1, partie: 0, texte: [p("Le quai."), choix("Suivre la lanterne", id(2)), choix("Monter dans la barque", id(3))] },
    { ref: 2, partie: 0, texte: [p("La lanterne."), choix("Entrer dans la forêt", id(4))] },
    { ref: 7, partie: 0, fin: true, texte: [p("La cabane.")] },
    { ref: 3, partie: 1, texte: [p("La barque."), choix("Accoster", id(5))] },
    { ref: 4, partie: 1, texte: [p("La forêt."), choix("Monter à la tour", id(6))] },
    { ref: 5, partie: 2, texte: [p("La rive."), choix("Monter à la tour", id(6))] },
    { ref: 6, partie: 2, fin: true, texte: [p("La tour.")] },
  ].map((s) => ({ ...s, rang: o.rangs?.[s.ref] }));
  return livreDe(scenes, { parties: ["Le quai", "Le marais", "La tour"], groupes: o.groupes });
}

describe("Ordre imprimé et numéros (F11.5)", () => {
  it("F11-AC16, F11-AC18 — les parties se suivent, le départ porte le n° 1, l'ordre d'une partie suit les rangs gardés et non le plan", () => {
    const l = trois({ rangs: { 1: 2, 7: 0, 2: 1, 3: 1, 4: 0, 5: 1, 6: 0 } });
    expect(l.passages.map((x) => x.sceneId)).toEqual([id(1), id(7), id(2), id(3), id(4), id(5), id(6)]);
    expect(l.passages.map((x) => x.numero)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("F11-AC17, F11-AC23, F11-AC55 — deux parties réunies se mélangent ; la seconde garde son titre au-dessus de son ouverture, sans saut de page", () => {
    const l = trois({ groupes: [2], rangs: { 3: 3, 4: 1, 5: 0, 6: 2 } });
    expect(l.passages.slice(3).map((x) => x.sceneId)).toEqual([id(3), id(5), id(4), id(6)]);
    const marais = l.passages.find((x) => x.partie?.titre === "Le marais")!;
    const tour = l.passages.find((x) => x.partie?.titre === "La tour")!;
    expect(marais.sceneId).toBe(id(3));
    expect(marais.partie!.nouvellePage).toBe(true);
    expect(tour.sceneId).toBe(id(5));
    expect(tour.partie!.nouvellePage).toBe(false);
  });

  it("F11-AC22, F11-AC54 — sans regroupement, le titre de la partie 2 est au-dessus de son premier passage, en haut d'une page ; réglage désactivé, sans saut", () => {
    const l = trois();
    const marais = l.passages.find((x) => x.partie?.titre === "Le marais")!;
    expect(marais.sceneId).toBe(id(3));
    expect(marais.partie!.nouvellePage).toBe(true);
    expect(html(l)).toMatch(/<h1 class="partie nouvelle-page">Le marais<\/h1><h2 class="numero"[^>]*>4<\/h2>/);
    const sansSaut = livreDe(trois().passages.map((x, i) => ({ ref: i + 1 })), { reglages: { partieNouvellePage: false } });
    expect(sansSaut.passages.every((x) => !x.partie?.nouvellePage)).toBe(true);
  });

  it("F11-AC20 — une scène exclue ne reçoit pas de numéro et ne laisse pas de trou", () => {
    const scenes: Decrite[] = Array.from({ length: 40 }, (_, i) => ({ ref: i + 1, hors: i + 1 === 17, texte: [p(`Passage ${i + 1}.`)], fin: true }));
    const l = livreDe(scenes);
    expect(l.passages).toHaveLength(39);
    expect(l.passages.map((x) => x.numero)).toEqual(Array.from({ length: 39 }, (_, i) => i + 1));
    expect(l.passages.some((x) => x.sceneId === id(17))).toBe(false);
  });

  it("F11-AC19 — sans modification, chaque scène garde son numéro d'une composition à l'autre ; une scène ajoutée se place à la suite de sa partie", () => {
    const rangs = { 1: 0, 2: 1, 7: 2, 3: 0, 4: 1, 5: 0, 6: 1 };
    const avant = trois({ rangs });
    expect(trois({ rangs }).passages.map((x) => [x.sceneId, x.numero])).toEqual(avant.passages.map((x) => [x.sceneId, x.numero]));
  });
});

describe("Renvois imprimés (F11.5, F05)", () => {
  it("F11-AC09, F11-AC33 — échanger B et C dans l'ordre imprimé ne change pas la destination : le renvoi imprime le nouveau numéro de B", () => {
    const avant = trois({ rangs: { 1: 0, 2: 1, 7: 2 } });
    const apres = trois({ rangs: { 1: 0, 2: 2, 7: 1 } });
    for (const l of [avant, apres]) {
      expect(sansCesure(html(l))).toContain(`Suivre la lanterne : rends-toi au <b class="renvoi" data-renvoi="c-Suivre la lanterne" data-cible="${id(2)}">${numeroDe(l, 2)}</b>.`);
    }
    expect([numeroDe(avant, 2), numeroDe(apres, 2)]).toEqual([2, 3]);
  });

  it("F11-AC34 — une fin qui garde un choix imprime sa marque de fin avant ce choix", () => {
    const l = livreDe([
      { ref: 1, texte: [p("Le quai."), choix("Partir", id(2))] },
      { ref: 2, fin: true, texte: [p("Tu es tombé dans le lac."), choix("Retenter ta chance", id(1))] },
    ]);
    const corps = html(l);
    const passage = corps.slice(corps.indexOf(`data-scene="${id(2)}"`));
    expect(passage.indexOf('class="fin"')).toBeGreaterThan(-1);
    expect(passage.indexOf('class="fin"')).toBeLessThan(passage.indexOf("Retenter ta chance"));
  });
});

describe("Marques du PDF de travail (F11.2)", () => {
  it("F09-AC09 — un livre sans départ et un choix sans destination : la page récapitulative les liste, le choix est marqué à sa place", () => {
    const l = livreDe([{ ref: 1, texte: [p("Le quai."), choix("Suivre le héron", null)] }, { ref: 2, fin: true }]);
    const sansDepart = { ...l };
    expect(l.recapitulatif.map((x) => x.texte)).toContain("« Suivre le héron » ne mène nulle part.");
    expect(l.passages[0].marques).toContainEqual({ gravite: "bloque", texte: "« Suivre le héron » ne mène nulle part.", bloc: "c-Suivre le héron" });
    expect(html(sansDepart, true)).toContain('class="recap"');
    expect(html(sansDepart, false)).not.toContain('class="recap"');
  });

  it("F05-AC08 — une liaison cachée vers un numéro fixé que le livre n'atteint plus : le point bloque, le PDF de travail le marque sur sa scène", () => {
    const scenes: Decrite[] = [
      { ref: 1, texte: [p("La porte aux symboles."), liaison(id(2)), choix("Abandonner", id(3))] },
      { ref: 2, fixe: 40, fin: true },
      { ref: 3, fin: true },
    ];
    const l = livreDe(scenes);
    const point = l.recapitulatif.find((x) => x.texte.includes("énigme"));
    expect(point).toMatchObject({ gravite: "bloque", sceneId: id(1) });
    expect(l.passages.find((x) => x.sceneId === id(1))!.marques.some((m) => m.gravite === "bloque")).toBe(true);
    expect(html(l, true)).toContain('data-enigmes="40"');
  });

  it("F10-AC14 — une image introuvable laisse à sa place une indication dans le PDF de travail", () => {
    const l = livreDe([{ ref: 1, fin: true, texte: [p("Le pont."), image(1, 65), image(2, 40)] }], { images: { [imageId(2)]: { largeur: 800, hauteur: 600 } } });
    const corps = html(l, true);
    expect(corps).toContain(`data-image="${imageId(1)}"`);
    expect(corps).toMatch(/class="image introuvable"[^>]*><div class="manque">Image introuvable<\/div>/);
    expect(corps).toContain(`src="/images/${imageId(2)}"`);
  });

  it("F04-AC17 — une action de jeu est un bloc à part, son signe devant", () => {
    const l = livreDe([{ ref: 1, fin: true, texte: [p("Le couteau brille."), action("Ajoute le couteau à ton inventaire.")] }]);
    expect(html(l)).toMatch(/<p class="action"[^>]*><svg class="signe"[^>]*>.*<\/svg><span>Ajoute le couteau à ton inventaire\.<\/span><\/p>/);
  });
});

describe("Récit classique (F11.5, 15 octobre 2026)", () => {
  const classique = (titresDeChapitre = true) => livreDe([
    { ref: 1, partie: 0, chapitre: "La lisière" },
    { ref: 2, partie: 0, chapitre: "La lisière" },
    { ref: 3, partie: 0, chapitre: "Le marais", hors: true },
    { ref: 4, partie: 0, chapitre: "Le gué" },
    { ref: 5, partie: 0, chapitre: "Le gué" },
    { ref: 6, partie: 0, chapitre: "Le gué" },
  ], { aChoix: false, parties: ["La forêt"], reglages: { titresDeChapitre } });

  it("F11-AC102 — un filet entre deux scènes, aucun avant la première d'un chapitre ; ni numéro ni titre de scène", () => {
    const l = classique();
    expect(l.passages.map((x) => x.separateur)).toEqual([false, true, false, true, true]);
    expect(l.passages.every((x) => x.numero === null)).toBe(true);
    const corps = html(l);
    expect(corps).not.toContain("Scène 4");
    expect(corps).not.toContain('class="numero"');
  });

  it("F11-AC103 — « Chapitre 2 » pour le troisième chapitre du plan quand le deuxième est hors du livre ; réglage désactivé, aucun titre de chapitre", () => {
    const l = classique();
    expect(l.passages.filter((x) => x.chapitre).map((x) => [x.chapitre!.numero, x.chapitre!.titre])).toEqual([[1, "La lisière"], [2, "Le gué"]]);
    expect(html(l)).toContain('<span class="chapitre__rang">Chapitre 2</span>Le gué');
    const sans = classique(false);
    expect(sans.passages.some((x) => x.chapitre)).toBe(false);
    expect(sans.passages.map((x) => x.separateur)).toEqual([false, true, true, true, true]);
  });

  it("le numéro de page est imprimé par défaut en récit classique, non en récit à choix (F11.4)", () => {
    expect(classique().reglages.basDePage).toBe("numero");
    expect(trois().reglages.basDePage).toBe("rien");
  });
});

describe("Césure posée à la composition (F11.3)", () => {
  it("F11-AC40 — aucune coupure dans un mot à majuscule ni dans le dernier mot d'un paragraphe ; trois lettres au moins de chaque côté", () => {
    expect(couperMot("Maëlwenn")).toBe("Maëlwenn");
    const coupe = couperMot("extraordinairement");
    expect(coupe).toContain(CESURE);
    for (const morceau of [coupe.split(CESURE)[0], coupe.split(CESURE).at(-1)!]) expect(morceau.length).toBeGreaterThanOrEqual(3);
    const texte = couperTexte("La brume s’épaississait autour du passeur mystérieusement", true);
    expect(texte.endsWith("mystérieusement")).toBe(true);
    expect(texte).toContain(`s’épais${CESURE}sis${CESURE}sait`);
  });

  it("un texte aligné à gauche n'est pas coupé (F11-AC41)", () => {
    const l = livreDe([{ ref: 1, fin: true, texte: recit(7) }], { reglages: { alignement: "gauche" } });
    expect(html(l)).not.toContain(CESURE);
  });
});
