// to replace @vercel/postgres for Vercel Functions -- i.e. Node.js:

// 1) `npm install @neondatabase/serverless ws @types/ws`
// 2) add this file and vercel-postgres-compat.ts to your project
// 2) change imports from '@vercel/postgres' to this file, './path/to/vercel-postgres-compat-node'`

import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
if (neonConfig) neonConfig.webSocketConstructor = ws;
export * from './vercel-postgres-compat';
