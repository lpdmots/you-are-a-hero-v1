import type { Metadata } from "next";
import { CONFIDENTIALITE } from "@/domaine/textes-publics";
import { PageDeTexte } from "../PageDeTexte";

export const metadata: Metadata = { title: CONFIDENTIALITE.titre, description: CONFIDENTIALITE.chapeau, alternates: { canonical: "/confidentialite" } };

export default function Page() {
  return <PageDeTexte document={CONFIDENTIALITE} />;
}
