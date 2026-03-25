import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const sql = neon(process.env.DATABASE_URL);
  const { token } = req.body || {};
  if (!token) return res.json({ valid: false });

  const rows = await sql`SELECT 1 FROM claims WHERE token=${token}`;
  res.json({ valid: rows.length > 0 });
}
