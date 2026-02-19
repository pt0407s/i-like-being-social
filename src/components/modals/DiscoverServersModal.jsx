import { useState, useEffect } from 'react'
import { X, Users, Search } from 'lucide-react'
import api from '../../lib/api'

function DiscoverServersModal({ onClose, onServerJoined }) {
  const [servers, setServers] = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPublicServers()
  }, [])

  const loadPublicServers = async () => {
    try {
      const data = await api.getPublicServers()
      setServers(data)
    } catch (error) {
      console.error('Failed to load public servers:', error)
    }
  }

  const handleJoinServer = async (server) => {
    setLoading(true)
    try {
      await api.joinServer(server.invite_code)
      onServerJoined(server)
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByInvite = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const server = await api.joinServer(inviteCode)
      onServerJoined(server)
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-darker rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Discover Servers</h2>
          <button onClick={onClose} className="text-discord-lightgray hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleJoinByInvite} className="mb-6">
          <label className="block text-discord-lightgray text-sm font-semibold mb-2">
            HAVE AN INVITE CODE?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              placeholder="Enter invite code"
            />
            <button
              type="submit"
              disabled={loading || !inviteCode}
              className="bg-discord-blurple hover:bg-blue-600 text-white px-6 py-3 rounded transition-colors disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-white font-semibold mb-3">Public Servers</h3>
          <div className="space-y-2">
            {servers.length === 0 ? (
              <p className="text-discord-lightgray text-center py-8">No public servers available</p>
            ) : (
              servers.map((server) => (
                <div key={server.id} className="bg-discord-darkest p-4 rounded flex items-center justify-between hover:bg-discord-gray transition-colors">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-discord-blurple rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {server.icon || server.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-white font-semibold">{server.name}</div>
                      <div className="text-discord-lightgray text-sm flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {server.member_count || 0} members
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinServer(server)}
                    disabled={loading}
                    className="bg-discord-green hover:bg-green-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscoverServersModal
