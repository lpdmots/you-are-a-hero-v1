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

**Compte de l'adulte.** Supabase Auth, adresse et mot de passe, session dans des
cookies que les scripts ne lisent pas. Les inscriptions publiques sont fermées
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

**Sauvegarde (V18).** `npm run sauvegarder` écrit les rôles, le schéma et les
données de la vraie base, comptes compris, par l'outil de Supabase, qui a
besoin de Docker ; `npm run restaurer` remet une base au schéma de
l'application puis y charge ces données. Les fichiers de Supabase Storage,
utilisés à partir de l'étape 2, n'y sont pas. Le fichier des clés de la vraie
application s'appelle `production.env`, et non `.env.production.local` : Next.js
charge de lui-même ce second nom, et une application lancée en local parlerait
alors à la vraie base.

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
  couvrant tous les renvois : comportements à confirmer avant réalisation.
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
