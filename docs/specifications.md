# Spécifications fonctionnelles V1

Document de référence pour les règles détaillées. Le [brief](../BRIEF-V1.md)
conserve la synthèse et les identifiants F01–F14 ; le
[glossaire](../CONTEXT.md) définit les termes métier.

## Statut et périmètre

Au 27 septembre 2026, les décisions du cadrage du parcours principal sont
consolidées ci-dessous et distinguées des propositions et des questions ouvertes.
Le cadrage d'ensemble est clôturé à la demande du porteur, après consolidation
des derniers accords. Cette clôture porte sur les décisions confirmées et les
approfondissements identifiés ; elle ne valide pas les propositions encore
ouvertes et n'autorise ni développement ni prototype.
La gestion des classes par enseignant et l'aide IA aux embranchements sont
retenues en F01.1 et F13.3. La réutilisation annuelle des profils élèves,
la lecture volontaire des livres terminés par les autres classes et le
repérage des scènes sont également confirmés ci-dessous.

**Validation du premier parcours le 28 septembre 2026 :** le porteur valide
l'ensemble du parcours « préparer un projet de classe et ouvrir la première
séance d'écriture », de la création du projet à l'accès effectif aux scènes,
avec ses variantes et les décisions de présentation confirmées. Cette validation
ne vaut pas spécification exhaustive de la V1 : les propositions, détails
locaux différés et inconnues techniques gardent leur statut. La conception
visuelle est décrite dans le [design](design.md).

**Validation du deuxième parcours le 28 septembre 2026 :** le porteur valide
l'ensemble du parcours « rédiger une scène, la faire relire, la reprendre
et la valider », avec ses variantes et les points explicitement différés.
Il autorise la suite de sa conception visuelle. Les dispositions de maquette
restent proposées ; cette validation n'autorise ni développement de
l'application ni prototype technique.

**Validation du troisième parcours le 30 septembre 2026 :** le porteur valide
l'ensemble du parcours « tester la lecture et composer le livre », de la
vérification des chemins au PDF définitif prêt à imprimer, avec ses variantes
et ses points différés. Ses règles sont en F05.1, F09, F10 et F11, avec les
contraintes notées pour F12. Cette validation n'autorise ni développement de
l'application ni prototype ; la fidélité entre aperçu et PDF et la forme des
choix dans l'éditeur restent à vérifier techniquement.

Scénario de référence : projet de classe à choix, de la préparation au PDF prêt
à imprimer. Les quatre combinaisons personnel/classe et classique/choix sont
retenues dès la première livraison selon F01. Ce document n'autorise par
lui-même ni développement ni prototype : la réalisation suit le
[plan](plan.md), étape par étape, sur instruction du porteur. Les mentions
« n'autorise ni développement » des validations ci-dessus datent de ces
validations ; depuis, deux prototypes ont été autorisés puis, le 8 octobre
2026, l'étape 1 du plan.

## F01 — Projet et responsabilité de l'adulte

**Décision confirmée :** un projet de classe est géré par un seul enseignant
responsable pour la première livraison. La préparation, l'accompagnement,
les validations et la fabrication du livre relèvent de cet enseignant,
avec les délégations aux élèves définies en F06. Le travail de plusieurs
enseignants sur un même projet n'entre pas dans ce périmètre initial.

**Critère d'acceptation :**

- **F01-AC01 — Responsable du projet :** étant donné un enseignant créant un
  projet de classe, lorsque des élèves y participent, alors le projet conserve
  cet enseignant comme seul adulte responsable et les élèves n'acquièrent
  que les droits de participation qui leur sont attribués.

La création d'un projet est décidée le 6 octobre 2026, plus bas
(« Créer un projet »). Le classement des projets d'une année sur l'autre
reste à préciser ; leur organisation par classe et année est définie en F01.1.
Le mode personnel reste celui d'un auteur adulte gérant son propre récit.

**Décisions confirmées pour la première livraison :**

- Les quatre combinaisons personnel/classe et classique/choix sont utilisables,
  avec le socle commun de préparation, rédaction, finitions, PDF et partage
  facultatif. Les fonctions scolaires s'appliquent au mode classe et les
  fonctions d'embranchement au récit à choix. Le projet de classe à choix
  reste le scénario de référence pour organiser l'approfondissement.
- L'adulte choisit l'organisation et le type de récit à la création ; ces
  modes restent fixes pour le projet dans la première livraison. Aucune
  conversion intégrée entre personnel et classe ou entre classique et à
  choix n'est prévue dans cette livraison. Cette limite ne fige pas le
  contenu du projet ni les ajustements autorisés dans son mode.
- Un enseignant peut préparer seul un projet créé en mode classe avant
  d'ajouter les élèves et de leur attribuer du travail. Il n'a pas besoin
  de commencer en mode personnel pour préparer son futur projet de classe.
- Le rattachement à une classe est facultatif à la création d'un projet en
  mode classe. L'enseignant peut préparer le récit puis choisir la classe
  ultérieurement, avant les attributions aux élèves. Ce rattachement sert à
  organiser le projet ; il ne donne à lui seul aucun accès aux scènes.
  L'enseignant peut continuer à préparer seul après rattachement tant qu'il
  n'attribue pas de chapitre. L'accès par attribution est défini en F06.1.

**Justification :** les quatre parcours partagent des fonctions, mais leurs
différences doivent être conçues et vérifiées. Le report de la conversion
évite d'ajouter dès le départ des arbitrages sur les branches à conserver
dans un récit devenu classique ou sur les accès et le suivi pédagogique
d'un projet de classe devenu personnel. Une conversion future n'est pas
définitivement exclue ; elle n'est pas nécessaire au parcours retenu.

**Critères d'acceptation sur les modes :**

- **F01-AC02 — Quatre parcours disponibles :** étant donné chacune des quatre
  combinaisons personnel/classique, personnel/à choix, classe/classique et
  classe/à choix, lorsqu'un adulte crée puis prépare son projet dans la
  première livraison, alors le parcours correspondant lui permet d'aller
  jusqu'au PDF et au partage facultatif selon les règles applicables.
- **F01-AC03 — Préparer la classe en amont :** étant donné un projet créé
  en mode classe sans élèves ajoutés, lorsque l'enseignant prépare le récit,
  alors il peut conserver cette préparation puis ajouter ses élèves et
  attribuer les chapitres dans le même projet, sans changement de mode.
- **F01-AC04 — Modes fixes :** étant donné un projet existant, lorsque
  l'adulte consulte ses possibilités de modification dans la première
  livraison, alors il ne peut pas convertir son organisation personnel/classe
  ni son type classique/à choix. L'édition du contenu autorisée par le mode
  choisi reste disponible.
- **F01-AC08 — Classe choisie après préparation :** étant donné un enseignant
  préparant pendant l'été un projet en mode classe sans classe choisie,
  lorsqu'il reprend le projet puis le rattache à sa classe de septembre,
  alors sa préparation est conservée dans le même projet et il peut ensuite
  attribuer les chapitres aux élèves inscrits dans cette classe.
- **F01-AC09 — Rattachement sans attribution :** étant donné un projet
  rattaché à une classe mais sans chapitre attribué aux élèves, lorsqu'un
  élève de cette classe tente d'accéder à une scène de ce projet, alors le
  rattachement ne lui donne pas accès à cette scène.

Le changement ou le retrait d'une classe après des attributions et des
contributions reste à approfondir ; le rattachement différé ne l'autorise
pas implicitement. Le choix d'une classe est un préalable à l'attribution.

**Décisions confirmées le 6 octobre 2026 — créer un projet :**

- **Trois questions, l'une après l'autre, et rien d'autre.** « Qui
  écrit ? » : ma classe, ou moi (projet de classe ou projet personnel).
  « Quel récit ? » : à choix, ou classique. Puis le titre et, pour un projet
  de classe, la classe, avec « Choisir plus tard ». L'image, le style
  d'illustration et le reste se règlent ensuite, dans le projet.
- **Deux choix définitifs, dits deux fois.** L'écran dit, au moment de
  chaque choix, qu'il ne se change pas ensuite, et le rappelle avant « Créer
  le projet » : c'est la règle des modes fixes ci-dessus, rendue visible là
  où elle engage.
- **Arrivée sur la Préparation.** Le projet créé s'ouvre sur son onglet
  Préparation et devient le dernier projet ouvert de
  [F06.5](#f065--suivi-du-travail-et-accès-aux-scènes). Quitter avant
  « Créer le projet » ne crée rien.
- **Le projet d'abord, la classe ensuite.** Une personne qui n'a ni projet
  ni classe arrive sur « Mes projets », vide, qui ne propose que « Créer mon
  premier projet ». Elle crée sa classe quand elle veut faire écrire les
  élèves ; rien ne l'y oblige avant. L'alternative écartée, la classe
  d'abord, faisait saisir vingt-cinq prénoms avant d'avoir rien vu.

- **F01-AC14 — Créer un projet de classe sans classe :** étant donné une
  enseignante sans projet ni classe, lorsqu'elle choisit « Ma classe »,
  « À choix », saisit le titre « Les passeurs de brume », garde « Choisir
  plus tard » et crée le projet, alors elle arrive sur la Préparation d'un
  projet de classe à choix sans classe, et la barre du haut porte son titre.
- **F01-AC15 — Modes annoncés comme définitifs :** étant donné la troisième
  question de la création, lorsque l'adulte lit le rappel avant « Créer le
  projet », alors il y trouve « Projet de classe » ou « Projet personnel »,
  « Récit à choix » ou « Récit classique », et la mention que ces deux choix
  ne se changent pas ; « Retour » lui permet encore de les changer.
- **F01-AC16 — Projet personnel :** étant donné un adulte qui répond
  « Moi », lorsqu'il arrive à la troisième question, alors aucune classe ne
  lui est demandée.
- **F01-AC17 — Rien sans confirmation :** étant donné un titre saisi à la
  troisième question, lorsque l'adulte quitte la page sans « Créer le
  projet », alors aucun projet n'apparaît dans « Mes projets ».

**Décisions confirmées le 7 octobre 2026**, d'abord proposées par la
maquette :

- **Titre demandé.** Un projet ne se crée pas sans titre ; le titre se
  change ensuite.
- **Classe d'un projet.** Elle se choisit et se change tant qu'aucun
  chapitre n'est attribué. Dès qu'un chapitre l'est, la commande n'est plus
  offerte, en première livraison ; ce qu'il faudrait pour changer de classe
  après des contributions reste à approfondir.

- **F01-AC24 — Changer la classe avant d'attribuer :** étant donné un
  projet rattaché à « CM1-CM2 » sans chapitre attribué, lorsque
  l'enseignant choisit une autre classe en cours, alors le projet est
  rattaché à celle-ci ; dès qu'un chapitre est attribué à un élève, le
  changement de classe n'est plus proposé.

**Décisions confirmées le 9 octobre 2026 — le compte de l'adulte**, avant
la réalisation de l'étape 1 du [plan](plan.md), aucune règle n'existant
jusque-là :

- **Une adresse électronique et un mot de passe.** L'adulte entre par
  l'« Entrée enseignant », distincte de l'entrée des élèves de
  [F06.4](#f064--classe-de-référence-et-postes-partagés). « Mot de passe
  oublié » lui envoie un courriel, dont le lien lui fait choisir un nouveau
  mot de passe.
- **Pas d'inscription publique avant l'ouverture.** Jusqu'à l'étape 9 du
  plan, aucun écran ne crée de compte : le porteur crée le sien depuis la
  console de Supabase, avec son adresse et son mot de passe.
  L'inscription d'autres enseignants s'écrira avec F14.
- **« Mon compte ».** Un panneau ouvert depuis le nom de l'adulte, dans la
  barre du haut : le nom affiché aux élèves de F01.1 et « Se déconnecter ».

- **F01-AC27 — Entrée de l'enseignant :** étant donné un compte existant,
  lorsque l'adulte saisit son adresse et son mot de passe, alors il arrive
  dans son dernier projet ouvert, ou sur « Mes projets » (F06-AC53) ; avec
  une adresse ou un mot de passe faux, il lit « L'adresse ou le mot de
  passe n'est pas le bon. », sans savoir lequel des deux.
- **F01-AC28 — Aucun compte créé depuis l'application :** étant donné une
  personne sans compte, lorsqu'elle ouvre l'entrée enseignant, alors aucune
  commande ne lui propose de s'inscrire ; lorsqu'elle ouvre l'adresse de
  « Mes projets » sans être connectée, alors elle est ramenée à l'entrée.
- **F01-AC29 — Mot de passe oublié :** étant donné une adresse saisie à
  « Mot de passe oublié », lorsque l'adulte confirme, alors il lit la même
  phrase que l'adresse soit connue ou non ; si elle l'est, le lien reçu lui
  fait choisir un nouveau mot de passe, et l'ancien est refusé.
- **F01-AC30 — Mon compte :** étant donné Mme Laurent connectée, lorsqu'elle
  ouvre « Mon compte » et écrit « Mme Laurent » comme nom affiché, alors
  l'entrée des élèves dit « Classe CM1-CM2 de Mme Laurent » ; lorsqu'elle
  choisit « Se déconnecter », alors « Mes projets » redemande son adresse et
  son mot de passe sur ce poste.

**Décision du porteur le 9 octobre 2026 — connexion par Google, dès
maintenant.** L'adulte entre aussi par « Continuer avec Google ». La
recommandation était de l'attendre jusqu'à l'ouverture (étape 9 du plan),
avec le nom de domaine que la validation de l'application par Google
demande ; le porteur la veut tout de suite et de toute façon. Facebook,
déconseillé, n'est pas retenu.

- **Elle s'ajoute, sans rien remplacer.** L'adresse et le mot de passe
  restent ; les deux façons ouvrent le même compte.
- **Elle n'ouvre qu'un compte existant.** Le compte Google doit porter la
  même adresse que le compte de l'adulte. Avant l'ouverture, un compte
  Google inconnu est refusé et ne crée rien : c'est F01-AC28.
- **Google demande toujours quel compte utiliser,** pour un ordinateur
  partagé où un autre compte Google serait resté ouvert.

- **F01-AC31 — Entrer par Google :** étant donné Mme Laurent, dont le
  compte porte l'adresse de son compte Google, lorsqu'elle choisit
  « Continuer avec Google » et ce compte, alors elle arrive dans son
  dernier projet ouvert, ou sur « Mes projets », comme avec son mot de
  passe (F06-AC53).
- **F01-AC32 — Compte Google inconnu :** étant donné une personne dont
  l'adresse Google n'est celle d'aucun compte, lorsqu'elle choisit
  « Continuer avec Google », alors elle revient à l'entrée enseignant, lit
  « Aucun compte ne correspond à cette adresse Google. », et aucun compte
  n'est créé.

**Reste ouvert :** la validation de l'application par Google (nom affiché à
la place de l'adresse de Supabase sur l'écran de Google), à traiter avec le
nom de domaine, à l'étape 9 ; l'ouverture des comptes par Google à d'autres
enseignants, avec F14.

**Présentation proposée le 9 octobre 2026, sans retour du porteur :**
« Continuer avec Google » est en tête de la carte, en bouton à contour, puis
« ou », puis l'adresse et le mot de passe, dont « Entrer » reste le seul
bouton plein.
L'entrée enseignant reprend la disposition d'« Ouvrir la classe », image à
gauche et formulaire à droite ; le mot de passe a huit caractères au moins ;
il ne se change que par le lien de « Mot de passe oublié », ouvert sur
l'ordinateur d'où il a été demandé : une session laissée ouverte sur un
poste ne suffit pas à le changer.

**Propositions de la maquette du 6 octobre 2026, sans retour du porteur :**

- un projet de classe sans classe le dit sous son titre (« Sans classe »),
  avec « Choisir une classe », dans son en-tête comme sur sa carte de « Mes
  projets » ; « Attribuer des élèves », tenté avant ce choix, demande la
  classe au lieu de lister des élèves ;
- seules les classes en cours de F01.1 sont proposées.

### F01.1 — Classes, années et éventuel espace école

**Besoin exprimé :** retrouver plusieurs histoires,
des classes parallèles et les projets des années précédentes. Le porteur
estime qu'un enseignant réalise généralement une histoire par an compte tenu
de la charge du projet ; il s'agit de son appréciation, pas d'une limite du
produit ni d'une fréquence de marché vérifiée.

**Distinction à conserver :** l'accès de classe de F06.4 est une étape de
connexion rapide des élèves sur un poste. Il ne signifie pas qu'un enseignant
doive créer un nouveau compte personnel pour chaque classe ou chaque livre.
Un éventuel espace école serait un regroupement institutionnel ; il ne doit
pas être confondu avec l'identité de l'enseignant ou un identifiant commun
partagé par tous les adultes.

**Décision confirmée pour la première livraison :** permettre à
l'enseignant, depuis son compte personnel, de retrouver ses classes repérées
par année scolaire et ses projets. Une classe peut participer à plusieurs
histoires ; les élèves sont inscrits dans la classe concernée et leurs
attributions restent définies par chapitre dans chaque histoire, selon
F06. Une nouvelle année ne réutilise pas implicitement les permissions des
anciens projets. Les projets personnels restent accessibles sans école
ou classe obligatoire. L'espace institutionnel partagé entre enseignants
n'est pas retenu pour cette première livraison.

**École — évolution éventuelle, hors première livraison :** si plusieurs enseignants
doivent ultérieurement partager un espace d'établissement,
l'école aurait des enseignants membres, des classes par année et des projets,
avec des comptes adultes individuels. Elle ne serait pas simplement un élément
appartenant à un enseignant dans une hiérarchie. Il faudrait déterminer qui
administre cet espace, ce que chaque collègue voit et ce qui se passe lors
du départ d'un enseignant. Ce périmètre ajoute du développement, du support
et un parcours d'adoption à plusieurs adultes ; son utilité doit être distinguée
du seul rangement des anciens livres.

**Compatibilité avec les décisions existantes :** un espace partagé entre
enseignants peut contenir des projets ayant chacun un enseignant responsable.
Il n'impose pas la collaboration de plusieurs enseignants sur le même projet,
qui n'est pas retenue pour la première livraison. L'accès à une histoire ne
remplace pas les attributions par chapitre ni les limites de lecture de F06.

**Critère d'acceptation sur l'organisation confirmée :**

- **F01-AC05 — Plusieurs années et histoires :** étant donné un enseignant
  ayant une classe 2026–2027 avec deux histoires, lorsqu'il prépare une classe
  2027–2028, alors il retrouve ces projets depuis son même compte et la
  nouvelle classe n'hérite pas de leurs attributions de travail.

**Décision confirmée — réutiliser un profil, renouveler l'inscription :** distinguer
le profil de l'élève, son inscription dans une classe annuelle et ses permissions
dans chaque histoire. L'enseignant peut sélectionner des élèves déjà connus
pour les inscrire dans la nouvelle classe, et créer seulement les nouveaux
profils. Alice présente deux années de suite conserve un seul profil,
avec deux inscriptions successives ; les anciens textes restent attribués
à leur auteur sans recopier les permissions dans la nouvelle histoire.
Le code personnel est conservé lors de la réinscription, sauf modification
explicite selon F06.4 ; l'accès de classe change avec la classe. Le code ne
définit pas l'identité.
Deux élèves portant le même nom ne sont jamais fusionnés automatiquement.

Cette réutilisation est retenue dans l'espace d'un même enseignant. Un profil
partagé entre collègues ou écoles demanderait une gestion des transferts qui
n'est pas retenue implicitement. La création d'une nouvelle classe ne doit pas
être confondue avec la fin de l'ancienne : la fin d'une année et le départ
d'un élève sont décidés le 6 octobre 2026, plus bas ; la durée de
conservation reste à approfondir avec F14.

**Critères d'acceptation :**

- **F01-AC06 — Réinscription sans doublon :** étant donné Alice déjà inscrite
  dans une ancienne classe, lorsque l'enseignant sélectionne son profil pour
  l'inscrire dans sa nouvelle classe, alors un seul profil subsiste avec ses
  inscriptions successives, sans transfert implicite des permissions de récit.
- **F01-AC07 — Homonymes :** étant donné deux élèves différents de même nom,
  lorsque l'enseignant crée le second profil, alors le système ne le fusionne
  pas automatiquement avec le premier et conserve leurs travaux distincts.

**Décision confirmée — inscription initiale en lot :** depuis la classe
annuelle, l'enseignant sélectionne les profils déjà connus à réinscrire,
puis écrit les nouveaux élèves, un par ligne, le prénom et le nom dans deux
cases ; il peut aussi coller une liste, qui remplit ces lignes (forme
révisée le 9 octobre 2026, voir plus bas). Il vérifie
une liste récapitulative et corrige les erreurs avant confirmation. Les
homonymes sont signalés sans fusion automatique. L'ajout individuel reste
possible. La première livraison n'inclut pas d'import complexe avec
correspondance de colonnes ni de synchronisation avec un annuaire.

La confirmation crée les inscriptions dans la classe choisie et seulement
les nouveaux profils nécessaires. Cette opération n'attribue aucun
chapitre et ne reprend pas les anciennes permissions. Les règles de
conservation du code personnel restent celles ci-dessus ; une réinscription
ne le renouvelle pas automatiquement. Ce parcours concerne uniquement le
mode classe, pour les récits classiques comme à choix ; un projet personnel
ne demande aucune inscription d'élève.

**Critères d'acceptation :**

- **F01-AC10 — Constitution d'une classe de 25 élèves :** étant donné
  15 profils déjà connus et 10 nouveaux élèves, lorsque l'enseignant
  sélectionne les 15 profils, colle les 10 nouveaux noms puis confirme
  le récapitulatif, alors la classe comporte 25 inscriptions, seuls
  10 profils sont créés et aucune attribution de récit n'est ajoutée.
- **F01-AC11 — Correction avant confirmation :** étant donné un nom mal
  saisi dans la liste préparée, lorsque l'enseignant le corrige avant de
  confirmer, alors le nouveau profil porte le nom corrigé et aucun profil
  supplémentaire ne provient de la saisie abandonnée. Quitter sans confirmer
  ne crée pas les inscriptions présentées dans ce récapitulatif.
- **F01-AC12 — Homonyme repéré dans le lot :** étant donné un profil déjà
  connu portant le même nom qu'une nouvelle ligne, lorsque l'enseignant
  vérifie le récapitulatif, alors cette correspondance est signalée et il
  peut vérifier s'il s'agit du profil à réutiliser ou d'un autre élève ;
  le système ne décide pas d'une fusion sur le seul nom.
- **F01-AC33 — Prénom et nom en deux cases :** étant donné l'enseignant
  qui écrit « Jean Marie » dans la case du prénom et « de la Batellerie »
  dans celle du nom, lorsqu'il confirme le récapitulatif, alors l'élève est
  inscrit avec ce prénom et ce nom ; une ligne qui n'a qu'un nom est
  signalée avant le récapitulatif.
- **F01-AC34 — Liste collée :** étant donné une liste de quatre lignes
  collée dans la première ligne, dont « Jean Marie de la Batellerie »,
  lorsque l'enseignant regarde les cases, alors chaque ligne non vide a
  rempli une ligne, « Jean » dans le prénom et le reste dans le nom, et il
  corrige ces deux cases avant de continuer ; collée depuis un tableur, une
  ligne met sa première colonne dans le prénom et la suivante dans le nom.

**Décisions confirmées le 6 octobre 2026 — la classe, son année et ses
élèves :**

- **Une classe, c'est un nom et une année scolaire** (« CM1-CM2 »,
  « 2026-2027 »). Elle est **en cours** tant que l'enseignant n'a pas
  terminé son année. Les « classes en cours » de
  [F12.3](#f123--lecture-des-anciens-livres-par-les-autres-classes) sont
  celles-là.
- **« Terminer l'année » est un geste de l'enseignant, qui se défait.**
  L'accès de classe de F06.4 ne s'ouvre plus sur les postes, et la classe se
  range sous « Années passées ». Rien n'est supprimé : les projets, les
  textes, les profils, les codes et les attributions restent, et
  l'enseignant garde tout son accès, livre et partage compris. Une classe
  dont l'année est terminée ne reçoit ni élève ni projet nouveau.
  « Rouvrir la classe » rend l'accès, avec les mêmes informations de
  connexion et les mêmes codes.
- **Jamais d'office.** L'application propose de terminer l'année quand
  l'enseignant crée une classe pour une année suivante ; elle ne le fait pas
  seule, ni à une date. Alternatives écartées : la bascule automatique en
  fin d'année scolaire, qui tombe mal (pays d'usage non fixé, livre fini
  pendant l'été) ; aucun terme, qui laissait valables les anciens accès.
- **Prénom obligatoire, nom facultatif, dans deux cases.** Décidé le
  9 octobre 2026, après l'essai de l'étape 1 : chaque ligne de la saisie en
  lot a une case pour le prénom et une pour le nom, et une ligne vide
  s'ajoute d'elle-même. Un prénom composé (« Jean Marie ») et un nom à
  particule (« de la Batellerie ») s'écrivent ainsi sans ambiguïté. Une
  liste collée remplit les lignes à partir de celle où l'on colle : chaque
  ligne est coupée au premier espace, ou aux colonnes si elle vient d'un
  tableur (la première pour le prénom), et l'enseignant corrige dans les
  cases ce qui est mal tombé. Une ligne qui a un nom sans prénom est
  montrée et rien ne passe. Le récapitulatif laisse encore corriger une
  ligne. Cette forme remplace la règle du 6 octobre, « une ligne de texte,
  "Prénom" ou "Prénom Nom" », qui coupait mal ces prénoms et ces noms.
  Alternative écartée : garder la zone de texte avec un séparateur entre le
  prénom et le nom, plus rapide à faire mais moins claire. Les élèves ne
  voient que des prénoms. Lorsque deux
  élèves d'une même classe portent le même prénom, l'initiale du nom
  s'ajoute pour eux (« Lucas B. », « Lucas M. ») ; si elle manque, la
  classe la demande. Le nom sert à l'enseignant, notamment pour reconnaître
  un profil d'une année à l'autre ; le livre garde les prénoms seuls de
  [F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture).
- **« Retirer de la classe » met fin à l'inscription.** L'élève ne figure
  plus dans le choix des prénoms et perd ses chapitres dans les projets de
  cette classe. Ses textes restent, à son prénom ; ses scènes en cours ou à
  reprendre redeviennent « En cours », « Pas encore prise », et sa scène « À
  valider » lui reste jusqu'à la décision de l'enseignant, selon la
  précision du 7 octobre 2026 plus bas. Son profil reste connu : on
  le réinscrit avec le même code. Un élève inscrit par erreur, qui n'a rien
  écrit ni remis, disparaît complètement. L'alternative écartée gardait ses
  scènes à son prénom, à redonner une à une.

- **F01-AC18 — Terminer l'année :** étant donné la classe « CM1-CM2 »
  2025-2026, deux projets et vingt-cinq élèves, lorsque l'enseignant choisit
  « Terminer l'année », alors la classe passe sous « Années passées », ses
  informations de connexion sont refusées sur un poste, et l'enseignant
  ouvre toujours ses deux projets, leurs textes et leur livre.
- **F01-AC19 — Rouvrir :** étant donné cette classe dont l'année est
  terminée, lorsque l'enseignant choisit « Rouvrir la classe », alors elle
  revient parmi les classes en cours, et Alice entre avec les mêmes
  informations de classe et le même code, dans les mêmes chapitres.
- **F01-AC20 — Proposé, jamais d'office :** étant donné une classe
  2025-2026 en cours, lorsque l'enseignant crée une classe 2026-2027, alors
  l'application lui propose de terminer l'année de la première ; s'il ne
  répond pas, les deux classes restent en cours.
- **F01-AC21 — Deux fois le même prénom :** étant donné « Lucas Bernard »
  déjà inscrit et une nouvelle ligne « Lucas Morel », lorsque l'enseignant
  confirme le récapitulatif, alors les élèves lisent « Lucas B. » et
  « Lucas M. » au choix des prénoms ; avec une ligne « Lucas » sans nom, le
  récapitulatif demande son nom ou son initiale avant de confirmer.
- **F01-AC22 — Retirer un élève qui a écrit :** étant donné Bilal, attribué
  à « La lisière », avec S016 validée et S017 à reprendre, lorsque
  l'enseignant le retire de la classe, alors Bilal n'est plus au choix des
  prénoms ni dans « La lisière », S016 garde son texte et son prénom, S017
  garde son texte et devient « En cours », « Pas encore prise », et son profil peut être
  réinscrit avec le même code.
- **F01-AC23 — Retirer un élève inscrit par erreur :** étant donné un élève
  inscrit ce matin, sans texte ni remise, lorsque l'enseignant le retire de
  la classe, alors son profil n'est plus proposé parmi les profils connus.

**Décisions confirmées le 7 octobre 2026**, d'abord proposées par la
maquette :

- **Scènes d'un élève retiré.** Sa scène « À valider » reste à valider, à
  son prénom, jusqu'à la décision de l'enseignant : validée, elle garde son
  prénom comme repère ; renvoyée, elle devient « En cours », sans élève. Sa
  scène « À reprendre » redevient « En cours », sans élève ; la remarque
  reste lisible avec la remise. Les scènes « Validé » et « Prête » ne
  changent pas.
- **Classe dont l'année est terminée : en lecture.** Elle se consulte sans
  se modifier — ni élève inscrit ou retiré, ni code, ni horaires. Pour y
  changer quelque chose, l'enseignant la rouvre.

- **F01-AC25 — Scènes d'un élève retiré :** étant donné Bilal, avec S016 à
  valider et S017 à reprendre, lorsque l'enseignant le retire de la classe,
  alors S016 reste « À valider » à son prénom et S017 devient « En cours »,
  « Pas encore prise », avec son texte ; lorsque l'enseignant valide S016,
  alors elle porte « Validé » et garde le prénom de Bilal.
- **F01-AC26 — Année terminée, classe en lecture :** étant donné une classe
  dont l'année est terminée, lorsque l'enseignant l'ouvre, alors il lit ses
  élèves et ses projets, sans commande pour inscrire, retirer, changer un
  code ou régler les horaires ; « Rouvrir la classe » les lui rend.

**Précisions proposées par la maquette, sans retour du porteur :** le
retrait d'un élève qui a écrit demande une confirmation qui dit ces effets,
celui d'un élève qui n'a rien écrit se fait d'un geste, avec « Annuler » ;
l'année scolaire est proposée d'après la date et se corrige ; une classe
sans élève ni projet se supprime, les autres se terminent.

**Questions ouvertes :** la suppression définitive d'une classe passée et de
ses profils (F14) ; l'élève qui change de classe en cours d'année chez le
même enseignant. Les postes où la classe est ouverte au moment où l'année se
termine ou un élève est retiré sont réglés le 8 octobre 2026 en
[F06.4](#f064--classe-de-référence-et-postes-partagés).

**Décision confirmée le 2 octobre 2026 — nom affiché aux élèves :**
l'enseignant choisit dans son compte le nom sous lequel les élèves le voient
(« Mme Laurent », « M. Dupont », « Julie »). Les textes adressés aux élèves
emploient ce nom ; tant qu'il n'est pas renseigné, ils disent « ton
enseignant(e) ». Aucun texte ne dit « ta maîtresse » ni « ton maître » :
l'adulte peut être un homme, et le second degré n'emploie pas ces mots.

- **F01-AC13 — Nom affiché :** étant donné un enseignant ayant choisi
  « M. Dupont », lorsqu'Alice lit le repère d'un paragraphe protégé, alors il
  indique « Préparé par M. Dupont » ; pour un enseignant sans nom affiché, il
  indique « Préparé par ton enseignant(e) ».

**Approfondissements différés :** distinction des homonymes parmi les
profils connus d'années différentes (dans une classe, elle est décidée
ci-dessus), reprise après échec partiel et prévention des inscriptions
répétées lors d'une nouvelle tentative ; distribution et récupération des
accès en F06.4.

Le besoin de lecture des anciens livres par d'autres classes est traité en
F12.3 ; il ne donne aucun droit de rédaction sur les anciens projets.

## F02 — Préparer le récit et les décisions communes

**Objectif confirmé :** aider l'adulte à démarrer le projet et à faire avancer
les décisions en classe, notamment sur l'univers, les personnages, l'enjeu,
les grandes étapes et les premières bifurcations. Le porteur considère cet
accompagnement comme important pour prévenir l'abandon des projets.

**Décisions confirmées :**

- Proposer une préparation guidée avec des repères et des exemples. Une
  préparation déjà effectuée peut permettre d'abréger ce parcours, selon le brief.
- Présenter un carnet en quatre rubriques souples : univers, personnages,
  enjeu et grandes étapes du récit. Le texte libre, accompagné de questions
  ou d'exemples de guidage, permet de consigner une préparation déjà faite
  oralement ou sur papier. L'adulte peut compléter seulement les rubriques
  utiles puis passer à l'organisation du récit ; aucune fiche détaillée de personnage
  ou de lieu n'est obligatoire. Les grandes étapes présentent le plan commun
  selon les règles ci-dessous.
- **Ajout du 2 octobre 2026 :** une rubrique facultative réunit les objets de
  l'histoire et les formules d'action, selon
  [F04.2](#f042--objets-de-lhistoire). Elle s'ajoute aux quatre rubriques sans
  en changer les règles.
- **Ajouts du 3 octobre 2026 :** dans un récit à choix, cette rubrique
  reçoit aussi la feuille d'aventure, le dé et les règles du jeu, et une
  rubrique « Phrases de choix » réunit la formule de renvoi, ses
  constructions et la marque de fin, selon
  [F11.6](#f116--trois-temps-pour-préparer-le-livre). Ces réglages servent
  dès l'écriture et ne se trouvent plus dans la destination Livre.
- Conserver dans l'application les informations et décisions de préparation,
  utiles à la rédaction et au contexte des aides IA que l'adulte choisit
  d'utiliser. L'IA reste facultative selon F13.
- Expliquer dès le début de la préparation l'utilité de ces informations
  pour la cohérence du récit et pour contextualiser l'aide IA, si l'adulte
  choisit et peut utiliser celle-ci.
- Recueillir les informations progressivement, puis demander les compléments
  utiles au moment d'une aide qui en a besoin. Ne pas imposer de compléter
  toute la préparation avant une aide ponctuelle. Une correction orthographique
  et une aide à construire la trame ne nécessitent pas le même contexte ;
  les informations nécessaires à chaque action restent à détailler.
- La préparation est unique, que l'enseignant la renseigne seul ou pendant
  une discussion collective. Sa page est accessible uniquement à l'enseignant
  en mode classe ; il peut choisir de la projeter. Participer à l'atelier
  ne donne pas aux profils élèves un accès individuel à cette page.
  Il n'existe pas de deuxième version de la préparation à publier ou synchroniser.
- La partie est une enveloppe titrée regroupant les chapitres, avec
  son image de repérage selon F10.1 ; elle ne porte pas de résumé narratif.
  Le résumé et le déroulement préparé se situent au niveau du chapitre.
  L'enseignant peut les approfondir depuis la page des parties et chapitres, sur les
  mêmes éléments que dans la préparation. Le résumé est consultable par les
  élèves attribués selon les règles ci-dessous ; les contenus non attribués
  restent protégés selon F06.
- Pour la première livraison, l'enseignant est seul à saisir et modifier
  la préparation. Les élèves participent aux échanges en classe ; aucun
  profil de participation ne leur donne accès à la page de préparation.
- Le guidage de la préparation soutient ces échanges. La première livraison
  ne comporte pas d'outil dédié de collecte numérique d'idées ou de vote :
  la classe peut échanger et décider oralement, au tableau ou sur papier.
  Les propositions des élèves concernant leurs scènes et chapitres restent
  prévues en F06 et F07.

**Parcours de préparation collective :** l'enseignant s'appuie sur les
repères et exemples de l'application pour guider la discussion ; la classe
retient des éléments du récit, puis l'enseignant les consigne dans la
préparation du projet. Ce travail n'exige pas que les élèves
se connectent chacun à l'application. Les décisions peuvent être complétées
progressivement selon les règles ci-dessus.

**Critères d'acceptation sur les éléments confirmés :**

- **F02-AC01 — Préparation conservée :** étant donné une classe ayant retenu
  un héros et un enjeu, lorsque l'enseignant consigne ces décisions dans la
  préparation du projet puis y revient lors de la rédaction, alors il les
  retrouve sans devoir les ressaisir. Leur usage par l'IA reste soumis au
  contexte pertinent et autorisé pour l'action demandée.
- **F02-AC02 — Utilité expliquée dès la préparation :** étant donné un adulte
  commençant la préparation, lorsqu'il découvre les informations à renseigner,
  alors leur intérêt pour le récit et pour les aides IA facultatives lui est
  expliqué avant sa première demande d'aide IA.
- **F02-AC03 — Contexte progressif :** étant donné une indication de consigne
  suffisante pour l'aide demandée, lorsque l'enseignant sollicite sa formulation,
  alors l'application n'exige pas de compléter les autres rubriques de
  préparation sans rapport avec cette demande. Si des informations utiles
  manquent pour une autre aide, elle peut les lui demander à ce moment-là.
- **F02-AC04 — Page de préparation réservée à l'enseignant :** étant donné
  une préparation projetée pendant l'atelier, lorsqu'Alice se connecte ensuite
  avec son profil élève et tente d'ouvrir cette page, y compris par un lien
  direct, alors son accès est refusé sans exposer le contenu de la préparation.
  L'enseignant retrouve les mêmes données depuis son espace.
- **F02-AC05 — Préparation collective sans connexion de chaque élève :** étant
  donné une classe de 25 élèves ayant choisi son héros oralement et seul
  l'enseignant connecté, lorsqu'il consigne ce choix, alors la préparation
  est enregistrée sans exiger de vote numérique ni d'identification des élèves.
- **F02-AC06 — Profil d'organisation sans accès à la préparation :** étant
  donné un élève ayant le profil « écriture et organisation », lorsqu'il
  tente de lire ou de modifier une rubrique de préparation, alors ces actions
  sont refusées ; ses droits dans le chapitre attribué restent inchangés.
- **F02-AC07 — Carnet renseigné partiellement :** étant donné une préparation
  papier avec un héros et un enjeu, lorsque l'enseignant consigne ces éléments
  dans les rubriques personnages et enjeu puis passe à l'organisation du récit, alors
  leur conservation et la suite du travail ne sont pas bloquées par les
  rubriques univers et grandes étapes encore vides ni par l'absence de fiches
  individuelles détaillées.

**Approfondissements différés :** exemples et champs détaillés,
présentation du guidage, informations requises pour chaque aide et sélection
du contexte transmis ; présentation de la préparation enseignant et protection
des détails locaux selon les attributions de F06.
En mode personnel, la préparation concerne l'auteur adulte ; en récit classique,
les bifurcations ne sont pas un élément de préparation nécessaire.

**Décision confirmée — un plan commun aux deux vues :** la rubrique des
grandes étapes et la page des parties et chapitres présentent les mêmes parties et
chapitres. Il n'existe plus d'étape narrative indépendante à recopier ou
à synchroniser avec une partie. Ajouter, renommer ou modifier un élément
par une commande autorisée dans une vue se retrouve dans l'autre ; une
suppression effectuée selon les règles applicables concerne le même élément.
Cette décision remplace le passage d'une liste d'étapes indépendante aux
parties et l'édition séparée de cette liste après création.

Les rubriques univers, personnages et enjeu restent des informations au
niveau du projet ; elles ne sont pas dupliquées dans chaque partie. La
présentation guidée aide à élaborer le plan ; la page des parties et chapitres aide à
naviguer et à poursuivre sa préparation. Les titres des parties et
chapitres et les résumés de chapitres peuvent être travaillés
avec l'aide IA facultative, dont les suggestions
restent distinctes des éléments retenus.

**Conséquence de parcours :** ajouter une partie retenue depuis la préparation
crée cette partie et son premier chapitre vide selon F03.1, sans scène,
choix ni élève attribué. Passer ensuite à la page des parties et chapitres est un changement
de vue, sans deuxième action de création. La génération d'idées seule ne
crée aucun élément. Dans le récit à choix, le rangement du plan ne détermine
pas les destinations des choix. Le même plan est utilisé dans les quatre modes.

**Critères d'acceptation :**

- **F02-AC08 — Ajout dans le plan commun :** étant donné un projet en cours
  de préparation, lorsque l'adulte ajoute deux parties retenues dans la vue
  guidée, alors la page des parties et chapitres présente ces mêmes deux parties,
  chacune avec son premier chapitre vide, sans scène, choix ni attribution.
- **F02-AC09 — Modification dans les deux vues :** étant donné « La forêt »
  dans le plan, lorsque l'adulte renomme cette partie « La forêt endormie » depuis la
  page des parties et chapitres, alors la préparation présente ce titre pour la même
  partie. Un renommage depuis la préparation a le même effet réciproque.
- **F02-AC10 — Changement de vue sans duplication :** étant donné un plan
  contenant trois parties, lorsque l'adulte passe plusieurs fois de la
  préparation à la page des parties et chapitres, alors ces trois parties ne sont
  ni recréées ni dupliquées.

- **F02-AC14 — Résumé au même endroit dans les deux vues :** étant donné
  un résumé saisi pour « La lisière », lorsque l'enseignant le développe depuis
  la page des parties et chapitres puis revient au plan de préparation, alors il retrouve
  ce texte pour le même chapitre. Aucun résumé parallèle de la partie
  « La forêt » n'est à maintenir.

**Décision confirmée — résumé de chapitre :** un texte facultatif
consigne l'intention et le déroulement prévu du passage. Il sert surtout à
contextualiser l'aide IA demandée par l'adulte. Il reste consultable par les
élèves attribués au chapitre, sans deuxième version privée/publique ni
réglage de confidentialité par résumé. L'adulte le modifie ; une modification
retenue devient visible aux élèves concernés sans publication supplémentaire.
Le porteur indique que les élèves connaissent déjà les grandes lignes : le
résumé n'est pas une étape de lecture obligatoire avant leur rédaction.
Les consignes des scènes précisent le travail demandé ; le résumé ne les
remplace pas automatiquement. Son absence ne bloque ni l'attribution ni
l'écriture. Les règles de contexte progressif et pertinent s'appliquent à
l'IA ; ce résumé n'est pas exigé pour toute aide et ne garantit pas sa qualité.

- **F02-AC15 — Résumé selon l'attribution :** étant donné Alice attribuée
  à « La lisière » et Bilal non attribué, lorsque l'enseignant enregistre un
  résumé ou sa modification, alors Alice peut consulter le texte retenu
  dans son espace de travail sans accéder à la page de préparation ; Bilal
  ne peut pas le lire, y compris en ouvrant directement le détail. Les deux
  conservent la visibilité des titres et images de cartes prévue en F03.1.
- **F02-AC16 — Résumé facultatif :** étant donné un chapitre sans résumé
  et une scène à rédiger, lorsque l'enseignant l'attribue à Alice et qu'elle
  ouvre cette scène, alors elle peut écrire sans remplir ni valider un résumé.
  La présence d'un résumé n'impose pas non plus d'en confirmer la lecture.

Les protections de retrait du plan sont définies en F03.1 et s'appliquent
aux deux vues ; le plan unique ne donne aucun droit de suppression aux élèves.

**Approfondissements différés :** ordre initial et insertion des nouveaux
éléments, modalités de l'ajout en lot depuis l'IA confirmé en F13.5,
reprise après échec partiel et présentation
des propositions non retenues. Il n'y a plus de correspondance étape/partie
ni d'état « déjà converti » à gérer.

**Décision confirmée — atelier de préparation projeté :** présenter les
quatre rubriques sous forme d'étapes adaptées à la projection et à la discussion
en classe, avec des aides à la réflexion et l'aide IA facultative. Le porteur
menait jusqu'ici cette phase en dehors de l'application ; son efficacité en
séance reste à éprouver. Cette vue utilise les mêmes informations que le
carnet, sans document de présentation séparé à synchroniser.

Chaque étape présente une question principale, des relances facultatives,
les pistes discutées et une synthèse « Nous retenons… » saisie par
l'enseignant. La progression est conseillée : revenir au carnet, sauter une
étape, interrompre ou reprendre l'atelier reste possible. Aucune collecte
numérique des réponses des élèves ni vote intégré n'est ajouté.

**Projection confirmée :** concevoir d'abord pour un écran dupliqué ; les
échanges IA peuvent être visibles et discutés avec la classe, sans relecture
privée obligatoire. La préparation reste accessible depuis le seul espace
enseignant ; la projection est un partage visuel choisi, sans ouverture de
la page ni de l'historique IA aux profils élèves. Les suggestions restent des pistes jusqu'à leur application par
l'enseignant selon F13.4. Les modalités précises du contexte IA utilisable
pendant l'atelier restent à arbitrer.

**Critères d'acceptation :**

- **F02-AC11 — Même préparation dans les deux vues :** étant donné une
  décision consignée par l'enseignant pendant l'atelier, lorsqu'il revient
  au carnet, alors il retrouve cette décision sans transfert ni ressaisie.
- **F02-AC12 — Discussion sans identification des élèves :** étant donné
  l'enseignant connecté et son écran dupliqué devant la classe, lorsqu'il
  affiche une étape et sollicite une aide IA, alors les élèves peuvent
  participer oralement et voir l'échange sans compte ni vote numérique.
- **F02-AC13 — Progression souple :** étant donné un atelier interrompu
  après les personnages, lorsque l'enseignant reprend le projet, alors les
  éléments retenus subsistent et il peut ouvrir une autre rubrique sans
  achever obligatoirement les rubriques précédentes.

**Décision confirmée le 30 septembre 2026 — pistes discutées :** pendant
l'atelier, l'enseignant peut noter les pistes évoquées par la classe et leur
statut (retenue, écartée ou à discuter). Les pistes écartées restent
conservées dans la rubrique correspondante du carnet, repliées, pour y
revenir plus tard ; elles ne font pas partie de la synthèse « Nous retenons… »
et ne servent pas de décision de la classe. Cette consignation reste une
saisie de l'enseignant, sans collecte numérique ni vote.

- **F02-AC17 — Piste écartée conservée :** étant donné « Des jumeaux
  inséparables » noté puis écarté pendant l'étape Personnages, lorsque
  l'enseignant rouvre le carnet, alors cette piste est retrouvée parmi les
  pistes écartées de la rubrique, sans figurer dans le texte retenu.

**Arbitrages nécessaires :** contexte IA précis et sortie de la vue projetée ;
durée de conservation des pistes écartées. Il n'y a pas de version
publique de la préparation à maintenir. Les étapes du guidage sont distinctes des
parties et chapitres du plan narratif.

## F03 — Organiser le récit

### F03.1 — Histoire, parties, chapitres et scènes

**Objectif :** regrouper un ensemble narratif sans imposer un graphe trop
chargé ni un périmètre d'accès unique à tous ses participants.

**Décisions confirmées :**

- Structure fixe : histoire → parties → chapitres → scènes. Chaque
  partie appartient à une histoire, chaque chapitre à une partie et
  chaque scène à un chapitre. Aucun niveau imbriqué supplémentaire et
  aucune scène directement rattachée à la partie ou à l'histoire.
- Chaque partie comporte au moins un chapitre. Son premier
  chapitre vide est créé automatiquement, y compris lors de la création
  depuis la préparation de F02. Il ne comporte pas d'élèves attribués par défaut.
- Les attributions et profils s'appliquent uniquement aux chapitres
  selon F06. La partie regroupe ; elle ne donne pas de droits globaux
  supplémentaires et ne porte pas de résumé narratif selon F02. Les images
  de repérage suivent F10.1 et les couleurs de chapitres suivent le design.
- L'ajout d'un deuxième chapitre ne transfère ni ne copie automatiquement
  les attributions du premier. Il ne change pas les droits existants et
  n'ouvre aucun nouvel accès aux élèves sans attribution explicite.
- Avec un seul chapitre, la navigation peut ouvrir directement son
  contenu. L'écran d'attribution rend néanmoins explicite l'unité attribuée,
  afin que l'ajout d'un deuxième chapitre ne change pas le sens des droits.
- Dans le récit à choix, une scène reste un passage adressable du livre,
  comparable à un paragraphe numéroté, et non une page.
- Le rangement et les chemins sont distincts : déplacer une scène ne change
  pas à lui seul les destinations des choix. Les effets sur les droits et
  le travail en cours doivent être précisés avant de permettre un déplacement.
- L'enseignant peut faire commencer un chapitre sans attendre tous les
  raccords ni la préparation du reste du récit. Il n'y a pas de statut
  d'ouverture supplémentaire ; les attributions régissent l'accès.

La justification de ce niveau fixe, préféré à de simples groupes visuels,
est dans [l'ADR sur l'unité d'attribution](adr/0001-chapitre-unite-attribution.md).
Cette structure s'applique aux quatre combinaisons de modes ; les attributions
élèves ne s'appliquent pas au mode personnel.

**Parcours visuel à préciser :** l'adulte peut organiser l'ensemble de la partie
et accéder au détail d'un chapitre ; le graphe demeure complémentaire.
La vue proposée avec des blocs repliables doit respecter les droits de lecture :
un élève ne découvre pas des scènes réservées en ouvrant une vue plus large.
La présentation des blocs, de leurs images et des raccords reste à concevoir.
La lisibilité et les performances d'un graphe chargé resteront à éprouver.

**Propositions conservées :** déplacement par glisser-déposer avec une autre
commande accessible au clavier ; signalement d'un ensemble sans entrée narrative
sans bloquer sa préparation. Un ensemble contenant le départ peut légitimement
ne recevoir aucun lien entrant. Ces commandes et signaux restent à détailler.

**Décision confirmée — récit classique :** l'ordre des parties, puis des
chapitres dans chaque partie, puis des scènes dans chaque chapitre
détermine l'ordre de lecture. Déplacer explicitement un chapitre déplace
tout son passage dans cet ordre. Le lecteur et le PDF suivent le même ordre,
sans choix artificiels entre scènes ni déplacement automatique pour remplir
les pages. Les permissions de réorganisation restent à préciser en F06 et
les exclusions relèvent de F11.2. Dans un récit à choix, les destinations
continuent de déterminer les chemins indépendamment du rangement.

**Critères d'acceptation :**

- **F03-AC01 — Structure fixe :** étant donné une histoire, lorsque l'adulte
  crée une partie puis des scènes, alors la partie contient au moins un
  chapitre, chaque scène appartient à un seul chapitre et aucun
  niveau supplémentaire n'est imbriqué.
- **F03-AC02 — Conservation des chemins :** étant donné un choix de A vers B,
  lorsque l'adulte déplace B vers un autre chapitre de la même histoire,
  alors le choix mène toujours à B. Ce critère ne tranche pas les effets du
  déplacement sur les accès ou une prise en charge en cours.
- **F03-AC07 — Travail avant raccords :** étant donné un chapitre attribué
  ne recevant encore aucun choix externe, lorsque l'enseignant y fait commencer
  la rédaction, alors l'absence de raccord et de préparation des parties suivantes
  ne bloque pas ce travail.
- **F03-AC08 — Ordre classique sans choix :** étant donné les parties A puis B,
  chacune avec un seul chapitre, contenant respectivement A1, A2 et B1,
  lorsque le récit est lu ou exporté, alors l'ordre est A1, A2, B1 sans choix
  artificiels.
- **F03-AC09 — Composition sans déplacement narratif :** étant donné l'ordre
  de scènes A1, A2, B1, lorsque la composition est recalculée, alors B1 n'est
  pas déplacée pour remplir une page. Un réordonnancement explicite de A2
  avant A1 modifie l'ordre en A2, A1, B1.
- **F03-AC10 — Premier chapitre automatique :** étant donné une nouvelle
  partie créée depuis la préparation ou la page des parties et chapitres, lorsque sa création réussit,
  alors elle comporte un chapitre vide sans scène ni élève attribué.
- **F03-AC11 — Second chapitre sans héritage :** étant donné Alice
  attribuée à « La lisière » dans « La forêt », lorsque l'adulte y ajoute
  « Le sanctuaire », alors Alice conserve son accès à « La lisière » sans
  obtenir celui du nouveau chapitre.

- **F03-AC12 — Ordre classique des chapitres :** étant donné « La forêt »
  avec « La lisière » puis « Le sanctuaire », lorsque le récit classique est
  lu ou exporté, alors les scènes de la lisière précèdent celles du sanctuaire,
  chacune dans l'ordre de son chapitre. Si l'adulte inverse explicitement
  les deux chapitres, leurs passages sont inversés dans cet ordre.

**Décision confirmée — retrait récupérable des ensembles contenant du travail :**
retirer une partie ou un chapitre applique les mêmes protections depuis
la préparation ou la page des parties et chapitres. Avant confirmation par l'adulte,
l'application annonce le périmètre et les effets sur le travail contenu et
signale les liens affectés. Le retrait conserve la possibilité de récupérer
ce travail ; aucun lien n'est redirigé automatiquement vers une autre scène.
Ces règles s'appliquent à l'auteur personnel comme à l'enseignant, dans les
deux types de récit ; elles n'ajoutent aucun droit de suppression aux élèves.

- **F03-AC13 — Mêmes protections dans les deux vues :** étant donné un
  chapitre contenant des textes d'élèves et recevant un choix depuis
  un autre chapitre, lorsque l'enseignant demande son retrait depuis
  l'une ou l'autre vue, alors le travail concerné et le lien affecté sont
  annoncés avant confirmation. Annuler conserve le chapitre et ses textes.
- **F03-AC14 — Travail récupérable sans réorientation des choix :** étant
  donné ce même chapitre, lorsque l'enseignant confirme son retrait,
  alors ses textes restent récupérables et le choix affecté est signalé
  sans être redirigé vers une autre scène. Retirer la partie applique
  cette protection à l'ensemble du travail qu'elle contient.

**Décision confirmée — première scène dans un chapitre vide :**
l'enseignant ou l'auteur personnel peut ajouter directement une scène vide
dans un chapitre, sans manipuler le graphe ni solliciter l'IA. Un repère
initial permet de la retrouver immédiatement ; le titre peut être précisé
ensuite. La consigne reste facultative selon F07.1. Les élèves du profil
par défaut peuvent ensuite écrire dans cette scène selon leurs droits ;
un chapitre vide ne leur donne pas implicitement le droit d'en créer une.
Cette commande ne crée aucune scène automatiquement à la création d'un
chapitre. L'ajout en lot et les commandes de présentation restent à examiner.

- **F03-AC16 — Première scène sans préparation obligatoire :** étant donné
  un chapitre vide, lorsque l'adulte utilise « Ajouter une scène », alors
  une scène vide munie d'un repère est disponible sans titre personnalisé,
  consigne, manipulation du graphe ni appel IA préalable. La création du
  chapitre seul n'avait créé aucune scène.
- **F03-AC17 — Écriture dans la scène préparée :** étant donné un élève du
  profil par défaut attribué à ce chapitre dans une plage autorisée, lorsque
  l'adulte y ajoute une scène, alors l'élève peut la retrouver et y écrire
  selon F06/F07, sans acquérir le droit de créer lui-même une scène.

**Questions ouvertes :** noms initiaux, commandes de création des scènes et
rangement ; présentation du repérage du parent ; modalités et durée de récupération,
restauration des liens et des attributions, traitement des saisies en cours lors
d'un retrait, allègement possible pour un ensemble vide ; passage de deux chapitres à un ;
effets d'un déplacement sur attributions, prises en charge, consignes et texte
commencé. Les raccords suivent F06.1 ; le périmètre du playtest reste à
arbitrer en F09.1. Tranchés le 6 octobre 2026, plus bas : le mot et le lieu
de la récupération (« Supprimer », « Corbeille du projet »), l'ordre dans le
chapitre, et le déplacement entre chapitres, différé.

**Décision confirmée — page commune aux parties et chapitres :**
une seule page présente les cartes des chapitres regroupées par partie.
Le titre et l'image de repérage permettent d'identifier chaque regroupement ;
les détails apparaissent à l'activation d'une carte, selon les droits de
l'utilisateur. Le détail n'exige pas un parcours successif par deux listes
séparées, l'une de parties puis l'autre de chapitres. Cette organisation
s'applique aux quatre modes ; la disposition exacte et le contenant du détail
restent à éprouver sur les maquettes.

**Visibilité des cartes :** cette page présente le même
plan que la préparation selon F02. L'enseignant peut sélectionner les éléments,
en ajouter et les modifier dans ses droits. Les élèves du projet peuvent
voir les titres et les images de repérage des parties et chapitres,
même lorsqu'ils n'ont pas d'attribution dans ces derniers. Le porteur accepte
que ces repères évoquent les lieux ou donnent un aperçu de l'ambiance.

La visibilité de ces cartes n'ouvre pas les scènes, les consignes ni le
déroulement d'un chapitre non attribué. Une image n'est pas masquée ou
remplacée par un visuel générique en raison de l'absence d'attribution ;
le visuel par défaut sert lorsqu'aucune image n'a été choisie. Les résumés
suivent F02 : consultables uniquement dans les chapitres attribués pour
un élève. Le signalement d'un contenu inaccessible reste à concevoir.

- **F03-AC15 — Vue regroupée sans accès indu :** étant donné « La forêt »
  contenant « La lisière » et « Le sanctuaire », lorsque l'utilisateur ouvre
  la page d'organisation, alors il retrouve les deux cartes sous le même
  regroupement. Alice, attribuée seulement à « La lisière », peut en ouvrir
  le détail autorisé ; activer l'autre carte ne lui révèle ni résumé,
  consignes ni scènes. L'enseignant peut ouvrir les deux détails.

La préparation guidée et la page des parties et chapitres modifient le même plan selon
F02 ; aucune liste séparée d'étapes éditables n'est conservée. L'aide aux
idées de parties depuis cette page est confirmée en F13.5.

**Décision confirmée — scènes à l'intérieur d'un chapitre :** la vue
« Scènes » s'ouvre par défaut, avec des cartes compactes portant référence,
titre, état de travail et, en mode classe, prise en charge actuelle. Pour
un récit à choix, une vue « Graphe » est directement accessible au même
niveau pour comprendre embranchements et convergences. Les deux vues
ouvrent le même espace de travail de la scène ; leur consultation ou leur
bascule ne change ni contenu, ni chemins, ni prises en charge, ni droits.

En récit classique, les cartes suivent l'ordre de lecture et aucun graphe
n'est nécessaire. En récit à choix, leur rangement ne définit pas un chemin
de lecture. Dans un chapitre attribué, toutes les scènes lisibles restent
retrouvables, avec les prises en charge de l'élève identifiables sans masquer
par défaut celles des camarades. Les restrictions de F06 s'appliquent aussi
au graphe et à ses raccords externes. En mode personnel, les indications et
commandes propres aux élèves sont absentes.

Ouvrir une scène donne accès à la consigne et au texte selon les droits,
avec un retour identifiable au chapitre. Lire une scène ne la prend pas
en charge ; la reprise pour écrire suit F06.3. Les choix de disposition et
les cas à représenter sont dans le
[design](design.md#affichage-des-scènes-dans-un-chapitre).

- **F03-AC18 — Deux vues du même récit à choix :** étant donné un chapitre
  autorisé contenant six scènes, lorsque l'utilisateur l'ouvre, alors il
  retrouve ses cartes dans la vue Scènes. Passer au Graphe montre les liens
  existants et permet d'ouvrir les mêmes scènes, sans modifier le récit ni
  les prises en charge.
- **F03-AC19 — Lecture du travail des camarades :** étant donné Alice et
  Bilal attribués au même chapitre avec des prises en charge distinctes,
  lorsque Alice ouvre ce chapitre, alors les scènes prises par Bilal restent
  consultables et ses propres prises en charge sont identifiables. Consulter
  une scène de Bilal ne transfère pas sa prise en charge à Alice.
- **F03-AC20 — Variante classique :** étant donné un chapitre classique
  dont l'ordre est A, B, C, lorsque l'utilisateur ouvre ses scènes, alors
  les cartes suivent A, B, C sans imposer de graphe ni de choix artificiels.

**Décisions confirmées le 6 octobre 2026 — carte, page du chapitre et
commandes :** après une critique d'ergonomie de l'organisation du récit côté
adulte (23/40 pour la lecture informée, 22/40 pour la lecture indépendante),
le porteur décide :

- **La carte ouvre le chapitre.** Activer la carte d'un chapitre, image et
  titre compris, ouvre sa page : c'est elle, le détail prévu plus haut. La
  fiche latérale « Détails » de l'adulte est retirée : elle répétait la carte
  et la page, et finissait par « Ouvrir le chapitre ». L'élève garde ce que
  F06.2 lui montre d'un chapitre qui n'est pas le sien.
- **Menu du chapitre.** Un menu à trois points, sur la carte et dans le
  bandeau de la page, porte les mêmes commandes : « Réglages » (titre, image,
  couleur, résumé), « Attribuer des élèves », « Exclure du livre » (F11.2) et
  « Supprimer ».
- **Le chapitre est le plan, le Suivi est le travail.** La page d'un chapitre
  montre quelles scènes existent, comment elles se relient et qui y écrit.
  Les filtres par état et par élève, et la sélection de scènes pour les
  fiches, restent au Suivi (F06.5, F07.4), auquel la page renvoie, filtré sur
  ce chapitre. Chaque carte garde son état et « qui s'en occupe », qui se
  change sur place comme dans la page de scène (F06.3). Alternative écartée :
  garder des filtres dans le chapitre, avec les tampons du Suivi ; le porteur
  ne suit pas le travail depuis cette page.
- **Supprimer et corbeille.** Le retrait récupérable décidé plus haut
  s'appelle « Supprimer » à l'écran. Ce qui est supprimé se retrouve dans la
  « Corbeille du projet », d'où il se restaure. Les protections de F03-AC13
  et F03-AC14 ne changent pas.
- **Ordre dans le chapitre.** « Monter » et « Descendre », dans le menu de la
  scène, changent son rang dans le chapitre ; en récit classique, c'est
  l'ordre de lecture. Le glisser-déposer, proposé plus haut, n'est pas dans
  la première livraison.
- **Déplacement vers un autre chapitre : différé.** Le porteur l'a rarement
  fait en quatre ans, et il change qui peut écrire la scène.
- **« À compléter ».** En tête de « Parties et chapitres », une phrase dit ce
  qui manque : chapitres sans scène, chapitres sans élève. Chaque manque est
  un lien vers la première carte concernée, sans état enfoncé ni filtre : la
  règle du Suivi s'applique, un même élément n'informe pas et ne filtre pas
  à la fois. Les scènes sans consigne n'y sont plus comptées, la consigne
  étant facultative (F07.1) : elles portent « sans consigne », comme au
  Suivi. Les élèves sans chapitre y sont rappelés comme au Suivi, par un
  lien. La phrase disparaît quand rien ne manque.
- **Nom de la vue.** La vue « Graphe » s'appelle « Chemins » à l'écran, le
  mot de l'étape « Vérifier les chemins » du Livre ; les deux lectures de la
  critique ne comprenaient pas « Graphe ». Ses règles ne changent pas, et
  « graphe » reste le mot de travail de ces documents.
- **Suivre un chemin.** Dans la vue Chemins, le départ et les fins sont
  écrits en mots. Une scène sans choix ni repère de fin porte « sans suite »,
  repère neutre qui ne signale pas une faute (F03.2). Suivre un choix vers
  un autre chapitre ouvre ce chapitre dans la même vue et y désigne la scène
  d'arrivée ; revenir d'une scène ramène à la vue quittée.
- **Aide.** Un écran d'aide s'affiche à la première ouverture de « Parties
  et chapitres », comme au Suivi et au Livre (F06.5, F11.6), avec « Ne plus
  afficher » et un bouton d'aide : parties, chapitres et scènes ; qui peut
  écrire où ; les vues Scènes et Chemins.

Les mots et les signes retenus le même jour sont dans le
[design](design.md#organisation-du-récit-reprise-après-critique-6-octobre-2026).

**Précisions confirmées par le porteur le 6 octobre 2026, après la reprise
de la maquette :**

- La confirmation de « Supprimer » nomme le nombre de scènes, les élèves qui
  y ont écrit et les choix qui y mènent. Un chapitre ou une scène sans texte
  se supprime sans confirmation, avec « Annuler » dans le message.
- La corbeille n'a pas de durée limite en première livraison.
- Le seul chapitre d'une partie ne se supprime pas : on supprime la partie,
  qui garde ainsi toujours un chapitre.
- La partie a son menu à trois points : « Réglages » (titre, image) et
  « Supprimer ».
- Un chapitre dont l'enseignant s'occupe de toutes les scènes (F06.3) ne
  compte pas parmi les chapitres sans élève.

**Précisions confirmées le 6 octobre 2026, après une seconde lecture
indépendante (25/40) :**

- Dans une confirmation ou un message, une scène se nomme par sa référence
  suivie de son titre ; la référence seule ne suffit pas à qui ne l'a pas
  en tête. Sur une carte, une destination garde sa référence pour seul nom.
- Une liaison cachée (F05.1) se lit sur la carte de sa scène et dans la vue
  Chemins, où elle a son trait comme un choix : c'est une suite du récit,
  et la scène ne passe pas pour une impasse. L'élève ne la voit pas.
- La carte d'une scène porte « Ouvrir » en mot, comme celle du chapitre.
- La carte du chapitre compte les scènes validées et les scènes prêtes
  chacune sous son nom, comme le Suivi.
- Dans le menu « qui s'en occupe », l'option sans élève porte le mot que la
  scène affichera ensuite, « Pas encore prise » ou « Aucun élève » (F06.5).
- **Recherche des scènes de tout le livre.** Depuis « Parties et
  chapitres », un champ cherche les scènes du livre entier et les liste
  sous leur chapitre, avec leur état et qui s'en occupe ; un résultat ouvre
  la scène. C'est la recherche de F05 (titres, consignes et textes), sans
  création de choix. La recherche de la page d'un chapitre reste bornée à
  ce chapitre. Alternative écartée : chercher les parties et les chapitres
  par leur nom, alors qu'on les voit tous à l'écran. Non traités : ce
  champ côté élève, et un accès à cette recherche depuis les autres
  onglets.
- **F03-AC26 — Scène retrouvée sans connaître son chapitre :** étant donné
  un livre de neuf chapitres dont « La lisière » contient S016 « Souche
  creuse — la lanterne de secours » et S017 « Souche — la chouette
  messagère », lorsque l'enseignant écrit « souche » dans le champ de
  « Parties et chapitres », alors ces deux scènes s'affichent sous « La
  lisière », et activer l'une d'elles ouvre sa page.

**Propositions de la maquette, sans retour du porteur :** « Restaurer »
remet l'élément à sa place, avec ses textes et ses attributions ; un livre à
choix sans départ désigné le dit dans « À compléter » (F03.2).

**Mode personnel :** la page du chapitre y garde ses filtres et sa sélection
de scènes, faute de Suivi ; le suivi en mode personnel reste ouvert en F06.5.

**Usage rapporté par le porteur — scènes communes à plusieurs chapitres :**
certaines scènes ne relèvent d'aucun chapitre en particulier, par exemple
une fin atteinte quand le héros n'a plus de points de vie, ou une scène de
sauvegarde ; il leur créait un chapitre à part, faute de mieux.
Recommandation, sans retour du porteur à ce stade : garder ce chapitre
ordinaire, nommé par l'adulte, sans niveau ni statut de plus. Atteinte par
une règle du jeu, une telle scène reçoit un numéro fixé (F11.3) et le
contrôle « inaccessible depuis le départ » avertit sans bloquer (F09.2) ;
atteinte par des choix, ce sont des raccords, réservés à l'enseignant
(F06.1). Reste à dessiner : les arrivées regroupées d'un chapitre où mènent
de nombreux chapitres.

- **F03-AC21 — La carte ouvre le chapitre :** étant donné la page « Parties
  et chapitres », lorsque l'enseignant clique l'image ou le titre de « La
  lisière », alors la page de ce chapitre s'ouvre. Le menu à trois points de
  la carte propose « Réglages », « Attribuer des élèves », « Exclure du
  livre » et « Supprimer », comme celui du bandeau de la page.
- **F03-AC22 — Supprimer puis restaurer :** étant donné « Le sanctuaire »,
  six scènes dont quatre écrites, où mène un choix de S019, lorsque
  l'enseignant choisit « Supprimer » et confirme, alors le chapitre quitte
  le plan et figure dans la « Corbeille du projet » ; le choix de S019 n'est
  redirigé nulle part. « Restaurer » remet le chapitre et ses textes.
- **F03-AC23 — Ordre par le menu :** étant donné un chapitre classique dont
  l'ordre est A, B, C, lorsque l'adulte choisit « Monter » sur C, alors
  l'ordre est A, C, B, à l'écran, dans le lecteur et dans le PDF.
- **F03-AC24 — « À compléter » sans filtre :** étant donné « Les racines »
  sans scène et deux chapitres sans élève, lorsque l'enseignant clique
  « 2 chapitres sans élève », alors la page se place sur la première de ces
  cartes sans masquer les autres ni garder d'état. Six scènes sans consigne
  ne sont pas comptées dans cette phrase.
- **F03-AC25 — D'un chapitre à l'autre dans la vue Chemins :** étant donné
  la vue Chemins du « Dernier bac », lorsque l'enseignant suit le choix qui
  mène à S014 dans « La lisière », alors « La lisière » s'ouvre dans la vue
  Chemins et S014 y est désignée.


### F03.2 — Départ du récit à choix et fins explicites

**Objectif :** identifier où commence la lecture du livre et distinguer une
conclusion volontaire d'un passage dont les choix ne sont pas encore préparés.

**Décisions confirmées :**

- Le livre à choix possède une scène de départ unique, désignée explicitement
  par l'adulte : l'enseignant en mode classe, l'auteur en mode personnel.
- Ce départ concerne le livre entier. Une partie peut recevoir plusieurs
  entrées narratives ; elle ne doit pas être réduite à un passage linéaire.
- Une scène de fin porte un repère explicite « Fin de l'histoire ». Le récit
  peut comporter plusieurs fins. Une scène sans choix n'est pas considérée
  automatiquement comme une fin.
- Ces repères concernent le récit à choix. Le récit classique suit son ordre
  de lecture défini en F03.1.

**Parcours acquis :** l'adulte désigne le départ du livre ; les conclusions
voulues sont repérées explicitement pendant la préparation du récit. Ces
repères servent à la lecture et à l'examen des chemins. Ils ne valent pas
validation du travail élève ni déclaration de scène prête pour le livre.

**Critères d'acceptation sur les éléments confirmés :**

- **F03-AC03 — Un seul départ :** étant donné une scène A désignée comme
  départ du livre, lorsque l'adulte la remplace par B, alors B est le seul
  départ du livre ; A ne reste pas un second point de départ.
- **F03-AC04 — Plusieurs entrées dans une partie :** étant donné une partie
  contenant A et B, lorsque l'enseignant crée des choix depuis d'autres
  parties vers A et vers B, alors ces deux entrées sont compatibles avec
  le départ unique du livre.
- **F03-AC05 — Absence de choix sans fin déclarée :** étant donné une scène
  sans choix et sans repère de fin, lorsqu'on consulte son rôle dans le récit,
  alors elle n'est pas présentée comme une fin de l'histoire.
- **F03-AC06 — Plusieurs conclusions :** étant donné deux scènes qui
  constituent des conclusions différentes, lorsqu'elles sont explicitement
  repérées comme fins, alors les deux fins peuvent coexister dans le récit.

**Décision confirmée le 6 octobre 2026 — où se posent les repères :** « Départ
du livre » et « Fin de l'histoire » se posent et se retirent dans le menu à
trois points de la scène, depuis sa carte dans le chapitre comme depuis sa
page. Désigner un nouveau départ nomme celui qu'il remplace.

**Questions ouvertes :**

- Moment où le départ doit être renseigné et traitement de sa suppression ;
  son absence ou son exclusion bloque le PDF définitif selon F09.2. Proposé
  en F03.1 : son absence se lit dans « À compléter ».
- Décidés en F11.5 le 30 septembre 2026 : seul l'adulte pose le repère de
  fin dans la première livraison ; une fin peut porter des choix ; la marque
  de fin imprimée et le retrait du repère y sont précisés.
- La numérotation imprimée du départ (n° 1) est décidée en F11.5 et le
  point d'entrée du playtest en F09.1.

## F04 — Rédaction dans l'éditeur

### F04.1 — Mise en forme légère pour les élèves

**Décision confirmée :** l'élève dispose d'une mise en forme légère pour
structurer son texte. La présentation commune du livre relève de l'enseignant
selon F11.3 ; rédiger une scène ne lui demande pas de composer les pages finales.

**Décision confirmée — réglage commun par projet :** dans un projet de classe,
l'enseignant dispose d'un seul réglage pour autoriser ou désactiver ensemble
le gras, l'italique et le souligné pour les élèves. Ces trois commandes sont
autorisées par défaut. Il n'y a pas de réglage distinct par bouton dans la
première livraison. Ce choix permet d'adapter l'écriture à l'objectif
pédagogique avec une seule commande, commune aux élèves de ce projet.

**Décision confirmée — collage depuis un outil extérieur :** lorsqu'un
utilisateur colle un texte depuis Word ou un autre outil, l'application
conserve le texte, les paragraphes et les mises en forme autorisées dans
son contexte d'écriture. Les polices, tailles et couleurs du document
d'origine sont retirées. Les droits sur les images et les choix restent
applicables : le collage ne permet pas de les contourner. Le nettoyage
permet de récupérer un brouillon en conservant une présentation cohérente.

**Critères d'acceptation :**

- **F04-AC01 — Rédaction sans composition des pages :** étant donné un élève
  autorisé à écrire dans un chapitre, lorsqu'il rédige et soumet une scène,
  alors il n'a pas à régler les polices, tailles et pages du livre pour remettre
  son texte. Les règles de soumission restent celles de F07.1.
- **F04-AC02 — Mise en forme autorisée par défaut :** étant donné un nouveau
  projet de classe, lorsque l'enseignant n'a pas modifié le réglage, alors
  les élèves autorisés à écrire disposent du gras, de l'italique et du souligné.
- **F04-AC03 — Réglage commun limité au projet :** étant donné deux projets
  de classe A et B, lorsque l'enseignant désactive la mise en forme élève
  dans A, alors les élèves ne peuvent plus y appliquer ces trois mises en
  forme ; le réglage de B reste inchangé. Aucun réglage par bouton n'est requis.
- **F04-AC04 — Collage nettoyé :** étant donné Alice autorisée à utiliser
  la mise en forme et un texte Word comprenant deux paragraphes, des mots
  en gras et une police rouge de grande taille, lorsqu'elle colle ce texte,
  alors les mots, les deux paragraphes et le gras sont conservés, tandis
  que la police, la taille et la couleur importées ne sont pas reprises.
- **F04-AC05 — Collage respectant le réglage du projet :** étant donné un
  projet où la mise en forme élève est désactivée, lorsqu'Alice colle un
  texte extérieur en gras, italique et souligné, alors les mots et les
  paragraphes sont conservés sans ces mises en forme.

**Variantes et approfondissements différés :** l'auteur adulte du mode personnel
assure rédaction et composition ; le réglage d'autorisation élève n'y a pas
lieu d'être. Le réglage s'applique aux projets de classe classiques comme à
choix et aux deux profils de participation. Le nettoyage des textes collés
s'applique aussi à l'auteur adulte selon ses droits. L'effet d'une
désactivation sur les mises en forme déjà présentes et le traitement des
contenus complexes, comme les tableaux, restent à préciser ; les droits
d'import et de placement des images sont définis en F10.
Les choix intégrés au texte sont régis par
[F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène) et F06.1, notamment
la protection des phrases de choix selon le profil.

### F04.2 — Objets de l'histoire

**Idée du porteur, 1er octobre 2026, traitée dans l'entretien dédié du
2 octobre 2026 et validée dans son ensemble le même jour, avec ses points
différés.** Cette section couvre les objets, la feuille d'aventure, les
actions de jeu et le dé. Les livres dont on est le héros comportent souvent
des objets ; lorsque plusieurs élèves écrivent, un même objet doit porter le
même nom d'une scène à l'autre (« la clé d'argent » de S051).

**Retour d'usage du porteur, 2 octobre 2026 :** ses livres de classe ont
couvert toute l'étendue des règles : choix seuls ; objets conditionnant des
choix ; points de volonté et temps ; attributs, compétences et jets de dés.
La liste des objets était parfois longue et il ne se rappelait pas toujours
les noms exacts : l'incohérence des noms était un problème réel. Les consignes
au lecteur étaient écrites dans le fil du récit, dans un paragraphe à part mis
en valeur. Le livre contenait une feuille d'aventure.

**Décisions confirmées le 2 octobre 2026 :**

- **Liste tenue par l'enseignant :** en mode classe, l'enseignant alimente la
  liste « Objets de l'histoire », notamment pendant la préparation ; les élèves
  la consultent pendant l'écriture sans y ajouter directement. Un objet
  employé dans plusieurs chapitres est une décision commune.
- **Pas de moteur de jeu en ligne :** l'application ne vérifie ni les
  conditions ni les règles. La lecture en ligne doit néanmoins rester une
  expérience intéressante ; le porteur y voit le premier aperçu du produit
  pour de nouveaux utilisateurs, ce qui reste une hypothèse.

**Décisions confirmées le 2 octobre 2026 — périmètre de la première
livraison :** objets, feuille d'aventure, actions de jeu et dé entrent tous
dans la première livraison, sous une forme sans vérification par l'application.

- **Liste « Objets de l'histoire » :** nom et courte description de chaque
  objet, consultable pendant l'écriture. C'est une aide à la conception et à
  la cohérence des noms ; elle n'est jamais montrée au lecteur, ni dans le
  livre ni dans le lecteur en ligne, pour ne pas révéler les objets des
  chemins qu'il n'a pas pris.
- **Commande `/objet` :** elle propose la liste ; l'objet retenu est inscrit
  dans le texte comme du texte ordinaire, sans élément particulier de
  l'éditeur. Conséquences acceptées : renommer un objet dans la liste ne
  modifie pas les textes déjà écrits, et l'application ne sait pas où un
  objet est obtenu ni utilisé ; la recherche de F05 permet de le retrouver.
- **Feuille d'aventure composée par l'adulte :** elle est facultative et
  propre à chaque histoire. L'adulte y ajoute, selon les règles de son livre,
  des sections de trois types :
  - *liste* : lignes à remplir par le lecteur (inventaire, compétences) ;
  - *compteurs* : un nom et une valeur de départ par compteur (volonté,
    temps, attributs) ;
  - *notes libres* : numéros découverts, mots de passe, indices.
  Chaque section porte un titre choisi par l'adulte. Une histoire à choix
  seuls n'a pas de feuille.
- **Feuille dans le livre et en ligne :** la même feuille est une page du
  livre imprimé selon
  [F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture) et
  une feuille que le lecteur remplit lui-même dans le lecteur en ligne de
  [F12.1](#f121--partager-une-version-du-récit). Rien n'est vérifié : le
  lecteur écrit ses objets, modifie ses compteurs et prend ses notes à la main.
- **Action de jeu :** paragraphe d'un type propre, distinct du récit et de la
  phrase de choix, dont le texte est libre (« Ajoute le couteau à ton
  inventaire. », « Retire un point de volonté à ton héros. »). Il est mis en
  valeur de la même façon dans le livre et dans le lecteur en ligne.
  L'application n'en connaît pas le sens : il ne porte ni lien, ni référence à
  un objet ou à un compteur, ni effet automatique. Conséquence acceptée : en
  ligne, le lecteur reporte lui-même l'action sur sa feuille et peut se
  tromper, comme sur papier.
- **Dé :** outil de la feuille d'aventure du lecteur en ligne, activé par
  l'adulte pour le livre. Le résultat est affiché, jamais interprété : le
  lecteur lit la règle dans le passage et choisit lui-même la suite.

**Différé après la première livraison :** action de jeu à effet déclaré, dont
un bouton reporterait l'effet sur la feuille en ligne — elle pourra s'ajouter
comme réglage des mêmes paragraphes, sans réécrire les textes ; lancer de dé
proposé à l'endroit du passage ; objet suivi dans le texte ; conditions
vérifiées, calculs automatiques et combats, écartés comme le moteur de jeu du
brief.

**Critères d'acceptation :**

- **F04-AC15 — Nom d'objet repris de la liste :** étant donné la liste
  contenant « la clé d'argent », lorsque Bilal saisit `/objet` dans S051 et
  retient cet objet, alors « la clé d'argent » est inscrit dans son texte
  comme du texte ordinaire, qu'il peut ensuite modifier librement.
- **F04-AC16 — Renommage sans effet sur les textes :** étant donné cet objet
  inscrit dans S051, lorsque l'enseignante le renomme « la clé d'argent
  terni » dans la liste, alors le texte de S051 est inchangé et la recherche
  de F05 permet de retrouver l'ancien nom.
- **F04-AC17 — Action de jeu mise en valeur partout :** étant donné le
  paragraphe d'action « Ajoute le couteau à ton inventaire. » dans S015,
  lorsque le livre est composé puis partagé, alors ce paragraphe est présenté
  à part du récit dans l'aperçu, le PDF et le lecteur en ligne, avec le même
  texte.
- **F04-AC18 — Aucun effet automatique :** étant donné ce paragraphe lu dans
  le lecteur en ligne, lorsque le lecteur ne note rien, alors sa feuille
  d'aventure reste inchangée et aucun choix ne lui est refusé.
- **F04-AC19 — Feuille à la carte :** étant donné un livre à points de
  volonté et objets, lorsque l'adulte compose une feuille avec une section de
  compteurs « Volonté : 5 » et une section de liste « Inventaire », alors le
  livre imprimé et le lecteur en ligne présentent ces deux sections, et
  aucune autre.
- **F04-AC20 — Liste d'objets cachée au lecteur :** étant donné une histoire
  de douze objets, lorsque le lecteur remplit son inventaire en ligne, alors
  aucun nom d'objet de la liste ne lui est proposé.
- **F04-AC21 — Dé non interprété :** étant donné un livre où le dé est activé
  et le passage « Si tu fais 4 ou plus, rends-toi au 12 », lorsque le lecteur
  lance le dé et obtient 2, alors le résultat est affiché et les deux choix du
  passage restent activables.

**Décisions confirmées le 2 octobre 2026 — feuille en ligne et règles du
livre :**

- **Conservation de la feuille :** elle suit la reprise de lecture de
  [F12.1](#f121--partager-une-version-du-récit) : liée au profil pour l'élève
  identifié, afin qu'un poste partagé ne mêle pas les feuilles de deux
  élèves ; retenue par l'appareil pour le lecteur venu par le lien, sans
  compte. « Recommencer » remet la feuille à ses valeurs de départ ;
  « reprendre » la retrouve telle qu'elle était. La faisabilité de la
  conservation par profil, à vérifier selon F12.1, pèse davantage : une
  feuille perdue gêne plus qu'un marque-page perdu.
- **Règles du jeu :** la page « Comment lire ce livre » de
  [F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture) peut
  recevoir une partie « Règles du jeu » écrite par l'adulte, la même dans le
  livre imprimé et à l'écran. Il n'y a pas de seconde page « Comment jouer ».
- **Accès permanent en ligne :** dès que la version partagée comporte cette
  page, le lecteur en ligne y donne accès à tout moment, depuis la feuille
  d'aventure et hors d'elle, sans perdre le passage en cours. La présence de
  la page suffit ; aucun réglage de partage distinct n'est ajouté.

**Décisions confirmées le 2 octobre 2026 — droits et variantes :**

- **Qui écrit une action de jeu :** l'adulte, et l'élève au profil « écriture
  et organisation » dans son chapitre. L'élève au profil « écriture et
  propositions » ne dispose pas de la commande ; pour lui, un paragraphe
  d'action de jeu est un bloc protégé d'office, comme une phrase de choix
  selon [F06.1](#f061--attribution-des-chapitres-et-profils-de-participation) :
  il ne le modifie ni ne le supprime et écrit autour.
- **Paragraphe protégé :** l'enseignant peut en outre protéger une action de
  jeu comme tout paragraphe ; elle est alors intouchable pour les deux profils.
- **Mode personnel :** l'auteur adulte dispose de l'ensemble, sans protection.
- **Récit classique :** la liste d'objets et `/objet` y sont disponibles,
  utiles à la cohérence de tout récit ; il n'a ni feuille d'aventure, ni
  action de jeu, ni dé, ni partie « Règles du jeu ».

- **F04-AC22 — Feuilles distinctes sur poste partagé :** étant donné Alice
  et Bilal lisant le même livre partagé sur le même poste, chacun identifié à
  son tour, lorsque Bilal ouvre sa feuille après qu'Alice a noté « couteau »,
  alors sa feuille ne contient pas cet objet. Ce critère dépend de la
  faisabilité réservée en F12.1.
- **F04-AC23 — Recommencer :** étant donné une feuille dont le compteur
  « Volonté », parti de 5, vaut 2, lorsque le lecteur recommence le livre,
  alors « Volonté » vaut 5 et l'inventaire est vide ; lorsqu'il reprend sa
  lecture, alors la feuille est telle qu'il l'avait laissée.
- **F04-AC24 — Règles à portée de main :** étant donné un livre partagé dont
  « Comment lire ce livre » comporte des règles du jeu, lorsque le lecteur
  arrivé au passage 23 ouvre les règles puis les referme, alors il se
  retrouve au passage 23 avec sa feuille inchangée.
- **F04-AC25 — Action de jeu réservée :** étant donné Alice, profil
  « écriture et propositions », et Bilal, profil « écriture et organisation »,
  dans « La lisière », lorsque chacun cherche à ajouter une action de jeu,
  alors Bilal le peut et Alice n'en a pas la commande ; lorsqu'Alice
  sélectionne tout le texte d'une scène qui en contient une et le supprime,
  alors l'action de jeu demeure.
- **F04-AC26 — Récit classique :** étant donné un récit classique, lorsque
  l'auteur écrit une scène, alors `/objet` lui propose la liste et aucune
  commande d'action de jeu ni feuille d'aventure ne lui est proposée.

**Décisions confirmées le 2 octobre 2026 — listes, commandes et
presse-papiers :**

- **Formules d'action :** une liste « Formules d'action » du projet réunit
  les consignes récurrentes (« Retire un point de volonté à ton héros. »).
  Retour d'usage du porteur : son dernier livre en comptait une cinquantaine
  d'occurrences, qu'il fallait aller rechercher dans une autre scène pour les
  recopier. Elle est tenue par l'adulte, comme la liste des objets.
- **Commande `/action` :** `/action` ou le bouton « Action de jeu » créent un
  paragraphe d'action de jeu et proposent les formules de la liste, ou un
  paragraphe vide à écrire. La formule retenue est inscrite comme texte
  libre, modifiable sur place. Conséquence acceptée, comme pour les objets :
  corriger une formule dans la liste ne modifie pas les paragraphes déjà
  écrits ; la recherche de F05 permet de les retrouver.
- **Place des deux listes :** objets et formules sont une rubrique
  facultative de la préparation de
  [F02](#f02--préparer-le-récit-et-les-décisions-communes), où ils se décident
  avec la classe. Les élèves, qui n'accèdent pas à la préparation, consultent
  les objets depuis la page de la scène par `/objet` et un bouton « Objets »,
  en lecture seule ; les formules sont proposées par `/action` à qui en a le
  droit. L'adulte peut ajouter un objet ou une formule depuis la scène, sans
  la quitter.
- **Place de la feuille et des règles (révisé le 3 octobre 2026) :** la
  feuille d'aventure, le dé et la partie « Règles du jeu » se règlent dans
  cette même rubrique de la préparation : ils servent aux actions de jeu et
  à la lecture d'essai bien avant la mise en page. La forme de leurs pages
  dans le livre (modèle ou image) reste avec les pages de présentation de
  F11.4, à la dernière tâche de « Mettre en page » selon
  [F11.6](#f116--trois-temps-pour-préparer-le-livre). La décision du
  2 octobre les plaçait dans la destination Livre.
- **Article et accord :** l'objet est enregistré tel qu'il s'écrit dans une
  phrase (« la clé d'argent ») et inséré tel quel ; l'auteur corrige à la
  main « de la clé » ou « sa clé ». Aucune grammaire automatique.
- **Presse-papiers et suppression :** les règles de robustesse des phrases de
  choix de [F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène)
  s'appliquent à l'action de jeu. Pour une personne autorisée, couper-coller
  la déplace et copier-coller la duplique. Pour une personne non autorisée,
  le récit est collé et l'action de jeu est écartée avec un message, sans
  être convertie en texte ordinaire ; une suppression épargne l'action. Vers
  l'extérieur, elle sort en texte simple ; un texte venu de l'extérieur ne
  crée jamais d'action de jeu.

- **F04-AC27 — Formule reprise de la liste :** étant donné la formule
  « Retire un point de volonté à ton héros. » dans la liste, lorsque
  l'enseignante saisit `/action` dans S015 et la retient, alors un paragraphe
  d'action de jeu portant ce texte est créé, sans qu'elle ait ouvert une
  autre scène ; elle peut ensuite y remplacer « un point » par « deux points ».
- **F04-AC28 — Objets consultés par l'élève :** étant donné Alice, qui
  n'accède pas à la préparation, lorsqu'elle utilise le bouton « Objets »
  dans sa scène, alors elle lit les noms et descriptions des objets et ne
  peut ni en ajouter ni en modifier.
- **F04-AC29 — Objet ajouté depuis la scène :** étant donné l'enseignante
  dans S051, lorsqu'elle ajoute « la lanterne sourde » par `/objet`, alors
  l'objet figure dans la liste de la préparation et elle n'a pas quitté S051.
- **F04-AC30 — Collage sans droit :** étant donné Alice, profil « écriture et
  propositions », ayant copié un paragraphe de récit et une action de jeu,
  lorsqu'elle les colle dans sa scène, alors le paragraphe de récit est
  collé, l'action de jeu ne l'est pas et un message le lui indique.

**Limite acceptée :** rien n'empêche un élève d'écrire « Ajoute le couteau à
ton inventaire » dans un paragraphe de récit. Ce texte n'est pas mis en
valeur ; la relecture de F07 le rattrape.

**Décisions confirmées le 2 octobre 2026 — pendant la conception des écrans :**

- **Dé :** l'adulte règle pour son livre aucun dé, un dé ou deux dés à six
  faces. Avec deux dés, le lecteur voit les deux faces et leur total, sans
  interprétation. Les autres dés restent différés.
- **Compteurs en ligne :** le lecteur les modifie par « + » et « − ». Il n'y
  a pas de maximum ; la valeur ne descend pas sous zéro. C'est une borne
  d'affichage, pas une règle de jeu : rien ne se produit à zéro.
- **Place de la feuille imprimée :** la page « Feuille d'aventure » suit
  « Comment lire ce livre » et précède le récit.

- **F04-AC31 — Dé réglé par l'adulte :** étant donné un livre réglé sur deux
  dés, lorsque le lecteur les lance en ligne et obtient 3 et 5, alors il voit
  les deux faces et le total 8, et tous les choix du passage restent
  activables ; réglé sur aucun dé, le lecteur en ligne n'en propose pas.
- **F04-AC32 — Compteur jamais négatif :** étant donné « Volonté » à 0,
  lorsque le lecteur veut encore retirer un point, alors la valeur reste 0,
  aucun message de fin n'apparaît et la lecture continue.

- **Lecture d'essai (décision du 2 octobre 2026) :** la feuille d'aventure et
  le dé sont disponibles dans le playtest de [F09.1](#f091--playtest), pour
  l'adulte comme pour l'élève, sans conservation : chaque nouveau test repart
  des valeurs de départ.
- **Scènes voisines (décision du 2 octobre 2026) :** les extraits de
  [F04.3](#f043--aperçu-des-scènes-voisines-pendant-lécriture) ne montrent
  pas les actions de jeu ; ils servent au raccord du récit.

- **Contrôle de F09.2 (décision du 2 octobre 2026) :** aucun contrôle ne
  porte sur les actions de jeu ni sur la feuille. Un simple rappel « à
  savoir », jamais bloquant, signale un livre contenant des actions de jeu
  sans feuille d'aventure. Il figure dans les contrôles du livre et il est
  répété dans la demande du PDF définitif et du partage ; il n'apparaît ni
  dans la page de scène ni dans le suivi, car la feuille peut être composée
  à la fin de l'écriture. Les commandes d'action de jeu restent disponibles
  sans feuille.

- **F04-AC33 — Rappel tardif et discret :** étant donné un livre de sept
  actions de jeu sans feuille d'aventure, lorsque l'enseignante écrit dans
  une scène, alors aucun message ne le lui signale ; lorsqu'elle ouvre les
  contrôles du livre ou demande le PDF définitif, alors le rappel est affiché
  et le PDF reste possible.

Les écrans sont proposés dans la
[maquette](design.md#objets-feuille-daventure-actions-de-jeu-et-dé).

**Décidé le 3 octobre 2026 en
[F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture) :**
la feuille imprimée peut être remplacée par une image, une feuille composée
plus longue qu'une page continue sur la suivante sans couper une section, et
des dés peuvent être imprimés en bas des pages de droite du récit.

**Questions ouvertes :** nombre de lignes d'une section de
liste sur papier ; présentation de la feuille et du dé sur téléphone ; modification de la feuille par l'adulte
après un partage, face aux feuilles déjà commencées par des lecteurs.

### F04.3 — Aperçu des scènes voisines pendant l'écriture

**Idée du porteur, 2 octobre 2026.** Chaque scène est écrite sans que son
auteur voie d'où arrive le lecteur ni où il repart ; les enchaînements d'une
scène à l'autre en souffrent. Montrer, à la demande, la fin de la scène
précédente et le début de la scène suivante aide à soigner ces transitions
sans quitter la page de la scène.

**Acteurs et accès :** toute personne qui ouvre une scène, adulte ou élève,
pour l'écrire, la reprendre ou la relire. Modes personnel et classe, récit
classique et récit à choix.

**Décisions confirmées le 2 octobre 2026 :**

- **Scènes voisines :** dans un récit à choix, les scènes précédentes sont
  celles dont un choix ou une liaison cachée mène à la scène ouverte ; les
  scènes suivantes sont les destinations de ses choix et de ses liaisons
  cachées. Dans un récit classique, ce sont la scène précédente et la scène
  suivante dans l'ordre du plan de
  [F03.1](#f031--histoire-parties-chapitres-et-scènes), y compris d'un
  chapitre à l'autre.
- **Extrait seulement :** l'aperçu montre la fin de la scène précédente et le
  début de la scène suivante, pas leur texte entier.
- **Place :** l'extrait de la scène précédente s'affiche avant le texte de la
  scène ouverte et celui de la scène suivante après, dans la continuité de la
  lecture. Il se distingue du texte de la scène : il est en lecture seule, le
  curseur n'y entre pas, et il ne fait partie ni du texte enregistré, ni d'une
  remise, ni du livre.
- **Une voisine à la fois :** lorsque plusieurs scènes précèdent ou suivent,
  une seule est affichée de chaque côté ; l'auteur passe de l'une à l'autre à
  volonté pour les voir toutes.
- **Seulement s'il y a du texte :** une scène voisine sans texte n'a pas
  d'extrait.
- **Préférence de la personne :** une case « Afficher les scènes voisines »
  est conservée avec le compte de l'adulte ou le profil de l'élève. Elle vaut
  pour toutes ses scènes et tous ses projets, et le suit d'un poste à l'autre.
- **Limites de lecture des élèves :** l'aperçu respecte
  [F06.2](#f062--lecture-et-découverte-du-récit). Un élève ne reçoit aucun
  extrait d'une scène d'un chapitre qui ne lui est pas attribué, y compris
  lorsqu'elle est reliée à sa scène par un raccord ou une liaison cachée.
- **Aucun droit nouveau :** l'aperçu ne permet de modifier ni la scène
  voisine ni le lien qui y mène.

**Précisions confirmées le 2 octobre 2026, sur recommandation :**

- **Valeur par défaut :** la case est cochée par défaut. L'aide ne sert que si
  on la voit, et l'extrait est court ; chacun peut la décocher.
- **Passer d'une voisine à l'autre :** des onglets nommés par la référence de
  chaque scène, plutôt que des flèches seules, pour voir d'emblée combien de
  scènes précèdent ou suivent. Avec une convergence, le risque est d'écrire
  une ouverture qui ne convient qu'à la première scène affichée. Aucun
  défilement automatique. Les onglets des scènes précédentes sont au-dessus de
  leur extrait et ceux des scènes suivantes en dessous, pour que rien ne
  sépare les extraits du texte de la scène.
- **Contenu de l'extrait :** pour la scène précédente, son dernier paragraphe
  de récit suivi de la phrase de choix qui mène à la scène ouverte, soit ce que
  le lecteur lit juste avant d'arriver ; pour la scène suivante, son premier
  paragraphe de récit, accompagné du libellé du choix qui y conduit. La
  référence, le titre de travail et l'état de la scène voisine accompagnent
  l'extrait, qui porte sur son texte courant.
- **Voisine sans texte ou hors périmètre :** une ligne sans extrait, pour
  savoir qu'elle existe : référence et titre si la personne peut la lire,
  « autre chapitre » et son titre public sinon, comme le repère de destination
  de [F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène).

**Propositions non arbitrées :**

- **Lire davantage :** un lien ouvre la scène voisine dans sa propre page,
  selon les droits de la personne ; pas de texte complet déplié sur place.
- **Ordre :** scènes suivantes dans l'ordre des choix de la scène ; scènes
  précédentes dans l'ordre du plan.
- **Liaison cachée vue par un élève :** une destination de liaison cachée
  hors de son périmètre n'est pas mentionnée du tout, puisque F05.2 ne lui en
  donne que le numéro.

**Critères d'acceptation sur les éléments confirmés :**

- **F04-AC06 — Extraits de part et d'autre :** étant donné S015 dont le choix
  mène à S018, et S014 dont un choix mène à S015, toutes trois rédigées,
  lorsque l'enseignante ouvre S015 avec l'aperçu activé, alors elle lit la fin
  de S014 avant le texte de S015 et le début de S018 après, sans pouvoir les
  modifier depuis cette page.
- **F04-AC07 — Plusieurs scènes précédentes :** étant donné S018 atteinte
  depuis S015 et S016, lorsque l'aperçu est affiché, alors un seul extrait
  précède le texte et l'auteur peut afficher l'autre à sa place.
- **F04-AC08 — Préférence conservée :** étant donné Alice ayant décoché
  « Afficher les scènes voisines » sur un poste, lorsqu'elle s'identifie le
  lendemain sur un autre poste et ouvre une autre scène, alors les extraits ne
  sont pas affichés ; la préférence de Bilal est inchangée.
- **F04-AC09 — Voisine hors périmètre :** étant donné Bilal chargé de S017,
  dont le choix mène à S021 dans un chapitre qui ne lui est pas attribué,
  lorsqu'il ouvre S017 avec l'aperçu activé, alors aucun extrait de S021 ne
  lui est montré.
- **F04-AC10 — Extrait hors du texte :** étant donné l'aperçu affiché dans
  S015, lorsqu'Alice remet sa scène ou que le livre est composé, alors la
  remise et le passage imprimé ne contiennent que le texte de S015.
- **F04-AC11 — Voisine vide :** étant donné S018 sans texte, lorsque S015 est
  ouverte avec l'aperçu activé, alors aucun extrait de S018 n'est affiché ;
  une ligne indique sa référence et son titre.
- **F04-AC13 — Activé par défaut :** étant donné une personne qui n'a jamais
  touché à la case, lorsqu'elle ouvre une scène dotée de voisines rédigées,
  alors leurs extraits sont affichés.
- **F04-AC14 — Phrase qui mène ici :** étant donné S014 dont le choix « Suivre
  le chant » mène à S015, lorsque S015 est ouverte avec l'aperçu activé, alors
  l'extrait de S014 se termine par la phrase de ce choix, telle que le livre
  l'affiche.
- **F04-AC12 — Récit classique :** étant donné un récit classique où S015
  suit S014 et précède S016 dans le plan, lorsque l'auteur ouvre S015 avec
  l'aperçu activé, alors il lit la fin de S014 avant son texte et le début de
  S016 après.

**Questions ouvertes :** effet de la lecture ouverte de F06.2 sur les
extraits ; affichage pendant la relecture d'une remise ; présentation sur
téléphone ; emploi éventuel de ces extraits comme contexte des aides IA de
F13, qui n'est pas décidé ici.

## F05 — Retrouver les scènes et relier les choix

**Besoin exprimé :** dans une histoire comportant beaucoup de scènes, un
libellé tel que « Faire demi-tour » ne suffit pas à retrouver la destination.
Le porteur utilisait souvent l'action du choix comme titre du passage ; cette
habitude devient ambiguë lorsque l'action se répète ou que plusieurs chemins
convergent. La recherche doit rester utile sans consommer d'IA à chaque usage.

**Décision confirmée le 1er octobre 2026 — phrase de choix et renvoi :**
elle remplace la forme retenue le 30 septembre, où le choix était un passage
du texte auquel la composition ajoutait le renvoi. Cette forme laissait une
phrase incomplète à l'écran lorsque le renvoi en portait le verbe.

- **Renvoi :** un choix est un renvoi inséré dans le texte et relié à une scène
  de destination. Il affiche le numéro de cette scène, calculé par la
  composition et jamais saisi à la main.
- **Phrase de choix :** le renvoi se trouve dans une phrase adressée au
  lecteur, qui occupe un paragraphe à elle seule (précisé le 1er octobre 2026
  en [F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène)). Le livre imprimé, le playtest et le lecteur en ligne affichent le
  même texte ; seul le renvoi change de nature, numéro imprimé sur papier,
  élément activable à l'écran.
- **Phrase automatique :** à la création d'un choix, l'auteur saisit un libellé,
  de préférence une action à l'infinitif, par exemple « Prendre la clé ».
  L'application compose la phrase avec une construction et la formule de renvoi
  du livre de [F11.5](#f115--ordre-imprimé-et-numérotation-du-récit-à-choix) :
  « Prendre la clé : rends-toi au 12. » Tant que la phrase reste automatique,
  un changement de formule du livre s'y applique.
- **Constructions :** les réglages du projet proposent quelques constructions
  à cocher : « Prendre la clé : … », toujours disponible et cochée par défaut,
  « Pour prendre la clé, … », « Si tu veux prendre la clé, … », « Prendre la
  clé ? … ». Si plusieurs sont cochées, l'une est tirée au hasard à la création
  de chaque choix, puis conservée : la phrase ne change pas d'un export à
  l'autre. Modifier ces réglages ne réécrit pas les phrases existantes ; une
  commande permet de régénérer la phrase d'un choix. L'application ne contrôle
  pas la grammaire ; les constructions autres que la première supposent un
  libellé commençant par un verbe.
- **Phrase personnalisée :** l'auteur peut modifier la phrase automatique ou
  écrire lui-même une phrase et y insérer un ou plusieurs renvois, chacun avec
  sa destination : « Si tu as la clé, va au 12 ; sinon, va au 31. » La formule
  du livre ne s'applique plus à cette phrase.
- **Libellé conservé :** le libellé reste attaché au choix pour le graphe, la
  recherche de destination et l'aide de F13.3. Pour un renvoi inséré dans une
  phrase personnalisée sans libellé saisi, la phrase en tient lieu.
- **Titre prérempli :** lorsqu'une scène est créée depuis un choix, son titre
  de travail est prérempli avec le libellé. Titre et libellé évoluent ensuite
  séparément, sans synchronisation.
- **Activation à l'écran :** une phrase de choix à un seul renvoi est
  activable en entier ; dans une phrase à plusieurs renvois,
  chaque numéro est activable.

La protection de la phrase de choix relève de F06.1. La création et la
modification d'un choix dans la scène sont détaillées en
[F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène). L'insertion, la
sélection, le copier-coller et la suppression partielle d'une phrase de choix
dans l'éditeur ont été éprouvées par le prototype du 2 octobre 2026 ; ses
verdicts et réserves sont dans
[l'architecture](architecture.md#résultats-du-prototype-de-léditeur-2-octobre-2026).

- **F05-AC09 — Deux renvois dans une phrase :** étant donné la phrase
  personnalisée « Si tu as la clé d'argent, ouvre la porte au [B] ; sinon,
  déchiffre les symboles au [C]. », B portant le n° 33 et C le n° 36, lorsque
  le livre est composé, alors il imprime « Si tu as la clé d'argent, ouvre la
  porte au 33 ; sinon, déchiffre les symboles au 36. » ; le playtest et le
  lecteur en ligne affichent la même phrase, et activer 33 conduit à B.
- **F05-AC10 — Phrase automatique :** étant donné un livre réglé sur la formule
  « rends-toi au » et la seule construction par défaut, lorsque l'auteur crée
  un choix de libellé « Suivre le chant » vers une scène portant le n° 9, alors
  la phrase « Suivre le chant : rends-toi au 9. » figure dans le texte ; s'il
  choisit ensuite la formule « va au », elle devient « Suivre le chant : va
  au 9. ».
- **F05-AC11 — Construction conservée :** étant donné trois constructions
  cochées et un choix créé avec « Si tu veux suivre le chant, rends-toi au 9. »,
  lorsque le livre est réexporté ou qu'une construction est décochée, alors
  cette phrase reste identique tant que l'auteur ne la régénère pas.
- **F05-AC12 — Titre prérempli :** étant donné un choix de libellé « Prendre
  la clé » dont la destination est créée à cette occasion, lorsque la scène
  apparaît, alors son titre proposé est « Prendre la clé » et reste modifiable
  sans changer le libellé.

**Socle confirmé pour la première livraison :**

- Distinguer le libellé du choix, adressé au lecteur, et le titre de travail
  de la scène, qui décrit le passage de destination. Favoriser un titre court
  associant lieu et événement distinctif, sans imposer une syntaxe rigide.
- Présenter partie, chapitre, référence courte stable de scène
  et titre ; cette
  référence n'est pas le numéro attribué lors de la composition imprimée.
  Exemple : « Tour · S042 · Cour — porte condamnée ». Un changement de titre
  ne change pas les liens ; deux titres identiques restent possibles.
- Pour choisir une destination existante, rechercher dans les titres,
  consignes et textes accessibles, filtrer par chapitre et consulter un aperçu
  avant de confirmer le lien. L'accès aux résultats et aperçus respecte F06,
  sans révéler les titres de scènes, consignes, textes ou extraits d'un
  chapitre non attribué. Le titre et l'image de repérage du chapitre
  peuvent rester visibles sur sa carte selon F03.1 ; cela ne donne pas accès
  à ses scènes comme destinations consultables.
- En mode personnel, l'auteur dispose du même repérage. En récit classique,
  les titres et la recherche aident à retrouver les passages sans créer de choix.

**Aide IA confirmée, facultative :** demander ponctuellement une suggestion
de titre à partir de la consigne ou d'un extrait pertinent ; l'adulte peut
la retoucher avant de l'appliquer. Le titre retenu est conservé. La navigation,
la recherche et chaque frappe ne déclenchent pas de génération. Lors de l'aide
aux choix de F13.3, les titres des nouvelles destinations sont proposés dans
la même réponse que les choix, en un seul appel IA pour cette génération.
Le contexte local est privilégié ; envoyer tout le livre à chaque renommage n'est pas
justifié. Le coût réel et la qualité restent à mesurer ultérieurement.

**Critères d'acceptation :**

- **F05-AC01 — Destinations distinctes :** étant donné deux choix « Faire demi-tour » menant respectivement à la cour
  et au carrefour, lorsque l'adulte choisit la destination, alors il distingue
  les passages par leur partie, chapitre, référence, titre et
  aperçu, sans appel IA.
- **F05-AC02 — Renommage sans rupture :** étant donné une scène renommée, lorsque ses choix entrants sont suivis,
  alors ils conduisent toujours à cette même scène, sans duplication.
- **F05-AC03 — Recherche autorisée :** étant donné un élève sans accès au chapitre du dénouement et la lecture ouverte de F06.2 désactivée, lorsqu'il cherche
  un mot présent uniquement dans le texte d'une scène de ce chapitre,
  alors aucun résultat ni extrait
  de ses scènes ne lui est révélé. Le titre public de sa carte reste distinct
  des titres et extraits des scènes.
- **F05-AC04 — Refus du titre proposé :** étant donné un titre proposé par l'IA, lorsque l'adulte refuse la proposition,
  alors le titre courant, le texte et les relations du récit restent inchangés.

**Approfondissements différés :** présentation des résultats et de leurs
aperçus, contenus réellement visibles selon le
profil et droits de renommage. Aucune recherche sémantique, génération globale
de résumés ni réorganisation automatique du graphe n'est décidée.

### F05.1 — Liaisons cachées par énigme

**Besoin confirmé le 30 septembre 2026 :** dans un récit à choix, une scène
peut conduire à la suite sans choix écrit : le lecteur doit trouver où
poursuivre, par exemple en résolvant une énigme qui donne le numéro du
passage suivant ou l'entrée du chapitre suivant. Cette liaison n'apparaît
pas dans le texte comme une option, mais elle fait partie des chemins du récit.
Elle doit être prise en compte par les contrôles de F09.2, le playtest de
F09.1, le graphe et la composition de F11.

**Décisions confirmées le 30 septembre 2026 :**

- **Liaison cachée :** l'adulte déclare, depuis une scène A, un lien vers une
  scène B qui n'est pas affiché comme un choix. Une scène peut porter à la fois
  des choix et une ou plusieurs liaisons cachées.
- **Chemin à part entière :** la liaison cachée compte dans les contrôles de
  [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif). B atteinte
  par ce lien n'est pas inaccessible ; une scène dont la seule suite est une
  liaison cachée n'est pas une scène sans issue ; une destination absente,
  supprimée ou exclue bloque le PDF définitif comme pour un choix. Le graphe
  la montre, distinguée visuellement des choix.
- **Numéro fixé de la destination :** le numéro imprimé de B doit rester celui
  que l'énigme permet de trouver. Par défaut, lorsque l'adulte déclare la
  liaison, le numéro actuel de B est fixé et l'adulte écrit son énigme à partir
  de ce numéro. Il peut aussi saisir lui-même le numéro que donne son énigme ;
  la composition place alors B à ce numéro. Ce numéro fixé prime sur le
  mélange de [F11.5](#f115--ordre-imprimé-et-numérotation-du-récit-à-choix).
- **Numéro devenu impossible :** un conflit entre deux numéros fixés, ou un
  numéro supérieur au nombre de passages après des exclusions, bloque le PDF
  définitif. Contrairement à un ajustement de présentation, l'erreur enverrait
  le lecteur vers un mauvais passage.
- **Responsabilité :** seul l'adulte crée, modifie ou retire une liaison cachée,
  comme les autres raccords réservés à l'enseignant en F06.1. En mode personnel,
  l'auteur adulte en dispose.
- **Playtest :** la liaison est jouable par une action distincte des choix,
  selon [F09.1](#f091--playtest).
- **Lecture en ligne :** le lecteur de F12 permet de rejoindre la suite d'une
  énigme en saisissant le numéro trouvé, selon les règles de
  [F12.1](#f121--partager-une-version-du-récit).

Le récit classique n'est pas concerné : il n'a ni choix ni renvois.

**Critères d'acceptation :**

- **F05-AC05 — Énigme non signalée comme impasse :** étant donné la scène
  « La porte aux symboles », sans choix écrit et dotée d'une liaison cachée
  vers « La salle des brumes », lorsque les contrôles s'exécutent, alors
  aucune des deux n'est signalée comme sans issue ou inaccessible pour ce motif.
- **F05-AC06 — Numéro conservé :** étant donné une liaison cachée vers B qui
  porte le n° 27, lorsque l'adulte ajoute une scène dans la même partie et
  réexporte, alors B reste au n° 27.
- **F05-AC07 — Numéro saisi :** étant donné une énigme dont la réponse est 31,
  lorsque l'adulte saisit ce numéro pour la liaison vers B, alors B porte le
  n° 31 au prochain export.
- **F05-AC08 — Numéro impossible :** étant donné une liaison cachée vers B
  au n° 40 fixé, lorsque l'adulte exclut deux scènes et que le livre ne compte
  plus que 38 passages, alors le PDF définitif est bloqué et le problème désigne
  la liaison ; le PDF de travail le signale à sa place.

**Questions ouvertes :** passage piège en cas de mauvaise réponse, laissé à
l'auteur ; information de l'élève qui rédige lui-même une énigme sur le numéro
à obtenir, décidée en F05.2. La déclaration depuis la scène et le repère de la liaison
sont décidés en [F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène).

### F05.2 — Créer et modifier un choix dans la scène

**Objectif :** créer, placer et faire évoluer les choix depuis le texte de la
scène, sans seconde saisie dans le graphe et sans rompre les liens.
Parcours validé dans son ensemble le 2 octobre 2026, avec ses points
différés ; les décisions ci-dessous complètent F05 sans en rouvrir les acquis.

**Acteurs et accès :** l'adulte, et l'élève selon son profil de F06.1. Récit à
choix seulement.

**Décisions confirmées le 1er octobre 2026 — créer un choix :**

- **Paragraphe de choix :** un renvoi n'existe que dans une phrase de choix,
  et une phrase de choix occupe un paragraphe à elle seule. Ce paragraphe se
  place à la fin du passage ou entre deux paragraphes de récit, jamais à
  l'intérieur d'un paragraphe de récit. Il porte un ou plusieurs renvois.
  Une phrase mêlant récit et renvoi dans un même paragraphe n'est pas possible
  dans la première livraison.
- **Commande :** `/choix` dans le texte ou le bouton « Choix » visible ouvrent
  sur place la même saisie : libellé, puis destination.
- **Trois issues pour la destination :**
  1. *scène existante*, avec la recherche et l'aperçu de F05, dans le
     périmètre de la personne ;
  2. *nouvelle scène*, créée vide avec le libellé pour titre proposé, dans le
     chapitre de la scène en cours par défaut ; l'adulte peut désigner un
     autre chapitre, ce qui en fait un raccord selon F06.1. L'auteur reste
     dans la scène en cours ;
  3. *à décider plus tard* : le choix existe sans destination. Sa phrase
     affiche un renvoi vide, visible comme tel, et le contrôle « choix sans
     destination » de [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif)
     bloque le PDF définitif tant qu'il subsiste.
- **Emplacement :** avec `/choix`, la phrase s'insère comme nouveau paragraphe
  juste après celui du curseur ; sur une ligne vide, elle la remplace. Avec le
  bouton, sans curseur placé dans le texte, elle s'ajoute à la fin de la scène.
- **Plusieurs choix à la suite :** après validation, la saisie propose
  « Ajouter un autre choix », inséré juste en dessous. Les choix consécutifs
  restent des paragraphes distincts.
- **Récit classique :** ni `/choix` ni bouton « Choix ». Les scènes s'y
  enchaînent déjà dans l'ordre du plan selon
  [F03.1](#f031--histoire-parties-chapitres-et-scènes), sans lien à créer.

**Critères d'acceptation :**

- **F05-AC13 — Choix inséré après le paragraphe du curseur :** étant donné
  S015 dont le curseur se trouve dans le premier de deux paragraphes, lorsque
  l'enseignante saisit `/choix`, le libellé « Continuer vers la lumière » et
  la destination S018, alors la phrase de choix forme un nouveau paragraphe
  entre les deux paragraphes de récit, et le graphe montre le lien S015 → S018.
- **F05-AC14 — Bouton sans curseur :** étant donné S015 ouverte sans curseur
  dans le texte, lorsque l'enseignante crée un choix par le bouton, alors la
  phrase s'ajoute après le dernier paragraphe de la scène.
- **F05-AC15 — Pas de renvoi dans un paragraphe de récit :** étant donné le
  curseur au milieu de « Lou fit un pas, puis un autre. », lorsqu'un choix est
  créé, alors ce paragraphe reste entier et sans renvoi ; la phrase de choix
  se trouve dans son propre paragraphe.
- **F05-AC16 — Nouvelle scène sans quitter la page :** étant donné un choix
  « Traverser le pont de brume » créé avec « nouvelle scène », lorsque la
  création réussit, alors une scène vide intitulée « Traverser le pont de
  brume » existe dans le chapitre de la scène en cours, et l'auteur se trouve
  toujours dans la scène où il écrivait.
- **F05-AC17 — Destination à décider plus tard :** étant donné un choix
  « Faire demi-tour » créé sans destination, lorsque le livre est contrôlé,
  alors la phrase affiche un renvoi vide, aucune scène n'a été créée, et le
  PDF définitif est bloqué pour ce choix ; lui donner S014 pour destination
  lève le blocage sans ressaisir le libellé.
- **F05-AC18 — Choix enchaînés :** étant donné un premier choix validé,
  lorsque l'auteur utilise « Ajouter un autre choix », alors le second forme
  un paragraphe distinct placé juste sous le premier.
- **F05-AC19 — Récit classique sans commande de choix :** étant donné un
  récit classique, lorsque l'auteur saisit `/choix` ou cherche le bouton,
  alors aucune création de choix n'est proposée.

**Décisions confirmées le 1er octobre 2026 — modifier un choix :**

- **Panneau « Choix » :** activer une phrase de choix ouvre sur place ses
  réglages : libellé, destination, forme de la phrase, suppression. Les droits
  sont ceux de F06.1.
- **Phrase automatique :** son texte ne se saisit pas directement. Corriger le
  libellé ou changer la destination dans le panneau recompose la phrase.
  Changer la destination propose les trois issues de la création.
- **Régénérer :** tire de nouveau une construction parmi celles cochées dans
  les réglages du projet. La commande n'est pas proposée lorsqu'une seule
  construction est cochée.
- **Personnaliser :** le texte de la phrase devient libre ; chaque renvoi reste
  un élément insécable. La formule du livre ne s'applique plus à cette phrase ;
  le libellé est conservé pour le graphe et la recherche.
- **Revenir à la phrase automatique :** possible seulement pour une phrase à un
  seul renvoi. Le texte écrit à la main est remplacé après avertissement ;
  l'action est annulable.
- **Second renvoi :** dans une phrase personnalisée, « Insérer un renvoi »
  ajoute un renvoi à l'endroit du curseur, avec sa destination et un libellé
  facultatif.
- **Retirer un renvoi :** le lien correspondant disparaît du récit et du
  graphe ; le texte qui l'entourait reste, à réécrire par l'auteur.
- **Pas de phrase de choix sans renvoi :** retirer le dernier renvoi revient à
  supprimer la phrase entière, après confirmation.
- **Scène de destination conservée :** supprimer un renvoi ou une phrase ne
  supprime jamais la scène visée. Si elle devient inaccessible, les contrôles
  de F09.2 le signalent.
- **Annulation :** annuler une suppression rétablit la phrase, ses renvois et
  leurs liens.

**Décisions confirmées le 1er octobre 2026 — liaison cachée depuis la scène :**

- **Déclaration :** la saisie ouverte par `/choix` ou le bouton propose à
  l'adulte seul une forme supplémentaire, « Lien caché (énigme) », qui crée la
  liaison cachée de [F05.1](#f051--liaisons-cachées-par-énigme) sans ajouter
  de phrase au texte.
- **Repère dans la scène :** la liaison est rappelée dans la page de la scène
  par un repère extérieur au récit, jamais imprimé, avec le numéro fixé de sa
  destination.
- **Conversion :** sur un choix à un seul renvoi, « Cacher ce choix (énigme) »
  retire la phrase, conserve le lien et fixe le numéro de la destination selon
  F05.1. À l'inverse, « Proposer comme choix » recrée une phrase automatique
  pour une liaison cachée. Ces deux commandes sont réservées à l'adulte.

**Critères d'acceptation :**

- **F05-AC20 — Libellé corrigé dans une phrase automatique :** étant donné
  « Continuer vers la lumière : rends-toi au 21. », lorsque l'enseignante
  remplace le libellé par « Suivre la lumière » dans le panneau, alors la
  phrase devient « Suivre la lumière : rends-toi au 21. », avec la même
  construction et la même destination.
- **F05-AC21 — Destination changée :** étant donné ce choix vers S018,
  lorsque l'enseignante choisit S016 pour destination, alors la phrase affiche
  le numéro de S016, le graphe montre S015 → S016 et S018 n'est pas supprimée.
- **F05-AC22 — Personnalisation explicite :** étant donné une phrase
  automatique, lorsque l'auteur tente de taper dans son texte sans avoir
  choisi « Personnaliser », alors la phrase reste inchangée ; après
  « Personnaliser », il peut écrire « Si le chant t'attire, suis la lumière
  au 21. », et un changement de formule du livre ne modifie plus cette phrase.
- **F05-AC23 — Retour à l'automatique :** étant donné cette phrase
  personnalisée à un renvoi, lorsque l'auteur confirme « Revenir à la phrase
  automatique », alors elle est recomposée depuis le libellé ; annuler rétablit
  le texte personnalisé. Pour la phrase à deux renvois de S051, ce retour
  n'est pas proposé.
- **F05-AC24 — Renvoi retiré :** étant donné la phrase de S051 vers S053 et
  S055, lorsque l'enseignante retire le renvoi vers S055, alors le lien
  S051 → S055 disparaît du graphe, S055 existe toujours et le renvoi vers S053
  est intact.
- **F05-AC25 — Dernier renvoi :** étant donné une phrase à un seul renvoi,
  lorsque l'auteur retire ce renvoi et confirme, alors la phrase entière est
  supprimée ; lorsqu'il annule l'opération, alors la phrase, son renvoi et son
  lien sont rétablis.
- **F05-AC26 — Choix caché puis proposé :** étant donné le choix « Déchiffrer
  les symboles » de S055 vers S062, qui porte le n° 38, lorsque l'enseignante
  utilise « Cacher ce choix (énigme) », alors la phrase disparaît du texte, la
  liaison cachée S055 → S062 existe et le n° 38 est fixé ; lorsqu'elle utilise
  ensuite « Proposer comme choix », alors une phrase automatique vers S062
  réapparaît.
- **F05-AC27 — Lien caché réservé à l'adulte :** étant donné Bilal disposant
  du profil « écriture et organisation », lorsqu'il ouvre la saisie d'un
  choix, alors la forme « Lien caché (énigme) » ne lui est pas proposée.

**Décisions confirmées le 1er octobre 2026 — numéro affiché et énigme :**

- **Numéro dès la création :** dans la scène, le renvoi affiche le numéro du
  livre. L'ordre imprimé de F11.5 est donc établi dès qu'un numéro doit être
  affiché, et non à la seule ouverture de la destination Livre.
- **Repère de destination :** à côté de la phrase, hors du récit et jamais
  imprimé, figure la référence stable de la destination (« S018 Clairière »).
  Le numéro peut changer d'ici au livre ; la référence ne change pas.
- **Repère vu par un élève (5 octobre 2026) :** pour un élève, quel que soit
  son profil, le repère donne le lieu de la destination sans sa référence
  (« Clairière »). La critique du côté élève relevait deux numéros pour une
  même scène, « rends-toi au 21 » et « S018 » ; l'élève n'en lit plus qu'un,
  celui du livre. L'adulte garde la référence, et l'élève la retrouve là où
  il choisit une destination.
- **Destination hors périmètre :** pour un élève, le repère n'indique que
  « autre chapitre » et son titre public, sans titre ni référence de scène,
  selon F05-AC03.
- **Numéro fixé d'une liaison cachée :** l'adulte garde le numéro actuel de la
  destination ou saisit celui que donne l'énigme, selon F05.1. Un numéro déjà
  fixé pour une autre scène est refusé à la saisie ; la scène concernée est nommée.
- **Élève qui rédige l'énigme :** le repère de la liaison lui indique le
  numéro à obtenir (« Ton énigme doit conduire au numéro 38 »), sans titre ni
  référence d'une destination hors de son périmètre. Il ne peut ni modifier
  ni retirer la liaison.
- **Numéro fixé modifié après coup :** si l'adulte change le numéro fixé d'une
  liaison dont la scène d'origine a déjà un texte, les contrôles de F09.2
  signalent cette scène « à vérifier », sans blocage : l'application ne lit
  pas l'énigme.

- **F05-AC34 — Numéro avant tout export :** étant donné un projet dont la
  destination Livre n'a jamais été ouverte, lorsque l'enseignante crée un choix
  vers S018, alors la phrase affiche un numéro pour S018 et ce numéro est celui
  que portera le premier PDF, sauf changement ultérieur du récit.
- **F05-AC35 — Numéro décalé, référence stable :** étant donné ce choix
  affichant « rends-toi au 21 », lorsque l'ajout de scènes fait passer S018 au
  n° 24, alors la phrase affiche 24 dans la scène et le repère indique toujours
  S018.
- **F05-AC36 — Numéro fixé déjà pris :** étant donné S062 fixée au n° 38,
  lorsque l'adulte saisit 38 pour une liaison cachée vers une autre scène,
  alors la saisie est refusée et S062 est nommée.
- **F05-AC37 — Numéro de l'énigme vu par l'élève :** étant donné Sacha chargé
  de S055, dont la liaison cachée mène à S062 au n° 38 dans un chapitre qui ne
  lui est pas attribué, lorsqu'il ouvre S055, alors il lit que son énigme doit
  conduire au numéro 38, sans voir le titre ni la référence de S062, et aucune
  commande ne lui permet de modifier la liaison.
- **F05-AC38 — Énigme à vérifier :** étant donné S055 rédigée pour le n° 38,
  lorsque l'adulte fixe S062 au n° 31, alors S055 est signalée « à vérifier »
  dans les contrôles, sans bloquer le PDF définitif.

**Décisions confirmées le 1er octobre 2026 — robustesse du texte :**

- **Bloc entier :** dans une sélection, une phrase de choix est prise en
  entier ou pas du tout ; elle ne peut pas être supprimée à moitié. Le texte
  d'une phrase personnalisée reste modifiable par qui en a le droit, chaque
  renvoi demeurant insécable.
- **Suppression par une personne autorisée :** une suppression qui contient une
  phrase de choix l'emporte avec ses liens, sans confirmation préalable ; un
  message le signale et propose d'annuler.
- **Suppression par une personne non autorisée :** le texte de récit
  sélectionné est supprimé ; la phrase de choix reste à sa place.
- **Annulation :** elle rétablit en un seul geste le texte, la phrase et ses liens.
  L'annulation vaut pour la scène ouverte (décision du 2 octobre 2026, après
  le prototype) : après un couper-coller entre deux scènes, on annule dans la
  scène d'arrivée puis dans celle de départ, et l'historique d'une scène ne
  survit pas à sa fermeture. Un même choix ne figure jamais dans deux scènes.
- **Couper puis coller :** le même choix est déplacé, dans la scène ou vers
  une autre, avec son libellé, la forme de sa phrase et sa destination ; le
  graphe suit.
- **Copier puis coller :** un nouveau choix est créé, de même libellé et de
  même destination.
- **Collage sans le droit requis :** lorsque le collage ferait créer ou
  déplacer un choix par une personne qui n'en a pas le droit — profil
  « écriture et propositions », ou raccord entre chapitres pour un élève —,
  le texte de récit est collé, la phrase de choix est écartée et un message
  l'indique. Le contrôle est fait côté serveur, selon le brief.
- **Vers l'extérieur :** une phrase de choix copiée hors de l'application
  devient du texte simple, avec le numéro affiché.
- **Depuis l'extérieur :** un texte collé ou tapé ne crée jamais de renvoi ;
  « rends-toi au 12 » saisi à la main reste du texte ordinaire.

**Critères d'acceptation :**

- **F05-AC28 — Sélection à cheval :** étant donné une sélection allant du
  milieu de « Lou fit un pas, puis un autre. » au milieu de la phrase de choix
  suivante, lorsque l'enseignante supprime, alors la fin du paragraphe et la
  phrase de choix entière disparaissent, le lien S015 → S018 est retiré, un
  message indique « 1 choix supprimé » et l'annulation rétablit le tout.
- **F05-AC29 — Tout sélectionner par une élève sans droit sur les choix :**
  étant donné Alice, profil « écriture et propositions », lorsqu'elle
  sélectionne tout le texte de S015 et le supprime ou le remplace, alors les
  paragraphes de récit sont supprimés ou remplacés et la phrase de choix
  demeure, avec son lien.
- **F05-AC30 — Choix déplacé par couper-coller :** étant donné la phrase
  « Continuer vers la lumière : rends-toi au 21. » de S015, lorsque
  l'enseignante la coupe et la colle dans S016, alors S015 ne porte plus ce
  choix, S016 le porte avec la même phrase, et le graphe montre S016 → S018
  à la place de S015 → S018.
- **F05-AC31 — Choix dupliqué par copier-coller :** étant donné la même phrase
  copiée de S015 et collée dans S016, lorsque le collage réussit, alors les
  deux scènes mènent à S018 par deux choix distincts ; modifier le libellé de
  l'un ne change pas l'autre.
- **F05-AC32 — Collage sans droit :** étant donné Bilal, profil « écriture et
  organisation » dans « La lisière », ayant copié deux paragraphes de récit et
  une phrase de choix, lorsqu'il les colle dans une scène d'un autre chapitre,
  alors les deux paragraphes sont collés, la phrase de choix ne l'est pas,
  aucun lien n'est créé et un message le lui indique.
- **F05-AC33 — Numéro tapé à la main :** étant donné un texte collé depuis
  Word contenant « rends-toi au 12 », lorsque le collage réussit, alors ce
  passage est du texte ordinaire : aucun choix ni lien n'est créé.

**Variantes confirmées le 1er octobre 2026 :**

- **Mode personnel :** l'auteur adulte dispose de toutes les commandes de
  cette section, liaison cachée comprise. Protections et profils n'y ont pas
  lieu d'être ; le paragraphe protégé n'y est pas proposé.
- **Récit classique :** pas de choix (F05-AC19). En mode classe, le paragraphe
  protégé de F06.1 y reste disponible.
- **Tablette :** tout passe par le bouton « Choix » et par un appui sur la
  phrase, qui ouvre le panneau. Aucune action ne dépend du survol, du clic
  droit ou du glisser-déposer. Une phrase se déplace par couper-coller ou par
  « Monter » et « Descendre » dans le panneau.
- **Clavier seul :** `/choix` ouvre la saisie ; les flèches parcourent la liste
  des destinations, Entrée valide, Échap referme sans rien créer. Une phrase de
  choix se sélectionne aux flèches comme un bloc ; Entrée ouvre son panneau,
  Suppr. la supprime avec le message d'annulation.

- **F05-AC39 — Création au clavier seul :** étant donné l'enseignante sans
  souris dans S015, lorsqu'elle saisit `/choix`, un libellé, choisit S018 aux
  flèches et valide par Entrée, alors le choix est créé ; lorsqu'elle appuie
  sur Échap pendant la saisie, alors rien n'est créé et le curseur revient
  dans le texte.
- **F05-AC40 — Déplacement sans glisser :** étant donné deux phrases de choix
  consécutives sur tablette, lorsque l'auteur utilise « Monter » sur la
  seconde, alors elle passe au-dessus de la première, liens inchangés.
- **F05-AC42 — Un seul numéro pour l'élève :** étant donné S015 dont le
  choix mène à S018, numéro 21 du livre, lorsqu'Alice ouvre S015, alors la
  phrase de choix affiche 21 et son repère « Clairière », sans « S018 » ;
  l'enseignante y lit « S018 Clairière ».
- **F05-AC41 — Mode personnel sans protection :** étant donné un projet
  personnel à choix, lorsque l'auteur ouvre une scène, alors aucune commande de
  protection ni repère de bloc protégé ne lui est présenté.

**Proposition retenue dans son principe, à spécifier — note de l'enseignant :**
un paragraphe de la scène visible de l'adulte seul, jamais imprimé ni partagé,
pour un rappel ou la solution d'une énigme. **Différé :** un passage du livre
caché aux élèves pendant l'écriture. L'enseignant obtient déjà cet effet en
plaçant le passage dans une scène d'un chapitre non attribué, reliée par un
raccord ; F06.2 cache alors la scène entière.

## F06 — Attributions, accès et organisation de l'écriture

### F06.1 — Attribution des chapitres et profils de participation

**Décisions confirmées :**

- L'attribution se fait uniquement au niveau du chapitre, à un ou plusieurs
  élèves. Il n'y a pas d'attribution de droits à la scène ni de règle d'héritage
  entre niveaux imbriqués.
- Plusieurs élèves peuvent travailler dans un même chapitre, chacun rédigeant
  une scène distincte. Il n'y a pas de taille d'équipe imposée ni de mécanisme
  particulier de binôme.
- Le parcours de référence est une rédaction individuelle de chaque scène.
  Dans la pratique décrite par le porteur, les élèves préparent leur texte sur
  papier puis le recopient. Un travail commun préalable sur papier reste
  possible ; il ne demande pas de coédition simultanée dans l'application.
  Cette pratique ne rend pas le passage sur papier obligatoire dans le produit.
- Le profil est choisi pour chaque élève dans chaque chapitre. Une nouvelle
  attribution donne par défaut le profil « écriture et propositions ».
  L'enseignant peut accorder explicitement « écriture et organisation » dans
  ce chapitre, sans modifier le profil de l'élève dans les autres chapitres.
- Le profil « écriture et propositions » protège les choix préparés : la
  phrase de choix entière, texte et renvois compris (précisé le 1er octobre
  2026 selon F05). L'élève ne peut pas la reformuler ni la supprimer directement,
  même si la destination reste inchangée. Il rédige le texte autour de ces
  choix. Aucune proposition de changement d'un choix n'est prévue dans
  l'application (décision du 2 octobre 2026) : l'élève en parle à l'enseignant
  en classe. Une reformulation peut
  modifier le sens du parcours et rendre la suite incohérente sans changer
  la liaison ; elle relève donc aussi des droits de modification des choix.
- Le profil « écriture et organisation » permet de créer des scènes et de
  modifier les choix internes au chapitre, libellés et liens compris.
  Tous les raccords entre chapitres restent réservés à l'enseignant, qu'ils appartiennent à la même
  partie ou à des parties différentes, même si l'élève intervient
  des deux côtés. Les autres opérations d'organisation restent à délimiter.
- **Paragraphe protégé (décision du 1er octobre 2026) :** l'enseignant peut
  protéger un paragraphe entier d'une scène ; un élève ne peut alors ni le
  modifier ni le supprimer, et écrit autour. La protection porte sur le
  paragraphe, pas sur une sélection libre de texte. Les phrases de choix sont
  protégées d'office selon la règle ci-dessus. Le paragraphe protégé fait
  partie de la première livraison ; sa réalisation dans l'éditeur a été
  éprouvée par le prototype du 2 octobre 2026, selon
  [l'architecture](architecture.md#résultats-du-prototype-de-léditeur-2-octobre-2026).
- **Bloc pris comme un tout (décision du 2 octobre 2026) :** « le curseur n'y
  entre pas » signifie qu'un bloc protégé se sélectionne en entier : les
  flèches s'y arrêtent, il s'entoure d'un cadre, aucun curseur n'apparaît dans
  son texte et rien ne s'y écrit. Entrée ouvre un paragraphe dessous ; un
  « + » en ouvre un dessus ou entre deux blocs.
- **Protéger et déprotéger :** l'enseignant place le curseur dans un paragraphe
  et choisit « Protéger ce paragraphe » ; « Retirer la protection » fait
  l'inverse. Il modifie lui-même un paragraphe protégé sans lever la protection.
- **Ce que voit l'élève :** un bloc protégé, phrase de choix ou paragraphe,
  porte un repère discret indiquant qu'il a été préparé par l'enseignant. Le
  curseur n'y entre pas ; l'élève écrit avant et après, et peut insérer un
  paragraphe entre deux blocs protégés. Aucune commande de proposition n'est
  offerte sur un bloc protégé, phrase de choix ou paragraphe : l'élève ne s'en
  occupe pas. Les demandes de F07.2 restent limitées à ce qu'elles couvrent :
  ajout ou suppression d'une scène et modification après validation.
- **Profil « écriture et organisation » et paragraphe protégé :** ce profil
  lève la protection d'office des phrases de choix internes au chapitre, pas
  celle d'un paragraphe protégé par l'enseignant, qui vaut pour tous les élèves.
- **Action de jeu (décision du 2 octobre 2026) :** un paragraphe d'action de
  jeu de [F04.2](#f042--objets-de-lhistoire) est protégé d'office pour le
  profil « écriture et propositions », qui ne peut ni en créer ni en modifier ;
  le profil « écriture et organisation » en crée et en modifie dans son chapitre.
- **Phrase contenant un raccord :** une phrase de choix dont un renvoi mène à
  un autre chapitre est protégée en entier pour les deux profils, même si elle
  contient aussi un renvoi interne.
- Avec ces deux profils, un élève ne peut pas supprimer directement une scène
  contenant du travail ni modifier directement une scène validée. La prise
  en charge informative ne lève pas ces restrictions.
- Les deux profils sont conservés pour la première livraison ; aucun troisième
  profil donnant les droits de l'enseignant sur un chapitre n'est prévu.
  Les élèves peuvent demander les changements protégés selon F07.2, à
  l'oral en première livraison (5 octobre 2026).

**Parcours nominal acquis :** l'enseignant attribue un chapitre à plusieurs
élèves ; chacun y choisit une scène encore non écrite et signale qu'il s'en
occupe ; les élèves préparent puis saisissent leurs textes dans des scènes
distinctes, depuis plusieurs postes. Le premier profil passe par une
proposition pour faire évoluer la structure.

**Conséquence métier :** l'attribution définit le chapitre dans lequel l'élève
peut participer. La prise en charge indique la scène dont il s'occupe. Elle ne
réintroduit pas des permissions personnalisables à la scène et ne constitue
ni un transfert de propriété du texte ni une validation.
Prendre en charge plusieurs scènes selon F06.3 ne donne pas de droits
supplémentaires sur leur organisation ou leurs choix.

Les profils définissent les droits d'organisation ; le signalement du travail
relève de F06.3. Le contrôle de sauvegarde de F08.1 s'applique indépendamment
du profil ; le parcours de révision et de validation est décrit en F07.
Les droits sur les choix, y compris leurs libellés, s'appliquent aussi aux
collages et aux suppressions selon les garanties du brief ; ces opérations
ne permettent pas de contourner le profil de participation.

**Décision confirmée — accès par attribution :** ne pas ajouter d'état
« ouvert aux élèves » au projet pour démarrer l'écriture. L'attribution
d'un chapitre rend effectifs les droits de participation de l'élève dans
ce chapitre, sans seconde action d'ouverture. Sans chapitre attribué dans
une histoire, l'élève n'accède à aucune de ses scènes de travail. L'accès de
classe et l'identification individuelle restent requis selon F06.4 ; ils
ne remplacent pas l'attribution. La lecture du chapitre entier est définie
en F06.2.

**Conséquence :** l'enseignant peut préparer sans attribuer de travail aux
élèves. Attribuer un chapitre pendant cette préparation donne immédiatement
les droits correspondants ; il n'y a pas d'attribution préparatoire inactive.
Cette règle ne définit pas les conditions de fermeture de l'accès de classe.
Les plages horaires facultatives de F06.4 limitent le moment d'utilisation
sans retirer les attributions. Sans restriction horaire, ou pendant une plage
autorisée, l'attribution permet l'accès immédiatement ; hors plage, l'élève
retrouve ses droits à la prochaine ouverture prévue, sans action par projet.

Le rattachement différé à une classe est défini en F01. La présence
éventuelle d'une histoire sans attribution dans l'accueil élève reste ouverte.

**Proposition non arbitrée :** garder les déplacements entre chapitres sous
la responsabilité de l'enseignant.

**Justification des deux profils :** l'autonomie d'organisation laisse la
validation et les changements protégés à l'enseignant. Les demandes permettent
aux élèves de prendre des initiatives sans introduire un rôle d'administrateur
de chapitre ni déléguer l'approbation finale de leurs textes.

**Questions ouvertes :**

- Changement de profil pendant une séance.
- Opérations restantes d'organisation : renommer, réordonner, déplacer entre
  chapitres et supprimer une scène vide. Définition d'une scène « contenant du
  travail », notamment lorsque son texte a été effacé ou qu'elle a des images.
- Portée des modifications internes si une scène reçoit un raccord d'un autre
  chapitre ; protection de ce raccord et effets sur la cohérence globale.
- Forme de la proposition et décision de l'enseignant : voir F07.

### F06.2 — Lecture et découverte du récit

**Objectif pédagogique exprimé :** préserver la découverte du livre terminé
en limitant ce qu'un élève peut lire pendant la rédaction. Le porteur décrit
comme référence d'usage un accès limité au chapitre dans la V0. En V1,
la frontière de lecture est le chapitre, regroupement de scènes au sein d'une partie.

**Décision confirmée :** un élève peut tester la lecture dans les limites
strictes de ses autorisations ; le playtest ne donne pas accès à un chapitre
non attribué. La portée du playtest est décidée en F09.1.
La page de préparation reste réservée à l'enseignant selon F02 ; une
attribution n'ouvre pas cet accès. La consultation du résumé local suit F02.

**Décision confirmée — lecture du chapitre entier :** les élèves peuvent
lire toutes les scènes des chapitres attribués, y compris celles prises en
charge par d'autres, mais pas les autres chapitres pendant la rédaction.
Cette règle est commune aux deux profils, sans exception de lecture à la
scène. Elle ne lève aucune restriction de modification ou de validation.

**Critères d'acceptation :**

- **F06-AC20 — Lecture entre camarades du même chapitre :** étant donné
  Alice et Bilal dans le même chapitre et une scène prise en charge par
  Bilal, lorsqu'Alice consulte cette scène, alors elle peut en lire le texte,
  avec chacun des deux profils de participation. Une éventuelle validation
  continue à empêcher sa modification autonome selon F07.
- **F06-AC21 — Lecture limitée aux chapitres attribués :** étant donné
  Alice autorisée dans A mais pas dans B, lorsqu'elle tente d'ouvrir une
  scène de B, alors elle n'en obtient pas le contenu, même si une scène de A
  y conduit par un choix. La présentation du raccord reste à préciser.

- **F06-AC22 — Carte visible sans accès au travail :** étant donné Alice
  sans attribution au chapitre « Le sanctuaire », lorsqu'elle consulte
  les cartes du projet, alors son titre et son image choisie restent visibles.
  Ouvrir la carte ne lui permet pas de consulter ses scènes ou ses consignes.

**Décision confirmée le 30 septembre 2026 — lecture ouverte de l'histoire :**
un réglage de l'histoire permet à l'adulte d'autoriser les élèves à lire
toutes les scènes, y compris celles des chapitres non attribués. Il est
désactivé par défaut et modifiable à tout moment ; la règle ci-dessus
s'applique tant qu'il reste désactivé. Activé, il ouvre en lecture seule le
texte courant de toutes les scènes et leurs choix, la recherche de F05 sur
ces textes et le playtest du livre entier depuis le départ selon F09.1.
L'écriture, les consignes, les retours de révision et les idées d'illustration
restent limités aux chapitres attribués ; la préparation reste réservée à
l'adulte selon F02. Le réglage peut notamment servir à la découverte
collective du livre en fin de projet, ou à donner à une classe la
connaissance de tout le récit pour écrire des raccords cohérents. Il est
sans objet en mode personnel.

- **F06-AC48 — Lecture ouverte :** étant donné Alice attribuée au seul
  chapitre « Le port » et le réglage de lecture ouverte activé, lorsqu'elle
  ouvre une scène du chapitre « Le sanctuaire », alors elle en lit le texte
  et ses choix, sans pouvoir l'écrire ni consulter sa consigne ou ses retours.
- **F06-AC49 — Retour à la lecture limitée :** étant donné le réglage activé
  puis désactivé par l'enseignant, lorsqu'Alice tente de rouvrir une scène
  du « Sanctuaire », alors son contenu ne lui est plus accessible.

**Proposition non arbitrée :** afficher les accès effectifs de façon
compréhensible pour l'enseignant.

**Questions ouvertes :**

- Présentation de la découverte collective en fin de projet, désormais
  possible par la lecture ouverte, et distinction avec la lecture d'une version partagée.
- Destination hors périmètre : informations visibles et consigne de raccord
  narrative ; les droits de modification des liaisons relèvent de F06.1.

### F06.3 — Prise en charge et signalement du travail

**Objectif :** rendre visible le travail déjà pris en charge, y compris avant
la première saisie, et éviter que deux élèves préparent sans le savoir le même
passage. La prise en charge peut correspondre à un travail sur papier ; elle
ne signifie pas que l'élève est connecté ou saisit actuellement le texte.

**Éléments confirmés :**

- La prise en charge est explicite et visible par les élèves autorisés à
  accéder à la scène. Un avatar avec un signe distinctif est un exemple donné
  par le porteur ; le dessin précis du badge n'est pas arrêté.
- Le signalement persiste entre les séances, même si le texte est encore
  vide. La fermeture de la session ne suffit pas à le retirer.
- La validation du travail élève conserve l'élève signalé comme repère de
  suivi. La scène reste retrouvable parmi ses prises en charge, avec l'état
  « Validé » ; elle n'est plus présentée comme un travail de
  rédaction restant à effectuer. Ce repère ne constitue pas une attribution
  exclusive du texte à cet élève.
- L'enseignant peut retirer ou réattribuer la prise en charge. Cela ne supprime
  pas le texte déjà enregistré.
- Un élève arrêté sur une scène après un conflit de sauvegarde ne s'y voit
  proposer ni de la prendre ni de la rendre, jusqu'au geste de
  l'enseignant ([F08.1](#f081--écritures-concurrentes), 7 octobre 2026).
- La prise en charge est informative et ne retire pas le droit d'écrire aux
  autres élèves autorisés dans le chapitre. Un élève absent ne bloque pas
  ses camarades : un élève autorisé peut reprendre lui-même la prise en
  charge après avertissement, sans intervention préalable de l'enseignant,
  selon le parcours ci-dessous. Les restrictions liées à une validation du
  texte restent définies en F07.
- Lorsqu'un élève soumet une scène, il en devient automatiquement l'élève
  prenant en charge le suivi et le destinataire des corrections demandées,
  tant qu'il conserve cette prise en charge. Il remplace le précédent élève signalé pour cette responsabilité. Cette
  règle ne change pas les droits attribués au niveau du chapitre ; voir F07.1.

**Transitions acquises pour le signalement :** sans prise en charge → prise
en charge déclarée ; prise en charge → absence de prise en charge ou changement
d'élève à l'initiative de l'enseignant ; sans prise en charge → prise en
charge donnée à un élève du chapitre par la répartition que l'enseignant
confirme à l'impression des fiches ; prise en charge par Alice → prise en
charge par Bilal après reprise volontaire confirmée par Bilal ; prise en
charge → absence de prise en charge à l'initiative de l'élève signalé, tant
que la scène s'écrit (5 octobre 2026) ; soumission
par un élève → prise en charge par cet élève, qu'une autre prise en charge
existe ou non. Ces transitions ne
valent ni validation du texte ni autorisation de modifier une version déjà validée.

**Décision confirmée — reprise autonome après avertissement :** lorsqu'un
élève autorisé souhaite écrire dans une scène modifiable prise en charge
par un camarade, il est informé de cette prise en charge et peut abandonner
l'intervention ou reprendre la scène à son nom. Confirmer cette reprise
remplace l'élève signalé, sans attendre l'enseignant ni demander une validation
numérique au camarade. Le porteur compte sur la concertation des élèves ;
l'application rend le changement explicite sans organiser cette discussion.

La scène conserve un élève de référence courant ; cette reprise ne crée
pas une liste de coresponsables. C'est la prise en charge qui change, pas
l'attribution du chapitre ni les droits d'écriture des autres élèves.
Le texte courant et les remises conservées ne sont pas remplacés par cette
action. Consulter une scène seule ne transfère pas sa prise en charge.
Les droits sur un texte validé et les garanties de sauvegarde de F08 restent
applicables. Ce parcours remplace la proposition de réserver à l'enseignant
la réattribution avant soumission.

**Critères d'acceptation :**

- **F06-AC41 — Abandon après avertissement :** étant donné une scène prise
  en charge par Alice et Bilal autorisé à la modifier, lorsqu'il demande à
  y écrire, voit qui s'en occupe puis abandonne, alors Alice reste signalée
  et aucun texte n'est modifié par cette action.
- **F06-AC42 — Reprise volontaire sans enseignant :** dans la même situation,
  lorsque Bilal confirme qu'il reprend la scène, alors il remplace Alice
  dans le signalement et dans la sélection « Prises en charge par Bilal ».
  Aucune approbation de l'enseignant n'est requise ; le texte, les remises
  d'Alice et les droits des deux élèves sont conservés. La simple ouverture
  pour lecture n'effectue pas cette reprise.
- **F06-AC47 — Repère conservé après validation :** étant donné une scène
  prise en charge par Alice et soumise à l'enseignant, lorsqu'il valide le
  travail élève, alors Alice reste signalée et la scène reste retrouvable
  dans « Prises en charge par Alice ». Son état « Validé »
  la distingue du travail de rédaction encore à effectuer ; les finitions
  pour le livre restent un avancement distinct.

**Décision confirmée — répartition initiale et plusieurs prises en charge :**
un élève peut prendre en charge plusieurs scènes simultanément, sans limite
fonctionnelle à une seule scène ni quota arbitraire. Les élèves peuvent se
répartir les scènes dès le début du travail, avant de rédiger sur papier ou
dans l'application. Ils peuvent aussi choisir ensemble plusieurs scènes
liées pour préparer un passage cohérent. Chacun reste dans ses chapitres
attribués ; une même partie n'ouvre aucun droit supplémentaire.

La sélection de plusieurs scènes est explicite. Prendre en charge une scène
n'ajoute pas automatiquement celles qui suivent dans l'ordre classique ou
celles atteignables par des choix : une convergence peut déjà être préparée
par un camarade. Cette sélection ne crée ni nouveau groupe narratif à
maintenir, ni réservation exclusive, ni exigence de coédition. La scène
reste l'unité de soumission et de validation ; préparer trois scènes ensemble
ne crée pas de remise ou de validation collective du lot.

**Critères d'acceptation :**

- **F06-AC38 — Plusieurs scènes dès la répartition :** étant donné trois
  scènes non prises en charge d'un chapitre attribué à Alice, lorsque
  celle-ci les sélectionne pour les préparer, alors les trois signalements
  sont conservés même si les textes sont encore vides. Le suivi « Prises en
  charge par Alice » retrouve les trois scènes sans attendre une soumission.
- **F06-AC39 — Sélection sans propagation :** étant donné les scènes A, B,
  C choisies par Alice et un choix de C vers D non sélectionnée, lorsqu'elle
  confirme ses prises en charge, alors D n'est pas ajoutée automatiquement.
  Dans un récit classique, la scène suivant C n'est pas non plus ajoutée.
- **F06-AC40 — Préparation sur papier et droits conservés :** étant donné
  Alice préparant trois scènes sur papier et Bilal autorisé dans le même
  chapitre, lorsqu'ils reviennent dans l'application, alors Alice reste
  signalée sur ces trois scènes sans que Bilal ait perdu ses droits ordinaires.
  Cette répartition ne leur donne aucun accès à un autre chapitre.

**Décision confirmée le 4 octobre 2026 — scènes sans élève réparties par
l'enseignant :** les élèves gardent l'initiative de prendre leurs scènes.
Pour celles que personne n'a prises, l'enseignant peut demander, à
l'impression des fiches « par élève », qu'elles soient réparties à parts
égales entre les élèves du chapitre ; la règle, son moment et son message
sont en [F07.4](#f074--fiches-de-rédaction-pour-le-travail-sur-papier). Une
fois confirmée, la répartition crée des prises en charge ordinaires : elle
évite que deux élèves écrivent la même scène sans le savoir, sans
l'empêcher. Une réservation exclusive est écartée, pour qu'un élève absent
ne bloque pas ses camarades.

- **F06-AC61 — Répartition non exclusive :** étant donné S006 donnée à Emma
  par une répartition confirmée, lorsque Chloé, du même chapitre, veut y
  écrire, alors elle est avertie qu'Emma s'en occupe et peut la reprendre à
  son nom, comme pour toute prise en charge ; l'enseignant peut aussi
  retirer ou changer l'élève.

**Décision confirmée le 4 octobre 2026 — l'enseignant s'attribue une
scène :** l'enseignant peut prendre une scène à son nom, pour l'écrire ou la
finir lui-même. À la différence de la prise en charge d'un élève, celle-ci
est exclusive : un élève ne peut pas la reprendre à son nom ni y écrire, et
garde la lecture que [F06.2](#f062--lecture-et-découverte-du-récit) lui
donne. La prise en charge reste informative et non exclusive entre élèves.

- **Motif du porteur :** l'enseignant écrit lui-même certaines scènes, de
  liaison par exemple, ou finit celle d'un élève absent ; elle ne doit pas
  lui être reprise entre-temps.
- **États :** la scène que l'enseignant s'attribue a ceux d'une scène sans
  élève, « En cours », « Validé » et « Prête »
  ([F11.1](#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre)).
- **Retour :** l'enseignant peut la rendre, en retirant son nom ou en
  désignant un élève du chapitre ; le texte et les remises sont conservés.
- **Fiches de rédaction :** elle n'est pas une scène sans élève et n'entre
  donc pas dans la répartition de
  [F07.4](#f074--fiches-de-rédaction-pour-le-travail-sur-papier).

- **F06-AC62 — Scène de l'enseignant :** étant donné S018 que Mme Laurent
  s'est attribuée dans le chapitre d'Alice, lorsqu'Alice l'ouvre, alors elle
  la lit, voit que Mme Laurent s'en occupe et ne peut ni y écrire ni la
  reprendre à son nom ; lorsque Mme Laurent désigne Alice à sa place, alors
  Alice peut y écrire, comme pour toute prise en charge.

**Scène déjà remise (confirmé le 4 octobre 2026) :** une scène qu'un élève
a remise et que l'enseignant s'attribue garde son état et ses remises ;
l'enseignant choisit ensuite l'état qu'il veut.

Restent à préciser : l'élève alors indiqué pour le suivi et les
encouragements de F07.5 ; la place de cette scène dans le Suivi et ses
filtres.

**Décision confirmée le 5 octobre 2026 — l'élève retire son propre
signalement :** l'élève qui s'occupe d'une scène peut cesser de s'en occuper,
de lui-même, tant que la scène s'écrit (« En cours » ou « À reprendre »). La
scène redevient sans prise en charge ; son texte, ses remises et ses retours
sont conservés, et les droits d'écriture du chapitre ne changent pas. Le
retrait n'est pas proposé quand la scène est « À valider », « Validé » ou
« Prête » : l'élève signalé reste le repère du suivi, et l'enseignant garde
la main pour le changer.

- **Motif :** la critique d'ergonomie du côté élève (5 octobre 2026, 22/40
  et 21/40) relevait qu'un élève qui prend la scène d'un camarade, par
  erreur ou non, n'avait aucun retour en arrière : seul le camarade ou
  l'enseignant pouvait défaire le geste.
- **Reprise annulable :** juste après avoir pris une scène à son nom, ou
  cessé de s'en occuper, l'élève peut annuler ce geste ; la prise en charge
  précédente est rétablie. La forme est décrite dans le
  [design](design.md#côté-élève-repris-après-critique-5-octobre-2026).

- **F06-AC64 — Retrait de son signalement :** étant donné S015 « En cours »,
  dont Alice s'occupe, lorsqu'elle choisit de ne plus s'en occuper, alors
  la scène n'a plus d'élève signalé, son texte est conservé et Alice peut
  toujours y écrire, comme tout élève du chapitre. La scène ne figure plus
  dans « Prises en charge par Alice ».
- **F06-AC65 — Pas de retrait après la remise :** étant donné S016
  « À valider », dont Bilal s'occupe, lorsqu'il ouvre la scène, alors le
  retrait de son signalement ne lui est pas proposé.
- **F06-AC66 — Reprise annulée :** étant donné S017 dont Bilal s'occupe et
  qu'Alice vient de prendre à son nom, lorsqu'elle annule aussitôt, alors
  Bilal est de nouveau signalé et aucun texte n'a changé.

**Propositions non arbitrées :**

- Présenter un indicateur compréhensible sans dépendre du seul dessin d'un
  avatar : élève concerné et sens « prépare ce passage ». La présence en ligne
  et une saisie en cours constituent des informations différentes.

**Questions ouvertes :**

- Changements simultanés de prise en charge, sélection partiellement déjà
  prise et échec partiel ; emplacement exact de l'avertissement à l'entrée
  en écriture. Ne pas confondre ces détails avec un verrou de coédition.
- Éventuelle réattribution par l'enseignant après une soumission et effet
  sur les retours déjà adressés ; durée pendant laquelle une reprise reste
  annulable par l'élève.
  La validation du travail élève ne retire pas le signalement, selon la
  décision ci-dessus.
- Attribution de chapitre retirée ou scène déplacée pendant une prise en
  charge : voir F03.1.

La protection contre un écrasement entre deux sessions relève de F08.1,
indépendamment du signalement de prise en charge.

### Critères d'acceptation sur les éléments confirmés

- **F06-AC01 — Attribution collective :** étant donné trois élèves participant
  à un même chapitre, lorsque l'enseignant leur attribue ce chapitre,
  alors le travail peut concerner ces trois élèves sans imposer des binômes.
- **F06-AC02 — Rédaction sur plusieurs postes :** étant donné deux élèves
  autorisés à rédiger deux scènes distinctes du même périmètre, lorsqu'ils
  écrivent simultanément depuis deux postes, alors chacun retrouve son texte
  dans sa scène et aucun texte ne remplace celui de l'autre.
- **F06-AC03 — Respect du périmètre :** étant donné un élève sans droit de
  participation dans un chapitre, lorsqu'il tente de modifier une scène de
  ce chapitre, alors son action ne modifie pas cette scène.
- **F06-AC04 — Signalement visible :** étant donné un élève ayant déclaré
  préparer une scène, lorsqu'un camarade autorisé consulte cette scène, alors
  il peut identifier l'élève qui la prépare avant de commencer son propre travail.
- **F06-AC06 — Reprise entre séances :** étant donné une prise en charge sur une
  scène encore vide, lorsque l'élève ferme sa session puis revient à la séance
  suivante sans changement intermédiaire, alors le signalement est conservé.
- **F06-AC07 — Retrait par l'enseignant :** étant donné une scène prise en charge
  contenant un texte enregistré, lorsque l'enseignant retire la prise en charge,
  alors ce signalement disparaît et le texte est conservé.
- **F06-AC08 — Profil avec propositions :** étant donné un élève disposant
  seulement de l'écriture et des propositions dans un chapitre, lorsqu'il
  souhaite ajouter une scène, alors il peut proposer cette évolution, à
  l'oral en première livraison (F07.2), mais ne peut pas créer directement
  la scène dans le récit.
- **F06-AC10 — Prise en charge non bloquante :** étant donné une scène encore
  modifiable prise en charge par Alice, lorsqu'un autre élève disposant du
  droit d'écrire dans ce chapitre veut intervenir, alors il peut
  reprendre la prise en charge après avertissement sans demander une
  réattribution à l'enseignant. Son enregistrement reste soumis au contrôle
  de F08.1 ; la prise en charge ne crée pas de droit exclusif sur le texte.
- **F06-AC11 — Profil par défaut :** étant donné un élève nouvellement attribué
  à un chapitre, lorsque l'enseignant n'a pas choisi de profil supérieur, alors
  l'élève dispose de l'écriture et des propositions, sans création directe de
  scènes ni modification directe des choix, libellés et destinations compris.
- **F06-AC12 — Délégation locale :** étant donné Alice autorisée à organiser
  le chapitre A et seulement à écrire et proposer dans B, lorsqu'elle souhaite
  créer une scène, alors elle peut le faire dans A mais pas directement dans B.
- **F06-AC13 — Raccord entre chapitres :** étant donné un élève autorisé
  à organiser deux chapitres, lorsqu'il tente de créer ou modifier un
  choix reliant les deux, alors le changement n'est pas appliqué par son
  action. Le raccord relève de l'enseignant, même sous une même partie.
- **F06-AC14 — Suppression protégée :** étant donné une scène contenant un
  texte rédigé, lorsqu'un élève disposant de l'un des deux profils tente de
  supprimer la scène, alors la scène et son texte sont conservés.
- **F06-AC45 — Phrase de choix protégée pour le profil courant :** étant donné Alice
  disposant du profil « écriture et propositions » dans une scène modifiable,
  lorsqu'elle tente de remplacer « Traverser le pont » par « Nager jusqu'à
  l'autre rive » dans une phrase de choix, à destination inchangée, alors la
  phrase préparée est conservée.
  Elle peut rédiger autour du choix ; aucune commande de proposition ne lui
  est offerte sur cette phrase.
- **F06-AC46 — Phrase modifiable dans le périmètre d'organisation :** étant
  donné Bilal disposant du profil « écriture et organisation » et un choix
  interne à son chapitre dans une scène modifiable, lorsqu'il reformule
  uniquement la phrase de choix, alors la reformulation est permise et la
  destination reste inchangée. Ce droit ne s'étend pas aux raccords entre chapitres.
- **F06-AC50 — Paragraphe protégé pour les deux profils :** étant donné le
  premier paragraphe de S015 protégé par l'enseignante, lorsqu'Alice (écriture
  et propositions) ou Bilal (écriture et organisation) tente de le modifier ou
  de le supprimer, alors il est conservé tel quel ; chacun peut écrire un
  paragraphe avant ou après lui.
- **F06-AC51 — Protection conservée après retouche de l'enseignante :** étant
  donné ce paragraphe protégé, lorsque l'enseignante en corrige un mot, alors
  la correction est enregistrée et le paragraphe reste protégé ; « Retirer la
  protection » le rend modifiable par les élèves autorisés à écrire.
- **F06-AC52 — Phrase mêlant renvoi interne et raccord :** étant donné la
  phrase de S051 vers S053 (même chapitre) et vers une scène d'un autre
  chapitre, lorsque Bilal, profil « écriture et organisation », tente de la
  reformuler, alors la phrase entière est conservée.

- **F06-AC18 — Attribution sans seconde ouverture :** étant donné un élève
  identifié dans sa classe et un chapitre modifiable que l'enseignant vient
  de lui attribuer, lorsqu'il accède à son travail pendant une plage autorisée
  ou sans restriction horaire, alors il dispose du profil
  attribué sans que l'enseignant ait à ouvrir séparément le projet aux élèves.
- **F06-AC19 — Aucun chapitre attribué :** étant donné un élève identifié
  dans sa classe mais sans chapitre attribué dans une histoire, lorsqu'il
  tente d'accéder à une scène de travail de cette histoire, alors il n'accède
  pas à son contenu. Ce critère ne tranche pas l'affichage du titre de
  l'histoire dans l'accueil.

Les critères relatifs à la lecture sont en F06.2. Ceux relatifs aux limites
restantes du profil d'organisation seront précisés après arbitrage. Les
critères de prises en charge multiples sont définis en F06.3.

### Variantes

- **Classe classique :** l'attribution à plusieurs élèves et la rédaction de
  scènes distinctes restent pertinentes. Les règles propres aux destinations
  des choix ne s'appliquent pas ; l'ordre de lecture est défini en F03.1.
- **Personnel :** l'auteur adulte gère son récit ; le parcours d'attribution
  aux élèves n'est pas nécessaire. Le signalement de prise en charge vise ici
  le travail en classe. La protection contre un écrasement entre plusieurs
  sessions du même auteur reste applicable. Le parcours des scènes écrites
  directement par l'adulte est défini en F11.1.

### F06.4 — Classe de référence et postes partagés

**Cas de référence confirmé pour concevoir la V1 :** 25 élèves de cycle 3
et 10 ordinateurs disponibles. Ce cas est choisi par le porteur pour orienter
le produit ; ce n'est ni une limite de capacité ni une affirmation sur la
configuration majoritaire des écoles. Sa propre classe compte actuellement
10 élèves et 10 ordinateurs ; les deux configurations doivent rester possibles.

**Besoin confirmé :** permettre aux élèves de se succéder rapidement sur les
postes disponibles. La préparation sur papier et sa saisie dans l'application
facilitent cette organisation. Un élève ne doit pas avoir besoin d'une adresse
électronique personnelle, conformément au brief. Le pays d'usage, les
caractéristiques des appareils et le rythme des séances restent à préciser.

**Parcours confirmé :**

- Ouvrir l'espace élève de la classe sur chaque poste, puis identifier
  l'élève qui l'utilise par son profil et un code personnel court.
- Proposer un changement d'élève qui termine l'accès individuel précédent
  et revient au choix des profils tout en conservant l'accès à la classe.
  Ne pas imposer de ressaisir les identifiants de classe à chaque rotation.
- Rendre l'identité active visible et appliquer les droits du nouvel élève
  après son identification. Un accès partagé à la classe ne fusionne pas les
  identités, les attributions ni les responsabilités des soumissions.
- Garder l'accès enseignant séparé du parcours de changement d'élève.
  Préserver le texte saisi lors du changement, conformément aux exigences F08.

**Critères d'acceptation sur les éléments confirmés :**

- **F06-AC15 — Rotation sans reconnexion de classe :** étant donné Alice
  utilisant un poste ouvert à sa classe, lorsqu'elle choisit de changer
  d'élève, alors son accès individuel se termine et le choix des profils
  réapparaît. Bilal peut ensuite accéder à son profil avec son code personnel
  sans ressaisir les identifiants de classe.
- **F06-AC16 — Droits du nouvel élève :** étant donné Alice autorisée dans
  le chapitre A et Bilal seulement dans B, lorsque Bilal s'identifie après
  le changement d'élève, alors son identité est affichée, ses droits sont
  ceux de B et les droits d'Alice ne sont pas conservés pour lui. Ce parcours
  ne lui ouvre pas l'espace enseignant.
- **F06-AC17 — Travail conservé au changement :** étant donné un texte
  enregistré par Alice, lorsque Bilal prend ensuite le poste avec son propre
  profil, alors le texte d'Alice reste conservé et un texte soumis par Bilal
  est attribué à Bilal selon F07.1. Le traitement d'une sauvegarde encore
  inachevée au moment du changement reste à détailler selon F08.

**Référence d'usage V0 vérifiée :** la connexion combine un accès de classe
et un profil élève protégé par un PIN. Le parcours de déconnexion examiné
efface les deux accès ; un changement d'élève qui conserverait la classe
n'a pas été retrouvé. Ce constat ne prescrit pas l'architecture V1.

**Décision confirmée — code individuel et remise des accès :** chaque profil
élève dispose d'un code à quatre chiffres, proposé automatiquement à sa
création. Depuis son espace adulte, l'enseignant peut choisir, consulter et
modifier ce code à tout moment. Un support individuel imprimable permet de
le remettre à l'élève ; les profils réinscrits conservent leur code, sauf
modification explicite. Le code est utilisé après l'accès de classe et la
sélection du profil ; il ne donne pas à lui seul accès à une classe.

En cas d'oubli, l'enseignant peut consulter le code ou le remplacer et
imprimer le support correspondant, sans recréer le profil ni changer ses
textes, inscriptions ou attributions. La modification remplace le code pour
les prochaines identifications ; elle ne coupe pas la séance en cours de
l'élève, selon la décision du 8 octobre 2026 plus bas. Aucun accès élève ne permet de consulter ou modifier les
codes des profils par les commandes de gestion réservées à l'enseignant.

**Critères d'acceptation :**

- **F06-AC23 — Remise et consultation du code :** étant donné un nouveau
  profil, lorsque l'enseignant ouvre sa gestion des accès, alors un code à
  quatre chiffres est disponible, consultable, modifiable et imprimable
  sur un support individuel. Réinscrire ce profil dans une nouvelle classe
  ne change pas son code automatiquement.
- **F06-AC24 — Changement sans perte d'identité :** étant donné Alice avec
  des textes et attributions, lorsque l'enseignant remplace son code par
  un autre, alors la prochaine identification d'Alice accepte le nouveau
  code et refuse l'ancien ; son profil et ses travaux restent identiques.
- **F06-AC25 — Séparation des accès :** étant donné une personne connaissant
  le code d'Alice mais sans accès à sa classe, lorsqu'elle tente de s'identifier
  avec ce seul code, alors l'accès est refusé. Une session élève ne permet
  pas non plus de consulter les codes via la gestion réservée à l'enseignant.

**Point technique arbitré le 8 octobre 2026 :** le besoin de consulter le
code est confirmé, et le code n'est pas stocké en clair : il est chiffré par
l'application, selon la recommandation de
[l'architecture](architecture.md#protection-des-accès-de-classe-et-des-codes-élèves).
**Recommandation retenue le même jour :** limiter les essais erronés et
permettre une récupération simple par l'enseignant, sans bloquer toute la
classe pour les erreurs d'un seul élève. Les seuils et délais sont décidés
le même jour, plus bas.

**Décision confirmée — travail numérique à domicile facultatif :** le produit
laisse à l'enseignant le choix de proposer ou non cet usage. Il n'impose pas
que les élèves disposent d'un ordinateur à la maison. Le porteur demande
personnellement une rédaction manuscrite pour les devoirs, en raison des
inégalités d'équipement de ses élèves ; ce retour d'usage ne restreint pas
les autres enseignants au même fonctionnement. Le travail papier puis la
saisie en classe restent possibles selon F07.4.

- **F06-AC26 — Devoirs papier sans ordinateur personnel :** étant donné
  un enseignant choisissant de faire rédiger les devoirs sur papier, lorsque
  l'élève revient en classe, alors il peut saisir puis soumettre son texte
  depuis un poste partagé sans qu'une connexion à domicile ait été requise.

**Décision confirmée — plages horaires d'accès facultatives :** l'enseignant
peut configurer des jours et heures autorisés récurrents au niveau de la
classe, communs à ses projets. Aucune restriction horaire n'est active par
défaut. Il n'y a pas de calendrier par partie, chapitre ou élève.
La restriction porte sur l'accès au contenu de travail, y compris la lecture
et l'écriture, pas uniquement sur le bouton d'édition.

L'attribution reste nécessaire et subsiste hors plage ; une nouvelle plage
ne réattribue rien. Il n'y a pas de nouvel état d'ouverture du projet.
L'enseignant conserve son accès ; cette restriction de l'espace de travail
ne vise pas la lecture plaisir des versions terminées selon F12. Le mode
personnel n'est pas concerné ; les mêmes règles s'appliquent aux récits de
classe classiques et à choix.

Un horaire régit le moment d'accès, pas le lieu : une fermeture à 16 h 30
s'applique aussi à un élève encore présent à l'école. Elle ne promet pas
un accès « école seulement ». Les informations d'accès de classe se
remettent par l'affiche et les étiquettes décidées le 6 octobre 2026, plus
bas ; leur transmission aux familles
est autorisée au choix de l'enseignant selon les règles de connexion ci-dessous.
La présentation du calendrier est décidée le 7 octobre 2026, plus bas ; les
exceptions ponctuelles restent à préciser. Aucune détection du domicile ou du réseau scolaire n'est décidée.

**Décision confirmée — enregistrer à la fin de la plage :** à l'échéance,
l'application enregistre le texte en cours, puis ferme l'accès au travail
jusqu'à la prochaine plage autorisée. La sauvegarde finale reste acceptée
même si elle arrive après l'heure de fermeture. Il n'y a pas de demande de
prolongation ni de mécanisme spécifique destiné à prouver à quelle seconde
chaque caractère a été saisi. L'objectif est de terminer simplement la séance.
Les permissions de l'élève et les protections contre les conflits de F08
restent applicables à cet enregistrement.

Un échec de sauvegarde ne doit pas être présenté comme un enregistrement
réussi ni faire disparaître la saisie. La récupération réutilise les exigences
de F08, sans circuit particulier pour les horaires. L'avertissement avant
fermeture reste une recommandation de présentation ; son délai exact n'est
pas un arbitrage bloquant du parcours.

**Critères d'acceptation :**

- **F06-AC27 — Restriction facultative et commune :** étant donné une classe
  sans horaires configurés, lorsque l'élève s'identifie, alors l'heure ne
  bloque pas ses chapitres attribués. Si l'enseignant active une plage
  du lundi au vendredi de 8 h à 17 h, un accès au contenu de travail à 18 h
  est refusé dans tous les projets de cette classe, sans retirer les attributions.
- **F06-AC28 — Reprise sans réattribution :** étant donné Alice attribuée
  à « La lisière » et un accès fermé par l'horaire, lorsqu'elle revient dans
  une plage autorisée, alors elle retrouve ce chapitre avec les mêmes
  droits sans nouvelle attribution ni ouverture manuelle du projet.
- **F06-AC29 — Dernière saisie enregistrée :** étant donné une scène encore
  ouverte avec une dernière phrase non enregistrée, un service disponible
  et aucun conflit, lorsque la plage se termine, alors cette phrase est
  enregistrée même si la sauvegarde aboutit juste après l'échéance, puis
  l'accès au travail est fermé. Le texte est retrouvé à la reprise.
- **F06-AC30 — Incident sans fausse confirmation :** étant donné une coupure
  pendant la sauvegarde finale, lorsque l'enregistrement échoue, alors
  l'application signale le problème sans annoncer « enregistré » et sans
  effacer la saisie par une fermeture ou un rechargement imposé. La suite
  est en [F08.1](#f081--écritures-concurrentes) : la page réessaie tant
  qu'elle reste ouverte.
- **F06-AC31 — Périmètre des horaires :** étant donné une classe hors plage,
  lorsque l'enseignant ouvre son projet, alors il conserve son accès. La
  lecture d'une version terminée déjà partagée suit F12, indépendamment
  de ces horaires de travail.

La vérification avant la séance fait partie du suivi continu en F06.5,
plutôt que d'une page limitée au premier démarrage. Depuis le 4 octobre
2026, l'état des accès n'est pas rappelé dans le projet : les horaires se
règlent et se consultent dans la classe.

**Décision confirmée — ouvrir la classe sur un nouveau poste :**
l'enseignant dispose d'informations de connexion propres à chaque classe,
indépendantes de son compte adulte : identifiant et mot de passe de classe,
gérés depuis Mes classes. Les entrées enseignant et élève sont distinctes ;
le parcours élève passe par la classe puis l’identification individuelle.
Ces informations de classe permettent d'ouvrir le choix
des profils sur les postes et peuvent être transmises aux familles lorsque
l'enseignant choisit cet usage. « Changer d'élève » conserve l'accès de classe,
comme déjà décidé ; une action distincte « Quitter la classe » ferme cet accès
sur le poste. La durée des accès est décidée le 8 octobre 2026, plus bas ;
les éventuels raccourcis par lien ou QR restent à concevoir et ne sont pas
nécessaires pour valider ce parcours.

- **F06-AC43 — Connexion élève en deux étapes :** étant donné un nouveau
  poste, lorsque les informations de connexion de la classe sont acceptées
  dans l'entrée élève, alors le choix des profils de cette classe s'affiche.
  L'identification par le code personnel est ensuite nécessaire pour accéder
  au travail de l'élève ; les identifiants de classe ne donnent aucun accès
  enseignant et ne remplacent pas les attributions ni les horaires.
- **F06-AC44 — Quitter la classe sur ce poste :** étant donné une classe
  ouverte sur un poste, lorsque l'utilisateur choisit « Quitter la classe »,
  alors ni l'accès individuel ni l'accès de classe ne restent ouverts sur
  ce poste. Une nouvelle connexion de classe est nécessaire, tandis que
  « Changer d'élève » conserve l'accès de classe selon les règles précédentes.

**Décisions confirmées le 6 octobre 2026 — informations de la classe et
supports imprimés :**

- **Proposées, consultables, remplaçables.** À la création d'une classe,
  l'application propose son identifiant et son mot de passe. L'enseignant
  les relit à tout moment depuis la classe et peut les remplacer, comme les
  codes personnels. L'identifiant se remplace en renommant la classe
  (décidé le 9 octobre 2026) : une case propose l'identifiant qui va avec
  le nouveau nom (« cm2 »), suivi d'un mot simple s'il est déjà pris, ce
  que l'application dit une fois le nom enregistré. Elle est cochée
  d'office, à la demande du porteur ; la recommandation était de la laisser
  décochée. Le mot de passe et les codes ne changent pas ; l'affiche et
  les étiquettes qui portent l'identifiant sont à réimprimer ; les postes
  où la classe est déjà ouverte le restent, puisque le mot de passe est le
  même. Tant que l'identifiant convient au nom, rien n'est proposé.
  Alternatives écartées : un identifiant et un mot de
  passe écrits librement (mot de passe trop simple, identifiant déjà
  pris) ; un mot de passe montré une seule fois, plus sûr, mais à ressaisir
  sur tous les postes à chaque oubli. Le stockage qui permet cette
  consultation suit la règle des codes, arbitrée le 8 octobre 2026
  ([architecture](architecture.md#protection-des-accès-de-classe-et-des-codes-élèves)).
- **Affiche de la classe.** Une feuille imprimable donne l'adresse de
  l'entrée des élèves, l'identifiant et le mot de passe de la classe, à
  afficher près des ordinateurs.
- **Étiquettes des élèves.** Le support individuel de la décision
  ci-dessus est une étiquette à découper, plusieurs par feuille : le prénom
  et le code. Une option y ajoute les informations de la classe, pour un
  élève qui travaille à la maison. L'enseignant imprime toute la classe,
  ou la seule étiquette d'un élève, par exemple après un code oublié.

- **F06-AC67 — Informations relues :** étant donné une classe créée en
  septembre, lorsque l'enseignant ouvre cette classe en janvier, alors il
  relit son identifiant et son mot de passe et peut imprimer l'affiche.
- **F06-AC68 — Mot de passe remplacé :** étant donné le mot de passe de la
  classe remplacé par l'enseignant, lorsqu'un poste où la classe n'était pas
  ouverte utilise l'ancien, alors l'accès est refusé ; le nouveau l'ouvre,
  et les codes des élèves n'ont pas changé.
- **F06-AC69 — Code oublié :** étant donné Bilal qui a oublié son code,
  lorsque l'enseignant ouvre la classe, alors il lit le code de Bilal, peut
  le remplacer et imprime la seule étiquette de Bilal ; les étiquettes des
  autres élèves ne sont pas réimprimées.
- **F06-AC70 — Étiquette pour la maison :** étant donné l'option « avec les
  informations de la classe », lorsque l'enseignant imprime les étiquettes,
  alors chacune porte aussi l'adresse, l'identifiant et le mot de passe de
  la classe ; sans l'option, elle ne porte que le prénom et le code.

**Décisions confirmées le 7 octobre 2026**, d'abord proposées par la
maquette :

- **Codes et mot de passe masqués à l'ouverture.** L'écran de l'enseignant
  est souvent projeté : la classe s'ouvre sans montrer ni les codes ni le
  mot de passe. « Afficher les codes » les montre tous ; ouvrir la fiche
  d'un élève ne montre que le sien.
- **Forme des horaires.** Des jours cochés et une plage d'heures, commune à
  ces jours ; « Ajouter d'autres horaires » pour un jour qui diffère, par
  exemple le mercredi matin. Cela tranche la présentation du calendrier
  laissée ouverte plus haut ; l'heure de référence est décidée le 8 octobre
  2026, plus bas ; les exceptions ponctuelles restent à préciser.
- **Un zéro sans barre pour l'élève.** Les chiffres qu'un élève lit ou tape
  — son étiquette, l'affiche de la classe, la saisie de son code —
  s'écrivent avec un zéro simple : le zéro barré de la police de l'outil
  peut se lire autrement en CM1. Décision de présentation, consignée dans
  le [design](design.md#mes-classes-et-nouveau-projet-6-octobre-2026).

- **F06-AC71 — Codes masqués :** étant donné une classe de 25 élèves,
  lorsque l'enseignant l'ouvre, alors aucun code ni le mot de passe de la
  classe ne se lit ; lorsqu'il ouvre la fiche de Bilal, alors seul le code
  de Bilal s'affiche ; « Afficher les codes » les montre tous.
- **F06-AC72 — Deux plages :** étant donné des horaires réglés sur lundi,
  mardi, jeudi et vendredi de 8 h 30 à 16 h 30, lorsque l'enseignant ajoute
  d'autres horaires pour le mercredi de 8 h 30 à 11 h 30, alors un élève
  accède à son travail le mercredi à 10 h et non à 14 h.

**Décisions confirmées le 8 octobre 2026**, à l'issue de l'entretien sur le
[plan de réalisation](plan.md), pour ce qui restait à régler avant de
construire les accès :

- **Codes faux.** Après cinq codes faux de suite pour un même élève, ce
  profil attend deux minutes ; les autres profils ne sont pas touchés, et
  l'attente ne s'allonge pas d'une fois sur l'autre. Pour l'entrée de la
  classe, dix essais faux depuis un poste y imposent cinq minutes d'attente.
  Alternative écartée : aucun blocage, un code à quatre chiffres se trouvant
  alors en essayant. Phrase proposée pour l'élève : « Trop d'essais. Attends
  deux minutes, ou demande à Mme Laurent. »
- **Durée de l'accès de classe.** La classe reste ouverte sur un poste
  jusqu'à « Quitter la classe », et se ferme d'elle-même pendant la nuit :
  dans une salle partagée, la classe suivante ne trouve pas la liste des
  élèves. Identifiant et mot de passe se retapent donc à chaque séance, d'où
  l'affiche près des ordinateurs. Alternative écartée : une classe ouverte
  trente jours.
- **Durée de l'accès de l'élève.** Après deux heures sans activité, le texte
  en cours est enregistré, l'accès individuel se termine et le poste revient
  au choix des profils. Trente minutes, d'abord recommandées, sont écartées
  par le porteur : écrire un texte sur feuille avant de le saisir peut
  prendre du temps.
- **Postes déjà ouverts quand quelque chose change.** Un seul mécanisme,
  celui de la fin d'une plage horaire : le texte en cours est enregistré,
  puis l'accès se ferme. Il s'applique à tous les postes de la classe quand
  son mot de passe est remplacé ou que l'année est terminée, et au poste de
  l'élève quand il est retiré de la classe. Un code personnel remplacé ne
  coupe pas la séance en cours de l'élève ; le nouveau code vaut à sa
  prochaine identification.
- **Heure de référence.** Les horaires se lisent à l'heure de Paris, heure
  d'été et heure d'hiver suivies sans réglage. Le fuseau est tenu par la
  classe sans être affiché.
- **Forme des informations de la classe.** L'identifiant est fait de lettres
  minuscules et de chiffres, sans accent, et il est unique. Il est tiré du
  nom de la classe seul (« cm1cm2 »), décision du porteur du 9 octobre
  2026 : le nom de l'enseignant, qui le suivait depuis le 8 octobre
  (« cm1cm2laurent »), est retiré. Conséquence acceptée : un nom de classe
  courant est vite pris par un autre enseignant ; l'identifiant est alors
  suivi d'un mot simple de la liste des mots de passe (« cm1cm2tigre »), et
  de deux chiffres en dernier recours. Des chiffres collés au nom se
  liraient comme un autre nom de classe (« cm12 ») : ils sont écartés. Une
  classe créée avant garde son identifiant, jusqu'à ce qu'on la renomme en
  le changeant. Le mot de passe
  est fait de deux mots simples et de deux chiffres, tirés d'une liste sans
  accent ni mot qui prête à confusion. À la saisie, les majuscules et les
  espaces en trop sont ignorés. Le code personnel reste à quatre chiffres ;
  il se remplace par un code proposé, que l'enseignant peut écrire lui-même.

- **F06-AC73 — Cinq codes faux :** étant donné Bilal qui tape cinq codes
  faux de suite, lorsqu'il essaie un sixième code, même le bon, alors il est
  refusé pendant deux minutes ; sur le poste voisin, Alice entre avec son
  code sans attendre ; deux minutes plus tard, le bon code de Bilal est
  accepté.
- **F06-AC74 — Entrée de la classe :** étant donné dix essais faux de
  l'identifiant ou du mot de passe depuis un poste, lorsqu'un onzième essai
  y est fait, alors il est refusé pendant cinq minutes ; un autre poste
  ouvre la classe avec les bonnes informations.
- **F06-AC75 — Classe fermée pendant la nuit :** étant donné une classe
  ouverte sur un poste le lundi et que personne n'a quittée, lorsque le
  poste est rallumé le mardi matin, alors l'entrée des élèves redemande
  l'identifiant et le mot de passe de la classe, et la liste des profils ne
  se lit pas.
- **F06-AC76 — Élève parti sans quitter :** étant donné Alice identifiée,
  un texte en cours, lorsque deux heures passent sans activité sur son
  poste, alors son texte est enregistré, son accès individuel se termine et
  le choix des profils s'affiche ; après une heure sans activité, elle
  retrouve sa scène ouverte.
- **F06-AC77 — Mot de passe remplacé, postes ouverts :** étant donné la
  classe ouverte sur dix postes et Alice en train d'écrire, lorsque
  l'enseignant remplace le mot de passe de la classe, alors le texte d'Alice
  est enregistré, puis les dix postes redemandent les informations de la
  classe ; l'ancien mot de passe est refusé.
- **F06-AC78 — Année terminée ou élève retiré :** étant donné Bilal en
  train d'écrire, lorsque l'enseignant le retire de la classe, alors son
  texte est enregistré et son poste revient au choix des profils, où Bilal
  ne figure plus ; lorsque l'enseignant termine l'année, tous les postes de
  la classe se ferment de la même façon.
- **F06-AC79 — Code remplacé pendant la séance :** étant donné Alice en
  train d'écrire, lorsque l'enseignant remplace son code, alors elle
  continue sans interruption ; à sa prochaine identification, seul le
  nouveau code est accepté.
- **F06-AC80 — Heure d'été :** étant donné des horaires de 8 h 30 à
  16 h 30, lorsque l'heure change en mars ou en octobre, alors l'accès
  ouvre et ferme aux mêmes heures affichées à l'horloge de la classe, sans
  réglage de l'enseignant.
- **F06-AC81 — Saisie tolérante :** étant donné l'identifiant
  « cm1cm2 » et le mot de passe « tigre nuage 42 », lorsqu'un élève tape
  « CM1CM2 » et « Tigre  nuage 42 », alors la classe s'ouvre.

**Décisions confirmées le 9 octobre 2026**, pour deux valeurs que les
règles du 8 ne chiffraient pas :

- **Heure de la fermeture nocturne.** La classe ouverte sur un poste se
  ferme à 3 h, heure de Paris.
- **Essais faux depuis une même adresse réseau.** Les dix essais « depuis
  un poste » se comptent par navigateur, et se contournent en effaçant ses
  données. S'y ajoute donc un second compte : cent essais faux en cinq
  minutes depuis une même adresse réseau lui imposent cinq minutes
  d'attente. Une école, dont tous les postes partagent une adresse, n'y
  arrive pas par erreur.

- **F06-AC82 — Fermeture à 3 h :** étant donné une classe ouverte sur un
  poste à 16 h, lorsqu'il est 2 h 59 à Paris, alors le choix des profils
  s'affiche encore ; à 3 h, l'entrée redemande les informations de la
  classe.
- **F06-AC83 — Essais depuis une même adresse :** étant donné cent essais
  faux de l'identifiant ou du mot de passe en cinq minutes depuis une même
  adresse réseau, quel que soit le navigateur, lorsqu'un essai de plus y
  est fait, même juste, alors il est refusé pendant cinq minutes ; depuis
  une autre adresse, la classe s'ouvre.
- **F06-AC84 — Identifiant remplacé avec le nom :** étant donné la classe
  « CM1-CM2 » de Mme Laurent, ouverte sur un poste, lorsque l'enseignante la
  renomme « CM2 » en laissant cochée « Changer aussi l'identifiant », alors
  l'identifiant devient « cm2 », l'ancien est refusé sur un autre
  poste et le nouveau y ouvre la classe avec le même mot de passe et les
  mêmes codes ; le poste déjà ouvert le reste. Si elle décoche la case,
  l'identifiant ne change pas.

**Propositions de la maquette du 6 octobre 2026, sans retour du porteur :**
la classe dit « Pas de limite d'horaire » tant qu'aucun horaire n'est réglé
(« ouvert » reste le mot de l'accès de classe) ; « Terminer l'année » se lit
sur la page de la classe, sous ses fiches, et non dans un menu.

**Présentation proposée après la critique du côté élève (5 octobre 2026),
sans règle nouvelle :** un code refusé se dit en une phrase (« Ce n'est pas
le bon code. Essaie encore, ou demande à Mme Laurent. »), les seuils
d'essais étant décidés le 8 octobre 2026 ; « Quitter la classe » demande une
confirmation, puisqu'il faudra les identifiants de la classe pour revenir ;
hors des horaires, « Mon travail » dit quand le travail rouvre et ne liste
plus les scènes, et le chapitre n'est pas lisible non plus, en application
de la restriction ci-dessus. Voir le
[design](design.md#côté-élève-repris-après-critique-5-octobre-2026).

**Approfondissements différés :** sauvegarde inachevée au changement
d'élève, exceptions ponctuelles aux horaires, raccourcis par lien ou QR ; la
récupération après panne reste à vérifier avant réalisation selon F08. Le
format des informations de classe, les postes déjà ouverts, l'élève qui
oublie de quitter son poste et l'heure de référence sont décidés le
8 octobre 2026, plus haut.

### F06.5 — Suivi du travail et accès aux scènes

**Besoin confirmé :** disposer d'une vision générale du travail fait et
restant à faire, ainsi que d'une lecture par élève, pendant toute la vie du
projet. La vérification avant la première séance est un usage de cette vue,
pas sa seule raison d'être. Le porteur décrit une liste de scènes filtrable
utilisée dans la V0 pour retrouver notamment les scènes à valider ; ce retour
d'usage n'impose aucune reprise de code ou d'architecture.

**Référence V0 vérifiée dans les fichiers, sans exécution :** la page de
[tâches enseignant](../../V0/src/features/teacher/components/TeacherStoryTasksPage.client.tsx)
regroupe les scènes d'une histoire avec filtres chapitre, élève et statut.
Le [filtre élève](../../V0/src/app/teacher/stories/[storyId]/tasks/page.tsx)
repose sur les attributions, pas sur l'auteur du texte. Le
[parcours élève](../../V0/src/app/student/stories/[storyId]/tasks/page.tsx)
présente ses scènes accessibles, y compris celles de ses chapitres attribués.
Les attributions directes à la scène présentes en V0 ne sont pas reprises en
V1 ; la frontière reste le chapitre selon F06.1.

**Éléments confirmés :**

- L'enseignant peut retrouver le travail et son avancement globalement et
  par élève, et repérer ce qui reste à préparer avant la mise au travail.
- Le bilan par élève montre ses chapitres attribués et signale l'absence
  de scène modifiable dans ce périmètre. Ce signal ne bloque pas la séance :
  l'élève peut travailler sur papier. Il n'ajoute ni case « prêt » à cocher
  ni commande obligatoire d'ouverture du projet.
- Le suivi de l'élève reste limité aux scènes de ses chapitres attribués.
  Il n'ouvre aucun accès aux scènes d'autres chapitres. Les titres et
  images publics des cartes demeurent distincts du contenu de travail.
- Les états de rédaction et de validation sont ceux de F07. Le travail élève
  validé et la scène prête pour le livre restent distincts selon F11.1.
  L'accès au contenu respecte les horaires de F06.4.

**Critères d'acceptation sur les besoins confirmés :**

- **F06-AC32 — Oubli d'attribution identifiable :** étant donné une classe
  comprenant Alice avec des scènes modifiables et Bilal sans chapitre
  attribué, lorsque l'enseignant consulte le bilan par élève, alors il peut
  distinguer ces deux situations sans devoir ouvrir chaque scène. Ce bilan
  ne crée pas d'attribution et n'empêche pas Bilal de travailler sur papier.
- **F06-AC33 — Suivi sans élargissement des droits :** étant donné Alice
  attribuée uniquement à « La lisière », lorsqu'elle consulte ou filtre son
  travail, alors les résultats ne révèlent aucune scène, consigne ni extrait
  du « Sanctuaire » non attribué. Ouvrir une scène applique les mêmes droits
  que depuis la page des parties et chapitres.
- **F06-AC34 — Deux avancements distincts :** étant donné une scène dont le
  travail élève est validé mais qui reste à préparer pour le livre, lorsque
  l'enseignant consulte le suivi, alors ces deux situations sont distinguées
  sans présenter le livre comme terminé du seul fait de la validation élève.

**Décision confirmée, révisée le 4 octobre 2026 — un suivi par projet :** le
suivi est celui d'un projet et s'ouvre depuis son onglet. Le suivi
transversal, d'abord confirmé pour retrouver les scènes de plusieurs projets,
est retiré : le porteur travaille sur un projet à la fois, rarement deux, et
ne veut pas les mélanger. Ce qui attend l'enseignant dans un autre projet se
lit sur sa carte, dans « Mes projets ». Les scènes à valider ou à reprendre
restent des sélections filtrées des scènes existantes, sans tâches
indépendantes à clôturer en plus du changement d'état de la scène. Rétablir
un suivi de plusieurs projets ne serait pas coûteux : un filtre de plus sur
les mêmes scènes.

**Présentation proposée :** une vue « Scènes » pour agir et une vue « Élèves »
pour repérer la répartition et les accès. Les filtres envisagés étaient
projet, classe, partie, chapitre, état et élève, avec des raccourcis courants
tels que « À valider ». La maquette du 4 octobre 2026 n'en garde que trois :
le chapitre, l'élève et l'état ; les nombres des états suivent le chapitre et
l'élève choisis.

**Deuxième critique d'ergonomie, le 4 octobre 2026, après la reprise :**
28/40 pour la lecture informée et 25/40 pour une lecture indépendante des
captures, contre 22 et 22 ; le détail est dans le
[design](design.md#suivi-repris-après-critique-4-octobre-2026). Le porteur
décide ensuite l'écran d'aide à l'ouverture du Suivi (ci-dessous), la
feuille du seul élève choisi sur la page des fiches
([F07.4](#f074--fiches-de-rédaction-pour-le-travail-sur-papier)) et une
reprise légère de la maquette avant un essai par une personne qui découvre
l'outil.

**Troisième critique d'ergonomie, le 4 octobre 2026, à la demande du
porteur, après ces ajustements :** 29/40 pour la lecture informée et 28/40
pour une lecture indépendante, soit 1 et 3 points de plus ; le détail est
dans le [design](design.md#suivi-repris-après-critique-4-octobre-2026).
Seule l'aide monte dans les deux lectures ; la cohérence ne bouge pas. Le
porteur décide ensuite que « Voir », sur la carte du projet, n'ouvre pas
l'écran d'aide (ci-dessous), et que les scènes sans élève peuvent être
réparties entre les élèves du chapitre à l'impression des fiches
([F07.4](#f074--fiches-de-rédaction-pour-le-travail-sur-papier)). Il demande
trois retouches, listées plus bas parmi les propositions. La suite est un
essai par une personne qui découvre l'outil, sans quatrième critique.

**Décisions confirmées le 4 octobre 2026 — après une critique d'ergonomie du
Suivi** (22/40 pour chacune des deux lectures, contre 29 et 27 pour le Livre) :

- **Retour au Suivi :** une scène ouverte depuis le Suivi propose d'y revenir
  d'un geste, avec les filtres choisis et à l'endroit quitté, comme
  [F11.6](#f116--trois-temps-pour-préparer-le-livre) le prévoit pour les
  scènes à finir.
- **Élèves sans chapitre :** leur nombre est rappelé en tête du Suivi, avec
  un lien « Voir » vers la vue « Élèves » ; rien n'est affiché quand tous
  ont un chapitre, ni dans le Suivi filtré sur les scènes à finir. C'est un
  lien et non un filtre : le porteur a constaté qu'un même élément ne peut
  pas informer et filtrer sans égarer. Le signal de F06-AC32 est conservé.
- **Textes gardés à part :** une seconde ligne de rappel, de la même forme,
  dit les scènes où un texte est gardé à part après un conflit de
  sauvegarde et ouvre la scène ; règle en
  [F08.1](#f081--écritures-concurrentes) (7 octobre 2026).
- **Scènes sans consigne :** elles ne sont plus signalées en tête du Suivi
  et n'y sont pas un filtre. La mention « sans consigne » suit le titre de
  la scène, ce qui garde l'absence identifiable (F07-AC20). Leur décompte,
  d'abord gardé dans « Parties et chapitres », en est retiré le 6 octobre
  2026 : la consigne est facultative, et la même mention y suit la scène
  ([F03.1](#f031--histoire-parties-chapitres-et-scènes)). Les filtres du Suivi
  sont le chapitre, l'élève et l'état, rien d'autre. Ces deux règles
  remplacent le bandeau de séance, l'alerte et la colonne « Consigne » ;
  une ligne « avant la séance », décidée le matin avec l'état des accès, les
  fiches et un décompte cliquable des scènes sans consigne, est écartée le
  même jour.
- **État des accès :** il n'est pas rappelé dans le projet. Les horaires
  sont un réglage de la classe ([F06.4](#f064--classe-de-référence-et-postes-partagés)),
  que l'enseignant et ses élèves connaissent.
- **Fiches de rédaction depuis le Suivi :** un bouton « Imprimer les fiches
  de rédaction », avec une icône d'information qui dit ce qu'elles sont. Il
  ouvre les fiches sur les scènes listées à ce moment-là qui restent à
  écrire ou à reprendre et qui ont une consigne ; ce choix se corrige avant
  d'imprimer. Si un élève est choisi dans le Suivi, on arrive sur sa feuille
  avec « Dont Alice s'occupe », et sur la feuille du chapitre avec « Tout
  son chapitre », dont la liste montre aussi les scènes des camarades :
  précision confirmée le 4 octobre 2026, ce qui est listé est ce qui
  s'imprime. La forme de
  la fiche est en [F07.4](#f074--fiches-de-rédaction-pour-le-travail-sur-papier).
- **Scène sans texte :** une scène « En cours » dont le texte est vide est
  affichée « Texte vide », d'un tampon neutre. D'abord propre au Suivi, cet
  affichage vaut depuis le 4 octobre 2026 partout où l'état de la scène se
  lit : sa page, le chapitre, le graphe, la scène à côté de l'aperçu, pour
  l'adulte comme pour l'élève. C'est une règle d'affichage : les états et
  les transitions de F07.1 ne changent pas, la liste des états à choisir ne
  compte pas « Texte vide », et une scène vide peut avoir été travaillée sur
  papier.
- **Scène suivante à valider (4 octobre 2026) :** juste après avoir validé
  une scène « À valider », ou y avoir demandé une reprise, l'enseignant se
  voit proposer la scène « À valider » suivante, sans repasser par la
  liste : celle du Suivi quand il en vient, avec ses filtres de chapitre et
  d'élève, sinon dans l'ordre du projet. Le retour au Suivi reste proposé ;
  quand il n'en reste plus, la page le dit.
- **Aide à l'ouverture du Suivi (après la deuxième critique) :** à
  l'ouverture de l'onglet, un écran d'aide occupe la page, comme à
  l'ouverture d'une étape du Livre
  ([F11.6](#f116--trois-temps-pour-préparer-le-livre)) : ce qu'on fait ici,
  puis quelques questions repliées — le sens des états, qui s'occupe d'une
  scène, ce que sont les fiches de rédaction —, « Commencer » et la case
  « Ne plus afficher ». Peu de questions, pour ne pas perdre le lecteur. Un
  bouton « Aide », discret, rouvre cet écran ; la légende des états reste
  aussi derrière son icône, à côté des tampons. Sans cette aide, les deux
  lectures confondaient « Validé » et « Prête ». L'écran n'est pas affiché
  quand on vient du Livre finir des scènes, ni quand on arrive par « Voir »,
  sur la carte du projet, pour relire les scènes à valider : décision du
  4 octobre 2026, après la troisième critique, l'aide s'interposant au
  moment le plus fréquent. Ouvert ensuite par son onglet, le Suivi montre
  son aide comme avant. Cette règle remplace, le même
  jour, la légende ouverte une fois en bulle à la première visite, d'abord
  retenue : le porteur préfère une seule façon d'être aidé, celle du Livre.
  Deux alternatives restent écartées : la légende derrière sa seule icône,
  et la légende affichée en permanence sous les tampons. Le moment où
  l'aide revient suit la règle du Livre et sa question ouverte.

**Décisions confirmées le 4 octobre 2026 — navigation de l'adulte :**

- **Barre du haut globale :** elle porte le nom du dernier projet ouvert,
  « Mes projets » et « Mes classes ». Les onglets (Préparation, Parties et
  chapitres, Suivi, Livre) sont ceux de l'histoire. Aucune entrée de la barre
  ne mène à un suivi.
- **Reprendre sans choisir :** connecté, l'adulte arrive dans le dernier
  projet ouvert, à son dernier onglet utilisé, sans aller jusqu'à une
  scène ; le nom du projet dans la barre y ramène de partout. Cette mémoire
  tient au compte, non au navigateur. Sans projet, ou si ce projet n'existe
  plus, il arrive sur « Mes projets ». L'alternative d'un « projet actuel »
  à choisir est écartée : un réglage à entretenir, faux dès la rentrée
  suivante.
- **Mes projets :** peu de projets, donc de grandes cartes. Chacune montre
  l'image, le titre, la classe et le type de récit, le nombre de scènes à
  valider et le pourcentage des scènes prêtes pour le livre ; le dernier
  projet ouvert porte « Continuer ». Ce bouton s'appelait d'abord
  « Reprendre » ; le porteur le change le 4 octobre 2026, après la deuxième
  critique : le mot voisinait avec l'état « À reprendre », qui désigne le
  travail rendu à l'élève.

- **F06-AC53 — Reprendre sans choisir (révisé le 4 octobre 2026) :** étant
  donné Mme Laurent qui a quitté « Les passeurs de brume » sur son onglet
  Suivi, lorsqu'elle se connecte le lendemain depuis un autre ordinateur,
  alors elle arrive sur le Suivi de ce projet, sans passer par « Mes
  projets » ; le nom du projet, dans la barre du haut, l'y ramène depuis
  « Mes projets ».
- **F06-AC54 — Retour au Suivi :** étant donné le Suivi filtré sur « En
  cours » et défilé jusqu'à S034, lorsque l'enseignant ouvre S034 puis choisit
  « Retour au Suivi », alors il retrouve ce filtre et l'endroit de la liste
  qu'il avait quitté.
- **F06-AC55 — Scène sans texte :** étant donné S006 en cours d'écriture et
  sans texte, lorsque l'enseignant consulte le Suivi, alors elle porte
  « Texte vide » et non « En cours » ; dès qu'un texte y est enregistré, elle
  porte « En cours ». Elle porte le même tampon dans sa page, dans le
  chapitre et dans le graphe.
- **F06-AC63 — Scène suivante à valider :** étant donné le Suivi filtré sur
  « À valider », qui liste S003, S016 et S021, lorsque l'enseignant ouvre
  S003 et la valide, alors « Suivante à valider : S016 » lui est proposé et
  l'y mène, « Retour au Suivi » restant offert ; lorsqu'il a validé la
  dernière, alors il lit qu'il n'en reste plus dans cette liste.
- **F06-AC56 — Élèves sans chapitre (révisé le 4 octobre 2026) :** étant
  donné Adam et Maëlys sans chapitre et six scènes sans consigne, lorsque
  l'enseignant ouvre le Suivi, alors il lit « 2 élèves sans chapitre » et
  « Voir », qui ouvre la vue « Élèves » sans rien filtrer ; les six scènes
  portent « sans consigne » après leur titre, et aucun décompte ni filtre
  ne les isole. L'état des accès n'y figure pas.
- **F06-AC57 — Fiches des scènes listées (corrigé le 4 octobre 2026) :**
  étant donné le Suivi filtré sur « La lisière » et « Texte vide », qui
  liste S018 et S019, celle-ci sans consigne, lorsque l'enseignant choisit
  « Imprimer les fiches de rédaction », alors les fiches s'ouvrent avec S018
  choisie, S019 ne pouvant pas l'être (F07-AC54), et il peut modifier ce
  choix avant d'imprimer. La première rédaction faisait cocher S019, ce que
  F07-AC54 exclut.
- **F06-AC58 — Carte d'un projet :** étant donné un projet de quarante
  scènes dont cinq à valider et une prête pour le livre, lorsque l'enseignant
  ouvre « Mes projets », alors la carte indique « 5 scènes à valider » et
  « 3 % des scènes prêtes pour le livre ».
- **F06-AC59 — Aide à l'ouverture du Suivi (révisé le 4 octobre 2026) :**
  étant donné Mme Laurent qui ouvre l'onglet Suivi, lorsque la page
  s'affiche, alors elle voit « Que fait-on ici ? », trois questions
  repliées, la case « Ne plus afficher » et « Commencer » ; lorsqu'elle
  choisit « Commencer », alors la liste des scènes s'affiche ; lorsqu'elle
  a coché la case, alors le Suivi s'ouvre ensuite directement et le bouton
  « Aide » rouvre cet écran.
- **F06-AC60 — « Voir » sans écran d'aide :** étant donné Mme Laurent, qui
  n'a pas coché « Ne plus afficher », et cinq scènes à valider, lorsqu'elle
  choisit « Voir » sur la carte du projet, alors elle arrive sur ces cinq
  scènes, sans écran d'aide ; lorsqu'elle rouvre plus tard le Suivi par son
  onglet, alors l'écran d'aide s'affiche.

**Propositions de la maquette du 4 octobre 2026, sans retour du porteur :**

- Filtres d'état sous la forme des tampons du tableau, idée du porteur, à
  l'essai : le tampon choisi est plein, celui qui ne compte aucune scène est
  éteint et reste à sa place. La deuxième critique recommande de les garder :
  les deux lectures trouvent le chemin « À valider » sans aide. Elle relève
  que le tampon d'une ligne a le même dessin, en plus petit, sans se
  cliquer : à observer à l'essai. Un tampon informe (son nombre) et filtre à
  la fois, ce que le porteur a écarté pour les scènes sans consigne ; ici la
  rangée commence par « Toutes » et se lit comme une rangée de filtres.
- Libellés à l'écran des deux sélections par élève : « Dont Alice s'occupe »
  pour les prises en charge, « Tout son chapitre » pour les scènes
  accessibles (« Tous ses chapitres » s'il en a plusieurs), chacune avec son
  nombre, la première présélectionnée. « De son chapitre », d'abord proposé,
  n'était compris qu'avec la bulle. La vue « Élèves » reprend les mêmes
  mots. Les deux sélections confirmées et F06-AC36 ne changent pas.
- Phrases de la légende, qui disent à qui est le tour : à l'enseignant pour
  « À valider » et « Validé », à l'élève pour « À reprendre ».
- Filtres gardés pendant la visite, aller-retour vers une scène ou vers les
  fiches compris, et remis à zéro à chaque nouvelle entrée dans le Suivi.
  Après une validation faite dans la scène, « Retour au Suivi » rend le même
  filtre, la scène validée en moins.
- Dans la vue « Élèves », un élève sans chapitre porte un lien vers
  l'attribution, qui se fait dans « Parties et chapitres ».
- Élèves du chapitre rappelés dans l'en-tête de chaque groupe de scènes.
- Reprise légère après la deuxième critique : le titre d'une scène l'ouvre,
  comme le bouton de sa ligne ; « 5 scènes à valider », sur la carte du
  projet, est suivi d'un lien « Voir » qui ouvre le Suivi sur ces scènes, le
  reste de la carte reprenant le projet à son dernier onglet ; un élève sans
  chapitre est dit tel dans les deux sélections ; la rangée des états et le
  bouton des fiches restent en place quand la liste est vide ; une icône
  d'information dit ce qu'est « Qui s'en occupe » et que les élèves d'un
  chapitre se répartissent ses scènes ; l'échec de chargement n'affiche plus
  le rappel des élèves sans chapitre.
- Retouches après la troisième critique, demandées par le porteur d'après
  ses recommandations, leur forme restant à confirmer : une scène sans élève
  porte « Pas encore prise » dans un chapitre attribué, pour dire que les
  élèves prennent les scènes, et « Aucun élève » dans un chapitre qui n'en a
  pas ; le bouton « Aide » porte un point d'interrogation, au Suivi comme au
  Livre, le « i » restant le signe des bulles d'information ; la colonne
  « À noter » de la vue « Élèves », lue « mettre une note », devient
  « Signalement », puis « À régler » le 6 octobre 2026 ; en 390 px, la rangée des tampons prend toute la largeur
  sous un libellé « État » qui porte l'icône de la légende, le quatrième
  tampon dépasse, et le bord ne s'estompe que du côté où il en reste. Le
  porteur confirme le même jour le signe du bouton « Aide », au Livre
  compris ; les autres formes restent proposées.

**Décision confirmée — deux sélections par élève :** « Accessibles à Alice »
retrouve les scènes de ses chapitres attribués ; « Prises en charge par
Alice » retrouve celles dont elle assure la préparation ou le suivi selon
F06.3/F07.1, y compris celles dont le travail élève est validé et dont elle
reste l'élève de référence. L'état distingue le travail terminé du travail
restant à effectuer. Ce ne sont pas deux noms pour la même sélection. La
prise en charge ne prouve pas qu'Alice a écrit seule tout le texte.
Les textes remis par Alice constituent une troisième
information, conservée selon F07.1, qui subsiste même si une prise en charge
change. Un compteur d'accès ou de prises en charge ne mesure donc pas sa
contribution personnelle.

**Clarification — usage avant la séance :** l'enseignant consulte le suivi
pour connaître les scènes prévues ou prises en charge, le travail encore à
rédiger, à reprendre ou à valider, et les accès manquants. Cela ne crée ni
fiche de préparation pédagogique de séance, ni planning de rotation des postes,
ni liste de tâches indépendante. Le suivi repose sur les informations
consignées : une scène encore vide peut déjà avoir été travaillée sur papier.
Il ne mesure pas automatiquement cet avancement hors de l'application.

**Critères d'acceptation :**

- **F06-AC35 — Suivi d'un projet (révisé le 4 octobre 2026) :** étant donné
  deux projets contenant chacun une scène à valider, lorsque l'enseignant
  ouvre le Suivi de l'un d'eux avec ce filtre, alors il n'y voit que la scène
  de ce projet ; la carte de l'autre, dans « Mes projets », indique qu'une
  scène y est à valider.
- **F06-AC36 — Accès distinct de la responsabilité :** étant donné un
  chapitre de dix scènes attribué à Alice et Bilal, dont une seule
  scène prise en charge par Alice, lorsque l'enseignant sélectionne
  « Accessibles à Alice », alors les dix scènes sont retrouvées ; avec
  « Prises en charge par Alice », seule cette scène est retrouvée.
  Changer de filtre ne modifie ni attribution ni prise en charge.
- **F06-AC37 — Filtre sans tâche à clôturer en double :** étant donné une
  scène dans la sélection « À valider », lorsque l'enseignant valide le
  travail élève selon F07, alors elle ne satisfait plus ce filtre, sans
  action supplémentaire pour clôturer une tâche de suivi.

**Recommandation côté élève :** une entrée « Mon travail » qui met en avant
ses reprises et prises en charge, tout en permettant de retrouver toutes
les scènes de ses chapitres autorisés et de choisir un passage disponible.
Une liste de prises en charge vide ne doit pas faire croire qu'il n'a aucun
accès. Les sélections exactes et leur présentation restent à arbitrer.

**Variantes :** les récits classiques et à choix utilisent les mêmes états
de travail. En mode personnel, le suivi de l'auteur porte sur ses scènes et
la préparation du livre selon F11.1 ; il ne crée pas de remise d'élève à
valider. Les filtres de classe et d'élève y sont sans objet. La maquette ne
montre pas de suivi en mode personnel : l'onglet n'y figure pas et le Livre
y renvoie au plan. Cet écart avec la phrase précédente reste à trancher.

**Erreurs et approfondissements différés :** distinguer aucun résultat pour
les filtres choisis, aucun travail attribué, fermeture horaire et échec de
chargement ; la maquette du 4 octobre 2026 en propose trois écrans,
l'aucun-résultat nommant les filtres en cause. La fermeture horaire n'y est
pas montrée : l'état des accès n'est plus rappelé dans le projet. La présentation des
comptes et le calcul d'éventuels indicateurs restent à concevoir. La deuxième critique relevait
l'absence de toute date dans le Suivi : montrer l'ancienneté d'une remise,
ou trier les scènes « À valider » par la plus ancienne, est écarté par le
porteur le 4 octobre 2026, comme une complexité sans grand gain. Aucun classement des élèves ni autre indicateur que le pourcentage des scènes prêtes, sur la carte du projet,
n'est décidé. Les règles existantes de correction et de validation restent
en F07/F11 ; cette liste n'introduit pas une validation automatique ou en lot.

## F07 — Révision et validation

**Acquis du brief :** l'enseignant accompagne et valide ; texte source et texte
final doivent être distingués. Les propositions narratives des élèves s'inscrivent
dans ce cadre, sans validation automatique.

### F07.1 — Du travail préparatoire au travail élève validé

**Décision confirmée — consigne numérique facultative :** l'absence de
consigne saisie dans l'application n'empêche pas un élève autorisé de commencer
à écrire dans une scène modifiable. La consigne peut avoir été donnée oralement
ou sur papier. L'application signale son absence à l'enseignant sans imposer
de ressaisie ni d'étape de validation supplémentaire. Les droits de F06 et les
restrictions de modification restent applicables. Cette règle concerne les
récits classiques comme les récits à choix ; l'auteur personnel n'est pas
tenu de renseigner une consigne pour écrire.

**Critères d'acceptation :**

- **F07-AC19 — Recopier sans consigne numérique :** étant donné un élève
  autorisé dans un chapitre, une scène modifiable sans consigne numérique
  et une fiche papier déjà remise, lorsqu'il ouvre la scène, alors il peut
  saisir son texte sans que l'enseignant doive recopier la consigne.
- **F07-AC20 — Absence visible sans blocage :** étant donné une scène sans
  consigne numérique, lorsque l'enseignant consulte sa préparation, alors
  cette absence est identifiable et ne bloque pas l'écriture autorisée.

Côté élève, l'absence de consigne se dit en une phrase, à la place de la
consigne : « Pas de consigne écrite. Suis celle que Mme Laurent t'a
donnée. » (proposé le 5 octobre 2026, dans la maquette).
La forme du signalement à l'enseignant et le traitement d'une fiche
imprimable sans consigne restent à préciser ; aucune consigne n'est inventée
ou reprise automatiquement d'un autre support par cet accord.

**Usage de référence confirmé :** la correction se fait normalement d'abord
sur feuille, mais des corrections restent nécessaires après la saisie. Une
fois le travail élève validé, l'enseignant peut encore avoir des finitions à
effectuer avant que la scène entière soit prête pour le livre.

**Décisions confirmées :**

- L'application accepte un texte préparé et corrigé sur papier comme un texte
  encore à réviser. Le parcours sur papier n'est pas obligatoire.
- Si la recopie convient, l'enseignant peut la vérifier puis la valider sans
  imposer un cycle supplémentaire de commentaires et de révision.
- Si une correction est nécessaire, il peut demander une révision avant de
  valider, ou corriger directement lui-même. Le texte remis par l'élève est
  conservé au moment de la soumission explicite de la scène.
- L'enseignant peut corriger le texte courant à tout moment, y compris avant
  la première soumission. Cette correction seule ne crée ni remise ni
  validation du travail élève. Le contrôle des sauvegardes concurrentes de
  F08.1 s'applique aussi à cette intervention sur un brouillon.
- Une action « Soumettre à l'enseignant » indique que la scène est prête à
  être relue. Elle conserve le texte de cette remise comme texte source,
  avant les corrections éditoriales manuelles ou assistées par l'IA.
- L'application termine l'enregistrement de la saisie à remettre avant de
  confirmer la soumission. La remise comprend les dernières modifications,
  sans remplacement silencieux par une version antérieure. Si cet
  enregistrement échoue ou rencontre un conflit, la soumission n'aboutit
  pas et la scène ne passe pas « À valider » du fait de cette tentative.
  La saisie reste préservée et l'incident est signalé selon F08 ; une copie
  de récupération n'est pas présentée comme une remise réussie.
- Après une demande de révision, une nouvelle soumission conserve une nouvelle
  référence sans remplacer la remise précédente. Les corrections ultérieures
  ne modifient pas rétroactivement les textes remis.
- Une scène possède un seul texte courant. Les corrections éditoriales portent
  sur ce texte ; les remises conservées restent des références distinctes en
  consultation. La validation du travail élève clôt sa tâche de rédaction,
  mais ne signifie pas que la scène est prête à imprimer : les finitions
  éditoriales et la préparation pour le livre relèvent de F11.1.
- Tant que la scène n'est pas validée, tout élève autorisé à écrire dans le
  chapitre peut retirer la soumission pour reprendre l'écriture sans attendre
  l'enseignant. Le passage est « À valider » → « En cours d'écriture ».
  Cela n'est pas réservé au dernier soumetteur.
- Dans l'état « À valider », l'éditeur est en lecture seule pour les élèves,
  quel que soit leur profil de participation. Pour reprendre l'écriture de
  leur initiative, ils doivent d'abord retirer explicitement la soumission.
  La consultation autorisée et la correction par l'enseignant restent possibles.
- Lorsque l'enseignant demande une révision, la scène passe « À reprendre ».
  Cet état et « En cours d'écriture » donnent les mêmes droits d'écriture aux
  élèves autorisés dans le chapitre. « À reprendre » signale spécifiquement
  un retour de l'enseignant à traiter ; le retrait volontaire de soumission
  mène à « En cours d'écriture ».
- Après cette demande de révision, l'élève reprend le texte courant, avec
  les corrections déjà enregistrées par l'enseignant. La dernière remise
  concernée reste consultable séparément ; elle ne remplace pas le texte
  courant. Cette règle est également confirmée pour ce retour demandé,
  indépendamment du retrait volontaire de soumission.
- Le retrait seul ne transfère pas la prise en charge. L'élève peut ensuite
  la reprendre explicitement selon F06.3 ; une nouvelle soumission conserve
  son effet de transfert au soumetteur. La reprise reste possible lorsque
  l'élève responsable est absent.
- Le parcours élève ne propose pas de restaurer une ancienne version du texte.
  Après retrait de la soumission, l'élève reprend le texte courant, y compris
  les corrections déjà enregistrées par l'enseignant. La remise antérieure
  reste conservée comme référence et n'est pas remise à la place de ce texte.
- L'absence de correction simultanée par l'enseignant n'est pas un préalable
  au retrait. Le début d'une correction par l'enseignant ne crée pas de statut
  bloquant et n'oblige pas l'élève à attendre un retour pour révision. Le
  contrôle des sauvegardes concurrentes de F08.1 reste applicable.
- La soumission transfère automatiquement la prise en charge au soumetteur.
  Les corrections demandées s'adressent à cet élève tant qu'il conserve
  cette prise en charge ; une reprise explicite ou une réattribution change
  le responsable du suivi. L'élève auparavant signalé n'est plus le
  destinataire de référence des nouvelles demandes.
  Cette responsabilité ne désigne pas à elle seule l'auteur du texte et ne
  modifie pas les attributions de chapitre ni les remises déjà conservées.
- La validation du travail élève est effectuée par l'enseignant à l'échelle
  de la scène. Elle est indépendante de celle des autres scènes du chapitre
  et du fait que les finitions pour le livre soient achevées. La vérification
  des enchaînements relève de F09. L'élève de référence reste signalé pour
  retrouver le travail terminé dans le suivi, selon F06.3/F06.5.
- Au moment de valider, l'application vérifie que le texte et l'état
  correspondent encore à ceux examinés par l'enseignant. Si un retrait,
  une nouvelle soumission ou une modification sont intervenus entre-temps,
  la validation est suspendue : le changement est signalé et le texte
  courant est présenté avant une nouvelle décision. Cette protection ne
  crée ni suivi permanent de présence ni verrou de session.
- Finir de saisir ou de recopier ne valide pas automatiquement le texte.
- Un élève disposant de l'un des deux profils ne peut pas modifier directement
  un texte validé. Il peut demander une évolution selon F07.2 ; la réouverture
  effective du travail reste sous la responsabilité de l'enseignant.
- L'enseignant peut rouvrir explicitement un travail déjà validé avec l'action
  « Demander une nouvelle reprise ». La scène revient « À reprendre » depuis
  le texte courant ; les remises antérieures restent conservées. Le travail
  élève doit ensuite être soumis puis validé à nouveau. Les simples retouches
  de l'enseignant conservent la validation selon F11.1 et ne déclenchent pas
  cette réouverture.
- L'enseignant peut solliciter une aide IA facultative lors de la correction.
  Les actions retenues et leurs limites sont décrites en F13.1.

**Décision confirmée le 5 octobre 2026 — un texte vide ne se remet pas :**
tant que la scène est « Texte vide » au sens de
[F06.5](#f065--suivi-du-travail-et-accès-aux-scènes), la remise n'est pas
proposée à l'élève : le bouton est inactif et l'écran lui dit d'écrire
d'abord. Dès qu'un texte est saisi, la remise redevient possible, selon les
règles ci-dessus. Cette règle ne concerne que la remise par un élève :
l'enseignant garde la main sur l'état de la scène, texte vide compris.

- **Motif :** la critique du côté élève (5 octobre 2026) relevait un bouton
  « Remettre » actif sur une scène sans texte ; une remise vide n'apprend
  rien à l'enseignant et retire l'écriture à l'élève.
- **F07-AC67 — Remise d'un texte vide :** étant donné S018 « Texte vide »,
  dont Alice s'occupe, lorsqu'elle ouvre la scène, alors la remise est
  inactive et l'écran lui dit d'écrire d'abord ; lorsqu'elle a saisi une
  phrase, alors elle peut remettre la scène, qui n'est plus « Texte vide ».

**Décision confirmée le 4 octobre 2026 — l'enseignant a la main sur l'état
de la scène :** dans un projet de classe, l'enseignant peut mettre une scène
dans l'état qu'il veut, depuis n'importe quel état : « En cours »,
« À reprendre », « À valider », « Validé » ou « Prête ». Les transitions du
tableau ci-dessous restent le parcours ordinaire ; ce choix direct s'y
ajoute.

- **Motif du porteur :** l'enseignant termine parfois lui-même un texte et
  le valide, faute de temps ou parce que l'élève est absent ; cela lui est
  arrivé. La critique d'ergonomie de la page de scène (23/40 pour chacune
  des deux lectures) relevait aussi qu'on ne pouvait revenir ni sur une
  validation, ni sur une demande de reprise, ni sur « prête », et qu'une
  scène « À reprendre » que l'élève ne reprend pas n'avait, en juin, pas
  d'autre issue que l'exclusion du livre.
- **Ce que le choix permet, et qui manquait :** finir soi-même une scène
  « En cours » ou « À reprendre » et la valider ; passer d'un geste de
  « À valider » à « Prête » ; annuler une validation ou une demande de
  reprise ; retirer « Prête » (voir
  [F11.1](#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre)).
- **Effet pour les élèves :** celui de l'état choisi, tel qu'il est défini
  plus haut. « En cours » et « À reprendre » leur rendent l'écriture ;
  « À valider », « Validé » et « Prête » la leur retirent. Mettre une scène
  « À valider » ou « Validé » sans remise d'élève ne crée aucune remise ;
  depuis « À valider », un élève autorisé peut toujours retirer la remise
  pour réécrire.
- **« À reprendre » propose la remarque**, qui reste facultative : voir
  [F07.3](#f073--retours-de-révision). « Demander une nouvelle reprise »
  n'est plus une commande à part : c'est le choix de cet état depuis
  « Validé » ou « Prête ».
- **Ce qui ne change pas :** les remises restent conservées ; la prise en
  charge ne change pas avec l'état ; les élèves ne disposent toujours que
  de la remise et de son retrait ; une retouche de l'enseignant garde
  l'état de la scène ; revenir de « Prête » à un autre état retire le
  repère « prête », comme une réouverture.
- **Validation suspendue :** la vérification du texte examiné s'applique
  au choix de « Validé » ou de « Prête », comme à la validation.
- **Corrections non enregistrées :** tant que les corrections de
  l'enseignant ne sont pas enregistrées — échec de F08.1 —, le changement
  d'état attend, comme la soumission d'un élève attend l'enregistrement de
  sa saisie. Après un conflit, ses corrections sont gardées à part et
  l'état se choisit de nouveau dès que la page montre le texte à jour
  ([F08.1](#f081--écritures-concurrentes), 7 octobre 2026).
- **Scène sans élève :** elle n'a que trois états, « En cours », « Validé »
  et « Prête » ; voir F11.1 et, pour la scène que l'enseignant s'attribue,
  [F06.3](#f063--prise-en-charge-et-signalement-du-travail).
- **Alternative écartée :** réserver « À valider » aux scènes qu'un élève a
  remises, recommandation de la critique, pour qu'un élève ne trouve pas sa
  scène en lecture seule sans l'avoir remise. Le porteur l'écarte :
  l'enseignant a la main sur tout.

**Propositions pour la suite du parcours :**

- Afficher l'avancement du chapitre à partir de celui de ses scènes, sans
  imposer une seconde validation des textes au niveau du chapitre.

**Principales transitions acquises :**

| État de départ | Action | Résultat |
| --- | --- | --- |
| En cours d'écriture | Un élève soumet la scène. | La scène passe à valider ; la remise est conservée et le soumetteur prend en charge le suivi. |
| À valider | Un élève autorisé à écrire dans le chapitre retire la soumission avant validation. | La scène repasse en cours d'écriture sans intervention préalable de l'enseignant ; la prise en charge ne change pas. |
| À valider | L'enseignant demande une révision. | La scène passe à reprendre ; les élèves autorisés peuvent écrire et le retour s'adresse au responsable du suivi. |
| À reprendre | Un élève soumet le texte retravaillé. | La scène repasse à valider ; une nouvelle remise est conservée et le soumetteur prend en charge le suivi. |
| À valider | L'enseignant valide le travail élève, après vérification du texte et de l'état examinés. | Le travail de rédaction de l'élève est terminé et il ne peut plus reprendre seul ; la préparation de la scène pour le livre reste distincte. Une modification intervenue depuis la relecture suspend la validation. |
| Travail élève validé | L'enseignant demande explicitement une nouvelle reprise. | La scène revient à reprendre depuis son texte courant ; une nouvelle soumission puis une nouvelle validation sont nécessaires. Les remises antérieures restent conservées. |
| N'importe quel état | L'enseignant choisit un autre état (4 octobre 2026). | La scène prend cet état, avec ses effets pour les élèves ; aucune remise n'est créée ni supprimée, la prise en charge ne change pas. Si le texte a changé depuis sa relecture, le choix de « Validé » ou de « Prête » est suspendu. |

Le retrait volontaire avant validation et le retour pour révision demandé
par l'enseignant sont deux chemins distincts de reprise. Le second n'est pas
une condition préalable au premier. La présentation des retours et des commandes
de reprise reste à concevoir. La fréquence supposée faible des
interventions simultanées est une hypothèse d'usage, pas une suppression des
exigences de sauvegarde.

**Critères d'acceptation sur les éléments confirmés :**

- **F07-AC01 — Vérification après recopie :** étant donné un texte corrigé sur
  papier puis recopié, lorsque l'élève termine sa saisie, alors le texte ne
  devient pas automatiquement validé.
- **F07-AC02 — Validation sans révision imposée :** étant donné un texte que
  l'enseignant a vérifié et juge satisfaisant, lorsqu'il souhaite le valider,
  alors l'application n'exige pas qu'il ait auparavant demandé une révision.
- **F07-AC03 — Texte validé protégé :** étant donné un texte validé, lorsqu'un
  élève disposant de l'un des deux profils tente de le modifier directement,
  alors sa modification ne remplace pas le texte validé.
- **F07-AC04 — Validation indépendante :** étant donné un chapitre de dix
  scènes dont neuf satisfont l'enseignant, lorsqu'il valide ces neuf scènes,
  alors elles restent validées tandis que la dixième peut rester à réviser.
- **F07-AC05 — Correction directe :** étant donné un texte remis par un élève,
  lorsque l'enseignant le corrige directement, alors la correction est possible
  sans imposer une nouvelle saisie à l'élève et le texte remis reste conservé.
- **F07-AC07 — Soumission distincte de la validation :** étant donné une scène
  en cours de rédaction, lorsque l'élève la soumet à l'enseignant, alors le
  texte de cette remise est conservé comme référence et la scène est présentée
  comme prête à relire, sans être automatiquement validée.
- **F07-AC08 — Plusieurs remises conservées :** étant donné une première
  soumission A suivie d'une demande de révision, lorsque l'élève soumet son
  nouveau texte B, alors A et B restent consultables séparément et une
  correction ultérieure de l'enseignant ne remplace ni A ni B.
- **F07-AC09 — Retrait autonome :** étant donné une scène soumise par Alice
  et pas encore validée, lorsqu'Alice retire sa soumission, alors la scène
  revient en cours d'écriture sans attendre une action de l'enseignant et
  le texte de la remise précédente reste conservé.
- **F07-AC10 — Transfert lors de la soumission :** étant donné une scène
  signalée comme prise en charge par Alice, lorsque Bilal, autorisé à écrire
  dans ce chapitre, soumet le texte, alors Bilal devient l'élève indiqué comme
  prenant en charge la scène et le destinataire des corrections demandées pour
  cette remise. Les droits de chapitre d'Alice restent inchangés.
- **F07-AC11 — Travail élève terminé :** étant donné un texte dont le travail
  élève satisfait l'enseignant mais dont les finitions ne sont pas achevées,
  lorsqu'il valide le travail élève, alors l'élève ne peut plus retirer la
  soumission pour reprendre seul. Cette validation ne déclare pas la scène
  prête pour le livre et les remises restent consultables séparément.
- **F07-AC12 — Retrait par un camarade :** étant donné une scène soumise par
  Alice, pas encore validée, lorsque Bilal, lui aussi autorisé à écrire dans
  le chapitre, retire la soumission, alors la reprise est permise sans Alice
  ni intervention de l'enseignant. Le retrait seul laisse Alice responsable
  du suivi ; une reprise explicite par Bilal selon F06.3, une nouvelle
  soumission ou une réattribution par l'enseignant peut ensuite le modifier.
- **F07-AC13 — Reprise du texte corrigé non validé :** étant donné une remise A
  dont l'enseignant a enregistré une correction B sans valider la scène,
  lorsqu'un élève autorisé retire la soumission, alors il reprend l'écriture
  depuis B sans attendre que l'enseignant ait terminé sa relecture. A reste
  consultable comme référence de la remise.
- **F07-AC14 — Demande de révision identifiable :** étant donné une scène à
  valider, lorsque l'enseignant demande une révision, alors la scène apparaît
  « À reprendre » et les élèves autorisés à écrire dans le chapitre peuvent
  la modifier. S'ils reprennent de leur propre initiative en retirant une
  soumission sans demande de révision, la scène apparaît « En cours d'écriture ».
- **F07-AC23 — Reprise après correction enseignante :** étant donné une
  remise A d'Alice et un texte courant B comprenant deux corrections de
  l'enseignant, lorsque celui-ci demande à Alice de développer la description,
  alors Alice reprend B et peut consulter A séparément. Le retour pour
  révision ne restaure pas A à la place de B.
- **F07-AC26 — Validation fondée sur le texte examiné :** étant donné Mme
  Laurent relisant une remise, puis Alice retirant cette soumission et
  modifiant le texte depuis une autre session, lorsque Mme Laurent demande
  la validation depuis sa relecture initiale, alors la scène n'est pas
  validée par cette action. Le changement est signalé et le texte courant
  est présenté avant une nouvelle décision de l'enseignante.
- **F07-AC27 — Nouvelle reprise après validation :** étant donné une scène
  dont le travail élève est validé et dont le texte courant comprend des
  retouches enseignantes, lorsque Mme Laurent demande une nouvelle reprise,
  alors la scène revient « À reprendre » avec ces retouches conservées.
  Une nouvelle remise passe « À valider » et exige une nouvelle validation ;
  les remises antérieures restent consultables.
- **F07-AC28 — Dernière saisie incluse dans la remise :** étant donné Alice
  ajoutant une dernière phrase dont l'enregistrement est encore en cours,
  lorsqu'elle clique sur « Soumettre », alors la soumission n'est confirmée
  qu'après l'enregistrement de cette saisie. La remise conservée contient
  cette phrase et la scène passe ensuite « À valider ».
- **F07-AC29 — Échec de sauvegarde pendant la remise :** étant donné Alice
  demandant la soumission et un enregistrement qui échoue ou détecte un
  conflit, lorsque l'application traite cette demande, alors elle ne
  confirme aucune remise réussie et ne fait pas passer la scène « À valider »
  du fait de cette tentative. La saisie est préservée, son état réel de
  conservation est indiqué et l'incident est signalé ; une ancienne version
  n'est pas soumise silencieusement à sa place.
- **F07-AC30 — Lecture seule pendant la relecture :** étant donné une scène
  « À valider » et Alice autorisée à écrire dans son chapitre, lorsqu'elle
  l'ouvre, alors elle peut la consulter mais pas modifier directement son
  texte, avec l'un ou l'autre profil. Lorsqu'elle retire explicitement la
  soumission, la scène revient « En cours d'écriture » et elle peut reprendre
  le texte courant ; les remises restent conservées.
- **F07-AC31 — Correction avant première remise :** étant donné un brouillon
  jamais soumis, lorsque Mme Laurent corrige le texte courant, alors la
  correction est permise sous le contrôle des sauvegardes concurrentes de
  F08.1. Cette action seule ne crée pas de remise et ne valide pas le travail
  élève ; les élèves autorisés retrouvent le texte courant corrigé.
- **F07-AC61 — Finir à la place de l'élève :** étant donné S028
  « À reprendre », que Lina, absente, ne reprendra pas, lorsque Mme Laurent
  termine le texte puis choisit l'état « Validé », alors la scène est
  validée sans nouvelle remise ; la remise précédente reste consultable et
  Lina reste indiquée.
- **F07-AC62 — Annuler une validation :** étant donné S016 validée par
  erreur, lorsque Mme Laurent choisit l'état « À valider », alors la scène
  attend de nouveau sa relecture, sa remise est conservée et les élèves ne
  peuvent toujours pas la modifier sans retirer la remise.
- **F07-AC63 — De « À valider » à « Prête » :** étant donné S003 remise et
  relue, lorsque Mme Laurent choisit l'état « Prête », alors le travail de
  l'élève est validé et la scène est prête pour le livre, d'un seul geste.
- **F07-AC64 — « À valider » sans remise :** étant donné S015 en cours
  d'écriture, jamais remise, lorsque Mme Laurent choisit l'état
  « À valider », alors la scène prend cet état sans qu'aucune remise soit
  créée ; Alice la lit sans pouvoir la modifier et peut la reprendre en
  retirant la remise.
- **F07-AC65 — État en attente de l'enregistrement :** étant donné une
  correction de Mme Laurent qui n'a pas pu être enregistrée, lorsqu'elle
  choisit un autre état, alors l'état ne change pas tant que la correction
  n'est pas enregistrée, et elle en est informée.

### F07.2 — Propositions et changements protégés

**Décision confirmée :** les deux profils peuvent adresser à l'enseignant une
demande de suppression ou de modification après validation, en expliquant
le changement souhaité. La demande ne modifie pas elle-même le récit.
L'enseignant décide, puis effectue le changement ou rouvre le travail.
La forme de la demande et le parcours détaillé de sa décision restent à préciser.

**Décision du 5 octobre 2026 — demandes à l'oral en première livraison :**
l'application ne propose aucune demande écrite de l'élève, ni pour modifier
un texte validé, ni pour ajouter ou supprimer une scène. L'élève demande à
l'enseignant en classe. Pour un texte validé, l'écran le lui dit (« Pour
changer quelque chose, demande à Mme Laurent. ») ; l'enseignant rouvre le
travail s'il le veut, par le choix de l'état selon F07.1, ou crée et
supprime lui-même les scènes. Cette décision révise la demande adressée
dans l'application, décidée ci-dessus ; le porteur la confirme en deux
temps le même jour, d'abord pour la modification après validation, puis
pour l'ajout et la suppression (« on reste à l'oral »).

- **Motif :** une demande écrite suppose, côté adulte, une liste des
  demandes et leurs états (traitée, refusée, sans objet), que le Suivi n'a
  pas ; le porteur a déjà retenu l'oral pour les changements de choix
  (F06.1) et pour les réponses aux retours (F07.3). La critique du côté
  élève (5 octobre 2026) relevait un bouton « Demander un changement » qui
  partait au premier clic, sans rien pouvoir dire ni annuler.
- **Conséquences :** le profil « écriture et propositions » garde son nom
  et ses droits ; ses propositions se font à l'oral. Le critère F07-AC06
  ci-dessous, écrit pour une demande dans l'application, ne s'applique pas
  à la première livraison : la scène reste dans le récit tant que
  l'enseignant ne l'a pas supprimée lui-même.
- **Alternative conservée pour plus tard :** une demande écrite d'une phrase,
  visible dans le Suivi, si l'usage montre que l'oral ne suffit pas.

- **F07-AC66 — Texte validé, demande à l'oral :** étant donné S014 validée,
  lorsqu'Inès l'ouvre, alors elle la lit, ne peut pas la modifier, et
  l'écran lui indique de s'adresser à l'enseignante pour un changement ;
  aucune commande de demande ne lui est proposée.
- **F07-AC68 — Ajout ou suppression, à l'oral :** étant donné Alice, profil
  « écriture et propositions », qui voudrait une scène de plus dans son
  chapitre, lorsqu'elle ouvre son chapitre, alors aucune commande de
  création ni de demande ne lui est proposée ; l'enseignante crée la scène
  si elle retient l'idée.

**Critère d'acceptation :**

- **F07-AC06 — Demande sans application :** étant donné une scène contenant
  du travail, lorsque l'élève en propose la suppression, alors l'enseignant
  peut prendre connaissance de cette demande et la scène reste dans le récit
  tant qu'il n'a pas décidé et effectué sa suppression.

**Questions ouvertes F07 :**

- Présentation de la consultation séparée des remises et du texte courant ;
  aucun repérage automatique des différences mot à mot n'est encore décidé.
- Présentation du transfert de prise en charge au moment d'une soumission
  par un camarade.
- Présentation de l'attente d'enregistrement et reprise d'une tentative de
  soumission interrompue ; l'obligation d'enregistrer la saisie complète
  avant confirmation et l'arrêt sur échec ou conflit sont acquis en F07.1.
- Forme des consignes. Les demandes de changement se font à l'oral en
  première livraison (F07.2, 5 octobre 2026) ; leur forme écrite et leur
  traitement ne sont plus à concevoir pour cette livraison.
- Changement de responsable de suivi par l'enseignant et conservation des
  contributions dans l'historique.
- Effet d'une réouverture du travail élève sur une scène déjà déclarée prête
  pour le livre ; le nouveau cycle de reprise et validation est acquis
  ci-dessus, tandis que ce repère éditorial reste à préciser en F11.1.
- Suppression par l'enseignant : scène contenant du travail, choix pointant
  vers elle, annulation et récupération.

### F07.3 — Retours de révision

**Décisions confirmées :**

- L'enseignant peut écrire des remarques liées à une scène et y citer une
  expression du texte si nécessaire. Des annotations attachées précisément
  aux mots ne sont pas indispensables à la première livraison.
- Les retours sont lisibles par les élèves autorisés à lire la scène.
- Le travail à reprendre est signalé au responsable du suivi, déterminé selon
  F07.1. Être destinataire du retour et avoir le droit de le consulter sont
  deux notions distinctes.
- La correction directe du texte reste possible selon F07.1.
- **Remarque facultative (4 octobre 2026) :** demander une reprise propose
  d'écrire une remarque sans l'exiger, comme la consigne numérique : le
  retour a pu être donné à l'oral ou sur la feuille de l'élève.
- **Mot d'écran (6 octobre 2026) :** l'adulte comme l'élève lisent
  « remarque » (« Remarque pour Bilal », « Remarque de Mme Laurent ») ;
  « retour » y est réservé au geste de revenir en arrière. « Retour de
  révision » reste le terme de ces documents.
- La première livraison ne propose ni réponse écrite de l'élève aux retours
  ni note accompagnant une nouvelle soumission. Si l'élève bloque, il demande
  directement une explication à l'enseignant en classe ou attend de le voir.
  Ce choix limite le suivi supplémentaire pour un bénéfice jugé faible dans
  l'usage retenu. Les demandes de changements protégés de F07.2 conservent
  leur périmètre acquis ; elles ne constituent pas une réponse aux retours.
- Les retours sont conservés avec la remise qu'ils concernent. Lors d'une
  nouvelle soumission, la scène revient « À valider » ; les anciens retours
  restent consultables pendant la relecture, sans être présentés
  indéfiniment comme des demandes encore attendues sur la nouvelle remise.
  L'enseignant vérifie les changements et formule, si nécessaire, une nouvelle
  demande de reprise. La nouvelle soumission ne prouve pas automatiquement
  que les remarques précédentes ont été correctement traitées.

**Critères d'acceptation :**

- **F07-AC15 — Remarque de scène :** étant donné un passage à clarifier,
  lorsque l'enseignant demande une reprise, alors il peut associer sa remarque
  à la scène sans sélectionner une plage de caractères ni annoter un mot.
- **F07-AC16 — Retour consultable par les contributeurs :** étant donné Bilal
  responsable du suivi et Alice autorisée à lire la même scène, lorsque
  l'enseignant émet une remarque, alors les deux peuvent la consulter et le
  travail à reprendre est signalé à Bilal. Alice ne devient pas responsable
  du suivi du seul fait qu'elle consulte le retour.
- **F07-AC24 — Reprise sans échange écrit supplémentaire :** étant donné
  Alice reprenant une scène après un retour de l'enseignant, lorsqu'elle
  soumet son texte retravaillé, alors aucun champ de réponse ou de note
  d'accompagnement ne lui est proposé ni demandé.
- **F07-AC25 — Retours conservés avec leur remise :** étant donné une
  remise A et les retours de l'enseignant qui ont motivé sa reprise, lorsque
  l'élève soumet B, alors la scène est « À valider » et les retours sur A
  restent consultables avec A pendant la relecture. Ils ne deviennent pas
  automatiquement des demandes de reprise sur B ; une nouvelle demande de
  l'enseignant replace la scène « À reprendre ».

Ces règles s'appliquent aux projets de classe classiques comme à choix.
Le parcours adulte sans remise d'élève reste celui de F11.1.

**Proposition à l'essai (idée du porteur, 5 octobre 2026) — le retour
d'abord :** à la première ouverture d'une scène « À reprendre », l'élève
qui s'en occupe ne voit que la remarque de l'enseignant, en grand, et un
bouton « J'ai lu, j'écris ». Le retour prend alors sa place à côté du texte
et le curseur va dans le texte. Les autres élèves du chapitre lisent le
retour à sa place ordinaire. Sans remarque écrite, l'écran dit que la
reprise est demandée et renvoie vers l'enseignant. La proposition est dans
la maquette, sans décision à ce stade ; elle se jugera à l'essai avec des
élèves : un enfant peut cliquer sans lire.

**Précision de présentation (5 octobre 2026) :** après une nouvelle remise,
l'élève garde le dernier retour sous les yeux, replié sous la consigne, pour
vérifier qu'il y a répondu ; la règle de conservation ci-dessus ne change pas.

**Questions ouvertes :** forme du signalement et présentation de la
consultation des remises et de leurs retours ; repérage, dans le texte de
l'élève, des corrections que l'enseignant y a faites, relevé par la critique
du côté élève et non décidé. Les réponses écrites des élèves
et le devenir des retours après nouvelle soumission sont arbitrés ci-dessus.

### F07.4 — Fiches de rédaction pour le travail sur papier

**Besoin confirmé et retour d'usage :** l'enseignant doit pouvoir imprimer
les consignes des scènes dont le travail de rédaction reste à faire, avec
leur image lorsqu'elle est présente. Le porteur utilise fréquemment ces
supports pour permettre aux élèves d'avancer sur papier à la maison, puis
de recopier leur texte en classe ; il rapporte un gain de temps dans ses séances.
Cette possibilité fait partie du parcours initial retenu.

**Parcours acquis :** l'enseignant prépare les consignes et les fiches à
distribuer ; les élèves rédigent sur papier en classe ou à la maison, puis
saisissent leur texte dans l'application. La remise et la validation suivent
F07.1. Le travail sur papier reste une possibilité, sans devenir obligatoire.

**Règles confirmées :**

- Une fiche permet de retrouver la scène concernée, sa consigne et l'image
  prévue lorsqu'il y en a une. Les images restent facultatives.
- Le support distribué préserve les informations des autres chapitres que
  l'élève ne doit pas découvrir. Les modalités de sélection des fiches et de
  distribution seront précisées sans modifier les attributions de F06.
- La fiche de rédaction est distincte du PDF de travail du livre, qui sert
  à relire le récit assemblé selon F11.2. L'impression d'une fiche ne vaut
  ni soumission d'un texte ni validation du travail élève.

**Référence d'usage V0 vérifiée :** le parcours d'impression de fiches existe.
Son filtre retient les scènes « À faire » et « À réécrire », avec consigne,
image facultative et place pour écrire. Ce filtre est plus restreint que
toutes les scènes non validées ; il n'est pas repris comme règle V1.

**Critères d'acceptation sur les éléments confirmés :**

- **F07-AC17 — Consigne et image sur papier :** étant donné une scène à
  rédiger avec une consigne et une image, lorsque l'enseignant en prépare une
  fiche imprimable, alors la scène, sa consigne et son image y sont identifiables.
- **F07-AC18 — Recopie après travail à la maison :** étant donné un élève
  ayant rédigé sur sa fiche, lorsqu'il recopie ensuite son texte en classe,
  alors le parcours ordinaire de remise et de relecture reste disponible ;
  le fait d'avoir imprimé la fiche ne rend pas son texte déjà soumis ou validé.

**Décision confirmée — préparer le lot de fiches de la séance :**
l'enseignant sélectionne les scènes à imprimer dans une liste regroupée par
partie et chapitre, vérifie la sélection puis produit les fiches.
L'impression peut précéder les inscriptions et les attributions numériques :
une fiche se rattache à une scène, pas obligatoirement à un élève nommé.
L'enseignant distribue les fiches aux élèves concernés ; imprimer ne crée
aucun accès numérique. Ce parcours permet de commencer sur papier avant
que les accès individuels soient prêts, sans ajouter de planification
automatique des rotations sur les 10 postes.

- **F07-AC21 — Fiches avant inscriptions :** étant donné un projet de classe
  avec trois scènes préparées, sans élève encore inscrit ni attribution,
  lorsque l'enseignant sélectionne ces scènes et confirme l'impression,
  alors leurs fiches sont produites sans exiger de nom d'élève ni créer
  d'accès numérique. Le parcours fonctionne en récit classique comme à choix.
- **F07-AC22 — Lot vérifié avant impression :** étant donné des scènes dans
  deux chapitres, lorsque l'enseignant retire une scène de la sélection
  avant de produire le lot, alors seules les fiches des scènes encore
  sélectionnées sont produites ; la scène retirée de la sélection et son
  travail restent dans le projet.

**Décision confirmée le 4 octobre 2026 — une feuille qui liste les scènes :**
le porteur écarte une feuille par scène, qui consomme trop de papier. La
fiche de rédaction est une feuille compacte qui liste les scènes choisies,
numérotées par leur référence, chacune avec son titre, sa consigne, son
image éventuelle, le texte déjà écrit et la demande de reprise lorsqu'il y
en a. Elle ne réserve pas de place pour écrire : l'élève note le numéro de
la scène sur une feuille de classeur ou son cahier de brouillon, puis écrit,
complète ou corrige son texte. Cela tranche deux approfondissements
différés, la place du texte existant et des retours de révision, et la
place pour écrire.

**Décision confirmée le 4 octobre 2026 — par chapitre ou par élève, et
jamais sans consigne :** un réglage de la page des fiches dit comment les
feuilles sont faites. « Par chapitre » : une feuille par chapitre, avec ses
scènes choisies, à donner à ses élèves. « Par élève » : une feuille par
élève, à son prénom, avec les scènes choisies dont il s'occupe ; une scène
dont personne ne s'occupe n'est alors sur aucune feuille, et la page le dit,
sauf si l'enseignant la fait répartir (décision plus bas).
La liste des scènes peut être réduite à celles d'un élève. Une scène sans
consigne ne figure pas sur une fiche et ne peut pas être choisie. Dans les
deux réglages, un élève ne reçoit que des scènes de ses chapitres : la règle
ci-dessus sur les informations des autres chapitres reste tenue.
Conséquence à connaître : une consigne donnée seulement à l'oral, admise par
F07.1, ne donne pas de fiche.

**Décision confirmée le 4 octobre 2026, après la deuxième critique du
Suivi — un élève choisi, sa seule feuille :** lorsque la liste est réduite à
un élève, seules ses scènes cochées s'impriment, sur une feuille à son
prénom ; le décompte et le bouton d'impression le disent. Ce qui est affiché
est ce qui s'imprime. La maquette réduisait la liste sans réduire
l'impression : les fiches des autres élèves seraient parties aussi.
L'alternative écartée gardait le filtre comme simple aide pour retrouver des
scènes, en disant combien de scènes cochées restaient cachées. Les scènes
cochées des autres élèves ne sont pas décochées : elles reviennent avec
« Tous les élèves ».

**Décision confirmée le 4 octobre 2026 — à la suite, à découper :** un
second réglage imprime les parties à la suite, sans saut de page entre deux
chapitres ou deux élèves, pour ne pas laisser de blanc ; un trait de coupe
les sépare et l'enseignant découpe la part de chacun. Il se combine avec
« par chapitre » comme avec « par élève ». Chaque partie garde son en-tête,
avec le prénom lorsqu'il est connu.

- **F07-AC52 — Feuille compacte :** étant donné S015 en cours d'écriture
  avec un début de texte, S017 à reprendre avec un retour de l'enseignante et
  S018 sans texte, toutes trois choisies, lorsque l'enseignant produit la
  fiche, alors une même feuille liste les trois scènes sous leur référence,
  avec leur consigne ; S015 y porte son texte déjà écrit, S017 son texte et
  la demande de reprise, et aucune place n'est réservée pour écrire.
- **F07-AC53 — Une feuille par élève :** étant donné S015 et S018 dont Alice
  s'occupe, S017 dont Bilal s'occupe et S006 sans élève, toutes choisies,
  lorsque l'enseignant règle « par élève », alors une feuille au prénom
  d'Alice liste S015 et S018, une autre au prénom de Bilal liste S017, et la
  page indique que S006 n'est sur aucune feuille ; réglé « par chapitre »,
  S006 figure sur la feuille de son chapitre.
- **F07-AC54 — Pas de fiche sans consigne :** étant donné S019 sans consigne,
  lorsque l'enseignant prépare les fiches, alors S019 ne peut pas être
  choisie et ne figure sur aucune feuille ; dès qu'une consigne lui est
  ajoutée, elle peut l'être.
- **F07-AC55 — À la suite, à découper :** étant donné quatre scènes choisies
  pour Alice, Bilal et Jade, lorsque l'enseignant règle « par élève » et
  « À la suite, à découper », alors les trois parties se suivent sans saut
  de page, chacune sous le prénom de son élève, séparées par un trait de
  coupe ; sans ce réglage, chaque élève a sa feuille.
- **F07-AC56 — Un élève choisi, sa seule feuille :** étant donné S015 et
  S018 dont Alice s'occupe, S017 dont Bilal s'occupe et S024 dont Jade
  s'occupe, toutes cochées, lorsque l'enseignant choisit « Alice » dans la
  liste des élèves, alors la page indique « 2 scènes sur 1 feuille · Alice »
  et le bouton « Imprimer 1 feuille » ; les fiches de Bilal et de Jade ne
  s'impriment pas. Revenu à « Tous les élèves », il retrouve quatre scènes
  cochées sur trois feuilles.

**Décision confirmée le 4 octobre 2026, après la troisième critique du
Suivi — « par élève » : les scènes déjà prises, ou toutes, les autres étant
réparties :** en « par élève », l'enseignant tire au choix les seules scènes
choisies qu'un élève a déjà prises, ou toutes les scènes choisies ; dans ce
second cas, celles que personne n'a prises sont réparties entre les élèves
de leur chapitre.

- **Partage équitable :** on sert d'abord l'élève qui a le moins de scènes à
  son nom dans le chapitre, scènes terminées comprises, pour que chacun en
  ait autant au final. Exemple du porteur : Marie en a pris cinq, Mohamed
  une, il en reste six ; Marie en reçoit une et Mohamed cinq, six chacun. On
  ne retire rien à personne : si Marie en a huit, Mohamed une et qu'il en
  reste trois, Mohamed reçoit les trois.
- **Seulement à l'impression, et sur demande :** tant que les feuilles ne
  sont pas tirées, le partage n'est qu'une proposition, visible sur la page
  des fiches. Au moment d'imprimer, un message demande de le confirmer ;
  alors seulement chaque scène répartie passe au nom de son élève, comme
  une prise en charge de
  [F06.3](#f063--prise-en-charge-et-signalement-du-travail). Annuler, ou
  quitter la page, ne donne rien à personne.
- **Éviter, non empêcher :** c'est une prise en charge ordinaire, qui n'ôte
  aucun droit aux camarades du chapitre ; la reprise après avertissement et
  le changement d'élève par l'enseignant restent ceux de F06.3.
- **Motif du porteur :** trois élèves qui reçoivent la même feuille de
  chapitre peuvent écrire la même scène chacun de leur côté ; chaque scène
  doit avoir son élève, et les élèves autant de scènes les uns que les
  autres.

Alternatives écartées : une commande « Répartir » à part, dans le Suivi,
d'abord recommandée, le porteur plaçant le geste là où l'on tire les
feuilles ; un partage fait d'office, sans message ; une réservation
exclusive de la scène, qui rouvrirait F06-AC10 ; un nombre d'exemplaires de
la feuille du chapitre selon son effectif, question dont la décision est
partie.

- **F07-AC57 — Deux tirages par élève :** étant donné S015 et S018 dont
  Alice s'occupe, S017 dont Bilal s'occupe, S024 dont Jade s'occupe et S006
  sans élève, dans un chapitre attribué à Chloé, Dylan et Emma, toutes
  cochées, lorsque l'enseignant règle « par élève », alors la page indique
  quatre scènes sur trois feuilles et que S006 n'est sur aucune feuille ;
  lorsqu'il choisit de la répartir, alors S006 est proposée à Emma, qui a
  une scène à son nom quand Chloé et Dylan en ont deux, et la page indique
  cinq scènes sur quatre feuilles.
- **F07-AC58 — Partage équitable :** étant donné un chapitre attribué à
  Marie et Mohamed, cinq scènes prises par Marie, une par Mohamed et six
  sans élève, toutes les six cochées, lorsque l'enseignant les fait
  répartir, alors une est proposée à Marie et cinq à Mohamed ; avec huit
  scènes pour Marie, une pour Mohamed et trois sans élève, les trois sont
  proposées à Mohamed et aucune n'est retirée à Marie.
- **F07-AC59 — Rien avant la demande :** étant donné S006 proposée à Emma,
  lorsque l'enseignant choisit « Annuler » au message, ou quitte la page,
  alors S006 reste sans élève dans le Suivi ; lorsqu'il choisit « Répartir
  et imprimer », alors S006 est au nom d'Emma et sa feuille s'imprime.
- **F07-AC60 — Hors partage :** étant donné, la veille de la première
  séance, S018 avec consigne et S019 sans consigne dans « La lisière »,
  attribuée à trois élèves, et S060 dans « Le sommet », qui n'est attribué à
  personne, lorsque l'enseignant fait répartir les scènes cochées, alors
  S018 est proposée à un élève de « La lisière », S019 ne peut pas être
  cochée et la page indique que S060 n'est sur aucune feuille ; lorsqu'il
  réduit la liste à Alice, alors le partage n'est plus proposé.

**Précisions confirmées par le porteur le 4 octobre 2026**, d'abord
proposées par la maquette :

- **Où se trouve la commande :** dans la phrase qui signale les scènes sans
  élève (« Les répartir entre les élèves du chapitre », puis « Ne pas
  répartir »), et non dans un réglage toujours affiché.
- **Écarter une scène :** une scène à ne pas répartir se décoche, par
  exemple une scène de liaison que l'adulte écrit lui-même. L'élève proposé
  ne se change pas sur la page ; il se change ensuite, comme toute prise en
  charge.
- **Ordre :** les scènes sont données dans l'ordre du chapitre, pour que
  chacun garde des scènes voisines.
- **Hors partage :** une scène sans consigne, qui n'a pas de fiche ; la
  scène d'un chapitre non attribué, qui reste sur aucune feuille ; la page
  réduite à un élève, où le partage n'est pas proposé.

Restent proposés par la maquette : l'élève proposé montré dans la liste, en
pointillé ; « par chapitre », qui ne change pas. Questions ouvertes : à qui va la scène de trop quand le partage ne
tombe pas juste ; l'élève inscrit à plusieurs chapitres ; l'impression
abandonnée après la confirmation ; l'annulation d'un partage confirmé ; ce
que l'élève en voit dans « Mon travail ».

**Propositions de la maquette du 4 octobre 2026, sans retour du porteur :**
le bouton d'impression à côté du décompte, toujours en vue, et non sous
l'aperçu ; « Tout décocher », séparé des raccourcis d'ajout, qui ne décoche
que les scènes affichées ; la mention « sans consigne : pas imprimée »
(« pas de fiche » jusqu'au 6 octobre 2026) ; une
phrase quand il n'y a rien à imprimer, qui dit pourquoi (« Rien à écrire ni
à reprendre dans les scènes listées », ou « Aucune scène choisie n'a encore
d'élève : rien à imprimer par élève », la veille de la première séance) ;
« 1 des 5 scènes choisies n'a pas d'élève : sur aucune feuille », pour
accorder les cases cochées et le décompte ; le pied de la feuille réduit à
« Fiche de rédaction · à recopier dans l'application ». Après la troisième
critique : le décompte dit « Aucune feuille » et le bouton « Imprimer »,
éteint, quand il n'y a rien à tirer, à la place de « 0 scène sur 0 feuille »
et « Imprimer 0 feuille » ; pour un élève choisi qui n'a rien, « Rien à
imprimer pour Adam », la liste disant s'il n'a aucun chapitre ou ne s'occupe
d'aucune scène. Conséquence à connaître de la feuille par élève : tant
qu'aucun élève n'a pris de scène, elle ne donne rien, sauf à faire répartir
les scènes ; sinon, la veille de la première séance, on imprime par
chapitre.

**Approfondissements différés :** correspondance avec les états V1 ;
pagination et présentation des images ; partie trop longue pour une page
lorsque les fiches sont à la suite.
L'aide IA à la formulation des consignes relève de F13.2 ; la présentation
de la liste de points pour rédiger sur les fiches reste à préciser.
L'accès aux fiches en mode personnel reste à préciser ; le travail papier
en classe concerne aussi bien le récit classique que le récit à choix.
L'absence de consigne numérique ne bloque pas l'écriture selon F07.1 ; elle
écarte la scène des fiches, selon la décision ci-dessus.

**Piste différée — dictée vocale :** le porteur précise que la transcription
qu'il utilisait pour les élèves en retard était de la parole vers du texte
(speech-to-text), et non de la reconnaissance de manuscrits. Il envisage aussi
son intérêt pour réduire la recopie lorsque les ordinateurs sont partagés.
L'approfondissement de cette aide est différé ; sa présence dans la première
livraison n'est pas encore décidée. Le parcours papier puis saisie n'en dépend pas.

**Recommandation non arbitrée :** distinguer la dictée et la correction du
texte obtenu, avec une relecture sans validation pédagogique automatique.
L'utilisateur de la dictée, son insertion dans le parcours d'écriture et les
conditions matérielles restent à préciser. La disponibilité réelle, la
fiabilité et le gain de temps dans une classe devront être éprouvés avant
de retenir une solution technique ; aucune technologie V0 n'est reprise.

### F07.5 — Encouragements de l'enseignant

**Idée du porteur, décidée le 2 octobre 2026 pour la première livraison.**
Retour d'usage du porteur : il a déjà encouragé ainsi les textes de ses
élèves en classe et y voit une bonne source de motivation. Le parcours
détaillé et ses écrans restent à préciser avant réalisation.

**Décisions confirmées le 2 octobre 2026 :**

- **Encouragement :** en mode classe, l'enseignant peut marquer d'un
  encouragement le texte d'une scène, et l'application les compte par élève.
- **Trois catégories :** effort, fine plume, créativité. Pas davantage dans
  la première livraison.
- **Forme scolaire :** une marque du type tampon ou bon point, cohérente avec
  le système visuel de la maquette ; ni cœur ni « j'aime ».
- **Élève encouragé :** celui qui a la prise en charge de la scène selon
  [F06.3](#f063--prise-en-charge-et-signalement-du-travail). Les élèves
  travaillent très rarement à deux sur un texte ; aucune répartition entre
  plusieurs auteurs n'est prévue.
- **Classement optionnel :** un classement de la classe peut être affiché, au
  choix de l'enseignant. Le porteur y voit une motivation possible, notamment
  pour mettre en avant un élève en difficulté qui fait des efforts.

**Critères d'acceptation :**

- **F07-AC50 — Encouragement compté :** étant donné Bilal, qui a la prise en
  charge de S017, lorsque l'enseignante donne à cette scène un encouragement
  « effort », alors Bilal le retrouve sur sa scène et son total « effort »
  augmente de un.
- **F07-AC51 — Classement au choix :** étant donné une classe dont
  l'enseignant n'a pas activé le classement, lorsqu'Alice consulte ses
  encouragements, alors elle voit les siens et aucun total d'un camarade ;
  lorsque l'enseignant l'active, alors le classement de la classe est visible.

**Propositions non arbitrées :** classement désactivé par défaut ;
encouragement donné pendant la relecture de F07.1 et conservé avec la remise,
comme le retour de F07.3 ; aucun effet sur les états de travail, le livre ni
la version partagée.

**Questions ouvertes :** nom et dessin de la marque ; nombre d'encouragements
possibles par scène et par catégorie ; scène sans prise en charge ; retrait
d'un encouragement ; ce que montre le classement (total, par catégorie) et à
qui ; place dans le suivi de F06.5 ; conservation d'une année à l'autre avec
le profil de F01.1. Sans objet en mode personnel.

## F08 — Sauvegarde et récupération

### F08.1 — Écritures concurrentes

**Exigence confirmée du brief :** aucune saisie ne doit écraser silencieusement
le texte enregistré par une autre session. Cela concerne deux élèves, un élève
et l'enseignant, ou plusieurs sessions d'une même personne. Le signalement de
prise en charge ne suffit pas à garantir cette protection.

**Cas concret :** Alice et Bilal ouvrent la même version d'une scène ; Alice
recopie son texte, puis Bilal enregistre depuis la version qu'il avait ouverte.
L'application doit empêcher la disparition silencieuse du travail d'Alice,
même si les élèves n'avaient pas prévu d'écrire ensemble.

**Décision confirmée pour la première livraison :** détecter un texte
devenu ancien lors de la sauvegarde, sans suivre la présence en temps réel ni
réserver une session d'écriture exclusive. En cas de conflit, conserver le
texte concurrent séparément ; la récupération relève de l'enseignant en mode
classe. Il n'y a pas de fusion automatique des textes.

**Parcours retenu :**

1. L'élève autorisé ouvre la scène et peut saisir son texte, indépendamment
   du signalement de prise en charge d'un camarade.
2. Si personne n'a enregistré un changement depuis la dernière version connue
   de cette session, sa sauvegarde devient le texte courant de la scène.
3. Si une autre session a enregistré un changement entre-temps, la sauvegarde
   ne remplace pas le texte courant. Les enregistrements automatiques de cette
   session sur le texte partagé sont suspendus et le conflit est signalé.
4. Le texte en conflit doit pouvoir être conservé séparément pour récupération ;
   il ne doit pas disparaître lors d'un rechargement imposé. L'état affiché
   distingue texte enregistré dans la scène, copie de récupération conservée
   et texte encore non sauvegardé. Aucune fusion automatique n'est proposée.

**Arbitrage et limites :** un contrôle au moment de sauvegarder évite de gérer
les sessions actives, leurs expirations et les reprises de verrou après coupure.
Le parcours de récupération est décidé plus bas, le 7 octobre 2026 ; ses
écrans sont proposés dans le [design](design.md#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026) et ses vérifications
techniques restent à faire.
Un conflit peut interrompre la recopie et demander une intervention ponctuelle
de l'enseignant ; ce compromis est accepté, sans présumer de la fréquence des
conflits dans l'usage réel. La protection par session exclusive est écartée
pour la première livraison. La coédition simultanée n'est pas retenue comme
une exigence acquise.

**Critères d'acceptation sur les éléments confirmés :**

- **F08-AC01 — Version devenue ancienne :** étant donné deux sessions ayant
  ouvert le même texte, lorsque la première a enregistré une modification
  et que la seconde tente d'enregistrer depuis l'ancienne version, alors le
  travail de la première n'est pas remplacé silencieusement.
- **F08-AC02 — Deux textes récupérables :** étant donné deux élèves dont les
  saisies entrent en conflit et un service de sauvegarde disponible, lorsque
  le conflit est détecté et traité, alors le texte courant est conservé et
  le texte concurrent est conservé séparément pour récupération par l'enseignant,
  sans fusion automatique ni rechargement effaçant cette saisie.
- **F08-AC03 — État de sauvegarde fidèle :** étant donné une saisie conservée
  uniquement comme copie de récupération après conflit, lorsque l'élève voit
  son état de sauvegarde, alors l'application ne lui indique pas que sa saisie
  est devenue le texte courant de la scène.

**Décision confirmée le 5 octobre 2026 — ce que l'élève voit et peut faire
lors d'un incident :**

- **Conflit :** dès qu'un conflit est détecté, l'élève ne peut plus écrire
  dans la scène : son texte est gardé à part, et l'écran lui dit d'arrêter
  et d'appeler l'enseignant. La remise ne lui est plus proposée. Il
  retrouve l'écriture quand l'enseignant a traité le conflit. Motif : un
  enfant qui continue de taper allonge une version que personne ne lui a
  dit de garder, et clique « Remettre » sans effet.
- **Échec d'enregistrement sans conflit :** l'élève continue d'écrire ;
  l'écran lui dit, à l'endroit où il regarde, que son texte n'est pas
  encore enregistré et de ne pas fermer la page. Si une remise échoue pour
  cette raison, le message lui dit d'appeler l'enseignant.
- **Jamais de promesse sur la récupération :** le message de l'élève ne
  dit pas ce que l'enseignant fera de son texte ; ce parcours est décidé
  plus bas, le 7 octobre 2026.
- **Fermeture horaire avec échec** (F06.4) : l'échec passe devant
  l'annonce de fermeture, et rien n'invite l'élève à quitter la page.

Le texte des messages et leur place sont dans le
[design](design.md#côté-élève-repris-après-critique-5-octobre-2026).

- **F08-AC04 — Conflit, l'élève s'arrête :** étant donné Alice écrivant
  dans S015 et un conflit détecté à l'enregistrement, lorsque l'écran le
  signale, alors Alice ne peut plus modifier le texte ni le remettre, lit
  que son texte est gardé et qu'elle doit appeler l'enseignante ; sa saisie
  reste affichée.
- **F08-AC05 — Échec simple, l'élève continue :** étant donné une coupure
  de réseau pendant qu'Alice écrit, lorsque l'enregistrement échoue, alors
  elle peut continuer d'écrire, voit sans défiler que son texte n'est pas
  encore enregistré et qu'elle ne doit pas fermer la page ; rien n'annonce
  « enregistré ».

**Décision confirmée le 7 octobre 2026 — récupération d'un conflit par
l'enseignant :** la copie de récupération se nomme « texte gardé à part » à
l'écran. Dans un projet de classe, l'enseignant seul décide de ce qu'elle
devient.

- **Où :** sur la page de scène de l'enseignant, le texte gardé à part est
  un onglet de plus, à côté de « Texte de la scène » et des remises, nommé
  par son auteur et sa date : « Texte de Bilal, gardé à part mardi
  6 octobre ». Il n'y a ni écran dédié, ni comparaison des deux textes, ni
  fusion.
- **Deux gestes :** « Ne plus garder ce texte », pour le cas courant où il
  n'apporte rien de plus que la scène ; « Mettre ce texte dans la scène »,
  qui est un échange : le texte gardé à part devient le texte de la scène,
  et celui qu'il remplace est gardé à part à son tour. L'enseignant peut
  aussi copier un passage du texte gardé à part et le coller dans la scène.
  Aucun de ces gestes ne détruit le texte de la scène.
- **Conflit réglé :** quand la scène n'a plus de texte gardé à part.
- **Qui est arrêté :** seul l'élève dont le texte est gardé à part, et sur
  cette scène seulement. L'arrêt tient s'il recharge la page, change de
  poste ou revient à la séance suivante ; il dure jusqu'au geste de
  l'enseignant sur ce texte. L'élève dont le texte est dans la scène
  continue d'écrire ; l'élève arrêté peut écrire dans une autre scène en
  attendant.
- **Motif de l'arrêt qui tient :** un enfant recharge la page. S'il
  retrouvait ainsi l'écriture, il retaperait dans le texte de son camarade,
  dont l'enregistrement suivant serait refusé à son tour : ils se
  bloqueraient l'un après l'autre et les textes gardés à part
  s'empileraient.
- **Usage rapporté par le porteur :** en salle informatique, il a son
  propre écran ; il peut donc régler le conflit pendant la séance.
- **Comment l'enseignant l'apprend sans être appelé :** en tête du Suivi,
  une ligne de rappel, en lien et non en filtre, comme celle des élèves
  sans chapitre ([F06.5](#f065--suivi-du-travail-et-accès-aux-scènes)) :
  « 1 texte gardé à part : S015 Le pont ». Elle ouvre la scène sur l'onglet
  de ce texte. Sur la page de scène, le message au-dessus de la copie le
  dit aussi, d'où qu'on vienne. La scène garde son état : il n'y a ni
  tampon de plus, ni courriel, ni marque dans la barre du haut ou sur la
  carte du projet.
- **Alternatives écartées :** deux textes côte à côte avec leurs
  différences surlignées (écran neuf, pièce technique non vérifiée) ; un
  remplacement sans échange, qui détruirait le texte de la scène faute
  d'historique ; un arrêt limité à la page ouverte, qui laisse les élèves
  se bloquer tour à tour ; la scène fermée à tous les élèves, qui arrête
  celui qui n'a rien fait ; un tampon « À régler » qui filtre, un même
  élément ne devant pas informer et filtrer.

- **F08-AC06 — Texte gardé à part retrouvé sur la scène :** étant donné
  S015 où le texte de Bilal a été gardé à part le 6 octobre, lorsque Mme
  Laurent ouvre la scène, alors un message au-dessus de la copie le lui
  dit et un onglet « Texte de Bilal, gardé à part mardi 6 octobre » montre
  ce texte en entier, à côté de « Texte de la scène ».
- **F08-AC07 — Ne plus garder :** étant donné ce texte, qui n'apporte rien
  de plus que la scène, lorsque Mme Laurent choisit « Ne plus garder ce
  texte », alors l'onglet disparaît, le texte de la scène n'a pas changé et
  Bilal peut de nouveau écrire dans S015.
- **F08-AC08 — Échange sans perte :** étant donné le texte de Bilal gardé à
  part et le texte d'Alice dans la scène, lorsque Mme Laurent choisit
  « Mettre ce texte dans la scène », alors le texte de Bilal devient le
  texte de la scène et celui d'Alice est gardé à part à son tour ; le même
  geste sur ce dernier remet les deux textes à leur place, selon
  F08-AC30.
- **F08-AC09 — Arrêt qui tient :** étant donné Bilal arrêté sur S015,
  lorsqu'il recharge la page, ouvre la scène depuis un autre poste ou
  revient le lendemain sans que Mme Laurent ait rien fait, alors il ne peut
  toujours ni écrire dans S015 ni la remettre.
- **F08-AC10 — Les autres continuent :** dans la même situation, lorsque
  Alice continue d'écrire dans S015 et que Bilal ouvre S016, alors les
  enregistrements d'Alice aboutissent et Bilal écrit dans S016.
- **F08-AC11 — Rappel sans appel :** étant donné l'enregistrement de fin de
  plage de Bilal, à 16 h 30, qui rencontre un conflit sans que personne
  n'appelle l'enseignante, lorsque Mme Laurent ouvre le Suivi du projet,
  alors une ligne lui dit qu'un texte est gardé à part dans S015 et ouvre
  la scène sur ce texte ; aucun filtre du Suivi ne change.

**Décisions confirmées le 7 octobre 2026 — ce qui est gardé, ce que
l'élève lit, scène qui change d'état :**

- **Sans durée limite :** un texte gardé à part le reste jusqu'au geste de
  l'enseignant, comme un élément de la corbeille du projet. Un effacement
  automatique après un délai est écarté : il détruirait sans que personne
  ait décidé. Conséquence acceptée : un texte oublié laisse son élève
  arrêté sur cette scène.
- **« Ne plus garder ce texte » s'annule sur place**, tant que l'enseignant
  reste sur la page ; l'annulation rétablit le texte gardé à part et
  l'arrêt de l'élève. Ensuite le texte est effacé pour de bon : il ne va
  pas dans la corbeille du projet.
- **Après un échange,** l'ancien texte de la scène attend dans son onglet.
  Il n'arrête personne, mais compte dans la ligne du Suivi jusqu'à « Ne
  plus garder ce texte ». L'élève dont le texte est passé dans la scène
  retrouve l'écriture.
- **Plusieurs textes par scène :** chacun a son onglet ; chaque élève
  arrêté retrouve l'écriture quand son propre texte est traité.
- **Échange pendant qu'un autre élève écrit :** l'application ne sait pas
  qui tape et n'en avertit pas. L'enregistrement suivant de cet élève est
  refusé, selon la règle ordinaire : sa saisie est gardée à part et il est
  arrêté à son tour. Rien n'est perdu ; l'enseignant a un second conflit à
  régler.
- **L'élève qui revient avant le geste** (page rechargée, autre poste,
  séance suivante) voit le texte de la scène en lecture, sans son texte
  gardé à part, et une phrase qui lui dit que l'enseignant doit le
  regarder avant qu'il écrive ici. « Mon travail » porte la même phrase
  sur cette scène, sans bouton pour écrire.
- **Après le geste, l'élève ne lit rien de particulier :** il retrouve la
  scène, où il peut de nouveau écrire, avec le texte que l'enseignant y a
  laissé. L'explication est orale, comme toute demande de l'élève en
  première livraison (F07.2). Une note après le geste et la relecture par
  l'élève de son texte gardé à part sont écartées pour la première
  livraison.
- **Scène qui ne s'écrit plus :** quand l'enregistrement d'un élève est
  refusé parce que la scène a été remise, validée, déclarée prête ou prise
  par l'enseignant pendant qu'il tapait, ce qu'il n'avait pas enregistré
  est gardé à part de la même façon, et il est arrêté.
- **L'état reste libre :** l'enseignant choisit l'état qu'il veut,
  « Validé » et « Prête » compris, même si un texte est gardé à part ; le
  message au-dessus de la copie le lui dit, rien ne l'arrête. Suspendre ces
  deux états tant qu'un texte attend est écarté : l'enseignant a la main
  sur tout (F07.1).
- **Pas de retrait de la remise par l'élève arrêté :** « Modifier encore ce
  texte » ne lui est pas proposé sur cette scène ; les autres élèves du
  chapitre le gardent.

- **F08-AC12 — Gardé sans limite :** étant donné le texte de Bilal gardé à
  part le 6 octobre, lorsque Mme Laurent ouvre S015 trois semaines plus
  tard sans y avoir touché, alors l'onglet est toujours là, la ligne du
  Suivi aussi, et Bilal est toujours arrêté sur S015.
- **F08-AC13 — Annulation sur place :** étant donné « Ne plus garder ce
  texte » choisi à l'instant, lorsque Mme Laurent annule sans avoir quitté
  la page, alors l'onglet revient et Bilal est de nouveau arrêté ;
  lorsqu'elle a quitté la page, alors ce texte n'est plus proposé nulle
  part, corbeille du projet comprise.
- **F08-AC14 — Un élève, un texte :** étant donné S015 avec un texte de
  Bilal et un texte de Chloé gardés à part, lorsque Mme Laurent ne garde
  plus celui de Chloé, alors Chloé peut écrire dans S015 et Bilal reste
  arrêté.
- **F08-AC15 — Après l'échange :** étant donné le texte de Bilal mis dans
  la scène à la place de celui d'Alice, lorsque Mme Laurent revient au
  Suivi, alors la ligne signale encore un texte gardé à part dans S015,
  l'ancien texte de la scène ; Bilal peut écrire dans S015 et Alice aussi,
  tant qu'elle n'y avait rien de non enregistré.
- **F08-AC16 — Échange pendant qu'Alice tape :** étant donné Alice tapant
  dans S015, lorsque Mme Laurent y met le texte de Bilal, alors
  l'enregistrement suivant d'Alice ne remplace rien : sa saisie est gardée
  à part, elle est arrêtée et lit le message du conflit.
- **F08-AC17 — Retour avant le geste :** étant donné Bilal arrêté sur S015
  la veille, lorsqu'il ouvre « Mon travail » puis S015, alors il lit sur la
  scène que son texte est gardé à part et que Mme Laurent doit le regarder,
  voit le texte de la scène sans pouvoir l'écrire, et ne voit pas son texte
  gardé à part.
- **F08-AC18 — Après le geste :** étant donné le texte de Bilal traité par
  Mme Laurent, lorsque Bilal ouvre S015, alors il peut écrire dans le texte
  de la scène et aucun message ne lui dit ce qui a été décidé.
- **F08-AC19 — Scène remise entre-temps :** étant donné Alice et Bilal
  dans S015, lorsque Alice remet la scène à 10 h 40 et que Bilal tape
  encore une phrase, alors la scène est « À valider » avec le texte
  d'Alice, la phrase de Bilal est gardée à part, Bilal est arrêté, et
  « Modifier encore ce texte » ne lui est pas proposé.
- **F08-AC20 — État libre :** dans la même situation, lorsque Mme Laurent
  ouvre S015, alors elle lit qu'un texte de Bilal est gardé à part et peut
  choisir « Validé » sans l'avoir traité ; le texte de Bilal reste gardé à
  part et Bilal arrêté.

**Décisions confirmées le 7 octobre 2026 — texte de l'adulte refusé,
coupure de réseau, portée de l'échange :**

- **Quand c'est le texte de l'enseignant qui est refusé :** ses corrections
  deviennent un texte gardé à part comme un autre, dans son onglet (« Vos
  corrections, gardées à part mardi 6 octobre »), avec les deux mêmes
  gestes. Il n'est pas arrêté : « Texte de la scène » montre de nouveau le
  texte à jour, où il peut écrire aussitôt. L'état se choisit de nouveau
  dès que la page montre ce texte, avec la suspension ordinaire de F07.1
  pour « Validé » et « Prête ». L'arrêter lui aussi est écarté : cela
  bloquerait celui qui doit débloquer.
- **Conséquence acceptée :** s'il recolle ses corrections pendant que
  l'élève tape encore, c'est l'élève qui est arrêté à l'enregistrement
  suivant. Il n'y a pas de verrou ; mieux vaut corriger une scène « En
  cours » quand l'élève n'y est pas.
- **Page laissée ouverte après un échec :** elle réessaie d'elle-même tant
  qu'elle reste ouverte, sans nombre d'essais ni seuil. Au retour du
  réseau, le texte s'enregistre ; si la scène a changé entre-temps, il est
  gardé à part et suit les règles ci-dessus. La consigne en classe est de
  laisser le poste allumé sur cette page.
- **Page fermée ou poste éteint avant l'enregistrement :** le texte non
  enregistré est perdu, et l'application ne dit jamais le contraire.
- **L'échange est une retouche de l'enseignant :** l'état de la scène,
  l'élève qui s'en occupe et les remises ne changent pas ; l'enseignant
  change l'élève à la main s'il le veut.
- **Choix et images :** un texte gardé à part garde ses phrases de choix et
  ses images. Une fois mis dans la scène, ce sont eux qui font foi pour les
  chemins.
- **Nulle part ailleurs :** un texte gardé à part n'entre ni dans le livre
  et son aperçu, ni dans la lecture d'essai, ni dans les fiches de
  rédaction, ni dans une version partagée.
- **Le Livre ne le contrôle pas :** aucune tâche de « Relire » ne le
  signale, et le PDF définitif se crée même s'il en reste ; seule la ligne
  du Suivi le rappelle. Conséquence acceptée : le livre peut s'imprimer
  alors qu'un texte gardé à part a été oublié. Un avertissement dans
  « Relire », qui s'accepterait comme les autres, est écarté pour garder ce
  parcours court.
- **Fermeture horaire d'un élève arrêté :** il n'a rien à enregistrer, son
  texte étant déjà gardé ; l'accès se ferme normalement (F06.4) et il reste
  arrêté sur cette scène à la séance suivante.

- **F08-AC21 — Corrections de l'enseignante refusées :** étant donné Mme
  Laurent corrigeant S015 pendant qu'Alice y écrit, lorsque son
  enregistrement est refusé, alors ses corrections sont dans un onglet
  « Vos corrections, gardées à part… », « Texte de la scène » montre le
  texte d'Alice, elle peut y écrire et choisir l'état ; « Validé » lui
  demande d'abord de relire le texte, qui a changé.
- **F08-AC22 — Retour du réseau :** étant donné Bilal qui a continué
  d'écrire dix minutes sans réseau, page ouverte, et S015 que personne
  d'autre n'a modifiée, lorsque le réseau revient, alors son texte
  s'enregistre sans qu'il ait rien à faire et l'écran l'annonce.
- **F08-AC23 — Retour du réseau, scène modifiée entre-temps :** dans la
  même situation, si Mme Laurent a corrigé S015 pendant la coupure, lorsque
  le réseau revient, alors les dix minutes de Bilal sont gardées à part en
  entier, Bilal est arrêté et la ligne du Suivi le signale.
- **F08-AC24 — Page fermée sans réseau :** étant donné Bilal qui ferme la
  page pendant la coupure, lorsqu'il rouvre S015 le lendemain, alors la
  scène montre le dernier texte enregistré et rien n'annonce que ce qu'il
  avait tapé ensuite est gardé.
- **F08-AC25 — L'échange ne change que le texte :** étant donné S015
  « À valider », dont Alice s'occupe, avec sa remise du 5 octobre, lorsque
  Mme Laurent y met le texte de Bilal, alors la scène reste « À valider »,
  Alice reste indiquée et sa remise reste consultable telle quelle.
- **F08-AC26 — Choix du texte mis dans la scène :** étant donné le texte de
  Bilal gardé à part avec une phrase de choix vers S018, absente du texte
  de la scène, lorsque Mme Laurent le met dans la scène, alors « Chemins »
  montre le choix vers S018 ; avant ce geste, il ne le montrait pas.
- **F08-AC27 — Hors du livre :** étant donné un texte gardé à part dans
  S015, lorsque Mme Laurent parcourt « Relire » puis crée le PDF définitif,
  alors aucune tâche ne le signale, le PDF se crée et ne contient que le
  texte de la scène.
- **F08-AC28 — Fermeture d'un élève arrêté :** étant donné Bilal arrêté sur
  S015 à 16 h 25 et une plage qui finit à 16 h 30, lorsque l'heure arrive,
  alors l'écran de fermeture ordinaire s'affiche, sans alerte de texte non
  enregistré ; à la séance suivante, Bilal est toujours arrêté sur S015.

**Décisions confirmées le 7 octobre 2026, à la conception des écrans —
second échange, prise en charge pendant l'arrêt :**

- **Texte qui sort de la scène par un échange :** il s'appelle toujours
  « Ancien texte de la scène » et n'arrête personne, même quand un second
  échange fait ressortir le texte d'un élève. Le premier échange était le
  geste : l'arrêt de cet élève est fini. Alternative écartée : un retour
  exact, où le texte reprendrait le nom de l'élève et l'arrêterait de
  nouveau ; il faudrait retenir à qui était le texte, savoir s'il a changé
  entre les deux échanges, et dire quoi faire si l'élève a écrit
  entre-temps.
- **Prise en charge pendant l'arrêt :** sur la scène où il est arrêté,
  l'élève ne se voit proposer ni « M'occuper de cette scène » ni « Je ne
  m'en occupe plus » ([F06.3](#f063--prise-en-charge-et-signalement-du-travail)) ;
  il les retrouve après le geste. Motif : à côté de la phrase d'arrêt, ces
  commandes laissent croire qu'il va écrire. L'enseignant garde « qui s'en
  occupe ».

- **F08-AC30 — Second échange :** étant donné le texte de Bilal mis dans la
  scène, puis l'ancien texte de la scène remis dans la scène à son tour,
  lorsque Mme Laurent lit les onglets, alors le texte de Bilal est dans
  « Ancien texte de la scène, gardé à part… », Bilal peut écrire dans S015
  et la ligne du Suivi signale toujours un texte.
- **F08-AC31 — Pas de prise en charge pendant l'arrêt :** étant donné Bilal
  arrêté sur S015, dont Alice s'occupe, lorsqu'il ouvre S015, alors
  « M'occuper de cette scène » ne lui est pas proposé ; étant donné Alice
  arrêtée sur S015, dont elle s'occupe, alors « Je ne m'en occupe plus » ne
  lui est pas proposé.

**Proposition non décidée — garder aussi le texte sur le poste :** pour
qu'une page fermée pendant une coupure ne perde rien, le texte non
enregistré serait gardé sur le poste et renvoyé à la prochaine ouverture de
l'application sur ce poste. Rien n'est promis : la faisabilité est une
inconnue technique, à vérifier par un prototype qui n'est pas autorisé, et
deux faits d'usage ne sont pas renseignés — si les postes de l'école
effacent tout à l'extinction, et si la coupure en fin de séance est
arrivée souvent.

**Écrans :** dessinés dans la maquette de synthèse le 7 octobre 2026 et
décrits dans le [design](design.md#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026), avec le texte des messages, les adresses
qui les montrent et leurs limites. Ce sont des dispositions proposées, sans
retour du porteur à ce stade ; les deux décisions ci-dessus viennent de
leur conception.

**Questions ouvertes :**

- Scène supprimée ou déplacée, attribution du chapitre retirée, élève
  retiré de la classe, pendant qu'il tape ou alors qu'un texte est gardé à
  part : voir aussi F03.1.
- « Ne plus garder ce texte » annulé alors que l'élève a déjà recommencé
  d'écrire dans la scène.
- Phrase de choix copiée depuis un texte gardé à part et collée dans la
  scène, au regard des règles de copier-coller de F05.2.
- Nombre de textes gardés à part qu'une scène peut porter : les écrans en
  montrent deux et une remise, sans plafond décidé.
- Proposés avec les écrans, à confirmer : le nom « Ancien texte de la
  scène, gardé à part… », daté du jour de l'échange ; « Votre texte, gardé
  à part… » en mode personnel ; le texte des messages ; la scène à côté de
  l'aperçu, qui dit le texte gardé à part et renvoie à la page de la
  scène, sans onglet.
- Révélés par les écrans, proposés dans la maquette et à confirmer : la
  ligne de rappel n'est pas affichée dans le Suivi filtré sur les scènes à
  finir, comme celle des élèves sans chapitre (F06.5) ; après une remise
  qui a échoué, le texte s'enregistre au retour du réseau mais la remise
  reste à refaire par l'élève ; l'écran de fermeture d'un élève arrêté dit
  « Ton texte est gardé à part » à la place de « Tu le retrouveras
  demain », pour ne rien promettre (F08-AC03, F08-AC28) ; la validation
  suspendue après le conflit de l'enseignant se lève au second choix de
  l'état.
- Cadence de l'enregistrement automatique, qui n'est fixée nulle part : elle
  décide de ce qu'un texte gardé à part contient d'ordinaire.
- À vérifier techniquement, sans prototype autorisé : la conservation du
  texte gardé à part au moment même du refus et ce qui se passe si elle
  échoue ; l'échange fait d'un seul tenant alors que la scène change ; la
  garde sur le poste proposée ci-dessus.
- Historique des versions et autres incidents sans conflit, qui restent à
  spécifier pour F08.

**Variante personnelle :** l'auteur adulte règle lui-même son conflit,
notamment entre deux de ses sessions : le texte refusé est gardé à part
dans son onglet, avec les deux mêmes gestes, et il n'est pas arrêté. Il n'y
a pas de ligne de rappel décidée pour ce mode, dont le suivi reste ouvert
(F06.5).

- **F08-AC29 — Deux onglets du même auteur :** étant donné un auteur en
  mode personnel qui a ouvert S004 dans deux onglets et enregistré dans le
  premier, lorsqu'il tape dans le second, alors ce qu'il y tape est gardé à
  part, la scène garde le texte du premier, et il peut ne plus garder ce
  texte ou le mettre dans la scène.

Les règles du 7 octobre 2026 sont validées dans leur ensemble par le porteur
le même jour, avec leurs points différés. Aucun choix de bibliothèque ou de
protocole ne découle de ces décisions fonctionnelles. La soumission attend un enregistrement réussi selon F07.1.

## F09 — Test de lecture et cohérence du récit

### F09.1 — Playtest

**Objectif :** relire le récit en cours et éprouver ses enchaînements en
suivant les choix comme un lecteur, dans le périmètre de la personne qui teste.

**Décisions confirmées conservées :**

- Le playtest permet de lire des scènes et de jouer leurs choix, sans jamais
  donner accès à un chapitre non attribué, même sous un parent commun.
- La validation reste effectuée scène par scène selon F07.1. La lecture
  d'essai ne valide pas automatiquement les scènes.
- En récit classique, le test suit l'ordre narratif retenu en F03.1, sans
  choix artificiels entre les scènes.

**Décisions confirmées le 30 septembre 2026 — portée et déroulement :**

- **Élève :** il teste dans son périmètre d'accès, c'est-à-dire l'ensemble
  des chapitres qui lui sont attribués dans l'histoire, et part de la scène
  accessible de son choix. Il n'est pas limité au seul chapitre ouvert.
  Lorsque l'adulte a activé la lecture ouverte de l'histoire (F06.2), l'élève
  peut tester le livre entier depuis le départ, en lecture seule.
- **Sortie de périmètre :** un choix ou une liaison cachée qui mène hors du
  périmètre de l'élève interrompt le parcours avec une indication du type
  « La suite se trouve dans un chapitre que tu découvriras plus tard ». Le
  texte, le titre et le chapitre de destination ne sont pas révélés ; la sortie
  n'est pas présentée comme une fin. L'élève peut revenir au passage précédent.
- **Adulte :** l'adulte peut tester le livre entier, depuis la scène de départ
  ou depuis n'importe quelle scène.
- **Texte utilisé :** le test présente le texte courant des scènes, sans
  attendre leur validation ; une scène vide est présentée comme telle.
- **Liaisons cachées :** une liaison cachée de [F05.1](#f051--liaisons-cachées-par-énigme)
  est proposée sous le texte par une action distincte des choix, par exemple
  « Énigme — aller à la suite prévue ». Elle suit la même borne de périmètre
  que les choix pour l'élève.
- **Commandes de base :** revenir au passage précédent, consulter l'historique
  du parcours et y revenir à une étape, recommencer.

**Propositions non arbitrées :** lorsque la numérotation imprimée existe,
permettre aussi de saisir le numéro trouvé pour une énigme, comme le ferait
un lecteur. Permettre à l'adulte d'ouvrir une scène exclue du livre dans le
test, avec son statut signalé.

**Limites :** un parcours joué ne prouve pas que tous les chemins ont été
parcourus. Le playtest ne remplace pas les contrôles globaux de F09.2 ni la
relecture du PDF.

**Variantes :** en mode personnel, l'auteur dispose du test de l'adulte.
En récit classique, les liaisons cachées et les sorties par choix n'existent
pas : l'élève lit dans l'ordre du récit, borné à ses chapitres attribués.

**Critères d'acceptation :**

- **F09-AC01 — Choix interne autorisé :** étant donné A et B dans le même
  chapitre attribué, lorsqu'un élève active le choix de A vers B, alors il
  accède au texte de B.
- **F09-AC02 — Limite de lecture :** étant donné un choix vers un chapitre
  non attribué, même dans la même partie, lorsqu'un élève l'active, alors le
  texte de destination ne lui est pas révélé.
- **F09-AC03 — Test sans validation :** étant donné une scène non validée,
  lorsque l'enseignant termine une lecture d'essai la traversant, alors cette
  lecture ne modifie pas à elle seule son statut de validation.
- **F09-AC11 — Plusieurs chapitres attribués :** étant donné Alice attribuée
  aux chapitres « Le port » et « Le phare » de parties différentes, lorsqu'un
  choix du port mène au phare pendant son test, alors elle poursuit la lecture
  sans interruption.
- **F09-AC12 — Sortie sans révélation :** étant donné un choix menant à un
  chapitre non attribué à Alice, lorsqu'elle l'active, alors elle voit une
  indication de suite à découvrir, sans titre ni texte de destination, et
  peut revenir au passage précédent ; l'indication n'est pas présentée comme une fin.
- **F09-AC13 — Test complet de l'adulte :** étant donné « Les passeurs de
  brume », lorsque l'enseignant lance le test depuis le départ, alors il peut
  suivre les choix à travers les trois parties, puis recommencer ou revenir
  à une étape de son historique.
- **F09-AC14 — Énigme jouée :** étant donné une liaison cachée de A vers B,
  lorsque l'adulte teste A, alors une action distincte des choix lui permet
  de rejoindre B.

**Questions ouvertes :** présentation d'une destination absente ; repérage
des branches déjà parcourues ; articulation visuelle entre test, contrôles et PDF.

### F09.2 — Contrôles des chemins avant le PDF définitif

**Cadre acquis :** le brief prévoit de signaler les textes manquants, les
destinations invalides et les scènes inaccessibles. F03.2 définit le départ
du livre et les fins explicites ; F11.2 définit quelles scènes sont incluses
et distingue les usages du PDF.

**Décision confirmée le 30 septembre 2026 — gravité des contrôles :**

| Situation dans le livre à choix | Effet sur le PDF définitif | Motif |
| --- | --- | --- |
| Départ absent ou exclu du livre. | Bloque l'export définitif. | Le point de départ prévu n'est pas disponible au lecteur. |
| Choix d'une scène incluse sans destination, vers une scène supprimée ou exclue. | Bloque l'export définitif. | Le renvoi ne peut pas aboutir dans ce livre. |
| Scène incluse sans choix et sans repère de fin. | Bloque l'export définitif. | La lecture s'interrompt sans conclusion déclarée. |
| Scène incluse dont le texte est vide, même déclarée prête. | Bloque l'export définitif. | Le repère « prête » a pu être posé par erreur ; un passage vide ne peut pas être imprimé. |
| Scène incluse inaccessible depuis le départ. | Avertit sans bloquer. | Un raccord peut manquer ; un passage caché ou bonus peut aussi être intentionnel. |
| Ensemble de scènes accessibles depuis lequel aucune fin déclarée n'est atteignable. | Avertit sans bloquer. | Le lecteur peut rester enfermé dans le parcours ; l'adulte apprécie l'intention. |
| Scène incluse dont la seule suite est une liaison cachée (« sortie non assurée »). | Avertit sans bloquer. | Le lecteur qui ne résout pas l'énigme reste bloqué, surtout en ligne ; une énigme sans échappatoire peut aussi être voulue. |
| Boucle comportant une possibilité de rejoindre une fin. | Aucun signalement en elle-même. | Un retour en arrière peut être un choix narratif voulu. |
| Numéro fixé devenu impossible, qu'il vienne d'une liaison cachée ou de l'adulte. | Bloque l'export définitif. | L'énigme enverrait le lecteur vers un mauvais passage ; l'adulte a pu fixer un numéro pour une énigme écrite dans le texte (précisé le 3 octobre 2026). |
| Contenu qui dépasse des marges de la page (décision du 3 octobre 2026). | Avertit sans bloquer. | L'aperçu étant identique au PDF, l'adulte voit le défaut et en juge ; une détection peut se tromper. |
| Image manquante ou illisible dans une scène incluse (F10). | Bloque l'export définitif. | Le livre imprimé serait incomplet. |
| Image de résolution insuffisante (F10). | Avertit sans bloquer. | Un dessin d'élève peut être voulu tel quel. |

Dans ce tableau, un chemin désigne un choix ou une liaison cachée de F05.1.
La scène vide, les contrôles d'images et le contenu qui dépasse des marges
valent aussi pour le récit classique ; les autres lignes sont propres au
récit à choix. Ces contrôles s'appliquent de
la même façon en mode personnel et en mode classe.

**Décision confirmée — aucun contournement :** un problème bloquant ne peut
pas être ignoré pour obtenir un PDF annoncé comme définitif. L'adulte corrige
le raccord, précise une fin, complète le texte ou exclut explicitement un passage.
L'application ne supprime pas un choix, ne change pas sa destination et
n'exclut pas une scène automatiquement pour faire disparaître un problème.

**Décision confirmée le 3 octobre 2026 — avertissement accepté :** un
avertissement du tableau ci-dessus se corrige ou s'accepte (« C'est
voulu ») ; tant qu'il n'est ni l'un ni l'autre, « Mettre en page » ne
s'ouvre pas. Règles et durée de l'acceptation en
[F11.6](#f116--trois-temps-pour-préparer-le-livre).

**Décision confirmée le 4 octobre 2026 — scène à finir, contrôles
d'écriture reportés :** tant qu'une scène n'est pas déclarée prête pour le
livre, ses défauts d'écriture — texte vide, absence de choix et de fin,
choix sans destination — ne sont pas présentés comme des problèmes : elle
est déjà comptée parmi les scènes à finir, et ces points se règlent en la
terminant. Ils sont rappelés au moment de la déclarer prête
([F11.1](#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre))
et vérifiés ensuite. Les contrôles du plan — départ, passage inaccessible,
fin hors d'atteinte — restent actifs toute l'année. Rien ne change pour le
PDF définitif, qu'une scène non prête bloque déjà, ni pour le PDF de
travail, qui montre toujours ces points à leur place.

- **Motif :** en septembre, une scène que les élèves n'ont pas finie était
  affichée en rouge parmi les points à corriger, et une même scène figurait
  dans plusieurs listes.
- **Alternative écartée :** ne reporter que les scènes au texte vide, choix
  de la maquette du 3 octobre ; une scène commencée mais sans choix restait
  signalée comme une faute.

- **F09-AC16 — Scène à finir sans alerte :** étant donné S029, en cours
  d'écriture, qui n'a encore ni choix ni fin, lorsque l'adulte ouvre
  « Vérifier les chemins » en septembre, alors S029 n'y figure pas et reste
  comptée parmi les scènes à finir ; lorsqu'il la déclare prête sans y
  ajouter de choix, alors un rappel le lui dit avant la déclaration, puis
  « Cette scène est une impasse. » figure parmi les points à corriger.

**Décision confirmée — PDF de travail jamais bloqué par ces contrôles :**
le PDF de travail reste disponible malgré les problèmes ci-dessus. Il les
montre à leur place dans le texte (par exemple « → destination à définir »)
et commence par une page récapitulant les problèmes détectés, utile pour une
relecture sur papier. Il porte des marques visibles de document de travail
selon [F11.2](#f112--pdf-de-travail-et-pdf-définitif), afin de ne pas servir
de contournement au PDF définitif.

**Récupération :** présenter les scènes et les choix concernés, avec un accès
direct à chacun, pour permettre à l'adulte de les corriger.

**Critères d'acceptation :**

- **F09-AC04 — Destination exclue :** étant donné une scène incluse A dont
  un choix mène à B, lorsque l'adulte exclut B du livre, alors le PDF
  définitif est bloqué et le problème désigne le choix de A ; le choix n'est
  ni supprimé ni redirigé automatiquement.
- **F09-AC05 — Scène sans issue :** étant donné une scène incluse sans choix
  ni repère de fin, lorsque l'adulte demande le PDF définitif, alors l'export
  est refusé et la scène est signalée ; lorsqu'il la marque comme fin ou lui
  ajoute un choix valide, ce problème disparaît.
- **F09-AC06 — Scène prête mais vide :** étant donné une scène incluse
  déclarée prête dont le texte est vide, lorsque l'adulte demande le PDF
  définitif, alors l'export est refusé et la scène est signalée.
- **F09-AC07 — Passage inaccessible :** étant donné une scène incluse qu'aucun
  chemin ne permet d'atteindre depuis le départ, lorsque les autres conditions
  sont satisfaites, alors le PDF définitif reste possible et un avertissement
  désigne la scène, qui n'est pas exclue automatiquement.
- **F09-AC08 — Boucle sans alerte :** étant donné deux scènes qui renvoient
  l'une vers l'autre et dont l'une propose aussi un chemin vers une fin,
  lorsque les contrôles s'exécutent, alors la boucle n'est pas signalée.
- **F09-AC09 — Travail malgré les problèmes :** étant donné un livre dont le
  départ n'est pas désigné et dont un choix n'a pas de destination, lorsque
  l'enseignant demande un PDF de travail, alors il l'obtient avec une page
  récapitulative et l'indication du choix incomplet à sa place dans le texte.
- **F09-AC10 — Pas de contournement :** étant donné un problème bloquant,
  lorsque l'adulte cherche à obtenir le PDF définitif, alors aucune commande
  ne permet de l'exporter en ignorant ce problème.

- **F09-AC15 — Énigme sans issue de secours :** étant donné « La porte aux
  symboles », sans choix écrit et dotée d'une seule liaison cachée, lorsque
  les contrôles s'exécutent, alors un avertissement « sortie non assurée »
  désigne la scène sans bloquer le PDF définitif ni le partage ; lorsque
  l'adulte y ajoute le choix « Si tu n'as pas trouvé, rends-toi au… », alors
  l'avertissement disparaît. Aucun choix n'est ajouté automatiquement. Décidé
  le 1er octobre 2026 ; l'avertissement est rappelé au moment du partage
  selon [F12.1](#f121--partager-une-version-du-récit).

**Besoin confirmé le 30 septembre 2026 — liaisons non explicites :** certaines
scènes ne proposent pas de choix écrit vers la suite : le lecteur trouve où
poursuivre en résolvant une énigme, par exemple pour rejoindre le chapitre
suivant. Cette liaison n'apparaît pas dans le texte comme une option. Ses règles,
dont son effet sur ces contrôles, sont décidées en [F05.1](#f051--liaisons-cachées-par-énigme).

**Limites et questions ouvertes :** ces contrôles portent sur les chemins
déclarés, pas sur la qualité narrative ni sur une interprétation du texte.
Les règles de jeu (objets, compteurs, dés) ne sont pas contrôlées : objets,
feuille d'aventure et actions de jeu sont décidés sans vérification en
[F04.2](#f042--objets-de-lhistoire). Les fins
portant des choix sont admises selon F11.5 ; les contrôles d'images suivent F10.

## F10 — Illustrations

**Périmètre confirmé pour la première livraison :** l'import et le placement
d'images facultatives prévus au brief sont conservés. Ils permettent notamment
d'utiliser des dessins numérisés, des images préparées ailleurs ou des
illustrations générées avec un outil externe. La génération d'illustrations
par IA directement dans l'application est reportée après cette première livraison.

**Responsabilité confirmée :** dans le mode classe, l'enseignant importe et
place les illustrations pour cette première livraison. Les élèves peuvent
contribuer par leurs dessins sur papier, que l'enseignant numérise puis importe.
Les profils de participation de F06 ne leur donnent pas de droit direct
d'import ou de placement des images. Dans le mode personnel, l'auteur adulte
assure ces opérations.

**Critères d'acceptation :**

- **F10-AC01 — Image préparée ailleurs :** étant donné une illustration dans
  un format pris en charge, lorsque l'enseignant l'importe et la place dans
  une scène, alors elle est utilisable dans le récit sans passer par une
  génération d'image intégrée.
- **F10-AC02 — Illustration apportée par un élève :** étant donné un élève
  chargé d'un chapitre, lorsque son dessin est retenu pour une scène, alors
  l'enseignant peut en importer et placer la version numérisée ; l'attribution
  du chapitre à cet élève ne lui donne pas elle-même ces droits dans l'application.

**Décisions confirmées le 30 septembre 2026 — placement et contrôles des images :**

- **Placement :** une image placée dans le texte reçoit une largeur parmi
  petite, moyenne et pleine largeur, ou une largeur personnalisée exprimée en
  pourcentage de la largeur du texte. Elle peut aussi occuper une pleine page,
  à l'intérieur des marges selon F11.3.
- **Image manquante ou illisible** dans une scène incluse : bloque le PDF
  définitif ; elle est signalée dans l'aperçu et le PDF de travail.
- **Résolution insuffisante** pour la taille imprimée : avertit sans bloquer.
  Un dessin d'élève photographié peut être voulu tel quel ; l'adulte en juge.
  Le seuil exact, de l'ordre de 200 à 300 points par pouce, sera fixé techniquement.
- **Image trop grande pour la page :** réduite automatiquement, sans avertissement,
  lorsque sa largeur est l'une des trois largeurs proposées. Lorsque l'adulte
  a réglé lui-même la largeur, la réduction est indiquée dans les contrôles du
  livre, en « à savoir », sans blocage (décision du 3 octobre 2026).

Ces règles valent pour les quatre combinaisons de modes.

- **F10-AC13 — Largeur personnalisée :** étant donné une image placée à 60 %
  de la largeur du texte, lorsque le livre est composé, alors elle occupe
  cette largeur, dans l'aperçu comme dans les PDF.
- **F10-AC14 — Image manquante :** étant donné une scène incluse dont le
  fichier d'image n'est plus disponible, lorsque l'adulte demande le PDF
  définitif, alors l'export est refusé et la scène est signalée ; le PDF de
  travail reste possible avec l'indication à la place de l'image.
- **F10-AC15 — Dessin peu défini :** étant donné un dessin numérisé en basse
  résolution, lorsque les contrôles s'exécutent, alors un avertissement
  désigne l'image sans bloquer le PDF définitif.

**Besoin exprimé par le porteur, 3 octobre 2026 — image en ligne :** une
petite image posée sur la ligne d'écriture, en plus de l'image en bloc.
Retour d'usage : cette possibilité lui a manqué dans ses livres.

- **Décision confirmée le 3 octobre 2026 — première livraison :** l'image en
  ligne en fait partie. Comme l'image en bloc, elle est importée et posée par
  l'enseignant en mode classe, par l'auteur adulte en mode personnel ; les
  profils de participation de F06 ne donnent pas ce droit aux élèves.

- **Décision confirmée le 3 octobre 2026 — suppression par l'élève :** une
  image en ligne se trouve dans un paragraphe que l'élève modifie ; il peut
  la supprimer en modifiant ce paragraphe. Aucune protection à l'intérieur
  d'un paragraphe n'est ajoutée ; l'enseignant garde le paragraphe protégé de
  F06.1 s'il veut la préserver.
- **Décision confirmée le 3 octobre 2026 — taille et usages :** l'image en
  ligne a la hauteur du texte, sans réglage de taille ; une image plus grande
  se place en bloc. Usages cités par le porteur : accompagner un objet obtenu,
  montrer un symbole à repérer dans une énigme.
- **Décision confirmée le 3 octobre 2026 — paragraphes admis :** l'image en
  ligne est admise dans les paragraphes de récit, dans l'action de jeu et
  dans une phrase de choix personnalisée (« Si tu choisis la porte ☾,
  rends-toi au 14 »). Elle ne l'est ni dans une phrase de choix automatique
  ni dans un libellé de choix, qui reste du texte pour le graphe, la
  recherche et l'aide de F13.3. Conséquences, tirées des règles existantes :
  lorsque la phrase personnalisée tient lieu de libellé selon
  [F05](#f05--retrouver-les-scènes-et-relier-les-choix), l'image n'y figure
  pas ; « Revenir à la phrase automatique » la retire avec le texte écrit à
  la main, après l'avertissement prévu et de façon annulable ; qui a le droit
  de modifier la phrase peut supprimer l'image, l'adulte seul la pose.
  Les pages de présentation, par exemple une légende de symboles dans les
  règles du jeu, restent à décider.
- **À spécifier :** commande de pose, effet d'un collage par un élève,
  sortie en texte simple et texte de remplacement. Elle étend la
  règle de F05.2 selon laquelle seule une phrase de choix porte un élément
  insécable.
- **Éprouvé le 3 octobre 2026 par le prototype PDF :** interlignage inchangé
  dans le livre, dans l'aperçu comme dans le PDF, pour une image haute de
  4,2 mm dans un texte en corps 12 ; voir
  [l'architecture](architecture.md#résultats-du-prototype-pdf-3-octobre-2026).
  Le porteur juge la lisibilité d'un symbole à cette taille satisfaisante
  le 3 octobre 2026, sur le PDF du prototype.

**Décision confirmée le 3 octobre 2026 — définition conservée des images :**
à l'import, l'application peut réduire une image jusqu'à la définition
qu'exige son plus grand emploi possible dans le format du livre, pleine
largeur ou pleine page, et pas en dessous : l'adulte garde la possibilité de
changer ensuite sa largeur sans perte. Une image en ligne, imprimée à la
hauteur du texte, peut être réduite davantage, en gardant une marge pour le
cas où la taille du texte ou l'interligne du livre se régleraient. Les
valeurs sont fixées techniquement, avec le seuil de résolution ci-dessus.
Cette règle vaut pour les quatre combinaisons de modes.

- **F10-AC16 — Largeur modifiable sans perte :** étant donné une photographie
  de 4 000 points de large importée puis placée en petite largeur, lorsque
  l'adulte la passe en pleine largeur, alors elle s'imprime sans
  avertissement de résolution.

**Décision confirmée le 3 octobre 2026 — largeur réglée qui ne tient pas :**
le prototype PDF a signalé que la réduction « sans avertissement » contredisait
F11-AC11 pour une largeur réglée par l'adulte. L'image est réduite pour tenir
dans la page et les contrôles du livre l'indiquent en « à savoir », avec la
largeur demandée et la largeur obtenue ; ni le PDF définitif ni le partage ne
sont bloqués. Une image placée en petite, moyenne ou pleine largeur reste
réduite sans indication.

- **F10-AC17 — Largeur réglée réduite :** étant donné un dessin en hauteur
  réglé à 95 % de la largeur du texte et qui ne tient qu'à 93 %, lorsque le
  livre est composé, alors l'image est imprimée à 93 % et les contrôles
  l'indiquent en « à savoir » ; le PDF définitif reste possible. Le même
  dessin placé en pleine largeur est réduit sans indication.

**Décision confirmée le 3 octobre 2026 — l'image reste où l'auteur l'a
posée :** la composition ne déplace jamais une image par rapport au texte de
sa scène et ne la réduit pas pour la faire tenir en bas d'une page.

- **Image pleine page :** elle occupe seule la page qui suit l'endroit où
  elle est posée ; le texte reprend sur la page d'après. La page qui la
  précède garde le blanc qui lui reste.
- **Image en bloc qui ne tient pas en bas de page :** elle passe entière en
  tête de la page suivante ; le texte qui la suit dans la scène ne remonte
  pas avant elle.
- **Image pleine page posée juste avant des choix :** les choix s'impriment
  en tête de la page suivante, séparés de leur texte. C'est la disposition
  demandée ; l'adulte qui veut l'éviter pose l'image après les choix.
- **Justification :** retour d'usage du porteur, la V0 laissait l'image à sa
  place et cela convenait. Un report automatique du texte autour de l'image a
  été proposé puis écarté : il changerait la disposition voulue par l'auteur
  et le moteur retenu ne le fait pas seul. Le blanc se réduit par les
  commandes de l'aperçu décrites en
  [F11.3](#f113--présentation-commune-du-livre).

Ces règles valent pour les quatre combinaisons de modes.

- **F10-AC18 — Image reportée, texte en place :** étant donné une image de
  75 mm de haut posée entre deux paragraphes de S001 et 60 mm libres en bas
  de la page 6, lorsque le livre est composé, alors l'image est en tête de la
  page 7, le paragraphe qui la suit vient après elle et la page 6 garde son
  blanc.
- **F10-AC19 — Pleine page avant des choix :** étant donné une image pleine
  page posée dans S023 entre le dernier paragraphe et deux phrases de choix,
  lorsque le livre est composé, alors l'image occupe seule une page et les
  deux choix ouvrent la page suivante ; posée après les choix, elle les
  laisse sur la page de leur texte.
- **F10-AC20 — Symbole dans une phrase personnalisée :** étant donné la
  phrase personnalisée « Si tu choisis la porte ☾, rends-toi au [B] », où ☾
  est une image en ligne, lorsque le livre est composé puis partagé, alors le
  symbole figure dans la phrase, dans le PDF comme dans le lecteur en ligne,
  et le graphe désigne ce choix par son libellé, sans image.

**Questions ouvertes :** image importée pour un emploi en ligne puis placée
en bloc. Images utilisées pour les consignes et pour le livre. Formats, dimensions,
limites d'import et incidents
seront détaillés avant réalisation. L'import concerne aussi le mode personnel
et le récit classique ; l'absence d'image ne bloque pas à elle seule une scène.

### F10.1 — Images de repérage du projet

**Besoin confirmé :** reconnaître facilement une
histoire, ses parties et ses chapitres et disposer d'un espace de travail visuellement
lié au projet. Le porteur rapporte qu'il importait des images pour ce
repérage en V0 ; ce retour d'usage ne prescrit aucune reprise technique.

**Décision confirmée :** permettre à l'adulte de désigner une image de
repérage stable pour l'histoire, les parties et les chapitres, sans
obligation d'import à aucun de ces niveaux.
L'adulte peut réutiliser une image déjà importée ou en importer une pour cet
usage. Le repère reste associé au même objet jusqu'à son remplacement
explicite, sans tirage aléatoire à chaque visite. En l'absence d'image choisie,
un visuel fourni par l'application accompagne le titre ; depuis le 6 octobre
2026, il évite, tant que la bibliothèque le permet, un visuel déjà donné à
un chapitre de la même partie. Le choix d'une image
n'est pas nécessaire pour préparer ou écrire. Cette possibilité concerne les
modes personnel et classe, en récit classique comme à choix.

**Distinctions confirmées :** réutiliser un fichier ne confond pas ses usages.
Choisir une image pour l'interface ne l'ajoute pas au texte, à la couverture
ou au PDF ; une illustration du livre ne devient pas automatiquement un
décor. Les images choisies comme repères sur les cartes sont visibles par les
élèves du projet, indépendamment de leurs attributions. Les autres images
contenues dans les scènes non accessibles ne deviennent pas visibles pour
autant. La sélection explicite d'un repère reste distincte de l'import d'une
illustration dans une scène.

**Critères d'acceptation :**

- **F10-AC03 — Repère stable :** étant donné une image choisie pour le
  chapitre « La forêt », lorsque l'utilisateur quitte puis rouvre ce
  chapitre sans remplacement de l'image, alors il retrouve le même repère.
- **F10-AC04 — Projet sans image :** étant donné un projet sans image
  désignée, lorsque l'adulte le prépare ou qu'un élève autorisé y écrit,
  alors un visuel par défaut accompagne le titre sans imposer d'import.
- **F10-AC05 — Réutilisation sans insertion dans le livre :** étant donné
  une image déjà importée, lorsque l'adulte la choisit comme repère du
  chapitre, alors il n'a pas à l'importer à nouveau et cette action ne
  l'insère pas dans le texte ou le PDF.
- **F10-AC06 — Image de carte et illustration de scène distinctes :** étant
  donné un chapitre non attribué à Alice avec une image de repérage et
  une autre illustration dans une scène, lorsqu'elle consulte sa carte,
  alors elle voit le repère choisi mais ne reçoit pas l'illustration de scène.

**Approfondissements différés :** commandes de sélection et de remplacement,
réutilisation explicite d'une même image à plusieurs niveaux, suppression et
récupération si une image manque. Les cartes sans image utilisent le visuel
par défaut ; l'attribution n'influence pas ce choix. La présentation et la
couleur du chapitre sont dans [le design](design.md#images-du-projet-et-repérage).
La palette exacte reste à éprouver sur les maquettes.

### F10.2 — Aide à l'illustration par prompts

**Besoin confirmé le 30 septembre 2026 :** aider à obtenir des illustrations
cohérentes d'un bout à l'autre du livre, sans générer d'image dans
l'application. L'aide produit un prompt précis, prêt à copier dans l'outil
de génération externe choisi par l'adulte. L'image obtenue est ensuite importée
et placée selon F10. Cette aide ne remet pas en cause le report de la
génération intégrée. Elle fait partie de la première livraison, sur décision
du porteur du 30 septembre 2026.

**Décisions confirmées :**

- **Style de l'histoire :** l'adulte choisit un style parmi une liste prédéfinie.
  Le style reste celui du projet jusqu'à son remplacement explicite, comme les
  repères de F10.1, et tous les prompts proposés le reprennent.
- **Héros absent des images, réglage activé par défaut :** pour éviter qu'il
  change d'apparence d'une image à l'autre, les prompts proposés ne représentent
  pas le héros. L'adulte peut désactiver ce réglage dans les options du projet,
  par exemple en mode personnel ou pour un récit classique à la troisième
  personne ; le réglage s'applique alors à tous les prompts suivants. Lorsqu'il
  agit, seules ses mains peuvent apparaître, aussi neutres que possible :
  sans signe distinctif d'âge, de genre, de vêtement ou de couleur de peau
  lorsque la scène le permet. Cette règle reprend la pratique du porteur dans ses livres.
- **Idée d'illustration de l'élève :** l'élève peut décrire en quelques mots
  l'image qu'il imagine. L'IA transforme ensuite cette idée en prompt précis.
  La demande à l'IA relève de l'adulte, conformément à l'orientation du brief :
  l'élève écrit son idée, mais ne dispose d'aucune commande IA. L'adulte peut
  aussi rédiger lui-même l'idée, par exemple en reprenant une proposition orale de la classe.
- **Accès discret :** l'aide reste secondaire dans l'interface. Un bouton
  visible mais discret en ouvre le détail. Fermée par défaut, elle ne gêne pas
  la rédaction, la relecture ni la lecture de la consigne. Sa présentation est
  décrite dans [le design](design.md#images-du-projet-et-repérage).

**Parcours proposé :**

1. L'élève ou l'adulte ouvre l'aide depuis une scène ou un chapitre et écrit
   l'idée d'illustration.
2. L'adulte demande un prompt amélioré. L'application transmet l'idée, le style
   du projet, le réglage d'absence du héros et le contexte autorisé du lieu ou de
   la scène.
3. L'adulte relit le prompt, peut le retoucher, puis le copie en une action.
4. Il génère l'image dans son outil externe, puis l'importe et la place selon F10.

**Propositions :**

- Sans IA, en cas d'indisponibilité ou de quota atteint, l'application
  assemble un prompt simple à partir de l'idée, du style et de la règle
  d'absence du héros. Ce repli respecte le principe du brief : l'application
  fonctionne sans IA.
- Proposer 4 à 6 styles décrits par leur technique (« aquarelle douce »,
  « illustration 2D en aplats »…), jamais par le nom d'un artiste ou d'un studio.
- Adapter le cadrage du prompt à l'usage prévu : illustration de scène en
  pleine page ou demi-page, bandeau de repérage du chapitre.
- Conserver la dernière idée et le dernier prompt attachés à la scène ou au
  chapitre, pour les reprendre plus tard.
- Présenter l'idée d'illustration comme un exercice de description : écrire
  précisément un lieu, un objet ou une ambiance est un objectif d'écriture en soi.

**Décision confirmée le 30 septembre 2026 — illustration de couverture :**
l'aide propose un cadrage « illustration de couverture » au format du livre,
qui remplace pour la première livraison l'assemblage de couverture reporté
en [F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture).

**Critères d'acceptation sur les éléments confirmés :**

- **F10-AC07 — Prompt prêt à copier :** étant donné un projet au style
  « aquarelle douce » et l'idée « la grotte avec des cristaux bleus »,
  lorsque l'adulte demande un prompt amélioré, alors il reçoit un texte
  unique décrivant la grotte dans ce style, qu'il peut retoucher puis copier
  en une action. Rien n'est inséré dans la scène, le livre ni le PDF.
- **F10-AC08 — Héros absent :** étant donné l'idée « je pousse la porte du
  château », lorsque l'adulte obtient le prompt, alors celui-ci décrit la
  porte et le lieu. Il ne décrit ni le visage ni le corps du héros ; au
  plus, des mains neutres poussent la porte.
- **F10-AC09 — Style commun :** étant donné un style choisi pour le projet,
  lorsque l'adulte obtient des prompts pour deux chapitres différents,
  alors ces deux prompts reprennent la même description de style.
- **F10-AC10 — Idée d'élève sans commande IA :** étant donné un élève qui
  écrit une idée d'illustration pour une scène accessible, lorsqu'il l'enregistre,
  alors aucune commande IA ne lui est proposée ; l'adulte retrouve cette idée
  et peut en demander le prompt amélioré.
- **F10-AC11 — Aide discrète :** étant donné une scène ouverte pour la
  rédaction, lorsque l'élève ou l'adulte n'a pas ouvert l'aide, alors
  celle-ci reste fermée, ne masque ni le texte ni la consigne et reste
  accessible par un bouton, y compris au clavier.
- **F10-AC12 — Réglage désactivé :** étant donné un projet où l'adulte a
  désactivé le réglage d'absence du héros, lorsqu'il obtient un prompt, alors
  ce prompt n'exclut plus le héros ; un nouveau projet conserve le réglage
  activé par défaut.

**Questions ouvertes :**

- Liste exacte des styles et possibilité d'un style libre décrit par l'adulte.

**Approfondissement différé à la demande du porteur :** traitement des
personnages récurrents autres que le héros (exclusion, courte description
visuelle fixée dans la préparation de F02 ou tolérance aux écarts).
- Représentation du héros lorsque le réglage est désactivé : description
  visuelle éventuelle et moyen d'en garder la cohérence.
- Droits de l'élève sur l'idée d'illustration : scènes concernées, place de
  cette idée dans la soumission de F07.1 et possibilité de la saisir sur la
  fiche papier de F07.4.
- Langue du prompt : le français est plus lisible pour l'adulte, l'anglais
  parfois mieux compris par les outils de génération.

## F11 — Composition et préparation du livre

### F11.1 — Distinguer travail élève terminé et scène prête pour le livre

**Besoin confirmé :** l'enseignant doit pouvoir distinguer et filtrer les
scènes dont le travail élève est validé et celles dont l'ensemble est prêt
pour le livre. Une scène peut avoir terminé le parcours de rédaction tout
en nécessitant des finitions sur le texte, les illustrations, les choix ou
la présentation.

La validation du travail élève relève de F07.1 et interdit sa reprise autonome.
Elle ne constitue pas à elle seule une approbation de tous les éléments de
la scène pour l'impression. Les images restent facultatives selon le brief ;
les choix n'existent que dans les récits à choix. La préparation ne doit pas
imposer des éléments qui ne sont pas prévus pour la scène ou le mode utilisé.

**Décision confirmée — maintien du statut après retouche :** lorsque
l'enseignant modifie une scène déjà déclarée prête pour le livre, elle conserve
ce statut. Une retouche du texte, d'une illustration, des choix ou de la
présentation n'impose pas de nouvelle approbation locale et ne retire pas la
validation du travail élève. Elle ne rouvre pas non plus son droit d'écriture.
La réouverture explicite du travail élève suit le nouveau cycle de reprise
défini en F07.1.

**Décision confirmée le 30 septembre 2026 — réouverture et changement global :**
la réouverture du travail élève retire le repère « prête pour le livre » : les
élèves vont réécrire la scène, qui redevient à finir après sa nouvelle
validation. Le PDF définitif est donc bloqué jusqu'à une nouvelle déclaration.
À l'inverse, un changement global de présentation (police, format, impression
des titres de partie) ne retire ce repère d'aucune scène ; son effet se vérifie
en relisant le PDF du livre.

**Justification :** l'enseignant vérifie ses retouches au moment de les faire.
Le statut exprime son appréciation de la préparation de la scène ; il ne
garantit pas automatiquement la cohérence du livre après toute modification.
Les conditions d'export du livre assemblé restent distinctes, selon F11.2.

**Décision confirmée — scènes écrites directement par l'adulte :** en mode
personnel, l'auteur rédige, assure les finitions et conserve le repère
« prête pour le livre », sans soumission à soi-même, demande de reprise ni
validation de travail élève. Ce parcours s'applique aussi à une scène
entièrement rédigée par l'enseignant dans un projet de classe, sans travail
élève à approuver. Corriger un texte soumis par un élève ne fait pas
disparaître le circuit de F07. Les deux usages du PDF restent ceux de F11.2.

**Décision confirmée le 3 octobre 2026 — où déclarer une scène prête :** le
geste se trouve dans la scène elle-même, donc aussi lorsqu'elle est ouverte
à côté de l'aperçu du livre : l'adulte vient de la lire et de la corriger.
Le Suivi donne la vue d'ensemble et le filtre des scènes à finir, vers
lequel renvoie le temps « Relire » de
[F11.6](#f116--trois-temps-pour-préparer-le-livre). Le porteur l'envisageait
d'abord dans le seul Suivi.

**Décisions confirmées le 4 octobre 2026, après la critique de la page de
scène :**

- **Libellés des deux jalons :** « Validé » et « Prête », seuls noms à
  l'écran, les mêmes dans la scène, le Suivi, les scènes voisines et le
  Livre. « Travail élève validé — finitions en cours » et « Prête pour le
  livre », proposés d'abord, ne sont pas retenus comme libellés d'état :
  trop longs, et la page disait une chose et le Suivi une autre. « Texte
  validé », envisagé par le porteur, est écarté : entre les deux jalons,
  c'est justement le texte que l'adulte retouche encore. La différence se
  dit là où l'on choisit l'état.
- **Forme du geste :** « Prête » est l'un des états que l'adulte choisit
  depuis la commande d'état de la scène
  ([F07.1](#f071--du-travail-préparatoire-au-travail-élève-validé)), la même
  dans la page de scène et dans la scène ouverte à côté de l'aperçu, dont le
  bouton « Déclarer prête » est remplacé. Idée du porteur : l'état se
  change là où il se lit, sur son tampon. Deux boutons de libellés
  différents faisaient jusque-là la même chose selon l'entrée.
- **« Prête » se retire :** l'adulte peut revenir de « Prête » à
  « Validé », ou à tout autre état, sans rouvrir pour autant le travail de
  l'élève. Le PDF définitif est alors bloqué jusqu'à une nouvelle
  déclaration, comme après une réouverture.
- **Scène sans élève, en projet de classe :** trois états, « En cours »,
  « Validé » et « Prête ». « Validé » y dit que le texte est terminé alors
  qu'il reste à finir la scène, par exemple son image : l'enseignant peut
  avoir écrit le texte lui-même sans avoir terminé l'illustration. Cela
  complète le parcours adulte ci-dessus, qui ne connaissait que le repère
  « prête ». L'enseignant peut aussi s'attribuer une scène :
  [F06.3](#f063--prise-en-charge-et-signalement-du-travail). Le mode
  personnel garde ses deux états, « En cours » et « Prête » (confirmé le
  4 octobre 2026) ; « Validé » n'y est pas décidé.

La distinction et le filtrage des deux jalons restent acquis ; cela n'impose
pas deux circuits indépendants de validation ni une organisation technique
particulière.

**Critères d'acceptation sur les éléments confirmés :**

- **F11-AC01 — Finitions encore à faire :** étant donné une scène A dont le
  travail élève est validé mais dont l'enseignant doit encore préparer
  l'illustration prévue, et une scène B entièrement préparée, lorsqu'il
  consulte l'avancement, alors il peut distinguer A de B et retrouver les
  scènes dont le travail élève est terminé mais les finitions restent à faire.
  L'absence de finitions terminées sur A ne rend pas à l'élève son droit de
  retirer seul la soumission.
- **F11-AC02 — Retouche sans changement de statut :** étant donné une scène
  dont le travail élève est validé et qui est déclarée prête pour le livre,
  lorsque l'enseignant modifie puis enregistre son texte ou sa présentation,
  alors elle reste déclarée prête et l'élève ne peut toujours pas la reprendre
  seul. Aucune nouvelle approbation locale n'est exigée par cette retouche.
- **F11-AC24 — Réouverture d'une scène prête :** étant donné une scène
  déclarée prête dont le travail élève était validé, lorsque l'enseignant
  rouvre ce travail, alors la scène n'est plus déclarée prête et le PDF
  définitif est bloqué jusqu'à sa nouvelle déclaration.
- **F11-AC25 — Changement global sans perte du repère :** étant donné des
  scènes déclarées prêtes, lorsque l'adulte change la police du livre, alors
  elles restent déclarées prêtes.
- **F11-AC13 — Préparation personnelle sans soumission :** étant donné une
  scène rédigée par l'auteur adulte en mode personnel, lorsqu'il en termine
  les finitions, alors il peut la déclarer prête pour le livre sans passer
  par une soumission ou une validation de travail élève.
- **F11-AC14 — Scène de liaison rédigée par l'enseignant :** étant donné un
  projet de classe comportant des contributions d'élèves et une scène de
  liaison entièrement écrite par l'enseignant, lorsqu'il prépare le livre,
  alors cette scène suit le parcours adulte sans attribution ni soumission
  élève fictive. Les contributions d'élèves conservent leur propre circuit
  de validation, y compris si l'enseignant en a corrigé le texte.
- **F11-AC93 — Retirer « Prête » :** étant donné S014 déclarée prête par
  erreur, lorsque l'enseignant choisit l'état « Validé », alors la scène
  n'est plus prête, elle compte de nouveau parmi les scènes à finir, et
  Inès ne peut toujours pas la reprendre seule.
- **F11-AC94 — Texte fini, image à faire :** étant donné S060, écrite par
  l'enseignant dans un chapitre non attribué, dont l'illustration reste à
  faire, lorsqu'il ouvre la commande d'état, alors « En cours », « Validé »
  et « Prête » lui sont proposés, sans « À valider » ni « À reprendre » ;
  lorsqu'il choisit « Validé », alors la scène reste à finir pour le livre.
- **F11-AC95 — Un seul geste, deux endroits :** étant donné S060 ouverte à
  côté de l'aperçu du livre, lorsque l'adulte veut la déclarer prête, alors
  il le fait par la même commande d'état que dans la page de la scène.

**Limite à conserver :** une approbation locale de scène ne garantit pas à
elle seule la pagination, les renvois et le résultat visuel du livre assemblé.
La prévisualisation et les vérifications du PDF complet restent à spécifier.

**Questions ouvertes :**

- Libellés et commande de passage à « prête » : décidés le 4 octobre 2026,
  ci-dessus. Le bouton V0 « Valider tel quel », dont la conception était
  différée, n'est pas repris ; le choix direct de l'état permet de passer
  d'un geste de « À valider » à « Prête ».
- « Validé » pour une scène écrite par l'auteur en mode personnel : non
  décidé ; le mode personnel garde deux états pour l'instant.
- La déclaration « prête » reste une appréciation de l'adulte ; le texte vide
  et les images manquantes sont contrôlés pour le livre entier (F09.2, F10).
  Depuis le 4 octobre 2026, la déclaration rappelle les défauts d'écriture
  de la scène (ni choix ni fin, choix sans destination), sans l'empêcher :
  voir [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif).
  Confirmé le 4 octobre 2026 : le rappel s'affiche sur place, sans fenêtre,
  avec « Déclarer prête » et « Pas maintenant », dans la page de la scène
  comme à côté de l'aperçu.
- Choisir « Prête » juste après avoir validé ne doit pas se faire par
  mégarde : un second clic immédiat au même endroit est ignoré (confirmé le
  4 octobre 2026).
- Conservation du texte au moment où le travail élève a été validé, en plus
  des remises déjà conservées, avant les nouvelles finitions de l'enseignant.
- Passage ultérieur d'une scène écrite par l'adulte à un travail demandé aux
  élèves, si ce besoin se présente ; le parcours sans travail élève est acquis.

### F11.2 — PDF de travail et PDF définitif

**Objectif :** permettre une relecture sur papier avant la fin du projet, puis
un export destiné à l'impression du livre terminé.

**Décisions confirmées :**

- Un PDF de travail reste possible alors que des scènes ne sont pas encore
  déclarées prêtes pour le livre. Leur avancement ne suffit pas à bloquer cet export.
- Un export annoncé comme définitif exige que toutes les scènes utilisées
  dans le livre soient déclarées prêtes et que les vérifications globales
  requises soient satisfaites. Le contenu exact de ces vérifications reste ouvert.
- Une scène non utilisée dans le livre ne bloque pas l'export définitif du
  seul fait qu'elle n'est pas prête.
- **Ajout du 3 octobre 2026 :** le PDF définitif se demande depuis l'étape
  « Imprimer et partager », ouverte lorsque l'adulte a déclaré « La mise en
  page me convient » selon
  [F11.6](#f116--trois-temps-pour-préparer-le-livre). Cette déclaration
  s'ajoute donc aux conditions ci-dessus.
- Toutes les scènes sont incluses dans le livre par défaut. L'adulte peut
  explicitement en exclure une : l'enseignant en mode classe, l'auteur en
  mode personnel. Cette scène reste conservée dans le projet avec son travail.
- Une scène inaccessible par les choix est signalée ; elle n'est jamais
  exclue automatiquement. L'absence de raccord ne suffit pas à conclure
  que l'adulte souhaite écarter ce passage.

**Décision confirmée le 30 septembre 2026 — marques du PDF de travail :**
le PDF de travail se distingue visiblement du PDF définitif. Il porte la
mention « Version de travail », imprime à côté de chaque numéro de passage la
référence stable de la scène (par exemple S042) et signale à leur place les
problèmes des contrôles de [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif),
récapitulés sur une première page. Les annotations faites sur papier restent
ainsi retrouvables même si les numéros changent au réexport, et ce document
ne peut pas tenir lieu de livre définitif. Le PDF définitif ne porte aucune
de ces marques. Cette règle vaut pour les quatre combinaisons de modes ; en
récit classique, la référence stable accompagne le début de chaque scène.

**Décisions confirmées le 30 septembre 2026 — export et suite du PDF définitif :**

- **Instantané :** un export porte sur l'état du contenu au moment de la
  demande. Ses contrôles et son rendu utilisent ce même état ; une modification
  faite pendant le calcul n'y figure pas. La date de cet état est indiquée.
- **Fichier inchangé :** un PDF définitif produit ne change plus. Le contenu du
  projet reste modifiable ; l'export ne verrouille ni les scènes ni leur statut.
- **Écart signalé :** après une modification du contenu inclus, l'application
  indique que le livre a changé depuis le dernier PDF définitif, avec sa date.
  Un nouveau PDF définitif reste possible dès que ses conditions sont satisfaites.

**Décision confirmée le 30 septembre 2026 — aperçu du livre et corrections :**
l'application présente à l'écran un aperçu du livre composé, avec les mêmes
marques que le PDF de travail. L'adulte peut y cliquer sur un passage pour
modifier sa scène. La modification s'applique à la scène elle-même, sans
seconde copie, puis l'aperçu est recalculé. Elle est une retouche au sens de
F11.1 : elle ne retire pas le repère « prête pour le livre » ; si la scène
est en cours de reprise par un élève, les règles de F07 et F08 s'appliquent
comme dans la scène.

**Décision révisée le 3 octobre 2026 — éditeur de la scène depuis l'aperçu :**
la décision du 30 septembre limitait cette modification au texte et aux
libellés, les images et les destinations se modifiant depuis la scène ou le
graphe. À la demande du porteur, le clic sur un passage ouvre désormais
l'éditeur complet de la scène à côté de l'aperçu, pour améliorer la mise en
page en voyant le livre et pas seulement corriger des coquilles.

- **Même éditeur :** l'adulte y fait tout ce que permet l'éditeur de la page
  de scène : texte, images en bloc et en ligne, largeur d'une image, phrases
  de choix et leurs destinations, actions de jeu. Une image en bloc y monte
  ou descend d'un bloc par deux commandes, disponibles aussi dans la page de
  scène ; elle ne quitte pas sa scène.
- **Hors de cet éditeur :** la consigne, les remises et la relecture restent
  dans la page de scène, ouverte par un lien ; créer, supprimer, exclure une
  scène ou la déplacer dans le plan se fait depuis le plan ou le graphe.
- **Enregistrement habituel :** les modifications sont enregistrées comme
  dans la page de scène, selon F08, sans mode brouillon à valider. L'aperçu
  se recalcule après une pause dans la saisie, non à chaque frappe.
- **Retour en arrière :** « Annuler » revient pas à pas ; « Tout annuler »
  rétablit la scène telle qu'elle était à l'ouverture de l'éditeur.
- **Conséquence acceptée :** un essai est dans la scène dès sa saisie ; un
  élève qui l'ouvre le voit, et un PDF demandé à ce moment le contient.
- **Alternative écartée :** un brouillon enregistré seulement sur validation,
  demandé d'abord par le porteur. Il aurait créé un second mode de sauvegarde
  à côté de F08, avec ses propres incidents à traiter.

Le délai de l'aperçu après une modification et sa présentation à côté de
l'éditeur restent à éprouver ; les commandes de composition d'un passage sont
en [F11.3](#f113--présentation-commune-du-livre).

Sur papier, la référence stable imprimée permet d'ouvrir directement la scène
par la recherche. La modification du fichier PDF lui-même et l'import de ses
annotations ne sont pas retenus pour la première livraison : une correction
faite dans le fichier ne reviendrait pas dans la scène et serait perdue au
réexport. La fidélité entre l'aperçu et le PDF est éprouvée le 3 octobre
2026 : elle n'est tenue sur tout navigateur que si l'aperçu est calculé côté
serveur, ce qui est retenu le même jour ; voir
[l'architecture](architecture.md#résultats-du-prototype-pdf-3-octobre-2026).

**Proposition liée au coût d'exploitation, à revoir en F14 :** conserver les
PDF définitifs successifs d'un projet et seulement le dernier PDF de travail.

**Décision confirmée le 30 septembre 2026 — une seule composition :**
l'aperçu du livre, le PDF de travail et le PDF définitif présentent la même
composition : même ordre, mêmes numéros, même mise en page. Le PDF de travail
est l'aperçu mis en fichier ; le PDF définitif est le même livre sans marques,
obtenu seulement lorsque ses conditions sont satisfaites. Les références
stables et les signalements s'impriment dans les marges ou à côté des numéros,
sans modifier les coupures de lignes ni de pages ; la page récapitulative des
problèmes est ajoutée avant le livre, hors pagination.

**Décision confirmée le 3 octobre 2026 — récapitulatif en nombre pair de
pages :** la page récapitulative occupe toujours un nombre pair de pages, la
dernière restant blanche au besoin. Imprimé en recto verso, le PDF de travail
garde ainsi les mêmes pages de gauche et de droite que le livre. Ses pages ne
portent pas de numéro ; celles du livre gardent le leur, selon
[F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture).

**Décisions confirmées le 3 octobre 2026 — gravité des problèmes de mise en
page :** la question laissée ouverte le 30 septembre est tranchée dans le
tableau de [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif).

- **Numéro fixé devenu impossible :** il bloque le PDF définitif et le
  partage, qu'il vienne d'une liaison cachée ou de l'adulte. L'adulte lève le
  blocage en libérant ou en changeant le numéro ; c'est le seul ajustement
  qui puisse encore ne pas s'appliquer au sens de F11-AC11, avec la largeur
  d'image réglée de [F10](#f10--illustrations), indiquée en « à savoir ».
- **Contenu qui dépasse des marges :** par exemple un mot insécable très long
  ou un titre trop long sur la page de titre. Il avertit sans bloquer, en
  désignant la page, et il est rappelé à la demande du PDF définitif. Un
  blocage sans contournement, déclenché par une détection qui peut se
  tromper, laisserait l'adulte sans livre.
- **Sans signalement :** un groupe de choix plus haut qu'une page, une
  feuille d'aventure de plusieurs pages et une page peu remplie ne sont pas
  des problèmes.

**Décision confirmée le 3 octobre 2026 — parcourir les problèmes :** idée du
porteur. Depuis l'aperçu, l'adulte passe d'un problème au suivant, comme pour
les pages peu remplies de F11.3 ; l'aperçu se place sur le passage concerné
et l'éditeur de la scène s'ouvre à côté. Ce qui se corrige dans la scène se
corrige là. Pour le reste — scène à réintégrer, fin à marquer, numéro à
libérer, raccord dans le graphe — le problème propose son action explicite
ou renvoie à la page de la scène. Rien n'est corrigé automatiquement.

**Décision confirmée le 3 octobre 2026 — suivre un renvoi :** demande du
porteur. Dans l'aperçu, un clic sur un renvoi ou sur la marque d'une énigme
place le livre sur le passage de destination et ouvre sa scène à côté ;
l'adulte revient ensuite au passage d'où il vient, étape par étape. Le
renvoi reste un texte en ligne : la composition ne change pas. Cette
commande vaut à toutes les étapes de
[F11.6](#f116--trois-temps-pour-préparer-le-livre) ; une première maquette
la limitait à « Vérifier les chemins ».

- **F11-AC83 — Renvoi suivi depuis la relecture :** étant donné le passage 1
  dont un choix mène au n° 6, lorsque l'adulte, au temps « Relire », clique
  sur « rends-toi au 6 » dans l'aperçu, alors l'aperçu se place sur le
  passage 6, sa scène s'ouvre à côté et « Revenir au n° 1 » lui est proposé.

**Justification du périmètre :** distinguer une idée volontairement laissée
de côté d'une scène dont le raccord a été oublié. L'inclusion par défaut et
l'exclusion explicite s'appliquent aussi au récit classique ; seuls les
contrôles des chemins par les choix sont propres au récit à choix.

**Parcours nominal acquis :** l'enseignant peut obtenir un PDF de travail pour
relire le livre pendant sa préparation. Il termine les scènes retenues,
vérifie l'ensemble et demande le PDF définitif lorsque les conditions sont
satisfaites. La distinction entre ces usages ne fixe pas le nombre de boutons
ou d'écrans et n'interdit pas les retouches et réexports prévus dans le brief.

**Critères d'acceptation sur les éléments confirmés :**

- **F11-AC03 — Relecture avant la fin des finitions :** étant donné un livre
  exportable contenant une scène dont les finitions restent à faire, lorsque
  l'enseignant demande un PDF de travail, alors cet état de préparation ne
  bloque pas l'obtention du PDF.
- **F11-AC04 — Scène utilisée encore à préparer :** étant donné un livre
  contenant une scène non déclarée prête, lorsque l'enseignant demande un
  export définitif, alors les conditions de cet export ne sont pas satisfaites,
  même si les autres scènes sont prêtes ; le PDF de travail reste possible.
- **F11-AC05 — Scène non utilisée :** étant donné un livre dont toutes les
  scènes utilisées sont prêtes et dont les vérifications globales requises sont
  satisfaites, et une scène non utilisée encore en cours d'écriture, lorsque
  l'enseignant demande un PDF définitif, alors cette scène non utilisée ne le
  bloque pas. Ce critère ne dispense pas de vérifier les destinations des choix.
- **F11-AC06 — Inclusion par défaut :** étant donné une nouvelle scène d'un
  récit à choix qui n'a pas été explicitement exclue, lorsqu'on consulte le contenu prévu pour
  le livre, alors elle y figure, même si aucun choix ne permet encore de
  l'atteindre. Cette inaccessibilité est signalée sans la retirer du livre.
- **F11-AC07 — Exclusion sans perte du travail :** étant donné une scène
  contenant un texte, lorsque l'adulte l'exclut du livre, alors elle est
  absente du PDF demandé, mais la scène et son texte restent dans le projet.
  L'effet des choix qui y mènent relève des contrôles de F09.2.
- **F11-AC26 — Modification pendant l'export :** étant donné un PDF définitif
  demandé à 10 h 00, lorsqu'une scène est modifiée à 10 h 01 avant la fin du
  calcul, alors le fichier reflète l'état de 10 h 00 et l'application signale
  que le livre a changé depuis ce PDF.
- **F11-AC27 — Coquille corrigée depuis l'aperçu :** étant donné une scène
  déclarée prête contenant « la brume s'épaissi », lorsque l'enseignant corrige
  ce mot depuis l'aperçu du livre, alors le texte de la scène est corrigé, le
  prochain PDF contient la correction et la scène reste déclarée prête.
- **F11-AC46 — Image descendue depuis l'aperçu :** étant donné S001 ouverte
  depuis l'aperçu, dont une image laisse 78 mm de blanc au bas de la page 6,
  lorsque l'adulte la descend d'un bloc, alors l'image suit le paragraphe
  suivant dans la scène, dans l'éditeur de la page de scène comme dans le
  lecteur en ligne après un nouveau partage, et l'aperçu recalculé montre la
  nouvelle disposition.
- **F11-AC47 — Tout annuler :** étant donné cette scène où l'adulte a ensuite
  réduit l'image et récrit une phrase, lorsqu'il choisit « Tout annuler »,
  alors la scène retrouve le texte, la place et la largeur d'image qu'elle
  avait à l'ouverture de l'éditeur, et l'aperçu revient à la page d'origine.
- **F11-AC30 — Mise en page identique :** étant donné un passage qui commence
  en haut de la page 37 dans l'aperçu, lorsque l'adulte exporte le PDF définitif
  sans modifier le contenu, alors ce passage commence aussi en haut de la page 37.
- **F11-AC15 — PDF de travail identifiable :** étant donné un livre dont
  toutes les conditions du PDF définitif sont satisfaites, lorsque l'enseignant
  demande un PDF de travail, alors ce fichier porte la mention « Version de
  travail » et les références stables des scènes ; le PDF définitif demandé
  ensuite n'en porte aucune.
- **F11-AC56 — Numéro fixé par l'adulte devenu impossible :** étant donné un
  passage fixé au n° 40 par l'adulte et un livre ramené à 39 passages,
  lorsque l'adulte demande le PDF définitif ou le partage, alors ils sont
  refusés et le problème désigne ce passage ; lorsqu'il libère le numéro,
  alors le blocage disparaît.
- **F11-AC57 — Contenu hors des marges :** étant donné une adresse internet
  de quatre-vingts caractères sans espace dans S018, qui dépasse dans la
  marge de la page 37, lorsque les contrôles s'exécutent, alors un
  avertissement désigne la page 37 sans bloquer le PDF définitif, et il est
  rappelé dans la demande de ce PDF.
- **F11-AC58 — Récapitulatif pair :** étant donné un récapitulatif qui tient
  en une page, lorsque l'enseignant imprime le PDF de travail en recto verso,
  alors une page blanche le suit et la page de titre est sur une page de
  droite, comme dans le livre.
- **F11-AC59 — Problèmes parcourus un à un :** étant donné trois problèmes,
  dont un choix sans destination dans S023 et une scène exclue vers laquelle
  mène S031, lorsque l'adulte parcourt les problèmes, alors l'aperçu se place
  sur S023 et son éditeur s'ouvre pour désigner la destination ; au problème
  suivant, l'action « réintégrer » ou l'accès à la scène lui est proposé.

**Décision confirmée le 30 septembre 2026 — exclure et réintégrer :**

- L'exclusion porte sur les scènes. Une commande groupée au niveau d'un
  chapitre ou d'une partie l'applique à chacune de ses scènes, sans créer de
  statut propre au chapitre ou à la partie.
- Une partie entièrement exclue est permise ; son titre n'est pas imprimé.
- Pour l'adulte, les scènes exclues restent visibles dans les vues Scènes,
  Graphe et Suivi, avec un repère « hors du livre ».
- La réintégration utilise la même commande. La scène est insérée comme une
  nouvelle scène selon F11.5 ; si elle avait un numéro fixé, elle le retrouve.
- **Où se trouve la commande (4 octobre 2026) :** dans le menu de la scène,
  depuis sa page comme depuis la scène ouverte à côté de l'aperçu. Elle
  n'est pas répétée sous chaque scène d'une liste de la destination Livre :
  en septembre, cette répétition présentait un livre en cours comme fautif.
- **Commande d'un chapitre (6 octobre 2026) :** « Exclure du livre » est dans
  le menu à trois points du chapitre (F03.1) et s'applique à ses scènes du
  moment. Confirmé le même jour : comme le chapitre n'a pas de statut, sa
  carte dit combien de ses scènes sont hors du livre, par exemple « 3 hors
  du livre sur 4 », et une scène ajoutée ensuite n'est pas exclue.
- Le travail des élèves sur une scène exclue continue normalement. L'exclusion
  ne leur est pas affichée : l'annoncer relève de l'enseignant.

- **F11-AC31 — Chapitre exclu en cours d'écriture :** étant donné le chapitre
  « Le pacte avec la brume » de trois scènes dont l'une est en rédaction par
  Inès, lorsque l'enseignant exclut ce chapitre, alors ses trois scènes sont
  hors du livre et repérées comme telles pour lui, tandis qu'Inès continue
  d'écrire sans voir d'indication d'exclusion.
- **F11-AC32 — Réintégration :** étant donné une scène exclue qui portait un
  numéro fixé 12, lorsque l'adulte la réintègre, alors elle reprend le n° 12 ;
  sans numéro fixé, elle prend place à la suite de son groupe de mélange et
  l'adulte en est informé.

**Questions ouvertes :**

- Contrôles des chemins et des images décidés en F09.2 et F10 ; gravité des
  problèmes de mise en page décidée le 3 octobre 2026. Restent le délai de
  l'aperçu après une modification et la présentation de l'éditeur à côté de
  lui, à éprouver.
- Points apparus pendant la conception des écrans, le 3 octobre 2026, à
  consigner ou à trancher ; voir
  [le design](design.md#destination-livre-et-lecture-dessai). Portée de l'annulation de
  la dernière action de l'aperçu (F11.3) : la maquette la garde tant que
  l'adulte reste dans la destination Livre ; « Tout annuler » n'y défait pas
  un déplacement. Image en bloc vue par un élève : peut-il la retirer ?
  Marge maximale. Dernière page du récit et blanc précédant une image pleine
  page, pour le repérage des pages peu remplies.
- Accès des élèves à l'aperçu et aux PDF de travail, en lien avec la lecture
  ouverte de F06.2. La variante sans circuit de travail élève est définie en F11.1.

Les deux usages du PDF concernent aussi le récit classique ; les contrôles
propres aux choix n'y ont pas lieu d'être. La composition et le format sont
traités en F11.3, les pages de présentation et la couverture en F11.4,
l'ordre imprimé et la numérotation en F11.5.

### F11.3 — Présentation commune du livre

**Décision confirmée :** en mode classe, l'enseignant règle la présentation
commune du livre, notamment les polices, tailles et choix de composition.
Les élèves rédigent avec la mise en forme légère de F04.1. En mode personnel,
l'auteur adulte assure les deux rôles. Cette répartition vaut pour les récits
classiques et à choix.

**Critère d'acceptation :**

- **F11-AC08 — Présentation commune :** étant donné des scènes rédigées par
  plusieurs élèves, lorsque l'enseignant règle la présentation générale du
  livre, alors ces réglages s'appliquent au livre composé sans demander à
  chaque élève de reprendre la présentation de son texte.

**Décision confirmée le 30 septembre 2026 — format de la première livraison :**
un seul format de livre, A5 portrait (148 × 210 mm), d'autres formats pouvant
venir ensuite. Les pages sont en vis-à-vis, avec une marge intérieure un peu
plus large que la marge extérieure pour compenser la reliure collée ; cette
marge est calculée par l'application et n'est pas un réglage demandé à l'adulte.
Pas d'image à fond perdu dans la première livraison : une illustration
« pleine page » reste à l'intérieur des marges. Ces choix valent pour les
quatre combinaisons de modes.

**Justification :** un format unique limite le coût des gabarits et des
vérifications d'impression. Des sources secondaires rapportent pour le modèle
epubli 13,5 × 20,5 cm une marge intérieure de 2 cm contre 1,5 cm à l'extérieur,
et une perte de quelques millimètres au pli d'une reliure collée, qui croît
avec l'épaisseur du livre ; la documentation officielle d'epubli n'a pas pu
être consultée le 30 septembre 2026. Elle l'est en partie le 3 octobre 2026 :
voir « taille de page et marges » plus bas.
Le fond perdu imposerait débord et repères supplémentaires.

**Décisions confirmées le 3 octobre 2026 — taille de page et marges :**

- **Taille de page :** la page produite mesure 148,17 × 209,9 mm, soit
  420 × 595 points ; cet écart d'arrondi de 0,2 mm avec l'A5 est accepté et
  n'est pas corrigé. Il est très inférieur au rognage de l'imprimeur.
- **Marges de départ :** 16 mm en haut, 20 mm en bas, 15 mm à l'extérieur et
  20 mm à l'intérieur, valeurs du prototype PDF, à confirmer sur un exemplaire
  imprimé.
- **Marges réglables :** à la demande du porteur, l'adulte peut modifier ces
  quatre marges dans les réglages de « Mettre en page », section « Texte
  et pages »
  ([F11.6](#f116--trois-temps-pour-préparer-le-livre)), et revenir aux valeurs
  de départ.
  La décision du 30 septembre est précisée : l'application propose des marges
  et n'en demande pas le réglage ; l'adulte peut les changer, pour son
  imprimeur ou son goût. Les marges intérieure et extérieure restent
  alternées entre pages de gauche et de droite. Aucune marge ne peut être
  réglée sous 10 mm, pour qu'un texte ne soit pas rogné.
- **Rognage :** l'aide d'epubli indique que l'intérieur est rogné d'environ
  3 mm sur chaque côté et conseille un fichier plus grand de 6 mm, tandis que
  sa page du format A5 demande un PDF de 14,8 × 21 cm ; ce qu'il fait d'un
  fichier de 148 × 210 mm n'a pas été trouvé. Sa page de conseils donne pour
  un livre de poche 1,2 à 1,4 cm en haut, 2 cm en bas, 1,4 à 2 cm à
  l'extérieur et environ 1,5 cm à l'intérieur, à élargir pour un livre épais.
  Sources consultées le 3 octobre 2026 : [format A5](https://www.epubli.com/buch/din-a5),
  [conception du livre](https://www.epubli.com/buch/gestalten) ; l'article
  d'aide sur le rognage n'a pu être lu que par un extrait de recherche.
  La V0 exportait un A5 à 12 mm de marge par défaut ; le porteur ne se
  souvient plus des marges de ses livres imprimés.

- **F11-AC60 — Marges modifiées puis rétablies :** étant donné un livre aux
  marges de départ, lorsque l'adulte porte la marge intérieure à 23 mm, alors
  le livre est recomposé avec cette marge du côté de la reliure sur les pages
  de gauche comme de droite, et aucune scène ne perd son repère « prête » ;
  lorsqu'il rétablit les valeurs de départ, alors la marge revient à 20 mm ;
  lorsqu'il saisit 8 mm, alors cette valeur est refusée.

**Questions ouvertes :** export avec marge de rognage (154 × 216 mm), à
décider après un premier envoi chez l'imprimeur, selon la décision du
3 octobre 2026 ; gabarits précis des pages de présentation.

**Retour d'usage du porteur :** la V0 permettait des ajustements pour mieux
placer les illustrations et limiter les espaces vides : échanges de passages
dans l'ordre imprimé, report de texte sur une nouvelle page et priorité des
ajustements manuels sur la composition initiale. Ce besoin motive les règles
de composition V1 ci-dessous, sans reprise des mécanismes techniques V0.

**Vérification de la référence V0 :** la copie inspectée permet de fixer un
numéro de passage, de faire commencer une scène sur une nouvelle page et
d'ajuster l'espace après une scène ou les dimensions d'image. Ces réglages
priment sur les valeurs automatiques et sont conservés lors des recalculs
compatibles. Les échanges de passages figurent dans la documentation, mais
leur commande explicite n'a pas été retrouvée dans l'interface inspectée.
Les réglages conservés ne garantissent pas des pages identiques après une
modification de texte. Ces constats n'imposent aucune reprise technique.

**Décision confirmée :** conserver une composition automatique et des
ajustements explicites de l'adulte, prioritaires tant qu'ils sont applicables :
déplacement ou échange de scènes dans l'ordre imprimé d'un récit à choix,
début d'une scène sur une nouvelle page et taille des images.
Un réexport ne doit pas effacer silencieusement
ces ajustements ; une contrainte devenue impossible doit être signalée.
Cela ne promet pas de figer la pagination malgré l'évolution des textes.
Dans le récit à choix, modifier l'ordre imprimé ne change pas les destinations
des choix. En récit classique, déplacer une scène peut modifier le récit
lui-même : ce n'est pas un simple ajustement de remplissage des pages.

**Critères d'acceptation sur la composition :**

- **F11-AC09 — Ordre imprimé sans changement de destination :** étant donné
  un récit à choix où A mène à B, lorsque l'adulte échange les positions
  imprimées de B et C, alors le choix de A mène toujours à B et le renvoi
  imprimé correspond au numéro de B dans la nouvelle composition.
- **F11-AC10 — Ajustements conservés :** étant donné une scène réglée pour
  commencer sur une nouvelle page et une image dont la taille a été ajustée,
  lorsque l'adulte réexporte avec ces éléments toujours présents et ces
  réglages toujours applicables, alors le saut et l'ajustement d'image sont
  conservés. Le numéro de page peut changer si les textes ont évolué.
- **F11-AC11 — Ajustement devenu impossible :** étant donné un ajustement
  manuel qui ne peut plus être appliqué après une modification du livre,
  lorsque la composition est recalculée, alors l'adulte est informé de
  l'ajustement concerné. L'application ne présente pas son résultat comme
  ayant respecté silencieusement tous les ajustements précédents.

**Décisions confirmées le 3 octobre 2026 — règles de coupure :** la
composition automatique tient les règles suivantes, reprises des propositions
du [prototype PDF](architecture.md#résultats-du-prototype-pdf-3-octobre-2026).
Elles valent pour les quatre combinaisons de modes ; dans le récit classique,
le titre de chapitre imprimé suit la règle du titre de partie.

- **Ni veuve ni orpheline :** un paragraphe coupé entre deux pages laisse au
  moins deux lignes en bas de l'une et deux lignes en haut de l'autre.
- **Blocs jamais coupés :** un groupe de phrases de choix, une action de jeu,
  une image, la marque de fin, un titre de partie et un numéro de passage ne
  sont pas coupés entre deux pages.
- **Numéro et titre jamais seuls en bas de page :** le numéro de passage, et
  le titre de partie imprimé au-dessus de lui, restent avec les deux
  premières lignes au moins du passage.
- **Choix, action et fin jamais isolés :** un groupe de choix, une action de
  jeu et la marque de fin restent avec le bloc qui les précède ; si c'est un
  paragraphe, avec ses deux dernières lignes au moins. Une fin de paragraphe,
  une action de jeu et les choix qui la suivent forment ainsi un seul ensemble.
- **Conséquence acceptée :** un passage court ne peut être coupé nulle part ;
  s'il ne tient pas en bas de page, il passe entier à la suivante et laisse
  du blanc. Ce blanc se réduit par les ajustements de composition ; il est
  préféré à un choix séparé de son texte.
- **Règle impossible à tenir :** un groupe de choix plus haut qu'une page est
  coupé entre deux phrases de choix, jamais à l'intérieur d'une phrase ; une
  action de jeu plus haute qu'une page est coupée comme un paragraphe, sa
  mise en valeur se poursuivant sur la page suivante ; un ensemble plus haut
  qu'une page se détache d'abord du paragraphe qui le précède. Aucun texte
  n'est perdu et rien n'est signalé : l'adulte n'aurait d'autre recours que
  de réécrire sa scène. Des choix posés juste après une image pleine page
  ouvrent la page suivante, selon [F10](#f10--illustrations).

**Décisions confirmées le 3 octobre 2026 — alignement et césure :**

- **Par défaut :** le récit est justifié, avec césure française.
- **Restrictions de la césure :** aucune dans les numéros, les titres, les
  phrases de choix et les actions de jeu, alignés à gauche ; aucune dans un
  mot commençant par une majuscule ; aucune dans le dernier mot d'un
  paragraphe ; trois lettres au moins de chaque côté de la coupure.
- **Réglage du livre :** l'adulte peut choisir « aligné à gauche, sans
  césure » dans la présentation commune, pour des lecteurs fragiles ou si la
  césure lui déplaît sur papier. Le réglage vaut pour tout le livre.
- **À vérifier, sans valeur de règle :** aucun mot coupé entre deux pages.
  Souhaitable pour de jeunes lecteurs ; la capacité du moteur à le tenir
  n'est pas éprouvée. Le taux de 14 % de lignes coupées relevé par l'essai
  tient à un texte tiré au sort et à des réglages plus larges que ces
  restrictions ; il reste à juger sur un vrai livre et sur papier.

- **F11-AC35 — Ni veuve ni orpheline :** étant donné un paragraphe de cinq
  lignes dont trois seulement tiennent en bas de la page 37, lorsque le livre
  est composé, alors la page 37 en porte trois et la page 38 deux ; s'il n'en
  tenait qu'une, le paragraphe commencerait page 38.
- **F11-AC36 — Passage court d'un seul tenant :** étant donné le passage 14,
  de trois lignes suivies de trois phrases de choix, et la place pour quatre
  lignes en bas de la page 52, lorsque le livre est composé, alors le numéro
  14, son texte et ses choix figurent ensemble page 53.
- **F11-AC37 — Numéro jamais seul :** étant donné la place pour le numéro 21
  et une seule ligne en bas de page, lorsque le livre est composé, alors le
  numéro 21 est imprimé en haut de la page suivante, avec le titre de partie
  s'il ouvre une partie.
- **F11-AC38 — Action et choix avec leur texte :** étant donné un paragraphe
  suivi de l'action « Retire un point de volonté à ton héros. » puis de deux
  choix, lorsqu'une coupure de page tombe dans ce passage, alors l'action et
  les choix sont sur la même page que les deux dernières lignes au moins du
  paragraphe.
- **F11-AC39 — Groupe de choix plus haut qu'une page :** étant donné « La
  place du village » et ses trente destinations, lorsque le livre est
  composé, alors le groupe est coupé entre deux phrases de choix, toutes sont
  imprimées et aucun signalement n'apparaît.
- **F11-AC40 — Césure restreinte :** étant donné un livre justifié, lorsque
  le livre est composé, alors aucune ligne ne se termine par une coupure dans
  « Maëlwenn », dans une phrase de choix ou dans le dernier mot d'un
  paragraphe, et toute coupure laisse au moins trois lettres de chaque côté.
- **F11-AC41 — Aligné à gauche, sans césure :** étant donné ce réglage choisi
  pour le livre, lorsque le livre est composé, alors aucun mot du récit n'est
  coupé en fin de ligne et les règles de coupure entre pages restent tenues.

**Décisions confirmées le 3 octobre 2026 — réduire les blancs depuis
l'aperçu :** l'image restant où l'auteur l'a posée selon
[F10](#f10--illustrations), le blanc d'un bas de page se réduit par des
commandes de l'adulte, données depuis le passage concerné dans l'aperçu du
livre. Retour d'usage du porteur : la V0 permettait de déplacer les scènes
dans la prévisualisation, et c'est ce qui limitait les blancs.

- **Déplacer un passage (récit à choix) :** « monter d'un rang », « descendre
  d'un rang » et « placer après le n° … ». Le passage reste dans son groupe
  de mélange. La scène de départ, un passage au numéro fixé et la scène
  d'ouverture placée en tête de son groupe ne se déplacent pas ; les autres
  passages se décalent autour d'un numéro fixé, qui garde son rang. Les
  numéros intermédiaires changent et les renvois sont recalculés, selon
  F11-AC09 et F11-AC33.
- **Récit classique :** le déplacement d'une scène n'est pas proposé dans
  l'aperçu ; il change le récit et se fait dans le plan.
- **Commencer sur une nouvelle page :** ajustement conservé, par exemple pour
  un passage de sauvegarde que l'adulte veut en tête de page et d'un seul tenant.
- **Non retenus :** l'espace réglable après une scène, qui servait dans la V0
  à éviter les lignes isolées, désormais traitées par les règles de coupure ;
  le saut de page au milieu d'une scène.
- **Pages peu remplies :** l'aperçu repère les pages du récit dont une large
  part est blanche et permet de passer de l'une à la suivante. C'est une aide
  de navigation : elle ne figure pas parmi les problèmes des contrôles et ne
  bloque rien. Seuil proposé, à régler sur un vrai livre : plus d'un quart
  de la hauteur. Le porteur juge le 4 octobre 2026 qu'un tiers, d'abord
  proposé, laisse passer des blancs trop grands ; un seuil plus bas désigne
  davantage de pages, ce que l'essai sur un vrai livre devra mesurer.
- **Annuler :** la dernière action faite dans l'aperçu peut être annulée.

- **F11-AC42 — Passage remonté pour combler un blanc :** étant donné le
  passage 31, de six lignes, et un blanc de 70 mm au bas de la page 21 après
  le passage 12, lorsque l'adulte choisit « placer après le n° 12 », alors ce
  passage devient le n° 13, les passages 13 à 30 deviennent 14 à 31, tous les
  renvois suivent et aucune destination ne change.
- **F11-AC43 — Numéro fixé gardé :** étant donné le passage 12 au numéro
  fixé, lorsque l'adulte place le passage 10 après le n° 14, alors le passage
  fixé porte toujours le n° 12 et la commande de déplacement ne lui est pas
  proposée.
- **F11-AC44 — Blancs retrouvés :** étant donné un livre de 145 pages dont
  douze ont plus d'un quart de blanc, lorsque l'adulte parcourt les pages peu
  remplies, alors il passe de l'une à la suivante sans feuilleter le livre,
  et les contrôles ne les comptent pas comme des problèmes.
- **F11-AC45 — Essai annulé :** étant donné un passage que l'adulte vient de
  déplacer, lorsqu'il annule, alors l'ordre imprimé, les numéros et les
  renvois reviennent à leur état précédent.

**Décision confirmée le 3 octobre 2026 — passage suggéré pour combler un
blanc :** idée du porteur, pour ne pas avoir à chercher soi-même.

- **Suggestion :** sur une page peu remplie, l'application propose le passage
  situé plus loin dans le même groupe de mélange dont la hauteur est la plus
  proche du blanc sans le dépasser, puis les deux suivants : trois candidats
  au plus, chacun avec ce qu'il comble.
- **Validation par l'adulte :** rien n'est déplacé sans lui. Valider un
  candidat revient à « placer après le n° … » : mêmes effets, même annulation.
- **Candidats écartés :** le départ, un numéro fixé, une ouverture en tête de
  groupe, un passage réglé pour commencer sur une nouvelle page ou portant
  une image pleine page, et un passage qui se retrouverait sur la double
  page de celui qui y mène, selon l'écart décidé pour l'agencement en
  [F11.5](#f115--ordre-imprimé-et-numérotation-du-récit-à-choix).
- **Plus loin seulement :** les pages situées avant l'ancienne place du
  passage ne bougent pas ; traiter les blancs du début vers la fin ne défait
  pas ce qui vient d'être réglé. Un blanc peut en revanche apparaître plus
  loin : ce n'est pas une optimisation du livre entier.
- **Livraison :** première livraison, sous réserve que l'essai de composition
  confirme la justesse des hauteurs prévues ; à défaut, elle est reportée
  sans rien bloquer. Elle appartient au temps « Mettre en page » de
  [F11.6](#f116--trois-temps-pour-préparer-le-livre). Sans objet en récit
  classique.

- **F11-AC67 — Trois candidats au plus :** étant donné un blanc de 70 mm au
  bas de la page 21 et, plus loin dans la même partie, les passages 31
  (62 mm), 27 (55 mm), 35 (48 mm) et 29 (80 mm), lorsque l'adulte arrive sur
  cette page, alors l'application propose le 31, puis le 27 et le 35, et ne
  propose pas le 29 ; lorsqu'il valide le 31, alors le passage est placé
  comme en F11-AC42 et il peut annuler.
- **F11-AC68 — Passage lié écarté :** étant donné que le passage 12, au bas
  de la page 21, mène au passage 31, lorsque l'application cherche un
  candidat pour le blanc de cette page, alors le 31 n'est pas proposé.

**Décision confirmée le 3 octobre 2026 — blanc à l'intérieur d'un
passage :** un blanc peut se trouver à l'intérieur d'un passage, par exemple
avant son image pleine page ou avant un groupe de choix reporté à la page
suivante. Aucun passage ne peut s'y glisser : l'application ne propose alors
aucun candidat, le dit, et renvoie à la scène pour réduire l'image ou
récrire.

- **F11-AC74 — Blanc dans un passage :** étant donné le passage 20 dont
  l'image pleine page ouvre la page 14 et laisse 59 mm de blanc au bas de la
  page 13, lorsque l'adulte arrive sur cette page peu remplie, alors aucun
  passage ne lui est suggéré, l'application en donne la raison et lui
  propose d'ouvrir la scène.

### F11.4 — Intérieur du livre, pages de présentation et couverture

**Usage confirmé :** le porteur récupère le PDF intérieur produit avec la V0,
prépare sa « page de garde » et sa couverture avec d'autres outils, puis
confie le tirage à l'imprimeur epubli. Le contenu exact de cette page intérieure,
le format et la reliure qu'il utilise restent à préciser. Cette pratique ne
fait pas d'epubli le fournisseur exclusif de la V1.

**Cadre acquis :** le PDF intérieur prêt à imprimer est dans le périmètre.
L'assemblage de la couverture est reporté selon la décision ci-dessous. La commande et la livraison des exemplaires depuis
l'application restent reportées. Le niveau d'aide à la fabrication des
différents fichiers est à préciser ; il ne suffit pas de nommer un
export « définitif » pour garantir son acceptation par tout imprimeur.

**Contraintes externes vérifiées le 26 septembre 2026 :** epubli traite le
fichier intérieur et la couverture séparément. Ses consignes demandent un
PDF contenant l'ensemble des pages intérieures et prévoient la création
ou l'import de la couverture. Les dimensions de celle-ci dépendent du format,
du nombre de pages, du papier et de la reliure ; son outil de couverture
calcule notamment le dos. Sources : [parcours d'impression](https://epubli.zendesk.com/hc/de/articles/360021949020-Buch-drucken-lassen-Schritt-f%C3%BCr-Schritt),
[dimensions et fonds perdus](https://epubli.zendesk.com/hc/de/articles/360004249992-Wie-lege-ich-den-Beschnittrand-richtig-an),
[outil de couverture](https://epubli.zendesk.com/hc/de/articles/360006833932-Wie-nutze-ich-den-epubli-Cover-Designer).
Les exigences détaillées seront revérifiées lors de la spécification des
exports ; aucune compatibilité de la V1 n'est encore démontrée.

**Décision confirmée :** composer un intérieur complet avec une page de
titre contenant les informations choisies par l'adulte et des pages de
présentation ou de fin facultatives, au moyen de modèles simples.

**Décision confirmée le 30 septembre 2026 — modèles de pages :**

- **Page de titre :** titre, sous-titre éventuel, classe ou auteur, année.
- **« Comment lire ce livre » :** proposée par défaut pour le récit à choix,
  modifiable et retirable ; elle explique les numéros de passages et les
  énigmes. Elle n'existe pas pour le récit classique.
- **Page des auteurs :** facultative ; en mode classe, elle reprend par défaut
  les prénoms seuls des élèves du projet et l'enseignant peut la modifier.
  Pas de page des auteurs automatique en mode personnel.
- **Page de fin :** facultative.

**Décisions confirmées le 3 octobre 2026 — ordre et numéros de page :**

- **Ordre fixe :** page de titre, page des auteurs, « Comment lire ce livre »
  avec ses règles du jeu, feuille d'aventure, récit, page de fin. Un seul
  choix : la page des auteurs au début, par défaut, ou à la fin du livre,
  avant la page de fin. Un ordre libre n'est pas retenu.
- **Récit en page de droite :** le récit commence sur une page de droite ;
  une page blanche est ajoutée avant lui si nécessaire.
- **Numéro de page :** c'est le rang de la page dans le PDF définitif, page
  de titre comprise ; l'aperçu désigne les pages par ce numéro.
- **Folio imprimé :** jamais sur les pages de présentation. Sur le récit, un
  réglage du livre l'imprime ou non : désactivé par défaut pour le récit à
  choix, où l'en-tête des numéros de passages sert de repère et où un numéro
  de page se confondrait avec un numéro de passage ; activé par défaut pour
  le récit classique. Retour d'usage du porteur : ses livres n'imprimaient
  que les numéros des scènes.
- **PDF de travail :** il imprime toujours le numéro de page, comme marque de
  relecture, quel que soit ce réglage.
- **Où elles se règlent (3 octobre 2026, révisé le 4) :** les pages de
  présentation forment la section « Pages de début et de fin », dernière
  section des réglages de « Mettre en page », selon
  [F11.6](#f116--trois-temps-pour-préparer-le-livre). Aux temps « Relire »
  et « Vérifier les chemins », l'aperçu ne les montre pas.

- **F11-AC48 — Récit en page de droite :** étant donné un livre à choix dont
  les pages de présentation occupent les pages 1 à 3, lorsque le livre est
  composé, alors la page 4 est blanche et le passage 1 commence page 5.
- **F11-AC49 — Folio au choix :** étant donné ce livre, lorsque l'adulte
  exporte le PDF définitif sans changer le réglage, alors aucune page ne
  porte de numéro de page et l'en-tête indique les passages ; lorsqu'il
  active le folio, alors la page du passage 1 porte le numéro 5 et la page
  de titre n'en porte aucun.
- **F11-AC50 — Auteurs à la fin :** étant donné la page des auteurs réglée
  « à la fin », lorsque le livre est composé, alors elle suit le dernier
  passage et précède la page de fin.

**Décisions confirmées le 3 octobre 2026 — pages personnalisées :** chaque
page de présentation (titre, auteurs, « Comment lire ce livre », feuille
d'aventure, fin) prend l'une de deux formes.

- **Modèle :** la page composée par l'application, dont l'adulte modifie les
  textes avec la mise en forme légère de [F04.1](#f041--mise-en-forme-légère-pour-les-élèves).
- **Image pleine page :** une image importée par l'adulte remplace la page
  composée. Retour d'usage du porteur : sa feuille d'aventure était une image
  préparée dans un outil de mise en page, pour un résultat personnalisé.
- **Dans les marges :** cette image reste à l'intérieur des marges, comme
  toute image selon F11.3 ; une page dessinée bord à bord est réduite. L'aide
  indique la dimension utile pour la dessiner à la bonne taille.
- **Feuille et règles pour l'écran :** le lecteur en ligne continue d'utiliser
  les sections de la feuille d'aventure et le texte des règles du jeu de
  [F04.2](#f042--objets-de-lhistoire). L'adulte qui imprime une image veille
  lui-même à leur accord ; l'application ne le vérifie pas.
- **Page des auteurs en image :** elle échappe à la règle des prénoms seuls ;
  son contenu relève de l'adulte. Elle s'affiche telle quelle dans une
  version partagée, selon [F12.1](#f121--partager-une-version-du-récit).
- **Contrôles :** une image de page manquante ou peu définie suit les règles
  de [F10](#f10--illustrations).
- **Page plus longue que prévu :** une feuille d'aventure ou un texte de
  modèle qui dépasse une page continue sur la page suivante ; une section de
  feuille n'est jamais coupée ; rien n'est signalé, l'adulte le voit dans
  l'aperçu.
- **Non retenus pour la première livraison :** une page libre composée avec
  l'éditeur complet, et l'ajout de pages supplémentaires (carte, dédicace),
  qui reste une question ouverte.

- **F11-AC51 — Feuille en image :** étant donné une feuille d'aventure dont
  l'adulte a importé l'image et composé deux sections, « Volonté : 5 » et
  « Inventaire », lorsque le livre est composé puis partagé, alors le PDF
  imprime l'image à l'intérieur des marges et le lecteur en ligne présente
  les deux sections.
- **F11-AC52 — Feuille de deux pages :** étant donné une feuille composée de
  cinq sections dont la quatrième ne tient pas au bas de la première page,
  lorsque le livre est composé, alors cette section commence entière sur la
  page suivante et le récit commence sur la page de droite qui suit.

**Décision confirmée le 3 octobre 2026 — dés imprimés :** idée du porteur,
vue dans un livre du commerce : ouvrir le livre au hasard tient lieu de
lancer de dé, sans dé dans la classe.

- **Réglage « bas de page du récit » :** rien, numéro de page ou dés ; il
  réunit le folio décidé ci-dessus et les dés. « Dés » n'est proposé que pour
  un récit à choix dont le dé de F04.2 est réglé sur un ou deux.
- **Page de droite seulement :** chaque page de droite du récit imprime
  autant de dés que ce réglage ; les pages de gauche n'en portent pas.
- **Répartition :** les faces sont réparties également sur le livre, deux
  pages de droite qui se suivent ne portent pas le même tirage, et un même
  livre donne les mêmes faces d'un export à l'autre.
- **Explication au lecteur :** elle s'écrit dans les règles du jeu ;
  l'application peut en proposer la phrase. Les dés imprimés ne sont pas
  interprétés, comme le dé en ligne.
- **Limite acceptée :** un livre s'ouvre plus souvent vers son milieu ; la
  répartition égale des faces compense sans garantir un vrai hasard.

- **F11-AC53 — Dés en page de droite :** étant donné un livre à choix réglé
  sur deux dés et sur « dés » en bas de page, lorsque le livre est composé,
  alors chaque page de droite du récit porte deux faces, aucune page de
  gauche ni page de présentation n'en porte, et les six faces apparaissent
  en nombre égal à une près pour chacun des deux dés.

**Lien avec F12 :** depuis le 3 octobre 2026, la version partagée montre par
défaut les mêmes pages de présentation que le livre ; l'adulte peut en
retirer la page des auteurs au moment du partage, selon
[F12.1](#f121--partager-une-version-du-récit).

**Critères d'acceptation :**

- **F11-AC28 — Prénoms seuls par défaut :** étant donné un projet de classe
  de 25 élèves, lorsque l'enseignant ajoute la page des auteurs, alors elle
  propose leurs prénoms sans autre information d'identification, et il peut
  les modifier avant l'export.
- **F11-AC29 — Mode d'emploi du livre à choix :** étant donné un nouveau
  livre à choix, lorsque l'adulte consulte ses pages de présentation, alors
  « Comment lire ce livre » est proposée et modifiable ; elle est absente
  d'un récit classique.
- **F11-AC12 — Pages de présentation intégrées :** étant donné un adulte
  ayant préparé une page de titre et choisi des pages de présentation ou de
  fin, lorsqu'il exporte le PDF intérieur, alors ces pages et le récit figurent
  dans le même fichier sans devoir être assemblés dans un autre outil.

**Décision confirmée le 30 septembre 2026 — couverture :** l'assemblage de
la couverture est reporté après la première livraison. Ses dimensions dépendent
de l'imprimeur, du nombre de pages, du papier et de la reliure, et l'outil de
l'imprimeur calcule déjà le dos ; la plus-value serait faible au regard du
coût de réalisation et de vérification. À la place, la première livraison
propose en F10.2 un cadrage de prompt « illustration de couverture » au format
du livre, et une page d'aide expliquant quoi préparer pour l'outil de
l'imprimeur : image de face, titre, texte de quatrième. L'aide complète
reste possible ultérieurement.

**Décision confirmée le 3 octobre 2026 — premier cas réel :** le parcours
epubli sert de premier cas réel de vérification, sans promettre un fichier
universellement conforme à tous les imprimeurs. L'envoi d'un fichier dira ce
que devient la page après rognage et s'il faut un export plus grand, selon
[F11.3](#f113--présentation-commune-du-livre). Aucun envoi n'est fait à ce stade.

**Décision confirmée le 2 octobre 2026 — feuille d'aventure et règles du
jeu :** pour un récit à choix, l'adulte peut ajouter une page « Feuille
d'aventure », composée de sections selon
[F04.2](#f042--objets-de-lhistoire), et une partie « Règles du jeu » à la
page « Comment lire ce livre ». Toutes deux sont facultatives et absentes du
récit classique. La feuille suit « Comment lire ce livre » et précède le
récit (décision du 2 octobre 2026). Elle peut être composée par
l'application ou remplacée par une image, et occuper plusieurs pages, selon
les décisions du 3 octobre 2026 ci-dessus.

**Approfondissements différés :** formats retenus, gabarits de présentation,
éléments de couverture et formats des fichiers exportés, adaptation aux
contraintes d'impression, pages supplémentaires (carte, dédicace), image en
ligne dans les pages de présentation. Le sort des pages en image dans une
version partagée est décidé le 3 octobre 2026 en
[F12.1](#f121--partager-une-version-du-récit). La pagination des pages hors récit est décidée le
3 octobre 2026. La distinction entre
intérieur et couverture concerne les modes personnel/classe et classique/choix.

### F11.5 — Ordre imprimé et numérotation du récit à choix

**Objectif :** proposer un premier ordre des passages numérotés qui préserve
la découverte du lecteur, puis le garder stable pendant la préparation du livre.
Le récit classique n'est pas concerné : son ordre imprimé est celui du plan,
selon [F03.1](#f031--histoire-parties-chapitres-et-scènes).

**Décisions confirmées le 30 septembre 2026 :**

- **Ordre initial proposé :** à la première composition, les scènes incluses
  sont mélangées à l'intérieur de chaque partie, les parties restant dans
  l'ordre du plan. Le mélange évite de placer côte à côte les conséquences
  des options d'un même choix, qu'un enfant lirait par accident. Cet ordre
  est une proposition de départ que les ajustements de [F11.3](#f113--présentation-commune-du-livre)
  peuvent ensuite modifier.
- **Regroupement de parties :** l'adulte peut réunir plusieurs parties pour
  que toutes leurs scènes soient mélangées ensemble, par exemple lorsque des
  parties sont très courtes. Sans regroupement, chaque partie forme son propre ensemble mélangé.
- **Départ au n° 1 :** la scène de départ du livre reçoit toujours le premier
  numéro, quel que soit son rang dans le plan.
- **Numérotation continue :** les passages sont numérotés de 1 à N sur les
  seules scènes incluses ; une scène exclue ne reçoit pas de numéro et ne
  laisse pas de trou.
- **Titres de chapitre :** ils ne sont pas imprimés entre les passages du livre
  à choix, puisque les scènes d'un chapitre y sont dispersées.
- **Titres de partie :** un réglage du livre permet de les imprimer ou non.
  Chaque partie possède une scène d'ouverture, par défaut la première scène
  de son premier chapitre dans le plan, modifiable par l'adulte ; le titre de
  la partie s'imprime juste au-dessus de cette scène. La scène d'ouverture de
  la première partie d'un groupe de mélange est placée en tête de ce groupe ;
  celles des autres parties du groupe restent mélangées, avec leur titre.
  La scène de départ garde le n° 1 : elle ouvre donc le premier groupe.
- **Numéros fixés :** un numéro fixé par l'adulte selon F11.3 ou par une
  liaison cachée de [F05.1](#f051--liaisons-cachées-par-énigme) prime sur
  le mélange et sur l'insertion des nouvelles scènes.
- **Ordre conservé d'un export à l'autre :** l'ordre imprimé est établi à la
  première composition — c'est-à-dire dès qu'un numéro doit être affiché, y
  compris dans une phrase de choix de l'éditeur selon
  [F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène) (précisé le
  1er octobre 2026) — puis conservé ; il n'est pas recalculé à chaque export.
  Une nouvelle scène incluse est ajoutée à la suite de son groupe de mélange
  et l'adulte en est informé ; une scène exclue libère sa place. Révisé le
  3 octobre 2026 : elle était d'abord insérée parmi les scènes mélangées ;
  avant la mise en page l'ordre compte peu, et l'agencement le reprend. Les numéros
  qui suivent peuvent se décaler : c'est accepté, les références stables du
  PDF de travail de [F11.2](#f112--pdf-de-travail-et-pdf-définitif) permettant
  de retrouver les annotations.
- **Nouveau mélange sur demande — retiré le 3 octobre 2026 :** la décision
  du 30 septembre permettait un nouveau mélange global sur demande explicite
  de l'adulte, après avertissement. Le porteur la retire : un mélange au
  hasard ne réduit pas les blancs et change tous les numéros ; reprendre
  l'ordre du livre relève de l'agencement ci-dessous. Le mélange initial,
  fait une fois, et la réunion de parties dans un même groupe de mélange
  restent inchangés. Aucun gel global des numéros n'est prévu dans la
  première livraison, en dehors du numéro fixé d'un passage selon F11.3.

**Décisions confirmées le 30 septembre 2026 — choix, renvois et fins imprimés :**

- **Emplacement :** une phrase de choix s'imprime là où l'auteur l'a placée
  dans le texte, le plus souvent à la fin du passage ; sa forme est définie
  en [F05](#f05--retrouver-les-scènes-et-relier-les-choix).
- **Renvoi :** le numéro de destination est produit par la composition,
  jamais saisi à la main. La rubrique « Phrases de choix » de la préparation,
  selon [F11.6](#f116--trois-temps-pour-préparer-le-livre), propose une
  formule parmi quelques-unes : « rends-toi au 12 » par défaut, « → 12 », « va au 12 ».
  Elle sert à composer les phrases de choix automatiques, avec les
  constructions de F05 (précisé le 1er octobre 2026). Dans une phrase
  personnalisée, l'auteur écrit lui-même le texte et la ponctuation autour
  de chaque numéro.
- **En-tête courant :** dans le livre à choix, l'en-tête de chaque page indique
  les numéros des passages qu'elle contient, par exemple « 12 – 14 ».
- **Marque de fin :** une scène de fin imprime une marque après son texte,
  « Fin » par défaut, dont la formule se règle dans la rubrique « Phrases
  de choix ».
- **Fin portant des choix :** une scène de fin peut conserver des choix, par
  exemple « retenter ta chance au 1 », sans blocage ni avertissement ; la
  marque de fin s'imprime avant ces choix. Si l'adulte retire le repère de fin,
  les contrôles de F09.2 s'appliquent de nouveau.
- **Repère de fin réservé à l'adulte :** dans la première livraison, seul
  l'adulte pose ou retire ce repère ; le profil « écriture et organisation »
  ne le pose pas, comme les autres raccords réservés.

**Variantes :** règles identiques en mode personnel et en mode classe ; seul
l'adulte agit sur l'ordre imprimé. Le mélange et la numérotation des passages
ne s'appliquent pas au récit classique : les titres de partie, et de chapitre
si l'adulte le souhaite, y sont imprimés à leur place naturelle dans l'ordre du plan,
et un séparateur discret distingue les scènes, sans renvoi ni numéro.

**Critères d'acceptation :**

- **F11-AC16 — Mélange par partie :** étant donné « Les passeurs de brume »
  avec trois parties non regroupées, lorsque l'adulte compose le livre pour
  la première fois, alors toutes les scènes de la partie 1 précèdent celles
  de la partie 2, qui précèdent celles de la partie 3, et l'ordre des scènes
  d'une même partie ne suit pas nécessairement le plan.
- **F11-AC17 — Parties regroupées :** étant donné les parties 2 et 3
  regroupées, lorsque l'ordre initial est proposé, alors leurs scènes peuvent
  être entremêlées tandis que celles de la partie 1 restent avant elles.
- **F11-AC18 — Départ en tête :** étant donné une scène de départ placée dans
  le deuxième chapitre du plan, lorsque le livre est composé, alors elle porte
  le n° 1.
- **F11-AC19 — Ordre stable :** étant donné un livre déjà composé, lorsque
  l'adulte réexporte sans modification, alors chaque scène garde son numéro ;
  lorsqu'il ajoute une scène dans la partie 1, alors elle prend place à la
  suite des passages de cette partie, l'adulte en est informé et les autres
  scènes gardent leur ordre relatif.
- **F11-AC20 — Exclusion sans trou :** étant donné un livre de 40 passages,
  lorsque l'adulte exclut le n° 17, alors le livre suivant compte 39 passages
  numérotés sans interruption.
- **F11-AC33 — Renvoi recalculé :** étant donné le choix « Si tu suis la
  lanterne » vers B au n° 12 et la formule « rends-toi au », lorsque B passe
  au n° 15 après une insertion, alors le PDF suivant imprime « rends-toi au 15 »
  sans intervention de l'adulte.
- **F11-AC34 — Fin avec possibilité de recommencer :** étant donné une scène
  de fin portant le choix « Retenter ta chance » vers le départ, lorsque les
  contrôles s'exécutent, alors elle n'est pas signalée et le PDF imprime la
  marque de fin avant ce choix.
- **F11-AC21 — Pas de nouveau mélange (révisé le 3 octobre 2026) :** étant
  donné un livre déjà composé, lorsque l'adulte veut reprendre l'ordre des
  passages, alors aucune commande ne mélange à nouveau tout le livre au
  hasard ; il déplace un passage, valide un passage suggéré ou relance « Réordonner
  les passages ».
- **F11-AC22 — Titre au-dessus de l'ouverture :** étant donné le réglage
  d'impression des titres de partie activé et la partie 2 « Le marais » non
  regroupée, lorsque le livre est composé, alors sa scène d'ouverture est le
  premier passage de la partie 2 et porte le titre « Le marais » au-dessus de son texte.
- **F11-AC23 — Titre dans un groupe mélangé :** étant donné les parties 2 et 3
  regroupées avec l'impression des titres activée, lorsque le livre est composé,
  alors l'ouverture de la partie 2 est en tête du groupe et l'ouverture de la
  partie 3, placée parmi les scènes mélangées, porte le titre de la partie 3.

**Décisions confirmées le 3 octobre 2026 — titres et nouvelle page :** deux
réglages valent pour le livre entier.

- **« Chaque partie commence sur une nouvelle page » :** activé par défaut.
  Il concerne une partie qui ouvre son groupe de mélange dans le récit à
  choix, et toute partie dans le récit classique.
- **Partie mélangée dans un groupe :** son titre reste dans le fil du texte,
  au-dessus de sa scène d'ouverture, quel que soit ce réglage ; une nouvelle
  page couperait le groupe.
- **« Chaque chapitre commence sur une nouvelle page » :** récit classique
  seulement, désactivé par défaut ; le titre de chapitre est alors dans le
  fil du texte.
- **Cas isolé :** l'ajustement « commencer sur une nouvelle page » de F11.3
  reste disponible pour une scène, avec le titre qui la surmonte.
- **Pages peu remplies :** le blanc qui précède une nouvelle partie, un
  nouveau chapitre ou un saut demandé par l'adulte n'est pas compté par le
  repérage de F11.3.

- **F11-AC54 — Partie sur une nouvelle page :** étant donné le réglage par
  défaut et la partie 2 « Le marais » non regroupée, lorsque le livre est
  composé, alors son titre et sa scène d'ouverture commencent en haut d'une
  page ; le réglage désactivé, ils suivent le dernier passage de la partie 1
  sur la même page s'ils y tiennent selon les règles de coupure.
- **F11-AC55 — Titre dans un groupe mélangé :** étant donné les parties 2 et
  3 regroupées et le réglage activé, lorsque le livre est composé, alors le
  titre de la partie 3 est imprimé au-dessus de sa scène d'ouverture sans
  saut de page avant lui.

**Décisions confirmées le 3 octobre 2026 — agencement du livre :** idée du
porteur, pour simplifier les retouches. À l'écran, la commande s'appelle
« Réordonner les passages » : le porteur juge « agencer » peu clair.

- **Première livraison :** l'agencement en fait partie. Une première
  consignation l'avait placé dans une livraison ultérieure ; le porteur
  précise le même jour que ce n'était pas son intention.
- **Principe :** un nouvel ordre des passages, calculé dans chaque groupe de
  mélange pour laisser le moins de blanc possible.
- **Moment :** c'est la deuxième section des réglages de « Mettre en
  page », « Ordre des passages », selon
  [F11.6](#f116--trois-temps-pour-préparer-le-livre), après « Texte et
  pages », dont les réglages changent la hauteur des passages. Cette étape ne
  s'ouvrant que lorsque toutes les scènes sont prêtes et les chemins
  vérifiés, l'agencement porte toujours sur un livre complet.
- **Proposé, jamais imposé :** l'adulte l'accepte ou choisit « Garder cet
  ordre », et peut l'annuler. L'agencement n'est jamais recalculé à chaque
  composition : l'ordre reste conservé d'un export à l'autre, selon
  F11-AC19. Corriger une coquille après l'agencement ne change aucun numéro.
- **Relance à la demande :** l'adulte peut le relancer quand il le veut. Le
  calcul repart de zéro : les passages déplacés depuis, à la main ou sur
  suggestion, perdent leur place après avertissement ; les réglages de
  « Texte et pages » et les images sont conservés. Motif du porteur : les
  retouches sont peu nombreuses, ce sont les réglages qui prennent du temps,
  et eux ne sont pas à refaire.
- **Doute après une modification (4 octobre 2026) :** lorsqu'une scène ou
  un réglage de mise en page change après l'agencement — scène rouverte
  puis de nouveau prête, scène ajoutée, exclue ou réintégrée, police ou
  marges changées —, la section « Ordre des passages » le signale et
  demande à l'adulte de garder l'ordre ou de réordonner à nouveau, sans
  rien faire d'elle-même, dès qu'un passage au moins change de page. La
  règle et son effet sur la déclaration « La
  mise en page me convient » sont en
  [F11.6](#f116--trois-temps-pour-préparer-le-livre) ; elle remplace la
  simple « relance proposée » du 3 octobre.
- **PDF déjà produits :** un PDF définitif ne change plus, selon
  [F11.2](#f112--pdf-de-travail-et-pdf-définitif). Une relance ultérieure
  donne lieu à un nouveau PDF définitif, dont les numéros peuvent différer ;
  la version partagée garde les numéros de son instantané, selon
  [F12.1](#f121--partager-une-version-du-récit).
- **Ce qui ne bouge pas :** le départ au n° 1, les numéros fixés, l'ouverture
  en tête de son groupe, les débuts sur une nouvelle page.
- **Écart entre passages liés :** un passage n'est pas placé sur la même
  double page que le passage qui y mène. C'est un effort au mieux : une
  partie de six passages sur trois pages ne peut pas toujours le tenir, et
  rien n'est alors signalé. Cette règle remplace, pour l'agencement, le
  simple « pas côte à côte » du mélange initial.
- **Avant la mise en page :** le mélange initial reste celui du
  30 septembre. L'ordre est établi dès qu'un numéro doit s'afficher, quand
  les textes ne sont pas écrits : il n'existe alors ni page ni hauteur à
  optimiser, et l'ordre compte peu. Une nouvelle scène s'ajoute à la suite
  de son groupe.
- **Limites annoncées :** l'agencement est calculé sur un modèle approché de
  la mise en page, non par compositions répétées ; il laisse des blancs, que
  les retouches de F11.3 réduisent ensuite. Ce modèle reste à éprouver :
  c'est la part la plus incertaine de la première livraison, et l'essai
  n'est pas autorisé à ce stade.

- **F11-AC64 — Agencement proposé (révisé) :** étant donné un livre de
  145 pages dont douze sont peu remplies, lorsque l'adulte arrive à la
  section « Ordre des passages » des réglages de « Mettre en page » (une
  tâche jusqu'au 4 octobre 2026), alors l'application le propose en annonçant
  que les numéros changeront, sauf le départ et les numéros fixés ; s'il
  choisit « Garder cet ordre », l'ordre est inchangé ; s'il accepte, les
  renvois suivent, aucune destination ne change et il peut annuler.
- **F11-AC65 — Ordre stable après agencement :** étant donné un livre agencé,
  lorsque l'adulte corrige une coquille dans S003 et que le livre est
  recomposé, alors chaque passage garde son numéro.
- **F11-AC66 — Écart au mieux :** étant donné le passage A dont un choix mène
  à B, lorsque le livre est agencé, alors B n'est pas sur la double page de
  A si un ordre le permet dans leur groupe de mélange ; sinon l'agencement
  est proposé tout de même, sans signalement.
- **F11-AC81 — Relance :** étant donné un livre agencé où l'adulte a placé le
  passage 31 après le n° 12, lorsque S028 est rouverte puis de nouveau
  déclarée prête et qu'un passage a changé de page, alors la section
  « Ordre des passages » lui demande de garder l'ordre ou de réordonner à
  nouveau ;
  s'il réordonne après l'avertissement, alors son déplacement est abandonné,
  la police et les marges choisies sont conservées et les numéros changent,
  sauf le départ et les numéros fixés ; s'il refuse, l'ordre est inchangé.
- **F11-AC82 — PDF fixé :** étant donné un PDF définitif du 18 juin, lorsque
  l'adulte réordonne les passages le 20 juin puis demande un nouveau PDF
  définitif, alors le fichier du 18 juin est inchangé et conservé, et le
  nouveau porte les nouveaux numéros.

**Questions ouvertes :** parties regroupables non consécutives ; présentation
de l'insertion d'une nouvelle scène ; commande de choix de la scène d'ouverture ;
pour l'agencement : même critère de double page pour les deux options d'un
même choix ; relance limitée aux pages qui suivent une scène modifiée.

### F11.6 — Trois temps pour préparer le livre

**Objectif :** guider l'adulte, tâche après tâche, de la relecture au livre
imprimé. Il ne met pas en page un texte qui change encore, et un enseignant
qui découvre l'outil sait à chaque écran ce qu'il a à faire.

**Constat du porteur, 3 octobre 2026 :** une fois l'écriture terminée, on
vérifie les coquilles et les enchaînements, puis seulement la mise en page.
Un écran qui propose tout à la fois fait perdre ce guidage. Après examen de
deux maquettes, il juge qu'une ligne d'étapes ne suffit pas : chaque étape
montrait un inventaire de problèmes, pas une marche à suivre.

**Lecture de cette section :** les règles ci-dessous sont celles en vigueur,
décidées par le porteur les 3 et 4 octobre 2026 ; trois critiques
d'ergonomie de la maquette ont conduit à les réviser. Les propositions qui
restent à confirmer sont signalées à leur place. Ce que ces règles ont
remplacé et les alternatives écartées sont réunis en fin de section, avec
leurs dates et leurs motifs.

**Cadre (3 octobre 2026, complété le 4) :**

- **Un seul outil, trois temps :** « Relire », « Vérifier les chemins »,
  « Mettre en page ». Les trois utilisent le même aperçu du livre et le même
  éditeur de scène ouvert à côté, selon
  [F11.2](#f112--pdf-de-travail-et-pdf-définitif).
- **Une étape d'arrivée, « Imprimer et partager » :** elle suit les trois
  temps et réunit le PDF définitif, les PDF définitifs conservés, l'aide à la
  couverture et le partage de
  [F12.1](#f121--partager-une-version-du-récit). Ce n'est pas un quatrième
  temps : elle n'utilise pas l'aperçu.
- **Commandes et problèmes du temps en cours seulement :** chaque temps ne
  propose que ses commandes et ne montre que ce qui se traite chez lui.
  L'éditeur de la scène reste disponible dans les trois, car une coquille se
  corrige où on la voit. La ligne d'étapes signale en permanence, par une
  marque, qu'il reste quelque chose dans une étape : un problème n'est
  jamais masqué, il est rangé. Le détail se lit dans l'étape.
- **Défauts à « Relire », mise en page sans défaut (4 octobre, seconde
  critique) :** les
  avertissements d'image et de contenu (image peu définie, contenu hors des
  marges) se traitent à « Relire », avec les erreurs graves. « Mettre en
  page » ne sert qu'à décider la mise en page et à régler les blancs. Comme
  tout avertissement, ils sont corrigés ou acceptés avant que « Mettre en
  page » ne s'ouvre. Si un réglage de mise en page en fait apparaître un
  nouveau, « Relire » perd sa coche et le montre ; rien ne se referme.
- **« Vérifier les chemins » garde l'aperçu (4 octobre, seconde
  critique) :** l'aperçu permet
  de suivre un renvoi et de corriger la scène sur place, et les deux
  premières étapes, qui se font ensemble, gardent la même disposition.
  Ouvrir la scène d'un point l'affiche à côté de l'aperçu placé sur son
  passage ; la fermer ramène à la liste.
- **Retour depuis une scène ouverte (4 octobre, seconde critique) :** partout où la
  destination Livre ou le Suivi filtré mène à une scène, l'adulte revient
  d'un geste à l'endroit qu'il a quitté, sans le bouton « Précédent » du
  navigateur.
- **Messages courts (4 octobre, seconde critique) :** un point à traiter se dit en une phrase
  simple (« Image introuvable. », « Cette scène est une impasse. ») ; le
  détail est donné quand l'adulte traite la scène.
- **PDF de travail au temps « Relire » seulement :** le porteur le juge peu
  utilisé et source de confusion avec le PDF définitif ; il est proposé au
  moment où il sert, pour relire sur papier. Ses règles de F09.2 et de F11.2
  sont inchangées.

**Ordre et ouverture des étapes (3 octobre 2026, complété le 4) :**

- **Deux temps ouverts dès le début :** « Relire » et « Vérifier les
  chemins ». L'adulte passe de l'un à l'autre librement.
- **« Mettre en page » s'ouvre quand les deux premiers sont terminés :** plus
  aucun problème bloquant, et chaque avertissement corrigé ou accepté. Il
  n'existe pas de passe-droit. Depuis le 4 octobre, une étape n'est
  terminée qu'une fois sa déclaration posée (voir « Ce qui se valide ») ;
  que la déclaration soit ainsi requise pour ouvrir « Mettre en page » se
  déduit de ces deux règles et reste à confirmer.
- **« Imprimer et partager » s'ouvre quand l'adulte déclare « La mise en
  page me convient ».** Qui ne veut que la lecture en ligne fait cette
  déclaration sans rien retoucher.
- **Une étape fermée dit pourquoi :** elle indique ce qui reste à faire et
  mène au temps où cela se traite.
- **Une étape ouverte ne se referme pas :** si une scène est rouverte ou
  qu'un problème réapparaît, l'étape concernée perd sa coche et dit ce qui
  reste ; les étapes déjà ouvertes restent accessibles avec le travail fait.
  Le PDF définitif, le partage et sa mise à jour sont alors refusés par leurs
  propres règles (F09.2, F11.2, F12.1) ; retirer le partage et changer de
  lien restent possibles.
- **Scène en retard :** l'adulte l'attend, la termine lui-même ou l'exclut du
  livre selon F11.2. Rien d'autre n'ouvre la mise en page.
- **« Exclure du livre » (4 octobre, seconde critique) :** la commande se trouve dans le menu
  de la scène, donc aussi quand la scène est ouverte à côté de l'aperçu.
  Elle reste absente des listes de la destination Livre. Le porteur
  confirme qu'elle manquait : sans passe-droit, une scène en retard se
  termine ou s'exclut.
- **Issue nommée là où l'on est arrêté (4 octobre, troisième
  critique) :** le Suivi filtré sur
  les scènes à finir et l'écran d'une étape fermée disent les deux issues,
  finir la scène ou l'exclure du livre. La commande reste dans le menu de
  la scène.
- **Motif du porteur :** la mise en page dépend de la longueur de toutes les
  scènes ; réordonner les passages recommence les retouches
  ([F11.5](#f115--ordre-imprimé-et-numérotation-du-récit-à-choix)). Mettre
  en page un livre incomplet est un travail à refaire.

**Tâches de « Relire » et de « Vérifier les chemins » (3 octobre 2026,
précisé le 4) :** ces deux étapes sont découpées en tâches, présentées dans
l'ordre. L'écran montre la tâche en cours ; les autres tiennent en une
ligne, faite ou à faire. Une tâche qui n'existe pas pour ce type de récit
est absente ; une tâche où il n'y a rien à faire reste affichée, cochée, à
sa place. À l'intérieur d'une étape ouverte, l'adulte peut revenir à une
tâche précédente. Proposition de la maquette, à confirmer : tant qu'il
reste des scènes à finir, dont les défauts ne sont pas encore contrôlés, la
tâche vide ne porte pas de coche et dit « Rien pour l'instant ».

- **Relire.** Ce temps sert à voir d'un coup d'œil ce qui reste, à corriger
  les erreurs graves et à lire le livre d'une traite en corrigeant les
  coquilles, sans ouvrir et fermer les scènes une à une.
  1. *Ce qui reste à écrire :* un décompte, par exemple « 4 scènes à finir »,
     qui ouvre le Suivi filtré. Les scènes ne sont pas listées ici.
  2. *Erreurs graves :* image manquante ou illisible, scène déclarée prête
     dont le texte est vide.
  3. *À confirmer :* image peu définie, contenu hors des marges ; chacun se
     corrige ou s'accepte. La largeur d'image non appliquée y est rappelée
     « à savoir ».
  4. *Lire et corriger :* lecture continue dans l'aperçu, scène ouverte à
     côté, PDF de travail pour relire sur papier, puis la déclaration « J'ai
     relu le livre ».
- **Vérifier les chemins.** Chaque point se règle en ouvrant la scène
  concernée ou, pour un avertissement, en l'acceptant.
  1. *Départ et fins :* départ absent, scènes sans choix ni fin.
  2. *Choix à relier :* sans destination, vers une scène exclue ou
     supprimée, numéro fixé devenu impossible.
  3. *Passages à confirmer :* inaccessibles depuis le départ, sans fin
     atteignable, sortie non assurée.
  4. *Tester la lecture :* lecture d'essai de [F09.1](#f091--playtest),
     facultative ; les renvois se suivent aussi dans l'aperçu ; puis la
     déclaration « J'ai vérifié les chemins ».

Scène à finir, contrôles d'écriture reportés (4 octobre, seconde critique) :
voir [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif).

**« Mettre en page » en deux volets (4 octobre 2026) :** on y décide la mise
en page et on règle les blancs ; aucun défaut ne s'y traite (seconde
critique). Les deux volets sont une idée du porteur, après la troisième.

- **Deux onglets, « Réglages » et « Aperçu »,** toujours visibles pendant
  le défilement, sans numéro. Chacun retrouve l'endroit qu'on y avait
  quitté.
- **« Réglages » ne contient que des réglages,** en trois sections dans
  l'ordre. « Texte et pages » : police, taille, alignement, marges, bas de
  page, nouvelles pages par partie ou par chapitre, impression des titres de
  partie et scènes d'ouverture. « Ordre des passages » : l'agencement de
  F11.5, accepté ou refusé, et les groupes de mélange ; absente en récit
  classique. « Pages de début et de fin » : pages de présentation de
  [F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture).
- **Les blancs se comblent dans « Aperçu » :** parcours des pages peu
  remplies, passages suggérés, scène ouverte à côté et ses commandes de
  passage de [F11.3](#f113--présentation-commune-du-livre). Le mot
  « Retouches » n'est plus affiché.
- **« La mise en page me convient » au bout de la barre des onglets,**
  visible des deux volets ; inactive, avec sa raison, tant qu'un doute sur
  l'ordre attend.
- **Livre entier dans l'aperçu de cette étape,** pages de présentation
  comprises (F11-AC80).
- **Les sections ne portent pas de coche :** la coche garde un seul sens,
  « il ne reste rien ».
- **Coût accepté :** une page de réglages d'environ deux écrans sur
  ordinateur, plus longue sur téléphone ; l'ordre des gestes ne tient plus
  qu'à la position des sections, le doute sur l'ordre et l'avertissement
  avant de réordonner restant les garde-fous.

**« Imprimer et partager » :** PDF définitif, PDF définitifs conservés, aide
à la couverture, partage.

**Ce qui se valide (3 octobre 2026, complété le 4) :** un fait que
l'application connaît est calculé ; seul un jugement se pose à la main.

- **Cinq jugements :** déclarer une scène prête pour le livre
  ([F11.1](#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre)),
  accepter un avertissement, déclarer « La mise en page me convient » et,
  depuis le 4 octobre 2026, déclarer « J'ai relu le livre » et « J'ai
  vérifié les chemins ». Ces deux déclarations, demandées par le porteur
  pour renforcer le guidage, terminent les deux premières étapes : avoir lu
  le livre ou suivi ses chemins ne se calcule pas. Chacune se pose à la
  dernière tâche de son étape, quand il ne reste rien aux tâches
  précédentes, et se retire. La lecture d'essai reste un moyen, non une
  obligation : l'application ne vérifie pas qu'elle a eu lieu.
- **Déclarations des deux premières étapes gardées (4 octobre, troisième
  critique) :** lorsqu'une scène est
  rouverte, l'étape perd sa coche et la retrouve quand la scène est de
  nouveau prête, sans nouvelle déclaration. C'est un guidage, non un
  contrôle.
- **Avertissement accepté :** l'adulte répond « C'est voulu » à un
  avertissement de F09.2 ou de F10 ; pour une image peu définie, le bouton
  dit « Garder ainsi », un dessin d'élève n'étant pas flou par intention
  (4 octobre 2026).
  Un problème bloquant ne s'accepte pas : il se corrige, sans
  contournement. Un avertissement accepté ne compte plus parmi ce qui reste
  à faire ; il reste consultable, l'acceptation se retire, et il est encore
  rappelé à la demande du PDF définitif et au partage.
- **Durée de l'acceptation :** elle tient tant que ce qui a été jugé n'a pas
  changé — les chemins pour un passage inaccessible, une fin hors d'atteinte
  ou une sortie non assurée ; l'image et sa largeur pour une image peu
  définie ; le contenu de la scène et les marges pour un contenu qui dépasse.
  Corriger une coquille dans un passage inaccessible ne la rouvre pas.
- **Coche :** elle remplace le numéro de l'étape. « Relire » et « Vérifier
  les chemins » la reçoivent lorsqu'il ne reste ni scène à finir, ni
  problème bloquant, ni avertissement à traiter, et que l'adulte a posé la
  déclaration de l'étape ; « Mettre en page » par la déclaration de
  l'adulte ; « Imprimer et partager » lorsque le PDF définitif est à jour.
  La coche garde un seul sens, « il ne reste rien ».
- **Marque d'attente (4 octobre, troisième critique) :** une étape à laquelle il ne reste que des scènes à
  finir porte un sablier, non le triangle « il reste à faire » : septembre
  ne doit pas paraître fautif. « Vérifier les chemins » ne porte pas de
  triangle tant qu'il reste des scènes à finir et rien à corriger ; ses
  points à confirmer restent listés dans sa tâche. Cette règle ne touche
  que la marque : les contrôles du plan de F09.2 restent actifs toute
  l'année.

**Doute sur l'ordre des passages (4 octobre 2026) :** idée du porteur.

- **Règle (seconde critique) :** une fois l'ordre des passages décidé, si une scène ou un
  réglage de mise en page change, la section « Ordre des passages » porte
  une marque et demande à l'adulte de choisir : « Garder cet ordre » ou
  « Réordonner à nouveau ». Tant qu'il n'a pas répondu, « La mise en page
  me convient » ne peut pas être déclarée.
- **Déclencheur (troisième critique) :** une seule règle. Le doute naît lorsqu'une scène
  modifiée ou un réglage de mise en page fait passer au moins un passage
  sur une autre page ; une coquille sans effet sur les pages ne demande
  rien (F11-AC65).
- **Doute et déclaration déjà faite (troisième critique) :** « Mettre en page » perd sa coche
  sans se refermer ; elle la retrouve si l'adulte garde l'ordre, et demande
  une nouvelle déclaration s'il réordonne.
- **Un seul libellé (troisième critique) :** « Garder cet ordre », à la
  section « Ordre des passages » comme au doute. L'avertissement de la réorganisation dit aussi ce qui rassure :
  « Les numéros changent, les renvois suivent. »

**Réglages répartis (3 octobre 2026, révisé le 4) :** chaque réglage se trouve là où il
sert.

- **Dans la préparation** ([F02](#f02--préparer-le-récit-et-les-décisions-communes)) :
  une rubrique « Phrases de choix » réunit la formule de renvoi, ses
  constructions et la marque de fin ; la feuille d'aventure, le dé et les
  règles du jeu rejoignent la rubrique des objets et des formules d'action
  de [F04.2](#f042--objets-de-lhistoire). Ils servent dès l'écriture : les
  phrases de choix dans l'éditeur, la feuille et le dé dans la lecture d'essai.
- **Dans « Mettre en page » :** les réglages communs de mise en page forment
  la section « Texte et pages », avant l'ordre des passages ; la forme des
  pages de présentation est la dernière section.
- **Aperçu limité au récit :** aux temps « Relire » et « Vérifier les
  chemins », l'aperçu commence au premier passage et ne montre pas les pages
  de présentation ; à « Mettre en page », il montre le livre entier, depuis
  la page de titre. Les pages gardent leur numéro. Le PDF de travail reste
  le livre entier.
- **Conséquence acceptée :** police, taille et marges ne se règlent pas
  avant l'ouverture de « Mettre en page ». Le PDF de travail de l'année
  utilise les réglages de départ ; le porteur le juge peu utilisé et destiné
  à la seule relecture.

**Aide à l'ouverture d'une étape (3 octobre 2026, complété le 4) :** idée du
porteur. À l'ouverture d'une étape, un écran très simple donne son titre et
trois ou quatre questions (« Que fait-on maintenant ? », « Que veut
dire… ? ») ; l'adulte lit les réponses qu'il veut ou choisit « Commencer ».
La réponse à « Que fait-on maintenant ? » est visible d'emblée, avec les
tâches de l'étape ; les autres questions restent repliées. L'écran porte
une case « Ne plus afficher », décochée au départ : tant qu'elle n'est pas
cochée, il revient à l'ouverture de l'étape. Un bouton d'aide discret
rouvre cet écran à tout moment. La mascotte envisagée n'est pas retenue à
ce stade ; un personnage pourra illustrer cet écran plus tard sans en
changer le rôle.

**Proposition à confirmer :** une aide qui, refermée par « Commencer », ne
revient pas avant la visite suivante de la destination Livre.

**Variantes (3 octobre 2026) :**

- **Récit classique, deux temps :** « Relire » et « Mettre en page », suivis
  de l'étape d'arrivée. « Mettre en page » s'ouvre lorsque « Relire » est
  terminé. La lecture d'essai y est proposée à « Relire ». Ni rubrique
  « Phrases de choix », ni feuille d'aventure, ni réorganisation des passages.
- **Modes personnel et classe :** mêmes étapes, mêmes règles d'ouverture.
- **À l'ouverture de la destination Livre :** l'application affiche la
  dernière étape quittée, et « Relire » la première fois.

**Ce que ces règles ont remplacé :**

- **Temps « affichés, non verrouillés » (matin du 3 octobre) :** remplacés
  le même jour, après une critique d'ergonomie, par l'ordre des étapes sans
  passe-droit.
- **Décomptes écrits sous chaque nom d'étape :** remplacés le 4 octobre par
  une marque ; le détail se lit dans l'étape.
- **Coche du matin du 3 octobre,** calculée seulement et accordée malgré des
  points à vérifier : remplacée le même jour par les règles de coche
  actuelles. Le 4 octobre, le calcul ne suffit plus aux deux premières
  étapes, qui demandent aussi leur déclaration, et le sens unique de la
  coche, « il ne reste rien », est précisé.
- **Page « Réglages du livre », placée hors des temps le matin du
  3 octobre :** supprimée le même jour, les réglages étant répartis.
- **Avertissements d'image et de contenu à « Mettre en page » :** déplacés
  à « Relire » le 4 octobre.
- **« Vérifier les chemins » sans aperçu :** le porteur a d'abord décidé, le
  4 octobre, de retirer l'aperçu au profit de la seule lecture d'essai, puis
  y est revenu le même jour après avoir vu la maquette.
- **Tâche « sans objet » sautée (3 octobre) :** elle reste affichée depuis
  le 4 octobre ; la liste changeait d'une visite à l'autre.
- **Aide « montrée une fois par enseignant » :** remplacée le 4 octobre par
  la case « Ne plus afficher », idée du porteur ; la première ouverture a
  souvent lieu en septembre, des mois avant l'usage réel.
- **« Relance proposée » de
  [F11.5](#f115--ordre-imprimé-et-numérotation-du-récit-à-choix) et
  déclaration « retirée à la relance », d'abord proposée :** remplacées le
  4 octobre par le doute sur l'ordre des passages.
- **Libellé « L'ordre me convient encore » :** abandonné le 4 octobre pour
  « Garder cet ordre ».
- **« Mettre en page » en cinq tâches** (texte et pages, réordonner les
  passages, retouches, pages de début et de fin, « La mise en page me
  convient »), affichées une à la fois, en onglets de tâches demandés le
  matin du 4 octobre : remplacée le même jour par les deux volets. Le
  bouton d'aller-retour vers l'aperçu, proposé ce jour-là, est retiré.
  Les onglets de tâches posaient une seconde rangée de ronds numérotés sous
  celle des étapes (« 3 Mettre en page » au-dessus de « 3 Retouches »), et
  l'aperçu, placé sous les réglages, demandait ce bouton. Les deux
  premières étapes gardent leurs tâches, en colonne à côté de l'aperçu.
- **Pages de présentation montrées dans l'aperçu à la seule tâche « Pages
  de début et de fin » :**
  depuis le 4 octobre, l'aperçu de « Mettre en page » montre le livre
  entier.

**Alternatives écartées :** les sept premières le 3 octobre 2026, les deux
suivantes le 4 après la seconde critique, la dernière le 4 pendant la
troisième.

- **Deux outils séparés,** l'un pour relire, l'autre pour mettre en page :
  récrire une phrase sert aussi à mettre en page, et deux aperçus seraient
  à maintenir.
- **Un onglet de projet distinct pour l'impression et le partage :** il
  séparerait le but du chemin qui y mène.
- **Un « passer quand même » après avertissement,** proposé pendant
  l'entretien pour le soir où une seule scène manque.
- **Des étapes qui se referment :** elles couperaient l'accès au retrait
  d'un partage et au travail de mise en page déjà fait.
- **Faire valider chaque tâche à la main,** idée d'abord avancée par le
  porteur : cocher un fait que l'application connaît est inutile s'il est
  vrai et trompeur s'il est faux.
- **Les pages de présentation dans « Imprimer et partager »,** idée du
  porteur : elles demandent l'aperçu (parité des pages, feuille sur deux
  pages) et une relecture (les prénoms).
- **« Texte et pages » accessible avant l'ouverture de l'étape,** proposée
  pendant l'entretien : le porteur préfère un seul endroit, facile à
  retrouver.
- **Un écran de septembre disant que ce n'est pas encore le moment,**
  proposé pendant la critique : le porteur tient à voir tôt à quoi
  ressemblera le livre, ce qui motive, et à relire le peu qui existe.
- **Un bouton « La mise en page me convient » laissé actif avec une
  confirmation supplémentaire,** autre idée du porteur : moins simple
  qu'une seule question posée là où elle se règle.
- **Garder les cinq onglets de « Mettre en page » en retirant seulement
  leurs ronds numérotés,** proposé pendant la troisième critique : l'aperçu
  restait loin des réglages.

**Critères d'acceptation :**

- **F11-AC61 — Commandes du temps en cours :** étant donné un livre au temps
  « Relire » dont S003 contient « la brume s'épaissi », lorsque l'adulte
  ouvre S003 depuis l'aperçu, alors il corrige le mot dans l'éditeur, et ni
  le déplacement du passage ni le repérage des pages peu remplies ne lui sont
  proposés ; au volet « Aperçu » de « Mettre en page », la même scène
  ouverte propose ces commandes et le même éditeur.
- **F11-AC62 — Problème toujours visible :** étant donné « Mettre en page »
  déjà ouverte, lorsqu'un choix de S023 perd sa destination, alors l'étape
  « Vérifier les chemins » perd sa coche et porte la marque « il reste à
  faire », l'étape « Imprimer et partager » la porte aussi, et l'adulte
  l'apprend sans changer d'étape ; le point à corriger se lit en ouvrant
  « Vérifier les chemins » (révisé le 4 octobre 2026).
- **F11-AC63 — Mise en page fermée (révisé) :** étant donné un livre dont
  quatre scènes ne sont pas déclarées prêtes et dont deux passages sont
  sans choix ni fin, lorsque l'adulte choisit « Mettre en page », alors
  l'étape ne s'ouvre pas, lui indique « 4 scènes à finir » et « 2 points à
  corriger » et le mène au temps de chacun ; aucune commande ne permet de
  passer outre.
- **F11-AC69 — Récit classique :** étant donné un récit classique, lorsque
  l'adulte ouvre la destination Livre, alors deux temps lui sont proposés,
  « Relire » et « Mettre en page », et une image manquante lui est signalée
  dès « Relire ».
- **F11-AC70 — Formule de renvoi dans la préparation (révisé) :** étant
  donné un projet en septembre, lorsque l'adulte veut passer de « rends-toi
  au » à « va au », alors il le fait dans la rubrique « Phrases de choix »
  de la préparation, sans ouvrir la destination Livre.
- **F11-AC71 — PDF de travail à la relecture :** étant donné un livre de
  septembre dont trente-huit scènes ne sont pas prêtes, lorsque l'adulte est
  au temps « Relire », alors le PDF de travail lui est proposé et il
  l'obtient ; au temps « Vérifier les chemins », la commande n'est pas affichée.
- **F11-AC72 — Arrivée fermée, puis toujours accessible (révisé) :** étant
  donné neuf problèmes bloquants et une étape « Imprimer et partager »
  jamais ouverte, lorsque l'adulte la choisit, alors elle ne s'ouvre pas et
  dit ce qui reste ; étant donné cette étape ouverte et un livre partagé,
  lorsque S028 est rouverte aux élèves, alors l'étape reste accessible, la
  mise à jour du partage est refusée avec son motif, la version partagée
  reste lisible et l'adulte peut retirer le partage.
- **F11-AC73 — Coche (révisé) :** étant donné un temps « Vérifier les
  chemins » auquel il reste un choix sans destination et un passage
  inaccessible depuis le départ, lorsque l'adulte désigne la destination,
  alors l'étape garde son numéro et sa marque, et la tâche « Passages à
  confirmer » indique un point ; lorsqu'il répond « C'est voulu » pour le
  passage inaccessible, alors l'étape n'a plus de marque et « J'ai vérifié
  les chemins » devient possible ; lorsqu'il le déclare, alors l'étape
  porte une coche (révisé le 4 octobre 2026).
- **F11-AC75 — Acceptation durable :** étant donné S043, inaccessible depuis
  le départ et acceptée, lorsque l'adulte y corrige une coquille, alors
  l'acceptation tient ; lorsqu'un choix vient à y mener puis est supprimé,
  alors l'avertissement est de nouveau à traiter.
- **F11-AC76 — Scène rouverte après la mise en page :** étant donné les
  quatre étapes ouvertes, lorsque l'enseignant rouvre le travail élève de
  S028, alors « Relire » perd sa coche et indique « 1 scène à finir » dans
  sa première tâche,
  « Mettre en page » reste accessible avec ses retouches, et le PDF définitif
  est refusé jusqu'à la nouvelle déclaration « prête ».
- **F11-AC77 — La mise en page me convient :** étant donné « Relire » et
  « Vérifier les chemins » terminés, lorsque l'adulte déclare « La mise en
  page me convient » sans avoir rien retouché, alors « Mettre en page »
  porte une coche, « Imprimer et partager » s'ouvre et le PDF définitif peut
  être demandé.
- **F11-AC78 — Scènes à finir renvoyées au Suivi :** étant donné quatre
  scènes non déclarées prêtes, lorsque l'adulte est au temps « Relire »,
  alors il lit « 4 scènes à finir » sans leur liste, et ce décompte ouvre le
  Suivi filtré sur ces quatre scènes.
- **F11-AC79 — Aide à l'ouverture d'une étape (révisé le 4 octobre
  2026) :** étant donné un enseignant qui ouvre « Vérifier les chemins »,
  lorsque l'étape s'affiche, alors il voit son titre, quelques questions,
  la case « Ne plus afficher » et « Commencer » ; lorsqu'il coche la case,
  alors l'étape s'ouvre ensuite directement et le bouton d'aide rouvre cet
  écran.
- **F11-AC80 — Aperçu limité au récit :** étant donné un livre dont les
  pages de présentation occupent les pages 1 à 4, lorsque l'adulte est au
  temps « Relire », alors l'aperçu commence au passage 1, page 5 ; à
  « Mettre en page », il montre le livre depuis la page 1 (révisé le
  4 octobre 2026).
- **F11-AC84 — Image peu définie à « Relire » :** étant donné le dessin de
  S014, peu défini à 60 % de largeur, lorsque l'adulte est à « Relire »,
  alors la tâche « À confirmer » le lui présente avec « Garder ainsi », et
  « Mettre en page » ne s'ouvre pas tant qu'il n'a ni réduit l'image ni
  répondu ; à « Mettre en page », aucun défaut ne lui est présenté.
- **F11-AC85 — Scène ouverte depuis un point, puis refermée :** étant
  donné S029, sans choix ni fin, lorsque l'adulte est à « Vérifier les
  chemins », alors l'étape lui dit « Cette scène est une impasse. » à côté
  de l'aperçu ; lorsqu'il choisit « Ouvrir la scène », alors la
  scène s'affiche à côté de l'aperçu placé sur son passage ; lorsqu'il la
  ferme, alors il retrouve la liste des points de l'étape.
- **F11-AC86 — Doute sur l'ordre :** étant donné des passages réordonnés,
  lorsque l'adulte allonge S028 de dix lignes, alors la section « Ordre
  des passages » des réglages porte une marque et « La mise en page me convient » ne
  peut pas être déclarée ; lorsqu'il répond « Garder cet ordre »,
  alors la marque disparaît, aucun numéro ne change et la déclaration
  redevient possible.
- **F11-AC89 — Septembre sans alerte :** étant donné trente-neuf scènes à
  finir et deux passages auxquels aucun chemin ne mène, lorsque l'adulte
  ouvre la destination Livre, alors « Relire » porte un sablier, aucune
  étape ne porte de triangle, et les deux
  passages figurent dans la tâche « Passages à confirmer ».
- **F11-AC90 — Tâche vide gardée :** étant donné un livre sans erreur
  grave dont toutes les scènes sont prêtes, lorsque l'adulte ouvre
  « Relire », alors la tâche « Erreurs graves » est affichée, cochée, et
  « Lire et corriger » garde son rang.
- **F11-AC92 — Deux volets :** étant donné « Mettre en page » ouverte,
  lorsque l'adulte fait défiler les réglages jusqu'aux pages de début et de
  fin puis choisit « Aperçu », alors il voit le livre depuis la page de
  titre et le parcours des pages peu remplies ; lorsqu'il revient à
  « Réglages », alors il retrouve l'endroit qu'il avait quitté ; les deux
  onglets et « La mise en page me convient » sont restés en vue.
- **F11-AC91 — Déclaration gardée :** étant donné « J'ai relu le livre »
  déclaré, lorsque S028 est rouverte puis de nouveau déclarée prête, alors
  « Relire » retrouve sa coche sans nouvelle déclaration.
- **F11-AC88 — « J'ai relu le livre » :** étant donné un livre dont toutes
  les scènes sont prêtes, sans erreur grave ni point à confirmer, lorsque
  l'adulte ouvre « Relire », alors l'étape porte encore son numéro et la
  tâche « Lire et corriger » lui propose « J'ai relu le livre » ; lorsqu'il
  le déclare, alors l'étape porte une coche ; étant donné quatre scènes à
  finir, alors la déclaration ne peut pas être posée et l'écran dit
  pourquoi.
- **F11-AC87 — Exclure depuis la scène :** étant donné S061, seule scène à
  finir, lorsque l'adulte l'ouvre depuis le Suivi filtré et choisit
  « Exclure du livre » dans son menu, alors elle porte le repère « hors du
  livre », « Relire » n'a plus de scène à finir, et il revient au livre
  d'un geste.

**Validation :** le porteur valide le cadre le 3 octobre 2026, puis l'ordre
des étapes, les tâches, ce qui se valide, la répartition des réglages et
l'aide, le même jour, après la critique d'ergonomie de la maquette. Il
décide les révisions du 4 octobre 2026 après une seconde critique, puis,
après une troisième le même jour, dont les deux lectures rendent les notes
de la deuxième (29/40 et 27/40), il confirme les choix restés en
proposition, retient cinq améliorations, puis décide les deux volets de
« Mettre en page ».

**Questions ouvertes :** textes des écrans d'aide ; retouche de l'adulte
qui ne justifie pas un doute sur l'ordre des passages ;
effet d'un réglage
de « Texte et pages » sur l'aperçu pendant qu'on le règle ; un
avertissement apparu après l'ouverture de « Mettre en page » retire sa
coche à « Relire », sans bloquer le PDF définitif selon F09.2 : cet écart
entre l'ouverture d'une étape et le PDF reste à confirmer ; F11-AC63 et
F11-AC84 ne citent pas la déclaration parmi ce qui ouvre « Mettre en
page » : à accorder si le porteur confirme qu'elle est requise.

## F12 — Lecture en ligne et diffusion volontaire

### F12.1 — Partager une version du récit

**Périmètre confirmé :** le lecteur en ligne et le partage facultatif prévus
au brief font partie de la première livraison, en complément du PDF.
Le porteur souhaite permettre la lecture plaisir d'un livre terminé sans
achat d'un exemplaire imprimé. La relecture et les vérifications avant
publication relèvent des outils de travail, selon F09 et F11.
Les perspectives de vitrine
et de bibliothèque sont mises de côté selon F12.2 ; elles ne conditionnent pas
la poursuite du cadrage de ce lecteur.

**Règles acquises du brief, applicables à cette première livraison :**

- Le partage résulte d'une action volontaire de l'adulte : enseignant
  responsable en classe, auteur adulte en mode personnel. L'utilisation de
  l'application, une soumission élève ou une validation de scène ne partagent
  pas automatiquement le récit.
- L'adulte choisit une version terminée et validée à partager. Un livre
  inachevé n'est pas accessible en lecture plaisir. Le lecteur y accède sans
  compte et ne reçoit pas d'accès à l'espace de travail du projet.
- Une modification du travail courant ne change pas silencieusement la
  version partagée ; sa mise à jour reste un acte distinct, dont le parcours
  sera précisé avant réalisation.
- Le partage ne donne pas accès aux données de classe, aux retours privés
  ni à la préparation du récit. La présence éventuelle d'informations
  personnelles dans le récit, les images ou les crédits est un sujet distinct
  à traiter avant diffusion ; cette séparation des espaces ne les anonymise pas.
- L'adulte peut retirer l'accès à la version partagée. Un lien non répertorié
  reste transmissible et ne constitue pas un accès privé authentifié.

**Articulation avec le test et le PDF :** la lecture plaisir porte sur une
version terminée ; la relecture d'un travail en cours et les vérifications
avant publication ne passent pas par sa mise à disposition aux autres lecteurs.
Le playtest conserve les limites de lecture de F09.1. Lire un
livre terminé en ligne ne prouve pas la qualité de sa composition imprimée
et ne nécessite pas d'en avoir commandé ou imprimé un exemplaire.
L'accès à un livre partagé entier peut révéler aux élèves des chapitres qu'ils
ne voyaient pas pendant l'écriture : l'adulte doit en tenir compte pour
préserver le suspense. Le principe d'exclusion des livres inachevés est acquis.

**Décision confirmée le 1er octobre 2026 — conditions du partage :** une version est partageable aux mêmes conditions de contenu
que le PDF définitif de [F11.2](#f112--pdf-de-travail-et-pdf-définitif) :
toutes les scènes incluses déclarées prêtes et aucun problème bloquant de
[F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif), sans
contournement. Avoir exporté un PDF définitif n'est pas exigé. Le partage
fige un instantané daté du contenu, indépendant des PDF ; il ne suit pas les
modifications ultérieures. L'application signale que le livre a changé depuis
la version partagée et indique si celle-ci et le dernier PDF définitif portent
sur le même état. Les avertissements propres à l'impression (résolution
d'image, mise en page) ne bloquent pas le partage.

**Confirmé le 3 octobre 2026 — copie datée :** le porteur a envisagé une
lecture en direct du travail courant, avec un livre « momentanément
indisponible » pendant qu'une scène est rouverte. Il garde l'instantané :
les lecteurs ne voient jamais un livre en travaux, le rappel avant
diffusion garde son sens et un lecteur ne voit pas ses choix changer en
cours de lecture. Le partage se fait depuis l'étape « Imprimer et
partager » de [F11.6](#f116--trois-temps-pour-préparer-le-livre), ouverte
après la déclaration « La mise en page me convient » ; une fois ouverte,
elle ne se referme pas, de sorte que le retrait et le changement de lien
restent toujours accessibles.

**Décisions confirmées le 1er octobre 2026 — lien, mise à jour et retrait :**

- **Une version à la fois :** une histoire a au plus une version partagée
  lisible. Les lecteurs ne voient ni historique ni choix entre versions ; le
  retour à une version partagée antérieure n'est pas prévu dans la première
  livraison.
- **Lien de lecture stable :** le lien reste le même d'une mise à jour à l'autre.
- **Mettre à jour :** action explicite de l'adulte, qui revérifie les
  conditions du partage et remplace le contenu sous le même lien. Si les
  conditions ne sont plus remplies, la mise à jour est refusée et la version
  précédemment partagée reste lisible.
- **Retirer :** le lien affiche une page neutre indiquant que le livre n'est
  plus partagé, sans titre, classe ni auteurs. Un nouveau partage réactive le
  même lien.
- **Changer de lien :** action distincte qui invalide l'ancien lien et en crée
  un nouveau, par exemple après une diffusion non souhaitée, sans interrompre
  le partage.

**Décision confirmée le 1er octobre 2026 — énigmes dans le lecteur en ligne :**
conformément à [F05.1](#f051--liaisons-cachées-par-énigme), le lecteur permet
de rejoindre la suite d'une liaison cachée.

- **Numéros visibles :** dans un récit à choix, le lecteur en ligne affiche
  discrètement le numéro de chaque passage, tel que la composition le donnait
  dans l'instantané partagé. Une même énigme fonctionne ainsi sur papier et en
  ligne, y compris si elle s'appuie sur le numéro du passage lu.
- **Saisie :** une scène portant une liaison cachée propose de saisir le numéro
  trouvé. Seuls les numéros des liaisons cachées de cette scène sont acceptés ;
  un autre numéro ne permet pas de rejoindre un passage quelconque.
- **Retour :** une mauvaise réponse est signalée au lecteur, qui peut
  réessayer sans limite ni pénalité ; la solution n'est pas révélée.
- **Issue en cas d'échec :** elle relève de l'auteur, qui prévoit un choix
  ordinaire du type « Si tu n'as pas trouvé, rends-toi au… ». Un passage piège
  reste possible par une seconde liaison cachée portant son propre numéro.
  Une scène dont la seule suite est une liaison cachée est signalée par
  l'avertissement non bloquant de
  [F09.2](#f092--contrôles-des-chemins-avant-le-pdf-définitif), rappelé au
  moment du partage.

- **F12-AC13 — Bonne et mauvaise réponse :** étant donné « La porte aux
  symboles » dont la liaison cachée mène au n° 38, lorsque le lecteur saisit
  36, alors il est informé que ce n'est pas le bon numéro et reste sur le
  passage ; lorsqu'il saisit 38, alors il lit « La salle des brumes ».
- **F12-AC14 — Pas de saut par numéro :** étant donné la même scène et un
  passage n° 12 sans liaison cachée depuis celle-ci, lorsque le lecteur saisit
  12, alors il n'y est pas conduit.

La disposition de la saisie est proposée dans la
[maquette](design.md#partage-et-lecteur-en-ligne).

**Décisions confirmées le 1er octobre 2026 — présentation du lecteur :**

- **Retour en arrière libre :** le lecteur peut revenir au passage précédent
  et à tout passage déjà lu de son parcours, sans limite ni pénalité.
- **Reprise d'une lecture interrompue :** en rouvrant le livre, le lecteur peut
  reprendre où il s'était arrêté ou recommencer. Par le lien de lecture, sans
  compte, la reprise est retenue par l'appareil. Pour un élève identifié, elle
  est liée à son profil si c'est réalisable, afin de fonctionner sur un poste
  partagé ; la faisabilité reste à vérifier, avec repli sur l'appareil.
- **« Comment lire ce livre » à l'écran :** la partie qui explique la
  navigation est fournie par l'application, adaptée à la lecture en ligne et
  affichée lorsque le livre comporte cette page ; l'adulte ne la modifie pas,
  et la page imprimée de F11.4 reste modifiable. **Amendement du 2 octobre
  2026 :** lorsque l'adulte a écrit des « Règles du jeu », elles suivent ce
  texte à l'écran, identiques à celles du livre, et restent accessibles
  pendant toute la lecture selon [F04.2](#f042--objets-de-lhistoire).
- **Choix affichés comme dans le livre :** le lecteur en ligne affiche les
  phrases de choix du livre, numéros compris, selon
  [F05](#f05--retrouver-les-scènes-et-relier-les-choix) ; le renvoi y est
  activable. Cette règle remplace l'absence de numéro envisagée plus tôt le
  même jour, qui laissait des phrases incomplètes.
- **Récit classique :** un chapitre par écran, dans l'ordre de F03.1, sans
  marque de fin à la dernière page.
- **Rappel à chaque activation :** le rappel de F12-AC17 est confirmé au
  premier partage, à chaque mise à jour et à chaque activation d'un canal, y
  compris pour une version déjà partagée par l'autre canal : c'est une
  diffusion vers de nouveaux lecteurs.

- **F12-AC18 — Retour libre :** étant donné un lecteur arrivé au passage 14
  après les passages 1, 3 et 7, lorsqu'il demande à revenir au passage 3, alors
  il le relit et peut y faire un autre choix.
- **F12-AC19 — Reprise sans compte :** étant donné une personne qui a quitté
  le lien de lecture au passage 23, lorsqu'elle rouvre ce lien sur le même
  appareil, alors elle peut reprendre au passage 23 ou recommencer au début.
- **F12-AC20 — Second canal :** étant donné une version déjà lisible par les
  classes, lorsque l'enseignant active le lien de lecture, alors le lien n'est
  pas créé avant qu'il ait confirmé le rappel.

**Décision confirmée le 1er octobre 2026 — auteurs et classe dans la version
partagée, révisée le 3 octobre 2026 pour ses valeurs par défaut :** l'adulte
règle au moment du partage ce que la version partagée montre des auteurs
([F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture)).

- Le titre et le sous-titre sont toujours affichés.
- La ligne « classe ou auteur, année » de la page de titre et la page des
  auteurs sont affichées par défaut lorsque le livre les comporte ; l'adulte
  peut retirer chacune.
- L'adulte peut modifier ces textes pour le partage, par exemple « Une classe
  de CM2 », sans changer le livre imprimé.
- Au moment du choix, l'application rappelle qu'un lien de lecture reste
  transmissible.
- Le choix vaut pour la version partagée, donc pour les deux canaux de
  [F12.3](#f123--lecture-des-anciens-livres-par-les-autres-classes) ; un
  réglage par canal est différé.
- En mode personnel, l'auteur adulte choisit de la même façon d'afficher ou
  non son nom.

**Décision révisée le 3 octobre 2026 — même contenu que le livre :** à la
demande du porteur, la version partagée montre par défaut les mêmes pages de
présentation que le livre, sans distinction entre le livre et la lecture en
ligne : page de titre avec sa ligne « classe ou auteur, année », page des
auteurs avec les prénoms, page de fin, qu'elles soient composées d'après un
modèle ou remplacées par une image selon
[F11.4](#f114--intérieur-du-livre-pages-de-présentation-et-couverture). Une
page en image s'affiche comme une image pleine page du récit. Motif du
porteur : afficher des prénoms d'élèves n'est pas un problème, et un contenu
identique est plus simple. La règle du 1er octobre, qui désactivait par
défaut la ligne de classe et la page des auteurs, est remplacée ; une
désactivation par défaut des pages en image, proposée pendant l'entretien,
est écartée.

- **Ce qui demeure :** l'adulte peut encore retirer la ligne de classe ou la
  page des auteurs de la version partagée, ou leur donner un texte propre au
  partage ; pour une page en image, le retrait porte sur la page entière. Le
  rappel de F12-AC17 sur les noms, les photos et les autorisations des
  familles reste confirmé avant chaque partage.
- **Formes propres à l'écran :** la feuille d'aventure et « Comment lire ce
  livre » gardent en ligne la forme décidée en F04.2, en F11.4 et ci-dessous.
- **Conséquence signalée :** par défaut, des prénoms et le nom d'une classe
  figurent derrière un lien transmissible sans compte. Pour d'autres
  enseignants que le porteur, les obligations de leur école à ce sujet ne
  sont pas vérifiées ; elles relèvent de l'étude différée en F12.2.

**Décision confirmée le 1er octobre 2026 — informations personnelles dans le
récit et les images :** leur vérification relève de l'adulte ; l'application
l'aide à relire sans détecter ni anonymiser.

- **Prévisualisation :** avant d'activer un canal, l'adulte peut consulter la
  version telle que le lecteur la verra.
- **Rappel confirmé :** avant chaque partage et chaque mise à jour, l'adulte
  confirme un court rappel portant sur les noms et prénoms réels dans le
  récit, les photos où des personnes sont reconnaissables, les images dont il
  n'a pas les droits et, en mode classe, les autorisations des familles.
  Cette confirmation n'est pas un recueil d'autorisations ; le circuit
  d'accords reste différé en F12.2.
- **Aucune détection automatique** de noms ou de visages, et aucune promesse
  d'anonymisation. Une recherche des prénoms et noms des élèves inscrits dans
  le texte reste une piste non retenue pour la première livraison.
- **Non-référencement :** les pages du lien de lecture demandent aux moteurs
  de recherche de ne pas les indexer, sans que cela rende le lien privé.
- **Crédits :** aucune fonction de crédits d'images n'est créée pour ce
  parcours ; un éventuel crédit s'écrit dans la page de fin.

- **F12-AC15 — Même contenu par défaut (révisé le 3 octobre 2026) :** étant
  donné un livre de classe dont la page de titre imprimée porte « Classe de
  CM2 de l'école Jean-Moulin, 2026 » et une page des auteurs de 25 prénoms,
  lorsque l'enseignant partage sans modifier les réglages proposés, après
  avoir confirmé le rappel, alors la version partagée affiche le titre, le
  sous-titre, cette ligne et les prénoms, comme le livre ; lorsqu'il retire
  la page des auteurs pour le partage, alors les prénoms n'y figurent plus
  et le livre imprimé est inchangé. Une page de titre en image s'y affiche
  telle quelle.
- **F12-AC16 — Formule propre au partage :** étant donné le même livre,
  lorsque l'enseignant remplace la ligne de classe par « Une
  classe de CM2 » pour le partage, alors le lecteur en ligne voit cette
  formule et le PDF définitif conserve la mention imprimée.
- **F12-AC17 — Rappel avant partage :** étant donné une version remplissant
  les conditions du partage, lorsque l'adulte demande à la partager ou à la
  mettre à jour, alors aucun canal n'est activé ni mis à jour avant qu'il ait
  confirmé le rappel sur les informations personnelles et les droits.

**Variantes :** le lecteur suit les choix d'un récit à choix et l'ordre du
récit défini en F03.1 dans le mode classique. Le mode personnel conserve le partage facultatif
et la séparation entre travail courant et version partagée, sans circuit de
validation du travail élève.

**Critères d'acceptation sur les règles acquises :**

- **F12-AC01 — Lecture sans exemplaire imprimé :** étant donné une version
  que l'adulte a partagée, lorsqu'une personne ouvre son accès de lecture,
  alors elle peut lire le récit sans compte et sans acheter le livre imprimé.
- **F12-AC02 — Travail courant distinct :** étant donné une version déjà
  partagée, lorsque l'adulte corrige le récit dans le projet sans mettre à
  jour le partage, alors les lecteurs retrouvent la version précédemment partagée.
- **F12-AC03 — Retrait de l'accès :** étant donné une version partagée,
  lorsque l'adulte en retire l'accès, alors une nouvelle ouverture de cet
  accès ne permet plus de lire cette version sur le service. Cela ne promet
  pas l'effacement des copies déjà réalisées par des lecteurs.
- **F12-AC04 — Séparation du travail de classe :** étant donné un projet
  contenant des profils élèves, des commentaires de correction et une
  préparation du récit, lorsque le livre est partagé, alors le lecteur
  n'obtient pas accès à ces éléments par le partage.
- **F12-AC05 — Livre inachevé :** étant donné un récit encore en cours de
  rédaction ou de vérification avant publication, lorsque l'enseignant ou
  les élèves le relisent dans leurs outils de travail autorisés, alors cette
  relecture ne le rend pas accessible en lecture plaisir aux autres lecteurs.
- **F12-AC08 — Mise à jour sous le même lien :** étant donné une version
  partagée contenant « la brume s'épaissi » et la coquille corrigée dans le
  projet, lorsque l'adulte met à jour la version partagée, alors le lien déjà
  transmis aux familles affiche le texte corrigé.
- **F12-AC09 — Mise à jour refusée :** étant donné une version partagée et un
  projet dont une scène incluse a été rouverte aux élèves, lorsque l'adulte
  demande la mise à jour, alors elle est refusée avec le motif, et les lecteurs
  continuent de lire la version précédemment partagée.
- **F12-AC10 — Page de retrait neutre :** étant donné un partage retiré,
  lorsqu'une personne ouvre l'ancien lien, alors elle voit seulement que le
  livre n'est plus partagé, sans titre, nom de classe ni prénoms.
- **F12-AC11 — Changement de lien :** étant donné un lien diffusé sans l'accord
  de l'adulte, lorsqu'il change de lien, alors l'ancien lien affiche la page
  de retrait et le nouveau donne accès à la même version partagée.

**Décision confirmée le 2 octobre 2026 — feuille d'aventure et dé :** lorsque
l'histoire a une feuille d'aventure, le lecteur en ligne la propose au
lecteur, qui la remplit lui-même ; elle est conservée comme la reprise de
lecture, sans contrôle automatique, et peut comporter un dé. La feuille et
les actions de jeu font partie de l'instantané partagé. Règles et critères en
[F04.2](#f042--objets-de-lhistoire).

**Approfondissements différés :** faisabilité de la reprise liée au profil
de l'élève, réglage des auteurs par canal, conservation des versions partagées antérieures, durée
d'hébergement, coûts d'exploitation
et devenir du partage après la fin d'une offre payante. La gratuité et les
limites commerciales de la lecture restent à cadrer en F14 ; ne pas acheter
le livre imprimé n'établit pas à lui seul toutes les conditions tarifaires.

### F12.2 — Droits de diffusion et éventuelle vitrine du site

**Sujet différé à la demande du porteur :** mettre de côté, pour l'instant,
les droits de diffusion, la vitrine et la bibliothèque. Ces sujets quittent
les priorités de l'entretien actuel. Cela ne valide aucune licence ni
proposition ci-dessous et ne constitue pas un abandon définitif. Le lecteur
en ligne et le partage facultatif de F12.1 restent retenus. Les éléments
suivants sont conservés à leur emplacement de référence pour une reprise
ultérieure, sans poursuivre leur approfondissement maintenant.

**Intention réexprimée par le porteur le 1er octobre 2026, non arbitrée :**
permettre à l'utilisateur, avec son accord, de rendre un livre public sur le
site. Bénéfices envisagés : vitrine du service, accès aux autres livres
publics en contrepartie, relecture avant publication par des lecteurs pouvant
laisser une note sur un passage. Les deux canaux de
[F12.3](#f123--lecture-des-anciens-livres-par-les-autres-classes) n'y font pas
obstacle : une publication sur le site pourrait devenir un canal supplémentaire
de la même version partagée, avec son propre accord. Points à instruire avant
toute décision : accord des élèves et de leurs représentants légaux en plus de
celui de l'enseignant, liberté de cet accord si une contrepartie y est
attachée, modération et signalement des contenus et des notes, compatibilité
de notes sur un livre non terminé avec l'exclusion des livres inachevés de F12.1.
Le porteur confirme le même jour que ce sujet reste hors de la première
livraison et de côté pour l'instant, à instruire dans un entretien dédié.
Recommandations conservées pour cette reprise : ne pas conditionner la lecture
des livres publics à la publication du sien ; traiter la relecture avant
publication comme une fonctionnalité séparée, sur invitation, avec des notes
visibles du seul adulte.

**Question non arbitrée, différée :** l'utilisation de l'application pourrait-elle
accorder à son exploitant un droit de publication sur le site ? Cette question
porte aussi sur un droit réservé à l'exploitant, même sans publication
automatique. Aucune licence de ce type n'est décidée. Elle serait à concilier
avec le partage volontaire et retirable déjà retenu.

**Périmètre géographique envisagé :** le porteur cite la France et d'éventuels
pays anglophones, sans avoir choisi ces derniers ni confirmé un lancement
simultané. La langue anglaise ne définit pas un pays de commercialisation.
Les éléments juridiques ci-dessous concernent le cadre français et européen,
sans conclure sur les autres pays.

**Points de droit vérifiés le 26 septembre 2026, à prendre en compte dans
les futurs textes contractuels :**

- En France, l'auteur détient des droits du fait de sa création. Le fait
  d'utiliser un outil n'accorde pas à son exploitant un droit général de
  publication. Une autorisation contractuelle peut encadrer des exploitations,
  sous réserve des droits détenus et des exigences applicables ; le CPI
  prévoit notamment la délimitation des droits cédés et de leur exploitation.
  Sources : [CPI L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042814694/2026-05-28),
  [CPI L122-4](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278911/2019-03-13)
  et [CPI L131-3](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006278958/2025-03-01).
- Le guide diffusé par Éduscol précise que la diffusion des créations des
  élèves mineurs nécessite leur autorisation et celle de leurs représentants
  légaux. L'accord de l'enseignant avec le service ne suffit donc pas à présumer
  qu'il détient toutes les autorisations utiles sur les textes et illustrations.
  Source : [diffuser des créations réalisées dans le cadre scolaire, fiche 5](https://eduscol.education.gouv.fr/media/73761/download?attachment=).
- Les droits d'auteur et le traitement des données personnelles sont deux
  questions distinctes. Selon la CNIL, inscrire un traitement dans les CGU
  ne le rend pas nécessaire à l'exécution du contrat. Lorsqu'un traitement
  repose sur le consentement, son caractère libre doit être préservé ; le
  consentement n'est cependant pas la seule base légale possible.
  Sources : [base légale du contrat](https://www.cnil.fr/fr/les-bases-legales/contrat)
  et [conditions du consentement](https://www.cnil.fr/fr/les-bases-legales/consentement).

**Proposition non arbitrée, conservée pour une reprise ultérieure :** prévoir
les autorisations nécessaires pour
héberger, afficher et exporter les contenus selon les actions demandées par
l'utilisateur ; demander séparément une autorisation facultative et délimitée
pour présenter un livre dans une vitrine publique ou une future bibliothèque.
L'autorisation de partager un lien ne vaudrait pas automatiquement autorisation
de sélectionner l'œuvre pour promouvoir le service. Pouvoir utiliser l'outil
et produire son PDF sans contribuer à la vitrine préserverait le choix
pédagogique de l'enseignant et la maîtrise de l'auteur en mode personnel.
Pour démarrer, quelques œuvres de démonstration dont les droits sont clarifiés
peuvent remplir cet objectif commercial sans imposer ce droit à chaque projet.

**Cas à éprouver :** une classe souhaite lire son livre en famille, mais
l'autorisation donnée pour une contribution ne couvre pas une vitrine
commerciale. Le fait que le professeur dispose d'un compte ne résout pas ce
décalage. Il faut respecter le périmètre autorisé ou renoncer à cette diffusion.

**À préciser avant réalisation de la diffusion :** titulaire et portée des
autorisations pour les différentes contributions, information de l'adulte,
recueil ou justification des accords, crédits et éventuelles données
personnelles, retrait et sélection éditoriale. Les clauses et le circuit
d'autorisation devront faire l'objet d'une vérification juridique adaptée
aux pays effectivement retenus. Aucune interface de collecte, bibliothèque
publique ou obligation de contribution à une vitrine n'est ici validée.

### F12.3 — Lecture des anciens livres par les autres classes

**Décision confirmée :** régler sur chaque histoire si les autres classes
peuvent lire une version terminée, avec partage désactivé par défaut.
Dans l'organisation retenue en F01.1, les autres classes désignent
d'abord celles du même enseignant ; cela ne crée pas un espace école partagé.

**Parcours confirmé :** rendre une version terminée du livre accessible aux
autres classes par une action explicite de l'enseignant sur cette histoire,
désactivée tant qu'il n'a pas choisi de la proposer en lecture. Réutiliser
la distinction entre version partagée et travail courant de F12.1 ; ne pas
donner accès à l'éditeur, aux retours de correction ou aux profils élèves.
Ne pas présenter un lien transmissible comme privé.

**Décision confirmée le 1er octobre 2026 — une version, deux canaux :** la
version partagée d'une histoire peut être proposée par deux canaux
indépendants, tous deux désactivés par défaut et montrant le même instantané :

- le **lien de lecture** sans compte de F12.1, pour les familles et l'extérieur ;
- la **lecture par les classes de l'enseignant**, accès authentifié depuis une
  entrée de lecture de l'espace élève, sans lien à distribuer.

Un livre peut ainsi être lu par les classes sans exister sous forme de lien
transmissible. La mise à jour et le retrait de F12.1 valent pour les deux
canaux ; chaque canal peut aussi être désactivé seul. Pour la première
livraison, ce canal ouvre la lecture à toutes les classes en cours de
l'enseignant, y compris celle qui a écrit le livre ; le choix classe par
classe est différé. Une classe est en cours tant que son année n'est pas
terminée ([F01.1](#f011--classes-années-et-éventuel-espace-école)).

**Justification :** même terminé, un livre n'est pas nécessairement destiné
aux autres classes ; l'enseignant peut réutiliser une intrigue dont il souhaite
préserver la découverte. Une mise à disposition volontaire du livre entier
peut en revanche lever volontairement les limites de lecture de l'atelier.

**Critères d'acceptation :**

- **F12-AC06 — Ancien livre non partagé :** étant donné un ancien livre
  terminé mais non proposé aux autres classes, lorsque la nouvelle classe
  est créée, alors ce livre n'apparaît pas parmi ses lectures.
- **F12-AC07 — Lecture sans attribution de travail :** étant donné une version
  terminée proposée aux autres classes, lorsqu'un élève l'ouvre, alors il
  consulte le livre choisi sans obtenir de permissions de travail ni voir
  les corrections privées. Le retrait et les mises à jour suivent F12.1.
- **F12-AC12 — Lecture par les classes sans lien :** étant donné une version
  partagée dont seul le canal des classes est activé, lorsqu'un élève d'une
  classe de l'enseignant ouvre ses lectures après s'être identifié, alors il
  peut lire le livre ; aucun lien de lecture sans compte n'existe pour ce livre.

**Approfondissements différés :** choix des classes destinataires une à une
et validation détaillée de l'entrée « Lectures » proposée dans la maquette. Cette décision ne rouvre pas la vitrine ou la bibliothèque publique de F12.2.

## F13 — Assistance IA facultative

### F13.1 — Aide de l'enseignant à la correction et à la réécriture

**Besoin confirmé :** l'enseignant peut demander une aide IA lorsqu'il corrige
le texte d'une scène. Cette aide complète la correction manuelle et la demande
de reprise par l'élève décrites en F07.1.

**Cadre acquis du brief :** l'assistance est facultative et plafonnée, l'application
reste utilisable sans elle, l'humain arbitre et aucune validation ou publication
ne devient automatique. Dans ce parcours de classe, la demande vient de
l'enseignant ; cela n'ouvre pas un accès IA aux élèves.

**Décision confirmée :** proposer trois intentions nommées, avec « Corriger les
erreurs » comme choix par défaut. Une réécriture créative complète n'entre pas
dans ces actions pour la première livraison.

| Action | Intervention attendue | Limites retenues |
| --- | --- | --- |
| Corriger les erreurs | Orthographe, accords, conjugaison et ponctuation. | Conserver les idées et la formulation autant que possible ; ne pas embellir librement le texte. |
| Clarifier la formulation | Reformuler les phrases difficiles à comprendre. | Conserver les idées, le point de vue et les événements ; ne pas ajouter d'éléments narratifs. |
| Suggérer des améliorations | Donner à l'enseignant des pistes concrètes sur le passage. | Fournir des suggestions ; ne pas remplacer automatiquement le récit par une réécriture plus élaborée. |

Ces limites décrivent le résultat souhaité ; elles ne constituent pas une garantie
de conformité d'une sortie IA. Une relecture humaine reste nécessaire.

**Parcours retenu :** l'enseignant choisit une action, consulte la proposition
avant toute application, puis la rejette, la retouche ou l'applique explicitement.
La présentation précise de cette comparaison reste à définir.
L'application d'une correction ne vaut
pas validation du travail élève. Son effet pendant les finitions d'une scène
dont le travail élève est déjà validé relève de F11.1. Le texte source doit rester conservé
selon les règles de soumission de F07.1.

**Idée du porteur, 4 octobre 2026, non décidée — relecture des coquilles
du livre entier :** au temps « Relire » de
[F11.6](#f116--trois-temps-pour-préparer-le-livre), un bouton relèverait les
fautes possibles dans tout le livre, en option payante. Avis donné : l'idée
prolonge « Corriger les erreurs » à l'échelle du livre et vient au bon
moment ; elle devrait relever les fautes une à une, que l'adulte corrige ou
ignore, sans rien appliquer d'elle-même, et tolérer les noms inventés. À
instruire avant toute décision : ce qu'un correcteur orthographique sans IA
couvre déjà gratuitement, le coût d'exploitation d'un passage sur quarante
scènes, sa place dans l'offre de F14, encore indéfinie.

**Règles confirmées :**

- L'assistance à la correction ne modifie pas les destinations des choix,
  ne crée pas de scène et ne supprime pas une branche. Le traitement du
  libellé d'un choix reste à préciser.
- Aucun changement proposé n'est appliqué sans action de l'enseignant.

**Propositions sur les exceptions :**

- Si le texte a changé pendant la préparation d'une proposition, celle-ci
  ne remplace pas silencieusement la nouvelle version ; articulation avec F08.1.
- Un échec de génération, une indisponibilité ou une limite atteinte ne modifie
  pas le texte existant et laisse la correction manuelle disponible.

**Justification :** une correction d'erreurs et une réécriture créative ont des
objectifs différents. Modifier fortement le vocabulaire ou ajouter des événements
peut changer la voix de l'élève et le travail que l'enseignant souhaite évaluer.
Une réécriture plus libre peut être utile à l'adulte, notamment en mode personnel,
mais elle reste hors des actions de correction retenues pour la première livraison.

**Critères d'acceptation sur les éléments confirmés :**

- **F13-AC01 — Action par défaut :** étant donné l'enseignant ouvrant l'aide
  à la correction, lorsqu'il n'a pas choisi une autre intention, alors l'action
  proposée est « Corriger les erreurs ».
- **F13-AC02 — Proposition avant application :** étant donné une suggestion IA
  disponible, tant que l'enseignant ne l'a pas appliquée, le texte de la scène
  reste inchangé ; il peut refuser la proposition ou la retoucher.
- **F13-AC03 — Correction sans changement de parcours :** étant donné une
  scène comportant un choix vers B, lorsque l'enseignant applique une correction
  IA du texte, alors ce choix mène toujours à B, aucune scène n'est ajoutée
  ou supprimée et la scène corrigée n'est pas automatiquement validée.
- **F13-AC04 — Remise d'élève conservée :** étant donné un texte source soumis
  par un élève, lorsque l'enseignant applique une correction assistée, alors
  le texte de cette remise reste consultable dans sa forme antérieure.
- **F13-AC05 — Intention de reformulation :** étant donné « Il croit que le
  dragon dort », une proposition « Le dragon dort » ne satisfait pas l'action
  « Clarifier la formulation », car elle transforme une croyance en fait.
  Ce critère sert à évaluer la qualité des propositions ; il ne suppose pas
  qu'un contrôle automatique garantisse le respect du sens.

**Questions ouvertes :**

- Traitement d'une scène complète ou d'un extrait ; contexte de récit autorisé
  transmis à l'aide et traitement des libellés de choix.
- Présentation des différences, application globale ou par modification et
  retour au texte précédent.
- Nouvelle proposition après modification, usage sur un texte déjà validé
  et traitement d'un changement du texte pendant la génération.
- Déclinaison de l'aide en mode personnel et exemples représentatifs pour
  évaluer correction, reformulation et suggestions.
- Limites d'utilisation et signalement des échecs. Fournisseur, qualité réelle,
  coût et modalités techniques seront à vérifier ultérieurement.

### F13.2 — Formuler une consigne et des points pour guider la rédaction

**Besoin confirmé :** intégrer à la V1 une aide que le porteur utilise déjà
sur un site séparé. L'enseignant écrit une indication courte ; l'IA propose
une consigne bien formulée destinée aux élèves et une courte liste de points
pour les aider à rédiger, par exemple décrire les lieux ou les émotions du héros.

**Parcours retenu :** l'enseignant saisit son indication, demande l'aide,
relit la consigne proposée et la liste qui l'accompagne, puis les retouche,
les refuse ou les retient. Le contrôle humain et le caractère facultatif
de l'IA restent ceux du brief. Cette aide s'adresse à l'enseignant et produit
une consigne de travail ; elle ne vaut ni rédaction ni soumission d'un texte
par l'élève.

**Contexte :** les informations de préparation pertinentes déjà renseignées
dans l'application peuvent éclairer la demande, selon F02. Le niveau et les
objectifs pédagogiques peuvent également être utiles. Le principe de recueil
progressif et de demande de compléments est défini en F02 ; les informations
requises pour cette action et leur présentation restent à préciser.

**Proposition de cadrage :** améliorer la clarté et apporter des repères
concrets d'écriture sans inventer des événements, personnages ou raccords
qui remplaceraient les décisions de l'enseignant. La liste doit être adaptée
à la consigne, et non imposer les mêmes descriptions dans toutes les scènes.
La conformité réelle des propositions restera à éprouver sur des exemples.

**Critères d'acceptation sur les éléments confirmés :**

- **F13-AC06 — Deux éléments proposés :** étant donné une indication courte
  rédigée par l'enseignant, lorsqu'il demande l'aide aux consignes, alors il
  reçoit une consigne formulée pour les élèves et une courte liste de points
  pour guider leur rédaction.
- **F13-AC07 — Consigne sous contrôle de l'enseignant :** étant donné une
  proposition disponible, lorsque l'enseignant la relit, alors il peut
  retoucher ou refuser la consigne et les points proposés avant de les donner
  comme consigne aux élèves. Une génération seule ne publie pas de nouvelle
  consigne et ne modifie pas le texte du récit.

**Approfondissements différés :** contexte sélectionné, informations manquantes,
longueur et niveau de langage, nouvelle proposition et présentation à l'écran
ou sur les fiches de F07.4. Cette aide concerne la classe en récit classique
comme en récit à choix ; son éventuel usage en mode personnel reste à préciser.
L'aide itérative à la préparation confirmée est décrite en F13.4.

### F13.3 — Aide à concevoir les choix et leurs destinations

**Décision confirmée pour la première livraison :** depuis la consigne d'une
scène ou son texte déjà écrit, demander des idées de choix, sélectionner celles
qui conviennent et confirmer leurs destinations avant ajout au récit et au
graphe. L'aide est réservée à l'adulte. Cette aide vise une difficulté
centrale rapportée dans le brief ; sa qualité reste à éprouver, le porteur
ayant jusqu'ici trouvé l'IA plus utile pour les consignes que pour les choix.

**Distinction fonctionnelle :** suggérer une action au lecteur ne suffit pas
à créer un embranchement utilisable. Chaque choix retenu doit avoir un libellé
et une destination. Le graphe représente les mêmes relations que le récit,
selon F05 et le brief ; il ne nécessite pas une seconde organisation créée
indépendamment par l'IA. Cette aide est distincte de la correction de F13.1,
qui reste sans modification des destinations ou de la structure.

**Parcours confirmé :**

1. L'enseignant demande des idées pour une scène ; en mode personnel, l'auteur
   adulte le fait lui-même. L'aide utilise la consigne, le texte lorsqu'il
   existe, les repères utiles et les contraintes connues de la suite du récit.
2. Présenter d'abord trois à cinq suggestions réellement différentes, avec
   la possibilité d'en demander d'autres, plutôt qu'imposer dix propositions
   à comparer. Il s'agit du nombre d'idées proposées, pas d'un nombre de
   branches à créer automatiquement.
3. Chaque suggestion comporte un libellé et une courte intention narrative
   ou conséquence envisagée, avec un titre pour les nouvelles destinations
   selon F05. L'adulte peut modifier directement les suggestions puis cocher
   celles qu'il retient, sans relancer l'IA pour ces retouches manuelles,
   puis confirme leurs destinations : scène existante ou nouvelle scène à
   préparer. Une nouvelle scène peut reprendre l'intention comme point de
   départ d'une consigne ; le texte destiné au lecteur n'est pas rédigé à
   la place de l'élève par cette action.
4. Une action explicite applique la sélection examinée : seuls les choix
   retenus, leurs liens et les nouvelles scènes annoncées sont ajoutés.
   Le graphe les représente immédiatement. La seule génération d'idées ne
   change pas le projet ; les suggestions écartées ne laissent pas de scènes.

**Permissions et limites confirmées :** l'aide est réservée à l'adulte dans
ce parcours ; elle ne modifie pas les profils élèves acquis en F06. Elle peut
proposer des raccords interchapitres pour l'enseignant, sans donner ces droits
aux élèves. Elle ne supprime ni ne réorganise silencieusement les passages
existants. Le récit classique n'a pas besoin de cette aide aux embranchements.
Une correction éditoriale reste distincte de l'application de nouveaux choix.

**Critères de qualité et cas à éprouver, proposés :**

- Étant donné un héros enfermé sans clé, les idées doivent tenir compte de
  cette contrainte ; « ouvrir avec sa clé » ne devient pas acceptable parce
  que sa formulation est correcte.
- Si l'adulte retient deux suggestions sur cinq, l'application doit annoncer
  puis créer seulement leurs destinations nouvelles éventuelles. Relier un
  choix à une scène existante ne doit pas dupliquer cette scène.
- Deux choix qui reformulent la même action sans différence pertinente ne
  constituent pas deux bonnes alternatives. Une convergence ultérieure reste
  compatible avec des conséquences ou expériences distinctes.
- Une modification du contexte pendant la génération, une réponse inutilisable
  ou une application incomplète doivent être signalées et récupérables ; leur
  traitement reste à préciser avec F08, sans promettre une fiabilité acquise.

**Critères d'acceptation sur les règles confirmées :**

- **F13-AC08 — Suggestions sans effet immédiat :** étant donné une demande
  d'idées, lorsque les suggestions sont affichées mais pas appliquées par
  l'adulte, alors aucun choix, lien ni scène n'est ajouté au projet.
- **F13-AC09 — Application de la sélection :** étant donné deux suggestions
  retenues sur cinq, l'une vers une scène existante et l'autre vers une nouvelle
  scène annoncée, lorsque l'adulte confirme leur ajout, alors seuls ces deux
  choix et leurs liens sont créés, avec une seule nouvelle scène ; le graphe
  représente ces mêmes relations et aucun texte élève n'est rédigé par l'action.
- **F13-AC10 — Suggestions modifiées puis cochées :** étant donné une
  suggestion disponible, lorsque l'adulte retouche son libellé et le titre
  de sa nouvelle destination, la coche puis confirme sa destination et
  l'ajout, alors les formulations retouchées sont utilisées, sans nouvel
  appel IA pour ces retouches. Cocher seul n'ajoute rien au récit.
- **F13-AC11 — Choix et titres dans la même génération :** étant donné une
  demande d'idées comportant de nouvelles destinations, lorsque la génération
  réussit, alors ses suggestions comprennent les choix et les titres associés
  dans la même réponse, sans appel supplémentaire dédié aux titres.

**Arbitrages et approfondissements restants :** contexte
autorisé, choix des destinations et du chapitre des nouvelles scènes,
prévisualisation des ajouts, reprise ou annulation, quotas et coût. Ne pas
confondre la rapidité de génération avec le temps nécessaire pour écrire,
relire et raccorder les branches retenues. Aucun fournisseur ni prototype
n'est choisi ou autorisé par cette décision fonctionnelle.

### F13.4 — Aide itérative aux rubriques de préparation

**Décision confirmée :** depuis chaque rubrique de F02,
demander une aide IA qui lit le texte, pose des questions ou suggère des
améliorations, puis propose un nouveau texte à partir des réponses de l'adulte.
L'adulte peut solliciter plusieurs échanges successifs. Le même principe
s'applique aux éléments du plan de parties et chapitres selon F02. Cette aide concerne la préparation
du récit par l'adulte, distincte de la correction d'une scène ou de l'aide
aux consignes. L'usage sans IA reste possible.

**Parcours confirmé :** une action explicite « M'aider à
développer » ouvre une aide liée à la rubrique ou à l'élément du plan concerné.
L'adulte peut répondre aux questions, demander une autre piste, retoucher
la proposition ou demander de poursuivre. L'IA peut proposer directement
des pistes lorsque le contexte suffit ; un questionnaire n'est pas une étape
obligatoire. La génération ne remplace pas le texte conservé ; l'adulte
l'applique explicitement avec « Utiliser ce texte » après ses retouches.
Une nouvelle demande reprend ses dernières retouches et réponses pertinentes.
La génération ne crée ni partie, chapitre ni scène et ne modifie pas
la préparation. Appliquer un texte à une rubrique générale met à jour la
préparation de l'enseignant, sans la publier aux élèves ni partager l'historique IA.
Les échanges peuvent être projetés pendant l'atelier collectif selon F02.

**Contexte confirmé :** l'aide doit tenir compte des autres éléments pertinents
déjà retenus pour éviter les contradictions ; la qualité réelle reste à vérifier.
L'adulte peut poursuivre l'échange dans les limites du quota disponible.

**Recommandations complémentaires :** distinguer le texte déjà
retenu des idées encore discutées et signaler un changement narratif proposé. Un texte vide
pourrait déclencher quelques questions de départ plutôt qu'une obligation de
remplissage. Le contrôle adulte reste nécessaire : la qualité des suggestions
et le respect effectif des contraintes devront être éprouvés.

**Critères d'acceptation sur les rubriques générales :**

- **F13-AC12 — Proposition avant remplacement :** étant donné un texte
  conservé dans une rubrique, lorsque l'adulte reçoit une proposition ou
  poursuit l'échange IA, alors le texte conservé ne change pas tant qu'il
  n'applique pas explicitement une proposition.
- **F13-AC13 — Retouche appliquée :** étant donné une proposition retouchée
  par l'adulte pour une rubrique générale, lorsqu'il choisit « Utiliser ce texte », alors la rubrique
  reçoit le texte retouché sans création de partie, de chapitre ou
  de scène. Le texte retenu devient celui de la préparation de l'enseignant ;
  ni la rubrique ni l'historique IA ne sont publiés aux élèves par cette action.
- **F13-AC14 — Poursuivre selon les réponses :** étant donné un échange
  sur une rubrique et un quota disponible, lorsque l'adulte précise que le
  héros ne peut pas voler puis demande de poursuivre, alors cette précision
  fait partie du contexte de la demande suivante. La pertinence de la réponse
  reste un critère de qualité à éprouver, pas une garantie de raisonnement IA.

**Questions ouvertes :** sélection précise du contexte
transmis, conservation ou reprise des échanges, texte modifié pendant une
génération, échec ou quota atteint. Recommandation : conserver dans ces cas le
texte retenu et les réponses saisies, permettre la poursuite manuelle et ne
pas lancer de nouvel appel sans action explicite. Répéter l'aide reste soumis
aux quotas de F13/F14 ; aucun nombre de générations illimité n'est promis.
La projection collective confirmée en F02 permet de montrer les échanges IA ;
la préparation est unique et n'exige pas deux versions selon
que l'enseignant travaille seul ou avec la classe. La sélection des éléments
utiles et l'emploi éventuel de détails locaux restent à préciser.
Pour un résumé de chapitre, l'application retouche le même élément
dans les deux vues ; le texte appliqué est consultable par les élèves
attribués selon F02, sans leur ouvrir l'historique des échanges IA.
Le résumé fait partie du contexte disponible pour les aides pertinentes ;
sa sélection exacte et son articulation avec les scènes déjà écrites restent
à préciser. Recommandation non arbitrée : ne pas actualiser automatiquement
le résumé à partir des scènes ; toute proposition de mise à jour reste soumise
à l'application explicite par l'adulte.

### F13.5 — Idées de parties depuis la page d'organisation

**Décision confirmée :** proposer l'aide aux idées et à la création de
parties depuis la préparation comme depuis la page des parties et chapitres,
pour poursuivre ou compléter le plan à tout moment.

Le parcours d'ajout réutilise l'échange de F13.4. L'adulte peut partir de
ses propres idées ou en demander. Une proposition comprend le titre de la partie,
celui de son premier chapitre et un bref résumé porté par ce chapitre.
Elle est modifiable puis sélectionnée explicitement. La partie ne reçoit pas de résumé distinct.
La génération seule ne change pas le projet ;
la confirmation ajoute seulement les ensembles retenus, chacun avec son
chapitre initial sans scène selon F03.1, dont le résumé retenu est conservé,
sans texte de scène, choix ni attribution automatique. L'aide reste adulte,
facultative et soumise aux quotas ; le parcours manuel demeure disponible.

**Contexte recommandé :** les grands axes communs et les éléments pertinents
du plan déjà retenu, avec possibilité de préciser l'intention de l'ajout.
Éviter de charger automatiquement tous les textes du récit. Les détails du
contexte, les informations affichées si l'aide est projetée et la qualité
des propositions sont à préciser et à éprouver. Le nom du bouton n'est pas
un arbitrage bloquant. Les ajouts retenus rejoignent le plan commun de F02,
sans liste d'étapes séparée à convertir ou à synchroniser.

**Critères d'acceptation :**

- **F13-AC15 — Proposition complète sans création immédiate :** étant donné
  l'adulte demandant des idées depuis la préparation ou l'organisation,
  lorsque l'IA répond, alors chaque ensemble proposé comprend un titre de
  partie, un titre de premier chapitre et un résumé de ce chapitre. Aucun
  élément du projet n'est encore créé et les propositions sont modifiables.
- **F13-AC16 — Ajout des seuls ensembles retenus :** étant donné trois
  propositions dont deux cochées et l'une retouchée, lorsque l'adulte confirme,
  alors seules les deux parties retenues et leurs chapitres initiaux sont
  ajoutés au plan commun avec les textes retenus, sans scène, choix ni
  attribution. Elles sont retrouvées dans les deux vues sans conversion.

**Limites et questions ouvertes :** place des nouvelles parties dans l'ordre,
retouche assistée d'une partie existante, prévention des doublons et récupération
après échec. La qualité des suggestions et le contexte exact restent à éprouver.

## Suite de l'entretien et couverture restante

**Cadrage général clôturé ; premier parcours validé le 28 septembre 2026 :**
le parcours « préparer un projet de classe et ouvrir la première séance
d'écriture » couvre la création du projet, la préparation, les parties,
chapitres et scènes, les consignes et fiches papier, les inscriptions,
attributions et l'accès effectif des élèves à leurs scènes. Les variantes
personnel/classe et classique/choix sont conservées. Ne pas reprendre
l'entretien initial ni redemander les décisions confirmées. Traiter les
parcours ultérieurs avant leur réalisation selon
[CLAUDE.md](../../CLAUDE.md#entretien-et-rédaction-des-spécifications).
Les propositions ouvertes ne sont pas approuvées par cette validation ;
aucun développement ni prototype technique n'est autorisé par celle-ci.
Le porteur confirme l'articulation de cet approfondissement avec la conception
de l'expérience et de l'identité visuelle, en commençant par le choix d'une
direction et d'écrans représentatifs. Les décisions de design et les
propositions encore à arbitrer sont conservées dans
[les intentions de design](design.md), sans rouvrir le cadrage acquis.
La comparaison Vercel/Supabase et les hypothèses d'hébergement sont conservées
dans [l'architecture](architecture.md) ; elles ne changent pas les règles
fonctionnelles ni les fournisseurs par simple évocation.

**Conception visuelle du premier parcours réalisée :** la planche d'ambiance
et les quatre situations sont réunies dans les maquettes locales autorisées,
avec un retour favorable du porteur. Leur portée et les détails encore proposés
sont conservés dans [le design](design.md). Les vues Scènes/Graphe de F03.1 font partie
de la situation d'organisation du récit ; elles ne créent pas un cinquième
parcours. Les détails de disposition peuvent être éprouvés sur les maquettes.
Les inconnues de sauvegarde, de permissions, de stockage et de graphe chargé
restent à vérifier avant réalisation. Les points locaux ci-dessous sont
conservés pour leur étape pertinente, sans rouvrir le premier parcours.
Cette progression visuelle n'autorise ni prototype technique ni développement.

**Deuxième parcours validé dans son ensemble le 28 septembre 2026 :**
« rédiger une scène, la faire relire, la
reprendre et la valider ». Les arbitrages de mise en forme et de droits sur
les libellés sont intégrés à F04.1/F06.1 ; ceux du cycle de révision et de
validation se trouvent en F07.1/F07.3, avec le repère de suivi conservé en
F06.3/F06.5. Le parcours nominal et ses variantes sont validés, et leur
conception visuelle est autorisée. Les détails de présentation, les demandes de
changements protégés, la récupération après incident et l'effet d'une
réouverture sur le repère « prête pour le livre » restent différés dans
leurs sections de référence ; les inconnues techniques ne sont pas résolues
par cet entretien.

Les décisions acquises ne sont pas à rediscuter systématiquement. Les points
suivants indiquent où poursuivre la spécification ; leurs règles détaillées
et propositions restent dans les sections de référence :

- **Préparer, structurer et attribuer :** champs et guidage de F02, commandes
  de F03/F05 et remise/récupération des accès de F06.4. La répartition initiale
  et les prises en charge multiples par sélection explicite sont confirmées
  en F06.3, ainsi que la reprise autonome d'une scène déjà prise en charge
  après avertissement. Les changements simultanés et la sélection partielle
  restent à préciser. L'inscription en lot avec sélection
  des profils existants est acquise en F01.1 ; codes à quatre chiffres gérés
  et consultables par l'enseignant, supports individuels et sélection des
  fiches avant inscriptions sont acquis en F06.4/F07.4. La protection technique
  des codes reste à préciser. Le 6 octobre 2026, un entretien court sur les
  écrans d'entrée de l'enseignant décide la création d'un projet et le
  premier pas d'une personne sans projet ni classe (F01), la fin d'une
  année, le prénom et le nom d'un élève et son retrait de la classe (F01.1),
  les informations de la classe, son affiche et les étiquettes des élèves
  (F06.4) ; leurs écrans sont proposés dans la maquette. Le travail numérique à domicile est facultatif ;
  les horaires récurrents facultatifs par classe et l'enregistrement final
  avant fermeture sont confirmés en F06.4. Le rattachement différé à une classe
  est acquis en F01, l'accès par attribution en F06.1 et la lecture de toutes
  les scènes d'un chapitre attribué en F06.2. Les images de repérage stables
  sont acquises en F10.1, l'aide discrète à l'illustration par prompts en
  F10.2 et la consigne numérique facultative en F07.1 ;
  leurs modalités de présentation restent à concevoir.
  Le carnet à quatre rubriques et le plan commun aux vues de préparation
  et d'organisation du récit sont acquis en F02, avec l'aide itérative de F13.4. L'atelier
  de préparation projeté (F02) et les chapitres avec accès distincts
  (F03.1) sont acquis, ainsi que les raccords réservés à l'enseignant (F06.1)
  et l'ordre classique partie → chapitre → scène (F03.1). La préparation
  est unique et sa page réservée à l'enseignant (F02). Le résumé facultatif du
  chapitre sert surtout de contexte IA et reste consultable par les élèves
  attribués. Une page regroupe les cartes de chapitres par partie,
  avec détails à l'activation ; leurs titres et images restent visibles sans
  attribution (F03/F06/F10). Depuis le 6 octobre 2026, la carte ouvre le
  chapitre, dont la page est ce détail, et un menu à trois points porte ses
  commandes (F03.1). Le retrait du travail
  est récupérable depuis les deux vues (F03.1) : il s'appelle « Supprimer »
  et passe par la « Corbeille du projet » ; sa durée et la restauration des
  liens restent à confirmer, ainsi que la portée du playtest. L'aide IA à l'ajout de parties depuis la
  préparation ou la page d'organisation est confirmée en F13.5 ; ses détails
  restants conservent leur statut ouvert.
- **Suivre et naviguer :** suivi continu et bilan par élève confirmés en
  F06.5 ; suivi par projet et sélections de scènes accessibles ou prises
  en charge par un élève confirmés. Disposition des
  listes et navigation restante proposées dans le design ; les quatre
  situations représentatives sont maintenant déclinées en maquettes locales,
  sans développement de l'application. Le Suivi est repris le 4 octobre 2026
  après une critique d'ergonomie : suivi par projet, navigation de l'adulte,
  retour depuis la scène, rappel des élèves sans chapitre et « Texte vide » sont
  décidés en F06.5 ; le reste de la reprise est proposé, sans retour du
  porteur à ce stade.
- **Côté élève :** critique d'ergonomie du 5 octobre 2026 (22/40 pour la
  lecture informée, 21/40 pour une lecture indépendante des captures). Le
  porteur décide : l'élève retire son propre signalement tant que la scène
  s'écrit, et une reprise s'annule (F06.3) ; la modification après
  validation se demande à l'oral en première livraison (F07.2) ; un conflit
  arrête l'écriture de l'élève, un simple échec le laisse continuer
  (F08.1). Le retour de l'enseignant mis en avant à la première ouverture
  d'une scène à reprendre, idée du porteur, est à l'essai (F07.3). Les mots
  et les dispositions de la reprise sont proposés dans le design. Il
  confirme ensuite, le même jour : l'oral aussi pour les demandes d'ajout
  ou de suppression de scène (F07.2) ; le lieu sans la référence dans le
  repère d'une phrase de choix vu par un élève (F05.2) ; pas de remise d'un
  texte vide (F07.1). Reste à entendre auprès d'élèves : le verbe de la
  remise, « remettre » ou « donner ».
- **Créer et modifier les choix dans la scène — parcours validé le
  2 octobre 2026 :** création, modification, robustesse du texte, numéro affiché,
  liaison cachée depuis la scène, protections et variantes sont décidés en
  [F05.2](#f052--créer-et-modifier-un-choix-dans-la-scène) et F06.1. Restent : note de
  l'enseignant à spécifier, effet de F08.1 sur les choix, décidé le 7 octobre
  2026 et à vérifier, écrans à décliner
  dans la maquette, et la liste du prototype de l'éditeur consignée dans
  [l'architecture](architecture.md#ce-que-le-prototype-de-léditeur-devra-éprouver).
  Objets, feuille d'aventure, actions de jeu et dé sont décidés le 2 octobre
  2026 en [F04.2](#f042--objets-de-lhistoire), sans vérification par
  l'application ; leurs écrans sont proposés dans la maquette et les
  propositions de cette section sont arbitrées. Restent ses questions ouvertes.
- **Rédiger et réviser :** contenus restants de F04, opérations
  restantes des profils de F06.1, présentation de la relecture et demandes
  de changements protégés de F07 ; historique et incidents sans conflit de
  F08, la récupération d'un conflit étant décidée le 7 octobre 2026 en
  F08.1, avec ses écrans proposés dans la maquette. Le cycle de réouverture du travail élève est confirmé
  en F07.1 ; il retire le repère « prête pour le livre » selon F11.1. Le contrôle à la sauvegarde et le signalement non bloquant du
  travail sont acquis.
- **Tester et composer — parcours validé le 30 septembre 2026 :** portée du
  playtest, liaisons cachées, gravité des contrôles, ordre imprimé et
  numérotation, aperçu corrigeable, marques du PDF de travail, format A5,
  images et pages de présentation sont décidés en F05.1, F09, F10 et F11.
  Les règles de composition laissées ouvertes par le prototype PDF sont
  décidées en entretien et validées dans leur ensemble le 3 octobre 2026 : coupures, alignement et césure, place des
  images, éditeur de la scène depuis l'aperçu, commandes de passage, pages
  peu remplies, pages de présentation, numéros de page et dés imprimés,
  titres sur une nouvelle page, gravité des problèmes de mise en page, taille
  de page et marges (F10, F11.2 à F11.5).
  Le parcours guidé de la destination Livre est décidé le même jour en
  F11.6 : étapes ouvertes dans l'ordre, tâches, avertissements acceptés,
  réglages répartis, aide à l'ouverture d'une étape ; l'agencement, nommé
  « Réordonner les passages », entre dans la première livraison (F11.5).
  Restent notamment : passage piège d'une énigme et information de l'élève
  qui la rédige, accès des élèves à l'aperçu, parties regroupées non
  consécutives, seuil de résolution, export avec marge de rognage et marges à
  confirmer sur un exemplaire imprimé chez epubli, délai de l'aperçu calculé
  côté serveur, conservation des PDF (F14) et présentation des commandes. Les écrans de la destination Livre et de la
  lecture d'essai sont proposés dans la maquette de synthèse et ont reçu un
  retour favorable d'ensemble le 1er octobre 2026 ([design](design.md#destination-livre-et-lecture-dessai)).
- **Partager et lire en ligne — parcours validé le 1er octobre 2026 :** conditions
  du partage alignées sur le PDF définitif, instantané, lien stable, mise à
  jour, retrait et changement de lien, deux canaux (lien de lecture, classes
  de l'enseignant), énigmes dans le lecteur, auteurs et informations
  personnelles sont décidés en F12.1/F12.3, avec l'avertissement « sortie non
  assurée » de F09.2. La présentation du lecteur est décidée en F12.1 et
  montrée dans la [maquette](design.md#partage-et-lecteur-en-ligne). Restent :
  faisabilité de la reprise liée au profil de l'élève, choix des classes une
  à une, réglage des auteurs par canal.
  Relèvent de F14 : durée d'hébergement, devenir du lien après la fin d'une
  offre, conservation des versions antérieures, gratuité de la lecture.
- **Assistance et exploitation :** détails et évaluation des aides de F13 ;
  offre, coûts, conservation et support de F14 encore au niveau du brief.

L'assemblage de la couverture est reporté en F11.4. L'étude de
la dictée vocale est différée en F07.4, sans décision d'inclusion ou d'exclusion
de la première livraison. Les droits de diffusion, la vitrine et la
bibliothèque sont mis de côté à la demande du porteur en F12.2 ; le lecteur
partagé demeure retenu en F12.1. Ces sujets ne doivent pas être considérés
comme validés par la clôture du cadrage général.

F01 à F13 sont partiellement précisés ici.
F14 reste au niveau du brief. Aucun sujet absent de
ce document ne doit être considéré comme arbitré ou exclu.
