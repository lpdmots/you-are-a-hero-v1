# Design V1 — Direction et conception des premiers parcours

## Statut

Le porteur souhaite une interface agréable, originale et cohérente dans la
durée. Il est prêt à envisager un template React/Tailwind/shadcn payant s'il
améliore le résultat et aide le développement assisté par IA. Aucun budget,
achat ou template n'est choisi. La direction générale et les situations
d'écran retenues sont précisées ci-dessous ; leurs maquettes locales restent
des propositions à examiner.

Le cadrage fonctionnel reste celui des [spécifications](specifications.md).
Ce document conserve les recommandations de design, pas de nouvelles règles
métier. Aucun achat n'est lancé. L'application se construit d'après le
[plan](plan.md) : elle reprend de la maquette ses valeurs de design et ses
textes d'écran, réécrits en composants, non son code. L'étape 1 est
construite le 9 octobre 2026 : voir
[Étape 1 construite](#étape-1-construite-9-octobre-2026). Les maquettes
locales restent la référence des écrans.

**Méthode confirmée le 27 septembre 2026 :** associer l'approfondissement du
parcours « préparer un projet de classe et ouvrir la première séance
d'écriture » à la conception de son expérience et de son identité visuelle.
Choisir d'abord une direction de design et les écrans représentatifs à
travailler, avant tout achat de template ou développement. Cet accord de
méthode ne valide pas les propositions encore signalées comme telles.

**Premier parcours validé le 28 septembre 2026 :** son approfondissement
fonctionnel est clôturé sur les décisions confirmées des spécifications.
La prochaine étape recommandée est leur mise à l'épreuve visuelle. Les
propositions de disposition, de déclinaisons adulte/élève et d'outillage
conservent leur statut. Deux instructions ultérieures du même jour autorisent
les maquettes locales : d'abord la planche d'ambiance et l'organisation du
récit, puis les trois autres situations après un retour favorable sur ce
premier lot, sans validation exhaustive de ses détails.

**Deuxième parcours validé le 28 septembre 2026 :** « rédiger une scène, la
faire relire, la reprendre et la valider » est validé dans son ensemble,
avec ses points différés en [F07](specifications.md#f07--révision-et-validation).
Le porteur autorise sa déclinaison visuelle dans la maquette existante.
La correction enseignant et la reprise élève sont déclinées dans la maquette.

**Synthèse du 30 septembre 2026 :** deux propositions visuelles indépendantes
ont été comparées puis réunies, selon le plan approuvé par le porteur, dans
la [maquette de synthèse](#maquette-de-synthèse). Ses dispositions restent
des propositions à examiner.

**Troisième parcours décliné le 30 septembre 2026 :** sur instruction du
porteur, les écrans de « tester la lecture et composer le livre » sont
ajoutés à la maquette de synthèse ; voir
[Destination Livre et lecture d'essai](#destination-livre-et-lecture-dessai).
Ce sont des dispositions proposées, sans nouvelle règle fonctionnelle.
Le porteur leur donne un retour favorable d'ensemble le 1er octobre 2026,
sans validation exhaustive de leurs détails ni des commandes restant à concevoir.

**Quatrième parcours décliné le 1er octobre 2026 :** sur instruction du
porteur, les écrans de « partager une version terminée et la lire en ligne »
sont ajoutés à la maquette de synthèse ; voir
[Partage et lecteur en ligne](#partage-et-lecteur-en-ligne). Ce sont des
dispositions proposées. Le porteur les juge satisfaisantes le même jour et
arbitre la présentation du lecteur, consignée en F12.1.

**Cinquième parcours décliné le 2 octobre 2026 :** sur instruction du
porteur, les écrans de « créer et modifier les choix dans la scène » sont
ajoutés à la maquette de synthèse ; voir
[Choix dans la scène et blocs protégés](#choix-dans-la-scène-et-blocs-protégés).
Ce sont des dispositions proposées. Le porteur leur donne un retour favorable
d'ensemble le même jour, sans validation exhaustive de leurs détails ; les
quatre choix précisés pendant la conception restent à confirmer.

**F04.2 décliné le 2 octobre 2026 :** sur instruction du porteur, les écrans
des objets de l'histoire, de la feuille d'aventure, des actions de jeu et du
dé sont ajoutés à la maquette de synthèse ; voir
[Objets, feuille d'aventure, actions de jeu et dé](#objets-feuille-daventure-actions-de-jeu-et-dé).
Ce sont des dispositions proposées, sans retour du porteur à ce stade. Trois
points ont été arbitrés pendant la conception et consignés en F04.2.

**Destination Livre reprise les 3 et 4 octobre 2026 :** sur instruction du
porteur, ses écrans sont repris plusieurs fois : pour les décisions de F10,
F11.2 à F11.5 et F12.1, puis pour le parcours guidé de
[F11.6](specifications.md#f116--trois-temps-pour-préparer-le-livre), après
trois critiques d'ergonomie. L'état actuel, les retours du porteur et
l'historique de ces reprises sont dans
[Destination Livre et lecture d'essai](#destination-livre-et-lecture-dessai).

**Suivi repris le 4 octobre 2026 :** une critique d'ergonomie du Suivi (22/40
pour la lecture informée comme pour une lecture indépendante des captures)
puis deux échanges avec le porteur conduisent aux décisions consignées en
[F06.5](specifications.md#f065--suivi-du-travail-et-accès-aux-scènes) et
[F07.4](specifications.md#f074--fiches-de-rédaction-pour-le-travail-sur-papier) :
un suivi par projet, sans suivi de tous les projets ; une barre du haut
globale, qui porte le nom du dernier projet ouvert ; de grandes cartes dans
« Mes projets » ; un retour au Suivi depuis la scène ; « Texte vide » pour une
scène sans texte ; une fiche de rédaction qui liste les scènes. La maquette et
ses captures sont reprises le même jour. Une deuxième critique mesure cette
reprise (28/40 et 25/40) ; le porteur décide alors un écran d'aide à
l'ouverture du Suivi, comme au Livre, et la feuille du seul élève choisi sur
la page des fiches,
écarte l'ancienneté des remises, et demande les ajustements issus de la
critique, faits le même jour. Une troisième critique, qu'il demande ensuite,
mesure ces ajustements (29/40 et 28/40) ; il décide alors que « Voir », sur
la carte du projet, n'ouvre pas l'écran d'aide, et que les scènes sans élève
peuvent être réparties à l'impression des fiches, et demande trois
retouches. Voir
[Suivi repris après critique](#suivi-repris-après-critique-4-octobre-2026).
Ces écrans n'ont pas encore reçu son retour ; la suite est un essai par une
personne qui découvre l'outil.

**Page de scène reprise le 4 octobre 2026 :** une critique d'ergonomie de la
page de scène ouverte par l'enseignant donne 23/40 pour la lecture informée
comme pour une lecture indépendante des captures. Le porteur décide alors
que l'enseignant a la main sur l'état de la scène, qu'il choisit sur son
tampon
([F07.1](specifications.md#f071--du-travail-préparatoire-au-travail-élève-validé)),
que « Validé » et « Prête » sont les seuls noms des deux jalons, qu'une
scène sans élève a trois états
([F11.1](specifications.md#f111--distinguer-travail-élève-terminé-et-scène-prête-pour-le-livre))
et que l'enseignant peut s'attribuer une scène
([F06.3](specifications.md#f063--prise-en-charge-et-signalement-du-travail)),
et demande d'arranger les détails relevés. La maquette et ses captures sont
reprises le même jour ; le porteur confirme ensuite six choix faits pendant
la reprise, sans retour sur le reste : voir
[Page de scène reprise après critique](#page-de-scène-reprise-après-critique-4-octobre-2026).

**Côté élève repris le 5 octobre 2026 :** une critique d'ergonomie de ce que
fait un élève seul devant l'ordinateur donne 22/40 pour la lecture informée
et 21/40 pour une lecture indépendante des captures. Le porteur décide que
l'élève peut retirer son propre signalement et annuler une reprise
([F06.3](specifications.md#f063--prise-en-charge-et-signalement-du-travail)),
que la modification après validation se demande à l'oral en première
livraison ([F07.2](specifications.md#f072--propositions-et-changements-protégés)),
qu'un conflit arrête l'écriture de l'élève
([F08.1](specifications.md#f081--écritures-concurrentes)), accepte les mots
recommandés, propose de mettre en avant le retour de l'enseignant à la
première ouverture d'une scène à reprendre, et demande de corriger les
autres points d'ergonomie relevés. Il confirme ensuite trois
recommandations : l'oral pour toutes les demandes, le lieu sans la
référence dans une phrase de choix vue par un élève
([F05.2](specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène)),
pas de remise d'un texte vide
([F07.1](specifications.md#f071--du-travail-préparatoire-au-travail-élève-validé)).
La maquette et vingt captures sont
reprises le même jour, sans retour du porteur sur les écrans à ce stade : voir
[Côté élève repris après critique](#côté-élève-repris-après-critique-5-octobre-2026).

**Passe de cohérence du 6 octobre 2026 :** un relevé de ce qui change d'un
écran à l'autre, sur toute la maquette, explique la cohérence restée à 2 sur
4 dans les critiques. Le porteur accepte ses trois recommandations — la
règle des couleurs réécrite, « remarque » des deux côtés, l'alignement fait
avant l'essai — et demande d'améliorer chaque point relevé, en lui
soumettant ceux qui laissent un doute. La maquette est reprise le même
jour : voir [Passe de cohérence](#passe-de-cohérence-6-octobre-2026).

**Écrans d'entrée de l'enseignant ajoutés le 6 octobre 2026 :** sur
instruction du porteur, « Mes classes » et « Nouveau projet », jusque-là
factices, sont maquettés après un entretien court qui décide la création
d'un projet ([F01](specifications.md#f01--projet-et-responsabilité-de-ladulte)),
la fin d'une année, le prénom et le nom d'un élève, son retrait de la classe
([F01.1](specifications.md#f011--classes-années-et-éventuel-espace-école)),
les informations de la classe et ses supports imprimés
([F06.4](specifications.md#f064--classe-de-référence-et-postes-partagés)).
Une critique d'ergonomie les mesure le même jour (28/40 pour la lecture
informée, 26/40 pour une lecture indépendante de 44 captures) ; ses points
sont corrigés aussitôt, sans nouvelle mesure. Voir
[Mes classes et Nouveau projet](#mes-classes-et-nouveau-projet-6-octobre-2026).
Le porteur confirme le 7 octobre les règles que ces écrans proposaient et
décide un zéro sans barre pour ce que lit l'élève ; la forme des écrans
reste sans retour.

**Conflit de sauvegarde dessiné le 7 octobre 2026 :** sur instruction du
porteur, les écrans de la récupération d'un conflit, décidée et validée le
même jour en [F08.1](specifications.md#f081--écritures-concurrentes), sont ajoutés à la maquette de synthèse : le texte
gardé à part dans un onglet de la page de scène et ses deux gestes, le
conflit de l'adulte, la ligne de rappel du Suivi, la scène à côté de
l'aperçu, le mode personnel, et ce que lit l'élève arrêté. Deux trous de
règle rencontrés en dessinant sont tranchés par le porteur avant le dessin
(F08-AC30, F08-AC31). Ce sont des dispositions proposées, sans retour de sa
part : voir
[Conflit de sauvegarde : écrans de F08.1](#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026).

## Maquette de synthèse

**Démarche :** deux propositions visuelles indépendantes ont été conçues sur
le même cadrage (Codex les 28 et 29 septembre, Claude le 29 septembre 2026),
puis comparées sur les mêmes situations, contenus et dimensions d'écran.
Le 30 septembre, le porteur a approuvé le plan de synthèse : l'identité,
l'organisation, le graphe et le suivi de la proposition Claude, les
dispositions d'écriture, de relecture, de projection et de connexion de la
proposition Codex, redessinées dans un seul système. La
[maquette de synthèse](../maquettes/synthese/index.html) remplace les deux
propositions comme référence. Ses dispositions restent des propositions à
examiner ; seules les règles fonctionnelles des spécifications sont acquises.

**Livrables :** [sommaire](../maquettes/synthese/index.html),
[planche d'ambiance](../maquettes/synthese/planche.html),
[maquette interactive](../maquettes/synthese/recit.html) et
[captures](../maquettes/synthese/captures/) en 1 440, 1 366 × 768 et 390 px
(24 à 34 pour le livre, 35 à 60 pour le partage, la lecture en ligne et les
phrases de choix, 61 à 76 pour les choix dans la scène, 77 à 81 pour les
scènes voisines, 82 à 102 pour les objets, la feuille d'aventure, les actions
de jeu et le dé, 103 à 121 pour la mise en page depuis l'aperçu, 122 à 151
pour le livre en étapes, jusqu'à 156 ; les captures 25, 29, 91, 92, 112,
128 et 139 sont supprimées ; 157 à 182 pour le Suivi repris, « Mes
projets » et les fiches, sans 170 ni 173). Les captures du livre ont été refaites le
4 octobre après la seconde critique ; 147 à 156 sont nouvelles. Celles du
Suivi (05, 22, 143) et des fiches de rédaction (06) sont refaites le même
jour, puis une seconde fois, avec 157 à 175, après la deuxième critique du
Suivi ; 176 à 179 sont nouvelles (aide à l'ouverture du Suivi, feuille du seul
élève choisi, fiches par élève la veille de la première séance, aide en
390 px). Après la troisième critique, les captures du Suivi et des fiches
sont refaites une fois encore, sauf 164, 167, 169, 175, 176 et 179,
inchangées ; 180 à 182 sont nouvelles (scène sans élève proposée à un élève,
message de demande avant l'impression, scènes réparties la veille de la
première séance). Le bouton « Aide » du Livre a pris le même point
d'interrogation que celui du Suivi : les captures du Livre montrent encore
l'ancien signe. La barre du haut de l'adulte a changé ce jour-là (nom du projet, « Mes
projets », « Mes classes », menu affiché en 390 px) : toutes les autres
captures de l'espace adulte montrent encore l'ancienne barre, et sont à
refaire à la prochaine reprise de leurs écrans. Après la critique de la page
de scène, les captures 15, 78, 103, 141, 149, 150 et 167 sont refaites et
183 à 193 sont nouvelles (menu des états, scène validée, rappel avant
« prête », scène de l'enseignante, menu de la scène, conflit, texte remis,
remarque de reprise, scène sans élève, relecture et menu en 390 px), puis
refaites avec 03, 04 et 143 quand le menu « Plus » prend l'icône à trois
points et que « Texte vide » s'affiche partout ; 194 et 195 s'y ajoutent
(scène suivante à valider, « Texte vide » dans l'en-tête) ; les
autres captures de la page de scène (12 à 14, 16 à 18, 20, 61 à 77, 79 à 89)
et de la scène à côté de l'aperçu gardent l'ancien en-tête et les anciens
noms d'état. Les captures 196 à 215 montrent le côté élève repris le
5 octobre, en 1 366 × 768, format des ordinateurs de la classe, sans la
barre de présentation, et deux vues en 390 px, dont la scène au texte
vide (215) ; les captures antérieures de
la connexion, de « Mon travail » et de la scène vue par un élève (10 à 13,
20, 71 à 73, 76, 79, 84, 87, 88) gardent l'ancien pied de copie et les
anciens mots. Les captures 245 à 270 montrent la passe de cohérence du
6 octobre ; les captures antérieures des mêmes écrans gardent les anciens
mots, les pilules en bleu canard et les anciens retours.
Les captures 271 à 314 montrent « Mes classes » et « Nouveau projet »
(6 octobre), dont dix en 390 px. Les captures 315 à 337 montrent les
écrans du conflit de sauvegarde (7 octobre) : 315 à 328 pour l'adulte en
1 440 px, 329 et 330 en 390 px, 331 à 336 pour l'élève en 1 366 × 768, 337
en 390 px ; 188 et 203, qui montraient les anciens messages, sont refaites.
La barre de présentation compare les vues enseignante et élèves, les modes
personnel/classe et classique/choix, avec ou sans images, ainsi que les cas
de sauvegarde, de conflit, d'horaires et de modification pendant la relecture ;
sur les pages du livre, elle simule trois moments de l'année et, pour le
partage, cinq cas : pas partagé, partagé, livre modifié depuis, scène
rouverte, retiré.

### Système proposé : « Cahiers d'aventure »

Le carnet d'aventure illustré est habillé des objets que la classe connaît.
L'illustration crée l'ambiance ; les objets portent l'information.

1. **Trois objets papier, deux marques.** Le cahier représente le chapitre
   (dos à la couleur du chapitre, étiquette blanche portant le titre). La
   fiche porte une scène ou son contexte ; le filet sous son en-tête indique
   sa nature : rose pour la consigne, corail pour un retour, canard pour une
   décision. La copie est la page où l'on écrit le récit : feuille blanche,
   marge rouge d'écolier. Le tampon indique l'état de travail, avec un mot et
   un pictogramme ; la gommette désigne l'élève qui s'occupe d'une scène,
   sans suggérer de verrou.
2. **Une couleur, un rôle** (règle réécrite le 6 octobre 2026, sur décision
   du porteur). Couleur du chapitre : dos, bandeaux et fond léger de ses
   pages, jamais les surfaces d'écriture. Ambre : cela attend quelqu'un, ou
   demande l'attention (« À valider », avertissement, horaires). Brique : à
   refaire, ou cela bloque (« À reprendre », problème bloquant, commande qui
   supprime). Vert : c'est fait (« Validé », enregistré, étape terminée).
   Bleu et violet : les seuls tampons « En cours » et « Prête », avec la
   barre des scènes prêtes de « Mes projets ». Bleu canard : le bouton
   principal, les liens et ce qui est coché ; la vue choisie dans une
   bascule est une pilule graphite, pour ne pas imiter le bouton principal.
   Couleur de l'élève, adoucie : sa gommette uniquement. La règle d'origine
   réservait les couleurs d'état aux tampons : la maquette ne la tenait que
   pour le bleu et le violet, et le sens des trois autres était déjà le même
   partout.
3. **Trois voix.** Atkinson Hyperlegible pour l'outil (commandes, titres de
   travail, tableaux, références en version Mono) ; Vollkorn pour le texte du
   récit, les choix proposés au lecteur, les extraits et les fiches papier ;
   la cursive Playwrite FR seulement pour l'accueil et le prénom de l'élève.
4. **Une structure par niveau.** Un en-tête de projet commun à Préparation,
   Parties et chapitres et Suivi ; un bandeau de chapitre commun au chapitre
   et à ses scènes ; une seule page de scène pour écrire, reprendre, relire
   et valider, avec des commandes adaptées au rôle et à l'état.

**Palette de référence :** bureau `#F1F2EE`, feuille `#FFFFFF`, graphite
`#1E2226`, bleu canard `#0B6A73`. Huit couleurs de chapitre (coquelicot,
abricot, tournesol, prairie, lagon, bleuet, lilas, pivoine), chacune avec
un dos, un bandeau et une teinte de fond. Les contrastes du texte sur les
fonds utilisés ont été calculés au-dessus de 4,5:1 ; ce contrôle ponctuel
ne vaut pas audit complet. Les valeurs détaillées sont dans la
[feuille de style de la maquette](../maquettes/synthese/assets/base.css).

**Illustrations proposées :** illustration 2D contemporaine en lumière de
jour, formes arrondies, peu de détails et un petit animal complice placé dans
les deux tiers supérieurs, pour rester visible au-dessus de l'étiquette.
Trois autres styles ont été essayés puis écartés : gouache sombre, peu lisible
en vignette ; risographie, jugée datée ; volume façon pâte à modeler, trop
jeune pour le cycle 3. Les images ont été générées par le porteur à partir
des prompts de Claude. Sans image choisie, un chapitre reçoit une
illustration générique de la bibliothèque par défaut (forêt, mer, montagne,
cité, désert), attribuée une fois puis conservée, sans teinte. Risque
identifié : un rendu « décor d'animation » générique, à tenir par une
lumière et une palette constantes.

### Dispositions proposées par situation

| Situation | Disposition |
| --- | --- |
| Parties et chapitres | Cartes-cahiers par partie. Toute la carte ouvre le chapitre ; elle dit le nombre de scènes et de scènes validées, ce qui attend l'adulte, les élèves et ce qui manque. Menu à trois points pour ses commandes. En tête, la phrase « À compléter » et ses liens ; écran d'aide à l'ouverture. Détail dans [Organisation du récit reprise après critique](#organisation-du-récit-reprise-après-critique-6-octobre-2026). |
| Chapitre | Bandeau du chapitre avec « Ajouter une scène », « Attribuer des élèves » et le menu à trois points ; une ligne d'outils : bascule Scènes/Chemins, recherche, « Voir dans le Suivi ». Cartes de scène sans case à cocher : état, liens, « qui s'en occupe » à changer sur place, menu de la scène. Le mode personnel et l'élève gardent leurs filtres. |
| Chemins (vue Graphe) | Chaque lien part de la ligne du choix qui le propose ; « Départ du livre », « Fin de l'histoire » et « 2 chemins se rejoignent » écrits au-dessus de la scène ; « Sans suite » dans une scène sans choix ni fin ; choix vers les autres chapitres à leur couleur, qui ouvrent ce chapitre dans la même vue ; taille lisible par défaut, « Tout voir ». Sur mobile : disposition verticale, scène touchée marquée, encart de ses choix collé en bas. |
| Suivi | Suivi d'un projet, sous son en-tête : rappel des élèves sans chapitre, filtres chapitre et élève, tampons d'état en filtres, tableau groupé par chapitre, vue Élèves. Détail dans [Suivi repris après critique](#suivi-repris-après-critique-4-octobre-2026). |
| Fiches de rédaction | Sélection par partie et chapitre, ou par élève ; aperçu A4 d'une feuille par chapitre ou par élève, qui liste les scènes choisies sous leur référence : titre, consigne, image éventuelle, texte déjà écrit, demande de reprise, choix de fin sans destination. Pas de lignes pour écrire : l'élève écrit sur son cahier (F07.4, 4 octobre 2026). |
| Connexion élève | Ouvrir la classe (identifiant et mot de passe de classe), puis « Qui utilise cet ordinateur ? » : prénoms en étiquettes de porte-manteau, dans l'ordre alphabétique, code à quatre chiffres à une place réservée, pour que la grille ne bouge pas. « Changer d'élève » et « Quitter la classe » restent distincts ; « Quitter la classe » demande une confirmation. Détail dans [Côté élève repris après critique](#côté-élève-repris-après-critique-5-octobre-2026). |
| Mon travail (élève) | Accueil illustré au prénom de l'élève ; ses scènes rangées par urgence, chacune avec sa prochaine action, une seule avec le bouton plein ; les scènes des camarades à lire ; puis toute l'histoire en cartes. Hors des horaires, la page dit quand le travail rouvre. |
| Écriture et reprise | Copie à gauche (texte, phrases de choix écrites comme dans le livre avec leur renvoi et le repère de la destination), fiches de contexte à droite. Le pied de la copie reste à l'écran : enregistrement, remise et incidents s'y lisent sans défiler. En reprise, le retour de l'enseignante s'affiche d'abord seul, à l'essai, puis prend la place de la consigne, repliée. Messages ponctuels au-dessus : remise faite, prise en charge d'un camarade, scène prise ou rendue avec « Annuler ». |
| Relecture | Même page. Dans la copie, les onglets « Texte de la scène » et « Remis le… » ; à droite, la fiche « Votre relecture », qui ne porte que l'étape suivante (valider, demander une reprise avec remarque), la consigne, l'aide IA repliée et les remises. L'état se choisit sur le tampon de l'en-tête. La proposition IA s'affiche au-dessus de la copie avec les suppressions et ajouts visibles. Après un conflit de sauvegarde, le texte gardé à part est un onglet de plus. Détail dans [Page de scène reprise après critique](#page-de-scène-reprise-après-critique-4-octobre-2026) et [Conflit de sauvegarde : écrans de F08.1](#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026). |
| Mes classes | Liste : une carte par classe en cours, avec ses élèves en gommettes, et les années passées en lignes. Une classe : ses élèves à gauche, sur deux colonnes, chacun ouvrant sa fiche ; à droite, trois fiches — pour ouvrir la classe sur un ordinateur, horaires, projets. Inscription en trois étapes, impression des étiquettes et de l'affiche. Détail dans [Mes classes et Nouveau projet](#mes-classes-et-nouveau-projet-6-octobre-2026). |
| Nouveau projet | Trois questions, l'une après l'autre : « Qui écrit ? », « Quel récit ? », le titre et la classe ; deux choix dessinés par question, le rappel de ce qui ne se change pas avant « Créer le projet ». « Mes projets » sans projet montre un cahier sans titre et « Créer mon premier projet ». |
| Préparation | Carnet en fiches par rubrique, pistes écartées repliées, grandes étapes reprenant le plan commun. Atelier projeté : question et « Nous retenons… » dominants, relances repliées, idées de la classe en une ligne, aide IA ouverte à la demande ; tient en 1 366 × 768. |

**Choix précisé pendant la synthèse, révisé le 4 octobre 2026 :** une scène
jamais écrite n'a pas d'état supplémentaire dans les règles de
[F07.1](specifications.md#f071--du-travail-préparatoire-au-travail-élève-validé).
Dans le Suivi, elle porte désormais le tampon neutre « Texte vide » à la place
de « En cours », décision d'affichage du porteur consignée en F06.5 : la
veille de la première séance, tout le tableau disait « En cours » à tort. Le
chapitre, le graphe et la page de scène, qui gardaient « En cours » avec
l'indication « texte vide », portent le même tampon depuis le même jour.

**Vérifications et limites :** pages contrôlées en 1 440 et 390 px et atelier
en 1 366 × 768, sans erreur de console ni débordement horizontal après
correction ; parcours de remise, retrait, reprise explicite, correction IA,
demande de reprise et validation suspendue rejoués. Les données restent en
mémoire : droits serveur, sauvegarde concurrente, éditeur riche, placement
automatique d'un graphe chargé et qualité IA ne sont pas éprouvés. Les
polices sont chargées depuis Google Fonts ; elles devront être hébergées
avec l'application pour un usage en classe sans réseau fiable.

### Suivi repris après critique (4 octobre 2026)

**Première mesure :** 22/40 pour la lecture informée et 22/40 pour une lecture
indépendante de 72 captures de travail, heuristique par heuristique à un
point près ; le Livre finissait à 29 et 27. Constats communs : 24 commandes
avant le tableau, trois usages affichés en permanence (préparer la séance,
corriger, finir le livre), un en-tête de projet au-dessus des scènes de tous
les projets, des états sans légende, « En cours » pour des scènes jamais
commencées, aucun retour vers le Suivi depuis une scène, une vue Élèves
illisible en 390 px. Ces notes mesurent l'écran d'avant la reprise.

**Décisions du porteur, en F06.5 et F07.4 :** suivi par projet, le suivi de
tous les projets étant retiré ; barre du haut globale avec le nom du dernier
projet ouvert, arrivée dans ce projet à son dernier onglet ; grandes cartes de
« Mes projets » avec le pourcentage des scènes prêtes ; « Retour au Suivi »
depuis la scène ; rappel des élèves sans chapitre, sans l'état des accès ;
bouton des fiches de rédaction, ouvert sur les scènes listées ; « Texte vide »
pour une scène sans texte ; fiche de rédaction qui liste les scènes, par
chapitre ou par élève, à la suite si l'on veut, sans les scènes sans consigne. Une
première reprise, le matin, montrait deux cadres (un projet, tous les projets)
et une ligne « avant la séance » avec l'état des accès : le porteur les a
écartés l'après-midi.

**Deuxième mesure, après la reprise :** 28/40 pour la lecture informée et
25/40 pour une lecture indépendante de 117 captures de travail (35 états en
1 440 et 390 px), soit 6 et 3 points de plus. Les deux lectures montent sur
le contrôle, la sobriété, la récupération et l'aide ; la cohérence ne bouge
pas. Le chiffre à retenir pour une personne qui découvre est 25 : les trois
points d'écart portent sur la compréhension sans les règles. Le Suivi rejoint
la zone du Livre. Ce qui marche : le chemin « À valider » (carte du projet,
tampon, « Relire », retour), les impasses qui nomment les filtres, la fiche
de rédaction elle-même, les phrases de la légende. Ce qui gênait : « Validé »
et « Prête » confondus sans la légende, cachée derrière son icône ; la page
des fiches, où choisir un élève réduisait la liste sans réduire
l'impression ; la veille de la première séance, quarante lignes « Texte
vide · Aucun élève » sans dire que les élèves se répartissent les scènes ;
des dispositifs muets (titre de scène non cliquable, « 5 scènes à valider »
sans chemin, élève sans chapitre non dit à la sélection par défaut) ; en
390 px, un écran entier de commandes avant la première scène.

**Décisions du porteur après cette mesure :** un écran d'aide s'affiche à
l'ouverture du Suivi, comme à une étape du Livre, et remplace la légende
ouverte une fois, d'abord retenue (F06.5) ; sur la page des fiches, un
élève choisi n'imprime que sa feuille (F07.4) ; l'ancienneté des remises et
le tri par la plus ancienne sont écartés ; les ajustements issus de la
critique sont faits, puis l'écran passe à un essai par une personne qui
découvre l'outil. Le reste du tableau est proposé, sans retour du porteur.

**Troisième mesure, après ces ajustements, à la demande du porteur :**
29/40 pour la lecture informée (3, 3, 3, 2, 3, 3, 3, 3, 3, 3) et 28/40 pour
une lecture indépendante (3, 3, 3, 2, 3, 2, 3, 3, 3, 3), soit 1 et 3 points
de plus ; un point d'écart entre les deux, contre trois. La lecture
indépendante porte sur 76 captures de travail (les 41 états en 1 440 px, 27
captures en 390 px, 6 détails), une première tentative sur 117 ayant tourné
sans conclure. L'aide monte dans les deux lectures, la prévention des
erreurs dans la seconde, grâce à la page des fiches ; son point de plus sur
le langage n'est pas tenu pour acquis, puisqu'elle relève encore une
vingtaine de mots flous. La cohérence reste à 2 pour la troisième fois. Ce
qui marche : le chemin « À valider », jusqu'au téléphone ; l'aide en un
écran et quatre questions ; la feuille d'un élève. Ce qui gênait : « Voir »,
sur la carte, ouvrait l'écran d'aide au lieu des scènes à valider ; la
veille, quarante « Aucun élève » sans dire que les élèves prennent les
scènes, et une feuille par chapitre pour trois élèves, sans nombre
d'exemplaires ; cinq icônes d'information identiques, dont celle du bouton
« Aide » ; en 390 px, trois tampons qui tenaient exactement, sans que rien
montre les quatre autres ; sur la page des fiches, « Imprimer 0 feuille »
et « 0 scène » avec des cases cochées. Le plafond de la méthode est
atteint : une critique ne dit pas si une personne déplie l'aide, si elle lit
« Validé » comme fini, ni si elle comprend que les élèves prennent les
scènes.

**Décisions du porteur après cette mesure :** « Voir » n'ouvre pas l'écran
d'aide (F06.5) ; en « par élève », on tire les scènes déjà prises, ou
toutes, celles sans élève étant alors réparties à parts égales entre les
élèves du chapitre, à l'impression seulement et après un message de demande
(F07.4, F06.3) ; les trois retouches recommandées sont faites, puis l'écran
passe à l'essai, sans quatrième critique. Après la reprise, il confirme
cinq choix : la commande de répartition placée dans la phrase qui signale
les scènes sans élève ; une scène écartée du partage en la décochant,
l'élève proposé ne se changeant qu'ensuite ; les scènes données dans
l'ordre du chapitre ; ce qui reste hors partage (scène sans consigne,
chapitre non attribué, page réduite à un élève) ; le point d'interrogation
du bouton « Aide », au Livre compris. Les autres dispositions de cette
reprise restent proposées.

| Élément | Disposition |
| --- | --- |
| Barre du haut | « Les passeurs de brume », nom du dernier projet ouvert, en premier et en gras : il ramène au projet, à son dernier onglet utilisé, comme le logo. Puis « Mes projets » et « Mes classes », hors lot. Dans un projet, son nom est allumé. Plus d'entrée « Suivi ». En 390 px, le menu reste affiché, le nom du projet est abrégé, le logo et l'identité se réduisent à leur signe. |
| Mes projets | De grandes cartes, deux par ligne : image en bandeau, titre, classe et type de récit, « 5 scènes à valider » suivi du lien « Voir », une barre et « 3 % des scènes prêtes pour le livre », en violet, couleur de l'état « Prête ». « Voir » ouvre le Suivi sur les scènes à valider, sans passer par son écran d'aide ; le reste de la carte reprend le projet à son dernier onglet. C'est le motif du rappel du Suivi : l'information d'un côté, le lien de l'autre. « Continuer », bouton principal, sur le dernier projet ouvert (« Reprendre » jusqu'à la deuxième critique, trop proche de l'état « À reprendre ») ; « Ouvrir » sur les autres. Le second projet est factice ; « Nouveau projet » est maquetté depuis le 6 octobre. |
| Élèves sans chapitre | Sous les onglets, une ligne en ambre : « 2 élèves sans chapitre » et le lien « Voir », qui ouvre la vue Élèves. C'est un lien, pas un filtre. Rien n'est affiché quand tous ont un chapitre, ni dans le Suivi filtré, ni quand le suivi n'a pas pu être chargé. Les scènes sans consigne ne sont plus signalées ici : un décompte qui filtrait la liste sans avoir l'air d'un filtre égarait le porteur. L'état des accès n'y figure pas. Depuis le 7 octobre, une seconde ligne de la même forme dit les textes gardés à part : voir [Conflit de sauvegarde : écrans de F08.1](#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026). |
| Filtres | La bascule Scènes / Élèves, puis Chapitre et Élève. Pas de filtre Projet. |
| Tampons d'état en filtres | Idée du porteur, à l'essai : « Toutes », puis les tampons du tableau, en plus grand, avec leur nombre, qui suit le chapitre et l'élève choisis. Le tampon choisi est plein, à sa couleur ; celui qui ne compte aucune scène est éteint et garde sa place. La rangée reste affichée même quand la liste est vide : rien ne se déplace. Au bout, une icône d'information ouvre la légende. Les tampons des lignes, eux, ne se cliquent pas : le lecteur indépendant n'a pas su le dire, et c'est le point à observer à l'essai. En 390 px, les tampons tiennent sur une seule rangée qui défile, sur toute la largeur, sous un libellé « État » qui porte l'icône de la légende, comme « Chapitre » et « Élève » au-dessus de leur liste ; « Toutes », « À valider » et « À reprendre » sont en vue, le quatrième dépasse pour montrer qu'il y en a d'autres, le bord ne s'estompe que du côté où il en reste, et le tampon choisi est amené en vue. |
| Légende des états | Bulle ancrée à l'icône, comme dans le livre : chaque tampon et une phrase qui dit à qui est le tour. « À valider » et « Validé » : à l'adulte ; « À reprendre » : à l'élève. Elle reprend, à la demande, ce que l'écran d'aide dit des états. |
| Aide du Suivi | À l'ouverture de l'onglet, à la place de la liste : la fiche d'aide du Livre, sous l'en-tête du projet. « Que fait-on ici ? », ouvert, avec trois usages (relire les scènes à valider, voir ce que fait chaque élève, imprimer les fiches) ; puis trois questions repliées : « Que veulent dire les états ? » (les tampons et leurs phrases), « Qui s'occupe d'une scène ? », « Que sont les fiches de rédaction ? ». « Commencer », bouton principal, et la case « Ne plus afficher ». Ensuite, « Aide », discret, au bout de la rangée des filtres, à côté de la bascule en 390 px : il rouvre l'écran, dont le bouton devient « Fermer l'aide ». Son signe est un point d'interrogation, au Suivi comme au Livre : le « i » reste celui des bulles d'information, qui ouvrent autre chose. Pas d'aide quand on vient du Livre finir des scènes, quand on arrive par « Voir » depuis la carte du projet, ni quand le suivi n'a pas pu être chargé. |
| Fiches de rédaction | À droite de la rangée des états : « Imprimer les fiches de rédaction », bouton de taille normale, et une icône d'information qui dit ce que c'est, et qu'une scène sans consigne n'est pas imprimée. Il ouvre les fiches sur les scènes listées qui restent à écrire ou à reprendre et qui ont une consigne ; avec « Dont Alice s'occupe », sur la feuille d'Alice ; avec « Tout son chapitre », sur celle du chapitre (confirmé par le porteur). |
| Liste des scènes | Une ligne d'en-têtes au-dessus de la liste, plus répétée dans chaque groupe. Colonnes : référence, scène, état, qui s'en occupe, action. Le titre de la scène l'ouvre, comme le bouton de sa ligne. Plus de colonne « Consigne » : la mention « sans consigne » suit le titre. Une scène sans élève porte « Pas encore prise » dans un chapitre attribué, ce qui dit que les élèves prennent les scènes, et « Aucun élève » dans un chapitre qui n'en a pas (« Personne », puis « Aucun élève » partout, jusqu'à la troisième critique) ; une icône d'information, sur « Qui s'en occupe », dit que les élèves d'un chapitre se répartissent ses scènes. En-tête de groupe neutre, le dos gardant la couleur du chapitre, pour ne pas la confondre avec une couleur d'état ; il rappelle les élèves du chapitre, ou « Chapitre non attribué ». Le seul bouton principal de la page est « Relire ». |
| Sélections par élève | Après le choix d'un élève : « Dont Alice s'occupe 3 » et « Tout son chapitre 6 » (« Tous ses chapitres » s'il en a plusieurs), la première présélectionnée, avec une icône d'information. Ce sont les « Prises en charge » et « Accessibles » de F06.5, dites autrement. « De son chapitre », d'abord proposé, n'était compris qu'avec la bulle. |
| Vue Élèves | Colonnes « Chapitres », « Tout son chapitre », « S'en occupe », « À régler » (« À noter » jusqu'à la troisième critique, lu « mettre une note », puis « Signalement » jusqu'au 6 octobre, mot à trois sens) ; une icône d'information remplace le paragraphe. Un élève sans chapitre porte « Attribuer un chapitre ». « Retour à traiter », qui doublait « 1 à reprendre » en rouge, est retiré. En 390 px, une fiche par élève. |
| Aucun résultat, échec | « Aucune scène pour : La lisière · Prête. Tout afficher » nomme les filtres en cause. Pour un élève sans chapitre, dans les deux sélections : « Adam n'a aucun chapitre », avec « Attribuer un chapitre ». « Le suivi n'a pas pu être chargé. Réessayer ». |
| Retour depuis la scène | « Retour au Suivi » dans la pastille de l'en-tête de la scène, à la place du nom du chapitre, qui rend les filtres et l'endroit quittés, y compris par le retour du navigateur. Les filtres tiennent pendant la visite, fiches comprises, et repartent de « Toutes » à chaque nouvelle entrée. Après une validation, la scène validée n'est plus dans la liste filtrée. |
| Page des fiches | À gauche, un filtre Élève, les raccourcis d'ajout, « Tout décocher » et la liste par partie et chapitre ; une scène sans consigne y est grisée, « sans consigne : pas imprimée », et ne se coche pas. À droite, le réglage « Une feuille : par chapitre / par élève », la case « À la suite, à découper », puis sur une ligne le décompte (« 4 scènes sur 3 feuilles · Alice », ou « 4 scènes en 3 parties à découper »), les flèches de feuille et « Imprimer 3 feuilles », toujours en vue ; dessous, la feuille. Un élève choisi : seules ses scènes cochées, sur sa feuille (« 2 scènes sur 1 feuille · Alice », « Imprimer 1 feuille »). À la suite, les parties s'enchaînent dans l'aperçu, séparées par un trait pointillé « ✂ à découper », sans saut de page. Par élève, une ligne dit « 1 des 5 scènes choisies n'a pas d'élève : sur aucune feuille », avec « La répartir entre les élèves du chapitre » et « Passer par chapitre ». Répartie, la scène porte dans la liste la gommette de l'élève proposé, en pointillé, sa feuille s'ajoute à l'aperçu, et la ligne devient « S006 est proposée à Emma : elle sera à son nom à l'impression », avec « Ne pas répartir ». « Imprimer » ouvre alors, à la place de cette ligne, le message de demande : « Emma s'occupe de S006 ? » (« Donner S006 à Emma ? » jusqu'à la passe de cohérence), « Répartir et imprimer », « Annuler » ; rien n'est donné avant. Quand il n'y a rien à imprimer, une phrase dit pourquoi, le décompte dit « Aucune feuille » et le bouton, éteint, « Imprimer ». Une icône d'information remplace la phrase « imprimer ne crée ni remise ni accès ». |
| Feuille de rédaction | En tête, le projet, le chapitre et le prénom, imprimé par élève, à écrire par chapitre ; puis « Sur ton cahier, recopie le repère de la scène (S015), puis écris ton texte » (« Note le numéro de la scène » jusqu'à la passe de cohérence : « numéro » reste le numéro imprimé). Chaque scène : sa référence, son titre, sa consigne, une vignette, « Déjà écrit », « À reprendre », le choix de fin. Pied : « Fiche de rédaction · à recopier dans l'application ». |

**Limites :** les données restent celles du 29 septembre ; la veille de la
première séance est une variante (`?veille=1`), reportée sur la page des
fiches, et juin n'existe que par les scènes à finir venues du Livre, dans
l'état que le livre leur compte. Les scènes sans contenu rédigé portent un
texte d'exemple et, si leur travail a été remis, une remise : une scène « À
valider » ne s'ouvre plus sur un texte vide. Le mode personnel n'a pas de
Suivi dans la maquette, écart avec F06.5 à trancher. La page de scène empilait
trois retours ; elle n'en garde qu'un depuis sa reprise. La page des fiches n'est pas reprise en
390 px. L'arrivée directe dans le dernier projet n'est pas simulée : la
maquette s'ouvre où l'adresse le dit ; l'aide du Suivi s'y affiche à chaque
chargement de `#/suivi` sans drapeau, `?vu=1` la tenant pour déjà vue et
`?aide=1` la rouvrant.

**Relevé par la troisième critique et laissé en l'état :** le tampon d'une
ligne, que rien ne distingue d'un tampon-filtre ; le titre de scène,
cliquable sans le montrer au repos ; « Toutes », qui sort de l'écran quand
la rangée a défilé en 390 px ; les initiales des en-têtes de chapitre, sans
prénom ; l'icône isolée de la vue Élèves, et celle de « Qui s'en occupe »,
absente en 390 px ; les colonnes de la vue Élèves, dont la largeur change
avec le contenu ; « Tout son chapitre » en titre de colonne, lu « il a tout
fait » ; « En cours : l'élève écrit », dans la légende, pour des scènes que
l'adulte écrit lui-même ; « fiche » et « feuille » employés côte à côte ; la
feuille par chapitre, qui ne dit toujours pas combien d'exemplaires tirer.

**Relevé par la deuxième critique et laissé en l'état :** les gommettes à
deux lettres, où « Ma » désigne Maëlys et Malo (règle à trouver pour deux
élèves aux mêmes initiales) ; les couleurs de chapitre, proches de celles
des états sur cet écran dense ; « Validé » vert et coché, que la légende dit
pourtant « à vous » ; la liste des scènes à finir, qu'on n'atteint que par
le Livre ; le nom du projet dans la barre, lu comme « où je suis » plutôt
que comme un retour au travail. Suite : un essai par une personne qui découvre
l'outil.

### Page de scène reprise après critique (4 octobre 2026)

**Mesure :** 23/40 pour la lecture informée (3, 2, 2, 2, 2, 3, 2, 3, 2, 2)
et 23/40 pour une lecture indépendante de 72 captures de travail (3, 2, 2,
2, 2, 3, 3, 2, 2, 2) ; les deux lectures ne diffèrent que d'un point, en
sens inverse, sur l'efficacité et la sobriété. Le Livre partait de 25 et 21,
le Suivi de 22 et 22. Ces notes mesurent l'écran d'avant la reprise, qui
n'a pas été mesurée de nouveau. Ce qui marchait : la fiche « Votre
relecture » d'une scène à valider ; la boucle Suivi, scène, Suivi, jusqu'au
téléphone ; la fiche de retour ; les scènes voisines. Ce qui gênait : le
menu « Plus », rogné par l'en-tête et absent hors du Livre ; « Déclarer
prête » à trois endroits selon l'entrée, sous deux libellés, et à la place
de « Valider » ; aucun retour sur une validation, une reprise demandée ou
« prête » ; une scène écrite par l'adulte traitée comme une remise
attendue ; l'échec et le conflit de sauvegarde dits dans le seul pied de la
copie, tutoiement compris, la validation passant quand même ; « Texte
courant » et « Remise », compris seulement par la phrase du pied ; trois
retours empilés ; en 390 px, la décision avant le texte à lire ; deux noms
par état.

**Décisions du porteur, en F07.1, F07.3, F11.1 et F06.3 :** l'enseignant
met la scène dans l'état qu'il veut, sur son tampon, « À valider » compris
sans remise ; « Validé » et « Prête » sont les seuls noms des deux jalons ;
« Prête » se retire ; la remarque de reprise est facultative ; une scène
sans élève a trois états ; l'enseignant peut s'attribuer une scène, qu'un
élève ne peut alors ni écrire ni reprendre ; la même commande d'état sert à
côté de l'aperçu ; pour les incidents, un message et un état qui attend
l'enregistrement, la récupération d'un conflit restant alors à traiter par
entretien (elle l'est le 7 octobre, en F08.1). Après la reprise, il confirme six choix : le second clic ignoré
dans la demi-seconde ; le rappel avant « prête » dans la fiche ; une scène
déjà remise que l'enseignant s'attribue garde son état ; le mode personnel
garde deux états ; la scène de l'enseignant reste hors de la répartition
des fiches ; le chapitre et le graphe prennent les mêmes noms d'état que le
Suivi. Il demande ensuite l'icône habituelle à la place de « Plus », accepte
la scène suivante à valider (F06.5) et « Texte vide » partout où l'état se
lit. Le reste du tableau est proposé.

| Élément | Disposition |
| --- | --- |
| Retour | Un seul. Le fil d'Ariane, sans flèche, dit où l'on est ; la pastille de l'en-tête ramène d'où l'on vient : « Retour au Suivi », « Retour aux scènes à finir », « Retour au Livre », « Retour à la lecture d'essai », sinon le nom du chapitre. Rien ne s'ajoute au-dessus de l'en-tête. |
| Tampon d'état | Dans l'en-tête, plus grand, avec un chevron qui le distingue des tampons qui ne se cliquent pas. Il ouvre « État de la scène » : chaque état, dans l'ordre du travail, avec une ligne qui dit ce qu'il change (« Les élèves peuvent écrire. », « Les élèves reprennent, avec votre remarque. », « À vous de relire. Les élèves ne peuvent plus écrire. », « L'élève a fini. À vous de finir la scène. », « Elle entre dans le livre telle quelle. ») ; l'état courant est coché. Trois états pour une scène sans élève, deux en mode personnel. |
| Texte vide | Une scène « En cours » sans texte porte le tampon neutre « Texte vide », dans l'en-tête comme au Suivi, au chapitre et au graphe. Dans la liste des états, « En cours » reste coché, avec « Le texte est encore vide. » |
| Qui s'en occupe | À côté du tampon, la gommette et « Bilal s'en occupe », seule tournure quel que soit l'état ; « Pas encore prise » dans un chapitre attribué, « Aucun élève » sinon, sans rond vide. Un chevron ouvre la liste : les élèves du chapitre, « Moi », puis le mot que la scène portera, « Pas encore prise » ou « Aucun élève » (« Personne » jusqu'au 6 octobre), et la phrase « “Moi” : les élèves lisent la scène, sans y écrire. » La scène de l'enseignante porte « Vous vous en occupez » ; l'élève y lit « Mme Laurent s'occupe de cette scène. Tu peux la lire. » |
| Menu de la scène | Un bouton à trois points, l'icône habituelle, à la demande du porteur, à la place du mot « Plus ». Présent d'où qu'on vienne, plus rogné : « Exclure du livre », puis « Réintégrer dans le livre ». Une scène exclue porte le tampon gris « Hors du livre » avant son état. |
| Fiche de décision | Elle ne porte que l'étape suivante. « Votre relecture », à l'œil, pour une scène à valider : qui a remis et quand, « Valider le travail élève », « Demander une reprise… », et « Validé : l'élève a fini. Il vous restera à finir la scène pour le livre. » « Pour le livre », au livre, dès que la scène est validée, prête ou sans élève : une phrase et « Prête pour le livre ». Les autres états n'ont qu'une phrase. Plus de coche dans le titre, plus de « Demander une nouvelle reprise » : c'est le choix de « À reprendre ». |
| Après une décision | Le message dit le nouvel état et où en changer : « S016 est validée. Pour changer d'état : le tampon, en haut. » « Prête pour le livre » prend la place de « Valider » ; un second clic dans la demi-seconde est ignoré, pour qu'un double-clic ne valide pas puis ne déclare pas prête. |
| Scène suivante | Juste après une validation ou une demande de reprise sur une scène à valider, la fiche ajoute « Suivante à valider : S016 », bouton secondaire sous l'étape suivante ; la pastille « Retour au Suivi » reste. Quand il n'en reste plus : « Plus de scène à valider dans cette liste. » |
| Remarque de reprise | Dans la fiche, « Remarque pour Bilal », « facultative · lisible par les élèves du chapitre », « Demander la reprise », « Annuler ». Sans remarque, la fiche de retour dit « Reprise demandée, sans remarque écrite. » |
| Rappel avant « prête » | Dans la fiche, à la place du bouton : « Le texte est vide. Cette scène n'a ni choix ni fin. La déclarer prête quand même ? », « Déclarer prête », « Pas maintenant ». Confirmé par le porteur (F11.1). |
| Onglets de la copie | « Texte de la scène » et « Remis le 29 septembre », suivis d'une icône d'information : « Vous corrigez le texte de la scène. Ce que l'élève a remis reste conservé tel quel, dans son onglet. » La phrase permanente du pied est retirée. Dans l'onglet d'une remise, la fiche ne décide plus : « Vous lisez le texte remis le 29 septembre », et un bouton ramène au texte de la scène. |
| Remises | La fiche « Remises », sans « et suivi », n'apparaît que s'il y en a. |
| Incidents | Au-dessus de la copie, à la place de la validation suspendue : « Vos dernières corrections ne sont pas encore enregistrées. Nouvel essai dans 10 s : gardez cette page ouverte. », avec « Réessayer maintenant » ; pendant cet échec, la fiche dit « L'état se choisira ensuite » et le tampon refuse le changement. Le message du conflit, qui disait à tort que « le texte de la scène n'a pas changé » et laissait l'adulte sans issue, est réécrit le 7 octobre : ses corrections sont dans un onglet et l'état reste libre, voir [Conflit de sauvegarde : écrans de F08.1](#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026). Suspension : « Validation suspendue : le texte a changé. […] Relisez-le avant de choisir l'état. » |
| Scène à côté de l'aperçu | Le tampon à menu remplace le tampon et le bouton « Déclarer prête » ; le menu à trois points et « Fermer » restent. Écran validé le 3 octobre, retouché avec l'accord du porteur. |
| 390 px | La copie passe avant les fiches : on lit, puis on décide. Les trois menus s'ouvrent sur toute la largeur de l'en-tête. Onglets et « Ouvrir » de 40 px de haut ; le message ponctuel s'affiche en haut et ne recouvre plus les boutons. |
| Mots | « Appliquer », « Retoucher », « Rejeter » pour la proposition de consigne comme pour la correction ; vouvoiement dans les messages de l'adulte ; les scènes voisines que l'on peut choisir sont à la couleur des liens. |

**Vérifications :** gestes rejoués en 1 440 et 390 px — valider depuis le
Suivi et revenir, double-clic sur « Valider », retirer « Prête », annuler
une validation, finir une scène à reprendre, état refusé pendant un échec,
validation suspendue, exclure et réintégrer, déclarer prête depuis les
scènes à finir et revenir, scène de l'enseignante vue par une élève, état
et reprise à côté de l'aperçu ; aucune erreur de console, aucun débordement
horizontal. Adresses à drapeaux : `?menu=etat`, `?menu=qui`, `?menu=1`,
`?pose=valide`, `?qui=prof`, `?rappel=1`, `?reprise=1`, `?texte=r1`.

**Limites :** la récupération d'un conflit, décidée le 7 octobre 2026 en
[F08.1](specifications.md#f081--écritures-concurrentes), a ses écrans
depuis le même jour, décrits dans
[Conflit de sauvegarde : écrans de F08.1](#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026) ; l'adulte ne voit rien des horaires des élèves ; le rappel avant « prête » ne suit pas ce qu'on vient de taper dans
la copie ; la scène de
l'enseignante n'a pas de filtre au Suivi ; les captures des autres états de
la page de scène ne sont pas refaites.

**Relevé par la critique et laissé en l'état :** les deux numéros d'une phrase de choix
(« rends-toi au 21 » vers S018), qui relèvent de F05.2 ; les huit commandes
d'écriture, présentes pendant la relecture puisque la page est unique ; les
scènes voisines, plus hautes que le texte d'une scène courte ; pas d'écran
d'aide sur cette page ; les signes de la marge, sans légende ; l'en-tête à
la couleur du chapitre, lu comme une alerte quand elle est rouge ; l'icône
d'information des onglets, seule sur sa ligne en 390 px. Suite : un essai
par une personne qui découvre l'outil, sans seconde critique.

### Côté élève repris après critique (5 octobre 2026)

**Mesure :** 22/40 pour la lecture informée (2, 2, 2, 2, 3, 3, 2, 2, 2, 2)
et 21/40 pour une lecture indépendante de 74 captures de travail (3, 2, 2,
2, 2, 3, 2, 2, 2, 1). Les écarts : l'état visible, noté plus bas par la
lecture qui avait mesuré le pied de la copie hors de l'écran ; la
prévention, créditée des protections connues par les règles ; l'aide, que
le lecteur indépendant juge absente. Ces notes mesurent l'écran d'avant la
reprise, qui n'a pas été mesurée de nouveau. Ce qui marchait : « Mon
travail », une phrase et un bouton par scène ; la remise et son retrait ;
le retour de l'enseignante à la place de la consigne ; la note de prise en
charge ; l'écran de fermeture ; le tutoiement. Ce qui gênait : en
1 366 × 768, « Enregistré » et « Remettre » sous l'écran (entre 921 et
992 px), et encore en 1 440 × 900 ; un échec d'enregistrement invisible et
un conflit sans rien à faire, l'élève continuant de taper ; le bouton plein
qui prend la scène d'un camarade, sans retour ; « reprendre » pour corriger
son texte et pour prendre une scène, « remise » pour le geste et pour le
texte, « À valider », « En relecture » et « attend la relecture » pour un
seul état ; « Ton texte » sur la scène d'un autre ; « En cours » sur « Mon
travail » et « Texte vide » ailleurs ; « Quitter la classe » sans
confirmation ; la grille des prénoms qui passe de sept à quatre colonnes ;
« Demander un changement » qui part au premier clic.

**Décisions du porteur, en F05.2, F06.3, F07.1, F07.2 et F08.1 :** l'élève
retire son propre signalement tant que la scène s'écrit, et une reprise
s'annule ; toute demande de l'élève, modification après validation, ajout
ou suppression d'une scène, se fait à l'oral ; un conflit arrête
l'écriture, un simple échec la laisse continuer ; l'élève ne lit que le
lieu, sans la référence, à côté d'une phrase de choix ; un texte vide ne se
remet pas. Il accepte les mots
recommandés ; « donner » plutôt que « remettre » est une idée qu'il
avance, non décidée. Il propose le retour de l'enseignante mis en avant à
la première ouverture (F07.3), ici à l'essai. Le reste du tableau est
proposé, sans retour de sa part.

| Élément | Disposition |
| --- | --- |
| Pied de la copie | Collé au bas de l'écran pendant qu'on écrit, sur ordinateur comme sur téléphone, où il ne tenait pas. Il porte, à gauche, l'état de l'enregistrement en 16 px, à droite « Remettre à Mme Laurent ». Pendant l'attente, « Enregistrement de ta dernière phrase… » prend la place de l'heure et le bouton est inactif : une seule indication à la fois. |
| Échec d'enregistrement | Dans le pied, qui passe au rouge pâle, là où l'élève regarde et sans rien déplacer : « Ton texte n'est pas encore enregistré. Tu peux continuer, mais ne ferme pas cette page. » Après une remise qui échoue : « Ton texte n'est pas remis : il n'est pas encore enregistré. Ne ferme pas cette page et appelle Mme Laurent. » |
| Conflit | La copie passe en lecture, le bouton de remise disparaît, le pied dit : « Quelqu'un d'autre a écrit dans cette scène en même temps que toi. Ton texte est gardé. Arrête d'écrire et appelle Mme Laurent. » Aucune promesse sur la récupération. Ce que l'élève lit ensuite — scène qui ne s'écrit plus, retour avant le geste de l'enseignante, « Mon travail » — est dessiné le 7 octobre : voir [Conflit de sauvegarde : écrans de F08.1](#conflit-de-sauvegarde--écrans-de-f081-7-octobre-2026). |
| Horaires | Fin proche : le bandeau ne promet l'enregistrement automatique que s'il n'y a pas d'échec, et « Mon travail » dit aussi « dans 5 minutes ». Fermé : « Mon travail » dit quand le travail rouvre et ne liste plus les scènes ; le chapitre y ramène. Fermé avec un texte non enregistré : le titre devient « Ton texte n'est pas enregistré », l'alerte « Ne ferme pas cette page et appelle Mme Laurent. », et le bouton qui faisait partir est retiré. |
| Mots | « Remettre à Mme Laurent » reste un verbe ; le nom « remise » n'est plus montré à l'élève : « Modifier encore mon texte », « Voir mon texte du lundi 28 septembre », « C'est Bilal qui l'a remis ». « Reprendre » ne désigne que la correction après un retour ; prendre une scène se dit « M'occuper de cette scène », « Je m'en occupe », comme « Tu t'en occupes ». Les phrases d'état suivent le tampon : « Mme Laurent relit ce texte. », « Validé par Mme Laurent », sans « En relecture » ni « En cours d'écriture ». |
| Mention de lecture | « Lecture seule » est remplacé par la raison : « Tu ne peux plus écrire : Mme Laurent relit », « Tu ne peux plus écrire : c'est validé », « Tu peux lire, pas écrire » sur la scène d'un autre. |
| Scène d'un autre | Elle s'intitule « Le texte de Bilal » et « La consigne ». La note dit : « Bilal s'occupe de cette scène. Tu peux la lire. Pour écrire dedans, parle-lui d'abord, ou à Mme Laurent. » Un seul bouton, discret : « M'occuper de cette scène » ; « Continuer en lecture », qui ne faisait rien, est retiré. |
| Scène prise ou rendue | Une note reste sur place, sans bulle qui disparaît : « Tu t'occupes maintenant de cette scène, à la place de Bilal. », « Annuler ». « Tu t'en occupes », dans l'en-tête, ouvre « Je ne m'en occupe plus » et « Ton texte reste dans la scène. », en « En cours » et « À reprendre » seulement (F06.3). |
| Texte remis par un camarade | Le pied dit « Mme Laurent relit ce texte. C'est Bilal qui l'a remis. » avant « Modifier encore ce texte ». |
| Texte vide | « Remettre » est inactif et le pied dit « Écris d'abord ton texte. » à la place de l'heure d'enregistrement ; dès la première phrase, le bouton s'active et le tampon passe de « Texte vide » à « En cours » (F07.1). |
| Phrase de choix | Son repère donne le lieu seul, « → Clairière », sans « S018 » : l'élève ne lit plus qu'un numéro, celui du livre (F05.2). L'adulte garde la référence. |
| Texte validé | « Validé par Mme Laurent », « prêt pour le livre » si la scène est prête, et « Pour changer quelque chose, demande à Mme Laurent. » à la place du bouton (F07.2). |
| Retour à la première ouverture | À l'essai, idée du porteur. L'élève qui s'occupe d'une scène « À reprendre » ne voit d'abord qu'une fiche : « Mme Laurent te demande de reprendre ton texte », la phrase citée, la remarque en grand, et « J'ai lu, j'écris ». Le retour prend ensuite sa place à côté du texte, où le curseur est posé. Sans remarque écrite : « Elle n'a pas écrit de remarque. Si tu ne sais pas quoi changer, demande-lui. » La fiche ne revient pas ; un camarade qui lit la scène ne la voit pas. |
| Retour après une nouvelle remise | Il reste lisible, replié sous la consigne, au lieu de disparaître (F07.3). |
| Scène sans consigne | Une phrase à la place de trois : « Pas de consigne écrite. Suis celle que Mme Laurent t'a donnée. » |
| Mon travail | Scènes rangées par urgence : à reprendre, en cours, texte vide, remises, validées. Une seule porte le bouton plein, la première qui attend l'élève. « Texte vide » y remplace « En cours », comme ailleurs. Le chapitre affiché est celui de l'élève. Sans chapitre, proposition pour une question laissée ouverte en F06.1 : « Tu n'as pas encore de chapitre dans cette histoire. Mme Laurent va t'en donner un. » |
| Connexion | Prénoms dans l'ordre alphabétique. La place du code est réservée à droite, avec « Clique sur ton prénom. » : la grille ne bouge plus quand le code s'affiche. Code refusé : « Ce n'est pas le bon code. Essaie encore, ou demande à Mme Laurent. » « Quitter la classe » ouvre « Quitter la classe ? Pour revenir, il faudra le mot de passe de la classe. », « Quitter », « Rester ». |
| Blocs protégés | La légende ne dit « tu écris avant ou après » que si l'élève peut écrire ; le bloc montre un cadre quand on le touche. Légendes, repères de destination et mention de lecture passent de 12,5 à 14 px. |
| Chapitre vu par l'élève | Trois retouches de mots seulement : le fil dit « Mon travail », la sélection dit « Je m'en occupe » et « Parle-leur d'abord, ou à Mme Laurent. » |

**Vérifications :** gestes rejoués en 1 366 × 768 et 390 px — entrer, code
refusé, quitter la classe, écrire, remettre, modifier encore, échec puis
remise en échec, conflit, retour lu puis remise, scène d'un camarade prise
puis annulée, ne plus s'en occuper puis annuler, fermé avec et sans échec ;
en 1 366 × 768, le pied et le bouton de remise sont à l'écran sans défiler
(bouton entre 710 et 756 px) ; aucune erreur de console, aucun débordement
horizontal ; scène au texte vide : bouton inactif, actif dès la première
phrase, de nouveau inactif si on l'efface ; la page de scène de l'adulte
est inchangée, référence du repère comprise. Adresses à
drapeaux : `?retour=vu` sur une scène à reprendre, et sur `#/profils` :
`?profil=alice`, `?code=faux`, `?quitter=1`.

**Limites :** la mise en forme reste inerte dans la maquette ; le code se
saisit toujours d'un clic ; aucun seuil d'essais pour un code refusé ; le
texte tapé pendant un échec n'est pas simulé au-delà du message ; hors des
horaires, les cartes de « Toute l'histoire » restent affichées ; la reprise
n'a pas été mesurée par une seconde critique.

**Relevé par la critique et laissé en l'état, avec une recommandation :**
les références « S015 », dans l'en-tête, le fil et les scènes voisines ; le
premier texte visible, qui est
l'extrait « Juste avant » et non celui de l'élève, puisque F04.3 le place
avant et le coche par défaut ; l'écriture possible après une phrase de
choix, sans signe ; les corrections de l'enseignante, que rien ne repère dans le texte (F07.3) ;
« Toute l'histoire », deux écrans de cartes que l'élève n'ouvre pas : la
replier ; le graphe et ses mots (« bifurcation », « convergence »), les
cases à cocher sans nom et « facultatif » sur la page du chapitre, traités
par ailleurs ; deux élèves aux mêmes initiales (« Ma ») ; « Changer
d'élève » pendant un enregistrement (F06.4, différé) ; « Scènes voisines »,
libellé peu parlant pour un élève. Suite : montrer la maquette à deux ou
trois élèves, sans seconde critique ; c'est là que se décidera « remettre »
ou « donner ».

### Organisation du récit reprise après critique (6 octobre 2026)

**Mesure :** 23/40 pour la lecture informée (2, 3, 2, 2, 2, 3, 2, 3, 2, 2)
et 22/40 pour une lecture indépendante de 75 captures de travail (2, 2, 2,
2, 2, 3, 3, 3, 2, 1). Les écarts : le langage, où la lecture informée
crédite la métaphore du cahier quand l'autre bute sur « Graphe »,
« Bifurcation », « Convergence », « Raccord » et « Repères » ; la
souplesse, créditée des filtres et de la sélection par le lecteur
indépendant ; l'aide, qu'il juge presque absente. Ces notes mesurent
l'écran d'avant la reprise ; la seconde passe, 25/40, est plus bas. Ce qui
marchait : l'identité du chapitre, image, couleur et titre, tenue du plan
au graphe ; la carte de scène, comprise sans l'ouvrir ; le survol qui
éclaire les liens d'une scène ; le filtre et la sélection gardés au retour
d'une scène. Ce qui gênait : l'image et le titre de la carte de chapitre,
qui ne se cliquaient pas ; « Détails », détour vers « Ouvrir » ; la carte,
qui disait ce qui attend l'adulte et jamais combien de scènes sont finies ;
« En cours 3 » dans la fiche pour « 3 textes vides » sur la carte ; le
bandeau « reste à préparer », qui comptait et surlignait à la fois, dont la
pastille sortait de l'écran et qui comptait les consignes, facultatives ;
des filtres qui ne s'additionnaient pas et ne se combinaient pas, pour les
mêmes scènes qu'au Suivi ; des cases à cocher prises pour « scène faite » ;
un graphe borné au chapitre, que l'on quittait à chaque passage d'un
chapitre à l'autre et au retour d'une scène, deux drapeaux sans mot pour le
départ et la fin, une phrase de lecture fausse dès que le chapitre se
complique ; l'ambre pour cinq choses ; en 390 px, un écran entier avant la
première scène. Les ajouts, « Attribuer » et les réglages n'ouvraient
qu'une bulle : aucun de ces écrans n'était dessiné.

**Décisions du porteur, en F03.1, F03.2, F10.1 et F11.2 :** la carte ouvre
le chapitre, et « Détails » laisse place à un menu à trois points, le même
dans le bandeau du chapitre ; le chapitre est le plan, le Suivi le travail,
si bien que filtres et sélection quittent la page du chapitre ;
« Supprimer » et « Corbeille du projet » ; « Monter » et « Descendre » ;
départ et fin dans le menu de la scène ; le déplacement entre chapitres
différé ; « À compléter », phrase à liens sans filtre ni décompte des
consignes ; « Chemins » à la place de « Graphe » ; un écran d'aide à
l'ouverture ; « 10 ordinateurs » retiré de l'en-tête du projet. Il accepte
tous les mots et signes recommandés, repris dans le tableau. La forme des
écrans qui suit est proposée, sans retour de sa part.

| Élément | Disposition |
| --- | --- |
| Carte de chapitre | Toute la carte est un lien vers le chapitre, « Ouvrir » y reste écrit pour qui découvre. Sous le titre, sans « Chapitre 1 » ni « seul chapitre » : « 6 scènes · 1 validée · 1 prête », chaque jalon compté sous son nom, comme les tampons du chapitre, puis ce qui attend l'adulte (« 1 à valider · 1 à reprendre »), puis les gommettes et « 3 élèves », puis ce qui manque (« Aucune scène · aucun élève »), en gris avec son icône. Plus d'ambre hors du tampon « À valider ». |
| Menu du chapitre | Trois points, en haut à droite de l'image et dans le bandeau de la page : « Réglages », « Attribuer des élèves », « Exclure du livre » ou « Réintégrer dans le livre », « Supprimer ». Le seul chapitre d'une partie ne se supprime pas : le menu dit de supprimer la partie. |
| Menu de la partie | Trois points au bout de son titre : « Réglages » (titre, image) et « Supprimer ». Il remplace « + Chapitre », doublon de la carte en pointillé, qui reste seule. |
| Recherche des scènes | Un champ « Rechercher une scène » dans la bande du haut, avant « Aide ». Dès qu'on y écrit, les cartes laissent place aux scènes trouvées dans tout le livre, rangées sous leur chapitre, à sa couleur : référence, titre avec le passage trouvé en valeur, état, qui s'en occupe, « Ouvrir ». « 2 scènes pour « souche » », « Effacer la recherche » ; sans résultat, « Aucune scène trouvée pour « dragon » dans le livre. » À l'ordinateur la bande reste sur une rangée, la phrase « À compléter » passant à la ligne ; au téléphone le champ a sa rangée. |
| « À compléter » | Une ligne sous les totaux : « 1 chapitre sans scène · 2 chapitres sans élève · 2 élèves sans chapitre Voir ». Un manque cliqué place la page sur la première carte concernée, entourée de bleu canard un instant ; rien n'est filtré et aucun état ne reste. « Voir » ouvre la vue Élèves du Suivi. La ligne disparaît quand rien ne manque. |
| Aide | À la première ouverture de l'onglet, l'écran d'aide du Suivi et du Livre : ce qu'on fait ici ; partie, chapitre, scène ; qui peut écrire où ; Scènes ou Chemins. « Commencer », « Ne plus afficher », puis un bouton « Aide » à côté d'« Idées de parties ». Le mode personnel et le récit classique n'ont que les questions qui les concernent. |
| Réglages du chapitre | Panneau latéral, feuille basse sur téléphone : titre, corrigé en direct sur la carte ; « Image et couleur », avec la palette des huit couleurs ; résumé, qui quitte la page du chapitre. « Fermer » ferme (« Terminé », en bouton plein, jusqu'à la passe de cohérence). Un chapitre ou une partie ajoutés s'ouvrent sur ce panneau, titre sélectionné. |
| Attribuer des élèves | Même panneau, au nom du chapitre : « Un élève coché lit et écrit dans ce chapitre, tout de suite. » La classe en liste, les élèves du chapitre d'abord, puis ceux qui sont « sans chapitre », puis les autres avec leur chapitre. Sous un élève coché, la case « peut créer des scènes et des choix » dit le profil par ce qu'il permet ; l'étiquette « organisation » quitte le bandeau. |
| Supprimer | Un chapitre ou une scène sans texte partent sans question, avec « Annuler » dans le message. Sinon, un dialogue : « Supprimer « Le sanctuaire » ? », le nombre de scènes écrites et leurs auteurs, les choix qui y mènent et ne mèneront plus nulle part, et « Vous le retrouverez dans la corbeille du projet, avec ses textes. » Dans ce dialogue, dans celui du départ (« Changer le départ du livre ? ») et dans les messages, une scène se nomme par sa référence suivie de son titre : « S017 « Souche — la chouette messagère » ». |
| Corbeille du projet | Un lien discret au bas de « Parties et chapitres », avec le nombre d'éléments. Le panneau liste ce qui a été supprimé ; « Restaurer » le remet à sa place. Un choix vers une scène supprimée se lit « S017 supprimée » sur la carte et dans les chemins. |
| Chapitre hors du livre | « Exclure du livre » demande confirmation et dit que les élèves continuent d'écrire. La carte dit « hors du livre », ou « 3 hors du livre sur 4 » ; chaque scène porte le repère. |
| Page du chapitre | Fil « Parties et chapitres / La lisière », comme dans la scène. Bandeau : le nom de la partie et le nombre de scènes, les élèves, « Ajouter une scène », seul bouton plein, « Attribuer des élèves » et le menu. Une ligne d'outils : bascule, icône d'information sur l'ordre des cartes, recherche à la loupe, « Voir dans le Suivi » (« Voir au Suivi » jusqu'à la passe de cohérence). En 390 px, deux rangées, et la première scène commence à 0,61 écran, contre 0,78. |
| Carte de scène | Plus de case à cocher ; filet neutre sous l'en-tête. « Alice s'en occupe » ouvre le menu de la page de scène : les élèves du chapitre, « Moi », « Pas encore prise ». À droite, « Ouvrir » en mot, comme sur la carte de chapitre. Une liaison cachée se lit « Lien caché → Le sommet · S062 », avec une clé. Trois points : « Monter », « Descendre », « Départ du livre », « Fin de l'histoire », « Exclure du livre », « Supprimer ». « sans consigne » en gris, comme au Suivi. |
| Ajouter une scène | La scène apparaît à la fin du chapitre, entourée un instant : « S063 est ajoutée à la fin du chapitre. Ouvrez-la pour lui donner un titre. » |
| Chapitre vide | Le bandeau, puis « Ce chapitre n'a pas encore de scène. Ajoutez une première scène. » et son bouton, seul bouton plein. Ni bascule, ni recherche. |
| Recherche sans résultat | « Aucun titre de scène ne contient « dragon » dans ce chapitre. » et « Effacer la recherche ». |
| Chemins | Au-dessus d'une scène : « Départ du livre », « Fin de l'histoire », « 2 chemins se rejoignent ». « Bifurcation » et la phrase de lecture sont retirés. « Sans suite » à la place des choix d'une scène qui n'a ni choix, ni fin, ni lien caché. Une liaison cachée (F05.1) a sa ligne dans la scène, « Lien caché » avec une clé, et son trait, comme un choix : c'est une suite du récit. Légende de deux traits : « Choix dans le chapitre », « Choix vers un autre chapitre ». |
| D'un chapitre à l'autre | Le choix vers un autre chapitre montre le chapitre et la scène visée ; l'activer ouvre ce chapitre dans la vue Chemins, la scène d'arrivée entourée de bleu canard. Revenir d'une scène ouverte depuis les chemins y ramène. |
| Taille des chemins | Par défaut, une taille lisible : si le chapitre est large, on fait défiler. « Tout voir » le réduit à la largeur de l'écran ; « − » et « + ». |
| Chemins sur téléphone | La scène touchée garde un cadre sombre, la page ne bouge pas, et ses choix se lisent dans un encart collé au bas de l'écran, avec « Ouvrir la scène ». |
| Suivi | L'en-tête d'un chapitre reprend la ligne de la carte : « 6 scènes · 1 validée · 1 prête · 1 à valider · 1 à reprendre ». |
| Page de scène | Son menu à trois points reçoit « Départ du livre » et « Fin de l'histoire ». |

**Confirmé par le porteur le 6 octobre, après la reprise :** la suppression
sans confirmation d'un élément sans texte, la corbeille sans durée limite,
le chapitre que l'enseignant écrit seul hors des chapitres sans élève, la
carte « 3 hors du livre sur 4 », le seul chapitre d'une partie qui ne se
supprime pas, le menu de la partie, et « Ouvrir » gardé en mot sur une
carte entièrement cliquable. Il demande deux retouches, faites le même
jour : le bouton à trois points de la carte, jugé trop gros, devient un
petit signe de 24 px sur l'image, qui ne prend sa forme qu'au survol, avec
une zone de clic plus large ; toutes les cartes de chapitre ont la même
hauteur, l'étiquette réservant deux lignes de titre et « Ouvrir » restant
en bas (329 px en 1 440, 290 px en 390).

**Restent proposés, sans retour :** le départ manquant dit dans « À
compléter » ; « Restaurer » qui rend aussi les attributions ; l'aide qui
s'affiche de nouveau à chaque chargement de la maquette ; la forme des
panneaux et du dialogue.

**Seconde passe, le 6 octobre 2026 :** une lecture indépendante de 49
captures de travail donne 25/40 (3, 2, 3, 2, 3, 2, 2, 3, 2, 3), contre 22.
Montent l'état du système, le contrôle, la prévention des erreurs et
surtout l'aide (1 à 3) ; baissent la souplesse, qui perd les filtres sortis
de la page, et la reconnaissance, qui bute sur les références. Ce qui
marche : les dialogues de suppression, d'exclusion et de départ, avec
« Annuler » et la corbeille ; « À compléter » et l'attribution ; la scène
dans les chemins et leur version téléphone. Ce qui gênait, et qui est
repris le même jour à la demande du porteur :

- le menu à trois points du bandeau du chapitre, coupé par le bandeau (au
  téléphone, aucune commande ne s'atteignait) : réparé ;
- le bouton à trois points de la carte de chapitre, que le porteur trouve
  d'abord « pas assez visible » sans le vouloir gros : essayé au pied de
  la carte, cerné, en face d'« Ouvrir », il revient sur l'image à sa
  demande (« c'était mieux ») ;
- la recherche, bornée aux titres d'un seul chapitre : un champ cherche
  désormais les scènes de tout le livre depuis « Parties et chapitres »,
  recommandation acceptée, de préférence à une recherche des parties et des
  chapitres, que l'on voit tous à l'écran ;
- la carte de scène, qui ne disait pas qu'elle s'ouvre : « Ouvrir » en mot ;
- la référence seule dans les dialogues et les messages : le titre la suit ;
- la scène à liaison cachée, qui passait pour une impasse : « Lien caché »
  sur sa carte et dans les chemins, avec son trait ;
- deux mots, sur recommandation acceptée : « 1 validée · 1 prête » au lieu
  de « 2 validées », « Pas encore prise » au lieu de « Personne » dans le
  menu ;
- en passant : « 0 scène » sur une partie neuve, et le menu d'une scène
  au-dessus de « qui s'en occupe ».

**Signe du menu :** le porteur demande s'il existe un signe plus engageant
que les trois points. Trois points debout, roue dentée et curseurs de
réglage lui sont montrés ; la recommandation est de garder les trois
points, signe de la page de scène et du Livre, la roue dentée faisant
double emploi avec la commande « Réglages » du menu. Il n'en retient pas
d'autre : les trois points restent.

**Laissés pour l'essai, relevés par la seconde passe :** le bouton à trois
points de la carte, que le lecteur ne voyait pas sur l'image ; les traits qui se
confondent aux jonctions ; « Tout voir », sans effet quand le chapitre
tient déjà à l'écran ; au téléphone, la scène touchée dont les traits ne
s'éclairent pas ; le dialogue de suppression d'un chapitre, qui ne dit pas
que ses élèves se retrouvent sans chapitre ; deux élèves aux mêmes
initiales, dont les gommettes se confondent ; l'absence de légende des
états et d'aide dans la vue Chemins ; une scène que rien n'atteint, non
signalée. Le lecteur bute aussi sur des décisions acquises, non rouvertes :
les références comme nom d'une destination, et « le chapitre est le plan »,
qui lui fait chercher où valider.

**Laissés en l'état.** Le mode personnel garde ses filtres et ses cases à
cocher, faute de Suivi. L'élève garde sa fiche « Détails », ses filtres, ses
cases, le filet rose et la phrase sur l'ordre des cartes : son côté relève
de la reprise du 5 octobre. Les références « S015 », décision acquise,
restent le seul nom d'une destination sur la carte. Le graphe d'un chapitre
où mènent de nombreux chapitres, cas des scènes communes de F03.1, reste à
dessiner : ses arrivées ne sont pas regroupées. Le déplacement d'une scène
vers un autre chapitre et le glisser-déposer ne sont pas dessinés. Les
anciennes captures de ces pages (cartes à « Détails », bandeau « reste à
préparer », filtres, « Graphe ») ne sont pas refaites, ni celles du Suivi
et de la page de scène, qui gardent « 2 validées » et « Personne ».

**Limites de la maquette.** La recherche des scènes ne lit que les
références et les titres, alors que la règle couvre consignes et textes.
Ce qui est supprimé ou ajouté ici ne se répercute pas partout : le Suivi et le Livre listent encore une scène
supprimée. La classe `porte` du graphe, que la feuille de style du Livre
écrasait depuis le 3 octobre et qui coupait les noms de chapitre, est
renommée. Les états s'obtiennent par adresse, avec des drapeaux préfixés
d'un « p » pour ne pas heurter ceux des autres écrans ; ils sont décrits en
tête de `assets/recit.js` et listés dans l'index de la maquette.

**Captures :** 216 à 244, celles que les retouches de la seconde passe
touchent étant refaites (216, 218 à 227, 233, 234) — le plan et « À
compléter », l'aide, le menu, les réglages, l'attribution, la suppression, la corbeille, un chapitre hors du
livre ; la page du chapitre, « qui s'en occupe », le menu d'une scène, une
scène ajoutée, un chapitre vide ; les chemins avec une scène d'arrivée
désignée, le départ, une fin, une scène sans suite ; en 390 px, le plan, le
chapitre et les chemins avec une scène touchée ; 236 à 241, le menu du
bandeau, la suppression d'une scène, le changement de départ, un lien caché
dans les chemins et, en 390 px, le menu d'une carte et celui du bandeau ;
242 à 244, la recherche des scènes, sans résultat, et en 390 px.

**Suite :** la seconde passe est faite et la méthode a atteint son
plafond ; un essai par une personne qui découvre l'outil, sans troisième
lecture. À y observer d'abord : le bouton à trois points est-il trouvé.

### Passe de cohérence (6 octobre 2026)

**Pourquoi :** la cohérence restait à 2 sur 4 aux trois critiques du Suivi
et à celle de la page de scène. Ce n'est pas une critique d'écran : un
relevé de ce qui change d'un écran à l'autre, sur les 177 adresses du
sommaire en 1 440 px (mots, noms accessibles, icônes, couleurs, polices),
puis le parcours rejoué de « Mes projets » au lecteur, comme l'enseignant et
comme une élève, et une lecture indépendante de 396 mots sans rien d'autre.

**Constat :** les noms d'état, le tutoiement de l'élève et le vouvoiement de
l'adulte, les trois voix et le menu à trois points sont tenus partout. La
cohérence butait sur quatre choses : six façons de montrer une sélection,
dont une pilule en bleu canard qui imitait le bouton principal ; cinq façons
d'expliquer et quatre de confirmer ; les icônes des tampons reprises pour
autre chose ; une quinzaine de mots à deux sens (« retour », « reprendre »,
« relire », « annuler », « commencer », « feuille », « lien », « numéro »,
« aide », « imprimer », « signalement », « donner »).

**Décisions du porteur :** la règle des couleurs est réécrite plutôt que la
maquette repeinte (règle 2 du système « Cahiers d'aventure », plus haut) ;
« remarque » désigne le retour de l'enseignant des deux côtés, « retour »
restant le mot pour revenir en arrière ; l'alignement est fait avant l'essai
par une personne qui découvre l'outil. Il demande d'améliorer chaque point
relevé et de lui soumettre ceux qui laissent un doute.

**Formes à garder, pour les prochains écrans :**

| Geste | Forme |
| --- | --- |
| Revenir | Une pastille ou un lien à flèche, « Retour à… », ramène d'où l'on vient ; le fil d'Ariane dit où l'on est. La page de scène dit « Retour au Suivi », « Retour aux scènes à finir », « Retour au Livre », « Retour à la lecture d'essai », et pour l'élève venu de son accueil « Retour à Mon travail » ; sinon, le nom du chapitre. Fiches : « Retour au Suivi ». Lecteur de l'élève : « Retour aux lectures ». « Parties et chapitres » et « Mon travail » retrouvent leur position au retour d'un chapitre ou d'une scène. |
| Montrer la sélection | La vue choisie dans une bascule est une pilule graphite (Scènes/Chemins, Scènes/Élèves, Réglages/Aperçu, Imprimer/Partager, « par chapitre / par élève », « Dont Alice s'occupe / Tout son chapitre »). Une option cochée dans un réglage garde son contour canard. Le canard plein est au seul bouton principal. |
| Bouton principal | Un par écran. À « Mettre en page », la déclaration « La mise en page me convient » ; « Réordonner les passages » et « Voir l'aperçu » sont des boutons ordinaires, « Garder cet ordre » reste plein tant que le doute bloque la déclaration. Jamais sur ce qui supprime ou fait sortir : « Supprimer » est en brique, non plein ; « Rester » est plein. |
| Fermer un panneau | « Fermer », et la croix. |
| Expliquer | L'écran d'aide et son bouton « Aide » au point d'interrogation ; la bulle « i », nommée par une question (« Que veut dire « à finir » ? »). Dans le lecteur, « Règles » et « Règles du jeu » portent le point d'interrogation : ils ouvrent une page, pas une bulle. |
| Prévenir | Un message bref pour un fait passager ; une bande au-dessus de la copie, avec « Annuler », quand on peut défaire ; le pied de la copie (élève) ou une note (adulte) pour un incident. |
| Vider un filtre | « Tout afficher ». |

**Mots alignés :** « chemins » partout (« Voir les chemins du chapitre »,
« Libellé pour les chemins »), sans « graphe » ni « raccord » ; « à finir »
sur un passage du Livre, au lieu de « pas prête » ; « Revenir sur cette
déclaration » aux trois étapes ; « Créer le PDF définitif… » pour le bouton
comme pour le panneau qu'il ouvre ; « sans consigne : pas imprimée » ;
« Composer la feuille d'aventure » ; « demandes au lecteur » pour les
formules d'action ; « Voir dans le Suivi » ; message de demande des fiches
« Emma s'occupe de S006 ? », qui reprend le verbe de la prise en charge ;
feuille de rédaction « Sur ton cahier, recopie le repère de la scène
(S015), puis écris ton texte », « numéro » restant le numéro imprimé ;
lecteur « Continuer au passage n » sur la première page et « Revenir au
passage n » depuis les règles, « reprendre » restant la correction ;
« Remarque de Mme Laurent » et « Mme Laurent t'a laissé une remarque » ;
lecture d'essai de l'adulte ouverte sur « Par où commencer ? » ; « Entrée
des enseignants » ; aide du Suivi sans « vous » après « on ». La mention
« (proposition, F14) » quitte le panneau du PDF de travail.

**Corrigé en passant :** la classe `.champ` des panneaux du plan, qui
encadrait les filtres du Suivi et des fiches, les marges du Livre et la
liste de la lecture d'essai, devient `.pchamp` ; la note de la lecture
d'essai ne se coupe plus en trois colonnes.

**Cinq recommandations confirmées par le porteur le même jour :**

- le fil d'Ariane de la page du chapitre garde sa flèche : c'est le seul
  retour de cette page, et une pastille de plus chargerait le bandeau ;
- « Supprimer » dit ce qui efface et porte seul la corbeille (image de la
  scène, lien caché, section et compteur de la feuille d'aventure, objet et
  formule de la liste) ; « Retirer » dit ce qui se remet d'un geste (le
  partage, un filtre, une protection, un renvoi dans une phrase) ;
- l'élève lit « Écrire » sur une scène au texte vide ; « Commencer » reste
  le bouton de l'écran d'aide ;
- la colonne de la vue Élèves s'appelle « À régler » : elle ne porte que
  « Sans chapitre » et « Attribuer un chapitre », et « signalement » avait
  trois sens ;
- le « i » est réservé aux bulles et au niveau « à savoir » du Livre ; les
  phrases d'aide fixes perdent le leur.

**Signes repris le même jour, sans attendre l'essai, faute de personne
disponible :** à l'examen, réserver aux tampons leurs six icônes aurait
privé le crayon (écrire), la coche (c'est fait) et le livre de leur sens
ordinaire, que le tampon ne fait qu'emprunter. La règle retenue : une
icône, un sens. Trois collisions sont levées. Le demi-tour ne dit plus que
« À reprendre » et la demande de reprise : « Annuler » n'a plus d'icône,
« Valeurs de départ » prend la flèche en rond, « Modifier encore mon
texte » le crayon. Le sablier ne dit plus que « À valider » : « à finir »
et l'attente de l'écriture, au Livre, prennent l'horloge du « pas encore ».
« Vérifier les chemins » porte le signe de la vue « Chemins », et « Créer
le PDF définitif… » celui du PDF de travail, la flèche restant à
« Télécharger ». Onze phrases d'aide fixes perdent leur « i » (lecture
d'essai, Lectures, partage, préparation, réglages d'un choix, étape
fermée) ; il reste aux bulles, au niveau « à savoir » des contrôles du
Livre et aux bandeaux neutres. Au retour de la page de scène, la scène se
rouvre à côté de l'aperçu, sur son passage, à l'étape quittée (écran
validé le 3 octobre).

**Deux derniers points confirmés par le porteur :** le tampon « Texte
vide » prend le cercle en pointillé, à la place d'une feuille écrite, et
« Texte vide » remplace « pas encore écrite » dans les scènes voisines et
la liste de la lecture d'essai ; le « i » qui ouvre une bulle est en bleu
canard, comme ce qui se clique, le « i » gris ne se cliquant pas. Seule
exception : la bulle du bandeau d'état du partage, qui garde la couleur de
son bandeau.

**Laissés en l'état :** « Que fait-on maintenant ? » au Livre, cité en
F11.6 ; la tâche « Tester la lecture », nom de F11.6 ; « Imprimer », volet
de l'étape « Imprimer et partager » ; « À valider », lu par l'élève sur sa
propre scène, qui découle d'un seul nom par état ; « Annuler », qui renonce
dans un dialogue et défait dans une bande ; « Voir dans le Suivi » sans
retour vers le chapitre, le Suivi étant un onglet ; une scène écrite de
quatre façons selon la place (référence et titre, tiret, guillemets, lieu
seul) ; le filet ambre d'« À relire avant de partager ».

**Vérifications et limites :** les 177 adresses relues après la reprise,
sans erreur de console ni débordement en 1 440 px ; six vues contrôlées en
390 px ; retours rejoués (élève depuis « Mon travail », scène voisine
comprise ; lecture d'essai ; plan défilé puis chapitre). Le relevé n'a pas
porté sur le 390 px, et le mode personnel comme le récit classique ne sont
couverts que par les adresses du sommaire. Deux drapeaux pour les
captures : `?dutravail=1` et `?delessai=1` sur la page de scène.

**Captures :** 245 à 260 — sélection par élève du Suivi, message de demande
des fiches, « Mettre en page » avec un seul bouton plein, déclaration faite,
« Créer le PDF définitif… », suppression, réglages du chapitre, scène venue
de la lecture d'essai, lecture d'essai, fiches ; côté élève en 1 366 × 768,
la scène venue de « Mon travail », la remarque, « Mon travail » de Bilal, le
lecteur ; en 390 px, le Suivi et le Livre ; 261 à 263, la colonne « À
régler », « Écrire » sur « Mon travail » et « Supprimer l'image de la
scène »  ; 264 à 266, les signes alignés du Livre ; 267 à 270, le tampon « Texte
vide », les bulles en bleu canard, une scène voisine au texte vide, et le
Suivi en 390 px. Les captures antérieures de ces écrans ne sont pas refaites.

### Mes classes et Nouveau projet (6 octobre 2026)

**Pourquoi :** « Mes classes » ne menait nulle part et « Nouveau projet »
était factice, alors qu'une personne qui découvre l'outil commence par là.
Les règles décidées en entretien sont en
[F01](specifications.md#f01--projet-et-responsabilité-de-ladulte),
[F01.1](specifications.md#f011--classes-années-et-éventuel-espace-école) et
[F06.4](specifications.md#f064--classe-de-référence-et-postes-partagés) ; ce
qui suit décrit des dispositions proposées, sans retour du porteur.

**Ce qui vient du système :** la gommette reste l'élève. Une classe se
reconnaît à ses gommettes, une classe sans élève à des places vides en
pointillé ; la liste des élèves est une feuille lignée, les réglages de la
classe sont des fiches à filet neutre, à droite, comme les fiches de contexte
de la page de scène. Les choix de « Nouveau projet » sont dessinés avec les
objets de la maquette : des gommettes pour la classe, des fiches reliées pour
le récit à choix, des fiches en ligne pour le récit classique. Le prénom en
cursive est réservé à ce que lit l'élève, ici son étiquette.

| Écran | Disposition proposée |
| --- | --- |
| Mes classes | Écran d'aide à l'ouverture, comme au Suivi (ce qu'on fait ici, comment un élève se connecte, code oublié, année suivante), rouvert par « Aide » depuis la liste comme depuis une classe. Une carte par classe en cours : nom, année, nombre d'élèves, projets, horaires, « Ouvrir » ; les années passées en lignes, dessous. Sans classe : « Pas encore de classe », qui dit que l'histoire se prépare sans elle, et « Créer ma classe ». |
| Nouvelle classe | Panneau : nom, année scolaire proposée, « Créer la classe ». On arrive dans la classe, sans élève, avec ses informations déjà proposées. Si une classe d'une année antérieure est encore en cours, un bandeau ambre propose « Terminer son année », ou « Plus tard ». |
| Une classe | Les élèves par ordre de prénom, sur deux colonnes : gommette, prénom, nom, code masqué, chevron. « Afficher les codes » les montre tous ; un clic sur un élève ouvre sa fiche sans montrer ceux des autres. À droite : « Pour ouvrir la classe sur un ordinateur » (adresse, identifiant, mot de passe masqué, « Imprimer l'affiche », « Changer le mot de passe »), « Horaires », « Projets de la classe », puis « L'année est finie ? Terminer l'année ». Menu à trois points : renommer, et supprimer une classe sans élève ni projet. |
| Fiche d'un élève | Panneau : son code en grand, « Changer le code » (un code proposé, que l'on peut retaper), « Imprimer son étiquette », prénom et nom, « Retirer de la classe » en brique, non plein. « Enregistré » s'affiche après un changement. C'est l'écran du code oublié. |
| Retirer un élève | Dialogue de trois faits : il ne se connecte plus et quitte son chapitre ; ses textes restent, la scène non finie redevient « Pas encore prise » ; on peut le réinscrire avec le même code. Un élève qui n'a rien écrit part d'un geste, avec « Annuler ». |
| Horaires | Panneau : interrupteur « Limiter les horaires », jours en pastilles, « De … à … », « Ajouter d'autres horaires ». Sans réglage, la classe dit « Pas de limite d'horaire ». |
| Fin d'année | Dialogue de trois faits, « Terminer l'année » en bouton plein, le geste se défaisant. Une classe passée s'ouvre en lecture, sous un bandeau vert « Année terminée le… » et « Rouvrir la classe ». |
| Inscrire des élèves | Trois étapes en ligne : « Élèves déjà connus » (cases à cocher par ancienne classe, « Tout cocher »), « Nouveaux élèves » (une feuille lignée, un élève par ligne), « Vérifier ». Le récapitulatif met en tête, sur fond ambre, ce qui est « À régler avant d'inscrire » : un nom déjà connu (« Oui, le même » ou « Non, un autre élève »), deux fois le même prénom (le nom ou son initiale). Le bouton « Inscrire 25 élèves » reste éteint tant qu'il reste un point, et un lien y ramène. Une première classe n'a que deux étapes. |
| Imprimer | Bascule « Étiquettes des élèves » / « Affiche de la classe ». Étiquettes : toute la classe ou un élève, option « Avec l'identifiant et le mot de passe de la classe », décompte « 25 étiquettes sur 1 feuille », aperçu A4 à découper (27 par feuille, 14 avec l'option). Affiche : quatre pas numérotés, écrits pour l'élève. Les chiffres imprimés ont un zéro sans barre. |
| Nouveau projet | Colonne centrée, la même ligne d'étapes. Deux grandes options par question, l'option choisie au contour canard avec sa coche ; sous les options, ce qui ne se change pas. À la troisième : le titre, la classe en cours ou « Choisir plus tard », puis « Projet de classe » et « Récit à choix » rappelés comme définitifs, « le titre et la classe, si ». |
| Mes projets, sans projet | Un cahier sans titre, « Votre premier livre commence ici », « Créer mon premier projet », et une phrase : la classe s'inscrira plus tard. La barre du haut ne porte alors aucun nom de projet. |
| Projet sans classe | « Sans classe · Choisir une classe » sous le titre du projet et sur sa carte ; le panneau « Classe du projet » rappelle que choisir la classe ne donne aucun accès. « Attribuer des élèves », avant ce choix, y renvoie au lieu de lister des élèves. |

**Critique d'ergonomie du même jour :** 28/40 pour la lecture informée,
26/40 pour une lecture indépendante des 44 captures, sans autre contexte.
Les deux butaient sur les mêmes points, corrigés aussitôt : rien ne disait
qu'une ligne d'élève s'ouvre (chevron) ; la connexion en deux temps ne se
comprenait qu'à l'affiche (phrase sous le titre de la fiche) ; « Terminer
l'année » était caché dans le menu (lien sur la page) ; le bouton
d'inscription éteint ne disait pas pourquoi (« 2 points à régler », en
lien) ; les panneaux se fermaient sans dire que c'était gardé
(« Enregistré ») ; le nouveau code était plus petit que l'ancien ; le
dialogue de retrait avait cinq faits, il en a trois ; « ouvert » servait à
l'accès de classe et aux horaires (« Pas de limite d'horaire ») ;
« Identifiant » devenait « Classe » sur l'étiquette ; l'exemple de nom
reprenait un élève de la liste ; « Ces deux choix », sous les classes,
semblait les viser ; le titre de l'écran d'aide était doublé ; en 390 px,
les fiches de la classe passaient sous vingt-cinq lignes sans raccourci
(« Aller à : Connexion, Horaires, Projets ») et le crayon voisinait de trop
près avec la croix. La reprise n'est pas mesurée de nouveau.

**Décision du porteur, le 7 octobre 2026 — un zéro sans barre pour
l'élève :** la police de l'outil barre le zéro. Les chiffres que l'élève lit
ou tape s'écrivent en Andika, dont le zéro est simple : son étiquette,
l'affiche de la classe et, depuis ce jour, les cases de son code à la
connexion. Les écrans de l'adulte gardent la police de l'outil. Le même
jour, il confirme les règles que ces écrans proposaient (scènes d'un élève
retiré, classe passée en lecture, classe d'un projet, titre demandé, codes
masqués, forme des horaires) : elles sont en F01, F01.1 et F06.4.

**Laissés en l'état :** « Ouvrir », bouton des cartes, à côté d'« ouvrir la classe » ;
« Créer ma classe » la première fois, « Nouvelle classe » ensuite, comme
pour les projets ; l'absence d'aide sur « Mes projets » et dans la création,
guidée pas à pas ; l'aperçu des étiquettes, peu lisible en 390 px ; les noms
des étapes faites, réduits à leur coche en 390 px.

**Limites de la maquette :** une inscription, un retrait ou un prénom
corrigé ne se répercutent pas dans le projet (Suivi, attribution, connexion
de l'élève) ; le projet créé s'ouvre sur la Préparation de l'exemple, déjà
remplie ; un projet sans classe montre encore les élèves de ses chapitres ;
« Renommer la classe » n'est qu'un message ; l'effet d'un mot de passe
changé sur un poste déjà ouvert n'est pas montré (règle décidée le 8 octobre
2026, F06-AC77) ; l'identifiant et le mot de passe d'exemple, « cm-laurent »
et « lanterne-renard-47 », gardent des traits d'union que la forme décidée
le 8 octobre n'a pas (F06-AC81 : « cm1cm2 », « tigre nuage 42 »).

**Vérifications :** pages contrôlées en 1 440 et 390 px, sans erreur de
console ; parcours rejoué de « Mes projets » vide à la classe inscrite
(créer le projet, créer la classe, inscrire, ouvrir un élève, le retirer,
annuler). Le détecteur d'Impeccable ne relève rien dans les deux fichiers
neufs.

**Fichiers et drapeaux :** `assets/classes.js` et `assets/classes.css`,
classes CSS préfixées `.cl-` et `.np-`, drapeaux d'adresse préfixés `cl` et
`np`, décrits en tête de `classes.js`. Dans les fichiers existants, seuls
des raccords d'une ligne : la barre du haut et le panneau d'attribution
(`recit.js`), l'en-tête de projet et « Mes projets » (`ecrans.js`).

**Captures :** 271 à 314 — 271 à 304 en 1 440 px (aide, liste, aucune
classe, nouvelle classe, première classe, classe, codes affichés, code
oublié, code changé, retrait, horaires, mot de passe, fin d'année, année
passée, rentrée, inscription en cinq vues, étiquettes en trois vues,
affiche, « Mes projets » vide, création en cinq vues, projet sans classe en
quatre vues), 305 à 314 en 390 px.

### Étape 1 construite (9 octobre 2026)

Les écrans de [Mes classes et Nouveau projet](#mes-classes-et-nouveau-projet-6-octobre-2026),
la barre du haut, « Mes projets » et la connexion de l'élève sont construits
dans l'application tels que dessinés, à partir des jetons, des formes et des
textes de la maquette. Le système « Cahiers d'aventure » y est en place :
jetons dans `app/src/styles/jetons.css`, formes communes dans
`app/src/styles/formes.css` et `app/src/composants/`. Les polices sont
hébergées avec l'application. `npm run captures`, dans `app/`, refait les
captures des écrans construits.

**Écrans que la maquette ne dessinait pas, construits dans le système et
restés sans retour du porteur :**

| Écran | Disposition |
| --- | --- |
| Entrée enseignant | La disposition d'« Ouvrir la classe » : image à gauche, carte à droite. En tête, « Continuer avec Google », bouton à contour avec le signe de Google (décision du porteur, 9 octobre 2026) ; « ou » ; puis adresse, mot de passe, « Entrer », seul bouton plein, « Mot de passe oublié », et un lien vers l'entrée des élèves. Aucune commande d'inscription. Un compte Google inconnu : « Aucun compte ne correspond à cette adresse Google. » |
| Mot de passe oublié | La même carte : une adresse, « Recevoir le lien », puis une seule phrase, identique que l'adresse soit connue ou non. Le lien reçu mène à « Nouveau mot de passe ». |
| Mon compte | Panneau ouvert depuis le nom de l'adulte, dans la barre du haut : le nom affiché aux élèves, avec la phrase qu'ils liront, et « Se déconnecter ». |
| Projet à l'étape 1 | L'en-tête du projet et ses quatre onglets, trois en mode personnel. Chaque onglet dit en une phrase à quelle étape du plan il se construit : texte provisoire. |
| Classe d'un projet | « Choisir une classe » comme dessiné ; quand une classe est choisie, « Changer de classe » à la même place, tant qu'aucun chapitre n'est attribué (F01-AC24). |
| Renommer la classe | Un dialogue : le nom, puis la case « Identifiant », qui suit le nouveau nom quand l'identifiant en était tiré, et « Enregistrer ». Dessous, une phrase : « L'identifiant de la classe ne change pas. », ou « L'affiche sera à réimprimer, et les étiquettes qui portent l'identifiant. » avec le lien « Garder « cm1cm2 » ». Un identifiant déjà pris est refusé sous la case (F06-AC84, AC85, 9 octobre 2026). |
| Nouvelle classe | Le panneau dessiné, avec une case de plus sous le nom : « Identifiant », remplie d'après le nom au fil de la frappe, et « Les élèves le tapent pour ouvrir la classe. Vous pouvez en écrire un autre. » (F06-AC85). La phrase du bas ne parle plus que du mot de passe. |
| Accueil de l'élève | « Bonjour Alice », « Mon travail », puis « Tu n'as pas encore de chapitre. Mme Laurent va t'en donner un. », ou « Le travail est fermé jusqu'à demain, 8 h 30. » hors des horaires. L'illustration est générique : celle du projet viendra avec « Mon travail », à l'étape 4. |
| Erreurs à l'entrée de la classe | « Ce n'est pas le bon identifiant, ou pas le bon mot de passe. Regarde l'affiche, ou demande à ton enseignant(e). » et « Trop d'essais. Attends 5 minutes, ou demande à ton enseignant(e). » |

**Retouches de l'essai du porteur, 9 octobre 2026.** Demandées sur
captures et faites le même jour :

- le nom affiché, « Il était une classe », dans le logo, l'entrée et
  le titre de l'onglet ;
- entrée enseignant : adresse et mot de passe d'abord, « ou », puis
  « Continuer avec Google » ; plus de phrase sous le titre ; au pied, sur
  une ligne, « Mot de passe oublié » et « Élève ? Entre dans ta classe » ;
- entrée des élèves : « Bienvenue dans ta classe », sans phrase sous le
  titre, bouton « Entrer », et au pied « Tu es enseignant(e) ? Entrée des
  enseignants » : l'écran tutoie de bout en bout ;
- un bouton qui attend une réponse garde sa taille et montre un cercle qui
  tourne à la place de son texte ; il ne s'envoie pas deux fois. Les
  panneaux qui enregistrent seuls disent « Enregistrement… » puis
  « Enregistré » ;
- après un refus, ce qui était écrit reste dans le formulaire : l'adresse de
  l'enseignant ; l'identifiant et le mot de passe de la classe pour l'élève ;
- inscription : une feuille de lignes numérotées à deux cases, « Prénom » et
  « Nom, facultatif », cinq lignes au départ, une ligne vide toujours
  prête, « Entrée » pour passer à la suivante, une croix pour effacer une
  ligne, et la phrase « Un élève par ligne. Vous pouvez aussi coller une
  liste. » (F01-AC33, AC34). Elle remplace la zone de texte lignée de la
  maquette ;
- à l'inscription, un envoi qui n'arrive pas laisse la liste à l'écran avec
  une phrase, au lieu de l'écran « Quelque chose n'a pas marché ».

**Écarts avec la maquette, à juger à l'essai :**

- l'identifiant et le mot de passe de la classe suivent la forme décidée le
  8 octobre et revue le 9 pour l'identifiant, que l'enseignant choisit et
  que l'application propose d'après le nom de la classe seul (« cm1cm2 »,
  « tigre nuage 42 »), sans les traits d'union de la maquette ;
- le mot de passe de la classe se tape en clair à l'entrée des élèves : il
  est sur l'affiche, un élève voit ses fautes de frappe, et le navigateur
  d'un poste partagé ne propose pas de le retenir ;
- l'aperçu des étiquettes montre toutes les feuilles, et non la première
  seule : ce qu'on voit est ce qui s'imprime ;
- un message dit « Le code d'Alice est changé » et non « de Alice » ;
- le retrait d'un élève se fait toujours d'un geste, avec « Annuler » :
  personne n'a encore de texte. Le dialogue de trois faits viendra avec les
  scènes, à l'étape 4 ;
- « Mes projets » montre « 0 % des scènes prêtes pour le livre » et pas de
  scènes à valider : ces comptes arrivent avec les scènes.

### Étape 2 : écrans arrêtés avant de construire (10 octobre 2026)

L'entretien du 10 octobre 2026, avant l'étape 2 du [plan](plan.md#étape-2--préparer-et-organiser-le-récit),
change ou ajoute les dispositions suivantes ; les règles sont en F02,
F03.1, F03.2, F06.1 et F10.1 des [spécifications](specifications.md). Le
reste des écrans de l'étape se construit tel que dessiné dans
[Organisation du récit reprise après critique](#organisation-du-récit-reprise-après-critique-6-octobre-2026)
et dans la ligne « Préparation » des dispositions par situation. Ces formes
sont proposées, à juger à l'essai de l'étape.

| Élément | Disposition |
| --- | --- |
| Déplacer une carte | La carte entière se tire : partie par son titre, chapitre et scène par leur carte. Le pointeur devient une main ; la carte tirée se soulève, les autres s'écartent pour montrer où elle se posera. Après le geste, un message : « « Le sanctuaire » est placé avant « La lisière ». Annuler ». « Monter » et « Descendre » quittent le menu de la scène. |
| Repère de prise | Demandé par le porteur : six petits points gris, en deux colonnes, discrets mais toujours présents ; avant la référence sur la carte de scène, au pied de la carte de chapitre, devant l'image de la partie. Pas de bande sur toute la longueur. S'il alourdit l'écran, il est retiré et l'écran d'aide reste seul à dire que les cartes se déplacent. |
| Écran d'aide de « Parties et chapitres » | Une question de plus : « Comment changer l'ordre ? — Tirez une carte pour la déplacer. Un chapitre se pose aussi dans une autre partie. » |
| Corbeille du projet | Sous une scène ou un chapitre dont le parent est aussi supprimé, à la place de « Restaurer » : « Restaurez d'abord « La lisière ». » Après une restauration : « « Le sanctuaire » est restauré, avec ses 3 élèves. » |
| Départ supprimé | Dans le dialogue ou le message : « Le livre n'aura plus de départ. », suivi du lien « Choisir un autre départ ». Dans « À compléter » : « pas de départ du livre ». |
| Choisir le départ du livre | Un panneau : le champ « Rechercher une scène », puis les scènes trouvées sous leur chapitre, à sa couleur ; en choisir une ferme le panneau et dit « S002 « Le quai des brumes » est le départ du livre. Annuler ». |
| Carte du projet à la création | À la troisième question, à droite du titre et de la classe : la carte de « Mes projets », le titre s'y écrivant au fil de la frappe sur un visuel par défaut ; dessous, le lien « Choisir une image ». Sur téléphone, la carte passe au-dessus des cases. |
| Réglages à la création | Un chapitre ou une partie ajoutés s'ouvrent sur leur panneau, titre sélectionné ; l'image vient juste dessous, avec « Choisir une image » ; puis, pour un chapitre, la couleur et le résumé. |
| Choisir une image | Un panneau, le même partout : « Importer une image », seul bouton plein ; « Images du projet », en vignettes, absent tant que le projet n'en a pas ; « Visuels proposés », en vignettes, celui en place coché ; au pied, « Revenir au visuel par défaut » quand une image est choisie. Refus : « Cette image n'a pas pu être importée. Choisissez un fichier JPEG, PNG ou WebP de moins de 20 Mo. » |
| Page du chapitre, mode personnel | La page de l'enseignant sans « Attribuer des élèves », « qui s'en occupe » ni « Voir dans le Suivi » ; ni filtres, ni cases. |
| Page du chapitre, élève | La même page en lecture, sans menu ni ajout. Le profil « écriture et organisation » y a « Ajouter une scène », le déplacement et « Supprimer » sur une scène qu'il a créée. |
| Chapitre qui n'est pas le sien | La carte s'ouvre sur une fiche courte : l'image, le titre, « Ce chapitre n'est pas le tien. » et « Fermer ». |
| Aides IA | « M'aider à développer » et « Idées de parties » ne sont pas à l'écran avant l'étape 8. |

**Textes du guidage de la préparation,** repris de la maquette, à corriger
par le porteur à l'essai. En projet de classe, les questions disent
« notre » et la synthèse « Nous retenons… » ; en projet personnel, elles
disent « votre » et la synthèse « Je retiens… », sans atelier projeté.

| Rubrique | Question | Relances |
| --- | --- | --- |
| Univers | Où se passe notre histoire, et qu'a-t-elle d'étrange ? | À quelle époque ? · Qu'est-ce qui est dangereux, qu'est-ce qui est beau ? · Une règle magique ou mystérieuse ? |
| Personnages | Qui est notre héros, et qu'est-ce qui le rend unique ? | Quel âge a-t-il ? Que sait-il faire ? · De quoi a-t-il peur ? · Qui va l'aider, qui va le gêner ? |
| Enjeu | Que doit réussir notre héros, et que se passe-t-il s'il échoue ? | Qu'est-ce qui l'oblige à partir ? · Qu'est-ce qu'il risque de perdre ? |
| Grandes étapes, récit à choix | Par quels lieux passe notre aventure ? | Où commence-t-elle ? · Où le héros peut-il se perdre ? · Où se termine-t-elle ? |
| Grandes étapes, récit classique | Que se passe-t-il, du début à la fin ? | Comment l'histoire commence-t-elle ? · Qu'est-ce qui complique tout ? · Comment se termine-t-elle ? |

L'exemple de chaque rubrique, derrière « Voir un exemple », vient de
l'histoire de la maquette, « Les passeurs de brume » : un pays de lacs noyé
dans la brume ; Lou, dix ans, fils du dernier passeur, qui a peur de l'eau ;
retrouver son père avant que la dernière lanterne ne s'éteigne ; le port, la
forêt, la montagne. L'introduction du carnet, sans la mention de l'aide IA :
« Le carnet garde les décisions de la classe. Il sert de repère pendant
l'écriture. Remplissez seulement ce qui vous sert. »

**Bibliothèque de visuels :** aux cinq visuels du 30 septembre (forêt, mer,
montagne, cité, désert) s'ajoutent ceux que le porteur génère d'après des
prompts de lieux variés, dans le même style, format 3:2, l'animal et le
sujet dans les deux tiers supérieurs.

### Étape 2 construite (10 octobre 2026)

Les écrans de l'étape 2 sont construits dans l'application d'après la
maquette et les dispositions ci-dessus ; `npm run captures -- etape2`, dans
`app/`, refait leurs captures. Sans retour du porteur à ce stade.

**Écarts avec ce qui était dessiné ou arrêté, à juger à l'essai :**

- le repère de prise est au pied de la carte de chapitre, en face
  d'« Ouvrir », et non dans un coin de l'étiquette, qu'il encombrait ; sur
  la carte de scène, avant la référence ; devant l'image de la partie ;
- une partie seule dans le plan, ou une scène seule dans son chapitre, n'a
  pas de repère de prise : il n'y a nulle part où la poser ;
- tant qu'aucune scène n'a de texte, « Supprimer » part toujours sans
  dialogue, avec « Annuler » dans le message ; le dialogue de trois faits
  viendra avec les textes, à l'étape 3 ;
- « élèves sans chapitre », dans « À compléter », n'a pas son lien « Voir » :
  il mène à la vue Élèves du Suivi, construite à l'étape 4 ;
- la carte de chapitre et l'en-tête d'une partie ne comptent que les
  scènes : validées, prêtes, à valider et à reprendre arrivent avec les
  états, à l'étape 4 ; toute scène porte « Texte vide » ;
- la page du chapitre n'a pas la bascule « Scènes / Chemins » ni « Voir dans
  le Suivi » (étapes 3 et 4), ni « qui s'en occupe » sur les cartes
  (étape 4) ; sa recherche n'apparaît qu'à partir de quatre scènes ;
- le carnet montre les relances sous la question, l'exemple seul étant
  replié ; les pistes se notent aussi dans le carnet, et pas seulement dans
  l'atelier.

**Retouche du porteur, 10 octobre 2026 — « Phrases de choix ».** Les deux
colonnes « Formule de renvoi » et « Constructions » ne se distinguaient pas :
elles montraient deux fois presque la même phrase. Elles deviennent une
seule partie. Une liste de quatre phrases écrites en entier, à cocher, la
première « toujours proposée » ; au-dessus, « Le numéro s'annonce par », en
trois pilules (« rends-toi au 12 », « va au 12 », « → 12 »), qui récrit
aussitôt les quatre phrases. Les noms des constructions (« Pour… », « Si tu
veux… ») quittent l'écran : la phrase d'exemple en tient lieu. Les règles de
F05 et F11.5 ne changent pas : une seule façon d'annoncer le numéro pour
tout le livre, une phrase tirée parmi celles qui sont cochées. Avec
« → 12 », les trois dernières phrases sont grisées et une phrase dit que
seule la première sert (F05-AC43, décidé le même jour).

**Bibliothèque de visuels, 10 octobre 2026.** Dix-huit visuels générés par
le porteur d'après les prompts du jour s'ajoutent aux cinq premiers : mine,
bateau, savane, volcan, jardin, port, îles du ciel, fond marin, moulin,
temple, étang, bibliothèque, lagon, neige, rivière, village, château,
grotte. Chacun a sa vignette (480 × 320), que montrent les cartes et le
sélecteur « Choisir une image » ; le visuel entier sert aux grandes images
(« Mes projets », accueil de l'élève, carte de la création).

**Écrans que la maquette ne dessinait pas :**

| Écran | Disposition |
| --- | --- |
| Réglages du projet | Trois points au bout de l'en-tête du projet : un panneau avec le titre, l'image (« Choisir une image ») et, en projet de classe, l'interrupteur « Les élèves lisent toute l'histoire », suivi d'une phrase qui dit ce que cela change. |
| Page d'une scène | Fil « Retour à La lisière » ; un bandeau à la couleur du chapitre avec la référence, le titre à écrire sur place, le tampon et le menu ; dessous, les repères de départ et de fin. À gauche, la place du texte, vide jusqu'à l'étape 3 ; à droite, la fiche « Consigne », facultative. Texte provisoire. |
| Toute l'histoire, pour l'élève | Sous l'accueil : les parties et leurs cartes. La sienne est cernée de bleu canard et porte « Ton chapitre » et « Ouvrir » ; les autres n'ont que l'image et le titre. Avec la lecture ouverte, elles portent « Lire ». |
| Chapitre qui n'est pas le sien | Un dialogue : le titre, l'image, « Ce chapitre n'est pas le tien. », « Fermer ». |
| Chapitre ouvert par un élève | Le bandeau du chapitre, ses élèves (« Toi » pour lui), « Ce qui se passe dans ce chapitre » replié, puis les fiches des scènes, leur consigne dessous. Profil « écriture et organisation » : « Ajouter une scène », repère de prise, et un menu par scène (« Donner un titre », « Supprimer » pour celle qu'il a créée, avec confirmation : il ne peut pas la retrouver lui-même). |
| Atelier, « Grandes étapes » | À droite, la liste des parties retenues en grand, et une ligne pour en ajouter une : elle entre aussitôt dans le plan. |

### Conflit de sauvegarde : écrans de F08.1 (7 octobre 2026)

**Objet :** les règles de la récupération d'un conflit sont décidées et
validées le 7 octobre 2026 en [F08.1](specifications.md#f081--écritures-concurrentes), qui fait foi ; il manquait les
écrans, et les messages de l'adulte comme de l'élève restaient sans issue.
Ils sont dessinés le même jour, sans critique d'ergonomie ni lecture
indépendante. À l'écran on lit « texte gardé à part », jamais « copie de
récupération ».

**Deux règles tranchées par le porteur avant le dessin :** un texte qui
sort de la scène par un échange s'appelle toujours « Ancien texte de la
scène » et n'arrête personne, même après un second échange (F08-AC30) ;
l'élève arrêté ne se voit proposer ni « M'occuper de cette scène » ni « Je
ne m'en occupe plus » (F08-AC31). Tout le reste du tableau est proposé.

**Formes reprises, rien d'inventé :** les onglets de la copie ; la note
au-dessus de la copie, ambre quand cela attend, avec « Annuler » quand on
peut défaire ; la ligne de rappel du Suivi ; le pied de la copie de
l'élève ; la bulle « i » nommée par une question. Un seul signe nouveau, la
bannette (`i-apart`), qui ne dit que « texte gardé à part » : note,
onglet, ligne du Suivi, pied et « Mon travail ». Aucun bouton plein dans
l'onglet d'un texte gardé à part ; « Ne plus garder ce texte », qui efface,
est en brique, non plein.

| Écran | Disposition |
| --- | --- |
| Adulte, message au-dessus de la copie | Note ambre, d'où qu'on vienne : « Un texte de Bilal est gardé à part : tant qu'il attend, Bilal ne peut pas écrire dans cette scène. », suivi du lien « Voir ce texte », qui ouvre l'onglet. Pour l'ancien texte de la scène : « L'ancien texte de la scène est gardé à part. » ; pour des corrections retrouvées plus tard : « Vos corrections du mardi 6 octobre sont gardées à part. » ; pour plusieurs : « 2 textes sont gardés à part : tant qu'ils attendent, Bilal et Inès ne peuvent pas écrire dans cette scène. », avec un lien par texte. Dans l'onglet du seul texte, le message reste et perd son lien. La scène garde son tampon : aucun tampon de plus. |
| Onglet du texte gardé à part | À côté de « Texte de la scène » et de « Remis le… », sur deux lignes pour tenir à trois ou quatre : « Texte de Bilal », puis « gardé à part mardi 6 octobre » en ambre, précédés de la bannette ; le nom lu par un lecteur d'écran est la phrase entière. La copie est en lecture, avec ses propres phrases de choix et ses images, et la mention « En lecture · tel que Bilal l'a écrit à 10 h 42 ». Au pied : « Que faire de ce texte ? », une bulle « Que font ces deux commandes ? » (elle dit aussi qu'on peut copier un passage), puis « Ne plus garder ce texte » et « Mettre ce texte dans la scène ». La fiche de droite ne décide pas : « Vous lisez le texte de Bilal, gardé à part mardi 6 octobre. Pour décider de l'état, revenez au texte de la scène. », comme dans l'onglet d'une remise. Le tampon de l'en-tête reste disponible : l'état est libre. |
| Après « Ne plus garder ce texte » | L'onglet disparaît, la page revient au texte de la scène. Note qui reste sur place : « Le texte de Bilal n'est plus gardé : Bilal peut de nouveau écrire dans cette scène. », « Annuler », et en petit « tant que vous restez sur cette page ». « Annuler » rend l'onglet, ouvert, et l'arrêt de Bilal. Page quittée : plus de note, plus rien à annuler. |
| Après « Mettre ce texte dans la scène » | La page revient au texte de la scène, qui est celui de Bilal, choix compris. Note : « Le texte de Bilal est maintenant le texte de la scène. L'ancien est gardé à part, et Bilal peut de nouveau écrire. », lien « Voir l'ancien texte ». Pas d'« Annuler » : on revient en arrière par le même geste sur l'ancien texte. Nom proposé pour son onglet : « Ancien texte de la scène, gardé à part mardi 6 octobre », daté du jour de l'échange, avec la mention « tel qu'il était à 14 h 05 ». Après un second échange : « L'ancien texte est de nouveau le texte de la scène. Celui qu'il remplace est gardé à part. » |
| Deux textes et une remise | Quatre onglets sur une ligne en 1 440 px : « Texte de la scène », « Remis le 6 octobre », « Texte de Bilal », « Texte d'Inès ». Chaque texte se traite seul ; l'élève dont le texte attend encore reste nommé dans le message. En 390 px, les onglets passent sur trois lignes et les deux commandes prennent toute la largeur. |
| Adulte, son propre conflit | Message réécrit : « Quelqu'un a modifié cette scène pendant que vous la corrigiez. Vos corrections sont gardées à part ; la scène montre le texte à jour. », lien « Voir vos corrections ». « Texte de la scène » montre le texte à jour et s'écrit aussitôt ; le pied dit « Enregistré » ; la fiche et le tampon ne refusent plus rien. Onglet « Vos corrections, gardées à part mardi 6 octobre », avec les deux mêmes commandes. Au premier choix de « Validé » ou de « Prête » : « Validation suspendue : le texte a changé pendant que vous le corrigiez. Relisez-le avant de choisir l'état. » ; le second choix passe. |
| Suivi | Sous la ligne des élèves sans chapitre, qui ne bouge pas, une seconde ligne ambre à la bannette : « 1 texte gardé à part : S015 Sentier — le chant dans les fougères ». Le nom de la scène est le lien ; il ouvre la scène sur l'onglet, avec « Retour au Suivi ». Deux scènes : référence et titre de chacune ; au-delà, les références seules, « 4 textes gardés à part : S004 · S015 (2) · S022 », le nombre entre parenthèses quand une scène en porte plusieurs. Aucun filtre ne change. La ligne compte aussi l'ancien texte d'une scène et les corrections de l'adulte. Elle s'affiche seule quand tous les élèves ont un chapitre, dans les deux vues, et pas dans le Suivi filtré sur les scènes à finir ni quand le suivi n'a pas pu être chargé. |
| Scène à côté de l'aperçu du livre | Écran validé le 3 octobre, touché d'une ligne : sous le nom du chapitre, « Un texte de Bilal est gardé à part dans cette scène. », suivi du lien « Le voir sur la page de la scène ». Proposition : pas d'onglet ici. Cet écran n'en a aucun et renvoie déjà à la page de la scène pour la consigne, les remises et la relecture ; le lien ouvre la page sur l'onglet, et « Retour au Livre » rouvre la scène à côté de l'aperçu. Le conflit de l'adulte s'y dit de la même façon : « Quelqu'un a modifié cette scène pendant que vous la corrigiez : vos corrections sont gardées à part. Les voir sur la page de la scène ». |
| Mode personnel | Le même onglet, sans élève : « Votre texte, gardé à part mardi 6 octobre », proposé à la place de « Vos corrections ». Message : « Vous avez modifié cette scène dans une autre fenêtre. Ce que vous veniez d'écrire ici est gardé à part ; la scène montre le texte à jour. », lien « Voir ce texte ». Les onglets n'existent dans ce mode que s'il y a un texte gardé à part. Pas de ligne de rappel : ce mode n'a pas de Suivi. |
| Élève, instant de l'arrêt | Message du conflit gardé tel quel, dans le pied : « Quelqu'un d'autre a écrit dans cette scène en même temps que toi. Ton texte est gardé. Arrête d'écrire et appelle Mme Laurent. » Quand la scène ne s'écrit plus (remise par un camarade, validée, prise par l'enseignante) : « Cette scène a changé pendant que tu écrivais : tu ne peux plus y écrire. Ce que tu venais d'écrire est gardé. Appelle Mme Laurent. » La raison se lit déjà sur le tampon et dans la mention de lecture. « Tu t'en occupes » perd son menu. |
| Élève, retour avant le geste | La scène en lecture, avec le texte de la scène et sans le sien. Pied ambre, à la bannette : « Ton texte est gardé à part. Mme Laurent doit le regarder avant que tu écrives ici. », et « Retour à Mon travail » en bouton ordinaire quand l'en-tête ne le porte pas déjà. Ni « Remettre », ni « Modifier encore ce texte », ni prise de la scène : sur la scène d'un camarade, la note se réduit à « Alice s'occupe de cette scène. Tu peux la lire. » Le retour de l'enseignante en grand n'est pas montré. |
| Élève, « Mon travail » | La scène porte la même phrase, à la bannette, et « Lire la scène », jamais le bouton plein. Si l'élève s'en occupe, sa carte se range après ce qu'il peut écrire (à reprendre, en cours, texte vide) et avant ce qu'il a remis : le bouton plein reste sur une scène où il peut travailler. Si c'est la scène d'un camarade, elle reste dans « Dans ton chapitre », en tête, la phrase sous sa ligne. |
| Élève, fermeture | L'écran de fermeture ordinaire, sans alerte ; une seule phrase change, pour ne rien promettre : « Ton texte est gardé à part. Mme Laurent doit le regarder. » à la place de « Ton texte a été enregistré à 16 h 30. Tu le retrouveras demain. » |
| Élève, retour du réseau | Le pied annonce, en vert, à la place de l'heure : « Ça y est, ton texte est enregistré. » ; après une remise qui avait échoué : « Ça y est, ton texte est enregistré. Tu peux le remettre. », le bouton de nouveau actif. Si la scène a changé pendant la coupure, le texte part à part et l'élève lit la phrase du conflit, la même : une situation, une phrase. |

**Vérifications :** gestes rejoués en 1 440 px pour l'adulte et en
1 366 × 768 pour l'élève — ne plus garder puis annuler ; quitter la page
après « Ne plus garder », plus rien à annuler ; échanger puis échanger de
nouveau ; deux textes dont un seul traité ; « Validé » choisi sans traiter
le texte ; échange sous « Validé », l'état, l'élève et la remise ne
bougeant pas ; conflit de l'adulte puis « Validé » suspendu, puis validé ;
ligne du Suivi jusqu'à l'onglet et retour ; scène à côté de l'aperçu
jusqu'à l'onglet et retour au Livre ; mode personnel, échange puis ne plus
garder ; élève arrêté qui revient par son adresse, qui passe par « Mon
travail », qui ouvre une autre scène et y écrit ; scène remise entre-temps,
« Modifier encore » absent pour lui et présent pour Alice ; geste de
l'enseignante puis élève qui écrit de nouveau, sans message ; échec puis
enregistrement abouti ; remise en échec puis enregistrement abouti ; échec
puis conflit ; fermé, élève arrêté. En 390 px : onglet, ne plus garder,
annuler, échanger, ligne du Suivi, élève arrêté et « Mon travail ». Aucune
erreur de console, aucun débordement horizontal ; quatorze autres adresses
du sommaire relues sans erreur. Le pied de l'élève arrêté est à l'écran en
1 366 × 768 et en 390 px. Dans « Chemins », le choix du texte mis dans la
scène apparaît après l'échange et pas avant (F08-AC26).

**Critères F08-AC06 à AC31 :** tenus à l'écran, sauf ce que la maquette ne
peut pas jouer, dit dans les limites — AC09 et AC12 (rien n'expire, aucune
durée simulée), AC24 (page fermée sans réseau : rien ne s'affiche, ce qui
est la règle) et AC27 (le livre ne suit pas l'échange).

**Adresses à drapeaux**, préfixés « ga », libres dans les autres écrans et
décrits en tête du bloc « Textes gardés à part » de `assets/ecrans.js` :
`?ga=bilal`, `?ga=bilal.ines`, `?ga=prof`, `?ga=ancien` sur une scène ;
`?ga=S015:bilal,S022:prof` au Suivi, sur « Mon travail » et au Livre ;
`?texte=g1` pour l'onglet du premier texte ; `?gafait=retire`, `echange`,
`conflit` ou `suspendue` ; `?garemis=1` (Alice a remis la scène à 10 h 40) ;
`?gareseau=1` (l'enregistrement de l'élève vient d'aboutir) ; `?gatous=1`
(aucun élève sans chapitre). Classes CSS préfixées `.ga-`, dans
`assets/ecrans.css`. Dans la barre de présentation, « Conflit » garde à
part le texte de la personne affichée sur la scène ouverte ; c'est un
instant, qui se termine quand on quitte la page ou qu'on change de vue, le
texte gardé à part restant. `sources/cadre-mobile.html` accepte `&w=1366`
et `&nu=1`, qui masque la barre de présentation, pour les captures du côté
élève.

**Limites :** les données restent en mémoire, et rien n'est gardé d'un
chargement à l'autre : l'arrêt « qui tient » se montre par une adresse à
drapeau, une page rechargée sur `?sauv=conflit` rejouant l'instant du
conflit. Les textes gardés à part sont datés du mardi 6 octobre alors que
le reste de la maquette vit le 29 septembre : une remise faite à la main
après un échange porte la date du 29. Dans la maquette, un élève n'écrit
pas dans la scène d'un camarade sans la prendre : le conflit de Bilal sur
la scène d'Alice se montre par son résultat. Le livre garde ses propres
textes : un échange ne change ni l'aperçu ni le PDF. Venue du Livre, la
page de scène montre le texte que le livre compte, et l'échange y porte sur
le texte de la page de scène. La validation suspendue après un conflit
n'est pas jouée à côté de l'aperçu. Le texte que l'adulte ou l'élève vient
de taper n'est pas lu : le texte gardé à part est un texte d'exemple. Les
captures antérieures de la page de scène et du côté élève ne
sont pas refaites, sauf 188 et 203.

**Proposé, sans retour du porteur :** la forme de tous ces écrans et le
texte de leurs messages ; l'onglet sur deux lignes ; la bannette ; aucun
bouton plein dans l'onglet, « Ne plus garder ce texte » en brique ; pas
d'« Annuler » après un échange ; « Ancien texte de la scène, gardé à
part… » et « Votre texte, gardé à part… » ; la ligne du Suivi sous celle
des élèves sans chapitre, le nom de la scène en lien, les références seules
au-delà de deux scènes, et son absence du Suivi filtré sur les scènes à
finir ; la scène à côté de l'aperçu sans onglet ; le rang de la scène dans
« Mon travail » et sa place quand elle est à un camarade ; « Retour à Mon
travail » dans le pied ; la phrase de l'écran de fermeture ; « Ça y est,
ton texte est enregistré. » ; la même phrase de conflit au retour du
réseau ; la remise à refaire après un échec ; la suspension levée au second
choix de l'état. Corrigé en passant : « Le texte d'Alice », qui s'écrivait
« Le texte de Alice ».

**Captures :** 315 à 323, la page de scène de l'adulte (message, onglet et
ses deux commandes, « Ne plus garder » avec « Annuler », après l'échange,
ancien texte, deux textes et une remise, conflit de l'adulte, « Vos
corrections », validation suspendue) ; 324 à 326, la ligne du Suivi (un
texte, plusieurs scènes, seule) ; 327, la scène à côté de l'aperçu ; 328,
le mode personnel ; 329 et 330, l'onglet et le Suivi en 390 px ; 331 à
336, l'élève en 1 366 × 768 (scène qui ne s'écrit plus, retour avant le
geste, « Mon travail » de Bilal puis d'Alice, fermé, enregistrement
abouti) ; 337, l'élève arrêté en 390 px.

### Suite de la conception

1. Examiner la synthèse ; ajuster les dispositions proposées sans rouvrir
   les règles fonctionnelles acquises.
2. Avant tout développement, et sur instruction correspondante, éprouver les
   risques techniques déjà identifiés dans [l'architecture](architecture.md) :
   édition des choix, permissions, sauvegarde concurrente, composition PDF.
3. Examiner les écrans du livre en étapes et de la lecture d'essai
   (ci-dessous) ; le délai de l'aperçu calculé côté serveur reste à éprouver.
   Approfondir par entretien les autres parcours avant leurs écrans.

### Destination Livre et lecture d'essai

**Statut :** dispositions proposées, sans nouvelle règle, pour le parcours
du livre : [F09](specifications.md#f09--test-de-lecture-et-cohérence-du-récit),
[F11](specifications.md#f11--composition-et-préparation-du-livre), avec
[F05.1](specifications.md#f051--liaisons-cachées-par-énigme) et les images
de [F10](specifications.md#f10--illustrations). Cette section décrit l'état
actuel de la maquette, après les reprises des 3 et 4 octobre 2026 ; ce
qu'elles ont remplacé est réuni en fin de section, sous « Reprises
successives ». Retours du porteur : il donne le 1er octobre un retour
favorable d'ensemble aux premiers écrans, du 30 septembre ; il valide le
3 octobre l'écran de la scène ouverte à côté de l'aperçu, les autres écrans
de ce jour restant sans retour propre ; il donne un retour favorable d'ensemble
au livre en étapes le 3 octobre, puis à sa reprise en deux volets le 4,
sans validation exhaustive de leurs détails ; il juge la section « Ordre
des passages » « beaucoup plus compréhensible ». Les choix qui restent à
confirmer sont listés après le tableau.

**Système.** Les quatre paragraphes qui suivent disent ce que ces écrans ajoutent au système « Cahiers d'aventure » et ce qu'ils en reprennent.

**Ajout au système :** un quatrième objet papier, la **page A5 du livre**,
blanche, sans couleur de chapitre ni tampon : le livre composé ne dépend pas
des repères de l'espace de travail. Les signalements utilisent trois niveaux,
toujours avec un pictogramme et un mot : brique (bloque le PDF définitif),
ambre (à vérifier), graphite (à savoir). Dans les pages, ces marques et les
références stables sont en Atkinson, la voix de l'outil ; le récit reste en
Vollkorn.

**Scène ouverte à côté de l'aperçu : aucun objet ajouté.** La scène ouverte depuis l'aperçu est un
tiroir qui prend la place de la fiche de l'étape (du rail des contrôles, avant le 4 octobre) : l'éditeur à gauche, le
livre à droite, comme la copie et sa page imprimée. Il réunit deux objets
existants, sans cadre autour d'eux : une fiche à filet canard, celui de la
décision, pour ce qui relève de la composition, puis la copie de la scène.
Le numéro imprimé y figure sur une page A5 miniature, en Vollkorn. Le canard
garde son rôle de sélection : il entoure le passage ouvert et la page visée.
Les marques de relecture (« p. 12 », millimètres de blanc) restent dans la
voix de l'outil ; le numéro de page et les dés du livre, dans celle du récit.

**Ligne d'étapes et marques : aucun objet ajouté.** La frise reste un repère de parcours :
des pastilles numérotées reliées par le chemin pointillé du logo. Le canard
garde son rôle de sélection : il désigne l'étape en cours et entoure la
tâche ouverte, comme la page visée dans l'aperçu. Une étape fermée porte une
pastille en pointillé et un cadenas, sans couleur. Dans la ligne d'étapes,
une marque seule suffit depuis le 4 octobre : triangle ambre s'il reste à
faire, sablier gris si l'étape attend la fin de l'écriture, cadenas si elle
est fermée ; son texte reste lisible au survol et par un lecteur d'écran.
Partout ailleurs, un signalement garde un pictogramme et un mot. La coche ne
veut dire qu'une chose : il ne reste rien.

**Règle de texte, à la demande du porteur :** peu de texte à l'écran. Un
bloc porte une phrase courte au plus ; l'explication se trouve derrière une
icône d'information ou dans l'écran d'aide de l'étape. Seule la conséquence
d'une action lourde reste écrite au moment de l'action (« Les numéros
changent », « Ouvre “Imprimer et partager” »). Un point à traiter se dit en
une phrase simple (« Image introuvable. », « Cette scène est une impasse. »,
« Aucun chemin n'y mène. ») ; le détail n'est donné que lorsque la scène est
ouverte. L'icône d'information ouvre une bulle ancrée à elle, qui reste
affichée jusqu'à ce qu'on la ferme (clic, Échap ou clic ailleurs) ; une
première version l'affichait quatre secondes dans un message fugitif, trop
court pour être lu.

**Écrans, dans l'ordre du parcours :**

| Situation | Disposition proposée |
| --- | --- |
| Ligne d'étapes | Relire, Vérifier les chemins, Mettre en page, Imprimer et partager ; « Aide » au bout de la ligne, derrière un filet. L'étape en cours porte un fond canard pâle et une pastille pleine. Sous le nom, plus rien : une marque à sa droite dit qu'il reste à faire, que l'étape attend l'écriture ou qu'elle est fermée ; une coche remplace le numéro d'une étape terminée. Tant qu'il reste des scènes à finir et rien à corriger, « Vérifier les chemins » porte le sablier et non le triangle : en septembre, aucune étape ne paraît fautive. Le détail se lit en ouvrant l'étape. |
| Étape fermée | Un écran simple à la place de la fiche et de l'aperçu : un cadenas, « “Mettre en page” n'est pas encore ouverte », quand elle s'ouvre, puis ce qui reste dans chaque temps, avec un lien vers lui. Une étape encore fermée y figure sans lien. S'il reste des scènes à finir, une ligne dit l'autre issue : « Une scène qui ne sera pas finie peut être exclue du livre, depuis son menu ⋯. » Aucune commande ne passe outre. |
| Aide d'une étape | Montrée à l'ouverture de l'étape, rouverte par « Aide » : le rang et le nom de l'étape, « Que fait-on maintenant ? » ouverte d'emblée avec une phrase et les tâches, trois questions repliées, puis « Commencer » et la case « Ne plus afficher ». Sans personnage. |
| Fiche de l'étape | À « Relire » et à « Vérifier les chemins » : une fiche à filet canard, en colonne à gauche de l'aperçu, qui reste en vue pendant qu'on lit. En haut, la liste des tâches, numérotées, toujours les mêmes et à la même place ; la tâche en cours est entourée de canard. Dessous, cette tâche seule : changer de tâche ne déplace rien. Une tâche porte son décompte (brique à corriger, ambre à confirmer) ou un sablier ; une tâche où il n'y a rien à faire reste affichée, cochée quand il ne reste plus de scène à finir, sans marque et « Rien pour l'instant » sinon. Au pied, « Continuer », puis « Étape suivante », avec un cadenas si elle est fermée. L'accordéon du 3 octobre, où une tâche s'ouvrait en refermant l'autre, faisait perdre sa place au porteur. « Mettre en page » n'a plus de fiche ni de tâches : voir ses deux volets. |
| Relire | « Ce qui reste à écrire » : un chiffre et « Voir dans le Suivi », sans liste. « Erreurs graves » : image introuvable, scène prête mais vide. « À confirmer » : image peu définie, avec « Garder ainsi ». « Lire et corriger » : une phrase et le PDF de travail. En septembre, l'écran dit « 39 scènes à finir » une seule fois, en neutre. |
| Déclaration d'une étape | Dernière tâche de « Relire » et de « Vérifier les chemins » : un bouton principal, « J'ai relu le livre » ou « J'ai vérifié les chemins ». Inactif tant qu'il reste quelque chose aux tâches précédentes, avec une ligne qui le dit. Posée, la tâche et l'étape portent une coche, et un lien permet d'y revenir. Demande du porteur, 4 octobre. |
| Suivi filtré | Le Suivi s'ouvre sur les seules scènes à finir, dans l'état que le livre leur compte, avec un bandeau qui dit les deux issues (« Ouvrez une scène pour la finir et la déclarer prête, ou pour l'exclure du livre (menu ⋯ de la scène) »), « Retour au Livre » et « Tout afficher » (« Retirer ce filtre » jusqu'à la passe de cohérence). Les puces d'état ne s'y ajoutent pas. Depuis le 4 octobre : bandeau en canard pâle et non en ambre, une sélection n'étant pas une alerte ; une icône d'information dit qu'une scène validée reste à finir tant qu'elle n'est pas déclarée prête ; ni rappel des élèves sans chapitre, ni tampons d'état, ni vue Élèves ; les filtres chapitre et élève s'appliquent aux scènes à finir. |
| Page de scène venue du livre | Ouverte depuis le Suivi filtré ou depuis la scène à côté de l'aperçu, elle porte « Retour aux scènes à finir » ou « Retour au Livre » dans la pastille de son en-tête ; au retour, la liste et son décompte ne comptent plus la scène déclarée prête ou exclue. |
| Déclarer prête | Par la commande d'état : le tampon de la scène, dans sa page comme à côté de l'aperçu, ouvre la liste des états, dont « Prête » (F11.1, 4 octobre 2026). Le bouton « Déclarer prête » de l'en-tête est retiré. Si la scène est vide, sans choix ni fin, ou garde un choix sans destination, un rappel le dit avant de déclarer, sans l'empêcher. À côté de l'aperçu, « À reprendre » ouvre la remarque au-dessus de la copie. |
| Menu de la scène | Le bouton à trois points, « Plus » jusqu'au 4 octobre, dans l'en-tête de la scène : « Exclure du livre », ou « Réintégrer dans le livre ». |
| Vérifier les chemins | Dans la colonne, à côté de l'aperçu. « Départ et fins », « Choix à relier », « Passages à confirmer », « Tester la lecture ». Chaque point est une carte : la scène, une phrase, « Ouvrir la scène » et son action propre (« Marquer comme fin », « C'est voulu », « Voir le graphe »). Les passages acceptés se replient sous « 2 acceptés », avec « Revoir ». Une ligne rappelle que les choix des scènes à finir seront vérifiés ensuite. « Tester la lecture » reste proposé, facultatif ; les renvois se suivent aussi d'un clic dans l'aperçu. Sur la page du livre comme au rappel du partage, l'énigme sans autre issue se dit « seule suite : une énigme ». |
| Scène ouverte depuis un point | À côté de l'aperçu placé sur son passage, avec le détail du point au-dessus de la copie. « Fermer » ramène à la liste de l'étape. |
| Aperçu | Pages A5 en vis-à-vis ou agrandies, avec les marques du PDF de travail : « Version de travail », référence à côté du numéro, « p. 12 » dans la marge, problèmes à leur place, énigme et numéro fixé signalés. Un clic sur un passage ouvre sa scène à côté ; un clic sur un renvoi suit le choix. Le détail est dans les lignes qui suivent. |
| Aperçu limité au récit | À « Relire » et à « Vérifier les chemins », l'aperçu commence au premier passage, en page de droite ; les pages gardent leur numéro. À « Mettre en page », il montre le livre entier. |
| État de l'aperçu | Toujours en vue au-dessus des pages : « Aperçu à jour, calculé à 10 h 02 » ou « Aperçu en cours de mise à jour. Les pages datent de 10 h 02 ». Pendant la mise à jour, les pages restent lisibles, estompées, et le passage ouvert passe en pointillé. Le pied de la copie dit « Enregistré à… » et « Écrit dans la scène dès la saisie, sans brouillon ». |
| Scène ouverte à côté | Un clic sur un passage remplace la fiche de l'étape par le tiroir ; « Fermer » ou Échap la rend. La rangée s'élargit jusqu'aux bords de la fenêtre : éditeur de 600 px, double page à 87 % en 1 440 px. En-tête : référence, titre, tampon d'état, chapitre, et « Consigne, remises et relecture : Ouvrir la scène ». |
| Éditeur complet | La copie de la page de scène, avec ses outils, ses phrases de choix et leur fiche de réglages, ses actions de jeu et son image. Seule la feuille défile ; outils et pied restent en vue. Les extraits des scènes voisines n'y figurent pas (décision du porteur, 3 octobre 2026). |
| Deux annulations | Dans la fiche du passage : « Annuler » défait la dernière action faite dans l'aperçu, déplacement ou nouvelle page, avec ce qu'elle a changé (« Passé du n° 30 au n° 29 »). Dans le pied de la copie : « Annuler » revient pas à pas et « Tout annuler » rétablit la scène telle qu'à l'ouverture, après confirmation sur place. Le porteur retient cette séparation le 3 octobre 2026. |
| Élève qui reprend la scène | Note jaune à gommette, comme la prise en charge dans la page de scène : ce qui est écrit entre dans le texte courant de l'élève, qui le verra en ouvrant la scène. |
| Suivre un renvoi | À toutes les étapes (F11-AC83). Demande du porteur, 3 octobre 2026 : dans l'aperçu, un clic sur un renvoi ou sur la marque d'une énigme place le livre sur le passage de destination et ouvre sa scène. Le tiroir indique d'où l'on vient (« Vous arrivez par « La suivre » ») et propose « Revenir au n° 3 », étape par étape. Le renvoi reste un texte en ligne, souligné au survol seulement : la composition ne change pas. |
| Image dans l'éditeur | L'image en bloc figure dans la copie à sa largeur, avec une légende d'outil ; pleine page, elle est montrée sur une page miniature. Un clic ouvre ses réglages dessous, comme pour un choix : « Monter d'un bloc », « Descendre d'un bloc », largeur (petite, moyenne, pleine largeur, pleine page, ou un pourcentage), fichier, retrait. Présente aussi dans la page de scène. |
| Parcours | Dans la barre de l'aperçu, deux compteurs à flèches : « Problèmes » pour ceux du temps en cours, « Pages peu remplies » au temps « Mettre en page ». « Problèmes » suit l'ordre du livre : l'aperçu se place sur le passage, la scène s'ouvre, et une carte au-dessus de l'éditeur nomme le problème, propose son action explicite et « Précédent », « Suivant » ; la fiche du passage se replie pour laisser la place. « Pages peu remplies » place l'aperçu sur la page, entourée de canard ; son blanc porte un repère hachuré et sa hauteur en millimètres, à l'écran seulement. Depuis le 4 octobre, ce parcours se trouve au volet « Aperçu » de « Mettre en page ». |
| Deux volets de « Mettre en page » | Idée du porteur, 4 octobre, après la troisième critique. Sous la ligne d'étapes, une barre qui reste en vue pendant le défilement : à gauche, la bascule « Réglages / Aperçu », la même que « Imprimer / Partager » à l'étape d'arrivée ; à droite, la déclaration. Ni rond numéroté, ni en-tête de fiche. Chaque volet retrouve l'endroit qu'on y avait quitté. Remplace les cinq onglets de tâches du matin, dont les ronds doublaient ceux des étapes, et le bouton fixe d'aller-retour, qui recouvrait d'autres commandes et manquait sur téléphone. |
| Volet « Réglages » | Un seul cadre blanc, trois sections titrées séparées par un filet, dans l'ordre : « Texte et pages », « Ordre des passages », « Pages de début et de fin ». Au pied, « Voir l'aperçu ». L'aperçu n'est pas affiché ; il reste composé, pour la petite double page et le nombre de pages. Environ deux écrans sur ordinateur. |
| Texte et pages | Sur deux colonnes : police, taille, alignement en cartes avec exemple, bas de page, titres ; marges à côté d'une vraie double page du livre en petit, qui suit les réglages ; nouvelles pages. Une marge refusée laisse dans le champ la valeur gardée. |
| Texte et pages, détail des réglages | Dans la section « Texte et pages » des réglages de « Mettre en page » (une tâche jusqu'au 4 octobre). « Nouvelles pages » : « Chaque partie commence sur une nouvelle page », et « chaque chapitre » en récit classique. « Texte du livre » : alignement en deux cartes avec exemple. « Pages du récit » : bas de page en trois cartes (rien, numéro de page, dés), les dés proposés seulement si la feuille en règle un ou deux, avec la phrase à ajouter aux règles du jeu ; marges en quatre champs à côté d'un schéma de double page, refus sous 10 mm écrit sous le champ, retour aux valeurs de départ. |
| Ordre des passages | Deux blocs côte à côte. « Mélange par partie » : une phrase (« Les passages sont mélangés dans chaque partie : la suite d'un choix n'est pas à côté de lui. »), puis une ligne par partie avec ses numéros (« Partie 1 · Le quai aux lanternes · n° 1 à 6 ») ; entre deux parties, un interrupteur nommé, « Mélanger les parties 1 et 2 ». Deux parties réunies tiennent dans un même cadre à filet canard, avec « n° 7 à 39, mélangés ensemble ». « Moins de blanc » : une phrase, l'encadré ambre « Les numéros changent, les renvois suivent. », puis « Réordonner les passages » et « Garder cet ordre » ; fait, « Annuler » et « Réordonner à nouveau ». Le lien « Voir l'ordre actuel » et son ruban de cases colorées sont retirés à la demande du porteur, qui ne les comprenait pas : ni les « + » entre les parties, ni les marques des cases n'étaient expliqués. L'ordre lui-même se voit dans le volet « Aperçu ». |
| Ordre à confirmer | Après une modification qui change des passages de page, un triangle sur l'étape, sur l'onglet « Réglages » et sur le titre de la section : « Le livre a changé. », puis « Garder cet ordre » et « Réordonner à nouveau ». Tant que rien n'est répondu, « La mise en page me convient » est inactive et « Ordre des passages à confirmer », à côté d'elle, mène à la section. |
| Pages de début et de fin | Cartes des pages de présentation, trois par rangée. Les sections de la feuille d'aventure et les règles du jeu renvoient à la préparation. |
| Pages de début et de fin, détail | Dans la section « Pages de début et de fin » des réglages de « Mettre en page » ; les sections de la feuille et les règles du jeu sont dans la préparation. Cartes dans l'ordre du livre. Chacune s'ouvre sur « Forme de la page » : modèle ou image pleine page. En image : fichier, dimension utile calculée d'après les marges (113 × 174 mm, 1 337 × 2 054 points à 300 points par pouce), rappel qu'une page bord à bord est réduite. Feuille d'aventure en image : l'image à droite, et à gauche les « sections de la feuille, pour le lecteur en ligne », dont l'accord avec l'image n'est pas vérifié. Page des auteurs : place au début ou à la fin. |
| Volet « Aperçu » | Le livre entier, depuis la page de titre. Dans sa barre, « Pages peu remplies » avec son décompte, ses flèches et une icône d'information. La page choisie montre ses passages suggérés dans la barre, juste au-dessus d'elle ; un passage placé y laisse sa confirmation et « Annuler ». Un clic sur un passage ouvre sa scène à côté, avec la fiche « Ce passage dans le livre ». Le mot « Retouches » n'est plus affiché ; aucun défaut ne se traite ici. |
| Ce passage dans le livre | Au temps « Mettre en page » seulement (F11-AC61). Fiche repliable au-dessus de la copie : numéro imprimé et page où il tombe ; « Monter d'un rang », « Descendre d'un rang », « Placer après le n° … » ; les numéros entre lesquels le passage peut aller, dans son groupe de mélange ; « Commencer sur une nouvelle page ». Départ, numéro fixé, ouverture en tête de groupe : une phrase dit pourquoi le passage garde son rang. Refus expliqué sur place. Récit classique : la seule nouvelle page, et un renvoi vers le plan. |
| Passage suggéré | Trois candidats au plus, côte à côte, le plus haut d'abord : numéro sur une page miniature, titre, hauteur et blanc restant, « Placer ici ». Le blanc se dit en millimètres partout, sur la page comme dans la barre. Après validation : « Passé du n° 28 au n° 22 », avec « Annuler ». Sans candidat, une phrase dit pourquoi et propose d'ouvrir la scène ; un blanc situé dans un passage dit son issue (« Réduisez son image, ou laissez-le. »). Récit classique : pas de suggestion. |
| Pages du livre | Ordre fixe, récit en page de droite avec une page blanche si nécessaire, feuille poursuivie sur une seconde page sans couper une section. Bas de page du récit : rien, numéro de page à l'extérieur, ou dés en page de droite seulement. Image pleine page seule sur sa page ; les choix qui la suivent ouvrent la page d'après. |
| La mise en page me convient | Au bout de la barre des volets : un bouton principal, sa conséquence derrière une icône d'information. Faite, la barre dit « Mise en page terminée », propose « Reprendre » et le bouton « Imprimer et partager ». |
| Imprimer et partager | Deux volets. « Imprimer » : « Le livre est prêt », un bouton principal « Créer le PDF définitif… » (« Demander le PDF définitif » jusqu'à la passe de cohérence) ; PDF à jour, l'écran dit « Le livre est fait », « Télécharger le PDF définitif » devient le bouton principal, et « Et maintenant ? » donne la suite en trois lignes : préparer la couverture chez l'imprimeur, lui envoyer les fichiers, partager le livre en ligne si on le souhaite (ou « Livre partagé », coché) ; les PDF conservés, la couverture chez l'imprimeur. Si un problème réapparaît, l'étape reste ouverte et chaque raison mène à son temps, avec les mots de la ligne d'étapes ; le panneau du PDF refusé les reprend, étape par étape. « Partager » : l'écran du partage, simplifié le 4 octobre (voir « Partage et lecteur en ligne »). |
| Exports | Demandes de PDF dans une feuille latérale. PDF de travail, demandé depuis « Relire » : contenu décrit, miniatures de la page récapitulative et d'une page marquée, instantané daté. PDF définitif refusé : liste des problèmes par nature avec accès direct, aucune commande d'ignorance, repli vers un PDF de travail. PDF définitif possible : vérifications cochées, avertissements rappelés, puis fichier daté et inchangeable. Volet « Imprimer » de l'étape d'arrivée : état du PDF définitif, PDF définitifs conservés, aide à la couverture chez l'imprimeur. |
| Préparation | Rubrique « Phrases de choix », en pleine largeur : formule de renvoi, constructions, marque de fin, chacune avec son exemple. Dans « Objets et formules », deux parties repliées : « Feuille d'aventure du lecteur » et « Règles du jeu ». |
| Récit classique | Deux temps et l'arrivée, numérotés 1 à 3. « Tester la lecture » est à « Relire ». Ni rubrique « Phrases de choix », ni réorganisation des passages, ni passage suggéré. |
| Lecture d'essai | Page dédiée, fond à la teinte du chapitre du passage lu (on voit qu'on change de chapitre). Texte courant en Vollkorn sur une page blanche ; choix en boutons Vollkorn ; énigme par un bouton pointillé distinct, en Atkinson. Parcours numéroté à droite, chaque étape permettant d'y revenir ; Passage précédent, Recommencer, Quitter. Adulte : départ ou scène au choix, état et accès à la scène. Élève : départ parmi ses chapitres ; une sortie de périmètre affiche « La suite se trouve dans un chapitre que tu découvriras plus tard », sans titre ni marque de fin. Entrée depuis Mon travail. |
| 390 px | Les pastilles tiennent sur une ligne ; seule l'étape en cours garde son nom, la marque des autres se pose sur leur pastille. Aux deux premières étapes, les tâches se lisent en liste, la tâche en cours dessous. À « Mettre en page », la déclaration tient sur une ligne au-dessus des deux onglets ; au défilement, seuls les onglets restent en vue. Les réglages reviennent à une colonne. L'écran d'étape fermée garde ses marges. |
| 390 px, scène ouverte | La scène et le livre ne tiennent pas côte à côte : deux onglets, « Scène S014 » et « Dans le livre », passent de l'une à l'autre ; l'aperçu reste composé pendant qu'on écrit. Les réglages passent sur une colonne. |

**Décidé par le porteur, 3 octobre 2026 :** les deux annulations restent
distinctes ; les extraits des scènes voisines ne sont pas affichés dans le
tiroir ; les renvois de l'aperçu se suivent d'un clic. Ce dernier point est consigné en
F11.2 ; la portée de l'annulation reste une question ouverte de F11.2.

**Décidé par le porteur, 3 octobre 2026 :** ordre des étapes sans
passe-droit et étape ouverte qui ne se referme pas ; tâches ; seuls les
jugements se posent à la main ; « Relire » renvoie au Suivi ; déclaration
« prête » dans la scène ; aide à l'ouverture d'une étape ; libellé
« Réordonner les passages » ; réglages de mise en page dans « Mettre en
page » seulement ; pages de présentation en dernière tâche ; copie datée du
partage conservée. Tout est consigné en F09.2, F11.1, F11.5, F11.6 et F12.1.

**Décidé par le porteur, 4 octobre 2026, après la seconde critique :**
défauts d'image à « Relire » ; colonne à côté de l'aperçu aux deux premières
étapes, pleine largeur à « Mettre en page », sans accordéon nulle part ;
ligne d'étapes sans détail ; messages
courts ; retour depuis une scène ouverte ; case « Ne plus afficher » ; doute
sur l'ordre des passages ; « Exclure du livre » dans le menu de la scène ;
contrôles d'écriture reportés pour une scène à finir ; seuil d'une page peu
remplie proposé à un quart.

**Confirmé par le porteur après la troisième critique, 4 octobre 2026 :**
le sablier, et non un triangle, quand il ne reste que des scènes à finir ;
la case « Ne plus afficher » décochée au départ ; le doute sur l'ordre
déclenché dès qu'un passage change de page, et levé seulement par
l'adulte ; les déclarations gardées quand une scène est rouverte ; les noms
affichés repliés dans le partage. Le seuil d'un quart pour une page peu
remplie reste une proposition, à régler sur un vrai livre.

**Choix à confirmer.** Ils viennent des conceptions successives ; aucun n'est une décision.

**Conception du 30 septembre :** la page récapitulative du PDF de
travail est représentée à l'écran par le rail des contrôles, avec le même
contenu ; une scène exclue ouverte pendant la lecture d'essai de l'adulte
porte la mention « Hors du livre », conformément à la proposition non
arbitrée de F09.1, signalée comme telle dans la maquette.

**Scène ouverte et mise en page depuis l'aperçu, 3 octobre :** la dernière action de
l'aperçu reste annulable tant que l'adulte ne quitte pas la destination Livre
et qu'aucune autre ne l'a remplacée, même après l'ouverture d'un autre
passage (le porteur laisse ce choix à la conception) ; « Tout annuler » ne
défait pas un déplacement ; le parcours des problèmes ne passe pas par les
points « à savoir » ; la dernière page du récit n'est pas comptée parmi les
pages peu remplies, le blanc qui précède une image pleine page l'est ;
largeurs proposées de 40, 65 et 100 % ; un élève voit l'image en bloc sans
pouvoir la déplacer ni la retirer ; aucune marge maximale n'est fixée.

**Livre en étapes, 3 et 4 octobre :** dans la colonne,
la liste des tâches fixe en haut et la tâche en cours dessous, plutôt qu'un
accordéon ; les points
« à savoir » repliés au pied de la fiche ; le compteur « À traiter » de
l'aperçu, qui ne compte que les points à corriger ou à confirmer de l'étape.

**Reprise en deux volets, 4 octobre :** une tâche vide n'est
cochée que lorsqu'il ne reste plus de scène à finir, et dit « Rien pour
l'instant » sinon ; « Vérifier les chemins » porte le sablier, et non rien,
tant qu'elle attend l'écriture ; « Voir l'aperçu » au pied des réglages ;
sur téléphone, la déclaration quitte l'écran au défilement, les deux
onglets restant en vue ; le blanc d'une page se dit en millimètres.

**Coût accepté :** police, taille et marges ne se règlent qu'une fois
« Mettre en page » ouverte.

**Vérifications et limites, état actuel (4 octobre) :** vues contrôlées en 1 440 et 390 px, sans
erreur de console. Rejoués après la troisième critique : passage de
parties 2 et 3 réunies puis séparées par leur interrupteur ; « Réglages »
à « Aperçu » et retour, chaque volet retrouvant sa position
(520 px et 2 400 px à l'essai) ; page peu remplie et passages suggérés dans
l'aperçu ; doute levé par « Garder cet ordre », la coche de l'étape
revenant ; septembre sans triangle ; tâches vides gardées. Limites : les
captures 111 et 126 montrent 28 et 27 pages, parce qu'elles règlent la
taille « Grande » pour faire paraître un blanc, quand les autres en
montrent 23 ; le refus du PDF définitif garde un bouton « Créer le PDF
définitif… » sous « pas encore possible », que le partage n'a plus. Rejoués
le 4 octobre, avant cette reprise : changement de tâche sans
déplacement de la fiche, bulle d'information gardée ouverte puis fermée par
Échap, doute déclenché par un changement de taille puis levé, « C'est
voulu » à « Relire », scène ouverte depuis « Vérifier les chemins » puis
refermée sur la liste et l'aperçu, Suivi filtré, page de scène et retour. La page de scène ouverte depuis le livre montre désormais le texte et l'état
que le livre compte, comme ses scènes voisines. Limites de
la reprise : le rappel avant « Déclarer
prête » est esquissé, sa forme reste à concevoir ; la bulle d'information
recouvre parfois le réglage qu'elle explique ; sur téléphone, les passages
suggérés prennent une grande part de l'écran. Rejoués le 3 octobre : étape
fermée et retour au temps concerné, aide
à la première ouverture, « C'est voulu » puis « Revoir », enchaînement des
tâches de « Mettre en page », déclaration puis ouverture de l'arrivée, scène
rouverte sur un livre partagé, filtre du Suivi. Sont simulés : la
réorganisation des passages, que la maquette ne calcule pas ; les hauteurs
des passages suggérés ; le doute sur l'ordre, que la maquette déclenche à
tout changement de police, de taille, d'alignement ou de marge. Les captures
de la destination Livre ont été refaites le 4 octobre, puis une seconde
fois après la troisième critique (45 captures, dont les scènes ouvertes à
côté de l'aperçu, pour l'heure de l'aperçu) ; 29, 91, 92, 112, 139 et
l'ancienne 121 (page « Réglages du livre ») sont supprimées ; 135 montre le
volet « Réglages » entier, 152 le volet « Aperçu », 121 et 133 ces deux
volets en 390 px ; 147 (bulle
d'information), 148 (ordre à confirmer), 149 (menu de la scène), 150 (page
de scène et retour), 151 (« À confirmer » à « Relire »), 153 et 154 (déclarations des
deux premières étapes), 155 (déclaration en attente) et 156 (livre fait et
partagé) sont ajoutées ; les captures du partage (35 à 42, 53, 54, 117)
sont refaites.
Restent à concevoir : les textes définitifs des écrans d'aide, la commande
pour fixer un numéro. Le rappel avant « prête » est proposé dans la page de
scène reprise.

**Vérifications et limites, scène ouverte et mise en page depuis l'aperçu (3 octobre) :** vues contrôlées en 1 440 et 390 px, sans
erreur de console ni débordement horizontal. Rejoués dans l'aperçu local :
texte ajouté dans le tiroir puis retrouvé dans les pages, passage monté,
« placer après le n° 2 » et ses refus, nouvelle page, les deux annulations,
image descendue d'un bloc puis réduite, « Tout annuler », parcours des
problèmes avec « Marquer comme fin », page peu remplie visée, marge refusée.
Sont simulés : le délai de l'aperçu (environ 2,5 s après une frappe, 1,5 s
après une commande), sans valeur de mesure ; l'heure d'enregistrement ;
l'import d'une image ; la feuille d'aventure en image, dessinée pour l'essai.
La maquette ne tient pas les règles de coupure de F11.3 (veuves, orphelines,
césure restreinte) et coupe encore les passages entre paragraphes : le seuil
des pages peu remplies n'y a donc pas valeur d'essai. Dans le livre, les
phrases de choix restent rassemblées à la fin du passage. Les « ajustements
manuels » ne sont plus listés à l'écran, ni les déplacements faits
depuis l'aperçu. Les captures 103 à 111 sont prises avec `cadre=1`, qui
reproduit la fenêtre après le défilement automatique : le navigateur sans
écran ne capture pas une page défilée. Les captures du livre, du partage et
des premières pages du lecteur (24, 26 à 30, 33, 35 à 44, 48, 53, 54, 91 à
93, 102) ont été refaites. Restent à concevoir : la commande pour fixer un
numéro, la pose d'une image depuis la barre, l'image en ligne, et le tiroir
sur une fenêtre de moins de 700 px de haut.

**Vérifications et limites (30 septembre) :** vues contrôlées en 1 440 et 390 px, sans
erreur de console ; correction de « s'épaissi » depuis l'aperçu, refus puis
obtention du PDF définitif, signal « le livre a changé », regroupement de
parties et sortie de périmètre rejoués. La composition est calculée par le
navigateur à largeur fixe puis mise à l'échelle, pour que les coupures ne
dépendent pas de l'écran ; elle coupe les passages entre paragraphes
seulement et ne vaut pas moteur PDF. Restent à concevoir : le choix de la scène d'ouverture, la commande pour fixer
un numéro, l'accès des élèves à l'aperçu et la présentation d'une destination
absente pendant le test.

**Reprises successives.** Ce qui précède décrit l'état actuel ; les paragraphes qui suivent gardent la trace de ce qu'il a remplacé et de ses motifs.

**Première version, 30 septembre :** dispositions proposées le 30 septembre 2026 pour le parcours
validé de [F09](specifications.md#f09--test-de-lecture-et-cohérence-du-récit)
et [F11](specifications.md#f11--composition-et-préparation-du-livre), avec
[F05.1](specifications.md#f051--liaisons-cachées-par-énigme) et les placements
d'images de [F10](specifications.md#f10--illustrations). Elles ne tranchent
aucune question ouverte de ces sections. Pour éprouver les cas, le scénario
compte désormais 40 scènes, dont une énigme (S055 → S062, n° 38 fixé).

**Mise en page depuis l'aperçu, 3 octobre :** dispositions proposées le 3 octobre 2026 pour les décisions du
même jour en [F10](specifications.md#f10--illustrations),
[F11.2](specifications.md#f112--pdf-de-travail-et-pdf-définitif) à
[F11.5](specifications.md#f115--ordre-imprimé-et-numérotation-du-récit-à-choix)
et [F12.1](specifications.md#f121--partager-une-version-du-récit). Elles ne
créent aucune règle. La correction sur place du 30 septembre est retirée de
la maquette. Le porteur valide le 3 octobre l'écran de la scène ouverte à
côté de l'aperçu ; les autres écrans attendent son retour. Pour éprouver les
cas, le scénario reçoit une image pleine page (S026) et, sur demande, une
feuille de cinq sections.

**Destination Livre mise à jour le 3 octobre 2026 :** sur instruction du
porteur, les écrans des décisions du même jour (F10, F11.2 à F11.5, F12.1)
sont ajoutés à la maquette de synthèse ; voir
« Mise en page depuis l'aperçu », aujourd'hui fondue dans cette section.
Ce sont des dispositions proposées. Le porteur valide le même jour l'écran de
la scène ouverte à côté de l'aperçu, après examen de ses captures ; les
autres écrans n'ont pas encore reçu son retour.

**Repris le 3 octobre 2026 :** ces écrans proposaient tout à tout moment.
Leur répartition entre les temps du livre est décrite dans
« Le livre en étapes », aujourd'hui fondue dans cette section.

**Livre en étapes, 3 octobre 2026 :** sur instruction du porteur, la
destination Livre est reprise selon
[F11.6](specifications.md#f116--trois-temps-pour-préparer-le-livre) ; voir
« Le livre en étapes », aujourd'hui fondue dans cette section. Le porteur examine
une première version, la juge trop chargée et décide l'étape d'arrivée, le
PDF de travail à la relecture seulement, les problèmes rangés par temps et la
coche. Il approuve ensuite la ligne d'étapes (« moins encombré ») et demande
l'avertissement et les blancs dans « Mettre en page ». Après examen de ce
temps, il préfère les réglages communs de mise en page dans « Réglages du
livre » plutôt qu'en volets étroits, et retire le nouveau mélange.

**Livre en étapes, statut de la section d'origine :** dispositions proposées pour le parcours guidé de
[F11.6](specifications.md#f116--trois-temps-pour-préparer-le-livre), avec
l'agencement de [F11.5](specifications.md#f115--ordre-imprimé-et-numérotation-du-récit-à-choix)
et le passage suggéré de [F11.3](specifications.md#f113--présentation-commune-du-livre).
Le porteur avait approuvé la ligne d'étapes d'une première version. Après une
critique d'ergonomie (25/40 aux heuristiques de Nielsen, 21/40 pour une
lecture indépendante des captures), il décide un parcours plus guidé :
étapes ouvertes dans l'ordre, tâches, avertissements acceptés, aide à
l'ouverture d'une étape, réglages répartis. Les écrans ci-dessous
appliquent ces décisions. Le porteur leur donne un retour favorable
d'ensemble le même jour (« plus agréable à lire »), sans validation
exhaustive de leurs détails, et demande deux ajustements, faits aussitôt :
les renvois se suivent d'un clic à toutes les étapes, et les tâches « Texte
et pages » et « Pages de début et de fin » prennent toute la largeur.
Après une seconde critique, la disposition est reprise le 4 octobre selon
les décisions du même jour, puis une seconde fois après la troisième
critique ; le tableau ci-dessous décrit ce dernier état, qui a reçu un
retour favorable d'ensemble du porteur, sans validation exhaustive.

**Constats de la critique, à l'origine de cette reprise :** en septembre, un
livre pas encore écrit était présenté comme fautif (« 55 points à corriger »,
« Exclure du livre » sous chaque scène vide) ; le rail listait un inventaire
sans première action ; cinq décomptes différents désignaient les mêmes
problèmes ; une scène vide apparaissait dans quatre listes ; l'ordre des
gestes de mise en page n'était écrit qu'en petits caractères ; « Réglages du
livre » tenait sur 3 650 px, loin de l'aperçu.

**Parcours guidé, 3 octobre 2026 :** le porteur juge ce parcours encore trop
peu clair pour qui découvre l'outil et demande une critique d'ergonomie.
Après discussion, il décide un parcours guidé, consigné en F11.6 : étapes
ouvertes dans l'ordre, tâches, avertissements acceptés, aide à l'ouverture
d'une étape, réglages répartis entre la préparation et « Mettre en page ».
La maquette est reprise le même jour ; le porteur donne à ces écrans un
retour favorable d'ensemble, sans validation exhaustive de leurs détails.

**Seconde critique et reprise, 4 octobre 2026 :** une seconde critique
d'ergonomie mesure la reprise (29/40 pour la lecture informée, 27/40 pour
une lecture indépendante des captures, contre 25 et 21). Le porteur décide
alors, en F09.2, F11.1 à F11.3, F11.5 et F11.6 : défauts d'image traités à
« Relire », tâches sans accordéon, ligne d'étapes allégée, messages courts, retour depuis une
scène ouverte, case « Ne plus afficher » de l'aide, doute sur l'ordre des
passages, « Exclure du livre » dans le menu de la scène. La maquette est
reprise le même jour. Après l'avoir vue, le porteur revient sur deux
points : « Vérifier les chemins » garde l'aperçu, qu'il avait d'abord
retiré, et les deux premières étapes reprennent la colonne à côté de
l'aperçu, la pleine largeur restant à « Mettre en page ». Il juge ces
changements bons dans l'ensemble, sans validation exhaustive, puis
demande : des onglets posés sur le fond à « Mettre en page », une
déclaration de l'adulte pour terminer chacune des deux premières étapes, un
onglet Partage simplifié sans changement de F12.1, et une fin de parcours
qui dit que le livre est fait et donne la suite.

**Troisième critique, 4 octobre 2026 :** les deux lectures rendent les
notes de la deuxième, heuristique par heuristique (29/40 et 27/40) :
l'échelle ne distingue plus rien, et la suite recommandée est un essai par
une personne qui découvre l'outil. Le porteur confirme les choix restés en
proposition et retient cinq améliorations, puis décide, sur sa propre
idée, de ramener « Mettre en page » à deux volets, « Réglages » et
« Aperçu » ; tout est consigné en
[F11.6](specifications.md#f116--trois-temps-pour-préparer-le-livre). La
maquette et ses captures sont reprises le même jour (voir le tableau de
cette section). Le porteur leur donne un retour favorable d'ensemble (« c'est
bien »), sans validation exhaustive de leurs détails, et demande un dernier
point, fait aussitôt : remplacer « Voir l'ordre actuel », qu'il ne comprend
pas, par une explication du mélange et un moyen plus simple de réunir des
parties. Il juge le résultat « beaucoup plus compréhensible » et garde
l'interrupteur sans confirmation préalable.

**Repris dans la maquette le même jour :**

- « Les numéros changent, les renvois suivent. » ; un seul libellé,
  « Garder cet ordre », à la place de « L'ordre me convient encore ».
- Le Suivi filtré et l'écran d'étape fermée nomment les deux issues : finir
  la scène ou l'exclure du livre.
- Une tâche où il n'y a rien à faire reste affichée, cochée ; la liste ne
  change plus d'une visite à l'autre.
- Pas de triangle sur « Vérifier les chemins » tant qu'il reste des scènes
  à finir et rien à corriger.
- « Garder ainsi » pour une image peu définie ; « Sa seule suite est une
  énigme. » partout où l'écran disait « Sortie non assurée » ; une issue
  dite pour un blanc situé à l'intérieur d'un passage.
- L'heure de l'aperçu accordée entre la barre et le pied des pages, à
  chaque moment simulé.
- « Mettre en page » en deux volets, « Réglages » et « Aperçu », décidés par
  le porteur sur sa propre idée ; le bouton d'aller-retour est retiré.

**Dispositions remplacées, gardées pour mémoire :**

- **Destination Livre :** Dans l'en-tête de projet. Depuis le 3 octobre, une seule ligne d'étapes remplace le bandeau « Livre intérieur » et les onglets.
- **Contrôles :** Remplacé par la fiche de l'étape et ses tâches (voir le tableau de cette section). À l'origine, un rail à gauche des pages, au nom du temps en cours : bilan en une phrase, commandes du temps, puis « À corriger avant le PDF définitif », « À vérifier, sans blocage », « À savoir », groupés par nature avec compteur, pour les seuls problèmes de ce temps. Chaque point nomme la scène et propose Voir au n° (défilement vers le passage), Ouvrir la scène et, lorsqu'elle existe, l'action explicite de l'adulte (réintégrer, exclure, marquer comme fin). Rien n'est corrigé automatiquement. Repliable sur téléphone.
- **Composition (répartie le 3 octobre entre la préparation et « Mettre en page ») :** Ordre des passages : d'abord un ruban d'une case par numéro, à la couleur de son chapitre, avec un bouton entre deux parties pour les mélanger ; retiré le 4 octobre au profit d'une liste des parties et d'un interrupteur nommé (voir le tableau de cette section). Ajustements manuels listés, avec ceux non appliqués. Titres de partie et scènes d'ouverture, formule de renvoi (trois cartes avec exemple), marque de fin, pages de présentation en vignettes A5 (titre, auteurs, « Comment lire ce livre », feuille d'aventure, fin), police, taille et alignement, puis « Pages du récit » : bas de page et marges.

### Partage et lecteur en ligne

**Statut :** dispositions proposées le 1er octobre 2026, avec un retour
favorable d'ensemble du porteur le même jour, pour le parcours validé de [F12.1](specifications.md#f121--partager-une-version-du-récit) et
[F12.3](specifications.md#f123--lecture-des-anciens-livres-par-les-autres-classes).
Elles ne créent aucune règle et ne tranchent rien de F12.2 ni de F14 (durée
d'hébergement, lien après la fin d'une offre, conservation des versions,
gratuité). Même scénario de 40 scènes ;
l'avertissement « sortie non assurée » de F09.2 est ajouté aux contrôles du
livre, où S055 le déclenche.

**Onglet Partage simplifié, 4 octobre 2026 :** le porteur le juge « beaucoup
trop compliqué ». Les règles de F12.1 ne changent pas ; l'écran, si. Ce
paragraphe prévaut sur la description de l'onglet dans le tableau
ci-dessous.

- **État :** une phrase, son explication derrière une icône d'information.
  « Mettre à jour le partage » n'est proposé que si la mise à jour est
  possible ; sinon l'écran dit « Mise à jour impossible pour l'instant » et
  donne la raison, avec un lien vers l'étape où elle se traite. Une
  première version montrait un bouton d'apparence active, refusé au clic.
- **Qui peut lire :** deux lignes, « Par un lien » et « À mes classes »,
  chacune avec une phrase et son interrupteur ; le lien, « Copier » et
  « Ouvrir » n'apparaissent qu'une fois activé.
- **Noms affichés :** repliés en une ligne, « Comme dans le livre »,
  avec « Modifier » ; ouverts, ils montrent la ligne de classe et la page
  des auteurs.
- **À côté :** la première page vue par le lecteur, « Prévisualiser », et
  une ligne, « Le partage ne montre jamais le travail de la classe ».
- **Retirés de l'écran :** les paragraphes d'introduction, la carte « Titre
  et sous-titre toujours affichés », la note sur les points à cadrer avec
  l'offre, qui est une note de projet et reste dans les spécifications.
- **Feuille de partage :** le rappel à cocher est gardé tel quel ; la liste
  des vérifications réussies est retirée ; un refus est rangé par étape,
  comme pour le PDF définitif.

Dans l'état partagé, noms repliés, l'écran compte environ 130 mots.

**Aucun objet ajouté au système.** Côté adulte, le partage reprend la fiche à
filet, les réglages et la feuille latérale du livre ; les trois niveaux de
signalement gardent leur rôle (brique : refus, ambre : à vérifier ou à
confirmer). Le lecteur en ligne étend la page blanche du livre à tout
l'écran, en Vollkorn, avec l'ornement de la page de titre et le filet de la
marque de fin. Il se distingue ainsi de la lecture d'essai (barre de
l'application, bureau à la teinte du chapitre, références et tampons) et de
l'aperçu (pages A5 marquées « Version de travail ») : ni barre d'application,
ni couleur de chapitre, ni référence, ni titre de travail.

| Situation | Disposition proposée |
| --- | --- |
| Partage | Volet « Partager » de l'étape « Imprimer et partager » (quatrième onglet de la destination Livre jusqu'au 3 octobre). Fiche « Version partagée » : état en une phrase (pas partagé et pourquoi, à jour, « le livre a changé depuis la version partagée », retiré), puis une ligne disant si cette version et le dernier PDF définitif portent sur le même état. La même phrase, abrégée, figure dans le bandeau « Livre intérieur » sur tous les onglets. |
| Canaux | « Qui peut lire » : lien de lecture et lecture par mes classes, chacun avec son interrupteur, désactivé par défaut et indépendant. Lien actif : adresse, Copier, Ouvrir, rappel qu'il est transmissible et non indexé sans être secret. Classes : classes en cours concernées, renvoi vers « Lectures ». En mode personnel, seul le lien est proposé. |
| Auteurs | « Ce que les lecteurs voient des auteurs » : titre et sous-titre toujours affichés ; ligne « classe ou auteur, année » et page des auteurs affichées par défaut, comme dans le livre, depuis le 3 octobre 2026 ; chacune peut être retirée ou recevoir un texte propre au partage, avec le rappel de la mention imprimée. À droite, la première page vue par le lecteur se met à jour pendant la saisie. Un réglage modifié après le partage s'applique à la prochaine mise à jour, et l'état le dit. |
| Auteurs, précisions du 3 octobre | Ligne de classe et page des auteurs affichées par défaut, « comme dans le livre », chacune avec son interrupteur et son texte propre au partage ; rappel du lien transmissible toujours affiché. Page des auteurs en image : affichée telle quelle, le retrait porte sur la page entière. Sans page des auteurs dans le livre, la ligne le dit et ne propose rien. |
| Partage refusé | Feuille latérale : problèmes bloquants par nature avec accès aux scènes, aucune commande d'ignorance, rappel qu'un PDF définitif n'est pas exigé et que les avertissements d'impression ne bloquent pas. |
| Partage possible | Feuille latérale : conditions vérifiées, avertissement « sortie non assurée » rappelé avec la scène, résumé (contenu daté, lecteurs, auteurs), puis fiche « À relire avant de partager » à cocher ; le bouton reste inactif jusque-là. Prévisualiser d'abord reste possible. |
| Mise à jour | Même feuille : contenu remplacé sous le même lien. Refusée : « Rien ne change pour les lecteurs », motif nommé (scène rouverte, élève qui reprend). |
| Retrait et changement de lien | Confirmations sur place, sans fenêtre : effets décrits avant l'action. L'ancien lien reste listé avec un accès à sa page neutre. |
| Prévisualisation | Le même lecteur, précédé d'un bandeau « Prévisualisation » et d'un retour au partage ; rien n'est partagé. |
| Lecteur, récit à choix | Barre fine : titre du livre, Comment lire, Parcours. Numéro du passage en petit, centré entre deux filets ; titre de partie au-dessus de la scène d'ouverture. Phrases de choix du livre en lignes italiques séparées par des filets, activables en entier ; dans une phrase à plusieurs renvois, chaque numéro est une pastille activable. Fin : marque de fin, Recommencer, puis page des auteurs et page de fin si elles sont partagées. |
| Lecteur, récit classique | Un chapitre par écran, scènes séparées par les trois points du livre, Sommaire, chapitre suivant et précédent. |
| Page neutre | « Ce livre n'est plus partagé », sans titre, classe ni auteurs, y compris dans le titre de l'onglet du navigateur. |
| Lectures (élève) | Entrée « Lectures » dans la barre de l'élève, à côté de « Mon travail ». Les livres proposés sont des objets-livres typographiques ; celui de la classe porte « Écrit par ta classe ». Un renvoi vers « Tester la lecture » distingue la lecture plaisir du playtest. Ouvre le même lecteur, avec un retour vers « Lectures ». |

**Présentation du lecteur arbitrée le 1er octobre 2026**, selon
[F12.1](specifications.md#f121--partager-une-version-du-récit) : retour en
arrière libre, reprise d'une lecture interrompue, « Comment lire ce livre »
propre à l'écran et non modifiable, choix affichés comme dans le livre selon
[F05](specifications.md#f05--retrouver-les-scènes-et-relier-les-choix), un chapitre par écran et pas de marque de fin en récit classique,
rappel à chaque activation d'un canal. Dispositions retenues pour les montrer :

- **Parcours :** liste des passages lus, par numéro et premiers mots, jamais
  par titre de travail ; chacun permet d'y revenir. « Revenir au passage
  précédent » figure sous chaque passage.
- **Reprise :** la première page propose « Continuer au passage n »
  (« Reprendre au passage n » jusqu'à la passe de cohérence) ou
  « Recommencer au début », et dit où la lecture est retenue : sur l'appareil
  pour le lien, avec le prénom pour un élève identifié.
- **Phrases de choix :** la lecture d'essai et l'aperçu du livre montrent les
  mêmes phrases ; S051 porte l'exemple à deux renvois. Dans Composition, les
  constructions se cochent sous la formule de renvoi, chacune avec son exemple.
  La copie de la page de scène montre ces phrases à la suite du texte depuis
  le 1er octobre 2026. La saisie d'un choix, son panneau, le repère de liaison
  cachée et les blocs protégés sont proposés en
  [Choix dans la scène et blocs protégés](#choix-dans-la-scène-et-blocs-protégés).
- **Saisie d'une énigme :** encadré pointillé sous le texte, avec la clé de la
  lecture d'essai, un champ numérique et « Y aller ». Mauvaise réponse :
  message ambre sous le champ, qui reste rempli ; la solution n'est pas montrée.

**Vérifications et limites :** vues contrôlées en 1 440 et 390 px, sans
erreur de console ni débordement horizontal ; rejoués : partage refusé puis
obtenu, activation du second canal, mise à jour acceptée et refusée, retrait,
changement de lien, énigme avec 36, 12 puis 38, fin, lecture par Alice,
récit classique et mode personnel. Sont simulés : la non-indexation, la
mémorisation de la reprise et l'invalidation de l'ancien lien. Les captures
du livre et de l'espace élève concernées ont été refaites. Restent à
concevoir : le choix des classes une à une, le réglage des auteurs par
canal, l'état vide de « Lectures » au-delà de sa première esquisse et une
éventuelle illustration de cette page.

### Choix dans la scène et blocs protégés

**Statut :** dispositions proposées le 2 octobre 2026 pour le parcours validé
de [F05.2](specifications.md#f052--créer-et-modifier-un-choix-dans-la-scène)
et [F06.1](specifications.md#f061--attribution-des-chapitres-et-profils-de-participation),
avec un retour favorable d'ensemble du porteur le même jour. Elles ne créent
aucune règle. La note de
l'enseignant, retenue dans son principe mais non spécifiée, n'est pas dessinée.
Pour suivre les exemples des critères, Alice a le profil « écriture et
propositions » et Bilal « écriture et organisation » ; Sacha rédige l'énigme
de S055.

**Aucun objet ajouté au système ; un rôle précisé pour la marge.** La marge
rouge de la copie reçoit ce qui n'est jamais imprimé : un pictogramme dit la
nature du bloc (choix, bloc préparé), un crochet encadre le paragraphe
protégé, un « + » discret permet d'écrire entre deux blocs. La saisie et les
réglages d'un choix sont une fiche à filet canard, celui de la décision,
posée dans la copie à l'endroit concerné : ni fenêtre, ni colonne latérale,
qui passe au-dessus du texte sur tablette. Le rouge brique garde son rôle
(bloque le PDF définitif) pour le renvoi vide ; le pointillé et la clé de
l'énigme, déjà employés dans la lecture d'essai, désignent le lien caché.

| Situation | Disposition proposée |
| --- | --- |
| Copie en blocs | Le texte est une suite de paragraphes de récit et de phrases de choix, là où l'auteur les place. Une phrase de choix garde l'italique du livre entre deux filets ; à droite, dans la voix de l'outil, la référence stable de la destination. |
| Créer un choix | `/choix` (petit menu sous le curseur) ou le bouton « Choix » ouvrent la même fiche à l'endroit de l'insertion. Au-dessus, la phrase se compose en pointillé pendant la saisie. Deux champs : « Ce que fait le lecteur », puis « Où mène ce choix ? » avec trois issues en segments. Pied : action nommée selon l'issue, rappel des touches. |
| Scène existante | Recherche dans les titres, consignes et textes, filtre par chapitre (adulte) ou périmètre annoncé (élève), liste avec référence, titre, extrait trouvé, chapitre et numéro ; à droite, aperçu avant de confirmer : chapitre, état, consigne, début du texte, scènes qui y mènent déjà, mention « raccord » pour un autre chapitre. |
| Nouvelle scène | Titre proposé depuis le libellé, chapitre au choix de l'adulte. Après création, une ligne sous la phrase nomme la scène créée, rappelle que l'auteur reste dans sa scène et propose « Ajouter un autre choix » et « Annuler ». |
| À décider plus tard | Avertissement brique dans la fiche ; dans le texte, renvoi vide hachuré et repère « Sans destination ». |
| Réglages d'un choix | Activer la phrase l'entoure de canard et ouvre la fiche dessous : libellé (la phrase se recompose pendant la frappe), destination et « Changer… », forme de la phrase avec « Régénérer » si plusieurs constructions sont cochées et « Personnaliser », « Monter » et « Descendre », « Cacher ce choix (énigme) » pour l'adulte, « Supprimer ». |
| Phrase personnalisée | Le texte de la phrase devient saisissable sur place, numéros d'un seul bloc ; la fiche liste les renvois (destination, libellé facultatif, changer, retirer), « Insérer un renvoi à l'endroit du curseur » et, pour un seul renvoi, « Revenir à la phrase automatique ». Les confirmations (dernier renvoi, retour à l'automatique) s'affichent dans la fiche. |
| Suppression et annulation | Bandeau au pied de la copie : ce qui a été supprimé, le lien retiré, la scène conservée, et « Annuler ». Le même bandeau rend compte d'un choix déplacé, copié ou écarté d'un collage. |
| Lien caché | Forme « Lien caché (énigme) » dans la fiche de création, pour l'adulte seul : destination, puis numéro à garder ou à saisir, avec refus nommant la scène si le numéro est déjà fixé. Dans la copie, zone « Hors du récit · jamais imprimé » sous le texte : repère pointillé avec la destination et « n° 38 fixé » ; ses réglages proposent le numéro, « Proposer comme choix » et le retrait. |
| Élève, écriture et propositions | Ni bouton « Choix » ni `/choix`. Phrase de choix et paragraphe protégé portent un cadenas en marge et une légende courte ; le curseur n'y entre pas, l'élève écrit avant, après et entre deux blocs. |
| Élève, écriture et organisation | Bouton « Choix », destinations limitées à son chapitre, pas de lien caché. Une phrase contenant un raccord reste préparée, avec « autre chapitre » pour seule indication. |
| Élève qui rédige l'énigme | Dans la zone hors récit : « Ton énigme doit conduire au numéro 38 », sans titre ni référence hors de son périmètre, sans commande. |
| Enseignant, paragraphe protégé | Bouton « Protéger » de la barre, qui devient « Retirer la protection » lorsque le curseur est dans un paragraphe protégé ; crochet et cadenas en marge, le paragraphe reste modifiable par l'adulte. Absent en mode personnel ; présent en récit classique. |

**Décision du porteur, 2 octobre 2026 — désigner l'enseignant :** aucun texte
adressé à l'élève ne dit « ta maîtresse » ni « ton maître » : l'adulte peut
être un homme, et le second degré n'emploie pas ces mots. Ces textes
emploient le nom que l'enseignant choisit d'afficher aux élèves et, à défaut,
« ton enseignant(e) », selon
[F01.1](specifications.md#f011--classes-années-et-éventuel-espace-école). La
maquette de synthèse emploie le nom affiché de son enseignante, « Mme
Laurent », depuis le 2 octobre 2026.

**Choix précisés pendant la conception, à confirmer :** le repère d'une
phrase de choix dit « Choix préparé : tu écris autour » plutôt que « préparé
par ta maîtresse », car un camarade au profil d'organisation peut en être
l'auteur ; la création d'un lien caché ne propose que des scènes existantes ;
« Proposer comme choix » reprend le libellé que portait le choix avant d'être
caché et, à défaut, en demande un ; un renvoi effacé au clavier dans une
phrase personnalisée est rétabli, le retrait passant par « Retirer ».

**Vérifications et limites :** vues contrôlées en 1 440 et 390 px, sans
erreur de console ; le seul débordement horizontal relevé vient de la barre
de présentation, hors produit. Rejoués : création par `/choix` au clavier
seul, choix inséré entre deux paragraphes, nouvelle scène, choix sans
destination, libellé corrigé, personnalisation et retour, choix caché puis
proposé, déplacement par « Monter », suppression et annulation ; le graphe
et le livre suivent. La maquette n'est pas le prototype de l'éditeur : les
paragraphes de récit s'écrivent par plages séparées par les blocs, si bien
que la sélection à cheval sur une phrase (F05-AC28) ne se joue pas ; le
presse-papiers est simulé depuis la barre de présentation (choix coupé ou
copié ailleurs, collé dans la scène ouverte). Le livre montre les phrases
automatiques et personnalisées de la scène, mais pas encore leur place entre
deux paragraphes. Restent à concevoir : les liens cachés dans le graphe, la
scène « à vérifier » dans les contrôles du livre après un changement de
numéro fixé, et la note de l'enseignant une fois spécifiée.

### Scènes voisines dans la page de scène

**Statut :** dispositions proposées le 2 octobre 2026, sur instruction du
porteur, pour [F04.3](specifications.md#f043--aperçu-des-scènes-voisines-pendant-lécriture) ;
elles ne créent aucune règle et n'ont pas encore reçu son retour.

**Aucun objet ajouté.** Les extraits prolongent la copie : même feuille, même
marge rouge qui se poursuit, mais sur le papier grisé des surfaces
secondaires, en Vollkorn plus petit et en graphite adouci, séparés du texte
par un pointillé. On lit ainsi d'une traite la fin de la scène précédente, sa
propre scène, puis le début de la suivante, sans confondre ce qu'on écrit et
ce qu'on consulte.

| Situation | Disposition proposée |
| --- | --- |
| Case | « Scènes voisines » dans la barre de la copie, cochée par défaut ; un message rappelle que le réglage vaut pour toutes les scènes de la personne. Absente lorsqu'une scène n'a aucune voisine. |
| Juste avant | Au-dessus du texte : ligne d'outil « Juste avant », onglets ou nom de la scène, tampon d'état et « Ouvrir » ; puis « […] », le dernier paragraphe et, en italique, la phrase de choix qui mène ici avec son numéro. |
| Juste après | Sous le texte : le premier paragraphe, « […] » s'il y en a d'autres, puis la ligne d'outil en dessous, avec les onglets et « si le lecteur choisit « … » », pour que rien ne sépare l'extrait du texte. |
| Plusieurs voisines | Onglets nommés par la référence et le lieu ; la première voisine rédigée est affichée. |
| Voisine vide | Une ligne : référence, titre, « pas encore écrite ». |
| Élève, autre chapitre | Une ligne « Autre chapitre » avec le titre public du chapitre, sans extrait ni lien. |
| Récit classique | Scène précédente et suivante du plan, sans phrase de choix. |

**Vérifications et limites :** vues contrôlées en 1 440 et 390 px ; la
préférence est simulée en mémoire, par personne. Les extraits ne sont pas
affichés pendant la consultation d'une remise, question laissée ouverte en
F04.3. Les captures de la page de scène (12 à 15, 20, 61 à 76) ont été
refaites avec la case cochée, qui est son état par défaut.

### Objets, feuille d'aventure, actions de jeu et dé

**Statut :** dispositions proposées le 2 octobre 2026, sur instruction du
porteur, pour [F04.2](specifications.md#f042--objets-de-lhistoire), avec les
blocs protégés de [F06.1](specifications.md#f061--attribution-des-chapitres-et-profils-de-participation),
les pages de présentation de [F11.4](specifications.md#f114--intérieur-du-livre-pages-de-présentation-et-couverture)
et le lecteur de [F12.1](specifications.md#f121--partager-une-version-du-récit).
Elles ne créent aucune règle et n'ont pas encore reçu le retour du porteur.
Le scénario devient un livre à points de volonté et objets : sept objets, six
formules, sept actions de jeu, une feuille à trois sections et un dé.

**Aucun objet ajouté au système.** L'action de jeu est un paragraphe encadré
d'un filet fin et précédé d'un crayon, en Vollkorn demi-gras et droit : la
même mise en valeur dans la copie, l'aperçu, le PDF, la lecture d'essai et le
lecteur en ligne, sans couleur, lisible en noir et blanc, distincte de
l'italique entre deux filets des phrases de choix. La feuille d'aventure est
une page du livre : imprimée après « Comment lire ce livre », puis sortie du
livre et posée à côté du texte dans le lecteur en ligne, avec les mêmes
titres en petites capitales et les mêmes lignes à remplir. Les listes de la
préparation gardent le filet rose des rubriques du carnet ; la fiche des
formules, qui crée un bloc, porte le filet canard de la décision.

| Situation | Disposition proposée |
| --- | --- |
| Commandes du texte | Taper « / » propose les commandes permises : Choix, Action de jeu, Objet. La barre de la copie porte « Action de jeu » pour qui en a le droit et « Objets » pour toute personne qui écrit, récit classique compris. |
| `/objet` et bouton « Objets » | Fiche volante près du curseur ou sous le bouton : recherche, noms en Vollkorn avec leur description, flèches et Entrée. Le nom s'écrit à l'endroit du curseur comme du texte ordinaire ; une ligne rappelle de corriger « de la clé », « sa clé ». Adulte : « Ajouter un objet à la liste » sans quitter la scène, puis lien vers la préparation. Élève : la même liste, sans ajout, avec « Liste tenue par Mme Laurent ». |
| `/action` et bouton « Action de jeu » | Fiche volante : « Paragraphe vide, à écrire », puis les formules. La formule retenue devient un paragraphe d'action placé après le paragraphe du curseur, modifiable sur place ; dans une formule à compléter, « … » est sélectionné. Adulte : « Ajouter une formule à la liste ». |
| Paragraphe d'action dans la copie | Encadré comme dans le livre, légende « Action de jeu » dans la voix de l'outil. Lorsqu'on y écrit, le cadre passe au canard et une rangée de commandes apparaît dessous : Formules…, Monter, Descendre, Protéger (enseignant), Supprimer. La suppression passe par le bandeau d'annulation de la copie. |
| Élève, écriture et propositions | Ni commande ni bouton d'action. Le paragraphe porte un cadenas en marge et « Action de jeu préparée : tu écris autour » ; le curseur n'y entre pas. Un collage qui en contient une colle le récit et l'écarte, avec un message. |
| Élève, écriture et organisation | Bouton, `/action` et formules ; pas d'ajout à la liste. Une action protégée par l'enseignant reste fermée, avec « Préparé par Mme Laurent ». |
| Préparation | Rubrique facultative « Objets et formules », sur toute la largeur du carnet : à gauche les objets (nom tel qu'il s'écrit, description, Modifier, ajout), à droite les formules montrées dans leur encadré. Le renommage rappelle que les textes écrits ne changent pas. Sans la rubrique : une invitation en pointillé. Récit classique : les objets seuls. |
| Livre, pages de présentation | « Comment lire ce livre » reçoit un second champ « Règles du jeu ». Une carte « Feuille d'aventure » s'ajoute à sa place d'impression, avec l'interrupteur « Dans le livre et en ligne ». |
| Composition de la feuille | La carte ouverte prend toute la largeur : à gauche les sections dans l'ordre (type, titre, puis compteurs avec nom et valeur de départ, ou nombre de lignes imprimées, ou cadre libre), ordre et retrait par boutons, « Ajouter une section » en trois boutons, puis « Dé de la feuille en ligne » : aucun, un ou deux. À droite, la page A5 se recompose pendant la saisie. |
| Page imprimée | Titre centré, sections titrées en petites capitales sur un filet : compteur avec « au départ : 5 » et une case à remplir, lignes pointillées, cadre ligné qui prend la place restante, et la mention « Écris au crayon : tu pourras gommer et rejouer. » |
| Lecteur, grand écran | La feuille est posée à droite du texte, ouverte par défaut et rangeable par « Feuille » dans la barre ; le texte reste centré dans la place restante. Compteur : nom, valeur en grand, « − » et « + » ronds, « − » inactif à zéro. Liste : lignes à écrire, une de plus dès qu'elles sont pleines, sans aucune suggestion. Notes sur papier ligné. |
| Dé | Dans la feuille : faces dessinées, « Lancer le dé », puis « Tu as fait 2 » ou « 3 et 5 : 8 en tout », et le rappel que le dé ne décide de rien. Les choix du passage restent tous activables. |
| Règles | « Règles » dans la barre et « Règles du jeu » au pied de la feuille mènent à « Comment lire ce livre », où les règles de l'adulte suivent le mode d'emploi de l'écran ; « Reprendre au passage n » y ramène, feuille inchangée. |
| Lecteur, 390 px | Barre fixe en bas : « Ma feuille » et le résumé « Volonté 4 · Inventaire 2 ». Elle ouvre une feuille basse couvrant l'écran aux quatre cinquièmes, avec « Ranger ». |
| Livre à choix seuls | Ni feuille, ni dé, ni règles : le lecteur garde sa présentation précédente. |

**Arbitrés par le porteur pendant la conception, le 2 octobre 2026**, et
consignés en F04.2 : aucun, un ou deux dés à six faces ; compteurs par « + »
et « − » avec plancher à zéro ; feuille imprimée après « Comment lire ce
livre ».

**Choix précisés pendant la conception, à confirmer :** sans curseur dans le
texte, le bouton place l'action après le dernier paragraphe de récit, avant
les phrases de choix ; la marge ne reçoit que le cadenas, l'encadré disant
déjà la nature du bloc ; la liste en ligne montre quatre lignes puis
s'allonge ; le nombre de lignes imprimées est un réglage de la section, de 3
à 14, huit dans l'exemple ; « Recommencer » remet la feuille à ses valeurs de
départ sans confirmation, et la première page le dit ; la mention « Écris au
crayon » fait partie du gabarit.

**Décidé après examen, le 2 octobre 2026 :** la lecture d'essai propose la
feuille et le dé, sous le parcours, sans conservation ; les extraits des
scènes voisines ne montrent pas les actions de jeu ; un rappel « Actions de
jeu sans feuille d'aventure » figure au niveau « À savoir » des contrôles du
livre et dans les demandes de PDF définitif et de partage, jamais dans la
scène. **Encore ouvert :** l'effet d'une feuille modifiée après un partage,
simulé par une remise à zéro.

**Vérifications et limites :** vues contrôlées en 1 440 et 390 px, sans
erreur de console. Rejoués dans l'aperçu local : « la lanterne sourde »
ajoutée par `/objet` depuis S051 et inscrite dans le texte, formule retenue
par `/action`, compteur arrêté à zéro, dé lancé, feuille conservée d'un
passage à l'autre, règles ouvertes puis retour au passage, feuille remise à
ses valeurs par « Recommencer ». La conservation de la feuille est simulée en
mémoire ; les protections n'ont aucun contrôle serveur ; le collage d'une
action est simulé depuis la barre de présentation. L'action de jeu se
corrige depuis l'aperçu par l'éditeur de la scène, depuis le 3 octobre 2026.
Les captures de la page de scène, du livre et du lecteur ont été refaites
avec ce scénario, celles de l'onglet Partage et des exports le 3 octobre
2026 ; la capture 16 date d'avant les blocs de la copie. Restent à concevoir : la rubrique dans
l'atelier projeté, une feuille plus longue qu'une page et les autres dés.

## Direction visuelle retenue et déclinaisons à préciser

**Décision confirmée :** une identité chaleureuse inspirée du livre, avec
une direction de carnet d'aventure illustré souhaitée par le porteur pour
les enfants. Les illustrations d'ambiance n'ont pas à correspondre à
l'histoire écrite. Une palette, des typographies et un style d'illustration
sont proposés dans la [maquette de synthèse](#maquette-de-synthèse), sans
être validés.

**Pistes exprimées par le porteur, à préciser :** varier les mondes illustrés ;
proposer un espace personnel plus sobre, éventuellement avec des images
d'aide, et un espace élève plus chaleureux et fantastique.

**Recommandation :** décliner la même identité selon l'espace adulte ou élève,
plutôt que selon le seul mode personnel/classe. L'enseignant bénéficie lui
aussi d'un environnement de travail sobre. Conserver les mêmes commandes,
couleurs fonctionnelles et repères ; renforcer l'illustration dans l'accueil
élève et l'alléger autour du texte et de la consigne. Réserver les images
informatives aux endroits où elles expliquent réellement une action.

**Recommandation sur les mondes :** une petite famille d'illustrations de
genres variés, partageant une même palette et une même manière de dessiner.
Les usages décoratifs doivent rester distincts de l'insertion d'une image
dans le livre, même si un fichier est réutilisé. Ne pas ajouter implicitement de sélecteur de thèmes, de génération
d'images à chaque connexion ou de changement aléatoire pendant l'écriture.
Les images de repérage propres au projet sont désormais retenues selon F10.1.
L'attrait pour les élèves devra être
évalué sur les maquettes ; il n'est pas démontré par le seul choix du fantastique.

## Images du projet et repérage

**Décision confirmée :** l'espace de travail peut reprendre des images
stables choisies par l'adulte pour reconnaître l'histoire, les parties et les chapitres,
avec un visuel par défaut. Les règles fonctionnelles de référence sont dans
[F10.1](specifications.md#f101--images-de-repérage-du-projet).

**Recommandation visuelle :** employer l'image choisie dans la vignette de
l'histoire ou du chapitre et, lorsque cela convient, dans un bandeau discret
de son espace de travail. Garder le titre lisible et stable, sans texte de
rédaction posé sur une illustration. Les illustrations génériques proposées
plus haut peuvent servir de repli lorsque le projet n'a pas d'image désignée.
Les maquettes devront montrer ce cas et celui d'une image importée de style
différent ; l'identité du produit doit rester cohérente dans les deux cas.

**Aide à l'illustration — présentation proposée :** conformément à
[F10.2](specifications.md#f102--aide-à-lillustration-par-prompts), prévoir
un bouton secondaire discret, par exemple « Idée d'illustration » avec une
petite icône, dans l'en-tête de la scène ou du chapitre. Il ouvre un panneau
repliable contenant l'idée, le style du projet et le prompt prêt à copier.
Le panneau est fermé par défaut, n'est jamais placé dans le flux du texte et
n'a pas le poids visuel des commandes de rédaction ou de relecture. Le choix
du style et le réglage d'absence du héros, activé par défaut, relèvent
des options du projet, près des images de repérage. Son
emplacement exact reste à éprouver sur la maquette.

**Décision confirmée — couleur de chapitre :** attribuer automatiquement
une couleur une seule fois à la création du chapitre, parmi une petite
palette prédéfinie, puis la conserver jusqu'au changement explicite par
l'adulte dans les options. Le choix initial peut être aléatoire ; il n'est
pas renouvelé à chaque visite. Appliquer une teinte légère au fond
environnant et au bandeau, en conservant des surfaces neutres pour la rédaction
et les consignes. Employer le même repère dans les vues où ce chapitre est
accessible. La couleur accompagne le titre et l'image ; elle ne représente
pas un état de validation et ne doit pas être le seul moyen d'identification.
Plusieurs chapitres peuvent partager une couleur ; son unicité n'est pas un
besoin établi. La première livraison limite le choix à la palette proposée.

Les contrastes devront être vérifiés sur les combinaisons réelles de texte,
commandes et fonds : une couleur très claire ne suffit pas à les garantir.
La couleur de l'espace de travail ne modifie pas la composition du livre.
La palette exacte et l'intensité seront examinées sur les maquettes.

**Critères d'acceptation de présentation :** étant donné un chapitre créé
sans réglage de couleur, lorsque l'utilisateur le quitte puis le rouvre,
alors sa couleur reste identique. Lorsque l'adulte choisit une autre couleur
de la palette, ce repère change dans les vues du chapitre sans changer ses
droits, son état de travail ni la composition du livre.

## Situations d'écran retenues

**Sélection confirmée :**

1. L'enseignant organise une partie et ses chapitres : scènes,
   consignes, attributions et prises en charge ; ce qui reste à préparer.
2. L'enseignant suit le travail et prépare la séance : vue générale et par
   élève, accès effectifs et sélection des fiches pour 25 élèves et 10 postes,
   avec travail papier possible. Le suivi se poursuit après cette première séance.
3. L'élève retrouve son travail après identification et ouvre une scène :
   chapitre accessible, consigne et espace de rédaction.
4. L’enseignant anime la préparation projetée, avec les questions de guidage,
   les échanges IA facultatifs et la synthèse des décisions de la classe.

Ces situations ne fixent ni le nombre de pages ni une étape obligatoire
d'ouverture du projet. Les règles d'accès relèvent de F06 dans les
[spécifications](specifications.md#f06--attributions-accès-et-organisation-de-lécriture).

**Cas à représenter avec les horaires confirmés :** dans les situations 2
et 3, distinguer un chapitre non attribué d'un travail attribué mais
momentanément inaccessible, avec l'horaire de reprise visible. La fin de plage
enregistre le texte en cours puis ferme l'accès selon F06.4 ; un incident
de sauvegarde doit rester visible. Recommandation : prévenir avant la fin de
plage, sans dialogue de prolongation ni nouvel état métier du projet.

La première situation doit éprouver une partie longue, une partie avec un
seul chapitre et des accès différents entre chapitres. La structure
confirmée et les règles sont en
[F03.1](specifications.md#f031--histoire-parties-chapitres-et-scènes).
Les blocs regroupés peuvent simplifier la navigation ; les écrans d'attribution
doivent toujours montrer explicitement le chapitre concerné.
La répartition initiale doit aussi représenter un élève prenant en charge
plusieurs scènes choisies, éventuellement liées, et retrouver cette sélection
dans le suivi. La commande exacte reste à concevoir selon F06.3 ; les repères
de prise en charge ne doivent pas faire croire à un verrou d'écriture.

**Préparation projetée confirmée :** une question principale lisible à distance,
des relances facultatives, la saisie par l'enseignant et la synthèse de ce que
la classe retient. Concevoir pour un écran dupliqué : aucun écran privé de
présentateur n'est requis, et les échanges IA peuvent être discutés à l'écran.
La préparation est unique et sa page accessible uniquement à l'enseignant,
qu'il la renseigne seul ou avec la classe. La projection ne crée pas d'accès
individuel pour les élèves. Les règles et les points ouverts sur le contexte IA et les détails
des chapitres sont en F02/F13.4, sans les dupliquer ici. La vue utilise les
mêmes données que le carnet et la progression reste souple.

**Plan commun et cartes :** la préparation et la page des parties et chapitres présentent
les mêmes parties et chapitres selon F02/F03.1. Les cartes conservent
leurs titres et images, y compris sans attribution ; leur aspect ne doit pas
faire croire que le contenu de travail est accessible. Le visuel par défaut
sert à l'absence d'image, pas à masquer les cartes non attribuées.

**Décision de présentation confirmée :** une seule page rassemble les cartes
des chapitres regroupées par partie ; les détails apparaissent à
l'activation, selon les droits de F03.1. La partie sert d'enveloppe visible,
sans imposer une page intermédiaire de sélection.

**Recommandation de disposition :** un titre de partie et son repère visuel
encadrent un groupe de cartes de chapitres, avec une action principale
claire par carte. Éviter de grandes cartes cliquables contenant d'autres
cartes cliquables : la cible et l'effet du clic deviendraient ambigus.
Le panneau, le dépliage ou la vue de détail restent à choisir sur les maquettes,
ainsi que la présentation de l'absence d'accès et l'activation au clavier.
Le résumé facultatif sert surtout au contexte IA selon F02. Côté élève,
recommandation : le rendre consultable dans le détail sans le placer devant
la consigne ou le texte ni l'afficher sur les cartes visibles de tous.
L'aide aux idées de parties est confirmée en F13.5 et porte sur ce même plan.

**Livrables :** les quatre situations, avec contenu fictif, un projet et un
chapitre vides et l'arrivée d'un élève sans attribution, sont dans la
[maquette de synthèse](#maquette-de-synthèse). Les interactions servent à
examiner la navigation ; les prototypes techniques restent un travail distinct.

## Affichage des scènes dans un chapitre

**Principe confirmé :** vue Scènes par défaut, Graphe complémentaire pour
les récits à choix, puis ouverture du même espace d'écriture. Les règles,
variantes, permissions et critères d'acceptation sont en
[F03.1](specifications.md#f031--histoire-parties-chapitres-et-scènes).

**Direction de présentation retenue :** cartes compactes centrées sur les
repères utiles au travail ; éviter les textes complets et grandes images
répétées sur chaque scène. Le bandeau, l'image et la teinte légère du chapitre
assurent l'ambiance, avec des surfaces neutres pour lire et écrire. Dans le
graphe, conserver les mêmes repères sur les nœuds et des liens dirigés lisibles.
L'éditeur doit laisser de la place à la consigne et au texte, avec un retour
clair au chapitre, sans petite fenêtre superposée au graphe.

**À éprouver sur les maquettes :** densité des cartes, contenant du détail,
placement des commandes et filtres, sélection de plusieurs scènes, navigation
sur petit écran et place éventuelle d'une navigation latérale ou du graphe
à côté du texte. La vue élargie à la partie reste à concevoir selon F03.1.
Ces détails ne sont pas validés par l'accord sur les deux vues.

**Situation à représenter :** dans « La lisière », six scènes dont trois
reliées sont réparties entre Alice et Bilal. Les cartes permettent de retrouver
les prises en charge ; le graphe explique le raccord et la convergence. Les
maquettes doivent rendre lisibles les prises en charge sans suggérer un verrou
d'écriture, selon F06.3, et respecter les limites d'accès dans les raccords.

La lisibilité et les performances d'un graphe chargé restent à éprouver ;
aucun placement automatique avancé n'est validé par cette décision.

## Noms des niveaux narratifs retenus

**Décision confirmée : histoire → parties → chapitres → scènes.** Le
[glossaire](../CONTEXT.md) définit chaque niveau. Les termes reprennent la
métaphore du livre : une partie regroupe et le chapitre constitue l'unité de
travail attribuée aux élèves. La profondeur et les permissions restent celles
de F03/F06 ; aucun niveau n'est ajouté. Cette dénomination n'impose pas de
titres imprimés dans le livre.

## Organisation des pages proposée

**Statut :** organisation proposée à partir des parcours acquis. Le suivi
par projet, la barre du haut globale, l'arrivée dans le dernier projet ouvert
(4 octobre 2026) et la distinction des deux filtres par élève sont confirmés ;
le reste du découpage demeure une proposition, hors éléments déjà validés
explicitement. Une page désigne ici une destination de
navigation ; les onglets, filtres ou panneaux ne fixent ni routes techniques
ni nombre de composants. Les règles de suivi sont en
[F06.5](specifications.md#f065--suivi-du-travail-et-accès-aux-scènes).

| Destination proposée côté adulte | Rôle et organisation |
| --- | --- |
| Mes projets | Retrouver et créer ses histoires personnelles ou de classe, en grandes cartes ; le dernier projet ouvert s'y reprend d'un clic, et son nom figure dans la barre du haut. « Nouveau projet » y crée un projet en trois questions ; sans projet, la page ne propose que « Créer mon premier projet ». |
| Mes classes | Gérer les classes annuelles ; détail de classe pour inscriptions, codes, informations de la classe, horaires et supports imprimés ; fin d'année. Maquetté le 6 octobre 2026. |
| Suivi | Onglet d'un projet : retrouver le travail de ce projet ; vues Scènes et Élèves, filtres selon F06.5. Il n'y a plus de suivi de tous les projets. |
| Préparation du projet | Carnet et atelier projeté utilisant les mêmes informations, sans document séparé. |
| Histoire | Page unique des cartes regroupées par partie ; détail du chapitre, organisation, attributions et accès aux scènes. |
| Scène | Même espace de travail pour préparer les consignes, écrire, relire et corriger, avec commandes adaptées au rôle et à l'état. Le contexte de la partie et du chapitre reste identifiable. |
| Livre | Tester la lecture, contrôler, prévisualiser et corriger, composer, exporter et partager ; découpage proposé en [Destination Livre et lecture d'essai](#destination-livre-et-lecture-dessai) et [Partage et lecteur en ligne](#partage-et-lecteur-en-ligne). |
| Lecteur en ligne | Hors de l'espace de travail : première page, passages ou chapitres, page neutre après retrait. Atteint par le lien de lecture sans compte, ou depuis « Lectures » pour un élève identifié. |

**Navigation, décidée le 4 octobre 2026 :** la barre du haut est globale et
porte le nom du dernier projet ouvert, « Mes projets » et « Mes classes » ;
les onglets Préparation, Parties et chapitres, Suivi et Livre sont ceux de
l'histoire.
Connecté, l'adulte arrive dans son dernier projet, à son dernier onglet. La scène s'ouvre depuis le
récit ou le suivi ; ce n'est pas un second éditeur. Les opérations de classe
ne deviennent pas des réglages propres à chaque histoire. Le mode personnel
n'affiche pas les commandes d'attribution ou de suivi d'élèves dans son projet.

**Côté élève, proposition :** une entrée Mon travail pour retrouver les
scènes autorisées et ses priorités ; accès à la page Histoire pour les cartes
regroupées, puis à la scène pour rédiger et reprendre un texte. L'élève
n'accède ni à la préparation adulte ni à la gestion de classe. La lecture
plaisir reste une destination distincte portant sur les versions terminées,
sans être confondue avec le playtest ou une liste de scènes à corriger ; la
maquette la propose comme entrée « Lectures » de la barre de l'élève.

**Regroupement confirmé pour le suivi :** À valider et À reprendre sont des
filtres, et « préparer la séance » désigne un usage du suivi, sans page
supplémentaire ni fiche pédagogique à remplir.

**Autres regroupements recommandés :** l'atelier est une présentation de la préparation ;
les chapitres se trouvent dans la page Histoire déjà retenue. Le graphe
complète l'organisation du récit. Les fiches s'impriment depuis une sélection
de scènes. Aucun de ces usages n'exige d'emblée une nouvelle entrée permanente.

Ce plan ne compte pas les autres parcours publics, la connexion, le compte et
l'offre commerciale, qui seront précisés dans leurs propres parcours. Les
quatre situations d'écran retenues restent prioritaires pour la conception ;
ce tableau n'autorise ni réalisation de toutes ces pages ni ajout de
fonctionnalités non arbitrées.

## Cohérence dans la durée et travail avec l'IA

Recommandation : définir un petit système de design comprenant couleurs par
usage, typographies, espacements, densités, icônes, composants réutilisables,
vocabulaire des actions et états de sauvegarde/erreur/chargement. Conserver
quelques références visuelles approuvées ; les nouvelles pages doivent reprendre
ces composants et être comparées visuellement aux références. Une couleur ou
un composant supplémentaire doit répondre à un besoin, sans réinventer chaque page.

Vérifier le résultat avec des contenus réalistes : chapitre chargé en scènes,
titre long, consigne et texte longs, projet vide, état interdit ou sauvegarde
en échec. Contrôler navigation au clavier, lisibilité, contrastes et affichage
sur les appareils retenus. Une base de composants ne garantit pas à elle seule
l'accessibilité ni la qualité de l'application assemblée.

## Outillage de conception retenu

Impeccable est installé dans le projet pour Claude Code le 30 septembre 2026,
avec son installateur officiel : skill 4.3.1 et moteur 0.1.5, dans
`.claude/skills/impeccable/`, et ses sous-agents de finition dans
`.claude/agents/`. Son hook de détection automatique n'est pas activé.
Son [SKILL.md](../../.claude/skills/impeccable/SKILL.md) et ses références
accompagnent la conception, la critique et la finition. L'adaptation à nos
documents canoniques est définie dans
[CLAUDE.md](../../CLAUDE.md#conception-visuelle-et-skills-de-design).
Aucun outil de génération d'images n'est disponible : les illustrations sont
générées par le porteur à partir de prompts fournis. Les autres skills de
design examinés restent des alternatives ou des compléments ultérieurs.

## Templates et composants

**Recommandation :** partir des composants shadcn/ui et d'une identité propre,
puis acheter des blocs ciblés si leur adaptation économise réellement du travail.
Un template marketing ne démontre pas son adéquation à un éditeur scolaire.
Comparer source accessible, documentation, compatibilité avec les dépendances
retenues, composants réellement utiles, mises à jour, licence applicable et coût
d'adaptation. Éviter d'assembler plusieurs systèmes concurrents sans nécessité.

**Repères vérifiés le 27 septembre 2026, sans sélection de fournisseur :**

- shadcn/ui fournit le code des composants modifiable et un thème par variables
  communes : [documentation](https://ui.shadcn.com/docs) et
  [thèmes](https://ui.shadcn.com/docs/theming). Ses
  [blocs officiels](https://ui.shadcn.com/blocks) sont proposés gratuitement.
- [Shadcnblocks](https://www.shadcnblocks.com/) propose des composants, blocs
  d'application et templates payants à examiner si un besoin concret le justifie.
  Ce constat n'est pas un audit de leur qualité, maintenance ou adéquation.

Une courte intervention de designer sur la direction artistique et quelques
écrans métier est une autre dépense possible, à comparer à l'achat d'un template.
Ni ce budget ni cette prestation ne sont validés.
