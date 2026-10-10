"use client";

import type { Preparation } from "@/domaine/preparation";
import type { Organisation, Recit } from "@/domaine/projets";
import type { Plan } from "@/domaine/recit";

/** Carnet de préparation (F02) — écrit au lot suivant. */
export function Carnet({ projet }: { projet: { id: string; titre: string; organisation: Organisation; recit: Recit }; preparation: Preparation; plan: Plan }) {
  return <p hidden>{projet.id}</p>;
}
