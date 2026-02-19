import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://i-like-being-social.onrender.com'

class SocketManager {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(SOCKET_URL, {
      auth: { token }
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event, callback) {
    if (!this.socket) return

    this.socket.on(event, callback)
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.socket) return

    this.socket.off(event, callback)
    
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (!this.socket) return
    this.socket.emit(event, data)
  }

  sendMessage(content, channelId, dmId, attachments) {
    this.emit('message:send', { content, channelId, dmId, attachments })
  }

  deleteMessage(messageId) {
    this.emit('message:delete', { messageId })
  }

  editMessage(messageId, content) {
    this.emit('message:edit', { messageId, content })
  }

  startTyping(channelId, dmId) {
    this.emit('typing:start', { channelId, dmId })
  }

  stopTyping(channelId, dmId) {
    this.emit('typing:stop', { channelId, dmId })
  }

  joinChannel(channelId) {
    this.emit('channel:join', channelId)
  }

  leaveChannel(channelId) {
    this.emit('channel:leave', channelId)
  }

  updateStatus(status) {
    this.emit('user:status', status)
  }
}

export default new SocketManager()
