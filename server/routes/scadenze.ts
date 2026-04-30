import { Router } from 'express'
import webpush from 'web-push'
import { pool } from '../db'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM scadenze WHERE condominio_id=$1 ORDER BY due_date ASC',
    [req.user!.condominio_id]
  )
  res.json(rows)
})

router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  const { title, amount, due_date, payment_ref } = req.body
  const { rows } = await pool.query(
    'INSERT INTO scadenze (condominio_id, title, amount, due_date, payment_ref) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user!.condominio_id, title, amount, due_date, payment_ref]
  )
  const created = rows[0]
  // Push notification to all condo subscribers
  const { rows: subs } = await pool.query(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE condominio_id=$1',
    [req.user!.condominio_id]
  ).catch(() => ({ rows: [] }))
  const payload = JSON.stringify({ title: '📋 Nuova Scadenza', body: `${created.title} — €${Number(created.amount).toFixed(2)} entro ${new Date(created.due_date).toLocaleDateString('it-IT')}`, icon: '/favicon.ico' })
  subs.forEach(sub => webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload).catch(() => {}))

  res.status(201).json(created)
})

router.patch('/:id/pay', requireAuth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    'UPDATE scadenze SET paid=true WHERE id=$1 AND condominio_id=$2 RETURNING *',
    [req.params.id, req.user!.condominio_id]
  )
  res.json(rows[0] || null)
})

router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM scadenze WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user!.condominio_id])
  res.status(204).send()
})

export default router
