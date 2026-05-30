import type { VercelRequest, VercelResponse } from '@vercel/node';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import {
  buildFastifyOptions,
  config,
} from '../src/server/config.js';
import { authMiddleware } from '../src/server/middleware/auth.js';
import { sitesRoutes } from '../src/server/routes/api/sites.js';
import { accountsRoutes } from '../src/server/routes/api/accounts.js';
import { checkinRoutes } from '../src/server/routes/api/checkin.js';
import { tokensRoutes } from '../src/server/routes/api/tokens.js';
import { statsRoutes } from '../src/server/routes/api/stats.js';
import { authRoutes } from '../src/server/routes/api/auth.js';
import { settingsRoutes } from '../src/server/routes/api/settings.js';
import { accountTokensRoutes } from '../src/server/routes/api/accountTokens.js';
import { searchRoutes } from '../src/server/routes/api/search.js';
import { eventsRoutes } from '../src/server/routes/api/events.js';
import { taskRoutes } from '../src/server/routes/api/tasks.js';
import { testRoutes } from '../src/server/routes/api/test.js';
import { monitorRoutes } from '../src/server/routes/api/monitor.js';
import { downstreamApiKeysRoutes } from '../src/server/routes/api/downstreamApiKeys.js';
import { oauthRoutes } from '../src/server/routes/api/oauth.js';
import { siteAnnouncementsRoutes } from '../src/server/routes/api/siteAnnouncements.js';
import { updateCenterRoutes } from '../src/server/routes/api/updateCenter.js';
import { proxyRoutes } from '../src/server/routes/proxy/router.js';
import * as routeRefreshWorkflow from '../src/server/services/routeRefreshWorkflow.js';
import { repairStoredCreatedAtValues } from '../src/server/services/storedTimestampRepairService.js';
import { migrateSiteApiKeysToAccounts } from '../src/server/services/siteApiKeyMigrationService.js';
import { ensureDefaultSitesSeeded } from '../src/server/services/defaultSiteSeedService.js';
import { ensureOauthIdentityBackfill } from '../src/server/services/oauth/oauthIdentityBackfill.js';
import { ensureOauthProviderSitesExist } from '../src/server/services/oauth/oauthSiteRegistry.js';
import { ensureRuntimeDatabaseReady } from '../src/server/runtimeDatabaseBootstrap.js';
import { isPublicApiRoute, registerDesktopRoutes } from '../src/server/desktop.js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, normalize, resolve, sep } from 'path';
import {
  applyRuntimeSettings,
  parseSettingFromMap,
} from '../src/server/runtimeSettingsHydration.js';
import { normalizeLogCleanupRetentionDays } from '../src/server/shared/logCleanupRetentionDays.js';
import {
  db,
  ensureProxyFileCompatibilityColumns,
  ensureProxyLogClientColumns,
  ensureProxyLogDownstreamApiKeyIdColumn,
  ensureProxyLogBillingDetailsColumn,
  ensureProxyLogStreamTimingColumns,
  ensureRouteGroupingCompatibilityColumns,
  ensureSiteCompatibilityColumns,
  runtimeDbDialect,
  schema,
  switchRuntimeDatabase,
  type RuntimeDbDialect,
} from '../src/server/db/index.js';

function toSettingsMap(rows: Array<{ key: string; value: string }>) {
  return new Map(rows.map((row) => [row.key, row.value]));
}

function normalizeSavedDbType(value: unknown): RuntimeDbDialect | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'sqlite') return 'sqlite';
  if (normalized === 'mysql') return 'mysql';
  if (normalized === 'postgres' || normalized === 'postgresql') return 'postgres';
  return null;
}

function validateSavedDbUrl(dialect: RuntimeDbDialect, value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (dialect === 'sqlite') return normalized;
  if (dialect === 'mysql' && normalized.startsWith('mysql://')) return normalized;
  if (dialect === 'postgres' && (normalized.startsWith('postgres://') || normalized.startsWith('postgresql://'))) return normalized;
  return null;
}

function extractSavedRuntimeDatabaseConfig(settingsMap: Map<string, string>): { dialect: RuntimeDbDialect; dbUrl: string; ssl: boolean } | null {
  const rawType = parseSettingFromMap<unknown>(settingsMap, 'db_type');
  const rawUrl = parseSettingFromMap<unknown>(settingsMap, 'db_url');
  const rawSsl = parseSettingFromMap<boolean>(settingsMap, 'db_ssl');
  const dialect = normalizeSavedDbType(rawType);
  if (!dialect) return null;
  const dbUrl = validateSavedDbUrl(dialect, rawUrl);
  if (!dbUrl) return null;
  return {
    dialect,
    dbUrl,
    ssl: typeof rawSsl === 'boolean' ? rawSsl : false,
  };
}

const LOG_CLEANUP_SETTING_KEYS = [
  'log_cleanup_cron',
  'log_cleanup_usage_logs_enabled',
  'log_cleanup_program_logs_enabled',
  'log_cleanup_retention_days',
] as const;

function hasExplicitLogCleanupSettings(settingsMap: Map<string, string>): boolean {
  return LOG_CLEANUP_SETTING_KEYS.some((key) => settingsMap.has(key));
}

let appInstance: Awaited<ReturnType<typeof createApp>> | null = null;
let initPromise: Promise<void> | null = null;

async function createApp() {
  // Ensure the current runtime database is bootstrapped before reading settings.
  await ensureRuntimeDatabaseReady({
    dialect: runtimeDbDialect,
    connectionString: config.dbUrl,
    ssl: config.dbSsl,
  });

  // Load runtime config overrides from settings
  try {
    const initialRows = await db.select().from(schema.settings).all();
    const initialMap = toSettingsMap(initialRows);
    const savedDbConfig = extractSavedRuntimeDatabaseConfig(initialMap);
    const activeDbUrl = (config.dbUrl || '').trim();
    const originalRuntimeConfig = {
      dialect: runtimeDbDialect,
      dbUrl: activeDbUrl,
      ssl: config.dbSsl,
    };
    if (savedDbConfig && (savedDbConfig.dialect !== runtimeDbDialect || savedDbConfig.dbUrl !== activeDbUrl || savedDbConfig.ssl !== config.dbSsl)) {
      try {
        await switchRuntimeDatabase(savedDbConfig.dialect, savedDbConfig.dbUrl, savedDbConfig.ssl);
        console.log(`Loaded runtime DB config from settings: ${savedDbConfig.dialect}`);
      } catch (error) {
        const currentDbUrl = (config.dbUrl || '').trim();
        const switchedAway = runtimeDbDialect !== originalRuntimeConfig.dialect
          || currentDbUrl !== originalRuntimeConfig.dbUrl
          || config.dbSsl !== originalRuntimeConfig.ssl;
        if (switchedAway) {
          await switchRuntimeDatabase(
            originalRuntimeConfig.dialect,
            originalRuntimeConfig.dbUrl,
            originalRuntimeConfig.ssl,
          );
        }
        console.warn(`Failed to switch runtime DB from settings: ${(error as Error)?.message || 'unknown error'}`);
      }
    }

    await ensureSiteCompatibilityColumns();
    await ensureRouteGroupingCompatibilityColumns();
    await ensureProxyFileCompatibilityColumns();
    await ensureProxyLogStreamTimingColumns();
    await ensureProxyLogClientColumns();
    await ensureProxyLogDownstreamApiKeyIdColumn();
    const finalRows = await db.select().from(schema.settings).all();
    const finalMap = toSettingsMap(finalRows);
    applyRuntimeSettings(finalMap);
    config.logCleanupConfigured = hasExplicitLogCleanupSettings(finalMap);
    if (!config.logCleanupConfigured && config.proxyLogRetentionDays > 0) {
      config.logCleanupUsageLogsEnabled = true;
      config.logCleanupProgramLogsEnabled = false;
      config.logCleanupRetentionDays = normalizeLogCleanupRetentionDays(config.proxyLogRetentionDays);
    }
    await ensureProxyLogBillingDetailsColumn();
    await repairStoredCreatedAtValues();
    await migrateSiteApiKeysToAccounts();
    await ensureDefaultSitesSeeded();
    await ensureOauthIdentityBackfill();
    await routeRefreshWorkflow.rebuildRoutesOnly();

    console.log('Loaded runtime settings overrides');
  } catch (error) {
    console.warn(`Failed to load runtime settings overrides: ${(error as Error)?.message || 'unknown error'}`);
  }

  await ensureOauthProviderSitesExist();

  const app = Fastify(buildFastifyOptions(config));

  await app.register(cors);

  // Auth middleware for /api routes
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/') && !isPublicApiRoute(request.url)) {
      await authMiddleware(request, reply);
    }
  });

  // Register API routes
  await app.register(registerDesktopRoutes);
  await app.register(sitesRoutes);
  await app.register(accountsRoutes);
  await app.register(checkinRoutes);
  await app.register(tokensRoutes);
  await app.register(statsRoutes);
  await app.register(authRoutes);
  await app.register(settingsRoutes);
  await app.register(accountTokensRoutes);
  await app.register(searchRoutes);
  await app.register(eventsRoutes);
  await app.register(siteAnnouncementsRoutes);
  await app.register(updateCenterRoutes);
  await app.register(taskRoutes);
  await app.register(testRoutes);
  await app.register(monitorRoutes);
  await app.register(downstreamApiKeysRoutes);
  await app.register(oauthRoutes);

  // Register OpenAI-compatible proxy routes
  await app.register(proxyRoutes);

  // Serve static web frontend in production
  const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/web');
  if (existsSync(webDir)) {
    await app.register(fastifyStatic, {
      root: webDir,
      prefix: '/',
      wildcard: false,
      setHeaders: (res, filePath) => {
        const normalizedPath = normalize(filePath);
        if (normalizedPath.includes(`${sep}assets${sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }
        if (normalizedPath.endsWith(`${sep}index.html`)) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    });
    // SPA fallback
    app.setNotFoundHandler(async (request, reply) => {
      if (!request.url.startsWith('/api/') && !request.url.startsWith('/v1/')) {
        return reply.sendFile('index.html');
      }
      reply.code(404).send({ error: 'Not found' });
    });
  }

  await app.ready();
  return app;
}

async function ensureAppInitialized() {
  if (appInstance) return appInstance;
  
  if (!initPromise) {
    initPromise = createApp().then((app) => {
      appInstance = app;
      console.log('Fastify app initialized for Vercel');
    });
  }
  
  await initPromise;
  return appInstance!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await ensureAppInitialized();
    await app.ready();
    app.server.emit('request', req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
