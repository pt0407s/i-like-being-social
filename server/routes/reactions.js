import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// Add reaction to message
router.post('/messages/:messageId', (req, res) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    db.prepare(
      'INSERT OR IGNORE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)'
    ).run(messageId, req.user.id, emoji)

    const reactions = db.prepare(`
      SELECT emoji, COUNT(*) as count,
        GROUP_CONCAT(user_id) as user_ids
      FROM message_reactions
      WHERE message_id = ?
      GROUP BY emoji
    `).all(messageId)

    res.json(reactions)
  } catch (error) {
    console.error('Add reaction error:', error)
    res.status(500).json({ error: 'Failed to add reaction' })
  }
})

// Remove reaction from message
router.delete('/messages/:messageId/:emoji', (req, res) => {
  try {
    const { messageId, emoji } = req.params

    db.prepare(
      'DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?'
    ).run(messageId, req.user.id, decodeURIComponent(emoji))

    const reactions = db.prepare(`
      SELECT emoji, COUNT(*) as count,
        GROUP_CONCAT(user_id) as user_ids
      FROM message_reactions
      WHERE message_id = ?
      GROUP BY emoji
    `).all(messageId)

    res.json(reactions)
  } catch (error) {
    console.error('Remove reaction error:', error)
    res.status(500).json({ error: 'Failed to remove reaction' })
  }
})

// Get reactions for message
router.get('/messages/:messageId', (req, res) => {
  try {
    const { messageId } = req.params

    const reactions = db.prepare(`
      SELECT emoji, COUNT(*) as count,
        GROUP_CONCAT(user_id) as user_ids
      FROM message_reactions
      WHERE message_id = ?
      GROUP BY emoji
    `).all(messageId)

    res.json(reactions)
  } catch (error) {
    console.error('Get reactions error:', error)
    res.status(500).json({ error: 'Failed to fetch reactions' })
  }
})

export default router
