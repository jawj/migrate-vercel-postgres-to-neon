import { sql } from '@vercel/postgres';
import type { RequestContext } from '@vercel/edge';

export const config = { runtime: 'edge' };

export default async (req: Request, ctx: RequestContext) => {
  
  const id = 2;  // could be untrusted from user
  const result = await sql`SELECT * FROM posts WHERE id = ${id}`;
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
}
