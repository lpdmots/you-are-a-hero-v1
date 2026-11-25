import { describe, expect, it } from "vitest";
import { lireOffre } from "@/domaine/offre";
import {
  ADRESSE_DE_L_HISTOIRE_D_EXEMPLE, DESCRIPTION_DE_L_ACCUEIL, DEUX_RECITS, donneesDeLAccueil, donneesDeLAide, enJsonLd, exempleALAccueil, EXEMPLES_A_L_ACCUEIL,
  HISTOIRE_D_EXEMPLE, LE_LIVRE_PREND_FORME, llmsTxt, PROMESSE, TITRE_DE_L_ACCUEIL,
} from "@/domaine/presentation";
import { IMAGE_DE_PARTAGE } from "@/domaine/pages-publiques";
import { QUESTIONS } from "@/domaine/textes-publics";

const SITE = "https://iletaituneclasse.com";
const vente = lireOffre({ paiement_ouvert: true, livre_payant: true, prix_du_pass: 2000, prix_de_la_recharge: 500 });
// Le livre gratuit, l'IA payante (8 novembre 2026)
const livreGratuit = lireOffre({ paiement_ouvert: true, livre_payant: false, prix_du_pass: 2000, prix_de_la_recharge: 500 });

describe("ce que lisent les IA", () => {
  it("F14-AC48 — llms.txt dit ce qu'est l'outil, pour qui, ses prix actuels et les pages publiques", () => {
    const texte = llmsTxt(vente, SITE);
    expect(texte).toMatch(/^# Il était une classe\n\n> Application web/);
    expect(texte).toContain("Les enseignants d’école élémentaire");
    expect(texte).toContain("Pass du livre : 20 € par livre");
    expect(texte).toContain("5 € les 100");
    for (const p of ["/aide", "/confidentialite", "/conditions", "/mentions-legales"]) expect(texte).toContain(`(${SITE}${p})`);
    expect(texte).not.toContain("/lire");
    // Vente fermée : ni pass ni recharge
    expect(llmsTxt(lireOffre({ paiement_ouvert: false }), SITE)).not.toContain("Pass du livre");
    expect(llmsTxt(lireOffre({ paiement_ouvert: false }), SITE)).not.toContain("5 € les 100");
  });

  it("F14-AC54 — livre gratuit, vente ouverte : llms.txt et l'accueil disent l'outil sans limite et la recharge, sans pass", () => {
    const texte = llmsTxt(livreGratuit, SITE);
    expect(texte).toContain("Gratuit, sans limite de scènes ni d’images");
    expect(texte).toContain("5 € les 100");
    expect(texte).not.toContain("Pass du livre");
    const donnees = donneesDeLAccueil(livreGratuit, SITE, null) as { "@graph": { offers?: { name: string; price: string }[] }[] };
    expect(donnees["@graph"][2].offers?.map((o) => [o.name, o.price])).toEqual([["Gratuit", "0"], ["100 étoiles", "5.00"]]);
    expect(donnees["@graph"][2]).toMatchObject({ isAccessibleForFree: true });
    expect((donneesDeLAccueil(vente, SITE, null) as { "@graph": unknown[] })["@graph"][2]).toMatchObject({ isAccessibleForFree: false });
  });

  it("F14-AC48 — l'accueil porte l'organisation, le site, l'application et son offre ; la vidéo seulement quand elle est en ligne", () => {
    const sansVideo = donneesDeLAccueil(vente, SITE, null) as { "@graph": { "@type": string; offers?: { name: string; price: string }[] }[] };
    expect(sansVideo["@graph"].map((d) => d["@type"])).toEqual(["Organization", "WebSite", "WebApplication"]);
    expect(sansVideo["@graph"][2].offers?.map((o) => [o.name, o.price])).toEqual([["Gratuit", "0"], ["Pass du livre", "20.00"], ["100 étoiles", "5.00"]]);
    const avec = donneesDeLAccueil(vente, SITE, { fichier: "/accueil/visite-fr.mp4", sousTitres: null, image: "/accueil/visite.webp", duree: "PT1M34S", publieeLe: "2026-10-24" }) as { "@graph": { "@type": string; contentUrl?: string }[] };
    expect(avec["@graph"].at(-1)).toMatchObject({ "@type": "VideoObject", contentUrl: `${SITE}/accueil/visite-fr.mp4` });
  });

  it("F14-AC48 — l'aide porte ses questions telles qu'affichées ; aucune balise ne peut se fermer dans le JSON", () => {
    const faq = donneesDeLAide(QUESTIONS) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity[0]).toEqual({ "@type": "Question", name: QUESTIONS[0].question, acceptedAnswer: { "@type": "Answer", text: QUESTIONS[0].reponse } });
    expect(enJsonLd({ t: "</script><b>" })).not.toContain("</script>");
  });
});

// Les pages publiques pour les deux sortes de récit (F14, 23 novembre 2026) : le livre dont vous êtes le héros d'abord,
// l'histoire classique ensuite ; « livre » porte les titres
describe("les deux sortes de récit sur les pages publiques", () => {
  const avant = (texte: string, premier: string, second: string) => texte.indexOf(premier) >= 0 && texte.indexOf(premier) < texte.indexOf(second);

  it("F14-AC72 — le premier écran de l'accueil : « livre » dans les titres, les deux sortes de récit nommées, le livre dont vous êtes le héros d'abord", () => {
    expect(PROMESSE).toBe("Votre classe écrit son livre.");
    expect(TITRE_DE_L_ACCUEIL).toMatch(/^Écrire un livre avec sa classe/);
    // Court, sans le nom du site (porteur, 24 novembre 2026)
    expect(TITRE_DE_L_ACCUEIL.length).toBeLessThanOrEqual(75);
    expect(avant(TITRE_DE_L_ACCUEIL, "livre dont vous êtes le héros", "histoire")).toBe(true);
    expect(avant(DESCRIPTION_DE_L_ACCUEIL, "livre dont vous êtes le héros", "histoire classique")).toBe(true);
    expect(DESCRIPTION_DE_L_ACCUEIL).toMatch(/^Créez gratuitement un livre avec votre classe/);
    expect(DESCRIPTION_DE_L_ACCUEIL.length).toBeLessThanOrEqual(160);
    expect(DEUX_RECITS).toBe("Un livre dont vous êtes le héros ou une histoire classique.");
    // L'image de partage montre ce premier écran : son texte de remplacement cite le même grand titre
    expect(IMAGE_DE_PARTAGE.alt).toContain(`« ${PROMESSE} »`);
    for (const texte of [PROMESSE, TITRE_DE_L_ACCUEIL, DESCRIPTION_DE_L_ACCUEIL, DEUX_RECITS]) expect(texte).not.toMatch(/recueil|roman/i);
  });

  it("F14-AC73 — le troisième temps : le PDF pour tout livre, les chemins et les numéros pour le livre-jeu", () => {
    expect(LE_LIVRE_PREND_FORME).toContain("L’application compose le PDF.");
    expect(LE_LIVRE_PREND_FORME).toContain("Pour un livre-jeu, elle vérifie aussi les chemins et numérote les passages.");
  });

  it("F14-AC74 — l'« Aide » répond à l'histoire classique avec sa classe et à l'auteur seul, données structurées comprises", () => {
    const classique = QUESTIONS.find((q) => q.question === "Peut-on écrire une histoire classique avec sa classe ?");
    const seul = QUESTIONS.find((q) => q.question === "Peut-on écrire seul, sans classe ?");
    expect(classique?.reponse).toContain("une histoire qui se lit du début à la fin");
    expect(classique?.reponse).toContain("Ce choix ne se change pas ensuite.");
    expect(seul?.reponse).toContain("répondez « Moi »");
    expect(seul?.reponse).toContain("un livre dont vous êtes le héros ou une histoire classique");
    // Ni l'une ni l'autre ne dépend de l'offre : elles sont toujours affichées, donc toujours dans les données
    for (const q of [classique, seul]) expect(q?.pass || q?.gratuit).toBeFalsy();
    const noms = (donneesDeLAide(QUESTIONS) as { mainEntity: { name: string }[] }).mainEntity.map((q) => q.name);
    expect(noms).toEqual(expect.arrayContaining([classique!.question, seul!.question]));
    // L'histoire classique juste après la définition du livre dont vous êtes le héros ; l'auteur seul plus bas
    expect(noms.indexOf(classique!.question)).toBe(noms.indexOf("Qu’est-ce qu’un livre dont vous êtes le héros ?") + 1);
    expect(noms.indexOf(seul!.question)).toBeGreaterThan(noms.indexOf(classique!.question));
  });

  it("F14-AC78 — le passage 27 avec un exemple du site : chaque livre nommé, l'exemple sans « mes élèves » ni mention de qui l'a écrit ; « Lire un exemple » dans l'« Aide »", () => {
    // Le livre de la classe à côté d'un exemple : livre-jeu ou histoire classique, dans un ordre ou dans l'autre
    expect(exempleALAccueil(["electro-nick", HISTOIRE_D_EXEMPLE])).toBe(HISTOIRE_D_EXEMPLE);
    expect(exempleALAccueil(["bouquin-mene-l-enquete", "electro-nick"])).toBe("bouquin-mene-l-enquete");
    // Toute autre paire, ou un seul livre, garde les textes généraux
    expect(exempleALAccueil(["electro-nick", "le-labyrinthe-oublie"])).toBeNull();
    expect(exempleALAccueil([HISTOIRE_D_EXEMPLE, "bouquin-mene-l-enquete"])).toBeNull();
    expect(exempleALAccueil([HISTOIRE_D_EXEMPLE])).toBeNull();
    for (const t of Object.values(EXEMPLES_A_L_ACCUEIL)) {
      expect(t.classe).toMatch(/^Électro Nick.* écrit par mes élèves/);
      expect(t.exemple).not.toMatch(/élèves|classe\b|IA\b|intelligence artificielle|roman|recueil/i);
    }
    const herisson = EXEMPLES_A_L_ACCUEIL[HISTOIRE_D_EXEMPLE];
    expect(herisson.classe).toContain("un livre dont vous êtes le héros");
    expect(herisson.exemple).toBe("Le hérisson qui voulait voir la mer est une histoire classique pour les plus jeunes.");
    // Dans l'« Aide », la seule question sur l'histoire classique mène à l'exemple, ouvert dans le lecteur
    expect(QUESTIONS.filter((q) => q.exemple).map((q) => q.question)).toEqual(["Peut-on écrire une histoire classique avec sa classe ?"]);
    expect(ADRESSE_DE_L_HISTOIRE_D_EXEMPLE).toBe("/lire/bibliotheque/le-herisson-qui-voulait-voir-la-mer");
  });

  it("F14-AC75 — llms.txt dit les deux sortes de récit, le livre dont vous êtes le héros d'abord, et l'auteur seul", () => {
    const texte = llmsTxt(livreGratuit, SITE);
    expect(texte).toMatch(/^# Il était une classe\n\n> Application web gratuite pour écrire un livre avec sa classe/);
    expect(avant(texte, "## Livre dont vous êtes le héros", "## Histoire classique")).toBe(true);
    expect(texte).toContain("une histoire classique, qui se lit du début à la fin, sans choix ni numéros de passage");
    expect(texte).toContain("pour un livre-jeu, vérifie les chemins et numérote les passages");
    expect(texte).toContain("Un adulte seul peut aussi écrire son propre livre, à choix ou classique, sans classe.");
    expect(texte).not.toMatch(/recueil/i);
  });
});
