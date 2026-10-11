# Application V1

Code de l'application, construit étape par étape d'après le
[plan de réalisation](../docs/plan.md). Les règles sont dans les
[spécifications](../docs/specifications.md), les choix techniques dans
[l'architecture](../docs/architecture.md#réalisation-de-létape-1-9-octobre-2026).

Next.js, React, TypeScript, Supabase (base, comptes). Versions figées dans
`package.json` ; `npm ci` les installe telles quelles.

## Où est quoi

| Dossier | Contenu |
| --- | --- |
| `src/domaine/` | Règles sans base : année scolaire, prénoms, identifiant, mot de passe, code, horaires ; plan du récit, visuels, préparation ; texte d'une scène et droits sur ses blocs (`copie.ts`), numéros du livre (`numeros.ts`). |
| `src/serveur/` | Ce qui parle à la base : accès, session de l'adulte, accès de poste, chiffrement ; lectures du récit (adulte, élève), images ; texte des scènes, enregistrement, numéros, scènes voisines (`copie.ts`). |
| `src/app/` | Pages : entrée enseignant, « Mes projets », « Mes classes », entrée des élèves ; préparation, atelier projeté, parties et chapitres, chapitre et ses chemins, scène ; histoire, chapitre et scène de l'élève. `copie/` : l'adresse où le texte s'enregistre. `images/` : celle qui sert une image à qui peut la voir. |
| `src/composants/copie/` | La copie d'une scène : l'éditeur (Plate, sur Slate), ses blocs, ses fiches, l'enregistrement automatique. `regles.ts` réunit tout ce qui s'écrit contre Slate. |
| `src/composants/`, `src/styles/` | Formes communes du système « Cahiers d'aventure ». |
| `supabase/migrations/` | Schéma, droits et règles d'accès de la base. |
| `tests/` | `unitaires`, `base` (contre une vraie base locale), `parcours` (dans un navigateur). |
| `scripts/` | Clés, base locale, sauvegarde, restauration, mise en production. |

## Travailler en local

Docker Desktop doit être ouvert : la base locale de Supabase y tourne.

```bash
npm ci
npm run cles            # une fois : clés locales et fichier production.env
npm run base:demarrer   # base locale (la première fois, quelques minutes)
npm run env:local       # écrit .env.local d'après la base locale
npm run compte:local    # un compte d'enseignant local ; mot de passe dans .compte-local
npm run dev             # http://localhost:3000
```

Les courriels de la base locale (« Mot de passe oublié ») arrivent dans
http://127.0.0.1:54324.

Pour essayer l'application sur un vrai récit, « Les passeurs de brume », l'histoire
de la maquette, se charge dans la base locale pour le compte local : sa classe
d'essai et ses vingt-cinq élèves fictifs, le carnet de préparation, le plan, les
consignes, les textes et les choix (contenu dans `scripts/passeurs-de-brume.ts`).

```bash
npm run histoire:essai                # 40 scènes, dont 15 attendent leur texte
npm run histoire:essai -- --complet   # toutes les scènes écrites
npm run histoire:essai -- --refaire   # la retire, avec ce qui y a été écrit, puis la recharge
```

La même histoire se charge dans la vraie base, pour un compte nommé, une fois son
schéma à jour. Sans `--oui`, la commande dit seulement ce qu'elle ferait. Le mot de
passe de la classe d'essai et les codes des élèves y sont tirés au hasard : ils se
lisent dans « Mes classes ».

```bash
npm run histoire:essai -- --production adresse@du.compte         # dit ce qui serait fait
npm run histoire:essai -- --production adresse@du.compte --oui   # le fait
```

## Vérifier

```bash
npm run verifier        # types, règles de code, tests du domaine et du chiffrement
npm run test:base       # droits et règles d'accès, contre la base locale
npm run test:parcours   # parcours joués dans Chromium, contre l'application compilée
npm run captures        # captures des écrans, dans test-results/captures/
```

Chaque test porte l'identifiant du critère d'acceptation qu'il vérifie
(`F06-AC73 — …`). Aucun ne parle à la vraie base : ils refusent de démarrer si
`.env.local` ne désigne pas la base locale.

Chaque test supprime les comptes qu'il a créés, avec leurs classes, leurs élèves
et leurs projets, et échoue s'il n'y parvient pas. Un lancement interrompu peut
en laisser dans la base locale, dont les identifiants de classe restent alors
pris :

```bash
npm run base:purger-essais   # supprime les comptes des tests, pas le compte local
```

## Visuels de l'application

Sans image choisie, un projet, une partie ou un chapitre porte un visuel de la
bibliothèque. Pour en ajouter un : déposer `public/illustrations/defaut-<clé>.jpg`
(format 3:2, 1 200 × 800) et sa vignette `defaut-<clé>-v.jpg` (480 × 320, par
`sips -z 320 480`), puis ajouter sa ligne dans `src/domaine/visuels.ts`. Un test
vérifie que chaque visuel de la liste a ses deux fichiers.

## Clés et secrets

Rien de secret n'est dans Git ni ne s'écrit dans une conversation.

- `production.env` : les clés de la vraie application. Cinq lignes se collent
  depuis Supabase, deux sont créées par `npm run cles`. Ce nom est voulu : Next.js
  chargerait de lui-même un fichier `.env.production.local`.
- `CLE_ACCES` chiffre les codes des élèves et les mots de passe de classe. **À
  garder aussi dans un gestionnaire de mots de passe** : sans elle, une sauvegarde
  ne rend pas les codes, et il faudrait en redonner un à chaque élève.
- `CLE_SIGNATURE_POSTES` signe les accès des postes d'élèves. Elle est importée
  une fois dans Supabase : `npm run cle:copier`, puis Project Settings > JWT Keys.

## Mettre en production

```bash
npm run production:schema            # montre les migrations à appliquer
npm run production:schema -- --oui   # les applique à la vraie base
npm run vercel:env                   # envoie les variables à Vercel, sans les afficher
npm run verifier:production          # contrôle la vraie base, sans rien y écrire
```

Vercel déploie à chaque `git push` sur `main` (dossier racine : `app`).

## Sauvegarder et restaurer

La base est en offre gratuite : aucune sauvegarde automatique. Docker Desktop
doit être ouvert.

```bash
npm run sauvegarder                                    # la vraie base
npm run restaurer -- sauvegardes/<date>                # essai : dans la base locale
npm run restaurer -- sauvegardes/<date> --production   # après un accident : dans la vraie base
```

- La sauvegarde écrit `roles.sql`, `schema.sql` et `donnees.sql` (données de
  l'application et comptes) dans `sauvegardes/<date>/`. Gardez ce dossier
  ailleurs que sur cet ordinateur.
- La restauration remet la base visée au schéma de l'application, puis y charge
  les données : **tout ce qui s'y trouvait est remplacé**. Vers la vraie base,
  elle demande de retaper le nom du dossier.
- Les secrets restaurés se relisent avec la même `CLE_ACCES` qu'à la sauvegarde.
- Un projet Supabase gratuit s'endort après une semaine sans activité : il se
  relance depuis sa console avant de sauvegarder.
- Les images de repérage importées (Supabase Storage, seau `images`) ne sont pas
  dans cette sauvegarde : gardez vos originaux.

Essayé le 9 octobre 2026 sur la base locale : sauvegarde, remise à zéro,
restauration, puis connexion du compte, relecture d'un code et d'un mot de passe
de classe, ouverture de la classe sur un poste. La restauration vers la vraie
base reste à essayer avant la première séance (étape 4 du plan).
