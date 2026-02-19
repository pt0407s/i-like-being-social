import express from 'express'
import { nanoid } from 'nanoid'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/', (req, res) => {
  try {
    const { name, isPublic } = req.body
    const inviteCode = nanoid(10)

    const result = db.prepare(
      'INSERT INTO servers (name, owner_id, is_public, invite_code) VALUES (?, ?, ?, ?)'
    ).run(name, req.user.id, isPublic ? 1 : 0, inviteCode)

    const serverId = result.lastInsertRowid

    db.prepare('INSERT INTO server_members (server_id, user_id) VALUES (?, ?)').run(serverId, req.user.id)

    const ownerRole = db.prepare(
      'INSERT INTO roles (server_id, name, color, permissions, position) VALUES (?, ?, ?, ?, ?)'
    ).run(serverId, 'Owner', '#ff0000', 2147483647, 100)

    db.prepare('UPDATE server_members SET role_id = ? WHERE server_id = ? AND user_id = ?')
      .run(ownerRole.lastInsertRowid, serverId, req.user.id)

    db.prepare('INSERT INTO channels (server_id, name, position) VALUES (?, ?, ?)').run(serverId, 'general', 0)
    db.prepare('INSERT INTO channels (server_id, name, position) VALUES (?, ?, ?)').run(serverId, 'random', 1)

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    res.json(server)
  } catch (error) {
    console.error('Create server error:', error)
    res.status(500).json({ error: 'Failed to create server' })
  }
})

router.get('/', (req, res) => {
  try {
    const servers = db.prepare(`
      SELECT s.*, sm.role_id 
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = ?
      ORDER BY sm.joined_at
    `).all(req.user.id)

    res.json(servers)
  } catch (error) {
    console.error('Get servers error:', error)
    res.status(500).json({ error: 'Failed to fetch servers' })
  }
})

router.get('/public', (req, res) => {
  try {
    const servers = db.prepare(`
      SELECT s.*, COUNT(sm.id) as member_count
      FROM servers s
      LEFT JOIN server_members sm ON s.id = sm.server_id
      WHERE s.is_public = 1
      GROUP BY s.id
      ORDER BY member_count DESC
      LIMIT 50
    `).all()

    res.json(servers)
  } catch (error) {
    console.error('Get public servers error:', error)
    res.status(500).json({ error: 'Failed to fetch public servers' })
  }
})

router.post('/join/:inviteCode', (req, res) => {
  try {
    const { inviteCode } = req.params
    const server = db.prepare('SELECT * FROM servers WHERE invite_code = ?').get(inviteCode)

    if (!server) {
      return res.status(404).json({ error: 'Invalid invite code' })
    }

    const existing = db.prepare('SELECT * FROM server_members WHERE server_id = ? AND user_id = ?')
      .get(server.id, req.user.id)

    if (existing) {
      return res.status(400).json({ error: 'Already a member' })
    }

    db.prepare('INSERT INTO server_members (server_id, user_id) VALUES (?, ?)').run(server.id, req.user.id)

    res.json(server)
  } catch (error) {
    console.error('Join server error:', error)
    res.status(500).json({ error: 'Failed to join server' })
  }
})

router.get('/:serverId/channels', (req, res) => {
  try {
    const channels = db.prepare('SELECT * FROM channels WHERE server_id = ? ORDER BY position').all(req.params.serverId)
    res.json(channels)
  } catch (error) {
    console.error('Get channels error:', error)
    res.status(500).json({ error: 'Failed to fetch channels' })
  }
})

router.post('/:serverId/channels', (req, res) => {
  try {
    const { name, type } = req.body
    const { serverId } = req.params

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can create channels' })
    }

    const maxPosition = db.prepare('SELECT MAX(position) as max FROM channels WHERE server_id = ?').get(serverId)
    const position = (maxPosition.max || 0) + 1

    const result = db.prepare('INSERT INTO channels (server_id, name, type, position) VALUES (?, ?, ?, ?)')
      .run(serverId, name, type || 'text', position)

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(result.lastInsertRowid)
    res.json(channel)
  } catch (error) {
    console.error('Create channel error:', error)
    res.status(500).json({ error: 'Failed to create channel' })
  }
})

router.get('/:serverId/members', (req, res) => {
  try {
    const members = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.status, sm.role_id, r.name as role_name, r.color as role_color
      FROM server_members sm
      JOIN users u ON sm.user_id = u.id
      LEFT JOIN roles r ON sm.role_id = r.id
      WHERE sm.server_id = ?
      ORDER BY r.position DESC, u.username
    `).all(req.params.serverId)

    res.json(members)
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

router.get('/:serverId/roles', (req, res) => {
  try {
    const roles = db.prepare('SELECT * FROM roles WHERE server_id = ? ORDER BY position DESC').all(req.params.serverId)
    res.json(roles)
  } catch (error) {
    console.error('Get roles error:', error)
    res.status(500).json({ error: 'Failed to fetch roles' })
  }
})

router.post('/:serverId/roles', (req, res) => {
  try {
    const { serverId } = req.params
    const { name, color, permissions, position } = req.body

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can create roles' })
    }

    const result = db.prepare('INSERT INTO roles (server_id, name, color, permissions, position) VALUES (?, ?, ?, ?, ?)').run(
      serverId,
      name,
      color || '#99AAB5',
      permissions || 'cosmetic',
      position || 0
    )

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid)
    res.json(role)
  } catch (error) {
    console.error('Create role error:', error)
    res.status(500).json({ error: 'Failed to create role' })
  }
})

router.delete('/:serverId', (req, res) => {
  try {
    const { serverId } = req.params
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can delete server' })
    }

    db.prepare('DELETE FROM servers WHERE id = ?').run(serverId)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete server error:', error)
    res.status(500).json({ error: 'Failed to delete server' })
  }
})

router.post('/:serverId/regenerate-invite', (req, res) => {
  try {
    const { serverId } = req.params
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can regenerate invite' })
    }

    const newInviteCode = nanoid(10)
    db.prepare('UPDATE servers SET invite_code = ? WHERE id = ?').run(newInviteCode, serverId)

    res.json({ inviteCode: newInviteCode })
  } catch (error) {
    console.error('Regenerate invite error:', error)
    res.status(500).json({ error: 'Failed to regenerate invite' })
  }
})

export default router
