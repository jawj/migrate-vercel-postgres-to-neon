import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {

  const result = await sql`SELECT * FROM posts`;
  res.json(result);
}

export const config = { runtime: 'nodejs' };
