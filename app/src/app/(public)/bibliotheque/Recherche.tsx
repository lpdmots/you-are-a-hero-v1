"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icone } from "@/composants/Icone";
import { AGES } from "@/domaine/aides-ia";
import { chercheEnAdresse, demandeDepuis, nomDeLAge, type Demande } from "@/domaine/bibliotheque-publique";
import styles from "./bibliotheque.module.css";

/**
 * Chercher, filtrer, trier (F15, « Liste, tri, filtres ») : la recherche dans le titre et la
 * présentation, l'âge des lecteurs, le type de récit, puis « Les plus récents » ou « Les plus
 * aimés ». Chaque changement remplace l'adresse, que la page relit : une recherche se partage.
 * Sans JavaScript, le formulaire s'envoie tel quel.
 */
export function Recherche({ demande, trouves, total }: { demande: Demande; trouves: number; total: number }) {
  const routeur = useRouter();
  const [q, setQ] = useState(demande.q);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  // La demande en cours, gardée ici : deux filtres changés coup sur coup s'ajoutent, sans attendre que la page relise l'adresse
  const courante = useRef(demande);
  // Un filtre changé ferme le tiroir : la liste change sous lui
  const aller = (d: Demande) => {
    courante.current = d;
    routeur.replace(`/bibliotheque${chercheEnAdresse(d)}`, { scroll: false });
  };
  useEffect(() => () => void (minuterie.current && clearTimeout(minuterie.current)), []);
  // L'adresse relue (retour en arrière, lien suivi) fait foi
  const lue = chercheEnAdresse(demande);
  useEffect(() => {
    courante.current = demandeDepuis(Object.fromEntries(new URLSearchParams(lue)));
  }, [lue]);
  const taper = (v: string) => {
    setQ(v);
    courante.current = { ...courante.current, q: v.trim() };
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => aller({ ...courante.current, q: v.trim() }), 300);
  };
  return (
    <form className={styles.recherche} action="/bibliotheque" method="get" role="search" onSubmit={(e) => (e.preventDefault(), aller({ ...courante.current, q: q.trim() }))}>
      <label className={styles.cherche}>
        <Icone nom="loupe" />
        <span className="vh">Chercher un livre</span>
        <input type="search" name="q" value={q} onChange={(e) => taper(e.target.value)} placeholder="Chercher un titre ou un mot…" maxLength={80} />
      </label>
      <label className={styles.filtre}>
        <span className="vh">Âge des lecteurs</span>
        <select name="age" value={demande.age ?? ""} onChange={(e) => aller({ ...courante.current, age: (e.target.value || null) as Demande["age"] })}>
          <option value="">Tous les âges</option>
          {AGES.map((a) => (
            <option key={a} value={a}>
              {nomDeLAge(a)}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filtre}>
        <span className="vh">Type de récit</span>
        <select name="type" value={demande.type ?? ""} onChange={(e) => aller({ ...courante.current, type: (e.target.value || null) as Demande["type"] })}>
          <option value="">Tous les types</option>
          <option value="choix">Livres-jeux</option>
          <option value="classique">Récits</option>
        </select>
      </label>
      <div className={`bascule ${styles.tri}`} role="group" aria-label="Trier">
        {(["recents", "aimes"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={demande.tri === t} data-choisi={demande.tri === t || undefined} onClick={() => aller({ ...courante.current, tri: t })}>
            {t === "recents" ? "Les plus récents" : "Les plus aimés"}
          </button>
        ))}
      </div>
      <p className={styles.compte} aria-live="polite">
        {trouves === total ? `${total} livre${total > 1 ? "s" : ""}` : `${trouves} livre${trouves > 1 ? "s" : ""} sur ${total}`}
      </p>
    </form>
  );
}
