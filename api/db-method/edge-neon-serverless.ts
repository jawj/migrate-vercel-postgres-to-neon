import { db } from '../vercel-postgres-compat';
import type { RequestContext } from '@vercel/edge';

export const config = { runtime: 'edge' };

export default async (req: Request, ctx: RequestContext) => {
  const client = await db.connect();
  const result = await client.sql`SELECT * FROM posts`;
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
}
