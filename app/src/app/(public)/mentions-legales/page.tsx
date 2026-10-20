import type { Metadata } from "next";
import { MENTIONS_LEGALES } from "@/domaine/textes-publics";
import { PageDeTexte } from "../PageDeTexte";

export const metadata: Metadata = { title: MENTIONS_LEGALES.titre, description: MENTIONS_LEGALES.chapeau };

export default function Page() {
  return <PageDeTexte document={MENTIONS_LEGALES} />;
}
