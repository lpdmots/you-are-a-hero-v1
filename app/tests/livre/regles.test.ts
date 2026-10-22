import { beforeAll, describe, expect, it } from "vitest";
import type { Texte } from "@/domaine/copie";
import type { LivreACompose } from "@/domaine/composition";
import { composer, type Composition } from "@/serveur/livre/composer";
import type { BlocPlace } from "@/serveur/livre/dans-la-page";
import { action, choix, id, image, imageId, livreDe, lirePdf, p, png, recit, type Decrite } from "./fabrique";

/**
 * Étape 6 du plan, lot 3 : les règles de composition (F11.3), les images à leur place (F10) et
 * les pages de présentation (F11.4), mises en pages par Chromium. Les coupures se vérifient sur
 * la carte des blocs : où chaque bloc tombe, page par page, en millimètres.
 */

const ETAT = "état du 15 octobre, 10 h 00";
const LIGNE_MM = (12 * 1.36 * 25.4) / 72;
const sansImage = async () => null;
const compose = (livre: LivreACompose, lireImage: Parameters<typeof composer>[1]["lireImage"] = sansImage) => composer(livre, { travail: false, etatDu: ETAT, lireImage });
const entrees = (c: Composition, bloc: string) => c.rapport.carte.filter((b) => b.bloc === bloc);

/** Un livre de passages de longueurs variées : des paragraphes, une action parfois, deux ou trois choix. */
function variante(decalage: number): LivreACompose {
  const scenes: Decrite[] = Array.from({ length: 48 }, (_, i) => {
    const ref = i + 1;
    const fin = ref > 45;
    const texte: Texte = [...recit(ref * 7 + decalage, 1 + ((ref + decalage) % 4), 2 + ((ref * 3 + decalage) % 5))];
    if (ref % 5 === 0) texte.push(action("Retire un point de volonté à ton héros.", `a-${ref}`));
    if (!fin) {
      texte.push(choix(`Suivre la piste ${ref}`, id(Math.min(48, ref + 1)), `c1-${ref}`), choix(`Prendre la barque ${ref}`, id(Math.min(48, ref + 2)), `c2-${ref}`));
      if (ref % 3 === 0) texte.push(choix(`Attendre ${ref}`, id(Math.min(48, ref + 3)), `c3-${ref}`));
    }
    return { ref, partie: ref <= 16 ? 0 : 1, fin, texte };
  });
  return livreDe(scenes, { parties: ["Le quai", "La forêt"] });
}

describe("Règles de coupure, sur quatre variantes d'un livre de 48 passages (F11.3)", () => {
  const compositions: { livre: LivreACompose; c: Composition }[] = [];
  beforeAll(async () => {
    for (const decalage of [0, 1, 2, 3]) {
      const livre = variante(decalage);
      compositions.push({ livre, c: await compose(livre) });
    }
  });

  it("F11-AC35 — un paragraphe coupé entre deux pages laisse deux lignes au moins de chaque côté", () => {
    let coupes = 0;
    for (const { livre, c } of compositions) {
      for (const p of livre.passages.flatMap((x) => x.blocs.filter((b) => b.type === "p"))) {
        const morceaux = entrees(c, p.id);
        if (morceaux.length < 2) continue;
        coupes += 1;
        for (const m of morceaux) expect(m.h, `${p.id} page ${m.page}`).toBeGreaterThan(2 * LIGNE_MM - 0.6);
      }
    }
    expect(coupes).toBeGreaterThan(10);
  });

  it("F11-AC37, F11-AC36 — un numéro de passage n'est jamais seul en bas de page : son texte commence sur la même page", () => {
    for (const { livre, c } of compositions) {
      for (const passage of livre.passages) {
        const numero = c.rapport.carte.find((b) => b.scene === passage.sceneId && b.bloc === null && !b.cible)!;
        const premier = passage.blocs.find((b) => b.type === "p")!;
        expect(entrees(c, premier.id).some((m) => m.page === numero.page), passage.reference).toBe(true);
      }
    }
  });

  it("F11-AC38 — une phrase de choix et une action restent entières, mais se séparent du texte qui les amène pour remplir la page", () => {
    let separes = 0;
    for (const { livre, c } of compositions) {
      for (const passage of livre.passages) {
        for (const b of passage.blocs.filter((x) => x.type === "choix" || x.type === "action")) expect(entrees(c, b.id), passage.reference).toHaveLength(1);
        const premier = passage.blocs.find((b) => b.type === "choix");
        if (!premier) continue;
        const avant = passage.blocs[passage.blocs.indexOf(premier) - 1];
        const pageAvant = Math.max(...entrees(c, avant.id).map((m) => m.page));
        if (entrees(c, premier.id)[0].page > pageAvant) separes += 1;
      }
    }
    expect(separes).toBeGreaterThan(0);
  });

  it("F11-AC39 — trente destinations : le groupe se coupe entre deux phrases, toutes imprimées, sans signalement", async () => {
    const trente: Texte = [p("La place du village est pleine de monde."), ...Array.from({ length: 30 }, (_, i) => choix(`Aller vers la maison ${i + 1}`, id(2), `m${i}`))];
    const c = await compose(livreDe([{ ref: 1, texte: trente }, { ref: 2, fin: true }]));
    const pages = new Set(Array.from({ length: 30 }, (_, i) => entrees(c, `m${i}`)).map((e) => {
      expect(e).toHaveLength(1);
      return e[0].page;
    }));
    expect(pages.size).toBe(2);
    expect(c.rapport.debordements).toEqual([]);
  });
});

describe("Césure et alignement (F11.3)", () => {
  it("F11-AC40, F11-AC41 — justifié : des coupures, jamais dans un mot à majuscule ni dans une phrase de choix, trois lettres au moins de chaque côté ; aligné à gauche : aucune", async () => {
    const livre = (alignement: "justifie" | "gauche") => livreDe(
      Array.from({ length: 12 }, (_, i) => ({ ref: i + 1, fin: i === 11, texte: [...recit(100 + i, 4, 5), ...(i < 11 ? [choix("Continuer vers la forêt extraordinairement silencieuse", id(i + 2), `c-${i}`)] : [])] })),
      { reglages: { alignement } },
    );
    const lignes = async (l: LivreACompose) => (await lirePdf((await compose(l)).pdf)).flatMap((x) => x.lignes);
    const justifie = await lignes(livre("justifie"));
    // Les traits d'union du texte lui-même (« au-dessus », « rends-toi ») ne sont pas des coupures
    // pdf.js lit le trait d'union d'une coupure séparé du mot : « cou - »
    const coupees = justifie.filter((l) => /[a-zà-ÿ] -$/.test(l));
    expect(coupees.length).toBeGreaterThan(3);
    // pdf.js sépare aussi les mots à chaque point de césure posé : la règle des trois lettres se vérifie sur la césure elle-même (tests unitaires)
    for (const l of coupees) {
      const morceau = l.replace(/ -$/, "").split(/\s+/).at(-1)!;
      expect(morceau[0], l).toBe(morceau[0].toLowerCase());
      expect(l.startsWith("—"), l).toBe(false);
    }
    const gauche = await lignes(livre("gauche"));
    expect(gauche.filter((l) => /[a-zà-ÿ] -$/.test(l))).toEqual([]);
  });
});

describe("Les images à leur place (F10)", () => {
  const PNG = png(400, 300);
  const lire = async () => ({ octets: PNG, type: "image/png" });

  it("F10-AC18 — une image qui ne tient pas en bas de page passe entière en tête de la suivante, le texte qui la suit vient après elle", async () => {
    const images = { [imageId(1)]: { largeur: 1600, hauteur: 1060 } };
    const scenes: Decrite[] = Array.from({ length: 6 }, (_, i) => ({
      ref: i + 1, fin: i === 5, texte: [...recit(200 + i, 2 + i, 4), image(1, 100, `i-${i}`), p(`Après l’image ${i}.`, `apres-${i}`), ...(i < 5 ? [choix("Continuer", id(i + 2), `c-${i}`)] : [])],
    }));
    const c = await compose(livreDe(scenes, { images }), lire);
    let reportees = 0;
    for (let i = 0; i < 6; i += 1) {
      const [img] = entrees(c, `i-${i}`);
      const [apres] = entrees(c, `apres-${i}`);
      expect(entrees(c, `i-${i}`)).toHaveLength(1);
      expect(apres.page > img.page || (apres.page === img.page && apres.y > img.y)).toBe(true);
      const avant = c.rapport.carte.filter((b) => b.scene === id(i + 1) && b.page < img.page);
      if (avant.length && img.y < 20) reportees += 1;
    }
    expect(reportees).toBeGreaterThan(0);
  });

  it("F10-AC19 — une image pleine page juste avant les choix : les choix ouvrent la page suivante ; posée après eux, ils restent avec leur texte", async () => {
    const images = { [imageId(1)]: { largeur: 1200, hauteur: 1800 } };
    const avant = await compose(livreDe([{ ref: 1, texte: [p("Le pont tremble.", "t1"), image(1, 100, "pp", true), choix("Traverser", id(2), "ch")] }, { ref: 2, fin: true }], { images }), lire);
    const [img] = entrees(avant, "pp");
    expect(entrees(avant, "ch")[0].page).toBe(img.page + 1);
    expect(entrees(avant, "t1")[0].page).toBe(img.page - 1);
    const apres = await compose(livreDe([{ ref: 1, texte: [p("Le pont tremble.", "t1"), choix("Traverser", id(2), "ch"), image(1, 100, "pp", true)] }, { ref: 2, fin: true }], { images }), lire);
    expect(entrees(apres, "ch")[0].page).toBe(entrees(apres, "t1")[0].page);
  });

  it("F10-AC36 — une image pleine page en tête du passage 2 : sa page porte en haut le numéro 2, l'image dessous ; le texte commence à la page suivante, et la page d'avant n'a pas le numéro", async () => {
    const images = { [imageId(1)]: { largeur: 1200, hauteur: 1800 } };
    const c = await compose(
      livreDe([{ ref: 1, texte: [p("Le quai est désert.", "t1"), choix("Monter à bord", id(2), "ch1")] }, { ref: 2, texte: [image(1, 100, "pp", true), p("La barque glisse sur l’eau noire.", "t2")], fin: true }], { images }),
      lire,
    );
    const numero = c.rapport.carte.find((b) => b.scene === id(2) && !b.bloc && !b.cible)!;
    const [img] = entrees(c, "pp");
    expect(numero.page).toBe(img.page);
    expect(numero.y).toBeLessThan(img.y);
    expect(numero.page).toBe(c.rapport.pageDe[id(1)] + 1);
    expect(entrees(c, "t2")[0].page).toBe(img.page + 1);
    // L'image tient sous le numéro, dans la zone de texte
    expect(img.y + img.h).toBeLessThanOrEqual(210 - 20 + 0.5);
  });

  it("F11-AC57 — une adresse de quatre-vingts caractères sans espace, que la césure laisse entière, dépasse de la marge : la composition le voit, à sa page", async () => {
    const c = await compose(livreDe([{ ref: 1, fin: true, texte: [p("Voir Wwwuneadressebeaucouptroplonguepourtenirsurunelignedulivreetquinesecoupenullepart.fr")] }]));
    expect(c.rapport.debordements).toContainEqual({ page: 1, scene: id(1) });
  });
});

describe("Pages de présentation, bas de page, présentation commune (F11.4, F11.3)", () => {
  const feuille = (n: number) => ({
    on: true, des: 2 as const,
    sections: [
      { id: "a", type: "compteurs" as const, titre: "Caractéristiques", compteurs: [{ id: "v", nom: "Volonté", depart: 5 }] },
      { id: "b", type: "liste" as const, titre: "Inventaire", lignes: 8 },
      ...Array.from({ length: n }, (_, i) => ({ id: `n${i}`, type: (i % 2 ? "notes" : "liste") as "notes" | "liste", titre: `Section ${i + 3}`, lignes: 8 })),
    ],
  });
  const scenes: Decrite[] = Array.from({ length: 14 }, (_, i) => ({ ref: i + 1, fin: i === 13, texte: [...recit(300 + i, 3, 4), ...(i < 13 ? [choix("Continuer", id(i + 2), `c-${i}`)] : [])] }));

  it("F11-AC48, F11-AC12, F04-AC19 — titre, auteurs, « Comment lire », feuille : le récit commence page 5, à droite, dans le même fichier ; la feuille porte ses deux sections et rien d'autre", async () => {
    const c = await compose(livreDe(scenes, { feuille: feuille(0), pages: (x) => x }));
    expect(c.rapport.presentation.map((x) => [x.nom, x.page])).toEqual([["titre", 1], ["auteurs", 2], ["comment-lire", 3], ["feuille", 4]]);
    expect(c.rapport.premierePageDuRecit).toBe(5);
    const texte = (await lirePdf(c.pdf)).map((x) => x.lignes.join(" ")).join(" ");
    expect(texte).toContain("Ce livre a été écrit par");
    expect(texte).toContain("Feuille d’aventure");
    expect(texte).toMatch(/Volonté\s+départ 5/);
    expect(texte).toContain("Inventaire");
    // Sans feuille, trois pages de présentation : la page 4 est blanche
    const sans = await compose(livreDe(scenes, { pages: (x) => x }));
    expect(sans.rapport.premierePageDuRecit).toBe(5);
    expect(sans.rapport.presentation).toHaveLength(3);
  });

  it("F04-AC42, F11-AC52 — la liste remplit sa page ; une feuille de cinq sections continue sur la page suivante, chaque liste gardant huit lignes", async () => {
    const une = await compose(livreDe(scenes, { feuille: feuille(0), pages: (x) => x }));
    expect(une.rapport.lignesDeListes[0]).toBeGreaterThan(8);
    const cinq = await compose(livreDe(scenes, { feuille: feuille(3), pages: (x) => x }));
    const pagesDeLaFeuille = cinq.rapport.presentation.filter((x) => x.nom === "feuille").map((x) => x.page);
    expect(Math.max(...cinq.rapport.carte.map((b) => b.page))).toBeGreaterThan(0);
    expect(cinq.rapport.lignesDeListes.every((n) => n === 8)).toBe(true);
    expect(cinq.rapport.premierePageDuRecit % 2).toBe(1);
    expect(cinq.rapport.premierePageDuRecit).toBeGreaterThan(Math.min(...pagesDeLaFeuille) + 1);
  });

  it("F11-AC49 — par défaut, aucun numéro de page dans un livre à choix ; activé, la page du passage 1 porte 5 et la page de titre aucun", async () => {
    const sans = await lirePdf((await compose(livreDe(scenes, { pages: (x) => x }))).pdf);
    expect(sans[4].lignes.at(-1)).not.toBe("5");
    const avec = await lirePdf((await compose(livreDe(scenes, { pages: (x) => x, reglages: { basDePage: "numero" } }))).pdf);
    expect(avec[4].lignes.at(-1)).toBe("5");
    expect(avec[0].lignes.at(-1)).not.toBe("1");
  });

  it("F11-AC50 — la page des auteurs « à la fin » suit le dernier passage et précède la page de fin", async () => {
    const c = await compose(livreDe(scenes, { pages: (x) => ({ ...x, auteurs: { ...x.auteurs, place: "fin" }, fin: { ...x.fin, presente: true } }) }));
    const derniere = Math.max(...Object.values(c.rapport.pageDe));
    const auteurs = c.rapport.presentation.find((x) => x.nom === "auteurs")!.page;
    const fin = c.rapport.presentation.find((x) => x.nom === "fin")!.page;
    expect(auteurs).toBeGreaterThan(derniere);
    expect(fin).toBeGreaterThan(auteurs);
  });

  it("F11-AC53 — deux dés en bas de page : chaque page de droite du récit en porte deux, aucune page de gauche ni de présentation", async () => {
    const c = await compose(livreDe(scenes, { feuille: feuille(0), pages: (x) => x, reglages: { basDePage: "des" } }));
    expect(c.rapport.des.length).toBeGreaterThan(2);
    for (const d of c.rapport.des) {
      expect(d.page % 2).toBe(1);
      expect(d.page).toBeGreaterThanOrEqual(c.rapport.premierePageDuRecit);
      expect(d.faces).toHaveLength(2);
    }
  });

  it("PDF de travail avec dés : les dés ou le numéro de page, jamais les deux — aucune page ne porte « p. N » ; sans dés, chaque page du livre le porte", async () => {
    const marques = async (basDePage: "des" | "rien") => {
      const c = await composer(livreDe(scenes, { feuille: feuille(0), pages: (x) => x, reglages: { basDePage } }), { travail: true, etatDu: ETAT, lireImage: sansImage });
      const pages = await lirePdf(c.pdf);
      return pages.slice(c.rapport.horsPagination).filter((pg) => pg.lignes.some((l) => /(^|\s)p\.\s*\d+$/.test(l.normalize("NFKC")))).length;
    };
    expect(await marques("des")).toBe(0);
    expect(await marques("rien")).toBeGreaterThan(2);
  });

  it("F11-AC51, F11-AC106 — une feuille en image s'imprime dans les marges, ses sections restent pour le lecteur en ligne ; l'illustration du titre ne dépasse pas la moitié de la page", async () => {
    const images = { [imageId(1)]: { largeur: 1200, hauteur: 1700 }, [imageId(2)]: { largeur: 1600, hauteur: 2400 } };
    const lire = async (x: string) => ({ octets: x === imageId(1) ? png(120, 170) : png(160, 240), type: "image/png" });
    const livre = livreDe(scenes, {
      feuille: feuille(0), images,
      pages: (x) => ({ ...x, feuille: { forme: "image", imageId: imageId(1) }, titre: { ...x.titre, illustration: imageId(2) } }),
    });
    expect(livre.feuille?.sections).toHaveLength(2);
    const c = await compose(livre, lire);
    expect(c.rapport.introuvables).toEqual([]);
    expect(c.rapport.illustration!.mm).toBeLessThanOrEqual(c.rapport.illustration!.page / 2 + 0.5);
    expect(c.rapport.presentation.find((x) => x.nom === "feuille")).toBeDefined();
  });

  it("F11-AC106 — en largeur comme en hauteur, avec un long titre en taille « Grande », l'illustration cède la place : titre, illustration, ligne et année tiennent sur une seule page", async () => {
    const ligne = "Les élèves de la classe de CE2-CM1-CM2 de l’école élémentaire de Müllheim";
    for (const [largeur, hauteur] of [[1536, 1024], [1024, 1536]]) {
      const livre = livreDe(scenes, {
        titre: "Le mystère du labyrinthe oublié sous la vieille ville", reglages: { taille: "grande" }, images: { [imageId(2)]: { largeur, hauteur } },
        pages: (x) => ({ ...x, titre: { ...x.titre, sousTitre: "Une aventure dont tu es le héros", ligne, annee: "2025-2026", illustration: imageId(2) } }),
      });
      const c = await composer(livre, { travail: true, etatDu: ETAT, lireImage: async () => ({ octets: png(largeur, hauteur), type: "image/png" }) });
      const titre = c.rapport.presentation.find((x) => x.nom === "titre")!.page;
      expect(c.rapport.presentation.find((x) => x.nom === "auteurs")!.page, `${largeur} × ${hauteur}`).toBe(titre + 1);
      const page = (await lirePdf(c.pdf))[c.rapport.horsPagination + titre - 1].lignes.join(" ");
      for (const attendu of ["VERSION DE TR", "Le mystère du", "Une aventure dont tu es le héros", "élémentaire de Müllheim", "2025-2026"]) expect(page, `${largeur} × ${hauteur}`).toContain(attendu);
      expect(c.rapport.illustration!.mm).toBeGreaterThan(20);
      expect(c.rapport.illustration!.mm).toBeLessThanOrEqual(c.rapport.illustration!.page / 2 + 0.5);
    }
  });

  it("F11-AC08 — la présentation commune vaut pour tout le livre : en taille « Grande », il compte plus de pages, sans qu'aucune scène change", async () => {
    const moyenne = await compose(livreDe(scenes));
    const grande = await compose(livreDe(scenes, { reglages: { taille: "grande" } }));
    expect(grande.rapport.pages).toBeGreaterThan(moyenne.rapport.pages);
  });
});

it("la carte des blocs est en millimètres sur une page A5", async () => {
  const c = await compose(livreDe([{ ref: 1, fin: true, texte: [p("Le quai.")] }]));
  const tous = c.rapport.carte as BlocPlace[];
  expect(tous.every((b) => b.x >= 0 && b.x + b.l <= 148.5 && b.y >= 0 && b.y + b.h <= 210.5)).toBe(true);
});
