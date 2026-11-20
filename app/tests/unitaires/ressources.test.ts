import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADRESSE_DU_GUIDE } from "@/domaine/pages-publiques";
import { ANCRES } from "@/domaine/guide";
import { DOCUMENTS_A_IMPRIMER, TEMPS_DU_PROJET, versionCompleteDe, vignetteDe } from "@/domaine/ressources";

// Les fichiers que sert le site, et les sources des documents à la racine du dépôt
const publics = path.join(process.cwd(), "public");
const existe = (adresse: string) => fs.existsSync(path.join(publics, adresse));

describe("Page « Ressources » (F14)", () => {
  it("F14-AC56 — chaque PDF et chaque vignette annoncés existent", () => {
    for (const d of DOCUMENTS_A_IMPRIMER) {
      expect(existe(vignetteDe(d)), vignetteDe(d)).toBe(true);
      expect(existe(versionCompleteDe(d)), versionCompleteDe(d)).toBe(true);
      expect(d.versions.map((v) => v.fichier)).toContain(versionCompleteDe(d));
      for (const v of d.versions) expect(existe(v.fichier), v.fichier).toBe(true);
    }
  });

  it("F14-AC56 — aucun fichier du dossier n'est oublié par la page", () => {
    const annonces = new Set(DOCUMENTS_A_IMPRIMER.flatMap((d) => [vignetteDe(d), ...d.versions.map((v) => v.fichier)]));
    for (const f of fs.readdirSync(path.join(publics, "ressources"))) expect(annonces, f).toContain(`/ressources/${f}`);
  });

  it("F14-AC55 — chaque ancre de la page est unique, et le renvoi du temps 4 mène à une question du guide", () => {
    const ancres = [...TEMPS_DU_PROJET.map((t) => t.cle), ...DOCUMENTS_A_IMPRIMER.map((d) => d.cle), "sommaire", "les-programmes"];
    expect(new Set(ancres).size).toBe(ancres.length);
    for (const t of TEMPS_DU_PROJET.filter((t) => t.renvoi)) {
      const [chemin, ancre] = t.renvoi!.adresse.split("#");
      expect(chemin).toBe(ADRESSE_DU_GUIDE);
      expect(ANCRES as readonly string[]).toContain(ancre);
    }
  });

  it("F14-AC57 — seule « J'écris sur le site » porte l'étiquette de l'outil", () => {
    expect(DOCUMENTS_A_IMPRIMER.filter((d) => d.avecLOutil).map((d) => d.cle)).toEqual(["sur-le-site"]);
  });

  it("F14-AC60 — chaque lien du déroulé vers un document mène à un PDF du site", () => {
    const deroule = fs.readFileSync(path.join(process.cwd(), "../ressources/deroule-du-projet/deroule-du-projet.html"), "utf8");
    const liens = [...deroule.matchAll(/href="https:\/\/iletaituneclasse\.com(\/ressources\/[^"]+)"/g)].map((m) => m[1]);
    expect(liens.length).toBeGreaterThan(10);
    for (const l of liens) expect(existe(l), l).toBe(true);
    expect(deroule).not.toContain("data-pdf");
  });
});
