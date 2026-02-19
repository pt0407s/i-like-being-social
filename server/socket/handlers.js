import db from '../database/init.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

const userSockets = new Map()
const typingTimeouts = new Map()

export function setupSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Authentication error'))
      }
      socket.user = user
      next()
    })
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`)
    
    userSockets.set(socket.user.id, socket.id)
    
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('online', socket.user.id)
    
    io.emit('user:status', { userId: socket.user.id, status: 'online' })

    socket.on('message:send', async (data) => {
      try {
        const { content, channelId, dmId, attachments } = data
        
        const result = db.prepare(
          'INSERT INTO messages (content, user_id, channel_id, dm_id, attachments) VALUES (?, ?, ?, ?, ?)'
        ).run(content, socket.user.id, channelId || null, dmId || null, attachments ? JSON.stringify(attachments) : null)

        const message = db.prepare(`
          SELECT m.*, u.username, u.avatar, u.status
          FROM messages m
          JOIN users u ON m.user_id = u.id
          WHERE m.id = ?
        `).get(result.lastInsertRowid)

        if (channelId) {
          io.to(`channel:${channelId}`).emit('message:new', message)
        } else if (dmId) {
          const dm = db.prepare('SELECT * FROM direct_messages WHERE id = ?').get(dmId)
          const recipientId = dm.user1_id === socket.user.id ? dm.user2_id : dm.user1_id
          const recipientSocketId = userSockets.get(recipientId)
          
          socket.emit('message:new', message)
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message:new', message)
          }
        }
      } catch (error) {
        console.error('Send message error:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data
        const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)

        if (!message || message.user_id !== socket.user.id) {
          return socket.emit('error', { message: 'Cannot delete message' })
        }

        db.prepare('DELETE FROM messages WHERE id = ?').run(messageId)

        if (message.channel_id) {
          io.to(`channel:${message.channel_id}`).emit('message:deleted', { messageId })
        } else if (message.dm_id) {
          const dm = db.prepare('SELECT * FROM direct_messages WHERE id = ?').get(message.dm_id)
          const recipientId = dm.user1_id === socket.user.id ? dm.user2_id : dm.user1_id
          const recipientSocketId = userSockets.get(recipientId)
          
          socket.emit('message:deleted', { messageId })
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message:deleted', { messageId })
          }
        }
      } catch (error) {
        console.error('Delete message error:', error)
        socket.emit('error', { message: 'Failed to delete message' })
      }
    })

    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data
        const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)

        if (!message || message.user_id !== socket.user.id) {
          return socket.emit('error', { message: 'Cannot edit message' })
        }

        db.prepare('UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?').run(content, messageId)

        const updated = db.prepare(`
          SELECT m.*, u.username, u.avatar, u.status
          FROM messages m
          JOIN users u ON m.user_id = u.id
          WHERE m.id = ?
        `).get(messageId)

        if (message.channel_id) {
          io.to(`channel:${message.channel_id}`).emit('message:edited', updated)
        } else if (message.dm_id) {
          const dm = db.prepare('SELECT * FROM direct_messages WHERE id = ?').get(message.dm_id)
          const recipientId = dm.user1_id === socket.user.id ? dm.user2_id : dm.user1_id
          const recipientSocketId = userSockets.get(recipientId)
          
          socket.emit('message:edited', updated)
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message:edited', updated)
          }
        }
      } catch (error) {
        console.error('Edit message error:', error)
        socket.emit('error', { message: 'Failed to edit message' })
      }
    })

    socket.on('typing:start', (data) => {
      const { channelId, dmId } = data
      const key = `${socket.user.id}-${channelId || dmId}`

      if (typingTimeouts.has(key)) {
        clearTimeout(typingTimeouts.get(key))
      }

      if (channelId) {
        socket.to(`channel:${channelId}`).emit('typing:start', {
          userId: socket.user.id,
          username: socket.user.username,
          channelId
        })
      } else if (dmId) {
        const dm = db.prepare('SELECT * FROM direct_messages WHERE id = ?').get(dmId)
        const recipientId = dm.user1_id === socket.user.id ? dm.user2_id : dm.user1_id
        const recipientSocketId = userSockets.get(recipientId)
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('typing:start', {
            userId: socket.user.id,
            username: socket.user.username,
            dmId
          })
        }
      }

      const timeout = setTimeout(() => {
        if (channelId) {
          socket.to(`channel:${channelId}`).emit('typing:stop', {
            userId: socket.user.id,
            channelId
          })
        } else if (dmId) {
          const dm = db.prepare('SELECT * FROM direct_messages WHERE id = ?').get(dmId)
          const recipientId = dm.user1_id === socket.user.id ? dm.user2_id : dm.user1_id
          const recipientSocketId = userSockets.get(recipientId)
          
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing:stop', {
              userId: socket.user.id,
              dmId
            })
          }
        }
        typingTimeouts.delete(key)
      }, 3000)

      typingTimeouts.set(key, timeout)
    })

    socket.on('typing:stop', (data) => {
      const { channelId, dmId } = data
      const key = `${socket.user.id}-${channelId || dmId}`

      if (typingTimeouts.has(key)) {
        clearTimeout(typingTimeouts.get(key))
        typingTimeouts.delete(key)
      }

      if (channelId) {
        socket.to(`channel:${channelId}`).emit('typing:stop', {
          userId: socket.user.id,
          channelId
        })
      } else if (dmId) {
        const dm = db.prepare('SELECT * FROM direct_messages WHERE id = ?').get(dmId)
        const recipientId = dm.user1_id === socket.user.id ? dm.user2_id : dm.user1_id
        const recipientSocketId = userSockets.get(recipientId)
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('typing:stop', {
            userId: socket.user.id,
            dmId
          })
        }
      }
    })

    socket.on('channel:join', (channelId) => {
      socket.join(`channel:${channelId}`)
    })

    socket.on('channel:leave', (channelId) => {
      socket.leave(`channel:${channelId}`)
    })

    socket.on('user:status', (status) => {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, socket.user.id)
      io.emit('user:status', { userId: socket.user.id, status })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`)
      userSockets.delete(socket.user.id)
      
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run('offline', socket.user.id)
      io.emit('user:status', { userId: socket.user.id, status: 'offline' })
    })
  })
}
