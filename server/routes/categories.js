import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'
import { logAudit } from './audit.js'

const router = express.Router()

router.use(authenticateToken)

// Create category
router.post('/servers/:serverId', (req, res) => {
  try {
    const { serverId } = req.params
    const { name, position } = req.body

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId)
    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can create categories' })
    }

    const result = db.prepare(
      'INSERT INTO categories (server_id, name, position) VALUES (?, ?, ?)'
    ).run(serverId, name, position || 0)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)

    logAudit(serverId, req.user.id, 'CATEGORY_CREATE', 'category', category.id, { name })

    res.json(category)
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Get server categories
router.get('/servers/:serverId', (req, res) => {
  try {
    const { serverId } = req.params

    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM channels WHERE category_id = c.id) as channel_count
      FROM categories c
      WHERE c.server_id = ?
      ORDER BY c.position ASC
    `).all(serverId)

    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Update category
router.put('/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params
    const { name, position } = req.body

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(category.server_id)
    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can update categories' })
    }

    const updates = []
    const params = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (position !== undefined) {
      updates.push('position = ?')
      params.push(position)
    }

    if (updates.length > 0) {
      params.push(categoryId)
      db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId)

    logAudit(category.server_id, req.user.id, 'CATEGORY_UPDATE', 'category', categoryId, { name, position })

    res.json(updated)
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// Delete category
router.delete('/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(category.server_id)
    if (server.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can delete categories' })
    }

    // Move channels out of category
    db.prepare('UPDATE channels SET category_id = NULL WHERE category_id = ?').run(categoryId)

    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId)

    logAudit(category.server_id, req.user.id, 'CATEGORY_DELETE', 'category', categoryId, { name: category.name })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router
