import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS claims (ip TEXT PRIMARY KEY)`;

  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;

  const rows = await sql`SELECT COUNT(*) as count FROM claims`;
  const claimed = parseInt(rows[0].count);

  const already = await sql`SELECT 1 FROM claims WHERE ip=${ip}`;
  if (already.length) return res.json({ ok: false, reason: 'already_claimed', claimed });
  if (claimed >= 3) return res.json({ ok: false, reason: 'full', claimed });

  await sql`INSERT INTO claims (ip) VALUES (${ip})`;
  res.json({ ok: true, claimed: claimed + 1, slot: claimed + 1 });
}
