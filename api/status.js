import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS claims (ip TEXT PRIMARY KEY, token TEXT)`;
  await sql`ALTER TABLE claims ADD COLUMN IF NOT EXISTS token TEXT`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;
  const rows = await sql`SELECT COUNT(*) as count FROM claims`;
  const claimed = parseInt(rows[0].count);
  res.json({
    claimed,
    max: 3,
    full: claimed >= 3,
    alreadyClaimed: !!(await sql`SELECT 1 FROM claims WHERE ip=${ip}`).length
  });
}
