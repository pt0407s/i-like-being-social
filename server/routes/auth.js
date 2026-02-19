import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../database/init.js'
import { generateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' })
    }

    if (email) {
      const existingEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = db.prepare('INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)').run(username, email || null, hashedPassword, username)

    const user = db.prepare('SELECT id, username, display_name, email, avatar, status FROM users WHERE id = ?').get(result.lastInsertRowid)
    const token = generateToken(user)

    res.json({ user, token })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    
    if (!user && username.includes('@')) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(username)
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const { password: _, ...userWithoutPassword } = user
    const token = generateToken(userWithoutPassword)

    res.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

export default router
