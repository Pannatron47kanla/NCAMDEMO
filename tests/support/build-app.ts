import { mkdtempSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { build } from 'vite';

/** Builds the app into a fresh temporary folder, so tests never depend on an earlier `npm run build`. */
export async function buildToTempDir(prefix: string): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), `${prefix}-`));
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  return outDir;
}

/** Every file under `dir`, as paths relative to `dir`. */
export function listFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p));
    }
  };
  walk(dir);
  return out;
}
