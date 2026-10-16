import { SEAU, TYPE_MIME, type FormatImage } from "@/serveur/images";
import { clientDuPoste, etatDuPoste } from "@/serveur/poste";
import { estUuid } from "@/serveur/recit";
import { clientService } from "@/serveur/supabase";

/**
 * Une image d'un livre ouvert aux classes (F12.3), pour le poste d'un élève : la base dit
 * d'abord que le livre lui est ouvert et que sa version montre cette image.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ projet: string; id: string }> }) {
  const { projet, id } = await params;
  if (!estUuid(projet) || !estUuid(id)) return new Response(null, { status: 404 });
  const poste = await etatDuPoste();
  if (!poste?.inscriptionId) return new Response(null, { status: 404 });
  const { data } = await (await clientDuPoste(poste)).rpc("image_d_un_livre_du_poste", { p_projet: projet, p_image: id });
  const image = (Array.isArray(data) ? data[0] : data) as { chemin: string; chemin_vignette: string; format: FormatImage } | null;
  if (!image) return new Response(null, { status: 404 });
  const vignette = new URL(requete.url).searchParams.get("v") === "1";
  const lu = await clientService().storage.from(SEAU).download(vignette ? image.chemin_vignette : image.chemin);
  if (lu.error || !lu.data) return new Response(null, { status: 404 });
  return new Response(lu.data, {
    headers: { "Content-Type": TYPE_MIME[image.format] ?? "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
  });
}
