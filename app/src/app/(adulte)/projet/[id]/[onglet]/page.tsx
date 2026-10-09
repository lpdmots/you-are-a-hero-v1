import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { libelleAnnee } from "@/domaine/annee";
import { pluriel } from "@/domaine/texte";
import { estOnglet, illustrationParDefaut, libelleRecit, NOM_ONGLET, ongletsDe, type Onglet } from "@/domaine/projets";
import { exigerEnseignant } from "@/serveur/adulte";
import { mesClasses, projetDe } from "@/serveur/lectures";
import { ClasseDuProjet } from "./ClasseDuProjet";
import styles from "./projet.module.css";

type Props = { params: Promise<{ id: string; onglet: string }>; searchParams: Promise<{ message?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, onglet } = await params;
  const projet = await projetDe(await exigerEnseignant(), id);
  return { title: projet && estOnglet(onglet) ? `${NOM_ONGLET[onglet]} — ${projet.titre}` : "Projet" };
}

// Ce que chaque onglet deviendra, et à quelle étape du plan de réalisation.
const A_VENIR: Record<Onglet, string> = {
  preparation: "Le carnet de préparation du récit se construit à l’étape 2 du plan.",
  plan: "Les parties, les chapitres et les scènes se construisent à l’étape 2 du plan.",
  suivi: "Le suivi du travail des élèves se construit à l’étape 4 du plan.",
  livre: "La lecture d’essai et le livre se construisent aux étapes 5 et 6 du plan.",
};

export default async function PageProjet({ params, searchParams }: Props) {
  const { id, onglet } = await params;
  const { message } = await searchParams;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet || !estOnglet(onglet) || !ongletsDe(projet.organisation).includes(onglet)) notFound();

  // La mémoire du dernier projet et de son dernier onglet tient au compte, non au navigateur (F06-AC53)
  if (projet.dernierOnglet !== onglet) {
    await enseignant.supabase.from("projets").update({ dernier_onglet: onglet }).eq("id", projet.id);
  }
  if (enseignant.dernierProjetId !== projet.id) {
    await enseignant.supabase.from("enseignants").update({ dernier_projet_id: projet.id }).eq("id", enseignant.id);
  }

  const classes =
    projet.organisation === "classe"
      ? (await mesClasses(enseignant))
          .filter((c) => c.enCours)
          .map((c) => ({ id: c.id, nom: c.nom, annee: libelleAnnee(c.anneeDebut), eleves: c.eleves.length }))
      : [];

  return (
    <div className="page">
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet={onglet} />
      {message === "cree" ? <MessageAuChargement texte={`« ${projet.titre} » est créé. Commencez par la préparation.`} /> : null}
      <section className={styles.histoire}>
        <div className={styles.vignette}>
          <Image src={illustrationParDefaut(projet.id)} alt="" fill sizes="184px" priority />
        </div>
        <div>
          <h1>{projet.titre}</h1>
          <p className={styles.meta}>
            {projet.organisation === "personnel" ? (
              "Projet personnel"
            ) : (
              <ClasseDuProjet
                projetId={projet.id}
                titre={projet.titre}
                classeId={projet.classe?.id ?? null}
                libelle={
                  projet.classe
                    ? `Classe ${projet.classe.nom} · ${projet.classe.nombreEleves ? `${projet.classe.nombreEleves} élève${pluriel(projet.classe.nombreEleves)}` : "aucun élève inscrit"}`
                    : "Sans classe"
                }
                classes={classes}
              />
            )}
            {" · "}
            {libelleRecit(projet.recit)}
          </p>
        </div>
        <nav className={styles.onglets} aria-label="Sections du projet">
          {ongletsDe(projet.organisation).map((o) => (
            <Link key={o} href={`/projet/${projet.id}/${o}`} aria-current={o === onglet ? "page" : undefined}>
              {NOM_ONGLET[o]}
            </Link>
          ))}
        </nav>
      </section>
      <section className={styles.aVenir} aria-labelledby="a-venir">
        <h2 id="a-venir">{NOM_ONGLET[onglet]}</h2>
        <p>{A_VENIR[onglet]}</p>
      </section>
    </div>
  );
}
