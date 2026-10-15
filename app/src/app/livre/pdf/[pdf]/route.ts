import { enseignantCourant } from "@/serveur/adulte";
import { adresseDuPdf } from "@/serveur/livre/pdf";

/** Télécharger un PDF du livre : la base dit d'abord si la personne peut le lire, puis le stockage le donne. */
export async function GET(_requete: Request, { params }: { params: Promise<{ pdf: string }> }) {
  const e = await enseignantCourant();
  if (!e) return new Response(null, { status: 404 });
  const { pdf } = await params;
  const adresse = await adresseDuPdf(e, pdf);
  if (!adresse) return new Response(null, { status: 404 });
  return Response.redirect(adresse, 303);
}
