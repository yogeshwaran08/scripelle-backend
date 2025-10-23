import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPOOL_MAX,
  PGSSLMODE,
  PGPOOL_IDLE_TIMEOUT_MS,
  PGPOOL_CONNECTION_TIMEOUT_MS,
  NODE_ENV,
  PGDEBUG,
} = process.env;

const poolConfig: PoolConfig = {
  host: PGHOST || 'localhost',
  port: PGPORT ? parseInt(PGPORT, 10) : 5432,
  user: PGUSER || 'postgres',
  password: PGPASSWORD || '',
  database: PGDATABASE || 'postgres',
  max: PGPOOL_MAX ? parseInt(PGPOOL_MAX, 10) : 10,
  idleTimeoutMillis: PGPOOL_IDLE_TIMEOUT_MS ? parseInt(PGPOOL_IDLE_TIMEOUT_MS, 10) : 30000,
  connectionTimeoutMillis: PGPOOL_CONNECTION_TIMEOUT_MS ? parseInt(PGPOOL_CONNECTION_TIMEOUT_MS, 10) : 0,
  ssl: PGSSLMODE && PGSSLMODE.toLowerCase() !== 'disable' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

if (PGDEBUG === 'true' || NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.debug('Postgres pool connected');
  });
  pool.on('error', (err: Error) => {
    console.error('Postgres pool error', err);
  });
}

/**
 * Run a query using the shared pool.
 * @param text - SQL text
 * @param params - optional parameters
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Lightweight initialization to verify the DB is reachable.
 */
export async function initDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

/**
 * Gracefully close the pool (use on shutdown).
 */
export async function closeDB(): Promise<void> {
  await pool.end();
}

export default pool;
