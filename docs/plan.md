# Plan de réalisation V1

Document de référence pour l'ordre de construction. Les règles restent dans
les [spécifications](specifications.md) et les choix techniques dans
[l'architecture](architecture.md) ; ce plan y renvoie sans les recopier.

## Statut au 8 octobre 2026

Plan validé dans son ensemble par le porteur le 8 octobre 2026, à l'issue de
l'entretien des 7 et 8 octobre. Cette validation porte sur le cadre, les
deux seuils, l'ordre et le périmètre des neuf étapes ; elle ne tranche
aucune des questions listées « à régler avant de commencer », qui gardent
leur statut.

**Avancement au 9 octobre 2026 :** l'étape 1 est construite et en ligne,
sur autorisation du porteur du 8 octobre 2026 pour cette étape seule ; il
lui reste l'essai du porteur (voir
[Étape 1](#étape-1--sinstaller--compte-projets-classes-accès-des-élèves)).
L'étape 2 n'est pas commencée.

Ce plan n'autorise par lui-même ni développement, ni prototype, ni achat :
chaque étape demande une instruction du porteur. La V1
repart de zéro : aucun code de la V0 ni des deux prototypes n'est repris,
leurs verdicts seuls servent. La maquette de synthèse montre les écrans, qui
restent des propositions. Les règles validées ne sont pas rouvertes : un trou
de règle révélé par le plan est noté comme question ouverte, non décidé.

## Cadre de réalisation

**Décidé par le porteur le 8 octobre 2026 :**

- **Qui construit :** l'IA écrit le code ; le porteur dirige, essaie et
  décide. C'est un développement personnel, sans calendrier ni engagement
  financier : le plan ordonne les étapes et ne leur donne pas de date.
- **Un seul critère d'ordre :** construire l'application entière de la façon
  la plus efficace. Chaque domaine se construit une fois, complet, avec ses
  variantes de mode, sans version réduite à reprendre plus tard.
- **Les points non vérifiés sont supposés tenir.** Chaque vérification se
  lève dans l'application, à l'étape qui en a besoin, sans nouveau prototype
  et sans réordonner le plan autour d'un risque.
- **Deux seuils :** « ma classe », où le porteur est le seul adulte, sans
  inscription publique ni paiement ; puis « ouverture », où d'autres
  enseignants s'inscrivent, ce qui demande F14 et l'examen des obligations
  envers d'autres écoles. Ces seuils sont des moments du plan ; ils n'en
  retirent ni une règle ni l'une des quatre combinaisons.
- **Premier usage :** le vrai livre de l'année, à choix, écrit par sa classe,
  avec dessins d'élèves, objets et dé ; souhaité pour janvier 2027. C'est un
  souhait, non une échéance : si l'application n'est pas prête, la classe
  travaille sur la V0.
- **En ligne :** l'application est servie à l'adresse que donne Vercel, sans
  nom de domaine.

**Les deux seuils dans l'ordre des étapes :**

- **« Ma classe »** est atteint à la fin de l'étape 4, une restauration de la
  base ayant réussi : les élèves se connectent, écrivent, remettent, et
  l'enseignant valide et suit. L'aperçu du livre n'en fait plus partie :
  d'abord prévu à ce seuil dans une forme réduite, il arrive entier à
  l'étape 6, puisqu'aucun domaine n'est construit en deux fois.
- **« Ouverture »** est l'étape 9.

**Avis du chef de projet, non une décision :** la vitesse d'écriture du code
n'est pas ce qui limite — chacun des deux prototypes a tenu en une journée.
Ce qui limite est le temps du porteur : arbitrer les questions qui bloquent
une étape, essayer ce qui est livré, et constater en salle informatique ce
qu'aucun test ne montre. Chaque étape se termine donc par un essai qu'il fait
lui-même.

## Périmètre de la première livraison

Relevé des spécifications au 7 octobre 2026. « Écrit » signale que les mots
« première livraison » figurent dans la section ; ailleurs, la règle est
décidée dans un parcours validé sans que ces mots y soient.

| F | Ce qui est retenu | Statut |
| --- | --- | --- |
| [F01](specifications.md#f01--projet-et-responsabilité-de-ladulte), [F01.1](specifications.md#f011--classes-années-et-éventuel-espace-école) | Projets dans les quatre combinaisons, modes fixes, un seul enseignant responsable ; classes par année, inscription en lot, profils réutilisés, fin d'année, retrait d'un élève. | Écrit. |
| [F02](specifications.md#f02--préparer-le-récit-et-les-décisions-communes) | Carnet de préparation saisi par l'adulte seul, plan commun aux deux vues, atelier projeté. | Écrit pour la saisie ; le reste décidé. |
| [F03](specifications.md#f03--organiser-le-récit) | Parties, chapitres et scènes ; cartes et menus, corbeille du projet sans durée limite, « Chemins », recherche des scènes, départ et fins. | Décidé. |
| [F04](specifications.md#f04--rédaction-dans-léditeur) | Mise en forme légère et collage nettoyé ; objets, feuille d'aventure, actions de jeu et dé, sans vérification par l'application ; scènes voisines. | Écrit pour F04.2 ; F04.1 et F04.3 décidés. |
| [F05](specifications.md#f05--retrouver-les-scènes-et-relier-les-choix) | Référence et recherche des scènes, phrase de choix et renvoi, choix créés et modifiés dans la scène, liaison cachée. | Écrit pour le socle ; F05.1 et F05.2 décidés. |
| [F06](specifications.md#f06--attributions-accès-et-organisation-de-lécriture) | Attribution par chapitre, deux profils, paragraphe protégé, prise en charge, accès de classe et code personnel, affiche et étiquettes, horaires, Suivi par projet. | Écrit pour F06.1 ; le reste décidé. |
| [F07](specifications.md#f07--révision-et-validation) | États de la scène, remarques liées à la scène, demandes de l'élève à l'oral, fiches de rédaction, encouragements. | Écrit pour F07.2, F07.3 et F07.5 ; parcours et écrans de F07.5 à préciser avant réalisation. |
| [F08](specifications.md#f08--sauvegarde-et-récupération) | Détection d'un conflit, texte gardé à part, récupération par l'enseignant. | Écrit. Historique des versions et incidents sans conflit non spécifiés. |
| [F09](specifications.md#f09--test-de-lecture-et-cohérence-du-récit) | Lecture d'essai, contrôles des chemins et leur gravité. | Décidé. |
| [F10](specifications.md#f10--illustrations) | Import et placement par l'adulte, image en ligne, images de repérage, aide à l'illustration par prompts. | Écrit. |
| [F11](specifications.md#f11--composition-et-préparation-du-livre) | Format A5 unique, aperçu, PDF de travail et PDF définitif, règles de composition, pages de présentation, ordre imprimé et « Réordonner les passages », parcours guidé, passage suggéré. | Écrit pour le format et l'agencement ; le reste décidé. Le passage suggéré (F11.3) est conditionné par les spécifications à un essai des hauteurs ; le plan le suppose concluant. |
| [F12](specifications.md#f121--partager-une-version-du-récit) | Version partagée, lien de lecture, lecteur en ligne, lecture par les classes de l'enseignant. | Écrit. |
| [F13](specifications.md#f13--assistance-ia-facultative) | Correction en trois intentions (F13.1), aide aux choix et à leurs destinations (F13.3). | Écrit pour ces deux aides seulement. F13.2, F13.4 et F13.5, retenues sans échéance dans les spécifications, sont placées à l'étape 8 par la validation du plan. |
| F14 | Aucune règle. | Au niveau du brief : pas de section dans les spécifications. |

**Ordre de grandeur :** les spécifications numérotent environ 460 critères
d'acceptation de F01 à F13, dont 95 pour F11 et près de 80 pour F06. Ce compte mesure
l'étendue du périmètre, pas une durée.

**Critères à écarter ou à accorder avant de servir de fin d'étape :**
F07-AC06, conservé mais inapplicable en première livraison (demandes à
l'oral) ; F03-AC02, qui porte sur le déplacement d'une scène vers un autre
chapitre, différé ; F11-AC63 et F11-AC84, à accorder avec la déclaration
requise en F11.6.

## Vérifications techniques à lever

Aucune ne demande un prototype séparé : chacune se lève dans l'application, à
l'étape indiquée, et le plan la suppose concluante. Deux demandent une
autorisation du porteur le moment venu : l'envoi d'un fichier à l'imprimeur
(V6), qui est une commande réelle, et l'évaluation des aides IA (V17), qui a
un coût d'usage. La dernière colonne dit ce que coûterait un échec, sans que
le plan s'organise autour. Le détail est dans
[l'architecture](architecture.md#vérifications-avant-décision-technique).

| N° | Vérification | Ce qu'elle bloque | Étape | Si elle échoue |
| --- | --- | --- | --- | --- |
| V1 | Chromium de Linux : mêmes pages que sur macOS, durée et mémoire réelles. Réserve de l'[ADR 0003](adr/0003-pagedjs-chromium-apercu-cote-serveur.md). | Tout le livre : F11.2 à F11.6, F11-AC30. | 6 | L'ADR 0003 se rouvre. |
| V2 | Production du PDF chez Vercel : démarrage à froid, espace temporaire, fichier déposé dans le stockage. | Aperçu, PDF de travail et PDF définitif. | 6 | Le PDF sort d'un traitement séparé, Render par exemple : un coût d'exploitation de plus, sans reprise de la composition. |
| V3 | Aperçu calculé côté serveur : affichage, délai ressenti, coût de chaque recalcul, éditeur de la scène ouvert à côté. | « Mettre en page » (F11.6), F11.2, F11-AC27. | 6 | L'ADR 0003 se rouvre si l'aperçu est trop lent à l'usage. |
| V4 | Modèle approché des hauteurs, « la part la plus incertaine » selon F11.5. | « Réordonner les passages » (F11-AC64 à AC66, AC81, AC82) ; passage suggéré (F11-AC67, AC68). | 6 | Le passage suggéré est reporté, comme le prévoit F11.3 ; l'agencement demande un arbitrage. Le livre s'imprime sans eux. |
| V5 | Règles de composition que l'essai PDF n'a pas couvertes (césure restreinte, alignement à gauche, folio absent, dés imprimés, feuille de plusieurs pages, page de présentation en image, marges modifiées, contenu hors des marges, page peu remplie). | F11.3, F11.4. | 6 | La règle concernée revient en entretien. |
| V6 | Premier envoi chez l'imprimeur : page de 420 × 595 points, marges de départ, rognage. | Le PDF définitif déclaré prêt à imprimer (F11.3, F11.4). | 6 | Marges ou export avec rognage à revoir (F11.3). |
| V7 | Sauvegarde concurrente sur la vraie base : contrôle de version d'un seul tenant, texte gardé à part conservé au moment du refus, échange d'un seul tenant, arrêt de l'élève tenu d'un poste à l'autre. | Toute écriture à plusieurs : F08.1, F07-AC26, AC28, AC29. | 3 | Aucun repli : c'est une exigence de qualité du brief. |
| V8 | Contrôle des droits côté serveur (comparaison de deux documents, chapitre de chaque destination) et règles RLS. | L'écriture des élèves : F06.1, F05.2. | 1 pour les accès, 3 pour le texte | Aucun repli. |
| V9 | Accès de classe sans adresse électronique : session de classe puis profil, codes et mot de passe chiffrés par l'application, limitation des essais, durée des accès, postes déjà ouverts ; règles décidées le 8 octobre 2026 (F06-AC73 à AC81). | La connexion des élèves (F06.4). | 1 | La conception des accès revient en entretien ([architecture](architecture.md#protection-des-accès-de-classe-et-des-codes-élèves)). |
| V10 | Horaires : heure de Paris et changements d'heure (F06-AC80), enregistrement final après l'échéance. | F06-AC27 à AC31. | 1, puis 3 pour l'enregistrement final | — |
| V11 | Cadence de l'enregistrement automatique, fixée nulle part ; historique des versions, non spécifié. | F08. | 3 | Règles à écrire avant l'étape. |
| V12 | Images dans l'éditeur, en bloc et en ligne, non éprouvées par le prototype. | F10 dans l'éditeur. | 3 | — |
| V13 | Collage depuis Word, LibreOffice et Google Docs réels ; Firefox. | F04-AC04. | 3, à la main | — |
| V14 | Tablettes réelles, clavier virtuel, lecteur d'écran. | L'usage sur tablette ; pourrait rouvrir l'[ADR 0002](adr/0002-plate-pour-l-editeur.md). | Mis de côté par le porteur le 3 octobre 2026. | — |
| V15 | Graphe chargé : lisibilité et performances. | La vue « Chemins » (F03.1). | 3, sur un récit de la taille d'un vrai livre | — |
| V16 | Reprise de lecture liée au profil de l'élève. | F12-AC19, F04-AC22. | 7 | Repli prévu sur l'appareil. |
| V17 | IA : fournisseur, qualité sur des exemples réels, coût, plafonds. | F13, F10.2. | 8 | L'aide concernée est retirée ; l'application fonctionne sans IA. |
| V18 | Sauvegarde à la main et restauration de la base ; le porteur garde les originaux des images. | Le seuil « ma classe ». | 1 pour la commande de sauvegarde, 4 pour la restauration réussie | — |
| V19 | Tenue des contournements aux montées de version de Plate, Slate, Paged.js et Chromium. | La maintenance. | 3 et 6 | Versions figées ; scénarios de test des prototypes réécrits comme filet. |

## Décisions de fournisseur

Les tarifs et limites relevés dans l'architecture datent du 27 septembre et
du 3 octobre 2026 ; ils sont à revérifier au moment du choix.

| Sujet | État | Devient bloquant |
| --- | --- | --- |
| Hébergement de l'application | **Vercel**, à son adresse par défaut et sans nom de domaine, décidé le 8 octobre 2026, sur un forfait Pro déclaré par le porteur et non vérifié. | Décidé. |
| Base, comptes et fichiers | **Supabase**, en souscription directe, décidé le 8 octobre 2026 ([ADR 0004](adr/0004-vercel-et-supabase.md)). | Décidé. |
| Offre de la base | **Offre gratuite jusqu'à l'ouverture**, décidé le 8 octobre 2026 : aucune sauvegarde automatique, mise en sommeil après une semaine sans activité, à relancer à la main. Le porteur fait lui-même une sauvegarde de temps en temps. | Décidé ; à revoir à l'étape 9. |
| Région des données | Paris, pour la base (Supabase, `eu-west-3`) comme pour les fonctions (Vercel, `cdg1`), depuis le 9 octobre 2026. | Fait. |
| Production du PDF et de l'aperçu | Chaîne retenue (ADR 0003), exécutée chez Vercel par hypothèse ; Render si V2 échoue. | Étape 6. |
| Imprimeur | epubli sert de premier cas de vérification, sans exclusivité. | Étape 6 (V6). |
| IA | Fournisseur et modèle non choisis. | Étape 8. |
| Paiement | Stripe Checkout proposé. | Étape 9. |

## Avant de saisir des prénoms d'élèves réels

**Décidé par le porteur le 8 octobre 2026, pour « ma classe » :**

- les codes personnels et le mot de passe de la classe sont chiffrés par
  l'application, avec une clé gardée hors de la base, et les essais erronés
  sont limités : la recommandation de l'architecture est retenue ;
- le nom de famille reste facultatif, comme le veut F01.1 ;
- aucun texte d'élève n'est envoyé à une IA tant que F13 n'a pas dit ce qui
  est transmis ;
- la base reste en offre gratuite, sans sauvegarde automatique : le porteur
  la sauvegarde lui-même de temps en temps, par une commande fournie à
  l'étape 1, et une restauration a réussi avant la première séance (V18) ;
- rien ne s'efface seul et le porteur supprime à la main ; la règle générale
  de conservation s'écrira en F14, pour l'ouverture.

Le porteur estime qu'aucune donnée sensible n'est en jeu et ne demande pas
d'autre préalable. Les documents ne contiennent aucune analyse des
obligations de protection des données pour l'espace de travail de la classe,
ni de l'information des familles ; cet examen reste à faire avant
l'ouverture (étape 9).

## Étapes

Neuf étapes, dans l'ordre des dépendances, qui est aussi celui d'une année
de livre : s'installer, préparer, écrire, faire travailler la classe, lire,
imprimer, partager. Chacune construit son domaine en entier, pour les quatre
combinaisons, et livre quelque chose que le porteur utilise à l'adresse
Vercel.

**Avant chaque étape :** un entretien court arbitre ses questions
bloquantes, et les passages des spécifications en retard sur les décisions
(voir [Écarts entre documents](#écarts-entre-documents)) sont accordés dans
les sections qu'elle couvre. L'IA construit d'après les spécifications : une
règle remplacée et restée dans le texte serait construite telle quelle.

**Fin d'étape, partout :** les critères d'acceptation cités passent en tests
automatiques, et le porteur a fait lui-même l'essai décrit.

Les listes de critères viennent du relevé du 7 octobre 2026 ; un critère
cité à deux étapes se ferme à la seconde.

### Avant la première ligne

Rien ne se construit ici. Le développement demande une instruction du
porteur, que ce plan ne donne pas. Décidé le 8 octobre 2026, et fait le 9 :

- **Où vit le code :** un dépôt Git créé dans `V1/`, qui contient les
  documents, la maquette et le code, celui-ci dans `V1/app/`. Le dépôt est
  privé sur GitHub, d'où Vercel déploie. La V0 garde son propre dépôt,
  intact : les deux versions restent séparées. Créer le dépôt sur GitHub et
  le relier à Vercel revient au porteur.
- **Ce que l'application reprend de la maquette :** ses couleurs, polices,
  espacements, illustrations et textes d'écran, réécrits en composants ; pas
  son code. Les écrans restés sans retour du porteur sont construits tels
  que dessinés, et retouchés à l'essai de l'étape.
- **Questions de l'étape 1 :** arbitrées en F06.4.

### Étape 1 — S'installer : compte, projets, classes, accès des élèves

- **Ce qu'elle permet :** créer son compte, créer un projet dans chacune des
  quatre combinaisons, créer sa classe, inscrire ses élèves en lot, imprimer
  l'affiche et les étiquettes ; depuis un autre poste, ouvrir la classe puis
  entrer comme un élève avec son code.
- **Périmètre :** F01-AC01 à AC04, AC08, AC09, AC14 à AC17, AC24 ; F01.1
  (F01-AC05 à AC07, AC10 à AC13, AC18 à AC21, AC26) ; F06.4 (F06-AC15, AC16,
  AC23 à AC28, AC31, AC43, AC44, AC67 à AC81) ; barre du haut, « Mes
  projets » et arrivée dans le dernier projet ouvert (F06.5, F06-AC53). Le
  système « Cahiers d'aventure » y devient la base des écrans
  ([design](design.md)).
- **Dépend de :** rien.
- **Vérifications levées :** V9, V10, V8 pour les accès, V18 pour la mise en
  place.
- **À régler avant de commencer :** rien. Les seuils d'essais, la durée des
  accès, les postes déjà ouverts, l'heure de référence et le format des
  informations de classe sont décidés le 8 octobre 2026 en F06.4 (F06-AC73 à
  AC81), qui s'ajoutent au périmètre de l'étape.
- **Terminée quand :** le porteur a créé son vrai projet et sa vraie classe,
  et s'est connecté comme élève depuis un second poste ; un code faux est
  refusé ; un élève ne voit rien d'une autre classe.
- **Avancement au 9 octobre 2026 :** construite, en ligne à
  `https://you-are-a-hero-v1.vercel.app`, **non terminée** : l'essai du
  porteur reste à faire.
  - **Décidé avant de construire, le 9 octobre :** le compte de l'adulte
    (F01-AC27 à AC30), l'heure de la fermeture nocturne et les essais faux
    par adresse réseau (F06-AC82, AC83).
  - **Tests automatiques :** 108 passent — 25 sur les règles et le
    chiffrement, 50 contre une base PostgreSQL de Supabase lancée en local,
    33 parcours joués dans un navigateur. Chacun porte l'identifiant de son
    critère. Le test « un élève ne lit rien d'une autre classe » en fait
    partie. Une revue de sécurité et une revue de code ont été faites, et
    leurs points corrigés.
  - **Vérifié en ligne le 9 octobre 2026 (V9) :** le porteur a importé la
    clé de signature, fermé les inscriptions publiques et créé son compte ;
    `npm run verifier:production` confirme que Supabase accepte l'accès de
    classe signé par l'application, qu'un poste sans classe ouverte ne lit
    rien et qu'il ne lit pas les codes.
  - **Critères qui ne se ferment qu'à une étape suivante,** faute de
    chapitres, de textes ou de livre : F01-AC03, AC05, AC08, AC09, AC24
    (seconde moitié), F06-AC16 et AC28 (chapitres attribués) à l'étape 2 ;
    F01-AC01, AC13 (paragraphe protégé), F06-AC26, AC27 (contenu de
    travail) et le texte enregistré de F06-AC76 à AC78 à l'étape 3 ; F01-AC02
    (jusqu'au PDF), AC18, AC19 (textes, livre) et F06-AC31 (version
    partagée) aux étapes 6 et 7. L'étape 1 teste ce qu'ils disent des accès.
  - **Vérifications :** V8 levée pour les accès, en local ; V9 levée, en
    local pour le parcours entier et en ligne pour l'acceptation du jeton ;
    V10 levée pour l'heure de Paris et les
    changements d'heure, par des instants choisis et non par une vraie
    horloge ; V18 : sauvegarde essayée sur la vraie base, restauration
    essayée sur la base locale seulement.
  - **Construit sans écran dessiné,** à juger à l'essai : l'entrée
    enseignant, « Mot de passe oublié », « Mon compte », « Changer de
    classe » sous le titre d'un projet, « Renommer la classe », les quatre
    onglets vides du projet, l'accueil de l'élève sans chapitre
    ([design](design.md#étape-1-construite-9-octobre-2026)).
  - **Reste au porteur :** faire l'essai ; donner à Vercel l'accès au
    dépôt GitHub pour que chaque envoi de code se déploie ; vérifier que
    l'adresse du site est déclarée dans Supabase, ce que « Mot de passe
    oublié » demande.

### Étape 2 — Préparer et organiser le récit

- **Ce qu'elle permet :** remplir le carnet de préparation, le projeter en
  atelier, créer parties, chapitres et scènes avec leurs consignes, poser le
  départ et les fins, attribuer les élèves aux chapitres, supprimer et
  restaurer ; un élève voit les cartes des chapitres et ce qui lui est
  attribué.
- **Périmètre :** F02-AC01 à AC17, hors aides IA ; F03.1 (F03-AC01, AC07 à
  AC17, AC21 à AC24, AC26) ; F03.2 (F03-AC03 à AC06) ; F10.1 (F10-AC03 à
  AC06) ; attribution et profils de F06.1 ; lecture des chapitres de F06.2
  (F06-AC20 à AC22, AC48, AC49) ; consigne d'écriture de F07.1 ; rubriques
  de la feuille d'aventure, du dé, des règles du jeu et des phrases de choix
  dans la préparation (F02, F04.2).
- **Dépend de :** étape 1. Les images de repérage par défaut sont générées
  par le porteur d'après des prompts, avant la fin de l'étape.
- **À régler avant de commencer :** commande qui change l'ordre des parties
  et des chapitres, et qui peut réorganiser (F03.1) ; ce que « Restaurer »
  rend, liens et attributions (F03.1) ; suppression de la scène de départ
  (F03.2) ; opérations du profil « écriture et organisation » et définition
  d'une scène « contenant du travail » (F06.1, F06-AC14) ; page du chapitre
  en mode personnel (F03.1) ; textes du guidage de la préparation (F02).
- **Terminée quand :** le porteur a préparé son vrai projet jusqu'aux
  consignes et aux attributions, et a refait le même parcours dans un projet
  personnel et dans un récit classique.

### Étape 3 — Écrire une scène et relier les choix

- **Ce qu'elle permet :** écrire dans l'éditeur, en adulte comme en élève,
  avec enregistrement automatique ; créer et modifier les choix, les liaisons
  cachées, les paragraphes protégés ; poser des images, des objets et des
  actions de jeu ; voir les numéros de passage, les chemins et les scènes
  voisines ; régler un conflit de sauvegarde.
- **Périmètre :** F04.1 (F04-AC01 à AC05) ; F04.2 dans l'éditeur (F04-AC15 à
  AC18, AC20, AC25 à AC30) ; F04.3 (F04-AC06 à AC14) ; F05 (F05-AC01 à AC03,
  AC09 à AC12) ; F05.1 (F05-AC05 à AC07) ; F05.2 (F05-AC13 à AC42) ;
  protections de F06.1 (F06-AC13, AC45, AC46, AC50 à AC52) ; F06-AC17, AC29,
  AC30, et l'enregistrement du texte avant la fermeture d'un poste
  (F06-AC76 à AC78) ; F08.1 (F08-AC01 à AC31) ; import et image en ligne de F10 (F10-AC01,
  AC02, AC16, AC20) ; ordre imprimé et numéros de F11.5 (F11-AC16 à AC20,
  AC22, AC23), que F05-AC34 demande dès le premier choix ; vues « Scènes » et
  « Chemins » (F03-AC18 à AC20, AC25). Les lots se suivent dans cet ordre :
  enregistrement et texte simple ; phrase de choix, renvoi, numéros et
  chemins ; liaison cachée, note de l'enseignant et protections ; objets et
  actions de jeu ; images ; scènes voisines.
- **Dépend de :** étape 2.
- **Vérifications levées :** V7, V8 pour le texte, V11, V12, V13, V15, V19.
- **À régler avant de commencer :** cadence de l'enregistrement automatique
  et historique des versions, que le brief annonce en F08 sans règle ; note
  de l'enseignant, retenue dans son principe et non spécifiée (F05.2) ;
  commande qui fixe un numéro de passage (F05.1, F11.5) ; commande de pose
  de l'image en ligne, formats et limites d'import (F10) ; effet d'une
  désactivation de la mise en forme (F04.1) ; qui renomme une scène et ce que
  la recherche montre à un élève (F05) ; liaison cachée hors périmètre et
  lecture ouverte dans les scènes voisines (F04.3) ; trois comportements que
  le prototype laisse à confirmer — scène créée depuis un choix puis annulée,
  morceau de phrase collé, sélection couvrant tous les renvois.
- **Terminée quand :** sur deux postes, le porteur et un compte d'élève ont
  écrit des scènes reliées, avec images, objets et action de jeu ; un conflit
  provoqué exprès a été récupéré sans perte ; les scénarios des tests du
  prototype de l'éditeur, réécrits, passent.

### Étape 4 — Faire travailler la classe : prendre, remettre, relire, valider, suivre

- **Ce qu'elle permet :** l'élève voit « Mon travail », s'occupe d'une scène,
  la remet et la reprend ; l'enseignant relit, écrit une remarque, change
  l'état, encourage, suit l'avancement, imprime les fiches de rédaction ;
  l'auteur d'un projet personnel suit ses propres scènes.
- **Périmètre :** F06.3 (F06-AC04, AC06, AC07, AC10, AC38 à AC42, AC47, AC61,
  AC62, AC64 à AC66) ; F06.5 (F06-AC32 à AC37, AC54 à AC60, AC63) ; F07.1 ;
  F07.2 (F07-AC66, AC68) ; F07.3 (F07-AC15, AC16, AC24, AC25) ; F07.4
  (F07-AC17, AC18, AC21, AC22, AC52 à AC60) ; F07.5 (F07-AC50, AC51) ; F11.1
  (F11-AC01, AC02, AC13, AC14, AC24, AC25, AC93 à AC95) ; retrait d'un élève
  et ses scènes (F01-AC22, AC23, AC25).
- **Dépend de :** étape 3.
- **Vérifications levées :** V18, par une restauration réussie.
- **À régler avant de commencer :** parcours et écrans des encouragements,
  que F07.5 renvoie à un entretien ; suivi en mode personnel (F06.5) et
  « Validé » en mode personnel (F11.1) ; fiches en mode personnel (F07.4) ;
  place au Suivi d'une scène que l'enseignant s'attribue (F06.3) ; sélections
  exactes de « Mon travail » (F06.5) ; scène de trop quand le partage ne
  tombe pas juste, et élève inscrit à plusieurs chapitres (F07.4).
- **Terminée quand :** le porteur a joué une séance entière avec plusieurs
  comptes d'élèves, de la prise d'une scène à sa validation, puis restauré la
  base depuis une sauvegarde. **C'est le seuil « ma classe ».**

### Étape 5 — Lire le récit à l'essai et contrôler les chemins

- **Ce qu'elle permet :** lire le récit depuis son départ en suivant les
  choix, avec la feuille d'aventure et le dé ; jouer une énigme ; voir la
  liste des problèmes de chemins et leur gravité.
- **Périmètre :** F09.1 (F09-AC01 à AC03, AC11 à AC14) ; F09.2 (F09-AC04 à
  AC10, AC15, AC16), le blocage du PDF définitif se fermant à l'étape 6 ;
  feuille et dé à l'écran (F04-AC21, AC31, AC32).
- **Dépend de :** étape 3 ; indépendante de l'étape 4.
- **À régler avant de commencer :** rien de bloquant.
- **Terminée quand :** le porteur a lu son récit de bout en bout et corrigé
  ce que les contrôles signalaient ; un élève a lu ses chapitres.

### Étape 6 — Composer et imprimer le livre

- **Ce qu'elle permet :** voir le livre en pages, le relire, vérifier ses
  chemins, le mettre en page, régler les pages de présentation, réordonner
  les passages, produire le PDF de travail et le PDF définitif, envoyer le
  fichier à l'imprimeur.
- **Périmètre :** F11.2 à F11.6 (F11-AC03 à AC12, AC15, AC21, AC26 à AC92) ; contrôles et placement des images de F10
  (F10-AC13 à AC15, AC17 à AC19) ; feuille d'aventure, règles du jeu et dés
  imprimés (F04-AC19, AC24, AC33) ; F05-AC08. Les lots se suivent dans cet
  ordre : composition, aperçu calculé côté serveur et PDF de travail ; règles
  de composition, images, pages de présentation ; parcours guidé et PDF
  définitif ; « Réordonner les passages » et passage suggéré.
- **Dépend de :** étapes 4 et 5.
- **Vérifications levées :** V1 à V6, V19. V6 demande l'autorisation
  d'envoyer un fichier à l'imprimeur.
- **À régler avant de commencer :** le livre en récit classique — forme du
  séparateur de scènes, impression des titres de chapitre, en-tête courant,
  tâches de « Relire » —, sans critère d'acceptation aujourd'hui (F11.5,
  F11.6) ; ce qui bloque le PDF définitif et le partage, dit différemment en
  F11.2, F11.6 et F12.1 ; déclaration requise pour ouvrir « Mettre en page »
  (F11-AC63, AC84) ; gabarits des pages de présentation (F11.3) ; nombre de
  lignes d'une section de liste de la feuille d'aventure (F04.2) ; seuil de
  résolution et définition conservée des images (F10) ; conservation des PDF
  définitifs successifs (F11.2) ; accès des élèves à l'aperçu (F11.2).
- **Terminée quand :** le PDF définitif du livre de la classe sort de
  Vercel, identique à son aperçu, et un exemplaire imprimé a été reçu.

### Étape 7 — Partager et lire en ligne

- **Ce qu'elle permet :** partager une version terminée par un lien de
  lecture, l'ouvrir aux classes de l'enseignant, la mettre à jour, la
  retirer ; lire en ligne avec la feuille d'aventure et le dé.
- **Périmètre :** F12.1 (F12-AC01 à AC05, AC08 à AC11, AC13 à AC20) ; F12.3
  (F12-AC06, AC07, AC12) ; feuille conservée en ligne (F04-AC22, AC23).
- **Dépend de :** étapes 5 et 6.
- **Vérifications levées :** V16.
- **À régler avant de commencer :** une image manquante bloque-t-elle le
  partage (F12.1, F10) ; lecture par les classes d'un livre écrit en mode
  personnel (F12.3).
- **Terminée quand :** le lien s'ouvre sur un téléphone sans compte, et un
  élève lit un livre terminé depuis son espace.

### Étape 8 — Aides IA

- **Ce qu'elle permet :** l'aide à la correction, à la consigne, aux choix, à
  la préparation et aux parties, et l'aide à l'illustration par prompts,
  toutes facultatives et plafonnées.
- **Périmètre :** F13.1 à F13.5 (F13-AC01 à AC16) ; F10.2 (F10-AC07 à AC12) ;
  titre de scène (F05-AC04) ; prompt d'illustration de couverture (F11.4).
- **Dépend de :** étapes 2 à 4 pour les écrans où les aides s'ouvrent.
- **Vérifications levées :** V17, avec un budget d'essai à autoriser.
- **À régler avant de commencer :** fournisseur et modèle ; ce qui est
  transmis au fournisseur, textes d'élèves compris ; plafonds ; présentation
  de la comparaison et application des corrections (F13.1) ; destinations,
  chapitre des nouvelles scènes et annulation des ajouts (F13.3) ; aides en
  mode personnel (F13.1, F13.2) ; liste des styles d'illustration (F10.2).
- **Terminée quand :** le porteur a jugé chaque aide sur des textes et des
  consignes de sa classe, et l'application reste entièrement utilisable sans
  elles.

### Étape 9 — Ouverture à d'autres enseignants

- **Ce qu'elle permet :** l'inscription d'autres enseignants, avec une
  découverte et une offre.
- **Périmètre :** F14, à spécifier en entier : offre et paiement,
  conservation et suppression des données, durée d'hébergement des livres
  partagés, support ; inscription publique et pages publiques ; examen des
  obligations envers d'autres écoles ; nom de domaine.
- **Dépend de :** toutes les étapes précédentes, et d'un entretien dédié.
- **Terminée quand :** à définir par cet entretien.

## Hors de la première livraison

- **F01 :** conversion des modes d'un projet ; plusieurs enseignants sur un
  projet ; changement de classe après des attributions.
- **F01.1 :** espace partagé entre enseignants d'une école ; import avec
  correspondance de colonnes et synchronisation avec un annuaire.
- **F02 :** outil de collecte d'idées ou de vote.
- **F03.1 :** glisser-déposer ; déplacement d'une scène vers un autre
  chapitre ; ajout de scènes en lot.
- **F04.2 :** action de jeu à effet déclaré ; lancer de dé à l'endroit du
  passage ; objet suivi dans le texte ; autres dés ; conditions vérifiées,
  calculs, combats et moteur de jeu, écartés.
- **F05.2 :** récit et renvoi dans un même paragraphe ; passage du livre
  caché aux élèves pendant l'écriture.
- **F06 :** troisième profil ; droits à la scène ; binôme outillé ;
  calendrier par partie, chapitre ou élève ; suivi de plusieurs projets,
  retiré.
- **F07 :** demande écrite de l'élève dans l'application (F07.2) ;
  annotations attachées aux mots et réponse écrite de l'élève (F07.3) ;
  dictée vocale, différée sans décision d'inclusion ni d'exclusion (F07.4).
- **F08.1 :** session d'écriture exclusive ; coédition simultanée ;
  comparaison et fusion de deux textes.
- **F10 :** génération d'illustrations par IA dans l'application ; import
  d'images par les élèves.
- **F11 :** autres formats que l'A5 ; assemblage de la couverture ; commande
  et livraison de livres ; pages supplémentaires ; modification du fichier
  PDF et import de ses annotations ; export avec marge de rognage, à décider
  après un premier envoi.
- **F12 :** retour à une version partagée antérieure ; auteurs réglés par
  canal ; classes destinataires choisies une à une ; droits de diffusion,
  vitrine et bibliothèque (F12.2), mis de côté.
- **F13 :** réécriture créative complète ; accès des élèves à l'IA ;
  relecture des coquilles du livre entier, idée non décidée.
- **Hors identifiant :** anglais ; logiciel natif ; hors ligne complet ;
  import de la V0.

## Coûts

- **Développement :** aucun achat ; le temps du porteur, dit plus haut.
- **Exploitation :** rien pour la base avant l'ouverture, l'offre gratuite
  étant gardée ; l'usage de Vercel au-delà de ce que couvre le
  forfait existant, chaque recalcul de l'aperçu étant un rendu côté serveur ;
  un traitement séparé pour le PDF si V2 échoue ; les appels aux aides IA à
  partir de l'étape 8 ; un exemplaire imprimé pour V6. Aucun de ces coûts
  n'est chiffré ici.
- **Effort commercial :** aucun avant l'étape 9. Les revenus sont
  souhaitables, non un préalable.

## Risques

- **L'étendue.** Environ 460 critères et neuf domaines, qu'une seule
  personne essaie et arbitre. Le plan n'en retire rien, à la demande du
  porteur ; le seul repli est la V0.
- **Les règles qui manquent.** Une trentaine de questions bloquent une
  étape. Chacune demande une décision du porteur avant que l'étape commence.
- **Des spécifications qui gardent leur histoire.** Elles disent ce que les
  règles ont remplacé ; l'IA peut construire une règle abandonnée si le texte
  n'est pas accordé avant l'étape.
- **Des écrans proposés, non validés.** La plupart n'ont pas reçu de retour
  du porteur ; ses retouches viendront à l'essai de chaque étape.
- **Des sauvegardes faites à la main.** Ce qui est écrit entre deux
  sauvegardes n'est pas protégé ; le porteur l'accepte. Une sauvegarde après
  chaque séance d'écriture borne la perte à une séance.
- **Le livre de la classe sur un outil neuf.** Entre le seuil « ma classe »
  et la fin de l'étape 6, les textes sont dans la V1 sans que le livre puisse
  en sortir. Si l'étape 6 n'aboutit pas à temps pour l'impression, repasser
  sur la V0 veut dire y reporter les textes à la main.
- **Le PDF chez Vercel.** Jamais exécuté ; supposé tenir. Son échec coûte un
  service de plus, pas une reprise.
- **« Réordonner les passages ».** Son modèle des hauteurs est la part la
  plus incertaine du périmètre ; le livre s'imprime sans lui.
- **Des briques peu maintenues ou contournées.** Paged.js n'a pas de version
  stable depuis 2023 ; l'éditeur repose sur six contournements de Slate.
  Versions figées et tests comme filet.
- **La tablette.** Non vérifiée, mise de côté par le porteur.

## Questions ouvertes

Celles qui bloquent une étape figurent à cette étape, sous « À régler avant
de commencer ». Celles-ci n'en bloquent aucune.

- **F01, F01.1 :** classement des projets d'une année sur l'autre ;
  suppression définitive d'une classe passée et de ses profils, renvoyée à
  F14 ; élève qui change de classe en cours d'année.
- **F03.1 :** scènes communes à plusieurs chapitres, pour lesquelles un
  chapitre ordinaire est recommandé sans retour ; arrivées regroupées dans
  « Chemins » quand de nombreux chapitres mènent au même.
- **F04.2 :** modification de la feuille d'aventure après un partage.
- **F06.3 :** changements simultanés de prise en charge ; durée pendant
  laquelle une reprise reste annulable.
- **F06.4 :** exceptions ponctuelles aux horaires ; raccourcis par lien ou
  QR ; sauvegarde inachevée au changement d'élève, à traiter avec F08 à
  l'étape 3.
- **F07.3 :** le verbe de la remise, « remettre » ou « donner », à entendre
  auprès d'élèves ; « J'ai lu, j'écris », à l'essai.
- **F08.1 :** texte gardé sur le poste après une coupure, proposition non
  décidée ; nombre de textes gardés à part par scène.
- **F10.2 :** langue du prompt ; personnages récurrents autres que le héros.
- **F11 :** marge maximale ; parties regroupées non consécutives ; pages
  supplémentaires.
- **F12 :** réglage des auteurs par canal ; choix des classes une à une.
- **Dispositions de la maquette restées sans retour**, listées dans le
  [design](design.md) : elles se jugent à l'essai de chaque étape.

## Écarts entre documents

Signalés sans être tranchés ; à accorder avant l'étape qui s'appuie dessus.

- **Périmètre :** le brief dit que « le périmètre exact de la première
  livraison » reste ouvert, alors que les spécifications le marquent section
  par section.
- **F13 :** deux aides portent « première livraison », trois autres sont
  « retenues » sans échéance (étape 8).
- **F11.3 et F11.5 :** le passage suggéré dépend d'un essai des hauteurs ;
  l'agencement est retenu sans condition, alors qu'il repose sur le même
  modèle, non éprouvé (étape 6).
- **F11.2 et F14 :** la conservation des PDF définitifs successifs est une
  proposition « à revoir en F14 » ; F11-AC82 et F11.6 la tiennent pour
  acquise (étape 6).
- **F11.2, F11.6 et F12.1 :** ce qui bloque le PDF définitif et le partage
  n'est pas dit de la même façon (étapes 6 et 7).
- **F06.1 et F07.2 :** F06.1 parle encore d'une « proposition » de l'élève
  pour faire évoluer la structure ; F07.2 décide que tout se demande à
  l'oral (étapes 2 et 4).
- **F07.1 :** « Demander une nouvelle reprise » figure encore dans le
  tableau et dans F07-AC27, alors que ce n'est plus une commande à part ;
  « En cours d'écriture » et « Travail élève validé » y côtoient « En cours »
  et « Validé » (étape 4).
- **F06.5 et F07.5 :** « aucun classement des élèves n'est décidé » d'un
  côté, classement optionnel décidé de l'autre (étape 4).
- **F01.1 :** la règle du 6 octobre sur les scènes d'un élève retiré n'est
  pas réécrite après la précision du 7 (étape 4).
- **F03.1 :** la liste des questions ouvertes garde des points tranchés le
  6 octobre (étape 2).
- **Textes en retard sur les décisions :** « Statut et périmètre » des
  spécifications (choix et fidélité de l'aperçu « à vérifier », aucun
  prototype autorisé) ; brief, dont le fond date du 3 octobre (demandes de changements
  protégés encore listées comme ouvertes, « Graphe » pour « Chemins ») ;
  architecture titrée « Statut au 27 septembre ».
