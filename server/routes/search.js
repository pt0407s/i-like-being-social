import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// Search messages
router.get('/messages', (req, res) => {
  try {
    const { q, channelId, serverId, userId, limit = 50, offset = 0 } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    let query = `
      SELECT m.*, u.username, u.display_name, u.avatar,
        c.name as channel_name, c.id as channel_id,
        s.name as server_name, s.id as server_id
      FROM messages m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN channels c ON m.channel_id = c.id
      LEFT JOIN servers s ON c.server_id = s.id
      WHERE m.content LIKE ?
    `
    const params = [`%${q}%`]

    // Filter by channel
    if (channelId) {
      query += ' AND m.channel_id = ?'
      params.push(channelId)
    }

    // Filter by server
    if (serverId) {
      query += ' AND s.id = ?'
      params.push(serverId)
    }

    // Filter by user
    if (userId) {
      query += ' AND m.user_id = ?'
      params.push(userId)
    }

    // Only show messages from servers user is in
    query += ` AND (
      m.channel_id IN (
        SELECT c.id FROM channels c
        JOIN server_members sm ON c.server_id = sm.server_id
        WHERE sm.user_id = ?
      )
      OR m.user_id = ?
    )`
    params.push(req.user.id, req.user.id)

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const results = db.prepare(query).all(...params)

    results.forEach(result => {
      if (result.attachments) {
        result.attachments = JSON.parse(result.attachments)
      }
    })

    res.json({
      results,
      query: q,
      total: results.length,
      hasMore: results.length === parseInt(limit)
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Search users
router.get('/users', (req, res) => {
  try {
    const { q, limit = 20 } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    const users = db.prepare(`
      SELECT id, username, display_name, avatar, status, custom_status
      FROM users
      WHERE username LIKE ? OR display_name LIKE ?
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, parseInt(limit))

    res.json(users)
  } catch (error) {
    console.error('User search error:', error)
    res.status(500).json({ error: 'User search failed' })
  }
})

// Search servers
router.get('/servers', (req, res) => {
  try {
    const { q, limit = 20 } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    const servers = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM server_members WHERE server_id = s.id) as member_count
      FROM servers s
      WHERE (s.name LIKE ? OR s.description LIKE ?)
        AND s.is_public = 1
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, parseInt(limit))

    res.json(servers)
  } catch (error) {
    console.error('Server search error:', error)
    res.status(500).json({ error: 'Server search failed' })
  }
})

export default router
