"use client";

import { useRef, useState } from "react";
import styles from "./admin.module.css";

/**
 * Déposer la couverture d'un livre de l'accueil (F14-AC40) : un seul geste, choisir l'image ;
 * l'envoi part aussitôt (le 23 octobre 2026, le porteur avait choisi ses images sans voir qu'il
 * fallait encore cliquer « Déposer », et rien n'était parti). Le formulaire reste ordinaire, envoyé
 * à /admin/couverture, que Next ne limite pas à 1 Mo comme une action.
 */
export function DeposerCouverture({ code, remplacer }: { code: string; remplacer: boolean }) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [envoi, setEnvoi] = useState(false);
  return (
    <form ref={formulaire} action="/admin/couverture" method="post" encType="multipart/form-data" className={styles.depot} onSubmit={() => setEnvoi(true)}>
      <input type="hidden" name="code" value={code} />
      <label className={`btn btn--petit ${styles.choisirImage}`} aria-disabled={envoi}>
        {envoi ? "Envoi de la couverture…" : remplacer ? "Changer de couverture…" : "Déposer sa couverture…"}
        <input
          type="file"
          name="couverture"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={envoi}
          className={styles.fichierCache}
          onChange={(e) => {
            if (e.currentTarget.files?.length) formulaire.current?.requestSubmit();
          }}
        />
      </label>
    </form>
  );
}
