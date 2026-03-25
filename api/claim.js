import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS claims (ip TEXT PRIMARY KEY, token TEXT)`;

  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0';

  const rows = await sql`SELECT COUNT(*) as count FROM claims`;
  const claimed = parseInt(rows[0].count);

  const already = await sql`SELECT token FROM claims WHERE ip=${ip}`;
  if (already.length) return res.json({ ok: false, reason: 'already_claimed', claimed });
  if (claimed >= 3) return res.json({ ok: false, reason: 'full', claimed });

  const token = randomBytes(32).toString('hex');
  await sql`INSERT INTO claims (ip, token) VALUES (${ip}, ${token})`;
  res.json({ ok: true, claimed: claimed + 1, slot: claimed + 1, token });
}
