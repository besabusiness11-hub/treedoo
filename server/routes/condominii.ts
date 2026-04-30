import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Public — no auth required (for registration picker)
router.get('/public', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name, address FROM condominii ORDER BY name')
  res.json(rows)
})

router.get('/', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM condominii ORDER BY name')
  res.json(rows)
})

router.post('/', requireAdmin, async (req, res) => {
  const { name, address } = req.body
  const { rows } = await pool.query(
    'INSERT INTO condominii (name, address) VALUES ($1,$2) RETURNING *',
    [name, address]
  )
  res.status(201).json(rows[0])
})

export default router
