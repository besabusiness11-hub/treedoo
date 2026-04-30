import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.name as user_name FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.condominio_id=$1 ORDER BY p.created_at DESC`,
    [req.user!.condominio_id]
  )
  res.json(rows)
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { content, category } = req.body
  const { rows } = await pool.query(
    'INSERT INTO posts (condominio_id, user_id, content, category) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.user!.condominio_id, req.user!.id, content, category || 'generale']
  )
  res.status(201).json(rows[0])
})

router.post('/:id/like', requireAuth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    'UPDATE posts SET likes=likes+1 WHERE id=$1 AND condominio_id=$2 RETURNING likes',
    [req.params.id, req.user!.condominio_id]
  )
  res.json(rows[0])
})

export default router
