# Architecture V1 — Orientations et vérifications

Document de référence pour les comparaisons techniques approfondies.
Le [brief](../BRIEF-V1.md#5-stack-de-travail) conserve la synthèse de la stack.
Les [spécifications](specifications.md) définissent les besoins fonctionnels.
Le développement suit le [plan de réalisation](plan.md), étape par étape, sur
autorisation du porteur ; l'étape 1 est construite, et ses choix techniques sont
dans [Réalisation de l'étape 1](#réalisation-de-létape-1-9-octobre-2026). Deux
prototypes jetables l'ont précédé : celui de l'éditeur, dont les
[résultats](#résultats-du-prototype-de-léditeur-2-octobre-2026) figurent plus
bas, et celui de la chaîne PDF, avec ses
[résultats](#résultats-du-prototype-pdf-3-octobre-2026). Aucun code n'en est
repris.

## Statut au 27 septembre 2026

Le porteur confirme PostgreSQL et indique disposer déjà de Vercel Pro.
Il demande si l'intégration PostgreSQL de Vercel peut être préférable à
Supabase. Le forfait existant est une information fournie par le porteur,
pas une vérification du compte, de ses crédits restants ou de sa consommation.
L'accord de principe sur Supabase n'est pas annulé par cette question.
Vercel devient un candidat à examiner pour l'hébergement de l'application ;
Render était jusqu'ici proposé, sans décision définitive.
Les orientations de stockage déjà évoquées restent des données métier
relationnelles et un texte structuré en JSONB ; elles ne fixent aucun schéma SQL.

## Hébergement applicatif, base et services associés

Ces choix couvrent des responsabilités différentes : héberger l'application
Next.js ; fournir PostgreSQL ; gérer l'authentification et les fichiers ;
exécuter les exports PDF. Une interface de gestion commune ne fusionne pas
automatiquement les services ou leurs coûts.

**Faits vérifiés dans les documentations officielles le 27 septembre 2026 :**

- L'ancien produit Vercel Postgres n'est plus disponible. Vercel indique
  avoir transféré ses bases existantes vers Neon en décembre 2024. Pour les
  nouveaux projets, son offre passe par des intégrations de fournisseurs
  PostgreSQL externes via la Marketplace, avec configuration des connexions.
  Source : [Postgres on Vercel](https://vercel.com/docs/postgres).
- Supabase fournit PostgreSQL, Auth et Storage. Le choix de PostgreSQL seul
  ne résout pas à lui seul l'authentification et le stockage d'illustrations.
  Source : [documentation Supabase](https://supabase.com/docs).
- Supabase dispose d'une intégration Vercel Marketplace. Sa documentation
  décrit la synchronisation des variables de connexion et une facturation
  via Vercel, avec les mêmes tarifs Supabase que pour la souscription directe.
  Un hébergement applicatif Vercel peut donc fonctionner avec Supabase.
  Source : [intégration Supabase/Vercel](https://supabase.com/docs/guides/integrations/vercel-marketplace).
- Vercel Pro inclut des crédits d'infrastructure et facture les dépassements.
  Les offres Marketplace ont leurs propres conditions et frais, à examiner
  séparément du forfait Pro. La facturation Supabase décrite ci-dessus ne
  devient pas automatiquement gratuite par l'existence de ce forfait.
  Sources : [offre Pro](https://vercel.com/docs/plans/pro-plan) et
  [conditions Marketplace](https://vercel.com/legal/integrations-marketplace-service-terms).
- Les fonctions Vercel ont des limites d'exécution, de mémoire et de taille.
  Leur adéquation à la production des PDF n'est pas démontrée par la seule
  disponibilité d'un forfait Pro. Source : [limites des fonctions](https://vercel.com/docs/functions/limitations).

## Comparaison pour ce projet

| Option à examiner | Intérêt | Points à vérifier |
| --- | --- | --- |
| Vercel pour l'application + Supabase pour PostgreSQL/Auth/Storage | Tenir compte du forfait Vercel déjà utilisé tout en gardant les services envisagés dans le brief. | Coût marginal réel, intégration des accès scolaires, régions, sauvegardes des données et fichiers, exports PDF. |
| Vercel + un autre fournisseur PostgreSQL, notamment Neon | Autre offre PostgreSQL intégrée à Vercel, à comparer si elle répond mieux aux besoins. | Ensemble des services d'authentification et de fichiers retenus, coût complet et effort d'intégration ; ne pas comparer le seul prix de la base. |
| Render + Supabase, proposition antérieure | Reste une alternative pour l'application ou un traitement PDF distinct. | Justification du coût supplémentaire, exploitation et besoins réels des tâches longues. |

**Hypothèse prioritaire acceptée, fournisseurs non définitifs :** prendre
Vercel + Supabase comme hypothèse
prioritaire à évaluer pour l'application, compte tenu du forfait existant et
du besoin de base, d'authentification et de fichiers. Cela ne vaut pas choix
définitif de la Marketplace comme mode de souscription. Comparer une création
Supabase directe à l'intégration Vercel avant tout engagement. La seule
existence de Pro ne justifie ni le remplacement de Supabase ni la promesse
d'un hébergement entièrement inclus.

**Décision du 8 octobre 2026 :** l'application est hébergée chez Vercel, à
son adresse par défaut et sans nom de domaine, dès le premier usage par la
classe du porteur, et s'appuie sur Supabase, souscrit directement, pour la
base, les comptes et les fichiers ([ADR 0004](adr/0004-vercel-et-supabase.md)).
Le porteur garde l'offre gratuite jusqu'à l'ouverture à d'autres enseignants
et sauvegarde lui-même la base de temps en temps ; l'orientation ci-dessous,
qui prévoyait une offre payante pour l'usage régulier en classe, est révisée
sur ce point. La région des données et le lieu d'exécution du PDF sont dans
le [plan de réalisation](plan.md#décisions-de-fournisseur).

Neon reste un candidat possible ; il ne faut pas supposer qu'il ne propose
aucune solution d'authentification. Cette comparaison n'évalue pas encore
ses offres associées. Dans tous les cas, la mise en œuvre technique de
l'identification scolaire sans email, du changement d'élève et des permissions
de chapitre reste à concevoir selon les règles fonctionnelles confirmées en
[F06](specifications.md#f06--attributions-accès-et-organisation-de-lécriture) ;
aucune intégration fournisseur ne les apporte toutes seules.

## Démarrage gratuit et passage à une exploitation régulière

**Faits vérifiés le 27 septembre 2026 :** Supabase propose une offre Free à
0 USD/mois et Pro à partir de 25 USD/mois. Free inclut 500 Mo de base par
projet, 1 Go de fichiers, 50 000 utilisateurs actifs mensuels, 5 Go de trafic
sortant et 5 Go de trafic sortant en cache. Les projets gratuits sont mis en
pause après une semaine d'inactivité ; les sauvegardes automatiques ne sont
pas incluses. Source : [tarifs Supabase](https://supabase.com/pricing).

La limite est de deux projets gratuits actifs, comptés sur les organisations
où le titulaire est propriétaire ou administrateur. Les quotas d'usage sont
généralement mutualisés dans une organisation, sauf indication contraire
comme la taille de base par projet.
Source : [facturation Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase).
Un projet Supabase est une instance technique, pas une histoire ou une classe
de notre produit ; cette limite ne restreint donc pas l'application à deux livres.

Un dépassement Free donne lieu à notification et peut conduire à des restrictions
si l'usage n'est pas réduit ou l'offre adaptée.
Source : [FAQ de facturation](https://supabase.com/docs/guides/platform/billing-faq).
Les sauvegardes de base, y compris payantes, ne sauvegardent pas les fichiers
Storage eux-mêmes. Source : [sauvegardes Supabase](https://supabase.com/docs/guides/platform/backups).

**Orientation acceptée, sans souscription :** commencer les futurs travaux et essais
autorisés sur Free ; prévoir le coût d'une offre payante pour l'usage régulier
en classe, même avant d'atteindre les quotas, afin d'éviter la pause pendant
les vacances et de disposer des sauvegardes de base. Une stratégie de sauvegarde
et restauration des illustrations reste nécessaire. Le volume d'utilisateurs
ne suffit pas à estimer le coût : images, historique, trafic, PDF et appels IA
doivent être évalués séparément. Aucun abonnement n'est décidé maintenant.

## Protection des accès de classe et des codes élèves

**Besoin fonctionnel confirmé :** [F06.4](specifications.md#f064--classe-de-référence-et-postes-partagés)
définit l'accès de classe suivi de la sélection d'un profil et de son code
à quatre chiffres, consultable et modifiable par l'enseignant. Le porteur
questionne l'utilité du hachage ; aucun stockage en clair n'est décidé.

**Analyse pour la V1 :** la session de classe ne protège pas un élève contre
l'utilisation de son identité par un autre élève sur un poste déjà connecté.
Le code individuel participe donc à la protection des droits et des remises
de textes. Quatre chiffres offrent au plus 10 000 valeurs ; la protection
contre des essais répétés est nécessaire indépendamment du stockage. Ce
parcours partagé ne constitue pas une authentification à deux facteurs.

**Faits vérifiés le 27 septembre 2026 :** le hachage ne permet pas de
réafficher le secret d'origine, contrairement au chiffrement réversible.
OWASP recommande habituellement le hachage adapté des secrets d'authentification
et déconseille leur stockage en clair ; le besoin de retrouver le secret
impose d'examiner une exception à ce modèle.
Source : [OWASP — Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
OWASP préconise également de limiter les tentatives d'authentification,
en tenant compte du risque de blocage abusif des utilisateurs.
Source : [OWASP — Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

**Recommandation technique, retenue par le porteur le 8 octobre 2026**, avec
la limitation des essais erronés, comme préalable aux prénoms d'élèves réels
([plan](plan.md#avant-de-saisir-des-prénoms-délèves-réels)) ; sa mise en
œuvre reste à concevoir : pour satisfaire la
consultation permanente demandée, étudier un chiffrement applicatif du code,
avec clé séparée des données stockées et restitution limitée à l'enseignant
autorisé. Un simple chiffrement des disques ne remplit pas ce même objectif.
Ne pas envoyer les codes aux sessions élèves pour les vérifier dans leur
navigateur et ne pas les inclure dans les journaux. L'autre option est un
stockage non récupérable, mais elle exigerait de remplacer le besoin de
consultation par une réinitialisation ; ce changement fonctionnel n'est
pas validé. Un hachage seul ne rend pas fort un code à quatre chiffres.

**À éprouver avant réalisation :** protection et rotation des clés, contrôle
de la consultation adulte, vérification côté serveur, limitation des essais
par profil et à l'échelle de la classe, récupération sans bloquer les 25 élèves,
remplacement des codes et effet sur les sessions ouvertes. Le niveau de
protection doit être examiné avec les modalités d'accès de classe et l'usage
facultatif depuis le domicile selon F06.4. Les horaires confirmés dans cette
section ferment l'accès au travail en acceptant la sauvegarde finale de la
rédaction en cours, même après l'échéance. Leur mise en œuvre doit rester
simple, sans protocole de preuve de l'instant de chaque saisie, et conserver
les contrôles ordinaires de droits et de conflits. Les seuils d'essais, la
durée des accès, les postes déjà ouverts et l'heure de référence sont
décidés le 8 octobre 2026 en F06.4 ; leur réalisation et la reprise après
échec de sauvegarde restent à concevoir.
Cette note ne figeait aucun algorithme : la mise en œuvre retenue à l'étape 1
est décrite dans
[Réalisation de l'étape 1](#réalisation-de-létape-1-9-octobre-2026). Aucun
niveau de sécurité n'est certifié.

## Réalisation de l'étape 1 (9 octobre 2026)

Choix techniques pris en construisant l'étape 1 du [plan](plan.md) : compte,
projets, classes, accès des élèves. Les règles restent en F01, F01.1 et F06.4
des [spécifications](specifications.md).

**Où vit le code.** Un dépôt Git dans `V1/`, le code dans `V1/app/` : Next.js 16
(App Router), React 19, TypeScript, `@supabase/supabase-js` et `@supabase/ssr`,
toutes versions figées dans `package.json` et `package-lock.json`. Les règles
sans base sont dans `src/domaine/` (année scolaire, prénoms, identifiant, mot
de passe, code, horaires), ce qui parle à la base dans `src/serveur/`, les
formes communes du système « Cahiers d'aventure » dans `src/styles/` et
`src/composants/`, le schéma dans `supabase/migrations/`. Les mots du code sont
ceux du [vocabulaire](../CONTEXT.md).

**Pas de composants mis en cache.** Le gabarit de Next.js 16 active
`cacheComponents` ; il est désactivé. Chaque page dépend de la personne
connectée et de l'état de ses accès, qui doit se lire à l'instant (classe
fermée, élève retiré) : un rendu à la demande, sans cache, est plus simple et
plus sûr. À revoir si une page publique en a besoin (lecteur en ligne, étape 7).

**Trois accès à la base, tenus par elle.** Toutes les tables ont leurs règles
d'accès aux lignes (RLS), et aucun droit n'est donné par défaut : chaque table
et chaque fonction reçoit ses droits un à un dans la migration.

| Accès | Qui | Ce qu'il peut |
| --- | --- | --- |
| `authenticated` | L'adulte connecté par Supabase Auth. | Ses seules lignes, par `enseignant_id = auth.uid()` ; inscrire et régler les horaires dans une classe en cours seulement. |
| `poste` | Un ordinateur où une classe est ouverte. | Lire, colonne par colonne, sa classe, ses élèves, ses horaires, le nom affiché de son enseignant. Rien écrire. |
| `service_role` | Le serveur de l'application. | Ouvrir une classe sur un poste et vérifier un code, avant qu'aucun jeton n'existe. |

**Accès de classe sans adresse électronique (V9).** L'accès de classe n'est pas
un compte Supabase. Le serveur vérifie l'identifiant et le mot de passe, crée
une ligne `postes` et pose sur le navigateur un jeton opaque, dans un cookie
que les scripts ne lisent pas ; la base n'en garde que l'empreinte. Pour lire
la base au nom du poste, le serveur signe à chaque demande un jeton de deux
minutes (ES256), dont le « sub » est l'identifiant du poste et le rôle
`poste`, un rôle PostgreSQL créé pour cela. Ce jeton ne quitte pas le
serveur. Les règles d'accès ne se fient à aucune information portée par le
jeton au-delà de cet identifiant : elles relisent la ligne `postes` à chaque
requête (classe en cours, mot de passe inchangé, heure de fermeture, élève
toujours inscrit et actif depuis moins de deux heures). Remplacer le mot de
passe, terminer l'année ou retirer un élève ferme donc les postes à la requête
suivante, sans attendre l'échéance d'un jeton.

Supabase accepte un jeton signé par l'application à condition d'en connaître
la clé publique : la clé privée est créée sur le poste du porteur
(`npm run cles`), gardée dans l'environnement de Vercel, et importée une fois
dans le projet Supabase comme clé de signature « en attente » (JWT Signing
Keys). Alternatives écartées : les comptes anonymes de Supabase, ouverts à
tout internet et limités à trente par heure et par adresse réseau, ce qu'une
salle de classe atteint ; un accès des élèves par la seule clé secrète du
serveur, où la base ne protégerait plus rien.

**Chiffrement des codes et du mot de passe de classe.** AES-256-GCM, par
l'application, avec une clé de 32 octets gardée hors de la base (`CLE_ACCES`,
dans l'environnement de Vercel). Chaque texte chiffré est lié à la ligne qu'il
protège : recopié sur une autre ligne, il ne se déchiffre pas. Les secrets sont
dans deux tables à part (`classes_secrets`, `eleves_secrets`), qu'aucun poste
ne lit. Le code tapé par un élève n'est comparé que sur le serveur, en temps
constant. La page d'une classe ne contient ni codes ni mot de passe tant que
l'enseignant ne les demande pas (F06-AC71). Perdre `CLE_ACCES` rend ces secrets
illisibles : il faudrait redonner un code à chaque élève. Sa rotation n'est pas
outillée ; la forme gardée porte un numéro de version (`v1.`) pour le permettre.

**Essais faux, tenus par la base.** Les compteurs sont mis à jour par des
fonctions SQL d'un seul tenant, que seul le serveur appelle : par profil pour
les codes (cinq de suite, deux minutes), par navigateur et par adresse réseau
pour l'entrée de la classe (dix de suite, cent en cinq minutes ; cinq minutes).
Le navigateur est reconnu par un cookie, l'adresse réseau par l'en-tête que
pose Vercel ; la base n'en garde que des empreintes.

**Horaires et fermetures.** L'heure se lit dans le fuseau de la classe
(`Europe/Paris`), par PostgreSQL comme par le serveur, qui suivent seuls
l'heure d'été. La fermeture nocturne est une heure d'échéance écrite à
l'ouverture du poste. La page d'un poste demande son état au serveur une fois
par minute, et après une absence : elle revient d'elle-même à l'écran qui
convient. L'enregistrement du texte avant cette fermeture se branchera là, à
l'étape 3.

**Compte de l'adulte.** Supabase Auth, adresse et mot de passe, ou compte
Google (décision du porteur, 9 octobre 2026), session dans des cookies que
les scripts ne lisent pas. Google est un fournisseur de Supabase Auth : ses
identifiants se règlent dans la console de Supabase, non dans l'application.
Supabase rattache seul le compte Google au compte existant de même adresse
vérifiée ; les inscriptions étant fermées, une adresse inconnue est refusée.
Le retour de Google passe par le même échange de code que « Mot de passe
oublié », valable sur le seul navigateur qui l'a demandé. Sans nom de
domaine, l'application reste non validée chez Google : l'écran de Google
montre l'adresse du projet Supabase au lieu du nom du produit. Les inscriptions publiques sont fermées
dans Supabase ; le compte du porteur se crée depuis sa console. « Mot de passe
oublié » passe par le courriel intégré de Supabase, limité à deux envois par
heure et aux adresses de l'organisation : suffisant pour un seul adulte, à
remplacer par un service d'envoi à l'étape 9.

**Tests.** Trois familles, nommées par critère d'acceptation : règles du
domaine et chiffrement (`npm test`) ; droits, fonctions et règles d'accès
contre une vraie base PostgreSQL de Supabase, lancée en local dans Docker
(`npm run test:base`), dont le test « un élève ne lit rien d'une autre
classe » ; parcours joués dans Chromium contre l'application compilée
(`npm run test:parcours`). Aucun ne parle à la vraie base.

**En ligne.** L'application est déployée chez Vercel, projet
`you-are-a-hero-v1`, à `https://you-are-a-hero-v1.vercel.app` ; ses fonctions
s'exécutent à Paris (`cdg1`). La base est un projet Supabase en offre
gratuite, région de Paris (`eu-west-3`). Le code est dans le dépôt GitHub
privé `lpdmots/you-are-a-hero-v1`. Le projet Vercel de la V0,
`you-are-a-hero`, n'est pas touché. Vérifié en ligne le 9 octobre 2026 : le
schéma est en place, rien ne se lit sans compte ni poste, la sauvegarde
fonctionne, et Supabase accepte le jeton d'un poste signé par l'application
une fois la clé de signature importée comme clé « en attente », sans la
faire tourner en clé courante (V9). Le parcours entier d'un élève n'a été
joué par les tests que sur la base locale, qui est le même logiciel ; le
porteur l'a joué en ligne à son essai, les 9 et 10 octobre 2026.

**Sauvegarde (V18).** `npm run sauvegarder` écrit les rôles, le schéma et les
données de la vraie base, comptes compris, par l'outil de Supabase, qui a
besoin de Docker ; `npm run restaurer` remet une base au schéma de
l'application puis y charge ces données. Les fichiers de Supabase Storage,
utilisés à partir de l'étape 2, n'y sont pas ; la base n'en tient que la liste
(`storage.objects`), hors de la sauvegarde elle aussi. Une restauration locale
remet la base à zéro, liste comprise, alors que les fichiers restent sur le
disque : la commande la lit avant et la réécrit après (13 octobre 2026). Vers
la vraie base, où rien n'est remis à zéro, elle n'y touche pas. Le fichier des clés de la vraie
application s'appelle `production.env`, et non `.env.production.local` : Next.js
charge de lui-même ce second nom, et une application lancée en local parlerait
alors à la vraie base.

## Réalisation de l'étape 2 (10 octobre 2026)

Choix techniques pris en construisant l'étape 2 du [plan](plan.md) : préparer
et organiser le récit. Les règles restent en F02, F03, F06.1, F06.2 et F10.1
des [spécifications](specifications.md).

**Le plan du récit dans la base.** Quatre tables, `parties`, `chapitres`,
`scenes` et `attributions`, chacune rattachée à son projet et à son
enseignant par des clés composées : une ligne ne peut pas désigner le parent
d'un autre projet. L'ordre est un rang par parent, resserré de 0 à n − 1 par
les fonctions qui déplacent (`placer_partie`, `placer_chapitre`,
`placer_scene`) ; la position qu'elles reçoivent se compte parmi les autres
éléments, ce qui est aussi ce que rend le glisser-déposer. La référence d'une
scène vient d'un compteur du projet, incrémenté dans la même opération que
l'insertion : deux scènes créées ensemble n'ont jamais la même, et une
référence supprimée n'est pas redonnée.

**Corbeille : une date, rien d'autre.** Supprimer pose `supprime_le` sur
l'élément ; ni ses enfants, ni ses attributions, ni les choix qui y mènent ne
sont touchés. Un élément est « dans le plan » tant que ni lui ni ses parents
ne portent cette date : c'est ce que relisent les règles d'accès des élèves,
si bien qu'un chapitre supprimé leur est fermé à la requête suivante et
rouvert à la restauration, sans rien recopier. Le départ du livre est une
colonne du projet qui continue de désigner une scène supprimée : le livre
n'a alors plus de départ, et le retrouve si elle est restaurée sans qu'un
autre ait été désigné. Alternative écartée : déplacer les lignes dans des
tables d'archive, qui aurait demandé de reconstruire liens et attributions.

**Ce qu'un poste d'élève lit, et par où.** Le rôle `poste` reçoit des
colonnes choisies de `projets`, `parties`, `chapitres`, `scenes` et
`attributions`. Les cartes (titres, images) se lisent pour tout élève
identifié de la classe, pendant les horaires ; les scènes, pour les chapitres
attribués, ou pour tous quand la lecture de l'histoire est ouverte. Le résumé
d'un chapitre et les consignes ne sont pas des colonnes que le poste peut
demander : deux fonctions les rendent après avoir vérifié l'attribution, ce
qui garde la lecture ouverte sans consigne. Le poste n'écrit dans aucune
table : les quatre gestes du profil « écriture et organisation » passent par
des fonctions `eleve_…` qui relisent à chaque appel l'élève identifié, les
horaires, l'attribution et le profil. La fonction qui dit si une scène
« contient du travail » existe déjà et répond « non » : l'étape 3 la fera
répondre d'après le texte, les images et les remises, sans toucher aux
appelants.

**Qui s'occupe d'une scène.** Deux colonnes de `scenes` : l'élève de
référence, qui doit être attribué au chapitre, ou l'enseignant lui-même,
jamais les deux. L'adulte les écrit ; le poste les lit avec la scène. Retirer
un élève d'un chapitre efface ses prises en charge dans ce chapitre. Ce que
les élèves font eux-mêmes se construira à l'étape 4 sur ces mêmes colonnes.

**Images de repérage.** Un seau privé de Supabase Storage, `images`. Le
navigateur vérifie le fichier (JPEG, PNG ou WebP, 20 Mo), le redessine en
JPEG à deux tailles — 2 600 points au plus grand côté, de quoi imprimer en
pleine page, et 900 pour l'écran —, puis dépose les deux fichiers lui-même
par des adresses à usage unique que le serveur lui donne. Le serveur relit
ensuite ce qui a été déposé, refuse ce qui n'est pas un JPEG, et inscrit
l'image dans le projet. Ce détour évite la limite de 4,5 Mo des fonctions de
Vercel. Aucune image ne se lit directement dans le stockage : l'adresse
`/images/<identifiant>` demande d'abord à la base si la personne peut la
voir (l'adulte, ses images ; un poste, celles qui servent de repère dans le
récit de sa classe), puis rend le fichier. Les visuels de l'application sont
des fichiers livrés avec elle (`public/illustrations/`), listés dans
`src/domaine/visuels.ts`.

**Glisser-déposer.** `@dnd-kit/core` et `@dnd-kit/sortable`, versions figées.
Un clic ouvre la carte, elle ne se déplace qu'une fois tirée de huit points ;
au clavier, le repère de prise se saisit par Espace ; sur un écran tactile,
par un appui long. L'ordre montré pendant et juste après le geste est tenu
par la page jusqu'à ce que le plan enregistré revienne, puis abandonné : il
n'y a pas de second état à réconcilier.

**Enregistrement des champs.** Les panneaux et le carnet enregistrent après
une pause de frappe et à la sortie du champ, chaque champ sous sa propre
clé : ce qui attend pour l'un n'est pas chassé par un changement dans un
autre.

**Tests.** 225 passent à la fin de l'étape — 48 sur les règles, 89 contre la
base locale, 88 parcours joués dans Chromium. Les deux migrations ont été rejouées ensemble
dans une base vide, à part, et donnent le schéma de la base locale.

## Réalisation de l'étape 3 (10 octobre 2026)

Choix techniques pris en construisant l'étape 3 du [plan](plan.md) : écrire
une scène et relier les choix. Les règles restent en F04, F05, F08, F10 et
F11.5 des [spécifications](specifications.md). Cette section s'écrit lot par
lot ; l'avancement est dans le plan.

**L'éditeur.** Plate 53 sur Slate (ADR 0002), versions figées dans
`package.json` et son fichier de verrouillage : `platejs` 53.3.14,
`@platejs/basic-nodes` 53.0.0, `slate` 0.126.2, `slate-react` 0.127.1,
`slate-dom` 0.126.0. Aucun code du prototype n'est repris. Plate apporte les
greffons, les trois mises en forme et l'historique d'annulation ; les règles
de la copie s'écrivent contre Slate, dans `src/composants/copie/`. Les
identités des blocs sont tenues par la copie, le greffon d'identité de Plate
étant désactivé : un paragraphe coupé en deux garde la sienne d'un côté et en
reçoit une de l'autre. L'éditeur est rendu par le serveur puis repris par le
navigateur, sans avertissement.

**Le texte dans la base.** Deux colonnes de `scenes` : `texte`, la suite des
blocs telle que l'éditeur la tient, en JSON, et `version`, qui augmente d'un
à chaque enregistrement. `texte_vide` est une colonne calculée par la base
d'après le texte, pour que les listes disent « Texte vide » sans lire les
textes ; une note de l'enseignant n'y compte pas. Personne n'écrit ces
colonnes directement, pas même l'adulte : elles ne se changent que par des
fonctions, et un poste d'élève n'a pas le droit de lire la colonne du texte,
où sont les notes.

**Enregistrer, d'un seul tenant (V7).** La page envoie le texte et la
version qu'elle connaît. Le serveur de l'application ne laisse passer que ce
qu'il reconnaît (`nettoyerTexte`), puis une fonction de la base verrouille la
ligne de la scène, compare les versions et, dans la même opération, écrit le
texte ou le garde à part dans `copies_recuperation`. Il n'y a donc aucun
instant où un texte refusé n'est gardé nulle part. Un texte identique à
celui de la scène n'est ni écrit ni gardé : c'est le cas d'une réponse
perdue en route, que la page renvoie, et qui ne doit pas faire un conflit
avec soi-même. L'échange (« Mettre ce texte dans la scène ») verrouille la
scène puis relit le texte gardé à part sous ce verrou : deux échanges
demandés ensemble se suivent sans rien perdre. L'arrêt d'un élève n'est pas
un état de plus : il est arrêté tant qu'un texte né d'un refus, à son nom,
est gardé pour cette scène, ce que la base relit à chaque demande, d'où
qu'elle vienne.

**Une adresse plutôt qu'une action.** Le texte s'enregistre par `POST
/copie`, et non par une action du serveur, pour que la page puisse encore y
envoyer ce qui attend au moment où elle se ferme (`keepalive`). Le navigateur
peut abandonner cet envoi : la page ne dit « Enregistré » qu'après la
réponse. Un seul envoi part à la fois, le suivant avec la version que le
précédent a rendue ; rien de l'enregistrement ne touche à l'éditeur ni à son
curseur.

**Quitter une scène.** Une copie ouverte s'inscrit dans un registre
(`sortie.ts`). Tant qu'elle l'est, un clic sur un lien de l'application ou
l'envoi d'un formulaire (« Changer d'élève ») est retenu, le texte en attente
est enregistré, puis la commande est rejouée ; si l'enregistrement échoue, la
page reste et le dit. La veille du poste passe par le même registre avant de
ramener la page à l'écran qui convient.

**Dernier enregistrement d'un poste qui se ferme (V10).** Quand un élève
ouvre une scène pour écrire, la base crée une ligne `ecritures` (scène,
élève, poste) et la page en reçoit l'identité. Chaque enregistrement la
présente avec le cookie du poste. Tant que l'accès tient, la base contrôle
tout comme d'habitude ; quand il vient de se fermer — fin de plage, deux
heures sans activité, mot de passe remplacé, année terminée —, elle accepte
un dernier enregistrement, soumis aux mêmes protections, puis clôt la ligne.
Alternative écartée : un jeton signé sans ligne en base, qui ne permettait
pas de dire « une seule fois ».

**Versions précédentes.** Une table à part, `versions_precedentes`, remplie
par la fonction d'enregistrement : le texte d'avant, s'il n'est pas vide, à
la première modification d'une personne un jour donné, ce que tient un index
unique. Le jour se compte au fuseau de la classe.

**Collage.** Un collage venu d'ailleurs est relu par la copie elle-même
(`lireCollage`), et non par le désérialiseur de Plate : chaque bloc du
document collé donne un paragraphe, seuls le gras, l'italique et le souligné
passent, lus dans les balises comme dans les styles (Google Docs écrit le
gras en style, dans une balise `<b>` qui n'est pas grasse). Un fragment copié
depuis une scène de l'application repasse par `nettoyerTexte`.

**Tests.** Les parcours tournent dans un Chromium qui se présente comme un
Chrome de Windows sur un Mac : l'éditeur y attend Ctrl+Y pour rétablir. Pour
poser le curseur par programme, la copie expose son éditeur à la page quand
`NEXT_PUBLIC_ESSAIS` vaut 1, ce que seule la configuration des parcours
règle ; l'application en ligne ne l'expose pas.

**Phrase de choix et renvoi (lot 2).** Un choix est un bloc du texte, de type
`choix`. Automatique, il ne porte que son libellé, sa construction et sa
destination : la phrase se compose à l'affichage, avec la formule du livre,
et rien ne s'y tape. Personnalisé, il porte son texte et un ou plusieurs
`renvoi`, éléments d'un seul bloc placés dans la ligne. Aucun numéro n'est
écrit dans un texte. Slate ne connaît de bloc fermé que sans contenu : la
phrase automatique, et tout bloc que la personne n'a pas le droit de
modifier, sont déclarés tels à Slate, et les règles de `regles.ts` tiennent
ce que Slate ne tient pas — suppression d'une sélection à cheval, fusion,
frappe, collage, identités uniques, renvoi interdit dans un paragraphe de
récit, phrase sans renvoi rendue au récit.

**Deux pièges de l'éditeur, trouvés par les parcours au clavier.** Plate ne
tient une touche pour traitée que si le gestionnaire le lui dit en rendant
vrai : l'empêcher par `preventDefault` ne suffit pas, et Slate traitait la
touche une seconde fois (deux phrases supprimées d'un seul « Suppr. »). Et
l'éditeur qui vient de poser sa sélection ignore un instant qu'il a perdu le
curseur : il le reprenait à la fiche qui s'ouvrait, si bien que le libellé
tapé partait dans le texte. La copie lui fait donc lâcher le curseur avant
d'ouvrir une fiche.

**Réglages hors du texte.** Depuis le 11 octobre 2026, une fiche ne se pose
plus dans la copie : ce qui a des champs s'ouvre dans un panneau que la page
tient à droite du texte, et que la copie remplit par un portail React
(`panneau`, `onPanneau`) ; sans panneau fourni, la fiche se rend sous la
copie. Les listes courtes (commandes, objets, formules) sont dessinées
par-dessus le texte, sous la ligne du curseur ou sous le bloc, hors du
cadre de la copie s'il le faut. Le texte ne contient donc que du texte, une
fiche ouverte ne s'enregistre jamais, et rien n'est mesuré pour lui garder
une place. La phrase de choix en attente, pendant qu'on la crée, n'est pas
dans le texte non plus : le bloc après lequel elle se posera la dessine à
sa suite, d'après ce que la fiche lui dit de la saisie. La fiche se referme quand une opération d'écriture arrive alors que
le curseur est dans le texte : ce que la fiche change elle-même, ou la
commande qui l'ouvre, se fait curseur lâché et ne compte pas ; un bloc
déplacé n'est pas une écriture.

**Placement des menus.** `@floating-ui/dom`, version figée, derrière une
seule fonction, `poser` (`src/composants/flottant.ts`) : elle place un menu,
une liste ou une bulle près de son repère, du côté où la fenêtre a la place,
le ramène dans la fenêtre, limite sa hauteur en dernier recours, et garde le
côté retenu tant qu'il reste ouvert. Le menu à trois points et la bulle se
placent dans leur parent ; les listes de la copie en position fixe, parce
que le cadre de la copie coupe ce qui en dépasse, avec pour repère la ligne
du curseur, que l'éditeur sait situer même après avoir lâché le curseur.
Rien n'est déplacé hors de son parent dans la page : les styles et les
parcours retrouvent un menu là où il était. Alternatives écartées : shadcn
ou Radix, qui amènent leurs composants et, pour le premier, Tailwind, à côté
des styles de l'application ; un calcul maison, que la demande d'une règle
pour tous les menus ne justifiait plus.

**La phrase d'un choix, écrite dans le panneau (11 octobre 2026).** Le
contenu ne change pas : un bloc `choix`, automatique ou fait de textes et de
`renvoi`. Ce qui change est l'endroit où il s'écrit. Dans l'éditeur, tout
bloc `choix` est déclaré fermé à Slate, comme l'était la seule phrase
automatique : le curseur se pose dessus, jamais dedans, et les règles de la
copie écrites pour une phrase ouverte (frappe, fusion, sélection d'un
morceau) ne trouvent plus rien à faire. Dans le panneau, la phrase est une
suite de petits champs de texte séparés par ses numéros, sans second
éditeur : un numéro ne peut pas s'effacer puisqu'il n'est dans aucun champ,
et chaque frappe remplace le bloc dans le texte de la scène, où la phrase
se relit aussitôt. Un geste fait dans un bloc fermé — changer la
destination d'un renvoi, en retirer un — doit le dire à Slate (`voids`),
qui sinon n'y entre pas. L'ordre des destinations échange les cibles des
renvois sans les déplacer. Alternatives écartées : un second éditeur Plate
dans le panneau, avec ses propres règles de protection des numéros ; garder
l'écriture dans le texte et n'ajouter qu'un aperçu à droite.

**Signe d'une action et d'une formule.** Le signe d'une action est une
propriété de son bloc dans le texte, `signe`, absente pour le crayon ; le
serveur n'en laisse passer que les quatre connus. Celui d'une formule est
une colonne de `formules`, `signe`, « crayon » par défaut, que la fonction
des postes rend avec la formule (`20261011100000_signe_des_formules.sql`).
Cette migration est appliquée à la vraie base depuis le 11 octobre 2026 :
elle ne se modifie plus.

**Scènes proposées.** Une fonction du domaine, `scenesProposees`
(`src/domaine/proposer.ts`), compare les mots du libellé aux titres et aux
consignes, sans accents ni petits mots, au pluriel près ; un mot que
portent plus de quatre scènes sur dix est laissé de côté. Elle tourne dans
la page, sur les scènes que la personne connaît déjà : la consigne des
scènes est donnée à la page de l'adulte, pas à un poste d'élève, où seuls
les titres comptent. Aucune demande au serveur, aucune IA.

**Presse-papiers.** Ce qui part porte trois formes : les blocs de la copie,
l'origine (scène, projet, coupé ou copié) et un texte simple où chaque phrase
montre le numéro affiché. Au retour, un choix coupé garde son identité, un
choix copié en reçoit une ; un choix que la personne n'a pas le droit de
créer ici, ou qui vise une scène que sa page ne connaît pas, est écarté.

**Liens.** La table `liens` se déduit du texte : un déclencheur la refait à
chaque enregistrement d'une scène, d'après ses renvois. Rien d'autre n'y
écrit, et les chemins, les recherches et le dialogue de suppression la
lisent. Un texte gardé à part n'y entre pas tant qu'il n'est pas le texte de
la scène. Le serveur redonne une identité à un bloc ou à un renvoi dont
l'identité existe déjà dans une autre scène, de façon reproductible, pour
qu'un envoi rejoué donne le même texte.

**Droits sur les choix, contrôlés deux fois.** L'éditeur d'un élève ferme
les blocs qui lui sont réservés, et refuse toute opération qui les
toucherait, d'où qu'elle vienne. Le serveur ne s'y fie pas : à chaque
enregistrement d'un élève, il compare le texte reçu au texte de la scène
(`controlerTexte`) — les blocs réservés doivent tous être là, identiques et
dans le même ordre, sans aucun de plus. Un texte refusé est gardé à part,
comme tout refus.

**Numéros (F11.5).** Deux colonnes des scènes, `rang_livre` et
`numero_fixe`, et la date `ordre_etabli_le` du projet. L'ordre du livre
s'établit une fois, au premier renvoi enregistré ou à l'ouverture de « Fixer
son numéro… » : les scènes de chaque groupe sont mélangées en évitant de
placer côte à côte les destinations d'un même choix, et le rang est gardé ;
une scène créée ensuite se range à la suite. Les numéros se calculent à
chaque lecture (`numeroter`), d'après le plan, ces rangs et les numéros
fixés ; un poste d'élève reçoit de la base de quoi faire le même calcul,
sans les titres des scènes qu'il ne peut pas lire.

**Chemins (V15), refaits le 12 octobre 2026.** La vue se déduit toujours du
plan et des liens, sans rien de plus dans la base ; elle est dessinée avec
React Flow (`@xyflow/react` 12.12.0) et dagre (`@dagrejs/dagre` 3.1.1),
versions figées, sur décision du porteur
([F03.1](specifications.md#f031--histoire-parties-chapitres-et-scènes)). La
première vue, sans bibliothèque, rangeait les scènes en colonnes par pas
depuis l'entrée et traçait ses traits d'une carte à l'autre : rien n'y
évitait les croisements, ni les traits sous les cartes.

- **Trois fichiers.** `src/domaine/chemins.ts` : les chemins d'un chapitre
  d'après le plan, l'ordre de lecture, ce qui est « à regarder » — sans
  bibliothèque ni écran. `src/composants/chemins/disposer.ts` : la place de
  chaque carte et le tracé de chaque trait, par une fonction qui ne dépend
  pas du navigateur et se teste seule. `src/composants/chemins/Schema.tsx` :
  le dessin, avec React Flow. `src/composants/Chemins.tsx` choisit entre le
  schéma et la liste du téléphone.
- **Chargées à l'ouverture seulement.** Le schéma est importé par
  `next/dynamic`, sans rendu côté serveur, et seulement sur un écran de plus
  de 720 points : les deux bibliothèques (240 Ko, 78 Ko compressés) ne
  partent qu'à l'ouverture de « Chemins », jamais sur téléphone ni dans la
  vue « Scènes ». La feuille de style de React Flow (2 Ko compressés) suit
  le même chemin.
- **Ce que fait dagre.** Il range les scènes par rangs, de haut en bas,
  réserve entre deux rangs la place des libellés — chaque libellé lui est
  donné avec sa largeur, mesurée avec la police de l'outil —, ordonne chaque
  rang pour réduire les croisements et garde une place aux traits longs
  entre les cartes. Les scènes lui sont données dans l'ordre où on les
  rencontre depuis l'entrée du chapitre : les choix qu'il retourne pour
  ranger un récit qui boucle sont alors de vrais retours en arrière.
- **Ce qui est fait ici.** Les tracés de dagre, des lignes brisées d'un
  centre de rang à l'autre, passaient sous les coins des cartes dès qu'un
  trait se déplaçait de côté ; adoucis en courbes, ils se confondaient entre
  deux rangs. `disposer` reprend donc ses points et mène les traits à angles
  droits : tout droit dans la hauteur d'un rang, à la place que dagre a
  gardée ; de côté seulement entre deux rangs, chaque trait sur sa propre
  ligne, celui qui part le plus loin passant au-dessus pour ne pas croiser
  son voisin. La hauteur entre deux rangs suit le nombre de ces lignes. Les
  traits d'une même carte s'attachent à des points écartés, dans l'ordre où
  ils partent. Les morceaux du chapitre que rien ne relie sont disposés à
  part et rangés en lignes.
- **Ce que fait React Flow.** Il dessine les cartes et les traits, tient la
  taille, la scène choisie, le parcours au clavier et les bulles à taille
  réelle. Son déplacement à la souris, son zoom à la molette et sa
  mini-carte sont coupés : le porteur veut une page qui défile normalement,
  et le schéma prend donc toute sa hauteur dans la page. La mini-carte est
  écrite ici, parce qu'elle suit le défilement de la page, que React Flow ne
  connaît pas. Les tailles sont données à chaque carte : rien n'est mesuré
  après coup, et le schéma ne se montre qu'une fois à sa place.
- **Mention « React Flow ».** La bibliothèque, sous licence MIT, affiche son
  nom dans un coin du schéma, avec un lien vers son site ; elle est masquée,
  ce que ses auteurs admettent pour un projet personnel et demandent de
  compenser par un abonnement dans un produit qui rapporte. À trancher à
  l'ouverture commerciale ([plan](plan.md), étape 9) : afficher la mention,
  ou soutenir la bibliothèque. Côté élève, un lien qui sort de l'outil
  n'est de toute façon pas souhaitable.
- **Mesures (V15).** Quarante scènes à deux ou trois choix chacune, dans un
  livre de deux cents, s'affichent en moins d'une seconde dans l'application
  compilée (la limite fixée est de trois) ; la disposition seule prend
  quelques dizaines de millisecondes. Sur le chapitre d'essai de trente-deux
  scènes, en 1 366 points de large : 9 croisements au lieu de 30, aucun
  trait sous une carte au lieu de 3 traits sous 10 cartes, plus de
  défilement de côté. Les parcours comptent les croisements et les traits
  sous une carte d'après ce qui est dessiné ; les tests de `disposer`
  vérifient que deux traits ne suivent jamais la même ligne. Le chapitre de
  quarante scènes, plus serré qu'un vrai livre, garde 125 croisements.
- **Alternatives écartées.** Les tracés de React Flow entre deux poignées,
  qui ignorent les cartes placées entre elles ; les courbes passant par les
  points de dagre ; elkjs, qui sait tracer à angles droits mais n'est pas la
  bibliothèque que le porteur a retenue, et n'a pas été essayé.
- **Écran tactile.** React Flow retient le doigt pour déplacer son schéma
  (`touch-action: none`) ; la feuille de style de l'application le lui rend,
  pour qu'il fasse défiler la page. Essayé en tactile simulé dans Chromium.
- **Non vérifié :** une tablette réelle, Firefox et Safari.

**Liaison cachée (lot 3).** Un bloc `liaison` du texte, rangé à la fin : la
table des liens, les numéros, l'enregistrement, les versions et les conflits
valent pour elle sans rien de plus. Mais elle n'est pas dans l'éditeur : la
copie la tient à part, dans la zone « Hors du récit », et l'ajoute au texte
qu'elle envoie. Une sélection « tout » ne l'emporte donc pas, et le curseur
n'y entre jamais. Le numéro de sa destination se fixe par la fonction de
« Fixer son numéro… », avant que la liaison n'entre dans le texte ; il
appartient à la scène, pas à la liaison.

**Note de l'enseignant.** Un bloc `note` du texte, que la base n'envoie
jamais à un poste : ni dans la scène qu'il ouvre, ni dans sa recherche, ni
dans les destinations qu'il choisit. Le texte qu'un élève renvoie n'en porte
donc aucune ; c'est la fonction d'enregistrement qui les remet, sous le
verrou de la scène (`prive.remettre_les_notes`) : chaque note après le bloc
qui la précédait et qui existe encore, sinon en tête. Le texte gardé à part
après un refus reste celui de l'élève, sans note ; mis dans la scène, il
reprend celles de la scène. Alternative écartée : faire cette remise dans le
serveur de l'application, hors du verrou, où une note posée entre la lecture
et l'écriture aurait pu se perdre.

**Paragraphe protégé.** Une propriété du paragraphe, `protege`. Pour un
élève, c'est un bloc réservé comme une phrase de choix préparée : fermé dans
l'éditeur, gardé par les opérations, contrôlé par le serveur. Le « + » qui
ouvre un paragraphe au-dessus d'un bloc fermé est dans chaque bloc fermé, et
la feuille de style ne le montre qu'au-dessus du premier bloc ou entre deux
blocs fermés : aucun calcul de voisinage, donc aucun affichage en retard.

**Rendre le curseur au texte.** Après un changement, le bloc où le curseur
doit aller n'est pas encore à l'écran, et l'éditeur échoue à s'y poser : la
copie réessaie, d'abord au plus vite, puis au rythme de l'écran
(`reprendreLeTexte`). Un clic sur une commande dessinée dans un bloc fermé
ne remonte pas à l'éditeur, qui reposerait sa sélection sur ce bloc.

**Objets et actions de jeu (lot 4).** L'action de jeu est un bloc `action`
du texte, à texte libre et sans mise en forme ; l'objet n'est rien de
particulier, son nom s'écrit comme du texte. Les deux listes viennent de la
préparation. Un poste d'élève ne lit pas leurs tables : une fonction de la
base lui donne les objets, dans le chapitre où il écrit, et les formules s'il
a le profil qui écrit des actions. Les droits sur l'action passent par la
règle commune des blocs réservés — fermés dans l'éditeur, contrôlés par le
serveur.

**Identité du paragraphe d'une scène vide.** Une scène sans texte s'ouvre
sur un paragraphe où écrire, qui n'est pas dans la base. Son identité se
déduit de celle de la scène, pour être la même dans la page dessinée par le
serveur et dans celle que reprend le navigateur : tirée au hasard des deux
côtés, la page gardait celle du serveur, l'éditeur celle du navigateur, et
une fiche ne retrouvait pas le bloc sous lequel se poser.

**Images dans la scène (lot 5, V12).** Deux éléments du texte : `image`, un
bloc fermé qui porte sa largeur, sa légende et son texte de remplacement, et
`image-ligne`, un élément d'un seul bloc dans la ligne, comme le renvoi. Tous
deux désignent une image du projet par son identité : le fichier n'est jamais
dans le texte. L'import reprend celui des images de repérage — le navigateur
réduit à 2 600 points et dépose, le serveur relit — avec une différence : une
image à fond transparent garde sa transparence, en WebP ou en PNG, et la base
retient son format pour la servir. L'adresse `/images/…` vérifie dans la base
qui peut voir l'image : un poste, celles des scènes qu'il peut lire.

**« Une image qui n'y était pas ».** Un élève déplace une phrase qui porte
une image, mais n'en fait entrer aucune. Entre couper et coller, le texte
s'enregistre sans l'image : comparer au seul texte courant aurait refusé le
collage et arrêté l'élève. La scène retient donc les images qu'elle a
portées (`images_vues`, tenue par un déclencheur), et le contrôle du serveur
s'y réfère.

**Scènes voisines (lot 6).** Une seule fonction de la base sert l'adulte et
le poste d'un élève (`voisines_de_la_scene`) : elle reconnaît qui l'appelle
et ne rend d'une scène voisine que ce que cette personne peut en lire —
l'extrait, ou le seul titre public du chapitre. Les extraits se dessinent
autour de l'éditeur, jamais dedans : ils ne peuvent ni se modifier ni
s'enregistrer avec la scène. La préférence « Scènes voisines » est une
colonne du compte de l'adulte et une colonne du profil de l'élève.

**Montées de version (V19).** Plate, Slate et leurs greffons sont figés dans
`package.json`, comme React Flow et dagre, dont le filet est fait des tests
de la vue « Chemins » (`tests/unitaires/chemins.test.ts`,
`tests/parcours/chemins.spec.ts`). Tout ce que la copie fait contre Slate est dans `regles.ts`,
et les scénarios du prototype de l'éditeur, réécrits pour l'application,
sont le filet d'une montée de version : `tests/parcours/choix.spec.ts`,
`proteger.spec.ts` et `jeu.spec.ts`.

## Réalisation de l'étape 4 (13 octobre 2026)

Choix techniques pris en construisant l'étape 4 du [plan](plan.md) : faire
travailler la classe. Les règles restent en F06.3, F06.5, F07 et F11.1 des
[spécifications](specifications.md). Cette section s'écrit lot par lot ;
l'avancement est dans le plan.

**L'état, une colonne (lot 1).** `scenes.etat` porte l'un des cinq états ;
« Prête » en est un, et non un repère à côté de « Validé » : la retirer est
le choix d'un autre état (F11-AC93). « Texte vide » n'est pas dans la base :
c'est « En cours » sans texte, calculé à l'affichage d'après `texte_vide`
(`tamponDe`, dans `src/domaine/etats.ts`, qui réunit les noms, les signes,
les phrases et les états permis). Personne n'écrit cette colonne
directement, pas même l'adulte : elle ne change que par `changer_etat`, qui
vérifie à qui est la scène et quels états elle peut prendre — cinq quand un
élève s'en occupe, trois sans élève, deux dans un projet personnel.

**Validation suspendue, d'un seul tenant.** La page présente la version du
texte qu'elle montre et un second compteur, `scenes.tour`, qui avance à
chaque changement d'état, remise ou retrait. Pour « Validé » et « Prête »,
la fonction verrouille la scène, compare les deux et, s'ils ne sont plus
ceux de la base, ne change rien et le dit (F07-AC26) : il n'y a pas
d'instant où une validation passerait sur un texte que l'enseignant n'a pas
lu. Un compteur à part, parce que la version du texte ne doit pas bouger
quand l'état change : la page d'un élève qui écrit y verrait un conflit.
L'enregistrement dit à la page la version qu'il obtient (`onVersion`), sans
passer par l'affichage : elle est juste dès que l'envoi est revenu.

**Ce qui attend avant de changer l'état.** La page enregistre d'abord ce que
l'adulte vient de corriger (`avantDePartir`, comme pour quitter la scène) ;
si l'envoi échoue, l'état ne change pas (F07-AC65). Après un conflit de
l'adulte, la page montre un texte qu'il n'a pas relu : elle le retient, et
le premier choix de « Validé » ou de « Prête » le lui dit au lieu de passer
(F08-AC21).

**Remises et remarques.** Deux tables, `remises` (le texte tel qu'il a été
remis, sans les notes de l'enseignant) et `remarques` (une ligne par reprise
demandée, même sans remarque écrite, liée à la dernière remise et à l'élève
qui s'occupait de la scène). L'adulte les lit ; un poste ne lit ni l'une ni
l'autre directement. Changer l'état ne crée ni ne supprime de remise.

**L'état pour les élèves.** `refus_d_ecrire`, que la base consulte à chaque
ouverture et à chaque enregistrement, refuse l'écriture en « À valider »,
« Validé » et « Prête ». Un élève qui tapait encore quand la scène a changé
d'état voit donc sa phrase gardée à part, comme tout refus (F08-AC19). Le
poste lit la colonne `etat` des scènes qu'il lit déjà.

**Les gestes de l'élève (lot 2).** Un poste ne change rien directement :
prendre, rendre, annuler, remettre, retirer la remise et lire la remarque
sont des fonctions de la base, que seul le rôle du poste peut appeler.
Chacune verrouille la scène, puis relit qui est l'élève, s'il est du
chapitre, s'il est arrêté et où en est la scène : deux élèves qui prennent
la même scène au même instant ne peuvent pas tous deux la recevoir. « Je
m'en occupe » envoie, pour chaque scène, l'élève que la page y montrait ;
une scène qui a changé de main entre-temps n'est pas prise, et la réponse
la nomme. Les scènes d'une sélection sont verrouillées dans le même ordre
pour tous, afin que deux sélections croisées ne se bloquent pas.

**Remettre.** La page enregistre d'abord la dernière saisie, puis présente
la version obtenue : la base ne conserve le texte que si c'est encore celui
de la scène, d'un seul tenant avec le passage à « À valider » (F07-AC28,
AC29). Après un conflit, la version présentée n'est plus la bonne : rien
n'est remis.

**Annuler un geste.** Trois colonnes de la scène retiennent le dernier
geste d'un élève sur « qui s'en occupe » — qui, qui s'en occupait avant,
quand. Un déclencheur les efface dès que la scène change de main
autrement : l'enseignant, une remise, un autre élève. L'annulation n'est
donc possible que si rien n'a changé depuis, et la base la borne à une
demi-heure, la page ne la proposant que tant qu'on y reste.

**Ce que le poste lit de la relecture.** `relecture_du_poste` rend à un
élève du chapitre la dernière remise et la dernière remarque, et rien hors
de son chapitre ; les tables restent fermées au poste. L'arrêt de l'élève
se lit à part (`suis_je_arrete`) : une scène remise ou validée répond
d'abord qu'elle ne s'écrit plus, et la page doit pourtant savoir qu'il n'y
retire pas la remise.

**« Mon travail » (lot 3).** Aucune fonction de plus : le poste lit déjà
les scènes de ses chapitres, avec leur état et qui s'en occupe. Le serveur
ne garde que celles de l'élève et les range (`src/domaine/travail.ts`) :
l'urgence d'abord, puis la place dans le plan.

**Retrait d'un élève.** Une fonction, `retirer_eleve`, met fin à
l'inscription et supprime ses attributions dans les projets de la classe ;
c'est le déclencheur des attributions, le même que pour un élève retiré
d'un seul chapitre, qui décide du sort de ses scènes : celles qui
s'écrivaient encore n'ont plus d'élève, les autres gardent son prénom. Ce
que le retrait a défait est gardé sur l'inscription (`retrait`), de quoi
l'annuler pendant une heure. Une scène dont l'élève n'est plus dans le
chapitre se reconnaît à cela seul — elle porte un élève qui n'y est pas
attribué — sans colonne de plus ; le plan relit alors son prénom
(`Scene.ancien`), que la liste des élèves de la classe ne donne plus.

**Le Suivi (lot 4).** Aucune table, aucune fonction de plus : le Suivi est
une lecture du plan, que la page de l'onglet charge déjà. Tout ce qu'il
liste, compte et propose est calculé par des fonctions sans base
(`src/domaine/suivi.ts`) : la liste selon ses filtres, les nombres des
tampons, le bilan par élève, la scène suivante à valider, l'avancement que
porte la carte du projet. Les filtres sont dans l'adresse de la page, écrite
sans la recharger : « Retour au Suivi » les retrouve parce que la scène
garde cette adresse (`?de=suivi&suivi=…`), et une entrée par l'onglet, qui
n'en porte aucune, repart de « Toutes ». L'endroit quitté est gardé par le
navigateur le temps de la visite (`sessionStorage`), puis remis une fois
que la page a fini de se placer en haut. L'écran d'aide suit le motif du
plan : « Ne plus afficher » tient au compte (`aides_masquees`), « déjà vue
pendant cette visite » à un témoin de navigation.

**Les fiches de rédaction (lot 5).** Aucune table, aucune fonction de base
de plus. Tout ce que la page propose est calculé sans base
(`src/domaine/fiches.ts`) : ce qui se choisit, les feuilles, le partage des
scènes sans élève, le nombre fixé, le complément ; la page ne fait que
l'afficher, et ce qui est affiché est ce qui s'imprime. La feuille est du
HTML ordinaire, imprimé par le navigateur (`window.print`) avec une feuille
de style d'impression qui masque tout le reste : pas de PDF, la chaîne du
livre (Paged.js, Chromium) n'y sert pas. Le partage n'est écrit qu'à la
confirmation, par une mise à jour qui ne touche que les scènes restées
libres ; la base vérifie, comme pour toute prise en charge, que l'élève est
du chapitre. « Annuler la répartition » tient à l'état de la page et non à
la base : la page quittée, rien ne distingue plus une scène donnée par le
partage d'une scène prise autrement, ce qui est la règle (F07-AC73).

**Réglages des fiches gardés (14 octobre 2026).** Une colonne `jsonb`
au compte de l'enseignant, `reglages_fiches` (par chapitre ou par élève, à
la suite, nombre de scènes), qu'il est seul à modifier, comme ses autres
préférences (`voisines`, `aides_masquees`). La page la relit sans confiance
(`lireReglages`, qui rend les valeurs habituelles pour ce qui manque ou est
abîmé) et l'écrit 400 ms après le dernier changement ; ce que la page choisit
pour une seule fois (par chapitre faute d'élève) n'y est pas écrit.

**Encouragements et classement (lot 6).** Une table `encouragements` :
une ligne par scène, élève et catégorie, l'élève étant celui qui s'occupait
de la scène quand le tampon a été donné, ce qui suffit à le lui laisser
quand la scène change de main. L'adulte la lit par son accès et ne l'écrit
que par `encourager(scène, catégorie, donner)`, qui dit ce qu'on veut et non
« l'inverse de ce qui est » : deux clics partis ensemble ne se contredisent
pas. Le poste ne lit jamais la table. `mes_encouragements(projet)` lui rend
les tampons de l'élève identifié et, quand `projets.classement_montre` est
vrai, les trois meilleurs totaux de chaque catégorie, calculés dans la base
(`dense_rank`) parmi les élèves encore inscrits : le total d'un camarade
hors de ces trois ne quitte pas le serveur, ce qu'un tri fait dans la page
n'aurait pas garanti (F07-AC86). Le classement de l'enseignant, entier, est
calculé sans base (`src/domaine/encouragements.ts`) d'après les tampons du
projet. Rien n'est écrit sur la scène : ni son état, ni son texte, ni le
livre ne changent.

**Rappel avant « prête ».** Calculé par le serveur au moment du choix,
d'après le texte que la page vient d'enregistrer et les liens que la base en
a tirés : il suit ce qu'on vient de taper, ce que la maquette ne faisait
pas.

## Réalisation de l'étape 5 (14 octobre 2026)

Choix techniques pris en construisant l'étape 5 du [plan](plan.md) : lire
le récit à l'essai et contrôler les chemins. Les règles restent en F09,
F11.6, F04.2, F05.1 et F03.1 des [spécifications](specifications.md).
Cette section s'écrit lot par lot ; l'avancement est dans le plan.

**Une seule règle pour les contrôles (lot 1).** `controler`
(`src/domaine/controles.ts`), sans base : elle reçoit le plan et ses liens,
le type de récit, la présence d'une feuille d'aventure et les scènes dont le
texte porte une action de jeu, et rend chaque point avec sa gravité
(bloquant, avertissement, « à savoir »), l'étape et la tâche de F11.6 où il
se traite, une clé stable et, pour un défaut d'écriture d'une scène à finir,
la marque « reporté ». La destination Livre l'affichera ; le PDF définitif
de l'étape 6 la reprendra telle quelle, avec les contrôles d'images et de
marges ajoutés au même endroit (`pdfDefinitifRefuse`). Les numéros
impossibles viennent du calcul des numéros de l'étape 3 (`numeroter`), qui
les relevait déjà.

- **Chemins et accessibilité.** Seules comptent les scènes du livre : dans
  le plan, ni exclues ni dans un chapitre exclu. Un chemin vers une scène
  hors du livre n'en est pas un pour l'accessibilité ; il est signalé à part.
  Les scènes accessibles se trouvent par un parcours en largeur depuis le
  départ, qui donne aussi l'ordre de rencontre.
- **Fin hors d'atteinte.** Les composantes fortement connexes des scènes
  accessibles (algorithme de Tarjan, écrit sans récursion pour un long
  livre) : une composante d'où aucun chemin ne sort, qui forme une boucle et
  ne contient aucune fin, est un groupe dont le lecteur ne sort plus. Une
  scène seule sans suite n'en est pas une : c'est une impasse.
- **Actions de jeu.** Le serveur demande à la base les seules identités des
  scènes dont le texte contient un bloc `action` (`texte @> '[{"type":
  "action"}]'`), sans lire les textes ; supabase-js demande que ce filtre
  lui soit donné en JSON écrit, un tableau étant pris pour un tableau de
  Postgres.
- **Clés.** Un point se désigne par sa sorte et ce qu'il vise : la scène, le
  renvoi d'un choix, la scène numérotée, ou l'ensemble trié des scènes d'une
  boucle. C'est à elle que s'attachera l'acceptation d'un avertissement, au
  lot 2.

**Passages inaccessibles groupés (décidé le 14 octobre 2026, F09-AC24).**
Les scènes que le départ n'atteint pas sont rangées en composantes fortement
connexes ; chaque composante où rien ne mène depuis une autre scène
inaccessible ouvre un groupe, que complète un parcours en largeur parmi les
scènes inaccessibles. Un point par groupe, sa clé étant celle de sa première
scène.

**Ce que la base tient de « Vérifier les chemins » (lot 2,
`20261014110000_verifier_les_chemins.sql`).**

- **Avertissements acceptés.** Une table, `avertissements_acceptes` : le
  projet, la clé du point, son empreinte (ses scènes, triées) et le moment.
  L'adulte la lit et en retire des lignes ; il n'en pose que par
  `accepter_avertissement`, qui date l'acceptation dans la base. Le serveur
  recalcule les contrôles avant d'accepter : il ne pose rien sur un point qui
  n'est plus un avertissement.
- **Durée d'une acceptation : un journal plutôt que des compteurs.**
  Annoncé au porteur comme deux compteurs sur chaque scène, le moyen retenu
  en construisant est un journal, `chemins_changes` : une ligne, datée, quand
  les chemins qui partent d'une scène changent (« sortie »), et une pour
  chaque scène qu'un chemin vise désormais ou ne vise plus (« entree »).
  Faire avancer un compteur aurait demandé, pendant l'enregistrement d'une
  scène, de verrouiller aussi les scènes visées : deux élèves qui relient
  leurs scènes l'une à l'autre au même instant pouvaient s'attendre l'un
  l'autre. Un journal ne fait qu'ajouter des lignes. Une acceptation tient
  tant qu'aucune ligne de ses scènes, du sens qui compte pour elle, n'est
  venue après elle (`avertissementsAcceptes`, dans `src/domaine/livre.ts`) :
  les entrées pour un passage inaccessible, les sorties pour une boucle sans
  fin ou une sortie non assurée. La fonction qui refait les liens
  (`prive.relier`) est remplacée dans la nouvelle migration : elle compare
  les liens de la scène avant et après, et n'écrit rien quand ils sont les
  mêmes — une coquille ne rouvre rien. Le repère de fin, qui compte parmi les
  chemins qui partent, est noté par un déclencheur à part. Limite acceptée :
  un changement plus haut dans le récit, qui ne touche pas les chemins des
  scènes du point, ne rouvre pas l'acceptation.
- **Déclaration.** Une colonne, `projets.chemins_verifies_le`, que l'adulte
  pose et retire ; le serveur ne la pose que quand l'étape ne garde rien.
- **Lecture.** `etatDuLivre` (`src/serveur/controles.ts`) lit les contrôles,
  les acceptations, la déclaration, et les seules lignes du journal venues
  après la plus ancienne acceptation. Les marques, les tâches et ce qui se
  déclare sont calculés sans base (`etatChemins`, `etatRelire`).
- **Choix désigné à l'arrivée.** « Ouvrir la scène » d'un choix à relier
  passe le renvoi dans l'adresse (`?de=livre&choix=…`) ; la copie ouvre ses
  réglages dès son premier rendu, d'après le texte reçu, et l'amène sous les
  yeux.

**La lecture, construite une fois (lot 3).** Une forme commune de ce
qu'une page de lecture reçoit (`LivreLu`, `src/domaine/lecture.ts`) : pour
chaque passage, ses blocs tels que le livre les imprime — paragraphes,
images, actions de jeu, phrases de choix en morceaux avec leurs numéros
(`morceauxDe`, la fonction de l'étape 3) —, ses énigmes et leur numéro
attendu, ses repères. Les notes de l'enseignant et les liaisons cachées n'y
sont pas des blocs. Chaque renvoi dit où il mène : un passage lisible, rien
(sans destination, scène supprimée), ou, pour l'élève au lot 4, une suite
hors de ses chapitres. La lecture ne sait rien de la base ni des droits :
l'adulte la reçoit du plan et des textes (`livrePourLAdulte`), l'élève la
recevra d'une fonction de la base, et le lecteur en ligne de l'instantané
partagé. Les composants (`src/composants/lecture/`) ne chargent ni Plate ni
l'éditeur.

- **Tout le livre en une fois.** La page de l'adulte lit les textes de
  toutes les scènes du projet en une demande ; un livre de deux cents scènes
  reste de l'ordre de quelques centaines de kilo-octets, et chaque passage
  s'ouvre ensuite sans attendre.
- **Ce qui tient le temps de la page.** Le parcours, les « déjà lu », la
  feuille et le dernier lancer sont gardés par le navigateur
  (`sessionStorage`, une clé par projet), pour qu'un aller-retour vers une
  scène les retrouve ; « Quitter » les efface. La lecture n'est donc dessinée
  que dans le navigateur (`next/dynamic`, sans rendu serveur) : le serveur
  ne sait pas ce qu'elle avait gardé.
- **Dé et compteurs.** Calculés sans base (`lancer`, `changerCompteur`) ;
  rien n'est envoyé au serveur.

**Ce que reçoit le poste d'un élève (lot 4,
`20261014120000_lecture_du_poste.sql`).** Une fonction, `lecture_du_poste`,
que seul le rôle du poste appelle : elle relit l'élève au travail et le
projet de sa classe, puis rend les chapitres qu'il lit (`scenes_lisibles`,
la règle de l'étape 2 : les siens, ou tous avec la lecture ouverte), et
pour chacune de leurs scènes le titre, le texte sans les notes, le repère de
fin et l'ordre du plan ; ni consigne, ni état, ni « hors du livre ». Pour un
chemin qui sort de ces chapitres, elle dit seulement que la scène visée
existe encore (`ailleurs`, une liste d'identités) : c'est ce qui sépare
« pas encore de suite » d'une suite à découvrir. Le départ n'est rendu que
si la lecture est ouverte. De la préparation : la feuille en service, les
règles du jeu, la formule de renvoi, la marque de fin. Les numéros viennent
de `numerotation_du_projet`, de l'étape 3 ; le serveur de l'application les
applique et n'envoie à la page que le livre qu'il en tire
(`livrePourLEleve`) : une scène exclue du livre y est un passage sans
numéro, rien de plus. La même fonction donne à la vue « Chemins » de
l'élève le départ, les fins et les scènes à lien caché de son chapitre
(F03-AC50 révisé), lue seulement quand il ouvre cette vue.

**Mini-carte repliée (lot 5).** Une préférence du navigateur
(`localStorage`), lue à l'ouverture du schéma, qui n'est dessiné que dans le
navigateur : elle tient d'un chapitre et d'une visite à l'autre sur ce
poste, sans colonne de plus au compte.

## Réalisation de l'étape 6 (15 octobre 2026)

Choix techniques de l'étape 6 du [plan](plan.md) : composer et imprimer le
livre. Les règles restent en F10, F11 et F12.1 ; la chaîne est celle de
l'[ADR 0003](adr/0003-pagedjs-chromium-apercu-cote-serveur.md).

**Arrêté à l'entretien du 15 octobre 2026, avant de construire :**

- **Fidélité :** l'aperçu et les PDF sortent du même Chromium, celui du
  serveur, avec des polices embarquées. F11-AC30 se joue donc à l'intérieur
  d'un même hébergement ; l'écart entre le Chromium de macOS (en local) et
  celui de Linux (chez Vercel) ne touche que les essais, et se mesure sous
  Docker avec le Chromium que Vercel exécute (`@sparticuz/chromium`).
- **Aperçu affiché :** un PDF allégé (images réduites pour l'écran, mêmes
  boîtes, donc mêmes pages) affiché page par page dans le navigateur ; les
  clics se retrouvent par la carte des blocs que rend la composition. Un
  HTML paginé renvoyé au navigateur aurait été recoupé par WebKit
  (111 pages sur 145 différentes dans le prototype).
- **Passage par le stockage :** une réponse d'une fonction Vercel ne
  dépasse pas 4,5 Mo ; aperçu et PDF sont déposés dans un stockage privé de
  Supabase et lus par une adresse signée. Limites de l'offre gratuite à
  revérifier (de mémoire, 1 Go de fichiers et 5 Go de téléchargement par
  mois) ; l'aperçu allégé les ménage.
- **Délai :** environ 3 s pour 145 pages sur la machine du prototype ;
  attendu, sans mesure, de 5 à 10 s chez Vercel, davantage au premier
  appel. Les pages précédentes restent lisibles pendant le recalcul.
- **Essai chez Vercel dès le lot 1 (V2) :** sur une branche à part,
  `essai-vercel`, jamais `main`, une préversion protégée compose un livre
  intégré au code, sans la base ni donnée d'élève, et rend ses durées.
  Accord du porteur le 15 octobre 2026.
- **Hauteurs de l'agencement (V4) :** prises sur la vraie composition, par
  la carte des blocs, plutôt que sur un modèle approché.

**Lot 1 — composition et PDF de travail (15 octobre 2026) :**

- **Deux couches.** `src/domaine/composition.ts`, sans navigateur : le livre
  à composer d'après le plan, les textes et les contrôles (ordre imprimé de
  `numeros.ts`, titres de partie et de chapitre, filets du récit classique,
  marques de travail) et son HTML, en reprenant les blocs de la lecture
  commune (`lecture.ts`). `src/serveur/livre/` : la page du serveur, les
  feuilles de style, le lancement de Chromium, l'instantané et le dépôt.
- **Le document servi à Chromium.** Une adresse fictive
  (`https://livre.invalid/`) que Playwright intercepte : le document, ses
  deux feuilles, Paged.js, les polices et les images, lues dans le stockage
  au moment où Chromium les demande. Rien ne passe par le réseau.
- **Deux feuilles de style.** Paged.js retire les déclarations `break-*` des
  feuilles qu'il lit : la sienne ne porte que la page A5, ses marges
  alternées et les sauts forcés ; la typographie et les règles de coupure
  (veuves, orphelines, blocs insécables) sont dans une feuille que Chromium
  lit seul et tient en remplissant chaque page.
- **Le script de la page est un texte** (`dans-la-page.ts`) : une fonction
  passée à Playwright serait réécrite par la compilation (Vite y ajoute ses
  propres appels). Il enregistre le contournement du défaut de Paged.js
  relevé par le prototype (une coupure de mot en fin de page reprise une
  lettre trop loin ; 11 corrections sur le livre de diagnostic), puis pose
  après la mise en page ce qui n'est pas dans le fil du texte : en-tête,
  numéro de page, marques du PDF de travail, numéros de page du
  récapitulatif ; il rend la carte des blocs, les débordements et une
  signature de chaque page. Les attributs de l'application ne s'appellent
  pas `data-ref`, que Paged.js pose sur chaque élément.
- **Page récapitulative paire** : le récit commence sur une page de droite
  (`break-before: right`), ce qui ajoute la blanche quand le récapitulatif
  tient en une page ; le numéro de page du livre est son rang moins ces
  pages.
- **Polices** : Vollkorn et Atkinson Hyperlegible Next, des paquets
  `@fontsource` (licence OFL), alphabets latin et latin étendu, en woff2 ;
  aucune police du système. **Césure** : le paquet `hyphen` (motifs du
  français, licence ISC), en JavaScript seul, plutôt que hyphenopoly du
  prototype, dont les motifs sont un fichier à charger ; restreinte comme le
  veut F11.3.
- **Versions figées** : `pagedjs` 0.4.3, `playwright-core` 1.64.0 (celle des
  parcours), `@sparticuz/chromium` 153.0.0, `hyphen` 1.14.1. En local,
  Chromium 156 de Playwright ; chez Vercel, Chromium 153. Les deux restent
  hors du paquet de Next (`serverExternalPackages`) ; Paged.js, les polices
  et le Chromium de Vercel partent avec les fonctions par
  `outputFileTracingIncludes`.
- **Instantané et empreinte** : l'heure est notée, puis tout est lu ;
  l'empreinte (SHA-256 du livre à composer) est gardée avec le PDF : le
  livre a changé depuis quand elle diffère (F11-AC26, signalé au lot 5).
- **Dépôt** : table `pdf_du_livre` et seau privé `livres` (50 Mo par
  fichier) ; le fichier se donne par une adresse signée valable cinq
  minutes, après lecture de la ligne par l'adulte (règles d'accès de la
  base). Le stockage n'écrit le nom du fichier qu'en caractères simples :
  les accents tombent. Les demandes passent par deux routes,
  `POST /livre/[projet]/pdf` (origine vérifiée, 60 s au plus) et
  `GET /livre/pdf/[pdf]`.
- **Diagnostic** : `/diagnostic/livre`, fermé en production, compose un livre
  fabriqué dans le code (60 passages, 107 pages) et rend durées, mémoire,
  version de Chromium et l'empreinte des pages ; `scripts/diagnostic-livre.ts`
  en est la version hors de Next, pour Docker.
- **Mesures** (livre de diagnostic, 107 pages, 0,86 Mo) : 2,1 s sur le Mac
  du porteur (mise en page 1,9 s) ; 4,1 à 5,0 s sous Docker, Chromium de
  Vercel émulé en x86 (lancement 1,0 à 1,9 s, mise en page 2,8 s). Le PDF
  de travail de « Les passeurs de brume » local (24 pages) : 2,2 s, bouton
  compris.
- **Chez Vercel (V2, composition)**, préversion `essai-vercel`, région
  `cdg1`, Chromium 153 : 107 pages, empreinte des pages identique au local ;
  premier appel 5,8 s (lancement 2,8 s, mise en page 2,4 s, impression
  0,6 s), puis 3,0 à 3,1 s ; mémoire résidente 0,2 Go. Le relais
  d'authentification (`proxy.ts`) ne passe pas sur `/diagnostic`, et tout
  `playwright-core` est emporté, son traçage oubliant `browsers.json`.
- **V1 levée** : mêmes 107 pages, mêmes 3 035 lignes aux mêmes places au
  centième de point, entre le Chromium 153 de Linux et le 156 de macOS. Une
  fidélité d'un hébergement à l'autre n'était pas requise ; elle est
  constatée.

**Lot 2 — aperçu et scène ouverte à côté (15 octobre 2026) :**

- **L'aperçu** est la composition du PDF de travail, marques comprises, avec
  les vignettes de l'import (900 points) à la place des images : les boîtes
  ne changent pas, les pages non plus (F11-AC30 essayée sur des images de
  1 800 et de 900 points). Le PDF et sa carte des blocs sont déposés dans le
  seau `livres` sous `apercu-<empreinte>` ; une même empreinte reprend
  l'aperçu sans recomposer (0,05 s en local, contre 1,7 s pour composer
  « Les passeurs de brume ») ; seul le dernier est gardé. Le navigateur lit le
  PDF par une adresse signée de dix minutes, directement dans le stockage.
- **Affichage** : pdf.js (`pdfjs-dist` 5.4.394) dessine chaque page dans un
  canevas quand elle approche de l'écran ; le travailleur de pdf.js est
  chargé par son adresse de module. La carte des blocs, en millimètres,
  donne ce qui est sous un clic : un renvoi d'abord (marge de 0,8 mm), puis
  le bloc et sa scène. Chaque passage et chaque renvoi a aussi son bouton,
  masqué, pour le clavier et les lecteurs d'écran.
- **Recalcul** : la page du Livre lit à chaque rendu l'empreinte du contenu
  (l'instantané sans Chromium) ; l'aperçu se recompose quand elle diffère de
  la sienne. Un enregistrement du texte, qui ne passe pas par une action
  serveur, demande une relecture de la page deux secondes et demie après ;
  les commandes de la scène (état, exclusion, fin) la demandent d'elles-mêmes.
- **La scène à côté** est `PageScene` dans un mode `aCote`, chargée par une
  action serveur qui rend ce que sa page lit (`src/serveur/scene.ts`,
  partagé avec la page) : même éditeur, même tampon d'état et mêmes
  incidents de sauvegarde. « Annuler » est l'historique de Plate, exposé au
  pied de la copie ; « Tout annuler » réécrit le texte de l'ouverture sur la
  version lue (`retablirTexte`), et ne fait rien si quelqu'un l'a changé
  entre-temps. Les extraits des scènes voisines n'y figurent pas.
- **Schéma** : `projets.livre_relu_le` et `projets.derniere_etape_livre`,
  modifiables par l'adulte (droit par colonne) ; le seau `livres` accepte
  `application/json`.

**Lot 3 — règles de composition, réglages, pages de présentation (15 octobre
2026) :**

- **Veuves et orphelines** : les règles CSS seules n'étaient pas tenues par
  Paged.js. Un crochet `onOverflow` (`dans-la-page.ts`) les fait respecter :
  si un paragraphe garde trois lignes au moins et qu'une seule passerait,
  une ligne recule ; sinon le paragraphe passe à la page suivante, avec ce
  qui doit l'accompagner (numéro, titre de partie ou de chapitre, filet,
  début de scène), sauf s'il est seul sur sa page. Le groupe de choix porte
  `break-inside: avoid`.
- **Césure** : le paquet `hyphen` (motifs `fr`, licence ISC) pose des tirets
  conditionnels à la composition, jamais dans un mot à majuscule ni dans le
  dernier mot d'un paragraphe, trois lettres au moins de chaque côté ;
  aucune en « aligné à gauche ».
- **Réglages** (`domaine/mise-en-page.ts`) : objet JSON dans
  `projets.mise_en_page`, relu par `reglagesPropres`, qui complète ce qui
  manque et refuse une marge sous 10 mm ou un bas de page « dés » sans dé.
  Les pages de présentation (`domaine/pages.ts`) sont dans
  `projets.pages_du_livre`, complétées par celles proposées
  (`pagesParDefaut`) ; leur texte à mise en forme légère s'écrit dans un
  petit éditeur Plate (`composants/EditeurLeger.tsx`). Andika rejoint les
  polices embarquées.
- **Contrôles des images et des marges** : `controler()` reçoit le contenu
  (textes, dimensions des images, réglages, débordements, images des pages)
  et en tire quatre sortes de points, chacune avec son étape ;
  l'acceptation d'un avertissement tient par sa clé, qui porte la largeur
  ou une empreinte du texte. Les débordements viennent de la carte JSON du
  dernier aperçu (`contenu.ts`).
- **Contenu du livre** (`serveur/livre/contenu.ts`) : un seul chargement par
  requête sert l'instantané, les contrôles et l'empreinte.
- **Dés imprimés** (`domaine/des.ts`) : suites équilibrées, déterministes,
  sans le même tirage sur deux pages de droite qui se suivent.
- **Petite double page** : l'aperçu gardé dit aussi la page de chaque page
  de présentation ; un aperçu gardé avant ce lot, qui ne le dit pas, se
  recompose. Le Livre tient l'aperçu (`useApercu`) pour ses deux volets :
  il reste composé au volet « Réglages », se recompose 1,2 s après le
  changement d'empreinte quand des pages sont déjà montrées, et la petite
  double page en dessine deux pages avec pdf.js.

**Lot 4 — « Mettre en page », volet « Aperçu » (15 octobre 2026) :**

- **Déplacer un passage** (`domaine/ordre.ts`) : dans son groupe de mélange,
  les passages qui se déplacent (ni départ, ni numéro fixé, ni ouverture en
  tête) sont rangés par numéro ; monter, descendre ou placer après un
  numéro change leur suite, puis les rangs gardés du groupe sont récrits
  d'un seul appel (`placer_passages`), à partir du plus petit. Les numéros
  fixés gardent leur numéro où qu'ils soient, les autres se recalculent :
  les renvois suivent sans qu'aucun texte change. Les anciens rangs
  reviennent à l'écran, qui les rend pour « Annuler ».
- **Réintégrer** : une scène sans numéro fixé reçoit le rang qui suit le plus
  grand du projet, donc la fin de son groupe ; l'« Annuler » d'une exclusion
  garde sa place.
- **Pages peu remplies** : mesurées par la page de Chromium après la mise en
  page, pour chaque page du récit — le bas du dernier élément posé contre
  celui de la zone de texte. Une page compte au-delà d'un quart de la
  hauteur utile, sauf la dernière du récit et celle que suit une page
  ouverte par un saut demandé (nouvelle partie, nouveau chapitre ou
  nouvelle page). L'aperçu garde ces blancs avec ses pages ; un aperçu gardé
  avant ce lot se recompose.
- **Nouvelle page** : `scenes.nouvelle_page`, lue avec le plan, imprimée par
  la classe `nouvelle-page` que la composition portait déjà (F11-AC10).
- **Éléments collés** : la barre des volets, celle de l'aperçu et les
  colonnes collées du Livre passent sous la barre du site (58 points),
  qu'elles recouvraient.

**Lot 5 — PDF définitif (15 octobre 2026) :**

- **Règle unique** : `conditionsDuLivre` (`domaine/livre.ts`) lit les points
  des contrôles et trois faits du projet (mise en page déclarée, doute sur
  l'ordre, étape d'arrivée ouverte) ; la page et le serveur l'appellent tous
  deux. L'instantané porte désormais ses points des contrôles : le PDF
  définitif est refusé ou composé sur le même état (`produirePdfDefinitif`).
- **Fichier** : composé sans marques, images entières, déposé dans le seau
  `livres` sous un identifiant, inscrit dans `pdf_du_livre` (`definitif`) avec
  l'empreinte du contenu ; rien ne s'efface seul. La route
  `POST /livre/[projet]/definitif` rend l'adresse de téléchargement, ou les
  raisons du refus (409).
- **Livre changé** : l'empreinte du dernier PDF définitif comparée à celle du
  contenu à l'instant ; une coquille corrigée suffit à la changer.
- **Suppression** : la ligne puis le fichier, par l'adulte du projet.

**Lot 6 — ordre des passages (15 octobre 2026) :**

- **Mesures** : la page de Chromium mesure chaque passage après la mise en
  page — hauteur de tous ses morceaux, espace du numéro compris, hauteur de
  son groupe de choix, image pleine page —, le dernier passage de chaque
  page peu remplie et s'il continue (`data-split-to` de Paged.js, un morceau
  vide laissé en bas de page ne comptant pas), et le blanc total des pages
  du récit. L'aperçu les garde avec une version de la mesure : un aperçu
  d'une autre version se recompose.
- **Agencement** (`domaine/agencement.ts`) : les places du livre restent
  (départ, numéros fixés, ouverture, nouvelles pages) ; à chaque place
  libre, le passage du groupe qui laisse le moins de blanc selon un modèle
  de page (tête de trois lignes qui doit tenir, corps qui s'écoule, groupe
  de choix qui ne se coupe pas), en évitant la double page d'un passage qui
  y mène. L'ordre obtenu est composé une fois avec les images allégées ; il
  n'est écrit (`placer_passages`) que si son blanc total et son nombre de
  pages ne sont pas pires.
- **Doute** : la page de chaque passage se relève à la première composition
  après une décision ou un déplacement (`ordre_pages`, écrite par la page
  du Livre quand elle est vide) ; ensuite, une page différente ou un passage
  en plus ou en moins fait le doute. À « Mettre en page », la page se relit
  après chaque composition de l'aperçu pour le calculer.
- **Passage suggéré** : calculé à l'écran d'après l'aperçu (mesures, page
  de chaque passage) et l'ordre imprimé que la page donne ; « Placer ici »
  est « Placer après le n° » du lot 4.

## Vérifications avant décision technique

- **Développement :** compatibilité de l'éditeur et des choix, accès adulte
  et élèves, contrôle des permissions et des sauvegardes concurrentes.
- **Récupération d'un conflit**, d'après les règles du 7 octobre 2026 en
  [F08.1](specifications.md#f081--écritures-concurrentes) : conservation du
  texte gardé à part au moment même du refus, et ce qui se passe si elle
  échoue ; échange du texte de la scène et du texte gardé à part fait d'un
  seul tenant, y compris quand la scène change au même instant ; arrêt de
  l'élève tenu d'un poste à l'autre ; page qui réessaie seule après une
  coupure ; texte non enregistré gardé sur le poste et renvoyé plus tard,
  simple proposition. Aucun essai n'est autorisé à ce stade.
- **Exploitation :** coût additionnel à l'abonnement existant, base, fichiers,
  trafic, IA et génération PDF ; sauvegardes et récupération des données
  comme des illustrations, régions et connexions entre services.
- **Choix dans le texte :** voir la liste ci-dessous, établie le 1er octobre
  2026 d'après [F05.2](specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène).
- **Aperçu et PDF :** une même composition pour l'aperçu à l'écran et les PDF,
  à la page près (F11.2), marques de travail sans effet sur la mise en page,
  et export sur un instantané du contenu.
- **PDF :** durée, mémoire, taille des dépendances et fiabilité sont mesurées
  le 3 octobre 2026 sur un livre d'essai par le prototype PDF : voir sa
  [liste](#ce-que-le-prototype-pdf-devra-éprouver) et ses
  [résultats](#résultats-du-prototype-pdf-3-octobre-2026). Paged.js et
  Chromium sont retenus le même jour ; la production chez Vercel n'est ni
  exclue ni démontrée, le déploiement réel restant non vérifié.

### Ce que le prototype de l'éditeur devra éprouver

Liste établie le 1er octobre 2026 pour le parcours « créer et modifier les
choix dans la scène ». Le porteur autorise ce prototype le 2 octobre 2026 ;
il est réalisé le même jour et ses
[résultats](#résultats-du-prototype-de-léditeur-2-octobre-2026) suivent cette
liste. Cette autorisation ne vaut ni pour le
développement de l'application ni pour un achat. Il porte sur Plate en
priorité, Tiptap en alternative. Chaque point renvoie aux critères qui
serviront à juger le résultat.

1. **Paragraphe de choix :** un type de paragraphe réservé aux phrases de
   choix, seul à pouvoir contenir des renvois ; impossibilité d'insérer un
   renvoi dans un paragraphe de récit, y compris par collage ou fusion de
   paragraphes (retour arrière en début de bloc, Suppr. en fin du précédent).
   F05-AC13 à AC15.
2. **Renvoi insécable :** élément en ligne non modifiable, relié à une identité
   stable de scène, affichant un numéro calculé ailleurs et mis à jour sans
   modifier le texte enregistré ; renvoi vide pour une destination à décider.
   F05-AC17, AC34, AC35.
3. **Phrase automatique et personnalisée :** phrase automatique non saisissable
   et recomposée depuis le libellé, la construction et la formule du livre ;
   passage à un texte libre avec renvois conservés, et retour. Plusieurs
   renvois dans une phrase. F05-AC09, AC10, AC20 à AC23.
4. **Saisie sur place :** `/choix` et bouton ouvrant la même saisie, recherche
   de destination, création d'une scène sans quitter la page, insertion après
   le paragraphe du curseur ou en fin de scène. F05-AC13, AC14, AC16, AC18.
5. **Sélection et suppression :** phrase prise en entier ou pas du tout dans
   une sélection à cheval ; « tout sélectionner » puis frappe ; suppression
   avec message et annulation ; retrait du dernier renvoi. F05-AC24, AC25, AC28.
6. **Annulation et rétablissement :** un seul geste rétablit texte, phrase et
   liens, y compris après création d'une scène depuis un choix et après un
   couper-coller entre deux scènes ; cohérence entre l'historique de l'éditeur
   et les liens enregistrés côté serveur.
7. **Presse-papiers :** couper-coller qui déplace le même choix, copier-coller
   qui en crée un autre, entre scènes et entre chapitres ; sortie en texte
   simple ; texte extérieur ne créant jamais de renvoi ; nettoyage de F04.1.
   F05-AC30 à AC33, F04-AC04.
8. **Blocs protégés :** paragraphe et phrase de choix non modifiables pour un
   élève, curseur qui n'y entre pas, écriture avant, après et entre deux blocs,
   suppression d'une sélection qui les épargne ; protection et retrait par
   l'adulte. F05-AC29, F06-AC45, AC46, AC50 à AC52.
9. **Contrôle côté serveur :** refus d'un enregistrement qui modifie, supprime
   ou ajoute un bloc protégé ou un choix sans le droit requis, même si le
   navigateur a été contourné ; phrase de choix écartée d'un collage non
   autorisé avec message. F05-AC32, F06-AC13.
10. **Sauvegarde concurrente :** effet de F08.1 lorsque le conflit porte sur
    une scène dont les choix ont changé ; copie de récupération contenant des
    renvois ; liens du graphe jamais laissés dans un état intermédiaire.
11. **Liaison cachée et note de l'enseignant :** repère de scène hors du récit,
    jamais imprimé ; contenu réservé à l'adulte absent de ce que reçoit
    l'élève, hormis le numéro à obtenir. F05-AC26, AC27, AC37.
12. **Tablette et clavier seul :** appui sur une phrase, clavier virtuel,
    sélection tactile autour d'un bloc ; parcours complet sans souris et
    annonces pour lecteur d'écran. F05-AC39, AC40.
13. **Même contenu partout :** la phrase enregistrée produit le même texte dans
    l'éditeur, la lecture d'essai, l'aperçu du livre, le PDF et le lecteur en
    ligne ; le graphe se déduit des renvois sans seconde saisie. F05-AC09.

14. **Paragraphe d'action de jeu (ajout du 2 octobre 2026) :** un type de
    paragraphe à texte libre, sans renvoi ni élément insécable, distinct du
    récit et de la phrase de choix ; passage d'un paragraphe de récit à ce
    type et retour ; impossibilité d'y faire entrer un renvoi par collage ou
    fusion (point 1) ; couper-coller et copier-coller entre scènes, sortie en
    texte simple ; bloc protégé d'office pour le profil « écriture et
    propositions », épargné par une suppression et écarté d'un collage non
    autorisé, avec refus côté serveur (points 8 et 9) ; même mise en valeur dans l'éditeur, l'aperçu, le
    PDF et le lecteur en ligne (point 13). F04-AC17, AC25, AC30.

Hors de ce prototype, selon [F04.2](specifications.md#f042--objets-de-lhistoire) :
`/objet` et les formules de `/action`, qui insèrent du texte libre et ne
demandent qu'une commande de saisie semblable à celle du point 4 ; la feuille d'aventure et le dé, qui
relèvent de la composition du livre et du lecteur en ligne, non de l'éditeur ;
l'action de jeu à effet déclaré, différée.

### Résultats du prototype de l'éditeur (2 octobre 2026)

Essai jetable dans [`prototypes/editeur/`](../prototypes/editeur/README.md) :
React, TypeScript, Plate 53 (qui repose sur Slate), une page, un sélecteur de
rôle, deux scènes côte à côte et un faux serveur en mémoire. Aucun code n'a
vocation à être repris. Ni Supabase, ni compte, ni mise en page.

**Ce qui a été exécuté.** 37 tests Vitest sans navigateur (contrôle
« serveur », conflits, contenu réservé, texte commun). 68 tests Playwright
sous Chromium, tous réussis, rejoués quatre fois de suite sans échec. Les
mêmes 68 sous WebKit, le moteur de Safari : 66 réussis, 2 inexécutables parce
que Playwright n'y donne pas la lecture du presse-papiers. 4 tests sur un
iPad émulé sous WebKit, réussis. Dans les tests de navigateur, les frappes,
les raccourcis et le presse-papiers sont réels ; le curseur est souvent placé
par programme avant la frappe.

**Ce qui n'a pas été exécuté.** Aucune tablette réelle, aucun clavier
virtuel, aucun lecteur d'écran, aucun Word réel, aucun PDF, aucune base de
données, aucun Firefox. Tiptap n'a pas été essayé : la consigne le réservait
à un échec de Plate sur un point essentiel, qui ne s'est pas produit.

| Point | Verdict | Preuve |
| --- | --- | --- |
| 1. Paragraphe de choix | Tenu | `e2e/p01` (6 tests), structure dans `tests/validation` |
| 2. Renvoi insécable | Tenu | `e2e/p02` (3), `tests/serveur` |
| 3. Phrase automatique et personnalisée | Tenu | `e2e/p03` (7) |
| 4. Saisie sur place | Tenu avec réserve | `e2e/p04` (3), `e2e/p01`, `e2e/p12` |
| 5. Sélection et suppression | Tenu | `e2e/p05` (7) |
| 6. Annulation et rétablissement | Tenu avec réserve | `e2e/p06` (4), `e2e/p05` |
| 7. Presse-papiers | Tenu avec réserve | `e2e/p07` (8), `e2e/p14` |
| 8. Blocs protégés | Tenu avec réserve | `e2e/p08` (11) |
| 9. Contrôle côté serveur | Tenu | `tests/validation` (26), `e2e/p09-p10` |
| 10. Sauvegarde concurrente | Tenu avec réserve | `tests/serveur` (3), `e2e/p09-p10` |
| 11. Liaison cachée et note | Tenu avec réserve | `e2e/p11` (4), `tests/serveur` (3) |
| 12. Tablette et clavier seul | Clavier : tenu. Tablette : non vérifié sur appareil | `e2e/p12` (4), `e2e/tablette` (4) |
| 13. Même contenu partout | Tenu avec réserve | `e2e/p13` (2), `tests/serveur` (5) |
| 14. Paragraphe d'action de jeu | Tenu | `e2e/p14` (7), `tests/validation` |

**Détail par point : ce qui est prouvé, ce qui ne l'est pas, ce que cela
implique.**

1. **Paragraphe de choix — tenu.** F05-AC13 à AC15 passent. Retour arrière en
   début de bloc et Suppr. en fin du précédent ne fusionnent jamais récit et
   phrase ; un morceau de phrase copié avec son renvoi et collé dans un
   paragraphe de récit n'y laisse aucun renvoi. *Implication :* Plate ne
   fournit pas cette règle. Il faut la tenir à trois étages — gestes
   (suppression, collage, fusion), normalisation du document, garde sur les
   opérations — puis au serveur. *Comportement à confirmer :* le morceau
   collé devient une nouvelle phrase de choix, placée à part.
2. **Renvoi insécable — tenu.** F05-AC17 (hors blocage du PDF, absent du
   prototype) et AC35 passent ; pour AC34, seul
   l'affichage est prouvé : la table des numéros du prototype est fixe,
   l'établissement de l'ordre imprimé n'en fait pas partie. Le numéro n'est
   écrit nulle part dans le document : le décaler ne change ni le texte
   enregistré, ni sa version, ni l'historique. *Constat :* aux flèches, le
   renvoi se franchit en deux temps, il est d'abord sélectionné comme un tout.
3. **Phrase automatique et personnalisée — tenu.** F05-AC09, AC10, AC20 à
   AC23 passent. La phrase automatique n'enregistre aucun texte : libellé,
   construction et renvoi seulement, recomposés à l'affichage. *Non
   prototypé :* les constructions cochées dans les réglages du projet ;
   « Régénérer » tire parmi les quatre.
4. **Saisie sur place — tenu avec réserve.** F05-AC13, AC14, AC16, AC18
   passent ; `/choix` et le bouton ouvrent la même saisie. *Réserve :* la
   recherche de destination filtre un simple texte ; l'aperçu et le filtre par
   chapitre de F05 ne sont pas prototypés.
5. **Sélection et suppression — tenu.** F05-AC24, AC25, AC28 passent, pour
   une phrase automatique comme personnalisée ; « tout sélectionner » puis
   frappe remplace tout et s'annule. *Comportement à confirmer :* une
   sélection qui couvre tous les renvois d'une phrase personnalisée supprime
   la phrase avec le message d'annulation, sans confirmation préalable ; la
   confirmation n'intervient que pour la commande « Retirer ce renvoi » et
   pour le retour arrière contre le dernier renvoi.
6. **Annulation et rétablissement — tenu avec réserve.** Dans une scène, un
   seul geste rétablit texte, phrase et liens ; les liens enregistrés suivent
   chaque annulation, car le graphe se déduit du texte. *Réserves :*
   (a) **couper-coller entre deux scènes : il faut annuler dans chacune**,
   chaque scène ayant son historique, perdu en quittant la page. Le porteur
   accepte cette annulation par scène le 2 octobre 2026 ; la règle est
   précisée en F05.2. Le serveur garantit qu'une identité
   de choix ne vit jamais dans deux scènes : si le couper est annulé sans le
   coller, le choix revenu devient un autre choix. (b) La scène créée depuis
   un choix n'est pas supprimée par l'annulation ; elle reste vide et sans
   lien entrant. (c) « Cacher ce choix » et « Proposer comme choix » modifient
   la liaison côté serveur, hors de l'historique.
7. **Presse-papiers — tenu avec réserve.** F05-AC30 à AC33 et F04-AC04
   passent sous Chromium, y compris entre chapitres ; la phrase et l'action
   sortent en texte simple avec le numéro affiché. Le nettoyage du collage
   vient du désérialiseur HTML de Plate, sans code propre : gras conservé,
   police, taille et couleur retirées. *Réserves :* le « texte Word » est un
   HTML imitant le balisage de Word, pas un collage depuis Word ; la sortie en
   texte simple n'est pas vérifiée sous WebKit ; une copie lancée moins de
   100 ms après « tout sélectionner » prend l'ancienne sélection.
8. **Blocs protégés — tenu avec réserve.** F05-AC29, F06-AC45, AC46, AC50 à
   AC52 passent pour les deux profils. *Réserve d'interprétation :* « le
   curseur n'y entre pas » est réalisé par un bloc pris comme un tout — les
   flèches s'y arrêtent, il s'entoure d'un cadre, aucun curseur n'apparaît
   dans son texte, rien ne s'y écrit. Entrée ouvre un paragraphe dessous, un
   « + » en ouvre un dessus ou entre deux blocs. Le porteur retient cette
   forme le 2 octobre 2026 ; F06.1 est précisé.
9. **Contrôle côté serveur — tenu.** La fonction reçoit l'ancien document, le
   nouveau et le rôle ; 26 cas, dont F05-AC32 et F06-AC13. Un navigateur
   trafiqué qui supprime un choix se voit refuser l'enregistrement. *Implication :*
   ce contrôle compare deux documents et connaît le chapitre de chaque
   destination ; il relève d'un traitement serveur, les règles RLS seules ne
   l'expriment pas. L'ordre relatif des blocs protégés fait partie de ce qui
   est vérifié.
10. **Sauvegarde concurrente — tenu avec réserve.** F08-AC01 à AC03 passent :
    la version ancienne ne remplace rien, la saisie est gardée à part avec ses
    renvois, le graphe ne lit que le texte courant et ne passe par aucun état
    intermédiaire. *Réserve :* serveur en mémoire à un seul fil ; l'atomicité
    réelle du contrôle de version en base, la conservation de la copie à la
    fermeture de l'onglet et le parcours de récupération restent à éprouver.
11. **Liaison cachée et note — tenu avec réserve.** F05-AC26, AC27, AC37
    passent ; ce que reçoit l'élève ne contient ni la cible de la liaison ni
    la note. *Implication :* puisque la note n'est jamais envoyée à l'élève,
    son enregistrement est une fusion : le serveur replace chaque note après
    le bloc qui la précédait. « Jamais imprimé » n'est vérifié que sur les
    volets de lecture du prototype, pas sur un PDF.
12. **Tablette et clavier seul — clavier tenu, tablette non vérifiée sur
    appareil.** F05-AC39 passe sans souris ; F05-AC40 passe au doigt sur iPad
    émulé. Vérifié sans tablette : appui sur une phrase, « Monter » et
    « Descendre », bouton « Choix », « + » autour d'un bloc protégé, et toute
    la suite sous le moteur de Safari. **Non vérifié :** clavier virtuel
    (saisie prédictive, Android en particulier, que Slate traite par un code
    distinct), poignées de sélection tactile autour d'un bloc, « tout
    sélectionner » du menu tactile — la voie native échoue quand la scène finit
    par un bloc fermé, le raccourci clavier a dû être repris par l'éditeur —,
    et tout lecteur d'écran : seuls les attributs d'annonce sont contrôlés.
13. **Même contenu partout — tenu avec réserve.** Une seule fonction produit
    le texte d'un bloc pour l'éditeur et pour deux volets, « livre » et
    « lecteur en ligne » ; le graphe affiché se déduit des renvois. *Non
    vérifié :* l'aperçu composé et le PDF, absents du prototype.
14. **Paragraphe d'action de jeu — tenu.** F04-AC17 (hors PDF), AC25, AC30
    passent : passage du récit à l'action et retour, `/action`, aucun renvoi
    par collage ni fusion, couper-coller et copier-coller entre scènes, bloc
    épargné et collage écarté pour le profil « écriture et propositions »,
    refus côté serveur.

**Ce que Plate n'a pas donné et qu'il a fallu écrire.** Environ 540 lignes de
règles, qui s'adressent surtout à Slate ; Plate apporte ici le système de
greffons, les trois mises en forme et le nettoyage du collage. Six
contournements tiennent à un même choix : présenter une phrase automatique ou
un bloc protégé comme un bloc « fermé » de Slate, que Slate n'a prévu que
sans contenu.

- Le curseur ne peut se poser que sur le premier texte d'un tel bloc : toute
  sélection qui tomberait plus loin doit y être ramenée, sinon elle se perd.
- Modifier un renvoi à l'intérieur exige une option que Slate ignore par défaut.
- Copier ne prenait que le début du bloc : la copie a été reprise pour
  emporter le bloc entier.
- L'ordre des éléments dans la page conditionne la sortie en texte simple.
- Entrée et les lettres n'atteignent pas l'éditeur sur un bloc fermé ; « tout
  sélectionner » natif échoue si la scène finit par un tel bloc.
- Annuler et rétablir au clavier dépendaient de l'historique du navigateur.

Autres constats : Slate reporte la sélection du navigateur avec un retard
d'environ 100 ms, et une frappe faite aussitôt après une entrée au clavier
dans le texte peut atterrir en début de scène — observé aussi sans les règles
de l'essai. Les identités de blocs sont gérées par l'essai, le greffon
d'identité de Plate étant désactivé, pour distinguer déplacer et copier.

**Décision du 2 octobre 2026 : Plate est retenu**, sur la recommandation
ci-dessous confirmée par le porteur ; voir
[l'ADR 0002](adr/0002-plate-pour-l-editeur.md). Aucun des
quatorze points ne l'a mis en échec et les six points jugés décisifs (1, 2, 5,
7, 8, 14) sont tenus sous Chromium et WebKit. Ce n'est pas une comparaison :
Tiptap n'a pas été essayé, et rien ici ne dit qu'il ferait moins bien.

**Ce qui reste incertain.**

- Tablettes réelles, clavier virtuel et lecteurs d'écran : non vérifiés. Le
  porteur indique le 3 octobre 2026 qu'il ne peut pas faire cet essai et que
  la tablette n'est pas le support de prédilection ; l'essai est mis de côté.
  Le risque demeure pour un usage sur tablette : seul un iPad émulé a été
  éprouvé, et c'est le point qui pourrait encore rouvrir le choix de Plate.
- Tenue des contournements aux montées de version de Plate et de Slate : les
  figer, et conserver les scénarios de test comme filet, non le code.
- Scène créée depuis un choix puis annulée, morceau de phrase collé, sélection
  couvrant tous les renvois : confirmés le 10 octobre 2026 en
  [F05.2](specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène).
- Collage depuis Word, LibreOffice et Google Docs réels ; Firefox.
- Images dans l'éditeur : hors de la liste, donc non éprouvées. L'image en
  bloc de F10 relève du même mécanisme que les blocs fermés ; l'image en
  ligne, retenue le 3 octobre 2026 en F10 pour la première livraison, sera un second élément
  insécable à côté du renvoi ; son effet sur l'interlignage est à mesurer
  avec le prototype PDF.
- Sauvegarde concurrente et contrôle serveur sur la vraie base.

### Ce que le prototype PDF devra éprouver

Liste établie le 3 octobre 2026 pour le second essai jetable, autorisé le
2 octobre 2026 : la chaîne de l'aperçu et des PDF de
[F11](specifications.md#f11--composition-et-préparation-du-livre). Paged.js,
avec HTML/CSS et Chromium piloté par Playwright, y était le candidat
prioritaire ; Typst ne devait être essayé que si Paged.js échouait sur un
point essentiel. L'essai est réalisé le 3 octobre 2026 ; ses
[résultats](#résultats-du-prototype-pdf-3-octobre-2026) suivent cette liste.
Chaque point renvoie aux critères qui serviront à le juger ; un point sans
test automatique sera déclaré « non vérifié ».

1. **Format A5 en vis-à-vis :** pages de 148 × 210 mm, marge intérieure plus
   large que la marge extérieure, alternée entre pages de gauche et de droite,
   calculée et non réglée par l'adulte ; aucune image à fond perdu. Décision
   de format de F11.3, sans critère numéroté.
2. **Aperçu et PDF identiques à la page près :** même nombre de pages, même
   premier et même dernier mot sur chaque page, entre l'aperçu à l'écran et
   le PDF. F11-AC30. À mesurer séparément : l'aperçu sous Chromium, et
   l'aperçu sous le moteur de Safari, celui des iPad — Paged.js calcule les
   pages dans le navigateur de l'adulte, alors que le PDF sort d'un Chromium
   côté serveur.
3. **Marques du PDF de travail sans effet sur la mise en page :** mention
   « Version de travail », référence stable à côté de chaque numéro,
   signalements à leur place, page récapitulative avant le livre et hors
   pagination ; le PDF définitif n'en porte aucune et coupe ses lignes et ses
   pages aux mêmes endroits. F11-AC15, F09-AC09, F05-AC08, décision « une
   seule composition » de F11.2.
4. **Numéros imprimés, renvois, titres de partie :** numéros continus de 1 à
   N, départ au n° 1, renvoi égal au numéro de la destination et recalculé
   quand l'ordre change, phrase à deux renvois, titre de partie au-dessus de
   la scène d'ouverture, en-tête courant « 12 – 14 », marque de fin avant les
   choix d'une fin. F11-AC18, AC20, AC22, AC33, AC34, F05-AC09, AC10. L'ordre
   imprimé est une donnée d'entrée de l'essai : le mélange de F11-AC16, AC17
   et AC23 n'est pas un risque du moteur et n'en fait pas partie.
5. **Images :** dans les marges, largeur petite, moyenne, pleine ou en
   pourcentage, pleine page à l'intérieur des marges, image trop grande
   réduite, image manquante signalée à sa place, dessin peu défini repéré
   d'après sa taille imprimée. F10-AC13, AC14, AC15, F11.3.
6. **Coupures :** phrase de choix et action de jeu jamais coupées entre deux
   pages ni séparées du texte qui les amène ; titre de partie et numéro de
   passage jamais seuls en bas de page ; veuves et orphelines ; césure
   française. Mise en valeur de l'action de jeu : F04-AC17. **Les
   spécifications ne fixent aujourd'hui aucune règle de coupure** : l'essai
   dira ce qui est tenable, la règle restera à décider.
7. **Ajustements de composition :** début d'une scène sur une nouvelle page
   et taille d'image conservés au réexport ; ajustement devenu impossible
   signalé, jamais passé sous silence ; échange de deux scènes dans l'ordre
   imprimé sans changement de destination. F11-AC09, AC10, AC11.
8. **Pages de présentation, feuille d'aventure, folios :** page de titre,
   « Comment lire ce livre » avec règles du jeu, feuille d'aventure à
   sections, page des auteurs, page de fin, dans le même fichier que le
   récit ; folios côté extérieur. F11-AC12, AC28, AC29, F04-AC19. La
   pagination des pages hors récit est différée en F11.4 : l'essai prendra
   une hypothèse, déclarée comme telle.
9. **Correction depuis l'aperçu et durée de recomposition :** un clic sur un
   passage de l'aperçu retrouve sa scène, la coquille est corrigée dans le
   texte de la scène, l'aperçu recalculé et le PDF suivant la contiennent ;
   durée de recomposition mesurée dans le navigateur. F11-AC27.
10. **Export sur un instantané :** une modification faite pendant le calcul
    ne figure pas dans le fichier ; la date de l'état est connue. F11-AC26.
11. **Durée, mémoire et taille :** pour le livre d'essai, durée de l'export,
    mémoire maximale de Chromium et du processus, taille du PDF.
12. **Polices incorporées et dimensions exactes :** toutes les polices sont
    dans le fichier ; chaque page mesure exactement 148 × 210 mm. Exigences
    d'impression de F11.4. Hors essai : normes PDF/X, profils de couleur et
    acceptation réelle par un imprimeur.
13. **Même entrée, même pagination :** deux exports successifs du même
    contenu donnent les mêmes pages. F11-AC19, F11-AC30.
14. **Faisabilité dans une fonction Vercel :** taille du Chromium embarqué,
    durée et mémoire mesurées, comparées aux limites documentées. Aucun
    déploiement : l'exécution réelle chez Vercel restera « non vérifiée ».
15. **Image en ligne (ajout du porteur, 3 octobre 2026) :** image posée sur
    la ligne, à la hauteur du texte et sans réglage ; interlignage inchangé
    dans le paragraphe qui la porte ; aperçu et PDF identiques ; lisibilité
    d'un symbole détaillé imprimé à cette taille, à faire juger au porteur
    sur le PDF. Rubrique « à éprouver » de
    [F10](specifications.md#f10--illustrations), sans critère numéroté.

Hors de cet essai : récit classique (titres de chapitre, séparateur de
scènes), calcul du mélange et des contrôles de F09.2, couverture, lecteur en
ligne, comptes et base de données.

**Moteurs candidats — licence et maintenance, vérifiées le 3 octobre 2026**
dans les dépôts officiels et le registre npm. Aucun n'est payant.

| Moteur | Licence | État constaté |
| --- | --- | --- |
| [Paged.js](https://github.com/pagedjs/pagedjs) | MIT | Dernière version stable 0.4.3 du 6 juillet 2023 ; 0.5.0-beta.2 du 4 octobre 2024 ; dernier commit sur la branche principale le 20 mars 2026 ; 236 tickets ouverts. Maintenu par quelques personnes, à un rythme lent : aucune version stable depuis plus de trois ans. |
| [Vivliostyle](https://github.com/vivliostyle/vivliostyle.js) | AGPL-3.0 | Version 2.45.2 du 23 septembre 2026, activité soutenue. Sa [FAQ](https://vivliostyle.org/faq/) précise qu'un programme qui l'incorpore doit être publié sous AGPL ; seul l'usage de son afficheur comme programme indépendant y échappe. Contrainte à arbitrer pour un produit commercial. |
| [Typst](https://github.com/typst/typst) | Apache-2.0 | Version 0.15.1 du 17 juillet 2026, dernier commit le 30 septembre 2026, activité soutenue. Langage propre, sans HTML ni CSS : l'aperçu et le clic sur un passage seraient à construire autrement. |
| [react-pdf](https://github.com/diegomura/react-pdf) | MIT | `@react-pdf/renderer` 4.9.0 du 27 août 2026, dernier commit le 22 septembre 2026, 332 tickets ouverts. Moteur de mise en page propre, sans CSS paginé. |
| [WeasyPrint](https://github.com/Kozea/WeasyPrint) | BSD-3-Clause | Version 70.0 du 8 septembre 2026, dernier commit le 1er octobre 2026, activité soutenue. Python, sans JavaScript : l'aperçu du navigateur ne passerait pas par le même moteur. |

**Limites des fonctions Vercel, relues le 3 octobre 2026**
([documentation](https://vercel.com/docs/functions/limitations), mise à jour
le 24 août 2026) : 250 Mo non compressés par fonction, ou jusqu'à 5 Go avec
les « large functions » en bêta ; mémoire de 2 Go par défaut et 4 Go au plus
en Pro ; durée de 300 s par défaut et 800 s au plus en Pro ; corps de requête
ou de réponse limité à 4,5 Mo. Cette dernière limite compte autant que les
autres : un PDF plus lourd ne peut pas être renvoyé directement par la
fonction et devrait passer par le stockage de fichiers.

### Résultats du prototype PDF (3 octobre 2026)

Essai jetable dans [`prototypes/pdf/`](../prototypes/pdf/README.md) : une
fonction compose le livre en un seul HTML, Paged.js 0.4.3 y calcule les pages,
le Chromium de Playwright 1.63 imprime. La même page sert d'aperçu et de
source aux deux PDF. Aucun code n'a vocation à être repris. Ni compte, ni
base, ni déploiement.

**Livre utilisé :** le livre fabriqué par l'essai, aucun livre n'ayant été
déposé dans `prototypes/pdf/livre/`. « Les passeurs de brume » : 60 scènes de
30 à 1 700 mots en trois parties, 26 720 mots, 30 images en bloc dont
6 pleines pages et 4 dessins peu définis, 5 phrases à deux renvois, 15 actions
de jeu, 5 images en ligne, une feuille d'aventure ; 145 pages A5. Son texte
est tiré au sort dans une quarantaine de phrases : il vaut pour la mise en
page, pas pour un vrai livre de classe, dont les images pèseront davantage.

**Ce qui a été exécuté.** 50 tests Playwright, la série jouée deux fois sans
écart : 49 réussis et un échec attendu, gardé visible, l'aperçu sous WebKit. Les tests
relisent le PDF produit (lignes de texte et leur position, images posées,
polices, taille des pages) et le comparent à l'aperçu ligne à ligne. Machine :
Apple M5 Pro sous macOS.

**Ce qui n'a pas été exécuté.** Aucun Chromium sous Linux, aucun Windows,
aucun Firefox, aucune tablette réelle, aucun déploiement, aucune impression
sur papier, aucun envoi à un imprimeur. Typst n'a pas été essayé : voir la
décision.

| Point | Verdict | Preuve |
| --- | --- | --- |
| 1. Format A5 en vis-à-vis | Tenu avec réserve | `tests/p01` (3) |
| 2. Aperçu et PDF identiques | Chromium : tenu. WebKit : non tenu. Autres : non vérifié | `tests/p02` (5) |
| 3. Marques du PDF de travail | Tenu | `tests/p03` (4) |
| 4. Numéros, renvois, titres de partie | Tenu | `tests/p04` (7) |
| 5. Images | Tenu avec réserve | `tests/p05` (4), `tests/p01` |
| 6. Coupures | Tenu avec réserve | `tests/p06` (10) |
| 7. Ajustements de composition | Tenu | `tests/p07` (3) |
| 8. Pages de présentation, feuille, folios | Tenu avec réserve | `tests/p08` (3) |
| 9. Correction depuis l'aperçu | Tenu avec réserve | `tests/p09` (3) |
| 10. Export sur un instantané | Tenu avec réserve | `tests/p10` (1) |
| 11. Durée, mémoire, taille | Mesuré | `tests/p11` |
| 12. Polices et dimensions exactes | Tenu avec réserve | `tests/p11`, `tests/p01` |
| 13. Même entrée, même pagination | Tenu sur une même machine | `tests/p11` |
| 14. Fonction Vercel | Non vérifié ; mesures compatibles | `tests/p14` (1) |
| 15. Image en ligne | Tenu ; lisibilité jugée satisfaisante par le porteur | `tests/p15` (2) |

**Mesures, livre d'essai de 145 pages, trois exports de suite.**

| Grandeur | Valeur mesurée |
| --- | --- |
| Durée d'un export | 2,9 s : lancement de Chromium 0,1 s, mise en page 2,5 s, impression 0,3 s, taille des pages 0,02 s |
| Mémoire maximale | Chromium 0,5 Go ; Node 0,4 Go, exécutant de tests compris |
| Taille du PDF | 6,7 Mo, pour 6,1 Mo d'images déposées |
| Recomposition après une correction | 2,5 s dans le navigateur, sous Chromium comme sous WebKit |
| Chromium embarquable (`@sparticuz/chromium` 153) | 67 Mo compressé, 210 Mo une fois décompressé |
| Ensemble à embarquer dans une fonction | 99 Mo : Chromium compressé, playwright-core 13 Mo, pdf-lib 19 Mo, Paged.js 1 Mo |

**Détail par point : ce qui est prouvé, ce qui ne l'est pas, ce que cela
implique.**

1. **Format A5 — tenu avec réserve.** Marge intérieure de 20 mm et extérieure
   de 15 mm, alternées, vérifiées sur les lignes de chaque page ; les 30
   images restent dans les marges. *Réserve :* Chromium arrondit la page à
   148,17 × 209,89 mm. L'essai rétablit 148 × 210 mm exactement après
   l'impression, avec pdf-lib, sans déplacer le contenu. *Implication :* une
   étape de plus dans la chaîne, et une bibliothèque sans version depuis
   2022 ; l'autre voie est d'accepter l'écart de 0,2 mm, à voir avec
   l'imprimeur. *Décidé le 3 octobre 2026 :* l'écart est accepté, selon
   [F11.3](specifications.md#f113--présentation-commune-du-livre) ; l'étape
   de correction et pdf-lib ne sont pas à reprendre pour cet usage. La page
   de 420 × 595 points reste à faire accepter par un premier envoi.
2. **Aperçu et PDF identiques — tenu sous Chromium, non tenu sous WebKit.**
   F11-AC30 passe sous Chromium : 145 pages, mêmes lignes sur chaque page,
   écran ordinaire, haute densité et affichage à 125 %. **Sous WebKit, le
   moteur de Safari et des iPad, 111 pages sur 145 diffèrent et l'aperçu
   compte 146 pages** : les lignes n'y sont pas coupées aux mêmes endroits.
   *Non vérifié :* Firefox, Windows, tablette réelle, et un Chrome d'une autre
   version que le Chromium du serveur. *Implication :* un aperçu calculé dans
   le navigateur de l'adulte ne peut pas garantir F11-AC30. Pour la tenir sur
   tout appareil, l'aperçu doit être calculé par le même Chromium que le PDF,
   côté serveur. L'essai montre que la composition sait alors dire où se
   trouve chaque bloc (carte de 507 blocs, 36 Ko, `tests/p16`), ce qui permet
   de retrouver la scène sous un clic ; l'affichage d'un tel aperçu n'est pas
   prototypé.
3. **Marques du PDF de travail — tenu.** F11-AC15, F09-AC09, F05-AC08 et
   F10-AC14 passent. Les deux fichiers ont les mêmes lignes aux mêmes
   positions, à 0,02 point près, sur les 145 pages. Le PDF définitif est
   refusé tant qu'un problème bloquant existe. *Implication :* les marques
   sont posées après la mise en page, hors du flux du texte ; c'est ce qui
   garantit l'absence d'effet. La page récapitulative occupe deux pages, son
   verso restant blanc, pour que le livre garde ses pages de droite.
4. **Numéros, renvois, titres de partie — tenu.** F11-AC20, AC22, AC33, AC34,
   AC09, F05-AC09 et AC10 passent ; l'en-tête « 12 – 14 » est vérifié sur
   toutes les pages. Le numéro reste attaché au mot qui le précède.
   *Hors essai :* le mélange et le départ au n° 1 (F11-AC16 à AC18, AC23),
   l'ordre imprimé étant fourni.
5. **Images — tenu avec réserve.** F10-AC13 et AC15 passent : 40 %, 65 %,
   100 % et 60 % mesurés dans le PDF à 0,3 mm près ; pleine page seule sur sa
   page et dans les marges ; image trop haute réduite en gardant ses
   proportions ; dessin de 76 points par pouce signalé sans blocage.
   *Réserves :* une image pleine page impose un saut avant et après elle, ce
   qui laisse du blanc au bas de la page précédente ; Paged.js ne sait pas la
   reporter à la page suivante en laissant le texte continuer. Une image qui
   ne tient pas dans le bas d'une page passe entière à la suivante, avec le
   même blanc : c'est le besoin d'ajustement rapporté de la V0.
6. **Coupures — tenu avec réserve.** Sur le livre d'essai et quatre variantes
   décalées de quelques mots, soit environ 725 pages : aucune phrase de choix, action
   de jeu, image ni numéro coupé ; aucun numéro ni titre seul en bas de page ;
   ni veuve ni orpheline ; aucun texte perdu, le récit du PDF étant comparé
   caractère par caractère à la composition. Sans ces règles, le même relevé
   trouve 12 fautes. Césure : 434 lignes sur 3 101, toutes sur un point de
   césure du français. F04-AC17 passe. *Réserves :* (a) ces règles viennent de
   Chromium, à qui Paged.js laisse le soin de couper ; elles dépendent donc
   de sa version. (b) **Un défaut de Paged.js a dû être contourné** : quand
   une page se termine au milieu d'un mot coupé, la coupure tombait une
   lettre trop loin, 13 fois sur 83, et trois pages perdaient une ligne. Le
   contournement tient en vingt lignes. (c) La césure est posée à la
   composition, par des motifs de césure (hyphenopoly, MIT), et non par le
   navigateur, dont les dictionnaires varient d'une machine à l'autre.
   (d) Deux scènes placent une image pleine page juste avant leurs choix :
   les choix se retrouvent seuls en tête de la page suivante.
7. **Ajustements — tenu.** F11-AC10 et AC11 passent : le saut de page et la
   largeur d'image survivent à l'ajout de deux pages en amont, le numéro de
   page changeant ; une largeur demandée à 95 % qui ne peut pas être atteinte
   est rapportée avec la largeur obtenue. Un groupe de choix plus haut qu'une
   page est coupé, sans perte. *Implication :* un ajustement impossible ne se
   constate qu'après la mise en page ; le rapport de composition doit donc
   revenir du moteur à l'application.
8. **Pages de présentation, feuille, folios — tenu avec réserve.** F11-AC12,
   AC28, AC29 et F04-AC19 passent ; folios côté extérieur, égaux au rang de la
   page. *Hypothèse de l'essai :* les pages de présentation
   comptent dans la pagination sans folio imprimé, et le récit commence en
   page de droite ; retenue le 3 octobre 2026 en F11.4, avec un folio
   désactivé par défaut pour le récit à choix. *Non essayé :* une feuille d'aventure plus longue qu'une
   page.
9. **Correction depuis l'aperçu — tenu avec réserve.** F11-AC27 passe sous
   Chromium et WebKit : le clic retrouve la scène, le texte de la scène est
   corrigé, la scène reste prête, le PDF suivant contient la correction ; un
   renvoi ne peut être ni ajouté ni retiré par cette voie. La correction est
   visible en 2,5 s. *Réserves :* tout le livre est recomposé à chaque
   correction ; la saisie de l'essai est un simple champ de texte, pas
   l'éditeur Plate.
10. **Instantané — tenu avec réserve.** F11-AC26 passe : une correction
    arrivée pendant le calcul ne figure pas dans le fichier, la date de l'état
    est rendue et l'écart est signalé. *Réserve :* l'instantané de l'essai
    copie le texte, pas les fichiers d'images ; dans l'application, chaque
    image devra être désignée par un identifiant qui ne change pas.
11. **Durée, mémoire, taille — mesuré**, voir le tableau. La taille du PDF
    suit celle des images : des photographies non réduites à l'import
    donneraient un fichier bien plus lourd. Non mesuré sur une machine moins
    rapide.
12. **Polices et dimensions — tenu avec réserve.** Cinq polices, toutes
    incorporées en sous-ensembles ; aucune police du système. Dimensions
    exactes après l'étape du point 1. *Constat :* la couche de texte du PDF
    garde les points de césure, ce qui peut gêner la recherche d'un mot dans
    un lecteur de PDF ; non vérifié. *Hors essai :* PDF/X, profils de
    couleur, acceptation par un imprimeur.
13. **Même pagination deux fois — tenu sur une même machine** : mêmes lignes,
    mêmes positions. Non vérifié d'une machine à l'autre.
14. **Fonction Vercel — non vérifié.** Voir la réponse plus bas.
15. **Image en ligne — tenu.** À la hauteur du texte, 4,2 mm pour un corps de
    12 points ; le pas des lignes ne change pas dans les cinq paragraphes qui
    en portent, récit comme action de jeu ; mêmes lignes dans l'aperçu et le
    PDF. Le porteur juge la lisibilité d'un symbole détaillé à cette taille
    satisfaisante le 3 octobre 2026, sur les pages 63, 84 et 96 du PDF
    définitif.

**Décision du 3 octobre 2026 : Paged.js et Chromium sont retenus, avec un
aperçu calculé côté serveur**, sur la recommandation de l'essai confirmée par
le porteur ; voir [l'ADR 0003](adr/0003-pagedjs-chromium-apercu-cote-serveur.md).
Le livre est composé en HTML et CSS, paginé par Paged.js et imprimé par
Chromium ; l'aperçu est calculé par ce même Chromium, et non dans le
navigateur de l'adulte. Aucun des points propres au PDF n'a mis cette chaîne
en échec, et elle est rapide. Son point faible est ailleurs : Paged.js est
peu maintenu, un défaut a déjà dû être contourné, et la qualité des coupures
repose sur Chromium.

Typst n'a pas été essayé. La consigne le réservait à un échec de Paged.js sur
un point essentiel ; le seul échec, la fidélité hors de Chromium, tient au
calcul des pages dans le navigateur et se corrige sans changer de moteur. Le
porteur écarte cet essai le 3 octobre 2026 : Paged.js suffisant, il serait
inutile. Ce n'est pas une comparaison, et rien ici ne dit que Typst ferait
moins bien.

**Ce qui reste incertain.**

- Le Chromium de Linux, celui du serveur, n'a pas été exécuté : mêmes pages
  que sur macOS, durée et mémoire réelles.
- L'affichage d'un aperçu calculé côté serveur et son délai ressenti. Piste
  notée le 3 octobre 2026, à éprouver : le livre entier est recomposé à
  chaque changement, car un passage déplacé change des numéros et des renvois
  partout, et Paged.js ne sait pas recomposer une tranche ; seules les pages
  voisines de celle que l'adulte regarde lui sont envoyées. Recomposer une
  tranche du livre n'est pas justifié par les 2,5 s mesurées.
- La tenue des coupures et du contournement aux montées de version de
  Chromium et de Paged.js ; garder les tests comme filet, non le code.
- Le rendu sur papier, la césure jugée à l'œil, l'acceptation par l'imprimeur.
- Un vrai livre de classe, avec ses images.

**Le PDF peut-il être produit chez Vercel ?** Rien de mesuré ne l'interdit,
et rien ne le prouve. L'ensemble à embarquer pèse 99 Mo pour une limite de
250 Mo ; l'export a pris 2,9 s et 0,9 Go ici, pour 300 s et 2 Go accordés par
défaut. Deux contraintes sont certaines : le fichier, plus lourd que les
4,5 Mo d'une réponse, doit être déposé dans le stockage ; et Chromium se
décompresse à chaque démarrage à froid, 210 Mo dans l'espace temporaire, dont
la limite n'a pas été vérifiée. L'exécution réelle, le démarrage à froid et
l'accord entre ce Chromium et Playwright restent non vérifiés. Un traitement
séparé n'est donc pas justifié par les mesures ; il le deviendrait si l'essai
de déploiement échouait, ou si l'aperçu calculé côté serveur multipliait les
appels au point de peser sur le coût. La décision demande un essai de
déploiement, non autorisé à ce stade.

**Points des spécifications signalés par l'essai ; ceux qui restent ouverts seront repris en entretien.**

- F11-AC30 ne peut être tenue sur tout navigateur que par un aperçu calculé
  côté serveur : décidé le 3 octobre 2026 (ADR 0003). La règle fonctionnelle
  est inchangée ; le délai de l'aperçu après une correction reste à éprouver.
- F10 réduit une image trop grande « sans avertissement », F11-AC11 demande
  d'informer l'adulte d'un ajustement devenu impossible : les deux se
  contredisaient pour une largeur réglée à la main. Arbitré le 3 octobre 2026
  en [F10](specifications.md#f10--illustrations) : l'image est réduite et les
  contrôles l'indiquent en « à savoir », sans blocage. La définition conservée
  des images y est décidée le même jour ; elle borne aussi le poids du PDF,
  qui suit celui des images.
- Règles de coupure : celles de l'essai sont adoptées le 3 octobre 2026 en
  [F11.3](specifications.md#f113--présentation-commune-du-livre), avec
  l'alignement et la césure.
- Place d'une image : elle reste où l'auteur l'a posée, saut avant et après
  pour une pleine page, décidé le même jour en
  [F10](specifications.md#f10--illustrations) ; le report automatique,
  que Paged.js ne fait pas seul, est écarté.
- Pagination des pages de présentation : décidée le même jour en
  [F11.4](specifications.md#f114--intérieur-du-livre-pages-de-présentation-et-couverture).

**Ce que les décisions du 3 octobre 2026 ajoutent à éprouver**, l'essai ne
l'ayant pas couvert : la césure restreinte (aucune dans un mot à majuscule ni
dans le dernier mot d'un paragraphe) et le taux de lignes coupées qui en
résulte ; l'alignement à gauche sans césure ; l'absence de mot coupé entre
deux pages, souhaitée sans valeur de règle ; un groupe de choix coupé entre
deux phrases et une action de jeu plus haute qu'une page ; le folio absent et
les dés imprimés en page de droite ; une feuille d'aventure de plusieurs
pages et une page de présentation en image ; les marges modifiées par
l'adulte ; la détection d'un contenu hors des marges et d'une page peu
remplie à partir de la carte des blocs ; l'éditeur de la scène ouvert à côté
d'un aperçu calculé côté serveur. Aucun de ces essais n'est autorisé à ce
stade.

Ces vérifications nécessiteront des travaux ultérieurs autorisés. Le
[plan de réalisation](plan.md#vérifications-techniques-à-lever) dit à quelle
étape chacune se lève : le porteur décide le 8 octobre 2026 qu'elles se
lèvent dans l'application, sans nouveau prototype. Les tarifs,
conditions et limites devront être revérifiés au moment du choix ; cette note
n'est ni un devis d'exploitation ni une décision d'achat.
