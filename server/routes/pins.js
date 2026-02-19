import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'
import { logAudit } from './audit.js'

const router = express.Router()

router.use(authenticateToken)

// Pin message
router.post('/channels/:channelId/messages/:messageId', (req, res) => {
  try {
    const { channelId, messageId } = req.params

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId)
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const message = db.prepare('SELECT * FROM messages WHERE id = ? AND channel_id = ?').get(messageId, channelId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check if already pinned
    const existing = db.prepare('SELECT * FROM pinned_messages WHERE message_id = ?').get(messageId)
    if (existing) {
      return res.status(400).json({ error: 'Message already pinned' })
    }

    db.prepare(
      'INSERT INTO pinned_messages (channel_id, message_id, pinned_by) VALUES (?, ?, ?)'
    ).run(channelId, messageId, req.user.id)

    logAudit(channel.server_id, req.user.id, 'MESSAGE_PIN', 'message', messageId, { channelId })

    res.json({ success: true })
  } catch (error) {
    console.error('Pin message error:', error)
    res.status(500).json({ error: 'Failed to pin message' })
  }
})

// Unpin message
router.delete('/channels/:channelId/messages/:messageId', (req, res) => {
  try {
    const { channelId, messageId } = req.params

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId)
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    db.prepare('DELETE FROM pinned_messages WHERE message_id = ?').run(messageId)

    logAudit(channel.server_id, req.user.id, 'MESSAGE_UNPIN', 'message', messageId, { channelId })

    res.json({ success: true })
  } catch (error) {
    console.error('Unpin message error:', error)
    res.status(500).json({ error: 'Failed to unpin message' })
  }
})

// Get pinned messages for channel
router.get('/channels/:channelId', (req, res) => {
  try {
    const { channelId } = req.params

    const pins = db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar,
        pm.pinned_by, pm.created_at as pinned_at,
        pu.username as pinned_by_username
      FROM pinned_messages pm
      JOIN messages m ON pm.message_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN users pu ON pm.pinned_by = pu.id
      WHERE pm.channel_id = ?
      ORDER BY pm.created_at DESC
    `).all(channelId)

    pins.forEach(pin => {
      if (pin.attachments) {
        pin.attachments = JSON.parse(pin.attachments)
      }
    })

    res.json(pins)
  } catch (error) {
    console.error('Get pinned messages error:', error)
    res.status(500).json({ error: 'Failed to fetch pinned messages' })
  }
})

export default router
