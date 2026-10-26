import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { Messages } from "@/composants/Messages";
import { versionPubliee } from "@/serveur/bibliotheque-publique";
import { Reessayer } from "../../[code]/LecteurParLeLien";
import { LecteurDeLaBibliotheque } from "./LecteurDeLaBibliotheque";

type Props = { params: Promise<{ adresse: string }> };

const lire = cache(versionPubliee);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lu = await lire((await params).adresse);
  // Fermé aux moteurs, comme tout `/lire` (F15, « Une page indexée, des livres qui ne le sont pas »)
  const robots = { index: false, follow: false };
  if (lu.sorte !== "livre") return { title: { absolute: lu.sorte === "neutre" ? "Ce livre n’est plus dans la bibliothèque" : "Livre momentanément indisponible" }, robots };
  return { title: { absolute: lu.version.titre }, robots };
}

/** Lire un livre de la bibliothèque (F15) : le lecteur en ligne, sans compte, la lecture retenue sur l'appareil. */
export default async function Page({ params }: Props) {
  const { adresse } = await params;
  const lu = await lire(adresse);
  if (lu.sorte !== "livre")
    return (
      <main className="lecteur-seul">
        <svg className="lecteur__ornement" viewBox="0 0 120 10" aria-hidden="true">
          <path d="M0 5h52M68 5h52" />
          <path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z" />
        </svg>
        <p className="lecteur-seul__titre recit">{lu.sorte === "neutre" ? "Ce livre n’est plus dans la bibliothèque." : "Le livre est momentanément indisponible."}</p>
        {lu.sorte === "neutre" ? (
          <Link className="lien" href="/bibliotheque">
            Voir les autres livres
          </Link>
        ) : (
          <Reessayer />
        )}
      </main>
    );
  return (
    <Messages>
      <LecteurDeLaBibliotheque adresse={adresse} version={lu.version} coeurs={lu.coeurs} />
    </Messages>
  );
}
