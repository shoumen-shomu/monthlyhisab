import jwt from 'jsonwebtoken'
import { timingSafeEqual } from 'node:crypto'

export function isValidAppPassword(value) {
  if (!process.env.APP_PASSWORD) throw new Error('Missing APP_PASSWORD')
  const submitted = Buffer.from(String(value ?? ''))
  const expected = Buffer.from(process.env.APP_PASSWORD)
  return submitted.length === expected.length && timingSafeEqual(submitted, expected)
}

export function createSessionToken() {
  if (!process.env.SESSION_SECRET) throw new Error('Missing SESSION_SECRET')
  return jwt.sign({ access: true }, process.env.SESSION_SECRET, { expiresIn: '7d' })
}

export function hasValidSession(req) {
  try {
    if (!process.env.SESSION_SECRET) return false
    const cookieHeader = req.headers.cookie || ''
    const tokenPart = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('monthly_hisab_session='))
    if (!tokenPart) return false
    jwt.verify(decodeURIComponent(tokenPart.slice('monthly_hisab_session='.length)), process.env.SESSION_SECRET)
    return true
  } catch {
    return false
  }
}
