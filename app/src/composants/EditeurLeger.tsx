"use client";

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react";
import { ParagraphPlugin, Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useState } from "react";
import type { Lettres } from "@/domaine/copie";
import type { TexteLeger } from "@/domaine/pages";

/**
 * Un texte court à mise en forme légère (F04.1) : paragraphes, gras, italique et souligné, et
 * rien d'autre. Sert aux textes des pages de présentation du livre (F11.4).
 */

type Noeud = { type: "p"; children: Lettres[] };
type Marque = "bold" | "italic" | "underline";
const MARQUES: { cle: Marque; nom: string; signe: string; touche: string }[] = [
  { cle: "bold", nom: "Gras", signe: "G", touche: "b" },
  { cle: "italic", nom: "Italique", signe: "I", touche: "i" },
  { cle: "underline", nom: "Souligné", signe: "S", touche: "u" },
];

const enNoeuds = (t: TexteLeger): Noeud[] => (t.length ? t : [[{ text: "" }]]).map((p) => ({ type: "p", children: p.length ? p : [{ text: "" }] }));
const enTexte = (noeuds: Noeud[]): TexteLeger =>
  noeuds.map((n) => n.children.map((l) => ({ text: l.text, ...(l.bold ? { bold: true as const } : {}), ...(l.italic ? { italic: true as const } : {}), ...(l.underline ? { underline: true as const } : {}) })));

export function EditeurLeger({ valeur, onChange, libelle, invite }: { valeur: TexteLeger; onChange: (t: TexteLeger) => void; libelle: string; invite?: string }) {
  const [initial] = useState(() => enNoeuds(valeur));
  const editor = usePlateEditor({
    plugins: [ParagraphPlugin, BoldPlugin, ItalicPlugin, UnderlinePlugin],
    value: initial as never,
  });
  return (
    <div className="editeur-leger">
      <Plate editor={editor} onValueChange={({ value }) => onChange(enTexte(value as unknown as Noeud[]))}>
        <div className="editeur-leger__outils" role="toolbar" aria-label={`Mise en forme : ${libelle}`}>
          {MARQUES.map((m) => (
            <button
              key={m.cle}
              type="button"
              className="outil"
              title={`${m.nom} (Ctrl+${m.touche.toUpperCase()})`}
              aria-label={m.nom}
              onMouseDown={(ev) => {
                ev.preventDefault();
                editor.tf.toggleMark(m.cle);
              }}
            >
              <b className={`editeur-leger__signe editeur-leger__signe--${m.cle}`} aria-hidden="true">
                {m.signe}
              </b>
            </button>
          ))}
        </div>
        <PlateContent
          className="editeur-leger__texte"
          aria-label={libelle}
          placeholder={invite}
          onKeyDown={(ev) => {
            if (!(ev.metaKey || ev.ctrlKey) || ev.shiftKey || ev.altKey) return;
            const m = MARQUES.find((x) => x.touche === ev.key.toLowerCase());
            if (!m) return;
            ev.preventDefault();
            editor.tf.toggleMark(m.cle);
          }}
        />
      </Plate>
    </div>
  );
}
