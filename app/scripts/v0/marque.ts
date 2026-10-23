import sharp from "sharp";

/**
 * Efface l'étincelle que le générateur d'images a laissée dans le coin bas droit d'une illustration
 * de la V0 (demandé par le porteur le 23 octobre 2026) : un morceau du décor pris juste à sa gauche
 * est recopié dessus, ses bords fondus, pour que la reprise ne se voie pas. Les proportions sont
 * celles de l'étincelle sur l'image, quelle que soit sa taille (l'image et sa vignette).
 */
export async function masquerLaMarque(octets: Uint8Array): Promise<Uint8Array> {
  const image = sharp(octets);
  const { width: l, height: h, format } = await image.metadata();
  if (!l || !h) return octets;
  // L'étincelle : son centre à 4,25 % de la largeur des deux bords, sa taille 3,5 % de la largeur ;
  // la pièce qui la couvre en fait presque le double, fondue sur tout son tour
  const cote = Math.round(l * 0.065);
  const gauche = Math.round(l - l * 0.0425 - cote / 2);
  const haut = Math.round(h - l * 0.0428 - cote / 2);
  // Le morceau recopié : le décor juste à gauche, à la même hauteur
  const source = Math.max(0, gauche - Math.round(cote * 1.2));
  const morceau = await sharp(octets).extract({ left: source, top: haut, width: cote, height: cote }).removeAlpha().raw().toBuffer();
  const fondu = Buffer.alloc(cote * cote);
  const r = cote / 2;
  for (let y = 0; y < cote; y += 1) {
    for (let x = 0; x < cote; x += 1) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
      const a = Math.min(1, Math.max(0, (1 - d) / 0.45));
      fondu[y * cote + x] = Math.round(255 * a * a * (3 - 2 * a));
    }
  }
  const piece = await sharp(morceau, { raw: { width: cote, height: cote, channels: 3 } })
    .joinChannel(fondu, { raw: { width: cote, height: cote, channels: 1 } })
    .png()
    .toBuffer();
  const sortie = sharp(octets).composite([{ input: piece, left: gauche, top: haut }]);
  return format === "webp" ? sortie.webp({ quality: 90 }).toBuffer() : sortie.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
