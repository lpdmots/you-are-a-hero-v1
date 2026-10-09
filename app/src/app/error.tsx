"use client";

import { useEffect } from "react";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { noterIncident } from "./actions-incident";

/** Un incident ne montre jamais son détail technique : une phrase, et de quoi réessayer. */
export default function Incident({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Noté au journal du serveur, si la connexion le permet
    noterIncident(window.location.pathname, `${error.name} : ${error.message}`, error.digest).catch(() => {});
  }, [error]);
  return (
    <EntreeIllustree titre="Quelque chose n’a pas marché" aide="Rien n’est perdu. Réessayez ; si cela continue, vérifiez la connexion à internet.">
      <p>
        <button type="button" className="btn btn--primaire btn--grand" onClick={reset}>
          Réessayer
        </button>
      </p>
    </EntreeIllustree>
  );
}
