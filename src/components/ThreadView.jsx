import { useState, useEffect, useRef } from 'react'
import { X, Send, ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import MessageRenderer from './MessageRenderer'

function ThreadView({ thread, parentMessage, onClose, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadMessages()
  }, [thread.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const data = await api.getThreadMessages(thread.id, 50)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load thread messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    setLoading(true)
    try {
      const message = await api.replyToThread(thread.id, newMessage)
      setMessages([...messages, message])
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col border border-dark-800 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-white font-semibold">Thread</h3>
              <p className="text-dark-400 text-sm">{messages.length} replies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Message */}
        <div className="p-4 bg-dark-800/50 border-b border-dark-800">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {parentMessage.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-white font-semibold">{parentMessage.display_name || parentMessage.username}</span>
                <span className="text-dark-400 text-xs">{formatTime(parentMessage.created_at)}</span>
              </div>
              <MessageRenderer content={parentMessage.content} isMarkdown={parentMessage.is_markdown} />
            </div>
          </div>
        </div>

        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.user_id === user.id

            return (
              <div key={message.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {message.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-white text-sm font-semibold">{message.display_name || message.username}</span>
                    <span className="text-dark-400 text-xs">{formatTime(message.created_at)}</span>
                  </div>
                  <div className="text-dark-200 text-sm">
                    <MessageRenderer content={message.content} isMarkdown={message.is_markdown} />
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-dark-800">
          <div className="flex items-center gap-2 bg-dark-800 rounded-xl px-4 py-3 border border-dark-700 focus-within:border-primary-500 transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Reply to thread..."
              className="flex-1 bg-transparent text-white outline-none placeholder:text-dark-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ThreadView
