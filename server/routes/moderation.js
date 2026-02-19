import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/servers/:serverId/kick/:userId', (req, res) => {
  try {
    const { serverId, userId } = req.params
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can kick members' })
    }

    if (parseInt(userId) === server.owner_id) {
      return res.status(400).json({ error: 'Cannot kick server owner' })
    }

    db.prepare('DELETE FROM server_members WHERE server_id = ? AND user_id = ?').run(serverId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('Kick member error:', error)
    res.status(500).json({ error: 'Failed to kick member' })
  }
})

router.post('/servers/:serverId/ban/:userId', (req, res) => {
  try {
    const { serverId, userId } = req.params
    const { reason } = req.body
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can ban members' })
    }

    if (parseInt(userId) === server.owner_id) {
      return res.status(400).json({ error: 'Cannot ban server owner' })
    }

    db.prepare('DELETE FROM server_members WHERE server_id = ? AND user_id = ?').run(serverId, userId)

    db.prepare('INSERT OR REPLACE INTO server_bans (server_id, user_id, banned_by, reason) VALUES (?, ?, ?, ?)')
      .run(serverId, userId, req.user.id, reason || null)

    res.json({ success: true })
  } catch (error) {
    console.error('Ban member error:', error)
    res.status(500).json({ error: 'Failed to ban member' })
  }
})

router.delete('/servers/:serverId/ban/:userId', (req, res) => {
  try {
    const { serverId, userId } = req.params
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can unban members' })
    }

    db.prepare('DELETE FROM server_bans WHERE server_id = ? AND user_id = ?').run(serverId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('Unban member error:', error)
    res.status(500).json({ error: 'Failed to unban member' })
  }
})

router.get('/servers/:serverId/bans', (req, res) => {
  try {
    const { serverId } = req.params
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can view bans' })
    }

    const bans = db.prepare(`
      SELECT sb.*, u.username, u.avatar, bu.username as banned_by_username
      FROM server_bans sb
      JOIN users u ON sb.user_id = u.id
      JOIN users bu ON sb.banned_by = bu.id
      WHERE sb.server_id = ?
      ORDER BY sb.created_at DESC
    `).all(serverId)

    res.json(bans)
  } catch (error) {
    console.error('Get bans error:', error)
    res.status(500).json({ error: 'Failed to fetch bans' })
  }
})

router.put('/servers/:serverId/members/:userId/role', (req, res) => {
  try {
    const { serverId, userId } = req.params
    const { roleId } = req.body
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can assign roles' })
    }

    db.prepare('UPDATE server_members SET role_id = ? WHERE server_id = ? AND user_id = ?')
      .run(roleId || null, serverId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('Assign role error:', error)
    res.status(500).json({ error: 'Failed to assign role' })
  }
})

export default router
