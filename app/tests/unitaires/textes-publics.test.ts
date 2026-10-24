import { describe, expect, it } from "vitest";
import { CONDITIONS, CONFIDENTIALITE, MENTIONS_LEGALES, modeleDe } from "@/domaine/textes-publics";

const texte = (d: { sections: { paragraphes: string[] }[] }) => d.sections.flatMap((s) => s.paragraphes).join("\n");

describe("textes juridiques", () => {
  it("F14-AC37 — les mentions légales nomment l'éditeur, son adresse, son SIRET, un téléphone et la franchise de TVA", () => {
    const mentions = texte(MENTIONS_LEGALES);
    expect(mentions).toContain("édité par Yohann Coussot, entrepreneur individuel, qui en est le directeur de la publication");
    expect(mentions).toContain("6 rue des Morands, 71210 Saint-Eusèbe");
    expect(mentions).toContain("SIRET : 837 766 526 00029");
    expect(mentions).toContain("TVA non applicable, article 293 B du code général des impôts");
    expect(mentions).toMatch(/téléphone \+33 \d( \d\d){4}/);
    expect(mentions).toContain("contact@iletaituneclasse.com");
  });

  it("F14-AC37 — les conditions disent qui vend et que les prix sont sans TVA ; la confidentialité et le contrat nomment le même éditeur", () => {
    const conditions = texte(CONDITIONS);
    expect(conditions).toContain("édité et vendu par Yohann Coussot, entrepreneur individuel");
    expect(conditions).toContain("SIRET 837 766 526 00029");
    expect(conditions).toContain("Les prix sont en euros, sans TVA : TVA non applicable, article 293 B");
    expect(texte(CONFIDENTIALITE)).toContain("Le site est édité par Yohann Coussot, entrepreneur individuel");
    const contrat = modeleDe("contrat-de-sous-traitance")?.document;
    expect(contrat && texte(contrat)).toContain("Le sous-traitant : Yohann Coussot, entrepreneur individuel, 6 rue des Morands");
  });
});

describe("confidentialité et mesure", () => {
  it("F14-AC51 — la page dit ce qui est compté et par qui, sans témoin, et liste les témoins du site", () => {
    const page = texte(CONFIDENTIALITE);
    expect(page).toContain("Vercel compte les pages vues et la vitesse d’affichage, sans témoin");
    expect(page).toContain("Rien n’est mesuré dans l’espace des élèves, dans l’outil de l’adulte ni dans les livres lus en ligne");
    expect(page).toContain("la connexion de l’adulte");
    expect(page).toContain("la classe ouverte");
    expect(page).toContain("les écrans d’aide déjà vus");
    expect(page).not.toContain("aucune mesure d’audience");
  });
});
