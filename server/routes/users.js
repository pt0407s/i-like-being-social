import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/me', (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, display_name, bio, email, avatar, status, custom_status FROM users WHERE id = ?').get(req.user.id)
    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = db.prepare('SELECT id, username, display_name, bio, avatar, status, custom_status, created_at FROM users WHERE id = ?').get(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.put('/me', (req, res) => {
  try {
    const { username, display_name, bio, status, custom_status } = req.body
    
    if (username) {
      const existing = db.prepare('SELECT * FROM users WHERE username = ? AND id != ?').get(username, req.user.id)
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' })
      }
    }

    const updates = []
    const params = []

    if (username) {
      updates.push('username = ?')
      params.push(username)
    }
    if (display_name !== undefined) {
      updates.push('display_name = ?')
      params.push(display_name)
    }
    if (bio !== undefined) {
      updates.push('bio = ?')
      params.push(bio)
    }
    if (status) {
      updates.push('status = ?')
      params.push(status)
    }
    if (custom_status !== undefined) {
      updates.push('custom_status = ?')
      params.push(custom_status)
    }

    if (updates.length > 0) {
      params.push(req.user.id)
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }

    const user = db.prepare('SELECT id, username, display_name, bio, email, avatar, status, custom_status FROM users WHERE id = ?').get(req.user.id)
    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.get('/search', (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) {
      return res.json([])
    }

    const users = db.prepare(`
      SELECT id, username, avatar, status
      FROM users
      WHERE username LIKE ? AND id != ?
      LIMIT 10
    `).all(`%${q}%`, req.user.id)

    res.json(users)
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ error: 'Failed to search users' })
  }
})

router.get('/folders', (req, res) => {
  try {
    const folders = db.prepare(`
      SELECT f.*, 
             GROUP_CONCAT(sfi.server_id) as server_ids
      FROM server_folders f
      LEFT JOIN server_folder_items sfi ON f.id = sfi.folder_id
      WHERE f.user_id = ?
      GROUP BY f.id
      ORDER BY f.position
    `).all(req.user.id)

    const formatted = folders.map(f => ({
      ...f,
      server_ids: f.server_ids ? f.server_ids.split(',').map(Number) : []
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Get folders error:', error)
    res.status(500).json({ error: 'Failed to fetch folders' })
  }
})

router.post('/folders', (req, res) => {
  try {
    const { name, color } = req.body
    
    const maxPosition = db.prepare('SELECT MAX(position) as max FROM server_folders WHERE user_id = ?').get(req.user.id)
    const position = (maxPosition.max || 0) + 1

    const result = db.prepare('INSERT INTO server_folders (user_id, name, color, position) VALUES (?, ?, ?, ?)')
      .run(req.user.id, name, color, position)

    const folder = db.prepare('SELECT * FROM server_folders WHERE id = ?').get(result.lastInsertRowid)
    res.json({ ...folder, server_ids: [] })
  } catch (error) {
    console.error('Create folder error:', error)
    res.status(500).json({ error: 'Failed to create folder' })
  }
})

router.post('/folders/:folderId/servers/:serverId', (req, res) => {
  try {
    const { folderId, serverId } = req.params
    
    const folder = db.prepare('SELECT * FROM server_folders WHERE id = ? AND user_id = ?').get(folderId, req.user.id)
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    db.prepare('DELETE FROM server_folder_items WHERE server_id = ? AND folder_id IN (SELECT id FROM server_folders WHERE user_id = ?)')
      .run(serverId, req.user.id)

    const maxPosition = db.prepare('SELECT MAX(position) as max FROM server_folder_items WHERE folder_id = ?').get(folderId)
    const position = (maxPosition.max || 0) + 1

    db.prepare('INSERT INTO server_folder_items (folder_id, server_id, position) VALUES (?, ?, ?)')
      .run(folderId, serverId, position)

    res.json({ success: true })
  } catch (error) {
    console.error('Add server to folder error:', error)
    res.status(500).json({ error: 'Failed to add server to folder' })
  }
})

router.delete('/folders/:folderId', (req, res) => {
  try {
    const { folderId } = req.params
    
    const folder = db.prepare('SELECT * FROM server_folders WHERE id = ? AND user_id = ?').get(folderId, req.user.id)
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    db.prepare('DELETE FROM server_folders WHERE id = ?').run(folderId)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete folder error:', error)
    res.status(500).json({ error: 'Failed to delete folder' })
  }
})

export default router
