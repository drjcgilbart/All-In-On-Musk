/**
 * Inline Three.js into midnight-grid.html so the race opens from a double-click.
 * Source of truth stays midnight-grid.js.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(root, "midnight-grid.js");
const pagePath = join(root, "midnight-grid.html");
const bundlePath = join(tmpdir(), "midnight-grid.bundle.js");
execFileSync(
  "npx.cmd",
  [
    "--yes", "esbuild", "midnight-grid.js",
    "--bundle", "--format=iife", "--target=es2022", "--minify",
    "--legal-comments=none", `--outfile="${bundlePath}"`,
  ],
  { cwd: root, stdio: "inherit", shell: true },
);
let code = readFileSync(bundlePath, "utf8").replace(/<\/script/gi, "<\\/script");
let page = readFileSync(pagePath, "utf8");
const shell = page.includes("<!-- race:shell -->")
  ? page.replace(/<!-- race:shell -->[\s\S]*<\/body>/, "</body>")
  : page
      .replace(/\s*<script type="importmap">[\s\S]*?<\/script>\s*/i, "\n")
      .replace(/\s*<script type="module" src="\.\/midnight-grid\.js"><\/script>\s*/i, "\n");
if (!shell.includes("</body>")) throw new Error("midnight-grid.html is missing </body>");
const bundled = shell.replace("</body>", () => `<!-- race:shell -->\n<script>\n${code}\n</script>\n</body>`);
writeFileSync(pagePath, bundled);
console.log(`wrote ${pagePath} (${Math.round(bundled.length / 1024)} KB)`);

const siteDir = join(root, "public", "race");
mkdirSync(siteDir, { recursive: true });
const sitePage = bundled.replace(
  "<title>Tesla World Racer</title>",
  "<title>Tesla World Racer — All In On Musk</title>",
);
writeFileSync(join(siteDir, "index.html"), sitePage);
for (const name of ["neon-velocity-1.m4a", "neon-velocity-2.m4a", "cyber-necrosis-1.m4a", "cyber-necrosis-2.m4a"]) {
  copyFileSync(join(root, name), join(siteDir, name));
}
console.log(`wrote ${join(siteDir, "index.html")} and the four soundtracks`);
