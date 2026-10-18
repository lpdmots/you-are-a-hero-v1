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
chapitre, différé. F11-AC63 et F11-AC84 sont accordés le 15 octobre 2026
avec la déclaration requise en F11.6.

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
| IA | Images par OpenAI ; textes par Claude (API d'Anthropic), choisi par le porteur le 17 octobre 2026 après l'essai V17 ; traitement aux États-Unis accepté le même jour. | Décidé. |
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
    - **Précisions prises en construisant, confirmées par le porteur le 17 octobre 2026 :**
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
  réels » : une restauration réussie de la vraie base. **Faite le
  15 octobre 2026,** en mettant l'étape 5 en ligne : la vraie base restaurée
  depuis la sauvegarde `2026-10-15-14-18`, prise après les migrations, revient
  avec le même nombre de lignes dans chaque table, et `npm run
  verifier:production` passe. V18 est levée pour la vraie base.

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
  - **Lot 4 — lecture d'essai de l'élève : construit le 14 octobre 2026.**
    Migration acceptée par le porteur le même jour : une seule fonction,
    `lecture_du_poste(projet)`, que seul le poste d'un élève appelle — les
    chapitres qu'il lit (les siens, ou tous quand la lecture est ouverte),
    pour chacune de leurs scènes le titre, le texte sans les notes, le repère
    de fin et la place dans le plan, ni consigne, ni état, ni « hors du
    livre » ; pour les choix qui sortent de ses chapitres, seulement si la
    scène visée existe ; le départ du livre quand la lecture est ouverte ; de
    la préparation, la feuille, le dé, les règles du jeu, la formule de
    renvoi et la marque de fin. Les numéros viennent de la fonction qui
    existe déjà ; une scène exclue du livre se lit sans numéro.
    **Construit le 14 octobre 2026.** « Lire à l'essai » dans la barre de
    l'élève, à côté de « Mon travail » ; l'écran de départ, conçu avec
    impeccable puis critiqué en deux lectures séparées sur captures
    (28/40 informée, 25/40 indépendante ; corrigé aussitôt, sans nouvelle
    mesure) ; la lecture commune, sans référence, ni état, ni « Hors du
    livre », avec la sortie de périmètre ; la lecture ouverte ; dans ses
    chemins, « Départ du livre », « Fin de l'histoire » et « Sans suite ».
    Schéma : `20261014120000_lecture_du_poste.sql`, base locale seulement.
    - **Critères fermés :** F09-AC01, AC02, AC11, AC12, AC22, AC23 ; la
      part de l'élève de F09-AC17, AC18, AC19 ; F06-AC48 pour la lecture ;
      F03-AC50 révisé.
    - **Critères qui attendent :** aucun de ce lot.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      l'entrée est un lien de la barre, « Lire à l'essai », qui va droit à
      l'histoire quand l'élève n'en a qu'une ; les titres disent tous
      « Depuis… » — « Depuis le départ du livre » (« Commencer le livre »),
      « Depuis le début de ton chapitre » (le cahier, « Commencer au
      début »), « Depuis une scène » (« Chercher une scène à lire », qui
      montre l'extrait trouvé) ; le départ d'un chapitre est sa première
      scène, dans l'ordre du plan, où aucun choix du chapitre ne mène ;
      l'élève sans chapitre lit « Demande à Mme Laurent de t'en donner un. »
      et « Retour à Mon travail » ; la sortie garde la teinte du passage
      d'où l'on vient et porte « Revenir au passage précédent » en bouton ;
      pour tous, adulte compris : « Parcours · 2 passages », « Recommencer »
      discret, absent au premier passage, suivi d'un message « Annuler »,
      et « pas encore de suite » ou « à relier » avec un sablier plutôt
      qu'un triangle ; sur téléphone, la barre de l'élève tient sur une
      ligne et, sous 480 points, sa gommette remplace son prénom.
    - **Tests automatiques :** 9 de plus — 3 contre la base locale, 5
      parcours, et F03-AC50 révisé sur la règle des chemins. Captures :
      `npm run captures -- etape5` (501 à 513).
  - **Lot 5 — Chemins, retouches et essai : construit le 14 octobre 2026.**
    La mini-carte de « Chemins » se replie d'une croix dans son coin, en un
    bouton « Mini-carte » qui la rouvre, et reste repliée sur ce poste ;
    « Sans destination » est en ambre dans l'éditeur — le point ambre de
    « Chemins », et la case du numéro vide hachurée d'ambre ; la scène d'un
    point ouvert par « Voir dans les chemins » est désignée et amenée à
    l'écran, par le mécanisme de F03-AC25 que le Livre emploie. Un parcours
    joue l'essai de bout en bout (`tests/parcours/essai-etape5.spec.ts`) ;
    le mode d'emploi de l'essai du porteur est dans `app/README.md`,
    « Essayer l'étape 5 ». Sans schéma.
    - **Critères fermés :** les reprises du 14 octobre en F03.1 (mini-carte
      repliable, « Sans destination » en ambre) ; la scène désignée de
      F09.2, « Récupération ».
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      la mini-carte repliée le reste sur ce navigateur, d'un chapitre et
      d'une visite à l'autre, et non avec le compte ; la case du numéro
      d'un choix sans destination passe aussi à l'ambre.
    - **Tests automatiques :** le repli de la mini-carte et la scène
      désignée s'ajoutent aux parcours existants ; un parcours de plus, de
      bout en bout. Captures : `npm run captures -- etape5` (521 à 523).
  - **Repris sur décision du porteur, le 14 octobre 2026, après avoir vu la
    lecture :** la feuille d'aventure est fermée au départ, ouverte par
    « Ma feuille » (avec le résumé de ses compteurs) ou par une action de
    jeu, dans la marge droite sur grand écran, sans déplacer le texte ;
    pour l'adulte, l'élève et le futur lecteur en ligne
    ([design](design.md#étape-5-construite-14-octobre-2026)).
- **Construite le 14 octobre 2026,** en local, ses cinq lots commités, deux
  migrations (`verifier_les_chemins`, `lecture_du_poste`). **En ligne le
  15 octobre 2026,** à la demande du porteur, jusqu'au commit `6ed2816` : vraie
  base sauvegardée, les deux migrations appliquées, 200 tests unitaires,
  228 contre la base et 278 parcours passés avant de pousser, puis la vraie
  base restaurée depuis une sauvegarde (étape 4, « Reste dû »). Ne plus
  modifier ces migrations. **Terminée le 15 octobre 2026,** après l'essai du
  porteur (« étape 5 terminée »).
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
  **Arbitré en entretien le 15 octobre 2026,** réponse par réponse, en
  trois séries, et validé dans son ensemble par le porteur le même jour :
  - les deux déclarations requises pour ouvrir « Mettre en page » (F11.6,
    F11-AC63 et AC84 accordés) ; une seule règle pour le PDF définitif et le
    partage, la coche de « Mettre en page » en plus pour le PDF définitif,
    l'image manquante bloquant aussi le partage (F11.2, F12.1, F11-AC99,
    AC100) ; tous les PDF définitifs gardés, supprimés à la main, le
    dernier PDF de travail seul (F11.2, F11-AC101) ;
  - le récit classique : filet au losange, titres de scène non imprimés,
    titres de chapitre activés par défaut et numérotés, titre du livre et
    du chapitre en en-tête, « Relire » à quatre tâches avec « Lire comme un
    lecteur » (F11.5, F11.6, F11-AC102 à AC104) ; les gabarits des cinq
    pages de présentation (F11.4, F11-AC105 à AC107) ; les listes de la
    feuille qui remplissent leur page, sans réglage (F04.2, F04-AC42) ;
  - le seuil de 200 points par pouce à la taille imprimée, la définition de
    2 600 points gardée (F10, F10-AC35) ; ni aperçu ni PDF pour les élèves
    (F11.2) ; la composition essayée chez Vercel dès le lot 1, sur une
    branche à part (`essai-vercel`, jamais `main`), dans une préversion
    protégée qui compose un livre intégré au code, sans la base ni aucune
    donnée d'élève ;
  - pour les écrans (recommandations acceptées, détail dans le
    [design](design.md#étape-6--écrans-arrêtés-avant-de-construire-15-octobre-2026)) :
    l'image se glisse dans la scène ouverte à côté de l'aperçu, comme dans
    la page de scène, ce qui accorde F11.2 et F11-AC46 au glisser-déposer
    décidé le 10 octobre ; page agrandie par défaut aux deux premières
    étapes ; polices montrées par un exemple ; marges repliées ; page de
    présentation modifiée dans le panneau à droite ; étape d'arrivée allégée
    (« Nouveau PDF définitif » seulement si le livre a changé, liste sans
    doublon, aide à la couverture sans prompt avant l'étape 8, volet
    « Partager » à l'étape 7) ; moins de texte autour de l'aperçu.

  Ces critères s'ajoutent au périmètre de l'étape.
- **Autorisée le 15 octobre 2026,** pour elle seule, en deux temps : un
  entretien court, puis la construction, après sa validation. Entretien
  fait et validé le même jour (« Je valide, tu peux coder ») ; la
  construction se fait en local, dans la même conversation, un commit par
  lot ; rien n'est poussé sur `main` ni appliqué à la vraie base sans sa
  demande ; aucun fichier n'est envoyé à un imprimeur et aucun service
  payant n'est engagé.
- **Découpage retenu par le porteur le 15 octobre 2026 :** sept lots, un
  commit local par lot. Le contenu de chaque migration lui est dit au début
  de son lot ; les écrans sans maquette se conçoivent avec impeccable et se
  critiquent en deux lectures séparées sur captures.
  1. **Composition et PDF de travail** — le livre composé d'après un
     instantané de la base, Paged.js et Chromium aux versions figées (celui
     de Playwright en local, `@sparticuz/chromium` chez Vercel), polices
     embarquées, césure posée à la composition et contournement du
     prototype réécrit ; numéros, renvois, en-tête, titres de partie ;
     marques du PDF de travail posées après la mise en page, récapitulatif
     pair ; carte des blocs ; « PDF de travail » à « Relire », déposé dans
     le stockage ; Linux comparé à macOS sous Docker ; branche
     `essai-vercel` et sa page de diagnostic. Migration `pdf_du_livre` : la
     table des PDF produits et un stockage privé `livres` (F11-AC03, AC09,
     AC15, AC16 à AC20, AC22, AC23, AC26, AC33, AC34, AC58 ; F09-AC09 ;
     F05-AC08 et F10-AC14 pour le PDF de travail ; F04-AC17).
  2. **Aperçu et scène ouverte à côté** — aperçu allégé affiché page par
     page, page agrandie ou double page, son état ; clic sur un passage,
     éditeur complet à côté, « Annuler » et « Tout annuler » ; renvoi
     suivi, « Revenir au n° » ; parcours des problèmes ; « Relire » et ses
     quatre tâches, « J'ai relu le livre » ; « Vérifier les chemins » en
     colonne à côté de l'aperçu ; dernière étape quittée. Migration
     `relire` (F11-AC27, AC30, AC46, AC47, AC59, AC61 pour « Relire »,
     AC69, AC71, AC78, AC80 pour « Relire », AC83, AC85, AC87, AC88, AC90,
     AC91).
  3. **Règles de composition, images, pages de présentation** — coupures,
     césure restreinte, alignement à gauche ; images à leur place, largeur
     réglée réduite, seuil de résolution, contenu hors des marges, « À
     confirmer » et « Garder ainsi » ; récit classique ; sections « Texte et
     pages » et « Pages de début et de fin » ; feuille, dés et numéro de
     page imprimés ; règles du jeu à portée de main dans la lecture.
     Migration `mise_en_page` (F11-AC08, AC12, AC28, AC29, AC35 à AC41, AC48
     à AC55, AC57, AC60, AC84, AC102 à AC107 ; F10-AC13, AC15, AC17 à AC19,
     AC35 ; F04-AC19, AC24, AC42).
  4. **Mettre en page** — ouverture selon la règle, deux volets, aperçu du
     livre entier, « Ce passage dans le livre » (monter, descendre, placer
     après, nouvelle page, « Annuler »), pages peu remplies, groupes de
     mélange, « La mise en page me convient ». Migration `mettre_en_page`
     (F11-AC10, AC11, AC31, AC32, AC42 à AC45, AC61, AC62, AC63, AC76,
     AC77, AC80, AC92).
  5. **Imprimer : PDF définitif** — la règle unique, refus motivé et
     rappels, PDF définitif sur un instantané, PDF conservés, suppression,
     place occupée, « le livre a changé depuis », aide à la couverture. Sans
     migration prévue (F11-AC04 à AC07, AC56, AC72, AC99 à AC101 ; F09-AC04,
     AC10 ; F10-AC14 ; F04-AC33).
  6. **Ordre des passages** — « Réordonner les passages » sur les hauteurs
     de la vraie composition, écart d'une double page, « Garder cet
     ordre », doute sur l'ordre, passage suggéré, blanc dans un passage.
     Migration `ordre_des_passages` (F11-AC21, AC64 à AC68, AC74, AC81,
     AC82, AC86).
  7. **Essai de bout en bout** — deux livres d'essai, à choix en classe et
     classique, où figure chaque cas ; un parcours de « Relire » au PDF
     définitif ; mesures chez Vercel (V1 à V3, V5) ; captures ; mode
     d'emploi de son essai dans `app/README.md`. L'envoi à l'imprimeur (V6)
     et l'exemplaire reçu reviennent au porteur.
- **Construction, commencée le 15 octobre 2026,** en local, un commit par
  lot ; rien n'est poussé sur `main` ni appliqué à la vraie base.
  - **Lot 1 — composition et PDF de travail : construit le 15 octobre
    2026.** Le livre composé d'après un instantané de la base
    (`app/src/domaine/composition.ts` : ce qu'il imprime, dans quel ordre,
    en HTML, la césure posée d'avance), mis en pages par Paged.js 0.4.3 dans
    Chromium (`app/src/serveur/livre/`) ; les marques du PDF de travail
    posées après la mise en page ; la page récapitulative ; la carte des
    blocs ; « Créer le PDF de travail » à « Relire », déposé dans un seau
    privé, téléchargé par une adresse signée ; le dernier seul gardé. Le
    récit classique est composé dès ce lot (filet, titres de chapitre,
    en-tête). Migration `20261015100000_pdf_du_livre.sql` (la table des PDF
    et le seau `livres`), base locale seulement. Choix techniques et
    mesures : [architecture](architecture.md#réalisation-de-létape-6-15-octobre-2026).
    - **Critères fermés :** F11-AC03, AC09, AC15, AC16 à AC20, AC22, AC23,
      AC33, AC34, AC58 ; F09-AC09 ; F05-AC08 et F10-AC14 pour le PDF de
      travail ; F04-AC17 pour le PDF ; F11-AC26 pour l'instantané et son
      empreinte. Fermés plus tôt que prévu, la composition les portant
      déjà : F11-AC54, AC55, AC102 à AC104 (récit classique), F10-AC13, et
      la part de F11-AC40, AC41 qui tient à la césure posée d'avance.
    - **Critères qui attendent :** l'aperçu, qui reprendra cette
      composition, et F11-AC30 entre l'aperçu et le PDF, au lot 2 (le PDF
      de travail et le PDF définitif ont déjà les mêmes lignes aux mêmes
      places) ; le signalement « le livre a changé depuis » de F11-AC26, au
      lot 5 ; F04-AC17 dans le lecteur en ligne, à l'étape 7.
    - **Vérifications levées :** V1 — le Chromium de Vercel
      (`@sparticuz/chromium` 153, Linux, essayé sous Docker dans l'image
      Lambda d'Amazon) donne, sur un livre de 107 pages, les mêmes 3 035
      lignes aux mêmes places, au centième de point, que le Chromium 156
      de macOS ; V19 en partie (versions figées). V2 pour la composition,
      le 15 octobre 2026, sur une préversion de la branche `essai-vercel`
      (région `cdg1`) : le même livre de 107 pages, la même empreinte des
      pages qu'en local, composé en 5,8 s au premier appel (7,4 s vus du
      poste, Chromium décompressé en 2,8 s) puis en 3,0 à 3,1 s (3,4 s vus
      du poste), 0,2 Go de mémoire pour le serveur. Le dépôt dans le
      stockage, que la préversion ne peut pas faire sans la base, et V3
      (l'aperçu ressenti) attendent la mise en ligne. Deux corrections nées
      de l'essai : le diagnostic passe hors du relais d'authentification, et
      tout `playwright-core` part avec les fonctions. Pour lire la
      préversion protégée, `vercel curl` a créé, avec l'accord du porteur, un
      secret de contournement dans les réglages du projet Vercel
      (« Protection Bypass for Automation ») ; il peut le retirer.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      les marques du PDF de travail — « Version de travail · état du
      15 octobre, 10 h 02 » en haut, côté reliure ; la référence « S042 » à
      gauche du numéro, et dessous « énigme → 38 » ou « n° fixé » ; chaque
      point des contrôles en marge extérieure, dans sa phrase courte et sa
      couleur ; « À finir » en gris à côté d'une scène pas encore prête ;
      « p. 12 » en bas, côté extérieur ; la page récapitulative dit le
      nombre de scènes à finir, puis les points par gravité, chacun avec son
      numéro, sa référence et sa page. Le livre : Vollkorn en 12 points ;
      numéro de passage centré, en gras ; phrase de choix en italique
      derrière un tiret, son numéro en gras ; action de jeu encadrée, son
      signe devant ; « Fin » en petites capitales entre deux filets. Récit
      classique : en-tête centré, numéro de page en bas, côté extérieur. Le
      fichier téléchargé perd ses accents (« Les passeurs de brume - version
      de travail.pdf ») : le stockage n'écrit le nom qu'en caractères
      simples.
    - **Tests automatiques :** 16 unitaires, 13 de composition par Chromium
      (`npm run test:livre`, nouveau projet de tests), 4 contre la base,
      1 parcours.
  - **Lot 2 — aperçu et scène ouverte à côté : construit le 15 octobre
    2026.** L'aperçu (`app/src/serveur/livre/apercu.ts`) est la composition
    du PDF de travail, images allégées à 900 points, gardée dans le seau
    privé sous l'empreinte du contenu, et affichée page par page par pdf.js
    (`_livre/Apercu.tsx`) ; un clic sur un passage ouvre sa scène à côté —
    la page de scène elle-même, dans un mode « à côté de l'aperçu » —, un
    clic sur un renvoi suit le choix, avec « Revenir au n° » ; la page relit
    le livre deux secondes et demie après un enregistrement, et l'aperçu se
    recalcule quand l'empreinte change. « Annuler » et « Tout annuler » au
    pied de la copie. « Relire » a ses quatre tâches et « J'ai relu le
    livre » ; « Vérifier les chemins » passe en colonne, son « Ouvrir la
    scène » ouvre la scène à côté ; le parcours des problèmes ; le Suivi
    filtré sur les scènes à finir (`?livre=finir`) ; l'aide de « Relire » ;
    le Livre rouvert sur la dernière étape quittée. Migration
    `20261015110000_relire.sql`, base locale seulement : deux colonnes du
    projet (`livre_relu_le`, `derniere_etape_livre`), et le seau `livres`
    qui accepte la carte des blocs en JSON.
    - **Critères fermés :** F11-AC27, AC30 (l'aperçu et le PDF, images
      allégées comprises, ont les mêmes lignes aux mêmes places), AC46,
      AC47, AC59, AC61 pour « Relire », AC69 (sauf l'image manquante, au
      lot 3), AC71, AC78, AC80 pour « Relire », AC83, AC85, AC87, AC88,
      AC90, AC91 ; la dernière étape quittée, qui attendait depuis
      l'étape 5.
    - **Critères qui attendent :** l'image manquante signalée à « Relire »
      (F11-AC69), au lot 3, avec les contrôles d'images ; AC61 et AC80 pour
      « Mettre en page », au lot 4.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      la scène à côté porte sa référence, son titre (qui se change dans sa
      page), son tampon d'état, le menu ⋯ de sa page et « Fermer » ;
      dessous, le chapitre et « Consigne, remises et relecture : page de la
      scène » ; le rappel avant « prête » et la remarque de reprise
      s'ouvrent au-dessus de la copie ; « Tout annuler » ne s'active
      qu'après une modification et se confirme sur place (« Revenir au texte
      de l'ouverture ? ») ; les réglages d'un bloc s'ouvrent à droite du
      texte, par-dessus l'aperçu ; un renvoi suivi ouvre la scène de sa
      destination ; le compteur « Problèmes 1 / 8 » parcourt les points de
      l'étape en cours et ouvre leur scène avec la carte du point ; à
      « Relire », la tâche ouverte d'abord est la première qui a un point,
      sinon « Ce qui reste à écrire » s'il reste des scènes à finir, sinon
      « Lire et corriger » ; en récit classique, « Étape suivante : Mettre en
      page » ; le Suivi filtré garde les filtres chapitre et élève, sans
      tampons ni vue « Élèves », et dit « Plus de scène à finir pour le
      livre. » avec « Retour au Livre » en bouton quand la liste est vide ;
      une page de scène ouverte depuis ce Suivi dit « Retour aux scènes à
      finir » ; sous 1 100 points, « Scène S014 » et « Dans le livre » en
      onglets.
    - **Tests automatiques :** 5 unitaires, 1 de composition (F11-AC30),
      7 parcours.
  - **Lot 3 — règles de composition, réglages et pages de présentation :
    construit le 15 octobre 2026.** Les règles de coupure tenues par la
    composition (veuves et orphelines, numéro jamais seul en bas de page,
    groupe de choix gardé avec la fin de son passage, césure du français
    avec ses exceptions) ; les images à leur largeur imprimée, contrôlées
    (introuvable, peu définie sous 200 points par pouce, réduite pour tenir
    dans la page) ; ce qui dépasse des marges, lu dans le dernier aperçu ;
    la tâche « À confirmer » de « Relire » et « Garder ainsi » ; l'ouverture
    de « Mettre en page » selon la règle de F11.6, avancée du lot 4 et dite
    au porteur au début du lot, avec ses deux volets ; le volet
    « Réglages » (police, Andika comprise, taille, alignement, bas de page,
    titres et nouvelles pages, marges) et les cinq pages de présentation,
    chacune en modèle ou en image pleine page, modifiées dans le panneau à
    droite ; les dés imprimés ; « Règles du jeu » dans la lecture. Migration
    `20261015120000_mise_en_page.sql`, base locale seulement : trois
    colonnes du projet, `mise_en_page` et `pages_du_livre` (objets JSON,
    lus et complétés par l'application) et `mise_en_page_ouverte_le`,
    modifiables par l'adulte.
    - **Critères fermés :** F11-AC08, AC12, AC28, AC29, AC35 à AC41, AC48
      à AC53, AC57, AC60, AC84, AC105 à AC107 ; F10-AC15 à AC19, AC35 ;
      F04-AC19, AC24, AC42 ; F11-AC69 pour l'image introuvable, qui
      attendait du lot 2 (F10-AC14) ; F11-AC63, prévu au lot 4, avec
      l'ouverture de l'étape.
    - **Critères qui attendent :** au lot 4, AC61 et AC80 pour « Mettre en
      page » et le reste de son volet « Aperçu » ; le texte qui dépasse des
      marges se signale d'après le dernier aperçu composé, donc après lui.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      les marges repliées en une ligne « Haut 16 · Bas 20 · Extérieur 15 ·
      Intérieur 20 mm », dépliées en quatre champs à côté d'un schéma de
      double page où la marge qu'on modifie se colore ; une marge refusée
      garde dans son champ la valeur précédente, avec « 8 mm refusé : 10 mm
      au moins. » dessous ; la colonne de droite est réservée : sans page
      ouverte, la petite double page du début du récit, le nombre de pages
      et « Voir l'aperçu » ; une page ouverte y met son panneau, avec la
      petite double page de cette page, recomposée un peu plus d'une seconde
      après chaque enregistrement ; une page mise « Dans le livre » s'ouvre
      aussitôt dans le panneau, et « Modifier » reste actif sur une page
      hors du livre ; une page des auteurs sans prénom se signale en ambre
      (« Aucun prénom ») ; sans nom affiché de l'adulte, sa dernière ligne
      est vide plutôt que « avec » seul ; le titre se lit dans le panneau de
      la page de titre, un « i » disant qu'il se change par le menu ⋯ du
      projet ; deux colonnes de réglages seulement au-delà de 1 400 points.
    - **Tests automatiques :** 12 unitaires, 16 de composition, 4 parcours ;
      captures `npm run captures -- etape6`.
  - **Lot 4 — « Mettre en page », volet « Aperçu » : construit le
    15 octobre 2026.** Le volet « Aperçu » montre le livre entier ; un clic
    sur un passage ouvre sa scène à côté, au-dessus de laquelle la fiche « Ce
    passage dans le livre » donne son numéro, sa page, « Monter »,
    « Descendre », « Placer après le n° … » et « Commencer sur une nouvelle
    page » ; chaque action se dit au-dessus de l'aperçu, avec « Annuler ».
    Les pages peu remplies se parcourent depuis la barre de l'aperçu, la
    page entourée et son blanc hachuré, sa hauteur dite en millimètres. Le
    volet « Réglages » reçoit « Ordre des passages » : le mélange par partie
    et « Mélanger les parties 1 et 2 ». « La mise en page me convient », au
    bout de la barre des volets, coche l'étape et ouvre « Imprimer et
    partager », qui ne se referme plus ; « Reprendre » la retire. Une scène
    réintégrée prend la suite de sa partie, et le message dit son numéro.
    Migration `20261015130000_mettre_en_page.sql`, base locale seulement :
    `scenes.nouvelle_page`, le droit de modifier `rang_livre` et
    `nouvelle_page` (l'adulte seul, par la politique des scènes),
    `projets.mise_en_page_convient_le` et `imprimer_ouvert_le`, et la
    fonction `placer_passages`, qui récrit des rangs gardés d'un coup.
    - **Critères fermés :** F11-AC10, AC17 (à l'écran), AC32, AC42, AC43,
      AC44, AC45, AC61, AC62, AC77, AC80 pour « Mettre en page », AC92 ;
      F11-AC63 l'était au lot 3. F11-AC11 tient par les points qui disent
      un ajustement devenu impossible : la largeur d'image réduite
      (« à savoir », lot 3) et le numéro fixé plus grand que le livre
      (bloquant) ; une nouvelle page reste toujours applicable.
    - **Critères qui attendent :** F11-AC76 (scène rouverte après la mise
      en page : « Relire » perd sa coche, « Mettre en page » reste
      accessible ; le refus du PDF définitif, au lot 5) ; le doute sur
      l'ordre et son effet sur la déclaration (AC86), au lot 6 ;
      « Imprimer et partager » n'a encore qu'une phrase, jusqu'au lot 5.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      la fiche du passage tient en une ligne (« n° 22 · page 17 »,
      « Monter », « Descendre », « Placer après le n° » et son champ, un
      « i » qui dit les numéros possibles, l'interrupteur de la nouvelle
      page) ; un passage qui ne bouge pas le dit d'une phrase (« Il ouvre
      sa partie : il reste en tête. ») ; un refus se dit sous la fiche
      (« Choisissez un numéro de sa partie, du 4 au 6. ») ; la
      confirmation : « Passé du n° 6 au n° 5 · les renvois suivent. »,
      avec « Annuler », gardée tant qu'on reste dans le Livre et qu'aucune
      autre action ne la remplace ; « Monter » saute un numéro fixé ;
      « Placer après » un numéro fixé place le passage juste après les
      numéros qui le précèdent ; les plages de numéros des parties ne
      comptent pas les numéros fixés ; les parties se réunissent sans
      confirmation, les numéros changeant et les renvois suivant ; l'«
      Annuler » d'une exclusion qui vient d'être faite rend sa place au
      passage ; sur téléphone, seuls les deux onglets restent en haut de
      l'écran, la déclaration défile.
    - **Tests automatiques :** 5 unitaires, 3 de composition, 3 contre la
      base, 4 parcours.
  - **Lot 5 — PDF définitif : construit le 15 octobre 2026.** Une seule
    règle de l'application (`conditionsDuLivre`, `domaine/livre.ts`) dit si
    le PDF définitif et le partage sont possibles, et ce qui reste, étape
    par étape ; le serveur la vérifie sur l'instantané même qu'il compose,
    sans contournement. L'étape « Imprimer et partager » montre l'état du
    livre (« pas encore possible » avec ses raisons et « Créer un PDF de
    travail à la place », « Le livre est prêt. », « Le livre a changé depuis
    le PDF définitif du … », « Le livre est fait. »), rappelle les
    avertissements et les points « à savoir » avant de créer le PDF, garde
    tous les PDF définitifs (date, pages, taille, place occupée,
    « Correspond au livre actuel. »), les supprime après une confirmation
    sur place, et dit ce qu'il faut préparer pour la couverture chez
    l'imprimeur. L'étape est cochée quand le dernier PDF définitif est à
    jour. Sans migration.
    - **Critères fermés :** F11-AC04, AC05, AC07 (le PDF définitif sans la
      scène exclue, par la composition), AC26, AC56, AC72, AC76, AC100,
      AC101 ; F09-AC04, AC10 ; F10-AC14 ; F04-AC33 ; F11-AC99 pour sa
      règle, le doute venant au lot 6.
    - **Critères qui attendent :** le doute sur l'ordre qui refuse le PDF
      définitif à l'écran (AC99), au lot 6 ; le partage et sa mise à jour
      refusée (AC72, seconde moitié), à l'étape 7.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      sans PDF définitif possible, aucune commande pour le créer, seulement
      « Créer un PDF de travail à la place » et un lien par étape ; le
      rappel s'ouvre sur place (« À savoir avant de créer le PDF », la liste,
      « Créer le PDF définitif » et « Annuler »), et seulement s'il y a quelque
      chose à rappeler ; le PDF se télécharge dès qu'il est créé ; le dernier
      PDF définitif à jour porte seul le bouton principal « Télécharger » dans
      la liste ; « Et maintenant ? » garde deux lignes, le partage venant à
      l'étape 7 ; la taille se dit en Ko sous 1 Mo ; le fichier s'appelle
      « Le phare - livre.pdf ».
    - **Tests automatiques :** 5 unitaires, 3 contre la base, 3 parcours ;
      captures 621 à 625.
  - **Lot 6 — ordre des passages : construit le 15 octobre 2026.** Dans
    « Ordre des passages », sous le mélange par partie, « Moins de blanc » :
    « Réordonner les passages » et « Garder cet ordre », puis « Annuler » et
    « Réordonner à nouveau », qui avertit avant d'abandonner les
    déplacements faits à la main. L'agencement est calculé sur les hauteurs
    mesurées par la dernière composition (`domaine/agencement.ts`), puis
    l'ordre proposé est composé une fois : il n'est gardé que s'il laisse
    moins de blanc, sinon l'écran le dit et rien ne change. Le doute sur
    l'ordre naît quand un passage change de page depuis la décision ; il
    marque la section, l'onglet « Réglages » et l'étape, rend la déclaration
    inactive (« Ordre des passages à confirmer ») et refuse le PDF
    définitif. Sur une page peu remplie, trois passages au plus sont
    suggérés, avec « Placer ici » ; un blanc à l'intérieur d'un passage le
    dit et propose d'ouvrir la scène. Migration
    `20261015140000_ordre_des_passages.sql`, base locale seulement : quatre
    colonnes du projet (`ordre_decision`, `ordre_pages`,
    `ordre_retouche_le`, `ordre_agence_le`), modifiables par l'adulte.
    - **Critères fermés :** F11-AC21, AC64, AC65 (les rangs gardés ne
      bougent pas avec le texte), AC66, AC67, AC68, AC74, AC81, AC82 (un PDF
      définitif ne change plus, lot 5), AC86, AC99.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      l'ordre proposé n'est appliqué que s'il laisse moins de blanc, une fois
      composé (« Aucun autre ordre ne laisse moins de blanc : l'ordre actuel
      est gardé tel quel. ») ; le gain se dit (« Passages réordonnés :
      environ 46 mm de blanc en moins. ») ; « Réordonner » retire la
      déclaration « La mise en page me convient », « Garder cet ordre » la
      garde ; un déplacement fait à la main, une nouvelle page ou un mélange
      de parties relèvent de nouveau les pages, sans faire naître de doute ;
      les passages suggérés tiennent en une ligne (numéro, titre, hauteur et
      blanc restant, « Placer ici »), le plus haut d'abord ; les deux blocs
      de la section l'un sous l'autre.
    - **Question tranchée le 15 octobre 2026 :** une image pleine page posée
      en tête d'un passage laissait son numéro seul en bas de la page
      d'avant. Décidé par le porteur : le numéro s'imprime en haut de la
      page de l'image, au-dessus d'elle, l'image réduite d'autant (F10,
      F10-AC36) ; le numéro en tête de la page qui suit l'image, d'abord
      recommandé, est écarté sur sa remarque — le lecteur qui le trouve lit
      et manque l'image. F11-AC74 est révisé en conséquence.
    - **Tests automatiques :** 8 unitaires, 5 parcours. Un parcours du lot 2
      (F11-AC27) a échoué une fois dans une série complète et passé seul :
      instable, à surveiller.
  - **Lot 7 — essai de bout en bout : fait en local le 15 octobre 2026.**
    `npm run livres:essai` charge deux livres finis pour le compte local :
    « La lanterne du passeur », récit à choix de la classe d'essai
    (quatorze passages en deux parties, une énigme au numéro fixé, un passage
    atteint par la règle du jeu, des actions de jeu, la feuille d'aventure et
    son dé, une image pleine page en tête d'un passage, un dessin peu défini,
    une image réglée trop large, des pages peu remplies), et « Le grand
    voyage », récit classique (deux parties, trois chapitres, une image).
    Deux parcours mènent un livre de « Relire » au PDF définitif, à l'écran
    seulement. Le mode d'emploi de l'essai est dans `app/README.md`,
    « Essayer l'étape 6 ». Captures 601 à 609 (lot 3), 621 à 625 (lot 5),
    641 à 644 (lot 6).
    - **Mesures locales :** « La lanterne du passeur », 18 pages ; l'aperçu
      repris du stockage en 0,05 à 0,12 s ; le PDF de travail (20 pages,
      images entières) en 1,2 s ; sur « Les passeurs de brume » (72 passages,
      28 pages), « Réordonner les passages » rend environ 46 mm de blanc en
      moins et une page de moins, vérifié par une composition.
    - **Vérifications :** V4 levée en partie — le modèle approché annonçait
      95 mm de blanc en moins là où la composition en donne 46 : l'ordre
      proposé est donc vérifié par une composition avant d'être appliqué, et
      le passage suggéré, lu sur les mesures réelles de la page, tient
      (F11-AC67, AC68). V5 levée par les tests de composition (césure
      restreinte, aligné à gauche, folio absent, dés imprimés, feuille de
      plusieurs pages, page de présentation en image, marges modifiées,
      contenu hors des marges, page peu remplie). Restent au porteur, à sa
      demande : la mise en ligne de l'étape, V2 pour le dépôt dans le
      stockage et V3 (l'aperçu ressenti en ligne), puis V6, l'envoi d'un PDF
      définitif à l'imprimeur et l'exemplaire reçu.
    - **Tests automatiques :** 2 parcours ; la série complète passe.
  - **Retouches du 15 octobre 2026, après le lot 7 :** l'image pleine page
    en tête de passage partage sa page avec le numéro (F10-AC36, ci-dessus) ;
    avec les dés, aucune page ne porte de numéro, pas même la marque
    « p. 12 » du PDF de travail et de l'aperçu, qui se cachait derrière eux,
    et la page récapitulative ne renvoie à aucune page — décidé par le
    porteur (« soit l'un, soit l'autre »), F11.4. Un aperçu gardé avant ces
    retouches se recompose. Tests : 2 de composition ; F11-AC74 rejoué sur
    une image posée après le premier paragraphe.
- **Mise en ligne, le 15 octobre 2026, à la demande du porteur** (« tu peux
  migrer ») : vraie base sauvegardée (`sauvegardes/2026-10-15-20-33`), les
  cinq migrations de l'étape appliquées, `npm run verifier:production`
  passé ; la série complète passait juste avant (251 unitaires, 238 contre la
  base, 35 de composition, 304 parcours). Le `git push` sur `main` a été
  refusé à Claude par le contrôle des permissions de la session : le porteur
  le lance. Restent V2 (dépôt dans le stockage en ligne), V3 (aperçu
  ressenti en ligne) et V6.
- **Panne de la mise en ligne, réparée le 16 octobre 2026 :** après le
  `git push`, les pages d'un projet ne s'ouvraient plus chez Vercel
  (Playwright chargé par les pages, ses fichiers absents hors des routes du
  livre). Cause, correction et test de garde :
  [architecture](architecture.md#réalisation-de-létape-6-15-octobre-2026).
  La base n'y était pour rien. Le correctif attend d'être poussé par le
  porteur.
- **Terminée quand :** le PDF définitif du livre de la classe sort de
  Vercel, identique à son aperçu, et un exemplaire imprimé a été reçu.
- **Terminée le 16 octobre 2026, sur décision du porteur**, après ses essais
  en ligne (« l'ensemble fonctionne ») : il veut d'abord finir le site, puis
  essayer l'ensemble sur un projet complet avec ses élèves. V2 (dépôt du PDF
  définitif dans le stockage en ligne), V3 (aperçu ressenti en ligne) et V6
  (envoi à l'imprimeur, exemplaire reçu) sont reportées à cet essai ; ce
  qu'il fera apparaître se reprendra en retouches. Le même jour, il
  confirme en bloc les précisions prises en construisant les sept lots
  (« ok ») : ne plus les lui soumettre. Retouches du 16 octobre, en ligne
  avec la fin de l'étape : Chromium hors des pages du projet, l'horloge
  pour ce qui attend l'écriture, un second clic sur une action qui range la
  feuille d'aventure.

### Étape 7 — Partager et lire en ligne

- **Ce qu'elle permet :** partager une version terminée par un lien de
  lecture, l'ouvrir aux classes de l'enseignant, la mettre à jour, la
  retirer ; lire en ligne avec la feuille d'aventure et le dé.
- **Périmètre :** F12.1 (F12-AC01 à AC05, AC08 à AC11, AC13 à AC20) ; F12.3
  (F12-AC06, AC07, AC12) ; feuille conservée en ligne (F04-AC22, AC23).
- **Dépend de :** étapes 5 et 6.
- **Vérifications levées :** V16.
- **À régler avant de commencer :** lecture par les classes d'un livre écrit en mode
  personnel (F12.3). L'image manquante, qui bloque aussi le partage, est
  réglée le 15 octobre 2026 en F12.1, à l'entretien de l'étape 6.
  **Arbitré en entretien le 16 octobre 2026,** réponse par réponse, en
  trois séries, et validé dans son ensemble par le porteur le même jour
  (« je valide l'ensemble ») :
  - « À mes classes » aussi pour un récit personnel, dès que le compte a une
    classe en cours (F12.3, F12-AC24) ; la version partagée fige ce que le
    lecteur voit, sans les réglages d'impression, « le livre a changé » et
    la comparaison au PDF définitif portant sur ce seul contenu (F12.1,
    F12-AC21 à AC23) ; « Imprimer et partager » cochée quand tout ce qui a
    été produit est à jour, PDF définitif ou version partagée (F11.6,
    F11-AC108) ;
  - après une mise à jour, la lecture en cours et la feuille suivent les
    passages, sections et compteurs par leur identité (F04.2, F12.1,
    F04-AC43, F12-AC25) ; la lecture d'un élève gardée par la base pour son
    profil (V16, F12-AC26) ; seule la ligne de classe reçoit un texte propre
    au partage, la page des auteurs n'ayant qu'un interrupteur (F12.1) ;
    l'adresse publique réglée dans l'application, un second nom gratuit en
    `.vercel.app` à ajouter par le porteur avant le premier lien donné aux
    familles, un code de lien court à recopier, essais faux limités (F12.1) ;
  - pour les écrans (recommandations acceptées, détail dans le
    [design](design.md#étape-7--écrans-arrêtés-avant-de-construire-16-octobre-2026)) :
    une seule entrée « Lire » chez l'élève, en deux parties ; le volet
    « Partager » allégé (rappel sur place, retrait par le dernier
    interrupteur, « Prévisualiser » puis « Ouvrir ») ; le lecteur qui suit
    le livre et les décisions prises depuis la maquette.

  Ces critères s'ajoutent au périmètre de l'étape.
- **Autorisée le 16 octobre 2026,** pour elle seule, en deux temps : un
  entretien court, puis la construction, après sa validation, donnée le même
  jour. La construction se fait en local, un commit par lot ; rien n'est
  poussé sur `main` ni appliqué à la vraie base sans sa demande ; aucun
  service payant n'est engagé.
- **Découpage retenu par le porteur le 16 octobre 2026 :** quatre lots. Le
  contenu de chaque migration lui est dit au début de son lot ; les écrans
  sans maquette se conçoivent avec impeccable et se critiquent en deux
  lectures séparées sur captures.
  1. **Partager (côté adulte)** — la version partagée tirée du contenu du
     livre, la règle unique et la coche de l'étape d'arrivée, le volet
     « Partager » (état, deux canaux, rappel, mise à jour, retrait,
     changement de lien, noms, prévisualisation), la comparaison avec le PDF
     définitif. Migration `partage` (F12-AC02 à AC05, AC08 à AC11, AC15 à
     AC17, AC20 à AC22, AC24 pour l'adulte ; F11-AC72 seconde moitié,
     F11-AC108).
  2. **Lecteur en ligne par le lien, sans compte** — page de titre,
     « Comment lire ce livre » et règles, passages et choix, énigmes,
     parcours, fin et pages de présentation, feuille et dé, récit classique,
     reprise sur l'appareil et après une mise à jour, page neutre, page
     « momentanément indisponible », non-indexation, essais faux limités ;
     essai sur une fenêtre de téléphone. Sans migration (F12-AC01, AC13,
     AC14, AC18, AC19, AC23, AC25 ; F04-AC17 à AC21, AC23, AC24, AC31, AC32,
     AC43 ; F11-AC46 pour le lecteur).
  3. **Lire, côté élève** — l'entrée unique « Lire », les livres ouverts aux
     classes, la lecture et la feuille gardées par profil. Migration
     `lectures_des_eleves` (F12-AC06, AC07, AC12, AC24 pour l'élève, AC26 ;
     F04-AC22 ; V16).
  4. **Essai de bout en bout** — un livre à choix et un récit classique
     partagés en local, un parcours du partage à la lecture sur téléphone
     sans compte puis par un élève, captures, mode d'emploi de son essai
     dans `app/README.md`.
- **Construction, commencée le 16 octobre 2026,** en local, un commit par
  lot ; rien n'est poussé sur `main` ni appliqué à la vraie base.
  - **Lot 1 — partager, côté adulte : construit le 16 octobre 2026.** La
    version partagée est tirée du livre composé (`domaine/partage.ts`) : son
    ordre, ses numéros, ses titres, ses pages de présentation avec les noms du
    partage, sa feuille et son dé, sans rien de l'impression ni du travail.
    Le serveur (`serveur/partage.ts`) revérifie la règle unique sur
    l'instantané qu'il fige, exige le rappel à chaque ouverture de canal et à
    chaque mise à jour, garde le code du lien d'un retrait à l'autre et le
    remplace à « Changer de lien ». « Imprimer et partager » a deux volets ;
    « Partager » porte l'état, la comparaison au PDF définitif, « Qui peut
    lire », le rappel sur place, la confirmation de la coupure et les noms.
    Migration `20261016100000_partage.sql`, base locale seulement : la table
    `partages` (l'adulte seul) et `pdf_du_livre.empreinte_lecture`.
    - **Critères fermés :** F12-AC02, AC03, AC04, AC05, AC08, AC09, AC10,
      AC11, AC15, AC16, AC17, AC20, AC21, AC22, AC23 ; F12-AC24 pour
      l'adulte ; F11-AC72 (seconde moitié) ; F11-AC108.
    - **Critères qui attendent :** ce que voit le lecteur du lien, la page
      neutre d'un lien retiré ou changé (F12-AC03, AC10, AC11 côté lecteur),
      au lot 2 ; la lecture par les élèves (F12-AC06, AC07, AC12, AC24 côté
      élève), au lot 3. « Prévisualiser » et « Ouvrir » mènent au lecteur du
      lot 2.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      le volet « Imprimer » s'ouvre d'abord, « Partager » quand l'adresse le
      demande (`?volet=partager`), et son onglet porte le triangle quand le
      livre a changé depuis la version partagée ; l'étape d'arrivée porte
      alors aussi le triangle ; « Livre partagé, à jour depuis le 16 octobre,
      17 h 37. » ; « Le livre a changé depuis la version partagée du … » et
      « Mettre à jour le partage… », ou « Mise à jour impossible pour
      l'instant : les lecteurs gardent la version du … » avec ses raisons ;
      sous l'état, « Même texte que le PDF définitif du … », « Texte
      différent du … » ou, pour un PDF d'avant l'étape 7, « Comparaison
      impossible avec le PDF définitif du … » ; le rappel liste d'abord les
      points « à savoir » du livre, séparés, puis les quatre phrases (trois
      en mode personnel, sans les autorisations des familles), la case
      « J'ai relu le livre sur ces points. », « Partager » ou « Mettre à
      jour » et « Annuler » ; ouvrir le second canal reprend la version
      déjà partagée sans en figer une nouvelle (F12-AC20), même si le livre
      a changé ; « Couper le lien ? » ou « Retirer le partage ? » selon
      qu'un canal reste ouvert, avec ce que le lien affichera ; le lien
      s'affiche avec son code en trois groupes (`/lire/5uuk-hcj-km7`), « Copier
      le lien », « Ouvrir » et une phrase sur ce qu'il a de transmissible ;
      les noms se règlent avant comme après le partage, enregistrés aussitôt
      (le texte en quittant le champ), « Nom de l'auteur » en mode personnel,
      et une ligne « Un changement vaut pour la prochaine mise à jour du
      partage. » une fois le livre partagé.
    - **Tests automatiques :** 11 unitaires, 12 contre la base, 3 parcours.
  - **Lot 2 — lecteur en ligne par le lien : construit le 16 octobre 2026.**
    `/lire/<code>` lit la version partagée sans compte, par la clé de
    service et le seul code (`serveur/lecteur.ts`), et l'affiche dans le
    lecteur en ligne (`composants/lecture/LecteurEnLigne.tsx`), qui reprend
    le passage de la lecture d'essai (`Passage.tsx`) sans « Passer
    l'énigme » : page de titre et page des auteurs du début, « Commencer la
    lecture » ou « Continuer au passage n » et « Recommencer au début »,
    « Comment lire ce livre » et les règles, le passage, ses choix, son
    énigme, le parcours, la fin, la page des auteurs de la fin et la page de
    fin ; la feuille et les dés, fermés au départ ; le récit classique un
    chapitre par écran, avec « Sommaire ». La lecture est retenue sur
    l'appareil et reprise par l'identité des passages, la feuille par celle
    des sections et des compteurs. Un code inconnu, coupé ou changé mène à la
    page neutre ; une base qui ne répond pas, à « Le livre est
    momentanément indisponible. ». « Prévisualiser » ouvre le même lecteur
    (`/previsualiser/<projet>`), sous un bandeau, sans rien retenir. Sans
    migration.
    - **Critères fermés :** F12-AC01, AC13, AC14, AC18, AC19, AC25 ;
      F12-AC03, AC10, AC11 côté lecteur ; F04-AC17 (lecteur en ligne), AC18,
      AC20, AC21, AC23, AC24, AC31, AC32, AC43 ; F11-AC46 pour le lecteur.
    - **Critères qui attendent :** F12-AC23 se vérifie contre la base (lot 1)
      ; la lecture par les élèves et F04-AC22, au lot 3. Les écrans sans
      maquette (page « momentanément indisponible », phrase de reprise après
      une mise à jour) se critiquent au lot 3 avec l'entrée « Lire » de
      l'élève.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      le titre de l'onglet est celui du livre, sans le nom de l'application ;
      la barre fine porte le titre (qui ramène à la première page),
      « Comment lire », « Ma feuille » (grand écran) et « Parcours » avec le
      nombre de passages lus, ou « Sommaire » ; sur téléphone, les outils en
      icônes seules et « Ma feuille » dans la barre basse avec son résumé ;
      la page des auteurs « au début » se lit sous la page de titre, « à la
      fin » après la marque de fin, puis la page de fin ; le parcours nomme
      un passage « 7 · La barque toucha la rive… » ; aucune phrase ne dit
      où la lecture est gardée (retirée le 16 octobre 2026 sur la remarque du
      porteur, qui ne la comprenait pas : « Continuer au passage n » le
      montre de lui-même) ;
      « Recommencer » propose « Annuler » quelques secondes ; le texte de
      « Comment lire ce livre » à l'écran, tutoyant le lecteur comme le livre
      imprimé, ses phrases sur les énigmes et la feuille seulement si le
      livre en a, puis « Règles du jeu » ; en récit classique, « Chapitre
      précédent », « Chapitre suivant », et « Relire depuis le début » au
      dernier chapitre ; la page neutre ajoute « Si quelqu'un vous a donné
      ce lien, demandez-lui le nouveau. » ; un code se lit avec ou sans
      tirets ni majuscules ; dix codes faux de suite depuis une adresse
      réseau (ou cent en cinq minutes, comptés avec l'entrée des classes)
      font montrer la page neutre cinq minutes, même pour un bon code.
    - **Tests automatiques :** 3 unitaires, 5 parcours (sur une fenêtre de
      téléphone, sans compte) ; le test `pages-sans-chromium` suit aussi les
      nouvelles pages.
  - **Lot 3 — lire, côté élève : construit le 16 octobre 2026.** Une seule
    entrée « Lire » dans la barre de l'élève, à la place de « Lire à
    l'essai » : « Notre histoire en cours » (la lecture d'essai, en rangée
    basse, fermée hors des horaires) puis « Livres à lire » (les versions
    ouvertes aux classes, celui de la classe en grand avec « Écrit par ta
    classe », les autres avec la ligne de leur page de titre). Un livre
    s'ouvre dans le lecteur du lot 2, sous un bandeau « Retour à Lire », à
    toute heure ; la lecture et la feuille sont gardées par la base pour
    l'élève, une seconde après son dernier geste et au départ de la page.
    Migration `20261016110000_lectures_des_eleves.sql`, base locale
    seulement : la table `lectures_en_cours` (aucun accès direct) et quatre
    fonctions réservées aux postes (`livres_du_poste`, `livre_du_poste`,
    `garder_lecture_du_poste`, `image_d_un_livre_du_poste`).
    - **Critères fermés :** F12-AC06, AC07, AC12, AC24 (pour l'élève), AC26 ;
      F04-AC22 ; F06-AC31 pour la lecture des livres partagés ; V16 levée
      (reprise liée au profil de l'élève, d'un poste à l'autre).
    - **Critique des écrans sans maquette :** « Lire », la page
      « momentanément indisponible » et la phrase de reprise après une mise à
      jour, en deux lectures séparées sur captures : 28/40 (informée) et
      26/40 (indépendante) au premier dessin, corrigés aussitôt, sans
      nouvelle mesure (design, « Étape 7 construite », lot 3).
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      « Lire » remplace « Lire à l'essai » dans la barre, et la liste des
      histoires à lire à l'essai ne mène plus d'office à la seule histoire ;
      hors des horaires, « La lecture à l'essai rouvre demain, 8 h 30, avec
      le travail. », sans le titre de l'histoire, que la base ne rend pas
      hors des horaires ; « Pas encore fini : lis-le à l'essai, pour voir si
      tout s'enchaîne. » ; « Pas encore de livre. Quand Mme Laurent en
      proposera un, il sera ici. » ; l'explication des livres à lire derrière
      un « i » ; le livre de la classe en grand seulement quand il est
      partagé, les autres en cartes égales, un livre seul sur toute la
      largeur ; la couverture d'un livre reprend l'image de sa page de titre ;
      aucune phrase sur la lecture gardée, pas plus que par le lien ; le
      bandeau « Retour à Lire » ; un livre retiré des classes rend la page
      introuvable.
    - **Tests automatiques :** 5 contre la base, 2 parcours ; deux parcours
      de l'étape 5 passent par « Lire ».
  - **Lot 4 — essai de bout en bout : fait en local le 16 octobre 2026.**
    `npm run partages:essai` mène les deux livres de `npm run livres:essai`
    (« La lanterne du passeur », à choix, de la classe d'essai ; « Le grand
    voyage », classique, personnel) jusqu'à « Imprimer et partager », ouverte,
    sans les partager. Un parcours (`partage-de-bout-en-bout`) joue l'étape
    entière : la mise en page déclarée, le partage par les deux canaux et la
    coche de l'étape, la lecture d'une famille sur un téléphone sans compte
    jusqu'à la fin, celle d'Alice depuis « Lire », une coquille corrigée qui
    n'arrive qu'à la mise à jour, puis le retrait (page neutre, livre sorti de
    « Lire »). Le mode d'emploi de l'essai est dans `app/README.md`,
    « Essayer l'étape 7 ». Captures 701 à 713 (`npm run captures -- etape7`).
    Vérifié aussi sur le serveur local, avec la classe d'essai, en 390 points.
    - **Série complète :** 273 unitaires, 255 contre la base, 35 de
      composition, 314 parcours passent avant ce lot ; le parcours de bout en
      bout s'y ajoute.
    - **Reste au porteur :** l'essai sur un vrai téléphone et par ses élèves,
      qui terminera l'étape. Le second nom `il-etait-une-classe.vercel.app`
      est ajouté par lui le 16 octobre 2026, avec `ADRESSE_SITE` chez Vercel et
      l'adresse de retour chez Supabase ; l'ancienne adresse répond toujours.
- **Essayée en local par le porteur le 16 octobre 2026** (« c'est bien ») ;
  deux retouches en sortent : le rappel d'une image de page de présentation
  nomme sa page, et la phrase sur la lecture gardée est retirée du lecteur.
- **Mise en ligne, le 16 octobre 2026, à la demande du porteur** (« tu peux
  pousser en ligne ») : vraie base sauvegardée (`sauvegardes/2026-10-16-18-12`),
  les deux migrations de l'étape appliquées, `npm run verifier:production`
  passé, code poussé jusqu'à `32956d8` ; le lien de lecture répond en ligne.
  Ne plus modifier ces migrations.
- **Terminée quand :** le lien s'ouvre sur un téléphone sans compte, et un
  élève lit un livre terminé depuis son espace.
- **Terminée le 16 octobre 2026, sur décision du porteur,** après son essai en
  ligne (« cela fonctionne ») : les deux livres d'essai chargés dans la vraie
  base (`npm run livres:essai -- --production adresse --oui`, puis
  `partages:essai`), partagés par le lien et « À mes classes », lus sur son
  téléphone et par un élève de la classe d'essai. V16 est levée. Les livres
  d'essai se retirent de la vraie base par `--retirer`. Sorti de l'essai : le
  lien du lecteur vers le site, question notée à l'étape 9.

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
  Arbitré les 16 et 17 octobre 2026, voir plus bas.
- **Périmètre élargi à l'entretien,** à la demande du porteur : la
  Préparation en étapes (F02), les idées de chapitres, les personnages et les
  images créées (F10.1, F10.2).
- **Autorisée le 16 octobre 2026,** pour elle seule, en deux temps : un
  entretien court, puis la construction après sa validation. Construction en
  local, un commit par lot ; rien n'est poussé sur `main` ni appliqué à la
  vraie base sans sa demande. Budget d'essai V17 : 100 € d'appels pour toute
  l'étape, essais de qualité compris, le porteur prévenu avant la moitié ;
  aucun autre service payant. Les clés d'API sont fournies par le porteur dans
  `.env.local`, jamais lues ni affichées.
- **Arbitré en entretien les 16 et 17 octobre 2026,** réponse par réponse
  (détail dans les spécifications, qui font foi) :
  - fournisseur des textes choisi par l'essai V17 entre Claude Sonnet 5.5 et
    Opus 5.5 (API d'Anthropic, sur les crédits mensuels du forfait Max du
    porteur, séparés de Claude Code) et GPT-5.6 Terra et Sol (OpenAI), avec
    Haiku 4.5 et Luna pour la correction, les titres et les prompts ; critères :
    jugement à l'aveugle aide par aide, puis coût ; images par OpenAI ;
    traitement aux États-Unis accepté ; liste de ce qui est transmis ; journal
    des appels sans contenu ; plafonds par aide, par jour et par mois, le
    financement attendant F14 ; rubrique « Aides IA » de « Mon compte » ;
    champ pour orienter l'IA ; mode personnel (F13) ;
  - correction en cinq degrés nommés, défaut propre à l'adulte, sélection
    étendue aux paragraphes, marques dans la copie aux degrés 1 à 3, côte à
    côte aux degrés 4 et 5, « Proposer des pistes » dans la reprise (F13.1) ;
    consigne sur un modèle fixe, « Décris : » (F13.2) ; dix idées de choix en
    une demande, montrées trois par trois (F13.3) ; titre de scène par ✦
    (F05) ;
  - la Préparation refaite en parcours d'étapes, carnet et atelier fondus,
    questions, idées et « Nous retenons » enrichis à la main ou par l'IA par un
    bouton double, Grandes étapes réduites aux parties (F02, F13.4) ; idées de
    parties et de chapitres, résumé proposé (F13.5) ;
  - styles d'illustration, prompts en français, personnages de l'histoire et
    objets avec fiche visuelle et portrait de référence, images créées pour le
    repérage et pour une scène, une ou deux par création, qualité normale ou
    haute (F10.1, F10.2) ; la couverture reste un prompt (F11.4).
  `/personnage` insère le nom en texte ordinaire, comme `/objet` ; l'idée de
  personnages et d'objets liés dans le texte est laissée de côté (F10.2).
- **Jeu d'essai V17 :** textes d'élèves inventés par Claude, de niveau CE2 à
  CM2, avec des fautes typiques relues par le porteur, pour construire et
  calibrer ; idées de choix, consignes et préparation tirées d'un ancien projet
  du porteur ; jugement final sur des textes de sa classe de cette année.
- **Validé dans son ensemble par le porteur le 17 octobre 2026** (« ok je suis
  d'accord »), avec `/personnage` en texte ordinaire et l'idée des éléments
  liés laissée de côté.
- **Découpage retenu par le porteur le 17 octobre 2026 :** neuf lots. Au début
  de chaque lot : ce qu'il construit, le contenu de sa migration et ce qui
  paraît perfectible dans la maquette ; les écrans sans maquette se conçoivent
  avec impeccable et se critiquent en deux lectures séparées sur captures. Les
  tests n'appellent jamais le vrai fournisseur.
  1. **Socle et essai de qualité** — appels côté serveur aux deux
     fournisseurs, tableau « aide → modèle », réponse simulée pour les tests,
     journal des appels et plafonds, rubrique « Aides IA » de « Mon compte »,
     `env:local` qui garde les clés ; jeu d'essai, passage sur les modèles
     candidats et page locale de jugement à l'aveugle ; le porteur choisit le
     fournisseur des textes. Migration `aides_ia` (journal, réglages du compte).
  2. **Correction** — « Corriger », degré, sélection, marques dans la copie,
     côte à côte, application et « Annuler », texte changé pendant la demande,
     « Proposer des pistes ».
  3. **Consigne et titre** — modèle de consigne, note d'intention en mode
     personnel, ✦ du titre.
  4. **Idées de choix** — panneau, dix idées, destinations, ajout et
     « Annuler ».
  5. **La Préparation en étapes** — parcours, projection, questions, idées et
     « Nous retenons » à la main ou par l'IA, orientation, écran d'aide.
     Migration `preparation_en_etapes` (questions, origine des idées,
     orientation).
  6. **Parties, chapitres et résumés** — boutons doubles dans Grandes étapes
     et « Parties et chapitres », résumé proposé.
  7. **Personnages et objets** — cartes des personnages, fiche visuelle,
     portrait, « Repérer les personnages », fiches des objets, style et réglage
     du héros dans les options du projet. Migration `personnages`.
  8. **Images créées** — repérage d'après le résumé, image d'une scène
     (cadrages, badges, prompt, création), prompt à copier, idée
     d'illustration de l'élève, prompt de couverture.
  9. **Essai de bout en bout** — parcours, captures, mode d'emploi dans
     `app/README.md`, jugement du porteur sur des textes de sa classe.
- **Construction, en local, lot par lot :**
  - **Lot 1 — socle et essai de qualité : construit et terminé le 17 octobre
    2026.** Le porteur, sans le temps de tout juger, trouve les résultats
    satisfaisants dans l'ensemble, choisit Claude pour les textes (crédits
    d'API de son forfait) et laisse le choix des modèles à l'analyse : Opus
    5.5 pour les idées de choix, les questions et idées de la Préparation, les
    parties et les chapitres ; Sonnet 5.5 pour tout le reste ; Haiku 4.5 nulle
    part, ses erreurs de l'essai valant plus que l'écart de coût (détail dans
    `serveur/ia/modeles.ts` et l'architecture). Les images restent chez OpenAI.
    Révisé le même jour sur sa remarque (F13.1, F13-AC17) : une terminaison
    fautive dont l'intention est claire (« dormé » pour « dormait »), les
    accords et les homophones se corrigent dès le degré 1 ; le degré 2 ajoute
    la ponctuation, les majuscules et les tournures mal construites. Consignes
    au modèle reprises, vérifiées sur Sonnet 5.5, qu'il garde pour la
    correction. Les
    appels partent du serveur seul, par les bibliothèques officielles
    d'Anthropic et d'OpenAI (`serveur/ia/fournisseurs.ts`), en réponse JSON
    conforme à un schéma ; un tableau unique dit le modèle de chaque aide et
    les prix (`serveur/ia/modeles.ts`). Chaque aide de texte a sa consigne au
    modèle, son schéma, la relecture sans confiance de sa réponse et une
    réponse simulée (`serveur/ia/aides/`, quatorze aides, de la correction à
    la description d'une image). `demanderUneAide` tient les plafonds, la
    demande unique, les soixante secondes et le journal ; `IA_SIMULEE`
    remplace le fournisseur pour tous les essais automatiques, qui reçoivent
    aussi des clés vides. « Aides IA » dans « Mon compte ». `env:local` garde
    les deux clés. Jeu d'essai de 29 cas (`scripts/essai-ia/jeu.ts`),
    lanceur `npm run ia:essai` avec plafond de dépense, page locale
    `/essai-ia` de jugement à l'aveugle, absente chez Vercel. Migration
    `20261017100000_aides_ia.sql`, base locale seulement : la table
    `appels_ia` (l'adulte lit ses lignes, le serveur seul écrit), la colonne
    `enseignants.reglages_ia`, et deux fonctions réservées au serveur,
    `commencer_appel_ia` (plafonds et demande unique d'un seul tenant, sous le
    verrou de la ligne de l'adulte) et `terminer_appel_ia`.
    - **Critères fermés :** F13-AC01 (degré par défaut, gardé avec le
      compte) ; le cadre commun de F13 pour les plafonds, la demande unique,
      le délai, le journal sans contenu, les aides éteintes, les messages.
    - **Critères qui attendent :** F13-AC17, AC05, AC18 (qualité, jugée sur
      l'essai, puis à l'écran aux lots 2 et 3) ; toutes les autres
      F13-AC, F05-AC04 et F10-AC07 à AC12, aux lots 2 à 8.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      les aides de texte se jugent sur les candidats de l'entretien et GPT-6
      (Claude Sonnet 5.5 et Opus 5.5, GPT-5.6 Terra et Sol, GPT-6.1 Sol ;
      Claude Haiku 4.5, GPT-5.6 Luna et GPT-6 Luna en plus pour la correction,
      les titres, la fiche visuelle et la description d'image) ; effort de raisonnement bas pour toutes les aides ; une
      demande abandonnée depuis 75 secondes ne retient plus l'adulte ; une
      demande échouée ou sans réponse compte dans le plafond du jour, puisqu'elle
      peut avoir été facturée ; pour les images, rien ne s'affiche au-dessus
      des quatre dernières du jour (« Encore 2 images aujourd'hui. ») ; à la
      limite du mois, « Les images reviennent le mois prochain. Tout le reste
      fonctionne. » ; une autre demande en cours : « Une autre demande attend
      encore sa réponse. » ; le plafond du mois est de 30 € au taux approché
      de 1,15 dollar pour un euro, rangé avec les plafonds ; dans « Mon
      compte », la rubrique est une section unique, l'interrupteur en tête,
      ses réglages repliés quand il est éteint ; « Degré de correction par
      défaut » en liste, « Modifiable à chaque correction. » ; niveaux en
      pastilles, « Sans niveau coché : des mots simples, pour tout
      l'élémentaire. » ; « Images créées » : « Une » ou « Deux », « Normale »
      ou « Haute ». La différence mot à mot qui marquera les corrections du
      lot 2 (`domaine/difference.ts`) sépare la ponctuation des mots et tient
      une apostrophe courbe pour la même qu'une droite ; le lot 2 recompose un
      changement refusé avec l'espace du texte d'origine.
    - **Essai V17 :** liaison vérifiée avec les six modèles candidats, puis un
      passage de mise au point (un cas par aide, deux modèles) qui a fait
      corriger quatre consignes (étiquette « Partie : », carte « Le héros » en
      double, accessoire inventé dans une fiche visuelle, majuscule des points
      de consigne) ; 0,18 dollar. Décidé par le porteur le 17 octobre 2026 :
      GPT-6.1 Sol et GPT-6 Luna s'ajoutent aux candidats, et l'essai part sur
      le contexte de « Les passeurs de brume », ses textes de cette année
      servant au jugement final (lot 9). Passage complet le même jour :
      183 appels, aucun échec, 0,96 dollar ; dépense de l'étape à ce jour,
      environ 1,14 dollar (1 €) sur les 100 € du budget.
    - **Tests automatiques :** 21 unitaires, 14 contre la base, 2 parcours.
  - **Lot 2 — correction : construit le 17 octobre 2026, et terminé le même
    jour :** le porteur l'essaie sur le serveur local avec de vrais appels
    (« satisfaisant ») et confirme en bloc ses précisions, retouches comprises,
    les versions précédentes restant réglées comme F08.2 (une par personne et
    par jour, sans version propre à la correction) ; ne plus les lui soumettre.
    Construit en local, sans
    migration. « Corriger » et le degré dans l'en-tête de la copie de la page
    de scène, « Corriger la sélection » quand une sélection touche un paragraphe
    de récit ; aux degrés 1 à 3, la copie passe en lecture, les changements
    marqués au stylo (barré brique, ajout vert), chacun refusé ou rétabli d'un
    clic, puis « Garder les changements » ou « Laisser » ; aux degrés 4 et 5, le
    texte actuel et la proposition côte à côte sur toute la largeur, la
    proposition modifiable paragraphe par paragraphe, un onglet chacun sur
    téléphone, puis « Mettre ce texte dans la scène » ou « Laisser » ;
    « Annuler » dans le message qui suit (huit secondes) ; « Le texte a changé
    depuis la demande. Redemander ? » si la scène change avant, pendant ou après
    la demande ; « Proposer des pistes » sous la remarque de reprise, en mode
    classe. La demande passe par l'adresse `/ia/correction` (et `/ia/pistes`) ;
    « Garder » et « Annuler » sont des actions serveur. Le serveur relit le
    texte lui-même et recompose la correction d'après ce qu'il a relu.
    - **Critères fermés :** F13-AC02, AC03, AC04 ; F13-AC20 pour la marque et
      le refus ; F13-AC21 pour la demande et le compte des mots ; F13-AC01 à l'écran (le
      degré choisi pour une scène ne change pas le défaut) ; F13-AC17 pour la
      forme (deux marques au degré 1 sur la réponse simulée), la qualité restant
      à juger ; le message du texte changé ; les aides éteintes, sans
      « Corriger » ni pistes ; les pistes, absentes en mode personnel.
    - **Critères qui attendent :** F13-AC05, AC17, AC20 et AC21 pour la qualité réelle, au
      jugement du lot 9 sur des textes de sa classe.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      pas de « Corriger » dans la scène ouverte à côté de l'aperçu du livre,
      trop étroite pour le côte à côte ; dans l'en-tête, « Degré 2 ▾ » sans le
      nom, faute de place à côté des onglets (le nom se lit dans la liste, avec
      « par défaut » sur le degré du compte, et en tête de la proposition) ; ce
      qui ne se voit pas ne s'applique pas : une apostrophe ou un espace changés
      seuls gardent la forme de l'auteur, et un refus rend le texte d'origine
      avec son espace ; un mot qui reste garde son gras ou son italique, un mot
      ajouté prend la forme du précédent, une image sur la ligne reste devant
      la lettre qui la suivait (elle ne s'affiche pas pendant la relecture des
      marques) ; « Rien à corriger au degré 2. » quand la proposition ne change
      rien, sans passer en revue ; pendant la revue, la fiche de décision dit
      « Gardez ou laissez la correction proposée : l'état se choisira
      ensuite. », sans bouton ; « Annuler » ne défait rien si quelqu'un a écrit
      depuis (« Le texte a changé entre-temps : rien n'a été annulé. ») ; un
      texte changé pendant la demande ne passe jamais par l'enregistrement, pour
      ne pas créer de texte gardé à part ; « Redemander » relit d'abord la
      scène ; au degré 5, la consigne se lit au-dessus du côte à côte ; seuls
      les paragraphes changés sont teintés dans la proposition ; une correction
      appliquée compte comme une modification de l'adulte pour les versions
      précédentes de F08.2 (une par personne et par jour) ; les personnages ne
      partent pas encore parmi les noms propres, seulement les objets : ils
      s'ajouteront avec leurs cartes au lot 7 ; la réponse simulée corrige
      quelques fautes fixes (« dormé », « grote », « révéyer »…) pour les
      parcours et les captures.
    - **Écrans critiqués** en deux lectures sur les captures 813 à 827 : 27/40
      et 27/40, corrigés aussitôt (voir le design).
    - **Dépense :** quatre appels de vérification à Sonnet 5.5 (espaces et
      longueur), 0,021 dollar ; dépense de l'étape, environ 1,16 dollar (1 €).
    - **Tests automatiques :** 15 unitaires, 13 contre la base, 11 parcours ;
      le test de F13-AC17 attend « dormait » au degré 1 (F13.1 révisé le
      17 octobre 2026).
    - **Retouche du même jour, sur sa remarque (F13.1, F13-AC20) :** les fautes
      d'espacement et la majuscule en début de phrase se corrigent dès le
      degré 1. La différence découpe désormais le texte en mots et en
      séparateurs (espaces et ponctuation d'un seul tenant) : une faute
      d'espacement devient un changement marqué et refusable, alors qu'elle
      passait jusque-là pour « pareil » et ne s'appliquait pas (« quai.Le »
      restait tel quel). Consigne du degré 1 reprise et vérifiée sur Sonnet 5.5
      par deux vrais appels (cas `correction-1` et `correction-1b` du jeu
      d'essai) : 0,008 dollar ; dépense de l'étape, environ 1,15 dollar.
    - **Longueur de la proposition, décidée par le porteur le même jour
      (F13.1, F13-AC21) :** aux degrés 4 et 5, « Même », « ×1,5 », « ×2 » ou
      « environ N mots », sous la liste des degrés ; le bouton du degré dit
      « Degré 4 · ×2 » ; « 34 → 70 mots » au pied du côte à côte. La cible se
      compte sur le texte que relit le serveur ; la réponse peut aller jusqu'à
      1 500 mots. Essayé sur Sonnet 5.5 : « ×2 » sur 80 mots en rend 167, « environ
      150 mots » 130, sans événement nouveau (cas `correction-4-x2` et
      `correction-5-mots`) ; 0,013 dollar. Précisions confirmées : la liste
      reste ouverte au degré 4 ou 5 ; chaque facteur dit ce qu'il donne en mots
      dans sa bulle ; un nombre saisi se ramène entre 5 et 1 500 mots ; le
      réglage dure tant que la page est ouverte, comme le degré.
  - **Lot 3 — consigne et titre : construit le 17 octobre 2026, et terminé le
    même jour :** le porteur l'essaie sur le serveur local avec de vrais appels
    (« le tout me semble bon ») et confirme ses précisions, celles d'« Écrire »
    comprises ; ne plus les lui soumettre. Construit en local,
    sans migration (le journal accepte déjà les aides « consigne » et
    « titre »). Dans la page de scène : « ✦ Formuler » sous le champ de la
    consigne, qui part de ce que l'adulte y a écrit, même en trois mots, et
    rend une « Consigne proposée » modifiable sur place, sur le modèle fixe en
    classe, une note d'intention en mode personnel, avec « Utiliser » ou
    « Laisser » ; « Utiliser » remplace la consigne, « Annuler » dans le
    message. Un ✦ juste après le titre de la scène : trois titres en une
    demande, montrés ensemble dans une liste ouverte sous le titre (révisé à
    l'essai, voir plus bas). Les demandes passent par
    `/ia/consigne` et `/ia/titre` ; la page enregistre d'abord ce que l'adulte a
    tapé, puis le serveur relit la consigne et le début du texte.
    - **Critères fermés :** F13-AC06, F13-AC07 et F05-AC04 ; F13-AC18 pour la
      forme (une ou deux phrases, « Décris : », deux ou trois points, sur la
      réponse simulée et la relecture de toute réponse) ; les aides éteintes,
      sans ✦ ni « Formuler » ; la note d'intention du mode personnel.
    - **Critères qui attendent :** F13-AC18 pour la qualité réelle (aucun
      personnage inventé), jugée sur l'essai V17 et au jugement du lot 9 sur des
      consignes de sa classe.
    - **Précisions prises en construisant, à faire confirmer au porteur :**
      l'indication est la consigne elle-même, sans champ à part : « Formuler »
      sur un champ vide dit « Écrivez d'abord en quelques mots ce que la scène
      doit raconter. » et place le curseur dans le champ, dont l'exemple devient
      « Ce que la scène doit raconter, même en quelques mots. » ; la consigne
      proposée se retouche dans son cadre avant « Utiliser », et « Utiliser » la
      met dans la consigne, que les élèves lisent aussitôt ; un nouveau clic sur
      « Formuler » remplace la proposition ; le même nom, « Consigne proposée »,
      en mode personnel, où la fiche s'appelle aussi « Consigne » ; partent
      l'indication (1 500 signes au plus), l'univers, les personnages et l'enjeu
      de la Préparation, le titre et le résumé du chapitre, les titres et
      consignes des six scènes les plus proches dans le chapitre ; pour un titre,
      la consigne et le début du texte (les premiers paragraphes de récit,
      800 signes environ, sans note ni choix), les titres des autres scènes du
      chapitre, le titre actuel ; sans consigne ni texte, « Écrivez d'abord une
      consigne ou le début du texte. » ; un titre déjà pris dans le chapitre
      n'est pas reproposé ; « Un autre », dans la bande, fait comme le ✦ :
      le titre suivant, puis une nouvelle demande quand les trois ont été vus ;
      écrire le titre soi-même, ou demander une consigne, referme la bande ;
      « Utiliser » un titre donne « Titre changé. » avec « Annuler » ; pas de ✦
      du titre dans la scène ouverte à côté de l'aperçu, où le titre ne se
      modifie pas ; un envoi du titre ou de la consigne qui échoue repart au
      suivant au lieu d'être perdu, et une aide attend l'envoi en cours avant de
      partir.
    - **Écrans critiqués** en deux lectures sur les captures 832 à 839 : 26/40
      et 26/40, corrigés aussitôt (voir le design).
    - **Retouches du même jour, sur son retour :** une couleur propre à l'IA, le
      prune, ajoutée à la règle « une couleur, un rôle » (son choix, sur
      recommandation, contre le canard pâle) ; le signe des étincelles à la
      place de l'étoile seule (son choix parmi trois) ; « Corriger » et son
      degré en une pastille, sans place réservée ; la barre d'outils de la
      copie, mise en forme et « Protéger » à gauche, commandes à droite (sa
      demande) ; les trois titres ensemble dans une liste ouverte sous le
      titre, un clic sur l'un l'utilisant, au lieu d'une bande qui les montrait
      un à un (F05 révisé) ; la consigne, et la consigne proposée, à la hauteur
      de leur texte, sans défilement ; « Encouragements » sous la consigne. Voir
      le design, lot 3.
    - **« ✦ Écrire » une scène vide (F13.6), décidé par le porteur le même jour**
      sur trois recommandations (toujours quand le texte est vide, l'adulte
      prévenu si un élève s'en occupe ; environ 150 mots, réglables ; ce qui
      mène à la scène transmis) : construit dans le lot, sans migration.
      « Écrire » et « ≈ 150 mots » prennent la place de « Corriger » et du degré
      dans la pastille ; la proposition, modifiable par paragraphe, s'affiche
      dans la copie, avec « Mettre ce texte dans la scène » ou « Laisser » ; la
      scène d'un élève passe à l'adulte quand il garde le texte, « Annuler » la
      lui rend. Adresse `/ia/ecriture`. Critères fermés : F13-AC22 à AC25, sur
      la réponse simulée ; la qualité attend le jugement du lot 9. Modèle :
      Sonnet 5.5, après un vrai appel sur chacun des deux (cas `ecriture-1`) :
      Opus est passé au « tu » au présent derrière une scène au passé simple et a
      inventé un détail, Sonnet a tenu la personne, le temps et la consigne ;
      0,027 dollar ; dépense de l'étape, environ 1,19 dollar. Précisions à
      confirmer : l'aide de la fiche de décision pendant la revue (« Gardez ou
      laissez le texte proposé : l'état se choisira ensuite. ») ; sans consigne,
      le champ de la consigne s'ouvre et prend le curseur ; une scène sans élève,
      ou déjà à l'adulte, ne change pas de main ; jusqu'à deux scènes d'où l'on
      arrive, dans l'ordre des choix. Captures 840 à 843. Tests : 5 contre la
      base, 3 parcours.
    - **Dépense :** aucun appel réel (les consignes au modèle sont celles de
      l'essai V17) ; dépense de l'étape, environ 1,16 dollar (1 €).
    - **Tests automatiques :** 2 unitaires, 11 contre la base, 5 parcours.
      Deux parcours anciens repris : celui des aides éteintes (lot 1) rechargeait
      la page avant l'enregistrement du réglage et échouait déjà ; celui de
      « /choix » (F05-AC13) posait le curseur par la touche « Fin », qui ne le
      bouge plus dans le navigateur des parcours dès que la page défile (la
      consigne un peu plus haute la fait défiler en 1366 × 768) : il le pose
      désormais à la fin du paragraphe. Le comportement de « Fin » dans un vrai
      navigateur, sur une page qui défile, reste à vérifier.
  - **Lot 4 — idées de choix : construit le 17 octobre 2026, et terminé le
    18 octobre :** le porteur l'essaie sur le serveur local avec de vrais appels
    (« la proposition de choix semble fonctionner et est assez pertinente »),
    valide le lot et confirme ses précisions, ainsi que les retouches et les deux
    points de règle du 18 octobre ; ne plus les lui soumettre. Construit en local, sans
    migration (le journal accepte déjà l'aide `idees-choix` ; les liens se
    déduisent du texte). « ✦ Idées de choix », pastille prune à droite de
    « Corriger » dans l'en-tête de la copie, pour l'adulte seul, en récit à choix,
    quand les aides sont proposées ; pas dans la scène ouverte à côté de
    l'aperçu. Le panneau à droite du texte demande aussitôt dix idées et en montre
    trois : une case, le libellé, une ligne d'intention, la destination (« Nouvelle
    scène » et son titre, ou « Scène existante » et son nom), tout modifiable sur
    place ; « Changer » ouvre le menu de destination de « Nouveau choix ». « D'autres
    idées » montre les trois suivantes sans appel, puis redemande en écartant les
    idées déjà vues ; « Orienter l'IA » jette celles qui n'ont pas été montrées.
    « Ajouter 2 choix et 1 scène » crée d'abord les scènes par
    `creerSceneDepuisChoix` (qui reçoit désormais une consigne), l'intention pour
    consigne de départ, puis écrit les choix dans la copie, à la fin de la scène ;
    le message qui suit porte « Annuler ». Adresse `/ia/idees-choix`.
    - **Critères fermés :** F13-AC08, AC09, AC10, AC11 (les critères de F13.3 ;
      AC12 et AC13 sont ceux de la Préparation, F13.4, au lot 5) ; les aides
      éteintes et le récit classique, sans bouton ; la demande unique, les dix
      idées montrées trois par trois, l'orientation et « Annuler ».
    - **Critères qui attendent :** la qualité réelle des idées (choix vraiment
      différents, contraintes de la scène tenues), au jugement du lot 9 sur un
      chapitre de sa classe.
    - **Précisions prises en construisant, confirmées par le porteur le 18 octobre 2026 :** la
      première ouverture demandait aussitôt (révisé le 18 octobre : voir plus bas) ;
      refermer le panneau garde les idées, et le rouvrir les montre sans nouvel
      appel, tant que la page reste ouverte ; les idées cochées restent en tête
      quand « D'autres idées » remplace les autres ; retoucher une idée la coche ;
      la dernière page d'une demande peut montrer moins de trois idées ; une idée
      dont le libellé ou le titre est vidé bloque l'ajout ; une scène où la scène
      mène déjà n'est pas reproposée, ni un libellé déjà dans la scène (une
      demande peut ainsi rendre huit idées au lieu de dix) ; l'IA ne désigne que
      des scènes du chapitre, l'adulte peut en choisir une ailleurs par « Changer » ;
      une nouvelle scène créée depuis une idée n'a ni texte ni élève, et va à la
      fin de son chapitre ; les choix se posent après le dernier bloc qui n'est pas
      une ligne vide, si bien qu'une scène vide garde sa ligne où écrire au-dessus ;
      si une scène ne se crée pas, celles déjà créées sont retirées et aucun choix
      n'est écrit ; après l'ajout, le panneau se referme et le premier choix vient
      sous les yeux ; « Annuler » retire les choix, met les scènes créées dans la
      corbeille (comme « Supprimer aussi la scène » de F05-AC44) et remet les
      idées dans le panneau, cochées ; ce qui part : la consigne, la fin du texte
      (6 000 signes au plus, en paragraphes entiers, sans note), les libellés des
      choix déjà là, le titre et le résumé du chapitre, les titres et consignes de
      ses scènes (soixante au plus), les objets, la Préparation, l'orientation et
      les libellés déjà montrés.
    - **Deux points de règle, décidés le 18 octobre 2026 (voir plus bas) :** une scène vide
      qui reçoit des choix n'est plus vide (F07.1), et « ✦ Écrire » (F13.6) ne s'y
      propose plus ; recommandé : proposer « Écrire » tant que la scène n'a aucun
      paragraphe de récit écrit, le texte s'écrivant au-dessus des choix. Et
      « Annuler » met les scènes créées dans la corbeille plutôt que de les
      effacer, faute de suppression définitive sans migration ; recommandé : s'en
      tenir là.
    - **Écrans critiqués** en deux lectures sur les captures 844 à 854 : 27/40
      (informée) et 26/40 (indépendante), corrigés aussitôt (voir le design).
    - **Dépense :** deux vrais appels à Opus 5.5 sur une scène de l'histoire
      d'essai, en local (le second lancé par une page d'idées épuisée), 9,5 s et
      0,026 dollar chacun ; idées variées, tenues par la situation (la carte déjà
      prise n'est pas reproposée), titres dans la forme du chapitre ; une idée de
      la seconde demande frôle une idée déjà vue (« Regarder dans la casquette »
      après « Mettre la casquette de son père »). Dépense de l'étape, environ
      1,24 dollar (1,1 €).
    - **Tests automatiques :** 2 unitaires, 7 contre la base, 6 parcours. Suite
      complète des parcours avant le commit : 342 sur 343 ; le parcours de bout en
      bout du partage (étape 7) a dépassé son délai sur « Partager », puis passe
      seul, avec ceux des choix et des idées (45 sur 45).
  - **Retouches du 18 octobre 2026, sur le retour du porteur :** l'IA revient au
    canard (le prune n'a pas convaincu) et ses boutons prennent une seule forme,
    une pastille de 34 px ; dans le panneau des idées, « D'autres idées » passe
    sous la liste et le pied ne garde que « Ajouter… » (voir le design). « Qualité
    des images » reçoit « Automatique », par défaut, sur son idée : haute pour une
    image de scène en pleine page, normale ailleurs, repérage et portraits compris
    (F10.2, F10-AC37, `qualiteDeLImage` dans `domaine/aides-ia.ts`, appliquée par
    la création d'images au lot 8). Sans migration : un compte qui avait enregistré
    « Normale » la garde, à changer dans « Mon compte ». Tests : 315 unitaires,
    62 parcours des aides.
  - **Retouche du 18 octobre 2026, sur sa remarque** (« on ne peut pas orienter
    l'IA la première fois ») : la première ouverture des idées de choix ne demande
    plus rien ; le panneau montre « Orienter l'IA » (facultatif), le curseur dans
    le champ, et « ✦ Proposer des idées » : deux clics au lieu d'un, l'orientation
    dès le premier appel. Ensuite, inchangé : les idées gardées, le champ resté
    ouvert tant qu'il a un texte, sinon replié en lien. À sa demande, les tests ne
    sont pas repris pour l'instant : le parcours `idees-choix` et les captures du
    lot 4 attendent encore l'ouverture qui demandait aussitôt, à mettre à jour
    avant la prochaine suite complète.
  - **Les deux points de règle du lot 4, décidés par le porteur le 18 octobre
    2026** (« ok pour ces recos ») : « ✦ Écrire » se propose tant que la scène n'a
    aucun paragraphe de récit écrit, choix compris (F13.6 révisé, F13-AC26) ; le
    texte écrit se pose au-dessus des blocs déjà là (`texteEcrit`), et « Annuler »
    rend le texte d'avant, choix compris (`mettreUneEcriture` le renvoie), avec
    « Le texte écrit est retiré ; le reste de la scène est inchangé. » ; la page
    choisit « Écrire » ou « Corriger » d'après le compte des mots du récit. Et
    « Annuler » des idées de choix laisse les scènes créées dans la corbeille,
    sans migration. Tests existants d'« Écrire » repassés (16 contre la base,
    9 parcours), puis, à sa demande, le test de F13-AC26 écrit (contre la base) et
    le parcours `idees-choix` et les captures du lot 4 remis à jour pour
    l'ouverture en deux clics (captures 844 à 855, « idees-ouverture » en tête).
  - **Retouche du 18 octobre 2026, sur sa remarque (F04.3) :** deux choix
    supprimés restaient dans « Juste après » des scènes voisines jusqu'au
    rechargement de la page, la liste étant lue à l'ouverture seulement. Elle se
    relit désormais après l'enregistrement d'un choix ajouté ou retiré, comme les
    numéros du livre (`relireVoisines`, service facultatif de la copie, donné par
    la page de scène de l'adulte ; pour un élève, la liste reste celle de
    l'ouverture). Sans migration ; parcours des scènes voisines et des choix
    repassés.
  - **Suite complète des parcours avant le commit de clôture :** 343 sur 343.
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
- **Du lecteur en ligne vers le site, question du porteur le 16 octobre 2026,
  non décidée :** aujourd'hui, l'adresse de l'application mène à l'entrée des
  enseignants ; un lien depuis le lecteur n'y conduirait une famille qu'à une
  page de connexion. Recommandé : rien avant l'ouverture ; avec la page
  d'accueil publique, une mention discrète « Écrit avec Il était une classe »,
  menant à elle, au pied de la page de titre et après la fin du livre — jamais
  pendant la lecture, ni sur la page neutre. Le lecteur est le premier aperçu du
  produit pour qui reçoit un lien (F04.2) : c'est le canal de découverte le plus
  naturel. Il touche à F12.2 (le livre ne sert pas de vitrine sans accord) et
  reste à décider avec les pages publiques.
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
- **F10 :** import
  d'images par les élèves.
- **F11 :** autres formats que l'A5 ; assemblage de la couverture ; commande
  et livraison de livres ; pages supplémentaires ; modification du fichier
  PDF et import de ses annotations ; export avec marge de rognage, à décider
  après un premier envoi.
- **F12 :** retour à une version partagée antérieure ; auteurs réglés par
  canal ; classes destinataires choisies une à une ; droits de diffusion,
  vitrine et bibliothèque (F12.2), mis de côté.
- **F13 :** réécriture créative complète d'un texte écrit (l'écriture d'une scène vide d'après sa consigne y entre le 17 octobre 2026, F13.6) ; accès des élèves à l'IA ;
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
- **Textes en retard sur les décisions :** « Statut et périmètre » des
  spécifications (choix et fidélité de l'aperçu « à vérifier », aucun
  prototype autorisé) ; brief, dont le fond date du 3 octobre (demandes de changements
  protégés encore listées comme ouvertes, « Graphe » pour « Chemins ») ;
  architecture titrée « Statut au 27 septembre ».
