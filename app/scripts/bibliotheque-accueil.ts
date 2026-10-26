/**
 * Les livres de l'accueil deviennent des livres de la bibliothèque (F15, « Les livres de
 * l'accueil »), décidé par le porteur le 25 octobre 2026 : ses deux livres, partagés par un lien de
 * lecture, sont publiés tels quels, sans passer par la file de relecture, avec la présentation
 * écrite ci-dessous. Leur lien ne se coupe pas : il mène désormais à leur adresse dans la
 * bibliothèque, pour les familles qui l'ont reçu. L'accueil les montre comme avant, couverture
 * comprise (migration `accueil_depuis_la_bibliotheque`).
 *
 *   npm run bibliotheque:accueil                              dans la base locale
 *   npm run bibliotheque:accueil -- --production              dit ce qui serait fait dans la vraie base
 *   npm run bibliotheque:accueil -- --production --oui        le fait
 *
 * Un livre déjà publié n'est pas touché : la commande se relance sans risque.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { adresseLibre } from "../src/domaine/bibliotheque";
import { adresseDeProduction, masquer, racine } from "./base-de-production";

/** La présentation de chaque livre, par son titre : deux ou trois phrases, sans dévoiler la fin. */
const PRESENTATIONS: Record<string, string> = {
  "Électro Nick":
    "Tu es astronaute, envoyé sur une planète qui ne répond plus. Elle ressemble un peu à la Terre ; à toi de découvrir ce qui s’y est passé, et de réparer ce qui peut l’être.",
  "Le labyrinthe oublié":
    "C’est les vacances chez tes grands-parents, et tu t’ennuies. Au grenier, tu trouves un vieux jeu aux lettres d’or. Tu avances ton pion… et tu disparais du grenier.",
};

const options = process.argv.slice(2);
const production = options.includes("--production");
const oui = options.includes("--oui");
const locale = (adresse: string) => /^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(adresse);

let adresseBase: string;
if (production) {
  adresseBase = adresseDeProduction();
} else {
  config({ path: resolve(racine, ".env.local"), quiet: true });
  adresseBase = process.env.BASE_LOCALE_URL ?? "";
  if (!locale(adresseBase)) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}

type Livre = { projet: string; enseignant: string; titre: string; version: { titre?: string }; empreinte: string; age: string; publie: boolean };

async function principal() {
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  try {
    const { rows: reglages } = await base.query<{ l: { projet?: string }[] }>("select livres_de_l_accueil as l from public.reglages_application");
    const projets = (reglages[0]?.l ?? []).map((e) => e.projet).filter((p): p is string => typeof p === "string");
    if (!projets.length) {
      console.log("Aucun livre sur l'accueil : rien à faire. La migration « accueil_depuis_la_bibliotheque » est-elle appliquée ?");
      return;
    }
    const { rows: livres } = await base.query<Livre>(
      `select pa.projet_id as projet, pa.enseignant_id as enseignant, p.titre, pa.version, pa.empreinte, p.age_des_lecteurs as age,
              exists (select 1 from public.publications pu where pu.projet_id = pa.projet_id and pu.version is not null) as publie
       from public.partages pa join public.projets p on p.id = pa.projet_id
       where pa.projet_id = any ($1::uuid[]) and pa.version is not null`,
      [projets],
    );
    const { rows: prises } = await base.query<{ adresse: string }>("select adresse from public.publications where adresse is not null");
    const adresses = new Set(prises.map((p) => p.adresse));
    const aFaire = livres.filter((l) => !l.publie).map((l) => {
      const titre = l.version.titre?.trim() || l.titre;
      const presentation = PRESENTATIONS[titre] ?? PRESENTATIONS[l.titre];
      const adresse = adresseLibre(titre, adresses);
      adresses.add(adresse);
      return { ...l, titre, presentation, adresse };
    });
    const sansPresentation = aFaire.filter((l) => !l.presentation);
    if (sansPresentation.length) {
      console.error(`Pas de présentation pour : ${sansPresentation.map((l) => `« ${l.titre} »`).join(", ")}. Écrivez-la dans PRESENTATIONS.`);
      process.exit(1);
    }
    for (const l of livres.filter((x) => x.publie)) console.log(`« ${l.version.titre ?? l.titre} » est déjà dans la bibliothèque.`);
    if (!aFaire.length) return;
    if (production && !oui) {
      for (const l of aFaire) console.log(`Serait publié dans la vraie base : « ${l.titre} », à /bibliotheque/${l.adresse}, pour les ${l.age}.`);
      console.log("Ajoutez « --oui » pour le faire.");
      return;
    }
    await base.query("begin");
    for (const l of aFaire) {
      await base.query(
        `insert into public.publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
         values ($1, $2, $3, $4, $5, $6, $7, now(), now())
         on conflict (projet_id) do update set adresse = coalesce(publications.adresse, excluded.adresse), version = excluded.version,
           presentation = excluded.presentation, age = excluded.age, empreinte = excluded.empreinte, publiee_le = now(), mise_a_jour_le = now(),
           retiree_le = null, retrait_par = null, retrait_motif = null`,
        [l.projet, l.enseignant, l.adresse, JSON.stringify(l.version), l.presentation, l.age, l.empreinte],
      );
      // Le lien seul ne se crée plus : il se coupe, et son code mène à l'adresse du livre ; le partage avec les classes reste
      await base.query(
        `update public.partages set par_lien = false,
           version = case when aux_classes then version end, etat_du = case when aux_classes then etat_du end,
           empreinte = case when aux_classes then empreinte end, empreinte_lecture = case when aux_classes then empreinte_lecture end,
           modifie_le = now()
         where projet_id = $1`,
        [l.projet],
      );
      console.log(`« ${l.titre} » est dans la bibliothèque, à /bibliotheque/${l.adresse}.`);
    }
    await base.query("commit");
  } catch (erreur) {
    await base.query("rollback").catch(() => {});
    console.error(masquer(erreur instanceof Error ? erreur.message : String(erreur)));
    process.exit(1);
  } finally {
    await base.end();
  }
}

principal();
