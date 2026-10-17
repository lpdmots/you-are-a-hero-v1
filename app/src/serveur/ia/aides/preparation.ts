import { assembler, bloc, chaine, champs, liste, objet, texte, textes, type DefinitionAide } from "../aide";
import { ETAPES_DU_CARNET, REGLES_COMMUNES, blocCarnet, blocPlan, presentation, type Carnet, type EtapeDuCarnet, type Histoire, type Plan } from "./contexte";

/**
 * Les trois listes d'une étape de la Préparation (F13.4) : questions pour la classe, idées,
 * et « Nous retenons ». Questions et idées viennent six par demande et se livrent une à une ;
 * la réserve est jetée dès que l'étape change (F13-AC14). L'IA lit la question de l'étape,
 * ses questions, ses idées et leurs états, le texte retenu, les autres étapes et l'orientation.
 */
export type EtatIdee = "retenue" | "discuter" | "ecartee";

export type EntreeEtape = {
  histoire: Histoire;
  etape: EtapeDuCarnet;
  /** La question de l'étape, en grand à l'écran */
  question: string;
  questions: string[];
  idees: { texte: string; etat: EtatIdee }[];
  retenu: string;
  /** Les autres étapes : leur texte retenu */
  carnet: Carnet;
  /** Pour « Grandes étapes » : les parties et chapitres déjà au plan */
  plan?: Plan;
  orientation?: string;
};

const NOMS_DES_ETATS: Record<EtatIdee, string> = { retenue: "retenue", discuter: "à discuter", ecartee: "écartée" };

function contexteEtape(e: EntreeEtape): string {
  return assembler(
    presentation(e.histoire),
    blocCarnet(e.carnet, e.etape),
    e.etape === "etapes" ? blocPlan(e.plan) : "",
    bloc("etape", `${ETAPES_DU_CARNET[e.etape]} — « ${e.question} »`),
    bloc("questions_deja_posees", e.questions),
    bloc("idees_notees", e.idees.map((i) => `${i.texte} (${NOMS_DES_ETATS[i.etat]})`)),
    bloc("nous_retenons", e.retenu),
    bloc("orientation", e.orientation),
  );
}

const qui = (h: Histoire) => (h.mode === "classe"
  ? "la classe, pendant un atelier où l'enseignant projette la page et note ce que disent les élèves"
  : "l'auteur, qui prépare seul son histoire");

export type Questions = { questions: string[] };

export const questions: DefinitionAide<EntreeEtape, Questions> = {
  aide: "questions",
  sortieMax: 600,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu proposes six questions qui aident ${qui(e.histoire)} à avancer sur une étape de la préparation de l'histoire.
- ${e.histoire.mode === "classe" ? "Des questions qu'un enseignant pose à voix haute à sa classe : courtes, ouvertes, avec des mots d'enfant." : "Des questions adressées à l'auteur (« vous »), courtes et ouvertes."}
- Chacune fait avancer ce qui n'est pas encore décidé ; ne demande jamais ce que le texte retenu ou une idée retenue dit déjà.
- Tiens compte des autres étapes pour rester cohérent avec l'histoire.
- Varie : un détail concret, une conséquence, une émotion, un « et si… ».
- Ne reprends pas les questions déjà posées. Si une orientation est donnée, suis-la.`,
  ),
  message: (e) => assembler(contexteEtape(e), "Propose six questions, de la plus utile à la moins utile."),
  schema: { nom: "questions", schema: objet({ questions: liste(chaine) }) },
  lire: (json, e) => {
    const deja = new Set(e.questions.map((q) => q.toLocaleLowerCase("fr")));
    const l = textes(champs(json)?.questions, 200)?.filter((q) => !deja.has(q.toLocaleLowerCase("fr")));
    return l && l.length ? { questions: l.slice(0, 6) } : null;
  },
  simuler: (e) => ({ questions: Array.from({ length: 6 }, (_, i) => `Question ${e.questions.length + i + 1} ?`) }),
};

export type Idees = { idees: string[] };

export const idees: DefinitionAide<EntreeEtape, Idees> = {
  aide: "idees",
  sortieMax: 700,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu proposes six idées pour une étape de la préparation de l'histoire, que ${qui(e.histoire)} discutera avant d'en retenir ou d'en écarter.
- Une idée par ligne, en une phrase courte et concrète (« La chouette ne parle qu'aux enfants »), sans numéro.
- Des idées variées, compatibles avec ce qui est déjà retenu dans cette étape et dans les autres ; aucune ne contredit une idée retenue.
- Ne reprends ni les idées déjà notées, retenues, à discuter ou écartées, ni ce que dit déjà le texte retenu.
- Des idées qu'un enfant de cet âge peut s'approprier et prolonger. Si une orientation est donnée, suis-la.`,
  ),
  message: (e) => assembler(contexteEtape(e), "Propose six idées, de la plus prometteuse à la moins prometteuse."),
  schema: { nom: "idees", schema: objet({ idees: liste(chaine) }) },
  lire: (json, e) => {
    const deja = new Set(e.idees.map((i) => i.texte.toLocaleLowerCase("fr")));
    const l = textes(champs(json)?.idees, 200)?.filter((i) => !deja.has(i.toLocaleLowerCase("fr")));
    return l && l.length ? { idees: l.slice(0, 6) } : null;
  },
  simuler: (e) => ({ idees: Array.from({ length: 6 }, (_, i) => `Idée ${e.idees.length + i + 1}`) }),
};

export type Retenu = { texte: string };

/** « ✦ Rédiger d'après les idées » : une proposition, jamais écrite d'office (F13-AC12). */
export const retenons: DefinitionAide<EntreeEtape, Retenu> = {
  aide: "retenons",
  sortieMax: 800,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu rédiges le texte « ${e.histoire.mode === "classe" ? "Nous retenons" : "Je retiens"} » d'une étape de la préparation : ce que ${e.histoire.mode === "classe" ? "la classe a décidé" : "l'auteur a décidé"}, qui servira de mémoire pendant toute l'écriture.
- Pars du texte déjà retenu, s'il existe : garde tout ce qu'il dit, dans ses mots autant que possible, et ajoutes-y les idées retenues.
- N'utilise que les idées retenues ; ignore les idées à discuter et les idées écartées. N'invente rien d'autre.
- Quelques phrases courtes et claires, ou une ligne par personnage ou par lieu quand l'étape s'y prête ; pas de titre ni de liste à puces.
- Reste cohérent avec les autres étapes.`,
  ),
  message: (e) => assembler(contexteEtape(e), `Rédige le texte « ${e.histoire.mode === "classe" ? "Nous retenons" : "Je retiens"} » de cette étape.`),
  schema: { nom: "retenu", schema: objet({ texte: chaine }) },
  lire: (json) => {
    const t = texte(champs(json)?.texte, 3000);
    return t ? { texte: t } : null;
  },
  simuler: (e) => ({ texte: [e.retenu, ...e.idees.filter((i) => i.etat === "retenue").map((i) => i.texte)].filter(Boolean).join("\n") || "Rien n'est encore retenu." }),
};
