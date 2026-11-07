// Écrit par `npm run guide:texte` depuis docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md : ne pas
// modifier ici, retoucher le document puis relancer la commande.
import type { TexteDuGuide } from "./guide";

export const TEXTE_DU_GUIDE: TexteDuGuide = {
  "titre": "Comment écrire un livre dont vous êtes le héros en classe",
  "definition": "Un livre dont vous êtes le héros, ou livre-jeu, est un récit découpé en scènes numérotées où le lecteur choisit la suite : à la fin d’une scène, il se rend au numéro de son choix. L’écrire avec sa classe, c’est inventer l’aventure ensemble, puis se partager l’écriture des scènes, que l’enseignant relie en un seul livre.",
  "auteur": "Par Nicolas Coussot, professeur des écoles, six ans de livres-jeux avec sa classe.",
  "avantDeCommencer": "Ce guide rassemble ce que j’ai appris en six ans de livres-jeux avec mes élèves, mes réussites comme mes erreurs. Ce ne sont pas des règles : chaque classe est différente, et vous trouverez sûrement d’autres façons de faire. Prenez ce qui vous sert.",
  "enBref": [
    {
      "chiffre": "1 à 3 mois",
      "texte": "d’écriture avec la classe : une ou deux périodes (six à sept semaines chacune) pour un premier livre, trois mois pour un grand.",
      "partie": 11
    },
    {
      "chiffre": "20 h",
      "texte": "de travail pour vous sur un grand livre : préparer le plan du livre et les consignes, relire, ajouter les illustrations ; pas seulement corriger des textes.",
      "partie": 11
    },
    {
      "chiffre": "4 temps",
      "texte": "pour mener le projet : découvrir le genre, préparer l’histoire, écrire et relire, fabriquer le livre.",
      "partie": 11
    },
    {
      "chiffre": "80 scènes",
      "texte": "pour un premier livre, soit une vingtaine d’obstacles : un par élève dans une classe ordinaire.",
      "partie": 6
    },
    {
      "chiffre": "10 €",
      "texte": "environ l’exemplaire en couleur d’un livre moyen, d’une trentaine d’images. Décidez du format à l’avance : le prix monte vite.",
      "partie": 12
    }
  ],
  "lectures": [
    "**Un projet vécu en CM1-CM2.** [Quand les élèves écrivent un livre interactif](https://www.cafepedagogique.net/2025/11/10/nicolas-zannettacci-quand-les-eleves-ecrivent-un-livre-interactif/) : le témoignage de Nicolas Zannettacci (Café pédagogique), de la collecte des idées aux dernières corrections.",
    "**Un autre projet, en CE2-CM2.** [Livre dont vous êtes le héros](https://lamouche.home.blog/2019/04/08/livre-dont-vous-etes-le-heros/) : à l’école de Nolay, chaque élève décrit un lieu, et les lieux reliés forment l’aventure.",
    "**Les bases du récit à choix.** [Écrire une histoire dont vous êtes le héros avec des élèves](https://www.quefaitesvous.com/blog/ecrire-une-histoire-dont-vous-etes-le-heros-avec-des-eleves-les-bases/) (Que faites-vous) : construire les embranchements et anticiper leurs conséquences.",
    "**D’autres structures.** [Introduction aux structures de la fiction interactive](https://www.fiction-interactive.fr/introduction-aux-structures-de-la-fiction-interactive-et-comment-les-utiliser/) (Fiction-interactive.fr) : des schémas pour varier les parcours, au-delà des trois formes de « Combien de chapitres, de scènes et de choix prévoir ? »."
  ],
  "plusLoin": [
    {
      "libelle": "La bibliothèque",
      "adresse": "/bibliotheque"
    },
    {
      "libelle": "Essayer Il était une classe",
      "adresse": "/"
    }
  ],
  "parties": [
    {
      "numero": 1,
      "titre": "Pourquoi écrire un livre-jeu avec sa classe ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "C’est un livre ! Un vrai.",
          "texte": "Pour beaucoup d’enfants, écrire un livre, c’est une affaire d’écrivains. Mais la classe a l’avantage du nombre. Chacun apporte ses idées et écrit quelques scènes. Mis bout à bout, tous ces petits textes deviennent une histoire complète, bien plus ambitieuse que ce qu’un élève aurait pu créer seul. Les élèves en difficulté écrivent volontiers et en sont aussi fiers que les autres. Et à la fin du projet, chacun tient entre ses mains un véritable livre, avec son nom à l’intérieur."
        },
        {
          "sorte": "classe",
          "texte": "Au départ, nos histoires se jouaient uniquement sur écran. Mais l’adresse finissait par s’oublier, et l’histoire avec elle. C’est pour que chaque élève reparte avec un livre à garder, à montrer et à partager que j’ai voulu les imprimer."
        },
        {
          "sorte": "paragraphe",
          "tete": "C’est un jeu !",
          "texte": "Inventer des chemins secrets, tendre des pièges aux lecteurs, imaginer des choix difficiles et des fins surprenantes… Les élèves créent une aventure où d’autres vont jouer. Et si un chemin ne mène nulle part, le lecteur reste bloqué : on reprend son texte sans rechigner. L’envie de découvrir les chapitres des camarades donne une bonne raison de poursuivre le projet, séance après séance."
        },
        {
          "sorte": "classe",
          "texte": "Je sais qu’un projet fonctionne quand :",
          "elements": [
            "une séance d’écriture se prolonge pendant deux heures sans que personne ne demande à arrêter ;",
            "toutes les mains se lèvent quand je propose de continuer en APC (activités pédagogiques complémentaires, hors du temps de classe) ;",
            "les plus rapides proposent leur aide à ceux qui peinent à finir leur chapitre, plutôt que de considérer leur travail terminé ;",
            "l’année suivante, des élèves montrent fièrement leur livre à leurs nouveaux professeurs."
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": "Et les programmes ?",
          "texte": "Au cours moyen, le [programme de français du cycle 3](https://www.education.gouv.fr/sites/default/files/ensel620_annexe1.pdf) (Bulletin officiel du 17 avril 2025) demande que chaque élève participe dans l’année à des productions d’écrit collaboratives, produise des écrits longs, apprenne à se servir du brouillon et à réviser ses textes ; il encourage les projets d’écriture créatifs et l’écriture collective guidée par le professeur. Un livre-jeu réunit tout cela, et fait travailler :"
        },
        {
          "sorte": "liste",
          "elements": [
            "la construction du récit et l’anticipation des conséquences de chaque choix ;",
            "la cohérence entre les personnages, les lieux et les événements ;",
            "le vocabulaire, la syntaxe et l’orthographe, à travers la réécriture ;",
            "la coopération, en confrontant les idées pour construire une histoire commune."
          ]
        }
      ]
    },
    {
      "numero": 2,
      "titre": "À partir de quel âge ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": null,
          "texte": "Ce n’est pas tant une question d’âge que d’autonomie dans l’écriture. À tous les niveaux, la classe imagine l’univers, invente l’histoire et décide des choix ; seule la manière de rédiger change : dictée à l’adulte, petits groupes ou écriture autonome."
        },
        {
          "sorte": "liste",
          "elements": [
            "**CP et CE1 · 6-8 ans** — *Écrire avec l’adulte.* La classe construit le cadre de l’histoire, vous écrivez au tableau ; les scènes se rédigent en petits groupes, avec votre aide. Les plus autonomes écrivent quelques phrases seuls, avec un glossaire de l’histoire : personnages, lieux, objets, mots utiles. Une aventure courte, aux choix simples.",
            "**CE2 à CM2 · 8-11 ans** — *Chacun écrit ses scènes.* Chaque élève rédige ses propres scènes, avec plus ou moins d’aide selon son autonomie. Avec une classe habituée, le livre peut atteindre deux ou trois cents scènes, avec des objets, une jauge, parfois un dé (voir « Faut-il des objets, des compétences ou un dé ? »).",
            "**Collège · 11-15 ans** — *Construire aussi les chemins.* Les élèves imaginent les embranchements de leur chapitre, organisent les fins et vérifient que tous les chemins mènent quelque part."
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": "Une classe à plusieurs niveaux, un seul livre.",
          "texte": "Les plus autonomes écrivent des chapitres plus longs ou les scènes délicates, les autres des scènes plus courtes, avec davantage d’aide. Les chapitres n’ont pas besoin d’avoir la même longueur."
        },
        {
          "sorte": "paragraphe",
          "tete": "Un dernier conseil.",
          "texte": "Quel que soit l’âge, mieux vaut réussir un premier livre aux choix simples que se perdre dans une histoire trop ambitieuse : le suivant ira plus loin."
        }
      ]
    },
    {
      "numero": 3,
      "titre": "Par quoi commencer ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Jouez ensemble.",
          "texte": "Lisez des livres-jeux à voix haute et laissez la classe voter à chaque choix ; rejouez-en certains pour explorer d’autres chemins. Pour l’instant, on joue sans analyser. Partez de livres très simples, puis passez à des règles plus riches, avec des objets, des énigmes ou des pièges."
        },
        {
          "sorte": "paragraphe",
          "tete": "Puis démontez le mécanisme.",
          "texte": "Dans une séance à part, reprenez un livre simple : où les chemins se séparent et se rejoignent, comment marchent les objets, où mènent les choix. Comparez les sortes de choix rencontrées. Demandez à la classe ce qu’elle a aimé et ce qu’elle ne veut pas dans son livre : cette liste lui servira à fixer ses règles."
        },
        {
          "sorte": "paragraphe",
          "tete": "Montrez que c’est possible.",
          "texte": "Un livre écrit par une autre classe le prouve : feuilletez-le ensemble. Si vous n’en avez pas encore, la bibliothèque d’Il était une classe en propose à lire en ligne."
        },
        {
          "sorte": "paragraphe",
          "tete": "Prévoyez le rythme.",
          "texte": "Deux séances par semaine gardent le fil de l’histoire. Décidez aussi comment rattraper les retards : feuilles à finir à la maison, séances d’APC (voir « Combien de temps faut-il ? »)."
        },
        {
          "sorte": "classe",
          "texte": "Je commence par [*Ma première aventure*](https://ma-premiere-aventure.fr/) (Game Flow), puis [*Tu es le héros*](https://www.editions-larousse.fr/livres-tu-es-le-heros/) (Larousse Jeunesse), aux règles plus complexes. Nous étudions ensuite leur construction et les différents types de choix. Les livres de mes anciennes classes servent aussi de modèles."
        }
      ]
    },
    {
      "numero": 4,
      "titre": "Comment inventer l’histoire ensemble ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Construisez l’histoire par étapes :",
          "texte": "l’univers, les personnages et le héros, sa quête, puis les grandes étapes de l’aventure. À chaque étape, les élèves proposent leurs idées, vous les regroupez au tableau, puis la classe discute et vote si nécessaire. À vous de trancher lorsque les idées ne sont pas compatibles. Gardez les décisions affichées pendant tout le projet. Les idées écartées pourront toujours resservir pour inventer un lieu, un personnage ou un obstacle."
        },
        {
          "sorte": "paragraphe",
          "tete": "Fixez l’enjeu, pas toutes les solutions.",
          "texte": "Décidez du problème du héros et, dans les grandes lignes, de la façon de le résoudre. Une question fera ensuite naître les obstacles : qu’est-ce qui pourrait l’empêcher de réussir ? Laissez aux élèves la liberté d’imaginer les rencontres, les détours et les solutions inattendues. La toute fin peut attendre."
        },
        {
          "sorte": "paragraphe",
          "tete": "Gardez quelques surprises.",
          "texte": "Écrivez vous-même certaines scènes que les élèves découvriront plus tard : une quête secondaire, un secret, un rebondissement. Même en connaissant les grandes lignes de l’histoire, ils auront le plaisir de se laisser surprendre."
        },
        {
          "sorte": "classe",
          "texte": "Dans « Électro Nick », j’étais le seul à connaître le moyen de vaincre le méchant. Dans « Le labyrinthe oublié », j’avais écrit une quête secondaire."
        },
        {
          "sorte": "paragraphe",
          "tete": "Décidez des règles communes.",
          "texte": "Un héros ou plusieurs ? À quelle personne et à quel temps raconter ? Le « tu » et le présent fonctionnent bien à l’élémentaire ; l’essentiel est de s’y tenir dans tout le livre. Décidez aussi comment on peut échouer : pas besoin de violence pour de mauvaises fins, se perdre, manquer de temps ou rentrer bredouille suffisent."
        },
        {
          "sorte": "paragraphe",
          "tete": "Découpez l’aventure, puis confiez les chapitres.",
          "texte": "Définissez ensemble les grandes parties et les chapitres qui les composent ; chaque chapitre se compose de scènes, les passages numérotés du livre. Chaque élève choisit ensuite un chapitre, qu’il l’ait proposé ou non, seul ou à deux, et en devient responsable : il en imagine les obstacles et la façon de les surmonter (voir « Comment répartir l’écriture entre les élèves ? »)."
        },
        {
          "sorte": "paragraphe",
          "tete": "Et la première scène ?",
          "texte": "Imaginez ensemble la situation de départ, puis confiez sa rédaction plus tard à un élève à l’aise, quand le reste de l’histoire a pris forme."
        }
      ]
    },
    {
      "numero": 5,
      "titre": "Comment répartir l’écriture entre les élèves ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Un élève par chapitre, si possible.",
          "texte": "Chacun devient responsable de son chapitre et garde ses scènes secrètes pour préserver la découverte du livre. Si nécessaire, deux ou trois élèves se partagent un chapitre, chacun rédigeant ses propres scènes."
        },
        {
          "sorte": "paragraphe",
          "tete": "Fixez les entrées et les sorties.",
          "texte": "Définissez ensemble d’où arrive le héros et où il doit repartir. L’élève connaît les informations nécessaires aux transitions, mais reste libre d’inventer ce qui se passe entre les deux."
        },
        {
          "sorte": "paragraphe",
          "tete": "Préparez les obstacles et les choix.",
          "texte": "Trois obstacles constituent un bon point de départ, quitte à n’en conserver que deux. Pour chacun, l’élève imagine plusieurs choix et leurs conséquences. Liste, dessin ou schéma : il choisit la méthode qui lui convient (voir « Comment organiser les choix ? »)."
        },
        {
          "sorte": "paragraphe",
          "tete": "Une consigne et une liste de vérification par scène.",
          "texte": "La consigne résume ce qui doit se passer ; la liste aide l’élève à vérifier les éléments d’écriture attendus."
        },
        {
          "sorte": "exemple",
          "titre": "La rencontre dans la forêt.",
          "texte": "Consigne : Le héros rencontre un personnage mystérieux qui lui propose son aide.",
          "rappel": "J’ai pensé à :",
          "elements": [
            "Décrire le personnage.",
            "Écrire un court dialogue.",
            "Montrer la réaction du héros."
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": "Du brouillon à la validation.",
          "texte": "Chaque scène suit le même parcours :"
        },
        {
          "sorte": "liste",
          "elements": [
            "L’élève écrit sur papier et se relit avec sa liste de vérification.",
            "Vous vérifiez le contenu et demandez, si besoin, des améliorations.",
            "L’élève corrige son orthographe avec ses outils, puis saisit son texte à l’ordinateur.",
            "Il remet sa scène. Plus tard, vous la validez, la corrigez ou demandez une reprise."
          ],
          "ordonnee": true
        },
        {
          "sorte": "paragraphe",
          "tete": null,
          "texte": "Si les ordinateurs manquent, les élèves se relaient. La dictée vocale peut aider à transcrire certains textes et gagner du temps."
        },
        {
          "sorte": "paragraphe",
          "tete": "À chacun son rythme.",
          "texte": "Une fois ses scènes écrites, l’élève teste les chemins de son chapitre. Il peut ensuite écrire d’autres scènes, décrire ses futures illustrations ou aider un camarade. Pour ceux qui avancent moins vite, réduisez le nombre de scènes, adaptez les consignes ou proposez des séances d’APC pour les accompagner dans leur écriture."
        },
        {
          "sorte": "paragraphe",
          "tete": "Gardez une vue d’ensemble.",
          "texte": "Un tableau de suivi aide à repérer les scènes en rédaction, à corriger ou à valider."
        },
        {
          "sorte": "classe",
          "texte": "J’ai d’abord suivi les chapitres sur Excel, puis sur une page Notion accessible aux élèves."
        },
        {
          "sorte": "encart",
          "texte": "Dans Il était une classe, le Suivi montre d’un coup d’œil où en est chaque scène, et quel élève s’en occupe. Une scène remise se relit en un clic."
        }
      ]
    },
    {
      "numero": 6,
      "titre": "Combien de chapitres, de scènes et de choix prévoir ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Méfiez-vous de l’arbre.",
          "texte": "Si chaque choix ouvre deux chemins qui ne se rejoignent jamais, dix décisions successives donnent 1 024 fins. Cette structure fonctionne pour une histoire très courte, mais devient vite ingérable pour un livre de classe."
        },
        {
          "sorte": "paragraphe",
          "tete": "Faites se rejoindre les chemins.",
          "texte": "Le plus simple est d’enchaîner des chapitres dans lesquels les branches se séparent puis se retrouvent. Pour varier les aventures, trois structures sont particulièrement utiles :"
        },
        {
          "sorte": "liste",
          "elements": [
            "**Les branches qui se rejoignent :** plusieurs chemins différents mènent à une même scène.",
            "**Le carrefour :** le lecteur explore plusieurs directions et revient au même endroit avant de poursuivre.",
            "**Le détour facultatif :** le lecteur peut explorer une scène supplémentaire, découvrir un secret ou récupérer un objet avant de retrouver l’histoire principale."
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": null,
          "texte": "Ces structures fonctionnent à toutes les échelles : elles relient des scènes à l’intérieur d’un chapitre, mais aussi des chapitres entiers entre eux. Vous pouvez les combiner pour construire des aventures variées sans multiplier les chemins à l’infini."
        },
        {
          "sorte": "paragraphe",
          "tete": "Comptez par obstacles.",
          "texte": "Un obstacle occupe souvent trois ou quatre scènes : le problème, les différents choix et leurs conséquences. Ajoutez les scènes de transition, les rencontres et les fins pour estimer la taille du livre. Toutes les scènes n’ont pas besoin de proposer un choix : alternez les moments de lecture et les décisions importantes. Pour un premier projet, mieux vaut une aventure courte qui fonctionne qu’un livre trop ambitieux."
        },
        {
          "sorte": "paragraphe",
          "tete": "Prévoyez que ça débordera.",
          "texte": "Les idées des élèves feront naturellement grandir l’histoire. Évitez toutefois de multiplier les chapitres une fois le plan établi : laissez plutôt ceux qui existent s’enrichir. Gardez aussi quelques scènes hors chapitre pour les plus rapides : introduction, épilogue, fin alternative ou point de sauvegarde."
        },
        {
          "sorte": "paragraphe",
          "tete": "Choisissez comment l’aventure se termine.",
          "texte": "Le plus simple est de laisser tous les lecteurs aller au bout, avec différentes fins selon leurs réussites. Vous pouvez aussi prévoir quelques défaites prématurées, notamment au début, quand recommencer est facile : le lecteur voit que ses décisions comptent. Dans un livre plus long, des points de sauvegarde permettent de reprendre à une scène donnée, avec les objets et les points conservés à ce moment-là."
        },
        {
          "sorte": "classe",
          "texte": "« Le labyrinthe oublié » compte 13 chapitres, 213 scènes et quatre fins selon la réussite, plus une fin secrète. « Électro Nick » compte 19 chapitres et 323 scènes, avec des sauvegardes et des chapitres alternatifs, comme la forêt de champignons géants ou le lac d’acide. Ces deux livres ont demandé environ trois mois d’écriture."
        }
      ]
    },
    {
      "numero": 7,
      "titre": "Comment organiser les choix ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": null,
          "texte": "Pour les élèves, c’est l’étape la plus difficile : inventer des choix intéressants, dont les conséquences restent logiques. Le lecteur ne doit pas simplement choisir au hasard, mais pouvoir réfléchir aux différentes possibilités."
        },
        {
          "sorte": "paragraphe",
          "tete": "Cinq pistes pour imaginer des choix.",
          "texte": "Face à un obstacle, les élèves peuvent s’appuyer sur quelques questions pour trouver des idées :"
        },
        {
          "sorte": "liste",
          "elements": [
            "**Explorer** — *Où aller ?* Visiter une grotte mystérieuse ou poursuivre son chemin.",
            "**Changer de méthode** — *Comment agir ?* Escalader un mur ou convaincre le garde de te laisser passer.",
            "**Observer et réfléchir** — *Quel indice utiliser ?* Examiner les symboles d’une porte ou tenter de l’ouvrir directement.",
            "**Faire un compromis** — *Que sacrifier pour obtenir autre chose ?* Traverser une zone dangereuse pour récupérer un objet ou gagner du temps en l’évitant.",
            "**Adopter une attitude** — *Comment réagir ?* Aider un inconnu ou poursuivre sa mission."
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": "Imaginez les conséquences.",
          "texte": "Pour chaque obstacle, demandez à l’élève de trouver deux ou trois façons de réagir, puis d’imaginer ce qui se passe pour chacune. Faites-lui formuler ses idées à voix haute : « Si le héros fait ceci, alors… ». Un choix peut permettre de réussir, de découvrir un indice, de gagner ou de perdre une ressource, mais aussi provoquer une rencontre inattendue ou une situation comique. Toutes les erreurs n’ont pas besoin d’être punies."
        },
        {
          "sorte": "paragraphe",
          "tete": "Donnez une raison de choisir.",
          "texte": "Un indice dans le texte, un objet trouvé plus tôt ou l’avertissement d’un personnage doivent permettre au lecteur attentif d’anticiper certains risques. Le hasard a aussi sa place, mais évitez les défaites impossibles à prévoir."
        },
        {
          "sorte": "paragraphe",
          "tete": "Des énigmes à résoudre.",
          "texte": "Elles sont difficiles à inventer : cherchez des idées avec les élèves, puis aidez-les à construire une énigme avec des indices clairs et une solution logique. Ne cherchez pas à tout prix à l’intégrer parfaitement à l’histoire : une situation un peu artificielle n’est pas gênante si l’énigme est amusante à résoudre."
        },
        {
          "sorte": "paragraphe",
          "tete": "Soignez la formulation des choix.",
          "texte": "Utilisez des phrases courtes, avec une action claire et une forme cohérente dans tout le livre. Donnez suffisamment d’informations pour décider, sans dévoiler la conséquence : « Si tu traverses le vieux pont malgré ses planches abîmées, va au 12 », plutôt que « Si tu tombes du pont, va au 12 »."
        },
        {
          "sorte": "classe",
          "texte": "Dans « Électro Nick », au camp des esclaves, les lecteurs doivent choisir entre explorer les lieux ou profiter d’une bonne nuit de sommeil. Comme devant le laboratoire de Vortex, ce ne sont pas des choix entre le bien et le mal : chaque décision a ses avantages, et c’est au lecteur de peser le pour et le contre."
        }
      ]
    },
    {
      "numero": 8,
      "titre": "Comment relire et garder la cohérence ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Gardez une référence commune.",
          "texte": "Dès la préparation, constituez une fiche de référence des personnages, des lieux et des objets, avec leurs caractéristiques essentielles. Chaque élève en possède un exemplaire. Vous tenez cette fiche à jour et validez les nouveaux éléments proposés : elle évite les contradictions entre chapitres et la multiplication incontrôlée des objets."
        },
        {
          "sorte": "paragraphe",
          "tete": "Relisez d’abord l’histoire, puis la langue.",
          "texte": "Sur le brouillon, vérifiez uniquement le contenu : la consigne est-elle respectée ? La scène est-elle cohérente ? Ce parti pris peut surprendre, mais inutile de corriger l’orthographe d’un texte qu’il faudra peut-être réécrire. Une fois le contenu validé, l’élève corrige sa langue avec ses outils, puis saisit son texte à l’ordinateur. Vous effectuez la dernière vérification après sa remise."
        },
        {
          "sorte": "paragraphe",
          "tete": "Faites enrichir les textes.",
          "texte": "Certains élèves, pressés de passer à la scène suivante, écrivent le strict minimum. Plutôt que d’exiger un texte plus long, demandez-leur de développer un point précis : décrire un lieu, ajouter un dialogue, montrer une émotion… Leur liste de vérification les aide à repérer ce qui manque."
        },
        {
          "sorte": "paragraphe",
          "tete": "Adaptez les reprises.",
          "texte": "Demandez à chacun de corriger ce qui est à sa portée. Pour les erreurs plus difficiles, accompagnez l’élève ou intervenez directement (voir « Quelle place donner à l’IA ? »). Évitez de multiplier les allers-retours : après une ou deux reprises, mieux vaut terminer le texte avec lui. L’objectif est de le faire progresser, sans le décourager ni effacer son style."
        },
        {
          "sorte": "paragraphe",
          "tete": "Vérifiez les raccords.",
          "texte": "Chaque élève relit son chapitre en empruntant tous les chemins possibles. Il contrôle les enchaînements, les choix et les conséquences. De votre côté, vérifiez les transitions entre chapitres : les personnages, les objets et les événements doivent rester cohérents, quel que soit le parcours du lecteur."
        },
        {
          "sorte": "classe",
          "texte": "Pendant les séances d’écriture, je suis très sollicité et les corrections peuvent vite s’accumuler. Pour organiser les passages à mon bureau, j’utilise des pinces à linge portant les prénoms des élèves, qu’ils accrochent à la suite sur un fil. Je reçois deux élèves au maximum ; les autres restent à leur place et peuvent commencer une nouvelle scène en attendant leur tour. Ce système, que j’utilise aussi dans les autres matières, évite les files d’attente et permet à chacun de continuer à travailler."
        },
        {
          "sorte": "encart",
          "texte": "Dans Il était une classe, l’élève voit en écrivant la fin de la scène qui mène à la sienne et le début de celle qui suit : les raccords se font au fil de l’écriture. Il joue ensuite son chapitre pour en essayer tous les chemins."
        }
      ]
    },
    {
      "numero": 9,
      "titre": "Faut-il des objets, des compétences ou un dé ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Pour un premier livre, un seul mécanisme de jeu suffit.",
          "texte": "Une jauge de volonté, des objets à collecter ou des compétences : choisissez un système simple. Vous pouvez même commencer sans aucune règle supplémentaire, avec seulement des choix. Le dé peut attendre. Pour les projets suivants, vous pourrez enrichir les règles si l’histoire le justifie."
        },
        {
          "sorte": "paragraphe",
          "tete": "Des règles qui viennent de l’histoire.",
          "texte": "Plutôt que des points abstraits, comptez ce que l’histoire rend important : l’huile d’une lanterne, les personnes sauvées, du temps. La règle se retient mieux, et chaque perte ou chaque gain se raconte."
        },
        {
          "sorte": "paragraphe",
          "tete": "Des règles faciles à expliquer.",
          "texte": "Elles se lisent au début du livre, avant la première scène, et figurent en tête de la feuille d’aventure. Si une règle demande de longues explications pour être comprise, simplifiez-la."
        },
        {
          "sorte": "paragraphe",
          "tete": "Des objets qui servent.",
          "texte": "Prévoyez peu d’objets, chacun avec une utilité définie à l’avance : ouvrir un choix (« Si tu as la clé, va au 31 »), éviter un piège… Un objet ramassé qui ne sert jamais risque de décevoir. Une exception amusante : le magasin, où l’on peut acheter des choses inutiles et gaspiller son argent."
        },
        {
          "sorte": "paragraphe",
          "tete": "Construire son héros.",
          "texte": "Proposez par exemple six compétences ; le lecteur en choisit deux. Certains choix en dépendent : « Si ton héros est courageux, tu peux… ». Veillez à ce que chaque compétence serve au moins une fois dans l’histoire."
        },
        {
          "sorte": "paragraphe",
          "tete": "Le dé, avec une seule règle.",
          "texte": "Par exemple, le résultat du dé ajouté à une compétence doit atteindre un nombre fixé."
        },
        {
          "sorte": "paragraphe",
          "tete": "Vérifier que tout fonctionne.",
          "texte": "Un objet ou une jauge ne doit pas bloquer involontairement l’histoire. Peut-on arriver devant une porte sans avoir eu la possibilité de trouver la clé ? Peut-on perdre plus de points qu’on n’en possède ? Prévoyez ces situations et testez les différents parcours."
        },
        {
          "sorte": "classe",
          "texte": "Pour « Électro Nick », mon plus long livre-jeu, j’avais prévu une feuille d’aventure assez complète : des points de volonté, des boulons, des rations, des unités de temps, un inventaire d’objets et des bonus aux jets de dé. Les élèves devaient tenir compte de tous ces éléments dans leurs chapitres. Avec le recul, c’était peut-être un peu trop !"
        }
      ]
    },
    {
      "numero": 10,
      "titre": "Comment vérifier que tous les chemins mènent quelque part ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Chacun teste son chapitre.",
          "texte": "Une fois son chapitre écrit, l’élève le joue comme un lecteur, explore tous les chemins et corrige ce qui ne fonctionne pas. Il ne teste que le sien : le reste, il le découvrira dans le livre."
        },
        {
          "sorte": "paragraphe",
          "tete": "Vous jouez le livre entier, plusieurs fois.",
          "texte": "C’est vous qui vérifiez les raccords entre chapitres, repérez les blocages et évaluez la difficulté du jeu."
        },
        {
          "sorte": "paragraphe",
          "tete": "Contrôlez les liens.",
          "texte": "Faites un tableau, listez les scènes, notez leurs destinations, vérifiez chaque renvoi… Non, sérieusement, épargnez-vous ça ! Des outils gratuits comme [Twine](https://twinery.org/) ou [diagrams.net](https://app.diagrams.net/) permettent de visualiser votre histoire et de retrouver les scènes bien plus facilement. Il faut un peu de temps pour les apprivoiser, mais vous ne le regretterez pas !"
        },
        {
          "sorte": "paragraphe",
          "tete": "Réparez.",
          "texte": "Les erreurs de liens et de numéros, c’est vous ; un texte qui ne raccorde pas retourne à son auteur."
        },
        {
          "sorte": "paragraphe",
          "tete": "Numérotez à la toute fin.",
          "texte": "Pendant l’écriture, utilisez des repères provisoires pour identifier les scènes. Une fois le livre terminé, fixez d’abord les numéros imposés par les énigmes ou les sauvegardes (s’il y en a). Attribuez ensuite les autres au hasard, en mélangeant plusieurs chapitres pour que les scènes d’un même chapitre ne se suivent pas. Vérifiez une dernière fois tous les renvois."
        },
        {
          "sorte": "classe",
          "texte": "Pour mon premier livre-jeu, je vérifiais tous les liens dans un tableur. C’était franchement fastidieux, surtout pour retrouver les scènes et suivre leurs modifications ! C’est d’ailleurs ce problème, avec le suivi de la classe, qui m’a poussé à apprendre à programmer : je voulais créer un outil pour gérer tout cela plus facilement."
        },
        {
          "sorte": "encart",
          "texte": "Dans Il était une classe, la vérification des chemins relève seule les choix sans destination, les scènes que rien ne relie et celles qui n’ont pas de suite. Et l’outil numérote à votre place : il garde les numéros fixés, éloigne les scènes d’un même chapitre et tire le reste au sort."
        }
      ]
    },
    {
      "numero": 11,
      "titre": "Combien de temps faut-il ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Deux séances d’une heure par semaine",
          "texte": "constituent un bon rythme. Alternez l’écriture sur papier et la saisie à l’ordinateur : beaucoup d’élèves aiment taper leur texte, et pour certains, c’est une motivation supplémentaire pour terminer leur brouillon."
        },
        {
          "sorte": "paragraphe",
          "tete": "Deux formats.",
          "texte": "Un premier livre d’environ 80 scènes s’écrit en une période, parfois deux. Pour un grand livre de 200 à 300 scènes, comptez deux périodes d’écriture, auxquelles s’ajoutent la découverte des livres-jeux, la préparation de l’histoire et la fabrication du livre."
        },
        {
          "sorte": "paragraphe",
          "tete": "Les étapes d’un grand livre.",
          "texte": "Un calendrier possible, à adapter selon l’âge et l’autonomie des élèves."
        },
        {
          "sorte": "tableau",
          "entete": [
            "Étape",
            "Durée"
          ],
          "rangs": [
            [
              "Découvrir des livres-jeux",
              "Une période, pendant les temps calmes ou de lecture offerte"
            ],
            [
              "Étudier leur fonctionnement",
              "2 séances"
            ],
            [
              "Préparer l’histoire",
              "2 séances"
            ],
            [
              "Préparer les chapitres : obstacles, choix, conséquences",
              "3 à 4 séances"
            ],
            [
              "Mettre en place les scènes et les consignes (vous)",
              "Un temps de préparation dédié"
            ],
            [
              "Écrire",
              "Deux périodes"
            ],
            [
              "Relire et tester le livre",
              "2 séances"
            ],
            [
              "Mettre en page, illustrer",
              "Environ une semaine"
            ],
            [
              "Imprimer et recevoir les livres",
              "Une dizaine de jours par commande"
            ]
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": "Dans l’année.",
          "texte": "Comptez à rebours depuis la livraison, à la mi-juin : les textes doivent être terminés au début du mois de mai."
        },
        {
          "sorte": "paragraphe",
          "tete": "Votre temps.",
          "texte": "Organiser les chapitres, préparer les scènes et rédiger les consignes est sans doute l’étape la plus exigeante. On peut avoir l’impression de passer beaucoup de temps sans voir le livre avancer. Mais une fois ce travail terminé, le plus dur est derrière vous ! Les élèves peuvent se lancer dans l’écriture, les scènes s’enchaînent et le livre prend forme à vue d’œil."
        },
        {
          "sorte": "classe",
          "texte": "Pour un grand livre-jeu, je compte une vingtaine d’heures de travail personnel sur l’ensemble du projet. Avec Il était une classe, ce temps est à peu près divisé par deux. J’essaie toujours de faire coïncider la préparation des scènes et des consignes avec des vacances scolaires. Je peux ainsi m’y consacrer tranquillement, sans faire attendre les élèves entre deux étapes."
        }
      ]
    },
    {
      "numero": 12,
      "titre": "Comment illustrer, imprimer et partager le livre ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Deux façons d’illustrer.",
          "texte": "Les élèves dessinent : chacun illustre son chapitre, avec quelques consignes communes (format, matériel, couleurs) pour garder une unité. Ou vous créez les images avec une IA, à partir de leurs descriptions (voir « Quelle place donner à l’IA ? »). Définissez un style commun et veillez à conserver l’apparence des personnages. Le résultat peut être très soigné, mais demande parfois quelques ajustements."
        },
        {
          "sorte": "paragraphe",
          "tete": "La couverture.",
          "texte": "Réalisez-la vous-même ou concevez-la avec les élèves. Dans tous les cas, soignez-la."
        },
        {
          "sorte": "classe",
          "texte": "Je préfère les illustrations créées avec une IA, et je réalise moi-même la couverture. Je cherche à donner aux élèves un livre aussi proche que possible de ceux qu’ils trouvent en librairie. Je préfère aussi une couverture qui représente le travail collectif plutôt que de mettre en avant le dessin d’un seul élève. C’est un choix personnel : les illustrations des enfants ont évidemment leur place dans un projet comme celui-ci."
        },
        {
          "sorte": "paragraphe",
          "tete": "Imprimer.",
          "texte": "Un imprimeur en ligne qui imprime à l’exemplaire suffit. Proposez le livre en précommande aux familles, avec le choix entre un intérieur en noir et blanc ou en couleur. Décidez du format à l’avance : le prix monte vite. Voici ce que coûtait un exemplaire en 2026, à titre indicatif et sans les frais de livraison :"
        },
        {
          "sorte": "tableau",
          "entete": [
            "Livre",
            "Pages",
            "Images",
            "Noir et blanc",
            "Couleur"
          ],
          "rangs": [
            [
              "[« Les passeurs de brume »](/bibliotheque/les-passeurs-de-brume), livre d’exemple du site",
              "32",
              "10",
              "4 €",
              "5 €"
            ],
            [
              "Un livre moyen",
              "80",
              "30",
              "6 €",
              "10 €"
            ],
            [
              "[« Le labyrinthe oublié »](/bibliotheque/le-labyrinthe-oublie)",
              "140",
              "85",
              "8 €",
              "17 €"
            ],
            [
              "[« Électro Nick »](/bibliotheque/electro-nick), un très long livre",
              "248",
              "152",
              "12 €",
              "29 €"
            ]
          ]
        },
        {
          "sorte": "paragraphe",
          "tete": "Un exemplaire d’essai d’abord.",
          "texte": "Commandez-en un pour vérifier le rendu et corriger les dernières erreurs avant l’impression générale. Prévoyez une dizaine de jours de livraison et le temps des corrections. En attendant les livres des élèves, vous pourrez lire cet exemplaire ensemble en classe."
        },
        {
          "sorte": "paragraphe",
          "tete": "Un livre accessible à tous.",
          "texte": "L’achat doit rester facultatif. Si le prix est un obstacle, plusieurs solutions : choisir le noir et blanc, solliciter une aide de la coopérative scolaire, emprunter l’exemplaire de la classe ou lire le livre en ligne. L’essentiel est que chaque élève puisse profiter de son travail."
        },
        {
          "sorte": "paragraphe",
          "tete": "Faites-le vivre.",
          "texte": "Gardez un exemplaire à la bibliothèque de l’école, organisez une lecture dans une autre classe, laissez les élèves découvrir les aventures écrites par leurs camarades."
        },
        {
          "sorte": "paragraphe",
          "tete": "Les autorisations.",
          "texte": "Les textes et les dessins des élèves sont protégés par le droit d’auteur. Avant d’imprimer ou de diffuser le livre, recueillez les autorisations écrites nécessaires auprès des élèves et de leurs familles, en précisant les usages prévus : impression, partage privé ou publication en ligne. Un [modèle d’autorisation](/modeles/autorisation-de-diffusion) est prêt à télécharger."
        },
        {
          "sorte": "encart",
          "texte": "Dans Il était une classe, le livre se compose seul en un PDF prêt pour l’imprimeur. Il se partage aussi en privé, avec les comptes des élèves, ou dans la bibliothèque publique du site."
        }
      ]
    },
    {
      "numero": 13,
      "titre": "Quelle place donner à l’IA ?",
      "blocs": [
        {
          "sorte": "paragraphe",
          "tete": "Une aide pour l’enseignant.",
          "texte": "L’intelligence artificielle peut faire gagner du temps dans la préparation et la finition du livre. Les élèves imaginent l’histoire, écrivent et reprennent leurs textes : le livre reste le leur."
        },
        {
          "sorte": "paragraphe",
          "tete": "Pour préparer l’histoire.",
          "texte": "Demandez-lui des pistes d’univers, de personnages, d’obstacles ou de choix. Triez ses propositions : gardez, retouchez ou écartez selon l’histoire que vous construisez avec la classe."
        },
        {
          "sorte": "paragraphe",
          "tete": "Pour préparer les consignes.",
          "texte": "À partir de votre idée d’une scène, l’IA peut proposer une consigne et sa liste de vérification."
        },
        {
          "sorte": "encart",
          "texte": "Dans Il était une classe, dictez ou tapez votre idée : « Formuler » la met au propre et prépare la liste de vérification, que vous retouchez. Les élèves, eux, n’ont accès à aucune aide d’IA."
        },
        {
          "sorte": "paragraphe",
          "tete": "Pour terminer les corrections.",
          "texte": "Une fois le contenu validé et le texte corrigé par l’élève (voir « Comment relire et garder la cohérence ? »), vous pouvez demander à l’IA de reprendre les erreurs restantes : l’orthographe seule, ou aussi la grammaire selon les besoins."
        },
        {
          "sorte": "paragraphe",
          "tete": "Préserver le texte de l’élève.",
          "texte": "Limitez les corrections à ce qui est nécessaire, en conservant ses idées et sa manière de raconter. Relisez la proposition avant de la retenir : une phrase plus élégante n’est pas forcément plus fidèle à son texte."
        },
        {
          "sorte": "classe",
          "texte": "Trouver des titres de scènes me prend toujours du temps : l’IA m’y aide beaucoup. Pour les choix, ses propositions sont moins fines : je dois souvent les retravailler pour que les conséquences soient intéressantes et cohérentes. Mais quand je bloque, elle trouve des possibilités auxquelles je n’avais pas pensé."
        }
      ]
    },
    {
      "numero": 14,
      "titre": "Six erreurs à éviter pour votre premier livre-jeu",
      "blocs": [
        {
          "sorte": "liste",
          "elements": [
            "**Sous-estimer le temps.** J’ai déjà reçu des livres juste avant les vacances ! Anticipez l’exemplaire d’essai et envoyez la commande définitive fin mai (voir « Combien de temps faut-il ? »).",
            "**Un système de jeu trop compliqué.** J’en ai fait l’expérience : difficile à gérer et à équilibrer. Pour commencer, un seul mécanisme suffit (voir « Faut-il des objets, des compétences ou un dé ? »).",
            "**Laisser le livre grossir au fil des idées.** Une fois le plan fixé, évitez d’ajouter des chapitres. Les nouvelles idées peuvent trouver leur place dans les chapitres existants (voir « Combien de chapitres, de scènes et de choix prévoir ? »).",
            "**Punir le lecteur au hasard.** Un mauvais choix peut avoir de lourdes conséquences, mais le lecteur doit avoir une chance de les anticiper (voir « Comment organiser les choix ? »).",
            "**Numéroter trop tôt.** Les ajouts et les modifications deviennent vite un casse-tête. Attendez que toutes les scènes soient en place (voir « Comment vérifier que tous les chemins mènent quelque part ? »).",
            "**Négliger les tests.** Chaque élève explore les chemins de son chapitre. De votre côté, jouez le livre entier plusieurs fois avant l’impression (voir « Comment vérifier que tous les chemins mènent quelque part ? »)."
          ]
        }
      ]
    }
  ]
};
