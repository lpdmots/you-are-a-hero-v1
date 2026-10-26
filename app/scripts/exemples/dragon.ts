/**
 * Livre d'exemple de cycle 2, à choix (plan, point 3 de « Suite recommandée après l'ouverture »,
 * entretien du 26 octobre 2026) : la conception de départ, d'où se crée le projet de travail en
 * local (`npm run livres:exemple -- dragon --brouillon`). Les textes, les images et la mise en
 * page viennent ensuite des aides de l'application, et sont gardés dans l'instantané du dossier
 * du livre, que la commande recharge.
 *
 * L'histoire est celle du porteur : le dragon, mascotte de la classe, cherche le livre de la
 * maîtresse que la souris a emporté. Les deux mascottes du site, sans nom propre (exception du
 * 26 octobre 2026 : elles peuvent être les personnages des livres d'exemple, jamais d'un livre de
 * classe). Six décisions, dont la bonne réponse se trouve en réfléchissant ; une erreur ne ramène
 * jamais en arrière : elle coûte du temps (« Ajoute 1 à ton temps. »), et à 3 le dragon arrive
 * trop tard, au 20, numéro fixe. « 6 à 8 ans », au présent.
 */
import type { Conception } from "./conception";

/** La phrase d'un passage d'erreur : trop tard au 20 (S024) si le temps est à 3, sinon la suite. */
const leTemps = (suite: number) => ({
  choix: [["Arriver trop tard", 24], ["Continuer", suite]] as [string, number][],
  phrase: ["Si ton temps est à 3, va au ", 0, ". Sinon, va au ", 1, "."],
});
/** Ce que dit la consigne d'un passage où l'on arrive de plusieurs façons */
const PLUSIEURS = "On arrive ici de plusieurs façons : commence sans rappeler ce qui s’est passé juste avant.";

export const livre: Conception = {
  TITRE: "Bouquin mène l’enquête",
  // Renommé par le porteur le 26 octobre 2026
  ANCIENS_TITRES: ["Qui a pris le livre ?"],
  DEPART: 1,
  AGE: "6-8",
  VISUEL_DU_PROJET: "bibliotheque",
  STYLE: {
    style: "autre",
    autre: "Illustration douce d’album pour 5 à 7 ans, rendu lisse et légèrement en volume, formes rondes, sans contour noir, couleurs franches et chaudes, grands yeux expressifs, décors simples et peu détaillés ; la nuit reste lisible : bleus profonds et lumière chaude des lampes",
  },
  CONSIGNE_ECRITURE: "Au présent, à la troisième personne. Pour des enfants de 6 ans : des mots simples, mais des phrases vivantes et variées, sans répéter « il » ; des bruits et de courtes répliques. Miette ne parle jamais, elle mime. Ne donne jamais la bonne réponse d’un choix avant que le lecteur choisisse.",

  PREPARATION: {
    univers: "Une école, le soir, quand tout le monde est parti : la classe, le couloir tout noir, la bibliothèque. Chaque soir, la maîtresse pose sur son bureau le livre à couverture rouge qu’elle lira le lendemain à ses élèves. Le concierge regarde la télévision dans sa loge, au bout du couloir.",
    personnages: "Bouquin, le dragon mascotte de la classe : le jour, il fait la figurine sur l’étagère ; le soir, il lit en cachette le livre de la maîtresse.\nMiette, la souris gourmande, qui adore grignoter le papier.\nPacha, le chat du concierge, qui vit dans la loge.\nJacasse, la pie de la cour, qui se moque de Bouquin.",
    enjeu: "Ce soir, le livre rouge a disparu. Bouquin doit retrouver Miette avant qu’elle ne le grignote.",
    regles: [
      "Prends une feuille et écris : Temps 0.",
      "Quand le livre te le dit, ajoute 1 à ton temps.",
      "Il te faut un dé pour une seule page.",
    ].join("\n"),
    formuleRenvoi: "va",
    constructions: ["neutre"],
  },

  PERSONNAGES: [
    {
      nom: "Bouquin", autresNoms: ["le dragon", "le petit dragon"], heros: true, portrait: false, planche: "../identite/mascotte/dragon-reference.webp",
      description: "La mascotte de la classe : un jeune dragon bleu canard au ventre crème, de la taille d’un gros chat, avec deux petites cornes et une queue en flèche. Le jour, il fait semblant d’être une figurine sur l’étagère ; le soir, il lit en cachette le livre de la maîtresse. Gentil, un peu pataud, il se croit redoutable, mais il ne crache qu’une petite fumée. Ses ailes sont encore trop petites : il vole mal. Il est allergique aux poils de chat.",
    },
    {
      nom: "Miette", autresNoms: ["la souris", "la petite souris"], heros: false, portrait: false, planche: "../identite/mascotte/souris-reference.webp",
      description: "Une petite souris ronde et vive, au pelage caramel, au ventre crème, aux grandes oreilles roses et à la longue queue rose. Gourmande et futée, elle adore grignoter le papier. Elle ne parle jamais : elle mime. Debout, elle arrive au genou de Bouquin.",
    },
    {
      nom: "la maîtresse", autresNoms: [], heros: false, portrait: false,
      description: "La maîtresse de la classe. Chaque soir, elle laisse sur son bureau le livre qu’elle lira le lendemain à ses élèves.",
    },
    {
      nom: "le concierge", autresNoms: [], heros: false, portrait: false,
      description: "Le concierge de l’école. Le soir, il regarde la télévision dans sa loge, au bout du couloir.",
    },
    {
      nom: "Pacha", autresNoms: ["le chat du concierge", "le chat"], heros: false, portrait: false,
      description: "Le gros chat gris du concierge, qui vit dans sa loge. Il fait ses griffes sur les cahiers.",
    },
    {
      nom: "Jacasse", autresNoms: ["la pie"], heros: false, portrait: false,
      description: "Une pie noire et blanche qui vit dans l’arbre de la cour. Elle se moque de Bouquin et l’appelle « ma poule », parce qu’il vole mal.",
    },
  ],

  OBJETS: [],
  FORMULES: [
    ["Ajoute 1 à ton temps.", "crayon"],
    ["Lance le dé.", "de"],
  ],
  FEUILLE: {
    on: true,
    des: 1,
    sections: [{ id: "dragon", type: "compteurs", titre: "Bouquin", compteurs: [{ id: "temps", nom: "Temps", depart: 0 }] }],
  },
  ACTIONS: {
    3: ["Ajoute 1 à ton temps."],
    4: ["Ajoute 1 à ton temps."],
    7: ["Ajoute 1 à ton temps."],
    8: ["Ajoute 1 à ton temps."],
    9: ["Lance le dé."],
    10: ["Ajoute 1 à ton temps."],
    12: ["Ajoute 1 à ton temps."],
    14: ["Ajoute 1 à ton temps."],
    15: ["Ajoute 1 à ton temps."],
    17: ["Ajoute 1 à ton temps."],
    19: ["Ajoute 1 à ton temps."],
    20: ["Ajoute 1 à ton temps."],
  },

  PARTIES: [
    {
      titre: "Le livre disparu", visuel: "bibliotheque",
      chapitres: [
        {
          cle: "classe", titre: "La classe", couleur: 5, visuel: "bibliotheque",
          resume: "Le soir, le livre rouge de la maîtresse a disparu de son bureau. Bouquin trouve le coupable, Miette, puis il doit ouvrir la porte de la classe.",
          scenes: [
            {
              ref: 1, titre: "Classe — le livre de chaque soir",
              consigne: "Présente la classe, le soir. La maîtresse pose sur son bureau un livre à couverture rouge, pour le lire demain à ses élèves, puis elle s’en va. Présente Bouquin, Bouquin mascotte de la classe : le jour, il fait la figurine sur l’étagère. Chaque soir, quand tout le monde est parti, il descend lire ce livre. Termine quand il voit que le bureau est vide.",
              choix: [["Regarder le bureau de plus près", 2]],
            },
            {
              ref: 2, titre: "Bureau — le livre a disparu",
              consigne: "Le livre rouge a disparu ! Sur le bureau, il y a des confettis de papier. Dans la poudre de craie, il y a de toutes petites traces de pattes, et entre elles un long trait fin. Bouquin pense à trois coupables : Pacha, le chat du concierge, qui vit dans la loge et fait ses griffes sur les cahiers ; Jacasse, Jacasse de la cour, qui l’appelle « ma poule » parce qu’il vole mal ; Miette, Miette, qui adore grignoter le papier. Ne dis pas qui est le coupable. Termine par : « À ton avis, qui a pris le livre ? »",
              choix: [["Pacha, le chat du concierge", 3], ["Jacasse, la pie", 4], ["Miette, la souris", 5]],
            },
            {
              ref: 3, titre: "Bureau — Pacha ?",
              consigne: "Bouquin pense que c’est Pacha. Puis il se souvient : il est allergique aux poils de chat, et il n’a pas éternué une seule fois. Ce n’est pas Pacha ! Il regarde les fenêtres : elles sont toutes fermées, Jacasse n’a pas pu entrer. Alors c’est Miette. Les traces mènent à la porte.",
              ...leTemps(6),
            },
            {
              ref: 4, titre: "Bureau — Jacasse ?",
              consigne: "Bouquin pense que c’est Jacasse. Il va voir les fenêtres : elles sont toutes fermées, Jacasse n’a pas pu entrer. Et il n’a pas éternué une seule fois, lui qui est allergique aux poils de chat : ce n’est pas le chat non plus. Alors c’est Miette. Les traces mènent à la porte.",
              ...leTemps(6),
            },
            {
              ref: 5, titre: "Bureau — la longue queue",
              consigne: "Bouquin regarde les traces de près : de toutes petites pattes, et entre elles un long trait fin. Ce trait, c’est une longue queue qui traîne. C’est Miette ! Les traces mènent à la porte.",
              choix: [["Suivre les traces", 6]],
            },
            {
              ref: 6, titre: "Porte — des poils caramel",
              consigne: `${PLUSIEURS} Les traces mènent à la porte de la classe, qui est fermée. Sous la porte, Bouquin trouve quelques poils couleur caramel, comme ceux de Miette : il est sur la bonne piste. Miette est passée dessous avec le livre, qui est tout plat. Bouquin, lui, est trop gros. La poignée est trop haute pour lui. Les chaises des élèves sont rangées tout près. Il doit ouvrir la porte, et vite !`,
              choix: [["Passer sous la porte", 7], ["Cracher du feu sur la porte", 8], ["Voler jusqu’à la poignée", 9], ["Pousser une chaise sous la poignée", 11]],
            },
            {
              ref: 7, titre: "Porte — coincé dessous",
              consigne: "Bouquin essaie de passer sous la porte. Sa tête reste coincée ! Il tire, il pousse, il souffle. Enfin libre, il voit les chaises des élèves. Il en pousse une sous la poignée, il grimpe, et la porte s’ouvre.",
              ...leTemps(11),
            },
            {
              ref: 8, titre: "Porte — un peu de feu ?",
              consigne: "Bouquin veut cracher du feu sur la porte. Il s’échauffe la voix, comme un chanteur : « Mi, mi, mi… » Juste avant de souffler, il s’arrête, un peu bête. Mettre le feu à l’école ? Quelle drôle d’idée ! Il pousse une chaise sous la poignée, il grimpe, et la porte s’ouvre.",
              ...leTemps(11),
            },
            {
              ref: 9, titre: "Porte — voler jusqu’à la poignée",
              consigne: "Bouquin veut voler jusqu’à la poignée. Mais ses ailes sont encore trop petites : Jacasse l’appelle « ma poule », parce qu’il vole mal. Il prend son élan et bat des ailes de toutes ses forces. Ne dis pas s’il réussit : le dé va le décider.",
              choix: [["C’est raté", 10], ["C’est réussi", 11]],
              phrase: ["Si tu fais 1 ou 2, va au ", 0, ". Si tu fais 3, 4, 5 ou 6, va au ", 1, "."],
            },
            {
              ref: 10, titre: "Porte — ma poule !",
              consigne: "Bouquin retombe sur les fesses, boum ! Il croit entendre Jacasse : « Ma poule ! » Il se relève en grognant. Il pousse une chaise sous la poignée, il grimpe, et la porte s’ouvre.",
              ...leTemps(11),
            },
          ],
        },
        {
          cle: "couloir", titre: "Le couloir", couleur: 3, visuel: "chateau",
          resume: "Bouquin avance dans le couloir tout noir, sans se faire voir du concierge, puis il choisit le bon chemin au bout du couloir.",
          scenes: [
            {
              ref: 11, titre: "Couloir — tout noir",
              consigne: "On arrive ici de plusieurs façons : commence quand la porte s’ouvre, sans dire comment. Le couloir est tout noir. Tout au fond, une petite lueur bleue et le bruit d’une télévision sortent de la loge du concierge : il est encore là. On ne voit presque rien. Près de la porte, il y a l’interrupteur.",
              choix: [["Allumer la lumière", 12], ["Avancer doucement dans le noir", 13]],
            },
            {
              ref: 12, titre: "Couloir — la lumière !",
              consigne: "Bouquin allume la lumière. Aussitôt, la porte de la loge s’ouvre : « Qui est là ? » Bouquin ne bouge plus, comme une figurine. Le concierge regarde, se gratte la tête, éteint la lumière et retourne à sa télévision. Bouquin a eu chaud !",
              ...leTemps(13),
            },
            {
              ref: 13, titre: "Couloir — trois chemins",
              consigne: `${PLUSIEURS} Dans le noir, les yeux de Bouquin s’habituent. Par terre, dans la poussière, il voit une longue trace : Miette traîne le livre, bien trop lourd pour elle. Au bout du couloir, le concierge a passé le balai : la trace s’arrête là. Il y a trois chemins : l’escalier qui monte à l’étage, la loge du concierge, où vit le chat, et la porte de la bibliothèque. Ne dis pas où est allée Miette.`,
              choix: [["Monter l’escalier", 14], ["Aller à la loge du concierge", 15], ["Entrer dans la bibliothèque", 16]],
            },
            {
              ref: 14, titre: "Escalier — personne en haut",
              consigne: "Bouquin monte l’escalier. En haut, pas de trace, rien du tout. Il réfléchit : avec un livre si lourd, Miette n’a pas pu monter les marches. Et elle n’irait jamais chez Pacha ! Il redescend vite et entre dans la bibliothèque.",
              ...leTemps(16),
            },
            {
              ref: 15, titre: "Loge — Pacha !",
              consigne: "Bouquin passe la tête dans la loge du concierge. Pacha ouvre un œil, puis il bondit ! Bouquin file, Pacha derrière lui. Atchoum ! En courant, il comprend : une souris n’irait jamais chez le chat, et elle n’a pas pu monter l’escalier avec un si gros livre. Il se cache dans la bibliothèque, et Pacha repart.",
              ...leTemps(16),
            },
          ],
        },
        {
          cle: "bibliotheque", titre: "La bibliothèque", couleur: 6, visuel: "bibliotheque",
          resume: "Dans la bibliothèque, une ombre géante, trois traînées, puis Miette derrière le radiateur. Ils se disputent le livre, puis Bouquin lit l’histoire à Miette.",
          scenes: [
            {
              ref: 16, titre: "Bibliothèque — l’ombre géante",
              consigne: `${PLUSIEURS} Commence quand Bouquin entre dans la bibliothèque. Une seule lampe est restée allumée, sur une table. Sur le mur, au-dessus des étagères, une ombre énorme bouge : elle tient un livre. On dirait un monstre ! Ne dis pas ce que c’est.`,
              choix: [["S’enfuir", 17], ["Chercher d’où vient l’ombre", 18]],
            },
            {
              ref: 17, titre: "Bibliothèque — un monstre ?",
              consigne: "Bouquin a peur : il se cache derrière une étagère et il tremble. Puis il regarde mieux l’ombre. Elle a de petites oreilles rondes et une longue queue. Ce n’est pas un monstre ! C’est une toute petite bête, tout près de la lampe. Il revient vers la lumière.",
              ...leTemps(18),
            },
            {
              ref: 18, titre: "Lampe — trois traînées",
              consigne: `${PLUSIEURS} Commence quand Bouquin arrive près de la lampe. Miette était là : elle se réchauffait contre la lampe. Elle voit Bouquin et disparaît d’un bond. Près de la lampe partent trois traînées : des confettis bleus, des feuilles de classeur et des confettis rouges. Ne dis pas laquelle est la bonne, et ne rappelle pas la couleur du livre.`,
              choix: [["Suivre les miettes bleues", 19], ["Suivre les feuilles de classeur", 20], ["Suivre les miettes rouges", 21]],
            },
            {
              ref: 19, titre: "Bac des cahiers — du bleu",
              consigne: "Les confettis bleus mènent au bac des vieux cahiers. Bouquin trouve un cahier bleu tout grignoté. Mais le livre de la maîtresse est rouge ! Il revient vite et suit les confettis rouges, jusqu’au radiateur.",
              ...leTemps(21),
            },
            {
              ref: 20, titre: "Corbeille — des feuilles",
              consigne: "Les feuilles de classeur mènent à la corbeille à papier. Il n’y a que des brouillons froissés. Mais le livre de la maîtresse est rouge ! Il revient vite et suit les confettis rouges, jusqu’au radiateur.",
              ...leTemps(21),
            },
            {
              ref: 21, titre: "Radiateur — la dispute",
              consigne: `${PLUSIEURS} Commence quand Bouquin arrive au radiateur. Crr, crr… Derrière le radiateur, Miette ouvre déjà la bouche devant le livre rouge. Bouquin attrape le livre. Miette le tient aussi : ils tirent chacun de leur côté. Bouquin est plus fort, il arrache le livre. Miette croise les bras et boude, le dos tourné.`,
              choix: [["Ouvrir le livre", 22]],
            },
            {
              ref: 22, titre: "Radiateur — l’histoire",
              consigne: "Bouquin s’assoit à côté de Miette, qui boude toujours. Il ouvre le livre et commence à lire à voix haute. Petit à petit, Miette tourne une oreille, puis la tête. Elle s’approche et se blottit contre lui pour écouter. Elle découvre que les livres ne sont pas seulement bons à manger : ce sont aussi de belles histoires. Miette ne parle pas : montre-le par ses gestes.",
              choix: [["Ramener le livre", 23]],
            },
            {
              ref: 23, titre: "Classe — le lendemain matin", fin: true,
              consigne: "Écris la fin heureuse. L’histoire est finie : Bouquin demande à Miette de ramener le livre sur le bureau. Elle le traîne jusqu’à la classe et le pose sur le bureau. Bouquin remonte sur son étagère. Le lendemain matin, la maîtresse prend son livre : un petit coin est déchiré, grignoté. Elle ne comprend pas. Sur l’étagère, la figurine de Bouquin a l’air de sourire.",
            },
            {
              ref: 24, titre: "Radiateur — trop tard", fin: true, numero: 20,
              consigne: "Écris cette fin, où Bouquin arrive trop tard. On peut y arriver de n’importe quel moment de l’histoire : commence par « Bouquin a perdu trop de temps. » Quand il trouve enfin Miette, derrière le radiateur de la bibliothèque, elle a déjà mangé les dernières pages du livre, et elle dort, le ventre tout rond. Pas grave ! Bouquin prend un crayon et invente une fin. Il l’écrit sur une feuille, la glisse dans le livre pour les enfants, et remet le livre sur le bureau.",
              choix: [["Recommencer pour arriver à temps", 1]],
              phrase: ["Tu peux recommencer pour arriver à temps : va au ", 0, "."],
            },
          ],
        },
      ],
    },
  ],

  TEXTES_DE_BASE: {},
  // Une correction légère des textes écrits : l'orthographe et la langue, sans rallonger
  CORRECTION: { degre: 2 },
  A_ECRIRE: Array.from({ length: 24 }, (_, i) => i + 1),
  MOTS: { 1: 65, 2: 80, 6: 70, 13: 70, 18: 65, 21: 65, 22: 70, 23: 70, 24: 75, 3: 45, 4: 45, 7: 40, 8: 45, 10: 35, 12: 45, 14: 45, 15: 50, 17: 45, 19: 40, 20: 40 },
  MOTS_PAR_DEFAUT: 55,

  /** Neuf images dans le texte ; la page de titre prend l'image du projet (« titre »). */
  IMAGES: [
    { ref: 1, cadrage: "moitie", badges: ["Bouquin"], idee: "Une salle de classe le soir, déserte. Un livre à couverture rouge est posé sur le bureau de la maîtresse. Sur une étagère, le petit dragon bleu fait la figurine, mais ses yeux regardent le livre." },
    { ref: 2, cadrage: "moitie", badges: ["Bouquin"], idee: "Le dragon, debout sur le bureau de la maîtresse, se penche sur de toutes petites traces de pattes dans la poudre de craie, avec un long trait fin entre elles, et des confettis de papier. Le livre n’est plus là." },
    { ref: 11, cadrage: "moitie", badges: ["Bouquin"], idee: "Un couloir d’école tout noir, la nuit. Tout au fond, une porte entrouverte laisse sortir une lueur bleue de télévision. Le dragon, sur le seuil de la classe, regarde dans le noir." },
    { ref: 16, cadrage: "page", badges: ["Bouquin"], idee: "Une bibliothèque d’école plongée dans la pénombre. Une seule petite lampe est allumée sur une table. Sur le mur, au-dessus des étagères, une ombre immense de souris qui tient un livre. Le dragon, de dos au premier plan, est figé de peur." },
    { ref: 18, cadrage: "moitie", badges: ["Bouquin"], idee: "Dans une bibliothèque d’école, la nuit, une petite lampe de bureau est allumée sur une table basse, comme celle d’à côté. Au pied de la table, trois traînées partent dans trois directions sur le sol : des confettis bleus, des feuilles de classeur, des confettis rouges. Le dragon les regarde, perplexe." },
    { ref: 21, cadrage: "moitie", badges: ["Bouquin", "Miette"], idee: "Au pied d’un radiateur, le dragon et la toute petite souris tirent chacun de leur côté sur un livre à couverture rouge. La souris est minuscule à côté du dragon : debout, elle lui arrive au genou, et le livre est plus grand qu’elle. Elle s’accroche de toutes ses forces." },
    { ref: 22, cadrage: "page", badges: ["Bouquin", "Miette"], idee: "Assis par terre contre un radiateur, le dragon lit à voix haute un livre à couverture rouge. La souris est blottie contre lui et écoute, les yeux brillants. Lumière douce d’une lampe." },
    { ref: 23, cadrage: "moitie", badges: ["la maîtresse", "Bouquin"], idee: "Le matin, dans la classe pleine de soleil, la maîtresse regarde, étonnée, un petit coin grignoté de son livre à couverture rouge. Sur l’étagère, le dragon fait la figurine et a l’air de sourire." },
    { ref: 24, cadrage: "moitie", badges: ["Bouquin", "Miette"], idee: "Derrière un radiateur, la souris dort, le ventre tout rond, au milieu de miettes de papier. Le dragon écrit une fin sur une feuille, avec un crayon, à côté du livre à couverture rouge entamé." },
  ],
};
