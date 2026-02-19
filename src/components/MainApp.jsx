import { useState, useEffect } from 'react'
import ServerList from './ServerList'
import ChannelSidebar from './ChannelSidebar'
import ChatView from './ChatView'
import FriendsView from './FriendsView'
import api from '../lib/api'
import socket from '../lib/socket'

function MainApp({ user, onLogout }) {
  const [servers, setServers] = useState([])
  const [currentView, setCurrentView] = useState({ type: 'friends' })
  const [friends, setFriends] = useState([])
  const [dms, setDMs] = useState([])

  useEffect(() => {
    loadServers()
    loadFriends()
    loadDMs()
  }, [])

  const loadServers = async () => {
    try {
      const data = await api.getServers()
      setServers(data)
    } catch (error) {
      console.error('Failed to load servers:', error)
    }
  }

  const loadFriends = async () => {
    try {
      const data = await api.getFriends()
      setFriends(data)
    } catch (error) {
      console.error('Failed to load friends:', error)
    }
  }

  const loadDMs = async () => {
    try {
      const data = await api.getDMs()
      setDMs(data)
    } catch (error) {
      console.error('Failed to load DMs:', error)
    }
  }

  const handleServerSelect = (server) => {
    setCurrentView({ type: 'server', server })
  }

  const handleDMSelect = (dm) => {
    setCurrentView({ type: 'dm', dm })
  }

  const handleHomeClick = () => {
    setCurrentView({ type: 'friends' })
  }

  const handleServerCreated = (newServer) => {
    setServers([...servers, newServer])
    setCurrentView({ type: 'server', server: newServer })
  }

  return (
    <div className="flex h-screen">
      <ServerList
        servers={servers}
        currentView={currentView}
        onServerSelect={handleServerSelect}
        onHomeClick={handleHomeClick}
        onServerCreated={handleServerCreated}
        user={user}
      />
      
      {currentView.type === 'server' ? (
        <>
          <ChannelSidebar
            server={currentView.server}
            currentView={currentView}
            onViewChange={setCurrentView}
            user={user}
          />
          <ChatView
            currentView={currentView}
            user={user}
          />
        </>
      ) : (
        <FriendsView
          user={user}
          friends={friends}
          dms={dms}
          onDMSelect={handleDMSelect}
          onFriendsUpdate={loadFriends}
          onDMsUpdate={loadDMs}
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={onLogout}
        />
      )}
    </div>
  )
}

export default MainApp
