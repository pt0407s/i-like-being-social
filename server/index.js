import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import serverRoutes from './routes/servers.js'
import messageRoutes from './routes/messages.js'
import friendRoutes from './routes/friends.js'
import userRoutes from './routes/users.js'
import moderationRoutes from './routes/moderation.js'
import { initDatabase } from './database/init.js'
import { setupSocketHandlers } from './socket/handlers.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://pt0407s.github.io',
  process.env.CLIENT_URL
].filter(Boolean)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

initDatabase()

app.use('/api/auth', authRoutes)
app.use('/api/servers', serverRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/users', userRoutes)
app.use('/api/moderation', moderationRoutes)

setupSocketHandlers(io)

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
