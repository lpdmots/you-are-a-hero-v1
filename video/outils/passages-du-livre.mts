/**
 * Les passages d'un livre d'exemple, numérotés comme dans le livre (src/domaine/numeros.ts), d'après
 * son instantané (app/scripts/exemples/<livre>/livre.json) : pour que la vidéo montre ses vrais textes.
 *
 *   cd V1/app && npx tsx ../video/outils/passages-du-livre.mts passeurs-de-brume > sortie.json
 */
import { readFileSync } from "node:fs";
import { numeroter, type PlanNumerote } from "../../app/src/domaine/numeros";
import { phraseDeChoix, type Construction, type FormuleRenvoi } from "../../app/src/domaine/preparation";

const livre = process.argv[2] ?? "passeurs-de-brume";
const d = JSON.parse(readFileSync(`../app/scripts/exemples/${livre}/livre.json`, "utf8"));
const t = d.tables;
const parRang = (a: { rang: number }, b: { rang: number }) => a.rang - b.rang;
const plan: PlanNumerote = {
  departSceneId: d.projet.depart_scene_id,
  parties: [...t.parties].sort(parRang).map((p) => ({
    id: p.id, groupeAvecPrecedente: p.groupe_avec_precedente, ouvertureSceneId: p.ouverture_scene_id,
    chapitres: t.chapitres.filter((c) => c.partie_id === p.id).sort(parRang).map((c) => ({
      horsLivre: c.hors_livre,
      scenes: t.scenes.filter((s) => s.chapitre_id === c.id).sort(parRang).map((s) => ({ id: s.id, horsLivre: s.hors_livre, rangLivre: s.rang_livre, numeroFixe: s.numero_fixe })),
    })),
  })),
};
const { de, ordre } = numeroter(plan);
const image = new Map(d.images.map((i) => [i.id, i.fichier]));
const formule: FormuleRenvoi = d.preparation?.formuleRenvoi ?? "rends";
const texte = (n): string => (n.text ?? "") + (n.children ?? []).map((c) => (c.type === "renvoi" ? String(de.get(c.cible) ?? "?") : texte(c))).join("");
const passages = ordre.map((id) => {
  const s = t.scenes.find((x) => x.id === id);
  const blocs = (s.texte ?? []).flatMap((b) => {
    if (b.type === "image") return [{ image: image.get(b.image), ...(b.page ? { pleinePage: true } : {}) }];
    if (b.type === "choix") {
      const brut = texte(b).trim();
      return [{ choix: brut || phraseDeChoix(b.libelle, de.get(b.cible) ?? "?", formule, (b.construction ?? "neutre") as Construction) }];
    }
    if (b.type === "action") return [{ action: texte(b).trim() }];
    const p = texte(b).trim();
    return p ? [{ p }] : [];
  });
  return { n: de.get(id), ref: s.reference, titre: s.titre, blocs };
});
console.log(JSON.stringify(passages, null, 1));
