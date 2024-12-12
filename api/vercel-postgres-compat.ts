// to replace @vercel/postgres for Vercel Edge Functions (not Node.js):

// 1) `npm install @neondatabase/serverless`
// 2) add this file to your project
// 2) change imports from '@vercel/postgres' to this file, './path/to/vercel-postgres-compat'`

import {
  neon,
  Pool,
  Client,
} from '@neondatabase/serverless';

import type {
  ClientBase,
  ClientConfig,
  PoolConfig,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from '@neondatabase/serverless';

export type {
  Pool,
  Client,
  Query,
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryParse,
  QueryResult,
  QueryResultBase,
  QueryResultRow,
  FieldDef,
  types,
} from '@neondatabase/serverless';

// error.ts

type VercelPostgresErrorCode = 'invalid_connection_string' | 'missing_connection_string' | 'invalid_connection_type' | 'incorrect_tagged_template_call';

export class VercelPostgresError extends Error {
  public constructor(public code: VercelPostgresErrorCode, message: string) {
    super(`VercelPostgresError - '${code}': ${message}`);
    this.name = 'VercelPostgresError';
  }
}

// types.ts

type ConfigItemsToOmit = 'user' | 'database' | 'password' | 'host' | 'port';
export type VercelPostgresClientConfig = Omit<ClientConfig, ConfigItemsToOmit>;
export type VercelPostgresPoolConfig = Omit<PoolConfig, ConfigItemsToOmit>;

export interface VercelClientBase extends ClientBase {
  sql: <O extends QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: Primitive[]
  ) => Promise<QueryResult<O>>;
}

export interface VercelPoolClient extends VercelClientBase {
  release: (err?: Error | boolean) => void;
}

// postgres-connection-string.ts

export type ConnectionStringType = 'pool' | 'direct';

export function postgresConnectionString(type: ConnectionStringType = 'pool'): string | undefined {
  let connectionString: string | undefined;

  switch (type) {
    case 'pool': {
      connectionString = process.env.POSTGRES_URL;
      break;
    }
    case 'direct': {
      connectionString = process.env.POSTGRES_URL_NON_POOLING;
      break;
    }
    default: {
      const _exhaustiveCheck: never = type;
      const str = _exhaustiveCheck as string;
      throw new VercelPostgresError('invalid_connection_type', `Unhandled type: ${str}`);
    }
  }

  if (connectionString === 'undefined') connectionString = undefined;
  return connectionString;
}

export function isPooledConnectionString(connectionString: string): boolean {
  return connectionString.includes('-pooler.');
}

export function isDirectConnectionString(connectionString: string): boolean {
  return !isPooledConnectionString(connectionString);
}

export function isLocalhostConnectionString(connectionString: string): boolean {
  try {
    const withHttpsProtocol = connectionString.replace(/^postgresql:\/\//, 'https://');
    return new URL(withHttpsProtocol).hostname === 'localhost';
  } catch (err) {
    if (err instanceof TypeError) return false;
    if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' && err.message === 'Invalid URL') return false;
    throw err;
  }
}

// sql-template.ts

export type Primitive = string | number | boolean | undefined | null;

export function sqlTemplate(strings: TemplateStringsArray, ...values: Primitive[]): [string, Primitive[]] {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) throw new VercelPostgresError('incorrect_tagged_template_call', "It looks like you tried to call `sql` as a function. Make sure to use it as a tagged template.\n\tExample: sql`SELECT * FROM users`, not sql('SELECT * FROM users')");
  let result = strings[0] ?? '';
  for (let i = 1; i < strings.length; i++) result += `$${i}${strings[i] ?? ''}`;
  return [result, values];
}

function isTemplateStringsArray(strings: unknown): strings is TemplateStringsArray {
  return Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw);
}

// create-client.ts

export class VercelClient extends Client {
  async sql<O extends QueryResultRow>(strings: TemplateStringsArray, ...values: Primitive[]): Promise<QueryResult<O>> {
    const [query, params] = sqlTemplate(strings, ...values);
    return this.query(query, params);
  }
}

export function createClient(config?: VercelPostgresClientConfig): VercelClient {
  const connectionString = config?.connectionString ?? postgresConnectionString('direct');
  if (!connectionString) throw new VercelPostgresError('missing_connection_string', "You did not supply a 'connectionString' and no 'POSTGRES_URL_NON_POOLING' env var was found.");
  if (!isLocalhostConnectionString(connectionString) && !isDirectConnectionString(connectionString)) throw new VercelPostgresError('invalid_connection_string', 'This connection string is meant to be used with a pooled connection. Try `createPool()` instead.');
  return new VercelClient({ ...config, connectionString });
}

// create-pool.ts

export class VercelPool extends Pool {
  Client = VercelClient;
  private connectionString: string;

  constructor(config: VercelPostgresPoolConfig) {
    super(config);
    this.connectionString = config.connectionString ?? '';
  }

  async sql<O extends QueryResultRow>(strings: TemplateStringsArray, ...values: Primitive[]): Promise<QueryResult<O>> {
    const [query, params] = sqlTemplate(strings, ...values);
    const sql = neon(this.connectionString, { fullResults: true });
    return sql(query, params) as unknown as Promise<QueryResult<O>>;
  }

  connect(): Promise<VercelPoolClient>;
  connect(callback: (err: Error, client: VercelPoolClient, done: (release?: any) => void) => void): void;
  connect(callback?: (err: Error, client: VercelPoolClient, done: (release?: any) => void) => void): void | Promise<VercelPoolClient> {
    return super.connect(callback as (err: Error, client: PoolClient, done: (release?: any) => void) => void);
  }
}

export function createPool(config?: VercelPostgresPoolConfig): VercelPool {
  const connectionString = config?.connectionString ?? postgresConnectionString('pool');
  if (!connectionString) throw new VercelPostgresError('missing_connection_string', "You did not supply a 'connectionString' and no 'POSTGRES_URL' env var was found.");
  if (!isLocalhostConnectionString(connectionString) && !isPooledConnectionString(connectionString)) throw new VercelPostgresError('invalid_connection_string', 'This connection string is meant to be used with a direct connection. Make sure to use a pooled connection string or try `createClient()` instead.');

  let maxUses = config?.maxUses;
  let max = config?.max;
  // @ts-ignore -- EdgeRuntime isn't recognised
  if (typeof EdgeRuntime !== 'undefined') {
    if (maxUses && maxUses !== 1) console.warn('@vercel/postgres: Overriding `maxUses` to 1 because the EdgeRuntime does not support client reuse.');
    if (max && max !== 10_000) console.warn('@vercel/postgres: Overriding `max` to 10,000 because the EdgeRuntime does not support client reuse.');
    maxUses = 1;
    max = 10_000;
  }

  const pool = new VercelPool({ ...config, connectionString, maxUses, max });
  return pool;
}

// index.ts

let pool: VercelPool | undefined;

export const sql = new Proxy(
  () => {},
  {
    get(_, prop) {
      if (!pool) pool = createPool();
      const val = Reflect.get(pool, prop);
      if (typeof val === 'function') return val.bind(pool);
      return val;
    },
    apply(_, __, argumentsList) {
      if (!pool) pool = createPool();
      // @ts-ignore - we're breaking all kinds of rules
      return pool.sql(...argumentsList);
    },
  },
) as unknown as VercelPool &
  (<O extends QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: Primitive[]
  ) => Promise<QueryResult<O>>);

export const db = sql;
