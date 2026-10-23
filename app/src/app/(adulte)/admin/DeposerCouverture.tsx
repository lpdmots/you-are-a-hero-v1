"use client";

import { useRef, useState } from "react";
import styles from "./admin.module.css";

/**
 * Déposer la couverture d'un livre de l'accueil (F14-AC40) : un seul geste, choisir l'image ;
 * l'envoi part aussitôt (le 23 octobre 2026, le porteur avait choisi ses images sans voir qu'il
 * fallait encore cliquer « Déposer », et rien n'était parti). L'image est d'abord réduite dans le
 * navigateur : Vercel refuse un envoi de plus de 4,5 Mo. Le formulaire reste ordinaire, envoyé à
 * /admin/couverture, que Next ne limite pas à 1 Mo comme une action. Pendant l'envoi, le champ
 * reste actif (un champ désactivé ne part pas) ; c'est le bouton qui ne se clique plus.
 */
export function DeposerCouverture({ code, remplacer }: { code: string; remplacer: boolean }) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [envoi, setEnvoi] = useState(false);
  return (
    <form ref={formulaire} action="/admin/couverture" method="post" encType="multipart/form-data" className={styles.depot}>
      <input type="hidden" name="code" value={code} />
      <label className={`btn btn--petit ${styles.choisirImage}`} aria-disabled={envoi}>
        {envoi ? "Envoi de la couverture…" : remplacer ? "Changer de couverture…" : "Déposer sa couverture…"}
        <input
          type="file"
          name="couverture"
          accept="image/jpeg,image/png,image/webp"
          required
          className={styles.fichierCache}
          onChange={async (e) => {
            const champ = e.currentTarget;
            const fichier = champ.files?.[0];
            if (!fichier) return;
            setEnvoi(true);
            const reduite = await reduire(fichier);
            if (reduite) {
              const liste = new DataTransfer();
              liste.items.add(reduite);
              champ.files = liste.files;
            }
            formulaire.current?.requestSubmit();
          }}
        />
      </label>
    </form>
  );
}

/**
 * L'image réduite à 2400 points au plus sur son grand côté, en WebP : quelques centaines de Ko,
 * assez pour la face avant, que le serveur découpe et réduit encore. Rien si le navigateur ne
 * sait pas la lire : le fichier part tel quel, et le serveur dit s'il ne convient pas.
 */
async function reduire(fichier: File): Promise<File | null> {
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, 2400 / Math.max(image.width, image.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(image.width * echelle);
    toile.height = Math.round(image.height * echelle);
    toile.getContext("2d")?.drawImage(image, 0, 0, toile.width, toile.height);
    const vers = (type: string) => new Promise<Blob | null>((ok) => toile.toBlob(ok, type, 0.9));
    // Un navigateur qui ne sait pas faire de WebP rend un PNG, bien trop lourd : du JPEG alors
    let blob = await vers("image/webp");
    if (blob?.type !== "image/webp") blob = await vers("image/jpeg");
    return blob ? new File([blob], blob.type === "image/webp" ? "couverture.webp" : "couverture.jpg", { type: blob.type }) : null;
  } catch {
    return null;
  }
}
