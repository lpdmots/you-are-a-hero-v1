import type { ReactNode } from "react";
import { BarreAdulte } from "@/composants/BarreAdulte";
import { Messages } from "@/composants/Messages";
import { ProjetCourant } from "@/composants/ProjetCourant";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";

/** Espace de l'adulte : la barre du haut est globale (F06.5, 4 octobre 2026). */
export default async function EspaceAdulte({ children }: { children: ReactNode }) {
  const enseignant = await exigerEnseignant();
  const dernier = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
  return (
    <Messages>
      <ProjetCourant depart={dernier ? { id: dernier.id, titre: dernier.titre, onglet: dernier.dernierOnglet } : null}>
        <BarreAdulte nomAffiche={enseignant.nomAffiche} courriel={enseignant.courriel} />
        <main>{children}</main>
      </ProjetCourant>
    </Messages>
  );
}
