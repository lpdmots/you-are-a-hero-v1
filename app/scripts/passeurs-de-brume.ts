/**
 * Histoire d'essai : « Les passeurs de brume », l'histoire de la maquette de synthèse, telle
 * qu'elle y est fin septembre — vingt-quatre scènes écrites, une que l'enseignant a commencée,
 * quinze qui attendent leur texte.
 * Chargée par « npm run histoire:essai » (scripts/histoire-d-essai.ts).
 *
 * Le plan et les textes viennent de la maquette (assets/data.js, livre-textes.js, ecrans.js,
 * jeu.js), convertis une fois le 11 octobre 2026. Les consignes que la maquette ne rédige pas,
 * les résumés des chapitres, les pistes, la note et le paragraphe protégé sont écrits ici.
 * Les états « À valider », « Validé »… de la maquette n'y sont pas : ils arrivent à l'étape 4.
 */
import type { Feuille } from "@/domaine/preparation";

export type Profil = "propositions" | "organisation";
export type SceneEssai = {
  /** 17 pour « S017 » : les références de la maquette, trous compris */
  ref: number;
  titre: string;
  /** Prénom de l'élève qui s'en occupe */
  pec?: string;
  /** Pas encore écrite dans la maquette : la scène n'a que ses choix */
  vide?: true;
  sansConsigne?: true;
  fin?: true;
  choix?: [libelle: string, cible: number][];
  /** Phrase de choix personnalisée : du texte, et le rang du choix à la place de chaque renvoi */
  phrase?: (string | number)[];
  /** Liaison cachée par énigme (F05.1) : la destination garde le numéro que l'énigme donne */
  cachee?: { cible: number; numero: number; libelle: string };
};
export type ChapitreEssai = { cle: string; titre: string; couleur: number; eleves: [prenom: string, profil: Profil][]; scenes: SceneEssai[] };
export type PartieEssai = { cle: string; titre: string; chapitres: ChapitreEssai[] };

export const TITRE = "Les passeurs de brume";
export const DEPART = 1;

/** Classe d'essai : des élèves qui n'existent pas, pour essayer le côté élève sans toucher à une vraie classe. */
export const CLASSE = { nom: "CM1-CM2 d’essai", anneeDebut: 2026, identifiant: "passeursdebrume", motDePasse: "lanterne chouette 38" };
export const ELEVES = [
  "Alice", "Bilal", "Chloé", "Dylan", "Emma", "Farah", "Gabin", "Hugo", "Inès", "Jade", "Kenza", "Léo", "Lina",
  "Malo", "Nahel", "Noé", "Océane", "Paul", "Rayan", "Sacha", "Tom", "Yasmine", "Zoé", "Adam", "Maëlys",
];
/** Code personnel de l'élève de rang i : quatre chiffres, tous différents. */
export const codeDe = (i: number): string => String(1000 + ((i * 37 + 4719) % 9000));

/** Visuels proposés de l'application (F10.1), choisis au plus près des images de la maquette. */
export const VISUELS: Record<string, string> = {
  projet: "port",
  quai: "port", foret: "foret", tour: "ciel",
  bac: "bateau", lisiere: "etang", gue: "riviere", clairiere: "jardin", sanctuaire: "temple", moulin: "moulin",
  racines: "grotte", escalier: "chateau", sommet: "montagne",
};

export const RESUMES: Record<string, string> = {
  bac: "Le héros rate le dernier bac et découvre que les lanternes du quai s’éteignent une à une.",
  lisiere: "La barque accoste au bord de la forêt. Deux chemins possibles, qui se rejoignent au pont de brume.",
  gue: "La chouette mène Lou jusqu’à une rivière aux pierres qui chantent. Il y trouve la clé d’argent, ou tombe à l’eau.",
  clairiere: "Dans une clairière, des cloches sonnent sans bouger. Une cloche fêlée montre le chemin du sanctuaire.",
  sanctuaire: "Le passeur laisse Lou devant une chapelle. Les statues savent où son père est monté.",
  moulin: "Lou remet en marche la roue d’un moulin noyé. Une barque l’emporte jusqu’au pied de la tour.",
  racines: "",
  escalier: "L’escalier s’efface derrière Lou. Une porte sans poignée garde le sommet : il faut la clé, ou résoudre l’énigme.",
  sommet: "Lou retrouve son père et rallume la première lanterne.",
};

// ——— Carnet de préparation (F02) ———

export const PREPARATION = {
  univers: "Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs d’une rive à l’autre avec des lanternes. Quand les lanternes s’éteignent, les chemins changent de place.",
  personnages: "Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes mais a peur de l’eau.\nMarius, son père, parti chercher la première lanterne.\nUne chouette messagère, aux plumes argentées, qui montre le chemin sans parler.",
  enjeu: "Retrouver son père, disparu dans la brume, avant que la dernière lanterne ne s’éteigne.",
  regles:
    "Avant de commencer, prends ta feuille d’aventure. Ton héros a 5 points de volonté et une lanterne de secours : écris-la dans ton inventaire.\nDans certains passages, un encadré te demande de changer ta feuille : ajouter ou retirer des points, noter ou rayer un objet. Fais-le avant de continuer ta lecture.\nSi ta volonté tombe à 0, Lou n’a plus le courage d’avancer : retourne au passage 1 et recommence l’aventure.\nQuand un passage te demande de lancer le dé, lance un dé à six faces, puis lis la suite du passage.",
  formuleRenvoi: "rends",
  constructions: ["neutre", "pour", "si"],
} as const;

export const PISTES: [rubrique: "univers" | "personnages" | "enjeu" | "etapes", texte: string, etat: "retenue" | "discuter" | "ecartee"][] = [
  ["univers", "Les lanternes chantent quand un passeur approche", "retenue"],
  ["univers", "La brume efface les souvenirs de ceux qui s’y perdent", "discuter"],
  ["univers", "Un monstre vit au fond du lac", "ecartee"],
  ["personnages", "Une chouette messagère aide Lou", "retenue"],
  ["personnages", "Lou a une petite sœur restée au village", "discuter"],
  ["enjeu", "Si Lou échoue, il se réveille sur le quai, sans son père", "retenue"],
  ["etapes", "Finir tout en haut d’une tour, au-dessus des nuages", "retenue"],
];

// ——— Objets, formules, feuille d'aventure (F04.2) ———

export const OBJETS: [nom: string, description: string][] = [
  ["la clé d’argent", "Petite clé trouvée dans le nid de la chouette. Elle ouvre la porte sans poignée."],
  ["la carte du passeur", "Carte de la cabane. Son trait bleu bouge pour montrer le chemin."],
  ["la lanterne de secours", "Dans le sac de Lou dès le départ. Elle s’allume avec une allumette."],
  ["le couteau", "Petit couteau de Lou, au manche de corne. Il coupe les cordes du grenier."],
  ["la plume argentée", "Plume laissée par la chouette messagère."],
  ["la casquette de Marius", "Casquette du père de Lou, oubliée sur la table de la cabane."],
  ["la clochette fêlée", "Clochette ramassée dans la clairière. Elle ne sonne que dans la brume."],
];

export const FORMULES = [
  "Ajoute un point de volonté à ton héros.",
  "Retire un point de volonté à ton héros.",
  "Ajoute … à ton inventaire.",
  "Raye … de ton inventaire.",
  "Note … dans ce que tu découvres.",
  "Lance le dé.",
];

export const FEUILLE: Feuille = {
  on: true,
  des: 1,
  sections: [
    { id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 5 }] },
    { id: "inv", type: "liste", titre: "Inventaire", lignes: 8 },
    { id: "dec", type: "notes", titre: "Ce que tu découvres" },
  ],
};

/** Actions de jeu, par scène : le nombre de paragraphes de récit placés avant, puis le texte. */
export const ACTIONS: Record<number, [avant: number, texte: string][]> = {
  5: [[2, "Ajoute la carte du passeur à ton inventaire."]],
  15: [[1, "Ajoute un point de volonté à ton héros."]],
  22: [[1, "Retire un point de volonté à ton héros."]],
  23: [[2, "Ajoute la clé d’argent à ton inventaire."]],
  34: [[1, "Note « la première lanterne » dans ce que tu découvres."]],
  41: [[1, "Retire un point de volonté à ton héros."]],
  52: [[2, "Lance le dé. Si tu fais 4 ou plus, tu peux sauter par-dessus la fente. Sinon, continue prudemment."]],
};

// ——— Consignes (F07.1) ———

/** Une consigne, puis ses points d'aide, un par ligne. */
const avecPoints = (consigne: string, points: string[]): string => [consigne, ...points.map((p) => `– ${p}`)].join("\n");

export const CONSIGNES: Record<number, string> = {
  1: "Présente Lou et le quai, le soir, au moment où la sirène du dernier bac retentit. Montre que quelque chose d’étrange arrive aux lanternes.",
  2: "Lou court vers la passerelle, mais le bac s’éloigne déjà. Raconte ce qu’il voit et ce qu’il ressent.",
  3: "Lou s’approche des lanternes. Une seule brille encore : décris-la, et ce qu’elle éclaire.",
  4: "Lou entre dans la cabane du passeur. Décris ce qu’il y trouve, et l’objet qui lui rappelle son père.",
  5: "La carte se met à bouger quand Lou la touche. Raconte ce qu’elle lui montre.",
  6: "Derrière la cabane, une barque attend. Lou a peur de l’eau : montre comment il trouve le courage de monter.",
  14: avecPoints("Décris l’arrivée de la barque à la lisière et le moment où les lanternes s’éteignent une à une.", [
    "Ce que Lou voit, puis ce qu’il ne voit plus", "Un bruit qui inquiète", "Termine par les deux choix déjà préparés",
  ]),
  15: avecPoints("Raconte ce que Lou entend et ressent quand le chant l’attire vers les fougères. Termine en montrant une lumière au loin.", [
    "Décris le chant : doux, triste, joyeux ?", "Montre ce que ressent Lou : peur, curiosité…", "Utilise au moins deux sens",
  ]),
  16: avecPoints("Lou se cache dans une souche creuse et allume la lanterne de secours. Décris ce qu’il découvre à l’intérieur.", [
    "L’obscurité, puis la lumière", "Un détail étrange dans la souche", "Les deux choix de la fin",
  ]),
  17: avecPoints("Lou reste caché. Une chouette entre dans la souche : raconte comment Lou comprend qu’elle veut l’aider.", [
    "La chouette : ses plumes, ses yeux", "Le moment où Lou comprend", "Finir en suivant la chouette",
  ]),
  18: avecPoints("Les deux chemins se rejoignent dans une clairière. Lou y retrouve la lumière aperçue plus tôt : décris ce lieu.", [
    "Ce que Lou reconnaît", "D’où vient la lumière", "Le pont de brume qui apparaît",
  ]),
  21: "La chouette conduit Lou au bord d’une rivière. Les pierres du gué chantent : décris leur musique et les deux façons de traverser.",
  22: "Lou glisse et tombe à l’eau, lui qui en a peur. Raconte sa chute, puis ce qu’il découvre en se relevant.",
  23: "Lou appelle la chouette et grimpe jusqu’à son nid. Décris ce qu’il y trouve.",
  24: "Depuis la rive, Lou aperçoit un moulin. Décris-le de loin, et donne envie d’y aller.",
  26: "Lou arrive dans une clairière pleine de cloches qui ne bougent pas. Décris ce lieu et son silence.",
  27: "Lou sonne la grande cloche. Raconte ce qu’il entend dans l’écho.",
  28: "Lou écoute le silence. Une voix chuchote sous la mousse : que dit-elle ?",
  29: "Lou déterre une cloche fêlée. Décris ce qui est gravé dessus, et le chemin qu’elle indique.",
  31: "Le passeur laisse Lou devant le sanctuaire. Décris la porte et ses lucioles.",
  32: "Dans la nef, des statues dorment. Décris-les, et celle que Lou reconnaît.",
  33: "Derrière la chapelle, un bassin montre autre chose que le reflet de Lou. Raconte ce qu’il y voit.",
  34: "La statue se réveille et parle à Lou. Écris ce qu’elle lui apprend sur son père.",
  35: "Lou descend dans la crypte. Décris la lanterne bleue et ce qui est peint sur le mur.",
  36: "Lou fait demi-tour et se perd dans la brume. Écris cette fin : où se retrouve-t-il au matin ?",
  40: "Lou arrive au moulin noyé et pousse la roue. Raconte ce qui se met en marche.",
  42: "Au grenier, une barque est suspendue au plafond. Décris-la : quelqu’un y a laissé un message pour Lou.",
  50: "L’escalier s’efface derrière Lou. Continue après le premier paragraphe : décris l’endroit où l’escalier se sépare en deux.",
  51: avecPoints("Lou arrive devant une porte sans poignée. Décris-la, puis laisse le lecteur choisir comment l’ouvrir.", [
    "Ce qui rend la porte étrange", "Les deux façons d’entrer",
  ]),
  52: "Lou compte les marches jusqu’à la centième, qui est fendue. Décris ce qu’il voit dessous, puis les deux façons de continuer.",
  53: "Derrière la porte flotte un miroir de brume. Raconte ce que Lou y voit.",
  54: "Lou saute et rate la marche. Écris cette fin : où se réveille-t-il ?",
  55: avecPoints("Invente l’énigme gravée sur la porte. Le lecteur doit pouvoir trouver seul le numéro du passage suivant.", [
    "Décris les symboles", "Écris l’énigme comme une phrase gravée", "Vérifie que le calcul tombe juste",
  ]),
  60: "Au sommet, un homme est assis, dos tourné. Raconte les retrouvailles de Lou et de son père.",
};

// ——— Textes ———

/**
 * Textes en cours, fin septembre : ceux de la page de scène de la maquette, plus courts que
 * ceux du livre fini, avec les fautes qu'elle laisse à corriger (« secour », « brillait »).
 * L'énigme de S055 y donne 38 par le calcul : quatre lunes fois neuf étoiles, plus deux clés.
 */
export const TEXTES_EN_COURS: Record<number, string[]> = {
  15: [
    "Le chant était si doux que Lou en oublia la barque. Il venait de derrière les fougères, là où la brume restait accrochée aux branches comme de la laine mouillée.",
    "Lou fit un pas, puis un autre. Les feuilles lui chatouillaient les joues.",
  ],
  16: [
    "Lou se glissa dans la souche creuse. Il faisait noir comme dans un four. Il sortit la lanterne de secour de son sac et frotta l’allumette.",
    "La flamme dansa sur les murs de bois. Des petits yeux brillait au fond, puis une voix murmura : « Éteins ça, tu vas les attirer. »",
  ],
  17: [
    "Une chouette se posa sur le bord de la souche. Ses plumes argentées brillaient dans la nuit. Elle regarda Lou longtemps.",
    "Lou décida de la suivre.",
  ],
  51: ["Sur le palier, une porte barrait le passage. Elle n’avait ni poignée ni serrure, seulement des symboles gravés qui luisaient faiblement dans la brume."],
  55: [
    "Lou approcha sa lanterne. Sur la porte, quatre lunes et neuf étoiles étaient gravées autour de deux petites clés.",
    "Dessous, une phrase : « Multiplie les lunes par les étoiles, ajoute les clés, et tu sauras où aller. »",
  ],
};

/** Note de l'enseignant (F05.2), à la fin du récit de la scène : l'élève n'en reçoit rien. */
export const NOTES: Record<number, string> = {
  17: "À revoir avec Bilal : on ne comprend pas encore comment Lou devine que la chouette veut l’aider.",
};

/**
 * Paragraphe protégé (F06.1) : l'enseignant a écrit le début de S050, que l'élève ne peut ni
 * modifier ni supprimer ; il écrit la suite.
 */
export const DEBUTS_PROTEGES: Record<number, string> = {
  50: "Chaque fois que Lou posait le pied sur une marche, celle d’en dessous s’effaçait. Impossible de redescendre !",
};

// ——— Plan du récit et textes du livre fini, tels que la maquette les donne ———

export const PARTIES: PartieEssai[] = [
  {
    cle: "quai", titre: "Le quai aux lanternes",
    chapitres: [
      {
        cle: "bac", titre: "Le dernier bac", couleur: 5,
        eleves: [["Chloé", "propositions"], ["Dylan", "propositions"], ["Emma", "propositions"]],
        scenes: [
          { ref: 1, titre: "Quai — la sirène du dernier bac", pec: "Chloé", choix: [["Courir vers la passerelle", 2], ["Regarder les lanternes", 3]] },
          { ref: 2, titre: "Passerelle — le bac s’éloigne", pec: "Dylan", choix: [["Appeler le passeur", 4]] },
          { ref: 3, titre: "Quai — la lanterne qui clignote", pec: "Emma", choix: [["La suivre", 4]] },
          { ref: 4, titre: "Cabane du passeur — la carte oubliée", pec: "Chloé", choix: [["Prendre la carte", 5], ["Sortir par la fenêtre", 6]] },
          { ref: 5, titre: "Cabane — la carte s’anime", pec: "Dylan", choix: [["Suivre la carte", 6]] },
          { ref: 6, titre: "Quai — la barque sans rameur", vide: true, choix: [["Monter dans la barque", 14]] },
        ],
      },
    ],
  },
  {
    cle: "foret", titre: "La forêt engloutie",
    chapitres: [
      {
        cle: "lisiere", titre: "La lisière", couleur: 4,
        eleves: [["Alice", "propositions"], ["Bilal", "organisation"], ["Inès", "propositions"]],
        scenes: [
          { ref: 14, titre: "Lisière — les lanternes s’éteignent", pec: "Inès", choix: [["Suivre le chant", 15], ["Allumer la lanterne de secours", 16]] },
          { ref: 15, titre: "Sentier — le chant dans les fougères", pec: "Alice", choix: [["Continuer vers la lumière", 18]] },
          { ref: 16, titre: "Souche creuse — la lanterne de secours", pec: "Bilal", choix: [["Sortir de la souche", 18], ["Rester caché", 17]] },
          { ref: 17, titre: "Souche — la chouette messagère", pec: "Bilal", choix: [["Suivre la chouette", 21]] },
          { ref: 18, titre: "Clairière — les deux chemins se rejoignent", pec: "Alice", vide: true, choix: [["Traverser le pont de brume", 19]] },
          { ref: 19, titre: "Pont de brume — le passeur apparaît", pec: "Alice", vide: true, sansConsigne: true, choix: [["Suivre le passeur", 31]] },
        ],
      },
      {
        cle: "gue", titre: "Le gué des saules", couleur: 3,
        eleves: [["Farah", "propositions"], ["Gabin", "propositions"], ["Hugo", "organisation"], ["Jade", "propositions"]],
        scenes: [
          { ref: 21, titre: "Gué — les pierres qui chantent", pec: "Farah", choix: [["Sauter de pierre en pierre", 22], ["Appeler la chouette", 23]] },
          { ref: 22, titre: "Rivière — la pierre glissante", pec: "Gabin", choix: [["Nager vers la rive", 24], ["Suivre le son des cloches", 26]] },
          { ref: 23, titre: "Saule — le nid de la chouette", pec: "Hugo", choix: [["Monter dans le saule", 24]] },
          { ref: 24, titre: "Rive — le moulin au loin", pec: "Jade", vide: true, choix: [["Marcher vers le moulin", 40]] },
          { ref: 25, titre: "Gué — la loutre passeuse", vide: true, sansConsigne: true },
        ],
      },
      {
        cle: "clairiere", titre: "La clairière aux cloches", couleur: 2,
        eleves: [["Kenza", "propositions"], ["Léo", "propositions"], ["Lina", "propositions"]],
        scenes: [
          { ref: 26, titre: "Clairière — les cloches muettes", pec: "Kenza", choix: [["Sonner la grande cloche", 27], ["Écouter le silence", 28]] },
          { ref: 27, titre: "Clocher — l’écho du passeur", pec: "Léo", choix: [["Suivre l’écho", 29]] },
          { ref: 28, titre: "Silence — la voix sous la mousse", pec: "Lina", choix: [["Creuser", 29]] },
          { ref: 29, titre: "Clairière — la cloche fêlée", pec: "Kenza" },
        ],
      },
      {
        cle: "sanctuaire", titre: "Le sanctuaire", couleur: 6,
        eleves: [["Malo", "propositions"], ["Nahel", "propositions"], ["Noé", "propositions"]],
        scenes: [
          { ref: 31, titre: "Sanctuaire — la porte aux mille lucioles", pec: "Malo", choix: [["Entrer", 32], ["Faire le tour", 33]] },
          { ref: 32, titre: "Nef — les statues endormies", pec: "Nahel", choix: [["Réveiller une statue", 34]] },
          { ref: 33, titre: "Cloître — le bassin des reflets", pec: "Noé", choix: [["Plonger la main", 34], ["Repartir", 36]] },
          { ref: 34, titre: "Nef — la statue parle", pec: "Malo", choix: [["Écouter son secret", 35]] },
          { ref: 35, titre: "Crypte — la lanterne du premier passeur", pec: "Nahel", choix: [["Monter l’escalier", 50]] },
          { ref: 36, titre: "Cloître — perdu dans la brume", pec: "Noé", vide: true, fin: true },
        ],
      },
      {
        cle: "moulin", titre: "Le moulin noyé", couleur: 5,
        eleves: [["Océane", "propositions"], ["Paul", "propositions"]],
        scenes: [
          { ref: 40, titre: "Moulin — la roue immobile", pec: "Océane", choix: [["Pousser la roue", 41]] },
          { ref: 41, titre: "Moulin — l’eau remonte", pec: "Paul", vide: true, sansConsigne: true, choix: [["Grimper au grenier", 42]] },
          { ref: 42, titre: "Grenier — la barque suspendue", vide: true, choix: [["Détacher la barque", 43]] },
          { ref: 43, titre: "Rivière souterraine — le courant vers la tour", vide: true, sansConsigne: true, choix: [["Mettre pied à terre", 50]] },
        ],
      },
      {
        cle: "racines", titre: "Les racines", couleur: 1,
        eleves: [],
        scenes: [
        ],
      },
    ],
  },
  {
    cle: "tour", titre: "La tour du passeur",
    chapitres: [
      {
        cle: "escalier", titre: "L’escalier de brume", couleur: 7,
        eleves: [["Rayan", "propositions"], ["Sacha", "propositions"], ["Tom", "propositions"], ["Yasmine", "propositions"], ["Zoé", "propositions"]],
        scenes: [
          { ref: 50, titre: "Escalier — les marches qui s’effacent", pec: "Rayan", vide: true, choix: [["Monter vite", 51], ["Compter les marches", 52]] },
          { ref: 51, titre: "Palier — la porte sans poignée", pec: "Sacha", choix: [["Ouvrir avec la clé d’argent", 53], ["Déchiffrer les symboles", 55]], phrase: ["Si tu as la clé d’argent, ouvre la porte au ", 0, " ; sinon, déchiffre les symboles au ", 1, "."] },
          { ref: 52, titre: "Escalier — la marche numéro cent", pec: "Tom", vide: true, choix: [["Continuer", 53], ["Sauter une marche", 54]] },
          { ref: 53, titre: "Palier — le miroir de brume", pec: "Yasmine", vide: true, choix: [["Traverser le miroir", 60]] },
          { ref: 54, titre: "Escalier — la chute", pec: "Zoé", vide: true, fin: true, choix: [["Retenter ta chance", 1]] },
          { ref: 55, titre: "Palier — la porte aux symboles", pec: "Sacha", cachee: { cible: 62, numero: 38, libelle: "Déchiffrer les symboles" } },
        ],
      },
      {
        cle: "sommet", titre: "Le sommet", couleur: 0,
        eleves: [],
        scenes: [
          { ref: 60, titre: "Sommet — le passeur se retourne", vide: true, choix: [["Prendre sa lanterne", 61]] },
          { ref: 61, titre: "Sommet — la brume se lève", vide: true, sansConsigne: true, fin: true },
          { ref: 62, titre: "Tour — la salle des brumes", vide: true, sansConsigne: true, choix: [["Monter vers le sommet", 60]] },
        ],
      },
    ],
  },
];

export const TEXTES: Record<number, string[]> = {
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
  6: [
    "Derrière la cabane, une petite barque attendait, amarrée à un poteau. Elle n’avait ni rames ni voile, seulement une lanterne accrochée à l’avant.",
    "Lou avait peur de l’eau. Il l’avait toujours eue. Mais son père était quelque part, de l’autre côté de la brume. Il respira un grand coup et posa un pied dans la barque.",
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
  18: [
    "Les fougères s’écartèrent d’un coup, et Lou déboucha dans une clairière ronde. La lumière qu’il suivait venait d’une lanterne posée sur une pierre.",
    "Deux sentiers s’y rejoignaient : celui des fougères et celui de la vieille souche. Devant lui, un pont de brume se dessinait lentement au-dessus du ravin.",
  ],
  19: [
    "Le pont était fait de brume, mais il tenait sous les pieds comme du vrai bois. Au milieu, une silhouette attendait, une lanterne à la main.",
    "« Tu es le fils de Marius, dit l’homme. Je t’attendais. » Il portait le long manteau gris des passeurs. Sans rien ajouter, il se retourna et partit vers l’autre rive.",
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
  24: [
    "Du haut de la rive, Lou aperçut un vieux moulin à moitié noyé. Sa grande roue ne tournait plus, et la brume sortait par ses fenêtres comme de la fumée.",
    "Sur la carte, le trait bleu passait juste devant. Lou vérifia que sa lanterne brillait encore et se mit en route.",
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
    "C’était une cloche fêlée, à moitié enterrée. Sur son bord, quelqu’un avait gravé une lanterne et une flèche.",
    "La flèche montrait le chemin du sanctuaire. Lou passa la main sur la fêlure. La cloche était tiède, comme si quelqu’un venait de la toucher.",
  ],
  31: [
    "Le passeur s’arrêta devant une petite chapelle couverte de lierre. Des milliers de lucioles dansaient autour de la porte. « Ici, dit-il, les passeurs laissent leurs secrets. »",
    "Puis il disparut, comme s’il n’avait été qu’un morceau de brume. Lou resta seul devant la porte. Elle était entrouverte.",
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
  36: [
    "Lou fit demi-tour. Mais la brume avait tout effacé : le cloître, la chapelle, le sentier. Il marcha longtemps, appela, tourna en rond.",
    "Quand le jour se leva enfin, il était de retour sur le quai de son village, sa lanterne éteinte à la main. Son père, lui, n’était pas revenu.",
  ],
  40: [
    "La roue du moulin était couverte d’algues. Lou appuya dessus de tout son poids : elle grinça, puis se mit à tourner lentement.",
    "Aussitôt, l’eau se mit à gronder sous le plancher. Quelque chose venait de s’ouvrir dans les profondeurs du moulin.",
  ],
  41: [
    "L’eau montait par les fentes du plancher, froide et noire. Lou recula jusqu’à l’échelle. Il détestait l’eau, mais il se força à regarder : dans le courant flottaient des lanternes allumées.",
    "En haut de l’échelle, une trappe donnait sur le grenier.",
  ],
  42: [
    "Au grenier, une barque pendait au plafond, retenue par deux cordes. Sur sa coque, quelqu’un avait écrit : « Pour Lou ». C’était l’écriture de son père.",
    "Lou coupa les cordes avec son couteau. La barque tomba dans l’eau qui remplissait déjà le grenier.",
  ],
  43: [
    "La barque fila sous le moulin, dans un tunnel où l’eau coulait vers le haut. Lou s’agrippa aux bords en fermant les yeux.",
    "Quand il les rouvrit, la barque s’était posée au pied d’un escalier immense qui montait dans les nuages.",
  ],
  50: [
    "Chaque fois que Lou posait le pied sur une marche, celle d’en dessous s’effaçait. Impossible de redescendre !",
    "Plus haut, l’escalier se séparait : un côté montait tout droit, l’autre tournait autour de la tour. Sur chaque marche du second, un chiffre était gravé.",
  ],
  51: [
    "Essoufflé, Lou arriva devant une porte sans poignée ni serrure. Au centre, un petit trou avait la forme d’une clé.",
    "À côté, un second passage était couvert de symboles étranges : des lanternes, des vagues et des chiffres.",
  ],
  52: [
    "Lou compta à voix haute : quatre-vingt-dix-huit, quatre-vingt-dix-neuf… À la centième marche, il s’arrêta. Elle était fendue et, sous la fente, on voyait le vide.",
    "Il pouvait continuer prudemment, ou tenter de sauter par-dessus.",
  ],
  53: [
    "La porte s’ouvrit sur un palier où flottait un grand miroir de brume. Lou y vit son père, assis au sommet de la tour, une lanterne éteinte sur les genoux.",
    "Le miroir frissonna, comme de l’eau qu’on touche.",
  ],
  54: [
    "Lou sauta. Son pied rata la marche suivante et il tomba dans le vide, longtemps, très longtemps, au milieu de la brume.",
    "Il se réveilla sur le quai de son village, trempé, la carte froissée dans la main. Le dernier bac était parti.",
  ],
  55: [
    "Lou s’approcha des symboles. Il y avait trois lanternes, puis huit vagues et, en dessous, une phrase : « Le passeur compte les lanternes, puis les vagues. »",
    "Lou réfléchit. Trois lanternes, huit vagues… Il sourit : il savait où aller.",
  ],
  60: [
    "Au sommet de la tour, le vent soufflait fort. Un homme était assis, dos tourné, une lanterne éteinte sur les genoux. Lentement, il se retourna.",
    "C’était son père. Il avait les yeux fatigués, mais il sourit. « Je n’arrive pas à la rallumer, dit-il. Il faut quelqu’un qui connaisse le chant des lanternes. »",
  ],
  61: [
    "Lou prit la lanterne et se mit à chanter, doucement, le chant que lui avait appris sa mère. Une petite flamme apparut, puis grandit.",
    "En bas, sur le lac, toutes les lanternes se rallumèrent en même temps. La brume se leva comme un rideau. Au loin, Lou aperçut le quai de son village, et le dernier bac qui l’attendait.",
  ],
  62: [
    "La trente-huitième porte menait à une salle ronde où la brume tournait lentement, comme dans un bol. Au milieu, un escalier en colimaçon montait vers une lumière.",
    "Lou avait trouvé le passage secret des passeurs. Il grimpa les marches quatre à quatre.",
  ],
};
