import type { Metadata } from "next";
import { cache } from "react";
import { Messages } from "@/composants/Messages";
import { versionParLeLien } from "@/serveur/lecteur";
import { LecteurParLeLien } from "./LecteurParLeLien";

type Props = { params: Promise<{ code: string }> };

// Une seule lecture par demande : un code faux ne se compte qu'une fois
const lire = cache(versionParLeLien);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lu = await lire((await params).code);
  // La page neutre ne dit rien du livre, pas même dans le titre de l'onglet (F12-AC10)
  if (lu.sorte !== "livre") return { title: { absolute: lu.sorte === "neutre" ? "Ce livre n’est plus partagé" : "Livre momentanément indisponible" } };
  return { title: { absolute: lu.version.titre } };
}

/**
 * Le lien de lecture (F12.1) : la version partagée, lue sans compte, retenue sur l'appareil ;
 * sinon la page neutre, ou « momentanément indisponible » quand la base ne répond pas.
 */
export default async function Page({ params }: Props) {
  const { code } = await params;
  const lu = await lire(code);
  if (lu.sorte === "neutre")
    return (
      <main className="lecteur-seul">
        <p className="lecteur-seul__titre recit">Ce livre n’est plus partagé.</p>
        <p>Si quelqu’un vous a donné ce lien, demandez-lui le nouveau.</p>
      </main>
    );
  if (lu.sorte === "indisponible")
    return (
      <main className="lecteur-seul">
        <p className="lecteur-seul__titre recit">Le livre est momentanément indisponible.</p>
        <p>Réessayez dans quelques minutes.</p>
      </main>
    );
  return (
    <Messages>
      <LecteurParLeLien code={code} version={lu.version} />
    </Messages>
  );
}
