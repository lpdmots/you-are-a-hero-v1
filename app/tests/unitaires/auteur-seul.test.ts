import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  ADRESSE_DE_L_AUTEUR_SEUL,
  CHAPEAU_DE_L_AUTEUR_SEUL,
  DESCRIPTION_DE_L_AUTEUR_SEUL,
  GRAND_TITRE_DE_L_AUTEUR_SEUL,
  LIEN_DE_L_AUTEUR_SEUL,
  AIDES_DE_L_IA,
  etoilesPourLAuteurSeul,
  POUR_COMMENCER,
  prixPourLAuteurSeul,
  TEMPS_DE_L_AUTEUR_SEUL,
  TITRE_DE_L_AUTEUR_SEUL,
} from "@/domaine/auteur-seul";
import { lireOffre } from "@/domaine/offre";
import { estPageMesuree, PAGES_PUBLIQUES } from "@/domaine/pages-publiques";
import { llmsTxt } from "@/domaine/presentation";
import { QUESTIONS } from "@/domaine/textes-publics";

const SITE = "https://iletaituneclasse.com";
const livreGratuit = lireOffre({ paiement_ouvert: true, livre_payant: false, prix_du_pass: 2000, prix_de_la_recharge: 500 });
const livrePayant = lireOffre({ paiement_ouvert: true, livre_payant: true, prix_du_pass: 2000, prix_de_la_recharge: 500 });
const source = (chemin: string) => readFileSync(join(process.cwd(), "src", chemin), "utf8");

afterEach(() => vi.unstubAllEnvs());

describe("la page de l'auteur seul", () => {
  it("F14-AC76 — une page pour l'auteur seul, limitée au livre-jeu, au mot-clé « créer un livre dont vous êtes le héros »", () => {
    expect(ADRESSE_DE_L_AUTEUR_SEUL).toBe("/creer-un-livre-dont-vous-etes-le-heros");
    expect(TITRE_DE_L_AUTEUR_SEUL).toMatch(/^Créer un livre dont vous êtes le héros/);
    expect(TITRE_DE_L_AUTEUR_SEUL.length).toBeLessThanOrEqual(60);
    expect(DESCRIPTION_DE_L_AUTEUR_SEUL.length).toBeLessThanOrEqual(160);
    expect(DESCRIPTION_DE_L_AUTEUR_SEUL).toContain("histoire interactive");
    // Ni le mot-clé du guide (« comment écrire… ») ni celui de l'accueil (« … avec sa classe »)
    expect(TITRE_DE_L_AUTEUR_SEUL).not.toMatch(/comment|classe/i);
    expect(TEMPS_DE_L_AUTEUR_SEUL.map((t) => t.titre)).toEqual(["Dessiner les chemins", "Écrire les scènes", "Composer le livre"]);
    // Limitée au livre-jeu : « Pour commencer » seul nomme l'histoire classique, sans détailler les écrans
    expect(POUR_COMMENCER).toBe("En créant le projet, indiquez que vous écrivez seul, puis la sorte de récit\u00a0: livre à choix ou histoire classique.");
    const textes = [TITRE_DE_L_AUTEUR_SEUL, GRAND_TITRE_DE_L_AUTEUR_SEUL, DESCRIPTION_DE_L_AUTEUR_SEUL, CHAPEAU_DE_L_AUTEUR_SEUL, ...TEMPS_DE_L_AUTEUR_SEUL.map((t) => t.phrase)].join(" ");
    expect(textes).not.toMatch(/histoire classique|roman|recueil|étincelle/i);
    // Rien qui fasse de l'auteur seul un second choix (retour du porteur, 24 novembre 2026)
    expect(POUR_COMMENCER).not.toMatch(/d’abord pour la classe/);
    // Le prix, lu dans les réglages comme sur l'« Aide »
    expect(prixPourLAuteurSeul(livreGratuit)).toBe("Gratuit, sans limite de scènes ni d’images, sans carte bancaire.");
    expect(prixPourLAuteurSeul(livrePayant)).toMatch(/^Gratuit jusqu’à \d+ scènes et \d+ images/);
    // L'IA un peu en avant : ses aides, en étoiles, jamais en « étincelles »
    expect(AIDES_DE_L_IA.map((a) => a.nom)).toEqual(["Proposer la suite", "Des idées de choix", "Une première version", "Relire", "Illustrer"]);
    expect(etoilesPourLAuteurSeul(livreGratuit)).toBe("Chaque demande coûte quelques étoiles : 30 offertes à l’inscription, puis 5\u00a0€ les 100. Tout le reste marche sans elles.");
    expect(AIDES_DE_L_IA.map((a) => a.phrase).join(" ")).not.toMatch(/étincelle|histoire classique/i);
    // Chaque capture existe, et sa version pour le téléphone, dans un dossier que les robots des IA lisent
    for (const { image } of TEMPS_DE_L_AUTEUR_SEUL) {
      for (const src of [image.src, image.telephone?.src].filter(Boolean) as string[]) {
        expect(() => readFileSync(join(process.cwd(), "public", src))).not.toThrow();
        // Sous l'adresse de la page, comme les documents des ressources : les robots des IA lisent l'une et l'autre
        expect(src.startsWith(`${ADRESSE_DE_L_AUTEUR_SEUL}/`)).toBe(true);
      }
    }
  });

  it("F14-AC76 — la page est publique : plan du site, robots, llms.txt et mesure d'audience", () => {
    vi.stubEnv("ADRESSE_SITE", SITE);
    expect(PAGES_PUBLIQUES).toContain(ADRESSE_DE_L_AUTEUR_SEUL);
    expect(estPageMesuree(ADRESSE_DE_L_AUTEUR_SEUL)).toBe(true);
    const entree = sitemap().find((u) => u.url === `${SITE}${ADRESSE_DE_L_AUTEUR_SEUL}`);
    expect(entree?.priority).toBe(0.5);
    const [, ia] = robots().rules as { allow: string[] }[];
    expect(ia.allow).toContain(ADRESSE_DE_L_AUTEUR_SEUL);
    expect(llmsTxt(livreGratuit, SITE)).toContain(`- [${TITRE_DE_L_AUTEUR_SEUL}](${SITE}${ADRESSE_DE_L_AUTEUR_SEUL}) : pour un adulte qui écrit seul son livre-jeu`);
  });

  it("F14-AC76 — jamais mise en avant : un lien au pied, dans « Commencer », et un sous la question de l'« Aide », rien d'autre", () => {
    const pied = source("app/(public)/layout.tsx");
    const tete = pied.slice(pied.indexOf("<header"), pied.indexOf("</header>"));
    const commencer = pied.slice(pied.indexOf(">Commencer<"), pied.indexOf(">Lire<"));
    expect(LIEN_DE_L_AUTEUR_SEUL).toBe("Écrire seul un livre-jeu");
    expect(commencer).toContain("{LIEN_DE_L_AUTEUR_SEUL}");
    expect(tete).not.toContain("AUTEUR_SEUL");
    expect(pied.match(/ADRESSE_DE_L_AUTEUR_SEUL\}/g)).toHaveLength(1);
    // Ni l'accueil ni sa vidéo n'y mènent
    expect(source("app/(public)/Accueil.tsx")).not.toMatch(/AUTEUR_SEUL|creer-un-livre-dont-vous-etes-le-heros/);
    // L'« Aide » y mène depuis la seule question qui la pose
    expect(QUESTIONS.filter((q) => q.seul).map((q) => q.question)).toEqual(["Peut-on écrire seul, sans classe ?"]);
  });
});
