import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Messages } from "@/composants/Messages";
import { versionParLeLien } from "@/serveur/lecteur";
import { LecteurParLeLien, Reessayer } from "./LecteurParLeLien";

type Props = { params: Promise<{ code: string }> };

// Une seule lecture par demande : un code faux ne se compte qu'une fois
const lire = cache(versionParLeLien);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lu = await lire((await params).code);
  // La page neutre ne dit rien du livre, pas même dans le titre de l'onglet (F12-AC10)
  if (lu.sorte !== "livre") return { title: { absolute: lu.sorte === "indisponible" ? "Livre momentanément indisponible" : "Ce livre n’est plus partagé" } };
  return { title: { absolute: lu.version.titre } };
}

/**
 * Le lien de lecture (F12.1) : la version partagée, lue sans compte, retenue sur l'appareil ;
 * sinon la page neutre, ou « momentanément indisponible » quand la base ne répond pas.
 */
export default async function Page({ params }: Props) {
  const { code } = await params;
  const lu = await lire(code);
  if (lu.sorte === "bibliotheque") redirect(`/bibliotheque/${lu.adresse}`);
  if (lu.sorte === "neutre")
    return (
      <main className="lecteur-seul">
        <svg className="lecteur__ornement" viewBox="0 0 120 10" aria-hidden="true">
          <path d="M0 5h52M68 5h52" />
          <path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z" />
        </svg>
        <p className="lecteur-seul__titre recit">Ce livre n’est plus partagé.</p>
        <p>Si quelqu’un vous a donné ce lien, demandez-lui le nouveau.</p>
      </main>
    );
  if (lu.sorte === "indisponible")
    return (
      <main className="lecteur-seul">
        <svg className="lecteur__ornement" viewBox="0 0 120 10" aria-hidden="true">
          <path d="M0 5h52M68 5h52" />
          <path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z" />
        </svg>
        <p className="lecteur-seul__titre recit">Le livre est momentanément indisponible.</p>
        <Reessayer />
      </main>
    );
  return (
    <Messages>
      <LecteurParLeLien code={code} version={lu.version} />
    </Messages>
  );
}
