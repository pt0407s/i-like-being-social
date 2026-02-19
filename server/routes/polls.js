import express from 'express'
import db from '../database/init.js'
import { authenticateToken } from '../middleware/auth.js'
import { logAudit } from './audit.js'

const router = express.Router()

router.use(authenticateToken)

// Create poll
router.post('/channels/:channelId', (req, res) => {
  try {
    const { channelId } = req.params
    const { question, options, duration, multipleChoice } = req.body

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ error: 'Poll must have a question and at least 2 options' })
    }

    if (options.length > 10) {
      return res.status(400).json({ error: 'Poll cannot have more than 10 options' })
    }

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId)
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null

    const result = db.prepare(`
      INSERT INTO polls (channel_id, created_by, question, options, expires_at, multiple_choice)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(channelId, req.user.id, question, JSON.stringify(options), expiresAt, multipleChoice ? 1 : 0)

    const poll = db.prepare(`
      SELECT p.*, u.username, u.display_name
      FROM polls p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid)

    poll.options = JSON.parse(poll.options)

    logAudit(channel.server_id, req.user.id, 'POLL_CREATE', 'poll', poll.id, { question })

    res.json(poll)
  } catch (error) {
    console.error('Create poll error:', error)
    res.status(500).json({ error: 'Failed to create poll' })
  }
})

// Vote on poll
router.post('/:pollId/vote', (req, res) => {
  try {
    const { pollId } = req.params
    const { optionIndex } = req.body

    const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    // Check if poll expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Poll has expired' })
    }

    const options = JSON.parse(poll.options)
    if (optionIndex < 0 || optionIndex >= options.length) {
      return res.status(400).json({ error: 'Invalid option index' })
    }

    // Check if user already voted
    const existingVote = db.prepare('SELECT * FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(pollId, req.user.id)

    if (existingVote && !poll.multiple_choice) {
      // Update vote
      db.prepare('UPDATE poll_votes SET option_index = ? WHERE poll_id = ? AND user_id = ?')
        .run(optionIndex, pollId, req.user.id)
    } else {
      // New vote
      db.prepare('INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)')
        .run(pollId, req.user.id, optionIndex)
    }

    // Get vote counts
    const votes = db.prepare(`
      SELECT option_index, COUNT(*) as count
      FROM poll_votes
      WHERE poll_id = ?
      GROUP BY option_index
    `).all(pollId)

    const voteCounts = new Array(options.length).fill(0)
    votes.forEach(v => {
      voteCounts[v.option_index] = v.count
    })

    res.json({ success: true, voteCounts })
  } catch (error) {
    console.error('Vote error:', error)
    res.status(500).json({ error: 'Failed to vote' })
  }
})

// Get poll results
router.get('/:pollId', (req, res) => {
  try {
    const { pollId } = req.params

    const poll = db.prepare(`
      SELECT p.*, u.username, u.display_name
      FROM polls p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(pollId)

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    poll.options = JSON.parse(poll.options)

    // Get vote counts
    const votes = db.prepare(`
      SELECT option_index, COUNT(*) as count
      FROM poll_votes
      WHERE poll_id = ?
      GROUP BY option_index
    `).all(pollId)

    const voteCounts = new Array(poll.options.length).fill(0)
    votes.forEach(v => {
      voteCounts[v.option_index] = v.count
    })

    poll.voteCounts = voteCounts
    poll.totalVotes = voteCounts.reduce((a, b) => a + b, 0)

    // Check if current user voted
    const userVote = db.prepare('SELECT option_index FROM poll_votes WHERE poll_id = ? AND user_id = ?')
      .get(pollId, req.user.id)
    poll.userVote = userVote ? userVote.option_index : null

    res.json(poll)
  } catch (error) {
    console.error('Get poll error:', error)
    res.status(500).json({ error: 'Failed to fetch poll' })
  }
})

// Get channel polls
router.get('/channels/:channelId/list', (req, res) => {
  try {
    const { channelId } = req.params
    const { limit = 20 } = req.query

    const polls = db.prepare(`
      SELECT p.*, u.username, u.display_name,
        (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) as total_votes
      FROM polls p
      JOIN users u ON p.created_by = u.id
      WHERE p.channel_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(channelId, parseInt(limit))

    polls.forEach(poll => {
      poll.options = JSON.parse(poll.options)
    })

    res.json(polls)
  } catch (error) {
    console.error('Get polls error:', error)
    res.status(500).json({ error: 'Failed to fetch polls' })
  }
})

export default router
