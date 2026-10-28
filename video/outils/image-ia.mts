/**
 * Une illustration pour la vidéo, créée comme dans l'application : GPT Image, style par défaut
 * « Illustration 2D lumineuse » (src/domaine/illustration.ts). La clé d'OpenAI vient de
 * app/.env.local, chargé par Node, jamais lue ni affichée ici.
 *
 *   cd V1/app && npx tsx --conditions=react-server --env-file=.env.local ../video/outils/image-ia.mts "<scène>" <sortie.jpg> [1536x1024] [reference.jpg,…]
 *
 * Les références (un portrait du livre, par exemple) gardent un personnage reconnaissable, comme
 * dans l'application (environ 2,4 centimes l'image au lieu de 2).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { creerDesImages } from "../../app/src/serveur/ia/fournisseurs";
import { STYLES_DES_IMAGES } from "../../app/src/domaine/illustration";

const [scene, sortie, taille = "1536x1024", refs = ""] = process.argv.slice(2);
if (!scene || !sortie) throw new Error("scène et sortie attendues");
const prompt = `${scene}. Style : ${STYLES_DES_IMAGES.lumineuse.prompt}. Aucun texte, aucune lettre dans l'image.`;
const r = await creerDesImages({ prompt, taille, qualite: "normale", nombre: 1,
  references: refs ? refs.split(",").map((f) => ({ octets: readFileSync(f), format: f.endsWith(".png") ? ("png" as const) : ("jpeg" as const) })) : undefined,
  signal: AbortSignal.timeout(180_000) });
writeFileSync(sortie, r.images[0]);
console.log(`écrit ${sortie} (${r.sortie} jetons de sortie)`);
