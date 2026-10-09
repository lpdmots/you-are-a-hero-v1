/**
 * Restauration d'une sauvegarde faite par « npm run sauvegarder ».
 *
 *   npm run restaurer -- sauvegardes/<date>                 dans la base locale (essai)
 *   npm run restaurer -- sauvegardes/<date> --production    dans la vraie base
 *
 * La base visée est d'abord remise au schéma de l'application (migrations), puis les
 * données de la sauvegarde y sont chargées, comptes compris. Tout ce qui s'y trouvait
 * est remplacé. Docker doit être ouvert.
 *
 * Vers la vraie base, la commande demande de retaper le nom du dossier : elle sert
 * après un accident, sur un projet Supabase neuf ou à remettre en état.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { adresseDeProduction, masquer, racine } from "./base-de-production";
import { envDocker } from "./docker";

const env = envDocker();

const TABLES = ["auth.users", "public.enseignants", "public.classes", "public.classes_secrets", "public.horaires", "public.eleves", "public.eleves_secrets", "public.inscriptions", "public.projets"];

async function principal() {
  const dossier = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const production = process.argv.includes("--production");
  if (!dossier || !existsSync(resolve(dossier, "donnees.sql"))) {
    console.error("Indiquez un dossier de sauvegarde : npm run restaurer -- sauvegardes/<date>");
    process.exit(1);
  }
  const donnees = resolve(dossier, "donnees.sql");

  let adresse: string;
  if (production) {
    adresse = adresseDeProduction();
    const lecture = createInterface({ input: process.stdin, output: process.stdout });
    const reponse = await lecture.question(`Tout le contenu de la VRAIE base sera remplacé par ${basename(resolve(dossier))}.\nRetapez le nom de ce dossier pour confirmer : `);
    lecture.close();
    if (reponse.trim() !== basename(resolve(dossier))) {
      console.error("Nom différent : rien n'a été fait.");
      process.exit(1);
    }
    console.log("Schéma de l'application…");
    lancer("npx", ["supabase", "db", "push", "--db-url", adresse, "--include-all"]);
  } else {
    const etat = execFileSync("npx", ["supabase", "status", "-o", "env"], { cwd: racine, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
    adresse = etat.match(/^DB_URL="?(.*?)"?$/m)?.[1] ?? "";
    if (!adresse) {
      console.error("La base locale ne répond pas : lancez « npm run base:demarrer ».");
      process.exit(1);
    }
    console.log("Base locale remise à zéro, au schéma de l'application…");
    lancer("npx", ["supabase", "db", "reset", "--local"]);
  }

  console.log("Chargement des données…");
  // psql vient de l'image PostgreSQL de Docker ; les déclencheurs sont suspendus le temps
  // du chargement, et les tables de l'application vidées d'abord, d'un seul tenant.
  const vers = adresse.replace("127.0.0.1", "host.docker.internal").replace("localhost", "host.docker.internal");
  const contenu = readFileSync(donnees, "utf8");
  // Toutes les tables que la sauvegarde remplit sont d'abord vidées, dans la même transaction
  const aVider = [...new Set([...contenu.matchAll(/^COPY ("[a-z_]+"\."[a-z_0-9]+") /gm)].map((m) => m[1]))];
  const script = ["set session_replication_role = replica;", aVider.length ? `truncate ${aVider.join(", ")} cascade;` : "", contenu].join("\n");
  const charge = spawnSync(
    "docker",
    ["run", "--rm", "-i", "--add-host", "host.docker.internal:host-gateway", "postgres:17-alpine", "psql", "--single-transaction", "--variable", "ON_ERROR_STOP=1", "--quiet", "--dbname", vers],
    { input: script, encoding: "utf8", maxBuffer: 1024 * 1024 * 512, env },
  );
  if (charge.status !== 0) {
    console.error(`La restauration a échoué, rien n'a été chargé : ${masquer(charge.stderr ?? "").trim().split("\n").slice(-3).join(" ")}`);
    process.exit(1);
  }

  const comptes = spawnSync(
    "docker",
    ["run", "--rm", "-i", "--add-host", "host.docker.internal:host-gateway", "postgres:17-alpine", "psql", "--tuples-only", "--no-align", "--dbname", vers,
      "--command", TABLES.map((t) => `select '${t}', count(*) from ${t}`).join(" union all ")],
    { encoding: "utf8", env },
  );
  console.log("\nLignes restaurées :");
  console.log((comptes.stdout ?? "").trim().split("\n").map((l) => `  ${l.replace("|", " : ")}`).join("\n"));
  console.log("\nRestauration terminée. Les codes et les mots de passe de classe se relisent avec la même CLE_ACCES qu'à la sauvegarde.");
}

function lancer(commande: string, options: string[]) {
  const r = spawnSync(commande, options, { cwd: racine, encoding: "utf8", env });
  if (r.status !== 0) {
    console.error(masquer(`${r.stdout ?? ""}${r.stderr ?? ""}`).trim().split("\n").slice(-5).join("\n"));
    process.exit(1);
  }
}

principal();
