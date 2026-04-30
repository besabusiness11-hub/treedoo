import { Router } from 'express'
import webpush from 'web-push'
import { pool } from '../db'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@treedoo.it',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// GET VAPID public key (frontend needs it to subscribe)
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// Save push subscription for current user
router.post('/subscribe', requireAuth, async (req: AuthRequest, res) => {
  const { endpoint, keys } = req.body
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: 'Invalid subscription' })
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, condominio_id, endpoint, p256dh, auth)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh=$4, auth=$5`,
      [req.user!.id, req.user!.condominio_id || null, endpoint, keys.p256dh, keys.auth]
    )
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// Unsubscribe
router.delete('/subscribe', requireAuth, async (req: AuthRequest, res) => {
  const { endpoint } = req.body
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint=$1 AND user_id=$2', [endpoint, req.user!.id])
  res.status(204).send()
})

// Send notification to all users in a condominio (admin only)
router.post('/notify', requireAdmin, async (req: AuthRequest, res) => {
  const { title, body, condominioId } = req.body
  const cId = condominioId || req.user!.condominio_id
  if (!cId) return res.status(400).json({ error: 'condominio_id required' })

  const { rows } = await pool.query(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE condominio_id=$1',
    [cId]
  )

  const payload = JSON.stringify({ title: title || 'Treedoo', body: body || '', icon: '/favicon.ico' })
  const results = await Promise.allSettled(
    rows.map(sub =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        .catch(async (err) => {
          // Remove invalid subscriptions (410 Gone)
          if (err.statusCode === 410) {
            await pool.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [sub.endpoint])
          }
        })
    )
  )
  res.json({ sent: rows.length, results: results.map(r => r.status) })
})

export { router as pushRouter, webpush }
