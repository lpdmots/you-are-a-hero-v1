import { NOM_CATEGORIE, type Categorie } from "@/domaine/encouragements";
import { Icone, type NomIcone } from "./Icone";

/** L'effort, des marches montées ; la fine plume ; la créativité, une idée. */
export const SIGNE_CATEGORIE: Record<Categorie, NomIcone> = { effort: "escalier", plume: "plume", creativite: "ampoule" };

/**
 * Le tampon d'un encouragement (F07.5) : un rond à l'encre graphite, posé un peu de travers,
 * comme le tampon du maître sur une copie. Sa catégorie se lit à son signe, jamais à une
 * couleur : celles de l'outil disent déjà l'état d'une scène. `pale` : la place d'un tampon
 * pas encore donné, que seul l'enseignant voit. Tailles : « m » sur la fiche de
 * l'enseignant, « g » sur la scène de l'élève.
 */
export function TamponEncouragement({ categorie, taille, pale }: { categorie: Categorie; taille?: "m" | "g"; pale?: boolean }) {
  return (
    <span className={`encre encre--${categorie}${taille ? ` encre--${taille}` : ""}${pale ? " encre--pale" : ""}`} aria-hidden="true">
      <Icone nom={SIGNE_CATEGORIE[categorie]} />
    </span>
  );
}

/** Le signe seul, sans son rond : dans une ligne dense, où un rond de plus se confondrait avec une gommette. */
export function SigneEncouragement({ categorie }: { categorie: Categorie }) {
  return <Icone nom={SIGNE_CATEGORIE[categorie]} className="signe-encre" />;
}

/** Les tampons reçus sur une scène, nommés pour qui ne les voit pas. Rien quand il n'y en a pas (F07-AC80). */
export function TamponsRecus({ categories }: { categories: Categorie[] }) {
  if (categories.length === 0) return null;
  return (
    <span className="encres" role="img" aria-label={`Encouragement${categories.length > 1 ? "s" : ""} : ${categories.map((c) => NOM_CATEGORIE[c]).join(", ")}`}>
      {categories.map((c) => (
        <TamponEncouragement key={c} categorie={c} />
      ))}
    </span>
  );
}

export type MarcheNommee = { total: number; noms: { nom: string; moi?: boolean }[] };
export type ColonneDeClassement = {
  categorie: Categorie;
  /** Les trois meilleurs totaux, ex æquo ensemble */
  marches: MarcheNommee[];
  /** La suite, que l'enseignant seul peut dérouler (F07-AC83) */
  suite?: MarcheNommee[];
  /** Le total de l'élève qui regarde, dans cette catégorie (F07-AC86) ; rien chez l'enseignant */
  monTotal?: number | null;
};

/**
 * Le classement des encouragements, une colonne par catégorie, sans total général (F07.5).
 * Une ligne donne des prénoms, puis leur nombre de tampons, comme « Effort 3 » : aucun
 * numéro n'y précède un prénom, et personne n'y lit un rang. Le total de l'élève qui
 * regarde est dans l'en-tête de la colonne, hors de la liste, pour ne pas s'y lire comme
 * une ligne de plus. Une catégorie où personne n'a de tampon n'a pas de colonne.
 */
export function Classement({ colonnes }: { colonnes: ColonneDeClassement[] }) {
  const pleines = colonnes.filter((c) => c.marches.length > 0);
  if (pleines.length === 0) return null;
  const ligne = (m: MarcheNommee, cle: string, enPlus = false) => (
    <li key={cle} className={enPlus ? "classement__suite" : undefined}>
      <span>
        {m.noms.map((n, i) => (
          <span key={n.nom + i}>
            {i > 0 ? ", " : ""}
            <span className={n.moi ? "classement__moi" : undefined}>{n.nom}</span>
          </span>
        ))}
      </span>
      <b className="chiffres">{m.total}</b>
    </li>
  );
  return (
    <div className="classement">
      {pleines.map((c) => (
        <section key={c.categorie} className="classement__col" aria-label={`Classement, ${NOM_CATEGORIE[c.categorie]}`}>
          <h3>
            <SigneEncouragement categorie={c.categorie} />
            <span>{NOM_CATEGORIE[c.categorie]}</span>
            {c.monTotal ? (
              <span className="classement__toi">
                toi <b className="chiffres">{c.monTotal}</b>
              </span>
            ) : null}
          </h3>
          <ul>
            {c.marches.map((m) => ligne(m, `m${m.total}`))}
            {c.suite?.map((m) => ligne(m, `s${m.total}`, true))}
          </ul>
        </section>
      ))}
    </div>
  );
}
