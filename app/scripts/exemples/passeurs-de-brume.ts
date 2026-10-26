/**
 * Livre d'exemple « Les passeurs de brume » (plan, point 3 de « Suite recommandée après
 * l'ouverture », entretien du 25 octobre 2026) : la conception de départ, d'où se crée le
 * projet de travail en local (`npm run livres:exemple -- passeurs --brouillon`). Les textes
 * finis, les images et la mise en page viennent ensuite de l'application elle-même, et sont
 * gardés dans l'instantané `passeurs-de-brume/livre.json`, que la commande recharge.
 *
 * Repris de l'histoire de la maquette (scripts/passeurs-de-brume.ts, qui reste celle de
 * l'histoire d'essai) : le plan, les vingt-quatre textes écrits, gardés comme base. Corrigé à
 * l'entretien : S025 et le chapitre vide « Les racines » retirés, S029 qui mène au sanctuaire,
 * S031 valable depuis les deux chemins, un jeu qui compte (volonté, objets, dé, énigme au 38),
 * un passage « plus de volonté » au numéro fixe 40. Projet de classe sans classe ni élève,
 * « 8 à 10 ans ».
 */
import type { Feuille } from "@/domaine/preparation";
import type { PartieExemple } from "./conception";

export const TITRE = "Les passeurs de brume";
export const DEPART = 1;
export const AGE = "8-10";
export const VISUEL_DU_PROJET = "port";

// ——— Préparation (F02) et personnages (F10.2) ———

export const PREPARATION = {
  univers: "Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs d’une rive à l’autre avec des lanternes. Quand les lanternes s’éteignent, les chemins changent de place.",
  personnages: "Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes, mais il a peur de l’eau.\nMarius, son père, parti chercher la première lanterne.\nUne chouette messagère aux plumes argentées, qui montre le chemin sans parler.\nUn passeur au long manteau gris, qui apparaît et disparaît comme la brume.",
  enjeu: "Retrouver son père, disparu dans la brume, avant que la dernière lanterne ne s’éteigne.",
  regles: [
    "Avant de commencer, prends ta feuille d’aventure. Lou a 5 points de volonté : écris-les. Note aussi la lanterne de secours dans ton inventaire.",
    "Dans certains passages, un encadré te demande de changer ta feuille : ajouter ou retirer un point, noter ou rayer un objet. Fais-le avant de continuer ta lecture.",
    "Si la volonté de Lou tombe à 0, il n’a plus le courage d’avancer : rends-toi tout de suite au 40.",
    "Quand un passage te demande de lancer le dé, lance un dé à six faces, puis lis la suite.",
  ].join("\n"),
  formuleRenvoi: "rends",
  constructions: ["neutre", "pour", "si"],
} as const;

/** Les cartes de l'étape Personnages : le héros d'abord ; les trois premiers reçoivent un portrait. */
export const PERSONNAGES: { nom: string; autresNoms: string[]; heros: boolean; description: string; portrait: boolean }[] = [
  {
    nom: "Lou", autresNoms: ["le garçon"], heros: true, portrait: true,
    description: "Lou a 10 ans. C’est le fils de Marius, le dernier passeur du village. Il connaît le chant des lanternes, que sa mère lui a appris. Il a peur de l’eau, mais il est courageux quand il le faut. Il porte un sac sur le dos, avec une lanterne de secours.",
  },
  {
    nom: "Marius", autresNoms: ["son père", "le père de Lou"], heros: false, portrait: true,
    description: "Le père de Lou, passeur du village. Il est parti chercher la première lanterne, tout en haut de la tour, pour arrêter la brume. Il porte une casquette de passeur.",
  },
  {
    nom: "la chouette", autresNoms: ["la chouette messagère"], heros: false, portrait: true,
    description: "Une chouette aux plumes argentées et aux grands yeux dorés. Elle ne parle pas, mais elle montre le chemin à Lou.",
  },
  {
    nom: "le passeur", autresNoms: ["l’homme au manteau gris"], heros: false, portrait: false,
    description: "Un passeur au long manteau gris, une lanterne à la main. Il apparaît et disparaît comme un morceau de brume.",
  },
];

// ——— Objets, formules, feuille d'aventure (F04.2) ———

export const OBJETS: [nom: string, description: string][] = [
  ["la lanterne de secours", "Dans le sac de Lou dès le départ. Elle s’allume avec une allumette."],
  ["la carte du passeur", "Trouvée dans la cabane. Son trait bleu bouge pour montrer le chemin."],
  ["la clé d’argent", "Petite clé trouvée dans le nid de la chouette. Elle ouvre la porte sans poignée."],
  ["la clochette fêlée", "Ramassée dans la clairière aux cloches. Quand elle sonne, la brume recule."],
];

export const FORMULES: [texte: string, signe: string][] = [
  ["Ajoute un point de volonté à ton héros.", "coeur"],
  ["Retire un point de volonté à ton héros.", "coeur"],
  ["Ajoute … à ton inventaire.", "sac"],
  ["Note … dans ce que tu découvres.", "crayon"],
  ["Lance le dé.", "de"],
];

export const FEUILLE: Feuille = {
  on: true,
  des: 1,
  sections: [
    { id: "heros", type: "compteurs", titre: "Lou", compteurs: [{ id: "vol", nom: "Volonté", depart: 5 }] },
    { id: "inv", type: "liste", titre: "Inventaire", lignes: 6 },
    { id: "dec", type: "notes", titre: "Ce que tu découvres" },
  ],
};

/** Actions de jeu, par scène : elles se posent après le récit, avant les choix. */
export const ACTIONS: Record<number, string[]> = {
  2: ["Retire un point de volonté à ton héros."],
  5: ["Ajoute la carte du passeur à ton inventaire."],
  15: ["Ajoute un point de volonté à ton héros."],
  16: ["Retire un point de volonté à ton héros."],
  22: ["Retire un point de volonté à ton héros."],
  23: ["Ajoute la clé d’argent à ton inventaire."],
  27: ["Retire un point de volonté à ton héros."],
  29: ["Ajoute la clochette fêlée à ton inventaire."],
  34: ["Ajoute un point de volonté à ton héros.", "Note « la première lanterne » dans ce que tu découvres."],
  41: ["Si tu n’as pas la carte du passeur, retire un point de volonté à ton héros."],
  43: ["Retire un point de volonté à ton héros."],
  52: ["Lance le dé."],
};

// ——— Le plan ———

export const PARTIES: PartieExemple[] = [
  {
    titre: "Le quai aux lanternes", visuel: "port",
    chapitres: [
      {
        cle: "bac", titre: "Le dernier bac", couleur: 5, visuel: "bateau",
        resume: "Lou rate le dernier bac et découvre que les lanternes du quai s’éteignent une à une. Dans la cabane du passeur, il trouve la trace de son père.",
        scenes: [
          {
            ref: 1, titre: "Quai — la sirène du dernier bac",
            consigne: "Présente Lou et le quai, le soir, au moment où la sirène du dernier bac retentit. Montre que quelque chose d’étrange arrive aux lanternes.",
            choix: [["Courir vers la passerelle", 2], ["Regarder les lanternes", 3]],
          },
          {
            ref: 2, titre: "Passerelle — le bac s’éloigne",
            consigne: "Lou court vers la passerelle, mais le bac s’éloigne déjà. Raconte ce qu’il voit et ce qu’il ressent quand personne ne lui répond.",
            choix: [["Aller vers la cabane du passeur", 4]],
          },
          {
            ref: 3, titre: "Quai — la lanterne qui clignote",
            consigne: "Lou s’approche des lanternes. Une seule brille encore : décris-la, et ce qu’elle éclaire.",
            choix: [["Suivre la lumière", 4]],
          },
          {
            ref: 4, titre: "Cabane du passeur — la carte oubliée",
            consigne: "Lou entre dans la cabane du passeur. Décris ce qu’il y trouve, et l’objet qui lui rappelle son père.",
            choix: [["Prendre la carte", 5], ["Sortir par la fenêtre", 6]],
          },
          {
            ref: 5, titre: "Cabane — la carte s’anime",
            consigne: "La carte se met à bouger quand Lou la touche. Raconte ce qu’elle lui montre.",
            choix: [["Suivre la carte", 6]],
          },
          {
            ref: 6, titre: "Quai — la barque sans rameur",
            consigne: "Derrière la cabane, une barque attend, sans rames ni voile. Lou a peur de l’eau : montre comment il trouve le courage de monter.",
            choix: [["Monter dans la barque", 14]],
          },
          {
            ref: 7, titre: "Quai — le courage envolé", fin: true, numero: 40,
            consigne: "Lou n’a plus de volonté : il n’ose plus avancer. Raconte comment il se retrouve au matin sur le quai de son village, triste mais à l’abri, avec l’envie de recommencer.",
            choix: [["Retenter ta chance", 1]],
          },
        ],
      },
    ],
  },
  {
    titre: "La forêt engloutie", visuel: "foret",
    chapitres: [
      {
        cle: "lisiere", titre: "La lisière", couleur: 4, visuel: "etang",
        resume: "La barque accoste au bord de la forêt. Deux chemins possibles, qui se rejoignent au pont de brume, où attend un passeur.",
        scenes: [
          {
            ref: 14, titre: "Lisière — les lanternes s’éteignent",
            consigne: "Décris l’arrivée de la barque à la lisière et le moment où les lanternes de la forêt s’éteignent une à une.\n– Ce que Lou voit, puis ce qu’il ne voit plus\n– Un bruit doux qui l’attire",
            choix: [["Suivre le chant", 15], ["Allumer la lanterne de secours", 16]],
          },
          {
            ref: 15, titre: "Sentier — le chant dans les fougères",
            consigne: "Raconte ce que Lou entend et ressent quand le chant l’attire vers les fougères. Termine en montrant une lumière au loin.\n– Décris le chant : doux, triste, joyeux ?\n– Utilise au moins deux sens",
            choix: [["Continuer vers la lumière", 18]],
          },
          {
            ref: 16, titre: "Souche creuse — la lanterne de secours",
            consigne: "Lou se cache dans une souche creuse et allume la lanterne de secours. Décris ce qu’il découvre à l’intérieur, et ce qui lui fait peur.",
            choix: [["Sortir de la souche", 18], ["Rester caché", 17]],
          },
          {
            ref: 17, titre: "Souche — la chouette messagère",
            consigne: "Lou reste caché. Une chouette se pose près de la souche : raconte comment Lou comprend qu’elle veut l’aider.\n– La chouette : ses plumes, ses yeux\n– Le moment où Lou comprend",
            choix: [["Suivre la chouette", 21]],
          },
          {
            ref: 18, titre: "Clairière — les deux chemins se rejoignent",
            consigne: "Les deux sentiers se rejoignent dans une petite clairière. Lou y trouve la lumière aperçue plus tôt : décris ce lieu, et le pont de brume qui apparaît au-dessus du ravin.",
            choix: [["Traverser le pont de brume", 19]],
          },
          {
            ref: 19, titre: "Pont de brume — le passeur apparaît",
            consigne: "Sur le pont de brume, un passeur au manteau gris attend Lou. Raconte leur rencontre : il connaît le père de Lou et l’emmène jusqu’à une vieille chapelle, puis il disparaît.",
            choix: [["Entrer dans la chapelle", 31]],
          },
        ],
      },
      {
        cle: "gue", titre: "Le gué des saules", couleur: 3, visuel: "riviere",
        resume: "La chouette mène Lou jusqu’à une rivière aux pierres qui chantent. Il y trouve la clé d’argent, ou il tombe à l’eau.",
        scenes: [
          {
            ref: 21, titre: "Gué — les pierres qui chantent",
            consigne: "La chouette conduit Lou au bord d’une rivière. Les pierres du gué chantent : décris leur musique et les deux façons de traverser.",
            choix: [["Sauter de pierre en pierre", 22], ["Appeler la chouette", 23]],
          },
          {
            ref: 22, titre: "Rivière — la pierre glissante",
            consigne: "Lou glisse et tombe à l’eau, lui qui en a peur. Raconte sa chute, puis ce qu’il entend et voit en se relevant.",
            choix: [["Nager vers la rive", 24], ["Suivre le son des cloches", 26]],
          },
          {
            ref: 23, titre: "Saule — le nid de la chouette",
            consigne: "Lou appelle la chouette et grimpe jusqu’à son nid. Décris ce qu’il y trouve.",
            choix: [["Redescendre et longer la rive", 24]],
          },
          {
            ref: 24, titre: "Rive — le moulin au loin",
            consigne: "Depuis la rive, Lou aperçoit un vieux moulin à moitié dans l’eau. Décris-le de loin, et donne envie d’y aller.",
            choix: [["Marcher vers le moulin", 40]],
          },
        ],
      },
      {
        cle: "clairiere", titre: "La clairière aux cloches", couleur: 2, visuel: "jardin",
        resume: "Dans une clairière, des cloches pendent aux branches sans bouger. Une clochette fêlée montre le chemin du sanctuaire.",
        scenes: [
          {
            ref: 26, titre: "Clairière — les cloches muettes",
            consigne: "Lou arrive dans une clairière pleine de cloches qui ne bougent pas. Décris ce lieu et son silence.",
            choix: [["Sonner la grande cloche", 27], ["Écouter le silence", 28]],
          },
          {
            ref: 27, titre: "Clocher — l’écho du passeur",
            consigne: "Lou sonne la grande cloche. Raconte ce qu’il entend dans l’écho, et la brume qui se réveille.",
            choix: [["Suivre l’écho", 29]],
          },
          {
            ref: 28, titre: "Silence — la voix sous la mousse",
            consigne: "Lou écoute le silence. Une voix chuchote sous la mousse : que dit-elle ?",
            choix: [["Creuser", 29]],
          },
          {
            ref: 29, titre: "Clairière — la clochette fêlée",
            consigne: "Lou trouve une petite clochette fêlée. Décris ce qui est gravé dessus, et le chemin qu’elle lui indique vers une chapelle.",
            choix: [["Suivre la flèche", 31]],
          },
        ],
      },
      {
        cle: "sanctuaire", titre: "Le sanctuaire", couleur: 6, visuel: "temple",
        resume: "Une chapelle couverte de lierre où les passeurs laissent leurs secrets. Les statues savent où le père de Lou est monté.",
        scenes: [
          {
            ref: 31, titre: "Sanctuaire — la porte aux mille lucioles",
            consigne: "Lou arrive devant une petite chapelle couverte de lierre. Décris la porte et les lucioles, et ce qui est écrit au-dessus.",
            choix: [["Entrer", 32], ["Faire le tour", 33]],
          },
          {
            ref: 32, titre: "Nef — les statues endormies",
            consigne: "Dans la chapelle, des statues dorment. Décris-les, et celle que Lou reconnaît.",
            choix: [["Réveiller la statue", 34]],
          },
          {
            ref: 33, titre: "Cloître — le bassin des reflets",
            consigne: "Derrière la chapelle, un bassin montre autre chose que le reflet de Lou. Raconte ce qu’il y voit.",
            choix: [["Plonger la main dans le bassin", 34], ["Repartir avec la clochette", 35], ["Repartir dans la brume", 36]],
            phrase: ["Pour plonger la main dans le bassin, rends-toi au ", 0, ". Pour repartir : si tu as la clochette fêlée, fais-la sonner et rends-toi au ", 1, " ; sinon, rends-toi au ", 2, "."],
          },
          {
            ref: 34, titre: "Nef — la statue parle",
            consigne: "La statue se réveille et parle à Lou. Écris ce qu’elle lui apprend sur son père et sur la première lanterne.",
            choix: [["Ouvrir la trappe", 35]],
          },
          {
            ref: 35, titre: "Crypte — la lanterne du premier passeur",
            consigne: "Lou descend dans la crypte. Décris la lanterne bleue et ce qui est peint sur le mur.",
            choix: [["Monter l’escalier", 50]],
          },
          {
            ref: 36, titre: "Cloître — perdu dans la brume", fin: true,
            consigne: "Lou repart sans rien pour chasser la brume, et il se perd. Écris cette fin : il tourne en rond toute la nuit, puis se retrouve au matin sur le quai de son village, sans son père.",
            choix: [["Retenter ta chance", 1]],
          },
        ],
      },
      {
        cle: "moulin", titre: "Le moulin noyé", couleur: 5, visuel: "moulin",
        resume: "Lou remet en marche la roue d’un moulin noyé. Une barque laissée par son père l’emporte jusqu’au pied de la tour.",
        scenes: [
          {
            ref: 40, titre: "Moulin — la roue immobile",
            consigne: "Lou arrive au moulin noyé et pousse la roue. Raconte ce qui se met en marche.",
            choix: [["Entrer dans le moulin", 41]],
          },
          {
            ref: 41, titre: "Moulin — l’eau remonte",
            consigne: "L’eau monte dans le moulin, et Lou a peur. Raconte comment il cherche un passage pour grimper plus haut, et ce qui flotte dans l’eau.",
            choix: [["Grimper au grenier", 42]],
          },
          {
            ref: 42, titre: "Grenier — la barque suspendue",
            consigne: "Au grenier, une barque est suspendue au plafond. Décris-la : le père de Lou y a laissé un message pour lui.",
            choix: [["Détacher la barque", 43]],
          },
          {
            ref: 43, titre: "Rivière souterraine — le courant vers la tour",
            consigne: "La barque file dans un tunnel sous le moulin, où l’eau coule vers le haut. Raconte ce voyage qui fait peur à Lou, et son arrivée au pied d’un immense escalier.",
            choix: [["Mettre pied à terre", 50]],
          },
        ],
      },
    ],
  },
  {
    titre: "La tour du passeur", visuel: "ciel",
    chapitres: [
      {
        cle: "escalier", titre: "L’escalier de brume", couleur: 7, visuel: "chateau",
        resume: "L’escalier s’efface derrière Lou. Une porte sans poignée garde le sommet : il faut la clé d’argent, ou résoudre l’énigme.",
        scenes: [
          {
            ref: 50, titre: "Escalier — les marches qui s’effacent",
            consigne: "Lou monte un escalier dont les marches s’effacent derrière lui. Décris cet escalier dans les nuages, et l’endroit où il se sépare en deux.",
            choix: [["Monter vite", 51], ["Compter les marches", 52]],
          },
          {
            ref: 51, titre: "Palier — la porte sans poignée",
            consigne: "Lou arrive devant une porte sans poignée. Décris-la, puis laisse le lecteur choisir comment l’ouvrir.\n– Ce qui rend la porte étrange\n– Le trou en forme de clé et les symboles gravés",
            choix: [["Ouvrir avec la clé d’argent", 53], ["Déchiffrer les symboles", 55]],
            phrase: ["Si tu as la clé d’argent, ouvre la porte au ", 0, " ; sinon, déchiffre les symboles au ", 1, "."],
          },
          {
            ref: 52, titre: "Escalier — la marche numéro cent",
            consigne: "Lou compte les marches jusqu’à la centième, qui est fendue. Décris ce qu’il voit dessous, et le saut qu’il doit tenter.",
            choix: [["Le saut raté", 54], ["Le saut réussi", 53]],
            phrase: ["Si tu fais 1 ou 2, rends-toi au ", 0, ". Si tu fais 3, 4, 5 ou 6, rends-toi au ", 1, "."],
          },
          {
            ref: 53, titre: "Palier — le miroir de brume",
            consigne: "Derrière la porte flotte un grand miroir de brume. Raconte ce que Lou y voit.",
            choix: [["Traverser le miroir", 60]],
          },
          {
            ref: 54, titre: "Escalier — la chute", fin: true,
            consigne: "Lou rate son saut. Écris cette fin : il tombe doucement dans la brume, comme dans un rêve, et se réveille sur le quai de son village.",
            choix: [["Retenter ta chance", 1]],
          },
          {
            ref: 55, titre: "Palier — la porte aux symboles",
            consigne: "Invente l’énigme gravée sur la porte. Le lecteur doit pouvoir trouver seul le numéro du passage suivant.\n– Décris les symboles\n– Écris l’énigme comme une phrase gravée\n– Vérifie que le calcul tombe juste",
            cachee: { cible: 62, libelle: "Résoudre l’énigme" },
          },
        ],
      },
      {
        cle: "sommet", titre: "Le sommet", couleur: 0, visuel: "montagne",
        resume: "Lou retrouve son père et rallume la première lanterne.",
        scenes: [
          {
            ref: 60, titre: "Sommet — le passeur se retourne",
            consigne: "Au sommet de la tour, un homme est assis, dos tourné. Raconte les retrouvailles de Lou et de son père, qui n’arrive pas à rallumer la lanterne.",
            choix: [["Prendre la lanterne", 61]],
          },
          {
            ref: 61, titre: "Sommet — la brume se lève", fin: true,
            consigne: "Lou chante le chant des lanternes et la première lanterne se rallume. Écris la fin heureuse : toutes les lanternes du lac se rallument, la brume se lève, et Lou rentre avec son père.",
          },
          {
            ref: 62, titre: "Tour — la salle des brumes", numero: 38,
            consigne: "Lou a trouvé le bon numéro : la porte s’ouvre sur une salle ronde où la brume tourne lentement. Décris cette salle secrète et l’escalier qui monte vers une lumière.",
            choix: [["Monter vers le sommet", 60]],
          },
        ],
      },
    ],
  },
];

// ——— Textes de base : les vingt-quatre de la maquette ———

/**
 * Les textes du livre fini de la maquette, gardés comme base (entretien, point 1) ; ils passent
 * ensuite à la correction de l'application. Repris à la main là où le plan a changé : S029 (la
 * clochette), S031 (sans le passeur, pour les deux chemins), S055 (l'énigme de calcul, 38).
 * La faute du 3 (« s’épaissi ») est laissée à la correction.
 */
export const TEXTES_DE_BASE: Record<number, string[]> = {
  1: [
    "La sirène du dernier bac retentit trois fois. Lou courut sur le quai, son sac rebondissant dans son dos. Le soir tombait et, comme chaque soir, la brume montait du lac.",
    "Mais ce soir-là, quelque chose clochait : les lanternes du quai s’éteignaient une à une, sans que personne ne souffle dessus. Au bout de la passerelle, le bac commençait déjà à s’éloigner.",
  ],
  2: [
    "Lou sauta sur la passerelle. Trop tard ! Le bac glissait déjà sur l’eau noire, et le passeur ne se retournait pas.",
    "« Attendez-moi ! » cria Lou. Sa voix se perdit dans la brume. Sur le pont du bac, une lanterne se balançait doucement, comme pour lui dire au revoir. Lou serra les poings : il ne voulait pas rester seul ici.",
  ],
  3: [
    "Lou s’approcha des lanternes. Toutes étaient éteintes, sauf une, tout au bout du quai, qui clignotait comme un phare minuscule.",
    "Plus il avançait, plus la brume s’épaissi autour de lui. La lanterne clignotait toujours : trois éclats courts, puis un long. On aurait dit un signal. Elle éclairait une petite cabane que Lou n’avait jamais vue.",
  ],
  4: [
    "La porte de la cabane grinça. À l’intérieur, tout sentait le bois mouillé et la cire de bougie. Sur la table, Lou reconnut la casquette de son père.",
    "À côté, une carte était dépliée. Elle montrait le lac, la forêt engloutie et, tout au bout, une tour entourée de nuages. Quelqu’un avait tracé un chemin à l’encre bleue… et l’encre était encore fraîche.",
  ],
  5: [
    "Dès que Lou toucha la carte, le trait bleu se mit à bouger. Il serpenta entre les arbres dessinés, contourna le lac et s’arrêta au bord de l’eau, juste derrière la cabane.",
    "« Tu veux que j’aille par là ? » murmura Lou. Le trait clignota deux fois, comme pour dire oui. Lou plia la carte et la glissa dans sa poche.",
  ],
  14: [
    "La barque toucha la rive sans un bruit. Devant Lou, la forêt ressemblait à un grand mur noir piqué de lanternes.",
    "Puis, une à une, les lanternes s’éteignirent, comme si quelqu’un soufflait dessus. Au loin, un chant très doux s’éleva.",
  ],
  15: [
    "Le chant était si doux que Lou en oublia la barque. Il venait de derrière les fougères, là où la brume restait accrochée aux branches comme de la laine mouillée.",
    "Lou fit un pas, puis un autre. Les feuilles lui chatouillaient les joues. Tout au fond, entre deux troncs, une petite lumière dorée l’attendait.",
  ],
  16: [
    "Lou se glissa dans la souche creuse. Il faisait noir comme dans un four. Il sortit la lanterne de secours de son sac et frotta l’allumette.",
    "La flamme dansa sur les murs de bois. Des petits yeux brillaient au fond, puis une voix murmura : « Éteins ça, tu vas les attirer. »",
  ],
  17: [
    "Une chouette se posa sur le bord de la souche. Ses plumes argentées brillaient dans la nuit. Elle regarda Lou longtemps, puis tapa trois fois du bec sur le bois.",
    "Elle s’envola jusqu’à la branche voisine et attendit. Lou comprit qu’elle voulait lui montrer le chemin. Il décida de la suivre.",
  ],
  21: [
    "La chouette se posa sur une branche de saule, au bord d’une rivière. Des pierres plates dépassaient de l’eau et chacune, quand le courant la touchait, chantait une note différente.",
    "Lou écouta : do, mi, sol… On aurait dit la chanson que sa mère fredonnait. Pour traverser, il fallait sauter sur les pierres, ou demander de l’aide à la chouette.",
  ],
  22: [
    "À la troisième pierre, le pied de Lou glissa. Plouf ! L’eau glacée lui monta jusqu’à la taille. Il se débattit, avala de l’eau, puis sentit le fond sous ses pieds.",
    "Il n’avait pas coulé. Il avait eu peur, mais il était toujours là. Au loin, des cloches sonnaient doucement et, sur l’autre rive, un sentier montait vers un moulin.",
  ],
  23: [
    "« Chouette ! » appela Lou. L’oiseau descendit en silence et se posa sur son épaule. Puis il s’envola vers le plus grand saule et disparut dans un trou du tronc.",
    "Lou grimpa derrière lui. Dans le nid, parmi les plumes, brillait une petite clé en argent. La chouette la poussa du bec vers lui.",
  ],
  26: [
    "Au milieu d’une clairière pendaient des dizaines de cloches, accrochées aux branches par des cordes moussues. Aucune ne bougeait, et pourtant Lou les avait entendues sonner.",
    "Au centre, une grande cloche touchait presque le sol. Tout autour, le silence était si profond qu’il entendait battre son cœur.",
  ],
  27: [
    "Lou tira la corde de toutes ses forces. BONG ! Le son roula dans la forêt, puis revint, transformé. Dans l’écho, Lou crut entendre une voix : « Lou… par ici… »",
    "C’était la voix de son père, il en était sûr. Elle venait d’un vieux clocher perdu entre les arbres.",
  ],
  28: [
    "Lou ferma les yeux et écouta. Sous ses pieds, très loin, quelqu’un chuchotait. Il s’agenouilla et colla son oreille contre la mousse.",
    "« Ne sonne pas les cloches, disait la voix. Elles réveillent la brume. » Lou gratta la mousse avec ses doigts : dessous, il y avait du métal.",
  ],
  29: [
    "C’était une petite clochette fêlée, à moitié enterrée. Sur son bord, quelqu’un avait gravé une lanterne et une flèche.",
    "La flèche montrait un sentier qui menait à une chapelle. Lou passa la main sur la fêlure. La clochette était tiède, comme si quelqu’un venait de la toucher. Il la glissa dans son sac.",
  ],
  31: [
    "Au bout du sentier se dressait une petite chapelle couverte de lierre. Des milliers de lucioles dansaient autour de la porte. Au-dessus, des lettres usées disaient : « Ici, les passeurs laissent leurs secrets. »",
    "Lou s’approcha. La porte était entrouverte, et un sentier faisait le tour de la chapelle.",
  ],
  32: [
    "À l’intérieur, des statues de pierre étaient assises le long des murs, les yeux fermés. Toutes tenaient une lanterne éteinte sur leurs genoux.",
    "L’une d’elles ressemblait beaucoup à son père. Lou s’approcha sur la pointe des pieds et posa la main sur son épaule froide.",
  ],
  33: [
    "Derrière la chapelle, un cloître entourait un bassin immobile. Dans l’eau, Lou ne voyait pas son reflet, mais celui d’un homme qui montait un escalier sans fin.",
    "« Papa ? » L’homme ne l’entendait pas. Il montait, montait, et la brume se refermait derrière lui.",
  ],
  34: [
    "La pierre se réchauffa sous ses doigts. Lentement, la statue ouvrit les yeux. « Ton père est monté chercher la première lanterne, souffla-t-elle. Sans elle, la brume ne s’arrêtera jamais. »",
    "Elle montra du doigt une trappe dans le sol, à peine visible sous la poussière.",
  ],
  35: [
    "Dans la crypte, une seule lanterne brûlait encore, d’une flamme bleue. Sur le mur, on avait peint une tour qui perçait les nuages.",
    "« C’est là-haut qu’il faut aller », comprit Lou. Au fond de la crypte, un escalier de pierre s’enfonçait dans le brouillard, vers le haut.",
  ],
  40: [
    "La roue du moulin était couverte d’algues. Lou appuya dessus de tout son poids : elle grinça, puis se mit à tourner lentement.",
    "Aussitôt, l’eau se mit à gronder sous le plancher. Quelque chose venait de s’ouvrir dans les profondeurs du moulin.",
  ],
  51: [
    "Essoufflé, Lou arriva devant une porte sans poignée ni serrure. Au centre, un petit trou avait la forme d’une clé.",
    "Tout autour, des symboles étranges luisaient faiblement dans la brume : des lunes, des étoiles et deux petites clés.",
  ],
  55: [
    "Lou approcha sa lanterne. Sur la porte, quatre lunes et neuf étoiles étaient gravées autour de deux petites clés.",
    "Dessous, une phrase : « Multiplie les lunes par les étoiles, ajoute les clés, et tu sauras où aller. »",
  ],
};

/** Les scènes sans texte à ce jour, écrites par « ✦ Écrire », dans l'ordre où elles s'enchaînent. */
export const A_ECRIRE = [6, 7, 18, 19, 24, 36, 41, 42, 43, 50, 52, 53, 54, 62, 60, 61];

/** Les images du livre (entretien, point 3) : la page de titre, trois pleines pages, six dans le texte. */
export const IMAGES: { ref: number; cadrage: "page" | "moitie"; badges: string[]; idee: string }[] = [
  { ref: 6, cadrage: "moitie", badges: ["Lou"], idee: "Lou monte dans une petite barque sans rames, une lanterne accrochée à l’avant, derrière une cabane de bois, dans la brume du soir." },
  { ref: 14, cadrage: "page", badges: ["Lou"], idee: "La barque touche la rive d’une forêt sombre ; les lanternes accrochées aux arbres s’éteignent une à une." },
  { ref: 17, cadrage: "moitie", badges: ["la chouette", "Lou"], idee: "Une chouette aux plumes argentées se pose au bord d’une souche creuse où Lou est caché." },
  { ref: 21, cadrage: "moitie", badges: ["Lou", "la chouette"], idee: "Une rivière sous les saules, avec des pierres plates qui chantent ; des notes de musique flottent au-dessus de l’eau." },
  { ref: 26, cadrage: "moitie", badges: ["Lou"], idee: "Une clairière où des dizaines de cloches pendent aux branches par des cordes moussues ; au centre, une grande cloche." },
  { ref: 34, cadrage: "moitie", badges: ["Lou"], idee: "Dans une chapelle, une statue de pierre ouvre les yeux devant Lou, une lanterne éteinte sur les genoux." },
  { ref: 42, cadrage: "moitie", badges: ["Lou"], idee: "Dans le grenier d’un moulin, une barque est suspendue au plafond par deux cordes ; sur la coque, on lit « Pour Lou »." },
  { ref: 50, cadrage: "page", badges: ["Lou"], idee: "Un escalier de pierre qui monte dans les nuages autour d’une haute tour ; les marches s’effacent derrière Lou." },
  { ref: 61, cadrage: "page", badges: ["Lou", "Marius"], idee: "Au sommet de la tour, Lou tient la première lanterne rallumée à côté de son père ; en bas, toutes les lanternes du lac se rallument et la brume se lève." },
];
