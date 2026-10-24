import type { Metadata } from "next";
import { CONDITIONS } from "@/domaine/textes-publics";
import { PageDeTexte } from "../PageDeTexte";

export const metadata: Metadata = { title: CONDITIONS.titre, description: CONDITIONS.chapeau, alternates: { canonical: "/conditions" } };

export default function Page() {
  return <PageDeTexte document={CONDITIONS} />;
}
