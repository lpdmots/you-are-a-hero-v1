"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { TexteLu } from "@/composants/copie/Blocs";
import { Copie, DROITS_ADULTE, type AutreTexte } from "@/composants/copie/Copie";
import { SANS_VOISINES, type Jeu, type Livre, type Services, type Voisines } from "@/composants/copie/contexte";
import { deposer, reduire, REFUS_IMPORT } from "@/composants/importer";
import { listerImages } from "../../../actions-images";
import { enumerer, nomDeTexte } from "@/composants/copie/noms";
import { avantDePartir } from "@/composants/copie/sortie";
import type { EtatTexte } from "@/composants/copie/useEnregistrementTexte";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { EtatScene } from "@/composants/EtatScene";
import { useMessage } from "@/composants/Messages";
import { estVide } from "@/domaine/copie";
import { heureEnMots, jourEnMots } from "@/domaine/dates";
import { nomPourEleves } from "@/domaine/eleves";
import { messageEtat, NOM_ETAT, sEcrit, sorteDeScene, type Etat } from "@/domaine/etats";
import { chapitresDe, departDe, referenceScene, scenesDe, type ElevePlan, type Plan } from "@/domaine/recit";
import { filtrerHorsEtat, filtresDepuis, lignesDuPlan, SANS_FILTRE, suivanteAValider } from "@/domaine/suivi";
import { de, majuscule } from "@/domaine/texte";
import type { CopieGardee, TexteDeScene } from "@/serveur/copie";
import { pourquoiSansTampon, type Categorie, type Encouragement } from "@/domaine/encouragements";
import type { Relecture } from "@/serveur/relecture";
import { reglerScene, supprimer } from "../../../actions-recit";
import { encourager } from "../../../actions-encouragements";
import { changerEtat, relireRelecture } from "../../../actions-relecture";
import {
  ajouterFormuleDepuisLaScene, ajouterObjetDepuisLaScene, chercherDestinations, reglerVoisines, creerSceneDepuisChoix, fixerPourLiaison, garderDeNouveau, libererNumero, mettreDansLaScene, nePlusGarder, numeroDeLaScene,
  relireNumeros, relireTexte, retablirTexte,
} from "../../../actions-texte";
import { useCommandesScene } from "../../_plan/commandes";
import { ChoisirDepart } from "../../_plan/Panneaux";
import { QuiSenOccupe } from "../../_plan/QuiSenOccupe";
import { varsCouleur } from "../../_plan/Plan";
import { useAidesIa } from "@/composants/AidesIa";
import { compterMots, paragraphesACorriger } from "@/domaine/correction";
import { demanderDesIdees, useConsigneIa, useTitreIa } from "./AidesDeScene";
import { useCorrection } from "./Correction";
import { useEcriture } from "./Ecriture";
import { FicheNumero } from "./FicheNumero";
import { FicheEncouragements } from "./Encouragements";
import { FicheDecision, FicheRemarque, FicheRemises, nomDeRemise } from "./Relecture";
import { VersionsPrecedentes } from "./VersionsPrecedentes";
import styles from "./scene.module.css";

/** Ce que la page vient de faire d'un texte gardé à part, dit au-dessus de la copie */
type Fait =
  | { sorte: "conflit"; copieId: string | null }
  | { sorte: "retire"; copie: CopieGardee }
  | { sorte: "echange"; phrase: string; ancienId: string | null };

const PAS_ENREGISTRE = "Vos dernières corrections ne sont pas encore enregistrées : réessayez dans un instant.";
/** Un second clic au même endroit, juste après une décision, est ignoré : valider puis déclarer prête d'un double-clic (F11.1) */
const DOUBLE_CLIC_MS = 700;
/** Le champ du titre : la liste des titres proposés s'ouvre dessous (F05) */
const champDuTitre = () => document.getElementById("scene-titre");
/** L'heure d'un geste : lue dans les gestionnaires de clic, jamais pendant l'affichage */
const instant = (): number => Date.now();

/**
 * La page d'une scène, pour l'adulte : son titre, sa consigne (F07.1), ses repères de
 * départ et de fin (F03.2), et son texte, qui s'enregistre seul (F08.2). Un texte gardé à
 * part s'y lit dans son onglet, avec ses deux gestes (F08.1). L'état se change sur son
 * tampon ; la fiche de décision porte l'étape suivante (F07.1, F11.1).
 */
export function PageScene({
  projet, plan, sceneId, eleves, texte: recu, relecture: relectureRecue, encouragements: encouragementsRecus, livre, jeu, voisines, voisinesAffichees, ouvrir, venuDuSuivi, suivi = "", venuDesChemins, venuDuLivre, ouvrirChoix, lecture, aCote,
}: {
  projet: { id: string; deClasse: boolean; aChoix: boolean }; plan: Plan; sceneId: string; eleves: ElevePlan[];
  texte: TexteDeScene;
  /** L'état de la scène, ce que les élèves ont remis, les reprises demandées (F07.1, F07.3) */
  relecture: Relecture;
  /** Les tampons d'encouragement donnés sur cette scène (F07.5) ; aucun en projet personnel */
  encouragements: Encouragement[];
  /** Le livre autour de la scène : numéros, scènes, façon d'annoncer un numéro */
  livre: Livre;
  jeu: Jeu;
  voisines: Voisines;
  voisinesAffichees: boolean;
  /** Le texte gardé à part à montrer en arrivant, depuis la ligne de rappel du Suivi */
  ouvrir?: string;
  venuDuSuivi?: boolean;
  /** Les filtres du Suivi d'où l'on vient : « Retour au Suivi » les retrouve (F06-AC54) */
  suivi?: string;
  /** Ouverte depuis la vue « Chemins » du chapitre : on y revient (F03.1) */
  venuDesChemins?: boolean;
  /** Ouverte depuis un point de « Vérifier les chemins » : « Retour au Livre » (F11.6) */
  venuDuLivre?: boolean;
  /** Le choix à désigner en arrivant, son panneau ouvert (F09.2) */
  ouvrirChoix?: string;
  /** Ouverte depuis la lecture d'essai : on y revient, où l'on en était (F09.1) ; ce que l'adresse de la lecture garde */
  lecture?: string;
  /**
   * Ouverte à côté de l'aperçu du livre (F11.2) : le même éditeur, son état et son menu, sans
   * la consigne, les remises ni la relecture, qui restent dans la page de la scène.
   */
  aCote?: {
    onFermer: () => void;
    /** Où s'ouvrent les réglages d'un bloc : à droite du texte, par-dessus l'aperçu */
    panneau: HTMLElement | null;
    /** Le texte ou l'état a changé : l'aperçu se recalcule après une pause */
    onModifie: () => void;
    /** Au-dessus de la copie : le problème parcouru, la place du passage dans le livre */
    dessus?: ReactNode;
  };
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const scene = scenesDe(plan).find((s) => s.id === sceneId)!;
  const chapitre = chapitresDe(plan).find((c) => c.id === scene.chapitreId)!;
  const depart = departDe(plan);
  const [titre, setTitre] = useState(scene.titre ?? "");
  const [consigne, setConsigne] = useState(scene.consigne);
  const [etat, setEtat] = useState<"" | "attente" | "enregistre" | "erreur">("");
  const [choixDepart, setChoixDepart] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ce qui attend d'être enregistré : le titre et la consigne partent ensemble, aucun ne chasse l'autre
  const enAttente = useRef<{ titre?: string; consigne?: string }>({});
  const retour = lecture
    ? `/projet/${projet.id}/lecture?reprendre=1&${lecture}`
    : venuDuLivre
    ? `/projet/${projet.id}/livre`
    : venuDuSuivi
      ? `/projet/${projet.id}/suivi?${suivi ? `${suivi}&` : ""}revenu=1`
      : `/projet/${projet.id}/chapitre/${chapitre.id}${venuDesChemins ? "?vue=chemins" : ""}`;
  const commandes = useCommandesScene({ projetId: projet.id, plan, eleves, onChoisirDepart: () => setChoixDepart(true), apresSuppression: () => (aCote ? aCote.onFermer() : routeur.push(retour)) });

  // Le texte : la page le reçoit à l'ouverture, puis ne le remplace que par un geste (échange, conflit)
  const [copie, setCopie] = useState({ texte: recu.texte, version: recu.version, generation: 0 });
  const [copies, setCopies] = useState(recu.copies);
  const [onglet, setOnglet] = useState<string>(ouvrir && recu.copies.some((c) => c.id === ouvrir) ? ouvrir : "scene");
  const [vide, setVide] = useState(() => estVide(recu.texte));
  const [fait, setFait] = useState<Fait | null>(null);
  const [geste, setGeste] = useState(false);
  const [versions, setVersions] = useState(false);
  const [numero, setNumero] = useState(false);
  // Le panneau de droite : les réglages de la copie s'y ouvrent, à la place de la consigne
  const [panneau, setPanneau] = useState<HTMLElement | null>(null);
  const [reglages, setReglages] = useState(false);
  // La consigne se replie quand la scène ne s'écrit plus : la décision passe devant
  const [consigneOuverte, setConsigneOuverte] = useState(() => sEcrit(relectureRecue.etat));
  const montree = copies.find((c) => c.id === onglet) ?? null;
  const nom = (c: CopieGardee) => nomDeTexte(c, eleves, projet.deClasse);

  // L'état de la scène et sa relecture (F07.1) : la page les tient à jour d'après ce que le serveur répond
  const [relecture, setRelecture] = useState(relectureRecue);
  const [sauvegarde, setSauvegarde] = useState<EtatTexte["etat"]>("enregistre");
  // La même chose, lue dans un geste : une frappe pas encore enregistrée au retour d'une aide
  const sauvegardeTenue = useRef<EtatTexte["etat"]>("enregistre");
  const [reprise, setReprise] = useState(false);
  const [rappel, setRappel] = useState<string[] | null>(null);
  const [suspendue, setSuspendue] = useState<string | null>(null);
  // Une décision vient d'être prise sur une scène à valider : la fiche propose la suivante (F06-AC63)
  const [decidee, setDecidee] = useState(false);
  const [encouragements, setEncouragements] = useState(encouragementsRecus);
  const [tamponEnCours, setTamponEnCours] = useState<Categorie | null>(null);
  // La version du texte que la page montre : la base la compare avant « Validé » ou « Prête » (F07-AC26)
  const versionLue = useRef(recu.version);
  // Après un conflit de l'adulte, la page montre un texte qu'il n'a pas relu (F08-AC21)
  const aRelire = useRef(false);
  const dernierePose = useRef(0);
  const { etat: etatScene, remises, remarques } = relecture;
  const sorte = sorteDeScene(scene, projet.deClasse);
  const eleveDeLaScene = eleves.find((e) => e.id === scene.priseParEleve);
  const qui = scene.ancien ? scene.ancien.prenom : eleveDeLaScene ? nomPourEleves(eleveDeLaScene, eleves) : null;
  const nomEleve = (id: string | null): string => {
    const eleve = eleves.find((e) => e.id === id);
    return eleve ? nomPourEleves(eleve, eleves) : scene.ancien?.id === id ? scene.ancien.prenom : "Un élève";
  };
  const remiseMontree = onglet.startsWith("r:") ? (remises.find((r) => `r:${r.id}` === onglet) ?? null) : null;
  const derniereRemise = remises[remises.length - 1] ?? null;

  // L'envoi en cours : une aide demandée juste après une frappe attend qu'il ait abouti
  const envoi = useRef<Promise<boolean>>(Promise.resolve(true));
  /** Envoie ce qui attend, après l'envoi en cours ; faux si cela n'a pas pu être enregistré */
  const envoyer = (): Promise<boolean> => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    const suite = envoi.current.then(async () => {
      const valeurs = enAttente.current;
      enAttente.current = {};
      if (Object.keys(valeurs).length === 0) return true;
      const ok = await reglerScene(scene.id, valeurs).then((r) => r.ok, () => false);
      // Une frappe arrivée entre-temps garde « Enregistrement… » jusqu'à son propre envoi
      if (Object.keys(enAttente.current).length === 0) setEtat(ok ? "enregistre" : "erreur");
      // Ce qui n'a pas pu partir repartira au prochain envoi, sous ce que l'adulte a tapé depuis
      if (!ok) enAttente.current = { ...valeurs, ...enAttente.current };
      return ok;
    });
    envoi.current = suite;
    return suite;
  };
  const enregistrer = (valeurs: { titre?: string; consigne?: string }) => {
    setEtat("attente");
    enAttente.current = { ...enAttente.current, ...valeurs };
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void envoyer(), 700);
  };
  // Le ✦ du titre (F05) et « ✦ Formuler » sous la consigne (F13.2) : ce qu'on retient s'enregistre aussitôt
  const titreIa = useTitreIa({
    sceneId: scene.id,
    avantDePartir: envoyer,
    champ: champDuTitre,
    actuel: titre,
    onUtiliser: (t) => {
      setTitre(t);
      enregistrer({ titre: t });
      void envoyer();
    },
  });
  const consigneIa = useConsigneIa({
    sceneId: scene.id,
    avantDePartir: envoyer,
    deClasse: projet.deClasse,
    actuelle: consigne,
    onUtiliser: (c) => {
      setConsigne(c);
      enregistrer({ consigne: c });
      void envoyer();
    },
    onSansIndication: () => document.getElementById("scene-consigne")?.focus(),
    onDemande: () => titreIa.fermer(),
  });
  // Quitter la page n'abandonne pas ce qui attendait
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
      if (Object.keys(enAttente.current).length) void reglerScene(scene.id, enAttente.current);
    },
    [scene.id],
  );

  const aides = useAidesIa();
  // Ce que la copie demande au serveur : chercher une destination, créer une scène depuis un choix
  const services: Services = {
    chercher: (demande) => chercherDestinations(projet.id, demande),
    creerScene: (chapitreId, titreScene, consigneScene) => creerSceneDepuisChoix(chapitreId, titreScene, consigneScene),
    supprimerScene: async (id) => {
      const reponse = await supprimer("scene", id);
      return reponse.ok ? { ok: true } : { ok: false, erreur: reponse.erreur };
    },
    relireNumeros: async () => (await relireNumeros(projet.id)).numeros,
    numeroDe: (id) => numeroDeLaScene(id),
    fixerNumero: (id, n) => fixerPourLiaison(id, n),
    libererNumero: (id) => libererNumero(id),
    ajouterObjet: (nom, description) => ajouterObjetDepuisLaScene(projet.id, nom, description),
    ajouterFormule: (formule, signe) => ajouterFormuleDepuisLaScene(projet.id, formule, signe),
    // Une image posée dans une scène garde son fond transparent (F10-AC31)
    importerImage: async (fichier) => {
      const reduite = await reduire(fichier, true);
      if (!reduite) return { ok: false, erreur: REFUS_IMPORT };
      const depot = await deposer(projet.id, reduite);
      URL.revokeObjectURL(reduite.apercu);
      return depot;
    },
    imagesDuProjet: () => listerImages(projet.id),
    reglerVoisines: (affiche) => reglerVoisines(affiche),
    // Les idées de choix (F13.3) : sur la page de la scène, pas à côté de l'aperçu ; rien quand les aides sont éteintes
    demanderIdees: aides.proposer && !aCote ? (demande) => demanderDesIdees(scene.id, demande) : undefined,
  };

  // À côté de l'aperçu : « Tout annuler » rend la scène telle qu'à l'ouverture de l'éditeur (F11-AC47)
  const [modifiee, setModifiee] = useState(false);
  const [confirmeTout, setConfirmeTout] = useState(false);
  const toutAnnuler = async () => {
    setConfirmeTout(false);
    setGeste(true);
    if (!(await avantDePartir())) {
      setGeste(false);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const fait = await retablirTexte(scene.id, versionLue.current, recu.texte);
    setGeste(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    remplacer(fait.scene);
    setModifiee(false);
    aCote?.onModifie();
    dire({ texte: `${referenceScene(scene.reference)} a retrouvé le texte qu’elle avait à l’ouverture.` });
  };

  const remplacer = (suite: TexteDeScene) => {
    versionLue.current = suite.version;
    setCopie((avant) => ({ texte: suite.texte, version: suite.version, generation: avant.generation + 1 }));
    setCopies(suite.copies);
    setVide(estVide(suite.texte));
    mots.current = { tout: compterMots(paragraphesACorriger(suite.texte).map((p) => p.texte).join(" ")), selection: 0 };
    setRecit(mots.current.tout > 0);
  };

  // Le texte de l'adulte a été refusé : ses corrections sont gardées à part, la scène montre
  // de nouveau le texte à jour, où il peut écrire aussitôt (F08-AC21, AC29)
  const apresEtat = (suite: EtatTexte) => {
    if (suite.etat !== "garde" && suite.etat !== "refuse") return;
    void relireTexte(scene.id).then((lu) => {
      if (!lu.ok) return routeur.push(retour);
      const miennes = lu.scene.copies.filter((c) => c.sorte === "refus" && !c.eleveId);
      remplacer(lu.scene);
      // Le texte montré n'est plus celui que l'adulte corrigeait : « Validé » lui demandera de le relire
      aRelire.current = suite.etat === "garde";
      void relireRelecture(scene.id).then((r) => r && setRelecture(r));
      setOnglet("scene");
      setFait(suite.etat === "garde" ? { sorte: "conflit", copieId: miennes[miennes.length - 1]?.id ?? null } : null);
    });
  };

  // L'aide à la correction (F13.1) : sur la page de la scène, pas à côté de l'aperçu, trop étroit pour le côte à côte
  const [selection, setSelection] = useState<string[]>([]);
  // Les mots du récit et de la sélection, tenus sans redessiner la page : la longueur d'une correction s'en sert
  const mots = useRef({ tout: compterMots(paragraphesACorriger(recu.texte).map((p) => p.texte).join(" ")), selection: 0 });
  // La scène a-t-elle du récit écrit ? Tenu d'après le compte des mots que la copie donne à chaque changement
  const [recit, setRecit] = useState(() => paragraphesACorriger(recu.texte).length > 0);
  const correction = useCorrection({
    sceneId: scene.id,
    version: () => versionLue.current,
    selection: selection.length ? selection : null,
    livre,
    consigne,
    mots: () => mots.current,
    avantDePartir,
    enAttente: () => sauvegardeTenue.current !== "enregistre",
    relire: async () => {
      if (!(await avantDePartir())) return;
      const lu = await relireTexte(scene.id);
      if (lu.ok) remplacer(lu.scene);
    },
    onRemplace: (suite) => {
      remplacer(suite);
      setOnglet("scene");
      setSelection([]);
    },
  });
  // Sans paragraphe de récit écrit, même avec des choix : « ✦ Écrire » plutôt que « Corriger » (F13.6, 18 octobre 2026)
  const corrige = !aCote && onglet === "scene" && recit;
  // Une scène vide : « ✦ Écrire » à la place de « Corriger » (F13.6)
  const ecriture = useEcriture({
    sceneId: scene.id,
    version: () => versionLue.current,
    consigne,
    eleve: scene.priseParEleve && eleveDeLaScene ? nomPourEleves(eleveDeLaScene, eleves) : null,
    avantDePartir,
    enAttente: () => sauvegardeTenue.current !== "enregistre",
    relire: async () => {
      if (!(await avantDePartir())) return;
      const lu = await relireTexte(scene.id);
      if (lu.ok) remplacer(lu.scene);
    },
    onRemplace: (suite) => {
      remplacer(suite);
      setOnglet("scene");
    },
    onSansConsigne: () => {
      setConsigneOuverte(true);
      setTimeout(() => document.getElementById("scene-consigne")?.focus(), 0);
    },
  });
  const ecrit = !aCote && onglet === "scene" && !recit;
  const aide = corrige ? correction : ecrit ? ecriture : null;

  const retirer = async (c: CopieGardee) => {
    setGeste(true);
    const reponse = await nePlusGarder(c.id, scene.id);
    setGeste(false);
    if (!reponse.ok) return dire({ texte: reponse.erreur });
    setCopies((avant) => avant.filter((x) => x.id !== c.id));
    setOnglet("scene");
    setFait({ sorte: "retire", copie: c });
  };
  const annulerRetrait = async (c: CopieGardee) => {
    setGeste(true);
    const reponse = await garderDeNouveau(c.id, scene.id);
    setGeste(false);
    if (!reponse.ok) return dire({ texte: reponse.erreur });
    setCopies(reponse.scene.copies);
    setOnglet(c.id);
    setFait(null);
  };
  const mettre = async (c: CopieGardee) => {
    setGeste(true);
    // Ce que l'adulte vient de taper dans la scène s'enregistre d'abord : c'est ce texte qui sera gardé à part
    if (!(await avantDePartir())) {
      setGeste(false);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const reponse = await mettreDansLaScene(c.id, scene.id);
    setGeste(false);
    if (!reponse.ok) return dire({ texte: reponse.erreur });
    const n = nom(c);
    remplacer(reponse.scene);
    setOnglet("scene");
    setFait({
      sorte: "echange",
      ancienId: reponse.ancien,
      phrase:
        c.sorte === "ancien"
          ? `L’ancien texte est de nouveau le texte de la scène.${reponse.ancien ? " Celui qu’il remplace est gardé à part." : ""}`
          : `${majuscule(n.enPhrase)} ${n.enPhrase === "vos corrections" ? "sont" : "est"} maintenant le texte de la scène.${
              reponse.ancien ? ` L’ancien est gardé à part${n.arrete ? `, et ${n.arrete} peut de nouveau écrire` : ""}.` : n.arrete ? ` ${n.arrete} peut de nouveau écrire.` : ""
            }`,
    });
  };

  const ref = referenceScene(scene.reference);
  // La scène « À valider » qui suit : dans la liste du Suivi quand on en vient, avec ses filtres de chapitre et d'élève ;
  // sinon dans l'ordre du projet
  const suivante = decidee
    ? suivanteAValider(filtrerHorsEtat(lignesDuPlan(plan), venuDuSuivi ? filtresDepuis(Object.fromEntries(new URLSearchParams(suivi))) : SANS_FILTRE), scene.id)
    : null;

  /**
   * Mettre la scène dans l'état choisi, depuis le tampon ou depuis la fiche (F07.1). Ce que
   * l'adulte vient de corriger s'enregistre d'abord : sans cela, l'état attend (F07-AC65).
   */
  // Un clic donne, un second retire (F07-AC76) : la fiche montre ce que la base a gardé
  const encouragerScene = async (categorie: Categorie, donner: boolean) => {
    setTamponEnCours(categorie);
    const fait = await encourager(scene.id, categorie, donner);
    setTamponEnCours(null);
    if (fait.ok) setEncouragements(fait.donnes);
    else dire({ texte: fait.erreur });
  };

  const choisirEtat = async (voulu: Etat, depuis: "tampon" | "fiche", options: { confirme?: boolean; remarque?: string } = {}) => {
    if (depuis === "fiche" && instant() - dernierePose.current < DOUBLE_CLIC_MS) return;
    if (voulu === etatScene && !rappel) return;
    if (sauvegarde === "echec") return dire({ texte: "Vos corrections ne sont pas encore enregistrées : l’état changera ensuite." });
    // Demander une reprise ouvre d'abord la remarque, facultative (F07.3)
    if (voulu === "reprendre" && options.remarque === undefined) {
      setRappel(null);
      setOnglet("scene");
      setReprise(true);
      return;
    }
    if ((voulu === "valide" || voulu === "prete") && aRelire.current) {
      aRelire.current = false;
      setRappel(null);
      setOnglet("scene");
      setSuspendue("Validation suspendue : le texte a changé pendant que vous le corrigiez. Relisez-le avant de choisir l’état.");
      window.scrollTo(0, 0);
      return;
    }
    setGeste(true);
    if (!(await avantDePartir())) {
      setGeste(false);
      return dire({ texte: "Vos corrections ne sont pas encore enregistrées : l’état changera ensuite." });
    }
    const suite = await changerEtat(scene.id, voulu, { version: versionLue.current, tour: relecture.tour }, options);
    setGeste(false);
    if (!suite.ok) return dire({ texte: suite.erreur });
    if (!suite.fait && "rappel" in suite) {
      setReprise(false);
      setRappel(suite.rappel);
      return;
    }
    if (!suite.fait) {
      // Un retrait, une nouvelle remise ou une modification sont arrivés depuis la lecture (F07-AC26)
      const change = suite.relecture.etat !== etatScene;
      aRelire.current = false;
      remplacer(suite.scene);
      setRelecture(suite.relecture);
      setRappel(null);
      setOnglet("scene");
      setSuspendue(
        `Validation suspendue : ${change ? `la scène est maintenant « ${NOM_ETAT[suite.relecture.etat]} »` : "le texte a changé"} depuis votre lecture. Relisez le texte avant de choisir l’état.`,
      );
      window.scrollTo(0, 0);
      return;
    }
    // Sur la fiche, le bouton suivant prend la place de celui qu'on vient de cliquer
    if (depuis === "fiche") dernierePose.current = instant();
    setRelecture(suite.relecture);
    setReprise(false);
    setRappel(null);
    setSuspendue(null);
    setDecidee(etatScene === "valider");
    aCote?.onModifie();
    dire({
      texte:
        // L'élève indiqué n'est plus dans le chapitre : la scène renvoyée n'est plus à personne (F01-AC25)
        suite.relecture.etat === "cours" && scene.ancien
          ? `${ref} est de nouveau en cours, sans élève : ${scene.ancien.prenom} n’est plus dans ce chapitre.`
          : voulu === "reprendre"
          ? `Reprise demandée${qui ? ` : ${qui} la retrouvera dans « Mon travail »` : ""}.${options.remarque?.trim() ? " Les élèves du chapitre peuvent lire la remarque." : ""}`
          : messageEtat(voulu, ref, sorte),
    });
  };

  // Ce qui est gardé à part, dit au-dessus de la copie, d'où qu'on vienne (F08-AC06)
  const aDire = copies.filter((c) => !(fait?.sorte === "conflit" && fait.copieId === c.id));
  const arretes = aDire.flatMap((c) => nom(c).arrete ?? []);
  const voir = (c: CopieGardee, libelle: string) =>
    onglet === c.id ? null : (
      <button type="button" className="lien" onClick={() => setOnglet(c.id)}>
        {libelle}
      </button>
    );

  // La dernière remise a son onglet ; une plus ancienne, ouverte depuis « Remises », aussi
  const remisesEnOnglet = remises.filter((r) => r === derniereRemise || r === remiseMontree);
  const onglets =
    copies.length > 0 || remisesEnOnglet.length > 0 ? (
      <div className="copie__onglets" role="tablist" aria-label="Textes de la scène">
        <button type="button" role="tab" aria-selected={onglet === "scene"} onClick={() => setOnglet("scene")}>
          Texte de la scène
        </button>
        {remisesEnOnglet.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={onglet === `r:${r.id}`} onClick={() => setOnglet(`r:${r.id}`)}>
            {nomDeRemise(r, remises)}
          </button>
        ))}
        {copies.map((c) => {
          const n = nom(c);
          return (
            <button key={c.id} type="button" role="tab" className="ga-onglet" aria-selected={onglet === c.id} aria-label={`${n.titre}, ${n.sous}`} onClick={() => setOnglet(c.id)}>
              <Icone nom="apart" />
              <span className="ga-onglet__t">
                <b>{n.titre}</b>
                <small>{n.sous}</small>
              </span>
            </button>
          );
        })}
        <Bulle question="Que montrent ces onglets ?">
          <span>
            {projet.deClasse ? "Vous corrigez" : "Vous écrivez dans"} le texte de la scène.
            {remises.length ? " Ce que l’élève a remis reste conservé tel quel, dans son onglet." : ""}
            {copies.length ? " Un texte gardé à part attend votre décision dans le sien." : ""}
          </span>
        </Bulle>
      </div>
    ) : (
      <span className="copie__titre">Texte de la scène</span>
    );

  const autre: AutreTexte | null = remiseMontree
    ? {
        barre: (
          <span className="copie__lecture">
            <Icone nom="oeil" />
            Remis par {nomEleve(remiseMontree.eleveId)} · {jourEnMots(remiseMontree.remisLe)}, {heureEnMots(remiseMontree.remisLe)} · conservé tel quel
          </span>
        ),
        corps: <TexteLu texte={remiseMontree.texte} libelle={`Texte remis le ${jourEnMots(remiseMontree.remisLe)}`} livre={livre} />,
      }
    : montree
    ? {
        barre: (
          <span className="copie__lecture">
            <Icone nom="oeil" />
            En lecture · {nom(montree).mention}
          </span>
        ),
        corps: <TexteLu texte={montree.texte} libelle={`${nom(montree).titre}, ${nom(montree).sous}`} livre={livre} />,
        pied: (
          <>
            <p className="ga-pied">
              Que faire de ce texte ?
              <Bulle question="Que font ces deux commandes ?">
                <span>« Ne plus garder ce texte » l’efface : le texte de la scène ne change pas.</span>
                <span>« Mettre ce texte dans la scène » échange les deux : le texte de la scène est gardé à part à son tour.</span>
                <span>Vous pouvez aussi copier un passage ici et le coller dans la scène.</span>
              </Bulle>
            </p>
            <div className="ga-cmd">
              <button type="button" className="btn btn--danger" disabled={geste} onClick={() => void retirer(montree)}>
                Ne plus garder ce texte
              </button>
              <button type="button" className="btn" disabled={geste} onClick={() => void mettre(montree)}>
                Mettre ce texte dans la scène
              </button>
            </div>
          </>
        ),
      }
    : null;

  const menu = (
  <Menu libelle={`Autres commandes de la scène ${ref}`} discret>
    {(fermer) => (
      <>
        {projet.aChoix ? (
          <>
            <button type="button" onClick={() => { fermer(); if (depart?.id === scene.id) commandes.retirerDepart(); else commandes.designer(scene); }}>
              {depart?.id === scene.id ? "Retirer le départ du livre" : "Départ du livre"}
            </button>
            <button type="button" onClick={() => { fermer(); commandes.basculerFin(scene); }}>
              {scene.fin ? "Retirer le repère de fin" : "Fin de l’histoire"}
            </button>
            {/* Le départ porte toujours le n° 1 : il ne se fixe pas (F11-AC97) */}
            {depart?.id === scene.id ? null : scene.numeroFixe ? (
              <button
                type="button"
                onClick={() => {
                  fermer();
                  void libererNumero(scene.id).then((fait) =>
                    dire({ texte: fait.ok ? `${ref} n’a plus de numéro fixé : le passage prend place à la suite des autres.` : fait.erreur }),
                  );
                }}
              >
                Libérer le numéro
              </button>
            ) : (
              <button type="button" onClick={() => { fermer(); setNumero(true); }}>
                Fixer son numéro…
              </button>
            )}
            <hr />
          </>
        ) : null}
        <Link href={`/projet/${projet.id}/lecture?depart=${scene.id}&de=scene&scene=${scene.id}`} onClick={() => fermer()}>
          Lire à l’essai d’ici
        </Link>
        <button type="button" onClick={() => { fermer(); setVersions(true); }}>
          Versions précédentes
        </button>
        <button type="button" onClick={() => { fermer(); commandes.basculerHorsLivre(scene); }}>
          {scene.horsLivre ? "Réintégrer dans le livre" : "Exclure du livre"}
        </button>
        <button type="button" onClick={() => { fermer(); commandes.supprimerScene(scene); }}>
          Supprimer
        </button>
      </>
    )}
  </Menu>
  );
  const notes = (
    <>
    {suspendue ? (
      <div className="note note--bloque" role="alert">
        <Icone nom="horloge" />
        <p>{suspendue}</p>
      </div>
    ) : null}
    {fait?.sorte === "conflit" ? (
      <div className="note note--attend" role="status">
        <Icone nom="apart" />
        <p>
          {projet.deClasse
            ? "Quelqu’un a modifié cette scène pendant que vous la corrigiez. Vos corrections sont gardées à part ; la scène montre le texte à jour. "
            : "Vous avez modifié cette scène dans une autre fenêtre. Ce que vous veniez d’écrire ici est gardé à part ; la scène montre le texte à jour. "}
          {copies
            .filter((c) => c.id === fait.copieId)
            .map((c) => (
              <span key={c.id}>{voir(c, projet.deClasse ? "Voir vos corrections" : "Voir ce texte")}</span>
            ))}
        </p>
      </div>
    ) : null}
    {fait?.sorte === "retire" ? (
      <div className="note note--ok" role="status">
        <Icone nom="coche" />
        <p>
          {majuscule(nom(fait.copie).enPhrase)} {nom(fait.copie).enPhrase === "vos corrections" ? "ne sont plus gardées" : "n’est plus gardé"}
          {nom(fait.copie).arrete ? ` : ${nom(fait.copie).arrete} peut de nouveau écrire dans cette scène.` : "."}
        </p>
        <span className="note__cmd">
          <button type="button" className="btn btn--petit" disabled={geste} onClick={() => void annulerRetrait(fait.copie)}>
            Annuler
          </button>
          <small className="ga-tant">tant que vous restez sur cette page</small>
        </span>
      </div>
    ) : null}
    {fait?.sorte === "echange" ? (
      <div className="note note--ok" role="status">
        <Icone nom="coche" />
        <p>
          {fait.phrase}{" "}
          {copies
            .filter((c) => c.id === fait.ancienId)
            .map((c) => (
              <span key={c.id}>{voir(c, "Voir l’ancien texte")}</span>
            ))}
        </p>
      </div>
    ) : null}
    {aDire.length === 1 ? (
      <div className="note note--attend">
        <Icone nom="apart" />
        <p>
          {aDire[0].sorte === "ancien"
            ? "L’ancien texte de la scène est gardé à part. "
            : nom(aDire[0]).arrete
              ? `Un texte ${de(nom(aDire[0]).arrete!)} est gardé à part : tant qu’il attend, ${nom(aDire[0]).arrete} ne peut pas écrire dans cette scène. `
              : aDire[0].eleveId
                ? "Le texte d’un élève est gardé à part. "
                : projet.deClasse
                  ? `Vos corrections du ${jourEnMots(aDire[0].gardeLe)} sont gardées à part. `
                  : `Votre texte du ${jourEnMots(aDire[0].gardeLe)} est gardé à part. `}
          {voir(aDire[0], !aDire[0].eleveId && aDire[0].sorte === "refus" && projet.deClasse ? "Voir vos corrections" : "Voir ce texte")}
        </p>
      </div>
    ) : aDire.length > 1 ? (
      <div className="note note--attend">
        <Icone nom="apart" />
        <p>
          {aDire.length} textes sont gardés à part
          {arretes.length ? ` : tant qu’ils attendent, ${enumerer(arretes)} ne ${arretes.length > 1 ? "peuvent" : "peut"} pas écrire dans cette scène. ` : ". "}
          {aDire.map((c) => (
            <span key={c.id}>{voir(c, nom(c).titre)} </span>
          ))}
        </p>
      </div>
    ) : null}
    </>
  );
  const copieEl = (
    <Copie
      key={copie.generation}
      texte={copie.texte}
      version={copie.version}
      cible={{ scene: scene.id }}
      livre={livre}
      droits={DROITS_ADULTE}
      lieu={{ projetId: projet.id, sceneId: scene.id, chapitreId: chapitre.id }}
      services={services}
      protection={projet.deClasse}
      jeu={jeu}
      // À côté de l'aperçu, les extraits des scènes voisines ne figurent pas : le livre est à côté (3 octobre 2026)
      voisines={aCote ? SANS_VOISINES : voisines}
      voisinesAffichees={voisinesAffichees}
      lienDeScene={(id) => `/projet/${projet.id}/scene/${id}`}
      panneau={aCote ? aCote.panneau : panneau}
      onPanneau={setReglages}
      ouvrirChoix={ouvrirChoix}
      marques
      libelle={`Texte de la scène ${ref}`}
      tete={onglets}
      autre={aide?.autre ?? autre}
      aides={aide && !aide.autre ? aide.barre : undefined}
      onSelection={setSelection}
      onMots={(m) => {
        mots.current = m;
        setRecit(m.tout > 0);
      }}
      onEtat={(suite) => {
        setSauvegarde(suite.etat);
        sauvegardeTenue.current = suite.etat;
        apresEtat(suite);
      }}
      onVide={setVide}
      onVersion={(v) => {
        versionLue.current = v;
        if (aCote) {
          setModifiee(true);
          aCote.onModifie();
        }
      }}
      apresRetour={() => dire({ texte: "Vos corrections sont enregistrées." })}
      dessus={({ etat: e, reessayer }) =>
        e.etat === "echec" ? (
          <div className="note note--bloque" role="alert">
            <Icone nom="alerte" />
            <p>Vos dernières corrections ne sont pas encore enregistrées. Nouvel essai dans 10 s : gardez cette page ouverte.</p>
            <span className="note__cmd">
              <button type="button" className="btn btn--petit" onClick={reessayer}>
                Réessayer maintenant
              </button>
            </span>
          </div>
        ) : null
      }
      pied={({ etat: e, annuler, peutAnnuler }) => (
        <>
          {e.etat === "enregistre" ? (
            <p className="sauv" role="status">
              <Icone nom="coche" />
              Enregistré
            </p>
          ) : (
            <p className={`sauv ${e.etat === "echec" ? "sauv--echec" : "sauv--attente"}`} role="status">
              Pas encore enregistré
            </p>
          )}
          {aCote ? (
            <span className="a-cote__annuler">
              <button type="button" className="btn btn--petit" disabled={!peutAnnuler} onClick={annuler}>
                <Icone nom="refaire" />
                Annuler
              </button>
              {confirmeTout ? (
                <span className="a-cote__confirme" role="group" aria-label="Tout annuler">
                  <span>Revenir au texte de l’ouverture ?</span>
                  <button type="button" className="btn btn--petit" disabled={geste} onClick={() => void toutAnnuler()}>
                    Tout annuler
                  </button>
                  <button type="button" className="lien" onClick={() => setConfirmeTout(false)}>
                    Garder
                  </button>
                </span>
              ) : (
                <button type="button" className="lien" disabled={!modifiee} onClick={() => setConfirmeTout(true)}>
                  Tout annuler
                </button>
              )}
            </span>
          ) : null}
        </>
      )}
    />
  );
  const decision = (
    <FicheDecision
      sorte={sorte}
      etat={etatScene}
      vide={vide}
      aChoix={projet.aChoix}
      qui={qui}
      derniere={derniereRemise ? { par: derniereRemise.eleveId ? nomEleve(derniereRemise.eleveId) : null, le: derniereRemise.remisLe } : null}
      echec={sauvegarde === "echec"}
      ailleurs={
        remiseMontree
          ? { phrase: `Vous lisez le texte ${nomDeRemise(remiseMontree, remises).toLowerCase()}.` }
          : montree
            ? { phrase: `Vous lisez ${nom(montree).enPhrase}, ${nom(montree).sous}.` }
            : null
      }
      rappel={rappel}
      reprise={reprise}
      occupe={geste}
      onEtat={(e, options) => void choisirEtat(e, "fiche", options)}
      onReprise={(remarque) => void choisirEtat("reprendre", "tampon", { remarque })}
      onAnnulerReprise={() => setReprise(false)}
      onPasMaintenant={() => setRappel(null)}
      onTexteDeLaScene={() => setOnglet("scene")}
      suite={
        decidee && projet.deClasse ? (
          suivante ? (
            <Link className="btn btn--large decision__suite" href={`/projet/${projet.id}/scene/${suivante.scene.id}${venuDuSuivi ? `?de=suivi${suivi ? `&suivi=${encodeURIComponent(suivi)}` : ""}` : ""}`}>
              Suivante à valider : {referenceScene(suivante.scene.reference)}
              <Icone nom="fleche" />
            </Link>
          ) : (
            <p className="decision__aide">Plus de scène à valider{venuDuSuivi ? " dans cette liste" : ""}.</p>
          )
        ) : null
      }
    />
  );
  const fenetres = (
    <>
      {versions ? (
        <VersionsPrecedentes
          sceneId={scene.id}
          eleves={eleves}
          deClasse={projet.deClasse}
          livre={livre}
          onFermer={() => setVersions(false)}
          onRemis={(suite) => {
            remplacer(suite);
            setOnglet("scene");
            setFait(null);
            setVersions(false);
            aCote?.onModifie();
            dire({ texte: "Ce texte est maintenant le texte de la scène. Celui qu’il remplace est dans les versions précédentes." });
          }}
        />
      ) : null}
      {choixDepart ? (
        <ChoisirDepart
          plan={plan}
          onChoisir={(id) => {
            const autreScene = scenesDe(plan).find((x) => x.id === id);
            setChoixDepart(false);
            if (autreScene) commandes.designer(autreScene);
          }}
          onFermer={() => setChoixDepart(false)}
        />
      ) : null}
      {numero ? (
        <div className="a-cote__fiche-numero">
          <FicheNumero
            sceneId={scene.id}
            nom={ref}
            onFermer={() => setNumero(false)}
            onFixe={(n) => {
              setNumero(false);
              dire({ texte: `${ref} garde le n° ${n}.` });
            }}
          />
        </div>
      ) : null}
      {commandes.dialogue}
    </>
  );

  // À côté de l'aperçu du livre : l'en-tête de la scène, puis sa copie (F11.2)
  if (aCote) {
    return (
      <div className="a-cote sur-chapitre" style={varsCouleur(chapitre.couleur)}>
        <header className="a-cote__tete">
          <span className="fiche__ref">{ref}</span>
          <h2 className="a-cote__titre">{titre.trim() || "Sans titre"}</h2>
          <EtatScene etat={etatScene} vide={vide} sorte={sorte} nom={ref} onChoisir={(e) => void choisirEtat(e, "tampon")} />
          {menu}
          <button type="button" className="btn btn--petit a-cote__fermer" onClick={aCote.onFermer}>
            <Icone nom="fermer" />
            Fermer
          </button>
        </header>
        <p className="a-cote__sous">
          <span className="a-cote__chapitre">{chapitre.titre}</span>
          {scene.horsLivre ? <span className="repere">hors du livre</span> : null}
          <span>
            Consigne, remises et relecture : <Link href={`/projet/${projet.id}/scene/${scene.id}?de=livre`}>page de la scène</Link>
          </span>
        </p>
        {aCote.dessus}
        {rappel || reprise || suspendue ? decision : null}
        {notes}
        {copieEl}
        {fenetres}
      </div>
    );
  }

  return (
    <div className="sur-chapitre" style={varsCouleur(chapitre.couleur)}>
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href={retour}>
          <Icone nom="fleche-g" />
          {lecture
            ? "Retour à la lecture d’essai"
            : venuDuLivre
              ? "Retour au Livre"
              : venuDuSuivi
                ? /(^|&)livre=finir(&|$)/.test(suivi) ? "Retour aux scènes à finir" : "Retour au Suivi"
                : `Retour à ${chapitre.titre}`}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{ref}</span>
      </nav>

      <header className={styles.tete}>
        <span className="fiche__ref">{ref}</span>
        <h1>
          <label className="vh" htmlFor="scene-titre">
            Titre de la scène
          </label>
          {/* Le champ prend la largeur de son titre : le ✦ se pose juste après (F05) */}
          <span className={styles.champTitre} data-valeur={titre || "Titre de la scène"}>
            <input
              id="scene-titre"
              className={styles.titre}
              type="text"
              // La largeur vient de la copie invisible du titre, pas de la taille par défaut du champ
              size={1}
              value={titre}
              maxLength={120}
              placeholder="Titre de la scène"
              onChange={(e) => {
                setTitre(e.target.value);
                enregistrer({ titre: e.target.value });
                // Écrire le titre soi-même, c'est laisser la proposition
                titreIa.fermer();
              }}
              onBlur={() => void envoyer()}
            />
          </span>
        </h1>
        {titreIa.bouton}
        <span className={styles.saut} aria-hidden="true" />
        <EtatScene etat={etatScene} vide={vide} sorte={sorte} nom={ref} onChoisir={(e) => void choisirEtat(e, "tampon")} />
        {menu}
      </header>
      {titreIa.proposition}
      <div className={styles.reperes}>
        {projet.deClasse ? <QuiSenOccupe scene={scene} chapitre={chapitre} eleves={eleves} /> : null}
        {depart?.id === scene.id ? (
          <span className="repere repere--depart">
            <Icone nom="drapeau" />
            Départ du livre
          </span>
        ) : null}
        {scene.fin ? (
          <span className="repere repere--fin">
            <Icone nom="fin" />
            Fin de l’histoire
          </span>
        ) : null}
        {scene.horsLivre ? <span className="repere">hors du livre</span> : null}
        {projet.aChoix && scene.numeroFixe ? (
          <span className="repere">
            <Icone nom="cadenas" />
            n° {scene.numeroFixe} fixé
          </span>
        ) : null}
        <span className={styles.etat} role="status">
          {etat === "attente" ? "Enregistrement…" : etat === "enregistre" ? "Enregistré" : etat === "erreur" ? "Cela n’a pas pu être enregistré." : ""}
        </span>
      </div>

      <div className={`${styles.colonnes}${corrige && correction.large ? ` ${styles.large}` : ""}`}>
        <section className={styles.texte} aria-label="Texte de la scène">
          {notes}
          {aide?.note ?? null}
          {copieEl}
        </section>
        <aside className="cote-copie" hidden={corrige && correction.large}>
          <div className="cote-copie__colle">
            {numero ? (
              <FicheNumero
                sceneId={scene.id}
                nom={ref}
                onFermer={() => setNumero(false)}
                onFixe={(n) => {
                  setNumero(false);
                  dire({ texte: `${ref} garde le n° ${n}.` });
                }}
              />
            ) : null}
            <div ref={setPanneau} />
            {/* Les fiches laissent la place au panneau des réglages, le temps qu'il est ouvert (F05.2) */}
            <div className="cote-copie__fiches" hidden={reglages || numero}>
              <FicheDecision
                sorte={sorte}
                etat={etatScene}
                vide={vide}
                aChoix={projet.aChoix}
                qui={qui}
                derniere={derniereRemise ? { par: derniereRemise.eleveId ? nomEleve(derniereRemise.eleveId) : null, le: derniereRemise.remisLe } : null}
                echec={sauvegarde === "echec"}
                ailleurs={
                  aide?.autre
                    ? { correction: true, phrase: corrige ? "Gardez ou laissez la correction proposée : l’état se choisira ensuite." : "Gardez ou laissez le texte proposé : l’état se choisira ensuite." }
                    : remiseMontree
                    ? { phrase: `Vous lisez le texte ${nomDeRemise(remiseMontree, remises).toLowerCase()}.` }
                    : montree
                      ? { phrase: `Vous lisez ${nom(montree).enPhrase}, ${nom(montree).sous}.` }
                      : null
                }
                rappel={rappel}
                reprise={reprise}
                occupe={geste}
                pistes={projet.deClasse && aides.proposer && !vide ? scene.id : null}
                onEtat={(e, options) => void choisirEtat(e, "fiche", options)}
                onReprise={(remarque) => void choisirEtat("reprendre", "tampon", { remarque })}
                onAnnulerReprise={() => setReprise(false)}
                onPasMaintenant={() => setRappel(null)}
                onTexteDeLaScene={() => setOnglet("scene")}
                suite={
                  decidee && projet.deClasse ? (
                    suivante ? (
                      <Link className="btn btn--large decision__suite" href={`/projet/${projet.id}/scene/${suivante.scene.id}${venuDuSuivi ? `?de=suivi${suivi ? `&suivi=${encodeURIComponent(suivi)}` : ""}` : ""}`}>
                        Suivante à valider : {referenceScene(suivante.scene.reference)}
                        <Icone nom="fleche" />
                      </Link>
                    ) : (
                      <p className="decision__aide">Plus de scène à valider{venuDuSuivi ? " dans cette liste" : ""}.</p>
                    )
                  ) : null
                }
              />
              {etatScene === "reprendre" && remarques.length ? <FicheRemarque remarque={remarques[remarques.length - 1]} qui={qui} /> : null}
            <details className="carnet-fiche carnet-fiche--pli" open={consigneOuverte} onToggle={(e) => setConsigneOuverte(e.currentTarget.open)}>
              <summary>
                <header>
                  <h2 id="scene-consigne-t">
                    Consigne <span className="facultatif">facultative</span>
                  </h2>
                  {!consigneOuverte && !consigne.trim() ? <span className="fiche-tete__fin">sans consigne</span> : null}
                </header>
              </summary>
              <div className="carnet-fiche__corps">
                {/* Toute la consigne se lit sans faire défiler le champ */}
                <ChampQuiGrandit
                  id="scene-consigne"
                  aria-label="Consigne"
                  className="pchamp"
                  rows={4}
                  maxLength={4000}
                  value={consigne}
                  placeholder={consigneIa.bouton ? "Ce que la scène doit raconter, même en quelques mots." : "Ce que la scène doit raconter."}
                  onChange={(e) => {
                    setConsigne(e.target.value);
                    enregistrer({ consigne: e.target.value });
                  }}
                  onBlur={() => void envoyer()}
                />
                {consigneIa.bouton}
                {consigneIa.proposition}
                <p className={styles.aide}>
                  {projet.deClasse
                    ? "Les élèves du chapitre la lisent en ouvrant la scène. Sans consigne écrite, ils suivent celle que vous leur avez donnée."
                    : "Un rappel de ce que la scène doit raconter."}
                </p>
              </div>
            </details>
              {/* Après la consigne : moins important qu'elle (demandé par le porteur, 17 octobre 2026) */}
              {projet.deClasse ? (
                <FicheEncouragements
                  eleve={scene.priseParEleve && qui ? { id: scene.priseParEleve, nom: qui } : null}
                  raison={pourquoiSansTampon({ priseParEleve: scene.priseParEleve, priseParEnseignant: scene.priseParEnseignant, texteVide: vide })}
                  donnes={encouragements}
                  nomEleve={nomEleve}
                  enCours={tamponEnCours}
                  onEncourager={(categorie, donner) => void encouragerScene(categorie, donner)}
                />
              ) : null}
              <FicheRemises
                remises={remises}
                remarques={remarques}
                nomEleve={nomEleve}
                montree={remiseMontree?.id ?? null}
                onVoir={(id) => setOnglet(`r:${id}`)}
              />
            </div>
          </div>
        </aside>
      </div>

      {versions ? (
        <VersionsPrecedentes
          sceneId={scene.id}
          eleves={eleves}
          deClasse={projet.deClasse}
          livre={livre}
          onFermer={() => setVersions(false)}
          onRemis={(suite) => {
            remplacer(suite);
            setOnglet("scene");
            setFait(null);
            setVersions(false);
            dire({ texte: "Ce texte est maintenant le texte de la scène. Celui qu’il remplace est dans les versions précédentes." });
          }}
        />
      ) : null}
      {choixDepart ? (
        <ChoisirDepart
          plan={plan}
          onChoisir={(id) => {
            const autreScene = scenesDe(plan).find((x) => x.id === id);
            setChoixDepart(false);
            if (autreScene) commandes.designer(autreScene);
          }}
          onFermer={() => setChoixDepart(false)}
        />
      ) : null}
      {ecriture.prevenir}
      {commandes.dialogue}
    </div>
  );
}
