/**
 * Supprime de la base LOCALE les comptes que les tests ont créés et n'ont pas pu
 * supprimer (lancement interrompu), avec leurs classes, leurs élèves et leurs projets.
 *
 *   npm run base:purger-essais
 *
 * Seules les adresses « parcours-<uuid>@exemple.test » et « essai-<uuid>@exemple.test »
 * sont visées : le compte de « npm run compte:local » reste.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { purgerComptesDEssai } from "../tests/comptes-d-essai";

config({ path: resolve(__dirname, "../.env.local"), quiet: true });

purgerComptesDEssai().then(
  (nombre) => console.log(nombre === 0 ? "Aucun compte d'essai dans la base locale." : `${nombre} compte(s) d'essai supprimé(s) de la base locale.`),
  (erreur: Error) => {
    console.error(erreur.message);
    process.exit(1);
  },
);
