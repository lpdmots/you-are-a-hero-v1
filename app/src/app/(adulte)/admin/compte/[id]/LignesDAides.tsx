"use client";

import { useState } from "react";
import { Icone } from "@/composants/Icone";
import type { Mouvement } from "@/domaine/etoiles";
import admin from "../../admin.module.css";
import styles from "./etoiles.module.css";

const format = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...o, timeZone: "Europe/Paris" });
const jourEtHeure = format({ day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const jourSeul = format({ day: "numeric", month: "short", year: "numeric" });
const heure = format({ hour: "2-digit", minute: "2-digit" });

/** « 21 oct. 2026, 09:35 → 09:38 », ou les deux dates entières si la suite passe minuit. */
function periode(premiere: string, derniere: string): string {
  const [a, b] = [new Date(premiere), new Date(derniere)];
  return jourSeul.format(a) === jourSeul.format(b) ? `${jourEtHeure.format(a)} → ${heure.format(b)}` : `${jourEtHeure.format(a)} → ${jourEtHeure.format(b)}`;
}

/** Une suite d'aides en une ligne, leur total ; le détail se déplie, pour chercher un dysfonctionnement. */
export function LignesDAides({ total, premiere, derniere, aides }: { total: number; premiere: string; derniere: string; aides: Mouvement[] }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <tr className={styles.suite}>
        <td>{periode(premiere, derniere)}</td>
        <td>
          <button type="button" className={styles.deplier} aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
            <Icone nom="chevron" className={ouvert ? styles.ouvert : undefined} />
            Aides IA · {aides.length} demandes
          </button>
        </td>
        <td className={admin.nb}>{total}</td>
        <td />
      </tr>
      {ouvert
        ? aides.map((m, i) => (
            <tr key={i} className={styles.detail}>
              <td>{jourEtHeure.format(new Date(m.quand))}</td>
              <td>Aide IA</td>
              <td className={admin.nb}>{m.nombre}</td>
              <td />
            </tr>
          ))
        : null}
    </>
  );
}
