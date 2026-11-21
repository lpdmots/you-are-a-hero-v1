import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { donneesDesTutos, llmsTxt } from "@/domaine/presentation";
import { afficheDe, dureeIso, dureeLisible, numeroDe, sousTitresDe, TEMPS_DES_TUTOS, TUTOS, TUTOS_POSES, TUTOS_POSES_LE, tutoSuivant, tutosDeLEcran, videoDe } from "@/domaine/tutos";
import type { Offre } from "@/domaine/offre";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const publics = path.join(process.cwd(), "public");
const existe = (adresse: string) => fs.existsSync(path.join(publics, adresse));
const cles = (t: { cle: string }[]) => t.map((x) => x.cle);

describe("Tutos vidéo de l'« Aide » (F14)", () => {
  it("F14-AC62 — onze tutos, par étape du projet, rangés en quatre temps, les tutos 5 et 9 en récit à choix", () => {
    expect(TUTOS.map((t) => t.titre)).toEqual([
      "Donner l’accès aux élèves", "Créer un projet", "Préparer son histoire", "Parties et chapitres", "Construire les chemins",
      "Faire écrire la classe", "Relire et valider", "Relire le livre", "Vérifier les chemins", "Mettre en page", "Imprimer et partager",
    ]);
    // Les temps se suivent dans l'ordre de la série : jamais un tuto d'un temps antérieur après un temps suivant
    const rangs = TUTOS.map((t) => TEMPS_DES_TUTOS.findIndex((x) => x.cle === t.temps));
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
    expect(new Set(rangs).size).toBe(4);
    expect(TUTOS.filter((t) => t.aChoix).map(numeroDe)).toEqual([5, 9]);
    expect(dureeLisible(TUTOS[0])).toBe("1 min 22");
    expect(dureeLisible({ ...TUTOS[0], secondes: 60 })).toBe("1 min");
  });

  it("F14-AC63 — chaque tuto posé a sa vidéo, ses sous-titres et son affiche servis par le site, et le suivant se propose", () => {
    for (const t of TUTOS_POSES) {
      for (const f of [videoDe(t), sousTitresDe(t), afficheDe(t)]) expect(existe(f), f).toBe(true);
      expect(fs.readFileSync(path.join(publics, sousTitresDe(t)), "utf8").startsWith("WEBVTT"), sousTitresDe(t)).toBe(true);
    }
    // Aucun fichier du dossier qui ne soit d'un tuto posé (un rendu en attente reste dans V1/video/rendus/)
    const annonces = new Set(TUTOS_POSES.flatMap((t) => [videoDe(t), sousTitresDe(t), afficheDe(t)]));
    for (const f of fs.readdirSync(path.join(publics, "tutos"))) expect(annonces, f).toContain(`/tutos/${f}`);
    expect(tutoSuivant(TUTOS[3])?.titre).toBe("Construire les chemins");
    // Le même tuto, passé du serveur au client (une copie), garde son numéro et sa suite
    expect(numeroDe({ ...TUTOS[3] })).toBe(4);
    expect(tutoSuivant({ ...TUTOS[3] })?.cle).toBe("chemins");
    expect(tutoSuivant(TUTOS_POSES[TUTOS_POSES.length - 1])).toBeNull();
  });

  it("F14-AC64 — un VideoObject par tuto posé, et llms.txt cite les tutos", () => {
    const site = "https://iletaituneclasse.com";
    const graphe = donneesDesTutos(site)["@graph"] as Record<string, unknown>[];
    expect(graphe).toHaveLength(TUTOS_POSES.length);
    const parties = graphe[3];
    expect(parties).toMatchObject({
      "@type": "VideoObject",
      name: "Tuto 4 · Parties et chapitres",
      contentUrl: `${site}/tutos/tuto-parties.mp4`,
      thumbnailUrl: `${site}/tutos/tuto-parties.webp`,
      duration: dureeIso(TUTOS[3]),
      inLanguage: "fr-FR",
    });
    expect(dureeIso(TUTOS[3])).toBe("PT1M26S");
    for (const v of graphe) expect(String(v.description).length).toBeGreaterThan(40);
    expect(llmsTxt({ livrePayant: false, paiementOuvert: false, etoilesOffertes: 30 } as Offre, site)).toContain("un tuto vidéo");
  });

  it("F14-AC64 — les vidéos ouvertes aux moteurs et aux robots des IA, gardées par le navigateur, l'« Aide » datée", async () => {
    const { rules } = robots();
    const [tous, ia] = Array.isArray(rules) ? rules : [rules];
    expect(tous.disallow).not.toEqual(expect.arrayContaining(["/tutos/"]));
    expect(ia.allow).toContain("/tutos/");
    expect(sitemap().find((u) => u.url.endsWith("/aide"))?.lastModified).toBe(TUTOS_POSES_LE);
    // Pas de « private, no-store » sur les tutos, comme sur la visite de l'accueil
    const { default: config } = await import("../../next.config");
    const privees = (await config.headers!()).find((h) => h.headers.some((x) => x.value === "private, no-store"))!;
    const regle = new RegExp(`^${privees.source.replace(/^\//, "\\/")}$`);
    expect(regle.test("/tutos/tuto-parties.mp4")).toBe(false);
    expect(regle.test("/accueil/visite-fr.mp4")).toBe(false);
    expect(regle.test("/projets")).toBe(true);
  });

  it("F14-AC65 — chaque écran d'aide montre le tuto de son étape, selon le projet", () => {
    const classeAChoix = { aChoix: true, deClasse: true };
    expect(cles(tutosDeLEcran("classes"))).toEqual(["acces-eleves"]);
    expect(cles(tutosDeLEcran("preparation", classeAChoix))).toEqual(["preparer"]);
    expect(cles(tutosDeLEcran("plan", classeAChoix))).toEqual(["parties", "chemins"]);
    expect(cles(tutosDeLEcran("suivi", classeAChoix))).toEqual(["ecrire", "relire"]);
    expect(cles(tutosDeLEcran("livre-relire", classeAChoix))).toEqual(["relire-livre"]);
    expect(cles(tutosDeLEcran("livre-chemins", classeAChoix))).toEqual(["verifier-chemins"]);
    // Un récit classique : ni « Construire les chemins » ; un projet personnel : pas les tutos de la classe
    expect(cles(tutosDeLEcran("plan", { aChoix: false, deClasse: true }))).toEqual(["parties"]);
    expect(cles(tutosDeLEcran("suivi", { aChoix: true, deClasse: false }))).toEqual([]);
  });

  it("F14-AC66 — les étapes sans écran d'aide ont leur tuto : création d'un projet, « Mettre en page », « Imprimer et partager »", () => {
    expect(cles(tutosDeLEcran("projets-vide"))).toEqual(["creer-un-projet"]);
    expect(cles(tutosDeLEcran("livre-page"))).toEqual(["mettre-en-page"]);
    const sortie = TUTOS.find((t) => t.ecran === "livre-sortie")!;
    expect(cles(tutosDeLEcran("livre-sortie"))).toEqual(sortie.pose ? ["imprimer-partager"] : []);
    // Chaque tuto a son écran, et chaque écran au moins un tuto
    expect(new Set(TUTOS.map((t) => t.ecran)).size).toBe(9);
  });

  it("F14-AC67 — un tuto non posé ne paraît nulle part", () => {
    for (const t of TUTOS.filter((x) => !x.pose)) {
      expect(cles(TUTOS_POSES)).not.toContain(t.cle);
      expect(cles(tutosDeLEcran(t.ecran))).not.toContain(t.cle);
      expect(JSON.stringify(donneesDesTutos("https://iletaituneclasse.com"))).not.toContain(t.cle);
    }
  });
});
