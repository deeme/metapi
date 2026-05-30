import { buildConfig } from './src/server/config.js';

// 模拟 Vercel 环境
const testEnv = {
  DB_TYPE: 'postgres',
  POSTGRES_URL: 'postgresql://user:pass@host.neon.tech/database',
  DB_SSL: 'true',
  AUTH_TOKEN: 'test-token',
  PROXY_TOKEN: 'test-proxy-token',
  ACCOUNT_CREDENTIAL_SECRET: 'test-secret',
};

const config = buildConfig(testEnv);

console.log('DB Type:', config.dbType);
console.log('DB URL:', config.dbUrl);
console.log('DB SSL:', config.dbSsl);

if (config.dbType === 'postgres' && !config.dbUrl) {
  console.error('❌ ERROR: DB_URL is empty when DB_TYPE=postgres');
  process.exit(1);
}

if (config.dbUrl === testEnv.POSTGRES_URL) {
  console.log('✅ SUCCESS: POSTGRES_URL was correctly detected');
} else {
  console.error('❌ ERROR: POSTGRES_URL was not detected');
  process.exit(1);
}
