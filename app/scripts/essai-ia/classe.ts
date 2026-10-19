/**
 * Jugement final des aides (étape 8, lot 9) : une classe fictive, « La ville aux horloges
 * arrêtées », inventée pour ce jugement à la demande du porteur le 19 octobre 2026, à la place des
 * textes de sa classe. Rien n'y vient du jeu d'essai V17 (`jeu.ts`), sur lequel les consignes au
 * modèle ont été réglées : l'histoire, les personnages et les textes d'élèves sont neufs, pour
 * juger les aides sur ce qu'elles n'ont jamais vu. Chaque cas part chez le seul modèle retenu
 * pour son aide (`MODELE_DES_AIDES`).
 *
 * Les textes d'élèves ont les fautes d'une classe de CE2 à CM2 : terminaisons en « é » pour
 * l'imparfait, accords oubliés, « sa » pour « ça », « et puis » à la chaîne, dialogue sans
 * ponctuation, texte qui s'arrête à mi-consigne. Aucun prénom d'élève : il n'en part jamais.
 */
import type { EntreeIdeesChoix } from "@/serveur/ia/aides/idees-choix";
import type { Carnet, Histoire, Plan } from "@/serveur/ia/aides/contexte";
import type { Cas } from "./jeu";

const classe: Histoire = { titre: "La ville aux horloges arrêtées", mode: "classe", recit: "choix", niveaux: ["CM1", "CM2"] };
const ce2: Histoire = { ...classe, niveaux: ["CE2"] };
const ecriture: Histoire = { ...classe, ecriture: "à la troisième personne, au passé simple" };

const carnet: Carnet = {
  univers: "Clocheville, une petite ville de montagne pleine d'horloges, de carillons et de pendules. Une nuit, à minuit pile, toutes les horloges se sont arrêtées : les adultes sont restés figés comme des statues, seuls les enfants peuvent encore bouger. La neige ne tombe plus, elle flotte dans l'air.",
  personnages: "Inès, 10 ans, fille de l'horloger, débrouillarde et un peu têtue. Elle a toujours sur elle le petit tournevis de son père. Tic, son chat noir, qui entend le tic-tac des rouages à travers les murs.",
  enjeu: "Retrouver les trois rouages volés du Beffroi avant le lever du soleil. Sinon, la ville restera figée pour toujours. C'est le Marchand de Sable Gris qui les a volés : il veut que la nuit ne finisse jamais.",
  cartes: [
    { nom: "Inès", autresNoms: [], description: "Dix ans, fille de l'horloger, débrouillarde, tournevis de son père dans la poche.", heros: true },
    { nom: "Tic", autresNoms: ["le chat"], description: "Chat noir qui entend les rouages à travers les murs.", heros: false },
    { nom: "le Marchand de Sable Gris", autresNoms: ["le Marchand"], description: "Long manteau gris, sac de sable qui endort tout ce qu'il touche.", heros: false },
  ],
};

const plan: Plan = [
  { partie: "La place du Beffroi", chapitres: [
    { titre: "Minuit pile", resume: "Inès se réveille dans une ville figée et découvre que le Beffroi a perdu ses rouages." },
    { titre: "Le cahier du grand-père", resume: "Dans le Beffroi, Inès trouve le cahier de son grand-père, qui donne trois indices." },
  ] },
  { partie: "Les toits de la ville", chapitres: [
    { titre: "La fontaine gelée", resume: "Le premier rouage dort au fond de la fontaine, prise dans une glace qui ne fond pas." },
    { titre: "Le marché immobile" },
  ] },
  { partie: "L'atelier souterrain", chapitres: [{ titre: "La porte au cadenas" }] },
];

const nomsPropres = ["Inès", "Tic", "Clocheville", "Beffroi", "Marchand de Sable Gris"];

// ——— Textes d'élèves inventés pour ce jugement ———

/** CE2. Fautes de base : le degré 1 doit les corriger toutes, sans toucher à « très fort ». */
const STATUES = [
  "Inès et Tic sortir de la maison. Dans la rue tout les gens était imobile comme des statut. Une dame avait sa tasse en l'air et le café coulé pas.",
  "Inès toucha sa main elle était froide. Tic miaula très fort, il avait peur.",
];

/** CM1. « Et puis » à la chaîne, accords, « sa » pour « ça » : degré 2. */
const ESCALIER = [
  "Inès monta les escalier du beffroi et puis elle arriva en haut et puis elle vu la grande horloge. les aiguilles était bloqué sur minuit.",
  "elle essaya de les tourné mais sa marchais pas. Tic sauta sur une poutre et il fit tombé un vieux cahier plein de poussière.",
];

/** CM1. Dialogue sans ponctuation, une croyance à garder (« Inès pense qu'il ment ») : degré 3. */
const MARCHAND = [
  "Le Marchand de Sable Gris ricana. Tu ne retrouvera jamais les rouages petite ! Inès pense qu'il ment parce que ses mains tremble. Elle serra son tournevis dans sa poche.",
  "Rendez moi les rouages cria t-elle. Le marchand ouvrit son sac et du sable gris s'envola partout et Inès se cacha derrière une charrette et le sable passa au dessus d'elle.",
];

/** CM2, au « tu », correct mais plat : degré 4. */
const TOITS = [
  "Tu arrives sur les toits. Le vent souffle fort. Tu vois la ville d'en haut, toutes les fenêtres sont noires. Au loin, il y a une lumière qui clignote.",
  "Tu marches doucement sur les tuiles. Une tuile glisse et tombe dans la rue. Tu as peur d'être repéré. Tu te caches derrière une cheminée.",
];

/** CE2, très court, la moitié de la consigne : degré 5 et pistes. */
const CAVE = ["Inès descendi dans la cave. Il fesait noir. elle entendi un bruit. C'était le Marchand."];
const CONSIGNE_CAVE = "Inès descend dans la cave de l'atelier. Raconte sa descente.\nDécris :\n– l'obscurité et les bruits ;\n– ce qu'elle ressent ;\n– ce qu'elle découvre au fond de la cave.";

/** CM2, bon niveau, quelques coquilles seulement : le degré 2 doit presque tout laisser. */
const FONTAINE = [
  "La fontaine de la place était recouverte d'une glace bleue, si épaisse qu'on ne voyait plus l'eau. Au fond, quelque chose brillait : un rouage doré, gros comme une assiette.",
  "Inès frappa la glace avec son tournevis, mais il rebondit sans laisser une seule marque. Tic, lui, tournait autour de la fontaine en miaulant. Il avait entendu quelque chose que Inès n'entendait pas : un tic-tac, tout petit, qui venait de sous les pavés.",
];

const CONSIGNE_FONTAINE = "Inès arrive devant la fontaine gelée. Raconte ce qu'elle essaie pour atteindre le rouage.\nDécris :\n– la glace et ce qui brille au fond ;\n– ce que fait Tic.";

// ——— Scènes pour les idées de choix ———

const atelier = { titre: "La porte au cadenas", resume: "Sous l'atelier de l'horloger, une porte de fer garde le dernier rouage." };
const scenesAtelier = [
  { ref: "S041", titre: "Couloir — les pendules qui battent", consigne: "Inès avance dans un couloir couvert de pendules. Décris leur bruit." },
  { ref: "S042", titre: "Établi — les outils du père", consigne: "Inès retrouve l'établi de son père. Décris les outils." },
  { ref: "S044", titre: "Salle des rouages — le dernier rouage", consigne: "Inès découvre la salle où tourne le dernier rouage." },
  { ref: "S045", titre: "Fin — le sable gris", consigne: "Inès est endormie par le sable gris : fin de l'aventure." },
];
const objets = ["le tournevis du père : un petit tournevis à manche rouge", "le cahier du grand-père : trois indices et des dessins de rouages"];

/** Enfermée devant un cadenas à chiffres, sans le code, et Tic resté sur les toits : aucune idée ne doit s'en servir. */
const cadenas: EntreeIdeesChoix = {
  histoire: classe, carnet, chapitre: atelier,
  scene: {
    titre: "Porte — le cadenas à chiffres",
    consigne: "Inès arrive devant la porte de fer. Décris le cadenas, et montre qu'elle ne connaît pas le code.",
    paragraphes: [
      "Au bout de l'escalier, une porte de fer barrait le passage. Un gros cadenas à quatre chiffres pendait à la poignée, couvert de givre. Inès essaya 1, 2, 3, 4, puis la date de son anniversaire : rien.",
      "Elle regretta d'avoir laissé Tic sur les toits : lui aurait peut-être entendu le cliquetis du mécanisme. Derrière la porte, un tic-tac énorme faisait trembler le sol. Dans sa poche, il lui restait le tournevis et le cahier du grand-père.",
    ],
  },
  scenes: scenesAtelier, objets, choixExistants: [], dejaMontrees: [],
};

/** Une scène pas encore écrite : la consigne seule. */
const marche: EntreeIdeesChoix = {
  histoire: classe, carnet, chapitre: { titre: "Le marché immobile" },
  scene: { titre: "Marché — les marchands figés", consigne: "Inès et Tic traversent le marché où tous les marchands sont figés. Décris ce qu'ils voient.", paragraphes: [] },
  scenes: [
    { ref: "S021", titre: "Étal — le pâtissier figé", consigne: "Inès s'arrête devant l'étal du pâtissier." },
    { ref: "S023", titre: "Ruelle — l'ombre grise", consigne: "Une ombre grise suit Inès dans une ruelle." },
  ],
  objets, choixExistants: ["Prendre la ruelle sombre"], dejaMontrees: [],
};

// ——— Préparation ———

const etapePersonnages = {
  histoire: classe, etape: "personnages", question: "Qui est notre héros, et qu'est-ce qui le rend unique ?",
  questions: ["Quel âge a-t-il ? Que sait-il faire ?", "De quoi a-t-il peur ?", "Qui va l'aider, qui va le gêner ?"],
  idees: [
    { texte: "La fille de l'horloger, qui répare tout avec un tournevis", etat: "retenue" },
    { texte: "Elle a un chat qui entend les rouages", etat: "retenue" },
    { texte: "Elle a peur du noir", etat: "discuter" },
    { texte: "Elle a des pouvoirs magiques", etat: "ecartee" },
  ],
  retenu: "", carnet: { univers: carnet.univers },
};
const etapeEnjeu = {
  histoire: classe, etape: "enjeu", question: "Que doit réussir notre héros, et que se passe-t-il s'il échoue ?",
  questions: ["Qu'est-ce qui l'oblige à partir ?", "Qu'est-ce qu'il risque de perdre ?"],
  idees: [
    { texte: "Retrouver les trois rouages avant le lever du soleil", etat: "retenue" },
    { texte: "Sinon la ville reste figée pour toujours", etat: "retenue" },
  ],
  retenu: "", carnet: { univers: carnet.univers, personnages: carnet.personnages },
};

export const JEU_DE_LA_CLASSE: Cas[] = [
  // Correction (F13.1)
  { id: "c-correction-1", aide: "correction", titre: "Correction, degré 1, CE2 : les statues", repere: "« sortirent », « tous », « étaient immobiles », « statues », « ne coulait pas » ; « très fort » et la ponctuation restent.", source: "inventé", entree: { histoire: ce2, degre: 1, paragraphes: STATUES, consigne: null, nomsPropres } },
  { id: "c-correction-2", aide: "correction", titre: "Correction, degré 2, CM1 : l'escalier du Beffroi", repere: "Le degré 1, plus les majuscules et les « et puis » ; rien d'autre ne change, « vit » pour « vu ».", source: "inventé", entree: { histoire: classe, degre: 2, paragraphes: ESCALIER, consigne: null, nomsPropres } },
  { id: "c-correction-2-bon", aide: "correction", titre: "Correction, degré 2, CM2 : un bon texte, presque rien à changer", repere: "« que Inès » → « qu'Inès » au plus ; le reste intact.", source: "inventé", entree: { histoire: classe, degre: 2, paragraphes: FONTAINE, consigne: CONSIGNE_FONTAINE, nomsPropres } },
  { id: "c-correction-3", aide: "correction", titre: "Correction, degré 3, CM1 : le dialogue du Marchand", repere: "Dialogue ponctué, phrase en « et » coupée ; « Inès pense qu'il ment » reste une croyance ; rien de nouveau.", source: "inventé", entree: { histoire: classe, degre: 3, paragraphes: MARCHAND, consigne: null, nomsPropres } },
  { id: "c-correction-4", aide: "correction", titre: "Correction, degré 4, CM2 au « tu » : les toits", repere: "Plus riche, mêmes événements, toujours au « tu », lisible par un enfant.", source: "inventé", entree: { histoire: classe, degre: 4, paragraphes: TOITS, consigne: null, nomsPropres } },
  { id: "c-correction-5", aide: "correction", titre: "Correction, degré 5, CE2 : la cave, d'après la consigne", repere: "Le texte de l'élève comme base, la consigne remplie, sans événement nouveau au-delà de « le Marchand ».", source: "inventé", entree: { histoire: ce2, degre: 5, paragraphes: CAVE, consigne: CONSIGNE_CAVE, nomsPropres } },

  // Pistes de reprise (F13.1)
  { id: "c-pistes-cave", aide: "pistes", titre: "Pistes de reprise : la cave, trop courte (CE2)", source: "inventé", entree: { histoire: ce2, paragraphes: CAVE, consigne: CONSIGNE_CAVE } },
  { id: "c-pistes-fontaine", aide: "pistes", titre: "Pistes de reprise : la fontaine, déjà bonne (CM2)", repere: "Des pistes qui poussent un bon texte sans le défaire.", source: "inventé", entree: { histoire: classe, paragraphes: FONTAINE, consigne: CONSIGNE_FONTAINE } },

  // Consigne (F13.2)
  { id: "c-consigne-1", aide: "consigne", titre: "Consigne : « ines trouve le 2e rouage dans le carillon »", source: "inventé", entree: { histoire: classe, carnet, indication: "ines trouve le 2e rouage dans le carillon mais il est gardé", chapitre: { titre: "Le marché immobile" }, voisines: [] } },
  { id: "c-consigne-2", aide: "consigne", titre: "Consigne : « tic se perd sur les toits »", source: "inventé", entree: { histoire: classe, carnet, indication: "tic se perd sur les toits, ines l'appelle", chapitre: { titre: "La fontaine gelée", resume: plan[1].chapitres[0].resume }, voisines: [] } },
  { id: "c-consigne-ce2", aide: "consigne", titre: "Consigne pour des CE2 : « le sable gris endort la place »", source: "inventé", entree: { histoire: ce2, carnet, indication: "le marchand jette son sable sur la place", chapitre: { titre: "Minuit pile", resume: plan[0].chapitres[0].resume }, voisines: [] } },

  // Titre (F05)
  { id: "c-titre-consigne", aide: "titre", titre: "Trois titres d'après la consigne : la fontaine", source: "inventé", entree: { histoire: classe, consigne: CONSIGNE_FONTAINE, debut: null, chapitre: "La fontaine gelée", autresTitres: ["Place — la neige qui flotte"] } },
  { id: "c-titre-texte", aide: "titre", titre: "Trois titres d'après le texte : le Marchand", source: "inventé", entree: { histoire: classe, consigne: null, debut: MARCHAND.join("\n"), chapitre: "Le marché immobile", autresTitres: [] } },

  // Écrire une scène vide (F13.6)
  { id: "c-ecriture", aide: "ecriture", titre: "Écrire « Établi — les outils du père », ≈ 150 mots", repere: "Troisième personne, passé simple ; la consigne, sans choix ni personnage nouveau.", source: "inventé", entree: { histoire: ecriture, carnet, consigne: "Inès retrouve l'établi de son père. Décris les outils, et ce qu'elle ressent en les voyant.", titre: "Établi — les outils du père", chapitre: atelier, voisines: scenesAtelier.map((s) => ({ titre: s.titre, consigne: s.consigne })), avant: [{ fin: "Inès avança dans le couloir. Les pendules battaient toutes ensemble, comme un cœur énorme.", choix: "Pousser la petite porte à droite" }], cible: 150 } },

  // Idées de choix (F13.3)
  { id: "c-choix-cadenas", aide: "idees-choix", titre: "Dix idées de choix : le cadenas, sans le code, sans Tic", repere: "Aucune idée n'ouvre avec le code ni ne fait agir Tic ; tournevis, cahier, écouter, forcer, fuir…", source: "inventé", entree: cadenas },
  { id: "c-choix-marche", aide: "idees-choix", titre: "Dix idées de choix : le marché, consigne seule", source: "inventé", entree: marche },

  // Préparation (F13.4)
  { id: "c-questions", aide: "questions", titre: "Six questions pour la classe : Personnages", repere: "Rien sur le tournevis ni le chat, déjà retenus ; courtes, pour l'oral.", source: "inventé", entree: etapePersonnages },
  { id: "c-idees", aide: "idees", titre: "Six idées : Enjeu", source: "inventé", entree: etapeEnjeu },
  { id: "c-retenons", aide: "retenons", titre: "« Nous retenons » : Personnages", repere: "Les deux idées retenues seulement ; ni la peur du noir (à discuter) ni la magie (écartée).", source: "inventé", entree: etapePersonnages },

  // Plan (F13.5)
  { id: "c-parties", aide: "parties", titre: "Dix parties pour compléter le plan", source: "inventé", entree: { histoire: classe, carnet, plan, dejaMontres: [] } },
  { id: "c-chapitres", aide: "chapitres", titre: "Six chapitres pour « L'atelier souterrain »", source: "inventé", entree: { histoire: classe, carnet, plan, partie: "L'atelier souterrain", dejaMontres: [] } },
  { id: "c-resume", aide: "resume", titre: "Résumé proposé : « La porte au cadenas »", source: "inventé", entree: { histoire: classe, carnet, plan, partie: "L'atelier souterrain", chapitre: "La porte au cadenas", resumeActuel: "", scenes: scenesAtelier.map((s) => ({ titre: s.titre, consigne: s.consigne })) } },

  // Images (F10.2)
  { id: "c-personnages", aide: "personnages", titre: "Repérer les personnages d'après la préparation", repere: "Inès (héroïne), Tic, le Marchand ; rien d'inventé.", source: "inventé", entree: { histoire: classe, carnet: { univers: carnet.univers, personnages: carnet.personnages, enjeu: carnet.enjeu }, idees: [], connus: [] } },
  { id: "c-fiche-tic", aide: "fiche-visuelle", titre: "Fiche visuelle : Tic", source: "inventé", entree: { histoire: classe, sorte: "personnage", nom: "Tic", description: "Chat noir qui entend les rouages à travers les murs.", univers: carnet.univers } },
  { id: "c-image-fontaine", aide: "description-image", titre: "Description d'image : la fontaine gelée, d'après le texte", source: "inventé", entree: { histoire: classe, pour: "scene", idee: "", paragraphes: FONTAINE, chapitre: { titre: "La fontaine gelée", resume: plan[1].chapitres[0].resume }, cadrage: "3:2", herosAbsent: false, badges: [{ nom: "Inès", fiche: "Fille de dix ans, cheveux bruns en chignon, gros pull jaune, tournevis rouge." }, { nom: "Tic", fiche: "Chat noir aux yeux verts." }] } },
];
