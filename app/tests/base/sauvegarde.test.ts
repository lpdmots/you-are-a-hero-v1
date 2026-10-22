import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clientDuStockage, descendreLeSeau, remonterLeDossier } from "../../scripts/stockage";
import { creerEnseignant, creerProjet, nettoyer, service, type Adulte } from "./outils";

/**
 * Étape 9, lot 8 : la sauvegarde de la nuit et la restauration depuis S3 (F14-AC30, AC31), contre
 * la base locale. Le seau S3 n'est jamais appelé : la sauvegarde s'écrit dans un dossier, que le
 * workflow de GitHub dépose ensuite ; la restauration remonte un dossier dans le stockage.
 */

let laurent: Adulte;
let dossier: string;
beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  dossier = mkdtempSync(join(tmpdir(), "nuit-"));
});
afterAll(async () => {
  rmSync(dossier, { recursive: true, force: true });
  await nettoyer();
});

const stockage = () => clientDuStockage(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!);

describe("La sauvegarde de la nuit (F14-AC30)", () => {
  it("F14-AC30 — la base et les images partent dans un même dossier, à leurs chemins ; le workflow le dépose dans le seau vers 3 h, heure de Paris, même lancé en retard", async () => {
    const projet = (await creerProjet(laurent, "personnel", "choix", "La sauvegarde de minuit")).id;
    const chemin = `${laurent.id}/${projet}/nuit.jpg`;
    await service().storage.from("images").upload(chemin, Buffer.from("une image de la nuit"), { contentType: "image/jpeg" });

    execFileSync("npx", ["tsx", "scripts/sauvegarde-nocturne.ts", "--local", "--dossier", dossier], { cwd: resolve(__dirname, "../.."), stdio: "pipe" });
    expect(readFileSync(join(dossier, "base", "donnees.sql"), "utf8")).toContain("La sauvegarde de minuit");
    expect(readFileSync(join(dossier, "images", chemin), "utf8")).toBe("une image de la nuit");

    const workflow = readFileSync(resolve(__dirname, "../../../.github/workflows/sauvegarde-nocturne.yml"), "utf8");
    // Un seul déclenchement, à 1 h 17 en temps universel, qui sauvegarde à son arrivée : GitHub
    // lance parfois la tâche avec des heures de retard (22 octobre 2026)
    expect(workflow).toContain('cron: "17 1 * * *"');
    expect(workflow.match(/cron:/g)).toHaveLength(1);
    expect(workflow).not.toContain("TZ=Europe/Paris date +%H");
    // Le nettoyage part de la racine : il ne bloque pas quand le dossier app manque
    expect(workflow).toContain('rm -rf app/production.env app/supabase/signing_keys.json "$RUNNER_TEMP/sauvegarde"');
    expect(workflow).toContain("npm run sauvegarde:nuit");
    expect(workflow).toContain('aws s3 cp "$RUNNER_TEMP/sauvegarde" "s3://$SEAU_S3/$jour/" --recursive');
    expect(workflow).toContain("AWS_DEFAULT_REGION: eu-west-3");
  }, 240_000);
});

describe("La restauration depuis S3 (F14-AC31)", () => {
  it("F14-AC31 — les images d'une sauvegarde reviennent à leurs chemins, telles qu'elles étaient", async () => {
    const projet = (await creerProjet(laurent, "personnel", "choix", "Le retour")).id;
    const depuis = mkdtempSync(join(tmpdir(), "s3-"));
    try {
      const chemin = `${laurent.id}/${projet}/propositions/retour.png`;
      mkdirSync(join(depuis, laurent.id, projet, "propositions"), { recursive: true });
      writeFileSync(join(depuis, chemin), "une image d'avant l'accident");
      // Une image changée depuis la sauvegarde reprend son état de la nuit
      await service().storage.from("images").upload(chemin, Buffer.from("abîmée"), { contentType: "image/png" });
      expect(await remonterLeDossier(stockage(), "images", depuis)).toBe(1);
      const { data } = await service().storage.from("images").download(chemin);
      expect(await data!.text()).toBe("une image d'avant l'accident");

      // Descendre puis remonter rend le même fichier
      const aller = mkdtempSync(join(tmpdir(), "seau-"));
      await descendreLeSeau(stockage(), "images", aller);
      expect(readFileSync(join(aller, chemin), "utf8")).toBe("une image d'avant l'accident");
      rmSync(aller, { recursive: true, force: true });
      // Le sous-dossier « propositions » n'est pas nettoyé avec le compte : on retire le fichier ici
      await service().storage.from("images").remove([chemin]);
    } finally {
      rmSync(depuis, { recursive: true, force: true });
    }
  }, 120_000);
});
