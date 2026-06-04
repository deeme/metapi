import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type DbModule = typeof import('../db/index.js');
type ModelServiceModule = typeof import('./modelService.js');

describe('refreshModelsForAccount with site.autoRefresh=false', () => {
  let db: DbModule['db'];
  let schema: DbModule['schema'];
  let refreshModelsForAccount: ModelServiceModule['refreshModelsForAccount'];
  let dataDir = '';

  beforeAll(async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'metapi-site-auto-refresh-'));
    process.env.DATA_DIR = dataDir;

    await import('../db/migrate.js');
    const dbModule = await import('../db/index.js');
    const modelService = await import('./modelService.js');

    db = dbModule.db;
    schema = dbModule.schema;
    refreshModelsForAccount = modelService.refreshModelsForAccount;
  });

  beforeEach(async () => {
    await db.delete(schema.routeChannels).run();
    await db.delete(schema.tokenRoutes).run();
    await db.delete(schema.tokenModelAvailability).run();
    await db.delete(schema.modelAvailability).run();
    await db.delete(schema.accountTokens).run();
    await db.delete(schema.accounts).run();
    await db.delete(schema.sites).run();
  });

  afterAll(() => {
    delete process.env.DATA_DIR;
  });

  it('returns site_auto_refresh_disabled when site.autoRefresh=false', async () => {
    const site = await db.insert(schema.sites).values({
      name: 'auto-refresh-disabled-site',
      url: 'https://disabled.example.com',
      platform: 'new-api',
      autoRefresh: false,
    }).returning().get();

    const account = await db.insert(schema.accounts).values({
      siteId: site.id,
      username: 'user-disabled',
      accessToken: '',
      apiToken: 'sk-disabled',
      status: 'active',
      extraConfig: JSON.stringify({ credentialMode: 'apikey' }),
    }).returning().get();

    const result = await refreshModelsForAccount(account.id);

    expect(result.status).toBe('skipped');
    if (result.status === 'skipped') {
      expect(result.reason).toBe('site_auto_refresh_disabled');
    }
  });

  it('proceeds when site.autoRefresh=true (default)', async () => {
    const site = await db.insert(schema.sites).values({
      name: 'auto-refresh-default-site',
      url: 'https://default.example.com',
      platform: 'new-api',
    }).returning().get();

    const account = await db.insert(schema.accounts).values({
      siteId: site.id,
      username: 'user-default',
      accessToken: '',
      apiToken: 'sk-default',
      status: 'active',
      extraConfig: JSON.stringify({ credentialMode: 'apikey' }),
    }).returning().get();

    // The refresh will fail because the URL is fake, but it should NOT be skipped
    // with site_auto_refresh_disabled. It should run the actual refresh logic.
    const result = await refreshModelsForAccount(account.id);

    if (result.status === 'skipped') {
      expect(result.reason).not.toBe('site_auto_refresh_disabled');
    }
  });

  it('bypassAutoRefreshCheck=true overrides site.autoRefresh=false (OAuth case)', async () => {
    const site = await db.insert(schema.sites).values({
      name: 'oauth-bypass-site',
      url: 'https://oauth.example.com',
      platform: 'new-api',
      autoRefresh: false,
    }).returning().get();

    const account = await db.insert(schema.accounts).values({
      siteId: site.id,
      username: 'user-oauth',
      accessToken: '',
      apiToken: 'sk-oauth',
      status: 'active',
      extraConfig: JSON.stringify({ credentialMode: 'apikey' }),
    }).returning().get();

    // With bypass, should NOT be skipped for site_auto_refresh_disabled
    const result = await refreshModelsForAccount(account.id, { bypassAutoRefreshCheck: true });

    if (result.status === 'skipped') {
      expect(result.reason).not.toBe('site_auto_refresh_disabled');
    }
  });

  it('preserves existing model rows when site.autoRefresh=false (regression: clear was running before guard)', async () => {
    const site = await db.insert(schema.sites).values({
      name: 'preserve-models-site',
      url: 'https://preserve.example.com',
      platform: 'new-api',
      autoRefresh: false,
    }).returning().get();

    const account = await db.insert(schema.accounts).values({
      siteId: site.id,
      username: 'user-preserve',
      accessToken: '',
      apiToken: 'sk-preserve',
      status: 'active',
      extraConfig: JSON.stringify({ credentialMode: 'apikey' }),
    }).returning().get();

    const token = await db.insert(schema.accountTokens).values({
      accountId: account.id,
      name: 'token-1',
      token: 'sk-token-1',
      source: 'manual',
      enabled: true,
      isDefault: true,
      valueStatus: 'ready',
    }).returning().get();

    await db.insert(schema.modelAvailability).values({
      accountId: account.id,
      modelName: 'gpt-4',
      available: true,
      latencyMs: 120,
      isManual: false,
    }).run();

    await db.insert(schema.tokenModelAvailability).values({
      tokenId: token.id,
      modelName: 'gpt-4',
      available: true,
      latencyMs: 120,
    }).run();

    const result = await refreshModelsForAccount(account.id);

    expect(result.status).toBe('skipped');
    if (result.status === 'skipped') {
      expect(result.reason).toBe('site_auto_refresh_disabled');
    }

    const remainingAccountModels = await db.select().from(schema.modelAvailability)
      .where(eq(schema.modelAvailability.accountId, account.id))
      .all();
    const remainingTokenModels = await db.select().from(schema.tokenModelAvailability)
      .where(eq(schema.tokenModelAvailability.tokenId, token.id))
      .all();

    expect(remainingAccountModels.map((row: { modelName: string }) => row.modelName)).toEqual(['gpt-4']);
    expect(remainingTokenModels.map((row: { modelName: string }) => row.modelName)).toEqual(['gpt-4']);
  });
});
