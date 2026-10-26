import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { debutDuChapitre } from "@/domaine/lecture";
import { livreALirePourLEleve } from "@/serveur/lecture";
import { contexteDeTravail, histoiresDuPoste } from "@/serveur/recit-eleve";
import { Messages } from "@/composants/Messages";
import { EnteteEleve } from "../../EnteteEleve";
import { DepartEleve, type CahierDeDepart } from "./DepartEleve";
import { LectureEleve } from "./LectureEleve";

export const metadata: Metadata = { title: "Lire à l’essai" };

type Props = { params: Promise<{ projet: string }>; searchParams: Promise<{ depart?: string }> };

/**
 * La lecture d'essai de l'élève (F09.1) : d'abord « Par où commencer ? » — le début de chacun
 * de ses chapitres, une scène trouvée par sa recherche, et, quand la lecture est ouverte, le
 * départ du livre (F09-AC22) ; puis la lecture, dans les seuls chapitres qu'il lit.
 */
export default async function Page({ params, searchParams }: Props) {
  const { projet } = await params;
  const contexte = await contexteDeTravail();
  if (!contexte.ouvert) redirect("/travail");
  const [lu, histoires, demande] = await Promise.all([livreALirePourLEleve(contexte, projet), histoiresDuPoste(contexte), searchParams]);
  const histoire = histoires.find((h) => h.id === projet);
  if (!lu || !histoire) notFound();
  const { livre, titre } = lu;
  const depart = typeof demande.depart === "string" && livre.passages[demande.depart] ? demande.depart : null;

  if (depart)
    return (
      <Messages>
        <EnteteEleve contexte={contexte} auTravail ici="lecture" />
        <LectureEleve eleveId={contexte.moi.id} projet={projet} titre={titre} livre={livre} depart={depart} />
      </Messages>
    );

  // Une carte par chapitre attribué, avec son image de repérage, comme sur « Mon travail »
  const cartes = new Map(histoire.parties.flatMap((p) => p.chapitres.map((c) => [c.id, c] as const)));
  const cahiers: CahierDeDepart[] = livre.chapitres.flatMap((c) => {
    const carte = cartes.get(c.id);
    const debut = debutDuChapitre(livre, c.id);
    return c.mien && carte && debut ? [{ id: c.id, titre: c.titre, couleur: c.couleur, repere: { imageId: carte.imageId, visuelChoisi: carte.visuelChoisi, visuelDefaut: carte.visuelDefaut }, debut }] : [];
  });
  return (
    <>
      <EnteteEleve contexte={contexte} auTravail ici="lecture" />
      <DepartEleve
        projet={projet}
        titre={titre}
        prof={contexte.prof}
        cahiers={cahiers}
        departDuLivre={livre.departId ? { id: livre.departId, repere: { imageId: histoire.imageId, visuelChoisi: histoire.visuelChoisi, visuelDefaut: histoire.visuelDefaut } } : null}
        lisibles={Object.keys(livre.passages)}
      />
    </>
  );
}
