# Prototype de la chaîne PDF — essai jetable

Essai autorisé le 2 octobre 2026, réalisé le 3 octobre 2026, pour éprouver
Paged.js avec HTML/CSS et Chromium sur les 15 points de
`V1/docs/architecture.md`. Aucun code d'ici n'a vocation à être repris ; les
verdicts, les mesures et leurs réserves sont dans l'architecture, pas dans ce
fichier.

```bash
npm install          # MIT, Apache-2.0, ISC, BSD ; polices en OFL-1.1
npx playwright install chromium webkit
npm run livre        # fabrique le livre d'essai dans sorties/livre-essai/
npm run apercu       # aperçu : http://localhost:4832
npm run pdf          # sorties/livre-travail.pdf et sorties/livre-definitif.pdf
npm test             # 50 tests ; les mesures vont dans sorties/mesures.json
npm run pages 37 38  # captures de pages de l'aperçu dans sorties/captures/
```

Le livre utilisé est celui de `livre/livre.json` (avec ses images dans
`livre/images/`) s'il existe ; sinon le livre fabriqué, « Les passeurs de
brume » : 60 scènes en trois parties, 26 720 mots, 30 images dont 6 pleines
pages et 4 dessins peu définis, 5 phrases à deux renvois, 15 actions de jeu,
5 images en ligne, une feuille d'aventure. La commande d'export dit lequel a
servi.

- `src/texte.mjs` : forme du document d'une scène, recopiée du prototype de l'éditeur.
- `src/composer.mjs` : le livre → un seul HTML, pour l'aperçu et les deux PDF ; numéros, contrôles.
- `src/cesure.mjs` : césure française posée à la composition.
- `src/livre.css` : gabarit du livre, lu par Paged.js ; `src/coupures.css` : règles de coupure, lues par le navigateur.
- `public/greffon.js` : en-têtes, folios, marques de travail, rapport, et le contournement d'un défaut de Paged.js.
- `public/apercu.js` : la page d'aperçu ; avec `?rendu=1`, la même page sert de source au PDF.
- `src/export.mjs` : Chromium, impression, taille exacte des pages, mesures.
- `serveur.mjs` : état en mémoire, corrections, instantanés, exports.
- `outils/lire-pdf.mjs` : relecture d'un PDF pour les tests (lignes, images, polices).

Le test « aperçu sous WebKit » est marqué comme échec attendu : il reste
affiché d'une croix, c'est le résultat de l'essai et non une panne.
