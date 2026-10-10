"use client";

import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { nomPourEleves } from "@/domaine/eleves";
import { motSansEleve, nomScene, referenceScene, type Chapitre, type ElevePlan, type Scene } from "@/domaine/recit";
import { confierScene } from "../../actions-recit";

/** Ce qu'une scène dit de qui s'en occupe, pour l'enseignant : « Alice s'en occupe », « Vous vous en occupez », « Pas encore prise ». */
export function libelleQui(scene: Scene, chapitre: Chapitre, eleves: ElevePlan[]): string {
  if (scene.priseParEnseignant) return "Vous vous en occupez";
  const eleve = eleves.find((e) => e.id === scene.priseParEleve);
  return eleve ? `${nomPourEleves(eleve, eleves)} s’en occupe` : motSansEleve(chapitre);
}

/**
 * « Qui s'en occupe » (F06.3) : l'enseignant désigne un élève du chapitre, se l'attribue
 * (« Moi ») ou retire la prise en charge. Le même menu sur la carte de la scène et dans sa
 * page. La prise en charge d'un élève informe, sans rien interdire aux autres ; celle de
 * l'enseignant lui réserve la scène.
 */
export function QuiSenOccupe({ scene, chapitre, eleves }: { scene: Scene; chapitre: Chapitre; eleves: ElevePlan[] }) {
  const dire = useMessage();
  const duChapitre = chapitre.attributions.flatMap((a) => eleves.filter((e) => e.id === a.eleveId));
  const actuel = scene.priseParEnseignant ? "moi" : (duChapitre.find((e) => e.id === scene.priseParEleve)?.id ?? null);
  const eleve = duChapitre.find((e) => e.id === actuel);

  const confier = async (a: string | null) => {
    if (a === actuel) return;
    const fait = await confierScene(scene.id, a);
    if (!fait.ok) return dire({ texte: fait.erreur });
    const choisi = duChapitre.find((e) => e.id === a);
    dire({
      texte:
        a === "moi"
          ? `Vous vous occupez de ${nomScene(scene)} : les élèves la lisent, sans pouvoir l’écrire.`
          : choisi
            ? `${nomPourEleves(choisi, eleves)} s’occupe de ${nomScene(scene)}.`
            : `Plus personne ne s’occupe de ${nomScene(scene)}. Son contenu est conservé.`,
      annuler: () => void confierScene(scene.id, actuel),
    });
  };

  const coche = (a: string | null) => (a === actuel ? <Icone nom="coche" /> : <span />);
  return (
    <Menu
      agauche
      libelle={`Qui s’occupe de ${referenceScene(scene.reference)} : ${libelleQui(scene, chapitre, eleves)}. Changer`}
      bouton={
        <>
          {eleve ? <Gommette prenom={eleve.prenom} couleur={eleve.couleur} taille="s" /> : null}
          <span className={actuel ? undefined : "qui__libre"}>{libelleQui(scene, chapitre, eleves)}</span>
          <Icone nom="chevron-bas" />
        </>
      }
    >
      {(fermer) => (
        <>
          {duChapitre.map((e) => (
            <button key={e.id} type="button" className="qui__choix" aria-pressed={actuel === e.id} onClick={() => { fermer(); void confier(e.id); }}>
              <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
              <span>{nomPourEleves(e, eleves)}</span>
              {coche(e.id)}
            </button>
          ))}
          {duChapitre.length ? <hr /> : <p className="menu__note">Ce chapitre n’a pas encore d’élève : attribuez-le pour leur confier ses scènes.</p>}
          <button type="button" className="qui__choix" aria-pressed={actuel === "moi"} onClick={() => { fermer(); void confier("moi"); }}>
            <span />
            <span>Moi</span>
            {coche("moi")}
          </button>
          <button type="button" className="qui__choix" aria-pressed={actuel === null} onClick={() => { fermer(); void confier(null); }}>
            <span />
            <span>{motSansEleve(chapitre)}</span>
            {coche(null)}
          </button>
        </>
      )}
    </Menu>
  );
}
