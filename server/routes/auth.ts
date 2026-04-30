import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { signToken, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, name, role, condominio_id, condominio_name, condominio_address } = req.body
  if (!email || !password || !name || !role) return res.status(400).json({ error: 'Missing fields' })
  try {
    const hash = await bcrypt.hash(password, 10)
    let finalCondominioId = condominio_id || null

    // Admin creates a new condominio on registration
    if (role === 'amministratore' && condominio_name && !condominio_id) {
      const { rows: condRows } = await pool.query(
        'INSERT INTO condominii (name, address) VALUES ($1,$2) RETURNING id',
        [condominio_name, condominio_address || null]
      )
      finalCondominioId = condRows[0].id
    }

    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name, role, condominio_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, name, role, condominio_id',
      [email, hash, name, role, finalCondominioId]
    )
    const user = rows[0]
    res.json({ token: signToken(user), user })
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email già registrata' })
    res.status(500).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Credenziali errate' })
  const { password_hash, ...safeUser } = user
  res.json({ token: signToken(safeUser), user: safeUser })
})

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, condominio_id, created_at FROM users WHERE id=$1',
    [req.user!.id]
  )
  res.json(rows[0] || null)
})

export default router
