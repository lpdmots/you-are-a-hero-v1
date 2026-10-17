import { config } from "dotenv";
import { resolve } from "node:path";

// Les essais contre la base parlent à la base locale de Supabase (Docker), jamais à la vraie.
config({ path: resolve(__dirname, "../../.env.local"), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error("Ces essais ne tournent que contre la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
}

// Aucun essai n'appelle un vrai fournisseur d'IA (étape 8) : sans clé, avec la réponse simulée
delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;
process.env.IA_SIMULEE = "1";
