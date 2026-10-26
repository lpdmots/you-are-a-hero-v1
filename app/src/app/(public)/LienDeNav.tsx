"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Un lien de l'en-tête des pages publiques, marqué quand on est sur sa page ou sous elle (la bibliothèque et ses livres). */
export function LienDeNav({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const chemin = usePathname();
  const ici = chemin === href || chemin.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} aria-current={ici ? "page" : undefined}>
      {children}
    </Link>
  );
}
