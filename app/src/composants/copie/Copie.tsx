"use client";

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react";
import { createPlatePlugin, ParagraphPlugin, Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { poser } from "@/composants/flottant";
import { Icone, type NomIcone } from "@/composants/Icone";
import {
  ciblesDe, estAuto, estImageLigne, estRenvoi, estVide, LARGEURS, lettresDe, liaisonsDe, nouvelId, paragrapheVide, recitDe, renvoisDe, texteOuvert, tirerConstruction,
  type Choix, type Droits, type ImageBloc, type ImageLigne, type Liaison, type SigneAction, type Texte,
} from "@/domaine/copie";
import { constructionsUtiles } from "@/domaine/preparation";
import { nomScene } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import { ActionDeJeu, ImageEnBloc, ImageSurLaLigne, NoteDeLEnseignant, Paragraphe, PhraseDeChoix, RenvoiEnLigne } from "./Blocs";
import {
  Contexte, estAuCurseur, SANS_JEU, SANS_VOISINES, type ApercuDeChoix, type ContexteDeCopie, type FicheOuverte, type Jeu, type Lieu, type Livre, type SceneConnue, type SceneCreee,
  type Services, type Voisines,
} from "./contexte";
import { FicheImageBloc, FichePoserImage, FicheSymbole } from "./FicheImage";
import { FicheNouvelleFormule, FicheNouvelObjet, ListeFormules, ListeObjets } from "./FicheJeu";
import { enPersonnalisee, FicheNouveauChoix, FicheReglagesChoix, nouveauRenvoi, seulRenvoi, type GestesDeChoix } from "./FicheChoix";
import { FicheLiaison, HorsRecit, type GestesDeLiaison } from "./Liaisons";
import { blocCourant, blocsDe, estFerme, peutModifier, ReglesPlugin, type Editeur, type Signal } from "./regles";
import { ScenesVoisines } from "./ScenesVoisines";
import { SortieGardee } from "./SortieGardee";
import { useEnregistrementTexte, type Cible, type EtatTexte } from "./useEnregistrementTexte";

/** Les éditeurs dont le texte a changé sans que l'écran l'ait encore redessiné : l'éditeur ne sait pas s'y poser. */
const A_REDESSINER = new WeakSet<object>();

/** Les réglages : dans le panneau que la page fournit, à droite du texte ; sans lui, sous la copie. */
function Reglages({ panneau, children }: { panneau: HTMLElement | null; children: ReactNode }) {
  return panneau ? createPortal(<div className="panneau-copie">{children}</div>, panneau) : <div className="panneau-copie panneau-copie--dessous">{children}</div>;
}

/**
 * La copie : la page où l'on écrit le récit d'une scène (F04, F05.2, F08.2). L'éditeur est
 * Plate, sur Slate (ADR 0002). Le texte s'enregistre seul ; le pied, que la page fournit,
 * dit où il en est.
 */

type Marque = "bold" | "italic" | "underline";
const MARQUES: { cle: Marque; lettre: string; nom: string; touche: string }[] = [
  { cle: "bold", lettre: "G", nom: "Gras", touche: "b" },
  { cle: "italic", lettre: "I", nom: "Italique", touche: "i" },
  { cle: "underline", lettre: "S", nom: "Souligné", touche: "u" },
];

/** Ce que la copie vient de faire, dit au pied du texte, avec de quoi revenir en arrière. */
type Bandeau = {
  texte: string;
  /** « Annuler » : le dernier geste de l'éditeur, ou ce que la copie sait défaire elle-même */
  annuler?: boolean | (() => void);
  actions?: { libelle: string; faire: () => void }[];
};

type Commande = { cle: string; nom: string; aide: string; icone: NomIcone; faire: () => void };

export type PiedDeCopie = { etat: EtatTexte; vide: boolean; reessayer: () => void };

/** Ce qui se montre à la place du texte de la scène : un texte gardé à part, dans son onglet */
export type AutreTexte = { barre?: ReactNode; corps: ReactNode; pied?: ReactNode };

/** Les droits de l'adulte : tout lui est permis dans ses scènes. */
export const DROITS_ADULTE: Droits = { role: "adulte" };

export function Copie({
  texte, version, cible, marques, libelle, invite = "Écrivez ici.", tete, dessus, pied, autre, apresRetour, onEtat, onVide, onVersion,
  livre: livreRecu, droits, lieu, pourEleve = false, services, protection = false, enseignant = null, jeu = SANS_JEU,
  voisines = SANS_VOISINES, voisinesAffichees = true, lienDeScene, panneau = null, onPanneau, ouvrirChoix,
}: {
  texte: Texte; version: number; cible: Cible;
  /** Gras, italique et souligné sont-ils permis ici ? (F04-AC03) */
  marques: boolean;
  /** Ce que la copie contient, pour qui ne voit pas l'écran : « Texte de la scène S015 » */
  libelle: string;
  /** Ce que dit la copie tant qu'elle est vide */
  invite?: string;
  /** À gauche de la barre : le titre de la copie, ou ses onglets */
  tete?: ReactNode;
  /** Au-dessus de la copie : ce que l'adulte doit savoir d'un incident d'enregistrement */
  dessus?: (p: PiedDeCopie) => ReactNode;
  pied?: (p: PiedDeCopie) => ReactNode;
  /** Un autre texte est montré : l'éditeur reste en place, caché, avec ce qu'il n'a pas fini d'enregistrer */
  autre?: AutreTexte | null;
  apresRetour?: () => void;
  onEtat?: (etat: EtatTexte) => void;
  onVide?: (vide: boolean) => void;
  /** La version du texte, à chaque enregistrement réussi */
  onVersion?: (version: number) => void;
  /** Le livre autour de la scène : numéros, scènes, façon d'annoncer un numéro */
  livre: Livre;
  droits: Droits;
  lieu: Lieu;
  pourEleve?: boolean;
  services: Services;
  /** « Protéger » un paragraphe : pour l'enseignant d'un projet de classe (F06.1, F05-AC41) */
  protection?: boolean;
  /** Le nom que l'enseignant affiche aux élèves (F01-AC13) */
  enseignant?: string | null;
  /** Objets de l'histoire et formules d'action du projet (F04.2) */
  jeu?: Jeu;
  /** Les scènes d'où arrive le lecteur et celles où il repart, et la préférence de la personne (F04.3) */
  voisines?: Voisines;
  voisinesAffichees?: boolean;
  lienDeScene?: (id: string) => string;
  /**
   * Le panneau de droite, que la page fournit à la place de la consigne : les réglages s'y
   * ouvrent, et le texte ne bouge pas. La page est prévenue quand il s'ouvre et se referme.
   */
  panneau?: HTMLElement | null;
  onPanneau?: (ouvert: boolean) => void;
  /**
   * Ouverte depuis un point du Livre : le choix, ou la liaison cachée, à désigner en arrivant,
   * ses réglages ouverts dans le panneau (F09.2, « Récupération »)
   */
  ouvrirChoix?: string;
}) {
  // Ce que la copie a appris depuis que la page lui a donné le livre : numéros relus, scènes créées
  // depuis un choix. Quand la page relit le livre, c'est elle qui fait foi.
  const [appris, setAppris] = useState<{ pour: Livre; numeros?: Record<string, number>; scenes: SceneConnue[]; retirees: string[] }>({ pour: livreRecu, scenes: [], retirees: [] });
  const frais = appris.pour === livreRecu ? appris : { pour: livreRecu, scenes: [], retirees: [] as string[], numeros: undefined };
  const livre: Livre = useMemo(
    () => ({
      ...livreRecu,
      numeros: frais.numeros ?? livreRecu.numeros,
      scenes: [...livreRecu.scenes, ...frais.scenes.filter((x) => !livreRecu.scenes.some((y) => y.id === x.id))].filter((x) => !frais.retirees.includes(x.id)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [livreRecu, appris],
  );
  const apprendre = (suite: { numeros?: Record<string, number>; scene?: SceneConnue; retiree?: string }) =>
    setAppris((avant) => {
      const base = avant.pour === livreRecu ? avant : { pour: livreRecu, scenes: [], retirees: [] as string[], numeros: undefined };
      return {
        pour: livreRecu,
        numeros: suite.numeros ?? base.numeros,
        scenes: suite.scene ? [...base.scenes, suite.scene] : base.scenes,
        retirees: suite.retiree ? [...base.retirees, suite.retiree] : base.retirees,
      };
    });
  const [actives, setActives] = useState<Record<Marque, boolean>>({ bold: false, italic: false, underline: false });
  const [vide, setVide] = useState(() => estVide(texte));
  // Le texte reçu à l'ouverture : ensuite, c'est l'éditeur qui tient le récit, et la copie
  // ses liaisons cachées, qui sont hors du récit (F05.1)
  const [initial] = useState(() => texteOuvert(recitDe(texte), lieu.sceneId));
  const [liaisons, setLiaisons] = useState<Liaison[]>(() => liaisonsDe(texte));
  const liaisonsTenues = useRef(liaisons);
  // Arrivée depuis un point du Livre : le choix, ou la liaison cachée, désigné, ses réglages ouverts
  const [fiche, setFiche] = useState<FicheOuverte | null>(() => {
    if (!ouvrirChoix) return null;
    if (liaisonsDe(texte).some((l) => l.id === ouvrirChoix)) return { sorte: "liaison", liaison: ouvrirChoix };
    const bloc = texte.find((b) => b.id === ouvrirChoix || renvoisDe(b).some((r) => r.id === ouvrirChoix));
    return bloc ? { sorte: "reglages", bloc: bloc.id } : null;
  });
  const [apercu, setApercu] = useState<ApercuDeChoix | null>(null);
  const [formuleVue, setFormuleVue] = useState<{ texte: string; signe: SigneAction }>({ texte: "", signe: "crayon" });
  const [avecVoisines, setAvecVoisines] = useState(voisinesAffichees);
  const aDesVoisines = voisines.avant.length + voisines.apres.length > 0;
  const [bandeau, setBandeau] = useState<Bandeau | null>(null);
  const [barre, setBarre] = useState<{ demande: string; choisie: number } | null>(null);
  const [tire, setTire] = useState<{ bloc: string; avant: string | null } | null>(null);
  const [, setTic] = useState(0);
  const zone = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // La scène créée avec le dernier choix : si ce choix est annulé, elle reste, et la copie le dit (F05-AC44)
  const creation = useRef<{ choix: string; scene: SceneCreee } | null>(null);
  const ciblesRelues = useRef(ciblesDe(texte).sort().join());
  const [ouvert] = useState<Texte>(() => [...initial, ...liaisons]);
  const sauvegarde = useEnregistrementTexte({ cible, version, texte: ouvert, apresRetour, onVersion });
  const arrete = sauvegarde.etat.etat === "garde" || sauvegarde.etat.etat === "refuse" || sauvegarde.etat.etat === "ferme";
  const adulte = droits.role === "adulte";
  const peutChoisir = livre.aChoix && (adulte || droits.profil === "organisation");
  const vous = !pourEleve;

  useEffect(() => {
    onEtat?.(sauvegarde.etat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sauvegarde.etat]);
  useEffect(() => {
    onVide?.(vide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vide]);

  const signaler = useCallback(
    (s: Signal) => {
      if (s.sorte === "image") return setBandeau({ texte: "L’image n’a pas été collée : une image s’ajoute avec le bouton « Image »." });
      if (s.sorte === "supprime") {
        const dit: string[] = [];
        if (s.choix || s.renvois) {
          const quoi = s.choix ? `${s.choix} choix supprimé${pluriel(s.choix)}` : `${s.renvois} renvoi${pluriel(s.renvois ?? 1)} retiré${pluriel(s.renvois ?? 1)}`;
          dit.push(`${quoi}. ${(s.choix || s.renvois || 1) > 1 ? "Les scènes où ils menaient sont toujours là." : "La scène où il menait est toujours là."}`);
        }
        if (s.actions) dit.push(`${s.actions} action${pluriel(s.actions)} de jeu supprimée${pluriel(s.actions)}.`);
        if (s.images) dit.push(`${s.images} image${pluriel(s.images)} supprimée${pluriel(s.images)}. ${s.images > 1 ? "Elles restent" : "Elle reste"} parmi les images du projet.`);
        return setBandeau({ texte: dit.join(" "), annuler: true });
      }
      const dit: string[] = [];
      if (s.deplaces) dit.push(`${s.deplaces} choix déplacé${pluriel(s.deplaces)}.`);
      if (s.copies) dit.push(`${s.copies} choix copié${pluriel(s.copies)}.`);
      if (s.ecartes) {
        dit.push(
          s.ecartes > 1
            ? `${s.ecartes} phrases de choix n’ont pas été collées : ${vous ? "vous ne pouvez" : "tu ne peux"} pas créer ces choix ici.`
            : `La phrase de choix n’a pas été collée : ${vous ? "vous ne pouvez" : "tu ne peux"} pas créer ce choix ici.`,
        );
      }
      if (s.actionsEcartees) {
        dit.push(
          s.actionsEcartees > 1
            ? `${s.actionsEcartees} actions de jeu n’ont pas été collées : ${vous ? "vous ne pouvez" : "tu ne peux"} pas en écrire ici.`
            : `L’action de jeu n’a pas été collée : ${vous ? "vous ne pouvez" : "tu ne peux"} pas en écrire ici.`,
        );
      }
      if (s.imagesEcartees) {
        dit.push(
          s.imagesEcartees > 1
            ? `${s.imagesEcartees} images n’ont pas été collées : ${vous ? "une image se pose avec le bouton « Image »" : "tu ne peux pas ajouter d’image ici"}.`
            : `L’image n’a pas été collée : ${vous ? "une image se pose avec le bouton « Image »" : "tu ne peux pas ajouter d’image ici"}.`,
        );
      }
      setBandeau({ texte: dit.join(" "), annuler: s.deplaces + s.copies > 0 });
    },
    [vous],
  );

  const plugins = useMemo(
    () => [
      ParagraphPlugin.withComponent(Paragraphe),
      createPlatePlugin({ key: "choix", node: { isElement: true, component: PhraseDeChoix } }),
      createPlatePlugin({ key: "renvoi", node: { isElement: true, isInline: true, isVoid: true, component: RenvoiEnLigne } }),
      createPlatePlugin({ key: "note", node: { isElement: true, component: NoteDeLEnseignant } }),
      createPlatePlugin({ key: "action", node: { isElement: true, component: ActionDeJeu } }),
      createPlatePlugin({ key: "image", node: { isElement: true, isVoid: true, component: ImageEnBloc } }),
      createPlatePlugin({ key: "image-ligne", node: { isElement: true, isInline: true, isVoid: true, component: ImageSurLaLigne } }),
      // Les raccourcis sont tenus par la copie : ils disparaissent avec les boutons (F04-AC34)
      BoldPlugin.configure({ shortcuts: { toggle: null } }),
      ItalicPlugin.configure({ shortcuts: { toggle: null } }),
      UnderlinePlugin.configure({ shortcuts: { toggle: null } }),
      // Les droits et le réglage du projet valent pour la page ouverte : un changement s'applique à la suivante
      ReglesPlugin.configure({
        options: {
          marques, droits, projetId: lieu.projetId, sceneId: lieu.sceneId, formule: livreRecu.formule, numeros: livreRecu.numeros,
          scenes: livreRecu.scenes.map((s) => s.id), actions: livreRecu.aChoix,
          signaler, confirmerDernierRenvoi: (bloc: string) => setFiche({ sorte: "reglages", bloc, confirmer: "dernier-renvoi" }),
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // Les identités des blocs sont tenues par la copie, pas par Plate
  const editor = usePlateEditor({ plugins, value: initial as never, nodeId: false });
  const e: Editeur = editor;

  // Ce qui part dans le presse-papiers porte les numéros que la copie affiche
  useEffect(() => {
    e.setOption(ReglesPlugin, "numeros", livre.numeros);
    e.setOption(ReglesPlugin, "scenes", livre.scenes.map((s) => s.id));
  }, [e, livre.numeros, livre.scenes]);

  // Les parcours joués par les tests posent le curseur par programme : jamais dans l'application en ligne
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ESSAIS !== "1" && process.env.NODE_ENV === "production") return;
    (window as unknown as { __copie?: Editeur }).__copie = e;
    return () => {
      delete (window as unknown as { __copie?: Editeur }).__copie;
    };
  }, [e]);

  const indexDe = (id: string): number => blocsDe(e).findIndex((b) => b.id === id);
  // Une fiche qui s'ouvre prend le curseur. L'éditeur doit le lâcher pour de bon : sinon il
  // se croit encore actif et le reprend en reposant sa sélection, et la frappe part dans le texte
  const lacherLeTexte = () => e.tf.blur();
  // Une fois l'écran redessiné, l'éditeur sait de nouveau où poser le curseur
  useEffect(() => {
    A_REDESSINER.delete(e);
  });
  /**
   * Rendre le curseur au texte. Juste après un changement, le bloc où il doit aller n'est pas
   * encore à l'écran : on attend qu'il y soit, sans laisser l'éditeur essayer, échouer et le
   * dire dans la console.
   */
  const reprendreLeTexte = () => {
    const tenter = (reste: number) => {
      try {
        if (document.activeElement === e.api.toDOMNode(e)) return;
        if (e.operations.length === 0 && !A_REDESSINER.has(e)) e.tf.focus();
      } catch {
        // Le texte n'est pas encore redessiné
      }
      // D'abord au plus vite, pour qui tape aussitôt ; puis au rythme de l'écran
      if (reste > 6) setTimeout(() => tenter(reste - 1), 0);
      else if (reste > 0) requestAnimationFrame(() => tenter(reste - 1));
    };
    tenter(14);
  };

  // Le texte entier : le récit que tient l'éditeur, puis les liaisons cachées
  const entier = (recit: Texte = blocsDe(e), suite: Liaison[] = liaisonsTenues.current): Texte => [...recit, ...suite];
  /** Ce qui suit tout changement du texte : le noter pour l'enregistrement, relire les numéros si les destinations changent. */
  const suivre = (suite: Texte) => {
    setVide(estVide(suite));
    sauvegarde.noter(suite);
    // Les destinations ont changé : après l'enregistrement, les numéros se relisent (F05-AC34)
    const cibles = ciblesDe(suite).sort().join();
    if (cibles !== ciblesRelues.current) {
      ciblesRelues.current = cibles;
      void sauvegarde.envoyer().then((ok) => {
        if (ok) void services.relireNumeros().then((numeros) => apprendre({ numeros }));
      });
    }
  };
  const changerLiaisons = (suite: Liaison[]) => {
    liaisonsTenues.current = suite;
    setLiaisons(suite);
    suivre(entier());
  };
  const nomDe = (sceneId: string | null): string => {
    const s = livre.scenes.find((x) => x.id === sceneId);
    return s ? nomScene(s) : "La scène";
  };
  const fermer = () => {
    setFiche(null);
    reprendreLeTexte();
  };

  /** Une scène créée depuis un choix : la copie la connaît aussitôt, sans attendre que la page relise le livre. */
  const connaitre = (creee: SceneCreee) => {
    const chapitre = livre.chapitres.find((c) => c.id === creee.chapitreId);
    apprendre({
      scene: { id: creee.id, reference: creee.reference, titre: creee.titre, chapitreId: creee.chapitreId, chapitre: chapitre?.titre ?? "", partie: chapitre?.partie ?? "", vide: true },
    });
  };

  // ——— Créer un choix (F05-AC13 à AC18) ———
  const ouvrirCreation = (apres?: string) => {
    const blocs = blocsDe(e);
    const ici = apres ? blocs.find((b) => b.id === apres) : (blocCourant(e)?.bloc ?? blocs[blocs.length - 1]);
    if (!ici) return;
    setBarre(null);
    setBandeau(null);
    lacherLeTexte();
    // Sur une ligne vide, la phrase la remplace ; sinon elle prend place juste après
    setFiche({ sorte: "creation", apres: ici.id, remplace: !apres && ici.type === "p" && lettresDe(ici) === "" });
  };
  const creerChoix = (choix: Choix, creee?: SceneCreee) => {
    if (fiche?.sorte !== "creation") return;
    const i = Math.max(0, fiche.apres ? indexDe(fiche.apres) : blocsDe(e).length - 1);
    e.tf.withoutNormalizing(() => {
      e.tf.insertNodes(choix, { at: [i + 1] });
      if (fiche.remplace) e.tf.removeNodes({ at: [i] });
    });
    e.tf.allerA(fiche.remplace ? i : i + 1);
    // Le choix créé, le panneau reste ouvert sur ses réglages : sa destination, sa phrase
    setFiche({ sorte: "reglages", bloc: choix.id });
    reprendreLeTexte();
    if (creee) {
      creation.current = { choix: choix.id, scene: creee };
      connaitre(creee);
    }
    setBandeau({
      texte: creee
        ? `${nomScene(creee)} est créée${creee.chapitreId !== lieu.chapitreId ? " dans un autre chapitre" : ""}. ${vous ? "Vous restez" : "Tu restes"} dans cette scène.`
        : choix.auto && choix.cible === null
          ? "Le choix est ajouté, sans destination : il bloquera le PDF définitif tant qu’il n’en a pas."
          : "Le choix est ajouté.",
      annuler: true,
      actions: [{ libelle: "Ajouter un autre choix", faire: () => ouvrirCreation(choix.id) }],
    });
  };

  // ——— Régler un choix (F05-AC20 à AC25) ———
  const gestes = (bloc: Choix): GestesDeChoix => {
    const i = indexDe(bloc.id);
    const remplacer = (suite: Choix) => {
      e.tf.withoutNormalizing(() => {
        e.tf.removeNodes({ at: [i] });
        e.tf.insertNodes(suite, { at: [i] });
      });
    };
    return {
      regler: (valeurs) => e.tf.setNodes(valeurs, { at: [i] }),
      reglerRenvoi: (renvoi, valeurs) => {
        const k = (bloc.children as unknown[]).findIndex((x) => estRenvoi(x) && x.id === renvoi);
        // La phrase est un bloc fermé : on y entre exprès
        if (k !== -1) e.tf.setNodes(valeurs, { at: [i, k], voids: true });
      },
      // La phrase s'écrit dans le panneau : le texte autour de ses numéros, qui restent à leur place
      ecrire: (textes) => {
        const perso = enPersonnalisee(bloc, livre.formule);
        const puces = (perso.children as Choix["children"]).filter((x) => !("text" in x));
        const children = [...puces.flatMap((puce, k) => [{ text: textes[k] ?? "" }, puce]), { text: textes[puces.length] ?? "" }];
        remplacer({ ...perso, children } as Choix);
      },
      // La flèche ronde : une autre tournure pour la phrase automatique ; sinon, le retour à l'automatique
      automatiser: () => {
        const utiles = constructionsUtiles(livre.formule, livre.constructions);
        if (estAuto(bloc)) {
          const autres = utiles.filter((u) => u !== bloc.construction);
          if (autres.length) e.tf.setNodes({ construction: tirerConstruction(autres) }, { at: [i] });
          return;
        }
        const renvoi = seulRenvoi(bloc);
        if (!renvoi) return;
        remplacer({ type: "choix", id: bloc.id, auto: true, libelle: bloc.libelle, construction: tirerConstruction(utiles), cible: renvoi.cible, children: [{ text: "" }] });
      },
      // Une destination de plus : son numéro s'ajoute à la fin de la phrase, qui s'écrit dès lors à la main
      ajouterDestination: ({ cible, creee }) => {
        const perso = enPersonnalisee(bloc, livre.formule);
        const enfants = perso.children as Choix["children"];
        const dernier = enfants[enfants.length - 1];
        const fin = "text" in dernier ? dernier.text : "";
        const children = [...enfants.slice(0, "text" in dernier ? -1 : undefined), { text: fin && !/\s$/.test(fin) ? `${fin} ` : fin }, nouveauRenvoi(cible), { text: "" }];
        remplacer({ ...perso, children } as Choix);
        if (creee) connaitre(creee);
      },
      retirerRenvoi: (renvoi) => {
        const k = (bloc.children as unknown[]).findIndex((x) => estRenvoi(x) && x.id === renvoi);
        if (k === -1) return;
        e.tf.removeNodes({ at: [i, k], voids: true });
        signaler({ sorte: "supprime", choix: 0, renvois: 1 });
      },
      // Les numéros de la phrase restent à leur place et prennent les destinations dans le nouvel ordre
      ordonner: (cibles) => {
        const places = (bloc.children as unknown[]).flatMap((x, k) => (estRenvoi(x) ? [k] : []));
        e.tf.withoutNormalizing(() => places.forEach((k, n) => e.tf.setNodes({ cible: cibles[n] ?? null }, { at: [i, k], voids: true })));
      },
      supprimer: () => {
        e.tf.supprimerBlocs([bloc.id]);
        setFiche(null);
        reprendreLeTexte();
      },
      // eslint-disable-next-line react-hooks/refs -- appelée au clic, jamais pendant le rendu
      cacher: adulte && services.fixerNumero ? () => void cacher(bloc) : undefined,
    };
  };

  // ——— Liaisons cachées (F05.1, F05-AC26) ———
  const creerLiaison = (liaison: Liaison, numero: number | null) => {
    changerLiaisons([...liaisonsTenues.current, liaison]);
    setFiche(null);
    reprendreLeTexte();
    setBandeau({
      texte: `Le lien caché est créé, vers ${nomDe(liaison.cible)}${numero ? `, n° ${numero}` : ""}. Il ne s’imprime pas : l’énigme s’écrit dans le texte.`,
      annuler: () => changerLiaisons(liaisonsTenues.current.filter((x) => x.id !== liaison.id)),
    });
  };
  /** « Cacher ce choix (énigme) » : la phrase quitte le texte, le lien reste, le numéro de la destination est fixé. */
  const cacher = async (bloc: Choix) => {
    const cible = estAuto(bloc) ? bloc.cible : (seulRenvoi(bloc)?.cible ?? null);
    if (!cible || !services.fixerNumero) return;
    const fait = await services.fixerNumero(cible, null);
    if (!fait.ok) return setBandeau({ texte: fait.erreur });
    const liaison: Liaison = { type: "liaison", id: nouvelId(), cible, children: [{ text: "" }], ...(bloc.libelle ? { libelle: bloc.libelle } : {}) };
    // La liaison d'abord, la phrase ensuite : le lien n'est à aucun moment absent du texte
    changerLiaisons([...liaisonsTenues.current, liaison]);
    const i = indexDe(bloc.id);
    if (i !== -1) e.tf.removeNodes({ at: [i] });
    setFiche(null);
    setBandeau({
      texte: `Le choix est caché : c’est maintenant un lien caché, hors du récit. ${nomDe(cible)} garde le n° ${fait.numero ?? "…"}.`,
      annuler: () => {
        e.tf.undo();
        changerLiaisons(liaisonsTenues.current.filter((x) => x.id !== liaison.id));
      },
    });
  };
  const gestesDeLiaison: GestesDeLiaison = {
    proposer: (liaison, libelle) => {
      const choix: Choix = {
        type: "choix", id: nouvelId(), auto: true, libelle, cible: liaison.cible, children: [{ text: "" }],
        construction: tirerConstruction(constructionsUtiles(livre.formule, livre.constructions)),
      };
      const fin = blocsDe(e).length;
      // La phrase d'abord, la liaison ensuite : même raison
      e.tf.insertNodes(choix, { at: [fin] });
      e.tf.allerA(fin);
      changerLiaisons(liaisonsTenues.current.filter((x) => x.id !== liaison.id));
      reprendreLeTexte();
      setBandeau({
        texte: "Le lien caché est devenu une phrase de choix, à la fin du texte.",
        annuler: () => {
          changerLiaisons([...liaisonsTenues.current, liaison]);
          e.tf.undo();
        },
      });
    },
    retirer: (liaison) => {
      changerLiaisons(liaisonsTenues.current.filter((x) => x.id !== liaison.id));
      const fixe = liaison.cible ? livre.fixes[liaison.cible] : undefined;
      const cible = liaison.cible;
      setBandeau({
        // La scène garde son numéro : une énigme peut rester dans un texte (F11-AC98)
        texte: fixe && cible ? `Lien caché retiré. ${nomDe(cible)} garde le n° ${fixe} fixé.` : "Lien caché retiré.",
        annuler: () => changerLiaisons([...liaisonsTenues.current, liaison]),
        actions:
          fixe && cible && services.libererNumero
            ? [
                {
                  libelle: "Libérer le numéro",
                  faire: () =>
                    void services.libererNumero!(cible).then((fait) => {
                      setBandeau({ texte: fait.ok ? `${nomDe(cible)} n’a plus de numéro fixé.` : (fait.erreur ?? "Le numéro n’a pas pu être libéré.") });
                      if (fait.ok) void services.relireNumeros().then((numeros) => apprendre({ numeros }));
                    }),
                },
              ]
            : undefined,
      });
    },
  };

  // ——— Note de l'enseignant et paragraphe protégé (F05.2, F06.1) ———
  const ajouterNote = () => {
    const blocs = blocsDe(e);
    const ici = blocCourant(e)?.bloc ?? blocs[blocs.length - 1];
    if (!ici) return;
    const i = indexDe(ici.id);
    const remplace = ici.type === "p" && lettresDe(ici) === "";
    setBarre(null);
    e.tf.withoutNormalizing(() => {
      e.tf.insertNodes({ type: "note", id: nouvelId(), children: [{ text: "" }] }, { at: [i + 1] });
      if (remplace) e.tf.removeNodes({ at: [i] });
    });
    e.tf.allerA(remplace ? i : i + 1);
    reprendreLeTexte();
  };
  // Se protègent : un paragraphe de récit, une action de jeu (F04.2, F06.1)
  const paragrapheCourant = () => {
    const ici = blocCourant(e);
    return ici && (ici.bloc.type === "p" || ici.bloc.type === "action") ? { index: ici.index, bloc: ici.bloc } : null;
  };

  // ——— Action de jeu et objets de l'histoire (F04.2) ———
  const ouvrirAction = () => {
    const blocs = blocsDe(e);
    const ici = blocCourant(e)?.bloc ?? blocs[blocs.length - 1];
    if (!ici) return;
    setBarre(null);
    setBandeau(null);
    lacherLeTexte();
    setFiche({ sorte: "action", apres: ici.id, remplace: ici.type === "p" && lettresDe(ici) === "" });
  };
  /**
   * La formule retenue devient un paragraphe d'action, précédé de son signe ; dans une formule
   * à compléter, « … » est sélectionné.
   */
  const poserAction = (texte: string, signe: SigneAction = "crayon") => {
    const porte = signe === "crayon" ? {} : { signe };
    const pour = fiche?.sorte === "formule-nouvelle" ? fiche.pour : fiche;
    if (pour?.sorte !== "action" && pour?.sorte !== "formules") return;
    let k: number;
    if (pour.sorte === "formules") {
      k = indexDe(pour.bloc);
      const actuel = blocsDe(e)[k];
      if (!actuel || actuel.type !== "action") return;
      e.tf.withoutNormalizing(() => {
        e.tf.removeNodes({ at: [k] });
        // L'action prend le signe de la formule qui la remplit
        e.tf.insertNodes({ ...actuel, signe: undefined, ...porte, children: [{ text: texte }] }, { at: [k] });
      });
    } else {
      const i = Math.max(0, indexDe(pour.apres));
      e.tf.withoutNormalizing(() => {
        e.tf.insertNodes({ type: "action", id: nouvelId(), ...porte, children: [{ text: texte }] }, { at: [i + 1] });
        if (pour.remplace) e.tf.removeNodes({ at: [i] });
      });
      k = pour.remplace ? i : i + 1;
    }
    const trou = texte.indexOf("…");
    e.tf.select(trou === -1 ? e.api.end([k]) : { anchor: { path: [k, 0], offset: trou }, focus: { path: [k, 0], offset: trou + 1 } });
    setFiche(null);
    reprendreLeTexte();
  };
  const ouvrirObjets = () => {
    const blocs = blocsDe(e);
    const ici = blocCourant(e)?.bloc ?? blocs[blocs.length - 1];
    if (!ici) return;
    setBarre(null);
    setBandeau(null);
    lacherLeTexte();
    setFiche({ sorte: "objets", bloc: ici.id });
  };
  // ——— Images (F10) ———
  const ouvrirPoserImage = () => {
    const blocs = blocsDe(e);
    const ici = blocCourant(e)?.bloc ?? blocs[blocs.length - 1];
    if (!ici) return;
    setBarre(null);
    setBandeau(null);
    lacherLeTexte();
    setFiche({ sorte: "poser-image", bloc: ici.id });
  };
  /** Une image sur la ligne se pose dans un paragraphe de récit, une action de jeu ou une phrase personnalisée (F10). */
  const admetUneImage = (): boolean => {
    const ici = blocCourant(e);
    return !!ici && !estFerme(ici.bloc, droits) && (ici.bloc.type === "p" || ici.bloc.type === "action" || ici.bloc.type === "choix");
  };
  const poserImage = (image: string, ou: "bloc" | "ligne") => {
    if (fiche?.sorte !== "poser-image") return;
    // L'image posée, ses réglages s'ouvrent à la place : largeur, légende, ce qu'elle montre
    const ici = blocCourant(e);
    if (ou === "ligne" && admetUneImage() && e.selection && ici) {
      const symbole: ImageLigne = { type: "image-ligne", id: nouvelId(), image, children: [{ text: "" }] };
      e.tf.insertNodes(symbole, { at: e.selection, select: true });
      e.tf.move({ distance: 1, unit: "offset" });
      setFiche({ sorte: "symbole", bloc: ici.bloc.id, symbole: symbole.id });
    } else {
      const i = Math.max(0, indexDe(fiche.bloc));
      const ici = blocsDe(e)[i];
      const remplace = ici?.type === "p" && lettresDe(ici) === "";
      // En bloc, après le paragraphe du curseur, en largeur moyenne (F10-AC27)
      const figure: ImageBloc = { type: "image", id: nouvelId(), image, largeur: LARGEURS.moyenne, children: [{ text: "" }] };
      e.tf.withoutNormalizing(() => {
        e.tf.insertNodes(figure, { at: [i + 1] });
        if (remplace) e.tf.removeNodes({ at: [i] });
      });
      e.tf.allerA(remplace ? i : i + 1);
      setFiche({ sorte: "image", bloc: figure.id });
    }
    reprendreLeTexte();
  };
  /** Le chemin d'une image sur la ligne dans le texte, d'après son identité. */
  const cheminDuSymbole = (id: string): [number, number] | null => {
    for (const [i, b] of blocsDe(e).entries()) {
      const k = (b.children as unknown[]).findIndex((x) => estImageLigne(x) && x.id === id);
      if (k !== -1) return [i, k];
    }
    return null;
  };

  /** Le nom de l'objet s'écrit à l'endroit du curseur, comme du texte ordinaire (F04-AC15). */
  const ecrireObjet = (nom: string) => {
    setFiche(null);
    if (!e.selection) e.tf.select(e.api.end([]));
    e.tf.insertText(nom);
    reprendreLeTexte();
  };
  const basculerProtection = () => {
    const ici = paragrapheCourant();
    if (!ici) return;
    if (ici.bloc.protege) e.tf.unsetNodes(["protege"], { at: [ici.index] });
    else e.tf.setNodes({ protege: true }, { at: [ici.index] });
    reprendreLeTexte();
  };
  const ecrireAvant = (bloc: string) => {
    const i = indexDe(bloc);
    if (i === -1 || arrete) return;
    e.tf.insertNodes(paragrapheVide(), { at: [i] });
    e.tf.allerA(i);
    reprendreLeTexte();
  };

  // ——— Déplacer un bloc : par son repère, ou Alt et une flèche (F05-AC40) ———
  const deplacer = (id: string, vers: number) => {
    const de = indexDe(id);
    const bloc = blocsDe(e)[de];
    const borne = Math.max(0, Math.min(vers, blocsDe(e).length - 1));
    if (!bloc || borne === de || !peutModifier(bloc, droits)) return;
    e.tf.moveNodes({ at: [de], to: [borne] });
    e.tf.allerA(borne);
  };
  const commencerATirer = (id: string, ev: React.PointerEvent) => {
    ev.preventDefault();
    const texteDom = zone.current?.querySelector<HTMLElement>(".copie__texte");
    if (!texteDom) return;
    let avant: string | null = null;
    const viser = (y: number) => {
      const blocsDom = [...texteDom.querySelectorAll<HTMLElement>(":scope > [data-bloc]")];
      const visee = blocsDom.find((b) => {
        const r = b.getBoundingClientRect();
        return y < r.top + r.height / 2;
      });
      avant = visee ? visee.dataset.bloc! : "fin";
      setTire({ bloc: id, avant });
    };
    viser(ev.clientY);
    const bouger = (m: PointerEvent) => viser(m.clientY);
    const lacher = () => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", lacher);
      window.removeEventListener("pointercancel", lacher);
      setTire(null);
      const de = indexDe(id);
      const viseIndex = avant === "fin" || avant === null ? blocsDe(e).length : indexDe(avant);
      // La place se compte parmi les autres blocs
      if (viseIndex !== -1) deplacer(id, viseIndex > de ? viseIndex - 1 : viseIndex);
    };
    window.addEventListener("pointermove", bouger);
    window.addEventListener("pointerup", lacher);
    window.addEventListener("pointercancel", lacher);
  };

  // ——— Commandes du texte : « / » propose celles que la personne peut utiliser (F05.2) ———
  const commandes: Commande[] = [
    ...(peutChoisir ? [{ cle: "choix", nom: "Choix", aide: "Une phrase qui mène à une autre scène", icone: "choix", faire: () => ouvrirCreation() } as Commande] : []),
    // La note est à l'adulte seul, dans les quatre combinaisons (F05-AC52)
    ...(peutChoisir ? [{ cle: "action", nom: "Action de jeu", aide: "Ce que le lecteur fait sur sa feuille d’aventure", icone: "crayon", faire: ouvrirAction } as Commande] : []),
    // Les objets servent à la cohérence de tout récit, classique compris (F04-AC26)
    { cle: "objet", nom: "Objet", aide: "Un nom de la liste des objets de l’histoire", icone: "sac", faire: ouvrirObjets },
    // L'enseignant importe et place les images (F10)
    ...(adulte ? [{ cle: "image", nom: "Image", aide: "Dans le texte, ou sur la ligne", icone: "image", faire: ouvrirPoserImage } as Commande] : []),
    ...(adulte ? [{ cle: "note", nom: "Note", aide: "Pour vous seul, jamais imprimée", icone: "noter", faire: ajouterNote } as Commande] : []),
  ];
  const proposees = barre ? commandes.filter((c) => c.cle.startsWith(barre.demande)) : [];
  const lancerCommande = (c: Commande) => {
    // Ce qu'on vient de taper, « /choix », ne reste pas dans le texte
    const point = e.selection?.anchor;
    if (point && barre) e.tf.delete({ at: { anchor: { path: point.path, offset: point.offset - barre.demande.length - 1 }, focus: point } });
    setBarre(null);
    c.faire();
  };
  const lireLaBarre = () => {
    const ici = blocCourant(e);
    const s = e.selection;
    if (!ici || !s || commandes.length === 0 || ici.bloc.type !== "p" || s.anchor.path.join() !== s.focus.path.join() || s.anchor.offset !== s.focus.offset) return setBarre(null);
    const lettres = (ici.bloc.children[s.anchor.path[1]] as { text?: string }).text ?? "";
    // Au début d'une ligne, après une espace ou une ponctuation : « et/ou » et « 1/2 » restent du texte
    const trouve = /(?:^|[\s.,;:!?…»)])\/([a-zé]*)$/.exec(lettres.slice(0, s.anchor.offset));
    setBarre((avant) => (trouve ? { demande: trouve[1], choisie: avant?.demande === trouve[1] ? avant.choisie : 0 } : null));
  };

  /** Le bloc qu'une fiche concerne : s'il disparaît du texte, elle se referme. */
  const blocDe = (f: FicheOuverte): string | null => {
    if (f.sorte === "creation" || f.sorte === "action") return f.apres;
    if (f.sorte === "liaison" || f.sorte === "objet-nouveau" || f.sorte === "formule-nouvelle") return null;
    return f.bloc;
  };
  // Les listes courtes — commandes, objets, formules — s'ouvrent au curseur, sous son bloc et
  // par-dessus le texte. Tout ce qui a des champs s'ouvre dans le panneau de droite : le texte ne bouge pas
  const liste = fiche && estAuCurseur(fiche) ? fiche : null;
  const dansLePanneau = fiche && !estAuCurseur(fiche) ? fiche : null;
  const menuOuvert = !!barre && proposees.length > 0 && !fiche;
  const ancre = liste ? blocDe(liste) : menuOuvert ? (blocCourant(e)?.bloc.id ?? null) : null;
  const panneauOuvert = !!dansLePanneau;
  useEffect(() => {
    onPanneau?.(panneauOuvert);
  }, [onPanneau, panneauOuvert]);
  // Arrivée depuis un point du Livre : le choix désigné vient sous les yeux, une seule fois
  useEffect(() => {
    if (!ouvrirChoix || fiche?.sorte !== "reglages") return;
    zone.current?.querySelector(`[data-bloc="${fiche.bloc}"]`)?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Une liste ouverte au curseur se referme quand on clique ailleurs
  useEffect(() => {
    if (!liste) return;
    const dehors = (ev: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) setFiche(null);
    };
    document.addEventListener("pointerdown", dehors);
    return () => document.removeEventListener("pointerdown", dehors);
  }, [liste]);
  // La liste se pose sous la ligne du curseur quand elle y écrit — commandes, objets —, sinon
  // sous son bloc ; au-dessus quand la fenêtre n'a pas la place dessous. Elle sort du cadre du
  // texte s'il le faut : ni le cadre ni le texte ne bougent
  const surLaLigne = menuOuvert || liste?.sorte === "objets";
  const sorte = menuOuvert ? "commandes" : (liste?.sorte ?? null);
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const porteur = ancre ? zone.current?.querySelector<HTMLElement>(`[data-bloc="${ancre}"]`) : null;
    // L'action de jeu en attente : la liste s'ouvre contre elle, et non contre le bloc qui la précède
    const bloc = porteur?.querySelector<HTMLElement>(".action-attendue") ?? porteur;
    if (!menu || !bloc) return;
    const ligne = (): DOMRect | null => {
      try {
        const r = surLaLigne && e.selection ? e.api.toDOMRange(e.selection)?.getClientRects()[0] : null;
        return r && r.height > 0 ? r : null;
      } catch {
        return null;
      }
    };
    return poser(
      {
        contextElement: bloc,
        getBoundingClientRect: () => {
          const b = bloc.getBoundingClientRect();
          const l = ligne();
          const [top, bottom] = l ? [l.top, l.bottom] : [b.top, b.bottom];
          return { x: b.left, y: top, top, bottom, left: b.left, right: b.right, width: b.width, height: bottom - top };
        },
      },
      menu,
      { fixe: true, ecart: 4 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancre, sorte]);

  const contexte: ContexteDeCopie = {
    livre, droits, lieu, pourEleve, fiche, apercu, formuleVue, tire, enseignant, ecrireAvant,
    ouvrirLiaison: (liaison) => {
      setBandeau(null);
      lacherLeTexte();
      setFiche(fiche?.sorte === "liaison" && fiche.liaison === liaison ? null : { sorte: "liaison", liaison });
    },
    ouvrirFormules: (bloc) => {
      setBandeau(null);
      lacherLeTexte();
      setFiche(fiche?.sorte === "formules" && fiche.bloc === bloc ? null : { sorte: "formules", bloc });
    },
    reglerSigne: (bloc, signe) => {
      const i = indexDe(bloc);
      if (i === -1) return;
      if (signe === "crayon") e.tf.unsetNodes(["signe"], { at: [i] });
      else e.tf.setNodes({ signe }, { at: [i] });
    },
    supprimerBloc: (bloc) => {
      e.tf.supprimerBlocs([bloc]);
      reprendreLeTexte();
    },
    ouvrirImage: (bloc) => {
      setBandeau(null);
      lacherLeTexte();
      setFiche(fiche?.sorte === "image" && fiche.bloc === bloc ? null : { sorte: "image", bloc });
    },
    ouvrirSymbole: (symbole) => {
      const chemin = cheminDuSymbole(symbole);
      if (!chemin) return;
      setBandeau(null);
      lacherLeTexte();
      setFiche({ sorte: "symbole", bloc: blocsDe(e)[chemin[0]].id, symbole });
    },
    ouvrir: (bloc) => {
      setBandeau(null);
      lacherLeTexte();
      setFiche({ sorte: "reglages", bloc });
    },
    commencerATirer,
  };
  const blocRegle = fiche?.sorte === "reglages" ? (blocsDe(e).find((b) => b.id === fiche.bloc) as Choix | undefined) : undefined;
  const imageReglee = fiche?.sorte === "image" ? (blocsDe(e).find((b) => b.id === fiche.bloc && b.type === "image") as ImageBloc | undefined) : undefined;
  const liaisonReglee = fiche?.sorte === "liaison" ? liaisons.find((l) => l.id === fiche.liaison) : undefined;
  const symboleRegle = (() => {
    if (fiche?.sorte !== "symbole") return undefined;
    const chemin = cheminDuSymbole(fiche.symbole);
    return chemin ? { chemin, image: (blocsDe(e)[chemin[0]].children as unknown[])[chemin[1]] as ImageLigne } : undefined;
  })();

  const basculer = (marque: Marque) => {
    // La mise en forme vaut pour le récit et la note : ni phrase de choix ni action de jeu
    if (!marques || arrete || !["p", "note"].includes(blocCourant(e)?.bloc.type ?? "")) return;
    e.tf.toggleMark(marque);
    reprendreLeTexte();
  };

  const auClavier = (ev: React.KeyboardEvent) => {
    // Le petit menu des commandes : flèches, Entrée, Échap
    if (barre && proposees.length) {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        const pas = ev.key === "ArrowDown" ? 1 : -1;
        return setBarre({ ...barre, choisie: (barre.choisie + pas + proposees.length) % proposees.length });
      }
      if (ev.key === "Enter" || ev.key === "Tab") {
        ev.preventDefault();
        return lancerCommande(proposees[Math.min(barre.choisie, proposees.length - 1)]);
      }
      if (ev.key === "Escape") {
        ev.preventDefault();
        return setBarre(null);
      }
    }
    // Échap referme la fiche ouverte, d'où que l'on soit (F05-AC39)
    if (fiche && ev.key === "Escape") {
      ev.preventDefault();
      return fermer();
    }
    const mod = ev.metaKey || ev.ctrlKey;
    const touche = ev.key.toLowerCase();
    if (mod && !ev.altKey) {
      const marque = MARQUES.find((m) => m.touche === touche);
      if (marque) {
        // Sans les trois boutons, leurs raccourcis ne font rien non plus (F04-AC34)
        ev.preventDefault();
        if (marques && !ev.shiftKey && ["p", "note"].includes(blocCourant(e)?.bloc.type ?? "")) e.tf.toggleMark(marque.cle);
        return;
      }
      // « Tout sélectionner » natif échoue quand la scène finit par un bloc fermé : la copie pose la sélection
      if (touche === "a") {
        ev.preventDefault();
        e.tf.select({ anchor: e.api.start([]), focus: e.api.end([]) });
        return;
      }
    }
    const ici = blocCourant(e);
    const s = e.selection;
    if (!ici || !s || s.anchor.path.join() !== s.focus.path.join() || s.anchor.offset !== s.focus.offset) return;
    const dernier = blocsDe(e).length - 1;
    if (ev.altKey && (ev.key === "ArrowUp" || ev.key === "ArrowDown") && ici.bloc.type !== "p") {
      ev.preventDefault();
      return deplacer(ici.bloc.id, ici.index + (ev.key === "ArrowUp" ? -1 : 1));
    }
    if (!estFerme(ici.bloc, droits)) return;
    // Sur un bloc fermé, les touches n'atteignent pas l'éditeur : la copie les tient elle-même
    if (mod && (ev.key === "End" || ev.key === "Home")) {
      ev.preventDefault();
      return e.tf.select(ev.key === "End" ? e.api.end([]) : e.api.start([]));
    }
    if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
      ev.preventDefault();
      if (ici.index === 0) e.tf.insertNodes(paragrapheVide(), { at: [0] });
      return e.tf.allerA(Math.max(0, ici.index - 1), true);
    }
    if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
      ev.preventDefault();
      if (ici.index === dernier) e.tf.insertNodes(paragrapheVide(), { at: [dernier + 1] });
      return e.tf.allerA(ici.index + 1);
    }
    if (ev.key === "Enter") {
      ev.preventDefault();
      if (ici.bloc.type === "choix" && peutModifier(ici.bloc, droits)) {
        setBandeau(null);
        lacherLeTexte();
        return setFiche({ sorte: "reglages", bloc: ici.bloc.id, auClavier: true });
      }
      if (ici.bloc.type === "image" && peutModifier(ici.bloc, droits)) {
        setBandeau(null);
        lacherLeTexte();
        return setFiche({ sorte: "image", bloc: ici.bloc.id });
      }
      e.tf.insertNodes(paragrapheVide(), { at: [ici.index + 1] });
      return e.tf.allerA(ici.index + 1);
    }
    if (ev.key === "Backspace" || ev.key === "Delete") {
      ev.preventDefault();
      e.tf.supprimerBlocs([ici.bloc.id]);
    }
  };

  const protege = paragrapheCourant();
  const ou: PiedDeCopie = { etat: sauvegarde.etat, vide, reessayer: () => void sauvegarde.reessayer() };
  return (
    <Contexte value={contexte}>
      <SortieGardee />
      {dessus?.(ou)}
      <div className={`copie${arrete ? " copie--lecture" : ""}`}>
        <div className="copie__barre">
          {tete}
          {aDesVoisines && !autre ? (
                <label className="outil-case" title={vous ? "Ce réglage vaut pour toutes vos scènes" : "Ce réglage vaut pour toutes tes scènes"}>
                  <input
                    type="checkbox"
                    checked={avecVoisines}
                    onChange={(ev) => {
                      const affiche = ev.target.checked;
                      setAvecVoisines(affiche);
                      void services.reglerVoisines?.(affiche);
                      setBandeau({
                        texte: affiche
                          ? `Les scènes voisines s’affichent, dans toutes ${vous ? "vos" : "tes"} scènes.`
                          : `Les scènes voisines ne s’affichent plus, dans aucune de ${vous ? "vos" : "tes"} scènes. ${vous ? "Vous pouvez" : "Tu peux"} recocher la case.`,
                      });
                    }}
                  />
                  <span>Scènes voisines</span>
                </label>
          ) : null}
          {autre ? (
            autre.barre
          ) : arrete ? null : (
            <div className="copie__outils" role="toolbar" aria-label="Outils de la copie">
              {peutChoisir ? (
                <button type="button" className="outil outil--texte" onMouseDown={(ev) => ev.preventDefault()} onClick={() => ouvrirCreation()}>
                  <Icone nom="choix" />
                  Choix
                </button>
              ) : null}
              {peutChoisir ? (
                <button type="button" className="outil outil--texte" onMouseDown={(ev) => ev.preventDefault()} onClick={ouvrirAction}>
                  <Icone nom="crayon" />
                  Action de jeu
                </button>
              ) : null}
              <button type="button" className="outil outil--texte" onMouseDown={(ev) => ev.preventDefault()} onClick={ouvrirObjets}>
                <Icone nom="sac" />
                Objets
              </button>
              {adulte ? (
                <button type="button" className="outil outil--texte" onMouseDown={(ev) => ev.preventDefault()} onClick={ouvrirPoserImage}>
                  <Icone nom="image" />
                  Image
                </button>
              ) : null}
              {adulte ? (
                <button type="button" className="outil outil--texte" onMouseDown={(ev) => ev.preventDefault()} onClick={ajouterNote}>
                  <Icone nom="noter" />
                  Note
                </button>
              ) : null}
              {adulte && protection ? (
                <button
                  type="button"
                  className="outil outil--texte"
                  aria-pressed={!!protege?.bloc.protege}
                  disabled={!protege}
                  title={protege ? undefined : "Placez le curseur dans un paragraphe de récit"}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={basculerProtection}
                >
                  <Icone nom={protege?.bloc.protege ? "cadenas-ouvert" : "cadenas"} />
                  {/* Les deux libellés occupent la même place : la barre ne bouge pas quand le curseur change de paragraphe */}
                  <span className="outil__deux">
                    <span aria-hidden={!!protege?.bloc.protege} className={protege?.bloc.protege ? "est-cache" : undefined}>Protéger</span>
                    <span aria-hidden={!protege?.bloc.protege} className={protege?.bloc.protege ? undefined : "est-cache"}>Retirer la protection</span>
                  </span>
                </button>
              ) : null}
              {marques ? <span className="outil-sep" aria-hidden="true" /> : null}
              {marques
                ? MARQUES.map((m) => (
                    <button
                      key={m.cle}
                      type="button"
                      className={`outil outil--${m.cle}`}
                      aria-label={m.nom}
                      title={m.nom}
                      aria-pressed={actives[m.cle]}
                      // Le bouton ne prend pas le curseur à la copie
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => basculer(m.cle)}
                    >
                      {m.lettre}
                    </button>
                  ))
                : null}
            </div>
          )}
        </div>
        {avecVoisines && !autre && lienDeScene ? <ScenesVoisines sens="avant" voisines={voisines.avant} livre={livre} pourEleve={pourEleve} lienDeScene={lienDeScene} /> : null}
        <div hidden={!!autre} className="copie__zone" ref={zone}>
          <Plate
            editor={editor}
            readOnly={arrete}
            onChange={() => {
              A_REDESSINER.add(e);
              const m = (e.api.marks() ?? {}) as Partial<Record<Marque, boolean>>;
              setActives((avant) =>
                avant.bold === !!m.bold && avant.italic === !!m.italic && avant.underline === !!m.underline
                  ? avant
                  : { bold: !!m.bold, italic: !!m.italic, underline: !!m.underline },
              );
              lireLaBarre();
              setTic((n) => n + 1);
            }}
            onValueChange={({ value }) => {
              const suite = value as unknown as Texte;
              suivre(entier(suite));
              // La fiche d'un bloc qui n'est plus là se referme ; pas celle qui vient de s'ouvrir sur un autre bloc
              const parti = (f: FicheOuverte | null): boolean => {
                const concerne = f ? blocDe(f) : null;
                return !!concerne && !suite.some((b) => b.id === concerne);
              };
              if (parti(fiche)) setFiche((f) => (parti(f) ? null : f));
              // On se remet à écrire : la fiche se referme. Pas quand on déplace un bloc, ni quand
              // on écrit dans la phrase de choix qu'on est en train de régler. Le curseur est alors
              // dans le texte : ce que la fiche change elle-même, ou la commande qui l'ouvre, ne compte pas
              else if (fiche && zone.current?.querySelector("[data-slate-editor]")?.contains(document.activeElement)) {
                const regle = fiche.sorte === "reglages" ? suite.findIndex((b) => b.id === fiche.bloc) : -1;
                const ecrit = (e.operations as { type: string; path?: number[] }[]).some(
                  (op) => ["insert_text", "remove_text", "split_node", "merge_node"].includes(op.type) && op.path?.[0] !== regle,
                );
                if (ecrit) setFiche(null);
              }
              // Le choix qui venait de créer une scène a été annulé : la scène reste, et la copie le dit (F05-AC44)
              const cree = creation.current;
              if (cree && !suite.some((b) => b.id === cree.choix)) {
                creation.current = null;
                setBandeau({
                  texte: `Choix retiré. La scène ${nomScene(cree.scene)} reste dans le chapitre.`,
                  actions: [
                    {
                      libelle: "Supprimer aussi la scène",
                      faire: () =>
                        void services.supprimerScene(cree.scene.id).then((fait) => {
                          if (fait.ok) apprendre({ retiree: cree.scene.id });
                          setBandeau({ texte: fait.ok ? `${nomScene(cree.scene)} est supprimée.` : (fait.erreur ?? "La scène n’a pas pu être supprimée.") });
                        }),
                    },
                  ],
                });
              }
            }}
          >
            <PlateContent
              className={`copie__texte${tire?.avant === "fin" ? " se-pose-fin" : ""}`}
              aria-label={libelle}
              placeholder={invite}
              spellCheck
              lang="fr"
              // Plate ne tient une touche pour traitée que si on le lui dit : sans cela l'éditeur la traite aussi
              onKeyDown={(ev) => {
                auClavier(ev);
                return ev.defaultPrevented ? true : undefined;
              }}
              onCut={(ev) => {
                // Couper passe par les règles de la copie : un bloc préparé ne part pas
                ev.preventDefault();
                e.tf.setFragmentData(ev.clipboardData, "cut");
                const ici = blocCourant(e);
                const s = e.selection;
                // Une action de jeu ou une note coupée en entier part avec son bloc : c'est elle qu'on déplace
                const entier =
                  !!s && !!ici && (ici.bloc.type === "action" || ici.bloc.type === "note") && s.anchor.path[0] === s.focus.path[0] && !e.api.isCollapsed() &&
                  lettresDe(ici.bloc) !== "" && e.api.string(s) === lettresDe(ici.bloc);
                if ((s && e.api.isCollapsed() && ici && estFerme(ici.bloc, droits)) || entier) e.tf.supprimerBlocs([ici!.bloc.id]);
                else e.tf.supprimerSelection();
                return true;
              }}
              onMouseDown={(ev) => {
                // Un clic sous le dernier bloc, quand il est fermé, ouvre un paragraphe où écrire
                const blocs = blocsDe(e);
                const bas = (ev.currentTarget.lastElementChild as HTMLElement | null)?.getBoundingClientRect().bottom ?? 0;
                if (arrete || ev.target !== ev.currentTarget || ev.clientY < bas || !estFerme(blocs[blocs.length - 1], droits)) return undefined;
                ev.preventDefault();
                e.tf.insertNodes(paragrapheVide(), { at: [blocs.length] });
                e.tf.allerA(blocs.length);
                reprendreLeTexte();
                return true;
              }}
            />
          </Plate>
          {menuOuvert ? (
            <div className="slash flottant" role="listbox" aria-label="Commandes" ref={menuRef}>
              {proposees.map((c, i) => (
                <button key={c.cle} type="button" role="option" aria-selected={i === barre.choisie} onMouseDown={(ev) => ev.preventDefault()} onClick={() => lancerCommande(c)}>
                  <Icone nom={c.icone} />
                  <span>
                    <b>{c.nom}</b>
                    {c.aide}
                  </span>
                  <kbd>Entrée</kbd>
                </button>
              ))}
            </div>
          ) : null}
          {liste ? (
            <div className="copie__liste flottant" ref={menuRef}>
              {liste.sorte === "objets" ? (
                <ListeObjets
                  jeu={jeu}
                  onChoisir={ecrireObjet}
                  onCreer={adulte && services.ajouterObjet ? (nom) => setFiche({ sorte: "objet-nouveau", nom }) : undefined}
                  onFermer={fermer}
                />
              ) : (
                <ListeFormules
                  jeu={jeu}
                  pourUneAction={liste.sorte === "formules"}
                  onApercu={setFormuleVue}
                  onChoisir={poserAction}
                  onAjouter={adulte && services.ajouterFormule ? () => setFiche({ sorte: "formule-nouvelle", pour: liste }) : undefined}
                  onFermer={fermer}
                />
              )}
            </div>
          ) : null}
          <HorsRecit liaisons={liaisons} lecture={arrete} />
        </div>
        {avecVoisines && !autre && lienDeScene ? <ScenesVoisines sens="apres" voisines={voisines.apres} livre={livre} pourEleve={pourEleve} lienDeScene={lienDeScene} /> : null}
        {autre ? autre.corps : null}
        {dansLePanneau && !autre ? (
          <Reglages panneau={panneau}>
            {dansLePanneau.sorte === "creation" ? (
              <FicheNouveauChoix services={services} onCreer={creerChoix} onCreerLiaison={creerLiaison} onApercu={setApercu} onFermer={fermer} />
            ) : dansLePanneau.sorte === "poser-image" ? (
              <FichePoserImage services={services} surLaLigne={admetUneImage()} onPoser={poserImage} onFermer={fermer} />
            ) : dansLePanneau.sorte === "image" && imageReglee ? (
              <FicheImageBloc
                bloc={imageReglee}
                services={services}
                regler={(valeurs) => e.tf.setNodes(valeurs, { at: [indexDe(imageReglee.id)] })}
                supprimer={() => {
                  e.tf.supprimerBlocs([imageReglee.id]);
                  fermer();
                }}
                onFermer={fermer}
              />
            ) : dansLePanneau.sorte === "symbole" && symboleRegle ? (
              <FicheSymbole
                image={symboleRegle.image}
                regler={(valeurs) => e.tf.setNodes(valeurs, { at: symboleRegle.chemin })}
                supprimer={() => {
                  e.tf.removeNodes({ at: symboleRegle.chemin });
                  fermer();
                }}
                onFermer={fermer}
              />
            ) : dansLePanneau.sorte === "liaison" && liaisonReglee ? (
              <FicheLiaison key={liaisonReglee.id} liaison={liaisonReglee} services={services} gestes={gestesDeLiaison} onFermer={fermer} />
            ) : dansLePanneau.sorte === "objet-nouveau" ? (
              <FicheNouvelObjet nom={dansLePanneau.nom} services={services} onCree={ecrireObjet} onFermer={fermer} />
            ) : dansLePanneau.sorte === "formule-nouvelle" ? (
              <FicheNouvelleFormule services={services} onApercu={setFormuleVue} onCree={poserAction} onFermer={fermer} />
            ) : dansLePanneau.sorte === "reglages" && blocRegle ? (
              <FicheReglagesChoix
                // La même fiche quand la phrase, modifiée, cesse d'être automatique : on y est en train d'écrire
                key={blocRegle.id}
                bloc={blocRegle}
                services={services}
                gestes={gestes(blocRegle)}
                auClavier={dansLePanneau.auClavier}
                onFermer={fermer}
              />
            ) : null}
          </Reglages>
        ) : null}
        {bandeau && !autre ? (
          <div className="copie__message" role="status">
            <Icone nom="info" />
            <p>{bandeau.texte}</p>
            {bandeau.actions?.map((a) => (
              <button key={a.libelle} type="button" className="btn btn--petit" onClick={a.faire}>
                {a.libelle}
              </button>
            ))}
            {bandeau.annuler ? (
              <button
                type="button"
                className="btn btn--petit"
                onClick={() => {
                  const defaire = bandeau.annuler;
                  setBandeau(null);
                  if (typeof defaire === "function") defaire();
                  else e.tf.undo();
                  reprendreLeTexte();
                }}
              >
                Annuler
              </button>
            ) : null}
            <button type="button" className="btn btn--discret btn--petit" aria-label="Fermer ce message" onClick={() => setBandeau(null)}>
              <Icone nom="fermer" />
            </button>
          </div>
        ) : null}
        {autre ? (
          autre.pied ? <div className="copie__pied">{autre.pied}</div> : null
        ) : pied ? (
          <div className="copie__pied">{pied(ou)}</div>
        ) : null}
      </div>
    </Contexte>
  );
}
