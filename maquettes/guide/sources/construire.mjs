// Écrit les trois directions du guide : node sources/construire.mjs
import fs from "node:fs";
import path from "node:path";
import { racine } from "./commun.mjs";
import * as a from "./a-article.mjs";
import * as b from "./b-livre-jeu.mjs";
import * as c from "./c-aere.mjs";

for (const d of [a, b, c]) {
  fs.writeFileSync(path.join(racine, d.fichier), d.rendre());
  console.log("écrit", d.fichier);
}
