# Guide « Comment écrire un livre dont vous êtes le héros en classe »

Document de travail de la page guide publique : cadrage, plan, matière par
partie, sources. Commencé le 28 octobre 2026. Le texte de la page est ici, dans
les « Premier jet » : il en reste la seule source. Page construite en local le
30 octobre 2026 (maquette A2, [design](design.md#guide--écrire-un-livre-dont-vous-êtes-le-héros---maquettes-30-octobre-2026)),
à l'adresse `/guide/ecrire-un-livre-dont-vous-etes-le-heros` ; après une
retouche du texte ici, `npm run guide:texte` (dans `app/`) le reporte dans
l'application. Tant que la page « Ressources » n'existe pas, le guide n'y
renvoie pas (`SANS_RESSOURCES`, `app/scripts/guide-texte.ts`) : la phrase de
la partie 1 qui y mène est retirée, le modèle d'autorisation de la partie 12
mène à celui de l'Aide, et le pied ne garde que la bibliothèque et l'accueil.

## Cadrage

- **Décidé par le porteur le 28 octobre 2026 :** le guide porte sur la méthode,
  sans documents pédagogiques ; il renvoie à la future page « Ressources »
  ([plan, « Suite recommandée après l'ouverture »](plan.md#suite-recommandée-après-louverture),
  point 5), qui portera les programmes, la séquence type et les documents à
  imprimer. Le guide tient lieu d'une des pages de contenu remises à plus tard
  en [F14](specifications.md#f14--ouverture-offre-et-exploitation).
- **Recommandations de référencement** (autre conversation, reprises par le
  porteur, non arrêtées une à une) : adresse
  `/guide/ecrire-un-livre-dont-vous-etes-le-heros` ; recherche visée
  « comment écrire un livre dont vous êtes le héros » ; en appui « créer une
  histoire dont vous êtes le héros », « en classe », « projet d'écriture
  cycle 3 / CM1 / CM2 », « livre-jeu » défini d'emblée comme synonyme,
  « fiction interactive » (le mot du Québec), « histoire interactive » ; ne
  pas viser « … avec sa classe », qui revient à l'accueil ; titre d'onglet et
  grand titre « Comment écrire un livre dont vous êtes le héros en classe »
  (décidé par le porteur le 7 novembre 2026, après l'audit de référencement :
  « … avec sa classe » reprenait le mot-clé de l'accueil) ; une
  phrase de définition citable en tête ; intertitres en questions ; chiffres
  réels de sa pratique, sans l'effectif de la classe (décidé par le porteur le
  28 octobre 2026 : trop de lecteurs croiraient que le projet tient au petit
  nombre) ; auteur nommé (Nicolas, professeur des écoles) et date
  de mise à jour ; liens vers l'accueil et la bibliothèque ; page ajoutée au
  plan du site, à `llms.txt`, aux règles des robots des IA, avec les données
  structurées d'un article.
- **Confirmé par le porteur le 28 octobre 2026 :** la méthode reste valable
  pour une classe qui travaille sur papier ; l'outil n'apparaît qu'en encart
  discret, là où il lève une difficulté rapportée par les enseignants
  (numérotation, renvois, suivi de la classe, cohérence des personnages). Une
  page qui ne vend que l'outil serait moins citée et moins crue.
- **Décidé le 28 octobre 2026 :** la méthode s'écrit au « vous » ; l'expérience
  du porteur au « je », dans de courts passages repérables (« Dans ma
  classe »). Pas de phrase sur ce que le projet ne promet pas.

## Plan de la page

Arrêté avec le porteur le 28 octobre 2026, modifiable si l'entretien le
demande.

- Titre, phrase de définition, auteur et date ; « En bref » : quelques
  chiffres réels de sa pratique (six ans de livres, 213 et 323 passages),
  sans l'effectif de la classe.
1. Pourquoi écrire un livre-jeu avec sa classe ?
2. À partir de quel âge ?
3. Par quoi commencer ?
4. Comment inventer l'histoire ensemble ?
5. Comment répartir l'écriture entre les élèves ?
6. Combien de chapitres, de scènes et de choix prévoir ?
7. Comment organiser les choix ?
8. Comment relire et garder la cohérence ?
9. Faut-il des objets, des compétences ou un dé ?
10. Comment vérifier que tous les chemins mènent quelque part ?
11. Combien de temps faut-il ?
12. Comment illustrer, imprimer et partager le livre ?
13. Quelle place donner à l'IA ?
14. Six erreurs à éviter pour votre premier livre-jeu.
- Pied : liens vers « Ressources », la bibliothèque et l'accueil.

## Haut et pied de la page

Décidé le 30 octobre 2026.

- Phrase de définition : écrire avec sa classe ne suppose pas un élève par
  chapitre, choix personnel du porteur ; la phrase reste générale.
- « En bref » : ses chiffres réels, sans l'effectif ; un ou deux élèves par
  chapitre ; prix d'impression donnés en fourchette.
- Une seule page, avec un sommaire cliquable sous « En bref » et une ancre
  par question ; pas de sous-pages tant que la Search Console ne montre pas
  de recherche propre à une partie (candidates : le cycle 2, les règles de
  jeu). Les jets se resserrent d'environ 15 à 20 % à la relecture finale
  (environ 4 400 mots le 30 octobre 2026).
- Niveaux et périodes de l'école française gardés, avec l'âge et les mois à
  côté à la première occurrence : exception à F14 (« Le site parle d'âge »),
  décidée le 30 octobre 2026.
- Auteur : Nicolas Coussot, professeur des écoles (nom complet, qui évite la
  confusion avec Nicolas Zannettacci) ; date de mise à jour à la
  publication.
- Encarts revus le 3 novembre 2026 (nos propositions et celles de GPT,
  « prends le meilleur ») : quatre, là où l'outil lève une difficulté
  concrète, vécue ou rencontrée par le lecteur : parties 5 (le Suivi), 8 (les
  scènes voisines), 10 (les chemins et la numérotation, sans capture : la vue
  « Chemins » d'un chapitre est montrée en arbre sous « Contrôlez les
  liens ») et 12 (le PDF et le partage). Celui des listes communes (partie
  9), d'abord ajouté, retiré le même jour : trop compliqué, il ferait peur à
  qui veut un livre simple. Deux phrases au
  plus, puis une capture cadrée sur le bénéfice annoncé. Retirés : la
  Préparation (partie 4, que le schéma explique) et le temps gagné (partie
  11), passé dans « Dans ma classe ». Ce qui touche à l'IA (correction,
  images, idées de choix) attend la partie sur l'IA, qui a reçu le
  4 novembre 2026 le cinquième encart (« Formuler » la consigne) : cinq au
  plus, comme le vérifie le test du guide (F14-AC52).
- Pied : « Ressources » (quand la page existera), la bibliothèque, l'accueil
  (« Essayer Il était une classe ») ; les sources restent citées dans le
  texte (parties 6 et 7).
- « En bref » repris le 30 octobre 2026, après la construction, décidé par
  le porteur : les cinq lignes du premier jet ne répondaient pas aux
  questions du lecteur (depuis quand il le fait, un choix d'organisation
  personnel, un nombre d'élèves par chapitre qui dépend du livre). Un chiffre
  par ligne, choisi par lui, la ligne finie par la partie qui le développe :
  1 à 3 mois (et non « 3 mois », qu'on aurait lu à côté des 40 scènes) ;
  20 h pour l'enseignant, sans la moitié qu'il compte avec le site,
  l'outil restant aux encarts (partie 11) ; 4 étapes ; 40 scènes ; 10 €
  en couleur pour un livre moyen. Ses quatre ans de livres passent dans la
  ligne d'auteur, en version courte. Puis, le même jour, 80 scènes au lieu
  de 40 pour un premier livre, soit une vingtaine d'obstacles, un par élève
  dans une classe ordinaire, qui va avec les 10 € d'un livre moyen (partie 6
  alignée).
- Le 2 novembre 2026, décidé par lui : six ans de livres-jeux et non quatre
  dans la ligne d'auteur ; les premiers, d'une autre forme, comptent.
- Le 4 novembre 2026, à sa demande (la page lui semblait directive) : une
  note « Avant de commencer », au « je », sous la ligne d'auteur et dans la
  forme de « Dans ma classe » : un retour d'expérience, pas des règles. Les
  conseils restent au « vous » et à l'impératif.
- Relecture finale du 6 novembre 2026, point par point avec lui. Laissés en
  l'état, décidé par lui : l'encart de la partie 13, qui montre la dictée et
  la liste de vérification avant qu'elles existent dans l'outil (à
  construire très bientôt) ; un obstacle par élève dans « En bref » à côté
  des trois par chapitre de la partie 5 ; le nom de l'outil en partie 3 (la
  bibliothèque) et dans « Dans ma classe » de la partie 11 (le temps divisé
  par deux), exceptions à la règle des encarts ; « prêt pour l'imprimeur »
  avant le premier envoi (V6) ; « chacun tient entre ses mains un véritable
  livre » malgré l'achat facultatif ; le nombre d'élèves par chapitre (« seul
  ou à deux », « deux ou trois ») ; pas de coupe de 15 à 20 % : la longueur
  reste celle-ci. Changé ensuite : deux périodes d'écriture pour un grand
  livre, tableau compris (il gardait « une ou deux »).

#### Premier jet

> # Comment écrire un livre dont vous êtes le héros en classe
>
> Un livre dont vous êtes le héros, ou livre-jeu, est un récit découpé en
> scènes numérotées où le lecteur choisit la suite : à la fin d'une scène, il
> se rend au numéro de son choix. L'écrire avec sa classe, c'est inventer
> l'aventure ensemble, puis se partager l'écriture des scènes, que
> l'enseignant relie en un seul livre.
>
> *Par Nicolas Coussot, professeur des écoles, six ans de livres-jeux
> avec sa classe. Mis à jour le …*
>
> **Avant de commencer.** Ce guide rassemble ce que j'ai appris en six ans
> de livres-jeux avec mes élèves, mes réussites comme mes erreurs. Ce ne sont
> pas des règles : chaque classe est différente, et vous trouverez sûrement
> d'autres façons de faire. Prenez ce qui vous sert.
>
> **En bref**
>
> - **1 à 3 mois** d'écriture avec la classe : une ou deux périodes (six à sept semaines chacune) pour un premier
>   livre, trois mois pour un grand. (partie 11)
> - **20 h** de travail pour vous sur un grand livre : préparer le plan du livre et les
>   consignes, relire, ajouter les illustrations ; pas seulement corriger des
>   textes. (partie 11)
> - **4 temps** pour mener le projet : découvrir le genre, préparer
>   l'histoire, écrire et relire, fabriquer le livre. (partie 11)
> - **80 scènes** pour un premier livre, soit une vingtaine d'obstacles :
>   un par élève dans une classe ordinaire. (partie 6)
> - **10 €** environ l'exemplaire en couleur d'un livre moyen, d'une
>   trentaine d'images. Décidez du format à l'avance : le prix monte vite.
>   (partie 12)
>
> **Sommaire** : les quatorze questions, chacune avec son ancre.
>
> …
>
> **Pour aller plus loin**
>
> - **Un projet vécu en CM1-CM2.** [Quand les élèves écrivent un livre interactif](https://www.cafepedagogique.net/2025/11/10/nicolas-zannettacci-quand-les-eleves-ecrivent-un-livre-interactif/) :
>   le témoignage de Nicolas Zannettacci (Café pédagogique), de la collecte
>   des idées aux dernières corrections.
> - **Un autre projet, en CE2-CM2.** [Livre dont vous êtes le héros](https://lamouche.home.blog/2019/04/08/livre-dont-vous-etes-le-heros/) :
>   à l'école de Nolay, chaque élève décrit un lieu, et les lieux reliés
>   forment l'aventure.
> - **Les bases du récit à choix.** [Écrire une histoire dont vous êtes le héros avec des élèves](https://www.quefaitesvous.com/blog/ecrire-une-histoire-dont-vous-etes-le-heros-avec-des-eleves-les-bases/)
>   (Que faites-vous) : construire les embranchements et anticiper leurs
>   conséquences.
> - **D'autres structures.** [Introduction aux structures de la fiction interactive](https://www.fiction-interactive.fr/introduction-aux-structures-de-la-fiction-interactive-et-comment-les-utiliser/)
>   (Fiction-interactive.fr) : des schémas pour varier les parcours, au-delà
>   des trois formes de « Combien de chapitres, de scènes et de choix
>   prévoir ? ».
>
> **Lire et essayer :** [Ressources](…) · [La bibliothèque](…) ·
> [Essayer Il était une classe](/)

## Ce que l'on sait déjà de la pratique du porteur

Relevé dans les documents du projet le 28 octobre 2026, à faire confirmer
pendant l'entretien ; les détails sont à leur place de référence.

- Quatre ans de livres avec sa classe ; cette année un CE2-CM1-CM2 de
  10 élèves, séances en salle informatique, son écran projeté.
- Deux livres importés de la V0 : « Électro Nick » (323 passages, 152 grandes
  images) et « Le labyrinthe oublié » (213 passages, 140 pages, 85 images, donné
  par lui le 3 novembre 2026),
  imprimés chez epubli ; numéros de scène seuls, sans numéros de page.
  Illustrations : il les fait par IA (dit le 29 octobre 2026) ; les « dessins
  d'élèves » d'abord notés ici sont à confirmer.
- Déroulé ([brief](../BRIEF-V1.md)) : la classe imagine l'univers et le héros,
  prépare les chapitres attribués à un élève ou à un binôme, puis les
  obstacles ; l'enseignant fait les liens et les consignes, les élèves
  rédigent ; ils connaissent les grandes lignes avant d'écrire.
- Brouillon à la main à la maison puis recopie en classe ; dictée vocale pour
  les élèves en retard ; textes parfois finis par l'enseignant ; changements de
  choix demandés à l'oral.
- Règles de jeu essayées : choix seuls, objets qui ouvrent des choix, points de
  volonté et temps, attributs, compétences, dés ; feuille d'aventure.
- Difficultés : trouver des choix pertinents, tenir les organigrammes ; liste
  d'objets longue aux noms incohérents ; une cinquantaine de formules d'action
  recopiées ; scènes communes (fin sans points de vie, sauvegarde) rangées dans
  un chapitre à part.
- Chaque élève lit tout son chapitre, scènes des camarades comprises ; seules
  la scène qui mène à son chapitre et celle qui en sort lui restent cachées :
  la surprise se joue entre les chapitres (dit le 28 octobre 2026, partie 5).
- Non documenté : effectifs et niveaux des années passées, nombre de livres,
  chapitres et fins par livre, durée réelle et rythme des séances, livres-jeux
  lus avant d'écrire, formation des binômes, circuit de relecture, coût et
  tirage de l'impression, anecdotes.

## Matière par partie

Tirée de la recherche du 28 octobre 2026. « Retour » signale un témoignage
d'enseignant, sans étude qui le prouve. L'expérience du porteur s'ajoute sous
chaque partie pendant l'entretien et prime sur les sources.

### 1. Pourquoi

- Les programmes du cycle 3 (BO n° 16 du 17 avril 2025) demandent en CM des
  écrits longs, de l'écriture collaborative, des brouillons et des stratégies
  de révision ; dire une phrase et renvoyer à « Ressources ».
- Un lecteur réel qui jouera le livre : une raison de soigner et de relire
  (retours).
- Chaque élève a une part visible, un passage, un chapitre (retours).
- La cohérence devient concrète : un chemin incohérent bloque le lecteur.
- Tout le monde contribue : un passage court suffit, rôles sans rédaction
  (illustrer, relire) ; élèves d'ULIS et d'UPE2A dans le projet de
  Zannettacci, avec une AESH.
- À ne pas promettre : aucun gain de compréhension démontré (Campion,
  UCLouvain, 10-12 ans) ; pas d'étude montrant qu'un livre-jeu fait mieux
  progresser qu'un autre projet long.

#### Expérience du porteur (28 octobre 2026)

- Pourquoi il s'y est mis : un manque de motivation, des deux côtés. Pour
  l'enseignant, la production d'écrits demande beaucoup de travail et passe
  souvent à la trappe ; le livre-jeu porte la classe pendant des mois et
  oblige à une rigueur : on ne peut pas sauter de séance. Pour les élèves, un
  objet fini et tangible, qui leur semblait inaccessible (« écrire un livre,
  c'est pour les écrivains »), dont ils sont fiers et qu'ils gardent toute leur
  vie.
- Les élèves en difficulté écrivent volontiers et se sentent aussi investis
  que les autres, à part égale dans le livre, même avec moins de scènes. Un
  travail collectif où tout le monde se tire vers le haut.
- Confirmés : relire parce que quelqu'un jouera le livre ; fierté d'une part
  visible ; cohérence prise au sérieux.
- Vu dans sa classe : une élève de CM2, passée en 6e, montre le livre l'année
  suivante en cours de français ; toute une classe lève la main pour venir en
  APC continuer à écrire ; une fois (pas la norme : une séance dure une
  heure, partie 11), deux heures d'affilée d'écriture efficace, en
  silence, sans plainte ni discipline à faire, en autonomie (brouillon sur
  feuille, saisie à l'ordinateur, remarque du maître, reprise, validation,
  scène suivante) ; les plus rapides proposent d'aider ceux qui peinent à
  finir leur chapitre, au lieu de juger leur travail terminé.
- Élèves accompagnés, avec une AESH ou non : il réduit surtout la quantité,
  guide davantage la consigne, propose au besoin une image pour lancer
  l'imagination ; rôle d'illustrateur possible. Détail en partie 5.
- Extensions validées : une scène est un morceau court et fini, qui lève la
  peur de la page blanche ; un livre-jeu se rejoue et circule (famille, autres
  classes). Écartée : lire et raccorder les scènes des autres chapitres, que
  l'élève ne voit pas (surprise ; voir partie 5).
- Écarté : l'effectif de la classe ; toute phrase sur ce que le projet ne
  promet pas ; le projet ULIS/UPE2A d'un autre enseignant.
- Repris le 30 octobre 2026, après la construction, sur sa demande :
  l'ouverture sur la production d'écrits qui passe à la trappe, jugée « pas
  terrible », est retirée ; la partie s'ouvre sur le vrai livre, qui l'a
  fait passer d'une histoire jouée à l'écran seulement à un livre imprimé
  (« Dans ma classe » : l'adresse s'oubliait vite et l'histoire
  disparaissait, précisé par lui le même jour), puis tout le monde auteur et la
  classe qui travaille ensemble, les vrais lecteurs et le livre qui vit après
  la classe, et un projet qui ne se limite pas à l'écriture (quatre points
  repris de Que faites-vous ; les deux premiers y sont nommés en partie 7,
  qui le cite).
- Repris de nouveau le même jour, d'après sa propre version : « C'est un
  livre ! Un vrai. » et « C'est un jeu ! », les deux mots du genre ; la classe
  qui a l'avantage du nombre ; ses signes qu'un projet fonctionne, en liste
  (entraide des plus rapides gardée, plusieurs anciens élèves montrant leur
  livre l'année suivante, confirmé par lui) ; « Plus qu'un projet
  d'écriture » fondu dans « Et les programmes ? ». Programme vérifié le
  30 octobre 2026 dans l'annexe du BO n° 16 du 17 avril 2025 (en vigueur en
  CM1 à la rentrée 2025, en CM2 à la rentrée 2026) : au cours moyen, « dans
  l'année », chaque élève « participe à des activités de production d'écrit
  collaboratif », « produit des écrits longs de manière de plus en plus
  autonome », « s'approprie différents usages du brouillon », « élabore des
  stratégies pour réviser ses textes » ; « les projets d'écriture artistique
  et créative sont encouragés », comme « l'écriture collective, guidée par le
  professeur ».

#### Premier jet

> ## Pourquoi écrire un livre-jeu avec sa classe ?
>
> **C'est un livre ! Un vrai.** Pour beaucoup d'enfants, écrire un livre,
> c'est une affaire d'écrivains. Mais la classe a l'avantage du nombre.
> Chacun apporte ses idées et écrit quelques scènes. Mis bout à bout, tous
> ces petits textes deviennent une histoire complète, bien plus ambitieuse
> que ce qu'un élève aurait pu créer seul. Les élèves en difficulté écrivent
> volontiers et en sont aussi fiers que les autres. Et à la fin du projet,
> chacun tient entre ses mains un véritable livre, avec son nom à
> l'intérieur.
>
> **Dans ma classe.** Au départ, nos histoires se jouaient uniquement sur
> écran. Mais l'adresse finissait par s'oublier, et l'histoire avec elle.
> C'est pour que chaque élève reparte avec un livre à garder, à montrer et à
> partager que j'ai voulu les imprimer.
>
> **C'est un jeu !** Inventer des chemins secrets, tendre des pièges aux
> lecteurs, imaginer des choix difficiles et des fins surprenantes… Les
> élèves créent une aventure où d'autres vont jouer. Et si un chemin ne mène
> nulle part, le lecteur reste bloqué : on reprend son texte sans rechigner.
> L'envie de découvrir les chapitres des camarades donne une bonne raison de poursuivre le projet, séance après
> séance.
>
> **Dans ma classe.** Je sais qu'un projet fonctionne quand :
>
> - une séance d'écriture se prolonge pendant deux heures sans que personne
>   ne demande à arrêter ;
> - toutes les mains se lèvent quand je propose de continuer en APC (activités pédagogiques complémentaires, hors du temps de classe) ;
> - les plus rapides proposent leur aide à ceux qui peinent à finir leur
>   chapitre, plutôt que de considérer leur travail terminé ;
> - l'année suivante, des élèves montrent fièrement leur livre à leurs
>   nouveaux professeurs.
>
> **Et les programmes ?** Au cours moyen, le
> [programme de français du cycle 3](https://www.education.gouv.fr/sites/default/files/ensel620_annexe1.pdf)
> (Bulletin officiel du 17 avril 2025) demande que chaque élève participe
> dans l'année à des productions d'écrit collaboratives, produise des écrits
> longs, apprenne à se servir du brouillon et à réviser ses textes ; il
> encourage les projets d'écriture créatifs et l'écriture collective guidée
> par le professeur. Un livre-jeu réunit tout cela, et fait travailler :
>
> - la construction du récit et l'anticipation des conséquences de chaque
>   choix ;
> - la cohérence entre les personnages, les lieux et les événements ;
> - le vocabulaire, la syntaxe et l'orthographe, à travers la réécriture ;
> - la coopération, en confrontant les idées pour construire une histoire
>   commune.

### 2. Âge

- Les ressources visent surtout le cycle 3 ; presque rien sur l'écriture par
  des élèves de cycle 2.
- Cycle 2 : classe entière et enseignant qui écrit, choix oui/non, une seule
  histoire courte ; la dictée à l'adulte est au plan (point 2).
- Premières lectures possibles dès 6-7 ans (Hatier).

#### Expérience du porteur (28 octobre 2026)

- Livres écrits avec des élèves de CE2, de CM1 et de CM2 ; la page cite ces
  niveaux sans dire qu'ils étaient dans une même classe.
- Critère retenu : savoir écrire seul un court paragraphe ; en dessous,
  dictée à l'adulte.
- Cycle 2 : fait aussi, de façon informelle, d'abord collectivement, puis
  par groupes, avec dictée à l'adulte, comme le décrivent les rares
  ressources.
- Collège : la méthode vaut jusqu'en 3e ; les élèves peuvent y organiser
  eux-mêmes leur chapitre.
- Encart de l'outil retiré le 30 octobre 2026 (il redisait celui de la
  partie 10).
- Extensions validées : seule la plume change de main (collectif, groupes,
  chacun sa scène, au fil de l'année ou des années) ; une classe à plusieurs
  niveaux, un seul livre ; au collège, on confie davantage aux élèves.
- Repris le 30 octobre 2026, à sa demande : du CE2 au CM2, chaque élève
  écrit ses propres scènes, dès le CE2 ; le passage par l'écriture
  collective puis en groupes ne vaut que pour le cycle 2. Développé ensuite
  à sa demande : un livre plus grand, un système de jeu plus complexe.
- Réécrit le même jour d'après une version qu'il apporte, analysée : la
  question d'autonomie plutôt que d'âge ; en CP-CE1, quelques phrases
  écrites seuls par les plus autonomes avec un glossaire de l'histoire,
  qu'il reprend à son compte ; la différenciation gardée au CE2 (« parfois
  c'est dur pour des CE2 ») ; le collège réduit à ce qui le distingue (la
  construction confiée aux élèves) ; « Dans ma classe » retiré, jugé peu
  concret ; un seul conseil de commencer simple, en fin de partie.
- Le 3 novembre 2026, pour alléger la page (mélange de nos propositions et de
  celles de GPT) : les trois niveaux en cartes côte à côte, chacune avec son
  accroche (« Écrire avec l'adulte », « Chacun écrit ses scènes »,
  « Construire aussi les chemins »).

#### Premier jet

> ## À partir de quel âge ?
>
> Ce n'est pas tant une question d'âge que d'autonomie dans l'écriture. À
> tous les niveaux, la classe imagine l'univers, invente l'histoire et décide
> des choix ; seule la manière de rédiger change : dictée à l'adulte, petits
> groupes ou écriture autonome.
>
> - **CP et CE1 · 6-8 ans** — *Écrire avec l'adulte.* La classe construit
>   le cadre de l'histoire, vous écrivez au tableau ; les scènes se rédigent
>   en petits groupes, avec votre aide. Les plus autonomes écrivent quelques
>   phrases seuls, avec un glossaire de l'histoire : personnages, lieux,
>   objets, mots utiles. Une aventure courte, aux choix simples.
> - **CE2 à CM2 · 8-11 ans** — *Chacun écrit ses scènes.* Chaque élève
>   rédige ses propres scènes, avec plus ou moins d'aide selon son autonomie.
>   Avec une classe habituée, le livre peut atteindre deux ou trois cents
>   scènes, avec des objets, une jauge, parfois un dé (voir « Faut-il des
>   objets, des compétences ou un dé ? »).
> - **Collège · 11-15 ans** — *Construire aussi les chemins.* Les élèves
>   imaginent les embranchements de leur chapitre, organisent les fins et
>   vérifient que tous les chemins mènent quelque part.
>
> **Une classe à plusieurs niveaux, un seul livre.** Les plus autonomes
> écrivent des chapitres plus longs ou les scènes délicates, les autres des
> scènes plus courtes, avec davantage d'aide. Les chapitres n'ont pas besoin
> d'avoir la même longueur.
>
> **Un dernier conseil.** Quel que soit l'âge, mieux vaut réussir un premier
> livre aux choix simples que se perdre dans une histoire trop ambitieuse :
> le suivant ira plus loin.

### 3. Par quoi commencer

- Lire et jouer des livres-jeux, puis analyser leur construction (numéros,
  choix, fins) ; cartographier un livre et compter ses fins.
- Jeu oral : le narrateur propose trois à cinq options, la classe vote.
- Un premier essai sur une suite familière (faire une pizza, entrer en classe)
  avant la fiction.
- Livres cités : *La classe dont tu es le héros* (Hatier, CP-CE1) ;
  *Le monde dont tu es le héros* (Hatier, 7-9 ans) ; BD dont tu es le petit
  héros et BD dont vous êtes le héros (Makaka) ; *Ma première aventure*
  (Game Flow, rejouabilité) ; *Unlock! Escape Geeks* (Rageot, 8-12 ans,
  énigmes) ; *Panique au cirque* (L'école des loisirs) ; *Défis fantastiques*
  pour l'enseignant. Âges des éditeurs, à vérifier titre par titre.

#### Expérience du porteur (28 octobre 2026)

- Avant le projet, il lit à la classe des livres à choix, vote collectif à
  chaque choix ; un moment détendu, sans analyse. D'abord la série *Ma
  première aventure*, pour la mécanique la plus simple, puis la série *Tu es
  le héros* de Larousse Jeunesse, au système de jeu plus évolué.
- Ensuite, dans une séance à part, on décortique un *Ma première aventure*,
  au fonctionnement simple et répétitif, et on étudie les sortes de choix des
  Larousse ; on dit ce que la classe aime et ce qu'elle ne veut pas (une
  défaite par simple malchance, entre autres ; voir partie 7).
- Les livres des années précédentes servent de modèles ; les livres restent
  accessibles pendant le projet, sans que les élèves s'en aident vraiment.
- Pas de petit essai d'écriture avant le livre.
- Avant de se lancer : deux séances par semaine ; une ou plusieurs périodes
  selon la taille du livre ; brouillon sur papier puis recopie à
  l'ordinateur ; devoirs et APC pour rattraper les retards.
- Va ailleurs : la typologie des choix (pertinent, piège, jet incertain,
  énigme) en partie 7 ; le hasard, admis s'il ne punit pas, en parties 7
  et 9 ; le binôme
  papier et ordinateur, l'autonomie, les devoirs et l'APC en partie 5 ; le
  rythme et la durée en partie 11 ; la dictée des textes manuscrits en
  partie 5, par la dictée de l'ordinateur, l'encart de l'outil attendant que
  la dictée soit construite (plan, « Suite recommandée », point 2).
- Extension validée : un livre d'une autre classe prouve que c'est possible ;
  la bibliothèque du site en offre à qui n'en a pas.
- À vérifier avant publication : éditeur, âge et disponibilité de *Ma
  première aventure* et de *Tu es le héros* (Larousse Jeunesse) ; ce que la
  bibliothèque contient alors (livres de classes ou seulement d'exemple),
  pour ajuster la phrase qui y renvoie.
- Repris le 30 octobre 2026 d'après une version qu'il apporte, analysée :
  rejouer pour explorer d'autres chemins ; démonter le mécanisme (chemins
  qui se séparent et se rejoignent, objets, choix), avec la comparaison des
  sortes de choix et la liste de ce que la classe veut ou non, gardées ;
  pas de liste des livres de la bibliothèque, que les couvertures montrent ;
  le rythme réduit à une phrase qui renvoie à la partie 11 (le support est
  en partie 5). Confirmé par lui : une période d'APC consacrée au projet,
  des volontaires qui écrivent à la maison. Éditeurs vérifiés le même jour
  et liés à leur page officielle : *Ma première aventure*, collection de
  Game Flow (albums dès 4 ans, pages découpées en trois) ; *Tu es le héros*,
  Larousse Jeunesse (titres de 2021 à 2025). Pas de couvertures (droits des
  éditeurs, une image par partie déjà prise par les livres de la classe).

#### Premier jet

> ## Par quoi commencer ?
>
> **Jouez ensemble.** Lisez des livres-jeux à voix haute et laissez la
> classe voter à chaque choix ; rejouez-en certains pour explorer d'autres
> chemins. Pour l'instant, on joue sans analyser. Partez de livres très
> simples, puis passez à des règles plus riches, avec des objets, des
> énigmes ou des pièges.
>
> **Puis démontez le mécanisme.** Dans une séance à part, reprenez un livre
> simple : où les chemins se séparent et se rejoignent, comment marchent les
> objets, où mènent les choix. Comparez les sortes de choix rencontrées.
> Demandez à la classe ce qu'elle a aimé et ce qu'elle ne veut pas dans son
> livre : cette liste lui servira à fixer ses règles.
>
> **Montrez que c'est possible.** Un livre écrit par une autre classe le
> prouve : feuilletez-le ensemble. Si
> vous n'en avez pas encore, la bibliothèque d'Il était une classe en
> propose à lire en ligne.
>
> **Prévoyez le rythme.** Deux séances par semaine gardent le fil de
> l'histoire. Décidez aussi comment rattraper les retards : feuilles à finir
> à la maison, séances d'APC (voir « Combien de temps faut-il ? »).
>
> **Dans ma classe.** Je commence par
> [*Ma première aventure*](https://ma-premiere-aventure.fr/) (Game Flow), puis
> [*Tu es le héros*](https://www.editions-larousse.fr/livres-tu-es-le-heros/)
> (Larousse Jeunesse), aux règles plus complexes. Nous étudions ensuite leur
> construction et les différents types de choix. Les livres de mes anciennes
> classes servent aussi de modèles.

### 4. Inventer l'histoire ensemble

- Fixer en commun le héros, le monde, le but ; écrire la bonne fin d'abord,
  puis les obstacles, qui donnent les autres fins.
- Décider des règles de la classe : fins tragiques ou non, une fin gagnante.
- Passer des idées de chacun à une aventure commune : recueillir, regrouper,
  garder ce qui tient ensemble ; l'enseignant arbitre (Zannettacci).
- Le héros, c'est le lecteur : « tu » ou « vous », un but clair dès le premier
  passage.

#### Expérience du porteur (28 octobre 2026)

- Des idées de chacun à une histoire : chacun propose, on regroupe au
  tableau, on discute, on vote, il tranche ; une idée écartée peut revenir
  comme personnage, lieu ou obstacle d'un chapitre. Mêmes étapes que la
  Préparation du site : Univers, Personnages, Enjeu, Grandes étapes.
- On définit ensemble le problème et, dans les grandes lignes, la façon de le
  résoudre ; la toute fin pas toujours.
- Il écrit lui-même quelques scènes, souvent des quêtes secondaires
  surprises ; le moyen de vaincre le méchant n'est connu que de lui, pour le
  plaisir de la découverte des élèves.
- « Tu » et le présent, le plus adapté selon lui à l'élémentaire ; un choix,
  pas une obligation.
- Règles décidées ensemble avant d'écrire ; pas de violence ; points de
  volonté plutôt que points de vie quand il en faut. Systèmes essayés
  (plusieurs héros aux compétences propres, un héros aux compétences
  choisies, un héros aux caractéristiques choisies) : en partie 9.
- On fixe les grandes parties, on les divise ensemble en chapitres ; chaque
  élève choisit un chapitre, qu'il l'ait proposé ou non, et en devient
  responsable ; seul ou à deux, il en précise les détails, les obstacles et
  les façons de les surmonter. Suite en partie 5.
- La scène d'ouverture n'est attribuée à personne au début ; il la confie
  ensuite aux élèves les plus efficaces.
- Extensions validées : ce qu'on retient reste affiché (il ne le fait pas,
  mais le juge bon) ; la première scène écrite ensemble, proposée à côté de
  sa pratique ; des fins ratées sans violence.
- Repris le 30 octobre 2026 d'après une version qu'il apporte, analysée :
  « Fixez l'enjeu, pas toutes les solutions », le vote si nécessaire et
  l'arbitrage, le plaisir d'être surpris malgré les grandes lignes ; les
  scènes définies comme les passages numérotés ; gardés le méchant que lui
  seul sait vaincre et le chapitre dont l'élève devient responsable.
  Retirés à sa demande : les points de volonté (dits en partie 9) ; la
  première scène écrite ensemble, qu'il ne pratique pas. Précisé par lui :
  le méchant d'« Électro Nick », la quête secondaire du « Labyrinthe
  oublié ».
- Le 3 novembre 2026, pour alléger la page : du livre à la scène en boîtes
  emboîtées (le livre, une partie, le chapitre confié, avec son entrée et sa
  sortie, ses scènes aux numéros dispersés), sous « Découpez l'aventure » ;
  la définition de la scène passe dans le schéma.
- Le même jour, à sa demande : le schéma remplacé par deux captures de
  l'application (une partie et ses chapitres confiés aux élèves, un chapitre
  et ses scènes), la définition de la scène revenue dans le texte.

#### Premier jet

> ## Comment inventer l'histoire ensemble ?
>
> **Construisez l'histoire par étapes :** l'univers, les personnages et le
> héros, sa quête, puis les grandes étapes de l'aventure. À chaque étape, les
> élèves proposent leurs idées, vous les regroupez au tableau, puis la classe
> discute et vote si nécessaire. À vous de trancher lorsque les idées ne sont
> pas compatibles. Gardez les décisions affichées pendant tout le projet.
> Les idées écartées pourront toujours resservir pour inventer un lieu, un
> personnage ou un obstacle.
>
> **Fixez l'enjeu, pas toutes les solutions.** Décidez du problème du héros
> et, dans les grandes lignes, de la façon de le résoudre. Une question fera
> ensuite naître les obstacles : qu'est-ce qui pourrait l'empêcher de
> réussir ? Laissez aux élèves la liberté d'imaginer les rencontres, les
> détours et les solutions inattendues. La toute fin peut attendre.
>
> **Gardez quelques surprises.** Écrivez vous-même certaines scènes que les
> élèves découvriront plus tard : une quête secondaire, un secret, un
> rebondissement. Même en connaissant les grandes
> lignes de l'histoire, ils auront le plaisir de se laisser surprendre.
>
> **Dans ma classe.** Dans « Électro Nick », j'étais le seul à connaître le
> moyen de vaincre le méchant. Dans « Le labyrinthe oublié », j'avais écrit
> une quête secondaire.
>
> **Décidez des règles communes.** Un héros ou plusieurs ? À quelle personne
> et à quel temps raconter ? Le « tu » et le présent fonctionnent bien à
> l'élémentaire ; l'essentiel est de s'y tenir dans tout le livre. Décidez
> aussi comment on peut échouer : pas besoin de violence pour de mauvaises
> fins, se perdre, manquer de temps ou rentrer bredouille suffisent.
>
> **Découpez l'aventure, puis confiez les chapitres.** Définissez ensemble
> les grandes parties et les chapitres qui les composent ; chaque chapitre se
> compose de scènes, les passages numérotés du livre. Chaque élève choisit
> ensuite un chapitre, qu'il l'ait proposé ou non, seul ou à deux, et en
> devient responsable : il en imagine les obstacles et la façon de les
> surmonter (voir « Comment répartir l'écriture entre les élèves ? »).
>
> **Et la première scène ?** Imaginez ensemble la situation de départ, puis
> confiez sa rédaction plus tard à un élève à l'aise, quand le reste de
> l'histoire a pris forme.

### 5. Répartir l'écriture

- Variantes : un élève par passage ; binômes ; un groupe par branche ; équipes
  de 3-4 avec rôles (uniformisation, messager, correcteur, animateur) ; classe
  entière pour l'ouverture, binômes pour les premiers embranchements, une fin
  par élève (ReadWriteThink) ; l'adulte écrit l'ouverture et les deux premiers
  choix, un groupe par lieu, l'adulte relie (Kristin King) ; début collectif
  puis groupes de plus en plus petits (scénario Twine d'Édubase, non lu).
- Une consigne par passage : ce qui précède, où mènent les choix, la longueur
  (environ 100 mots pour l'ouverture, 70 par péripétie, 40 par fin, modèle
  belge) ; étiquette de fin qui impose les choix (Lamouche).
- Binôme mixte : un écrivain sûr et un passionné de jeux (Scottish Book Trust).
- Les rapides et les lents : tâche d'extension, dictée à l'adulte.

#### Expérience du porteur (28 octobre 2026)

- Le plus difficile pour l'enseignant : créer les scènes et les choix ; pour
  les enfants, trouver des choix pertinents, pour un livre logique et non un
  enchaînement de choix au hasard. D'où le travail préalable sur les sortes
  de choix (pertinent, piège, réussir en laissant des plumes, énigme) : en
  parties 7 et 13, cité en partie 3.
- Idéalement un élève par chapitre : chacun ne connaît que le sien et
  découvre le reste en lisant le livre. Selon l'effectif ou la taille du
  chapitre, deux ou trois : le groupe décide qui écrit quoi, chacun écrit
  seul d'après la consigne.
- L'élève lit tout son chapitre, scènes des camarades comprises ; la scène
  qui mène à son chapitre et celle qui en sort lui restent cachées.
- Préparer son chapitre : on fixe le nombre d'obstacles par chapitre ;
  l'élève choisit les obstacles qui arrivent au héros, les choix possibles et
  leurs conséquences. Pas de schéma, trop difficile.
- La consigne dit ce qui doit se passer et des éléments à faire figurer
  (décrire la montagne, ce que disent les personnages, leur réaction, les
  émotions du héros) ; pas ce qui précède, l'élève connaissant son chapitre.
- Les choix : l'élève les définit en préparant son chapitre ; l'enseignant
  les écrit et fait les liens. Un élève peut avoir le droit d'organiser son
  chapitre lui-même, peu approprié selon lui à l'élémentaire (voir partie 2,
  collège).
- Parcours d'une scène : brouillon ; selon l'élève, correction ou demande
  d'amélioration sur le papier ; recopie à l'ordinateur ; demande de
  validation, ou reprise.
- Élève en retard : les volontaires en avance proposent leur aide et
  s'arrangent avec lui ; s'il n'en veut pas, il rattrape à la maison avec les
  feuilles d'écriture, et l'enseignant tape ses textes.
- Ceux qui ont fini : aider, prendre une scène libre, écrire les scènes hors
  chapitre (introduction, épilogue, fin alternative, point de sauvegarde),
  illustrer, et tester leur chapitre par une lecture d'essai (partie 10) ;
  quand tout cela est fait, aider les retardataires.
- Encart de l'outil retiré le 30 octobre 2026 (scènes voisines dites en
  partie 8) ; la dictée, une fois construite.
- Extensions validées : entrées et sorties de chapitre fixées ensemble ; une
  exigence d'écriture par consigne, qui sert d'autocorrection. Écartée : le
  plan du chapitre en cases et en flèches.
- Repris le 30 octobre 2026 d'après une version qu'il apporte, analysée :
  un exemple de consigne avec sa liste à cocher (« Dans mon texte, j'ai pensé
  à »), montré en fiche ; le parcours d'une scène en quatre étapes ; trois
  obstacles imaginés, deux retenus au besoin (« c'est flexible ») ; le
  schéma permis à qui le souhaite (révise l'écart ci-dessus) ; le texte ne
  passe à l'ordinateur qu'avec peu d'erreurs, la langue se corrigeant ensuite
  à l'écran ; le suivi, longtemps un casse-tête (tableur, page Notion), à
  l'origine de l'outil, dit sobrement ; la dictée vocale faite par
  l'enseignant. Acceptés par lui : l'anecdote des volontaires qui aident,
  les scènes hors chapitre nommées et la règle de lecture du chapitre
  quittent cette partie.
- Version finale du porteur, le 31 octobre 2026, prise telle quelle ; ses
  quatre étapes forment le schéma du parcours d'une scène, sans être redites
  en liste.
- Le 2 novembre 2026, l'origine de l'outil quitte ce « Dans ma classe » pour
  celui de la partie 10, qui dit les deux raisons (liens et suivi).

#### Premier jet

> ## Comment répartir l'écriture entre les élèves ?
>
> **Un élève par chapitre, si possible.** Chacun devient responsable de son
> chapitre et garde ses scènes secrètes pour préserver la découverte du
> livre. Si nécessaire, deux ou trois élèves se partagent un chapitre, chacun
> rédigeant ses propres scènes.
>
> **Fixez les entrées et les sorties.** Définissez ensemble d'où arrive le
> héros et où il doit repartir. L'élève connaît les informations nécessaires
> aux transitions, mais reste libre d'inventer ce qui se passe entre les
> deux.
>
> **Préparez les obstacles et les choix.** Trois obstacles constituent un bon
> point de départ, quitte à n'en conserver que deux. Pour chacun, l'élève
> imagine plusieurs choix et leurs conséquences. Liste, dessin ou schéma : il
> choisit la méthode qui lui convient (voir « Comment organiser les
> choix ? »).
>
> **Une consigne et une liste de vérification par scène.** La consigne résume ce qui
> doit se passer ; la liste aide l'élève à vérifier les éléments d'écriture
> attendus.
>
> *Exemple.* **La rencontre dans la forêt.** Consigne : Le héros rencontre un
> personnage mystérieux qui lui propose son aide. J'ai pensé à :
>
> - Décrire le personnage.
> - Écrire un court dialogue.
> - Montrer la réaction du héros.
>
> **Du brouillon à la validation.** Chaque scène suit le même parcours :
>
> 1. L'élève écrit sur papier et se relit avec sa liste de vérification.
> 2. Vous vérifiez le contenu et demandez, si besoin, des améliorations.
> 3. L'élève corrige son orthographe avec ses outils, puis saisit son texte à
>    l'ordinateur.
> 4. Il remet sa scène. Plus tard, vous la validez, la corrigez ou demandez
>    une reprise.
>
> Si les ordinateurs manquent, les élèves se relaient. La dictée vocale peut
> aider à transcrire certains textes et gagner du temps.
>
> **À chacun son rythme.** Une fois ses scènes écrites, l'élève teste les
> chemins de son chapitre. Il peut ensuite écrire d'autres scènes, décrire
> ses futures illustrations ou aider un camarade. Pour ceux qui
> avancent moins vite, réduisez le nombre de scènes, adaptez les consignes ou
> proposez des séances d'APC pour les accompagner dans leur écriture.
>
> **Gardez une vue d'ensemble.** Un tableau de suivi aide à repérer les
> scènes en rédaction, à corriger ou à valider.
>
> **Dans ma classe.** J'ai d'abord suivi les chapitres sur Excel, puis sur une
> page Notion accessible aux élèves.
>
> *Encart.* Dans Il était une classe, le Suivi montre d'un coup d'œil où en
> est chaque scène, et quel élève s'en occupe. Une scène remise se relit en
> un clic.

### 6. Combien de chapitres, de scènes et de choix

- L'arbre explose : deux choix par passage, deux décisions donnent 7 textes ;
  dix décisions, 1 024 fins.
- Formes qui tiennent : un fil principal avec des détours et des échecs
  rapides ; des branches qui se rejoignent (« goulot », point de passage) avec
  une phrase qui rappelle le choix fait ; un carrefour central d'où partent
  les groupes (gabarit de 25 paragraphes de Que faites-vous) ; éviter l'arbre
  qui ne se referme jamais.
- Repères : première histoire, deux niveaux de choix et quatre fins ; 5 ou
  6 fins font déjà un bon livre ; une fin prématurée tôt (après 1 à
  3 choix) qui donne envie de rejouer ; chaque fin titrée.
- Projets réels : Zannettacci, 23 élèves de CM1-CM2, 63 chapitres, de janvier
  à mai ; Lamouche, 30 pièces, 6 séances ; les livres du porteur, 213 et
  323 passages.
- Le texte de ChatGPT propose « 12 à 20 scènes, 2 ou 3 fins » pour un projet
  court : chiffre sans source, à confronter à l'expérience du porteur.

#### Expérience du porteur (28 octobre 2026)

- Ses deux livres, comptés dans la base locale le 28 octobre 2026 :
  « Le labyrinthe oublié », 2 parties, 13 chapitres, 213 scènes ; « Électro
  Nick », 5 parties, 19 chapitres, 323 scènes ; environ 16 scènes par
  chapitre ; deux choix par scène en moyenne, près de la moitié des scènes à
  une seule suite. Quatre à cinq mois chacun ; plutôt trois avec une classe
  plus nombreuse (partie 11).
- Environ trois obstacles par chapitre, chacun avec deux ou trois choix ;
  approximatif.
- Fins : des fins alternatives selon la réussite pendant l'aventure (« Le
  labyrinthe oublié », quatre, et une fin cachée écrite par lui pour mettre
  les élèves au défi) ; ou, pour un long livre, des points de sauvegarde à la
  manière de la série *Tu es le héros* de Larousse Jeunesse (« Électro
  Nick ») : renvoi à un numéro, et l'on repart avec la feuille d'aventure
  enregistrée à ce moment. Ou encore tout le monde va au bout et seule la fin
  s'adapte à la réussite (principe de *Ma première aventure*). Détail de la
  sauvegarde et de la fin cachée en partie 9.
- Forme : chapitres qui se suivent, branches qui se rejoignent à la sortie de
  chaque chapitre ; parfois un chapitre facultatif, ou deux chapitres en
  parallèle (« Électro Nick » : la forêt de champignons géants ou le lac
  d'acide) ; à l'intérieur, les constructions de Que faites-vous (carrefour,
  chemins parallèles, branches qui se rejoignent, goulot), citées avec un
  lien.
- Premier livre : une quarantaine de scènes (la limite gratuite, encart
  retiré le 30 octobre 2026, trop commercial), des élèves qui écrivent à deux ou trois un obstacle et sa
  résolution.
- Débordement : les idées des enfants rendent difficile de freiner l'envie
  d'écrire ; pas de nouveau chapitre une fois le plan posé, mais des chapitres
  qui grandissent un peu, et des scènes hors chapitre pour les plus rapides
  (introduction, épilogue, fin alternative, point de sauvegarde).
- Extensions validées : toutes les scènes n'ont pas de choix ; une défaite
  tôt, d'où la sauvegarde ou la fin adaptée pour ne pas tout recommencer ;
  compter par obstacles avant d'écrire, en sachant que ça débordera.
- Écarté : les « 12 à 20 scènes » de ChatGPT.
- Repris le 31 octobre 2026 d'après une version qu'il apporte : les trois
  formes en liste (branches qui se rejoignent, carrefour, détour facultatif,
  qui remplace le goulot et les chemins parallèles, schéma compris) ; elles
  valent à toutes les échelles, scènes ou chapitres ; plus de chiffre pour un
  premier livre ici, « trop dur à calculer, trop imprécis » (les 80 scènes
  restent dans « En bref ») ; ses deux livres, « environ trois mois »
  chacun, décidé par lui.

#### Premier jet

> ## Combien de chapitres, de scènes et de choix prévoir ?
>
> **Méfiez-vous de l'arbre.** Si chaque choix ouvre deux chemins qui ne se
> rejoignent jamais, dix décisions successives donnent 1 024 fins. Cette
> structure fonctionne pour une histoire très courte, mais devient vite
> ingérable pour un livre de classe.
>
> **Faites se rejoindre les chemins.** Le plus simple est d'enchaîner des
> chapitres dans lesquels les branches se séparent puis se retrouvent. Pour
> varier les aventures, trois structures sont particulièrement utiles :
>
> - **Les branches qui se rejoignent :** plusieurs chemins différents mènent
>   à une même scène.
> - **Le carrefour :** le lecteur explore plusieurs directions et revient au
>   même endroit avant de poursuivre.
> - **Le détour facultatif :** le lecteur peut explorer une scène
>   supplémentaire, découvrir un secret ou récupérer un objet avant de
>   retrouver l'histoire principale.
>
> Ces structures fonctionnent à toutes les échelles : elles relient des
> scènes à l'intérieur d'un chapitre, mais aussi des chapitres entiers entre
> eux. Vous pouvez les combiner pour construire des aventures variées sans
> multiplier les chemins à l'infini.
>
> **Comptez par obstacles.** Un obstacle occupe souvent trois ou quatre
> scènes : le problème, les différents choix et leurs conséquences. Ajoutez
> les scènes de transition, les rencontres et les fins pour estimer la taille
> du livre. Toutes les scènes n'ont pas besoin de proposer un choix :
> alternez les moments de lecture et les décisions importantes. Pour un
> premier projet, mieux vaut une aventure courte qui fonctionne qu'un livre
> trop ambitieux.
>
> **Prévoyez que ça débordera.** Les idées des élèves feront naturellement
> grandir l'histoire. Évitez toutefois de multiplier les chapitres une fois
> le plan établi : laissez plutôt ceux qui existent s'enrichir. Gardez aussi
> quelques scènes hors chapitre pour les plus rapides : introduction,
> épilogue, fin alternative ou point de sauvegarde.
>
> **Choisissez comment l'aventure se termine.** Le plus simple est de
> laisser tous les lecteurs aller au bout, avec différentes fins selon leurs
> réussites. Vous pouvez aussi prévoir quelques défaites prématurées,
> notamment au début, quand recommencer est facile : le lecteur voit que ses
> décisions comptent. Dans un livre plus long, des points de sauvegarde
> permettent de reprendre à une scène donnée, avec les objets et les points
> conservés à ce moment-là.
>
> **Dans ma classe.** « Le labyrinthe oublié » compte 13 chapitres,
> 213 scènes et quatre fins selon la réussite, plus une fin secrète.
> « Électro Nick » compte 19 chapitres et 323 scènes, avec des sauvegardes et
> des chapitres alternatifs, comme la forêt de champignons géants ou le lac
> d'acide. Ces deux livres ont demandé environ trois mois d'écriture.

### 7. Organiser les choix

- Deux choix par passage, trois au plus ; chaque choix a une raison, le
  lecteur doit en savoir assez pour décider.
- Le faux choix (gauche ou droite) contre le choix qui change la suite ;
  choix formulés comme des attitudes.
- Typologie attribuée à Que faites-vous : primordial, secondaire, décor,
  écueil. Introuvable dans les six articles de Que faites-vous cités
  (vérifié le 28 octobre 2026) ; peut-être *La Feuille d'Aventure* n° 4, non
  lue : source à retrouver, hors de la page d'ici là.

#### Expérience du porteur (28 octobre 2026)

- Cette étape ne travaille pas l'écriture, mais deux compétences nommées par
  [Que faites-vous](https://www.quefaitesvous.com/blog/creer-un-livre-jeu-en-classe/)
  (« Pourquoi faire créer une histoire interactive en classe ? ») :
  développer la logique narrative, travailler la compréhension des
  conséquences.
- Le plus difficile (partie 5) : trouver des choix pertinents, pour un livre
  logique et non un enchaînement de choix au hasard.
- Méthode : on étudie d'abord les sortes de choix (pertinent, piège, réussir
  en laissant des plumes, énigme) ; devant son obstacle, l'élève cherche un
  choix de chaque sorte ; on garde les deux ou trois plus pertinents, avec au
  moins un bon choix, souvent un mauvais.
- Le hasard n'est pas interdit, mais ne doit pas avoir de mauvaise
  conséquence : deux chemins au hasard s'ils mènent à des obstacles
  équivalents, jamais une défaite par simple malchance. Sinon, un indice, un
  objet ou une raison de penser qu'un choix vaut mieux que l'autre.
- Ce que coûte un mauvais choix dépend du système de jeu : dans « Électro
  Nick », du temps, de la volonté, des boulons (la monnaie du livre) ; le
  désert de geysers fait perdre du temps, mais on y gagne de la volonté et,
  par un objet, des boulons. Les réserves d'huile, en exemple anonyme
  (« Les passeurs de brume » est le livre d'exemple du site, jamais cité
  comme le travail d'une classe).
- Phrase du choix : courte, un verbe d'action, la même forme dans tout le
  livre, rien qui dévoile la suite.
- Extensions validées : le choix comme attitude ; le test du « si…
  alors » à l'oral ; récompenser la curiosité par un objet ou un indice.
- Encart retiré le 30 octobre 2026 (numéros dits en partie 10).
- Repris le 31 octobre 2026 d'après sa version, prise telle quelle : cinq
  pistes, en questions, pour aider les élèves à trouver des choix (explorer,
  changer de méthode, observer, faire un compromis, adopter une attitude) ;
  il n'y a pas forcément un bon et un mauvais choix ; toutes les erreurs ne
  sont pas punies ; exemples d'« Électro Nick » (le laboratoire de Vortex, le
  camp des esclaves). Quittent la partie, sans regret de sa part : les
  sortes de choix (bon, piège, réussite qui coûte, énigme), le piège qui
  coûte sans tout faire perdre, les deux chemins au hasard comparables, et
  le lien vers Que faites-vous (pour la future section « Pour aller plus
  loin »). Le 1er novembre 2026, les énigmes y entrent (« Des énigmes à
  résoudre »), retirées de la partie 9.
- Le 3 novembre 2026, pour alléger la page : les cinq pistes en cartes, chacune
  avec son pictogramme (boussole, clé, loupe, balance, cœur), sa question en
  accroche et son exemple.
- Le même jour : le laboratoire de Vortex en schéma sous « Donnez une raison
  de choisir » (la situation et ce que le lecteur sait, deux phrases de choix,
  ce que chacune fait gagner et perdre, « Aucun des deux n'est le bon
  choix »), son texte dans `Choix.tsx` ; quittent le texte la phrase sur les
  avantages et les inconvénients, et le laboratoire du « Dans ma classe ».

#### Premier jet

> ## Comment organiser les choix ?
>
> Pour les élèves, c'est l'étape la plus difficile : inventer des choix
> intéressants, dont les conséquences restent logiques. Le lecteur ne doit
> pas simplement choisir au hasard, mais pouvoir réfléchir aux différentes
> possibilités.
>
> **Cinq pistes pour imaginer des choix.** Face à un obstacle, les élèves
> peuvent s'appuyer sur quelques questions pour trouver des idées :
>
> - **Explorer** — *Où aller ?* Visiter une grotte mystérieuse ou poursuivre
>   son chemin.
> - **Changer de méthode** — *Comment agir ?* Escalader un mur ou convaincre le
>   garde de te laisser passer.
> - **Observer et réfléchir** — *Quel indice utiliser ?* Examiner les symboles
>   d'une porte ou tenter de l'ouvrir directement.
> - **Faire un compromis** — *Que sacrifier pour obtenir autre chose ?*
>   Traverser une zone dangereuse pour récupérer un objet ou gagner du temps
>   en l'évitant.
> - **Adopter une attitude** — *Comment réagir ?* Aider un inconnu ou
>   poursuivre sa mission.
>
> **Imaginez les conséquences.** Pour chaque obstacle, demandez à l'élève de
> trouver deux ou trois façons de réagir, puis d'imaginer ce qui se passe
> pour chacune. Faites-lui formuler ses idées à voix haute : « Si le héros
> fait ceci, alors… ». Un choix peut permettre de réussir, de découvrir un
> indice, de gagner ou de perdre une ressource, mais aussi provoquer une
> rencontre inattendue ou une situation comique. Toutes les erreurs n'ont pas
> besoin d'être punies.
>
> **Donnez une raison de choisir.** Un indice dans le texte, un objet trouvé
> plus tôt ou l'avertissement d'un personnage doivent permettre au lecteur
> attentif d'anticiper certains risques. Le hasard a aussi sa place, mais
> évitez les défaites impossibles à prévoir.
>
> **Des énigmes à résoudre.** Elles sont difficiles à inventer : cherchez
> des idées avec les élèves, puis aidez-les à construire une énigme avec des
> indices clairs et une solution logique. Ne cherchez pas à tout prix à
> l'intégrer parfaitement à l'histoire : une situation un peu artificielle
> n'est pas gênante si l'énigme est amusante à résoudre.
>
> **Soignez la formulation des choix.** Utilisez des phrases courtes, avec
> une action claire et une forme cohérente dans tout le livre. Donnez
> suffisamment d'informations pour décider, sans dévoiler la conséquence :
> « Si tu traverses le vieux pont malgré ses planches abîmées, va au 12 »,
> plutôt que « Si tu tombes du pont, va au 12 ».
>
> **Dans ma classe.** Dans « Électro Nick », au camp des esclaves, les
> lecteurs doivent choisir entre explorer les lieux ou profiter d'une bonne
> nuit de sommeil. Comme devant le laboratoire de Vortex, ce ne sont pas des
> choix entre le bien et le mal : chaque décision a ses avantages, et c'est
> au lecteur de peser le pour et le contre.

### 8. Relire et garder la cohérence

- Fiche commune des personnages, des lieux, des objets et des événements
  établis, avant d'écrire (incohérences relevées par Zannettacci).
- Lire le passage d'avant avant d'écrire ; relecture croisée des raccords ;
  un élève chargé d'uniformiser.
- Séparer la relecture du récit (l'histoire fonctionne-t-elle, le choix
  a-t-il une raison ?) de la correction de la langue (texte de ChatGPT,
  idée retenue).
- Réécrire longtemps ; consignes d'amélioration : cinq sens, détails, héros
  qui parle.

#### Expérience du porteur (28 octobre 2026)

- L'histoire sur le papier, la langue à l'ordinateur.
- Les éléments demandés par la consigne sont obligatoires ; il souligne ceux
  qui manquent. Certains écrivent trop vite, pressés d'écrire d'autres
  scènes : il les modère et refuse les textes trop courts, pour qu'ils
  apprennent à développer, à décrire.
- L'élève fait ce qu'il peut. S'il n'a pas assez travaillé, une consigne de
  réécriture, parfois seulement « revois l'orthographe ». S'il a fait au
  mieux pour son niveau, il corrige l'orthographe avec l'IA et, pour les plus
  en difficulté, améliore un peu la grammaire pour que le texte se
  comprenne. Il adapte au niveau.
- Aucune faute ni formulation douteuse dans le livre final (« ou alors pas
  volontairement ! »).
- Deux reprises au plus, puis il finit ou reprend avec l'élève.
- Fiche commune des personnages, des lieux et des objets, noms fixés, tenue
  par lui ; un nouvel élément se demande. Fonction souhaitée dans l'outil :
  plan, « Suite recommandée », « Fiche récapitulative de l'histoire »,
  absente de la page tant qu'elle n'existe pas.
- Raccords : dans son chapitre, l'élève les vérifie lui-même (scènes
  voisines affichées en recopiant, lecture d'essai de son chapitre) ; entre
  chapitres, l'enseignant, en faisant les liens puis à la lecture d'essai.
- Extensions écartées : lire sa scène à voix haute (peu réaliste dans une
  grande classe) ; montrer une reprise réussie ; annoncer une longueur
  minimale (trop compliqué).
- Reprise le 31 octobre 2026 d'après sa version, après une analyse d'un
  second modèle (GPT) : une fiche de référence (nom retenu partout) dont
  chaque élève a un exemplaire, tenue par l'enseignant ; le contenu relu
  d'abord sur le brouillon, la langue ensuite (les choix, décidés avant,
  n'y sont plus vérifiés) ; des passages précis à enrichir plutôt qu'une
  longueur ; une ou deux reprises, sans effacer le style de l'élève ; les
  raccords à deux niveaux, l'élève pour son chapitre, l'enseignant pour le
  livre. « Dans ma classe » : l'enseignant très sollicité, les pinces à
  linge et deux élèves au plus au bureau, les autres commençant une scène
  en attendant.

#### Premier jet

> ## Comment relire et garder la cohérence ?
>
> **Gardez une référence commune.** Dès la préparation, constituez une fiche
> de référence des personnages, des lieux et des objets, avec leurs
> caractéristiques essentielles. Chaque élève en possède un exemplaire. Vous
> tenez cette fiche à jour et validez les nouveaux éléments proposés : elle
> évite les contradictions entre chapitres et la multiplication incontrôlée
> des objets.
>
> **Relisez d'abord l'histoire, puis la langue.** Sur le brouillon, vérifiez
> uniquement le contenu : la consigne est-elle respectée ? La scène est-elle
> cohérente ? Ce parti pris peut surprendre, mais inutile de corriger
> l'orthographe d'un texte qu'il faudra peut-être réécrire. Une fois le
> contenu validé, l'élève corrige sa langue avec ses outils, puis saisit son
> texte à l'ordinateur. Vous effectuez la dernière vérification après sa
> remise.
>
> **Faites enrichir les textes.** Certains élèves, pressés de passer à la
> scène suivante, écrivent le strict minimum. Plutôt que d'exiger un texte
> plus long, demandez-leur de développer un point précis : décrire un lieu,
> ajouter un dialogue, montrer une émotion… Leur liste de vérification les aide à
> repérer ce qui manque.
>
> **Adaptez les reprises.** Demandez à chacun de corriger ce qui est à sa
> portée. Pour les erreurs plus difficiles, accompagnez l'élève ou
> intervenez directement (voir « Quelle place donner à l'IA ? »). Évitez de multiplier les allers-retours : après une
> ou deux reprises, mieux vaut terminer le texte avec lui. L'objectif est de
> le faire progresser, sans le décourager ni effacer son style.
>
> **Vérifiez les raccords.** Chaque élève relit son chapitre en empruntant
> tous les chemins possibles. Il contrôle les enchaînements, les choix et les
> conséquences. De votre côté, vérifiez les transitions entre chapitres : les
> personnages, les objets et les événements doivent rester cohérents, quel
> que soit le parcours du lecteur.
>
> **Dans ma classe.** Pendant les séances d'écriture, je suis très sollicité
> et les corrections peuvent vite s'accumuler. Pour organiser les passages à
> mon bureau, j'utilise des pinces à linge portant les prénoms des élèves,
> qu'ils accrochent à la suite sur un fil. Je reçois deux élèves au maximum ;
> les autres restent à leur place et peuvent commencer une nouvelle scène en
> attendant leur tour. Ce système, que j'utilise aussi dans les autres
> matières, évite les files d'attente et permet à chacun de continuer à
> travailler.
>
> *Encart.* Dans Il était une classe, l'élève voit en écrivant la fin de la
> scène qui mène à la sienne et le début de celle qui suit : les raccords se
> font au fil de l'écriture. Il joue ensuite son chapitre pour en essayer
> tous les chemins.

### 9. Objets, énigmes, dé

- Premier projet sans règle de jeu, que des choix : le plus sûr.
- Objets à trouver et à utiliser, renvoi caché par l'objet (« si tu as la
  clé, va au 31 ») ; énigme à code dont la solution donne le numéro.
- Feuille d'aventure à cases à cocher plutôt qu'à chiffres.
- Un dé rarement, une seule règle simple ; éviter les points de vie, durs à
  équilibrer.
- Super-indice caché qui récompense l'exploration (Que faites-vous).

#### Expérience du porteur (28 octobre 2026)

- Pour un premier livre, un système simple à une seule variable : des
  compétences, une caractéristique comme la volonté, ou des objets ; pas
  forcément de dé pour commencer.
- Pas de recette : le système dépend de l'histoire ; un livre long peut avoir
  un système plus riche. Pour son plus long livre, des règles plus complètes,
  surtout pour les jets de dé ; avec le recul, peut-être trop.
- Objets : peu, chacun avec un usage prévu, sur la fiche commune. Seuls
  objets inutiles de ses livres : des achats possibles au magasin, sans
  intérêt, mis exprès.
- Héros : par exemple six compétences proposées, le lecteur en choisit deux ;
  des choix du type « Si ton héros est courageux, tu peux… ».
- Dé : un jet, résultat du dé plus la caractéristique contre un nombre
  minimum. Un jet raté coûte un point, du temps ou un détour, jamais la
  partie à lui seul, sauf si le point perdu était le dernier.
- Énigmes : très dures à faire ; il en discute la forme avec les élèves et
  écrit le plus souvent l'énigme. La réponse donne un numéro ; la bonne scène
  commence par un mot annoncé (« Bravo ») ; sinon, le lecteur est tombé sur
  une autre scène du livre.
- Feuille d'aventure : selon le système, pas de modèle unique.
- Une histoire d'il y a trois ans, faite seulement à l'écran : rats sauvés,
  points de volonté, unités de temps.
- Encart de l'outil : les objets et les actions de jeu se choisissent dans
  une liste commune (difficulté passée : une cinquantaine de formules
  recopiées).
- Extensions validées : une variable qui vient de l'histoire (rats sauvés,
  temps, huile d'une lanterne, volonté) ; des règles courtes, à nuancer par
  son livre le plus long ; un jet raté coûte un détour, pas la partie.
- Va ailleurs : tester avec le héros le plus faible en partie 10 ; la
  sauvegarde en partie 6.
- Reprise le 1er novembre 2026 d'après sa version, prise telle quelle :
  titre « Faut-il des objets, des compétences ou un dé ? » ; un exemple
  chiffré du jet de dé ; chaque compétence doit servir ; vérifier qu'un
  objet ou une jauge ne bloque pas l'histoire. Retirés : le paragraphe sur
  les énigmes et l'encart de l'outil (« on verra à la fin » : les encarts
  seront revus ensemble à la fin). Légende de la fiche aventure : « notre
  plus long livre ». Puis : des exemples tirés d'une histoire (l'huile d'une
  lanterne, les personnes sauvées) ; « Dans ma classe » retiré ; la règle du
  dé en schéma ; puis un nouveau « Dans ma classe », de lui, sur la fiche
  d'aventure trop complète d'« Électro Nick », la fiche montrée dessous.

#### Premier jet

> ## Faut-il des objets, des compétences ou un dé ?
>
> **Pour un premier livre, un seul mécanisme de jeu suffit.** Une jauge de
> volonté, des objets à collecter ou des compétences : choisissez un système
> simple. Vous pouvez même commencer sans aucune règle supplémentaire, avec
> seulement des choix. Le dé peut attendre. Pour les projets suivants, vous
> pourrez enrichir les règles si l'histoire le justifie.
>
> **Des règles qui viennent de l'histoire.** Plutôt que des points abstraits,
> comptez ce que l'histoire rend important : l'huile d'une lanterne, les
> personnes sauvées, du temps. La règle se retient mieux, et chaque perte ou
> chaque gain se raconte.
>
> **Des règles faciles à expliquer.** Elles se lisent au début du livre,
> avant la première scène, et figurent en tête de la feuille d'aventure. Si
> une règle demande de longues explications pour être comprise,
> simplifiez-la.
>
> **Des objets qui servent.** Prévoyez peu d'objets, chacun avec une utilité
> définie à l'avance : ouvrir un choix (« Si tu as la clé, va au 31 »),
> éviter un piège… Un objet ramassé qui ne sert jamais risque de décevoir.
> Une exception amusante : le magasin, où l'on peut acheter des choses
> inutiles et gaspiller son argent.
>
> **Construire son héros.** Proposez par exemple six compétences ; le lecteur
> en choisit deux. Certains choix en dépendent : « Si ton héros est
> courageux, tu peux… ». Veillez à ce que chaque compétence serve au moins
> une fois dans l'histoire.
>
> **Le dé, avec une seule règle.** Par exemple, le résultat du dé ajouté à une
> compétence doit atteindre un nombre fixé.
>
> **Vérifier que tout fonctionne.** Un objet ou une jauge ne doit pas bloquer
> involontairement l'histoire. Peut-on arriver devant une porte sans avoir eu
> la possibilité de trouver la clé ? Peut-on perdre plus de points qu'on n'en
> possède ? Prévoyez ces situations et testez les différents parcours.
>
> **Dans ma classe.** Pour « Électro Nick », mon plus long livre-jeu, j'avais
> prévu une feuille d'aventure assez complète : des points de volonté, des
> boulons, des rations, des unités de temps, un inventaire d'objets et des
> bonus aux jets de dé. Les élèves devaient tenir compte de tous ces éléments
> dans leurs chapitres. Avec le recul, c'était peut-être un peu trop !


### 10. Vérifier les chemins

- Repérer les passages que rien ne relie, les choix sans destination, les
  fins manquantes : à la main dans toutes les ressources (tableau, grille
  cochée).
- Tester avec d'autres lecteurs : une autre équipe, une autre classe, des plus
  jeunes ; rôles lecteur, noteur de numéros, preneur de notes ; pages
  affichées dans l'école (Lannilis).
- Tester avec le héros le plus faible, en appliquant les règles à la lettre.
- Mélanger les numéros à la fin, en éloignant les destinations d'un même
  choix ; garder des numéros libres.

#### Expérience du porteur (29 octobre 2026)

- Les élèves jouent leur chapitre seulement, par la lecture d'essai, qui
  permet de revenir en arrière et de tester toutes les possibilités.
- Lui joue le livre entier plusieurs fois.
- Liens vérifiés autrefois dans un tableau Excel, « franchement
  compliqué » : relever ces manques est un des gros points forts de
  l'application ; encart un peu plus développé qu'ailleurs.
- Numéros : tout à la fin ; on fixe les scènes qui en ont besoin (énigmes,
  sauvegardes), on regroupe plusieurs chapitres pour que les scènes d'un même
  chapitre ne se retrouvent pas côte à côte, puis on tire au sort ; c'est ce
  que fait l'application.
- Il répare liens et numéros ; les textes qui ne raccordent pas reviennent à
  leur auteur.
- Va en partie 12 : la découverte du livre par la classe, lu ensemble avant
  de le recevoir ou découvert à la maison.
- Extensions : il n'en veut pas pour cette partie.
- Le 4 novembre 2026, à sa demande : la phrase sur la vue des chemins
  d'Il était une classe, entrée dans « Contrôlez les liens », passe dans un
  encart sous l'arbre du « Pont effondré », puis retirée à sa demande : l'encart
  de fin de partie suffit.
- Repris le 2 novembre 2026 d'après sa version, analysée : repères
  provisoires pendant l'écriture, dernière vérification des renvois après la
  numérotation ; le tableau à la main écarté avec humour au profit d'outils
  gratuits nommés (Twine, diagrams.net) ; « Dans ma classe » : le tableur du
  premier livre, puis l'outil né de ce problème et du suivi de la
  classe. Écartés par lui : « le livre doit pouvoir se finir, sans être trop
  facile », la raison des numéros imposés par les énigmes.

#### Premier jet

> ## Comment vérifier que tous les chemins mènent quelque part ?
>
> **Chacun teste son chapitre.** Une fois son chapitre écrit, l'élève le
> joue comme un lecteur, explore tous les chemins et corrige ce qui ne
> fonctionne pas. Il ne teste que le sien : le reste, il le découvrira dans
> le livre.
>
> **Vous jouez le livre entier, plusieurs fois.** C'est vous qui vérifiez
> les raccords entre chapitres, repérez les blocages et évaluez la
> difficulté du jeu.
>
> **Contrôlez les liens.** Faites un tableau, listez les scènes, notez leurs
> destinations, vérifiez chaque renvoi… Non, sérieusement, épargnez-vous ça !
> Des outils gratuits comme [Twine](https://twinery.org/) ou
> [diagrams.net](https://app.diagrams.net/) permettent de visualiser votre
> histoire et de retrouver les scènes bien plus facilement. Il faut un peu de
> temps pour les apprivoiser, mais vous ne le regretterez pas !
>
> **Réparez.** Les erreurs de liens et de numéros, c'est vous ; un texte qui
> ne raccorde pas retourne à son auteur.
>
> **Numérotez à la toute fin.** Pendant l'écriture, utilisez des repères
> provisoires pour identifier les scènes. Une fois le livre terminé, fixez
> d'abord les numéros imposés par les énigmes ou les sauvegardes (s'il y en
> a). Attribuez ensuite les autres au hasard, en mélangeant plusieurs
> chapitres pour que les scènes d'un même chapitre ne se suivent pas.
> Vérifiez une dernière fois tous les renvois.
>
> **Dans ma classe.** Pour mon premier livre-jeu, je vérifiais tous les
> liens dans un tableur. C'était franchement fastidieux, surtout pour
> retrouver les scènes et suivre leurs modifications ! C'est d'ailleurs ce
> problème, avec le suivi de la classe, qui m'a poussé à apprendre à
> programmer : je voulais créer un outil pour gérer tout cela plus
> facilement.
>
> *Encart.* Dans Il était une classe, la vérification des chemins relève
> seule les choix sans destination, les scènes que rien ne relie et celles
> qui n'ont pas de suite. Et l'outil numérote à votre place : il garde les
> numéros fixés, éloigne les scènes d'un même chapitre et tire le reste au
> sort.

### 11. Combien de temps

- Séquences courtes : 6 à 8 séances de 45 à 50 minutes ; 5 à 10 heures
  d'écriture (parcours québécois « Quêtes et péripéties », non lu).
- Livres de classe : plusieurs mois (Zannettacci, cinq mois).
- Le texte de ChatGPT propose deux formats, court (8 à 12 séances) et long
  (une période ou plus) : idée de présentation à garder, chiffres à remplacer
  par ceux du porteur.

#### Expérience du porteur (29 octobre 2026)

- Deux séances d'une heure par semaine. Alterner feuille et ordinateur
  motive les élèves, qui aiment taper : pour certains, « la carotte ».
- Phases d'un grand livre : découverte des livres-jeux, une période,
  informellement (temps de pause) ; étude du fonctionnement, 2 séances ;
  préparation de l'histoire, 2 séances ; préparation des chapitres
  (obstacles, choix, conséquences), 2 séances ; mise en place des chapitres,
  des scènes et des consignes par l'enseignant, la phase la plus longue pour
  lui, faite pendant des vacances pour bien faire sans stress ; écriture, une
  ou deux périodes selon la longueur ; mise en page et illustration, environ
  une semaine, variable ; impression, moins de deux semaines pour être livré.
  Le déroulé séance par séance s'affinera sur la page « Ressources ».
- Formats, hors découverte et impression : un premier livre court en une
  période, un grand livre en trois mois.
- Dans l'année : découverte en P2, préparation en P3, écriture en P4 et P5,
  fin de l'écriture fin mai dans l'idéal.
- Temps de l'enseignant : une vingtaine d'heures, divisé par deux avec
  l'application (son estimation, dite comme telle).
- Extensions écartées : partir de la date de remise ; des créneaux fixes
  dans l'emploi du temps.
- Repris le 2 novembre 2026 d'après sa version, analysée : « un bon
  rythme » ; un premier livre d'environ 80 scènes en une ou deux périodes
  (aligné sur « En bref », la limite gratuite de 40 scènes en devenant la
  moitié) ; un grand livre en deux périodes d'écriture, le tableau gardant
  « une ou deux périodes » à sa demande ; préparer les chapitres en 3 à
  4 séances (voulu) ; une ligne « Relire et tester le livre » ; les textes
  finis vers la mi-mai, le livre à l'impression fin mai, reçu vers la
  mi-juin ; le temps de vacances passé dans « Dans ma classe », avec sa
  raison ; l'encart sans « l'organisation des scènes » ni « les liens »,
  que l'enseignant fait lui-même. Précisé par lui : une commande arrive en
  10 jours au plus. Alignés ensuite : « une dizaine de jours par commande »
  dans le tableau, « une ou deux périodes » dans « En bref », « Envoyez le
  livre à l'impression fin mai » en partie 13.
- Le 3 novembre 2026, pour alléger la page : « Dans l'année » en frise sur deux
  lignes (avec la classe, de novembre à mai, les vacances d'hiver pour vous ;
  puis jusqu'à la livraison), son texte dans `Annee.tsx` ; le paragraphe
  réduit à une phrase.

#### Premier jet

> ## Combien de temps faut-il ?
>
> **Deux séances d'une heure par semaine** constituent un bon rythme.
> Alternez l'écriture sur papier et la saisie à l'ordinateur : beaucoup
> d'élèves aiment taper leur texte, et pour certains, c'est une motivation
> supplémentaire pour terminer leur brouillon.
>
> **Deux formats.** Un premier livre d'environ 80 scènes s'écrit en une
> période, parfois deux. Pour un grand livre de 200 à 300 scènes, comptez
> deux périodes d'écriture, auxquelles s'ajoutent la découverte des
> livres-jeux, la préparation de l'histoire et la fabrication du livre.
>
> **Les étapes d'un grand livre.** Un calendrier possible, à adapter selon
> l'âge et l'autonomie des élèves.
>
> | Étape | Durée |
> |---|---|
> | Découvrir des livres-jeux | Une période, pendant les temps calmes ou de lecture offerte |
> | Étudier leur fonctionnement | 2 séances |
> | Préparer l'histoire | 2 séances |
> | Préparer les chapitres : obstacles, choix, conséquences | 3 à 4 séances |
> | Mettre en place les scènes et les consignes (vous) | Un temps de préparation dédié |
> | Écrire | Deux périodes |
> | Relire et tester le livre | 2 séances |
> | Mettre en page, illustrer | Environ une semaine |
> | Imprimer et recevoir les livres | Une dizaine de jours par commande |
>
> **Dans l'année.** Comptez à rebours depuis la livraison, à la mi-juin :
> les textes doivent être terminés au début du mois de mai.
>
> **Votre temps.** Organiser les chapitres, préparer les scènes et rédiger
> les consignes est sans doute l'étape la plus exigeante. On peut avoir
> l'impression de passer beaucoup de temps sans voir le livre avancer. Mais
> une fois ce travail terminé, le plus dur est derrière vous ! Les élèves
> peuvent se lancer dans l'écriture, les scènes s'enchaînent et le livre
> prend forme à vue d'œil.
>
> **Dans ma classe.** Pour un grand livre-jeu, je compte une vingtaine
> d'heures de travail personnel sur l'ensemble du projet. Avec Il était une
> classe, ce temps est à peu près divisé par deux. J'essaie toujours
> de faire coïncider la préparation des scènes et des consignes avec des
> vacances scolaires. Je peux ainsi m'y consacrer tranquillement, sans faire
> attendre les élèves entre deux étapes.

### 12. Illustrer, imprimer, partager

- Illustrations des élèves, couverture, harmonie graphique.
- Impression : coopérative scolaire (OCCE), précommandes des familles ;
  imprimeur en ligne.
- Lecture publique aux autres classes, lecture aux plus jeunes, publication en
  ligne, livre audio en prolongement (projet de CE2 cité par ChatGPT, non lu).
- Droits des élèves : leurs textes et dessins leur appartiennent ;
  autorisation des représentants légaux pour diffuser ; guide officiel du
  droit d'auteur à l'école (à retrouver et vérifier).

#### Expérience du porteur (29 octobre 2026)

- Illustrer, deux possibilités au même niveau : les dessins des élèves,
  chacun son chapitre, avec une règle commune ; ou des images par IA, au rendu
  plus « pro », dont les élèves sont d'autant plus fiers et aiment la
  surprise, et qui font gagner du temps ; les élèves peuvent décrire l'image
  voulue (possible dans l'application), l'adulte la crée. Sa préférence,
  personnelle : l'IA.
- Couverture : il la fait lui-même ; on peut la confier aux élèves. Ils sont
  surtout fiers d'avoir écrit un vrai livre ; un dessin d'enfant en
  couverture fait la fierté d'un seul contre celle de tous d'avoir écrit un
  livre « qui en jette » ; il préfère de belles images, faciles à comprendre,
  pour un objet proche d'un vrai livre. Préférence personnelle.
- Impression : précommande des parents, intérieur en noir et blanc ou en
  couleur. Ne pas citer epubli, qui livre depuis l'Allemagne. Prix réels
  (facture epubli du 22 juin 2026, « Électro Nick, le dernier prototype »,
  TVA allemande de 7 % comprise) : 11,82 € l'exemplaire en noir et blanc,
  29,11 € en couleur, une troisième version à 33,78 € (à préciser) ; port
  2,95 € ; livraison en 8 à 10 jours ouvrés.
- D'abord un exemplaire d'essai pour vérifier, lu en classe ; puis
  l'impression pour les élèves. Il préfère la découverte en classe ; l'autre
  façon, à la maison, reste citée (partie 10).
- Un livre de plus pour la bibliothèque de l'école ; en ligne pour ceux qui
  ne peuvent pas l'acheter ; lu à d'autres classes.
- Autorisations : la diffusion en ligne était jusqu'ici privée ; avec le site
  public, il fait signer des autorisations. Modèle sur la page « Ressources ».
- Extensions écartées : une image qui aide à comprendre ; les auteurs qui
  mènent la partie devant une classe plus jeune.
- Prix donnés le 30 octobre 2026 : « Les passeurs de brume » (livre
  d'exemple du site, 32 pages), 4 € l'exemplaire en noir et blanc, 5 € en
  couleur ; un livre moyen d'une vingtaine d'images, une dizaine d'euros.
  Idée à faire passer : décider du format à l'avance, les prix montent vite.
- Le 2 novembre 2026, à sa demande : la couverture d'un élève ne ferait la
  fierté que d'un seul ; il préfère un livre aussi proche que possible de
  ceux de la librairie (« Je veux un livre qui en jette » retiré).
- Le 3 novembre 2026, à sa demande : les prix en tableau (pages, images, noir
  et blanc, couleur), avec ses chiffres : « Électro Nick », 248 pages ;
  « Les passeurs de brume », 10 images ; un livre moyen, 80 pages, 20 images,
  8 € en noir et blanc. Puis « Le labyrinthe oublié » : 140 pages, 85 images,
  8 € en noir et blanc, 17 € en couleur.
  Le livre moyen passe ensuite à 30 images et 6 € en noir et blanc, pour
  rester cohérent avec lui (« En bref » aligné : une trentaine d'images).
- Le 3 novembre 2026, à sa demande : l'exemplaire d'essai demande le temps de
  le relire et de corriger ; il se lit ensemble en classe, en attendant les
  livres de chacun.
- Repris le 3 novembre 2026 d'après sa version, analysée : style commun et
  apparence des personnages pour les images par IA, une couverture soignée,
  le travail collectif plutôt que le dessin d'un seul, les illustrations des
  enfants qui gardent leur place ; un livre moyen à une dizaine d'euros en
  couleur, le format décidé à l'avance (repris de « En bref ») ; une
  dizaine de jours par commande ; un livre accessible à tous, l'achat
  facultatif ; des autorisations avant d'imprimer comme de diffuser, le
  modèle d'autorisation élargi à l'impression et au partage privé (choix B,
  le 3 novembre 2026, F15).
  Écartés par lui : la surprise et le temps gagné avec l'IA, la lecture en
  classe de l'exemplaire d'essai. « Feuille d'aventure » partout, comme dans
  l'application, légendes comprises.

#### Premier jet

> ## Comment illustrer, imprimer et partager le livre ?
>
> **Deux façons d'illustrer.** Les élèves dessinent : chacun illustre son
> chapitre, avec quelques consignes communes (format, matériel, couleurs)
> pour garder une unité. Ou vous créez les images avec une IA, à partir de
> leurs descriptions (voir « Quelle place donner à l'IA ? »). Définissez un style commun et veillez à conserver
> l'apparence des personnages. Le résultat peut être très soigné, mais
> demande parfois quelques ajustements.
>
> **La couverture.** Réalisez-la vous-même ou concevez-la avec les élèves.
> Dans tous les cas, soignez-la.
>
> **Dans ma classe.** Je préfère les illustrations créées avec une IA, et je
> réalise moi-même la couverture. Je cherche à donner aux élèves un livre
> aussi proche que possible de ceux qu'ils trouvent en librairie. Je préfère
> aussi une couverture qui représente le travail collectif plutôt que de
> mettre en avant le dessin d'un seul élève. C'est un choix personnel : les
> illustrations des enfants ont évidemment leur place dans un projet comme
> celui-ci.
>
> **Imprimer.** Un imprimeur en ligne qui imprime à l'exemplaire suffit.
> Proposez le livre en précommande aux familles, avec le choix entre un
> intérieur en noir et blanc ou en couleur. Décidez du format à l'avance : le
> prix monte vite. Voici ce que coûtait un exemplaire en 2026, à titre
> indicatif et sans les frais de livraison :
>
> | Livre | Pages | Images | Noir et blanc | Couleur |
> |---|---|---|---|---|
> | [« Les passeurs de brume »](/bibliotheque/les-passeurs-de-brume), livre d'exemple du site | 32 | 10 | 4 € | 5 € |
> | Un livre moyen | 80 | 30 | 6 € | 10 € |
> | [« Le labyrinthe oublié »](/bibliotheque/le-labyrinthe-oublie) | 140 | 85 | 8 € | 17 € |
> | [« Électro Nick »](/bibliotheque/electro-nick), un très long livre | 248 | 152 | 12 € | 29 € |
>
> **Un exemplaire d'essai d'abord.** Commandez-en un pour vérifier le rendu
> et corriger les dernières erreurs avant l'impression générale. Prévoyez
> une dizaine de jours de livraison et le temps des corrections. En
> attendant les livres des élèves, vous pourrez lire cet exemplaire ensemble
> en classe.
>
> **Un livre accessible à tous.** L'achat doit rester facultatif. Si le prix
> est un obstacle, plusieurs solutions : choisir le noir et blanc, solliciter
> une aide de la coopérative scolaire, emprunter l'exemplaire de la classe ou
> lire le livre en ligne. L'essentiel est que chaque élève puisse profiter de
> son travail.
>
> **Faites-le vivre.** Gardez un exemplaire à la bibliothèque de l'école,
> organisez une lecture dans une autre classe, laissez les élèves découvrir
> les aventures écrites par leurs camarades.
>
> **Les autorisations.** Les textes et les dessins des élèves sont protégés
> par le droit d'auteur. Avant d'imprimer ou de diffuser le livre, recueillez
> les autorisations écrites nécessaires auprès des élèves et de leurs
> familles, en précisant les usages prévus : impression, partage privé ou
> publication en ligne. Un modèle d'autorisation est sur la page
> « Ressources ».
>
> *Encart.* Dans Il était une classe, le livre se compose seul en un PDF prêt
> pour l'imprimeur. Il se partage aussi en privé, avec les comptes des
> élèves, ou dans la bibliothèque publique du site.

### 13. La place de l'IA

#### Expérience du porteur (4 novembre 2026)

- Ce qu'il lui confie, d'abord pour gagner du temps, ensuite pour
  s'organiser et trouver des idées : un excellent réservoir d'idées pour
  préparer l'histoire ; des idées de choix, moins efficaces (les subtilités
  d'un bon choix lui échappent), mais une aide quand on bloque, qui trouve
  souvent des possibilités auxquelles on n'avait pas pensé ; la mise au
  propre des consignes, d'après son idée générale, liste de vérification
  comprise ; des titres de scènes, qu'il a toujours du mal à trouver ; la
  correction de l'orthographe ; les images.
- Le texte de l'élève reste le sien : l'IA corrige la langue au degré choisi
  par l'enseignant, sans inventer le contenu d'une scène d'élève. Une scène
  d'élève absent qu'il écrit lui-même ne porte plus le nom de l'élève.
- Forme décidée : une partie à elle, en question, avant les erreurs (qui
  deviennent la partie 14) ; les parties 8 et 12 y renvoient. Ajouts
  proposés sans réponse explicite, écrits prudemment dans le premier jet :
  tout ce qu'elle propose se trie ; aucun nom d'élève donné à l'IA, les
  familles prévenues. Question restée ouverte : se sert-il de ses idées
  devant la classe, ou seulement en préparant seul ? Le jet ne le dit pas.
- Réécrit le 4 novembre 2026 après son accord : observations personnelles
  réunies dans « Dans ma classe », exemple d'une idée transformée en consigne,
  préservation du texte et relecture des corrections, images ramenées à un
  renvoi. Les mentions sur les familles et les prénoms transmis à l'IA
  sont ensuite retirées à sa demande.
- Le même jour, après analyse de cette version : pour les choix, l'aide
  quand on bloque revient à côté de la réserve ; le tableau de l'exemple
  (une consigne qui était en fait une liste de vérification) cède la place à
  la fiche « Consigne » de l'application dessinée avant et après « ✦
  Formuler », avec deux ajouts qu'il prévoit : la dictée, et la liste de
  vérification séparée de la consigne.
- Le même jour, à sa demande : ces fiches passent dans un encart, qui dit
  aussi que les élèves n'ont accès à aucune aide d'IA ; l'encart de fin de
  partie, qui ne disait que cela, est retiré.

#### Premier jet

> ## Quelle place donner à l'IA ?
>
> **Une aide pour l'enseignant.** L'intelligence artificielle peut faire
> gagner du temps dans la préparation et la finition du livre. Les élèves
> imaginent l'histoire, écrivent et reprennent leurs textes : le livre reste
> le leur.
>
> **Pour préparer l'histoire.** Demandez-lui des pistes d'univers, de
> personnages, d'obstacles ou de choix. Triez ses propositions : gardez,
> retouchez ou écartez selon l'histoire que vous construisez avec la classe.
>
> **Pour préparer les consignes.** À partir de votre idée d'une scène,
> l'IA peut proposer une consigne et sa liste de vérification.
>
> *Encart.* Dans Il était une classe, dictez ou tapez votre idée : « Formuler »
> la met au propre et prépare la liste de vérification, que vous retouchez.
> Les élèves, eux, n'ont accès à aucune aide d'IA.
>
> **Pour terminer les corrections.** Une fois le contenu validé et le texte
> corrigé par l'élève (voir « Comment relire et garder la cohérence ? »),
> vous pouvez demander à l'IA de reprendre les erreurs restantes :
> l'orthographe seule, ou aussi la grammaire selon les besoins.
>
> **Préserver le texte de l'élève.** Limitez les corrections à ce qui est
> nécessaire, en conservant ses idées et sa manière de raconter. Relisez la
> proposition avant de la retenir : une phrase plus élégante n'est pas
> forcément plus fidèle à son texte.
>
> **Dans ma classe.** Trouver des titres de scènes me prend toujours du
> temps : l'IA m'y aide beaucoup. Pour les choix, ses propositions sont
> moins fines : je dois souvent les retravailler pour que les conséquences
> soient intéressantes et cohérentes. Mais quand je bloque, elle trouve des
> possibilités auxquelles je n'avais pas pensé.

### 14. Erreurs à éviter

- Écrire sans carte ; viser trop grand d'emblée ; ajouter des passages au
  dernier moment ; numéroter à la main en cours de route ; laisser chaque
  élève décrire les personnages à sa façon ; ne pas faire tester.

#### Expérience du porteur (30 octobre 2026)

- Erreurs vécues : sous-estimer le temps et finir avec une livraison juste
  avant les vacances ; un système compliqué, difficile à équilibrer ; laisser
  le volume du livre trop grossir avec les idées.
- Choix au hasard : une erreur seulement s'il y a une sanction derrière ;
  choisir entre gauche et droite est permis si les deux se valent.
- Forme : six à huit lignes au plus, « l'erreur, puis ce qu'il faut faire »,
  avec un lien vers la partie ; rien de nouveau.
- Gardées en plus des siennes : les choix qui sanctionnent sans raison,
  numéroter en cours de route, ne pas tester. Écartées : laisser chacun
  décrire les personnages (couvert par la fiche commune) ; « viser trop
  grand » fondu dans le livre qui grossit ; écrire sans plan.
- Repris le 3 novembre 2026 d'après sa version, analysée : titre « Six
  erreurs à éviter pour votre premier livre-jeu », en puces (une liste
  numérotée ferait double emploi avec les renvois cerclés) ; l'exemplaire
  d'essai anticipé, la commande définitive fin mai, la partie 11 avancée en
  conséquence (textes finis début mai) ; les idées en trop dans les chapitres
  existants, comme en partie 6 ; « Punir le lecteur au hasard » ; « Numéroter
  trop tôt » ; un renvoi pour les tests.

#### Premier jet

> ## Six erreurs à éviter pour votre premier livre-jeu
>
> - **Sous-estimer le temps.** J'ai déjà reçu des livres juste avant les
>   vacances ! Anticipez l'exemplaire d'essai et envoyez la commande
>   définitive fin mai (voir « Combien de temps faut-il ? »).
> - **Un système de jeu trop compliqué.** J'en ai fait l'expérience :
>   difficile à gérer et à équilibrer. Pour commencer, un seul mécanisme
>   suffit (voir « Faut-il des objets, des compétences ou un dé ? »).
> - **Laisser le livre grossir au fil des idées.** Une fois le plan fixé,
>   évitez d'ajouter des chapitres. Les nouvelles idées peuvent trouver leur
>   place dans les chapitres existants
>   (voir « Combien de chapitres, de scènes et de choix prévoir ? »).
> - **Punir le lecteur au hasard.** Un mauvais choix peut avoir de lourdes
>   conséquences, mais le lecteur doit avoir une chance de les anticiper
>   (voir « Comment organiser les choix ? »).
> - **Numéroter trop tôt.** Les ajouts et les modifications deviennent vite
>   un casse-tête. Attendez que toutes les scènes soient en place
>   (voir « Comment vérifier que tous les chemins mènent quelque part ? »).
> - **Négliger les tests.** Chaque élève explore les chemins de son
>   chapitre. De votre côté, jouez le livre entier plusieurs fois avant
>   l'impression
>   (voir « Comment vérifier que tous les chemins mènent quelque part ? »).

## Texte de ChatGPT reçu le 28 octobre 2026 : tri

Repris ci-dessus : l'Éduscol « Réinventer la fiction avec le numérique » ;
Odidoc n° 8 ; le scénario Twine d'Édubase ; « Quêtes et péripéties » ;
Canopé ; le livre audio ; l'arbitrage de l'enseignant ; la séparation de la
relecture du récit et de la langue ; les droits des élèves ; le schéma de
branches qui se rejoignent, à dessiner sur la page.

Écarté ou corrigé :

- Une fiche par étape avec objectif, préparation, déroulement, production
  attendue, différenciation, et des documents à télécharger : contraire à la
  séparation décidée ; à garder pour la page « Ressources ».
- « 12 à 20 scènes » et « 8 à 12 séances » : chiffres sans source.
- L'illustration avant le test des parcours : on vérifie les chemins avant de
  fixer la mise en page et les images.
- Programmes « applicables à tous les niveaux depuis la rentrée 2026 » :
  cohérent avec le calendrier d'Éduscol (CM1 en 2025, CM2 en 2026), à vérifier
  au Bulletin officiel comme le reste.
- Attention au prénom : l'enseignant du Café pédagogique s'appelle aussi
  Nicolas (Zannettacci) ; ne pas laisser croire que c'est le porteur.

## Sources principales

Lues le 28 octobre 2026, souvent par un outil qui résume : chiffres et
formulations à revérifier à la source avant publication.

- Que faites-vous : [créer un livre-jeu en classe](https://www.quefaitesvous.com/blog/creer-un-livre-jeu-en-classe/),
  [les bases](https://www.quefaitesvous.com/blog/ecrire-une-histoire-dont-vous-etes-le-heros-avec-des-eleves-les-bases/),
  [la structure](https://www.quefaitesvous.com/blog/ecrire-une-fiction-interactive-avec-ses-eleves-chapitre-2-tuto-structurel/),
  [un exemple](https://www.quefaitesvous.com/blog/ecrire-une-histoire-dont-vous-etes-le-heros-avec-des-eleves-chapitre-3-un-exemple/),
  [conseils](https://www.quefaitesvous.com/blog/ecrire-une-histoire-dont-vous-etes-le-heros-conseils/),
  [écrire à plusieurs](https://www.quefaitesvous.com/blog/tuto-ecrire-a-plusieurs-collaborateurs-et-relecteurs/).
- Retours de classe : [Zannettacci, Café pédagogique, 10 novembre 2025](https://www.cafepedagogique.net/2025/11/10/nicolas-zannettacci-quand-les-eleves-ecrivent-un-livre-interactif/) ;
  [Dunoyer, Café pédagogique, 2007](https://www.cafepedagogique.net/2007/03/22/comment-j-ai-ecrit-un-recit-interactif-avec-mes-eleves-celine-dunoyer/) ;
  [Lamouche, école de Nolay](https://lamouche.home.blog/2019/04/08/livre-dont-vous-etes-le-heros/) ;
  [enseignons.be](https://www.enseignons.be/preparation/10789-livre-dont-vous-etes-le-heros/) ;
  [CM1 de Saint-Cloud, académie de Versailles](https://pedagogie92.ac-versailles.fr/2022/06/28/ecrire-un-livre-interactif-numerique-dont-on-est-le-heros/) ;
  [école Montgolfier](https://ec-montgolfier-mondeville.ac-versailles.fr/spip.php?article318) ;
  [grand jeu de Lannilis](https://www.clsh-lannilis.com/phocadownload/grands_jeux/histoire_heros.pdf) ;
  [Guerin, Twine au cycle 3](https://view.genially.com/605092b58e555d0d3c8f90ae/presentation-histoires-a-embranchements-et-twine-cycle-3).
- Officiel et recherche : [calendrier des programmes, Éduscol, juillet 2026](https://eduscol.education.gouv.fr/sites/default/files/document/calendriernouveauxprogrammes-129025.pdf) ;
  [programme du cycle 3, BO n° 16 du 17 avril 2025](https://education.gouv.fr/bo/2025/Hebdo16/MENE2504620A) (non lu directement) ;
  [Réinventer la fiction avec le numérique, Éduscol](https://eduscol.education.gouv.fr/6870/reinventer-la-fiction-avec-le-numerique) (non lu) ;
  [Campion, UCLouvain](https://research.dial.uclouvain.be/bitstreams/85b4d44a-c963-4fd8-9002-5b7b30af63aa/download).
- Savoir-faire d'auteurs : [« Comment rédiger son AVH ? », La Feuille d'Aventure n° 4](https://litteraction.fr/sites/default/files/fa-04.pdf) ;
  [rendre une aventure difficile](https://litteraction.fr/article/litterature-interactive/comment-rendre-une-aventure-difficile) ;
  [Emily Short, petites structures](https://emshort.blog/2016/11/05/small-scale-structures-in-cyoa/) ;
  [Sub-Q, la branche et la fusion](https://sub-q.com/making-interactive-fiction-the-branch-and-the-merge/).
- En anglais : [Kristin King, inklewriter en classe](https://kristinking.org/2015/04/29/inklewriter-in-the-classroom/) ;
  [ReadWriteThink](https://www.readwritethink.org/classroom-resources/lesson-plans/choose-your-adventure-hypertext) ;
  [Digital Technologies Hub](https://www.digitaltechnologieshub.edu.au/teach-and-assess/classroom-resources/lesson-ideas/plan-a-choose-your-own-adventure-story/) ;
  [Scottish Book Trust](https://www.scottishbooktrust.com/articles/engaging-writers-using-branching-narrative/).
- Livres jeunesse : [Hatier, La classe dont tu es le héros](https://www.editions-hatier.fr/livre/la-classe-dont-tu-es-le-heros-pole-nord-cpce1-67-ans-9782401116504) ;
  [Hatier, Le monde dont tu es le héros](https://www.livreshebdo.fr/article/hatier-jeunesse-lance-la-collection-le-monde-dont-tu-es-le-heros).

## Reste à traiter avant publication

- **La section « Pour aller plus loin »** (idée du porteur, 31 octobre
  2026) : écrite le 4 novembre 2026, sous la partie 14, d'après nos deux
  sélections (la sienne venue de GPT), chaque page vérifiée en ligne ce
  jour-là : Nicolas Zannettacci (Café pédagogique, 2025), l'école de Nolay
  (2019), Que faites-vous « Les bases » (2024), Fiction-interactive.fr sur
  les structures (2019). Écartés : la fiche de l'académie de Nice
  (introuvable pour lui), Éduscol « Réinventer la fiction » (hors du
  livre-jeu, surtout collège et lycée, une section où l'élève écrit avec une
  IA), Littéraction (pour auteurs avancés), le CM1 de Saint-Cloud (site de
  l'académie injoignable). Le pied, qui portait ce nom, devient « Lire et
  essayer ». À revérifier juste avant la publication.

- **La place de l'IA dans le projet** (demandé par le porteur le 30 octobre
  2026) : entretien fait le 4 novembre 2026, premier jet écrit (partie 13),
  à relire avec lui.

## À vérifier avant publication

- La date de mise à jour (`DATE_DU_GUIDE`, `app/src/domaine/guide.ts`, encore
  au 30 octobre 2026) : celle du jour de la publication, posée au moment de
  pousser.
- Les références exactes des programmes, sur le Bulletin officiel (cycle 2
  au BO n° 41 du 31 octobre 2024, EMC, compétences numériques) ; le cycle 3
  est vérifié pour la partie 1 le 30 octobre 2026.
- Les sources non lues : Éduscol « Réinventer la fiction », Édubase (Twine),
  Odidoc n° 8, « Quêtes et péripéties », Canopé, académie de Nice, mémoires
  universitaires.
- Les âges et la disponibilité des livres-jeux cités (éditeurs de la
  partie 3 vérifiés le 30 octobre 2026).
- Chaque chiffre repris d'une source.
- Les prix d'impression de l'« En bref » et de la partie 12 (facture de juin
  2026, TVA allemande) et la troisième version à 33,78 €, à préciser.
- Ce que contient la bibliothèque à la publication (partie 3).
