/**
 * Chapitre d'essai pour la vue « Chemins » (F03.1) : « Le marais des feux follets », trente-deux
 * scènes qui se relient comme dans un vrai livre — chemins qui se rejoignent, retours en
 * arrière, deux fins, deux sorties vers d'autres chapitres, un lien caché — et de quoi voir
 * chaque cas « à regarder » : un choix sans destination, un choix vers une scène supprimée,
 * deux scènes où rien ne mène, deux scènes sans suite ni fin.
 *
 * Chargé dans la base locale par « npm run chemins:essai » (scripts/chapitre-chemins.ts), à la
 * suite de l'histoire d'essai ; semé aussi par le parcours qui mesure la vue (V15). Ce fichier
 * ne dépend de rien d'autre : le contenu, et la façon de le poser dans un projet.
 */
import { randomUUID } from "node:crypto";

/** Où mène un choix : une scène du chapitre, rien encore, une scène d'un autre chapitre, ou une scène supprimée. */
export type Vers = string | null | { ailleurs: "moulin" | "sanctuaire" } | { supprimee: true };
export type SceneDuMarais = {
  /** Nom court, pour écrire les choix ; il n'est pas dans la base */
  cle: string;
  titre: string | null;
  /** Paragraphes du récit ; sans eux, la scène porte « Texte vide » */
  texte?: string[];
  consigne?: string;
  fin?: true;
  /** Prénom de l'élève qui s'en occupe */
  pec?: string;
  choix?: [libelle: string, vers: Vers][];
  /** Liaison cachée par énigme (F05.1) */
  cachee?: { vers: string; libelle: string };
};

export const MARAIS = {
  titre: "Le marais des feux follets",
  couleur: 2,
  visuel: "etang",
  resume: "Lou s’enlise dans un marais où dansent des feux follets. Plusieurs chemins mènent à l’île du saule, puis au chenal ou à l’écluse.",
  eleves: [["Farah", "propositions"], ["Hugo", "organisation"], ["Jade", "propositions"]] as [prenom: string, profil: "propositions" | "organisation"][],
  /** Le choix ajouté à une scène d'un autre chapitre, pour qu'un chemin arrive dans le marais */
  entree: { libelle: "Suivre la loutre vers le marais", vers: "barque" },
  /** La scène partie dans la corbeille, où mène encore un choix */
  supprimee: { titre: "Cabane — la boussole qui tourne" },
};

export const SCENES: SceneDuMarais[] = [
  {
    cle: "barque", titre: "Marais — la barque s’enlise", pec: "Farah",
    consigne: "La barque de Lou s’arrête dans la vase. Décris le marais, la nuit, et les trois façons d’en sortir.",
    texte: [
      "La barque ralentit, racla le fond, puis s’arrêta net. Autour de Lou, il n’y avait plus de lac : seulement des roseaux, de la vase et une odeur d’herbe mouillée.",
      "Au loin, de petites flammes bleues dansaient au ras de l’eau. À gauche, une vieille digue de planches s’enfonçait dans la brume. Quelque part, un oiseau appelait.",
    ],
    choix: [["Suivre les feux follets", "roseaux"], ["Longer la vieille digue", "digue"], ["Appeler à l’aide", "ponton"]],
  },
  {
    cle: "roseaux", titre: "Roseaux — les feux follets dansent", pec: "Jade",
    consigne: "Lou s’approche des flammes bleues. Décris leur danse : ont-elles l’air gentilles ou moqueuses ?",
    texte: [
      "Les flammes n’étaient pas plus grosses qu’une noisette. Elles tournaient autour de Lou en riant tout bas, s’approchaient, puis filaient dès qu’il tendait la main.",
      "L’une d’elles s’attardait, plus lente que les autres.",
    ],
    choix: [["Attraper un feu follet", "bocal"], ["Les suivre de loin, sans faire de bruit", "tourbiere"]],
  },
  {
    cle: "digue", titre: "Digue — les planches pourries", pec: "Hugo",
    consigne: "Lou avance sur la digue. Une planche manque : montre ce qu’il voit dessous.",
    texte: [
      "La digue craquait à chaque pas. Les planches étaient vertes de mousse et, au milieu, il en manquait trois. Par le trou, Lou voyait la vase luire comme de l’encre.",
    ],
    choix: [["Avancer à pas de loup", "cabane"], ["Sauter par-dessus le trou", "vase"]],
  },
  {
    cle: "ponton", titre: "Ponton — la voix du héron", pec: "Farah",
    consigne: "Quelqu’un répond à l’appel de Lou : un héron, perché sur un ponton. Écris ce qu’il dit.",
    texte: [
      "« Qui crie si fort dans mon marais ? » La voix venait d’un ponton tordu. Un grand héron gris y était perché sur une patte, un monocle de rosée sur l’œil.",
      "Lou hésita. Un héron qui parle, cela ne lui disait rien de bon.",
    ],
    choix: [["Répondre au héron", "marche"], ["Se cacher dans les joncs", "tourbiere"]],
  },
  {
    cle: "bocal", titre: "Roseaux — le feu follet dans le bocal", pec: "Jade",
    texte: [
      "Lou referma ses mains d’un coup. La flamme chatouillait ses paumes comme une plume. Il la glissa dans le bocal de sa lanterne, où elle se mit à bouder.",
      "« Si tu me montres le chemin, je te rends ta liberté », promit Lou.",
    ],
    choix: [["Lui demander le chemin de l’île", "ile"]],
  },
  {
    cle: "tourbiere", titre: "Tourbière — le sol qui tremble",
    consigne: "Le sol bouge sous les pieds de Lou comme un matelas. Fais sentir sa peur.",
    texte: [
      "Sous les pieds de Lou, le sol n’était plus de la terre. Il remuait, mou et tiède, comme le ventre d’une grosse bête endormie. À chaque pas, des bulles éclataient.",
    ],
    choix: [["Courir droit devant", "trou"], ["Rester immobile et écouter", "ile"]],
  },
  {
    cle: "cabane", titre: "Digue — la cabane sur pilotis", pec: "Hugo",
    consigne: "Au bout de la digue, une cabane. Décris-la de l’extérieur : y a-t-il quelqu’un ?",
    texte: [
      "Au bout de la digue, une cabane se tenait sur quatre pattes de bois, comme un échassier. De la fumée sortait du toit, et une lueur jaune tremblait derrière la vitre.",
    ],
    choix: [["Frapper à la porte", "passeuse"], ["Regarder par la fenêtre", "ombre"]],
  },
  {
    cle: "vase", titre: "Vase — Lou s’enfonce",
    texte: [
      "Lou prit son élan et sauta. Trop court ! Ses bottes s’enfoncèrent dans la vase jusqu’aux genoux, puis jusqu’aux cuisses. Plus il gigotait, plus il descendait.",
      "Une racine de saule pendait à portée de main. Dans le ciel, une ombre argentée tournait.",
    ],
    choix: [["Attraper la racine du saule", "cabane"], ["Appeler la chouette", "corde"]],
  },
  {
    cle: "marche", titre: "Ponton — le marché du héron", pec: "Farah",
    consigne: "Le héron propose un échange. Que veut-il, et que donne-t-il ?",
    texte: [
      "« Je prête ma barque à qui me donne une plume plus belle que les miennes », dit le héron en lissant son plumage. Lou pensa à la plume argentée, au fond de son sac.",
    ],
    choix: [["Échanger la plume argentée contre une barque", "heron"], ["Refuser et repartir vers la digue", "digue"]],
  },
  {
    cle: "ile", titre: "Île — le saule aux lanternes", pec: "Jade",
    consigne: "Au milieu du marais, une île et un saule immense. Décris ce qui pend à ses branches.",
    texte: [
      "Au milieu du marais, une île ronde portait un saule si vieux que ses branches touchaient l’eau. Des dizaines de lanternes éteintes y pendaient, comme des fruits oubliés.",
      "Une seule brillait encore, tout en haut, d’une lumière verte.",
    ],
    choix: [["Grimper dans le saule", "lanterne"], ["Faire le tour de l’île", "cercle"]],
  },
  {
    cle: "trou", titre: "Tourbière — le trou d’eau noire", fin: true,
    consigne: "Lou court et tombe dans un trou d’eau. Écris cette fin : où se réveille-t-il ?",
    texte: [
      "Lou courut. Au troisième pas, le sol céda et l’eau noire se referma sur lui. Il se réveilla sur le quai de son village, trempé, une bulle de vase sur le bout du nez.",
    ],
  },
  {
    cle: "passeuse", titre: "Cabane — la vieille passeuse", pec: "Hugo",
    consigne: "Une vieille femme ouvre la porte. Décris-la, et ce qu’elle sait de Marius.",
    texte: [
      "La porte s’ouvrit avant que Lou ait frappé. Une très vieille femme le regardait, un manteau gris sur les épaules. « Tu as les yeux de Marius », dit-elle.",
      "Sur la table, une lanterne attendait, toute neuve, sans mèche.",
    ],
    choix: [["Lui montrer la carte du passeur", "carte"], ["Lui demander où est Marius", "recit"]],
  },
  {
    cle: "ombre", titre: "Cabane — l’ombre derrière la vitre",
    texte: [
      "Lou colla son nez à la vitre. À l’intérieur, une ombre immense allait et venait, courbée, avec de longs doigts crochus. Puis l’ombre posa sa théière, et rapetissa.",
    ],
    choix: [["Entrer quand même", "passeuse"], ["Faire demi-tour", "cabane"]],
  },
  {
    cle: "corde", titre: "Vase — la chouette et la corde",
    choix: [["Se laisser tirer jusqu’à l’île", "cercle"]],
  },
  {
    cle: "heron", titre: "Ponton — la barque du héron", pec: "Farah",
    texte: [
      "Le héron accrocha la plume derrière son oreille et poussa du bec une barque plate, à peine plus large qu’une planche. « Elle va où tu regardes », prévint-il.",
    ],
    choix: [["Ramer vers l’île", "ile"], ["Ramer vers la brume épaisse", "brume"]],
  },
  {
    cle: "lanterne", titre: "Saule — la lanterne verte", pec: "Jade",
    consigne: "Lou grimpe jusqu’à la lanterne verte. Que voit-il de là-haut ?",
    texte: [
      "De la plus haute branche, Lou voyait tout le marais : la digue, le ponton, et très loin la roue d’un moulin. La lanterne verte se balançait devant lui, tiède comme un œuf.",
    ],
    choix: [["La décrocher", "allumee"], ["La laisser et redescendre", "cercle"]],
  },
  {
    cle: "cercle", titre: "Île — le cercle de pierres",
    consigne: "Derrière le saule, des pierres dressées forment un cercle. Elles ont quelque chose à dire.",
    texte: [
      "Derrière le saule, neuf pierres dressées formaient un cercle. Au centre, la mousse dessinait un creux, juste de la taille d’une clochette.",
      "Les pierres bourdonnaient tout bas, comme des gens qui parlent derrière une porte.",
    ],
    choix: [["Poser la clochette fêlée au centre", "passage"], ["Compter les pierres", "enigme"], ["Écouter ce que disent les pierres", null]],
  },
  {
    cle: "carte", titre: "Cabane — la carte se redessine", pec: "Hugo",
    texte: [
      "La vieille passeuse souffla sur la carte. Le trait bleu s’effaça, puis se redessina tout seul : il quittait la cabane, suivait un chenal et filait vers un moulin.",
    ],
    choix: [["Suivre le nouveau trait bleu", "chenal"]],
  },
  {
    cle: "recit", titre: "Cabane — le récit de la passeuse", pec: "Hugo",
    consigne: "La passeuse raconte le passage de Marius. Lou peut-il la croire ?",
    texte: [
      "« Ton père est passé il y a trois nuits. Il cherchait la première lanterne. Je lui ai dit : prends le chenal, pas la brume. » Puis elle bâilla, et s’endormit sur sa chaise.",
      "Dans un coin, un coffre était resté entrouvert.",
    ],
    choix: [["La croire et partir vers le chenal", "chenal"], ["Fouiller la cabane pendant qu’elle dort", "coffre"]],
  },
  {
    cle: "brume", titre: "Brume épaisse — tourner en rond",
    texte: [
      "La brume était si épaisse que Lou ne voyait plus le bout de sa barque. Il rama longtemps. Quand un ponton sortit du brouillard, il le reconnut : c’était celui du héron.",
    ],
    choix: [["Revenir vers le ponton", "ponton"], ["Avancer encore", "perdu"]],
  },
  { cle: "allumee", titre: "Saule — la lanterne s’allume seule", pec: "Jade" },
  {
    cle: "passage", titre: "Cercle de pierres — le passage s’ouvre",
    choix: [["Descendre l’escalier d’eau", "escalier"]],
  },
  {
    cle: "enigme", titre: "Cercle de pierres — l’énigme des pierres",
    consigne: "Invente l’énigme des pierres : le lecteur doit trouver seul le numéro du passage secret.",
    texte: [
      "Lou compta : neuf pierres. Sur chacune, on avait gravé des feux follets, trois par pierre, et sur la plus grande une phrase : « Compte nos flammes, et descends. »",
    ],
    choix: [["Renoncer et revenir au cercle", "cercle"]],
    cachee: { vers: "salle", libelle: "Résoudre l’énigme des pierres" },
  },
  {
    cle: "coffre", titre: "Cabane — le coffre de la passeuse",
    texte: [
      "Le coffre sentait le sel et la cire. Sous une pile de cartes, Lou trouva une boussole dont l’aiguille tournait sans s’arrêter. La passeuse ronflait toujours.",
    ],
    choix: [["Prendre la boussole", { supprimee: true }], ["Refermer le coffre sans bruit", "recit"]],
  },
  {
    cle: "chenal", titre: "Chenal — les nénuphars géants",
    consigne: "Le chenal est couvert de nénuphars larges comme des tables. Décris-les.",
    texte: [
      "Le chenal était couvert de nénuphars larges comme des tables. Certains portaient encore des traces de pas. Au loin, une lanterne avançait lentement sur l’eau.",
    ],
    choix: [["Sauter de feuille en feuille", "escalier"], ["Attendre la barque du passeur", "passeur"]],
  },
  { cle: "perdu", titre: "Brume épaisse — perdu pour de bon", fin: true },
  {
    cle: "escalier", titre: "Escalier d’eau — sous le marais",
    choix: [["Suivre le courant", "ecluse"]],
  },
  {
    cle: "salle", titre: "Sous le cercle — la salle des feux follets",
    choix: [["Remonter par le puits", "ecluse"]],
  },
  {
    cle: "passeur", titre: "Chenal — la barque du passeur",
    choix: [["Monter à bord", { ailleurs: "moulin" }]],
  },
  {
    cle: "ecluse", titre: "Écluse — la sortie du marais",
    consigne: "Lou arrive à une écluse. De l’autre côté, la forêt reprend : décris ce qu’il aperçoit.",
    choix: [["Passer l’écluse", { ailleurs: "sanctuaire" }]],
  },
  {
    cle: "crapaud", titre: "Marais — le crapaud qui parle",
    texte: [
      "« Psst ! Par ici ! » Sur une souche, un crapaud gros comme un melon faisait de grands signes. « Je connais un raccourci. Enfin… je crois. »",
    ],
    choix: [["Lui répondre", "tourbiere"]],
  },
  { cle: "nouvelle", titre: null },
];

/** Ce que la vue doit donner à regarder, pour un adulte, quand un chemin arrive d'un autre chapitre. */
export const ATTENDU = { scenes: SCENES.length, choixSansDestination: 1, choixVersSupprimee: 1, scenesOuRienNeMene: 2, scenesSansSuite: 2, fins: 2, liens: 49 };

// ——— Poser le chapitre dans un projet ———

/** Une requête à la base, et ses lignes : celle de « pg », ou celle des parcours. */
export type Requete = (texte: string, valeurs?: unknown[]) => Promise<Record<string, unknown>[]>;

export type Pose = { chapitreId: string; scenes: Record<string, string>; supprimeeId: string; entreeBlocId: string | null };

const bloc = (type: string, reste: Record<string, unknown>) => ({ type, id: randomUUID(), ...reste });

/** Le texte d'une scène du marais, en blocs : son récit, ses choix, sa liaison cachée. */
export function blocsDe(scene: SceneDuMarais, cible: (vers: Vers) => string | null, rang = 0): Record<string, unknown>[] {
  const constructions = ["neutre", "pour", "si"];
  return [
    ...(scene.texte ?? []).map((texte) => bloc("p", { children: [{ text: texte }] })),
    ...(scene.choix ?? []).map(([libelle, vers], i) =>
      bloc("choix", { auto: true, libelle, construction: constructions[(rang + i) % constructions.length], cible: cible(vers), children: [{ text: "" }] }),
    ),
    ...(scene.cachee ? [bloc("liaison", { cible: cible(scene.cachee.vers), libelle: scene.cachee.libelle, children: [{ text: "" }] })] : []),
  ];
}

/**
 * Pose le chapitre dans une partie : ses scènes, leurs textes et leurs choix, la scène
 * supprimée où mène encore un choix, et le choix d'un autre chapitre qui y conduit.
 * Les références suivent celles du projet ; l'ordre du livre, s'il est établi, les range à la suite.
 */
export async function poserLeMarais(
  q: Requete,
  o: {
    projetId: string; partieId: string; enseignantId: string;
    /** Scènes d'autres chapitres où mènent les deux sorties */
    ailleurs: { moulin: string; sanctuaire: string };
    /** Scène d'un autre chapitre qui reçoit le choix d'entrée ; sans elle, rien ne mène au marais */
    entreeDepuis?: string | null;
    /** Identité des élèves de la classe, par prénom ; sans eux, le chapitre n'a pas d'élève */
    eleves?: Map<string, string>;
  },
): Promise<Pose> {
  const [projet] = (await q("select reference_suivante, ordre_etabli_le is not null as etabli from public.projets where id = $1", [o.projetId])) as { reference_suivante: number; etabli: boolean }[];
  const [{ rang }] = (await q("select coalesce(max(rang), -1) + 1 as rang from public.chapitres where partie_id = $1", [o.partieId])) as { rang: number }[];
  const [{ suite }] = (await q("select coalesce(max(rang_livre), -1) + 1 as suite from public.scenes where projet_id = $1", [o.projetId])) as { suite: number }[];

  const chapitreId = randomUUID();
  await q(
    "insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur, resume, visuel_choisi) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [chapitreId, o.partieId, o.projetId, o.enseignantId, MARAIS.titre, rang, MARAIS.couleur, MARAIS.resume, MARAIS.visuel],
  );
  for (const [prenom, profil] of o.eleves ? MARAIS.eleves : []) {
    const eleve = o.eleves?.get(prenom);
    if (eleve) await q("insert into public.attributions (chapitre_id, eleve_id, projet_id, enseignant_id, profil) values ($1, $2, $3, $4, $5)", [chapitreId, eleve, o.projetId, o.enseignantId, profil]);
  }

  const scenes: Record<string, string> = Object.fromEntries(SCENES.map((s) => [s.cle, randomUUID()]));
  const supprimeeId = randomUUID();
  const lignes = [
    ...SCENES.map((s, i) => ({
      id: scenes[s.cle], reference: projet.reference_suivante + i, titre: s.titre, consigne: s.consigne ?? "", rang: i, fin: s.fin === true,
      pec: (s.pec && o.eleves?.get(s.pec)) || null, rang_livre: projet.etabli ? suite + i : null, supprime: false,
    })),
    { id: supprimeeId, reference: projet.reference_suivante + SCENES.length, titre: MARAIS.supprimee.titre, consigne: "", rang: SCENES.length, fin: false, pec: null, rang_livre: projet.etabli ? suite + SCENES.length : null, supprime: true },
  ];
  await q(
    `insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, titre, consigne, rang, fin, prise_par_eleve, rang_livre, supprime_le)
     select x.id, $1, $2, $3, x.reference, x.titre, x.consigne, x.rang, x.fin, x.pec, x.rang_livre, case when x.supprime then now() end
     from jsonb_to_recordset($4::jsonb) as x(id uuid, reference integer, titre text, consigne text, rang integer, fin boolean, pec uuid, rang_livre integer, supprime boolean)`,
    [chapitreId, o.projetId, o.enseignantId, JSON.stringify(lignes)],
  );
  await q("update public.projets set reference_suivante = $2 where id = $1", [o.projetId, projet.reference_suivante + lignes.length]);

  // Les textes, une fois toutes les scènes en place : les liens du récit s'en déduisent
  const cible = (vers: Vers): string | null =>
    vers === null ? null : typeof vers === "string" ? scenes[vers] : "ailleurs" in vers ? o.ailleurs[vers.ailleurs] : supprimeeId;
  const textes = SCENES.map((s, i) => ({ id: scenes[s.cle], texte: blocsDe(s, cible, i), heures: (SCENES.length - i) * 5 })).filter((t) => t.texte.length);
  await q(
    `update public.scenes s set texte = x.texte, version = 1, ecrit_le = now() - make_interval(hours => x.heures)
     from jsonb_to_recordset($1::jsonb) as x(id uuid, texte jsonb, heures integer) where s.id = x.id`,
    [JSON.stringify(textes)],
  );

  // Le chemin qui arrive d'un autre chapitre : un choix de plus à la fin de cette scène
  let entreeBlocId: string | null = null;
  if (o.entreeDepuis) {
    const entree = bloc("choix", { auto: true, libelle: MARAIS.entree.libelle, construction: "neutre", cible: scenes[MARAIS.entree.vers], children: [{ text: "" }] });
    entreeBlocId = entree.id as string;
    await q("update public.scenes set texte = texte || $2::jsonb, version = version + 1 where id = $1", [o.entreeDepuis, JSON.stringify([entree])]);
  }
  return { chapitreId, scenes, supprimeeId, entreeBlocId };
}
