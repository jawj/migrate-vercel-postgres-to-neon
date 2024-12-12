import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  
  const id = 2;  // could be untrusted from user
  const result = await sql`SELECT * FROM posts WHERE id = ${id}`;
  res.json(result);
}
