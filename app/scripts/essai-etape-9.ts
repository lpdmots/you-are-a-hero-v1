/**
 * Pour l'essai de l'étape 9 en local (`app/README.md`, « Essayer l'étape 9 ») : porte le dernier
 * projet d'un compte à 40 scènes hors corbeille, la taille du livre gratuit, en ajoutant une
 * partie « Scènes de l'essai » ; la suivante, créée à la main, fait paraître le dialogue du pass.
 * Base locale seulement.
 *
 *   npm run essai:etape9 -- adresse@du.compte
 */
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { racine } from "./base-de-production";

config({ path: resolve(racine, ".env.local"), quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const adresseBase = process.env.BASE_LOCALE_URL ?? "";
const locale = (a: string) => /(127\.0\.0\.1|localhost)[:/]/.test(a);

async function principal() {
  const courriel = process.argv.slice(2).find((o) => !o.startsWith("--"));
  if (!courriel) throw new Error("Donnez l'adresse du compte : npm run essai:etape9 -- adresse@du.compte");
  if (!locale(url) || !locale(adresseBase)) throw new Error("Cette commande ne parle qu'à la base locale.");
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  try {
    const { rows: comptes } = await base.query<{ id: string }>("select id from auth.users where lower(email) = lower($1)", [courriel]);
    if (!comptes.length) throw new Error(`Aucun compte à l'adresse ${courriel} dans la base locale.`);
    const { rows: projets } = await base.query<{ id: string; titre: string; scenes: number }>(
      `select p.id, p.titre, (select count(*)::int from public.scenes s where s.projet_id = p.id and s.supprime_le is null) as scenes
       from public.projets p where p.enseignant_id = $1 order by p.cree_le desc limit 1`,
      [comptes[0].id],
    );
    if (!projets.length) throw new Error("Ce compte n'a pas encore de projet : créez-en un d'abord.");
    const projet = projets[0];
    const manque = 40 - projet.scenes;
    if (manque <= 0) {
      console.log(`« ${projet.titre} » a déjà ${projet.scenes} scènes : rien à ajouter.`);
      return;
    }
    // Les fonctions de la base créent comme l'adulte : on agit en son nom, le temps de la commande
    const service = createClient(url, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
    const { data: lien } = await service.auth.admin.generateLink({ type: "magiclink", email: courriel });
    const adulte = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE!, { auth: { persistSession: false } });
    const { error: entree } = await adulte.auth.verifyOtp({ token_hash: lien.properties!.hashed_token, type: "email" });
    if (entree) throw new Error(`Connexion au compte : ${entree.message}`);
    const { data, error } = await adulte.rpc("creer_partie", {
      p_projet: projet.id, p_titre: "Scènes de l'essai", p_visuel: "foret", p_titre_chapitre: "Pour atteindre quarante", p_couleur: 4, p_visuel_chapitre: "mer",
    });
    if (error) throw new Error(error.message);
    const chapitre = (Array.isArray(data) ? data[0] : data).chapitre_id as string;
    for (let i = 0; i < manque; i++) {
      const { error: e } = await adulte.rpc("creer_scene", { p_chapitre: chapitre });
      if (e) throw new Error(e.message);
    }
    console.log(`« ${projet.titre} » a maintenant 40 scènes : la suivante fera paraître le dialogue du pass, « Paiement ouvert » allumé.`);
  } finally {
    await base.end();
  }
}

principal().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
