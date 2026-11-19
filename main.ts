// Vice Cover Studio — the entrypoint for gta6-cover-art-01 (Node 22, stdlib only).
// It hands the entry in: copy the app's static files (app/) and the maker's
// screenshots (screenshots/) from beside this file into the output directory, then
// write /output/dossier.json with the vendored make.fun library's buildDossier, so
// the judge can read the app's sources and see its screenshots.
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (in the grader's container MAKEFUN_OUTPUT_DIR is unset and /output is used).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name: string) {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

// Keep the dossier inside the scorer's caps: at most 160 KiB of source text,
// 4 screenshots of at most 256 KiB each, app/ within 993 files and 48 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes).`);
