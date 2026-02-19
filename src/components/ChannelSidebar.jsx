import { useState, useEffect } from 'react'
import { Hash, ChevronDown, Settings, UserPlus, Plus } from 'lucide-react'
import api from '../lib/api'

function ChannelSidebar({ server, currentView, onViewChange, user }) {
  const [channels, setChannels] = useState([])
  const [members, setMembers] = useState([])
  const [showMembers, setShowMembers] = useState(true)

  useEffect(() => {
    loadChannels()
    loadMembers()
  }, [server.id])

  const loadChannels = async () => {
    try {
      const data = await api.getChannels(server.id)
      setChannels(data)
      if (data.length > 0 && (!currentView.channel || currentView.server?.id !== server.id)) {
        onViewChange({ type: 'server', server, channel: data[0] })
      }
    } catch (error) {
      console.error('Failed to load channels:', error)
    }
  }

  const loadMembers = async () => {
    try {
      const data = await api.getServerMembers(server.id)
      setMembers(data)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const handleChannelSelect = (channel) => {
    onViewChange({ type: 'server', server, channel })
  }

  return (
    <div className="w-60 bg-discord-darker flex flex-col">
      <div className="h-12 px-4 flex items-center justify-between shadow-md border-b border-discord-darkest">
        <h2 className="text-white font-semibold flex items-center cursor-pointer hover:text-discord-lightgray transition-colors">
          {server.name}
          <ChevronDown className="w-4 h-4 ml-1" />
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-4">
        <div className="px-2 mb-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <div className="text-discord-lightgray text-xs font-semibold uppercase">
              Text Channels
            </div>
            {server.owner_id === user.id && (
              <Plus className="w-4 h-4 text-discord-lightgray hover:text-white cursor-pointer" />
            )}
          </div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannelSelect(channel)}
              className={`w-full flex items-center px-2 py-1.5 rounded mb-0.5 group transition-colors ${
                currentView.channel?.id === channel.id
                  ? 'bg-discord-gray text-white'
                  : 'text-discord-lightgray hover:bg-discord-gray hover:text-white'
              }`}
            >
              <Hash className="w-5 h-5 mr-1.5 text-discord-lightgray" />
              <span className="font-medium">{channel.name}</span>
            </button>
          ))}
        </div>

        {showMembers && (
          <div className="px-2">
            <div className="text-discord-lightgray text-xs font-semibold px-2 mb-1 uppercase">
              Members — {members.length}
            </div>
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center px-2 py-1.5 rounded hover:bg-discord-gray cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm font-semibold">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${
                    member.status === 'online' ? 'bg-discord-green' : 'bg-discord-gray'
                  }`} />
                </div>
                <div className="ml-2 flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: member.role_color || '#b9bbbe' }}>
                    {member.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChannelSidebar
