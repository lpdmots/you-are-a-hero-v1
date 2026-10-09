import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { Logo } from "@/composants/Logo";
import { VeillePoste } from "@/composants/VeillePoste";
import { nomPourEleves, type Eleve } from "@/domaine/eleves";
import { ecrireHeure, finDePlage, prochaineOuverture, type Plage } from "@/domaine/horaires";
import { de } from "@/domaine/texte";
import { nomPourLesEleves } from "@/serveur/adulte";
import { clientDuPoste, etatDuPoste } from "@/serveur/poste";
import { changer } from "../classe/actions";
import styles from "./travail.module.css";

export const metadata: Metadata = { title: "Mon travail" };

/**
 * Accueil de l'élève identifié. À l'étape 1, aucun chapitre ne peut encore lui être
 * attribué : la page dit seulement où il en est, et si le travail est ouvert (F06-AC27).
 * « Mon travail » se construit à l'étape 4, la lecture des chapitres à l'étape 2.
 */
export default async function MonTravail() {
  const poste = await etatDuPoste();
  if (!poste) redirect("/classe");
  if (!poste.inscriptionId || !poste.eleveId) redirect("/classe/qui");

  const base = await clientDuPoste(poste);
  const [{ data: classe }, { data: inscriptions, error }, { data: horaires }, { data: ouvert }] = await Promise.all([
    base.from("classes").select("nom, enseignant_id, horaires_limites").eq("id", poste.classeId).maybeSingle(),
    base.from("inscriptions").select("id, eleves(id, prenom, nom, couleur)").eq("classe_id", poste.classeId),
    base.from("horaires").select("jours, de, a, rang").eq("classe_id", poste.classeId).order("rang"),
    base.rpc("travail_ouvert"),
  ]);
  if (!classe) redirect("/classe");
  if (error) throw new Error(`Liste des élèves illisible : ${error.message}`);
  const { data: enseignant } = await base.from("enseignants").select("nom_affiche").eq("id", classe.enseignant_id).maybeSingle();

  const eleves = ((inscriptions ?? []) as unknown as { eleves: Eleve | null }[]).flatMap((i) => (i.eleves ? [i.eleves] : []));
  const moi = eleves.find((e) => e.id === poste.eleveId);
  if (!moi) redirect("/classe/qui");
  const prof = nomPourLesEleves(enseignant?.nom_affiche);
  const plages: Plage[] = (horaires ?? []).map((h) => ({ jours: h.jours, de: h.de.slice(0, 5), a: h.a.slice(0, 5) }));
  const maintenant = new Date();
  const rouvre = ouvert ? null : prochaineOuverture(plages, maintenant);
  const fin = ouvert ? finDePlage(classe.horaires_limites, plages, maintenant) : null;

  return (
    <>
      <VeillePoste attendu="eleve" />
      <header className={styles.barre}>
        <Logo href="/travail" />
        <nav className={styles.nav} aria-label="Espace élève">
          <a href="/travail" aria-current="page">
            Mon travail
          </a>
        </nav>
        <span className={styles.classe}>
          <Icone nom="eleves" />
          Classe {classe.nom}
          {enseignant?.nom_affiche ? ` ${de(enseignant.nom_affiche)}` : ""}
        </span>
        <div className={styles.droite}>
          <span className={styles.identite}>
            <Gommette prenom={moi.prenom} couleur={moi.couleur} />
            <span className="main">{nomPourEleves(moi, eleves)}</span>
          </span>
          <form action={changer}>
            <button type="submit" className="btn btn--discret">
              Changer d’élève
            </button>
          </form>
        </div>
      </header>
      <main className="page page--eleve">
        <section className={styles.accueil}>
          <div className={styles.image}>
            <Image src="/illustrations/defaut-foret.jpg" alt="" fill priority sizes="(max-width: 720px) 100vw, 640px" />
          </div>
          <div className={styles.texte}>
            <p className={styles.bonjour}>Bonjour {moi.prenom}</p>
            <h1>Mon travail</h1>
            {ouvert ? (
              <>
                <p>Tu n’as pas encore de chapitre.</p>
                <p className={styles.acces}>
                  <Icone nom="main" />
                  {majusculeDebut(prof)} va t’en donner un.
                </p>
                {fin ? (
                  <p className={styles.acces}>
                    <Icone nom="horloge" />
                    Aujourd’hui, le travail est ouvert jusqu’à <span className="chiffres">{ecrireHeure(fin)}</span>.
                  </p>
                ) : null}
              </>
            ) : (
              <p className={`${styles.acces} ${styles.ferme}`}>
                <Icone nom="horloge" />
                {rouvre ? (
                  <span>
                    Le travail est fermé jusqu’à <span className="chiffres">{rouvre}</span>.
                  </span>
                ) : (
                  "Le travail est fermé pour le moment."
                )}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

const majusculeDebut = (t: string): string => t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);
