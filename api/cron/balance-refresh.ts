import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureRuntimeDatabaseReady } from '../../src/server/runtimeDatabaseBootstrap.js';
import { config } from '../../src/server/config.js';
import { runtimeDbDialect } from '../../src/server/db/index.js';
import * as routeRefreshWorkflow from '../../src/server/services/routeRefreshWorkflow.js';

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

    // Run balance refresh task
    await routeRefreshWorkflow.rebuildRoutesOnly();
    
    res.status(200).json({ success: true, message: 'Balance refresh task executed' });
  } catch (error) {
    console.error('Error executing balance refresh task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
