import { useState, useEffect, useRef } from 'react'
import { Hash, Send, Smile, Image as ImageIcon, Trash2, Edit2, X } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

function ChatView({ currentView, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (currentView.channel) {
      loadMessages()
      socket.joinChannel(currentView.channel.id)
      
      return () => {
        socket.leaveChannel(currentView.channel.id)
      }
    } else if (currentView.dm) {
      loadDMMessages()
    }
  }, [currentView])

  useEffect(() => {
    socket.on('message:new', handleNewMessage)
    socket.on('message:deleted', handleMessageDeleted)
    socket.on('message:edited', handleMessageEdited)
    socket.on('typing:start', handleTypingStart)
    socket.on('typing:stop', handleTypingStop)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('message:deleted', handleMessageDeleted)
      socket.off('message:edited', handleMessageEdited)
      socket.off('typing:start', handleTypingStart)
      socket.off('typing:stop', handleTypingStop)
    }
  }, [currentView])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const data = await api.getChannelMessages(currentView.channel.id)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const loadDMMessages = async () => {
    try {
      const data = await api.getDMMessages(currentView.dm.id)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load DM messages:', error)
    }
  }

  const handleNewMessage = (message) => {
    const channelMatch = currentView.channel && message.channel_id === currentView.channel.id
    const dmMatch = currentView.dm && message.dm_id === currentView.dm.id
    
    if (channelMatch || dmMatch) {
      setMessages(prev => [...prev, message])
    }
  }

  const handleMessageDeleted = ({ messageId }) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  const handleMessageEdited = (message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? message : m))
  }

  const handleTypingStart = ({ userId, username, channelId, dmId }) => {
    const channelMatch = currentView.channel && channelId === currentView.channel.id
    const dmMatch = currentView.dm && dmId === currentView.dm.id
    
    if ((channelMatch || dmMatch) && userId !== user.id) {
      setTyping(prev => [...prev.filter(t => t.userId !== userId), { userId, username }])
    }
  }

  const handleTypingStop = ({ userId, channelId, dmId }) => {
    const channelMatch = currentView.channel && channelId === currentView.channel.id
    const dmMatch = currentView.dm && dmId === currentView.dm.id
    
    if (channelMatch || dmMatch) {
      setTyping(prev => prev.filter(t => t.userId !== userId))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !imageFile && !editingMessage) return

    if (editingMessage) {
      socket.editMessage(editingMessage.id, newMessage)
      setEditingMessage(null)
    } else {
      if (imageFile) {
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(imageFile)
        })
        const base64 = await base64Promise
        socket.sendMessage(
          newMessage.trim(),
          currentView.channel?.id,
          currentView.dm?.id,
          [{ type: 'image', data: base64, name: imageFile.name }]
        )
      } else {
        socket.sendMessage(
          newMessage.trim(),
          currentView.channel?.id,
          currentView.dm?.id
        )
      }
    }

    setNewMessage('')
    setImageFile(null)
    setImagePreview(null)
    socket.stopTyping(currentView.channel?.id, currentView.dm?.id)
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    socket.startTyping(currentView.channel?.id, currentView.dm?.id)

    typingTimeoutRef.current = setTimeout(() => {
      socket.stopTyping(currentView.channel?.id, currentView.dm?.id)
    }, 3000)
  }

  const handleDeleteMessage = (messageId) => {
    socket.deleteMessage(messageId)
  }

  const handleEditMessage = (message) => {
    setEditingMessage(message)
    setNewMessage(message.content)
  }

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji.native)
    setShowEmojiPicker(false)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const channelName = currentView.channel?.name || currentView.dm?.username || 'Chat'

  return (
    <div className="flex-1 flex flex-col bg-discord-darkest">
      <div className="h-12 px-4 flex items-center shadow-md border-b border-discord-darker">
        <Hash className="w-6 h-6 text-discord-lightgray mr-2" />
        <h3 className="text-white font-semibold">{channelName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => {
          const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id
          const isOwn = message.user_id === user.id

          return (
            <div
              key={message.id}
              className={`flex items-start py-1 px-4 hover:bg-discord-darker/30 group ${showAvatar ? 'mt-4' : ''}`}
            >
              {showAvatar ? (
                <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {message.username.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-10 flex-shrink-0 text-xs text-discord-lightgray opacity-0 group-hover:opacity-100 text-right pr-2">
                  {formatTime(message.created_at)}
                </div>
              )}
              <div className="ml-4 flex-1 min-w-0">
                {showAvatar && (
                  <div className="flex items-baseline">
                    <span className="text-white font-semibold hover:underline cursor-pointer">
                      {message.username}
                    </span>
                    <span className="text-discord-lightgray text-xs ml-2">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                )}
                <div className="text-discord-lightgray break-words">
                  {message.content}
                  {message.edited_at && (
                    <span className="text-xs text-discord-lightgray ml-1">(edited)</span>
                  )}
                </div>
                {message.attachments && message.attachments.map((att, idx) => (
                  att.type === 'image' && (
                    <img
                      key={idx}
                      src={att.data}
                      alt={att.name}
                      className="mt-2 max-w-md rounded cursor-pointer hover:opacity-90"
                      onClick={() => window.open(att.data, '_blank')}
                    />
                  )
                ))}
              </div>
              {isOwn && (
                <div className="opacity-0 group-hover:opacity-100 flex gap-2 ml-2">
                  <button
                    onClick={() => handleEditMessage(message)}
                    className="text-discord-lightgray hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-discord-lightgray hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        
        {typing.length > 0 && (
          <div className="text-discord-lightgray text-sm px-4 py-2">
            {typing.map(t => t.username).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-6">
        {editingMessage && (
          <div className="bg-discord-darker px-4 py-2 rounded-t flex items-center justify-between">
            <span className="text-discord-lightgray text-sm">Editing message</span>
            <button
              onClick={() => {
                setEditingMessage(null)
                setNewMessage('')
              }}
              className="text-discord-lightgray hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="relative">
          <div className="p-4 border-t border-discord-darkest">
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="dark" />
            </div>
          )}

          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-w-xs rounded" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-discord-gray rounded-lg px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-discord-lightgray hover:text-white transition-colors"
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-discord-lightgray hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={`Message ${currentView.channel ? '#' + currentView.channel.name : currentView.dm?.username || ''}`}
              className="flex-1 bg-transparent text-white outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !imageFile}
              className="text-discord-blurple hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  )
}

export default ChatView
