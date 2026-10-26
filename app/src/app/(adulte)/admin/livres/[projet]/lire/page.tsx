import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { exigerLePorteur } from "@/serveur/administration";
import { propositionALire } from "@/serveur/relecture-des-livres";
import { LectureDeLaProposition } from "./LectureDeLaProposition";

export const metadata: Metadata = { title: "Proposition à relire — Administration", robots: { index: false, follow: false } };

/**
 * Une proposition à relire, dans le lecteur (F15, « La file de relecture ») : chaque point du
 * rapport ouvre son passage. Rien n'est retenu de la lecture.
 */
export default async function Page({ params, searchParams }: { params: Promise<{ projet: string }>; searchParams: Promise<{ passage?: string }> }) {
  await exigerLePorteur();
  const [{ projet }, { passage }] = await Promise.all([params, searchParams]);
  const version = await propositionALire(projet);
  if (!version) notFound();
  return (
    <Messages>
      <LectureDeLaProposition version={version} passage={passage && version.passages.some((p) => p.id === passage) ? passage : null} />
    </Messages>
  );
}
