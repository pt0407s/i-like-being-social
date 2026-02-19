import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', (req, res) => {
  try {
    const friends = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.status, u.custom_status, f.status as friendship_status
      FROM friends f
      JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ? AND f.status = 'accepted'
    `).all(req.user.id, req.user.id, req.user.id)

    res.json(friends)
  } catch (error) {
    console.error('Get friends error:', error)
    res.status(500).json({ error: 'Failed to fetch friends' })
  }
})

router.get('/pending', (req, res) => {
  try {
    const pending = db.prepare(`
      SELECT u.id, u.username, u.avatar, f.user_id as requester_id, f.created_at
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `).all(req.user.id)

    res.json(pending)
  } catch (error) {
    console.error('Get pending requests error:', error)
    res.status(500).json({ error: 'Failed to fetch pending requests' })
  }
})

router.post('/request', (req, res) => {
  try {
    const { username } = req.body
    const friend = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!friend) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (friend.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself' })
    }

    const existing = db.prepare(`
      SELECT * FROM friends 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(req.user.id, friend.id, friend.id, req.user.id)

    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists' })
    }

    db.prepare('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)').run(req.user.id, friend.id, 'pending')

    res.json({ success: true })
  } catch (error) {
    console.error('Send friend request error:', error)
    res.status(500).json({ error: 'Failed to send friend request' })
  }
})

router.post('/accept/:userId', (req, res) => {
  try {
    const { userId } = req.params
    
    db.prepare('UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?')
      .run('accepted', userId, req.user.id)

    const dm = db.prepare(`
      SELECT * FROM direct_messages 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(req.user.id, userId, userId, req.user.id)

    if (!dm) {
      db.prepare('INSERT INTO direct_messages (user1_id, user2_id) VALUES (?, ?)').run(req.user.id, userId)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Accept friend error:', error)
    res.status(500).json({ error: 'Failed to accept friend request' })
  }
})

router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params
    
    db.prepare('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)')
      .run(req.user.id, userId, userId, req.user.id)

    res.json({ success: true })
  } catch (error) {
    console.error('Remove friend error:', error)
    res.status(500).json({ error: 'Failed to remove friend' })
  }
})

router.get('/dms', (req, res) => {
  try {
    const dms = db.prepare(`
      SELECT dm.id, dm.created_at,
             u.id as user_id, u.username, u.avatar, u.status,
             (SELECT content FROM messages WHERE dm_id = dm.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE dm_id = dm.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM direct_messages dm
      JOIN users u ON (dm.user1_id = u.id OR dm.user2_id = u.id)
      WHERE (dm.user1_id = ? OR dm.user2_id = ?) AND u.id != ?
      ORDER BY last_message_time DESC
    `).all(req.user.id, req.user.id, req.user.id)

    res.json(dms)
  } catch (error) {
    console.error('Get DMs error:', error)
    res.status(500).json({ error: 'Failed to fetch DMs' })
  }
})

export default router
