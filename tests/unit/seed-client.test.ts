import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client seed', () => {
  it('defines the three base views without overwriting existing rows', async () => {
    const seed = await readFile(resolve(process.cwd(), 'scripts/seed-client.sql'), 'utf8');

    expect(seed).toContain('insert into views');
    expect(seed).toContain("'front'");
    expect(seed).toContain("'rear'");
    expect(seed).toContain("'top'");
    expect(seed).toContain('on conflict (id) do nothing');
  });

  it('keeps the alternate image exclusive to the top view', async () => {
    const seed = await readFile(resolve(process.cwd(), 'scripts/seed-client.sql'), 'utf8');

    expect(seed).toMatch(/'front',[\s\S]*?null\s*\n\s*\),/);
    expect(seed).toMatch(/'rear',[\s\S]*?null\s*\n\s*\),/);
    expect(seed).toContain("'https://placehold.co/1920x1080/webp?text=Parcela+Top+Sin+Grid'");
  });
});
