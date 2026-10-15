import mongoose from 'mongoose'

let connectionPromise

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return
  if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI')
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI).catch((error) => {
      connectionPromise = null
      throw error
    })
  }
  await connectionPromise
}

const dataSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  state: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true })

export const AppData = mongoose.models.AppData || mongoose.model('AppData', dataSchema)
