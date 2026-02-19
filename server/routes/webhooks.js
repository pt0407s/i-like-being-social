import express from 'express'
import { nanoid } from 'nanoid'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'
import { logAudit } from './audit.js'

const router = express.Router()

router.use(authenticateToken)

// Create webhook
router.post('/servers/:serverId/channels/:channelId', (req, res) => {
  try {
    const { serverId, channelId } = req.params
    const { name, avatar } = req.body

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can create webhooks' })
    }

    const token = nanoid(64)
    const result = db.prepare(
      'INSERT INTO webhooks (server_id, channel_id, name, avatar, token, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(serverId, channelId, name, avatar || null, token, req.user.id)

    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(result.lastInsertRowid)

    logAudit(serverId, req.user.id, 'WEBHOOK_CREATE', 'webhook', webhook.id, { name, channelId })

    res.json({ ...webhook, url: `${process.env.API_URL || 'http://localhost:3001'}/api/webhooks/${webhook.id}/${token}` })
  } catch (error) {
    console.error('Create webhook error:', error)
    res.status(500).json({ error: 'Failed to create webhook' })
  }
})

// Get server webhooks
router.get('/servers/:serverId', (req, res) => {
  try {
    const { serverId } = req.params

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can view webhooks' })
    }

    const webhooks = db.prepare(`
      SELECT w.*, c.name as channel_name, u.username as creator_username
      FROM webhooks w
      JOIN channels c ON w.channel_id = c.id
      JOIN users u ON w.created_by = u.id
      WHERE w.server_id = ?
    `).all(serverId)

    res.json(webhooks)
  } catch (error) {
    console.error('Get webhooks error:', error)
    res.status(500).json({ error: 'Failed to fetch webhooks' })
  }
})

// Delete webhook
router.delete('/:webhookId', (req, res) => {
  try {
    const { webhookId } = req.params

    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(webhookId)
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' })
    }

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(webhook.server_id)
    if (server.owner_id !== req.user.id && webhook.created_by !== req.user.id) {
      return res.status(403).json({ error: 'No permission to delete this webhook' })
    }

    db.prepare('DELETE FROM webhooks WHERE id = ?').run(webhookId)

    logAudit(webhook.server_id, req.user.id, 'WEBHOOK_DELETE', 'webhook', webhookId, { name: webhook.name })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete webhook error:', error)
    res.status(500).json({ error: 'Failed to delete webhook' })
  }
})

// Execute webhook (public endpoint)
router.post('/:webhookId/:token', (req, res) => {
  try {
    const { webhookId, token } = req.params
    const { content, username, avatar_url, embeds } = req.body

    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ? AND token = ?').get(webhookId, token)
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' })
    }

    // Create message as webhook
    const result = db.prepare(
      'INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)'
    ).run(webhook.channel_id, webhook.created_by, content)

    res.json({ success: true, message_id: result.lastInsertRowid })
  } catch (error) {
    console.error('Execute webhook error:', error)
    res.status(500).json({ error: 'Failed to execute webhook' })
  }
})

export default router
