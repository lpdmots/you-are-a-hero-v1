"use client";

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react";
import { createPlatePlugin, ParagraphPlugin, Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icone, type NomIcone } from "@/composants/Icone";
import {
  ciblesDe, estAuto, estRenvoi, estVide, lettresDe, paragrapheVide, texteOuvert, type Choix, type Droits, type Texte,
} from "@/domaine/copie";
import { nomScene } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import { Paragraphe, PhraseDeChoix, RenvoiEnLigne } from "./Blocs";
import { Contexte, type ContexteDeCopie, type FicheOuverte, type Lieu, type Livre, type SceneConnue, type SceneCreee, type Services } from "./contexte";
import { enPersonnalisee, FicheNouveauChoix, FicheReglagesChoix, nouveauRenvoi, seulRenvoi, type GestesDeChoix } from "./FicheChoix";
import { blocCourant, blocsDe, estFerme, peutModifier, ReglesPlugin, type Editeur, type Signal } from "./regles";
import { SortieGardee } from "./SortieGardee";
import { useEnregistrementTexte, type Cible, type EtatTexte } from "./useEnregistrementTexte";

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
type Bandeau = { texte: string; annuler?: boolean; actions?: { libelle: string; faire: () => void }[] };

type Commande = { cle: string; nom: string; aide: string; icone: NomIcone; faire: () => void };

export type PiedDeCopie = { etat: EtatTexte; vide: boolean; reessayer: () => void };

/** Ce qui se montre à la place du texte de la scène : un texte gardé à part, dans son onglet */
export type AutreTexte = { barre?: ReactNode; corps: ReactNode; pied?: ReactNode };

/** Les droits de l'adulte : tout lui est permis dans ses scènes. */
export const DROITS_ADULTE: Droits = { role: "adulte" };

export function Copie({
  texte, version, cible, marques, libelle, invite = "Écrivez ici.", tete, dessus, pied, autre, apresRetour, onEtat, onVide,
  livre: livreRecu, droits, lieu, pourEleve = false, services,
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
  /** Le livre autour de la scène : numéros, scènes, façon d'annoncer un numéro */
  livre: Livre;
  droits: Droits;
  lieu: Lieu;
  pourEleve?: boolean;
  services: Services;
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
  // Le texte reçu à l'ouverture : ensuite, c'est l'éditeur qui tient le texte
  const [initial] = useState(() => texteOuvert(texte));
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [espace, setEspace] = useState<{ bloc: string; hauteur: number } | null>(null);
  const [haut, setHaut] = useState(0);
  const [bandeau, setBandeau] = useState<Bandeau | null>(null);
  const [barre, setBarre] = useState<{ demande: string; choisie: number } | null>(null);
  const [tire, setTire] = useState<{ bloc: string; avant: string | null } | null>(null);
  const [, setTic] = useState(0);
  const zone = useRef<HTMLDivElement>(null);
  const ficheRef = useRef<HTMLDivElement>(null);
  // La scène créée avec le dernier choix : si ce choix est annulé, elle reste, et la copie le dit (F05-AC44)
  const creation = useRef<{ choix: string; scene: SceneCreee } | null>(null);
  const ciblesRelues = useRef(ciblesDe(texte).sort().join());
  const sauvegarde = useEnregistrementTexte({ cible, version, texte: initial, apresRetour });
  const arrete = sauvegarde.etat.etat === "garde" || sauvegarde.etat.etat === "refuse" || sauvegarde.etat.etat === "ferme";
  const peutChoisir = livre.aChoix && (droits.role === "adulte" || droits.profil === "organisation");
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
        const quoi = s.choix ? `${s.choix} choix supprimé${pluriel(s.choix)}` : `${s.renvois} renvoi${pluriel(s.renvois ?? 1)} retiré${pluriel(s.renvois ?? 1)}`;
        return setBandeau({ texte: `${quoi}. ${(s.choix || s.renvois || 1) > 1 ? "Les scènes où ils menaient sont toujours là." : "La scène où il menait est toujours là."}`, annuler: true });
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
      setBandeau({ texte: dit.join(" "), annuler: s.deplaces + s.copies > 0 });
    },
    [vous],
  );

  const plugins = useMemo(
    () => [
      ParagraphPlugin.withComponent(Paragraphe),
      createPlatePlugin({ key: "choix", node: { isElement: true, component: PhraseDeChoix } }),
      createPlatePlugin({ key: "renvoi", node: { isElement: true, isInline: true, isVoid: true, component: RenvoiEnLigne } }),
      // Les raccourcis sont tenus par la copie : ils disparaissent avec les boutons (F04-AC34)
      BoldPlugin.configure({ shortcuts: { toggle: null } }),
      ItalicPlugin.configure({ shortcuts: { toggle: null } }),
      UnderlinePlugin.configure({ shortcuts: { toggle: null } }),
      // Les droits et le réglage du projet valent pour la page ouverte : un changement s'applique à la suivante
      ReglesPlugin.configure({
        options: {
          marques, droits, projetId: lieu.projetId, sceneId: lieu.sceneId, formule: livreRecu.formule, numeros: livreRecu.numeros,
          scenes: livreRecu.scenes.map((s) => s.id),
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
  const fermer = () => {
    setFiche(null);
    setEspace(null);
    e.tf.focus();
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
    setFiche(null);
    setEspace(null);
    e.tf.focus();
    if (creee) {
      creation.current = { choix: choix.id, scene: creee };
      const chapitre = livre.chapitres.find((c) => c.id === creee.chapitreId);
      apprendre({
        scene: { id: creee.id, reference: creee.reference, titre: creee.titre, chapitreId: creee.chapitreId, chapitre: chapitre?.titre ?? "", partie: chapitre?.partie ?? "", vide: true },
      });
    }
    setBandeau({
      texte: creee
        ? `${nomScene(creee)} est créée${creee.chapitreId !== lieu.chapitreId ? " dans un autre chapitre" : ""}. ${vous ? "Vous restez" : "Tu restes"} dans cette scène.`
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
        if (k !== -1) e.tf.setNodes(valeurs, { at: [i, k] });
      },
      personnaliser: () => {
        remplacer(enPersonnalisee(bloc, livre.formule));
        e.tf.select(e.api.end([i]));
        e.tf.focus();
      },
      automatiser: () => {
        const renvoi = seulRenvoi(bloc);
        if (!renvoi) return;
        remplacer({ type: "choix", id: bloc.id, auto: true, libelle: bloc.libelle, construction: "neutre", cible: renvoi.cible, children: [{ text: "" }] });
        e.tf.allerA(i);
        setBandeau({ texte: "La phrase est de nouveau automatique.", annuler: true });
      },
      insererRenvoi: ({ cible }) => {
        const ici = e.selection?.anchor.path[0] === i ? e.selection : e.api.end([i]);
        e.tf.insertNodes(nouveauRenvoi(cible), { at: ici });
        e.tf.focus();
      },
      retirerRenvoi: (renvoi) => {
        const k = (bloc.children as unknown[]).findIndex((x) => estRenvoi(x) && x.id === renvoi);
        if (k === -1) return;
        e.tf.removeNodes({ at: [i, k] });
        signaler({ sorte: "supprime", choix: 0, renvois: 1 });
      },
      supprimer: () => {
        e.tf.supprimerBlocs([bloc.id]);
        setFiche(null);
        setEspace(null);
        e.tf.focus();
      },
    };
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
  const commandes: Commande[] = peutChoisir
    ? [{ cle: "choix", nom: "Choix", aide: "Une phrase qui mène à une autre scène", icone: "choix", faire: () => ouvrirCreation() }]
    : [];
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

  // La fiche se pose sous son bloc, dans la copie : la place lui est gardée dessous
  const ancre = fiche ? (fiche.sorte === "creation" ? fiche.apres : fiche.bloc) : barre && proposees.length ? (blocCourant(e)?.bloc.id ?? null) : null;
  const avecFiche = !!fiche;
  useLayoutEffect(() => {
    if (!ancre || !zone.current) return;
    const bloc = zone.current.querySelector<HTMLElement>(`[data-bloc="${ancre}"]`);
    if (!bloc) return;
    const mesurer = () => {
      if (!zone.current) return;
      const h = bloc.getBoundingClientRect().bottom - zone.current.getBoundingClientRect().top;
      setHaut((avant) => (Math.abs(avant - h) < 1 ? avant : h));
      const hauteur = (ficheRef.current?.offsetHeight ?? 0) + 14;
      if (avecFiche) setEspace((avant) => (avant?.bloc === ancre && Math.abs(avant.hauteur - hauteur) < 1 ? avant : { bloc: ancre, hauteur }));
    };
    mesurer();
    const veille = new ResizeObserver(mesurer);
    veille.observe(bloc);
    if (ficheRef.current) veille.observe(ficheRef.current);
    return () => veille.disconnect();
  });

  const contexte: ContexteDeCopie = {
    livre, droits, lieu, pourEleve, fiche, espace, tire,
    ouvrir: (bloc) => {
      setBandeau(null);
      lacherLeTexte();
      setFiche({ sorte: "reglages", bloc });
    },
    commencerATirer,
  };
  const blocRegle = fiche?.sorte === "reglages" ? (blocsDe(e).find((b) => b.id === fiche.bloc) as Choix | undefined) : undefined;

  const basculer = (marque: Marque) => {
    if (!marques || arrete) return;
    e.tf.toggleMark(marque);
    e.tf.focus();
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
        if (marques && !ev.shiftKey && blocCourant(e)?.bloc.type === "p") e.tf.toggleMark(marque.cle);
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
      e.tf.insertNodes(paragrapheVide(), { at: [ici.index + 1] });
      return e.tf.allerA(ici.index + 1);
    }
    if (ev.key === "Backspace" || ev.key === "Delete") {
      ev.preventDefault();
      e.tf.supprimerBlocs([ici.bloc.id]);
    }
  };

  const ou: PiedDeCopie = { etat: sauvegarde.etat, vide, reessayer: () => void sauvegarde.reessayer() };
  return (
    <Contexte value={contexte}>
      <SortieGardee />
      {dessus?.(ou)}
      <div className={`copie${arrete ? " copie--lecture" : ""}`}>
        <div className="copie__barre">
          {tete}
          {autre ? (
            autre.barre
          ) : arrete || (!peutChoisir && !marques) ? null : (
            <div className="copie__outils" role="toolbar" aria-label="Outils de la copie">
              {peutChoisir ? (
                <button type="button" className="outil outil--texte" onMouseDown={(ev) => ev.preventDefault()} onClick={() => ouvrirCreation()}>
                  <Icone nom="choix" />
                  Choix
                </button>
              ) : null}
              {peutChoisir && marques ? <span className="outil-sep" aria-hidden="true" /> : null}
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
        <div hidden={!!autre} className="copie__zone" ref={zone}>
          <Plate
            editor={editor}
            readOnly={arrete}
            onChange={() => {
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
              setVide(estVide(suite));
              sauvegarde.noter(suite);
              // La fiche d'un bloc qui n'est plus là se referme
              if (fiche && !suite.some((b) => b.id === (fiche.sorte === "creation" ? fiche.apres : fiche.bloc))) {
                setFiche(null);
                setEspace(null);
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
              // Les destinations ont changé : après l'enregistrement, les numéros se relisent (F05-AC34)
              const cibles = ciblesDe(suite).sort().join();
              if (cibles !== ciblesRelues.current) {
                ciblesRelues.current = cibles;
                void sauvegarde.envoyer().then((ok) => {
                  if (ok) void services.relireNumeros().then((numeros) => apprendre({ numeros }));
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
                if (e.selection && e.api.isCollapsed() && ici && estFerme(ici.bloc, droits)) e.tf.supprimerBlocs([ici.bloc.id]);
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
                e.tf.focus();
                return true;
              }}
            />
          </Plate>
          {barre && proposees.length && !fiche ? (
            <div className="slash" style={{ top: haut }} role="listbox" aria-label="Commandes">
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
          {fiche ? (
            <div className="copie__fiche" style={{ top: haut }} ref={ficheRef}>
              {fiche.sorte === "creation" ? (
                <FicheNouveauChoix services={services} onCreer={creerChoix} onFermer={fermer} />
              ) : blocRegle ? (
                <FicheReglagesChoix key={`${blocRegle.id}-${estAuto(blocRegle)}`} bloc={blocRegle} services={services} gestes={gestes(blocRegle)} confirmer={fiche.confirmer} auClavier={fiche.auClavier} onFermer={fermer} />
              ) : null}
            </div>
          ) : null}
        </div>
        {autre ? autre.corps : null}
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
                  setBandeau(null);
                  e.tf.undo();
                  e.tf.focus();
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
