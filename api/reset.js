import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM claims`;
  res.json({ ok: true, message: 'All slots reset!' });
}
