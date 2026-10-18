import "server-only";
import type { Enseignant } from "./adulte";
import type { Projet } from "./lectures";
import type { Jeu, Livre, Voisines } from "@/composants/copie/contexte";
import type { Encouragement } from "@/domaine/encouragements";
import { numerosDuPlan } from "@/domaine/numeros";
import { scenesDe, type ElevePlan, type Plan } from "@/domaine/recit";
import { texteDeScene, voisinesDe, type TexteDeScene } from "./copie";
import { encouragementsDeScene } from "./encouragements";
import { elevesDeLaClasse, preparationDe } from "./recit";
import { relectureDe, type Relecture } from "./relecture";

/**
 * Ce qu'il faut pour ouvrir une scène dans l'éditeur de l'adulte : sa page, et la même scène
 * ouverte à côté de l'aperçu du livre (F11.2), qui a le même éditeur.
 */
export type DonneesDeLaScene = {
  eleves: ElevePlan[];
  texte: TexteDeScene;
  relecture: Relecture;
  encouragements: Encouragement[];
  livre: Livre;
  jeu: Jeu;
  voisines: Voisines;
  voisinesAffichees: boolean;
};

export async function donneesDeLaScene(e: Enseignant, projet: Projet, plan: Plan, sceneId: string): Promise<DonneesDeLaScene | null> {
  const [eleves, texte, preparation, voisines, preference, relecture, encouragements] = await Promise.all([
    elevesDeLaClasse(e, projet.classe?.id ?? null),
    texteDeScene(e, sceneId),
    preparationDe(e, projet.id),
    voisinesDe(e.supabase, sceneId),
    e.supabase.from("enseignants").select("voisines").eq("id", e.id).maybeSingle(),
    relectureDe(e, sceneId),
    // Un projet personnel n'a personne à encourager (F07.5)
    projet.organisation === "classe" ? encouragementsDeScene(e, sceneId) : [],
  ]);
  if (!texte || !relecture) return null;
  // Le livre autour de la scène : numéros des passages, scènes où peut mener un choix (F05, F11.5)
  const livre: Livre = {
    aChoix: projet.recit === "choix",
    formule: preparation?.formuleRenvoi ?? "rends",
    constructions: preparation?.constructions ?? ["neutre"],
    numeros: projet.recit === "choix" ? Object.fromEntries(numerosDuPlan(plan).de) : {},
    scenes: plan.parties.flatMap((p) =>
      p.chapitres.flatMap((c) =>
        c.scenes.map((s) => ({
          id: s.id, reference: s.reference, titre: s.titre, chapitreId: c.id, chapitre: c.titre, partie: p.titre, vide: s.texteVide, consigne: s.consigne,
        })),
      ),
    ),
    ailleurs: {},
    chapitres: plan.parties.flatMap((p) => p.chapitres.map((c) => ({ id: c.id, titre: c.titre, partie: p.titre }))),
    fixes: Object.fromEntries(scenesDe(plan).flatMap((s) => (s.numeroFixe ? [[s.id, s.numeroFixe]] : []))),
    depart: plan.departSceneId,
  };
  return {
    eleves, texte, relecture, encouragements, livre,
    jeu: {
      objets: preparation?.objets ?? [],
      formules: projet.recit === "choix" ? (preparation?.formules ?? []) : [],
      personnages: (preparation?.personnagesDeLHistoire ?? []).map((p) => ({ id: p.id, nom: p.nom, autresNoms: p.autresNoms })),
    },
    voisines,
    voisinesAffichees: preference.data?.voisines !== false,
  };
}
