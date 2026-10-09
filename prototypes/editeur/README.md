# Prototype de l'éditeur — essai jetable

Essai autorisé le 2 octobre 2026 pour éprouver Plate sur les 14 points de
`V1/docs/architecture.md`. Aucun code d'ici n'a vocation à être repris ; les
verdicts et leurs réserves sont dans l'architecture, pas dans ce fichier.

```bash
npm install              # dépendances (MIT, Apache-2.0, BSD ; lightningcss en MPL-2.0)
npx playwright install chromium webkit
npm run dev              # http://localhost:4830
npm test                 # Vitest : contrôle « serveur », conflits, contenu réservé
npm run e2e              # Playwright : Chromium, WebKit, iPad émulé
```

- `src/modele.ts` : document d'une scène et fonctions communes (texte d'un bloc, droits, graphe).
- `src/validation.ts` : contrôle « côté serveur », sans lien avec l'éditeur.
- `src/serveur.ts` : faux serveur en mémoire (versions, copies de récupération, liaisons, numéros).
- `src/editeur/regles.ts` : règles branchées sur Plate — l'objet de l'essai.
- `?nu` dans l'adresse charge Plate sans ces règles, pour distinguer ses défauts des nôtres.
- Les deux tests WebKit qui lisent le presse-papiers échouent : Playwright n'y donne pas cet accès.
