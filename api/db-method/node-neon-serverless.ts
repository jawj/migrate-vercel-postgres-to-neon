import { db } from '../vercel-postgres-compat-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  const client = await db.connect();
  const result = await client.sql`SELECT * FROM posts`;
  res.json(result);
}
