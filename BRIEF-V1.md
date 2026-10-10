# V1 — Brief produit et technique

Mis à jour le 8 octobre 2026 pour l'hébergement, la base et le plan, le reste au 3 octobre · Nom : **Il était une classe**, décidé le 9 octobre 2026.

**Synthèse produit et technique pour reprendre le projet.** Les décisions de
l'entretien `grill-with-docs` sont consolidées et le cadrage d'ensemble est
clôturé à la demande du porteur. Le premier parcours, de la préparation du
projet à l'accès effectif des élèves aux scènes, est validé le 28 septembre 2026.
Sa conception visuelle couvre les quatre situations prévues. Le retour favorable
sur la planche d'ambiance et l'organisation du récit a autorisé la déclinaison
du suivi, de l'espace élève et de la préparation projetée, selon le
[design](docs/design.md). Les détails visuels restent proposés. Le
deuxième parcours de rédaction et de révision est validé dans son ensemble
le 28 septembre 2026, selon les
[spécifications](docs/specifications.md#f07--révision-et-validation), avec ses
points différés. Sa conception visuelle est autorisée. Le troisième parcours,
« tester la lecture et composer le livre », de la vérification des chemins au
PDF définitif, est validé dans son ensemble le 30 septembre 2026 selon
[F09](docs/specifications.md#f09--test-de-lecture-et-cohérence-du-récit) et
[F11](docs/specifications.md#f11--composition-et-préparation-du-livre), avec
ses points différés ; ses écrans sont proposés dans la maquette de synthèse.
Le quatrième parcours, « partager une version terminée et la lire en ligne »,
est validé dans son ensemble le 1er octobre 2026 selon
[F12.1](docs/specifications.md#f121--partager-une-version-du-récit) et
[F12.3](docs/specifications.md#f123--lecture-des-anciens-livres-par-les-autres-classes),
avec ses points différés ; ses écrans sont proposés dans la maquette de synthèse.
Le cinquième parcours, « créer et modifier les choix dans la scène », est
validé dans son ensemble le 2 octobre 2026 selon
[F05.2](docs/specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène)
et F06.1, avec ses points différés ; ses écrans sont proposés dans la
maquette de synthèse depuis le même jour, avec un retour favorable d'ensemble.
Les autres parcours seront approfondis avant leur réalisation.
Les documents actifs sont référencés dans [l’index V1](README.md).
La gestion des classes par année depuis le compte enseignant et l'aide IA
aux embranchements sont retenues, ainsi que la réutilisation des profils élèves,
la lecture volontaire des livres terminés entre classes et le repérage des
scènes avec aperçu. Les propositions encore ouvertes conservent leur statut.
Aucun développement V1 n’est lancé.

## 1. Intention et décisions

Créer une **application web pour préparer et écrire un récit, seul ou en classe,
jusqu’au PDF prêt à imprimer**, avec lecture en ligne et partage facultatifs.
La priorité est de rendre la préparation et les embranchements accessibles à un
enseignant novice, puis de faciliter la rédaction collective et la fabrication du livre.

Le porteur enseigne en élémentaire : quatre ans de création de récits avec sa classe
et un retour d’usage de la V0. Il développe seul avec l’aide de l’IA. Les revenus
sont souhaitables, mais l’utilité pour sa classe suffit à justifier le projet.
Aucun délai, budget chiffré ou objectif de revenus n’est fixé.

**Décisions confirmées :**

- V0 désigne l’existant ; V1 repart entièrement de zéro, sans reprise de code,
  composants, schémas ou architecture V0. Seuls les enseignements d’usage servent.
- Application web : plusieurs élèves doivent travailler depuis différents postes
  simultanément. La coédition d’un même texte reste une question distincte.
- PDF prêt à imprimer obligatoire ; commande et livraison de livres reportées.
- Documentation et clarification des besoins avant développement.

**Accord de principe :** Next.js/React/TypeScript, édition des choix dans le
texte et graphe complémentaire. **Vercel et Supabase sont retenus le
8 octobre 2026** ([ADR 0004](docs/adr/0004-vercel-et-supabase.md)). **Plate est retenu pour
l'éditeur le 2 octobre 2026**, après le prototype ([ADR 0002](docs/adr/0002-plate-pour-l-editeur.md)).
**Paged.js et Chromium sont retenus pour le livre le 3 octobre 2026**, avec un
aperçu calculé côté serveur ([ADR 0003](docs/adr/0003-pagedjs-chromium-apercu-cote-serveur.md)).
Les détails de réalisation et le périmètre exact de la première livraison restent ouverts.

## 2. Publics et fonctionnement envisagé

Première cible recommandée : **enseignants francophones d’élémentaire**.
La France et des pays anglophones sont envisagés par le porteur ; ces derniers
et l'ordre de lancement restent à préciser. Le cas de classe retenu pour concevoir les parcours est décrit dans
les [spécifications](docs/specifications.md#f064--classe-de-référence-et-postes-partagés).
Il ne constitue pas une limite d'effectif ou de niveau. Prévoir l’anglais sans
imposer un lancement bilingue immédiat.

**Nom du produit : « Il était une classe »**, décidé par le porteur le
9 octobre 2026. Il remplace « You Are a Hero », nom provisoire écarté parce
qu'il est en anglais et enferme dans le livre-jeu ; ce nom reste celui des
dossiers, des dépôts et du projet Vercel, et la maquette l'affiche encore ;
l'application affiche le nouveau nom depuis le 9 octobre 2026. Le nom assume la classe, que le porteur tient pour la
particularité du produit ; le mode personnel reste proposé, en second. Le nom
anglais n'est pas décidé. Les adresses, la marque et les pages publiques
relèvent de [l'étape 9 du plan](docs/plan.md#étape-9--ouverture-à-dautres-enseignants).

Deux axes indépendants, dans le même outil :

| Organisation | Type de récit |
| --- | --- |
| **Personnel** : un auteur adulte gère son projet. | **Classique** : lecture dans un ordre défini, sans renvois de choix. |
| **Classe** : l’enseignant attribue le travail, accompagne et valide ; les élèves rédigent dans leur périmètre. | **À choix** : scènes reliées par des options, avec convergences et fins. |

Ces quatre combinaisons sont retenues dès la première livraison. Les modes
sont choisis à la création et ne sont pas convertibles dans cette livraison,
selon [F01](docs/specifications.md#f01--projet-et-responsabilité-de-ladulte).
Le lecteur accède seulement à la version partagée.
Le parcours des scènes écrites directement par l'adulte, sans circuit de
validation du travail élève, est précisé en
[F11.1](docs/specifications.md#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre).

**Retour d’usage antérieur à améliorer :** la classe imagine l’univers et le héros, prépare
les chapitres attribués à un élève ou un binôme, puis les obstacles. L’enseignant
construit les liens et les consignes ; les élèves rédigent. Les difficultés majeures
sont les choix narratifs pertinents et les organigrammes. L’IA aide déjà efficacement
aux consignes, moins aux subtilités des choix dans l’expérience du porteur.

La structure V1 est désormais histoire → parties → chapitres → scènes.
Le chapitre est l'unité d'attribution et de lecture en classe ; les règles
sont dans [F03/F06](docs/specifications.md#f031--histoire-parties-chapitres-et-scènes).
Le récit classique suit l'ordre des parties, chapitres puis scènes.

## 3. Parcours et fonctionnalités

**Parcours :** cadrer → imaginer univers/personnages/enjeu → préparer la trame, les
parties et les chapitres → structurer scènes et choix → attribuer et donner les consignes →
rédiger/réviser → tester → composer → exporter et éventuellement partager.

Ce sont des repères souples, pas des écrans obligatoires. La préparation peut
être abrégée si elle existe déjà ; les illustrations peuvent avancer en parallèle.
La préparation et la page des parties et chapitres présentent le même plan du récit,
sans seconde liste d'étapes à convertir ou à synchroniser, selon
[F02](docs/specifications.md#f02--préparer-le-récit-et-les-décisions-communes).

| ID | Fonctionnalité attendue |
| --- | --- |
| F01 | Créer et retrouver ses projets, avec les modes retenus. |
| F02 | Préparer univers, personnages et trame ; préparation unique accessible à l'enseignant, seul ou pendant l'atelier projeté, utile à la rédaction et à l'IA. |
| F03 | Organiser parties, chapitres et scènes sans imposer la manipulation d’un graphe. |
| F04 | Rédiger dans un éditeur simple ; ajouter choix et images directement dans le texte. |
| F05 | Relier une option à une scène existante ou nouvelle ; visualiser l’ensemble des liens. |
| F06 | Gérer classe, accès élèves sans email personnel, attributions à un ou plusieurs élèves et avancement. |
| F07 | Fournir les consignes et fiches de rédaction imprimables, commenter, faire réviser et valider ; distinguer texte source et texte final. Encouragements de l'enseignant aux textes des élèves, comptés par élève. |
| F08 | Sauvegarder automatiquement, afficher l’état de sauvegarde et récupérer des versions. |
| F09 | Tester la lecture ; signaler textes manquants, destinations invalides et scènes inaccessibles, y compris pour les liaisons cachées par énigme. |
| F10 | Importer et placer des images facultatives, en bloc ou en ligne à la hauteur du texte ; opérations confiées à l'adulte pour la première livraison. Aide discrète à l'illustration par prompts prêts à copier, sans génération intégrée. |
| F11 | Composer le livre et ses pages de présentation, le prévisualiser, modifier les scènes et régler la composition depuis l'aperçu, réexporter un PDF avec renvois cohérents ; assemblage de couverture reporté. |
| F12 | Dès la première livraison, partager volontairement un instantané du livre terminé, par un lien de lecture sans compte ou auprès de ses classes ; mise à jour explicite et retrait par l’adulte. |
| F13 | Proposer une assistance IA facultative, contextualisée et plafonnée. |
| F14 | Proposer une découverte et une offre payante adulte ; forme et limites à définir. |

Cette liste guide la spécification ; elle ne fixe pas la priorité ni tous les détails.
Les règles en cours de précision pour la préparation, les fiches de rédaction,
l'organisation, les attributions,
la révision, la sauvegarde, le test de lecture, les finitions pour le livre, la diffusion
et les aides IA à la préparation, aux consignes, aux choix et à la correction
sont dans les [spécifications fonctionnelles](docs/specifications.md).

## 4. Édition et règles essentielles

**`/choix` :** saisir le libellé de l’option, sélectionner sa destination, créer
une scène ou laisser la destination à décider. La phrase de choix, composée automatiquement ou écrite par l’auteur,
apparaît dans le récit avec son renvoi, et la liaison dans le graphe, sans
seconde saisie ; voir [F05](docs/specifications.md#f05--retrouver-les-scènes-et-relier-les-choix). **`/image` :** insérer une image et régler sa présentation sur place.
Les mêmes actions sont accessibles par un bouton visible, notamment sur tablette.

Une vue d’ensemble reste disponible à côté du texte, dans les limites d'accès
de l'utilisateur. L'adulte peut aussi retrouver la préparation ; sa page
n'est pas accessible aux élèves.
Créer des liens plus facilement ne garantit pas une histoire cohérente.

- Un lien utilise une identité stable de scène ; ni son titre ni son numéro imprimé.
- Éditeur, graphe, lecture et PDF représentent le même récit, sans structures divergentes.
- Les droits d’écriture et de modification des choix sont distincts et contrôlés
  côté serveur, y compris pour les collages et suppressions.
- Brouillon, texte final et édition publiée sont distincts. Modifier un brouillon
  ne change pas silencieusement le livre partagé.
- Copier-coller, déplacer, supprimer et annuler un choix doivent préserver les liens.
- L’IA s’appuie sur les décisions retenues et le contexte autorisé. L’humain arbitre ;
  aucune validation ou publication automatique. L’app fonctionne sans IA.
- Pour l’offre élémentaire française envisagée, l’IA générative est orientée côté
  enseignant. Le pays et le périmètre d’assistance restent à préciser.
- Publication volontaire, sans accès à l'espace de travail de la classe ni aux
  retours privés ; les pages de présentation du livre, prénoms des auteurs
  compris, y figurent par défaut selon F12.1. Un lien non
  répertorié reste transmissible ; ce n’est pas un accès privé authentifié.
  Les droits de diffusion, l'éventuelle vitrine et la bibliothèque sont mis
  de côté pour l'instant à la demande du porteur, sans retirer le lecteur partagé,
  selon [F12](docs/specifications.md#f122--droits-de-diffusion-et-éventuelle-vitrine-du-site).

**Qualité indispensable :** pas d’écrasement silencieux des textes, récupération
après incident, isolation entre classes, actions accessibles au clavier, PDF lisible
avec images et renvois corrects, sauvegardes restaurables de la base et des fichiers.

## 5. Stack de travail

Un projet applicatif regroupe site public, espaces adulte/élève et lecteur.
L’éditeur fonctionne dans le navigateur ; les opérations sensibles restent côté
serveur. Les exports lourds sont traités en arrière-plan.

| Besoin | Orientation et statut |
| --- | --- |
| Application | **Next.js + React + TypeScript**, serveur Node.js — accord de principe. |
| Données | **PostgreSQL** via **Supabase**, en souscription directe — retenu le 8 octobre 2026 ; offre gratuite jusqu'à l'ouverture. |
| Comptes et fichiers | **Supabase Auth + Storage** — retenus le 8 octobre 2026 ; accès scolaires mis en œuvre à l'étape 1 du plan, le 9 octobre 2026 ([architecture](docs/architecture.md#réalisation-de-létape-1-9-octobre-2026)). |
| Permissions | Contrôles serveur et règles **RLS PostgreSQL** à écrire et tester. |
| Interface | **Tailwind CSS + shadcn/ui** — proposés. |
| Éditeur | **Plate** — retenu le 2 octobre 2026 après prototype ; essais sur tablettes réelles mis de côté le 3 octobre 2026, non vérifiés. |
| Graphe | **React Flow** — proposé comme représentation du récit. |
| PDF | **Paged.js + HTML/CSS + Chromium** — retenu le 3 octobre 2026 après prototype, avec un aperçu calculé côté serveur ; Chromium de Linux et hébergement encore à éprouver. |
| Hébergement | **Vercel** décidé le 8 octobre 2026 pour l'application, à son adresse par défaut ; région et lieu d'exécution du PDF selon le [plan](docs/plan.md#décisions-de-fournisseur) ; **Render** reste l'alternative pour le PDF. |
| Paiement | **Stripe Checkout** — proposé pour l’ouverture commerciale. |
| IA | API côté serveur ; fournisseur et modèle à choisir sur les tâches réelles. |
| Vérification | **Vitest + Playwright**, complétés par inspection visuelle des PDF. |

PostgreSQL est préféré pour les relations entre projets, élèves, attributions et
versions. Supabase réduit les tâches d’exploitation sans fournir notre logique
métier. Next.js réunit pages publiques et application ; garder le rendu et le cache
simples. Plate fournit les mécanismes d’édition, pas notre bloc narratif ni le livre.

**À vérifier avant de figer l’implémentation :** bloc choix et ses annulations/collages,
permissions élèves, sauvegarde concurrente et PDF d’un livre représentatif.
Le prototype jetable de l'éditeur du 2 octobre 2026 a éprouvé les trois
premiers sujets avec Plate ; ses verdicts et réserves, tablettes réelles
comprises, sont dans [l'architecture](docs/architecture.md#résultats-du-prototype-de-léditeur-2-octobre-2026).
Le prototype jetable de la chaîne PDF du 3 octobre 2026 a éprouvé le dernier
sur un livre d'essai de 145 pages ; ses verdicts et ses mesures sont dans
[l'architecture](docs/architecture.md#résultats-du-prototype-pdf-3-octobre-2026),
et le choix qui en découle dans [l'ADR 0003](docs/adr/0003-pagedjs-chromium-apercu-cote-serveur.md).
Aucun schéma SQL, fournisseur IA, abonnement ou version de dépendance n’est arrêté.
La comparaison des fournisseurs, les faits vérifiés et les limites à éprouver
sont dans [l'architecture](docs/architecture.md).
Le besoin d'identité visuelle durable, la méthode de conception proposée et
l'éventuel achat de composants sont dans [les intentions de design](docs/design.md).
La direction du carnet d'aventure illustré et les situations d'écran du
premier parcours sont retenues dans ce document de design ; leurs déclinaisons
restent à préciser. Aucun template n'est choisi.

## 6. Limites et économie

**Reports confirmés :** prise en charge de la commande et de la livraison
de livres depuis l'application ; conversion des modes d'un projet selon
[F01](docs/specifications.md#f01--projet-et-responsabilité-de-ladulte) ; génération
d'illustrations IA intégrée après la première livraison, avec import d'images
conservé selon [F10](docs/specifications.md#f10--illustrations). L'aide à
l'illustration par prompts prêts à copier est retenue pour la première
livraison en [F10.2](docs/specifications.md#f102--aide-à-lillustration-par-prompts).
L'assemblage de la couverture est reporté ; la première livraison se limite à
un prompt d'illustration de couverture et à une aide pour l'outil de l'imprimeur,
selon [F11.4](docs/specifications.md#f114--intérieur-du-livre-pages-de-présentation-et-couverture).
**Reports recommandés :** logiciel natif, hors ligne complet, communauté avec
commentaires, marketplace et moteur de jeu avancé. Import V0 non demandé.

Les énigmes, dés et compétences sont facultatifs ; l'application les
accompagne sans moteur automatique : feuille d'aventure remplie par le
lecteur, actions de jeu en texte libre et dé non interprété, selon
[F04.2](docs/specifications.md#f042--objets-de-lhistoire). Les formats du PDF ne sont pas fixés par la V0.

**Hypothèse économique à arbitrer :** découverte limitée, lecture gratuite,
offre adulte avec élèves et réexports inclus, IA facultative payante au-delà d’un
quota. Licence annuelle ou pass projet restent ouverts ; aucun prix retenu.
Conservation des œuvres et coûts d’exploitation doivent être définis.
Le bénéfice commercial à démontrer est le temps de préparation et de coordination
économisé jusqu’au livre terminé ; la demande payante reste à vérifier.

## 7. Questions à approfondir

Le cadrage d'ensemble et le premier parcours approfondi sont validés, selon
les décisions consignées dans les spécifications. Les propositions encore
ouvertes gardent leur statut.
Les approfondissements suivants ne rouvrent pas les décisions acquises ;
leur [point d'entrée](docs/specifications.md#suite-de-lentretien-et-couverture-restante)
renvoie aux sections de référence.

1. **Conditions d'usage :** pays anglophones envisagés et ordre de lancement,
   caractéristiques des appareils, rythme des
   séances et taille habituelle du livre ; classe de référence retenue dans les spécifications.
2. **Collaboration :** le parcours de référence retient plusieurs élèves sur des
   scènes distinctes. Attributions par chapitre, profils et prises en charge sont
   précisés progressivement dans les [spécifications](docs/specifications.md).
   L'inscription initiale en lot, la connexion classe puis élève et le
   changement d'élève sur poste partagé sont acquis en F01.1/F06.4. Les
   détails de récupération des accès et de gestion des sessions restent à préciser.
   L'organisation par enseignant et classe annuelle est retenue ; la
   réutilisation des profils élèves est également confirmée en
   [F01.1](docs/specifications.md#f011--classes-années-et-éventuel-espace-école).
3. **Récit et éditeur :** la structure, l'accès par chapitre et les vues Scènes/Graphe
   sont acquis en F03/F06 ; la création et la modification des choix dans la
   scène sont précisées en [F05.2](docs/specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène).
   Restent notamment les effets des déplacements et suppressions de scènes.
   Objets, feuille d'aventure, actions de jeu et dé sont décidés en
   [F04.2](docs/specifications.md#f042--objets-de-lhistoire), sans vérification. Les conversions de
   modes sont reportées après la première livraison.
4. **Révision et diffusion :** historique et demandes de changements protégés.
   Le partage, ses accès et la présentation du lecteur en ligne sont validés en
   F12.1/F12.3. Le test de lecture, les contrôles bloquants,
   le format et la composition du PDF sont validés en F09/F11. Les règles
   de composition laissées ouvertes par le prototype PDF sont décidées et
   validées dans leur ensemble le 3 octobre 2026 en F10 et F11 ; restent un premier envoi chez l'imprimeur
   et le délai de l'aperçu calculé côté serveur.
   L'étude des droits de diffusion, de la vitrine et de la bibliothèque est différée
   à la demande du porteur ; elle ne fait pas partie des prochains arbitrages.
5. **Périmètre V1 :** dictée vocale à étudier, détails
   des aides IA retenues et calendrier de l'anglais ; les quatre combinaisons
   de modes sont acquises pour la première livraison.
   L'aide IA aux choix et à leurs destinations est retenue selon
   [F13.3](docs/specifications.md#f133--aide-à-concevoir-les-choix-et-leurs-destinations).
6. **Exploitation :** budget, limites, sauvegardes, support, essai, paiement et conservation.

Les réponses sont transformées en critères d’acceptation dans les
spécifications ; l'ordre de construction, les deux seuils « ma classe » et
« ouverture » et ce qui reste à régler avant chaque étape sont dans le
[plan de réalisation](docs/plan.md), validé le 8 octobre 2026. Ce plan
n'autorise pas le développement.

La méthode d’entretien et les règles documentaires sont dans [CLAUDE.md](../CLAUDE.md).
