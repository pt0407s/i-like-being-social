import { useState, useEffect } from 'react'
import { Hash, ChevronDown, Settings, UserPlus, Plus } from 'lucide-react'
import api from '../lib/api'
import UserSettingsModal from './modals/UserSettingsModal'
import ServerInviteModal from './modals/ServerInviteModal'
import ServerSettingsModal from './modals/ServerSettingsModal'
import UserProfileModal from './modals/UserProfileModal'

function ChannelSidebar({ server, currentView, onViewChange, user, onLogout }) {
  const [channels, setChannels] = useState([])
  const [members, setMembers] = useState([])
  const [showMembers, setShowMembers] = useState(true)
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showServerInvite, setShowServerInvite] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(user)

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

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser)
  }

  const handleMemberClick = async (member) => {
    try {
      const userData = await api.getUser(member.id)
      const userRoles = roles.filter(r => r.id === member.role_id)
      setSelectedUser({ ...userData, roles: userRoles })
      setShowUserProfile(true)
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  return (
    <>
      <div className="w-60 bg-discord-darker flex flex-col">
        <div className="h-12 px-4 flex items-center justify-between shadow-md border-b border-discord-darkest">
          <div className="flex-1 relative group">
            <button className="text-white font-semibold flex items-center hover:text-discord-lightgray transition-colors w-full">
              {server.name}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            <div className="absolute top-full left-0 w-56 bg-discord-darkest rounded shadow-lg py-2 hidden group-hover:block z-10">
              <button
                onClick={() => setShowServerInvite(true)}
                className="w-full text-left px-4 py-2 text-discord-blurple hover:bg-discord-gray transition-colors"
              >
                Invite People
              </button>
              {server.owner_id === user.id && (
                <button
                  onClick={() => setShowServerSettings(true)}
                  className="w-full text-left px-4 py-2 text-white hover:bg-discord-gray transition-colors"
                >
                  Server Settings
                </button>
              )}
            </div>
          </div>
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
                className="flex items-center px-2 py-1 rounded hover:bg-discord-gray cursor-pointer group"
                onClick={() => handleMemberClick(member)}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold text-sm">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${
                    member.status === 'online' ? 'bg-green-500' :
                    member.status === 'idle' ? 'bg-yellow-500' :
                    member.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div className="ml-2 flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: member.role_color || '#b9bbbe' }}>
                    {member.display_name || member.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        
        <div className="h-14 bg-discord-darkest px-2 flex items-center">
          <div className="flex items-center flex-1 cursor-pointer hover:bg-discord-gray rounded p-1 transition-colors" onClick={() => setShowUserSettings(true)}>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-discord-blurple"
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">
                {currentUser.display_name || currentUser.username}
              </div>
              <div className="text-discord-lightgray text-xs truncate">
                @{currentUser.username}
              </div>
            </div>
            <Settings className="w-4 h-4 text-discord-lightgray" />
          </div>
        </div>
      </div>

      {showUserSettings && (
        <UserSettingsModal
          user={currentUser}
          onClose={() => setShowUserSettings(false)}
          onUpdate={handleUserUpdate}
          onLogout={onLogout}
        />
      )}

      {showServerInvite && (
        <ServerInviteModal
          server={server}
          onClose={() => setShowServerInvite(false)}
        />
      )}

      {showServerSettings && (
        <ServerSettingsModal
          server={server}
          user={user}
          onClose={() => setShowServerSettings(false)}
          onUpdate={() => {}}
        />
      )}

      {showUserProfile && selectedUser && (
        <UserProfileModal
          user={selectedUser}
          roles={selectedUser.roles}
          onClose={() => {
            setShowUserProfile(false)
            setSelectedUser(null)
          }}
        />
      )}
    </>
  )
}

export default ChannelSidebar
