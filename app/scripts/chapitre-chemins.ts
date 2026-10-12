/**
 * Ajoute à l'histoire d'essai de la base locale le chapitre « Le marais des feux follets » :
 * trente-deux scènes reliées comme dans un vrai livre, pour juger la vue « Chemins » (F03.1)
 * sur autre chose que des chemins très simples. Contenu : marais-des-feux-follets.ts.
 *
 *   npm run chemins:essai                dans « Les passeurs de brume » de la base locale
 *   npm run chemins:essai -- --refaire   le retire, avec ce qui y a été écrit, puis le recharge
 *   npm run chemins:essai -- --retirer   le retire seulement
 *
 * Base locale seulement : cette commande ne sait pas parler à la vraie base. Elle demande
 * l'histoire d'essai (« npm run histoire:essai »), dont elle ne change qu'une chose : un choix
 * de plus à la fin de S025, pour qu'un chemin arrive au marais depuis un autre chapitre.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { ciblesDe, nettoyerTexte } from "@/domaine/copie";
import { ATTENDU, blocsDe, MARAIS, poserLeMarais, SCENES, type Requete } from "./marais-des-feux-follets";
import { CLASSE, TITRE } from "./passeurs-de-brume";

const options = process.argv.slice(2);
const refaire = options.includes("--refaire");
const retirerSeulement = options.includes("--retirer");

config({ path: resolve(__dirname, "..", ".env.local"), quiet: true });
const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};
const adresseBase = process.env.BASE_LOCALE_URL ?? "";
if (!locale(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") || !locale(adresseBase)) {
  console.error("Cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
  process.exit(1);
}

/** Références de l'histoire d'essai : la scène qui mène au marais, et celles où mènent ses deux sorties. */
const ENTREE = 25;
const SORTIES = { moulin: 40, sanctuaire: 31 };
const PARTIE = "La forêt engloutie";

// Le contenu se tient-il ? Chaque choix mène à une scène du chapitre, et les textes sont ceux que l'application accepte
function controler(): void {
  const cles = new Set(SCENES.map((s) => s.cle));
  if (cles.size !== SCENES.length) throw new Error("Deux scènes du marais portent le même nom court.");
  let liens = 0;
  for (const s of SCENES) {
    for (const [, vers] of s.choix ?? []) if (typeof vers === "string" && !cles.has(vers)) throw new Error(`« ${s.cle} » mène à « ${vers} », qui n'existe pas.`);
    if (s.cachee && !cles.has(s.cachee.vers)) throw new Error(`Le lien caché de « ${s.cle} » mène à « ${s.cachee.vers} », qui n'existe pas.`);
    const blocs = blocsDe(s, (vers) => (vers === null ? null : "00000000-0000-4000-8000-000000000000"));
    const propre = nettoyerTexte(blocs);
    if (!propre || propre.length !== blocs.length) throw new Error(`Le texte de « ${s.cle} » n'est pas un texte de scène.`);
    liens += (s.choix?.length ?? 0) + (s.cachee ? 1 : 0);
    if (ciblesDe(propre).length !== (s.choix ?? []).filter(([, vers]) => vers !== null).length + (s.cachee ? 1 : 0)) throw new Error(`Les choix de « ${s.cle} » ne se relisent pas.`);
  }
  if (liens !== ATTENDU.liens || SCENES.filter((s) => s.fin).length !== ATTENDU.fins) throw new Error("Le chapitre ne correspond plus à ce que « ATTENDU » annonce.");
}

async function retirer(q: Requete, projetId: string, chapitreId: string): Promise<void> {
  // Le choix d'entrée, posé dans une scène d'un autre chapitre, part avec le marais
  await q(
    `update public.scenes s set version = s.version + 1, texte = coalesce((
       select jsonb_agg(b order by n) from jsonb_array_elements(s.texte) with ordinality as t(b, n)
       where not (b ->> 'type' = 'choix' and b ->> 'libelle' = $3 and (b ->> 'cible')::uuid in (select id from public.scenes where chapitre_id = $2))
     ), '[]'::jsonb)
     where s.projet_id = $1 and s.chapitre_id <> $2
       and exists (select 1 from public.liens l join public.scenes d on d.id = l.cible_id where l.scene_id = s.id and d.chapitre_id = $2 and l.libelle = $3)`,
    [projetId, chapitreId, MARAIS.entree.libelle],
  );
  await q("delete from public.chapitres where id = $1", [chapitreId]);
}

async function principal(): Promise<void> {
  controler();
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  const q: Requete = async (texte, valeurs) => (await base.query(texte, valeurs)).rows;
  try {
    const [projet] = (await q(
      "select p.id, p.enseignant_id, p.classe_id from public.projets p join public.classes c on c.id = p.classe_id where c.identifiant = $1 and p.titre = $2 order by p.cree_le limit 1",
      [CLASSE.identifiant, TITRE],
    )) as { id: string; enseignant_id: string; classe_id: string }[];
    if (!projet) throw new Error("L'histoire d'essai n'est pas dans la base locale : lancez d'abord « npm run histoire:essai ».");

    const [deja] = (await q("select id from public.chapitres where projet_id = $1 and titre = $2", [projet.id, MARAIS.titre])) as { id: string }[];
    if (deja && !refaire && !retirerSeulement) throw new Error(`« ${MARAIS.titre} » est déjà chargé. Pour le remettre à neuf, ajoutez « --refaire ».`);
    if (retirerSeulement && !deja) return console.log(`« ${MARAIS.titre} » n'est pas dans l'histoire d'essai : rien à retirer.`);

    await q("begin");
    try {
      if (deja) await retirer(q, projet.id, deja.id);
      if (retirerSeulement) {
        await q("commit");
        return console.log(`« ${MARAIS.titre} » est retiré de l'histoire d'essai, avec ce qui y a été écrit.`);
      }
      const [partie] = (await q("select id from public.parties where projet_id = $1 and supprime_le is null order by (titre = $2) desc, rang desc limit 1", [projet.id, PARTIE])) as { id: string }[];
      if (!partie) throw new Error("L'histoire d'essai n'a plus de partie où poser le chapitre.");
      const references = (await q("select id, reference from public.scenes where projet_id = $1 and supprime_le is null and reference = any($2::integer[])", [
        projet.id, [ENTREE, SORTIES.moulin, SORTIES.sanctuaire],
      ])) as { id: string; reference: number }[];
      const scene = (reference: number): string => {
        const trouvee = references.find((s) => s.reference === reference);
        if (!trouvee) throw new Error(`S${String(reference).padStart(3, "0")} n'est plus dans l'histoire d'essai : rechargez-la par « npm run histoire:essai -- --refaire ».`);
        return trouvee.id;
      };
      const eleves = (await q("select e.id, e.prenom from public.eleves e join public.inscriptions i on i.eleve_id = e.id where i.classe_id = $1", [projet.classe_id])) as { id: string; prenom: string }[];
      await poserLeMarais(q, {
        projetId: projet.id, partieId: partie.id, enseignantId: projet.enseignant_id,
        ailleurs: { moulin: scene(SORTIES.moulin), sanctuaire: scene(SORTIES.sanctuaire) },
        entreeDepuis: scene(ENTREE),
        eleves: new Map(eleves.map((e) => [e.prenom, e.id])),
      });
      await q("commit");
    } catch (erreur) {
      await q("rollback");
      throw erreur;
    }
    const ecrites = SCENES.filter((s) => s.texte?.length).length;
    console.log(`« ${MARAIS.titre} » chargé dans « ${TITRE} », base locale : ${SCENES.length} scènes dont ${ecrites} écrites, ${ATTENDU.liens} choix, une scène dans la corbeille.`);
    console.log(`Élèves du chapitre : ${MARAIS.eleves.map(([prenom]) => prenom).join(", ")}. Un choix de plus à la fin de S${String(ENTREE).padStart(3, "0")} y conduit.`);
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(erreur.message);
  process.exit(1);
});
