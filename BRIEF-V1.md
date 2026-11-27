# V1 — Brief produit et technique

Mis à jour le 27 novembre 2026 · Nom : **Il était une classe**, décidé le 9 octobre 2026.

**Synthèse produit et technique pour reprendre le projet.** Elle dit l'essentiel
et renvoie aux documents qui font foi : les
[spécifications](docs/specifications.md) pour les règles, le
[plan](docs/plan.md) pour l'ordre de construction et ce qui reste, le
[design](docs/design.md) pour les écrans, [l'architecture](docs/architecture.md)
pour les choix techniques. L'état daté de chaque sujet est dans
[l'index V1](README.md).

**État au 27 novembre 2026 :** l'application est construite et en ligne à
`iletaituneclasse.com`. Les neuf étapes du plan sont terminées (du compte à
l'ouverture à d'autres enseignants), ainsi que les chantiers venus ensuite :
bibliothèque publique (F15), couverture faite sur le site, colonne de
navigation de l'adulte, dictée à l'adulte, liste de vérification sous la
consigne, construire dans « Chemins » et bloc de scènes de l'IA, fiche de
l'histoire à imprimer, page « Ressources », tutos de l'« Aide » et vidéos,
pages publiques pour les deux sortes de récit, trois livres d'exemple. Les
inscriptions sont ouvertes ; le livre est gratuit, l'IA payante en étoiles. La
révision d'ergonomie page par page est faite sur toute l'application ; la suite
des parcours Playwright passe en entier. Le premier vrai livre de la classe du
porteur est prévu pour janvier 2027, la V0 servant de repli.

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

**Choix techniques construits :** Next.js/React/TypeScript, édition des choix
dans le texte et schéma complémentaire (« Chemins ») ; Vercel et Supabase,
retenus le 8 octobre 2026 ([ADR 0004](docs/adr/0004-vercel-et-supabase.md)) ;
Plate pour l'éditeur, retenu le 2 octobre 2026
([ADR 0002](docs/adr/0002-plate-pour-l-editeur.md)) ; Paged.js et Chromium pour
le livre, avec un aperçu calculé côté serveur, retenus le 3 octobre 2026
([ADR 0003](docs/adr/0003-pagedjs-chromium-apercu-cote-serveur.md)). Le détail
est dans la [stack](#5-stack-de-travail) ci-dessous.

## 2. Publics et fonctionnement envisagé

Première cible recommandée : **enseignants francophones d’élémentaire**.
La France et des pays anglophones sont envisagés par le porteur ; la version
anglaise vient en dernier, quand le français est stabilisé par l'usage. Le cas de classe retenu pour concevoir les parcours est décrit dans
les [spécifications](docs/specifications.md#f064--classe-de-référence-et-postes-partagés).
Il ne constitue pas une limite d'effectif ou de niveau. Prévoir l’anglais sans
imposer un lancement bilingue immédiat.

**Nom du produit : « Il était une classe »**, décidé par le porteur le
9 octobre 2026. Il remplace « You Are a Hero », nom provisoire écarté parce
qu'il est en anglais et enferme dans le livre-jeu ; ce nom reste celui des
dossiers, des dépôts et du projet Vercel, et la maquette l'affiche encore ;
l'application affiche le nouveau nom depuis le 9 octobre 2026. Le nom assume la classe, que le porteur tient pour la
particularité du produit ; le mode personnel reste proposé, en second. Le nom
anglais retenu le 20 octobre 2026 est « Once Upon a Classroom », pour la
version anglaise à venir ; les adresses, la marque et les pages publiques sont
réglées en [F14](docs/specifications.md#f14--ouverture-offre-et-exploitation).

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
| F10 | Importer et placer des images facultatives, en bloc ou en ligne à la hauteur du texte ; opérations confiées à l'adulte pour la première livraison. Aide discrète à l'illustration par prompts prêts à copier ; images créées par l'IA pour l'adulte, en repérage et dans une scène, depuis le 17 octobre 2026. |
| F11 | Composer le livre et ses pages de présentation, le prévisualiser, modifier les scènes et régler la composition depuis l'aperçu, réexporter un PDF avec renvois cohérents ; face avant de la couverture faite sur le site depuis le 27 octobre 2026. |
| F12 | Dès la première livraison, partager volontairement un instantané du livre terminé auprès de ses classes, que les élèves lisent avec leur compte, en classe ou chez eux ; mise à jour explicite et retrait par l’adulte. Le lien de lecture seul est remplacé le 25 octobre 2026 par la bibliothèque (F15). |
| F13 | Proposer une assistance IA facultative et contextualisée, côté adulte, payée en étoiles au coût réel : préparation, consignes et liste de vérification, choix, correction, écriture d'une scène vide, bloc de scènes dans « Chemins ». |
| F14 | Ouvrir l'inscription à d'autres enseignants : étoiles pour l'IA, paiement par Stripe, conservation et suppression, sauvegarde nocturne, pages publiques, « Ressources » et tutos ; décidé le 20 octobre 2026, ouvert le 22, offre révisée le 8 novembre 2026 (livre gratuit). |
| F15 | Bibliothèque publique : un livre terminé, proposé par l'adulte après les autorisations des familles, relu par l'éditeur avec l'aide de l'IA, lisible par tous, avec des cœurs ; gratuite ; décidé le 25 octobre 2026. |

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
- L’IA générative sert l’adulte seul ; les élèves n’y ont pas accès
  ([F13](docs/specifications.md#f13--assistance-ia-facultative)).
- Publication volontaire, sans accès à l'espace de travail de la classe ni aux
  retours privés ; les pages de présentation du livre, prénoms des auteurs
  compris, y figurent par défaut selon F12.1. Un lien non
  répertorié reste transmissible ; ce n’est pas un accès privé authentifié.
  La bibliothèque publique, mise de côté en F12.2, est reprise le 25 octobre
  2026 en [F15](docs/specifications.md#f15--bibliothèque-publique-des-livres) :
  partage privé par le compte des élèves, ou public par la bibliothèque.

**Qualité indispensable :** pas d’écrasement silencieux des textes, récupération
après incident, isolation entre classes, actions accessibles au clavier, PDF lisible
avec images et renvois corrects, sauvegardes restaurables de la base et des fichiers.

## 5. Stack de travail

Un projet applicatif regroupe site public, espaces adulte/élève et lecteur.
L’éditeur fonctionne dans le navigateur ; les opérations sensibles restent côté
serveur. Les exports lourds sont traités en arrière-plan.

| Besoin | Retenu et construit |
| --- | --- |
| Application | **Next.js 16 + React 19 + TypeScript**, serveur Node.js 22, chez **Vercel** (fonctions à Paris, `cdg1`). |
| Données | **PostgreSQL** via **Supabase** (Paris, `eu-west-3`), offre gratuite tant que l'usage le permet ; sauvegarde chaque nuit vers S3, restauration éprouvée le 15 octobre 2026. |
| Comptes et fichiers | **Supabase Auth + Storage** ; connexion par Google en plus du mot de passe ; accès de classe sans adresse pour les élèves, codes chiffrés par l'application. |
| Permissions | Contrôles serveur et règles **RLS PostgreSQL**, testés contre la base. |
| Interface | Feuilles de style écrites à la main (système « Cahiers d'aventure » du [design](docs/design.md)) ; **Floating UI** pour les menus qui tiennent dans la fenêtre. shadcn et Tailwind écartés. |
| Éditeur | **Plate**. Les essais sur tablettes réelles sont mis de côté le 3 octobre 2026 : non vérifié. |
| Schéma « Chemins » | **React Flow + dagre**, versions figées, chargés à l'ouverture de « Chemins ». ELK mesuré et écarté. |
| PDF | **Paged.js + Chromium**, chez Vercel ; aperçu calculé côté serveur. Levé en ligne le 25 octobre 2026 ; reste le premier envoi à l'imprimeur (V6). |
| Courriels | **Amazon SES**, domaine d'envoi `envoi.` ; reçus par la messagerie académique (constaté le 27 novembre 2026). |
| Paiement | **Stripe Checkout**, achats uniques par carte, au nom de la micro-entreprise de l'éditeur ; vente ouverte le 23 octobre 2026. Depuis le 8 novembre 2026, seules les recharges d'étoiles se vendent ; le pass et les limites attendent l'interrupteur « Livre payant », éteint. |
| IA | **Claude** pour les textes (Opus 5.5 pour ce qui invente ou construit, Sonnet 5.5 pour le reste) ; **OpenAI** pour les images ; **ElevenLabs** (Scribe) pour la dictée. Appels côté serveur seulement. |
| Mesure | Search Console, Vercel Web Analytics et Speed Insights ; pas de Google Analytics pour l'instant. |
| Vérification | **Vitest** (tests unitaires et contre la base) et **Playwright** (parcours, lancés à la demande du porteur), complétés par inspection visuelle des PDF. |

PostgreSQL tient les relations entre projets, élèves, attributions et
versions. Supabase réduit les tâches d'exploitation sans fournir la logique
métier. Next.js réunit pages publiques et application. Plate fournit les
mécanismes d'édition, pas le bloc narratif ni le livre.

Deux prototypes jetables ont précédé la construction, sans reprise de code :
celui de l'éditeur, le 2 octobre 2026, et celui de la chaîne PDF, le
3 octobre ; leurs verdicts sont dans
[l'architecture](docs/architecture.md#vérifications-avant-décision-technique).
Les choix faits à chaque étape et les vérifications encore ouvertes sont dans
[l'architecture](docs/architecture.md) et dans le
[plan](docs/plan.md#vérifications-techniques-à-lever).

## 6. Limites et économie

**Reports confirmés :** prise en charge de la commande et de la livraison
de livres depuis l'application ; conversion des modes d'un projet selon
[F01](docs/specifications.md#f01--projet-et-responsabilité-de-ladulte). L'aide à
l'illustration par prompts prêts à copier est retenue pour la première
livraison en [F10.2](docs/specifications.md#f102--aide-à-lillustration-par-prompts) ;
la génération d'illustrations par l'IA, d'abord reportée, y entre le
17 octobre 2026 pour l'adulte, l'import d'images restant entier selon
[F10](docs/specifications.md#f10--illustrations).
La face avant de la couverture se fait sur le site depuis le 27 octobre 2026,
titre compris ; le reste de la couverture se monte dans l'outil de
l'imprimeur, selon
[F11.4](docs/specifications.md#f114--intérieur-du-livre-pages-de-présentation-et-couverture).
**Reports recommandés :** logiciel natif, hors ligne complet, communauté avec
commentaires, marketplace et moteur de jeu avancé. Import V0 non demandé.

Les énigmes, dés et compétences sont facultatifs ; l'application les
accompagne sans moteur automatique : feuille d'aventure remplie par le
lecteur, actions de jeu en texte libre et dé non interprété, selon
[F04.2](docs/specifications.md#f042--objets-de-lhistoire). Les formats du PDF ne sont pas fixés par la V0.

**Offre** ([F14](docs/specifications.md#f14--ouverture-offre-et-exploitation)) :
décidée le 20 octobre 2026, révisée le 8 novembre 2026. Le livre est gratuit
pour l'instant, sans limite, lecture et bibliothèque comprises ; un projet né
pendant cette gratuité reste sans limite. L'IA est payante en étoiles, le
crédit d'IA d'un compte, débité au coût réel : trente sont offertes à
l'inscription, la recharge de 100 étoiles coûte 5 €. Le pass par livre et les
limites (40 scènes, 10 images) restent dans le code, derrière l'interrupteur
« Livre payant », éteint. Les coûts d'exploitation sont suivis dans le
[plan](docs/plan.md#coûts). Le bénéfice à démontrer reste le temps de
préparation et de coordination économisé jusqu'au livre terminé ; la demande
payante n'est pas vérifiée.

## 7. Questions à approfondir

Les questions ouvertes sont tenues à un seul endroit, le
[plan](docs/plan.md#questions-ouvertes), et sous chaque fonctionnalité des
[spécifications](docs/specifications.md). Les grandes suites, sans décision :
le premier vrai livre de classe en janvier 2027 et ses retours d'usage, en
retouches ; le premier envoi à l'imprimeur (V6) ; faire connaître le site ;
la version anglaise, « Once Upon a Classroom », en dernier ; les idées pour le
cycle 2. Chaque chantier se construit sur instruction du porteur, après un
entretien court quand une règle change.

La méthode d'entretien et les règles documentaires sont dans [CLAUDE.md](../CLAUDE.md).
