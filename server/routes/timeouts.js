import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'
import { logAudit } from './audit.js'

const router = express.Router()

router.use(authenticateToken)

// Timeout/mute a member
router.post('/servers/:serverId/members/:userId', (req, res) => {
  try {
    const { serverId, userId } = req.params
    const { duration, reason } = req.body // duration in minutes

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    // Check if user has mod permissions
    const member = db.prepare(`
      SELECT sm.*, r.permissions
      FROM server_members sm
      LEFT JOIN roles r ON sm.role_id = r.id
      WHERE sm.server_id = ? AND sm.user_id = ?
    `).get(serverId, req.user.id)

    if (!member || (member.permissions !== 'mod' && member.permissions !== 'owner' && server.owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'No permission to timeout members' })
    }

    if (parseInt(userId) === server.owner_id) {
      return res.status(400).json({ error: 'Cannot timeout server owner' })
    }

    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString()

    // Remove existing timeout if any
    db.prepare('DELETE FROM timeouts WHERE server_id = ? AND user_id = ?').run(serverId, userId)

    db.prepare(
      'INSERT INTO timeouts (server_id, user_id, moderator_id, reason, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(serverId, userId, req.user.id, reason || null, expiresAt)

    logAudit(serverId, req.user.id, 'MEMBER_TIMEOUT', 'user', userId, { duration, reason })

    res.json({ success: true, expires_at: expiresAt })
  } catch (error) {
    console.error('Timeout member error:', error)
    res.status(500).json({ error: 'Failed to timeout member' })
  }
})

// Remove timeout
router.delete('/servers/:serverId/members/:userId', (req, res) => {
  try {
    const { serverId, userId } = req.params

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    // Check if user has mod permissions
    const member = db.prepare(`
      SELECT sm.*, r.permissions
      FROM server_members sm
      LEFT JOIN roles r ON sm.role_id = r.id
      WHERE sm.server_id = ? AND sm.user_id = ?
    `).get(serverId, req.user.id)

    if (!member || (member.permissions !== 'mod' && member.permissions !== 'owner' && server.owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'No permission to remove timeouts' })
    }

    db.prepare('DELETE FROM timeouts WHERE server_id = ? AND user_id = ?').run(serverId, userId)

    logAudit(serverId, req.user.id, 'MEMBER_TIMEOUT_REMOVE', 'user', userId, {})

    res.json({ success: true })
  } catch (error) {
    console.error('Remove timeout error:', error)
    res.status(500).json({ error: 'Failed to remove timeout' })
  }
})

// Get active timeouts for server
router.get('/servers/:serverId', (req, res) => {
  try {
    const { serverId } = req.params

    const timeouts = db.prepare(`
      SELECT t.*, u.username, u.display_name, m.username as moderator_username
      FROM timeouts t
      JOIN users u ON t.user_id = u.id
      JOIN users m ON t.moderator_id = m.id
      WHERE t.server_id = ? AND t.expires_at > datetime('now')
      ORDER BY t.created_at DESC
    `).all(serverId)

    res.json(timeouts)
  } catch (error) {
    console.error('Get timeouts error:', error)
    res.status(500).json({ error: 'Failed to fetch timeouts' })
  }
})

// Check if user is timed out
router.get('/servers/:serverId/members/:userId/check', (req, res) => {
  try {
    const { serverId, userId } = req.params

    const timeout = db.prepare(`
      SELECT * FROM timeouts
      WHERE server_id = ? AND user_id = ? AND expires_at > datetime('now')
    `).get(serverId, userId)

    res.json({ timed_out: !!timeout, timeout })
  } catch (error) {
    console.error('Check timeout error:', error)
    res.status(500).json({ error: 'Failed to check timeout' })
  }
})

export default router
