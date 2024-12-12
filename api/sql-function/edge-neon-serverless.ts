import { neon } from '@neondatabase/serverless';  // <- change import
import type { RequestContext } from '@vercel/edge';

export const config = { runtime: 'edge' };

export default async (req: Request, ctx: RequestContext) => {
  const sql = neon(process.env.POSTGRES_URL!, { fullResults: true });  // <- one new line
  const id = 2;  // could be untrusted from user
  const result = await sql`SELECT * FROM posts WHERE id = ${id}`;  // <- unchanged
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
}
