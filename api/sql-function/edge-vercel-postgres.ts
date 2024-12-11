import { sql } from '@vercel/postgres';
import type { RequestContext } from '@vercel/edge';

export default async (req: Request, ctx: RequestContext) => {
  
  const result = await sql`SELECT * FROM posts`;
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
}

export const config = { runtime: 'edge' };
