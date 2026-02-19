import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// Bookmark a message
router.post('/messages/:messageId', (req, res) => {
  try {
    const { messageId } = req.params

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    db.prepare(
      'INSERT OR IGNORE INTO bookmarked_messages (user_id, message_id) VALUES (?, ?)'
    ).run(req.user.id, messageId)

    res.json({ success: true })
  } catch (error) {
    console.error('Bookmark message error:', error)
    res.status(500).json({ error: 'Failed to bookmark message' })
  }
})

// Remove bookmark
router.delete('/messages/:messageId', (req, res) => {
  try {
    const { messageId } = req.params

    db.prepare(
      'DELETE FROM bookmarked_messages WHERE user_id = ? AND message_id = ?'
    ).run(req.user.id, messageId)

    res.json({ success: true })
  } catch (error) {
    console.error('Remove bookmark error:', error)
    res.status(500).json({ error: 'Failed to remove bookmark' })
  }
})

// Get user's bookmarks
router.get('/', (req, res) => {
  try {
    const bookmarks = db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar,
        bm.created_at as bookmarked_at,
        c.name as channel_name, c.id as channel_id,
        s.name as server_name, s.id as server_id
      FROM bookmarked_messages bm
      JOIN messages m ON bm.message_id = m.id
      JOIN users u ON m.user_id = u.id
      LEFT JOIN channels c ON m.channel_id = c.id
      LEFT JOIN servers s ON c.server_id = s.id
      WHERE bm.user_id = ?
      ORDER BY bm.created_at DESC
    `).all(req.user.id)

    bookmarks.forEach(bookmark => {
      if (bookmark.attachments) {
        bookmark.attachments = JSON.parse(bookmark.attachments)
      }
    })

    res.json(bookmarks)
  } catch (error) {
    console.error('Get bookmarks error:', error)
    res.status(500).json({ error: 'Failed to fetch bookmarks' })
  }
})

export default router
