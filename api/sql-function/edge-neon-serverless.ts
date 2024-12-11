import { neon } from '@neondatabase/serverless';  // <- change import
import type { RequestContext } from '@vercel/edge';

export const config = { runtime: 'edge' };

export default async (req: Request, ctx: RequestContext) => {
  const sql = neon(process.env.POSTGRES_URL!, { fullResults: true });  // <- one new line
  const result = await sql`SELECT * FROM posts`;  // <- unchanged
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
}
