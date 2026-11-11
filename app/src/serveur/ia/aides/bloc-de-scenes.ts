import { BLOC, CLE_NOUVELLE, elaguer, type ChoixPropose, type Proposition, type ReglagesBloc, type Reponse, type SceneProposee } from "@/domaine/bloc-de-scenes";
import { LIBELLE_MAX } from "@/domaine/copie";
import { VERIFICATION, listePropre } from "@/domaine/verification";
import { assembler, bloc, chaine, champs, liste, objet, texte, textes, type DefinitionAide } from "../aide";
import { elementDeListe } from "./consigne";
import { REGLES_COMMUNES, blocCarnet, eleve, presentation, type Carnet, type Histoire } from "./contexte";

/**
 * Le bloc de scènes (F13.7) : d'après la demande de l'adulte, quelques scènes reliées par leurs
 * choix, avec leurs titres et, si on les veut, leurs consignes. Il fait ce qui est demandé, pas
 * plus ; il comprend les mots d'un collègue (« une scène avec trois choix » fait quatre scènes) ;
 * il ne fait qu'ajouter. Les scènes du chapitre sont nommées par leur référence (« S012 »), les
 * nouvelles par une clé (« N1 ») : la réponse se relit sans confiance, puis se ramène aux
 * identités du chapitre.
 */

export type SceneDuChapitre = {
  id: string; ref: string; titre: string; consigne?: string;
  /** Ses choix : leur libellé, et la référence de la scène où ils mènent (« ailleurs » hors du chapitre) */
  choix: { libelle: string; vers: string }[];
};

export type EntreeBloc = {
  histoire: Histoire;
  carnet?: Carnet;
  chapitre: { titre: string; resume?: string };
  scenes: SceneDuChapitre[];
  /** La scène d'origine ; null dans un chapitre encore vide */
  origine: { id: string; ref: string; titre: string; consigne: string | null; paragraphes: string[] } | null;
  demande: string;
  reglages: ReglagesBloc;
  /** Les questions de la proposition précédente, et ce que l'adulte y a répondu */
  reponses: Reponse[];
  /** La proposition à l'écran, telle qu'il l'a retouchée : elle se redessine d'après les réponses */
  actuelle?: Proposition;
};

const consignesVoulues = (e: EntreeBloc): string => {
  if (!e.reglages.consignes) return "Ne rédige aucune consigne : laisse « consigne » vide et « liste » vide pour chaque scène, et « consigne_origine » vide.";
  return e.histoire.mode === "classe"
    ? `Pour chaque nouvelle scène, une consigne d'écriture pour un ${eleve(e.histoire)} qui l'écrira seul :
- « consigne » : une ou deux phrases qui tutoient l'élève, avec le vocabulaire d'un élève de cet âge ; elles situent la scène et disent ce qu'il faut raconter ;
- « liste » : deux à quatre éléments que l'élève cochera en se relisant, chacun une courte action d'écriture à l'infinitif, avec une majuscule et un point (« Décrire la grotte. »), 70 caractères au plus.
La consigne ne décide pas de la suite à la place de l'élève et ne rédige pas la scène.`
    : `Pour chaque nouvelle scène, une note d'intention pour l'adulte qui écrit son livre, une ou deux lignes sans tutoiement (« La rencontre avec le passeur ; à faire sentir : sa lanterne, sa voix. »), dans « consigne » ; « liste » reste vide.`;
};

const ceQuiManque = (e: EntreeBloc): string =>
  e.reglages.manque === "completer"
    ? `Si la demande ne dit pas tout ce qu'il faut pour une scène (où mène un chemin, ce qui s'y passe), invente-le toi-même, de façon cohérente avec la préparation et le chapitre, et marque « inventee » (scène) ou « invente » (choix) à true pour ce que tu as inventé. Ne pose aucune question : « questions » reste vide.`
    : `Si la demande ne dit pas tout ce qu'il faut pour bien répondre (où mène un chemin qu'elle annonce sans le décrire, ce qui s'y passe pour écrire sa consigne), dessine quand même la scène avec un titre neutre, et pose une question courte, au plus trois en tout, dans « questions ». Une question sert seulement à bien faire ce qui est demandé : elle ne propose jamais une scène, un chemin ou une suite de plus (jamais « Où mène le sentier ? » pour un chemin dont la demande ne dit rien de la suite). Une demande claire ne reçoit aucune question. Laisse « inventee » et « invente » à false.`;

const SYSTEME = (e: EntreeBloc): string => assembler(
  REGLES_COMMUNES,
  `Tu construis un morceau du plan d'un chapitre de livre-jeu, d'après la demande d'un adulte : des scènes reliées par des choix. L'adulte relira ta proposition, dessinée sur le schéma du chapitre, avant de l'ajouter.

Comprends la demande comme un collègue la dirait :
- « trois chemins : le sentier, le ruisseau, la grotte » depuis une scène : trois nouvelles scènes et trois choix qui partent de cette scène ;
- « une scène dans la forêt avec trois choix » : une nouvelle scène, la forêt, où mène un choix depuis la scène d'origine, et ses trois destinations, soit quatre scènes et quatre choix ;
- « deux chemins qui se rejoignent » : deux scènes qui mènent toutes deux à une même troisième.

Fais ce qui est demandé, pas plus :
- n'ajoute aucune scène ni aucun choix que la demande n'annonce pas ; trois chemins décrits donnent leurs trois scènes, sans la suite de chacune ;
- un choix part de la scène d'origine ou d'une nouvelle scène, jamais d'une autre scène existante ;
- un choix ne mène à une scène existante du chapitre que si la demande le dit (« la grotte rejoint Le vieux pont », « revient à l'orée ») ; il la désigne par sa référence, sans la recréer ;
- tu ne modifies ni ne supprimes rien de ce qui existe.

Une demande trop large se recadre : au plus ${BLOC.scenes} nouvelles scènes, sur ${BLOC.niveaux} niveaux au plus sous la scène d'origine. Au-delà, construis seulement la première partie, dans l'ordre de la demande, et dis dans « reste », en une phrase qui commence par ce que tu as construit, ce que tu laisses (« J'ai construit l'arrivée dans la forêt et ses trois chemins. Reste : le campement et la rivière. »). Sinon « reste » est vide.

Les identifiants :
- les nouvelles scènes ont une clé « N1 », « N2 »… dans l'ordre où le lecteur les rencontre ;
- « de » et « vers » d'un choix sont une clé de nouvelle scène ou la référence d'une scène du chapitre (« S012 ») ;
${e.origine ? `- la scène d'origine est ${e.origine.ref}.` : `- le chapitre est encore vide : la première nouvelle scène, N1, est son début ; aucun choix n'y mène.`}

Les textes :
- « titre » : deux à sept mots, dans la forme des titres du chapitre, sans dévoiler la suite ;
- « libelle » : ce que fait le lecteur, à l'infinitif, en quelques mots (« Suivre le sentier des fougères ») ;
- tu ne rédiges pas les scènes : le texte reste celui des élèves.

${consignesVoulues(e)}
${e.reglages.consignes && e.origine && !e.origine.consigne ? `La scène d'origine n'a pas de consigne : propose-lui en une dans « consigne_origine », de la même forme. Sinon laisse-la vide.` : `Laisse « consigne_origine » vide.`}

${ceQuiManque(e)}
Quand l'adulte a répondu à des questions, suis ses réponses, garde le reste de la proposition actuelle tel qu'il l'a retouché, et ne repose pas une question à laquelle il a répondu.`,
);

const ligneDeScene = (s: SceneDuChapitre): string => {
  const choix = s.choix.length ? ` ; ses choix : ${s.choix.map((c) => `« ${c.libelle} » → ${c.vers}`).join(", ")}` : "";
  return `${s.ref} « ${s.titre} »${s.consigne ? ` — consigne : ${s.consigne.replace(/\s*\n\s*/g, " ")}` : ""}${choix}`;
};

/** La proposition à l'écran, en clair, avec les identifiants que le modèle emploie. */
function enClair(p: Proposition, e: EntreeBloc): string {
  const refDe = new Map(e.scenes.map((s) => [s.id, s.ref]));
  const nom = (id: string) => refDe.get(id) ?? id;
  return [
    ...p.scenes.map((s) => `${s.cle} « ${s.titre} »${s.consigne ? ` — consigne : ${s.consigne.replace(/\s*\n\s*/g, " ")}` : ""}${s.liste.length ? ` ; liste : ${s.liste.join(" ")}` : ""}`),
    ...p.choix.map((c) => `choix « ${c.libelle} » : ${nom(c.de)} → ${nom(c.vers)}`),
  ].join("\n");
}

export const blocDeScenes: DefinitionAide<EntreeBloc, Proposition> = {
  aide: "bloc-scenes",
  sortieMax: 3500,
  systeme: SYSTEME,
  message: (e) => assembler(
    presentation(e.histoire),
    blocCarnet(e.carnet),
    bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`),
    bloc("scenes_du_chapitre", e.scenes.map(ligneDeScene)),
    e.origine
      ? bloc("scene_d_origine", [
        `${e.origine.ref} « ${e.origine.titre} »`,
        e.origine.consigne ? `Consigne : ${e.origine.consigne}` : "Consigne : aucune.",
        e.origine.paragraphes.length ? `Texte :\n${e.origine.paragraphes.join("\n")}` : "Texte : pas encore écrit.",
      ].join("\n"))
      : "",
    e.actuelle ? bloc("proposition_actuelle", enClair(e.actuelle, e)) : "",
    bloc("reponses_de_l_adulte", e.reponses.map((r) => `Question : ${r.question}\nRéponse : ${r.reponse}`)),
    bloc("demande", e.demande),
    e.origine ? `Construis le bloc qui part de ${e.origine.ref}.` : "Construis le début du chapitre.",
  ),
  schema: {
    nom: "bloc_de_scenes",
    schema: objet({
      scenes: liste(objet({ cle: chaine, titre: chaine, consigne: chaine, liste: liste(chaine), inventee: { type: "boolean" } })),
      choix: liste(objet({ de: chaine, vers: chaine, libelle: chaine, invente: { type: "boolean" } })),
      consigne_origine: objet({ consigne: chaine, liste: liste(chaine) }),
      questions: liste(chaine),
      reste: chaine,
    }),
  },
  lire: (json, e) => lireLeBloc(json, e),
  simuler: (e) => simulerUnBloc(e),
};

/** Une liste de vérification proposée, propre ; rien hors d'un projet de classe. */
function listeDe(brute: unknown, e: EntreeBloc): string[] {
  if (e.histoire.mode !== "classe") return [];
  const elements = (textes(brute, 120) ?? []).map(elementDeListe).filter((l) => l && l.length <= VERIFICATION.longueurMax);
  return listePropre(elements.slice(0, 4));
}

/**
 * La réponse du modèle, relue sans confiance (F13.7) : des clés et des références connues, des
 * choix qui partent de la scène d'origine ou d'une nouvelle scène, des scènes atteintes, huit au
 * plus sur deux niveaux ; pas de question quand l'IA complète ; pas de consigne si on n'en veut
 * pas, ni pour une scène d'origine qui en a une.
 */
export function lireLeBloc(json: unknown, e: EntreeBloc): Proposition | null {
  const o = champs(json);
  if (!o || !Array.isArray(o.scenes) || !Array.isArray(o.choix)) return null;
  const parRef = new Map(e.scenes.map((s) => [s.ref, s.id]));
  const scenes: SceneProposee[] = [];
  for (const b of o.scenes) {
    const s = champs(b);
    const cle = typeof s?.cle === "string" ? s.cle.trim().toUpperCase() : "";
    const titre = texte(s?.titre, 80)?.replace(/[.]+$/, "");
    if (!CLE_NOUVELLE.test(cle) || !titre || scenes.some((x) => x.cle === cle)) continue;
    const avecConsigne = e.reglages.consignes;
    scenes.push({
      cle, titre,
      consigne: avecConsigne ? (texte(s?.consigne, 600) ?? "") : "",
      liste: avecConsigne ? listeDe(s?.liste, e) : [],
      inventee: e.reglages.manque === "completer" && s?.inventee === true,
    });
  }
  const nouvelles = new Set(scenes.map((s) => s.cle));
  const bout = (brut: unknown): string | null => {
    const v = typeof brut === "string" ? brut.trim().toUpperCase() : "";
    return nouvelles.has(v) ? v : (parRef.get(v) ?? null);
  };
  const choix: ChoixPropose[] = [];
  for (const b of o.choix) {
    const c = champs(b);
    const de = bout(c?.de);
    const vers = bout(c?.vers);
    const libelle = texte(c?.libelle, LIBELLE_MAX)?.replace(/[.]+$/, "");
    // Un choix part de la scène d'origine ou d'une nouvelle scène : le bloc ne touche à aucune autre (F13-AC39)
    if (!de || !vers || !libelle || de === vers || !(nouvelles.has(de) || de === e.origine?.id)) continue;
    if (choix.some((x) => x.de === de && (x.vers === vers || x.libelle.toLocaleLowerCase("fr") === libelle.toLocaleLowerCase("fr")))) continue;
    choix.push({ cle: `C${choix.length + 1}`, de, vers, libelle, invente: e.reglages.manque === "completer" && c?.invente === true });
  }
  const { bloc: tient } = elaguer({ origine: e.origine?.id ?? null, scenes, choix });
  if (!tient.scenes.length && !tient.choix.length) return null;

  const co = champs(o.consigne_origine);
  const consigneOrigine = e.reglages.consignes && e.origine && !e.origine.consigne?.trim() ? texte(co?.consigne, 600) : null;
  return {
    ...tient,
    consigneOrigine: consigneOrigine ? { consigne: consigneOrigine, liste: listeDe(co?.liste, e) } : null,
    questions: e.reglages.manque === "completer" ? [] : (textes(o.questions, 240) ?? []).slice(0, BLOC.questions),
    reste: texte(o.reste, 400),
  };
}

/* ——— La réponse simulée des essais automatiques : elle suit les mots de la demande, sans IA ——— */

const NOMBRES: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10 };
const majuscule = (t: string) => t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);
const LIBRE = /^(un|une|le|la)? ?(troisième|autre|dernier|dernière|quatrième)\b|^…$|^\.\.\.$/i;

/**
 * Une réponse plausible, d'après la demande : « trois chemins : a, b, c » donne trois scènes ;
 * « une scène … avec trois choix », quatre ; « … rejoint <titre> » relie à cette scène ; un
 * chemin annoncé sans être décrit (« un troisième ») reçoit une question, ou un titre inventé
 * quand l'IA complète ; ce qui suit « puis » est laissé, comme une demande trop large.
 */
export function simulerUnBloc(e: EntreeBloc): unknown {
  const [avant, apres] = e.demande.split(/\s+puis\s+/i);
  const demande = avant.trim();
  const depart = e.origine?.ref ?? null;
  const scenes: { cle: string; titre: string; consigne: string; liste: string[]; inventee: boolean }[] = [];
  const choix: { de: string; vers: string; libelle: string; invente: boolean }[] = [];
  const questions: string[] = [];
  const consigne = (t: string) => (e.reglages.consignes ? `Raconte ${t.toLocaleLowerCase("fr")}.` : "");
  const listeSimulee = () => (e.reglages.consignes && e.histoire.mode === "classe" ? ["Décrire le lieu.", "Montrer ce que ressent ton héros."] : []);
  const nouvelle = (titre: string, inventee = false) => {
    const cle = `N${scenes.length + 1}`;
    scenes.push({ cle, titre, consigne: consigne(titre), liste: listeSimulee(), inventee });
    return cle;
  };
  const racine = depart ?? nouvelle(demande.match(/une scène (.+?) avec/i) ? majuscule(demande.match(/une scène (.+?) avec/i)![1].replace(/^(dans|à|au|en)\s+/i, "")) : "Le début");

  const avecChoix = demande.match(/une scène (.+?) avec (\w+) choix/i);
  const rejoint = demande.match(/(.+?)\s+rejoint\s+(.+)$/i);
  const apresLesPoints = demande.includes(":") ? demande.slice(demande.indexOf(":") + 1) : "";
  const elements = apresLesPoints.split(/,|\bet\b/).map((x) => x.trim().replace(/[.]+$/, "")).filter(Boolean);
  if (avecChoix) {
    const lieu = avecChoix[1].trim();
    const n = NOMBRES[avecChoix[2].toLowerCase()] ?? (Number(avecChoix[2]) || 2);
    // Dans un chapitre vide, la scène demandée est son début : rien n'y mène
    const scene = depart ? nouvelle(majuscule(lieu.replace(/^(dans|à|au|en)\s+/i, ""))) : racine;
    if (depart) choix.push({ de: racine, vers: scene, libelle: `Aller ${lieu}`, invente: false });
    for (let i = 1; i <= n; i++) choix.push({ de: scene, vers: nouvelle(`Chemin ${i}`), libelle: `Prendre le chemin ${i}`, invente: false });
  } else if (elements.length) {
    elements.forEach((brut, i) => {
      const [texteDuChemin, cible] = brut.split(/\s+rejoint\s+/i);
      const existante = cible ? e.scenes.find((s) => s.titre.toLocaleLowerCase("fr") === cible.trim().toLocaleLowerCase("fr")) : undefined;
      if (LIBRE.test(texteDuChemin)) {
        if (e.reglages.manque === "completer") {
          choix.push({ de: racine, vers: nouvelle("Le chemin des ronces", true), libelle: "Prendre le chemin des ronces", invente: true });
        } else {
          choix.push({ de: racine, vers: nouvelle(`Le chemin ${i + 1}`), libelle: `Prendre le chemin ${i + 1}`, invente: false });
          questions.push(`Où mène le chemin ${i + 1}, et que s'y passe-t-il ?`);
        }
        return;
      }
      // « la grotte rejoint Le vieux pont » : le chemin de la grotte mène à la scène déjà là, sans la recréer (F13-AC39)
      const vers = existante ? existante.ref : nouvelle(majuscule(texteDuChemin));
      choix.push({ de: racine, vers, libelle: `Aller vers ${texteDuChemin}`, invente: false });
    });
  } else if (rejoint) {
    const existante = e.scenes.find((s) => s.titre.toLocaleLowerCase("fr") === rejoint[2].trim().replace(/[.]+$/, "").toLocaleLowerCase("fr"));
    if (existante) choix.push({ de: racine, vers: existante.ref, libelle: `Rejoindre ${existante.titre}`, invente: false });
  } else {
    choix.push({ de: racine, vers: nouvelle("La suite"), libelle: "Continuer", invente: false });
  }
  return {
    scenes, choix,
    consigne_origine: { consigne: e.reglages.consignes && e.origine && !e.origine.consigne ? `Raconte ${e.origine.titre.toLocaleLowerCase("fr")}.` : "", liste: listeSimulee() },
    questions: e.reglages.manque === "completer" ? [] : questions,
    reste: apres ? `J'ai construit ${demande.toLocaleLowerCase("fr").replace(/[.]+$/, "")}. Reste : ${apres.trim().replace(/[.]+$/, "")}.` : "",
  };
}
