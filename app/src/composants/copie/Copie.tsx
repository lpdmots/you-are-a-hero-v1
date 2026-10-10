"use client";

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react";
import { createPlatePlugin, ParagraphPlugin, Plate, PlateContent, PlateElement, usePlateEditor, type PlateElementProps } from "platejs/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMessage } from "@/composants/Messages";
import {
  estVide, lireCollage, lireTexteSimple, nettoyerTexte, nouvelId, paragrapheVide, texteOuvert, type Lettres, type Paragraphe as BlocDeRecit, type Texte,
} from "@/domaine/copie";
import { SortieGardee } from "./SortieGardee";
import { useEnregistrementTexte, type Cible, type EtatTexte } from "./useEnregistrementTexte";

/**
 * La copie : la page où l'on écrit le récit d'une scène (F04, F08.2). L'éditeur est Plate,
 * sur Slate (ADR 0002). Le texte s'enregistre seul ; le pied, que la page fournit, dit où
 * il en est.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editeur = any;
type Marque = "bold" | "italic" | "underline";
const MARQUES: { cle: Marque; lettre: string; nom: string; touche: string }[] = [
  { cle: "bold", lettre: "G", nom: "Gras", touche: "b" },
  { cle: "italic", lettre: "I", nom: "Italique", touche: "i" },
  { cle: "underline", lettre: "S", nom: "Souligné", touche: "u" },
];

const Paragraphe = (props: PlateElementProps) => <PlateElement {...props} as="p" />;

/** Un collage devient des paragraphes de récit, chacun avec sa propre identité. */
const enBlocs = (paragraphes: Lettres[][]): Texte => paragraphes.map((children) => ({ type: "p", id: nouvelId(), children }));

/** Ce que Slate a mis dans le presse-papiers en copiant depuis une copie de l'application. */
function fragmentInterne(data: DataTransfer): unknown {
  const code = data.getData("application/x-slate-fragment");
  if (!code) return null;
  try {
    return JSON.parse(decodeURIComponent(window.atob(code)));
  } catch {
    return null;
  }
}

/** Règles de la copie que Plate ne fournit pas : identité des blocs, collage nettoyé. */
function regles({ marques, dire }: { marques: boolean; dire: (texte: string) => void }) {
  return createPlatePlugin({ key: "regles" }).overrideEditor(({ editor, tf }) => {
    const e: Editeur = editor;
    const { insertData, normalizeNode } = tf;
    const sansMarques = (texte: Texte): Texte =>
      marques ? texte : texte.map((b) => (b.type === "p" ? { ...b, children: b.children.map((l) => ({ text: l.text })) } : b));
    return {
      transforms: {
        insertData(data: DataTransfer) {
          // Copié depuis une scène de l'application : le même contrôle que pour ce qui s'enregistre
          const interne = nettoyerTexte(fragmentInterne(data));
          if (interne?.length) {
            e.tf.insertFragment(sansMarques(interne).map((b) => ({ ...b, id: nouvelId() })));
            return;
          }
          const images = [...(data.files ?? [])].filter((f) => f.type.startsWith("image/")).length;
          const html = data.getData("text/html");
          if (html) {
            const lu = lireCollage(new DOMParser().parseFromString(html, "text/html").body, marques);
            if (lu.paragraphes.length) e.tf.insertFragment(enBlocs(lu.paragraphes));
            // Une image collée est écartée : les images passent par l'import (F04-AC36)
            if (lu.imagesEcartees || images) dire("L’image n’a pas été collée : une image s’ajoute avec le bouton « Image ».");
            if (lu.paragraphes.length || lu.imagesEcartees) return;
          }
          const simple = lireTexteSimple(data.getData("text/plain"));
          if (simple.length) {
            e.tf.insertFragment(enBlocs(simple));
            return;
          }
          if (images) {
            dire("L’image n’a pas été collée : une image s’ajoute avec le bouton « Image ».");
            return;
          }
          insertData(data);
        },
        normalizeNode(entree: [unknown, number[]], options?: unknown) {
          const [, chemin] = entree;
          if (chemin.length === 0) {
            const blocs = e.children as { id?: string }[];
            if (blocs.length === 0) {
              e.tf.insertNodes(paragrapheVide(), { at: [0] });
              return;
            }
            // Un paragraphe coupé en deux garde son identité d'un côté, en reçoit une de l'autre
            const vus = new Set<string>();
            for (let i = 0; i < blocs.length; i += 1) {
              const id = blocs[i].id;
              if (!id || vus.has(id)) {
                e.tf.setNodes({ id: nouvelId() }, { at: [i] });
                return;
              }
              vus.add(id);
            }
          }
          normalizeNode(entree as never, options as never);
        },
      },
    };
  });
}

export type PiedDeCopie = { etat: EtatTexte; vide: boolean; reessayer: () => void };

/** Ce qui se montre à la place du texte de la scène : un texte gardé à part, dans son onglet */
export type AutreTexte = { barre?: ReactNode; corps: ReactNode; pied?: ReactNode };

export function Copie({
  texte, version, cible, marques, libelle, invite = "Écrivez ici.", tete, dessus, pied, autre, apresRetour, onEtat, onVide,
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
}) {
  const dire = useMessage();
  const [actives, setActives] = useState<Record<Marque, boolean>>({ bold: false, italic: false, underline: false });
  const [vide, setVide] = useState(() => estVide(texte));
  // Le texte reçu à l'ouverture : ensuite, c'est l'éditeur qui tient le texte
  const [initial] = useState(() => texteOuvert(texte));
  const sauvegarde = useEnregistrementTexte({ cible, version, texte: initial, apresRetour });
  const arrete = sauvegarde.etat.etat === "garde" || sauvegarde.etat.etat === "refuse" || sauvegarde.etat.etat === "ferme";

  useEffect(() => {
    onEtat?.(sauvegarde.etat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sauvegarde.etat]);
  useEffect(() => {
    onVide?.(vide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vide]);

  const plugins = useMemo(
    () => [
      ParagraphPlugin.withComponent(Paragraphe),
      // Les raccourcis sont tenus par la copie : ils disparaissent avec les boutons (F04-AC34)
      BoldPlugin.configure({ shortcuts: { toggle: null } }),
      ItalicPlugin.configure({ shortcuts: { toggle: null } }),
      UnderlinePlugin.configure({ shortcuts: { toggle: null } }),
      // Le réglage du projet vaut pour la page ouverte : un changement s'applique à la suivante
      regles({ marques, dire: (t) => dire({ texte: t }) }),
    ],
    [dire, marques],
  );
  // Les identités des blocs sont tenues par la copie, pas par Plate
  const editor = usePlateEditor({ plugins, value: initial as never, nodeId: false });
  const e: Editeur = editor;

  // Les parcours joués par les tests posent le curseur par programme : jamais dans l'application en ligne
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ESSAIS !== "1" && process.env.NODE_ENV === "production") return;
    (window as unknown as { __copie?: Editeur }).__copie = e;
    return () => {
      delete (window as unknown as { __copie?: Editeur }).__copie;
    };
  }, [e]);

  const basculer = (marque: Marque) => {
    if (!marques || arrete) return;
    e.tf.toggleMark(marque);
    e.tf.focus();
  };

  const ou: PiedDeCopie = { etat: sauvegarde.etat, vide, reessayer: () => void sauvegarde.reessayer() };
  return (
    <>
    <SortieGardee />
    {dessus?.(ou)}
    <div className={`copie${arrete ? " copie--lecture" : ""}`}>
      <div className="copie__barre">
        {tete}
        {autre ? (
          autre.barre
        ) : marques && !arrete ? (
          <div className="copie__outils" role="toolbar" aria-label="Mise en forme">
            {MARQUES.map((m) => (
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
            ))}
          </div>
        ) : null}
      </div>
      <div hidden={!!autre}>
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
        }}
        onValueChange={({ value }) => {
          const suite = value as unknown as Texte;
          setVide(estVide(suite));
          sauvegarde.noter(suite);
        }}
      >
        <PlateContent
          className="copie__texte"
          aria-label={libelle}
          placeholder={invite}
          spellCheck
          lang="fr"
          onKeyDown={(ev) => {
            const mod = ev.metaKey || ev.ctrlKey;
            if (!mod || ev.altKey) return;
            const touche = ev.key.toLowerCase();
            const marque = MARQUES.find((m) => m.touche === touche);
            if (marque) {
              // Sans les trois boutons, leurs raccourcis ne font rien non plus (F04-AC34)
              ev.preventDefault();
              if (marques && !ev.shiftKey) e.tf.toggleMark(marque.cle);
            }
          }}
        />
      </Plate>
      </div>
      {autre ? autre.corps : null}
      {autre ? (
        autre.pied ? <div className="copie__pied">{autre.pied}</div> : null
      ) : pied ? (
        <div className="copie__pied">{pied(ou)}</div>
      ) : null}
    </div>
    </>
  );
}

/** Un texte en lecture : une remise, un texte gardé à part, la scène d'un camarade. */
export function TexteLu({ texte, libelle }: { texte: Texte; libelle: string }) {
  return (
    <div className="copie__texte copie__texte--lu" aria-label={libelle} lang="fr">
      {estVide(texte) ? (
        <p className="copie__vide">Ce texte est vide.</p>
      ) : (
        texte.filter((b): b is BlocDeRecit => b.type === "p").map((bloc) => (
          <p key={bloc.id}>
            {bloc.children.map((l, i) => {
              let mots: ReactNode = l.text;
              if (l.bold) mots = <strong>{mots}</strong>;
              if (l.italic) mots = <em>{mots}</em>;
              if (l.underline) mots = <u>{mots}</u>;
              return <span key={i}>{mots}</span>;
            })}
            {bloc.children.every((l) => l.text === "") ? <br /> : null}
          </p>
        ))
      )}
    </div>
  );
}
