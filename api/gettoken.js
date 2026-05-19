import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const sql = neon(process.env.DATABASE_URL);
  
  await sql`CREATE TABLE IF NOT EXISTS page_tokens (
    token TEXT PRIMARY KEY,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Clean old tokens
  await sql`DELETE FROM page_tokens WHERE created_at < NOW() - INTERVAL '10 minutes'`;

  const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  await sql`INSERT INTO page_tokens (token) VALUES (${token})`;
  
  res.json({ token });
}
