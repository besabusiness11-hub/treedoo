import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.name as user_name FROM tickets t
     JOIN users u ON t.user_id = u.id
     WHERE t.condominio_id=$1 ORDER BY t.created_at DESC`,
    [req.user!.condominio_id]
  )
  res.json(rows)
})

router.post('/', requireAuth, upload.single('photo'), async (req: AuthRequest, res) => {
  const { title, description, category } = req.body
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null
  const { rows } = await pool.query(
    'INSERT INTO tickets (condominio_id, user_id, title, description, category, photo_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.user!.condominio_id, req.user!.id, title, description, category, photo_url]
  )
  res.status(201).json(rows[0])
})

router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  const { status } = req.body
  const { rows } = await pool.query(
    'UPDATE tickets SET status=$1, updated_at=now() WHERE id=$2 AND condominio_id=$3 RETURNING *',
    [status, req.params.id, req.user!.condominio_id]
  )
  res.json(rows[0] || null)
})

export default router
