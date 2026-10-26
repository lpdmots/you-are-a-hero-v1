"use client";

import { useEffect, useState } from "react";
import { Icone } from "./Icone";

/**
 * Le cœur d'un livre de la bibliothèque (F15, « Les cœurs » ; F15-AC13) : un clic donne, un autre
 * retire, un par livre et par navigateur, sans compte. Le navigateur tire un identifiant au hasard
 * et le garde pour cette seule fonction, que le lecteur demande : pas de bandeau. Le nombre se lit
 * à côté du cœur, sauf à zéro, où l'on voit le seul cœur vide. Un livre sans navigateur qui garde
 * (navigation privée stricte) donne quand même son cœur, le temps de la page.
 */

const CLE_LECTEUR = "bibliotheque-lecteur";
const CLE_DONNES = "bibliotheque-coeurs";

function lecteur(): string {
  try {
    const deja = localStorage.getItem(CLE_LECTEUR);
    if (deja && /^[A-Za-z0-9_-]{16,64}$/.test(deja)) return deja;
    const neuf = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(CLE_LECTEUR, neuf);
    return neuf;
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}
const donnes = (): string[] => {
  try {
    const l = JSON.parse(localStorage.getItem(CLE_DONNES) ?? "[]");
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};
const retenir = (adresse: string, oui: boolean) => {
  try {
    const l = donnes().filter((a) => a !== adresse);
    localStorage.setItem(CLE_DONNES, JSON.stringify(oui ? [...l, adresse].slice(-500) : l));
  } catch {
    // Sans stockage, le cœur vaut le temps de la page
  }
};

export function Coeur({ adresse, nombre, variante = "tiroir" }: { adresse: string; nombre: number; variante?: "tiroir" | "fin" }) {
  const [donne, setDonne] = useState(false);
  const [compte, setCompte] = useState(nombre);
  const [envoi, setEnvoi] = useState(false);

  // Ce que ce navigateur sait déjà, puis ce que dit la base
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le navigateur n'est lisible qu'une fois la page montée
    setDonne(donnes().includes(adresse));
    let vivant = true;
    fetch(`/coeurs?adresse=${encodeURIComponent(adresse)}&lecteur=${lecteur()}`)
      .then((r) => r.json())
      .then((r: { donne?: boolean }) => {
        if (!vivant || typeof r.donne !== "boolean") return;
        setDonne(r.donne);
        retenir(adresse, r.donne);
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [adresse]);

  const basculer = async () => {
    if (envoi) return;
    const oui = !donne;
    setEnvoi(true);
    setDonne(oui);
    setCompte((c) => Math.max(0, c + (oui ? 1 : -1)));
    try {
      const r = (await (
        await fetch("/coeurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adresse, lecteur: lecteur(), oui }) })
      ).json()) as { ok: boolean; coeurs?: number; donne?: boolean };
      if (r.ok && typeof r.coeurs === "number") {
        setCompte(r.coeurs);
        setDonne(oui);
        retenir(adresse, oui);
      }
    } catch {
      // Le cœur reste comme on l'a vu ; il se relira à la prochaine visite
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={`coeur coeur--${variante}`}>
      {variante === "fin" ? <p className="coeur__question">Ce livre t’a plu ?</p> : null}
      <button
        type="button"
        className="coeur__bouton"
        aria-pressed={donne}
        aria-label={donne ? "Retirer mon cœur" : "Donner un cœur à ce livre"}
        title={donne ? "Retirer mon cœur" : "Donner un cœur à ce livre"}
        onClick={() => void basculer()}
      >
        <Icone nom="coeur" />
        {compte > 0 ? <span className="coeur__nombre">{compte}</span> : null}
      </button>
    </div>
  );
}
