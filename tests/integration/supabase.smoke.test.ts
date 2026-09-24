import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Database } from './helpers/database.types';
import { requireEnv } from './helpers/env';

const TEST_LOT_NAME = 'integration-test-smoke-lot';

describe('Supabase integration smoke test', () => {
  let supabaseUrl: string;
  let supabaseAnonKey: string;
  let supabaseServiceRoleKey: string;
  let anonClient: SupabaseClient<Database>;
  let serviceClient: SupabaseClient<Database>;
  let testLotId: string | null = null;

  beforeAll(() => {
    supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
    supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    serviceClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
  });

  afterAll(async () => {
    if (testLotId) {
      await serviceClient.from('lots').delete().eq('id', testLotId);
    }
  });

  it('reads public views with anon key (RLS allows public select)', async () => {
    const { data, error } = await anonClient.from('views').select('id');

    expect(error).toBeNull();
    expect(data).toBeInstanceOf(Array);
  });

  it('blocks anonymous inserts on lots (RLS is active)', async () => {
    const { error } = await anonClient.from('lots').insert({ name: 'should-fail' });

    expect(error).not.toBeNull();
  });

  it('writes a test lot with service role and reads it publicly with anon key', async () => {
    const { data, error } = await serviceClient
      .from('lots')
      .insert({ name: TEST_LOT_NAME })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    testLotId = data!.id;

    const { data: publicRead, error: publicReadError } = await anonClient
      .from('lots')
      .select('id, name')
      .eq('id', testLotId!)
      .single();

    expect(publicReadError).toBeNull();
    expect(publicRead).toMatchObject({ id: testLotId, name: TEST_LOT_NAME });
  });
});
