/**
 * Jeu d'essai V17 (étape 8, lot 1) : de quoi juger chaque aide de texte à l'aveugle, d'un
 * modèle à l'autre, avant que le porteur ne choisisse le fournisseur des textes.
 *
 * Les textes d'élèves sont inventés, du CE2 au CM2, avec les fautes qu'on rencontre en classe
 * (homophones, accords, conjugaison, ponctuation absente, « et puis » à la chaîne) ; le porteur
 * les relit. Le contexte vient de « Les passeurs de brume », l'histoire de la maquette, en
 * attendant les consignes, les choix et la préparation d'un ancien projet du porteur, à ajouter
 * ici (source « porteur »). Aucun prénom d'élève n'y figure : il n'en part jamais.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AideTexte } from "@/domaine/aides-ia";
import type { EntreeIdeesChoix } from "@/serveur/ia/aides/idees-choix";
import type { Carnet, Histoire, Plan } from "@/serveur/ia/aides/contexte";
import { CONSIGNES, OBJETS, PARTIES, PREPARATION, RESUMES, TEXTES } from "../passeurs-de-brume";

export type Cas = {
  id: string;
  aide: AideTexte;
  /** Ce que le porteur juge, en une ligne, au-dessus des propositions */
  titre: string;
  /** Ce qu'une bonne proposition fait, ou évite : un repère, pas une note automatique */
  repere?: string;
  source: "inventé" | "porteur";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entree: any;
};

const classe: Histoire = { titre: "Les passeurs de brume", mode: "classe", recit: "choix", age: "10-12" };
const ce2: Histoire = { ...classe, age: "8-10" };
const personnel: Histoire = { ...classe, mode: "personnel" };

const carnet: Carnet = {
  univers: PREPARATION.univers,
  personnages: PREPARATION.personnages,
  enjeu: PREPARATION.enjeu,
  etapes: "Du quai, Lou traverse la forêt engloutie, puis monte la tour au-dessus des nuages où l'attend son père.",
};
const plan: Plan = PARTIES.map((p) => ({ partie: p.titre, chapitres: p.chapitres.map((c) => ({ titre: c.titre, resume: RESUMES[c.cle] || undefined })) }));
const chapitre = (cle: string) => {
  const c = PARTIES.flatMap((p) => p.chapitres).find((x) => x.cle === cle)!;
  return { titre: c.titre, resume: RESUMES[cle] || undefined, scenes: c.scenes };
};
const ref = (n: number) => `S${String(n).padStart(3, "0")}`;
const nomsPropres = ["Lou", "Marius", ...OBJETS.map(([nom]) => nom)];

// ——— Textes d'élèves inventés ———

/** CE2. Le critère F13-AC17 en tête : au degré 1, « dormé » et « grote » se corrigent, « très très » reste. */
const DRAGON = [
  "Le dragon dormé dans la grote. Il était très très grand.",
  "Lou avancé doucement pour ne pas le révéyer. Sous ses pied, les cailloux brillé comme des étoile. Soudin, le dragon ouvri un œil.",
];

/** CE2. Fautes d'espacement et majuscules, corrigées dès le degré 1 (F13.1, révisé le 17 octobre 2026). */
const QUAI = [
  "Lou courut sur le quai.Le bac partait déja ,il cria tres fort .",
  "il prit sa lanterne ,la rangea dans son sac et parti vers le pont .Le passeur l'attendait : « monte vite ! »",
];

/** CM1, pour la scène 2 (« Lou court vers la passerelle »). */
const PASSERELLE = [
  "Lou couru vers la passerelle mais le bac etait deja parti. il cria \"attendez moi\" mais personne ne l'entendit. Les lanterne du quai s'éteignait une par une et sa lui faisait peur.",
  "Il s'assit sur le bord du quai et il regarda l'eau noir. Il pensait a son père qui était partit depuis trois jours. Il se dit que il devait le retrouver quoi qu'il arrive.",
];

/** CE2, pour la scène 15, très court par rapport à la consigne. */
const FOUGERES = [
  "Lou entendi un chant. il alla dans les fougère. le chant était jolie. il avai un peu peur mais il continua. après il vit une lumière.",
];

/** CM2, pour la scène 19 : phrases interminables, répétitions, une croyance à garder (F13-AC05). */
const PONT = [
  "Lou s'avança sur le pont de brume et il y avait de la brume partout et il ne voyait rien du tout et il avait froid et il entendait l'eau qui coulait en dessous.",
  "Il croit que le passeur l'attend de l'autre côté, mais il n'en est pas sûr. Il y avait une lanterne accrochée au pont. Il y avait aussi une corde. Lou prit la lanterne et il la leva pour voir et il vit une silhouette qui faisait un truc avec ses mains.",
];

/** CM2, au « tu » du livre-jeu, correct mais plat : pour le degré 4. */
const CABANE = [
  "Tu pousses la porte de la cabane. À l'intérieur, il fait sombre et ça sent le bois mouillé. Sur la table, il y a une carte et une casquette. Tu reconnais la casquette de ton père, elle est toute abîmée. Tu as envie de pleurer mais tu te retiens.",
  "Tu prends la carte. Elle est vieille et il y a des dessins dessus. Un trait bleu bouge tout seul sur le papier. Tu as peur mais tu es aussi curieux.",
];

/** CM1, pour la scène 17, qui oublie la moitié de la consigne. */
const CHOUETTE = ["Lou vit la chouette. Elle était belle. Il la suivit."];

// ——— Scènes pour les idées de choix ———

const lisiere = chapitre("lisiere");
const scenesDe = (c: ReturnType<typeof chapitre>, sauf: number) =>
  c.scenes.filter((s) => s.ref !== sauf).map((s) => ({ ref: ref(s.ref), titre: s.titre, consigne: CONSIGNES[s.ref] }));
const objets = OBJETS.map(([nom, description]) => `${nom} : ${description}`);

const souche: EntreeIdeesChoix = {
  histoire: classe, carnet, chapitre: { titre: lisiere.titre, resume: lisiere.resume },
  scene: { titre: "Souche creuse — la lanterne de secours", consigne: CONSIGNES[16], paragraphes: TEXTES[16] },
  scenes: scenesDe(lisiere, 16), objets, choixExistants: [], dejaMontrees: [],
};

const moulin = chapitre("moulin");
/** Le héros enfermé sans la clé : « ouvrir avec sa clé » n'est pas une bonne idée (F13.3). */
const grenier: EntreeIdeesChoix = {
  histoire: classe, carnet, chapitre: { titre: moulin.titre, resume: moulin.resume },
  scene: {
    titre: "Grenier — la trappe refermée",
    consigne: "La trappe du grenier se referme derrière Lou. Décris le grenier, et montre qu'il est enfermé.",
    paragraphes: [
      "Derrière Lou, la trappe claqua. Il tira de toutes ses forces sur l'anneau, mais elle ne bougea pas : quelqu'un avait tourné le verrou de l'autre côté.",
      "Le grenier sentait la farine et la poussière. Par une lucarne ronde, tout en haut, on apercevait les ailes du moulin. Lou fouilla ses poches : il avait son couteau et sa lanterne de secours, mais pas la clé d'argent, restée au fond du nid de la chouette.",
    ],
  },
  scenes: scenesDe(moulin, 42), objets, choixExistants: [], dejaMontrees: [],
};

/** Une scène au texte pas encore écrit : la consigne seule. */
const clairiere: EntreeIdeesChoix = {
  ...souche,
  scene: { titre: "Clairière — les deux chemins se rejoignent", consigne: CONSIGNES[18], paragraphes: [] },
  scenes: scenesDe(lisiere, 18), choixExistants: ["Traverser le pont de brume"],
};

// ——— Préparation : un projet qui commence, et l'histoire d'essai ———

const ile: Histoire = { titre: "L'île aux dragons", mode: "classe", recit: "choix", age: "8-10" };
const ileCarnet: Carnet = { univers: "Une île volcanique au milieu de l'océan, où vivent des dragons de toutes tailles. Les habitants du village pêchent et élèvent des chèvres. Le volcan gronde depuis quelques jours." };
const etapePersonnages = {
  histoire: ile, etape: "personnages", question: "Qui est notre héros, et qu'est-ce qui le rend unique ?",
  questions: ["Quel âge a-t-il ? Que sait-il faire ?", "De quoi a-t-il peur ?", "Qui va l'aider, qui va le gêner ?"],
  idees: [
    { texte: "Un jeune dragon qui ne peut pas voler", etat: "retenue" },
    { texte: "Il a une aile abîmée depuis sa naissance", etat: "retenue" },
    { texte: "Il vit chez une vieille pêcheuse qui l'a recueilli", etat: "discuter" },
    { texte: "C'est un dragon d'or très riche", etat: "ecartee" },
  ],
  retenu: "", carnet: ileCarnet,
};
const etapeEnjeu = {
  histoire: classe, etape: "enjeu", question: "Que doit réussir notre héros, et que se passe-t-il s'il échoue ?",
  questions: ["Qu'est-ce qui l'oblige à partir ?", "Qu'est-ce qu'il risque de perdre ?"],
  idees: [
    { texte: "Retrouver son père avant que la dernière lanterne s'éteigne", etat: "retenue" },
    { texte: "Si Lou échoue, il se réveille sur le quai, sans son père", etat: "retenue" },
    { texte: "La brume efface les souvenirs de ceux qui s'y perdent", etat: "discuter" },
  ],
  retenu: "", carnet: { univers: carnet.univers, personnages: carnet.personnages },
};

export const JEU_D_ESSAI: Cas[] = [
  // Correction (F13.1)
  { id: "correction-1", aide: "correction", titre: "Correction, degré 1 (orthographe), CE2", repere: "Mots, terminaisons et accords corrigés (« dormait », « grotte », « réveiller », « pieds », « brillaient », « étoiles », « ouvrit ») ; « très très », la ponctuation et l'ordre des mots restent.", source: "inventé", entree: { histoire: ce2, degre: 1, paragraphes: DRAGON, consigne: null, nomsPropres } },
  { id: "correction-1b", aide: "correction", titre: "Correction, degré 1, espaces et majuscules, CE2", repere: "« quai.Le » → « quai. Le », « déja ,il » → « déjà, il », « fort . » → « fort. », « il prit » → « Il prit », « parti » → « partit », « tres » → « très », « monte » → « Monte » ; aucune virgule ni aucun point ajouté ou retiré.", source: "inventé", entree: { histoire: ce2, degre: 1, paragraphes: QUAI, consigne: null, nomsPropres } },
  { id: "correction-2a", aide: "correction", titre: "Correction, degré 2 (orthographe et grammaire), CM1", repere: "Le degré 1, plus la majuscule, les guillemets du dialogue, « il se dit que il » ; rien d'autre ne change.", source: "inventé", entree: { histoire: classe, degre: 2, paragraphes: PASSERELLE, consigne: CONSIGNES[2], nomsPropres } },
  { id: "correction-2b", aide: "correction", titre: "Correction, degré 2, CE2, texte très court", repere: "Les fautes corrigées, le texte reste aussi court et aussi simple.", source: "inventé", entree: { histoire: ce2, degre: 2, paragraphes: FOUGERES, consigne: CONSIGNES[15], nomsPropres } },
  { id: "correction-3", aide: "correction", titre: "Correction, degré 3 (phrases plus claires), CM2", repere: "Phrases coupées, « il y avait » et « et » allégés, « un truc » précisé ; « Il croit que le passeur l'attend » reste une croyance (F13-AC05) ; rien de nouveau ne se passe.", source: "inventé", entree: { histoire: classe, degre: 3, paragraphes: PONT, consigne: null, nomsPropres } },
  { id: "correction-4", aide: "correction", titre: "Correction, degré 4 (style), CM2, au « tu »", repere: "Plus riche et plus fluide, mêmes événements, toujours au « tu », lisible par un enfant, pas plus d'un tiers plus long.", source: "inventé", entree: { histoire: classe, degre: 4, paragraphes: CABANE, consigne: CONSIGNES[4], nomsPropres } },
  { id: "correction-5", aide: "correction", titre: "Correction, degré 5 (d'après la consigne), CE2", repere: "Le texte de l'élève sert de base ; il reçoit le chant, ce que ressent Lou, deux sens, la lumière, sans événement ni personnage nouveau.", source: "inventé", entree: { histoire: ce2, degre: 5, paragraphes: FOUGERES, consigne: CONSIGNES[15], nomsPropres } },
  { id: "correction-4-x2", aide: "correction", titre: "Correction, degré 4, longueur ×2 (≈ 160 mots), CM2", repere: "Environ deux fois plus long (130 à 180 mots), toujours au « tu », par la description, les sensations et les pensées ; aucun événement nouveau (F13-AC21).", source: "inventé", entree: { histoire: classe, degre: 4, paragraphes: CABANE, consigne: CONSIGNES[4], nomsPropres, cible: 160 } },
  { id: "correction-5-mots", aide: "correction", titre: "Correction, degré 5, « environ 150 mots », CE2", repere: "Environ 150 mots (125 à 175), d'après la consigne, sans événement ni personnage nouveau (F13-AC21).", source: "inventé", entree: { histoire: ce2, degre: 5, paragraphes: FOUGERES, consigne: CONSIGNES[15], nomsPropres, cible: 150 } },

  // Pistes de reprise (F13.1)
  { id: "pistes-1", aide: "pistes", titre: "Pistes de reprise, texte trop court (CE2)", repere: "Deux ou trois pistes concrètes, au « tu », que l'élève comprend seul, tirées de la consigne.", source: "inventé", entree: { histoire: ce2, paragraphes: FOUGERES, consigne: CONSIGNES[15] } },
  { id: "pistes-2", aide: "pistes", titre: "Pistes de reprise, consigne à moitié faite (CM1)", source: "inventé", entree: { histoire: classe, paragraphes: CHOUETTE, consigne: CONSIGNES[17] } },

  // Consigne (F13.2)
  { id: "consigne-1", aide: "consigne", titre: "Consigne : « le passeur apparaît sur le pont »", repere: "Une ou deux phrases au « tu », « Décris : » et deux ou trois points ; aucun personnage que l'indication, la préparation ou le chapitre ne nomment pas (F13-AC18).", source: "inventé", entree: { histoire: classe, carnet, indication: "le passeur apparaît sur le pont", chapitre: { titre: lisiere.titre, resume: lisiere.resume }, voisines: [15, 16, 17, 18].map((n) => ({ titre: lisiere.scenes.find((s) => s.ref === n)!.titre, consigne: CONSIGNES[n] })) } },
  { id: "consigne-2", aide: "consigne", titre: "Consigne : « lou tombe dans la rivière et perd sa lanterne »", source: "inventé", entree: { histoire: classe, carnet, indication: "lou tombe dans la riviere et perd sa lanterne", chapitre: { titre: "Le gué des saules", resume: RESUMES.gue }, voisines: [21, 23].map((n) => ({ titre: `Scène ${n}`, consigne: CONSIGNES[n] })) } },
  { id: "consigne-3", aide: "consigne", titre: "Consigne pour des CE2 : « faire tourner la roue du moulin »", source: "inventé", entree: { histoire: { ...classe, age: "8-10" }, carnet, indication: "il faut faire tourner la roue du moulin, c'est dur", chapitre: { titre: moulin.titre, resume: moulin.resume }, voisines: [] } },
  { id: "consigne-personnel", aide: "consigne", titre: "Note d'intention, mode personnel : « la rencontre avec le passeur »", repere: "Une ou deux lignes pour soi, sans tutoiement ni « Décris : ».", source: "inventé", entree: { histoire: personnel, carnet, indication: "la rencontre avec le passeur sur le pont", chapitre: { titre: lisiere.titre, resume: lisiere.resume }, voisines: [] } },

  // Titre (F05)
  { id: "titre-1", aide: "titre", titre: "Trois titres d'après la consigne (scène 22)", repere: "Courts, dans la forme « Lieu — ce qui arrive », sans dévoiler la fin.", source: "inventé", entree: { histoire: classe, consigne: CONSIGNES[22], debut: null, chapitre: "Le gué des saules", autresTitres: ["Gué — les pierres qui chantent", "Saule — le nid de la chouette", "Rive — le moulin au loin"] } },
  { id: "titre-2", aide: "titre", titre: "Trois titres d'après le début du texte", source: "inventé", entree: { histoire: classe, consigne: null, debut: CABANE.join("\n"), chapitre: "Le dernier bac", autresTitres: ["Quai — la sirène du dernier bac", "Passerelle — le bac s'éloigne"] } },

  // Écrire une scène vide (F13.6)
  { id: "ecriture-1", aide: "ecriture", titre: "Écrire la scène 18 d'après sa consigne, ≈ 150 mots, après la souche creuse", repere: "La consigne suivie, au style d'un bon élève de CM1-CM2, dans la personne et le temps de la scène d'avant ; ni choix, ni « rends-toi », ni personnage nouveau ; 120 à 190 mots.", source: "inventé", entree: { histoire: classe, carnet, consigne: CONSIGNES[18], titre: "Clairière — les deux chemins se rejoignent", chapitre: { titre: lisiere.titre, resume: lisiere.resume }, voisines: scenesDe(lisiere, 18).slice(0, 6).map((v) => ({ titre: v.titre, consigne: v.consigne })), avant: [{ fin: TEXTES[16].join("\n"), choix: "Sortir de la souche et suivre la lumière" }], cible: 150 } },

  // Idées de choix (F13.3)
  { id: "choix-souche", aide: "idees-choix", titre: "Dix idées de choix : la souche creuse (texte écrit)", repere: "Des choix vraiment différents, qui tiennent compte de la voix qui murmure ; une scène existante quand elle convient.", source: "inventé", entree: souche },
  { id: "choix-grenier", aide: "idees-choix", titre: "Dix idées de choix : enfermé au grenier, sans la clé", repere: "Aucune idée n'utilise la clé d'argent ; le couteau, la lanterne, la lucarne, appeler…", source: "inventé", entree: grenier },
  { id: "choix-clairiere", aide: "idees-choix", titre: "Dix idées de choix : scène pas encore écrite (la consigne seule)", source: "inventé", entree: clairiere },

  // Préparation (F13.4)
  { id: "questions-personnages", aide: "questions", titre: "Six questions pour la classe : étape Personnages, « il ne peut pas voler » retenu", repere: "Aucune question sur ce qui est déjà retenu (voler, l'aile) ; des questions courtes, pour des CE2-CM1, à l'oral (F13-AC14).", source: "inventé", entree: etapePersonnages },
  { id: "questions-enjeu", aide: "questions", titre: "Six questions pour la classe : étape Enjeu", source: "inventé", entree: etapeEnjeu },
  { id: "idees-personnages", aide: "idees", titre: "Six idées : étape Personnages, « L'île aux dragons »", repere: "Compatibles avec le dragon qui ne vole pas ; ni l'or écarté, ni les idées déjà notées.", source: "inventé", entree: etapePersonnages },
  { id: "idees-enjeu", aide: "idees", titre: "Six idées : étape Enjeu, « Les passeurs de brume »", source: "inventé", entree: etapeEnjeu },
  { id: "retenons-personnages", aide: "retenons", titre: "« Nous retenons » d'après les idées : Personnages", repere: "Seulement les idées retenues (pas la pêcheuse, à discuter), quelques phrases claires.", source: "inventé", entree: etapePersonnages },
  { id: "retenons-enjeu", aide: "retenons", titre: "« Nous retenons » d'après les idées : Enjeu", source: "inventé", entree: etapeEnjeu },

  // Plan (F13.5)
  { id: "parties", aide: "parties", titre: "Dix parties pour compléter le plan", repere: "Titre de partie, premier chapitre, résumé ; une suite logique au plan, sans doublon.", source: "inventé", entree: { histoire: classe, carnet, plan, dejaMontres: [] } },
  { id: "chapitres", aide: "chapitres", titre: "Six chapitres pour « La forêt engloutie »", source: "inventé", entree: { histoire: classe, carnet, plan, partie: "La forêt engloutie", dejaMontres: [] } },
  { id: "resume", aide: "resume", titre: "Résumé proposé pour « Le gué des saules »", repere: "Fidèle aux scènes prévues, deux à quatre phrases.", source: "inventé", entree: { histoire: classe, carnet, plan, partie: "La forêt engloutie", chapitre: "Le gué des saules", resumeActuel: "", scenes: chapitre("gue").scenes.map((s) => ({ titre: s.titre, consigne: CONSIGNES[s.ref] })) } },

  // Images (F10.2)
  { id: "personnages", aide: "personnages", titre: "Repérer les personnages d'après la préparation", repere: "Lou (héros), Marius, la chouette ; rien d'inventé.", source: "inventé", entree: { histoire: classe, carnet, idees: ["Une chouette messagère aide Lou"], connus: [] } },
  { id: "fiche-chouette", aide: "fiche-visuelle", titre: "Fiche visuelle : la chouette messagère", source: "inventé", entree: { histoire: classe, sorte: "personnage", nom: "La chouette messagère", description: "Une chouette aux plumes argentées, qui montre le chemin sans parler.", univers: carnet.univers } },
  { id: "image-porte", aide: "description-image", titre: "Description d'image, héros absent : « je pousse la porte de la cabane »", repere: "La porte et le lieu ; au plus des mains neutres (F10-AC08) ; ni texte ni style.", source: "inventé", entree: { histoire: classe, pour: "scene", idee: "je pousse la porte de la cabane du passeur", paragraphes: CABANE, chapitre: { titre: "Le dernier bac", resume: RESUMES.bac }, cadrage: "3:2", herosAbsent: true, badges: [{ nom: "la casquette de Marius", fiche: "Casquette de toile bleue délavée, visière usée." }] } },
  { id: "image-souche", aide: "description-image", titre: "Description d'image d'après la scène, sans idée donnée", source: "inventé", entree: { histoire: classe, pour: "scene", idee: "", paragraphes: TEXTES[16], chapitre: { titre: lisiere.titre, resume: lisiere.resume }, cadrage: "pleine-page", herosAbsent: true, badges: [{ nom: "la lanterne de secours", fiche: "Petite lanterne de fer noir à vitres rondes." }] } },
  { id: "mots-foret", aide: "mots-cles", titre: "Mots-clés lus dans un visuel de forêt", repere: "Le lieu et ce qu'on voit, en français et en anglais ; ni nom propre ni style.", source: "inventé", entree: { image: { octets: new Uint8Array(readFileSync(resolve(process.cwd(), "public/illustrations/defaut-foret-v.jpg"))), format: "jpeg" } } },

  // Bibliothèque (F15)
  { id: "presentation", aide: "presentation", titre: "Présentation de « Les passeurs de brume » pour la bibliothèque", repere: "Deux ou trois phrases qui donnent envie ; ni la fin, ni les choix, ni qui l'a écrit.", source: "inventé", entree: { histoire: classe, carnet, plan, debut: CABANE.join("\n") } },
];
