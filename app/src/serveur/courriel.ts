import "server-only";
import { createTransport, type Transporter } from "nodemailer";

/**
 * Les courriels que l'application écrit elle-même (F14), hors de ceux du compte, que Supabase
 * envoie : le partage retiré par le porteur, le compte inactif qui va être supprimé, la nuit de
 * sauvegarde manquée. Ils partent par le même serveur d'envoi qu'eux, Amazon SES, avec ses
 * identifiants SMTP ; en local, dans Mailpit (http://127.0.0.1:54324).
 *
 *   SMTP_HOTE, SMTP_PORT, SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE, COURRIEL_EXPEDITEUR
 *
 * Sans serveur d'envoi réglé, rien ne part, et le geste qui l'appelait se fait quand même :
 * le courriel est une information, pas une condition.
 */

export type Courriel = { a: string; sujet: string; texte: string };

let transport: Transporter | null = null;

function leTransport(): Transporter | null {
  const hote = process.env.SMTP_HOTE;
  if (!hote) return null;
  transport ??= createTransport({
    host: hote,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_UTILISATEUR ? { user: process.env.SMTP_UTILISATEUR, pass: process.env.SMTP_MOT_DE_PASSE ?? "" } : undefined,
  });
  return transport;
}

/** Envoie un courriel en texte simple ; rend false s'il n'est pas parti. */
export async function envoyer(c: Courriel): Promise<boolean> {
  const t = leTransport();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.COURRIEL_EXPEDITEUR ?? "Il était une classe <ne-pas-repondre@iletaituneclasse.fr>",
      to: c.a,
      subject: c.sujet,
      text: c.texte,
    });
    return true;
  } catch (erreur) {
    console.error(`Courriel non parti : ${erreur instanceof Error ? erreur.message : erreur}`);
    return false;
  }
}
