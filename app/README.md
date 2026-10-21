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
| `src/domaine/` | Règles sans base : année scolaire, prénoms, identifiant, mot de passe, code, horaires ; plan du récit, visuels, préparation ; texte d'une scène et droits sur ses blocs (`copie.ts`), numéros du livre (`numeros.ts`), chemins d'un chapitre et ce qu'il y a « à regarder » (`chemins.ts`) ; états d'une scène, ce qu'ils changent et où ils se choisissent (`etats.ts`) ; « Mon travail », par urgence (`travail.ts`) ; ce que le Suivi liste, compte et propose (`suivi.ts`) ; fiches de rédaction : ce qui se choisit, les feuilles, le partage, le nombre fixé (`fiches.ts`) ; encouragements : totaux et classement par catégorie (`encouragements.ts`) ; contrôles du livre : chaque point, sa gravité, son étape et sa phrase (`controles.ts`) ; la destination Livre : marques des étapes, tâches, avertissements acceptés (`livre.ts`) ; ce qu'une lecture reçoit d'un livre, son parcours, son énigme, sa feuille, sa reprise (`lecture.ts`) ; la version partagée, ses noms, le code du lien, l'état du partage (`partage.ts`) ; les aides IA : réglages, degrés, plafonds et leurs phrases (`aides-ia.ts`), la différence mot à mot d'une correction (`difference.ts`). |
| `src/serveur/` | Ce qui parle à la base : accès, session de l'adulte, accès de poste, chiffrement ; lectures du récit (adulte, élève), images ; texte des scènes, enregistrement, numéros, scènes voisines (`copie.ts`) ; état, remises et remarques d'une scène (`relecture.ts`) ; ce qu'une fiche de rédaction imprime d'une scène (`fiches.ts`) ; encouragements de l'adulte, et ce que le poste d'un élève en reçoit (`encouragements.ts`) ; ce que les contrôles du livre et la destination Livre lisent (`controles.ts`) ; les aides IA : fournisseurs, modèles et prix, une définition par aide, demande, plafonds et journal (`ia/`). |
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
npm run test:livre      # le livre composé par Chromium, relu dans le PDF produit, sans base
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

### Composer le livre ailleurs (étape 6)

Le livre est composé par Chromium sur le serveur (Paged.js, ADR 0003). La page
`/diagnostic/livre`, fermée en production, compose un livre fabriqué dans le
code — sans la base ni aucune donnée d'élève — et rend ses durées, sa mémoire,
la version de Chromium et l'empreinte de ses pages ; `?pdf=1` rend le PDF.
Deux Chromium donnent les mêmes pages quand l'empreinte est la même.

Pour essayer le Chromium de Vercel sous Linux, dans l'image Lambda d'Amazon
(Docker Desktop lancé) :

```bash
npx esbuild scripts/diagnostic-livre.ts --bundle --platform=node --format=cjs --target=node22 --tsconfig=tsconfig.json --external:playwright-core --external:@sparticuz/chromium --outfile=/tmp/diagnostic-livre.cjs
docker run --rm --platform linux/amd64 -v "$PWD":/app:ro -v /tmp:/sortie -w /app -e NODE_PATH=/app/node_modules -e CHROMIUM_SERVEUR=1 -e AWS_EXECUTION_ENV=AWS_Lambda_nodejs22.x --entrypoint node public.ecr.aws/lambda/nodejs:22 /sortie/diagnostic-livre.cjs /sortie/linux.pdf
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
- `ANTHROPIC_API_KEY` et `OPENAI_API_KEY` (étape 8, aides IA) : posées à la main par
  le porteur dans `.env.local`, jamais lues ni affichées ; `npm run env:local` les
  garde quand il réécrit le fichier. Aucun essai automatique ne s'en sert : les tests
  et les parcours imposent `IA_SIMULEE=1` et des clés vides, et les aides rendent
  alors une réponse simulée (`IA_SIMULEE=echec` ou `delai` simulent une panne).

## Mettre en production

```bash
npm run production:schema            # montre les migrations à appliquer
npm run production:schema -- --oui   # les applique à la vraie base
npm run vercel:env                   # envoie les variables à Vercel, sans les afficher
npm run verifier:production          # contrôle la vraie base, sans rien y écrire
```

Vercel déploie à chaque `git push` sur `main` (dossier racine : `app`).

## Étape 9, lot 1 : le domaine et les courriels

Réglages faits par le porteur, chez les fournisseurs, dans cet ordre ; aucune
clé ne passe dans la conversation. Les règles sont en F14
(`../docs/specifications.md`), le pourquoi dans l'architecture, « Préparation
de l'étape 9 ».

1. **Vercel, les adresses** (fait le 20 octobre 2026). Projet
   `you-are-a-hero-v1`, Settings, Domains : `iletaituneclasse.com` en
   Production (adresse principale, choisie le 20 octobre à la place du `.fr`) ;
   `www.iletaituneclasse.com`, `iletaituneclasse.fr`, `www.iletaituneclasse.fr`,
   `onceuponaclassroom.com` et `www.onceuponaclassroom.com` en « Redirect to »
   `iletaituneclasse.com` (308). Un domaine vers lequel un autre renvoie ne
   peut pas renvoyer lui-même : changer d'abord les cibles, puis l'ancien
   domaine principal.
2. **OVH, la zone DNS de chaque domaine** (fait le 20 octobre 2026) : les
   enregistrements que Vercel affiche (A pour le domaine nu, CNAME pour
   `www`), après avoir retiré le parking d'OVH (A `213.186.33.5`, TXT
   `3|welcome` de `www`, qui empêche le CNAME, CNAME `ftp`). Garder les MX et
   le SPF de la boîte Zimbra.
3. **OVH, l'adresse de contact.** Activer la boîte Zimbra offerte de
   `iletaituneclasse.com`, `contact@iletaituneclasse.com`, et, dans ses
   réglages, faire suivre les messages vers la boîte startfrenchnow. Aucune
   boîte sur le `.fr` ni, avant la version anglaise, sur
   `onceuponaclassroom.com`.
4. **AWS, Amazon SES, région Paris (`eu-west-3`).** Identities, Create
   identity, Domain `iletaituneclasse.com`, Easy DKIM : poser chez OVH, dans
   la zone du `.com`, les trois CNAME donnés. Ajouter dans la même zone un TXT
   `_dmarc` : `v=DMARC1; p=none; rua=mailto:contact@iletaituneclasse.com`. Puis
   « Request production access » (sortie du mode d'essai, accordée par AWS,
   souvent en un jour) ; texte de la demande : « Courriels de service d'une
   application pour enseignants (confirmation d'adresse, mot de passe oublié,
   avis de suppression), quelques dizaines par mois, envoyés seulement à qui
   s'est inscrit ; rebonds et plaintes suivis par la console. » Enfin SMTP
   settings, Create SMTP credentials : garder l'identifiant et le mot de passe
   pour le point 5, sans les coller ailleurs.
5. **Supabase, la vraie base** (tableau de bord du projet), **une fois l'accès
   de production accordé par AWS** — en mode d'essai, SES n'écrit qu'aux
   adresses vérifiées, et « Mot de passe oublié » ne partirait plus :
   - Authentication, URL Configuration : Site URL `https://iletaituneclasse.com` ;
     les Redirect URLs sont données au lot 2, plus bas ;
   - Authentication, Emails, SMTP Settings : Enable custom SMTP, hôte
     `email-smtp.eu-west-3.amazonaws.com`, port `587`, l'identifiant et le mot
     de passe SMTP de SES, expéditeur `ne-pas-repondre@iletaituneclasse.com`,
     nom « Il était une classe » ; puis relever la limite d'envoi
     (Rate Limits, emails) à 30 par heure ;
   - Authentication, Emails, Templates : pour « Confirm signup », « Reset
     password » et « Change email address », coller le sujet et le contenu de
     `supabase/templates/confirmation.html`, `recovery.html` et
     `email_change.html` (sujets dans `supabase/config.toml`).
6. **Vercel, la variable** `ADRESSE_SITE` = `https://iletaituneclasse.com`
   (Production) ; elle passe dans les courriels et l'affiche de la classe.
   Redéployer.
7. **Google, plus tard, au lot 9** : la vérification de la marque demande la
   page d'accueil et la page « Confidentialité » à ce domaine. Ce jour-là :
   Search Console (TXT de vérification chez OVH, zone du `.com`), puis Google
   Cloud, Google Auth Platform, Branding : domaine autorisé
   `iletaituneclasse.com`, page d'accueil, politique de confidentialité,
   conditions, et envoi à la vérification.

## Étape 9, lot 2 : l'inscription publique

En local, `supabase/config.toml` ouvre l'inscription et demande la confirmation de
l'adresse ; les courriels arrivent dans Mailpit (http://127.0.0.1:54324). Après un
changement de ce fichier ou des modèles de `supabase/templates/`, la base locale se
redémarre (`npm run base:arreter`, puis `npm run base:demarrer` : les données
restent).

À la mise en ligne, **après** les réglages du lot 1 (SES en place, sinon les
courriels ne partent qu'à l'équipe du projet), dans le tableau de bord de la vraie
base :

1. Authentication, URL Configuration, Redirect URLs : `https://iletaituneclasse.com/entree/**`
   (remplace `…/entree/confirmer`), en gardant les adresses `vercel.app` sous la même
   forme `…/entree/**`.
2. Authentication, Emails, Templates : recoller « Confirm signup » depuis
   `supabase/templates/confirmation.html` (son lien a changé) ; dans « Magic Link »,
   coller le sujet « Vous avez déjà un compte — Il était une classe » et
   `supabase/templates/compte_existant.html`.
3. Authentication, Sign In / Providers : allumer « Allow new users to sign up » et,
   sous Email, « Confirm email ».
4. `npm run verifier:production` dit alors « Les inscriptions sont ouvertes » et « Une
   adresse se confirme avant d'entrer ».

## Étape 9, lot 3 : les étoiles

Les valeurs de l'offre sont dans la table `reglages_application` (une ligne) : étoiles
offertes, taux euro-dollar, seuil sous lequel le solde se dit. Le compte du porteur
n'a pas de solde : il est marqué par une commande, jamais par l'application.

```bash
npm run createur                                         # le compte de .compte-local, en local
npm run createur -- --production adresse@du.compte --oui # dans la vraie base
```

À la mise en ligne, `npm run createur -- --production … --oui` se lance **juste après**
`npm run production:schema -- --oui` : avant, le compte du porteur a un solde et serait
débité.

## Étape 9, lot 4 : les limites gratuites et le pass

Tant que « Paiement ouvert » est éteint, ni limite ni vente. En local, pour essayer, il
s'allume dans la table `reglages_application` (Studio, http://127.0.0.1:54323, ou
l'administration du lot 6). Les essais le règlent eux-mêmes et le rendent comme ils
l'ont trouvé.

## Étape 9, lot 5 : le paiement (Stripe, mode d'essai)

Deux achats uniques par Stripe Checkout, par carte : le pass d'un projet (depuis son
dialogue ou ses réglages) et une recharge d'étoiles (« Mon compte »). Les prix sont
dans `reglages_application`. Un paiement s'inscrit une seule fois, par l'avis de
Stripe ou par la page de remerciement, qui relit la session : **en local, aucun
avis n'est nécessaire.** Les essais simulent Stripe (`STRIPE_SIMULE=1`).

Réglages faits par le porteur chez Stripe, **en mode d'essai** (bascule « Test mode »),
dans cet ordre ; aucune clé ne passe dans la conversation :

1. Créer le compte Stripe, rester en mode d'essai.
2. Settings, Business, Public details : site `https://iletaituneclasse.com`, et
   « Terms of service » `https://iletaituneclasse.com/conditions` (la page vient au
   lot 9) : la case de renonciation de la page de paiement s'appuie sur elle.
3. Settings, Customer emails (Emails) : allumer « Successful payments » ; et, sous
   Invoices, l'envoi des factures aux clients : la facture part à chaque paiement.
4. Developers, API keys : copier la clé secrète d'essai (`sk_test_…`) dans
   `.env.local`, sur une ligne `STRIPE_CLE_SECRETE=…`, puis relancer le serveur local.
5. Pour la mise en ligne seulement : Developers, Webhooks, « Add endpoint »
   `https://iletaituneclasse.com/paiement/avis`, événements
   `checkout.session.completed` et `checkout.session.async_payment_succeeded` ; son
   secret de signature (`whsec_…`) va chez Vercel en `STRIPE_SECRET_AVIS`, la clé
   secrète en `STRIPE_CLE_SECRETE`.

Cartes d'essai de Stripe : `4242 4242 4242 4242` (acceptée), `4000 0000 0000 0002`
(refusée), une date future et trois chiffres quelconques.

## Étape 9, lot 6 : l'administration et les courriels de l'application

`/admin`, ou « Administration » dans « Mon compte », pour le compte marqué par
`npm run createur` ; tout autre compte lit « Cette page n'existe pas ».

L'application écrit ses propres courriels (partage retiré, puis compte inactif et
sauvegarde manquée) par le même serveur d'envoi que Supabase, Amazon SES. En local,
`npm run env:local` les envoie dans Mailpit (port 54325, ouvert par
`supabase/config.toml`). À la mise en ligne, chez Vercel (Production) :
`SMTP_HOTE` = `email-smtp.eu-west-3.amazonaws.com`, `SMTP_PORT` = `587`,
`SMTP_UTILISATEUR` et `SMTP_MOT_DE_PASSE` = les identifiants SMTP de SES du lot 1,
`COURRIEL_EXPEDITEUR` = `Il était une classe <ne-pas-repondre@iletaituneclasse.com>`,
`COURRIEL_CONTACT` = `contact@iletaituneclasse.com`. Sans eux, rien ne part, et la page
qui retire un partage le dit.

## Étape 9, lot 7 : supprimer pour de bon

La corbeille se vide (« Supprimer pour de bon », « Vider la corbeille ») ; une classe
passée se supprime depuis sa page ; un adulte supprime son compte depuis « Mon
compte ». Chaque jour à 4 h 30 (temps universel), le cron de Vercel (`vercel.json`)
appelle `/taches/comptes-inactifs` : avis après cinq ans sans activité, suppression
trente jours plus tard. À la mise en ligne, chez Vercel (Production) : `CRON_SECRET`
= une longue chaîne au hasard, que le porteur tire lui-même (`openssl rand -hex 32`
dans un terminal) ; Vercel l'envoie seul au cron, et la tournée refuse tout autre
appel.

## Étape 9, lot 8 : la sauvegarde de la nuit, vers S3

Chaque nuit à 3 h, heure de Paris, le workflow `.github/workflows/sauvegarde-nocturne.yml`
(GitHub Actions, qui a Docker) écrit la base et les images du stockage
(`npm run sauvegarde:nuit`), puis les dépose dans le seau S3 du porteur, à Paris, dans un
dossier par jour : `base/` (trois fichiers SQL) et `images/`. Les PDF ne sont pas copiés.
Le seau efface ce qui a plus de 90 jours ; une nuit qui échoue envoie le courriel d'échec
de GitHub. Il tourne dès que le code est poussé sur `main`.

```bash
npm run sauvegarde:nuit -- --local                 # l'essayer sur la base locale
npm run restaurer:s3 -- 2026-10-21                 # une nuit du seau, dans la base locale
npm run restaurer:s3 -- 2026-10-21 --production    # dans la vraie base, après un accident
```

Réglages faits par le porteur, dans cet ordre ; aucune clé ne passe dans la conversation :

1. **AWS, S3, région Paris (`eu-west-3`)** : Create bucket, par exemple
   `iletaituneclasse-sauvegardes`, « Block all public access » coché, chiffrement par
   défaut (SSE-S3).
2. **Le seau, Management, Create lifecycle rule** : « Effacer après 90 jours », pour tous
   les objets, « Expire current versions of objects » après 90 jours.
3. **IAM, Users, Create user** `sauvegarde-github`, sans accès à la console ; Permissions,
   « Create inline policy », en JSON (le nom du seau à la place de `SEAU`) :
   `{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:PutObject","Resource":"arn:aws:s3:::SEAU/*"}]}`
   — il dépose, sans pouvoir lire ni effacer. Puis Security credentials, « Create access
   key » (Third-party service) : garder l'identifiant et le secret pour le point 4.
4. **GitHub, le dépôt `you-are-a-hero-v1`, Settings, Secrets and variables, Actions** :
   « New repository secret » pour `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_CLE_SECRETE`,
   `SUPABASE_ADRESSE_BASE` et `SUPABASE_MOT_DE_PASSE_BASE` (les valeurs de
   `production.env`), `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` (point 3), `SEAU_S3`
   (le nom du seau).
5. **GitHub, son compte, Settings, Notifications, Actions** : courriel, « Only notify for
   failed workflows ».
6. Une fois le code poussé : onglet Actions, « Sauvegarde de la nuit », « Run workflow »,
   pour la voir tourner une fois sans attendre la nuit ; le dossier du jour paraît dans le
   seau.
7. **Pour restaurer** : l'outil d'AWS sur l'ordinateur (`brew install awscli`, puis
   `aws configure` avec un accès qui lit le seau, celui du porteur), et une ligne
   `SEAU_S3=…` dans `production.env`. Docker ouvert.

## Étape 9, lot 9 : les pages publiques

L'accueil à `/` pour un visiteur (un adulte connecté ou un poste d'élève y gardent leur
arrivée), « Aide », « Confidentialité », « Conditions d'utilisation », « Mentions
légales », et les trois modèles (`/modeles/…`, à télécharger en `.rtf`). Les textes sont
dans `src/domaine/textes-publics.ts`, en un seul endroit, rédigés par Claude : une
relecture par un juriste reste recommandée.

À faire par le porteur avant l'ouverture :

1. L'éditeur, qui vend aussi, est dans `EDITEUR` (`src/domaine/textes-publics.ts`)
   depuis le 21 octobre 2026 : la micro-entreprise de Yohann Coussot (adresse, SIRET,
   franchise de TVA), avec le téléphone du porteur ; mentions légales, conditions,
   « Confidentialité » et contrat type le citent (F14-AC37). Reste le médiateur de la
   consommation, à nommer dans les conditions avant d'allumer « Paiement ouvert ».
2. **Le livre à feuilleter de l'accueil** : la variable `LIVRE_DE_L_ACCUEIL` (Vercel,
   Production) reçoit le code d'un livre partagé par lien, les dix lettres après
   `/lire/` ; sans elle, l'accueil montre sa page de livre sans lien.
3. **Google** (lot 1, point 7) : les pages d'accueil, « Confidentialité » et
   « Conditions » existent désormais à `iletaituneclasse.com` ; la vérification de la
   marque peut partir.
4. **Stripe** (lot 5, point 2) : « Terms of service » `https://iletaituneclasse.com/conditions`.

## Essayer l'étape 9, puis la mettre en ligne

L'étape se termine sur l'essai du porteur (plan, « Terminée quand »). Le parcours
`npx playwright test ouverture-de-bout-en-bout` en joue la part locale, Stripe simulé.

**1. En local d'abord, « Paiement ouvert » allumé** (serveur local, port 4840, la clé
d'essai de Stripe dans `.env.local`, lot 5) :

1. Une seconde adresse : « Créer un compte » sur http://localhost:4840 ; le courriel de
   confirmation arrive dans Mailpit (http://127.0.0.1:54324) ; son lien ouvre « Mes
   projets », vide ; « Mon compte » dit 30 ✦.
2. Un petit projet personnel, quelques scènes.
3. Avec le compte local (le porteur) : « Mon compte », « Administration » ; « Allumer »
   « Paiement ouvert ».
4. `npm run essai:etape9 -- la.seconde@adresse` porte son projet à 40 scènes ; « Ajouter
   une scène » ouvre alors le dialogue du pass.
5. « Acheter le pass » : la page de Stripe, en mode d'essai, avec la case de renonciation ;
   la carte `4242 4242 4242 4242`. Retour au projet : « Le pass est là », la scène suivante
   s'ajoute, « Mon compte » a 400 ✦ de plus.
6. « Mon compte », « Recharger » : 100 ✦ de plus.
7. La facture : en mode d'essai, Stripe peut ne pas envoyer de courriel ; elle se lit
   alors dans son tableau de bord, Payments, le paiement, « Invoice ».
8. « Administration » : le compte, ses ventes du mois ; « Éteindre » ensuite.

**2. La mise en ligne, à la demande du porteur, dans cet ordre :**

1. Réglages du lot 1 (Vercel et ses adresses, OVH, SES, Supabase) et du lot 2 (Supabase :
   adresses de retour, modèles, inscription et confirmation allumées).
2. `npm run sauvegarder`, puis `npm run production:schema -- --oui` : cinq migrations
   (`etoiles`, `limites_et_pass`, `paiements`, `administration`, `supprimer_pour_de_bon`).
3. **Aussitôt :** `npm run createur -- --production adresse.du.porteur --oui`.
4. Chez Vercel (Production) : `ADRESSE_SITE`, les variables SMTP du lot 6, `CRON_SECRET`
   (lot 7), `STRIPE_CLE_SECRETE` et `STRIPE_SECRET_AVIS` en mode d'essai (lot 5),
   `LIVRE_DE_L_ACCUEIL` si un livre est choisi (lot 9).
5. Le code poussé sur `main`.
6. `npm run verifier:production`.
7. Stripe : l'adresse des avis (lot 5, point 5) ; GitHub : les secrets de la sauvegarde
   (lot 8, point 4), puis « Run workflow » une fois ; Google : la vérification de la
   marque (lot 1, point 7).

**3. L'essai en ligne, « Paiement ouvert » éteint :**

1. À `iletaituneclasse.com`, avec la seconde adresse : « Créer un compte » par adresse ;
   le courriel arrive (par SES) ; puis, avec un autre compte Google, « Continuer avec
   Google » crée un compte : l'écran de Google affiche « Il était une classe » une fois la
   marque vérifiée.
2. Un petit livre personnel ; ses 30 ✦ s'usent jusqu'à « Vous n'avez plus d'étoiles.
   Tout le reste fonctionne. » (vrais appels, quelques dizaines de centimes).
3. « Administration » (compte du porteur) : lui offrir 100 ✦ ; l'aide repart.
4. Le PDF, puis le partage par lien ; sur un téléphone, « Écrit avec Il était une
   classe » mène à l'accueil.
5. `iletaituneclasse.com` et `onceuponaclassroom.com` mènent à l'accueil.
6. Le lendemain : le dossier de la nuit dans le seau S3 ; puis, en local,
   `npm run restaurer:s3 -- <jour>` : projets, classes et images reviennent.
7. « Mon compte », « Supprimer mon compte » : le compte, ses projets et son livre
   partagé disparaissent ; « Administration » ne le liste plus.

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
  sauvegarde : celle de la nuit les copie (étape 9, lot 8). La base n'en garde que la liste. En local, où
  la restauration remet la base à zéro, la commande met cette liste de côté avant
  et la remet après, les fichiers restant sur le disque ; dans la vraie base,
  elle n'y touche pas.

Essayé le 9 octobre 2026 sur la base locale : sauvegarde, remise à zéro,
restauration, puis connexion du compte, relecture d'un code et d'un mot de passe
de classe, ouverture de la classe sur un poste. Essayé de nouveau le 13 octobre
2026, avec le schéma de l'étape 4 (plan du récit, textes, remises, remarques,
encouragements) : la base locale revient à l'identique, et les codes et le mot
de passe de la classe d'essai se relisent. Restauration de la vraie base jouée
le 15 octobre 2026, en mettant l'étape 5 en ligne : chaque table revient avec le
même nombre de lignes, et `npm run verifier:production` passe.

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
restaurer y appliquerait ses migrations avant le code qui s'en sert. Un essai
de restauration de la vraie base se fait donc en mettant une étape en ligne,
dans cet ordre : `npm run sauvegarder`, `npm run production:schema -- --oui`,
mise en ligne du code, une nouvelle sauvegarde, puis `npm run restaurer --
sauvegardes/<date> --production` depuis celle-ci. La commande demande de
retaper le nom du dossier : elle se lance dans un vrai terminal, ou en donnant
la réponse d'avance (`echo <date> | npm run restaurer -- …`).

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
une feuille d'aventure, « Ma feuille » l'ouvre, une action de jeu aussi ; le
compteur de volonté s'arrête à zéro et le dé se lance ; en dessous de 1 100 points,
« Ma feuille » est dans une barre en bas de l'écran.

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

## Essayer l'étape 6 : composer et imprimer le livre

L'étape 6 du plan se termine quand le PDF définitif du livre de la classe sort de
Vercel, identique à son aperçu, et qu'un exemplaire imprimé a été reçu. L'essai se
joue d'abord en local, sur http://localhost:4840, avec le compte local ; la vraie
base n'est pas touchée.

**1. Les livres d'essai.** Les cinq migrations de l'étape (`pdf_du_livre`,
`relire`, `mise_en_page`, `mettre_en_page`, `ordre_des_passages`) doivent être dans
la base locale : `npx tsx scripts/supabase.ts migration up --local` les applique
sans rien effacer. La classe d'essai vient de « Les passeurs de brume ».

```bash
npm run histoire:essai -- --refaire     # la classe d'essai, si elle n'est pas chargée
npm run livres:essai -- --refaire       # « La lanterne du passeur » et « Le grand voyage »
```

**2. « La lanterne du passeur », récit à choix de la classe.** Onglet « Livre » :

| Étape | Ce qui doit se voir | Ce qu'on y fait |
|---|---|---|
| Relire | l'aperçu du livre, page par page ; « À confirmer » : le dessin peu défini de S004 | « Garder ainsi » ; un clic sur un passage ouvre sa scène à côté, on corrige, l'aperçu suit ; « Créer le PDF de travail » ; puis « J'ai relu le livre » |
| Vérifier les chemins | S014 « Plus de volonté », où ne mène que la règle du jeu | « C'est voulu », « Tester la lecture », puis « J'ai vérifié les chemins » |
| Mettre en page, « Réglages » | la police, la taille, l'alignement, les marges et leur schéma, les pages de début et de fin, la petite double page qui suit chaque réglage | une page des auteurs avec les prénoms de la classe, la page de titre, une marge sous 10 mm (refusée) |
| Mettre en page, « Aperçu » | le livre entier, « Pages peu remplies » ; le n° de « Barque — l'eau noire », dont l'image pleine page laisse un blanc en lui | parcourir les pages peu remplies, « Placer ici » un passage suggéré, « Annuler » ; ouvrir un passage, « Monter », « Placer après le n° … », « Commencer sur une nouvelle page » |
| Ordre des passages | « Moins de blanc » | « Réordonner les passages » (il ne change rien s'il ne fait pas mieux), « Annuler » ; puis une scène allongée : « Le livre a changé. », « Garder cet ordre » |
| Mettre en page | « La mise en page me convient » | la déclarer ; « Reprendre » la retire |
| Imprimer et partager | « Le livre est prêt. », la couverture à préparer | « Créer le PDF définitif… » : le dessin gardé est rappelé, le fichier se télécharge ; une coquille corrigée ensuite : « Le livre a changé depuis le PDF définitif » ; « Nouveau PDF définitif… », puis supprimer l'ancien |

**3. « Le grand voyage », récit classique.** Trois étapes seulement : « Relire »,
« Mettre en page » sans ordre des passages, avec les titres de chapitre, puis le
PDF définitif.

`npx playwright test livre-de-bout-en-bout` joue les deux, en raccourci ; les
captures de l'étape se refont par `npm run captures -- etape6`.

**4. En ligne, à la demande seulement.** Avant de pousser l'étape : `npm run
sauvegarder`, puis `npm run production:schema -- --oui`, qui applique les cinq
migrations à la vraie base, puis la mise en ligne du code. Le PDF définitif du
livre de la classe se crée alors en ligne (V2, V3), puis s'envoie à l'imprimeur
par le porteur (V6).

## Essayer l'étape 7 : partager et lire en ligne

L'étape 7 du plan se termine quand le lien s'ouvre sur un téléphone sans compte,
et qu'un élève lit un livre terminé depuis son espace. L'essai se joue d'abord en
local, sur http://localhost:4840, avec le compte local ; la vraie base n'est pas
touchée.

**1. Les livres prêts à partager.** Les deux migrations de l'étape (`partage`,
`lectures_des_eleves`) doivent être dans la base locale : `npx tsx
scripts/supabase.ts migration up --local` les applique sans rien effacer.

```bash
npm run histoire:essai -- --refaire     # la classe d'essai, si elle n'est pas chargée
npm run livres:essai -- --refaire       # « La lanterne du passeur » et « Le grand voyage »
npm run partages:essai                  # les mène à « Imprimer et partager », sans les partager
```

**2. Partager « La lanterne du passeur ».** Onglet « Livre », étape « Imprimer et
partager », volet « Partager » :

| Geste | Ce qui doit se voir |
|---|---|
| « Prévisualiser » | le livre tel que le lecteur le verra, sous un bandeau, rien de retenu |
| « Noms affichés » > « Modifier » | la ligne de classe à retirer ou à remplacer (« Une classe de CM1-CM2 »), la page des auteurs à retirer ; « Le livre imprimé ne change pas. » |
| « Par un lien » | le rappel à cocher sur place, puis le lien en trois groupes, « Copier le lien », « Ouvrir » ; l'étape porte sa coche |
| « À mes classes » | le même rappel ; la version déjà partagée, sans nouvelle date |
| Une coquille corrigée dans une scène | « Le livre a changé depuis la version partagée », le triangle sur l'étape et sur l'onglet « Partager », « Mettre à jour le partage… » |
| Une scène rouverte (« En cours ») | « Mise à jour impossible pour l'instant », avec ce qui reste et le lien vers l'étape |
| « Changer de lien… » | un nouveau lien ; l'ancien affiche « Ce livre n'est plus partagé. » |
| Couper le dernier interrupteur | « Retirer le partage ? » et ce que le lien affichera |

**3. Lire par le lien, sur un téléphone, sans compte.** Ouvrir le lien dans une
fenêtre privée, à la taille d'un téléphone (mode « appareil » des outils du
navigateur) ; un vrai téléphone, une fois l'étape en ligne :
« Commencer la lecture », les choix, l'énigme (le bon numéro, puis un autre), « Ma
feuille » en bas de l'écran, le dé, « Comment lire » et les règles, « Parcours » ;
la page rouverte propose « Continuer au passage n ». Après une mise à jour, la
lecture continue ; une scène retirée du livre la fait reprendre au début, ce que
la page dit.

**4. Lire depuis la classe.** Un autre navigateur, sur
http://localhost:4840/classe, avec l'identifiant, le mot de passe et un code de
« Mes classes » > « CM1-CM2 d'essai ». « Lire », dans la barre : « Notre
histoire en cours » (« Les passeurs de brume », à l'essai), puis « Livres à
lire » : « La lanterne du passeur » en grand, « Écrit par ta classe ». Une note
dans « Ma feuille », puis le même élève sur un autre navigateur : « Continuer »,
la feuille avec lui ; un autre élève sur le premier : sa feuille à lui. « Le grand
voyage », partagé « À mes classes », s'y ajoute avec la ligne de sa page de titre,
et se lit un chapitre par écran.

`npx playwright test partage-de-bout-en-bout` joue le parcours en raccourci ; les
captures de l'étape se refont par `npm run captures -- etape7`.

**5. En ligne, à la demande seulement.** Avant de donner un premier lien aux
familles, ajouter dans Vercel un second nom gratuit en `.vercel.app` (par exemple
`il-etait-une-classe.vercel.app`) et régler `ADRESSE_SITE` sur cette adresse : les
liens copiés la porteront. Pour pousser l'étape : `npm run sauvegarder`, puis
`npm run production:schema -- --oui`, qui applique les deux migrations à la vraie
base, puis la mise en ligne du code.

**6. Essayer en ligne sans projet fini.** Les deux livres d'essai se chargent dans
la vraie base, sur votre compte, à côté de vos projets, qui ne sont pas touchés ;
la classe d'essai en ligne vient de `npm run histoire:essai -- --production
adresse --oui`. Sans `--oui`, chaque commande dit seulement ce qu'elle ferait.

```bash
npm run sauvegarder
npm run livres:essai -- --production adresse@du.compte --oui
npm run partages:essai -- --production adresse@du.compte --oui
```

Puis, en ligne : partager « La lanterne du passeur » par le lien et « À mes
classes », l'ouvrir sur un téléphone, et la faire lire à un élève de la classe
d'essai depuis « Lire ». `npm run livres:essai -- --production adresse --refaire
--oui` remet les deux livres à neuf ; `--retirer` à la place de `--refaire` les
retire, avec leurs images, leurs partages et les lectures des élèves.

## Essai de qualité des aides IA (étape 8, lot 1)

Avant de choisir le fournisseur des textes, chaque aide se juge à l'aveugle sur un
jeu d'essai (`scripts/essai-ia/jeu.ts`) : chaque cas part chez chaque modèle
candidat, avec les vraies consignes des aides (`src/serveur/ia/aides/`). Les
réponses vont dans `essais-ia/resultats.json`, hors de Git ; le coût de chaque
appel s'affiche, et la commande s'arrête avant de dépasser son plafond.

```bash
npm run ia:essai -- --a-blanc       # ce qui serait lancé, sans rien appeler
npm run ia:essai                    # lance ce qui manque, 10 dollars au plus
npm run ia:essai -- --cas titre-1   # un seul cas
```

Puis, sur http://localhost:4840/essai-ia, connecté avec le compte local : chaque
cas, les propositions sous une lettre, « Bonne », « Passable » ou « À écarter »,
et « La meilleure ». Les notes s'écrivent dans `essais-ia/jugements.json`. « Voir
les résultats » révèle les modèles : points, coût moyen et durée, par aide et pour
tout l'essai. La page n'existe pas chez Vercel.


Le jugement final de l'étape (lot 9) passe un jeu neuf, une classe fictive (« La ville
aux horloges arrêtées », `scripts/essai-ia/classe.ts`), chez le seul modèle retenu pour
chaque aide ; les réponses vont dans `essais-ia/classe.json`, hors de Git.

```bash
npm run ia:essai -- --jeu classe --a-blanc       # ce qui serait lancé
npm run ia:essai -- --jeu classe --plafond 2     # 25 appels, environ 0,20 dollar
```

## Essayer l'étape 8 : les aides IA

L'étape 8 du plan se termine quand les aides sont jugées et que l'application reste
entièrement utilisable sans elles. L'essai se joue d'abord en local, sur
http://localhost:4840, avec le compte local et de vrais appels : les deux clés sont
dans `.env.local` (`npm run env:local` les garde). Chaque demande passe au journal de
« Mon compte » > « Aides IA », avec son coût ; une demande de texte coûte moins d'un
centime, une image de un à cinq centimes.

**1. La base locale à jour.** `npx tsx scripts/supabase.ts migration up --local`
applique les quatorze migrations de l'étape sans rien effacer (la dernière,
`portraits_en_route`, du lot 9) ; `npm run histoire:essai`
charge « Les passeurs de brume » si elle n'y est pas. Un serveur local lancé avant
l'étape garde l'ancien code : le redémarrer.

**2. Le trajet, avec les aides.**

| Où | Geste | Ce qui doit se voir |
|---|---|---|
| « Mon compte » > « Aides IA » | degré par défaut, niveaux, images | « Enregistré » ; les réglages valent pour tous les projets |
| Préparation, une étape | ✦ des questions, des idées, « Orienter l'IA », « Rédiger d'après les idées » | une idée « à discuter », marquée ✦ ; rien ne change avant « Utiliser ce texte » |
| Personnages | « Repérer les personnages », ✦ de la fiche, « Créer son portrait » | des cartes cochées, rien de créé avant « Ajouter 2 personnages » ; le portrait se pose de lui-même, panneau refermé compris, la seconde image attend dans le panneau |
| Parties et chapitres | ✦ d'« Ajouter une partie », ✦ au pied d'une partie, ✦ du résumé | les propositions une à une ; ajoutée, la carte attend son image d'office |
| Une scène | ✦ du titre, « Formuler », « Idées de choix », « Écrire » sur une scène vide | trois titres ; une consigne « Décris : » ; dix idées, trois par trois |
| Une scène remise | « Corriger », degré, « Garder les changements », « Demander une reprise… » > « Proposer des pistes » | des marques au stylo aux degrés 1 à 3, le côte à côte aux degrés 4 et 5 ; « Annuler » rend le texte |
| La même, côté élève | « Mon idée d'image » | aucune commande d'IA ; l'adulte retrouve l'idée en créant l'image |
| Image d'une scène, d'un chapitre | « Créer une image », « Créer une image d'après le résumé » | on peut continuer pendant la création ; l'image se pose en quittant le panneau |
| Livre > « Imprimer et partager » | « Le prompt de l'image de face » | la description proposée, puis le prompt copié |

**3. Le même trajet, sans les aides.** Couper « Proposer les aides IA » dans « Mon
compte » : plus un ✦ nulle part, les boutons doubles redeviennent simples, la
consigne, la remarque et le titre s'écrivent à la main, le prompt d'une image se
copie. Rien ne part : le journal reste vide.

**4. En panne, ou sans les clés.** Sans clé, une aide répond « Les aides IA ne sont
pas installées sur ce site. Tout le reste fonctionne. », sans rien compter dans les
plafonds ; un fournisseur en panne, « L'aide n'a pas répondu. Le texte n'a pas
changé. ». Dans les deux cas la scène s'écrit et s'enregistre.

`npx playwright test aides-de-bout-en-bout` joue les trois trajets en raccourci, sur la
réponse simulée ; les captures de l'étape se refont par `npm run captures -- etape8`.

**5. En ligne.** Le code et les treize premières migrations y sont depuis le
19 octobre ; le lot 9 demande la quatorzième (`npm run sauvegarder`, puis
`npm run production:schema -- --oui`) avant son code ; les
aides demandent `ANTHROPIC_API_KEY` et `OPENAI_API_KEY` dans l'environnement de
Vercel, puis un nouveau déploiement. Sans elles, l'application en ligne fonctionne ;
tant que ce lot n'y est pas, chaque ✦ répond « L'aide n'a pas répondu » et compte dans
le plafond du jour, puis, ce lot en ligne, il dit que les aides ne sont pas installées.
