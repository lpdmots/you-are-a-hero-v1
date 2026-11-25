/**
 * « Le hérisson qui voulait voir la mer », l'histoire classique d'exemple du site (F14, « Pages publiques pour
 * les deux sortes de récit », part 2 ; entretien du 25 novembre 2026). Un récit qui se lit du début à la fin,
 * sans choix ni numéros, pour des lecteurs de CP-CE1 : une partie sans titre imprimé, six chapitres de trois
 * scènes, au présent, à la troisième personne. Écrit par Claude, sans les aides de l'application ; les images
 * sont faites par le porteur d'après des prompts (style « Illustration 2D lumineuse », de jour).
 *
 *   npm run livres:exemple -- herisson --brouillon --refaire
 *
 * Le fil : Pépin trouve un coquillage, y entend la mer et part la voir. Chaque animal rencontré n'a jamais vu
 * la mer et l'imagine d'après son monde (un trou, une mare, un bol), puis l'aide à passer un obstacle. Le
 * refrain « Pépin est petit. Mais Pépin est têtu. » revient à chaque obstacle, et cède une fois, sur la dune.
 */
import type { Conception } from "./conception";

/**
 * La typographie du livre imprimé : une espace insécable devant « ? ! : ; » et après le tiret d'un dialogue, pour
 * qu'aucun signe ne se retrouve seul au début ou à la fin d'une ligne.
 */
const typographie = (textes: Record<number, string[]>): Record<number, string[]> =>
  Object.fromEntries(Object.entries(textes).map(([ref, t]) => [ref, t.map((p) => p.replace(/ ([?!:;])/g, "\u00a0$1").replace(/^— /, "—\u00a0"))]));

export const livre: Conception = {
  TITRE: "Le hérisson qui voulait voir la mer",
  RECIT: "classique",
  DEPART: 1,
  AGE: "6-8",
  VISUEL_DU_PROJET: "mer",
  STYLE: { style: "lumineuse", autre: "" },
  CONSIGNE_ECRITURE: "Au présent, à la troisième personne. Pour des enfants de 6 à 7 ans : des mots simples, mais des phrases vivantes et variées, sans répéter « il » ; des bruits et de courtes répliques. Le refrain « Pépin est petit. Mais Pépin est têtu. » revient devant chaque obstacle.",

  PREPARATION: {
    univers: "Une forêt, puis tout ce qu’il y a entre elle et la mer : un champ fermé par un grillage, une rivière, un village et sa grande route, une dune. Les animaux parlent ; aucun d’eux n’a vu la mer, sauf la mouette.",
    personnages: "Pépin, un petit hérisson têtu, qui porte un coquillage sur son dos.\nLa vieille chouette, qui sait tout.\nLa taupe, qui ne voit rien du tout.\nLa grenouille de la rivière.\nLe gros chat roux du marché.\nLa mouette.",
    enjeu: "Dans un coquillage, Pépin a entendu la mer chanter. On lui dit qu’elle est trop loin pour ses petites pattes. Il part quand même.",
    regles: "",
    formuleRenvoi: "va",
    constructions: ["neutre"],
  },

  PERSONNAGES: [
    {
      nom: "Pépin", autresNoms: ["le hérisson", "le petit hérisson"], heros: true, portrait: false,
      description: "Un jeune hérisson, petit et rond, au museau pointu, aux yeux noirs et brillants, aux piquants brun doré, au ventre et au visage crème. Il porte sur le dos un coquillage blanc et rose, enroulé en spirale, attaché par un brin d’herbe. Curieux et têtu.",
    },
    { nom: "la chouette", autresNoms: ["la vieille chouette"], heros: false, portrait: false, description: "Une vieille chouette rousse, qui dort le jour dans un chêne. Elle sait tout, et bâille beaucoup." },
    { nom: "la taupe", autresNoms: [], heros: false, portrait: false, description: "Une taupe au pelage noir, au museau rose, aux grosses pattes de terrassière. Elle n’y voit rien et croit tout savoir." },
    { nom: "la grenouille", autresNoms: [], heros: false, portrait: false, description: "Une grenouille verte, assise sur une pierre plate au bord de la rivière. Pour elle, la mer est une mare immense." },
    { nom: "le chat", autresNoms: ["le gros chat roux"], heros: false, portrait: false, description: "Un gros chat roux qui vit sous la table du poissonnier, au marché du village. Il appelle Pépin « petite boule »." },
    { nom: "la mouette", autresNoms: [], heros: false, portrait: false, description: "Une grande mouette blanche aux ailes grises, moqueuse et gentille. Elle seule connaît la mer." },
  ],
  OBJETS: [["le coquillage", "Blanc et rose, enroulé en spirale, il sent le sel. Contre l’oreille, on y entend la mer : chhh… chhh…"]],
  FORMULES: [],
  FEUILLE: { on: false, des: 0, sections: [] },
  ACTIONS: {},

  PARTIES: [
    {
      titre: "Le voyage de Pépin", visuel: "mer",
      chapitres: [
        {
          cle: "coquillage", titre: "Le coquillage", couleur: 2, visuel: "foret",
          resume: "Pépin trouve un coquillage dans la forêt. La chouette lui apprend que c’est la mer qui chante dedans. Il décide d’aller la voir.",
          scenes: [
            { ref: 1, titre: "Forêt — sous les feuilles", consigne: "Pépin cherche son déjeuner et trouve une drôle de chose, qui chante quand on l’écoute." },
            { ref: 2, titre: "Forêt — la vieille chouette", consigne: "La chouette explique ce qu’est un coquillage, et ce qu’est la mer. Elle dit que c’est trop loin pour Pépin." },
            { ref: 3, titre: "Forêt — le départ", consigne: "Pépin attache le coquillage sur son dos et s’en va, du côté où le soleil se couche." },
          ],
        },
        {
          cle: "grillage", titre: "Le grillage", couleur: 1, visuel: "jardin",
          resume: "Un grillage barre le champ. La taupe, qui croit que la mer est un grand trou plein d’eau, creuse un tunnel pour Pépin.",
          scenes: [
            { ref: 4, titre: "Champ — le grillage", consigne: "Un grillage arrête Pépin. La terre se met à trembler." },
            { ref: 5, titre: "Champ — la taupe", consigne: "La taupe dit ce qu’est la mer, d’après elle : un grand trou plein d’eau." },
            { ref: 6, titre: "Champ — le tunnel", consigne: "La taupe creuse sous le grillage, et Pépin passe." },
          ],
        },
        {
          cle: "bateau", titre: "Le bateau d’écorce", couleur: 5, visuel: "riviere",
          resume: "La rivière est trop large. La grenouille, pour qui la mer est une mare sans roseaux, apprend à Pépin que la rivière y va aussi. Il la descend sur une écorce.",
          scenes: [
            { ref: 7, titre: "Rivière — l’eau qui court", consigne: "Pépin arrive devant la rivière, froide et rapide. Une grenouille l’appelle." },
            { ref: 8, titre: "Rivière — la grenouille", consigne: "La grenouille dit ce qu’est la mer, d’après elle : une mare sans roseaux. Et que la rivière y va." },
            { ref: 9, titre: "Rivière — au fil de l’eau", consigne: "Pépin monte sur une écorce. La rivière l’emporte, et il s’endort." },
          ],
        },
        {
          cle: "route", titre: "La grande route", couleur: 3, visuel: "village",
          resume: "Pépin se réveille dans un village. Le chat du marché, pour qui la mer est un bol plein de poissons, lui fait traverser la grande route.",
          scenes: [
            { ref: 10, titre: "Village — le réveil", consigne: "Le bateau cogne contre un quai. Pépin découvre un village, et une odeur qu’il connaît." },
            { ref: 11, titre: "Marché — le chat", consigne: "Le chat du poissonnier dit ce qu’est la mer, d’après lui : un bol géant plein de poissons." },
            { ref: 12, titre: "Route — le petit bonhomme vert", consigne: "La route fait peur. Le chat apprend à Pépin à attendre le bonhomme vert." },
          ],
        },
        {
          cle: "dune", titre: "La montagne de sable", couleur: 6, visuel: "desert",
          resume: "Le sable glisse, Pépin n’en peut plus et veut renoncer. Une mouette lui dit de poser son coquillage et d’écouter.",
          scenes: [
            { ref: 13, titre: "Dune — le sable qui glisse", consigne: "Pépin essaie de monter la dune, et retombe en bas à chaque fois." },
            { ref: 14, titre: "Dune — trop loin", consigne: "Pépin s’assoit et renonce. Une mouette se pose." },
            { ref: 15, titre: "Dune — la mouette", consigne: "La mouette lui fait écouter le vrai chant de la mer, tout près, et lui dit comment monter." },
          ],
        },
        {
          cle: "mer", titre: "La mer", couleur: 4, visuel: "mer",
          resume: "En zigzag, Pépin arrive en haut. La mer est plus grande que tout ce qu’on lui a dit. Il ramasse un coquillage pour chacun de ses amis.",
          scenes: [
            { ref: 16, titre: "Dune — en zigzag", consigne: "Pépin monte en zigzag, jusqu’en haut." },
            { ref: 17, titre: "Plage — la mer", consigne: "Pépin voit la mer. Elle ne ressemble à rien de ce qu’on lui a dit." },
            { ref: 18, titre: "Plage — les coquillages", consigne: "Pépin ramasse un coquillage pour chacun de ses amis, et regarde la mer." },
          ],
        },
      ],
    },
  ],

  TEXTES_DE_BASE: typographie({
    1: [
      "Ce matin, Pépin le hérisson fouille les feuilles de la forêt. Il cherche une limace bien dodue pour son petit déjeuner.",
      "Mais ce qu’il trouve n’est pas une limace. C’est une drôle de chose, blanche et rose, enroulée comme un escargot. Pépin la renifle : elle sent le sel. Il la retourne, il la secoue, puis il la colle contre son oreille.",
      "Et là… chhh… chhh… Quelque chose chante, tout au fond.",
    ],
    2: [
      "Vite, Pépin court réveiller la vieille chouette, qui sait tout.",
      "— C’est un coquillage, dit-elle en bâillant. Une mouette a dû le laisser tomber. Et ce que tu entends, c’est la mer qui chante.",
      "— La mer ? C’est quoi, la mer ?",
      "— De l’eau, petit. Tellement d’eau qu’on n’en voit pas le bout.",
      "Pépin ouvre des yeux tout ronds.",
      "— Je veux la voir !",
      "— Toi ? Mais non ! La mer est bien trop loin pour tes petites pattes.",
    ],
    3: [
      "Trop loin ? Pépin regarde ses pattes. C’est vrai qu’elles sont petites. Puis il écoute encore le coquillage. Chhh… chhh…",
      "Pépin est petit. Mais Pépin est têtu.",
      "Avec un brin d’herbe, il attache le coquillage sur son dos, bien serré entre ses piquants.",
      "— C’est par où ?",
      "La chouette soupire et tend une aile.",
      "— Par là, du côté où le soleil se couche. Tout droit, toujours tout droit.",
      "Et le petit hérisson s’en va, le nez en avant.",
    ],
    4: [
      "Au bout de la forêt, il y a un champ. Et au bout du champ, il y a un grillage. Il est haut, il est long, et ses trous sont trop petits, même pour un hérisson.",
      "Pépin pousse avec son nez. Le grillage ne bouge pas.",
      "Pépin est petit. Mais Pépin est têtu : il pousse de toutes ses forces. Toujours rien.",
      "Soudain, la terre tremble sous ses pattes. Une petite montagne brune sort de l’herbe… et de la montagne sort un museau tout rose.",
    ],
    5: [
      "— Qui fait tout ce bruit sur mon toit ? grogne la taupe.",
      "— C’est moi, Pépin. Je vais voir la mer, mais le grillage ne veut pas.",
      "— La mer ? Je connais ! dit la taupe, qui n’est jamais sortie de son champ. C’est un trou. Un grand trou plein d’eau, si grand que personne n’a fini de le creuser.",
      "— Tu l’as vue ?",
      "— Moi, je ne vois rien du tout, répond-elle fièrement. Mais je le sais.",
    ],
    6: [
      "La taupe touche le grillage du bout de ses grosses pattes.",
      "— Par-dessus, c’est trop haut. Mais par-dessous…",
      "Et elle creuse ! La terre vole à droite, la terre vole à gauche. En un rien de temps, un tunnel passe sous le grillage.",
      "Pépin s’y glisse. Il fait noir, ça sent la racine, et le coquillage frotte contre le plafond. Puis la lumière revient.",
      "— Merci, Madame la taupe !",
      "— Si tu trouves le grand trou, crie-t-elle, demande qui le creuse !",
    ],
    7: [
      "Après le grillage, le pré descend jusqu’à une rivière. L’eau court, saute par-dessus les cailloux et rit toute seule.",
      "Pépin y trempe une patte. Brrr ! C’est froid, c’est large, et ça va bien trop vite pour lui.",
      "— Tu veux passer ? demande une voix dans les roseaux.",
      "Une grenouille verte le regarde, assise sur une pierre plate.",
      "— Je vais voir la mer, dit Pépin.",
      "— La mer ? Coâ ! Je sais très bien ce que c’est.",
    ],
    8: [
      "— La mer, explique la grenouille, c’est une mare. Une mare immense, mais sans roseaux, sans nénuphars et sans mouches. Quelle tristesse !",
      "— Et c’est encore loin ?",
      "— Demande à la rivière : c’est là qu’elle va, elle aussi. Elle court vers la mer depuis toujours, et jamais elle ne s’est trompée de chemin.",
      "Pépin regarde l’eau qui file. La rivière connaît le chemin ? Alors pas besoin de traverser : il va partir avec elle !",
    ],
    9: [
      "La grenouille pousse vers lui un gros morceau d’écorce.",
      "— Monte ! Ça flotte mieux qu’un hérisson.",
      "L’écorce penche, l’écorce tourne. La rivière est grande. Pépin est petit. Mais Pépin est têtu : il s’accroche, et son bateau s’en va au fil de l’eau.",
      "Les roseaux passent. Un poisson saute. Le ciel devient rose, puis bleu nuit. Sur le dos de Pépin, le coquillage chante tout bas. Chhh… chhh…",
      "Toute la nuit, Pépin dort, et la rivière marche pour lui.",
    ],
    10: [
      "Poc ! Pépin se réveille en sursaut. Son bateau vient de cogner contre un mur de pierre, et il reste coincé là.",
      "Il fait grand jour. Au-dessus de lui, il y a un pont, des maisons, une cloche qui sonne. La rivière traverse un village !",
      "Le hérisson grimpe sur le quai. Ici, tout sent bon : le pain chaud, le linge qui sèche… Et puis il y a une autre odeur, forte et salée. L’odeur de son coquillage ! Est-ce que la mer est ici ?",
    ],
    11: [
      "L’odeur vient du marché. Sous la table du poissonnier, un gros chat roux se lèche les moustaches.",
      "— Je vais voir la mer, dit Pépin. C’est ici ?",
      "— Ici ? Non, petite boule. Mais la mer, je connais ! C’est un bol, comme le mien. Un bol géant, plein de poissons jusqu’au bord. Chaque matin, le camion va en chercher.",
      "— Et il va où, le camion ?",
      "— De l’autre côté de la grande route. Mais attention : là-bas, ce sont les voitures qui commandent. Viens, je t’accompagne.",
    ],
    12: [
      "La grande route est grise, large, et elle gronde. Vroum ! Une voiture. VROUM ! Un camion. Pépin a si peur qu’il se roule en boule, tous ses piquants dehors.",
      "— Contre les roues, ça ne sert à rien, dit le chat. Regarde plutôt le petit bonhomme, là-haut. Quand il est rouge, on attend.",
      "Pépin est petit. Mais Pépin est têtu : il sort le bout de son nez.",
      "Le bonhomme devient vert. Les voitures s’arrêtent, comme par magie.",
      "— Maintenant !",
      "Et ils traversent sur les bandes blanches, le chat devant, Pépin derrière.",
    ],
    13: [
      "De l’autre côté, le chat montre un chemin du bout de la queue, puis il retourne à ses poissons.",
      "Pépin marche longtemps. Il n’y a plus de maisons. Il n’y a plus d’herbe. Quand le soleil commence à descendre, il y a seulement du sable : une montagne de sable, haute comme trois arbres. C’est une dune.",
      "Pépin grimpe. Un pas, deux pas, trois pas… et le sable glisse sous ses pattes. Le voilà revenu en bas. Il recommence. Un pas, deux pas… zip ! Encore en bas.",
    ],
    14: [
      "Pépin s’assoit. Il a mal aux pattes, il a du sable plein les piquants, et le coquillage pèse lourd sur son dos. Il pense à son lit de feuilles, là-bas, dans la forêt.",
      "— La chouette avait raison, soupire-t-il. La mer est trop loin pour moi.",
      "Pépin est petit. Et ce soir, Pépin n’est plus têtu du tout.",
      "— Eh bien, pourquoi tu fais cette tête ? crie quelqu’un dans le ciel.",
      "Un grand oiseau blanc se pose à côté de lui. C’est une mouette.",
    ],
    15: [
      "— Tu cherches la mer avec un coquillage sur le dos ? rit la mouette. Pose-le donc, et écoute.",
      "Pépin détache le coquillage. Il tend l’oreille. Chhh… chhh… Mais cette fois, le chant ne sort pas du coquillage. Il vient de derrière la dune. Il est fort, il est grand, il remplit tout le ciel.",
      "— Elle est là ? demande Pépin tout bas. Elle est comment ?",
      "— Ah non ! Ça, je ne te le dis pas. Va voir. Et ne monte pas tout droit : monte en zigzag.",
    ],
    16: [
      "Pépin rattache le coquillage sur son dos et repart. À droite, à gauche. À droite, à gauche. Le sable glisse un peu, mais cette fois, le hérisson tient bon.",
      "Pépin est petit. Mais Pépin est têtu !",
      "Encore un zig. Encore un zag. Le vent lui décoiffe les piquants, un vent qui chatouille le nez et qui sent le sel.",
      "Et tout à coup, il n’y a plus de sable devant lui. Il n’y a plus rien à monter. Pépin est en haut de la dune.",
    ],
    17: [
      "Alors il la voit.",
      "Elle est bleue, elle est verte, elle est dorée là où le soleil se couche. Elle bouge tout le temps. Elle va jusqu’au bout du ciel, et peut-être plus loin encore.",
      "Ce n’est pas un trou. Ce n’est pas une mare. Ce n’est pas un bol. C’est bien plus grand que tout ce qu’on lui a dit.",
      "Pépin descend la dune en courant, jusqu’à la plage. Une vague vient lui lécher les pattes. Elle est froide. Elle est salée. Et elle chante.",
    ],
    18: [
      "Sur le sable mouillé, il y a des coquillages. Des dizaines !",
      "Pépin en choisit un pour la taupe, un pour la grenouille, un pour le chat. Le plus beau sera pour la chouette. Il les coince entre ses piquants, un par un. Demain, il reprendra la route, et chacun pourra écouter la mer chanter.",
      "Mais ce soir, le hérisson s’assoit devant les vagues, et la mouette vient se poser à côté de lui.",
      "Pépin est petit. Mais Pépin est têtu. Et ses petites pattes l’ont porté jusqu’à la mer.",
    ],
  }),

  A_ECRIRE: [],
  IMAGES: [],
};
