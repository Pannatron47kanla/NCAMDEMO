import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildToTempDir, listFiles } from '../../../tests/support/build-app';

const FONT_DIR = join(__dirname, '../../assets/fonts');

describe('bundled assets', () => {
  let dist = '';
  beforeAll(async () => {
    dist = await buildToTempDir('ncam-ac2');
  });
  afterAll(() => {
    if (dist) rmSync(dist, { recursive: true, force: true });
  });

  it('AC2: built files reference no other origin', () => {
    const files = listFiles(dist);
    const html = files.filter((f) => f.endsWith('.html'));
    const css = files.filter((f) => f.endsWith('.css'));
    expect(html.length).toBeGreaterThan(0);
    expect(css.length).toBeGreaterThan(0);

    // a load target is url(...), @import, or a src/href attribute
    const remoteInCss = /url\(\s*['"]?(https?:)?\/\/|@import\s+(url\(\s*)?['"]?(https?:)?\/\//i;
    const remoteInHtml = /\b(src|href)\s*=\s*['"]?(https?:)?\/\//i;
    for (const f of css) expect(readFileSync(join(dist, f), 'utf8'), f).not.toMatch(remoteInCss);
    for (const f of html) expect(readFileSync(join(dist, f), 'utf8'), f).not.toMatch(remoteInHtml);

    // the Anuphan files are bundled and the CSS points at them
    const woff2 = files.filter((f) => f.endsWith('.woff2'));
    expect(woff2.some((f) => /anuphan-thai/.test(f))).toBe(true);
    expect(woff2.some((f) => /anuphan-latin/.test(f))).toBe(true);
    const allCss = css.map((f) => readFileSync(join(dist, f), 'utf8')).join('\n');
    expect(allCss).toMatch(/font-family:\s*["']?Anuphan/);
    for (const f of woff2) expect(allCss).toContain(f.split('/').pop());

    // Sarabun and IBM Plex Mono are bundled too, for the print pages and the codes
    for (const name of ['sarabun-thai-400', 'sarabun-latin-400', 'sarabun-thai-600', 'sarabun-latin-600', 'ibm-plex-mono-latin-500']) {
      expect(woff2.some((f) => f.includes(name)), name).toBe(true);
    }
    expect(allCss).toMatch(/font-family:\s*["']?Sarabun/);
    expect(allCss).toMatch(/font-family:\s*["']?IBM Plex Mono/);

    // the licence stays in the repository, beside the fonts
    expect(existsSync(join(FONT_DIR, 'OFL.txt'))).toBe(true);
    expect(existsSync(join(FONT_DIR, 'OFL-sarabun.txt'))).toBe(true);
    expect(existsSync(join(FONT_DIR, 'OFL-ibm-plex-mono.txt'))).toBe(true);
    expect(existsSync(join(FONT_DIR, 'anuphan-thai.woff2'))).toBe(true);
    expect(existsSync(join(FONT_DIR, 'anuphan-latin.woff2'))).toBe(true);
  });
});
