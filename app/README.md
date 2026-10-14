# Application V1

Code de l'application, construit étape par étape d'après le
[plan de réalisation](../docs/plan.md). Les règles sont dans les
[spécifications](../docs/specifications.md), les choix techniques dans
[l'architecture](../docs/architecture.md#réalisation-de-létape-1-9-octobre-2026).

Next.js, React, TypeScript, Supabase (base, comptes) ; Plate pour l'éditeur,
React Flow et dagre pour la vue « Chemins ». Versions figées dans
`package.json` ; `npm ci` les installe telles quelles.

## Où est quoi

| Dossier | Contenu |
| --- | --- |
| `src/domaine/` | Règles sans base : année scolaire, prénoms, identifiant, mot de passe, code, horaires ; plan du récit, visuels, préparation ; texte d'une scène et droits sur ses blocs (`copie.ts`), numéros du livre (`numeros.ts`), chemins d'un chapitre et ce qu'il y a « à regarder » (`chemins.ts`) ; états d'une scène, ce qu'ils changent et où ils se choisissent (`etats.ts`) ; « Mon travail », par urgence (`travail.ts`) ; ce que le Suivi liste, compte et propose (`suivi.ts`) ; fiches de rédaction : ce qui se choisit, les feuilles, le partage, le nombre fixé (`fiches.ts`) ; encouragements : totaux et classement par catégorie (`encouragements.ts`) ; contrôles du livre : chaque point, sa gravité, son étape et sa phrase (`controles.ts`) ; la destination Livre : marques des étapes, tâches, avertissements acceptés (`livre.ts`) ; ce qu'une lecture reçoit d'un livre, son parcours, son énigme, sa feuille (`lecture.ts`). |
| `src/serveur/` | Ce qui parle à la base : accès, session de l'adulte, accès de poste, chiffrement ; lectures du récit (adulte, élève), images ; texte des scènes, enregistrement, numéros, scènes voisines (`copie.ts`) ; état, remises et remarques d'une scène (`relecture.ts`) ; ce qu'une fiche de rédaction imprime d'une scène (`fiches.ts`) ; encouragements de l'adulte, et ce que le poste d'un élève en reçoit (`encouragements.ts`) ; ce que les contrôles du livre et la destination Livre lisent (`controles.ts`). |
| `src/app/` | Pages : entrée enseignant, « Mes projets », « Mes classes », entrée des élèves ; préparation, atelier projeté, parties et chapitres, chapitre et ses chemins, scène, Suivi (`_suivi/`), fiches de rédaction (`fiches/`), destination Livre (`_livre/`), lecture d'essai (`lecture/`) ; histoire, chapitre et scène de l'élève, sa lecture d'essai (`travail/lecture/`). `travail/actions.ts` : ce que fait un élève (prendre, rendre, remettre, retirer sa remise). `copie/` : l'adresse où le texte s'enregistre. `images/` : celle qui sert une image à qui peut la voir. |
| `src/composants/copie/` | La copie d'une scène : l'éditeur (Plate, sur Slate), ses blocs, ses fiches, l'enregistrement automatique. `regles.ts` réunit tout ce qui s'écrit contre Slate. |
| `src/composants/chemins/` | Le schéma de la vue « Chemins » : la place des cartes et le tracé des traits (`disposer.ts`, avec dagre), leur dessin (`Schema.tsx`, avec React Flow). Chargé seulement à l'ouverture de la vue, sur un écran large. |
| `src/composants/lecture/` | La lecture d'un livre, passage après passage : le passage et ses phrases de choix, l'énigme, la feuille d'aventure et le dé, le parcours. Celle de la lecture d'essai, et plus tard du lecteur en ligne ; elle ne charge pas l'éditeur. |
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

Pour juger la vue « Chemins » sur autre chose que des chemins très simples, un
chapitre d'essai s'ajoute à cette histoire, dans la base locale seulement : « Le
marais des feux follets », trente-deux scènes et quarante-neuf choix — chemins qui
se rejoignent, retours en arrière, deux fins, un lien caché, deux sorties vers
d'autres chapitres, et chaque cas « à regarder » (contenu dans
`scripts/marais-des-feux-follets.ts`). Il ajoute un choix à la fin de S025, pour
qu'un chemin y arrive.

```bash
npm run chemins:essai                # l'ajoute à « Les passeurs de brume »
npm run chemins:essai -- --refaire   # le retire, avec ce qui y a été écrit, puis le recharge
npm run chemins:essai -- --retirer   # le retire seulement
```

Pour juger « Vérifier les chemins » (destination Livre), un petit livre où figure
chaque cas des contrôles se charge dans la base locale, pour le compte local : « Le
phare aux énigmes », projet personnel de quinze scènes — impasse, choix sans
destination, vers une scène supprimée ou exclue, scène prête mais vide, énigme sans
autre issue au numéro impossible, boucle sans fin, scène où rien ne mène, scène à
finir, actions de jeu sans feuille (contenu dans `scripts/livre-d-essai.ts`).

```bash
npm run livre:essai                # le charge
npm run livre:essai -- --refaire   # le retire, avec ce qui y a été écrit, puis le recharge
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
- Les images importées (Supabase Storage, seau `images`) ne sont pas dans cette
  sauvegarde : gardez vos originaux. La base n'en garde que la liste. En local, où
  la restauration remet la base à zéro, la commande met cette liste de côté avant
  et la remet après, les fichiers restant sur le disque ; dans la vraie base,
  elle n'y touche pas.

Essayé le 9 octobre 2026 sur la base locale : sauvegarde, remise à zéro,
restauration, puis connexion du compte, relecture d'un code et d'un mot de passe
de classe, ouverture de la classe sur un poste. Essayé de nouveau le 13 octobre
2026, avec le schéma de l'étape 4 (plan du récit, textes, remises, remarques,
encouragements) : la base locale revient à l'identique, et les codes et le mot
de passe de la classe d'essai se relisent. La restauration vers la vraie base n'a
jamais été jouée : voir « La vraie base », plus bas.

## Jouer une séance d'essai, puis restaurer (fin de l'étape 4)

L'étape 4 du plan se termine quand une séance entière a été jouée avec plusieurs
comptes d'élèves, de la prise d'une scène à sa validation, puis que la base a été
restaurée depuis une sauvegarde. Tout se joue en local, sur « Les passeurs de
brume » et sa classe d'essai ; la vraie base n'est pas touchée.

**1. Avant la séance : une sauvegarde.**

```bash
npm run sauvegarder -- --local    # écrit sauvegardes/<date>-locale/
```

**2. Les postes.** Un poste est un navigateur : il garde la classe ouverte et
l'élève identifié.

- L'enseignant : le navigateur habituel, sur http://localhost:4840, avec le compte
  local. « Mes classes » > « CM1-CM2 d'essai » donne l'identifiant et le mot de
  passe de la classe, et le code de chaque élève (« Afficher »).
- Chaque élève : un autre navigateur (Safari, Firefox), ou une fenêtre de
  navigation privée, sur http://localhost:4840/classe. Toutes les fenêtres
  privées d'un même navigateur comptent pour un seul poste. Sur un même poste,
  « Changer d'élève » passe au suivant, comme en salle informatique.

**3. La séance,** de la prise d'une scène à sa validation. Deux élèves d'un même
chapitre suffisent : Chloé, Dylan et Emma écrivent « Le dernier bac », où S006
n'est pas encore prise ; Farah, Gabin, Hugo et Jade, « Le gué des saules », où il
en reste une aussi.

| Qui | Geste | Ce qui doit se voir |
|---|---|---|
| Élève A | « Mon travail » > son chapitre : coche une scène « Pas encore prise », « Je m'en occupe » | La scène est à son nom, chez lui, chez son camarade et au Suivi |
| Élève B | Ouvre la scène que A vient de prendre | Il la lit, sans pouvoir y écrire ; il peut la reprendre à son nom, et A en est averti |
| Élève A | Écrit, puis « Remettre à … » | « À valider » ; il ne peut plus écrire, sauf « Modifier encore mon texte » |
| Enseignant | Suivi > « À valider » > « Relire » | Le texte remis, la fiche « Votre relecture » |
| Enseignant | « Demander une reprise… », avec une remarque | « À reprendre » ; la scène suivante à valider est proposée |
| Élève A | « Mon travail » : la scène est en tête ; « Reprendre mon texte » | La remarque seule, en grand, puis « J'ai lu, j'écris » |
| Élève A | Corrige, remet | « À valider » de nouveau ; les deux remises se lisent chez l'enseignant |
| Enseignant | « Valider le travail élève », puis un tampon d'encouragement | « Validé » ; chez l'élève, « Validé. Bravo ! » et son tampon |
| Enseignant | « Prête pour le livre » | Le rappel de ce qui manque, puis « Prête » |
| Enseignant | Suivi > « Imprimer les fiches de rédaction », « par élève » | Une feuille par élève ; les scènes sans élève à répartir |
| Enseignant | Suivi > « Élèves » : « Montrer le classement aux élèves » | Chez les élèves, les trois premiers et leur propre total |

`npx playwright test seance` joue le même enchaînement à trois postes, sans rien
semer en cours de route.

**4. Après la séance : la restauration.**

```bash
npm run restaurer -- sauvegardes/<date>-locale
```

La base locale est remise à zéro, puis rechargée : le compte local, la classe
d'essai et l'histoire reviennent comme ils étaient à la sauvegarde, et ce que la
séance a écrit n'y est plus. À vérifier ensuite : le compte local se connecte,
la classe s'ouvre sur un poste avec son mot de passe, un élève entre avec son
code, et la scène prise pendant la séance est de nouveau « Pas encore prise ».
Les images importées s'affichent toujours ; une image importée pendant la séance
n'est plus dans l'histoire.

**La vraie base.** `npm run restaurer -- sauvegardes/<date> --production`
commence par porter dans la vraie base le schéma de l'application, donc toute
migration qui n'y est pas encore : tant que l'étape 4 n'est pas en ligne, la
restaurer y appliquerait ses quatre migrations avant le code qui s'en sert. La
restauration de la vraie base se fait donc au moment de mettre l'étape 4 en
ligne, dans cet ordre : `npm run sauvegarder`, `npm run production:schema --
--oui`, mise en ligne du code, puis, pour l'essai, `npm run restaurer --
sauvegardes/<date> --production`.

## Essayer l'étape 5 : vérifier les chemins et lire à l'essai

L'étape 5 du plan se termine quand le porteur a lu son récit de bout en bout et
corrigé ce que les contrôles signalaient, et qu'un élève a lu ses chapitres. Tout
se joue en local, sur http://localhost:4840, avec le compte local ; la vraie base
n'est pas touchée.

**1. Les livres d'essai.** Les deux migrations de l'étape
(`verifier_les_chemins`, `lecture_du_poste`) doivent être dans la base locale :
`npx tsx scripts/supabase.ts migration up --local` les applique sans rien effacer.

```bash
npm run livre:essai -- --refaire        # « Le phare aux énigmes » : chaque cas des contrôles
npm run histoire:essai -- --refaire     # « Les passeurs de brume », sa classe et ses élèves
npm run chemins:essai -- --refaire      # le marais, trente-deux scènes, dans ce même livre
```

**2. Côté enseignant, dans « Le phare aux énigmes ».** Onglet « Livre » : l'aide
s'ouvre sur « Vérifier les chemins » (« Ne plus afficher » la range, « Aide » la
rouvre).

| Tâche | Ce qui doit se voir | Ce qu'on y fait |
|---|---|---|
| Départ et fins | « Cette scène est une impasse. » (S010) | « Marquer comme fin », ou « Ouvrir la scène » pour y ajouter un choix |
| Choix à relier | un choix sans destination (S002), vers une scène supprimée et vers une scène hors du livre (S003), une énigme au numéro impossible (S004) | « Ouvrir la scène » : la scène s'ouvre sur le choix, son panneau ouvert ; « Retour au Livre » |
| Passages à confirmer | S011, où rien ne mène, « et 1 scène qui n'a pas d'autre accès » ; une boucle sans fin (S008) ; une énigme sans autre issue (S004) | « C'est voulu », puis « 3 acceptés · Revoir » ; « Voir dans les chemins » ouvre le chapitre, la scène désignée |
| Tester la lecture | « Tester la lecture », puis « J'ai vérifié les chemins » | la déclaration attend qu'il ne reste ni point à traiter ni scène à finir (S014, « En cours ») |

Le rappel « à savoir », replié au pied de la fiche, dit que des passages demandent
d'agir sur une feuille d'aventure que le livre n'a pas. « Relire » montre ses
scènes à finir et la scène prête mais vide (S013) ; « Mettre en page » et
« Imprimer et partager » restent fermées jusqu'à l'étape 6.

La lecture d'essai : « Tester la lecture » ouvre « Par où commencer ? » ; le menu ⋯
d'une scène propose « Lire à l'essai d'ici ». À vérifier : les phrases du livre,
« à relier » sur un choix sans destination, « Hors du livre » sur S005,
l'énigme de S004 qui refuse un autre numéro que le sien (« Passer l'énigme » donne
le bon), « Cette scène n'a ni choix ni fin. » sur S010, « déjà lu » sur un choix
suivi, « Recommencer » et son « Annuler », « Ouvrir la scène » puis « Retour à la
lecture d'essai », qui retrouve le parcours. Dans « Les passeurs de brume », qui a
une feuille d'aventure, le compteur de volonté s'arrête à zéro et le dé se lance ;
en dessous de 1 100 points, « Ma feuille » s'ouvre en bas de l'écran.

**3. Côté élève, dans « Les passeurs de brume ».** Un autre navigateur, sur
http://localhost:4840/classe ; « Mes classes » > « CM1-CM2 d'essai » donne
l'identifiant, le mot de passe et les codes. « Lire à l'essai », dans la barre :

| Qui | Geste | Ce qui doit se voir |
|---|---|---|
| Un élève de « La lisière » | « Commencer au début » de son chapitre, puis les choix | ni référence, ni état, ni « Hors du livre » ; un choix vers un autre chapitre : « La suite se trouve dans un chapitre que tu découvriras plus tard », et rien de la destination |
| Le même | « Depuis une scène » : un mot du texte | les scènes de ses chapitres qui le contiennent, avec l'extrait |
| L'enseignant | Réglages du projet : « Les élèves lisent toute l'histoire » | chez l'élève, « Depuis le départ du livre » en premier, et les autres chapitres se lisent |
| L'élève | « Chemins » de son chapitre | « Fin de l'histoire », « Sans suite », et, la lecture ouverte, « Départ du livre » ; jamais « rien n'y mène » |

`npx playwright test essai-etape5` joue le même enchaînement, en raccourci.

**4. En ligne, à la demande seulement.** Avant de pousser l'étape : `npm run
sauvegarder`, puis `npm run production:schema -- --oui`, qui applique les deux
migrations à la vraie base, puis la mise en ligne du code.
