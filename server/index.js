import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AppData, connectMongo } from './db.js'
import { createSessionToken, hasValidSession, isValidAppPassword } from './auth.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const mongoUri = process.env.MONGODB_URI
const appPassword = process.env.APP_PASSWORD
const sessionSecret = process.env.SESSION_SECRET

if (!mongoUri || !appPassword || !sessionSecret) {
  console.error('Missing required environment settings. Copy .env.example to .env and configure MongoDB and app credentials.')
  process.exit(1)
}

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.post('/api/login', (req, res) => {
  if (!isValidAppPassword(req.body?.password)) {
    return res.status(401).json({ error: 'Incorrect password' })
  }
  const token = createSessionToken()
  res.cookie('monthly_hisab_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.json({ ok: true })
})

app.post('/api/logout', (_req, res) => {
  res.clearCookie('monthly_hisab_session')
  res.json({ ok: true })
})

function requireLogin(req, res, next) {
  if (hasValidSession(req)) return next()
  res.status(401).json({ error: 'Login required' })
}

app.get('/api/data', requireLogin, async (_req, res) => {
  try {
    const record = await AppData.findOne({ key: 'main' }).lean()
    res.json({ state: record?.state ?? null })
  } catch (error) {
    console.error('Unable to load app data:', error)
    res.status(500).json({ error: 'Unable to load data' })
  }
})

app.put('/api/data', requireLogin, async (req, res) => {
  if (!req.body?.state || typeof req.body.state !== 'object' || Array.isArray(req.body.state)) {
    return res.status(400).json({ error: 'A valid state object is required' })
  }
  try {
    await AppData.findOneAndUpdate(
      { key: 'main' },
      { $set: { state: req.body.state } },
      { upsert: true, new: true, runValidators: true },
    )
    res.json({ ok: true })
  } catch (error) {
    console.error('Unable to save app data:', error)
    res.status(500).json({ error: 'Unable to save data' })
  }
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))

try {
  await connectMongo()
  app.listen(port, () => console.log(`Monthly Hisab server listening on port ${port}`))
} catch (error) {
  console.error('MongoDB connection failed:', error.message)
  process.exit(1)
}
