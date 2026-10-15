/** Les motifs de césure du français (paquet `hyphen`, licence ISC), sans types publiés avec lui. */
declare module "hyphen/fr" {
  type Options = { hyphenChar?: string; minWordLength?: number; exceptions?: string[] };
  export function hyphenateSync(texte: string, options?: Options): string;
  export function hyphenate(texte: string, options?: Options): Promise<string>;
}
