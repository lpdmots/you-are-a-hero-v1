# V1

Point d'entrée : [brief produit et technique](BRIEF-V1.md).
Les règles de collaboration et de rédaction sont dans [CLAUDE.md](../CLAUDE.md).

## État de reprise au 10 octobre 2026

Le cadrage général est clôturé. Cinq parcours sont validés dans leur
ensemble, chacun avec ses points différés. La
[maquette de synthèse](maquettes/synthese/index.html) propose leurs écrans ;
ses dispositions restent des propositions à examiner. Un
[plan de réalisation](docs/plan.md) est validé le 8 octobre 2026 ; chaque
étape se construit sur instruction du porteur. **L'étape 1 est terminée le
10 octobre 2026** (compte, projets, classes, accès des élèves), après
l'essai du porteur : son code est dans [`app/`](app/README.md), son
avancement et les règles sorties de l'essai dans le
[plan](docs/plan.md#étape-1--sinstaller--compte-projets-classes-accès-des-élèves),
ses choix techniques dans
[l'architecture](docs/architecture.md#réalisation-de-létape-1-9-octobre-2026).
**L'étape 2 est autorisée le 10 octobre 2026**, pour elle seule : son
entretien est fait et validé dans son ensemble le même jour, et elle est
construite puis mise en ligne le même jour (préparation et atelier projeté,
parties, chapitres et scènes, attribution, corbeille, départ et fins, images
de repérage, côté élève) ; il lui reste l'essai du porteur ;
voir le
[plan](docs/plan.md#étape-2--préparer-et-organiser-le-récit) et
[l'architecture](docs/architecture.md#réalisation-de-létape-2-10-octobre-2026).
L'étape 3 n'est pas autorisée. Aucun achat n'est lancé. La V1
repart de zéro ; la V0 reste une référence d'usage uniquement, et les deux
prototypes jetables n'ont servi que par leurs verdicts. Les
propositions, détails différés et inconnues techniques conservent leur
statut explicite.

Cette section dit où en est chaque sujet et renvoie au document qui en porte
le détail ; elle ne raconte pas les séances.

### Parcours et règles

- **Préparer un projet de classe et ouvrir la première séance d'écriture**
  (premier parcours) : validé dans son ensemble, avec les variantes
  personnel/classe et classique/choix.
- **Rédiger une scène, la faire relire, la reprendre et la valider**
  (deuxième parcours) : validé dans son ensemble le 28 septembre 2026. Les
  décisions et questions différées sont dans
  [F07](docs/specifications.md#f07--révision-et-validation), avec F04/F05
  pour l'éditeur et F08 pour la sauvegarde ; les points différés restent
  ouverts.
- **Tester la lecture et composer le livre** (troisième parcours) : validé
  dans son ensemble le 30 septembre 2026, de la vérification des chemins au
  PDF définitif. Règles en
  [F09](docs/specifications.md#f09--test-de-lecture-et-cohérence-du-récit) et
  [F11](docs/specifications.md#f11--composition-et-préparation-du-livre),
  avec les liaisons cachées de
  [F05.1](docs/specifications.md#f051--liaisons-cachées-par-énigme) et les
  images de [F10](docs/specifications.md#f10--illustrations). Les points
  différés et les vérifications techniques (aperçu fidèle au PDF, édition
  d'une phrase de choix) restent ouverts. Compléments décidés depuis :
  - **Forme des choix**, révisée le 1er octobre 2026 en
    [F05](docs/specifications.md#f05--retrouver-les-scènes-et-relier-les-choix) :
    phrase de choix avec renvoi, automatique ou personnalisée, identique
    dans le livre et à l'écran.
  - **Règles de composition du livre**, laissées ouvertes par le prototype
    PDF, décidées en entretien et validées dans leur ensemble le 3 octobre
    2026, avec leurs points différés : coupures, alignement et césure,
    images laissées où l'auteur les pose, éditeur de la scène ouvert depuis
    l'aperçu, commandes de passage et repérage des pages peu remplies, pages
    de présentation en modèle ou en image, numéros de page et dés imprimés,
    gravité des problèmes de mise en page, taille de page et marges ; voir
    [F10](docs/specifications.md#f10--illustrations) et
    [F11.2](docs/specifications.md#f112--pdf-de-travail-et-pdf-définitif) à
    [F11.5](docs/specifications.md#f115--ordre-imprimé-et-numérotation-du-récit-à-choix).
    La correction sur place de l'aperçu, décidée le 30 septembre, y est
    remplacée par l'éditeur complet de la scène ; les renvois se suivent
    d'un clic dans l'aperçu, à toutes les étapes (F11.2). La définition
    conservée des images et le cas d'une largeur réglée qui ne tient pas
    dans la page sont décidés le même jour en F10.
  - **Passage suggéré** pour combler le blanc d'une page peu remplie, trois
    candidats au plus, en première livraison si l'essai de composition
    confirme les hauteurs ; seuil proposé d'une page peu remplie : un quart
    ([F11.3](docs/specifications.md#f113--présentation-commune-du-livre)).
  - **Ordre des passages :** l'agencement, nommé « Réordonner les
    passages » à l'écran, entre dans la première livraison et se relance à
    la demande ; le nouveau mélange sur demande est retiré
    ([F11.5](docs/specifications.md#f115--ordre-imprimé-et-numérotation-du-récit-à-choix)).
  - **Parcours guidé du livre**, décidé les 3 et 4 octobre 2026 et révisé
    après trois critiques d'ergonomie de la maquette (25/40 et 21/40, puis
    29/40 et 27/40 deux fois) : trois temps — relire, vérifier les chemins,
    mettre en page — et une étape d'arrivée, « Imprimer et partager » ;
    « Relire » et « Vérifier les chemins » ouverts dès le début, « Mettre en
    page » quand ils sont terminés, « Imprimer et partager » après la
    déclaration « La mise en page me convient », sans passe-droit, une étape
    ouverte ne se refermant pas ; tâches aux deux premières étapes, terminées par une
    déclaration de l'adulte ; « Mettre en page » en deux volets,
    « Réglages » et « Aperçu » ; avertissements acceptés ; doute sur l'ordre
    des passages ; aide à l'ouverture d'une étape ; réglages répartis entre
    la préparation et « Mettre en page » ; deux temps en récit classique.
    Tout est en
    [F11.6](docs/specifications.md#f116--trois-temps-pour-préparer-le-livre),
    qui donne aussi ce que ces règles ont remplacé. Règles voisines : scènes
    à finir renvoyées au Suivi et scène déclarée prête depuis la scène
    ([F11.1](docs/specifications.md#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre)),
    ou exclue depuis son menu
    ([F11.2](docs/specifications.md#f112--pdf-de-travail-et-pdf-définitif)) ;
    défauts d'écriture d'une scène à finir non signalés
    ([F09.2](docs/specifications.md#f092--contrôles-des-chemins-avant-le-pdf-définitif)).
- **Partager une version terminée et la lire en ligne** (quatrième
  parcours) : validé dans son ensemble le 1er octobre 2026 en
  [F12.1](docs/specifications.md#f121--partager-une-version-du-récit) et
  [F12.3](docs/specifications.md#f123--lecture-des-anciens-livres-par-les-autres-classes) ;
  F12.2 reste différé. La copie datée du partage est confirmée le 3 octobre.
  Le même jour, la version partagée montre par défaut les mêmes pages de
  présentation que le livre, prénoms et ligne de classe compris : la
  désactivation par défaut du 1er octobre est remplacée.
- **Créer et modifier les choix dans la scène** (cinquième parcours) :
  approfondi le 1er octobre 2026 en
  [F05.2](docs/specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène)
  et F06.1 — paragraphe de choix, destination à décider plus tard, panneau
  de modification, copier-coller, liaison cachée depuis la scène, blocs
  protégés et variantes —, validé dans son ensemble le 2 octobre 2026.
- **Objets, feuille d'aventure, actions de jeu et dé :** décidés le
  2 octobre 2026 en [F04.2](docs/specifications.md#f042--objets-de-lhistoire)
  pour la première livraison, sans vérification par l'application ; validés
  dans leur ensemble le même jour. Les propositions de F04.2 sont arbitrées ;
  restent ses questions ouvertes.
- **Aperçu des scènes voisines pendant l'écriture :** décidé le 2 octobre
  2026 en
  [F04.3](docs/specifications.md#f043--aperçu-des-scènes-voisines-pendant-lécriture).
- **Encouragements de l'enseignant** (trois catégories, classement
  optionnel) : décidés le 2 octobre 2026 pour la première livraison en
  [F07.5](docs/specifications.md#f075--encouragements-de-lenseignant) ; leur
  parcours détaillé et leurs écrans restent à préciser.
- **Suivi du travail et navigation de l'adulte :** besoins et deux
  sélections par élève confirmés en
  [F06.5](docs/specifications.md#f065--suivi-du-travail-et-accès-aux-scènes).
  Après une critique d'ergonomie (22/40 pour chacune des deux lectures), le
  porteur décide le 4 octobre 2026 : un suivi par projet, le suivi de tous
  les projets étant retiré ; une barre du haut globale qui porte le nom du
  dernier projet ouvert, et l'arrivée dans ce projet à son dernier onglet ;
  de grandes cartes dans « Mes projets », avec le pourcentage des scènes
  prêtes ; un retour au Suivi depuis la scène ; le rappel des élèves sans
  chapitre, en lien et non en filtre, sans l'état des accès ni décompte des
  scènes sans consigne ; « Texte vide » affiché pour une scène
  sans texte, sans changer les états de F07, et depuis le même jour partout
  où l'état se lit (page de scène, chapitre, graphe). Une deuxième critique, après
  la reprise de la maquette, donne 28/40 et 25/40 ; le porteur décide alors
  qu'un écran d'aide s'affiche à l'ouverture du Suivi, comme à une étape du
  Livre, avec « Ne plus afficher » et un bouton « Aide », et écarte
  l'ancienneté des remises et le tri par la plus ancienne. Une troisième
  critique, qu'il demande ensuite, donne 29/40 et 28/40 ; il décide que
  « Voir », sur la carte du projet, n'ouvre pas l'écran d'aide.
  Restent ouverts : le suivi en mode personnel, les propositions de la
  maquette listées en F06.5.
- **Fiches de rédaction :** le 4 octobre 2026, une feuille compacte qui
  liste les scènes choisies remplace une feuille par scène ; l'élève écrit
  sur son cahier. Un réglage fait une feuille par chapitre ou par élève, un
  autre les imprime à la suite, à découper ; une scène sans consigne n'y
  figure pas ; un élève choisi n'imprime que sa feuille. Après la troisième
  critique du Suivi : en « par élève », on tire les scènes déjà prises, ou
  toutes, celles sans élève étant alors réparties à parts égales entre les
  élèves du chapitre ; ce partage ne devient une prise en charge qu'à
  l'impression, après un message de demande
  ([F07.4](docs/specifications.md#f074--fiches-de-rédaction-pour-le-travail-sur-papier),
  [F06.3](docs/specifications.md#f063--prise-en-charge-et-signalement-du-travail)).
- **État de la scène et page de scène :** après une critique d'ergonomie
  de la page de scène ouverte par l'enseignant (23/40 pour chacune des deux
  lectures), le porteur décide le 4 octobre 2026 : l'enseignant met la scène
  dans l'état qu'il veut, depuis n'importe quel état, « À valider » compris
  sans remise
  ([F07.1](docs/specifications.md#f071--du-travail-préparatoire-au-travail-élève-validé)) ;
  la remarque de reprise est facultative (F07.3) ; « Validé » et « Prête »
  sont les seuls noms des deux jalons, « Prête » se retire, et le geste est
  le choix de l'état, le même dans la page de scène et à côté de l'aperçu ;
  une scène sans élève a trois états, « En cours », « Validé » et « Prête »
  ([F11.1](docs/specifications.md#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre)) ;
  l'enseignant peut s'attribuer une scène, qu'un élève ne peut alors ni
  écrire ni reprendre
  ([F06.3](docs/specifications.md#f063--prise-en-charge-et-signalement-du-travail)).
  La récupération d'un conflit de sauvegarde est décidée en entretien et
  validée dans son ensemble le 7 octobre 2026 : texte gardé à part dans un onglet de la page de scène,
  « Ne plus garder ce texte » ou « Mettre ce texte dans la scène », seul
  l'élève concerné arrêté sur cette scène jusqu'à ce geste, ligne de rappel
  au Suivi
  ([F08.1](docs/specifications.md#f081--écritures-concurrentes)). Ses
  écrans sont dessinés le même jour dans la maquette de synthèse, en
  dispositions proposées, sans retour du porteur ; deux règles sont
  tranchées avant le dessin : un texte sorti de la scène par un échange
  s'appelle toujours « Ancien texte de la scène » et n'arrête personne, et
  l'élève arrêté ne peut ni prendre ni rendre la scène ; voir
  [Conflit de sauvegarde : écrans de F08.1](docs/design.md#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026).
  Captures 315 à 337.
  Restent ouverts : « Validé » en mode personnel, qui garde deux
  états pour l'instant ; la place au Suivi d'une scène que l'enseignant
  s'attribue. Le rappel avant « prête », affiché sur place, et le maintien
  de l'état d'une scène déjà remise que l'enseignant s'attribue sont
  confirmés le même jour.
- **Côté élève :** après une critique d'ergonomie de ce que fait un élève
  seul devant l'ordinateur (22/40 pour la lecture informée, 21/40 pour une
  lecture indépendante), le porteur décide le 5 octobre 2026 : l'élève
  retire son propre signalement tant que la scène s'écrit, et une reprise
  s'annule
  ([F06.3](docs/specifications.md#f063--prise-en-charge-et-signalement-du-travail)) ;
  la modification après validation se demande à l'oral en première
  livraison, sans demande dans l'application
  ([F07.2](docs/specifications.md#f072--propositions-et-changements-protégés)) ;
  un conflit de sauvegarde arrête l'écriture de l'élève, un simple échec le
  laisse continuer, et l'écran dit quoi faire
  ([F08.1](docs/specifications.md#f081--écritures-concurrentes)). Le retour
  de l'enseignant mis en avant à la première ouverture d'une scène à
  reprendre, idée du porteur, est à l'essai
  ([F07.3](docs/specifications.md#f073--retours-de-révision)). Il confirme
  ensuite, le même jour : l'oral aussi pour les demandes d'ajout ou de
  suppression de scène (F07.2) ; pour un élève, le lieu sans la référence à
  côté d'une phrase de choix
  ([F05.2](docs/specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène)) ;
  pas de remise d'un texte vide
  ([F07.1](docs/specifications.md#f071--du-travail-préparatoire-au-travail-élève-validé)).
  Reste à entendre auprès d'élèves : « remettre » ou « donner ».
- **Organisation du récit côté adulte :** après une critique d'ergonomie de
  « Parties et chapitres », de la page d'un chapitre et de son graphe
  (23/40 pour la lecture informée, 22/40 pour une lecture indépendante), le
  porteur décide le 6 octobre 2026 : la carte ouvre le chapitre, et un menu
  à trois points porte ses commandes, sur la carte comme dans la page ; le
  chapitre est le plan et le Suivi le travail, si bien que les filtres et la
  sélection de scènes quittent la page du chapitre ; « Supprimer » et
  « Corbeille du projet » nomment le retrait récupérable ; « Monter » et
  « Descendre » règlent l'ordre dans le chapitre, jusqu'au 10 octobre, où le
  glisser-déposer les remplace ; le déplacement entre
  chapitres est différé ; « À compléter » informe par des liens, sans
  filtre ni décompte des consignes ; la vue Graphe s'appelle « Chemins » à
  l'écran, et un choix s'y suit d'un chapitre à l'autre ; un écran d'aide
  s'affiche à l'ouverture
  ([F03.1](docs/specifications.md#f031--histoire-parties-chapitres-et-scènes)).
  Départ et fin se posent dans le menu de la scène
  ([F03.2](docs/specifications.md#f032--départ-du-récit-à-choix-et-fins-explicites)) ;
  un chapitre s'exclut du livre depuis son menu
  ([F11.2](docs/specifications.md#f112--pdf-de-travail-et-pdf-définitif)) ;
  le visuel par défaut évite de se répéter dans une partie
  ([F10.1](docs/specifications.md#f101--images-de-repérage-du-projet)).
  Il confirme ensuite, le même jour, les précisions de la reprise :
  suppression sans confirmation d'un élément sans texte, corbeille sans
  durée limite, seul chapitre d'une partie non supprimable, menu de la
  partie, chapitre que l'enseignant écrit seul, décompte « hors du livre ».
  Après une seconde lecture indépendante (25/40), il confirme : une scène
  nommée par sa référence suivie de son titre dans les dialogues et les
  messages, la liaison cachée montrée sur la carte et dans les chemins,
  « Ouvrir » sur la carte de scène, les scènes validées et prêtes comptées
  séparément, et une recherche des scènes de tout le livre depuis
  « Parties et chapitres ». Le bouton à trois points de la carte, essayé
  au pied de la carte, reste sur l'image.
  Restent ouverts : les scènes communes à plusieurs chapitres, pour
  lesquelles un chapitre ordinaire est recommandé sans retour du porteur ;
  la page du chapitre en mode personnel.
- **Entrée de l'enseignant — classes et création d'un projet :** entretien
  court du 6 octobre 2026, sur ce que les règles ne disaient pas encore. Le
  porteur décide : un projet se crée en trois questions (« Qui écrit ? »,
  « Quel récit ? », le titre et la classe, facultative), les deux premiers
  choix étant annoncés comme définitifs, et s'ouvre sur sa Préparation ; une
  personne sans projet ni classe commence par le projet
  ([F01](docs/specifications.md#f01--projet-et-responsabilité-de-ladulte)) ;
  une classe est un nom et une année, « en cours » jusqu'au geste « Terminer
  l'année », qui ferme l'accès de classe sans rien supprimer et se défait,
  jamais d'office ; un élève a un prénom et un nom facultatif, l'initiale ne
  s'ajoutant que pour deux mêmes prénoms dans la classe ; « Retirer de la
  classe » met fin à l'inscription, garde les textes et rend les scènes non
  finies
  ([F01.1](docs/specifications.md#f011--classes-années-et-éventuel-espace-école)) ;
  l'identifiant et le mot de passe de la classe sont proposés, relus et
  remplacés par l'enseignant, avec une affiche de la classe et des
  étiquettes d'élèves à découper
  ([F06.4](docs/specifications.md#f064--classe-de-référence-et-postes-partagés)).
  Il confirme le 7 octobre les précisions d'abord proposées : la scène « À
  valider » d'un élève retiré reste à valider à son prénom, sa scène « À
  reprendre » redevient « En cours » ; une classe passée se consulte sans se
  modifier ; la classe d'un projet se change tant qu'aucun chapitre n'est
  attribué ; le titre est demandé à la création ; les codes et le mot de
  passe sont masqués à l'ouverture ; les horaires sont des jours cochés et
  une plage, d'autres pouvant s'ajouter ; les chiffres que lit l'élève ont
  un zéro sans barre. Le 8 octobre, il décide ce qui restait à régler
  avant de construire les accès : attente après cinq codes faux, classe
  fermée sur le poste pendant la nuit, élève déconnecté après deux heures
  sans activité, postes fermés après enregistrement quand le mot de passe
  change, qu'une année se termine ou qu'un élève est retiré, horaires à
  l'heure de Paris, forme de l'identifiant et du mot de passe (F06.4).
  Restent ouverts : la suppression définitive d'une classe passée (F14), le
  classement des projets d'une année sur l'autre.
- **Idée notée, non décidée :** une relecture des coquilles du livre par
  l'IA, en
  [F13.1](docs/specifications.md#f131--aide-de-lenseignant-à-la-correction-et-à-la-réécriture).

### Maquette de synthèse

Deux propositions visuelles indépendantes ont été comparées puis réunies le
30 septembre 2026, selon le plan approuvé par le porteur. Les écrans
proposés et les retours du porteur sont décrits dans le
[design](docs/design.md) :

- **Deux premiers parcours :** déclinaison autorisée par le porteur et
  réalisée.
- **Livre :** écrans ajoutés le 30 septembre, avec un retour favorable
  d'ensemble le 1er octobre, puis repris les 3 et 4 octobre
  pour les règles de composition et le parcours guidé ; état actuel dans
  [Destination Livre et lecture d'essai](docs/design.md#destination-livre-et-lecture-dessai).
  Le porteur valide le 3 octobre l'écran de la scène ouverte à côté de
  l'aperçu ; il donne un retour favorable d'ensemble au livre en étapes le
  3 octobre, puis à sa reprise en deux volets le 4, sans validation
  exhaustive de leurs détails. Les choix à confirmer y sont listés.
- **Partage et lecteur en ligne :** écrans du 1er octobre, avec un retour
  favorable du porteur ; présentation du lecteur arbitrée en F12.1 ; onglet
  Partage simplifié le 4 octobre sans changer F12.1 ; voir
  [Partage et lecteur en ligne](docs/design.md#partage-et-lecteur-en-ligne).
- **Choix dans la scène :** écrans du 2 octobre (saisie et réglages d'un
  choix dans la copie, lien caché, blocs protégés), avec un retour
  favorable d'ensemble le même jour, sans validation exhaustive ; voir
  [Choix dans la scène](docs/design.md#choix-dans-la-scène-et-blocs-protégés).
- **Objets, feuille d'aventure, actions de jeu et dé, scènes voisines :**
  écrans du 2 octobre, sans retour du porteur à ce stade ; voir
  [Objets, feuille d'aventure, actions de jeu et dé](docs/design.md#objets-feuille-daventure-actions-de-jeu-et-dé).
- **Suivi, barre du haut, « Mes projets » et fiches de rédaction :** repris
  le 4 octobre selon les décisions de F06.5 et F07.4, puis ajustés le même
  jour après une deuxième critique (28/40 et 25/40, contre 22 et 22), puis
  retouchés après une troisième (29/40 et 28/40), avec la répartition des
  scènes sans élève sur la page des fiches, dont le porteur confirme les
  précisions et le signe du bouton « Aide » ; les tampons d'état y servent
  de filtres, à l'essai ; sans retour du porteur sur le reste ; voir
  [Suivi repris après critique](docs/design.md#suivi-repris-après-critique-4-octobre-2026).
  Les captures des autres écrans adultes gardent l'ancienne barre du haut.
  Suite : un essai par une personne qui découvre l'outil, sans quatrième
  critique.

- **Page de scène de l'adulte :** reprise le 4 octobre après sa critique
  (23/40 et 23/40, non mesurée de nouveau) selon les décisions de F07.1,
  F11.1 et F06.3 : tampon d'état à menu, « qui s'en occupe » et menu à trois
  points dans l'en-tête, un seul retour, fiche de décision réduite à l'étape suivante,
  onglets « Texte de la scène » et « Remis le… », incidents dits au-dessus
  de la copie, texte avant les fiches en 390 px, scène suivante à valider
  proposée après une décision, « Texte vide » partout où l'état se lit ; la scène à côté de
  l'aperçu, validée le 3 octobre, reçoit le même tampon. Le porteur confirme
  six choix de la reprise, sans retour sur le reste ; voir
  [Page de scène reprise après critique](docs/design.md#page-de-scène-reprise-après-critique-4-octobre-2026).
  Les autres captures de la page de scène gardent l'ancien en-tête. Suite :
  un essai par une personne qui découvre l'outil, sans seconde critique.

- **Côté élève :** repris le 5 octobre après sa critique (22/40 et 21/40,
  non mesurée de nouveau) : pied de la copie collé au bas de l'écran, avec
  l'enregistrement, la remise et les incidents ; mots de l'élève (« remettre »
  en verbe seulement, « reprendre » réservé à la correction, « s'occuper de »
  pour prendre une scène) ; scène d'un autre intitulée à son nom, bouton de
  prise discret, note avec « Annuler », « Je ne m'en occupe plus » ; phrase
  à la place de « Demander un changement » ; « Remettre » inactif sur un
  texte vide ; lieu sans référence à côté d'une phrase de choix ; retour de l'enseignante seul à
  la première ouverture, à l'essai ; « Mon travail » rangé par urgence, avec
  un seul bouton plein, fermé hors des horaires ; connexion sans grille qui
  bouge, code refusé, confirmation de « Quitter la classe ». Sans retour du
  porteur à ce stade ; voir
  [Côté élève repris après critique](docs/design.md#côté-élève-repris-après-critique-5-octobre-2026).
  Les captures antérieures du côté élève gardent l'ancien pied et les
  anciens mots. Suite : montrer la maquette à deux ou trois élèves, sans
  seconde critique.

- **Organisation du récit côté adulte :** reprise le 6 octobre après sa
  critique (23/40 et 22/40, non mesurée de nouveau) selon les décisions de
  F03.1 et F03.2 : carte de chapitre entièrement cliquable qui dit le nombre
  de scènes validées, menu à trois points du chapitre, de la partie et de la
  scène, phrase « À compléter », écran d'aide, panneaux de réglages et
  d'attribution, dialogue de suppression et corbeille, page du chapitre sur
  une ligne d'outils, « qui s'en occupe » changé sur la carte, vue
  « Chemins » avec le départ, les fins et « sans suite » en mots, choix
  suivi d'un chapitre à l'autre, encart collé en bas sur téléphone ;
  « 10 ordinateurs » retiré de l'en-tête du projet. Le porteur accepte les
  mots et signes recommandés, confirme les précisions de la reprise et fait
  réduire le bouton à trois points des cartes, qui ont désormais toutes la
  même hauteur ; le reste de la forme des écrans est sans retour ; voir
  [Organisation du récit reprise après critique](docs/design.md#organisation-du-récit-reprise-après-critique-6-octobre-2026).
  Une seconde passe, par une lecture indépendante de 49 captures, donne
  25/40 le même jour. Le porteur fait alors réparer le menu du bandeau,
  coupé, écrire « Ouvrir » sur la carte de scène, nommer une scène par sa
  référence et son titre dans les dialogues, montrer la liaison cachée dans
  les chemins, ajouter un champ qui cherche les scènes de tout le livre, et
  accepte « 1 validée · 1 prête » et « Pas encore prise ». Le bouton à
  trois points de la carte, essayé au pied de la carte, revient sur
  l'image à sa demande, avec le même signe. Les anciennes captures de ces pages
  ne sont pas refaites. Suite : un essai par une personne qui découvre
  l'outil, sans troisième lecture.

- **Passe de cohérence sur toute la maquette :** le 6 octobre, un relevé de
  ce qui change d'un écran à l'autre (mots, gestes, signes, parcours
  rejoués) explique la cohérence restée à 2 sur 4 dans les critiques. Le
  porteur accepte trois recommandations : la règle « une couleur, un rôle »
  est réécrite plutôt que la maquette repeinte ; « remarque » désigne le
  retour de l'enseignant des deux côtés, « retour » restant le geste de
  revenir (F07.3) ; l'alignement est fait avant l'essai. Repris le même
  jour : sélection en pilule graphite, un seul bouton plein par écran et
  jamais sur ce qui supprime, retours en « Retour à… » (dont « Retour à Mon
  travail » et « Retour à la lecture d'essai »), bulles nommées par une
  question, une vingtaine de mots alignés. Le porteur confirme ensuite cinq
  recommandations : le fil de la page du chapitre garde sa flèche ;
  « Supprimer » pour ce qui efface, « Retirer » pour ce qui se remet d'un
  geste ; « Écrire » pour l'élève devant un texte vide ; « À régler » à la
  place de « Signalement » ; le « i » réservé aux bulles. Faute de
  personne disponible pour l'essai, les signes sont repris le même jour :
  une icône, un sens (demi-tour, sablier, chemins, PDF), onze phrases
  d'aide sans « i », et la scène rouverte à côté de l'aperçu au retour de
  sa page ; le tampon « Texte vide » porte un cercle en pointillé, et le
  « i » des bulles est en bleu canard ; voir
  [Passe de cohérence](docs/design.md#passe-de-cohérence-6-octobre-2026).

- **Mes classes et Nouveau projet :** maquettés le 6 octobre dans des
  fichiers neufs (`assets/classes.js`, `assets/classes.css`) : aide à
  l'ouverture, liste des classes et années passées, une classe (élèves sur
  deux colonnes, fiche d'un élève pour le code oublié, informations de la
  classe, horaires, projets, fin d'année), inscription en trois étapes avec
  ce qui est « à régler avant d'inscrire », étiquettes et affiche à
  imprimer, création d'un projet en trois questions, « Mes projets » sans
  projet, projet sans classe. Une critique d'ergonomie du même jour donne
  28/40 (lecture informée) et 26/40 (lecture indépendante de 44 captures) ;
  ses points sont corrigés aussitôt, sans nouvelle mesure. Le porteur en
  confirme les règles le 7 octobre, sans retour sur la forme des écrans ;
  voir
  [Mes classes et Nouveau projet](docs/design.md#mes-classes-et-nouveau-projet-6-octobre-2026).
  Captures 271 à 314.

Suite recommandée pour le livre : un essai par une personne qui découvre
l'outil, une critique de plus n'apprenant plus rien.

### Prototypes et choix techniques

- **Prototype de l'éditeur :** autorisé et réalisé le 2 octobre 2026, comme
  essai jetable qui n'autorise pas le développement de l'application. Plate
  est retenu le même jour
  ([ADR 0002](docs/adr/0002-plate-pour-l-editeur.md)), avec l'annulation par
  scène et le bloc protégé pris comme un tout. La
  [liste de ce qu'il devait éprouver](docs/architecture.md#ce-que-le-prototype-de-léditeur-devra-éprouver),
  à laquelle s'est ajouté le paragraphe d'action de jeu, et les
  [verdicts sur ses 14 points](docs/architecture.md#résultats-du-prototype-de-léditeur-2-octobre-2026),
  avec les incertitudes restantes, sont dans l'architecture. Les essais sur
  tablettes réelles sont mis de côté par le porteur le 3 octobre 2026 et
  restent non vérifiés.
- **Prototype de la chaîne PDF :** autorisé le 2 octobre 2026, réalisé le
  3 octobre avec Paged.js et Chromium, sur un livre fabriqué pour l'essai.
  Ses verdicts sur 15 points et ses mesures sont dans
  [l'architecture](docs/architecture.md#résultats-du-prototype-pdf-3-octobre-2026).
  Constat principal : l'aperçu et le PDF sont identiques sous Chromium, pas
  sous le moteur de Safari. Paged.js et Chromium sont retenus le même jour,
  avec un aperçu calculé côté serveur
  ([ADR 0003](docs/adr/0003-pagedjs-chromium-apercu-cote-serveur.md)), sous
  réserve d'un essai du Chromium de Linux ; Typst n'est pas essayé et rien
  n'est déployé.
- **Restent à éprouver :** le délai de l'aperçu calculé côté serveur, les
  règles que l'essai n'a pas couvertes et un premier envoi chez
  l'imprimeur.

### Plan de réalisation

Entretien des 7 et 8 octobre 2026 ; le [plan](docs/plan.md) est validé dans
son ensemble par le porteur le 8 octobre, sans que ses questions « à régler
avant de commencer » soient tranchées.

- **Décidé par le porteur le 8 octobre :** l'IA écrit le code, sans
  calendrier ni engagement financier ; l'ordre est celui qui construit
  l'application entière le plus efficacement, chaque domaine une fois, avec
  ses variantes de mode ; les points non vérifiés sont supposés tenir et se
  lèvent dans l'application, sans nouveau prototype ; deux seuils, « ma
  classe » puis « ouverture » ; premier usage par le vrai livre de la
  classe, à choix, souhaité pour janvier 2027, la V0 servant de repli ;
  application en ligne à l'adresse de Vercel, avec Supabase pour la base,
  les comptes et les fichiers
  ([ADR 0004](docs/adr/0004-vercel-et-supabase.md)), en offre gratuite
  jusqu'à l'ouverture, le porteur sauvegardant lui-même la base ; codes et
  mot de passe de classe chiffrés par l'application et essais limités
  (F06.4).
- **Validé :** neuf étapes — s'installer, préparer et organiser, écrire et
  relier, faire travailler la classe, lire à l'essai, composer et imprimer,
  partager, aides IA, ouverture —, avec pour chacune son périmètre par
  identifiant, ses vérifications et ce qui est à régler avant de commencer.
- **Avant la première ligne, décidé le 8 octobre :** un dépôt Git dans
  `V1/`, le code dans `V1/app/`, la V0 restant à part ; l'application
  reprend de la maquette ses valeurs de design et ses textes, non son code ;
  les questions de l'étape 1 sont arbitrées en F06.4.
- **Nom du produit, décidé le 9 octobre 2026 :** « Il était une classe »
  ([brief](BRIEF-V1.md#2-publics-et-fonctionnement-envisagé)). Aucune adresse
  n'est réservée, la marque n'est pas vérifiée et le nom anglais n'est pas
  décidé ; l'application affiche ce nom depuis le 9 octobre 2026, la maquette
  affiche encore « You Are a Hero ».
  L'état des adresses et une recommandation pour les pages publiques, non
  décidée, sont à
  [l'étape 9 du plan](docs/plan.md#étape-9--ouverture-à-dautres-enseignants).
- **Étape 2, entretien du 10 octobre 2026,** validé dans son ensemble par
  le porteur le même jour : le glisser-déposer change l'ordre des parties,
  des chapitres et des scènes, et pose un chapitre dans une autre partie,
  « Monter » et « Descendre » étant retirés ; « Restaurer » rend l'élément à
  sa place, avec ses liens et ses élèves, et tout passe par la corbeille
  ([F03.1](docs/specifications.md#f031--histoire-parties-chapitres-et-scènes)) ;
  la scène de départ se supprime, le livre le dit, et un sélecteur
  « Choisir le départ du livre » s'ouvre depuis « À compléter »
  ([F03.2](docs/specifications.md#f032--départ-du-récit-à-choix-et-fins-explicites)) ;
  le profil « écriture et organisation » crée, titre, ordonne et supprime
  une scène qu'il a créée, et la scène « contenant du travail » est définie
  ([F06.1](docs/specifications.md#f061--attribution-des-chapitres-et-profils-de-participation)) ;
  la page du chapitre est la même pour tous, sans filtres en mode personnel
  (F03.1) ; le guidage de la préparation part des textes de la maquette,
  sans atelier projeté en mode personnel ni aide IA à l'écran avant
  l'étape 8
  ([F02](docs/specifications.md#f02--préparer-le-récit-et-les-décisions-communes)) ;
  l'image se choisit sur la carte du projet à sa création, sous le titre
  d'un chapitre ou d'une partie ajoutés, par un seul sélecteur « Choisir une
  image »
  ([F10.1](docs/specifications.md#f101--images-de-repérage-du-projet)).
  Écrans arrêtés et textes du guidage :
  [design](docs/design.md#étape-2--écrans-arrêtés-avant-de-construire-10-octobre-2026).
- **Restent à décider :** les questions qui bloquent chaque
  étape, à arbitrer par un entretien court avant elle ; F14, avant
  l'ouverture. Le développement demande une instruction que le plan ne
  donne pas.

## Documents actifs

| Document | Rôle et contenu de référence |
| --- | --- |
| [Brief](BRIEF-V1.md) | Synthèse du produit, modes, F01–F14, orientations techniques et périmètre. |
| [Spécifications fonctionnelles](docs/specifications.md) | Règles, permissions, parcours, critères d'acceptation ; décisions distinguées des propositions et questions ouvertes. |
| [Vocabulaire métier](CONTEXT.md) | Définitions canoniques, notamment histoire → partie → chapitre → scène, corbeille du projet, classe et année terminée, inscription, retrait de la classe, accès de classe, affiche de la classe, étiquette de l'élève, attribution, prise en charge, état de la scène, répartition des scènes sans élève, renvoi et phrase de choix, fiche de rédaction, note de l'enseignant, objet de l'histoire, feuille d'aventure, compteur, action de jeu, liaison cachée, numéro imprimé, numéro de page, page de présentation, dé imprimé, page peu remplie, agencement, temps du livre, étape d'arrivée, tâche, scène à finir, doute sur l'ordre, avertissement accepté et aperçu du livre. |
| [Design](docs/design.md) | Carnet d'aventure illustré, système « Cahiers d'aventure » de la maquette de synthèse, images et couleurs de repérage, situations retenues, vues Scènes/Chemins, dispositions à éprouver et outillage de conception. |
| [Maquette de synthèse](maquettes/synthese/index.html) | Système « Cahiers d'aventure », planche d'ambiance, parties et chapitres (carte qui ouvre le chapitre, menus à trois points, « À compléter », aide à l'ouverture, réglages, attribution des élèves, suppression et corbeille), Scènes/Chemins, barre du haut globale et page « Mes projets », « Nouveau projet » en trois questions, « Mes classes » (aide à l'ouverture, classe et ses élèves, codes, informations de la classe, horaires, fin d'année, inscription en lot, étiquettes et affiche), Suivi d'un projet (rappel des élèves sans chapitre, tampons d'état en filtres et leur légende, écran d'aide à l'ouverture, sélections par élève, vue Élèves, retour depuis la scène) et fiches de rédaction en feuille par chapitre ou par élève, un élève choisi n'imprimant que la sienne, et les scènes sans élève pouvant être réparties à l'impression, préparation et atelier projeté, connexion élève (place du code réservée, code refusé, confirmation de « Quitter la classe »), Mon travail (scènes rangées par urgence, fermé hors des horaires), écriture et reprise de l'élève (pied de la copie collé au bas de l'écran, incidents dans ce pied, scène prise ou rendue avec « Annuler », retour de l'enseignante seul à la première ouverture, à l'essai) et relecture (état de la scène choisi sur son tampon, « qui s'en occupe » et menu à trois points dans l'en-tête, un seul retour, scène suivante à valider, fiche de décision réduite à l'étape suivante, incidents au-dessus de la copie), conflit de sauvegarde (texte gardé à part dans un onglet de la page de scène, « Ne plus garder ce texte » et « Mettre ce texte dans la scène », ligne de rappel du Suivi, élève arrêté sur la scène et dans « Mon travail »), choix dans la scène et blocs protégés, objets et actions de jeu dans la copie, destination Livre en parcours guidé (relire, vérifier les chemins, mettre en page, imprimer et partager ; ligne d'étapes à marques, étapes fermées, tâches sans accordéon aux deux premières étapes, aide à l'ouverture d'une étape, bulles d'information, avertissements acceptés, aperçu avec la scène ouverte à côté, scène déclarée prête ou exclue depuis son menu, image dans l'éditeur, « Mettre en page » en deux volets — réglages de texte et de pages, ordre des passages et ordre à confirmer, pages de début et de fin ; aperçu du livre entier, pages peu remplies et passages suggérés —, PDF définitif, partage), rubriques « Phrases de choix », feuille d'aventure et règles du jeu dans la préparation, Suivi filtré sur les scènes à finir, lecture d'essai, lecteur en ligne avec feuille d'aventure et dé, et lectures de l'élève. HTML local, variantes et interactions simulées sans persistance ; propositions à examiner. |
| [Architecture](docs/architecture.md) | Orientations techniques, comparaison d'hébergement et décision du 8 octobre 2026, protection des accès, vérifications restantes, liste du prototype de l'éditeur et ses résultats point par point, liste du prototype PDF, moteurs candidats, limites Vercel, résultats et mesures du prototype PDF. |
| [Plan de réalisation](docs/plan.md) | Validé le 8 octobre 2026 : cadre décidé par le porteur, seuils « ma classe » et « ouverture », périmètre de la première livraison par identifiant, vérifications techniques avec l'étape qui les lève, décisions de fournisseur, préalables aux prénoms d'élèves réels, neuf étapes avec leurs critères et ce qui est à régler avant chacune, sujets hors première livraison, coûts, risques, questions ouvertes et écarts entre documents. Il n'autorise ni développement ni prototype. |
| [Prototype de l'éditeur](prototypes/editeur/README.md) | Essai jetable Plate du 2 octobre 2026 et ses tests ; lancement et organisation du dossier. Aucun code à reprendre ; les verdicts sont dans l'architecture. |
| [Prototype de la chaîne PDF](prototypes/pdf/README.md) | Essai jetable Paged.js et Chromium du 3 octobre 2026 : livre d'essai, aperçu, commande d'export et tests ; lancement et organisation du dossier. Aucun code à reprendre ; les verdicts sont dans l'architecture. |
| [ADR — Chapitre comme unité d'attribution](docs/adr/0001-chapitre-unite-attribution.md) | Justification de la profondeur fixe et de la distinction entre regroupement et accès. |
| [ADR — Plate pour l'éditeur](docs/adr/0002-plate-pour-l-editeur.md) | Pourquoi Plate, ce que ce choix coûte et ce qui le rouvrirait. |
| [ADR — Paged.js et Chromium, aperçu côté serveur](docs/adr/0003-pagedjs-chromium-apercu-cote-serveur.md) | Pourquoi cette chaîne pour le livre, pourquoi l'aperçu n'est pas calculé dans le navigateur, ce que ce choix coûte et ce qui le rouvrirait. |
| [ADR — Vercel et Supabase](docs/adr/0004-vercel-et-supabase.md) | Pourquoi cet hébergement et cette base, l'offre gratuite gardée jusqu'à l'ouverture, ce que ce choix coûte et ce qui le rouvrirait. |

## Lectures ciblées pour la conception visuelle

Après le brief et le glossaire, lire le design et les sections utiles des
spécifications. Ne pas rouvrir les décisions acquises ni relire la V0 comme
source d'exigences V1.

- **Créer et préparer :** [F01](docs/specifications.md#f01--projet-et-responsabilité-de-ladulte)
  et [F02](docs/specifications.md#f02--préparer-le-récit-et-les-décisions-communes).
- **Créer un projet, gérer ses classes :** [F01](docs/specifications.md#f01--projet-et-responsabilité-de-ladulte),
  [F01.1](docs/specifications.md#f011--classes-années-et-éventuel-espace-école)
  et [F06.4](docs/specifications.md#f064--classe-de-référence-et-postes-partagés) ;
  écrans proposés dans la maquette de synthèse.
- **Organiser le récit et retrouver une scène :** [F03](docs/specifications.md#f03--organiser-le-récit)
  et [F05](docs/specifications.md#f05--retrouver-les-scènes-et-relier-les-choix).
- **Attribuer, se connecter, se répartir et suivre le travail :**
  [F06](docs/specifications.md#f06--attributions-accès-et-organisation-de-lécriture).
- **Créer et modifier les choix dans la scène :** [F05.2](docs/specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène),
  avec les protections de [F06.1](docs/specifications.md#f061--attribution-des-chapitres-et-profils-de-participation).
- **Objets, feuille d'aventure, actions de jeu et dé :** [F04.2](docs/specifications.md#f042--objets-de-lhistoire),
  avec les pages de présentation de [F11.4](docs/specifications.md#f114--intérieur-du-livre-pages-de-présentation-et-couverture)
  et le lecteur de [F12.1](docs/specifications.md#f121--partager-une-version-du-récit) ;
  écrans proposés dans la maquette de synthèse.
- **Voir les scènes voisines pendant l'écriture :** [F04.3](docs/specifications.md#f043--aperçu-des-scènes-voisines-pendant-lécriture),
  décisions du 2 octobre 2026 ; écrans proposés dans la maquette de synthèse.
- **Ouvrir l'écriture et préparer les fiches :** [F04](docs/specifications.md#f04--rédaction-dans-léditeur),
  [F07.1](docs/specifications.md#f071--du-travail-préparatoire-au-travail-élève-validé)
  et [F07.4](docs/specifications.md#f074--fiches-de-rédaction-pour-le-travail-sur-papier).
- **Sauvegarde et récupération :** [F08](docs/specifications.md#f08--sauvegarde-et-récupération) ;
  conflit et récupération décidés, écrans proposés dans la maquette de synthèse, historique et vérifications techniques restants.
- **Tester et composer le livre :** [F05.1](docs/specifications.md#f051--liaisons-cachées-par-énigme),
  [F09](docs/specifications.md#f09--test-de-lecture-et-cohérence-du-récit)
  et [F11](docs/specifications.md#f11--composition-et-préparation-du-livre),
  avec les placements d'images de [F10](docs/specifications.md#f10--illustrations).
- **Partager et lire en ligne :** [F12.1](docs/specifications.md#f121--partager-une-version-du-récit)
  et [F12.3](docs/specifications.md#f123--lecture-des-anciens-livres-par-les-autres-classes),
  avec l'avertissement « sortie non assurée » de [F09.2](docs/specifications.md#f092--contrôles-des-chemins-avant-le-pdf-définitif).
- **Ambiance du projet et aide IA :** [F10.1](docs/specifications.md#f101--images-de-repérage-du-projet),
  [F10.2](docs/specifications.md#f102--aide-à-lillustration-par-prompts)
  et [F13](docs/specifications.md#f13--assistance-ia-facultative).

Les [approfondissements restants](docs/specifications.md#suite-de-lentretien-et-couverture-restante)
distinguent les détails à éprouver sur les maquettes, les parcours ultérieurs
et les sujets différés.
Les prompts ponctuels restent dans la conversation, sans fichier de compte rendu.
