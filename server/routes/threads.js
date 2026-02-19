import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'
import { logAudit } from './audit.js'

const router = express.Router()

router.use(authenticateToken)

// Create thread from message
router.post('/messages/:messageId', (req, res) => {
  try {
    const { messageId } = req.params

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check if thread already exists
    const existingThread = db.prepare('SELECT * FROM message_threads WHERE parent_message_id = ?').get(messageId)
    if (existingThread) {
      return res.json(existingThread)
    }

    const result = db.prepare(
      'INSERT INTO message_threads (parent_message_id, channel_id) VALUES (?, ?)'
    ).run(messageId, message.channel_id)

    const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(result.lastInsertRowid)

    if (message.channel_id) {
      const channel = db.prepare('SELECT server_id FROM channels WHERE id = ?').get(message.channel_id)
      if (channel) {
        logAudit(channel.server_id, req.user.id, 'THREAD_CREATE', 'thread', thread.id, { messageId })
      }
    }

    res.json(thread)
  } catch (error) {
    console.error('Create thread error:', error)
    res.status(500).json({ error: 'Failed to create thread' })
  }
})

// Get thread messages
router.get('/:threadId/messages', (req, res) => {
  try {
    const { threadId } = req.params
    const { limit = 50, before } = req.query

    let query = `
      SELECT tm.*, u.username, u.display_name, u.avatar, u.status
      FROM thread_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.thread_id = ?
    `
    const params = [threadId]

    if (before) {
      query += ' AND tm.id < ?'
      params.push(before)
    }

    query += ' ORDER BY tm.created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const messages = db.prepare(query).all(...params)

    messages.forEach(msg => {
      if (msg.attachments) {
        msg.attachments = JSON.parse(msg.attachments)
      }
    })

    res.json(messages.reverse())
  } catch (error) {
    console.error('Get thread messages error:', error)
    res.status(500).json({ error: 'Failed to fetch thread messages' })
  }
})

// Reply to thread
router.post('/:threadId/messages', (req, res) => {
  try {
    const { threadId } = req.params
    const { content, attachments } = req.body

    const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(threadId)
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    const result = db.prepare(
      'INSERT INTO thread_messages (thread_id, user_id, content, attachments) VALUES (?, ?, ?, ?)'
    ).run(threadId, req.user.id, content || null, attachments ? JSON.stringify(attachments) : null)

    const message = db.prepare(`
      SELECT tm.*, u.username, u.display_name, u.avatar, u.status
      FROM thread_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.id = ?
    `).get(result.lastInsertRowid)

    if (message.attachments) {
      message.attachments = JSON.parse(message.attachments)
    }

    res.json(message)
  } catch (error) {
    console.error('Reply to thread error:', error)
    res.status(500).json({ error: 'Failed to reply to thread' })
  }
})

// Get thread info
router.get('/:threadId', (req, res) => {
  try {
    const { threadId } = req.params

    const thread = db.prepare(`
      SELECT mt.*, 
        m.content as parent_content,
        u.username as parent_author,
        (SELECT COUNT(*) FROM thread_messages WHERE thread_id = mt.id) as reply_count
      FROM message_threads mt
      JOIN messages m ON mt.parent_message_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE mt.id = ?
    `).get(threadId)

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    res.json(thread)
  } catch (error) {
    console.error('Get thread error:', error)
    res.status(500).json({ error: 'Failed to fetch thread' })
  }
})

export default router
