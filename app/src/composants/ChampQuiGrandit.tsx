"use client";

import { useLayoutEffect, useRef } from "react";
import { Dictable, type ProprietesDuChamp } from "./dictee/ChampDictable";

/**
 * Un champ de plusieurs lignes qui prend la hauteur de son texte : tout se lit sans faire
 * défiler le champ. `rows` en donne la hauteur la plus petite. Il se remesure quand sa
 * largeur change (fenêtre, téléphone qui tourne, panneau qu'on ouvre). Dans l'espace de l'adulte,
 * il a son micro (F07.4), sauf `dictee={false}` ; `micro="titre"` le pose sur la ligne du titre.
 */
export function ChampQuiGrandit({ dictee = true, micro = "champ", ...props }: ProprietesDuChamp) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const t = ref.current;
    if (!t) return;
    let largeur = -1;
    const mesurer = () => {
      t.style.height = "auto";
      // La bordure compte dans la hauteur : sans elle, une barre de défilement reparaîtrait
      t.style.height = `${t.scrollHeight + t.offsetHeight - t.clientHeight}px`;
    };
    mesurer();
    const observe = new ResizeObserver(([e]) => {
      if (e.contentRect.width === largeur) return;
      largeur = e.contentRect.width;
      mesurer();
    });
    observe.observe(t);
    return () => observe.disconnect();
  }, [props.value]);
  return (
    <Dictable champ={ref} dictee={dictee} micro={micro} props={props}>
      <textarea ref={ref} {...props} style={{ ...props.style, overflow: "hidden", resize: "none" }} />
    </Dictable>
  );
}
