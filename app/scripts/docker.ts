/**
 * Environnement des commandes qui ont besoin de Docker. Docker Desktop, installé sans
 * droits d'administrateur, range sa commande et son point de connexion dans le dossier
 * de l'utilisateur : on les ajoute s'ils ne sont pas déjà trouvés.
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export function envDocker(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const dossier = resolve(homedir(), ".docker/bin");
  if (existsSync(dossier) && !(env.PATH ?? "").split(":").includes(dossier)) env.PATH = `${dossier}:${env.PATH ?? ""}`;
  const prise = resolve(homedir(), ".docker/run/docker.sock");
  if (!env.DOCKER_HOST && !existsSync("/var/run/docker.sock") && existsSync(prise)) env.DOCKER_HOST = `unix://${prise}`;
  return env;
}
