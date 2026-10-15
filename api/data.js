import { AppData, connectMongo } from '../server/db.js'
import { hasValidSession } from '../server/auth.js'

export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' })
  if (!hasValidSession(req)) return res.status(401).json({ error: 'Login required' })

  try {
    await connectMongo()
    if (req.method === 'GET') {
      const record = await AppData.findOne({ key: 'main' }).lean()
      return res.status(200).json({ state: record?.state ?? null })
    }
    const state = req.body?.state
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return res.status(400).json({ error: 'A valid state object is required' })
    }
    await AppData.findOneAndUpdate({ key: 'main' }, { $set: { state } }, { upsert: true, new: true, runValidators: true })
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('MongoDB request failed:', error)
    return res.status(500).json({ error: 'Database request failed' })
  }
}
