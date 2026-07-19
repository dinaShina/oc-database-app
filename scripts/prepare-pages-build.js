import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const indexPath = join(distDir, "index.html");
const fallbackPath = join(distDir, "404.html");
const noJekyllPath = join(distDir, ".nojekyll");

if (!existsSync(indexPath)) {
  throw new Error("Cannot prepare GitHub Pages build: dist/index.html does not exist.");
}

copyFileSync(indexPath, fallbackPath);
writeFileSync(noJekyllPath, "");

console.log("Prepared GitHub Pages fallback: dist/404.html and dist/.nojekyll");
