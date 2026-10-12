// One-off: turn the first-version concept art into small webp files for the site.
// Usage: node scripts/optimize-images.mjs <folder-with-concept-pngs>
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join, parse } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("Pass the folder that holds concept-*.png");
  process.exit(1);
}
for (const file of readdirSync(src)) {
  if (!file.endsWith(".png")) continue;
  const out = join("public", "img", parse(file).name + ".webp");
  await sharp(join(src, file)).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  console.log("wrote", out);
}
