import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureRuntimeDatabaseReady } from '../../src/server/runtimeDatabaseBootstrap.js';
import { config } from '../../src/server/config.js';
import { runtimeDbDialect, db, schema } from '../../src/server/db/index.js';
import { lt, sql } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verify authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${config.authToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure database is ready
    await ensureRuntimeDatabaseReady({
      dialect: runtimeDbDialect,
      connectionString: config.dbUrl,
      ssl: config.dbSsl,
    });

    // Run log cleanup task
    if (config.logCleanupUsageLogsEnabled) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.logCleanupRetentionDays);
      
      await db.delete(schema.proxyLogs)
        .where(lt(schema.proxyLogs.createdAt, cutoffDate.toISOString()));
    }
    
    res.status(200).json({ success: true, message: 'Log cleanup task executed' });
  } catch (error) {
    console.error('Error executing log cleanup task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
