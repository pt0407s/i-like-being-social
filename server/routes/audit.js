import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// Log an audit entry
export function logAudit(serverId, userId, actionType, targetType, targetId, details) {
  try {
    db.prepare(
      'INSERT INTO audit_logs (server_id, user_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(serverId, userId, actionType, targetType, targetId, details ? JSON.stringify(details) : null)
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

// Get audit logs for a server
router.get('/servers/:serverId', (req, res) => {
  try {
    const { serverId } = req.params
    const { action, user, limit = 50 } = req.query

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    // Check if user has permission to view audit logs
    const member = db.prepare('SELECT * FROM server_members WHERE server_id = ? AND user_id = ?').get(serverId, req.user.id)
    if (!member && server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'No permission to view audit logs' })
    }

    let query = `
      SELECT al.*, u.username, u.display_name, u.avatar
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.server_id = ?
    `
    const params = [serverId]

    if (action) {
      query += ' AND al.action_type = ?'
      params.push(action)
    }

    if (user) {
      query += ' AND al.user_id = ?'
      params.push(user)
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const logs = db.prepare(query).all(...params)

    logs.forEach(log => {
      if (log.details) {
        log.details = JSON.parse(log.details)
      }
    })

    res.json(logs)
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

export default router
