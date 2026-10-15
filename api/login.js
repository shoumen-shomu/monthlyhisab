import { createSessionToken, isValidAppPassword } from '../server/auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (!isValidAppPassword(req.body?.password)) return res.status(401).json({ error: 'Incorrect password' })
    const token = createSessionToken()
    res.setHeader('Set-Cookie', `monthly_hisab_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Login failed:', error)
    return res.status(500).json({ error: 'Login is not configured' })
  }
}
