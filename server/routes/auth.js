import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../database/init.js'
import { generateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword)

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(result.lastInsertRowid)
    const token = generateToken({ id: user.id, username: user.username })

    res.json({ user: { id: user.id, username: user.username }, token })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken({ id: user.id, username: user.username })
    res.json({ token, user: { id: user.id, username: user.username } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

export default router
