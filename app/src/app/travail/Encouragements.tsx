import { Classement, TamponEncouragement, type ColonneDeClassement } from "@/composants/Encouragements";
import { nomPourEleves, type Eleve } from "@/domaine/eleves";
import { CATEGORIES, NOM_CATEGORIE, sansTotal, type Categorie } from "@/domaine/encouragements";
import type { MesEncouragements } from "@/serveur/encouragements";
import styles from "./travail.module.css";

/**
 * Les encouragements de l'élève, dans « Mon travail » (F07.5) : une ligne donne ses totaux,
 * seulement s'il a au moins un tampon (F07-AC81) ; quand l'enseignant montre le classement,
 * les trois premiers de chaque catégorie et son propre total, rien d'autre (F07-AC86).
 * Aucune annonce quand un tampon arrive : il le découvre ici ou sur sa scène.
 */
export function Encouragements({
  histoires, eleves, moi,
}: {
  /** Un bloc par histoire de la classe ; son titre ne s'affiche que s'il y en a plusieurs */
  histoires: { id: string; titre: string; recu: MesEncouragements }[];
  eleves: Eleve[];
  moi: Eleve;
}) {
  const eleve = new Map(eleves.map((e) => [e.id, e]));
  const blocs = histoires.flatMap((h) => {
    const miens = sansTotal();
    for (const t of h.recu.tampons) miens[t.categorie] += 1;
    const colonnes: ColonneDeClassement[] = h.recu.classement
      ? CATEGORIES.map((c) => {
          const marches = (h.recu.classement?.[c] ?? []).map((m) => ({
            total: m.total,
            noms: m.eleves
              .flatMap((id) => (eleve.has(id) ? [eleve.get(id)!] : []))
              .sort((a, b) => a.prenom.localeCompare(b.prenom, "fr"))
              .map((e) => ({ nom: nomPourEleves(e, eleves), moi: e.id === moi.id })),
          }));
          return { categorie: c, marches, monTotal: miens[c] || null };
        })
      : [];
    const aDesTampons = h.recu.tampons.length > 0;
    const aUnClassement = colonnes.some((c) => c.marches.length > 0);
    return aDesTampons || aUnClassement ? [{ ...h, miens, colonnes, aDesTampons, aUnClassement }] : [];
  });
  if (blocs.length === 0) return null;
  const plusieurs = histoires.length > 1;
  return (
    <section className={styles.encouragements} aria-labelledby="t-encouragements">
      <h2 id="t-encouragements">{blocs.some((b) => b.aDesTampons) ? "Tes encouragements" : "Les encouragements de la classe"}</h2>
      {blocs.map((b) => (
        <div key={b.id} className={styles.encouragementsBloc}>
          {plusieurs ? <p className={styles.encouragementsHistoire}>{b.titre}</p> : null}
          {/* Classement montré : ses totaux sont dans l'en-tête de chaque colonne, pas répétés au-dessus */}
          {b.aDesTampons && !b.aUnClassement ? (
            <ul className={styles.totaux} aria-label="Tes totaux">
              {CATEGORIES.filter((c) => b.miens[c]).map((c: Categorie) => (
                <li key={c}>
                  <TamponEncouragement categorie={c} />
                  {NOM_CATEGORIE[c]} <b className="chiffres">{b.miens[c]}</b>
                </li>
              ))}
            </ul>
          ) : null}
          {b.aUnClassement ? (
            <div className={styles.classement}>
              <p>Ceux qui en ont le plus, dans la classe</p>
              <Classement colonnes={b.colonnes} />
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
