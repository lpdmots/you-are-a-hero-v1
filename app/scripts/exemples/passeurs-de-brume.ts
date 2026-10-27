/**
 * Livre d'exemple de cycle 3, à choix : « Les passeurs de brume », repris de zéro (plan, point 3
 * de « Suite recommandée après l'ouverture », « Repris de zéro », décidé les 26 et 27 octobre
 * 2026). La conception d'où se crée le projet de travail en local
 * (`npm run livres:exemple -- passeurs --brouillon`) ; les textes, les images et la mise en page
 * sont gardés dans l'instantané `passeurs-de-brume/livre.json`, que la commande recharge.
 *
 * La Préparation (univers, enjeu, règles, personnages, formules, feuille d'aventure) est celle que
 * le porteur a écrite dans le site local le 27 octobre 2026, recopiée telle quelle.
 *
 * Une seule nuit de pleine lune. Lou rejoint son père, le Gardien de la Lanterne, en haut de la
 * Tour des Brumes. Une seule valeur, la réserve d'huile (3 au départ) : on ne compte que ce qu'on
 * gaspille. Une erreur mène à une courte scène qui rejoint la suite ; une perte qui peut trouver
 * la réserve vide se vérifie dans son passage (`verifier`). Trois fins : la bonne (S028, numéro
 * fixe 31), sans voix au sommet (S029), la lanterne vide avant la tour (S030). Le plan se vérifie
 * par `npx tsx scripts/exemples/verifier-reserve.ts passeurs`.
 */
import type { Conception } from "./conception";

/** Après « Raye une réserve d'huile. » : la fin si la réserve était déjà vide, sinon la suite. */
const verifier = (fin: number, suite: number, libelle: string) => ({
  choix: [["La lanterne s’éteint", fin], [libelle, suite]] as [string, number][],
  phrase: ["Si tu n’avais plus de réserve à rayer, rends-toi au ", 0, ". Sinon, rends-toi au ", 1, "."],
});
/** Ce que dit la consigne d'un passage où l'on arrive de plusieurs façons */
const PLUSIEURS = "On arrive ici de plusieurs façons : commence sans supposer le passage d’avant.";
const RAYE = "Raye une réserve d’huile.";

export const livre: Conception = {
  TITRE: "Les passeurs de brume",
  DEPART: 1,
  AGE: "8-10",
  VISUEL_DU_PROJET: "riviere",
  STYLE: {
    style: "autre",
    autre: "Illustration d’album jeunesse peinte, douce et lumineuse, formes simples, sans contour noir. Nuit de pleine lune : bleus profonds, argent de la lune, brume laiteuse, lumière chaude et dorée des lanternes ; jamais de noir bouché, les visages restent lisibles.",
  },
  CONSIGNE_ECRITURE: "Au passé simple et à l’imparfait, à la troisième personne. Pour des lecteurs de 8 à 10 ans : des mots simples, des phrases vivantes et variées, des sensations (froid, bruits, lumière). Ne donne jamais la bonne réponse d’un choix avant que le lecteur choisisse.",

  PREPARATION: {
    univers: "Le pays des Mille Lacs est fait d’eau, d’îles et de forêts. Chaque soir, une brume épaisse monte des lacs : on n’y voit plus à trois pas, et les chemins semblent changer de place.\nPour traverser, on appelle les passeurs. Leurs barques portent une lanterne dont la flamme chasse la brume tout autour d’elles. Les lanternes brûlent de l’huile de lune : tant qu’elle brûle, la brume recule et les feux follets n’osent pas approcher. Cette huile ne se recueille qu’une fois par mois, au moment où la Première Lanterne est ranimée, à la pleine lune. Juste avant, tout le pays vit sur ses dernières réserves, et chaque goutte compte.\nToutes ces lanternes tirent leur flamme d’une seule : la Première Lanterne, en haut de la Tour des Brumes, sur une île au milieu du Grand Lac. Chaque nuit de pleine lune, le Gardien de la Lanterne traverse le lac et monte la ranimer en chantant le chant des lanternes. Sans ce chant, sa flamme faiblit, et toutes les lanternes du pays avec elle. Le titre de Gardien passe des parents aux enfants, et seule la famille du Gardien connaît le chant.\nLa brume a une règle : celui qui s’y trouve sans lumière perd peu à peu sa voix, jusqu’au lever du soleil.\nDans la brume vivent des choses étranges, mais pas méchantes : des feux follets farceurs qui égarent les voyageurs et adorent jouer des tours ; ils ont peur des lanternes et n’approchent jamais d’une flamme, des pierres qui chantent quand l’eau les touche, des cloches qui sonnent toutes seules.\nLe lecteur découvre ces règles peu à peu, au fil de l’histoire : au départ, il sait seulement que l’huile de lune fait reculer la brume.",
    personnages: "",
    enjeu: "C’est une nuit de pleine lune. Comme chaque mois, Marius est parti en barque ranimer la Première Lanterne. Mais ce soir, la brume est plus épaisse que jamais.\nCe qui lui arrive (le lecteur ne l’apprend qu’à la fin) : au pied de la Tour des Brumes, il attache sa barque, en décroche la lanterne pour éclairer l’escalier et commence à monter. Dans l’escalier, un souffle de brume éteint sa lanterne. Il monte dans le noir, et la brume lui prend sa voix : arrivé en haut, il ne peut plus chanter. En bas, la barque est restée sans lumière : les feux follets, qui ne craignent plus rien, ont osé s’en approcher, ont dénoué sa corde pour jouer, et le courant l’a emportée. Seul sur l’île, sans voix et sans barque, il envoie Plume chercher de l’aide.\nVers minuit, les lanternes du village faiblissent, et Plume revient seule frapper à la fenêtre de Lou, inquiète. Lou ne sait rien de plus, mais il comprend que son père n’a pas pu chanter et qu’il a besoin d’aide, et il sait où le trouver : en haut de la tour. En chemin, il découvrira la barque de son père qui dérive, vide.\nLou doit traverser le lac et la brume, monter en haut de la tour et chanter avant le lever du jour. S’il réussit, la Première Lanterne se rallume, toutes les lanternes du pays avec elle, Marius retrouve sa voix et raconte enfin ce qui lui est arrivé. S’il échoue, toutes les lanternes du pays s’éteindront, puisqu’elles tirent leur flamme de la Première. Plus aucun passeur ne pourra traverser : les îles et les villages seront coupés les uns des autres, les barques de pêche resteront au port. La brume ne se lèvera plus au matin ; elle gagnera les rives, puis les rues et les maisons, et prendra peu à peu la voix des habitants. Marius ne retrouverait jamais la sienne, et le pays des Mille Lacs deviendrait le pays du silence.\nToute l’histoire se passe pendant cette seule nuit.",
    regles: "Avant de commencer, prends ta feuille d’aventure. La lanterne de Lou a juste assez d’huile de lune pour le voyage, plus 3 doses de réserve : écris-les. Lou ne doit pas traîner en route !\nQuand un passage te le demande, raye ou ajoute une réserve. S’il te faut en rayer une et qu’il ne t’en reste plus, le passage te dit où aller.",
    formuleRenvoi: "rends",
    constructions: ["neutre"],
  },

  PERSONNAGES: [
    { nom: "Lou", autresNoms: ["le garçon"], heros: true, portrait: true, description: "Lou a dix ans. C’est le fils de Marius, le Gardien de la Lanterne, et il sera Gardien à son tour un jour. Il connaît par cœur le chant des lanternes : son père le lui apprend depuis qu’il est tout petit.\nLou est curieux et têtu, et il n’abandonne pas facilement. Mais il a peur de l’eau profonde, car il nage mal.\nIl ne se sépare jamais de sa petite lanterne, un cadeau de son père, ni de son sac en toile." },
    { nom: "Marius", autresNoms: ["le père de Lou", "son père", "papa"], heros: false, portrait: true, description: "Le Gardien de la Lanterne, comme son père avant lui. Calme et courageux, il traverse le Grand Lac à chaque pleine lune pour ranimer la Première Lanterne." },
    { nom: "Plume", autresNoms: ["la chouette", "la chouette de Marius"], heros: false, portrait: true, description: "La chouette de Marius, aux plumes argentées. Elle ne parle pas, mais elle connaît tous les chemins du lac et sait toujours retrouver Marius." },
  ],

  OBJETS: [],
  FORMULES: [
    ["Raye une réserve d’huile.", "crayon"],
    ["Ajoute une réserve d’huile.", "crayon"],
  ],
  FEUILLE: {
    on: true,
    des: 0,
    sections: [{ id: "lanterne", type: "compteurs", titre: "La lanterne de Lou", compteurs: [{ id: "reserve", nom: "Réserve d’huile", depart: 3 }] }],
  },
  ACTIONS: {
    4: [RAYE], 6: [RAYE], 9: ["Ajoute une réserve d’huile."], 10: [RAYE],
    13: [RAYE], 14: [RAYE], 16: [RAYE], 18: [RAYE], 22: [RAYE], 25: [RAYE],
  },

  PARTIES: [
    {
      titre: "La rive", visuel: "riviere",
      chapitres: [
        {
          cle: "village", titre: "Le village", couleur: 5, visuel: "village",
          resume: "À minuit, les lanternes du village faiblissent et Plume revient seule. Lou comprend que son père n’a pas pu chanter, et part à pied rejoindre le ponton des Gardiens.",
          scenes: [
            {
              ref: 1, titre: "Village — la nuit de pleine lune",
              consigne: "Ouverture. Nuit de pleine lune, vers minuit, au village du bord du Grand Lac. Lou, dix ans, ne dort pas. Au crépuscule, son père Marius, le Gardien de la Lanterne, est parti en barque ranimer la Première Lanterne, en haut de la Tour des Brumes, comme chaque mois ; en partant, il a redit ses deux phrases de chaque départ : « Ne reste jamais dans la brume sans lumière : elle te prendrait ta voix. » et « L’eau qui frissonne cache des dents. » Par la fenêtre, Lou regarde les lanternes du village : d’habitude leur flamme est dorée, calme, bien droite ; ce soir elle baisse, toutes ensemble. La brume est montée comme chaque soir, d’abord des mares et des étangs, là où l’eau dort, puis partout. On frappe au carreau : Plume, la chouette de son père, revient seule, les plumes ébouriffées, inquiète. Lou comprend : si les lanternes baissent et que Plume revient seule, son père n’a pas pu chanter ; la Première Lanterne donne leur flamme à toutes les lanternes du pays, celles des maisons comme celles des barques des passeurs, et il faut la ranimer avant le lever du soleil ; personne d’autre au village ne connaît le chant, seulement le Gardien et Lou, à qui il l’apprend depuis toujours. Il sait où trouver son père : en haut de la tour. Glisse les deux phrases et la couleur des flammes dans le récit, sans insister.",
              choix: [["Partir aider son père", 2]],
            },
            {
              ref: 2, titre: "Village — le départ",
              consigne: "Lou se prépare vite : sa petite lanterne, cadeau de son père, remplie d’huile de lune, et trois petites fioles de réserve dans son sac en toile ; il sait que l’huile est rare ce soir, la veille de la pleine lune tout le pays vit sur ses réserves. Il part à pied : il a peur de l’eau profonde et nage mal ; il longera la rive jusqu’au ponton des Gardiens, d’où la traversée vers la tour est la plus courte. À la porte, un courant d’air fait trembler la flamme : il la protège de sa main, elle se redresse. Sur les planches du quai, il glisse sur une planche sombre et luisante, mouillée ; les claires, sèches, ne glissent pas — un détail de quelques mots, sans en tirer de leçon. Plume vole au-dessus de lui. Termine à la sortie du village, la lanterne allumée, dans la brume qui recule autour de sa flamme.",
              choix: [["Prendre le chemin du lac", 3]],
            },
          ],
        },
        {
          cle: "chemin", titre: "Le chemin du lac", couleur: 4, visuel: "etang",
          resume: "Sur la rive, Lou choisit entre la tourbière et les saules, puis croise un vieil homme qui revient du pont et lui demande un peu d’huile.",
          scenes: [
            {
              ref: 3, titre: "Chemin — la fourche",
              consigne: "Hors du village, le chemin se sépare. À gauche, il coupe tout droit par la tourbière : de l’eau immobile entre des touffes d’herbe, le plus court. À droite, le chemin des saules longe la rive sur de la terre ferme, sous les branches : plus long. Plume ne l’aide pas ici : elle n’a pas besoin de chemin, elle tourne au-dessus de lui. Lou pense au temps qui presse. Ne dis pas lequel est le bon, ne rappelle pas d’où naît la brume.",
              choix: [["Couper par la tourbière", 4], ["Suivre le chemin des saules", 5]],
            },
            {
              ref: 4, titre: "Chemin — la tourbière",
              consigne: "Courte scène d’erreur. Dans la tourbière, l’eau dort, et la brume naît justement sur l’eau qui dort : elle monte, épaisse, de partout, jusqu’à étouffer la flamme. Le conseil de son père lui revient trop tard. Pour la faire reculer, Lou doit monter la flamme de sa lanterne, ce qui brûle de l’huile. Il ressort de l’autre côté, sur le chemin de la rive. Termine sur le chemin, en route vers le pont.",
              choix: [["Reprendre le chemin de la rive", 5]],
            },
            {
              ref: 5, titre: "Chemin — le vieil homme",
              consigne: `${PLUSIEURS} Lou marche sur le chemin de la rive. Un vieil homme vient vers lui, une lanterne presque vide à la main, la flamme minuscule. Il revient du pont, plus loin : la crue a emporté un tronc d’arbre qui l’a brisé ; on ne peut plus passer qu’en sautant sur ce qu’il en reste. Il demande à Lou un peu d’huile de lune pour rentrer chez lui. Perdre sa voix, dit-il, il s’en moque : il vit seul, il n’a plus personne à qui parler. Mais sans lumière, les feux follets viendront lui jouer des tours ; ils ont peur des lanternes. Lou pense à son père, à l’huile qu’il lui faut. Ne laisse pas entendre ce que le vieil homme dirait d’autre.`,
              choix: [["Lui donner une réserve d’huile", 6], ["Refuser poliment", 7]],
            },
            {
              ref: 6, titre: "Chemin — une fiole pour le vieil homme",
              consigne: "Lou donne une de ses fioles. Le vieil homme remplit sa lanterne, et sa reconnaissance le rend bavard : il le met en garde contre les feux follets, qui imitent la lueur d’une lanterne pour égarer les voyageurs ; on les reconnaît à leur lumière bleutée, qui tremble et sautille. Et il a vu tout à l’heure, sur cette rive, un peu plus loin que le pont, une barque échouée dans les roseaux, sans personne et sans lanterne. Lou a peur que ce soit celle de son père. Termine quand ils se quittent, Lou en route vers le pont.",
              choix: [["Aller jusqu’au pont", 8]],
            },
            {
              ref: 7, titre: "Chemin — « Alors dépêche-toi »",
              consigne: "Lou refuse poliment, gêné : il explique qu’il en a besoin pour son père. Le vieil homme hausse les épaules, un peu vexé : « Alors dépêche-toi. » Il s’éloigne sans rien ajouter. Lou repart vers le pont, le cœur serré de l’avoir laissé. Court.",
              choix: [["Aller jusqu’au pont", 8]],
            },
          ],
        },
        {
          cle: "pont", titre: "Le pont effondré", couleur: 3, visuel: "riviere",
          resume: "Le pont est brisé par la crue. Lou saute sur ce qu’il en reste, ou longe la rive jusqu’à une barque échouée ; puis il faut prendre l’eau.",
          scenes: [
            {
              ref: 8, titre: "Pont — l’énigme du pont effondré",
              consigne: `${PLUSIEURS} L’énigme du pont, illustrée par une image pleine page faite par le porteur. Lou arrive au pont effondré sur la rivière en crue qui se jette dans le lac : un tronc l’a brisé, il n’en reste que des planches éparses posées entre les piliers. Trois passages : le long de la rambarde ; sur la grande poutre du milieu ; de pilier en pilier. Certaines planches sont claires, d’autres sombres et luisantes (ne dis pas lesquelles sont sèches ou mouillées). Dis au lecteur de bien regarder l’image avant de choisir, sans dire quelles planches tiennent ni lequel est le bon (le bon : de pilier en pilier). Lou a peur de l’eau noire qui gronde dessous.`,
              choix: [["Passer le long de la rambarde", 10], ["Marcher sur la grande poutre", 10], ["Sauter de pilier en pilier", 31], ["Longer la rive jusqu’aux roseaux", 9]],
              phrase: ["Si le vieil homme t’a dit ce qu’il a vu près du pont, tu peux aussi longer la rive : rends-toi au ", 3, "."],
              condition: { choix: 3, apres: 6 },
            },
            {
              ref: 9, titre: "Pont — la barque dans les roseaux",
              consigne: "Lou longe la rive, de ce côté de la rivière, jusqu’aux roseaux. Une barque échouée, sans personne : celle de son père, il la reconnaît à la chouette sculptée à la proue. Peur : son père est-il tombé à l’eau ? Mais la barque n’est pas chavirée, et le crochet de la lanterne est vide : son père a emporté sa lanterne. La corde pend, son nœud défait, pas coupée ; un nœud de Gardien ne se défait pas tout seul. Sous le banc, Lou trouve une fiole d’huile de lune. Il surmonte sa peur de l’eau, pousse la barque et prend les rames, Plume perchée à la proue. Ne donne aucune explication sur le nœud.",
              choix: [["Ramer vers la Tour des Brumes", 12]],
            },
            {
              ref: 31, titre: "Pont — de pilier en pilier",
              consigne: "La bonne réponse de l’énigme, racontée. Lou saute de pilier en pilier, en ne posant le pied que sur les planches claires ; sous lui, l’eau noire gronde ; un saut plus long que les autres, le cœur qui bat ; il arrive de l’autre côté, sec, fier, Plume qui tourne au-dessus de lui. Court. Termine de l’autre côté de la rivière, en route.",
              choix: [["Continuer sur la rive", 11]],
            },
            {
              ref: 10, titre: "Pont — la glissade",
              consigne: "Courte scène d’erreur, où l’on arrive par la rambarde ou par la poutre : dis seulement que Lou s’avance sur les planches. Une planche sombre et luisante glisse sous son pied ; il tombe dans l’eau peu profonde près de la berge, s’agrippe, ressort trempé de l’autre côté. Sa lanterne a pris l’eau : la mèche crachote. Il doit la sécher et la rallumer avec de l’huile neuve. Termine de l’autre côté de la rivière, grelottant, en route.",
              choix: [["Continuer sur la rive", 11]],
            },
            {
              ref: 11, titre: "Rive — le chemin inondé",
              consigne: `${PLUSIEURS} Lou est de l’autre côté de la rivière. Plus loin, la crue a noyé le chemin de la rive, comme souvent à cette saison. Au petit ponton des Gardiens, une barque de secours attend, amarrée pour ces nuits-là. Lou a peur de l’eau profonde ; Plume se pose à la proue et le rassure. Il monte, prend les rames. En longeant la rive noyée, par une trouée de la brume, il aperçoit à quelques coups de rame, de l’autre côté de l’embouchure, prise dans les roseaux, une barque sans lumière, vide : celle de son père, reconnaissable à la chouette sculptée à la proue. Le courant de la crue l’en éloigne ; son cœur se serre. Il rame vers la tour.`,
              choix: [["Ramer vers la Tour des Brumes", 12]],
            },
          ],
        },
      ],
    },
    {
      titre: "Le Grand Lac", visuel: "bateau",
      chapitres: [
        {
          cle: "crue", titre: "La crue", couleur: 2, visuel: "bateau",
          resume: "Sur le Grand Lac gonflé par la crue, Lou cherche son chemin entre les courants et les eaux qui font peur.",
          scenes: [
            {
              ref: 12, titre: "Lac — le courant",
              consigne: `${PLUSIEURS} Lou rame sur le Grand Lac, dans la brume que sa lanterne repousse ; dis seulement « la barque », sans dire laquelle. La crue a creusé des courants ; devant lui, l’eau se partage en trois bras entre les îlots. Plume s’envole et file au-dessus du bras le plus étroit, entre les roseaux. À droite, de vieilles balises des passeurs, des perches peintes, montrent le chemin, mais on ne lit leurs signes qu’en montant la flamme. À gauche, le bras le plus large, calme, facile à ramer. Lou est fatigué. Ne dis pas lequel est le bon ; Plume, qui connaît tous les chemins du lac et retrouve toujours Marius, ne fait que voler, sans insister.`,
              choix: [["Suivre le bras où vole Plume", 15], ["Monter la flamme pour lire les balises", 13], ["Prendre le bras le plus large", 14]],
            },
            {
              ref: 13, titre: "Lac — les balises",
              consigne: "Courte scène d’erreur. Lou monte la flamme ; la lanterne boit l’huile. Il déchiffre les signes peints sur les perches : ils montrent… le bras où volait Plume. Il se sent bête : Plume le savait. Il baisse la flamme et s’engage dans le bras étroit. Termine sur l’eau, la barque filant entre les roseaux.",
              ...verifier(30, 15, "Rejoindre Plume"),
            },
            {
              ref: 14, titre: "Lac — le grand bras",
              consigne: "Courte scène d’erreur. Le grand bras est facile à ramer, mais il fait un immense détour autour des îlots ; le temps passe, la lanterne brûle, la lune glisse dans le ciel. Lou finit par retrouver Plume qui l’attend, perchée sur une souche. Termine en route, tous deux de nouveau ensemble.",
              ...verifier(30, 15, "Repartir avec Plume"),
            },
            {
              ref: 15, titre: "Lac — l’eau qui frissonne",
              consigne: `${PLUSIEURS} Lou rame vers la tour ; on la devine maintenant, une ombre haute dans la brume. Entre lui et elle, deux passages : tout droit, une eau qui frissonne, pleine de petites rides qui scintillent sous la lune, le plus court ; ou un détour par une eau sombre, lisse et profonde, qui coule lentement (ce n’est pas de l’eau qui dort), qui lui fait peur, à lui qui nage mal. Ne rappelle pas la phrase de Marius sur l’eau qui frissonne : le lecteur doit s’en souvenir.`,
              choix: [["Couper tout droit par l’eau qui frissonne", 16], ["Contourner par l’eau sombre et profonde", 17]],
            },
            {
              ref: 16, titre: "Lac — les dents du lac",
              consigne: "Courte scène d’erreur. L’eau frissonne parce que des rochers affleurent juste dessous. La barque racle, se coince ; Lou pousse avec une rame, longtemps, pendant que la lanterne brûle. Il comprend la phrase de son père : « L’eau qui frissonne cache des dents. » Il se dégage enfin. Termine en route vers la tour.",
              ...verifier(30, 17, "Repartir vers la tour"),
            },
            {
              ref: 30, titre: "Lac — la dernière goutte (fin)",
              consigne: "Fin : la lanterne vide avant la tour. On y arrive de plusieurs endroits (sur la barque ou sur l’îlot) : ne dis pas où est Lou. La flamme pâlit, crachote et s’éteint ; plus une goutte d’huile. La brume se referme sur lui. Il essaie d’appeler, de chanter : sa voix devient un souffle, puis plus rien. Plume se pose contre lui, toute chaude ; au matin gris, elle le guide jusqu’au village. Il devine que, là-bas, la Première Lanterne s’éteint, et avec elle toutes les lanternes du pays : cette nuit, le pays des Mille Lacs entre dans le silence. Aucun conseil de jeu à la fin (rien qui oriente un choix). Doux pour des enfants, sans peur inutile ; termine en invitant à reprendre l’aventure au début.",
              fin: true,
            },
          ],
        },
        {
          cle: "ilot", titre: "L’îlot aux pierres qui chantent", couleur: 6, visuel: "etang",
          resume: "Sur un îlot où la brume ne vient pas, Lou attend le retour de Plume. Une lumière apparaît dans la brume.",
          scenes: [
            {
              ref: 17, titre: "Îlot — les pierres qui chantent",
              consigne: `${PLUSIEURS} Tout près de la tour, Lou aborde un petit îlot entouré de pierres qui chantent quand l’eau les touche ; la brume n’y entre pas, comme si elle n’aimait pas leur chant. La pleine lune l’éclaire. Plume s’envole vers le haut de la tour pour trouver le passage et Marius ; Lou doit l’attendre ici. Sa lanterne brûle toujours, et il reste toute la tour à monter. Il hésite : la garder allumée, ou l’éteindre en attendant. Ne dis pas ce qu’il vaut mieux faire ; ne rappelle ni la règle de la brume ni la peur qu’ont les feux follets des lanternes.`,
              choix: [["Garder la lanterne allumée", 18], ["Éteindre la lanterne", 19]],
            },
            {
              ref: 18, titre: "Îlot — la flamme qui veille",
              consigne: "Courte scène d’erreur, calme. Lou garde la lanterne allumée et attend ; rien ne se passe, aucune brume ici, la lune suffisait à y voir. Il regarde la flamme boire l’huile pour rien. Plume revient enfin : elle a trouvé le chemin. Termine quand ils repartent vers la tour.",
              ...verifier(30, 23, "Repartir vers la tour"),
            },
            {
              ref: 19, titre: "Îlot — la lumière dans la brume",
              consigne: "Lou éteint sa lanterne pour l’économiser ; la lune suffit sur l’îlot. Il attend, assis sur une pierre qui chante doucement. Soudain, dans la brume, au-delà de l’eau, une lumière apparaît : on dirait une lanterne qu’on porte. Elle bouge de droite et de gauche, s’approche un peu. Lou pense à son père. Ne décris ni sa couleur ni le détail de ses mouvements ; ne dis pas ce que c’est.",
              choix: [["Appeler « Papa ? » et la suivre", 20], ["Rester immobile et l’observer", 21]],
            },
            {
              ref: 20, titre: "Îlot — la lumière qui recule",
              consigne: "Lou appelle « Papa ? » et court vers la lumière, jusqu’au bord de l’îlot, les pieds dans l’eau, au seuil de la brume. La lumière recule à mesure qu’il avance, puis disparaît d’un coup. Il est au bord de la brume, sans lumière ; il sent son souffle froid sur sa gorge, sa voix tremble un peu. Derrière lui, tout près, il entend chanter les pierres de l’îlot. Ne dis pas ce qu’il doit faire.",
              choix: [["Rallumer la lanterne pour chercher encore", 22], ["Revenir au milieu de l’îlot et attendre Plume", 23]],
            },
            {
              ref: 21, titre: "Îlot — la lumière bleutée",
              consigne: "Lou ne bouge pas et regarde. La lumière est bleutée ; elle tremble et sautille par petits bonds, autrement qu’une lanterne qu’on porte ; personne ne la tient. Une lanterne d’huile de lune a une flamme dorée, calme, bien droite : ce n’est pas une lanterne. Un feu follet ! Comme Lou a éteint la sienne, il n’a plus peur et s’approche : il tourne autour de sa barque, tire sur la corde pour jouer. Lou attrape la corde, la renoue solidement. Plume revient : elle a trouvé le chemin. Lou rallume sa lanterne ; le feu follet s’enfuit. Termine quand ils repartent vers la tour.",
              choix: [["Repartir vers la tour", 23]],
            },
            {
              ref: 22, titre: "Îlot — pour rien",
              consigne: "Courte scène d’erreur. Lou rallume sa lanterne, monte la flamme, remonte dans la barque et rame dans la brume pour chercher (il ne s’avance pas à pied dans l’eau). Rien : la lumière ne revient pas. Il comprend qu’on s’est moqué de lui, peut-être un feu follet. Il revient sur l’îlot, au chant des pierres. Plume revient : elle a trouvé le chemin. Termine quand ils repartent vers la tour.",
              ...verifier(30, 23, "Repartir vers la tour"),
            },
          ],
        },
      ],
    },
    {
      titre: "La Tour des Brumes", visuel: "chateau",
      chapitres: [
        {
          cle: "escalier", titre: "L’escalier", couleur: 7, visuel: "chateau",
          resume: "Au pied de la tour, Lou entre dans l’escalier où souffle la brume, et trouve sur une marche la lanterne de son père.",
          scenes: [
            {
              ref: 23, titre: "Tour — le pied de la tour",
              consigne: `${PLUSIEURS} Plume est revenue de la tour : elle a trouvé le passage (le dire en une phrase, sans raconter le retour, qui l’est déjà sur certains chemins). Lanterne allumée à l’avant (ne dis pas s’il l’a rallumée), Lou rame derrière elle jusqu’à l’île de la tour. Il amarre la barque à l’anneau de fer où son père attache toujours la sienne : l’anneau est vide. La porte de la tour est ouverte. Dedans, un escalier en colimaçon monte dans le noir ; des fentes dans le mur laissent entrer des souffles de brume et de vent, qui sifflent. Plume s’envole par dehors vers le sommet. Lou commence à monter, la lanterne levée. Termine dans l’escalier.`,
              choix: [["Monter l’escalier", 24]],
            },
            {
              ref: 24, titre: "Tour — la lanterne brisée",
              consigne: "Plus haut dans l’escalier, sur une marche, Lou trouve la lanterne de son père : le verre brisé, la mèche froide. Panique : son père est-il tombé ? Est-il blessé, là-haut, dans le noir ? Il a envie de courir, de monter les marches quatre à quatre en criant. Le vent siffle par les fentes. Ne dis pas ce qu’il vaut mieux faire ; ne rappelle pas la main devant la flamme.",
              choix: [["Courir jusqu’en haut", 25], ["Monter marche après marche", 26]],
            },
            {
              ref: 25, titre: "Tour — le souffle",
              consigne: "Courte scène d’erreur. Lou court ; dans le tournant, un souffle par une fente fait danser la flamme, il veut l’abriter, trébuche, la lanterne heurte une marche, son huile se répand et la flamme meurt. Noir complet ; la brume glisse sur les marches, froide, vers sa gorge. Il fouille son sac pour rallumer, et se promet de monter ensuite marche après marche, sans courir ; ne dis pas s’il lui reste de l’huile (la suite le dit : la fin S029 si sa réserve est vide, sinon le sommet).",
              ...verifier(29, 26, "Reprendre la montée"),
            },
          ],
        },
        {
          cle: "sommet", titre: "Le sommet", couleur: 0, visuel: "ciel",
          resume: "En haut de la tour, Lou retrouve son père sans voix et chante le chant des lanternes.",
          scenes: [
            {
              ref: 26, titre: "Tour — le sommet",
              consigne: `${PLUSIEURS} Lou arrive au sommet, sa lanterne allumée. La Première Lanterne, immense, n’a plus qu’une petite flamme pâle qui tremble. Assis contre elle, son père, épuisé, Plume sur l’épaule. Marius serre Lou dans ses bras ; il ouvre la bouche, mais aucun son ne sort : la brume lui a pris sa voix. Il montre la lanterne, puis Lou. Lou comprend : c’est à lui de chanter, le chant que son père lui apprend depuis qu’il est tout petit. Le ciel pâlit à peine à l’est : il est encore temps.`,
              choix: [["Chanter le chant des lanternes", 27]],
            },
            {
              ref: 27, titre: "Tour — le chant des lanternes",
              consigne: "Lou chante, d’abord d’une petite voix qui tremble, puis plus fort. La flamme de la Première Lanterne grandit, devient dorée ; la brume recule autour de la tour. Au milieu du chant, une deuxième voix le rejoint : son père a retrouvé la sienne, et ils chantent ensemble, à deux voix. Au loin, les lanternes du pays se rallument une à une, sur les rives, les îles, au village. Termine sur le chant qui s’achève, la lanterne rallumée.",
              choix: [["Écouter ce que Marius raconte", 28]],
            },
            {
              ref: 28, titre: "Tour — ce que Marius raconte (fin)",
              consigne: "Bonne fin. À l’aube, Marius raconte enfin : dans l’escalier, un souffle de brume a éteint sa lanterne ; il est monté dans le noir, et la brume lui a pris sa voix ; arrivé en haut, il ne pouvait plus chanter. De là-haut, il a vu en bas, dans la brume, des lueurs bleutées danser autour de sa barque restée sans lumière : les feux follets, qui ne craignaient plus rien, ont dénoué sa corde pour jouer, et le courant l’a emportée. Seul, sans voix et sans barque, il a envoyé Plume chercher de l’aide. Puis il regarde Lou, fier : ce soir, c’est lui qui a ranimé la Première Lanterne ; un jour, il sera Gardien. Ils redescendent ensemble et rentrent dans la barque de Lou, sous le soleil levant, Plume à la proue. Chaleureux, sans morale appuyée.",
              fin: true, numero: 31,
            },
            {
              ref: 29, titre: "Tour — le silence de la tour (fin)",
              consigne: "Fin : plus d’huile pour rallumer, dans l’escalier ; le sac est vide. Lou monte dans le noir, la main contre le mur ; la brume lui prend la voix peu à peu. Au sommet, il trouve son père, épuisé, sans voix lui aussi, près de la Première Lanterne qui n’a plus qu’une petite flamme pâle. Ils se serrent dans les bras, soulagés d’être ensemble. Lou essaie de chanter : pas un son. La flamme s’éteint, et toutes les lanternes du pays avec elle. Ils redescendent main dans la main, Plume devant eux, rassurés d’être ensemble, mais le pays entre dans le silence. Doux, sans peur inutile ; termine en invitant à reprendre l’aventure au début.",
              fin: true,
            },
          ],
        },
      ],
    },
  ],

  TEXTES_DE_BASE: {},
  A_ECRIRE: [],
  IMAGES: [
    { ref: 1, cadrage: "moitie", badges: ["Lou", "Plume"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Dans sa chambre, Lou, en pull bleu marine, à la fenêtre fermée ; dehors, derrière le carreau, Plume frappe du bec ; au loin, les lanternes du village faiblissent dans la brume." },
    { ref: 9, cadrage: "moitie", badges: ["Lou", "Plume"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Avant que Lou monte à bord : dans les roseaux, une barque de bois VIDE échouée, chouette sculptée à la proue, crochet de lanterne vide, corde dénouée dans l’eau. Lou, debout sur la rive, hors de la barque, lève sa petite lanterne vers elle. Plume vole au-dessus." },
    { ref: 11, cadrage: "moitie", badges: ["Lou", "Plume"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Au petit ponton des Gardiens, Lou monte dans une barque de bois simple, inquiet devant l’eau profonde, sa petite lanterne allumée ; Plume posée à la proue. La rive est noyée par la crue." },
    { ref: 17, cadrage: "moitie", badges: ["Lou", "Plume"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Un îlot herbeux bordé de pierres rondes, clair de lune, sans brume ; autour, la brume se dresse comme un mur. Barque attachée à un rocher. Lou assis, sa petite lanterne allumée à côté de lui ; Plume s’envole vers une haute tour devinée dans la brume." },
    { ref: 21, cadrage: "moitie", badges: ["Lou"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Sur l’îlot au clair de lune, un seul feu follet, petite lumière bleutée qui sautille, tire sur la corde de la barque pour jouer. Lou, accroupi, sa petite lanterne éteinte près de lui, l’observe sans bouger." },
    { ref: 24, cadrage: "moitie", badges: ["Lou"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Escalier de pierre en colimaçon dans la tour, un rayon de lune et des filets de brume par une fente. Lou, seul, découvre sur une marche une grande lanterne éteinte au verre brisé ; sa petite lanterne dorée éclaire la scène. Personne d’autre." },
    { ref: 27, cadrage: "page", badges: ["Lou", "Marius", "Plume"], idee: "Nuit de pleine lune : bleus profonds, argent de lune, brume laiteuse, lanternes dorées, sans noir bouché. Au sommet de la tour, en plein air : la Première Lanterne, immense, plus haute que Marius, flamme dorée comme un petit soleil. Devant elle, Lou et son père Marius, sans lanterne, chantent ensemble ; Lou bien plus petit. Plume sur le parapet. Au loin, les lanternes du lac se rallument." },
    { ref: 28, cadrage: "moitie", badges: ["Lou", "Marius", "Plume"], idee: "À l’aube, plus de nuit : ciel rose et doré, soleil levant, eau qui scintille, dernières brumes qui se lèvent. Lou et son père Marius, sans lanterne, rentrent dans une barque de bois simple sur le Grand Lac, Marius aux rames ; Plume à la proue. Au loin derrière eux, la tour sur son île." },
  ],
};
