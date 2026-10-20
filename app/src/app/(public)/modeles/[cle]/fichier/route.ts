import { enRtf, modeleDe } from "@/domaine/textes-publics";

/** Le modèle à télécharger (F14-AC33), en RTF : Word et LibreOffice l'ouvrent pour le compléter. */
export async function GET(_requete: Request, { params }: { params: Promise<{ cle: string }> }): Promise<Response> {
  const m = modeleDe((await params).cle);
  if (!m) return new Response(null, { status: 404 });
  return new Response(enRtf(m.document), {
    headers: {
      "content-type": "application/rtf; charset=utf-8",
      "content-disposition": `attachment; filename="${m.cle}.rtf"`,
    },
  });
}
