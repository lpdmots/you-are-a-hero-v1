import { timingSafeEqual } from "node:crypto";
import { tourneeDesComptesInactifs } from "@/serveur/suppression";

/**
 * La tournée quotidienne des comptes inactifs (F14-AC29), appelée par le cron de Vercel
 * (vercel.json), qui envoie « Authorization: Bearer <CRON_SECRET> ». Tout autre appel est refusé.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const recu = request.headers.get("authorization") ?? "";
  const attendu = `Bearer ${secret}`;
  const bon = !!secret && recu.length === attendu.length && timingSafeEqual(Buffer.from(recu), Buffer.from(attendu));
  if (!bon) return new Response(null, { status: 401 });
  const fait = await tourneeDesComptesInactifs();
  return Response.json(fait);
}
