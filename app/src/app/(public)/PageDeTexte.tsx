import type { ReactNode } from "react";
import type { Document } from "@/domaine/textes-publics";
import styles from "./public.module.css";

/** Une ligne, l'adresse de contact devenue un lien. */
function Ligne({ texte }: { texte: string }) {
  const morceaux = texte.split(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/);
  return <>{morceaux.map((m, i) => (i % 2 ? <a key={i} href={`mailto:${m}`}>{m}</a> : m))}</>;
}

/** L'ancre d'une section. */
const ancre = (titre: string) => titre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Les paragraphes d'une section ; les lignes qui commencent par « – » forment une liste. */
function Paragraphes({ lignes }: { lignes: string[] }) {
  const blocs: ReactNode[] = [];
  let liste: string[] = [];
  const fermer = () => {
    if (liste.length) blocs.push(<ul key={`l${blocs.length}`}>{liste.map((l, i) => <li key={i}><Ligne texte={l} /></li>)}</ul>);
    liste = [];
  };
  for (const l of lignes) {
    if (l.startsWith("– ")) liste.push(l.slice(2));
    else {
      fermer();
      blocs.push(<p key={`p${blocs.length}`}><Ligne texte={l} /></p>);
    }
  }
  fermer();
  return <>{blocs}</>;
}

/** Une page de texte public : titre, chapeau, date de mise à jour, puis ses sections. */
export function PageDeTexte({ document, avant, apres }: { document: Document; avant?: ReactNode; apres?: ReactNode }) {
  return (
    <main>
      <article className={styles.texte}>
        <h1>{document.titre}</h1>
        <p className={styles.chapeau}>{document.chapeau}</p>
        <p className={styles.maj}>Mis à jour le {document.misAJour}</p>
        {avant}
        {/* Un long texte a son sommaire : l'école y cherche une rubrique */}
        {document.sections.length > 4 ? (
          <nav className={styles.sommaire} aria-label="Sur cette page">
            <ul>
              {document.sections.map((s) => (
                <li key={s.titre}>
                  <a href={`#${ancre(s.titre)}`}>{s.titre}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {document.sections.map((s) => (
          <section key={s.titre} id={ancre(s.titre)}>
            <h2>{s.titre}</h2>
            <Paragraphes lignes={s.paragraphes} />
          </section>
        ))}
        {apres}
      </article>
    </main>
  );
}
