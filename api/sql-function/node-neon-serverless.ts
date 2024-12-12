import { neon } from '@neondatabase/serverless';  // <- change import
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  const sql = neon(process.env.POSTGRES_URL!, { fullResults: true });  // <- one new line
  const id = 2;  // could be untrusted from user
  const result = await sql`SELECT * FROM posts WHERE id = ${id}`;
  res.json(result);
}
