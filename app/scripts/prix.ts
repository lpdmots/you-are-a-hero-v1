/**
 * Les prix de l'offre (F14-AC21), lus ou changés dans `reglages_application`, le seul endroit où
 * ils vivent : l'accueil, l'offre de l'application et la page de Stripe les relisent d'eux-mêmes.
 * Les montants se donnent en euros.
 *
 *   npm run prix                                            les prix de la base locale
 *   npm run prix -- --pass 1                                le pass à 1 €, dans la base locale
 *   npm run prix -- --production                            les prix de la vraie base
 *   npm run prix -- --production --pass 1                   dit ce qui serait fait dans la vraie base
 *   npm run prix -- --production --pass 1 --oui             le fait
 *
 * Aussi : `--recharge 5`. Stripe refuse un paiement de moins de 0,50 €.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { adresseDeProduction, masquer, racine } from "./base-de-production";

const options = process.argv.slice(2);
const production = options.includes("--production");
const oui = options.includes("--oui");
const locale = (adresse: string) => /^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(adresse);

/** « --pass 1 » ou « --pass 1,50 » : des centimes ; rien si l'option manque. */
function montant(nom: string): number | undefined {
  const i = options.indexOf(`--${nom}`);
  if (i < 0) return undefined;
  const euros = Number(String(options[i + 1] ?? "").replace(",", "."));
  if (!Number.isFinite(euros) || euros < 0.5 || euros > 1000) {
    console.error(`--${nom} attend un prix en euros, de 0,50 à 1 000 (Stripe refuse moins de 0,50 €).`);
    process.exit(1);
  }
  return Math.round(euros * 100);
}

const euros = (centimes: number) => `${(centimes / 100).toFixed(2).replace(".", ",").replace(",00", "")} €`;

let adresseBase: string;
if (production) {
  adresseBase = adresseDeProduction();
} else {
  config({ path: resolve(racine, ".env.local"), quiet: true });
  adresseBase = process.env.BASE_LOCALE_URL ?? "";
  if (!locale(adresseBase)) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}

async function principal() {
  const pass = montant("pass");
  const recharge = montant("recharge");
  const ou = production ? "la vraie base" : "la base locale";
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  try {
    const lire = async () =>
      (
        await base.query<{ prix_du_pass: number; etoiles_du_pass: number; prix_de_la_recharge: number; etoiles_de_la_recharge: number; paiement_ouvert: boolean }>(
          "select prix_du_pass, etoiles_du_pass, prix_de_la_recharge, etoiles_de_la_recharge, paiement_ouvert from public.reglages_application",
        )
      ).rows[0];
    const dire = (r: Awaited<ReturnType<typeof lire>>) =>
      `pass ${euros(r.prix_du_pass)} (${r.etoiles_du_pass} ✦), recharge ${euros(r.prix_de_la_recharge)} (${r.etoiles_de_la_recharge} ✦), « Paiement ouvert » ${r.paiement_ouvert ? "allumé" : "éteint"}`;
    const avant = await lire();
    if (pass === undefined && recharge === undefined) {
      console.log(`Dans ${ou} : ${dire(avant)}.`);
      return;
    }
    const apres = { ...avant, prix_du_pass: pass ?? avant.prix_du_pass, prix_de_la_recharge: recharge ?? avant.prix_de_la_recharge };
    if (production && !oui) {
      console.log(`Dans ${ou}, aujourd'hui : ${dire(avant)}.\nSerait : ${dire(apres)}. Ajoutez « --oui » pour le faire.`);
      return;
    }
    await base.query("update public.reglages_application set prix_du_pass = $1, prix_de_la_recharge = $2", [apres.prix_du_pass, apres.prix_de_la_recharge]);
    console.log(`Dans ${ou} : ${dire(await lire())}.`);
  } catch (erreur) {
    console.error(masquer(erreur instanceof Error ? erreur.message : String(erreur)));
    process.exit(1);
  } finally {
    await base.end();
  }
}

principal();
