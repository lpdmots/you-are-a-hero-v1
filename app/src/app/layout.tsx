import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Andika, Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, Playwrite_FR_Trad, Vollkorn } from "next/font/google";
import { MarquePret } from "@/composants/Pret";
import "@/styles/jetons.css";
import "@/styles/base.css";
import "@/styles/formes.css";
import "@/styles/recit.css";
import "@/styles/copie.css";
import "@/styles/suivi.css";
import "@/styles/fiches.css";
import "@/styles/encouragements.css";
import "@/styles/livre.css";
import "@/styles/lecture.css";
import "@/styles/lecteur.css";

// Les trois voix du système « Cahiers d'aventure », hébergées avec l'application :
// l'outil, le récit, la main de l'élève ; Andika pour les chiffres que l'élève lit. La main est la
// cursive traditionnelle des écoles françaises, celle aussi du nom dans le logo (22 octobre 2026).
// Seul le latin des polices du premier écran est préchargé (F14, audit du 24 octobre 2026 : dix fichiers
// préchargés retardaient le titre de l'accueil sur mobile) ; les autres sous-ensembles et polices restent
// déclarés et se chargent quand une page s'en sert.
const outil = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--police-outil", display: "swap", adjustFontFallback: false });
const code = Atkinson_Hyperlegible_Mono({ subsets: ["latin"], preload: false, variable: "--police-code", display: "swap", adjustFontFallback: false });
const recit = Vollkorn({ subsets: ["latin"], variable: "--police-recit", display: "swap" });
const main = Playwrite_FR_Trad({ weight: ["300", "400"], variable: "--police-main", display: "swap" });
const chiffres = Andika({ subsets: ["latin"], preload: false, weight: ["400", "700"], variable: "--police-chiffres", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Il était une classe", template: "%s — Il était une classe" },
  description: "Écrire un livre avec sa classe.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function Racine({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${outil.variable} ${code.variable} ${recit.variable} ${main.variable} ${chiffres.variable}`}>
      <body>
        {children}
        <MarquePret />
      </body>
    </html>
  );
}
