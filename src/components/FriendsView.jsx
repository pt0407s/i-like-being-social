import { useState, useEffect } from 'react'
import { Users, MessageSquare, UserPlus, Check, X, LogOut, Hash } from 'lucide-react'
import api from '../lib/api'
import ChatView from './ChatView'

function FriendsView({ user, friends, dms, onDMSelect, onFriendsUpdate, onDMsUpdate, currentView, onViewChange, onLogout }) {
  const [activeTab, setActiveTab] = useState('online')
  const [pendingRequests, setPendingRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    try {
      const data = await api.getPendingRequests()
      setPendingRequests(data)
    } catch (error) {
      console.error('Failed to load pending requests:', error)
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const results = await api.searchUsers(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleSendRequest = async (username) => {
    try {
      await api.sendFriendRequest(username)
      alert('Friend request sent!')
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      alert(error.message)
    }
  }

  const handleAcceptRequest = async (userId) => {
    try {
      await api.acceptFriend(userId)
      await loadPendingRequests()
      await onFriendsUpdate()
      await onDMsUpdate()
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const handleRejectRequest = async (userId) => {
    try {
      await api.removeFriend(userId)
      await loadPendingRequests()
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  const handleDMClick = (dm) => {
    onViewChange({ type: 'dm', dm })
  }

  if (currentView.type === 'dm') {
    return <ChatView currentView={currentView} user={user} />
  }

  const onlineFriends = friends.filter(f => f.status === 'online')
  const allFriends = friends

  return (
    <div className="flex-1 flex flex-col bg-discord-darkest">
      <div className="h-12 px-4 flex items-center justify-between shadow-md border-b border-discord-darker">
        <div className="flex items-center gap-4">
          <Users className="w-6 h-6 text-discord-lightgray" />
          <h3 className="text-white font-semibold">Friends</h3>
          
          <div className="flex gap-4 ml-4">
            <button
              onClick={() => setActiveTab('online')}
              className={`text-sm font-medium px-2 py-1 rounded ${
                activeTab === 'online' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:text-white'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm font-medium px-2 py-1 rounded ${
                activeTab === 'all' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`text-sm font-medium px-2 py-1 rounded ${
                activeTab === 'pending' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:text-white'
              }`}
            >
              Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`text-sm font-medium px-2 py-1 rounded ${
                activeTab === 'add' ? 'bg-discord-green text-white' : 'text-discord-green hover:text-white'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-discord-lightgray hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'add' && (
            <div className="max-w-2xl">
              <h2 className="text-white text-xl font-bold mb-2">Add Friend</h2>
              <p className="text-discord-lightgray mb-4">
                You can add friends by their username.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((result) => (
                    <div key={result.id} className="bg-discord-darker p-4 rounded flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold">
                          {result.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-3 text-white font-medium">{result.username}</span>
                      </div>
                      <button
                        onClick={() => handleSendRequest(result.username)}
                        className="bg-discord-blurple hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        Send Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-4">
              <h2 className="text-white text-xl font-bold">Pending Requests</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-discord-lightgray">No pending requests</p>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="bg-discord-darker p-4 rounded flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold">
                        {request.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-3 text-white font-medium">{request.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-discord-green hover:bg-green-600 text-white p-2 rounded transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {(activeTab === 'online' || activeTab === 'all') && (
            <div className="space-y-4">
              <h2 className="text-white text-xl font-bold">
                {activeTab === 'online' ? `Online — ${onlineFriends.length}` : `All Friends — ${allFriends.length}`}
              </h2>
              {(activeTab === 'online' ? onlineFriends : allFriends).map((friend) => (
                <div key={friend.id} className="bg-discord-darker p-4 rounded flex items-center justify-between hover:bg-discord-gray transition-colors">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${
                        friend.status === 'online' ? 'bg-discord-green' : 'bg-discord-gray'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <div className="text-white font-medium">{friend.username}</div>
                      {friend.custom_status && (
                        <div className="text-discord-lightgray text-sm">{friend.custom_status}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const dm = dms.find(d => d.user_id === friend.id)
                      if (dm) handleDMClick(dm)
                    }}
                    className="bg-discord-darkest hover:bg-discord-gray text-white p-2 rounded transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-60 bg-discord-darker border-l border-discord-darkest p-4">
          <h3 className="text-discord-lightgray text-xs font-semibold uppercase mb-2">Direct Messages</h3>
          {dms.map((dm) => (
            <button
              key={dm.id}
              onClick={() => handleDMClick(dm)}
              className={`w-full flex items-center px-2 py-2 rounded mb-1 hover:bg-discord-gray transition-colors ${
                currentView.dm?.id === dm.id ? 'bg-discord-gray' : ''
              }`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm font-semibold">
                  {dm.username.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${
                  dm.status === 'online' ? 'bg-discord-green' : 'bg-discord-gray'
                }`} />
              </div>
              <span className="ml-2 text-white text-sm font-medium truncate">{dm.username}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendsView
