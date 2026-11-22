import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { donneesDesTutos, llmsTxt } from "@/domaine/presentation";
import {
  afficheDe, AIDE_MISE_A_JOUR_LE, CLE_INVITATION_IA, dureeIso, dureeLisible, HORS_SERIE_POSEES, invitationALaVideoIa, numeroDe, sousTitresDe, TEMPS_DES_TUTOS, TUTOS,
  TUTOS_POSES, tutoSuivant, tutosDeLEcran, VIDEO_IA, videoDe,
} from "@/domaine/tutos";
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
    // Aucun fichier du dossier qui ne soit d'un tuto posé ou d'une vidéo hors série (un rendu en attente reste dans V1/video/rendus/)
    const annonces = new Set([...TUTOS_POSES, ...HORS_SERIE_POSEES].flatMap((t) => [videoDe(t), sousTitresDe(t), afficheDe(t)]));
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
    expect(graphe).toHaveLength(TUTOS_POSES.length + HORS_SERIE_POSEES.length);
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
    expect(sitemap().find((u) => u.url.endsWith("/aide"))?.lastModified).toBe(AIDE_MISE_A_JOUR_LE);
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

  it("F14-AC68 — « Gagner du temps avec l'IA » : hors série, sans numéro ni suite, ses trois fichiers servis par le site, son VideoObject", () => {
    expect(VIDEO_IA).toMatchObject({ titre: "Gagner du temps avec l’IA", secondes: 153, horsSerie: true, pose: true });
    expect(dureeLisible(VIDEO_IA)).toBe("2 min 33");
    // Hors de la série : les onze gardent leurs numéros, la vidéo n'en a pas et rien ne la suit
    expect(cles(TUTOS)).not.toContain(VIDEO_IA.cle);
    expect(numeroDe(VIDEO_IA)).toBe(0);
    expect(tutoSuivant(VIDEO_IA)).toBeNull();
    expect([videoDe(VIDEO_IA), sousTitresDe(VIDEO_IA), afficheDe(VIDEO_IA)]).toEqual(["/tutos/aides-ia.mp4", "/tutos/aides-ia.vtt", "/tutos/aides-ia.webp"]);
    for (const f of [videoDe(VIDEO_IA), sousTitresDe(VIDEO_IA), afficheDe(VIDEO_IA)]) expect(existe(f), f).toBe(true);
    expect(fs.readFileSync(path.join(publics, sousTitresDe(VIDEO_IA)), "utf8").startsWith("WEBVTT")).toBe(true);
    const site = "https://iletaituneclasse.com";
    const graphe = donneesDesTutos(site)["@graph"] as Record<string, unknown>[];
    expect(graphe.at(-1)).toMatchObject({
      "@type": "VideoObject",
      "@id": `${site}/aide#video-aides-ia`,
      name: "Gagner du temps avec l’IA",
      contentUrl: `${site}/tutos/aides-ia.mp4`,
      thumbnailUrl: `${site}/tutos/aides-ia.webp`,
      duration: "PT2M33S",
      uploadDate: VIDEO_IA.poseeLe,
    });
    // Le mot du porteur : « étoile », jamais « étincelles »
    expect(VIDEO_IA.description).toContain("étoiles");
    expect(VIDEO_IA.description).not.toMatch(/étincelle/i);
    expect(llmsTxt({ livrePayant: false, paiementOuvert: false, etoilesOffertes: 30 } as Offre, site)).toContain("les aides de l’IA");
    expect(AIDE_MISE_A_JOUR_LE >= VIDEO_IA.poseeLe).toBe(true);
  });

  it("F14-AC69 — « Mon compte » et l'aparté de l'accueil montrent la vidéo, l'accueil par un lien seulement", () => {
    const source = (f: string) => fs.readFileSync(path.join(process.cwd(), "src", f), "utf8");
    const compte = source("app/(adulte)/compte/MonCompte.tsx");
    expect(compte).toContain("<VignettesDeTuto tutos={[VIDEO_IA]} />");
    const accueil = source("app/(public)/Accueil.tsx");
    // Un lien sous l'aparté, rien de plus : ni affiche ni carte de la vidéo sur l'accueil
    expect(accueil.match(/VIDEO_IA\}/g)).toHaveLength(1);
    expect(accueil).toContain('<BoutonTuto tuto={VIDEO_IA} forme="lien"');
    expect(accueil).not.toContain("afficheDe(VIDEO_IA)");
    // Le dialogue de recharge reste sans vidéo (écarté le 21 novembre 2026)
    expect(source("composants/PlusDEtoiles.tsx")).not.toContain("VIDEO_IA");
  });

  it("F14-AC70 — l'invitation : pour qui a un projet et n'a utilisé aucune aide ; jamais le créateur, ni aides éteintes, ni après « Ne plus afficher »", () => {
    const neuf = { createur: false, aidesProposees: true, aidesMasquees: ["classes", "plan"], aUnProjet: true, aideUtilisee: false };
    expect(invitationALaVideoIa(neuf)).toBe(true);
    expect(invitationALaVideoIa({ ...neuf, aideUtilisee: true })).toBe(false);
    expect(invitationALaVideoIa({ ...neuf, aUnProjet: false })).toBe(false);
    expect(invitationALaVideoIa({ ...neuf, aidesProposees: false })).toBe(false);
    expect(invitationALaVideoIa({ ...neuf, createur: true })).toBe(false);
    expect(invitationALaVideoIa({ ...neuf, aidesMasquees: [CLE_INVITATION_IA] })).toBe(false);
    // La clé se garde avec les écrans d'aide masqués du compte, sans migration : elle en respecte la forme
    expect(CLE_INVITATION_IA).toMatch(/^[a-z-]{1,30}$/);
  });

  it("F14-AC71 — l'invitation ne paraît que dans l'espace de l'adulte, à un seul endroit, sans rien ouvrir seule", () => {
    const racine = path.join(process.cwd(), "src");
    const fichiers = (dossier: string): string[] =>
      fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(path.join(dossier, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dossier, e.name)] : []));
    const qui = fichiers(racine)
      .filter((f) => fs.readFileSync(f, "utf8").includes("<InvitationVideoIa"))
      .map((f) => path.relative(racine, f));
    // La colonne de l'adulte, et elle seule : ni l'élève (/classe, /travail), ni le lecteur (/lire), ni les pages publiques
    expect(qui).toEqual(["composants/EspaceAdulte.tsx"]);
    const invitation = fs.readFileSync(path.join(racine, "composants/InvitationVideoIa.tsx"), "utf8");
    // Elle n'ouvre la vidéo qu'au clic : aucune ouverture dans un effet, aucune lecture automatique
    expect(invitation.match(/ouvrir\(VIDEO_IA\)/g)).toHaveLength(1);
    expect(invitation).toContain("onClick={() => ouvrir(VIDEO_IA)}");
    expect(fs.readFileSync(path.join(racine, "composants/Tutos.tsx"), "utf8")).not.toMatch(/autoPlay/);
  });
});
