import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/channel/:channelId', (req, res) => {
  try {
    const { channelId } = req.params
    const limit = parseInt(req.query.limit) || 50
    const before = req.query.before

    let query = `
      SELECT m.*, u.username, u.avatar, u.status
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ?
    `
    const params = [channelId]

    if (before) {
      query += ' AND m.id < ?'
      params.push(before)
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?'
    params.push(limit)

    const messages = db.prepare(query).all(...params)
    res.json(messages.reverse())
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

router.get('/dm/:dmId', (req, res) => {
  try {
    const { dmId } = req.params
    const limit = parseInt(req.query.limit) || 50
    const before = req.query.before

    let query = `
      SELECT m.*, u.username, u.avatar, u.status
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.dm_id = ?
    `
    const params = [dmId]

    if (before) {
      query += ' AND m.id < ?'
      params.push(before)
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?'
    params.push(limit)

    const messages = db.prepare(query).all(...params)
    res.json(messages.reverse())
  } catch (error) {
    console.error('Get DM messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

router.delete('/:messageId', (req, res) => {
  try {
    const { messageId } = req.params
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete your own messages' })
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

router.put('/:messageId', (req, res) => {
  try {
    const { messageId } = req.params
    const { content } = req.body
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit your own messages' })
    }

    db.prepare('UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?').run(content, messageId)
    
    const updated = db.prepare(`
      SELECT m.*, u.username, u.avatar, u.status
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(messageId)

    res.json(updated)
  } catch (error) {
    console.error('Edit message error:', error)
    res.status(500).json({ error: 'Failed to edit message' })
  }
})

export default router
