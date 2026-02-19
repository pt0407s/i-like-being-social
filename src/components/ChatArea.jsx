import { useState, useEffect, useRef } from 'react'
import { Hash, Send, Smile, Plus } from 'lucide-react'
import gun from '../gundb'
import Message from './Message'

function ChatArea({ channel, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const messagesRef = useRef({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessages([])
    messagesRef.current = {}

    const channelMessages = gun.get(`channel-${channel.id}`)
    
    channelMessages.map().on((data, id) => {
      if (data && !messagesRef.current[id]) {
        messagesRef.current[id] = true
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === id)
          if (exists) return prev
          
          const newMsg = { ...data, id }
          return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp)
        })
      }
    })

    return () => {
      channelMessages.off()
    }
  }, [channel.id])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      text: newMessage.trim(),
      username: user.username,
      color: user.color,
      userId: user.id,
      timestamp: Date.now()
    }

    const channelMessages = gun.get(`channel-${channel.id}`)
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    channelMessages.get(messageId).put(message)

    setNewMessage('')
  }

  return (
    <div className="flex-1 flex flex-col bg-discord-darkest">
      <div className="h-12 px-4 flex items-center shadow-md border-b border-discord-darker">
        <Hash className="w-6 h-6 text-discord-lightgray mr-2" />
        <h3 className="text-white font-semibold">{channel.name}</h3>
        <div className="ml-4 text-discord-lightgray text-sm">
          {channel.icon} Welcome to #{channel.name}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4">
          <div className="w-16 h-16 bg-discord-darker rounded-full flex items-center justify-center mb-2">
            <Hash className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-3xl font-bold mb-2">
            Welcome to #{channel.name}!
          </h2>
          <p className="text-discord-lightgray">
            This is the start of the #{channel.name} channel.
          </p>
        </div>

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-6">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="w-full bg-discord-gray text-white px-4 py-3 rounded-lg focus:outline-none pr-12"
            maxLength={500}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-lightgray hover:text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatArea
