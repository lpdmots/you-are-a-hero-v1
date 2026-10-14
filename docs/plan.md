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

**Avancement au 10 octobre 2026 :** l'étape 1 est terminée (voir
[Étape 1](#étape-1--sinstaller--compte-projets-classes-accès-des-élèves)).
L'étape 2, autorisée par le porteur le 10 octobre 2026 pour elle seule, est
terminée le même jour : entretien, construction, mise en ligne, essai du
porteur (voir [Étape 2](#étape-2--préparer-et-organiser-le-récit)).
L'étape 3 est autorisée le 10 octobre 2026, pour elle seule : son entretien
est fait et validé dans son ensemble le même jour, sa construction est faite
en local le même jour et mise en ligne le 11 octobre 2026, sa revue par le
porteur étant en cours (voir
[Étape 3](#étape-3--écrire-une-scène-et-relier-les-choix)).
L'étape 4 est autorisée le 13 octobre 2026, pour elle seule : son entretien
est fait et validé dans son ensemble le même jour, sa construction commence
le même jour, en local, lot par lot (voir
[Étape 4](#étape-4--faire-travailler-la-classe--prendre-remettre-relire-valider-suivre)).
L'étape 5 n'est ni autorisée ni commencée.

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
| [F07](specifications.md#f07--révision-et-validation) | États de la scène, remarques liées à la scène, demandes de l'élève à l'oral, fiches de rédaction, encouragements. | Écrit pour F07.2, F07.3 et F07.5 ; parcours de F07.5 arbitré le 13 octobre 2026. |
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
| V11 | Cadence de l'enregistrement automatique et versions précédentes, décidées le 10 octobre 2026 en F08.2 : leur tenue dans l'application (frappe non interrompue, envoi à la fermeture de la page). | F08. | 3 | La cadence revient en entretien. |
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
- **Terminée le 10 octobre 2026 :** construite et mise en ligne le
  9 octobre à `https://you-are-a-hero-v1.vercel.app` ; le porteur a fait son
  essai, créé en ligne son vrai projet et sa vraie classe, et déclare l'étape
  terminée.
  - **Décidé avant de construire, le 9 octobre :** le compte de l'adulte
    (F01-AC27 à AC30), l'heure de la fermeture nocturne et les essais faux
    par adresse réseau (F06-AC82, AC83).
  - **Ajouté le même jour, sur décision du porteur :** la connexion par
    Google (F01-AC31, AC32), d'abord recommandée pour l'étape 9. Son
    passage réel chez Google ne se teste pas en local : il se vérifie par le
    porteur, une fois Google réglé dans Supabase.
  - **Tests automatiques :** 110 passent — 25 sur les règles et le
    chiffrement, 50 contre une base PostgreSQL de Supabase lancée en local,
    35 parcours joués dans un navigateur. Chacun porte l'identifiant de son
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
  - **Essai du porteur, 9 et 10 octobre 2026 :** ses retouches sont faites
    au fur et à mesure, sur le serveur local, puis mises en ligne, et
    listées dans le [design](design.md#étape-1-construite-9-octobre-2026).
    Trois règles en sortent : le prénom et le nom en deux cases à
    l'inscription (F01-AC33, AC34) ; l'identifiant de la classe que
    l'enseignant choisit, proposé d'après le nom de la classe seul
    (F06-AC85), et qui suit ce nom quand on la renomme (F06-AC84) ; l'image
    de repérage choisie dès la création d'un projet ou d'un chapitre, sans
    obligation, à construire à l'étape 2 (F10.1).
  - **Resté sans explication :** un incident à l'inscription, « Quelque
    chose n'a pas marché », vu une fois en ligne et jamais reproduit ;
    aucune trace côté serveur. Un incident d'écran est désormais noté au
    journal du serveur, et un envoi manqué à l'inscription garde la liste.

### Étape 2 — Préparer et organiser le récit

- **Ce qu'elle permet :** remplir le carnet de préparation, le projeter en
  atelier, créer parties, chapitres et scènes avec leurs consignes, poser le
  départ et les fins, attribuer les élèves aux chapitres, supprimer et
  restaurer ; un élève voit les cartes des chapitres et ce qui lui est
  attribué.
- **Périmètre :** F02-AC01 à AC20, hors aides IA ; F03.1 (F03-AC01, AC07 à
  AC17, AC21 à AC24, AC26 à AC31, AC34 à AC39, AC41, AC42) ; F03.2 (F03-AC03
  à AC06, AC32, AC33, AC40) ; F10.1 (F10-AC03 à AC06, AC21 à AC26) ;
  attribution et profils de F06.1 (dont F06-AC86 à AC90) ; lecture des
  chapitres de F06.2 (F06-AC20 à AC22, AC48, AC49) ; consigne d'écriture de
  F07.1 ; rubriques de la feuille d'aventure, du dé, des règles du jeu et
  des phrases de choix dans la préparation (F02, F04.2) ; depuis le
  10 octobre 2026, à la demande du porteur, la part de l'enseignant dans
  F06.3 : dire qui s'occupe d'une scène, ou s'en occuper lui-même (F06-AC04,
  AC06, AC07, et AC62 pour ce qui n'est pas l'écriture). Les critères qui
  parlent d'un texte écrit (dialogue de suppression d'une scène écrite,
  scène « contenant du travail », lecture d'une scène) testent ici les
  droits et le plan ; ils se ferment à l'étape 3, quand l'éditeur existe.
- **Dépend de :** étape 1. Les images de repérage par défaut sont générées
  par le porteur d'après des prompts, avant la fin de l'étape.
- **À régler avant de commencer :** rien. Arbitré en entretien le
  10 octobre 2026 : le glisser-déposer pour l'ordre des parties, des
  chapitres et des scènes, qui remplace « Monter » et « Descendre », et le
  chapitre posé dans une autre partie (F03.1) ; ce que « Restaurer » rend,
  liens et élèves compris (F03.1) ; la suppression de la scène de départ et
  le sélecteur « Choisir le départ du livre » (F03.2) ; les opérations du
  profil « écriture et organisation » et la scène « contenant du travail »
  (F06.1) ; une seule page du chapitre, avec ses variantes du mode personnel
  et de l'élève (F03.1) ; les textes du guidage de la préparation (F02) ;
  l'image choisie à la création d'un projet, d'une partie et d'un chapitre,
  et le sélecteur « Choisir une image » (F10.1).
- **Terminée quand :** le porteur a préparé son vrai projet jusqu'aux
  consignes et aux attributions, et a refait le même parcours dans un projet
  personnel et dans un récit classique.
- **Terminée le 10 octobre 2026 :** construite et mise en ligne le jour
  même, sur autorisation du porteur ; il fait son essai, demande ses
  retouches, puis déclare l'étape terminée (« pour moi tout est bon »).
  Il ne dit pas s'il a refait le parcours dans un projet personnel et dans
  un récit classique, que demande le « Terminée quand » : ces deux variantes
  sont jouées par les tests automatiques.
  - **Sorti de l'essai, le 10 octobre, et mis en ligne :** « Phrases de
    choix » en une seule liste à cocher, et la flèche qui ne garde que la
    première phrase (F05-AC43) ; dix-huit visuels de plus et leurs
    vignettes ; l'enseignant qui dit qui s'occupe d'une scène dès la
    préparation (F06.3), avec la règle confirmée qu'un élève retiré d'un
    chapitre ne s'occupe plus de ses scènes ; un écran d'aide à l'ouverture
    de la Préparation (F02) ; sur la carte de chapitre, le repère de prise
    sur l'image et le menu à trois points au pied ; côté élève, les
    chapitres des autres en cahiers fermés. Détail :
    [design](design.md#étape-2-construite-10-octobre-2026).
  - **Tests automatiques :** 225 passent — 48 sur les règles, 89 contre la
    base locale, 88 parcours joués dans un navigateur —, chacun au nom de
    son critère. Choix techniques :
    [architecture](architecture.md#réalisation-de-létape-2-10-octobre-2026).
  - **Schéma de la base :** `20261010150000_preparer_organiser.sql`,
    appliquée à la vraie base le 10 octobre 2026 à la demande du porteur,
    après une sauvegarde, puis le code mis en ligne ;
    `npm run verifier:production` trouve tout en ordre. Une seconde,
    `20261010170000_qui_s_occupe.sql`, écrite le même jour pour « qui s'en
    occupe », est appliquée à la vraie base le soir même, après une
    sauvegarde, à la demande du porteur, avec la mise en ligne du lot du
    jour (visuels, « Phrases de choix », « qui s'en occupe », aide de la
    Préparation).
  - **Critères qui ne se ferment qu'à l'étape 3,** faute de texte : le
    dialogue de suppression d'un élément qui a du texte (F03-AC13, AC22 pour
    sa confirmation), la scène « contenant du travail » (F06-AC14, AC88), la
    lecture du texte d'un camarade (F06-AC20) et l'écriture d'un élève
    (F03-AC17, F07-AC19). L'étape 2 teste ce qu'ils disent du plan et des
    droits. F03-AC08, AC09 et AC12 se ferment avec le lecteur et le PDF.
  - **Construit sans écran dessiné,** à juger à l'essai : les réglages du
    projet (titre, image, lecture ouverte), la page d'une scène réduite à
    son titre et à sa consigne, le chapitre ouvert par un élève, la fiche
    d'un chapitre qui n'est pas le sien
    ([design](design.md#étape-2-construite-10-octobre-2026)).
  - **Visuels par défaut :** vingt-trois — les cinq du 30 septembre et
    dix-huit fournis par le porteur le 10 octobre 2026, d'après les prompts
    du jour.

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
- **À régler avant de commencer :** rien. Arbitré en entretien le
  10 octobre 2026 et validé dans son ensemble par le porteur le même jour :
  la cadence de l'enregistrement, les refus hors conflit et les versions
  précédentes (F08.2, F08-AC32 à AC43) ; la commande qui fixe un numéro de
  passage (F11.5, F11-AC96 à AC98) ; les trois comportements laissés par le
  prototype (F05.2, F05-AC44 à AC46) ; ce que la recherche montre à un
  élève (F05, F05-AC47, AC48) ; la note de l'enseignant (F05.2, F05-AC49 à
  AC52) ; l'effet d'une désactivation de la mise en forme et les collages
  complexes (F04.1, F04-AC34 à AC36) ; la liaison cachée hors périmètre et
  la lecture ouverte dans les scènes voisines (F04.3, F04-AC37, AC38) ; la
  pose d'une image, les formats, le texte de remplacement et le collage par
  un élève (F10, F10-AC27 à AC33). Décidé par le porteur au même entretien :
  une légende facultative sous l'image en bloc (F10-AC34), et le
  glisser-déposer des blocs de la copie à la place de « Monter » et
  « Descendre » (F05.2, F05-AC40 révisé). Ces critères s'ajoutent au
  périmètre de l'étape. Écrans :
  [design](design.md#étape-3--écrans-arrêtés-avant-de-construire-10-octobre-2026).
- **Autorisée le 10 octobre 2026,** pour elle seule, en deux temps :
  l'entretien, fait et validé ; la construction, faite le même jour, en
  local. Le schéma de la base change : les migrations s'appliquent à la
  vraie base sur accord du porteur, après une sauvegarde.
- **Construction : les six lots sont construits, en local, le 10 octobre
  2026.** Un commit local par lot.
  - **Mise en ligne le 11 octobre 2026, à la demande du porteur, avant la
    fin de sa revue,** pour essayer l'étape en ligne sur l'histoire d'essai :
    vraie base sauvegardée (`npm run sauvegarder`), migrations appliquées
    (`npm run production:schema -- --oui`), code poussé jusqu'au commit
    `7ce4c96`, vérification passée (`npm run verifier:production`). Sept
    migrations sont appliquées, et non six : `signe_des_formules`, née de la
    revue le même jour, se trouvait dans le dossier. Elle ne se modifie donc
    plus ; un changement demande une nouvelle migration. Les retouches
    faites ensuite, la vue « Chemins » refaite comprise, sont poussées le
    13 octobre 2026 à la demande du porteur, sans migration, après une
    série complète des tests ; il les essaie en ligne. Le même jour suivent
    le sens des flèches de « Chemins » et Node fixé à `22.x` : en ligne
    jusqu'au commit `2d98c4e`.
  - **Histoire d'essai :** « Les passeurs de brume », l'histoire de la
    maquette, se charge par `npm run histoire:essai`
    ([commandes](../app/README.md)) : sa classe d'essai et ses vingt-cinq
    élèves fictifs, la préparation, le plan, les consignes, les textes et
    les choix. Chargée le 11 octobre 2026 dans la base locale et dans la
    vraie base, sur le compte du porteur, à côté de ses projets.
  - **Terminée le 13 octobre 2026 :** le porteur valide l'étape (« c'est ok
    on valide ») après sa revue, dit V13 fait de son côté et demande de
    pousser le lot ; il poursuit ses essais en ligne. Ce qu'ils feraient
    apparaître se reprend en retouches, sans rouvrir l'étape.
  - **V13, faite à la main par le porteur, qui le dit le 13 octobre 2026 :**
    coller dans une scène un
    texte venu de Word, de LibreOffice et de Google Docs réels, avec du gras,
    de l'italique, du souligné, une liste, un titre et un tableau ; refaire
    l'essai dans Firefox. Les parcours automatiques jouent ces collages avec
    le contenu que ces logiciels mettent dans le presse-papiers, dans
    Chromium seulement.
  - **Tests automatiques :** 468 passent — 119 sur les règles, 156 contre
    la base locale, 193 parcours joués dans un navigateur —, chacun au
    nom de son critère (453 avant la reprise de la vue « Chemins »). Les neuf premières migrations se rejouent depuis
    une base vide et donnent le schéma de la base locale ; la dixième,
    `signe_des_formules`, a été ajoutée à la base locale sans la remettre à
    zéro.
  - **Reprise du 11 octobre 2026 — panneau des réglages :** sur le premier
    retour du porteur, qui écarte la fiche posée dans le texte, tout ce qui
    a des champs s'ouvre dans un panneau à droite du texte, à la place de la
    consigne, et les listes d'objets et de formules s'ouvrent au curseur
    (F05.2, F05-AC53 et AC54 ; F04.2). Construit en local le même jour, sans
    changement de schéma. Précisions prises en construisant, à lui faire
    confirmer : celles listées dans le
    [design](design.md#panneau-des-réglages-à-droite-du-texte-11-octobre-2026).
  - **Revue du 11 octobre 2026, première série de retours :** les menus
    s'ouvrent du côté où la fenêtre a la place, sans sortir de l'écran ni
    allonger le cadre du texte, règle étendue par le porteur à tous les
    menus de l'application ; « Nouveau choix » ne demande d'abord que le
    libellé, puis la destination, le lien caché devenant un lien discret et
    l'aide passant dans deux « i » ; la phrase du choix se lit en attente à
    sa place dans le texte pendant la saisie (F05-AC55) ; « feuille
    d'aventure » dans le menu « / ». Construit en local le même jour, sans
    changement de schéma ; une dépendance de plus, `@floating-ui/dom`.
    Formes et précisions à lui faire confirmer :
    [design](design.md#menus-qui-tiennent-dans-la-fenêtre-11-octobre-2026)
    et [Nouveau choix](design.md#nouveau-choix-en-étapes-11-octobre-2026).
    Ensuite, le même jour : l'action de jeu en attente dans le texte
    pendant qu'on choisit sa formule (F04-AC39) ; un signe devant l'action,
    crayon par défaut, dé, sac ou cœur au choix (F04-AC40), gardé dans le
    texte de la scène, sans changement de schéma, et que le livre devra
    imprimer à l'étape 6 ; la ligne surlignée au clavier qui reste à
    l'écran dans les listes ; les réglages d'une image ouverts dès qu'elle
    est posée. Puis : un signe par formule, choisi dans la préparation ou
    depuis la scène, que l'action reprend (F04-AC41 ; migration
    `signe_des_formules`, déjà appliquée à la vraie base) ; pour « Nouveau
    choix », le libellé d'abord confirmé par le porteur, et « Scène
    existante » reprise sur ses trois décisions : scènes proposées d'après
    l'action en tête d'une seule liste, y compris quelques scènes d'autres
    chapitres avec leur repère, filtre sur tout le livre, bouton des
    chapitres (F05-AC56). Enfin, sur décision du porteur après discussion,
    les réglages d'un choix sont repris : la phrase s'écrit dans le panneau
    et non plus dans le texte, où toute phrase de choix devient un bloc ;
    plus de « Personnaliser », une flèche ronde pour l'automatique ; les
    destinations en liste, avec un « + » et un ordre qui se change
    (F05-AC22, AC23, AC25, AC45 révisés, AC46 retiré, AC57) ; pas d'image
    sur la ligne dans une phrase de choix pour cette livraison (F10) ; le
    titre d'une scène sans sa référence près d'un choix. Dix-huit parcours
    réécrits. Le même jour, après ces reprises, le porteur dit l'éditeur
    bon de son côté (« pour l'éditeur c'est bon ») ; les précisions des six
    lots, non présentées une à une, sont confirmées en bloc (« ok pour tes
    décisions »), et il garde la référence des scènes telle qu'elle est
    hors des choix. Il n'est pas convaincu par la
    vue « Chemins », jugée sur des chemins très simples : sa tenue sur un
    chapitre d'une trentaine de scènes n'est pas éprouvée (V15 n'a mesuré
    que le temps d'affichage). Décidé le même jour : la vue est refaite
    avec React Flow et dagre, de haut en bas, sur toute la largeur, cartes
    réduites à l'essentiel et choix sur les flèches
    ([F03.1](specifications.md#f031--histoire-parties-chapitres-et-scènes)) ;
    construite le 12 octobre 2026, voir la reprise qui suit.
    Restent à juger à l'essai les formes des reprises de ce jour, listées
    dans le design.
  - **Reprise du 12 octobre 2026 — vue « Chemins » :** refaite en local
    avec React Flow et dagre, versions figées, chargés seulement à
    l'ouverture de « Chemins » sur un écran large (F03.1, F03-AC43 à AC51).
    Un schéma de haut en bas sur toute la largeur, la page défilant
    normalement ; des cartes réduites au titre et à l'état ; les choix sur
    les flèches ; la ligne « À regarder » ; « Tout voir », la taille en
    boutons et une mini-carte au-delà de deux écrans ; la même vue pour
    l'élève, la liste sur téléphone. Sans changement de schéma ; deux
    dépendances de plus. Un chapitre d'essai de trente-deux scènes et
    quarante-neuf choix, « Le marais des feux follets », s'ajoute à
    l'histoire d'essai de la base locale par `npm run chemins:essai`
    ([commandes](../app/README.md)) ; il n'est pas dans la vraie base.
    - **V15, refaite avec la lisibilité :** sur ce chapitre, en 1 366 points
      de large, 9 croisements au lieu de 30, aucun trait sous une carte au
      lieu de 3 traits sous 10 cartes, plus de défilement de côté ; quarante
      scènes dans un livre de deux cents s'affichent en moins d'une seconde.
      Détail et limites :
      [architecture](architecture.md#réalisation-de-létape-3-10-octobre-2026).
    - **Retour du porteur le 13 octobre 2026 :** « pas mal du tout » ; deux
      reprises faites le même jour (libellé entier qui garde sa largeur,
      « À regarder » parcouru avec un compteur, F03-AC45 et AC46). Il
      confirme trois précisions : ce que voit un élève, les libellés sur
      deux lignes, les scènes que rien ne relie rangées sous le schéma. Les
      autres précisions de F03.1, « Vue Chemins reprise », et les formes du
      [design](design.md#vue--chemins--reprise-12-octobre-2026), qui dit
      aussi ce qui reste perfectible, restent sans retour. Déplacer les
      cartes le temps de la visite, qu'il propose : non décidé.
    - **Non vérifié :** une tablette réelle (le tactile est seulement
      simulé), Firefox et Safari.
  - **V19 :** les versions de Plate et de Slate sont figées dans
    `package.json` ; les quatorze scénarios du prototype de l'éditeur sont
    réécrits dans `tests/parcours/` (`choix`, `proteger`, `jeu`) et servent
    de filet à toute montée de version.
  - **Lot 1 — enregistrement et texte simple : construit le 10 octobre
    2026.** L'éditeur Plate (paragraphes, gras, italique, souligné, collage
    nettoyé) ; l'enregistrement deux secondes après la frappe et quinze au
    plus, avant toute sortie par l'application et à la fermeture de la page ;
    le texte gardé à part, son onglet et ses deux gestes, l'élève arrêté ; les
    versions précédentes ; la ligne de rappel dans l'onglet Suivi ; le dernier
    enregistrement à la fermeture d'un poste ; le réglage « mise en forme des
    élèves » ; « Texte vide » et « En cours » partout ; le dialogue de
    suppression d'un élément qui a du texte ; la page de scène de l'élève.
    Schéma : `20261010210000_ecrire_enregistrer.sql`. Choix techniques :
    [architecture](architecture.md#réalisation-de-létape-3-10-octobre-2026).
    - **Vérifications levées :** V7 (dix enregistrements partis ensemble de
      la même version : un seul devient le texte, les neuf autres sont gardés
      à part ; deux échanges demandés ensemble ne perdent rien ; l'arrêt tient
      d'un poste à l'autre), V11 (frappe non interrompue, envoi à la
      fermeture de la page), V10 pour l'enregistrement final, V8 pour le
      texte que lit et écrit un poste.
    - **Critères qui attendent une étape suivante,** faute d'états, de
      remises ou de livre : F08-AC19, AC20 et AC25 (scène remise, état
      choisi), la seconde moitié de F08-AC21 (validation suspendue),
      F08-AC31 (prise en charge par l'élève) et F07-AC26, AC28, AC29 à
      l'étape 4 ; F08-AC27 à l'étape 6. F08-AC26 se ferme au lot 2, avec les
      choix.
    - **Lectures de règles, confirmées par le porteur le 11 octobre 2026**
      (la première, selon lui, n'arrivera jamais) **:** un élève retiré de
      la classe pendant qu'il tape voit sa dernière phrase gardée à part sur
      la scène, comme le dit F08.2, et non écrite dans la scène, comme le
      laissait entendre F06-AC78 ; la scène dont un camarade s'occupe se lit
      sans s'écrire depuis sa page, comme dans la maquette, « M'occuper de
      cette scène » venant à l'étape 4, la base ne refusant pas l'écriture
      puisque la prise en charge reste informative (F06.3).
  - **Lot 2 — phrase de choix, renvoi, numéros et chemins : construit le
    10 octobre 2026.** Créer un choix par « /choix » ou le bouton « Choix »
    (scène existante, nouvelle scène, à décider plus tard) ; le régler
    (libellé, destination, « Régénérer », « Personnaliser » et retour à
    l'automatique, renvoi de plus ou de moins) ; les règles de suppression,
    de fusion et de presse-papiers ; le glisser-déposer des phrases par leur
    repère et Alt avec une flèche ; les droits des deux profils d'élève,
    contrôlés aussi par le serveur ; les numéros du livre, « Fixer son
    numéro… » et « Libérer le numéro » ; la vue « Chemins » de l'adulte et de
    l'élève ; « Rechercher une scène » de l'élève ; le lien annoncé avant de
    supprimer une scène. Schéma : `20261010220000_choix_numeros.sql`.
    - **Vérifications levées :** V15 (quarante scènes dans un livre de deux
      cents : « Chemins » en moins de trois secondes ; mesure refaite le
      12 octobre 2026 avec la lisibilité, que celle-ci ne regardait pas) ;
      V8 pour ce qu'un
      poste lit des destinations, des liens et des numéros. Les scénarios 1
      à 7, 12 et 13 du prototype de l'éditeur sont réécrits dans
      `tests/parcours/choix.spec.ts`. Le glisser-déposer des blocs tient
      avec l'éditeur.
    - **Critères qui attendent :** F05-AC05 à AC08, AC26, AC27, AC37 et
      F11-AC98 au lot 3 (liaison cachée) ; F05-AC38 et le blocage du PDF à
      l'étape 6 ; F05-AC04 (titre proposé par l'IA) à l'étape 8 ; F03-AC19
      (prises en charge) à l'étape 4.
    - **Choix d'écran sans dessin, confirmés en bloc le 11 octobre 2026,**
      la règle du « / » l'étant expressément **:** la fiche ouverte au
      clavier prend le curseur, celle ouverte à la souris non ; « / » ouvre
      les commandes au début d'une ligne, après une espace ou une
      ponctuation ; sur téléphone, « Chemins » est une liste verticale ; la
      recherche de l'élève montre la référence des scènes, comme ses autres
      écrans.
  - **Lot 3 — liaison cachée, note de l'enseignant et protections :
    construit le 10 octobre 2026.** « Lien caché (énigme) » dans la fiche de
    création, pour l'adulte seul, avec le numéro gardé ou saisi ; la zone
    « Hors du récit · jamais imprimé » sous le texte, ses réglages (numéro,
    « Proposer comme choix », retrait) ; « Cacher ce choix (énigme) » ; pour
    l'élève, « Ton énigme doit conduire au numéro 38 ». La note de
    l'enseignant, par « /note » ou le bouton « Note », dont l'élève ne
    reçoit rien et que la base remet à sa place quand il enregistre. Le
    paragraphe protégé (« Protéger », « Retirer la protection »), fermé pour
    les élèves avec « Préparé par Mme Laurent », et le « + » qui ouvre un
    paragraphe au-dessus d'un bloc fermé. Schéma :
    `20261010230000_notes_de_l_enseignant.sql`.
    - **Vérifications levées :** V8 pour les notes (ni la page, ni les
      réponses, ni la recherche d'un poste ne les contiennent). Les
      scénarios 8 à 11 du prototype de l'éditeur sont réécrits dans
      `tests/parcours/proteger.spec.ts`.
    - **Critères qui attendent :** F05-AC05, AC08 et AC38 (contrôles des
      chemins, blocage du PDF, scène « à vérifier ») à l'étape 6 ; la moitié
      de F05-AC51 qui parle de « Remettre » à l'étape 4, et de la lecture
      d'essai à l'étape 6.
    - **Précisions prises en construisant, confirmées en bloc par le porteur
      le 11 octobre 2026 :**
      une liaison cachée ne mène qu'à une scène existante, et se crée sans
      libellé ; « Proposer comme choix » pose la phrase à la fin du texte ;
      un lien retiré peut se rétablir par « Annuler », le numéro restant
      fixé dans tous les cas ; une copie collée d'un paragraphe protégé
      n'est pas protégée ; Entrée à la fin d'un paragraphe protégé ouvre un
      paragraphe qui ne l'est pas ; une note glissée par un poste dans un
      texte par ailleurs inchangé est écartée sans rien garder à part.
  - **Lot 4 — objets et actions de jeu : construit le 10 octobre 2026.**
    « /objet » et le bouton « Objets », pour toute personne qui écrit, récit
    classique compris : la liste, la recherche, le nom écrit au curseur comme
    du texte ordinaire ; l'adulte ajoute un objet sans quitter la scène,
    l'élève lit « Liste tenue par Mme Laurent ». « /action » et le bouton
    « Action de jeu », pour l'adulte et l'élève « écriture et
    organisation » : paragraphe vide ou formule de la liste, « … »
    sélectionné dans une formule à compléter, « Formules… » et « Supprimer »
    sous l'action où l'on écrit ; bloc préparé pour l'élève « écriture et
    propositions », protégeable par l'enseignant ; presse-papiers et
    suppression selon les règles des choix. Schéma :
    `20261010240000_objets_et_actions.sql`.
    - **Scénario 14 du prototype** réécrit dans `tests/parcours/jeu.spec.ts`.
    - **Critères qui attendent :** la mise en valeur de l'action dans le
      livre et le lecteur (F04-AC17, AC18), la liste cachée au lecteur
      (F04-AC20), la feuille, le dé et les règles (F04-AC19, AC21 à AC24,
      AC31 à AC33) aux étapes 6 et 7.
    - **Défaut corrigé au passage,** qui datait du lot 2 : dans une scène
      vide, la fiche d'un choix ne se posait pas sous le bon bloc, le
      paragraphe vide n'ayant pas la même identité côté serveur et côté
      navigateur.
    - **Précisions prises en construisant, confirmées en bloc par le porteur
      le 11 octobre 2026 :**
      une action de jeu n'a pas de mise en forme (le livre la met en valeur
      lui-même) ; coupée en entier, elle part avec son bloc ; ajouter un
      objet ou une formule depuis la scène ouvre la rubrique « Objets et
      formules » de la préparation ; l'objet ajouté n'est pas écrit d'office
      dans le texte, il se retient ensuite dans la liste ; hors de son
      chapitre, un élève ne reçoit pas la liste des objets.
  - **Lot 5 — images, en bloc et sur la ligne : construit le 10 octobre
    2026.** « /image » et le bouton « Image », pour l'adulte seul : importer
    ou reprendre une image du projet, puis « Dans le texte » ou « Sur la
    ligne ». L'image en bloc : largeur en segments et en pourcentage, pleine
    page, « Remplacer l'image », « Ce que montre l'image », légende,
    « Supprimer », repère de prise ; préparée pour tous les élèves. L'image
    sur la ligne, à la hauteur du texte, dans un paragraphe de récit, une
    action de jeu ou une phrase personnalisée ; « [lune] » en texte simple.
    Fond transparent gardé, formats refusés nommés, import interrompu sans
    rien poser. Schéma : `20261010250000_images_dans_la_scene.sql`.
    - **Vérification levée :** V12 (images dans l'éditeur, en bloc et sur la
      ligne, que le prototype n'avait pas éprouvées) ; V8 pour les images
      qu'un poste peut lire. Parcours : `tests/parcours/images-scene.spec.ts`.
    - **Critères qui attendent :** l'image dans le livre, l'aperçu, le PDF
      et le lecteur (F10-AC16 pour l'impression, AC17 à AC19, la seconde
      moitié de AC20) aux étapes 6 et 7.
    - **Précisions prises en construisant, confirmées en bloc par le porteur
      le 11 octobre 2026 :**
      « petite » vaut 40 % de la page, « moyenne » 65 %, et le pourcentage
      libre va de 15 à 100 ; une image à fond transparent est gardée en
      WebP, ou en PNG si le navigateur ne sait pas l'écrire ; une image
      supprimée du texte reste parmi les images du projet ; pour un élève,
      « une image qui n'y était pas » se juge d'après les images que la
      scène a déjà portées, si bien qu'il peut y recopier un symbole déjà
      présent ; l'image en bloc d'une phrase copiée par un élève est écartée
      avec un message, comme l'action de jeu.
  - **Lot 6 — scènes voisines : construit le 10 octobre 2026.** Avant le
    texte, la fin de la scène d'où arrive le lecteur, avec la phrase de choix
    qui mène ici ; après, le début de celle où il repart, avec le libellé du
    choix ; une voisine à la fois, des onglets, « Ouvrir » ; une ligne pour
    une voisine sans texte ou d'un autre chapitre ; « lien caché » ; l'ordre
    du plan en récit classique. La case « Scènes voisines », cochée par
    défaut, tenue par le compte de l'adulte et par le profil de l'élève.
    Schéma : `20261010260000_scenes_voisines.sql`.
    - **Critères qui attendent :** la moitié de F04-AC10 qui parle de la
      remise et du livre (étapes 4 et 6) ; l'affichage pendant la relecture
      d'un texte remis, question ouverte de F04.3.
    - **Précisions prises en construisant, confirmées en bloc par le porteur
      le 11 octobre 2026 :**
      la case est à droite du titre de la copie, et non parmi les outils,
      trop nombreux ; les extraits ne s'affichent pas pendant qu'on lit un
      texte gardé à part ; une liaison cachée ne se montre à un élève que si
      l'autre scène est dans un chapitre qui lui est attribué, lecture
      ouverte ou non ; un extrait ne montre que du récit, ni action de jeu
      ni image en bloc.
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
- **À régler avant de commencer :** rien. Arbitré en entretien le
  13 octobre 2026 et validé dans son ensemble par le porteur le même jour :
  le Suivi d'un projet personnel et ce que liste « Mon travail » (F06.5,
  F06-AC91, AC92, AC95 à AC97) ; les deux états du mode personnel (F11.1,
  F11-AC99) ; la scène de l'enseignant au Suivi (F06.3, F06-AC93, AC94) ;
  pas de fiches en mode personnel ni pour la scène de l'enseignant, la
  scène de trop, l'élève de plusieurs chapitres, le partage à défaire
  (F07.4, F07-AC69 à AC73) ; le parcours des encouragements (F07.5,
  F07-AC51 précisé, AC76 à AC86). Demandé par le porteur au même
  entretien : un plafond de scènes à écrire par élève, avec le complément
  d'un élève (F07.4, F07-AC74, AC75) ; l'élève ne voit un tampon que s'il
  en a un ; le classement entier chez l'enseignant seul. Ces critères
  s'ajoutent au périmètre de l'étape.
- **Autorisée le 13 octobre 2026,** pour elle seule, en deux temps :
  l'entretien, fait et validé ; la construction, sur cette validation, en
  local. Le schéma de la base change : les migrations s'appliquent à la
  vraie base sur accord du porteur, après une sauvegarde.
- **Construction : commencée le 13 octobre 2026, en local,** sur
  l'instruction du porteur, qui retient le découpage proposé. Sept lots, un
  commit local par lot ; les lots 1 à 4 sont construits, les trois autres
  restent à faire. Rien n'est poussé ni appliqué à la vraie base.
  1. états et relecture, côté enseignant — état sur le tampon, fiche de
     décision, remarque, validation suspendue, « Prête », scènes sans élève
     et mode personnel (schéma : état, remises, remarques) ;
  2. côté élève — remettre, modifier encore, lire selon l'état, la
     remarque ; prendre, rendre, reprendre à un camarade, annuler ; les
     critères de F08.1 reportés de l'étape 3 (schéma : gestes de l'élève) ;
  3. « Mon travail » et retrait d'un élève ;
  4. Suivi — vues « Scènes » et « Élèves », aide, retour au Suivi, scène
     suivante à valider, carte du projet, Suivi personnel ;
  5. fiches de rédaction — page, feuilles, partage, plafond, complément ;
  6. encouragements (schéma) ;
  7. essai de séance et restauration (V18).
  - **Lot 1 — états et relecture, côté enseignant : construit le
    13 octobre 2026.** Le tampon de l'en-tête ouvre « État de la scène » :
    cinq états quand un élève s'occupe de la scène, trois sans élève, deux
    dans un projet personnel, chacun avec ce qu'il change. La fiche « Votre
    relecture » ou « Pour le livre » porte l'étape suivante : valider,
    demander une reprise avec sa remarque facultative, « Prête pour le
    livre », le rappel des défauts d'écriture avant « prête », le second
    clic ignoré. La validation suspendue quand le texte ou l'état a changé
    depuis la lecture ; l'état qui attend l'enregistrement des
    corrections ; les onglets « Remis le… » et la fiche « Remises » ; les
    cinq tampons dans le chapitre, la recherche, les chemins et les scènes
    voisines. Schéma : `20261013100000_etats_et_relecture.sql`, appliqué à
    la base locale seulement. Choix techniques :
    [architecture](architecture.md#réalisation-de-létape-4-13-octobre-2026) ;
    écrans et écarts :
    [design](design.md#étape-4-construite-13-octobre-2026).
    - **Critères fermés :** F07-AC02 à AC05, AC08, AC14, AC15, AC23, AC25
      à AC27, AC31, AC61 à AC65 ; F11-AC01, AC02, AC13, AC14, AC93, AC94,
      AC99, et la première moitié de AC24 ; F06-AC47, AC55 pour les cinq
      états, AC94 pour l'état gardé ; F08-AC20, AC25 et la seconde moitié
      de AC21.
    - **Critères qui attendent :** ce que l'élève lit et fait d'une scène
      remise, relue ou validée, et la remise elle-même (F07-AC07, AC09 à
      AC13, AC16, AC24, AC28 à AC30, F08-AC19, AC31), au lot 2 — ici, une
      remise est posée dans la base telle que le lot 2 la posera ; la scène
      suivante à valider (F06-AC63) et la scène de l'enseignant au Suivi
      (F06-AC93), au lot 4 ; la même commande d'état à côté de l'aperçu
      (F11-AC95), le PDF définitif bloqué (seconde moitié de F11-AC24) et
      le changement de police (F11-AC25), à l'étape 6.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      la consigne se replie d'elle-même quand la scène ne s'écrit plus ;
      seule la dernière remise a son onglet, les précédentes s'ouvrant
      depuis « Remises », et deux remises du même jour portent l'heure ;
      « citez la sélection » n'est pas construit ; une scène sans élève ne
      peut être mise ni « À valider » ni « À reprendre », mais garde l'un
      de ces états si elle le portait quand l'enseignant se l'est
      attribuée ; chaque reprise demandée est gardée, même sans remarque
      écrite ; le rappel avant « prête » se fait d'après le texte qui vient
      d'être enregistré ; le message d'une validation suspendue dit ce qui
      a changé, sans nommer l'élève ni l'heure ; un élève qui tapait encore
      quand la scène est passée « À valider » ou « Validé » voit sa phrase
      gardée à part et est arrêté, comme pour tout refus (F08-AC19).
    - **Tests automatiques :** 512 passent — 127 sur les règles, 179 contre
      la base locale, 206 parcours joués dans un navigateur —, dont 44 pour
      ce lot (8, 23 et 13), chacun au nom de son critère. Captures :
      `npm run captures -- etape4` (401 à 417).
  - **Lot 2 — côté élève : construit le 13 octobre 2026.** Dans la scène :
    « Remettre à Mme Laurent » dans le pied de la copie, inactif tant que
    le texte est vide, la dernière phrase enregistrée d'abord ; « Modifier
    encore mon texte » ; ce que l'élève lit selon l'état (« Mme Laurent
    relit ce texte », « Validé par Mme Laurent », « Pour changer quelque
    chose, demande à Mme Laurent ») ; la remarque, seule et en grand à la
    première ouverture d'une reprise (« J'ai lu, j'écris »), puis à côté du
    texte, et repliée après la remise suivante ; « M'occuper de cette
    scène » sur celle d'un camarade, « Je ne m'en occupe plus », et
    « Annuler » sur place. Dans le chapitre : une case sur chaque scène
    qui peut se prendre, et la barre « Je m'en occupe », qui annonce celles
    d'un camarade. Schéma : `20261013110000_gestes_de_l_eleve.sql`, appliqué
    à la base locale seulement.
    - **Critères fermés :** F06-AC04, AC06, AC07, AC10, AC38 à AC42, AC62,
      AC64 à AC66 ; F07-AC01, AC07 à AC13, AC16, AC19, AC24, AC28 à AC30,
      AC66 à AC68 ; F08-AC19 et AC31 ; F03-AC19 ; la moitié de F05-AC51
      qui parle de « Remettre ».
    - **Critères qui attendent :** la répartition des fiches, non
      exclusive (F06-AC61), au lot 5.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      dans une scène que personne n'a prise, l'élève écrit sans s'en
      occuper, et c'est la remise qui la met à son nom ; la page de la
      scène ne propose donc de prendre que la scène d'un camarade, le
      chapitre restant l'endroit où l'on prend une scène libre ; une case
      n'apparaît que sur les scènes qu'on peut prendre (ni la sienne, ni
      celle de l'enseignant, ni une scène remise ou validée) ; « Annuler »
      est proposé tant qu'on reste sur la page, la base le refusant après
      une demi-heure ou si la scène a changé de main entre-temps ; le
      texte remis est conservé sans les notes de l'enseignant ; la
      remarque se lit pendant la reprise et après la remise qui la suit,
      plus une fois la scène validée, et par les seuls élèves du chapitre,
      lecture ouverte ou non ; « J'ai lu, j'écris » est retenu par la base,
      si bien que la fiche ne revient pas sur un autre poste ; « Modifier
      encore ce texte » n'est proposé ni à l'élève arrêté ni sur la scène
      de l'enseignant ; sur la carte d'une scène à reprendre, le bouton dit
      « Reprendre » ; sans remarque écrite, la fiche dit « Pas de remarque
      écrite. Si tu ne sais pas quoi changer, demande à Mme Laurent. »,
      sans « Elle ».
    - **Tests automatiques :** 552 passent — 127 sur les règles, 204 contre
      la base locale, 221 parcours —, dont 40 pour ce lot (25 et 15).
      Captures 421 à 432.
  - **Lot 3 — « Mon travail » et retrait d'un élève : construit le
    13 octobre 2026.** « Mon travail » liste les scènes dont l'élève
    s'occupe, par urgence — à reprendre, en cours, texte vide, remises,
    validées —, une seule portant le bouton plein ; sous la liste, les
    scènes qui restent à prendre dans son chapitre, et « Choisir une
    scène » quand rien ne l'attend. « Retirer de la classe » retire l'élève
    de ses chapitres : ce qu'il écrivait redevient « En cours », « Pas
    encore prise » ; ce qu'il a remis ou fini garde son prénom (« Bilal
    s'en occupait ») ; sa scène « À valider », renvoyée, devient « En
    cours », sans élève ; son profil reste proposé à l'inscription s'il a
    écrit. Schéma : `20261013120000_retrait_d_un_eleve.sql`, appliqué à la
    base locale seulement.
    - **Critères fermés :** F06-AC95 à AC97, AC33 pour « Mon travail » ;
      F01-AC22, AC23, AC25 ; F08-AC17 pour la ligne de « Mon travail ».
    - **Changement de règle, dit au porteur avant de poursuivre, confirmé
      par lui le 14 octobre 2026 :** un élève retiré d'un chapitre, et non
      de la classe, garde lui aussi son prénom sur les scènes qu'il a
      remises ou finies. La règle du 10 octobre 2026 lui retirait toutes
      ses scènes ; elle date d'avant les états. F06.3 accordée.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      « Mon travail » est une liste, une ligne par scène, et non la grille
      de cartes de la maquette ; une scène où l'élève est arrêté s'y range
      après ce qu'il peut écrire, avant ce qu'il a remis ; la ligne d'une
      scène à reprendre dit « Mme Laurent te demande de reprendre ton
      texte. », qu'une remarque soit écrite ou non ; une scène validée sans
      élève ne compte pas parmi les scènes à prendre ; « Annuler », après un
      retrait, rend à l'élève ses chapitres et les scènes qu'il écrivait si
      personne ne les a prises, pendant une heure au plus ; réinscrit plus
      tard, il retrouve son code, pas ses chapitres ; un profil retiré
      n'est proposé à l'inscription que s'il a enregistré ou remis un
      texte ; l'entrée « Tester la lecture » de la maquette attend
      l'étape 5.
    - **Tests automatiques :** 570 passent — 133 sur les règles, 210 contre
      la base locale, 227 parcours —, dont 18 pour ce lot (6, 6 et 6).
      Captures 441 à 447.
  - **Lot 4 — Suivi : construit le 13 octobre 2026.** L'onglet Suivi d'un
    projet : l'écran d'aide à l'ouverture, « Ne plus afficher » et le bouton
    « Aide » ; le rappel des élèves sans chapitre et celui des textes gardés
    à part ; la vue « Scènes », par chapitre, avec les filtres Chapitre et
    Élève (« Moi » compris), les deux sélections par élève, les tampons
    d'état en filtres et leur légende ; la vue « Élèves » ; l'aucun-résultat
    qui nomme les filtres ; « Retour au Suivi », qui rend les filtres et
    l'endroit quitté ; la scène suivante à valider ; sur la carte du projet,
    les scènes à valider avec « Voir » et la part des scènes prêtes ; le
    Suivi d'un projet personnel, le même écran sans ce qui concerne les
    élèves. Sans changement de schéma.
    - **Critères fermés :** F06-AC32, AC34 à AC37, AC54 à AC56, AC58 à
      AC60, AC63, AC91 à AC93.
    - **Critères qui attendent :** le bouton des fiches de rédaction et les
      fiches des scènes listées (F06-AC57), au lot 5 ; la colonne
      « Encouragements » et le classement de la vue « Élèves », au lot 6 ; le
      Suivi filtré sur les scènes à finir, ouvert depuis le Livre
      (F11-AC78), à l'étape 6.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      les filtres vivent dans l'adresse de la page, si bien qu'ils tiennent
      d'eux-mêmes pendant la visite et repartent de « Toutes » à chaque
      entrée par l'onglet ; l'endroit quitté est retenu par l'onglet du
      navigateur, non par le compte ; dans la vue « Élèves », les élèves
      sans chapitre viennent en tête, puis l'ordre des prénoms ; « Aucune
      scène modifiable » se dit d'un élève dont aucun chapitre n'a de scène
      « En cours » ou « À reprendre » que l'enseignant ne s'est pas
      attribuée ; la part des scènes prêtes, sur la carte du projet, ne
      compte pas les scènes hors du livre ; la scène suivante à valider
      n'est proposée qu'après une décision prise sur une scène « À
      valider » ; une scène dont l'élève a quitté le chapitre porte « Bilal
      s'en occupait » dans « Qui s'en occupe » ; la légende dit « L'élève
      écrit, ou vous écrivez » pour « En cours », la critique ayant relevé
      que l'adulte écrit aussi.
    - **Tests automatiques :** 589 passent — 144 sur les règles, 210 contre
      la base locale, 235 parcours —, dont 19 pour ce lot (11 et 8).
      Captures 461 à 476.
  - **Lot 5 — fiches de rédaction : construit le 13 octobre 2026.** Le
    bouton « Imprimer les fiches de rédaction » du Suivi, ouvert sur les
    scènes listées ; la page des fiches, avec sa liste à cocher, « Ajouter
    les textes vides », « à reprendre », « Tout décocher » ; la feuille
    compacte (consigne, texte déjà écrit, image, reprise demandée, choix de
    fin, aucune place pour écrire) ; une feuille par chapitre ou par élève,
    la seule feuille d'un élève choisi, « À la suite, à découper » ; le
    partage des scènes sans élève entre les élèves de leur chapitre, donné à
    « Répartir et imprimer » après un message, annulable sur place ; « Au
    plus n scènes à écrire par élève » et le complément d'un élève. Sans
    changement de schéma.
    - **Critères fermés :** F06-AC57, AC61 ; F07-AC17, AC18, AC21, AC22,
      AC52 à AC60, AC69 à AC75.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      une scène remise, validée ou prête ne se choisit pas (« plus rien à
      écrire »), comme la scène sans consigne et celle de l'enseignant ; la
      page s'ouvre en « par élève » quand le Suivi était réduit aux scènes
      dont un élève s'occupe, en « par chapitre » sinon ; sans filtre au
      Suivi, toutes les scènes qui peuvent l'être sont cochées ; les scènes
      d'un partage sont données dans l'ordre du chapitre, part après part,
      pour que chacun garde des scènes voisines ; à égalité complète,
      l'ordre des prénoms départage ; le nombre se règle dans le panneau
      « Réglages », en « par élève », tous élèves affichés, quand des
      scènes cochées sont sans élève ; il vaut 4 sans rien régler (F07.4,
      « Réglages par défaut », décidé par le porteur le 13 octobre) ; ne sont signalés à compléter que
      les élèves d'un chapitre où une scène cochée est encore libre ;
      plusieurs élèves complétés sont servis dans l'ordre où on les clique ;
      répartir et compléter ne se cumulent pas, le dernier demandé
      l'emporte ; la feuille d'un élève de plusieurs chapitres range ses
      scènes par chapitre ; l'image imprimée est la première posée dans la
      scène ; la fenêtre d'impression est celle du navigateur, et
      l'application ne sait pas si la feuille est sortie.
    - **Tests automatiques :** 616 passent — 157 sur les règles, 211 contre
      la base locale, 248 parcours —, dont 27 pour ce lot (13, 1 et 13).
      Captures 481 à 491.
  - **Lot 6 — encouragements et classement : construit le 13 octobre
    2026.** Sur la page d'une scène, la fiche « Encouragements pour
    Bilal » et ses trois tampons, « Effort », « Fine plume »,
    « Créativité » : un clic donne, un second retire ; le tampon d'un élève
    d'avant, « Effort, pour Alice » ; rien à donner sans élève, sur la scène
    de l'enseignant ou sur un texte vide. Côté élève, le tampon reçu sur sa
    scène et sur sa ligne de « Mon travail », ses totaux, et, si
    l'enseignant le montre, les trois premiers de chaque catégorie et son
    propre total. Au Suivi, vue « Élèves », la colonne « Encouragements »,
    le classement, « Montrer le classement aux élèves » et « Voir la
    suite ». Migration `encouragements`, appliquée à la base locale
    seulement : la table des tampons, le réglage du projet, la fonction de
    l'enseignant et celle du poste.
    - **Critères fermés :** F07-AC50, AC51, AC76 à AC86.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      le tampon d'un élève d'avant se lit sur la fiche et ne s'y retire
      pas ; un tampon déjà donné se retire toujours, même si le texte a été
      vidé depuis ; un tampon reste compté quand sa scène est dans la
      corbeille, et disparaît avec elle si elle est supprimée pour de bon ;
      l'élève qui ne s'occupe plus d'une scène y voit encore le tampon
      qu'il y a reçu ; une ligne du classement commence par le nombre de
      tampons, non par un rang ; l'élève qui est parmi les trois premiers y
      lit son prénom en gras, sans ligne « Toi » ; une catégorie où
      personne n'a de tampon n'a pas de colonne ; quand la classe a plusieurs
      histoires, « Mon travail » range les encouragements par histoire ; la colonne du
      Suivi reste vide pour l'élève sans aucun tampon ; les trois
      signes sont des marches, une plume et une ampoule, à l'encre graphite.
    - **Tests automatiques :** 639 passent — 164 sur les règles, 219 contre
      la base locale, 256 parcours —, dont 23 pour ce lot (7, 8 et 8).
      Captures 501 à 513.
  - **Lot 7 — essai de séance et restauration : préparé le 13 octobre
    2026, l'essai du porteur restant à faire.** Un parcours joue une séance
    entière à trois postes, sans rien semer en cours de route : deux élèves
    prennent chacun une scène, écrivent, remettent ; l'enseignante relit
    depuis le Suivi, demande une reprise, valide, encourage, déclare prête
    (`tests/parcours/seance.spec.ts`). Le mode d'emploi de la séance d'essai
    et de la restauration est dans `app/README.md`, « Jouer une séance
    d'essai, puis restaurer ». Sans changement de schéma.
    - **V18, en local :** sauvegarde de la base locale au schéma de
      l'étape 4, écritures d'une séance, restauration : la base revient à
      l'identique (comptes, classes, récit, textes, remises, remarques,
      encouragements), le compte reste connecté, le mot de passe et les
      codes de la classe d'essai se relisent, les tests contre la base
      passent sur la base restaurée. Défaut trouvé et corrigé : la remise
      à zéro de la base locale effaçait la liste des fichiers importés,
      les fichiers restant sur le disque ; la restauration locale la met
      de côté et la remet. Les fichiers eux-mêmes ne sont toujours pas dans
      la sauvegarde : le porteur garde ses originaux.
    - **À dire au porteur :** la restauration vers la vraie base porte
      d'abord le schéma de l'application dans cette base, donc les quatre
      migrations de l'étape 4 tant qu'elles n'y sont pas ; elle n'a jamais
      été jouée. Recommandé : jouer l'essai et la restauration en local,
      et restaurer la vraie base au moment de mettre l'étape 4 en ligne,
      après une sauvegarde.
    - **Tests automatiques :** 640 passent — 164 sur les règles, 219 contre
      la base locale, 257 parcours —, dont 1 pour ce lot ; 641 avec le
      parcours des cases « Toutes les scènes » et de chapitre, ajouté le
      même jour à la page des fiches, reprise sur deux retours du porteur
      (`docs/design.md`, « Étape 4 construite », lot 5) : le second range
      tous les réglages derrière un bouton.
    - **Réglages gardés, le 14 octobre 2026, à sa demande :** ils sont
      gardés avec le compte (F07.4). Migration
      `20261014100000_reglages_des_fiches` : une colonne `reglages_fiches`
      au compte de l'enseignant, que lui seul modifie. Appliquée à la vraie
      base par le porteur le 14 octobre 2026, après sa sauvegarde
      (`sauvegardes/2026-10-14-13-24`), puis le code poussé : en ligne
      jusqu'au commit `d1c89b0`.
  - **Mise en ligne, le 13 octobre 2026, à la demande du porteur, qui
    veut essayer en ligne :** vraie base sauvegardée par lui
    (`sauvegardes/2026-10-13-19-46`), les quatre migrations de l'étape
    (`etats_et_relecture`, `gestes_de_l_eleve`, `retrait_d_un_eleve`,
    `encouragements`) appliquées par lui, puis le code poussé : en ligne
    jusqu'au commit `fa166df`. Ne plus modifier ces migrations : toute
    reprise du schéma passe par une nouvelle. La restauration de la vraie
    base n'a pas été jouée.
- **Lectures prises pour construire, annoncées au porteur, sans objection
  à la validation :** de plusieurs scènes cochées dont une vient d'être
  prise, l'élève reçoit les libres et lit laquelle ne l'était plus ;
  « Annuler », après avoir pris ou rendu une scène, tient tant qu'il reste
  sur la page ; la remarque montrée seule à la première ouverture (« J'ai
  lu, j'écris ») se construit comme dans la maquette et se juge en séance.
- **Terminée quand :** le porteur a joué une séance entière avec plusieurs
  comptes d'élèves, de la prise d'une scène à sa validation, puis restauré la
  base depuis une sauvegarde. **C'est le seuil « ma classe ».**
- **Terminée le 14 octobre 2026, sur décision du porteur :** il tient les
  essais côté élève pour bons et ne veut pas jouer la séance maintenant ; le
  parcours automatique d'une séance entière à trois postes en tient lieu
  (`tests/parcours/seance.spec.ts`). V18 est levée en local (restauration
  réussie à l'identique, le 13 octobre). Reste dû avant la première séance
  avec de vrais élèves, au titre de « Avant de saisir des prénoms d'élèves
  réels » : une restauration réussie de la vraie base.

### Étape 5 — Lire le récit à l'essai et contrôler les chemins

- **Ce qu'elle permet :** lire le récit depuis son départ en suivant les
  choix, avec la feuille d'aventure et le dé ; jouer une énigme ; voir la
  liste des problèmes de chemins et leur gravité.
- **Périmètre :** F09.1 (F09-AC01 à AC03, AC11 à AC14) ; F09.2 (F09-AC04 à
  AC10, AC15, AC16), le blocage du PDF définitif se fermant à l'étape 6 ;
  feuille et dé à l'écran (F04-AC21, AC31, AC32).
- **Dépend de :** étape 3 ; indépendante de l'étape 4.
- **À régler avant de commencer :** rien de bloquant. Arbitré en entretien
  le 14 octobre 2026, réponse par réponse, en trois séries, et validé dans
  son ensemble par le porteur le même jour (« ok ») :
  - ce que la lecture rencontre — choix sans destination ou vers une scène
    supprimée, scène vide, scène exclue lue par l'adulte avec « Hors du
    livre », scène sans choix ni fin ; le numéro d'une énigme saisi, avec
    « Passer l'énigme » (F09.1, F09-AC17 à AC20, F05.1) ;
  - lecture d'essai, contrôles et PDF : la destination Livre, sa ligne
    d'étapes et « Vérifier les chemins » entière se construisent ici,
    l'aperçu et les trois autres étapes à l'étape 6, la gravité calculée
    par une seule règle que le PDF reprendra (F09.1) ;
  - les branches déjà lues, marquées le temps de la page ; les entrées de
    l'adulte et de l'élève ; le départ de l'élève ; ce que reçoit son
    poste ; une seule lecture avec le lecteur en ligne, construite ici pour
    l'étape 7 (F09.1, F09-AC21 à AC23) ;
  - « À regarder » de Chemins gardé pour l'écriture, relié au Livre par
    « Voir dans les chemins » ; « Sans destination » en ambre dans
    l'éditeur ; départ, fins et « Sans suite » montrés à l'élève (F09.2,
    F03.1, F03-AC50 révisé) ; précisions de « Vue Chemins reprise »
    confirmées en bloc, mini-carte repliable, cartes non déplaçables
    (F03.1) ;
  - dans « Vérifier les chemins », la tâche vide sans coche tant qu'il
    reste des scènes à finir, l'aide qui ne revient pas avant la visite
    suivante, le rappel « à savoir » replié (F11.6, F04.2).

  Ces critères s'ajoutent au périmètre de l'étape, avec ceux de F11.6 qui
  portent sur « Vérifier les chemins » : F11-AC73, AC75, AC79 et, pour ce
  qui touche cette étape, AC89.
- **Autorisée le 14 octobre 2026,** pour elle seule, en deux temps : un
  entretien court sur les points ouverts de F09 (destination absente,
  branches déjà parcourues, articulation entre lecture d'essai, contrôles et
  PDF, deux propositions non arbitrées), puis la construction, après sa
  validation. Entretien fait et validé le 14 octobre 2026 ; la
  construction, autorisée par cette validation, se fait en local dans une
  nouvelle conversation, commencée le 14 octobre 2026 (plus bas).
- **Découpage retenu par le porteur le 14 octobre 2026 :** cinq lots, un
  commit local par lot.
  Le schéma change deux fois ; le contenu de chaque migration est dit au
  porteur avant d'être écrit, et rien ne s'applique à la vraie base sans
  son accord, après une sauvegarde.
  1. **Contrôles du livre** — la règle unique de F09.2 sur le livre entier :
     départ, scène sans issue, choix sans destination, vers une scène
     supprimée ou exclue, scène prête vide, passage inaccessible, fin hors
     d'atteinte, sortie non assurée, numéro fixé devenu impossible, rappel
     « actions de jeu sans feuille » ; gravité ; défauts d'écriture d'une
     scène à finir reportés. Sans écran ni schéma (F09-AC04 à AC08, AC15,
     AC16 ; F05-AC05).
  2. **Destination Livre et « Vérifier les chemins »** — ligne d'étapes,
     trois étapes fermées jusqu'à l'étape 6, aide à l'ouverture, quatre
     tâches, points avec « Ouvrir la scène » (sur le choix, panneau
     ouvert), « Marquer comme fin », « C'est voulu » et sa durée, « Voir
     dans les chemins » ; acceptés repliés ; « J'ai vérifié les chemins »,
     gardée quand une scène est rouverte ; « Retour au Livre » depuis la
     scène. Schéma : avertissements acceptés et déclaration de l'étape
     (F11-AC73, AC75, AC79, AC89 pour cette étape ; F09-AC10 pour ce qui
     ne dépend pas du PDF).
  3. **Lecture d'essai de l'adulte** — la lecture commune avec le futur
     lecteur en ligne (passage, phrases du livre, énigme, feuille, dé,
     parcours), « Par où commencer ? », bandeau de l'essai, « déjà lu »,
     « Lire à l'essai d'ici », 390 px (F09-AC03, AC13, AC14, AC17 à AC21 ;
     F05-AC09 pour la lecture ; F04-AC21, AC31, AC32).
  4. **Lecture d'essai de l'élève** — la fonction de la base qui lui donne
     ce qu'il peut lire, son entrée, son départ, la sortie de périmètre, la
     lecture ouverte ; départ, fins et « Sans suite » dans ses chemins.
     Schéma : cette fonction, sans table (F09-AC01, AC02, AC11, AC12, AC22,
     AC23 ; F06-AC48 pour la lecture ; F03-AC50 révisé).
  5. **Chemins, retouches et essai** — mini-carte repliable, « Sans
     destination » en ambre dans l'éditeur, scène désignée à l'arrivée par
     « Voir dans les chemins » ; un parcours joué de bout en bout et le mode
     d'emploi de l'essai du porteur dans `app/README.md`.
- **Construction, commencée le 14 octobre 2026,** en local, un commit par
  lot ; rien n'est poussé ni appliqué à la vraie base.
  - **Lot 1 — contrôles du livre : construit le 14 octobre 2026.** Une
    seule règle, `controler` (`app/src/domaine/controles.ts`), sur le livre
    entier : chaque point avec sa gravité, son étape, sa tâche, sa clé et
    sa phrase courte ; le serveur lui donne le plan, la feuille et les
    scènes qui portent une action de jeu (`app/src/serveur/controles.ts`).
    Ni écran ni schéma. Choix techniques :
    [architecture](architecture.md#réalisation-de-létape-5-14-octobre-2026).
    Essayée sur « Les passeurs de brume » chargé en local, marais compris.
    - **Critères fermés pour la règle,** leur affichage attendant le
      lot 2 : F09-AC05 à AC08, AC15 pour l'avertissement, AC16 pour ce qui
      est présenté, la moitié de AC04 (le point désigne le choix, rien
      n'est redirigé) ; F05-AC05 ; F05-AC08 pour le point bloquant ;
      F04-AC33 pour le rappel, qui ne paraît que dans les contrôles.
    - **Critères qui attendent :** l'affichage de ces points, au lot 2 ;
      le PDF définitif refusé, le PDF de travail et sa page des problèmes
      (F09-AC04, AC09, AC10, F05-AC08), le rappel à la demande du PDF
      définitif (F04-AC33), à l'étape 6 ; le rappel au partage (F09-AC15),
      à l'étape 7. Les contrôles d'images et de marges (F10, F11.2)
      s'ajouteront à la même règle à l'étape 6.
    - **Précisions prises en construisant, confirmées par le porteur le
      14 octobre 2026 :** la fin hors d'atteinte est un groupe de scènes accessibles qui se
      renvoient l'une à l'autre sans chemin vers une fin ni vers une autre
      scène — une boucle fermée, ou une scène qui ne mène qu'à elle-même —,
      signalé une fois, sur la première scène qu'on y rencontre ; une scène
      seule sans suite reste une impasse ; une telle boucle dont un chemin
      reste à relier n'est pas signalée, sa sortie étant sans doute ce
      chemin ; sans départ, ou un départ hors du livre, seul le départ
      manquant se dit, chaque scène étant sinon inaccessible ; une scène
      vide n'est contrôlée que comme vide, sans être dite impasse ; une fin
      dont la seule suite est une énigme n'est pas une sortie non assurée ;
      un choix vers une scène supprimée ou exclue est, comme le choix sans
      destination, un défaut d'écriture reporté tant que sa scène est à
      finir ; la sortie non assurée et le numéro impossible ne le sont pas ;
      un numéro fixé sans énigme qui y mène se dit « Un numéro fixé
      n'existe plus. », et deux scènes fixées au même numéro « Deux scènes
      doivent porter le même numéro. ».
    - **Décidé par le porteur le 14 octobre 2026, sur recommandation :**
      sur l'histoire d'essai, une scène que rien ne relie (S025, au gué)
      rendait inaccessibles les trente-deux scènes du marais qui en
      dépendent, trente-trois avertissements pour une seule cause. Une
      seule carte par scène où aucun chemin ne mène, qui dit le nombre de
      scènes qui n'ont pas d'autre accès ; un seul « C'est voulu » pour le
      groupe (F09.2, « Passage inaccessible, un seul point par cause »).
      Migration du lot 2 acceptée le même jour.
    - **Tests automatiques :** 21 de plus, chacun au nom de son critère —
      19 sur la règle, 2 contre la base locale.
  - **Lot 2 — destination Livre et « Vérifier les chemins » : construit le
    14 octobre 2026.** La ligne d'étapes et ses marques, l'aide à
    l'ouverture, les quatre tâches et leurs points, « Marquer comme fin »,
    « C'est voulu » et « 2 acceptés · Revoir », « Voir dans les chemins »,
    « Ouvrir la scène » sur le choix à relier, son panneau ouvert, « Retour
    au Livre » depuis la scène et le chapitre, le rappel « à savoir »,
    « J'ai vérifié les chemins ». « Relire » montre ses scènes à finir et
    ses erreurs graves, l'étape 6 lui donnant l'aperçu ; « Mettre en page »
    et « Imprimer et partager » sont fermées. Schéma :
    `20261014110000_verifier_les_chemins.sql`, appliqué à la base locale
    seulement — un journal daté des changements de chemins plutôt que deux
    compteurs par scène, pour qu'aucun enregistrement ne verrouille une
    autre scène
    ([architecture](architecture.md#réalisation-de-létape-5-14-octobre-2026)).
    Écrans et écarts :
    [design](design.md#étape-5-construite-14-octobre-2026). Livre d'essai
    où figure chaque cas : `npm run livre:essai`.
    - **Critères fermés :** F11-AC73, AC75, AC79, AC89 ; F09-AC24 ;
      l'affichage de F09-AC05 à AC08, AC15, AC16 ; F04-AC33 pour les
      contrôles ; F09-AC10 pour ce qui ne dépend pas du PDF (aucune commande
      ne passe outre un point bloquant).
    - **Critères qui attendent :** « Tester la lecture », au lot 3 ; la
      scène désignée à l'arrivée par « Voir dans les chemins », au lot 5 ;
      le PDF définitif refusé et la dernière étape quittée, retrouvée à
      l'ouverture du Livre, à l'étape 6.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      « J'ai vérifié les chemins » attend que toutes les scènes soient
      prêtes, comme « J'ai relu le livre » (F11-AC88) — la maquette la
      laissait poser en septembre ; posée, elle est gardée quand une scène
      est rouverte, avec une ligne qui le dit ; « Relire » s'ouvre, avec sa
      marque, sur une ligne qui dit qu'elle arrive avec l'aperçu, sans
      cadenas ; la phrase d'un point nomme le choix ; l'action propre d'une
      carte en petit bouton, sur la même ligne que les deux liens ; sans
      départ, « Choisir le départ » mène à « Parties et chapitres » ; une
      acceptation tient tant que les chemins de ses propres scènes n'ont pas
      changé, un changement plus haut dans le récit ne la rouvrant pas ; le
      Livre s'ouvre sur « Vérifier les chemins » tant que l'étape 6 n'est
      pas construite ; sur téléphone, la ligne ne garde que les pastilles.
    - **Tests automatiques :** 30 de plus, chacun au nom de son critère —
      8 sur les règles, 4 contre la base locale, 5 parcours, et la mise à
      jour de ceux du lot 1.
  - **Lot 3 — lecture d'essai de l'adulte : construit le 14 octobre 2026.**
    La lecture commune, construite une fois pour l'essai et le futur lecteur
    en ligne (`app/src/composants/lecture/`, règles dans
    `app/src/domaine/lecture.ts`) : le passage sur la page blanche du livre,
    les phrases de choix du livre activables, l'encadré d'énigme, la feuille
    d'aventure et le dé, « Parcours · n » qui ouvre la liste, « Passage
    précédent », « Recommencer », « Quitter ». La lecture d'essai y ajoute
    son bandeau, sur le fond à la teinte du chapitre. Entrées : « Par où
    commencer ? » (départ, ou scène trouvée par la recherche), « Tester la
    lecture » à la dernière tâche de « Vérifier les chemins », « Lire à
    l'essai d'ici » dans le menu ⋯ de la scène. Sans schéma.
    - **Critères fermés :** F09-AC03, AC13, AC14, AC20, AC21 ; la part de
      l'adulte de F09-AC17, AC18, AC19 ; F05-AC09 pour la lecture ;
      F04-AC21, AC31, AC32.
    - **Critères qui attendent :** la part de l'élève de F09-AC17, AC18,
      AC19, au lot 4 ; le lecteur en ligne, qui reprendra la même lecture, à
      l'étape 7.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      l'encadré d'énigme porte « Énigme », le champ « Numéro trouvé », « Y
      aller », puis « Passer l'énigme » avec, pour l'adulte, le numéro
      attendu ; « Ouvrir la scène » puis « Retour à la lecture d'essai »
      retrouve le parcours, les « déjà lu » et la feuille, que « Quitter »
      efface ; « Quitter » ramène au Livre ou à la scène d'où l'on est parti ;
      une fin qui porte des choix les montre, puis la marque de fin et
      « Recommencer » ; un choix vers une scène hors du livre se lit avec
      « … » à la place du numéro et se suit ; le parcours nomme chaque
      passage par son numéro, sa référence et son titre ; la feuille est à
      droite du texte à partir de 1 100 points, en barre basse en dessous ;
      en récit classique, « Scène suivante » suit l'ordre du plan, sans marque
      de fin.
    - **Tests automatiques :** 14 de plus, chacun au nom de son critère —
      8 sur les règles, 6 parcours.
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
- **Nom et adresses, état au 9 octobre 2026 :** le produit s'appelle
  « Il était une classe », décidé par le porteur. Aucune adresse n'est
  réservée. Sont libres ce jour-là, d'après les registres :
  `iletaituneclasse` en `.fr`, `.com`, `.org` et `.net`, et
  `il-etait-une-classe` en `.fr` et `.com`. La marque n'est pas vérifiée à
  l'INPI. Le porteur souhaite passer assez vite à l'anglais, avec un `.com`
  en anglais ; le nom anglais n'est pas décidé. `onceuponaclass.com` est pris
  (enregistré le 12 mai 2026 pour un an, sans site), `onceuponaclass.org` est
  libre, et l'usage de « Once upon a class » par un autre produit n'est pas
  vérifié. Recommandé, non décidé : un nom par langue, deux adresses pour la
  même application, sans passer par un courtier.
- **Pages publiques, recommandé le 9 octobre 2026, non décidé :** une seule
  page d'accueil tournée vers l'enseignant et sa classe (la promesse et le
  livre montré, le chemin en quelques temps, les deux sortes de récits en une
  section, qui fait quoi, l'origine du projet, l'offre) ; des pages
  secondaires, dont une pour le livre dont vous êtes le héros en classe et
  une pour écrire seul ; pas de tableau des quatre combinaisons. Dit par le
  porteur : la classe est sa particularité ; toucher des auteurs hors de
  l'école élargirait la cible, sans qu'il en fasse un objectif ; le livre de
  sa classe pourra servir d'exemple à feuilleter, les règles de diffusion de
  F12.2 restant différées.
- **Mention « React Flow », à trancher avant l'ouverture :** la
  bibliothèque de la vue « Chemins » affiche d'ordinaire son nom dans un coin
  du schéma ; elle est masquée depuis le 12 octobre 2026. Sa licence le
  permet ; ses auteurs le demandent compensé par un abonnement de soutien
  dans un produit qui rapporte. À l'ouverture : afficher la mention pour
  l'adulte, ou soutenir la bibliothèque
  ([architecture](architecture.md#réalisation-de-létape-3-10-octobre-2026)).
  Aucun achat n'est engagé.
- **Dépend de :** toutes les étapes précédentes, et d'un entretien dédié.
- **Terminée quand :** à définir par cet entretien.

## Hors de la première livraison

- **F01 :** conversion des modes d'un projet ; plusieurs enseignants sur un
  projet ; changement de classe après des attributions.
- **F01.1 :** espace partagé entre enseignants d'une école ; import avec
  correspondance de colonnes et synchronisation avec un annuaire.
- **F02 :** outil de collecte d'idées ou de vote.
- **F03.1 :** déplacement d'une scène vers un autre chapitre ; ajout de
  scènes en lot.
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
  QR. La sauvegarde inachevée au changement d'élève est décidée le
  10 octobre 2026 en F08.2.
- **F07.3 :** le verbe de la remise, « remettre » ou « donner », à entendre
  auprès d'élèves ; « J'ai lu, j'écris », à l'essai.
- **F08.1 :** texte gardé sur le poste après une coupure, proposition non
  décidée ; nombre de textes gardés à part par scène.
- **F10 :** conversion d'un PDF de scanner ou d'une photo HEIC dans
  l'application ; images dans les consignes.
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
- **Textes en retard sur les décisions :** « Statut et périmètre » des
  spécifications (choix et fidélité de l'aperçu « à vérifier », aucun
  prototype autorisé) ; brief, dont le fond date du 3 octobre (demandes de changements
  protégés encore listées comme ouvertes, « Graphe » pour « Chemins ») ;
  architecture titrée « Statut au 27 septembre ».
