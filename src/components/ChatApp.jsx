import { useState } from 'react'
import Sidebar from './Sidebar'
import ChannelBar from './ChannelBar'
import ChatArea from './ChatArea'

const DEFAULT_CHANNELS = [
  { id: 'general', name: 'general', icon: '💬' },
  { id: 'random', name: 'random', icon: '🎲' },
  { id: 'memes', name: 'memes', icon: '😂' },
  { id: 'gaming', name: 'gaming', icon: '🎮' },
  { id: 'music', name: 'music', icon: '🎵' },
  { id: 'homework', name: 'homework', icon: '📚' },
  { id: 'announcements', name: 'announcements', icon: '📢' }
]

function ChatApp({ user, onLogout }) {
  const [currentChannel, setCurrentChannel] = useState(DEFAULT_CHANNELS[0])
  const [channels] = useState(DEFAULT_CHANNELS)

  return (
    <div className="flex h-screen">
      <Sidebar 
        user={user} 
        onLogout={onLogout}
      />
      <ChannelBar 
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={setCurrentChannel}
      />
      <ChatArea 
        channel={currentChannel}
        user={user}
      />
    </div>
  )
}

export default ChatApp
