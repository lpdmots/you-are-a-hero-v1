import Link from "next/link";
import { EntreeIllustree } from "@/composants/EntreeIllustree";

export default function Introuvable() {
  return (
    <EntreeIllustree titre="Cette page n’existe pas" aide="L’adresse a peut-être changé, ou ce que vous cherchez n’est pas à vous.">
      <p>
        <Link className="btn btn--primaire btn--grand" href="/">
          Retour à l’accueil
        </Link>
      </p>
    </EntreeIllustree>
  );
}
