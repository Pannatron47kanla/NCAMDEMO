import { existsSync, rmSync } from 'node:fs';
import { extname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildToTempDir, listFiles } from './support/build-app';

const STATIC_EXTENSIONS = new Set(['.html', '.js', '.css', '.woff2', '.svg', '.png', '.ico', '.json', '.txt', '.map', '.webmanifest']);

describe('build', () => {
  let dist = '';
  beforeAll(async () => {
    dist = await buildToTempDir('ncam-ac1');
  });
  afterAll(() => {
    if (dist) rmSync(dist, { recursive: true, force: true });
  });

  it('AC1: build output is static', () => {
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
    const files = listFiles(dist);
    const notStatic = files.filter((f) => !STATIC_EXTENSIONS.has(extname(f)));
    expect(notStatic).toEqual([]);
    const serverLike = files.filter((f) => /(^|\/)(server|api)(\.|\/)|\.(php|py|rb|cjs|mjs)$/.test(f));
    expect(serverLike).toEqual([]);
  });
});
