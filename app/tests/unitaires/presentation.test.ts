import { describe, expect, it } from "vitest";
import { lireOffre } from "@/domaine/offre";
import { donneesDeLAccueil, donneesDeLAide, enJsonLd, llmsTxt } from "@/domaine/presentation";
import { QUESTIONS } from "@/domaine/textes-publics";

const SITE = "https://iletaituneclasse.com";
const vente = lireOffre({ paiement_ouvert: true, prix_du_pass: 2000, prix_de_la_recharge: 500 });

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
