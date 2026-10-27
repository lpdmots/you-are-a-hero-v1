/**
 * Les faces avant déposées pour l'accueil deviennent la couverture de leur livre (F11.4,
 * « Couverture faite sur le site », F11-AC117), décidé par le porteur le 26 octobre 2026 : une
 * seule couverture par livre, celle du projet, figée dans la version publiée. Chaque face avant
 * encore gardée dans les réglages de l'accueil est inscrite parmi les images de son projet (en
 * JPEG, avec sa vignette), posée en couverture du projet et de sa version publiée ; puis le
 * réglage l'oublie et le fichier déposé s'efface. Un projet qui a déjà sa couverture la garde.
 *
 *   npm run couvertures:accueil                              dans la base locale
 *   npm run couvertures:accueil -- --production              dit ce qui serait fait dans la vraie base
 *   npm run couvertures:accueil -- --production --oui        le fait
 *
 * La commande se relance sans risque : une face avant déjà convertie n'est plus dans le réglage.
 */
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import sharp from "sharp";
import { adresseDeProduction, lireEnv, masquer, racine } from "./base-de-production";
import { clientDuStockage } from "./stockage";

const SEAU = "images";
const options = process.argv.slice(2);
const production = options.includes("--production");
const oui = options.includes("--oui");
const locale = (adresse: string) => /^(postgres(ql)?|https?):\/\/([^@]*@)?(127\.0\.0\.1|localhost)[:/]/.test(adresse);

// La base visée, et les clés qui vont avec : jamais celles de l'une pour l'autre
let url: string;
let adresseBase: string;
let cleSecrete: string;
if (production) {
  const env = lireEnv("production.env");
  url = env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "";
  cleSecrete = env.get("SUPABASE_CLE_SECRETE") ?? "";
  if (!url || !cleSecrete || locale(url)) {
    console.error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_CLE_SECRETE dans production.env.");
    process.exit(1);
  }
  adresseBase = adresseDeProduction();
} else {
  config({ path: resolve(racine, ".env.local"), quiet: true });
  url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  adresseBase = process.env.BASE_LOCALE_URL ?? "";
  cleSecrete = process.env.SUPABASE_CLE_SECRETE ?? "";
  if (!locale(url) || !locale(adresseBase)) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}

type Entree = { projet?: unknown; couverture?: unknown };
type Livre = { projet: string; enseignant: string; titre: string; couverture_id: string | null; publie: boolean };

async function principal() {
  const base = new Client({ connectionString: adresseBase });
  const stockage = clientDuStockage(url, cleSecrete).storage.from(SEAU);
  await base.connect();
  try {
    const { rows: reglages } = await base.query<{ l: Entree[] | null }>("select livres_de_l_accueil as l from public.reglages_application");
    const entrees = reglages[0]?.l ?? [];
    const deposees = entrees.filter((e): e is { projet: string; couverture: string } => typeof e.projet === "string" && typeof e.couverture === "string" && e.couverture.startsWith("accueil/"));
    if (!deposees.length) {
      console.log("Aucune face avant déposée sur l'accueil : rien à convertir.");
      return;
    }
    const { rows: livres } = await base.query<Livre>(
      `select p.id as projet, p.enseignant_id as enseignant, p.titre, p.couverture_id,
              exists (select 1 from public.publications pu where pu.projet_id = p.id and pu.version is not null) as publie
       from public.projets p where p.id = any ($1::uuid[])`,
      [deposees.map((d) => d.projet)],
    );
    if (production && !oui) {
      for (const d of deposees) {
        const l = livres.find((x) => x.projet === d.projet);
        if (!l) console.log(`Le projet ${d.projet} n'existe plus : sa face avant serait seulement effacée.`);
        else if (l.couverture_id) console.log(`« ${l.titre} » a déjà sa couverture : la face avant déposée serait seulement effacée.`);
        else console.log(`Deviendrait la couverture de « ${l.titre} »${l.publie ? ", et celle de sa version publiée" : ""} : ${d.couverture}.`);
      }
      console.log("Ajoutez « --oui » pour le faire.");
      return;
    }

    for (const d of deposees) {
      const l = livres.find((x) => x.projet === d.projet);
      if (l && !l.couverture_id) {
        const { data, error } = await stockage.download(d.couverture);
        if (error || !data) throw new Error(`La face avant de « ${l.titre} » ne se lit pas (${error?.message ?? "vide"}).`);
        // En JPEG, comme les images créées : la face avant déposée était un WebP réduit
        const image = await sharp(Buffer.from(await data.arrayBuffer())).flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
        const vignette = await sharp(image).resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
        const { width = 0, height = 0 } = await sharp(image).metadata();
        const id = randomUUID();
        const chemins = [`${l.enseignant}/${l.projet}/${id}.jpg`, `${l.enseignant}/${l.projet}/${id}-v.jpg`];
        for (const [chemin, octets] of [[chemins[0], image], [chemins[1], vignette]] as const) {
          const { error: e } = await stockage.upload(chemin, octets, { contentType: "image/jpeg", upsert: false });
          if (e) throw new Error(`Dépôt de ${chemin} : ${e.message}`);
        }
        const couverture = { id, largeur: width, hauteur: height, textes: null };
        await base.query("begin");
        await base.query(
          `insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, $6, $7, 'jpeg')`,
          [id, l.projet, l.enseignant, chemins[0], chemins[1], width, height],
        );
        await base.query("update public.projets set couverture_id = $2 where id = $1", [l.projet, id]);
        // La version publiée la montre aussitôt, sans repasser par la relecture : la face avant était déjà en public
        await base.query(
          `update public.publications
           set version = jsonb_set(jsonb_set(version, '{couverture}', $2::jsonb), array['images', $3::text], jsonb_build_object('largeur', $4::int, 'hauteur', $5::int))
           where projet_id = $1 and version is not null`,
          [l.projet, JSON.stringify(couverture), id, width, height],
        );
        await base.query("commit");
        console.log(`« ${l.titre} » a pour couverture sa face avant (${width} × ${height}).`);
      } else {
        console.log(l ? `« ${l.titre} » avait déjà sa couverture : la face avant déposée est effacée.` : `Le projet ${d.projet} n'existe plus : sa face avant est effacée.`);
      }
      // Le réglage oublie la face avant, puis le fichier s'efface
      await base.query(
        `update public.reglages_application
         set livres_de_l_accueil = (select coalesce(jsonb_agg(case when e->>'projet' = $1 then e - 'couverture' else e end), '[]'::jsonb) from jsonb_array_elements(livres_de_l_accueil) e)`,
        [d.projet],
      );
      await stockage.remove([d.couverture]);
    }
  } catch (erreur) {
    await base.query("rollback").catch(() => {});
    console.error(masquer(erreur instanceof Error ? erreur.message : String(erreur)));
    process.exit(1);
  } finally {
    await base.end();
  }
}

principal();
