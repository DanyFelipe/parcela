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

  it('defines the four valid directed transitions without rear-top shortcuts', async () => {
    const seed = await readFile(resolve(process.cwd(), 'scripts/seed-client.sql'), 'utf8');
    const insertBlock = seed.match(
      /insert into view_transitions[\s\S]*?on conflict \(from_view_id, to_view_id\)/
    )?.[0];

    expect(insertBlock).toBeDefined();
    expect(seed).toContain('insert into view_transitions');
    expect(seed).toContain('on conflict (from_view_id, to_view_id) do nothing');
    expect(insertBlock).toMatch(/\(\s*'front',\s*'rear',/);
    expect(insertBlock).toMatch(/\(\s*'rear',\s*'front',/);
    expect(insertBlock).toMatch(/\(\s*'front',\s*'top',/);
    expect(insertBlock).toMatch(/\(\s*'top',\s*'front',/);
    expect(insertBlock).not.toMatch(/\(\s*'rear',\s*'top',/);
    expect(insertBlock).not.toMatch(/\(\s*'top',\s*'rear',/);
  });

  it('includes verification queries for valid and forbidden transitions', async () => {
    const seed = await readFile(resolve(process.cwd(), 'scripts/seed-client.sql'), 'utf8');

    expect(seed).toContain('seeded_transition_count');
    expect(seed).toContain('forbidden_transition_count');
  });
});
