import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRouter from './routes/auth'
import ticketsRouter from './routes/tickets'
import scadenzeRouter from './routes/scadenze'
import postsRouter from './routes/posts'
import condominiiRouter from './routes/condominii'
import { pushRouter } from './routes/push'

const app = express()
const PORT = process.env.PORT || 4000
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/scadenze', scadenzeRouter)
app.use('/api/posts', postsRouter)
app.use('/api/condominii', condominiiRouter)
app.use('/api/push', pushRouter)

app.get('/api/health', (_, res) => res.json({ ok: true, pg: 'local', version: '18.3' }))

app.listen(PORT, () => console.log(`API server running on :${PORT}`))
