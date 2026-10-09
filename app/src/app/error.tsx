"use client";

import { EntreeIllustree } from "@/composants/EntreeIllustree";

/** Un incident ne montre jamais son détail technique : une phrase, et de quoi réessayer. */
export default function Incident({ reset }: { error: Error; reset: () => void }) {
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
