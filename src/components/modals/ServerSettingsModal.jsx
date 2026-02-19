import { useState, useEffect } from 'react'
import { X, Shield, Users, Ban, Plus, Trash2 } from 'lucide-react'
import api from '../../lib/api'

function ServerSettingsModal({ server, onClose, onUpdate, user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [bans, setBans] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'members') loadMembers()
    if (activeTab === 'roles') loadRoles()
    if (activeTab === 'bans') loadBans()
  }, [activeTab])

  const loadMembers = async () => {
    try {
      const data = await api.getServerMembers(server.id)
      setMembers(data)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await api.getServerRoles(server.id)
      setRoles(data)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const loadBans = async () => {
    try {
      const data = await api.getBans(server.id)
      setBans(data)
    } catch (error) {
      console.error('Failed to load bans:', error)
    }
  }

  const handleKick = async (userId) => {
    if (!confirm('Are you sure you want to kick this member?')) return
    
    try {
      await api.kickMember(server.id, userId)
      await loadMembers()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleBan = async (userId) => {
    const reason = prompt('Reason for ban (optional):')
    if (reason === null) return
    
    try {
      await api.banMember(server.id, userId, reason)
      await loadMembers()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleUnban = async (userId) => {
    if (!confirm('Are you sure you want to unban this user?')) return
    
    try {
      await api.unbanMember(server.id, userId)
      await loadBans()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleCreateRole = async () => {
    const name = prompt('Role name:')
    if (!name) return

    const color = prompt('Role color (hex):') || '#99AAB5'

    try {
      await api.createRole(server.id, name, color, 0)
      await loadRoles()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleAssignRole = async (userId, roleId) => {
    try {
      await api.assignRole(server.id, userId, roleId)
      await loadMembers()
    } catch (error) {
      alert(error.message)
    }
  }

  const isOwner = server.owner_id === user.id

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-darker rounded-lg w-[800px] h-[600px] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="w-48 bg-discord-darkest p-4">
          <div className="text-discord-lightgray text-xs font-semibold uppercase mb-2">
            {server.name}
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-2 py-1.5 rounded mb-1 ${
              activeTab === 'overview' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:bg-discord-gray hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`w-full text-left px-2 py-1.5 rounded mb-1 ${
              activeTab === 'roles' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:bg-discord-gray hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Roles
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`w-full text-left px-2 py-1.5 rounded mb-1 ${
              activeTab === 'members' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:bg-discord-gray hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            className={`w-full text-left px-2 py-1.5 rounded mb-1 ${
              activeTab === 'bans' ? 'bg-discord-gray text-white' : 'text-discord-lightgray hover:bg-discord-gray hover:text-white'
            }`}
          >
            <Ban className="w-4 h-4 inline mr-2" />
            Bans
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-discord-darkest">
            <h2 className="text-white text-xl font-bold">
              {activeTab === 'overview' && 'Server Overview'}
              {activeTab === 'roles' && 'Roles'}
              {activeTab === 'members' && 'Members'}
              {activeTab === 'bans' && 'Bans'}
            </h2>
            <button onClick={onClose} className="text-discord-lightgray hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="mb-4">
                  <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                    SERVER NAME
                  </label>
                  <div className="bg-discord-darkest text-white px-4 py-3 rounded">
                    {server.name}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                    INVITE CODE
                  </label>
                  <div className="bg-discord-darkest text-white px-4 py-3 rounded font-mono">
                    {server.invite_code}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                    SERVER TYPE
                  </label>
                  <div className="bg-discord-darkest text-white px-4 py-3 rounded">
                    {server.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div>
                {isOwner && (
                  <button
                    onClick={handleCreateRole}
                    className="mb-4 bg-discord-blurple hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Role
                  </button>
                )}
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="bg-discord-darkest p-4 rounded flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: role.color || '#99AAB5' }}
                        />
                        <span className="text-white font-medium">{role.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="bg-discord-darkest p-4 rounded flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{member.username}</div>
                        {member.role_name && (
                          <div className="text-sm" style={{ color: member.role_color || '#99AAB5' }}>
                            {member.role_name}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOwner && member.id !== server.owner_id && (
                      <div className="flex gap-2">
                        <select
                          value={member.role_id || ''}
                          onChange={(e) => handleAssignRole(member.id, e.target.value || null)}
                          className="bg-discord-darker text-white px-3 py-1 rounded text-sm"
                        >
                          <option value="">No Role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleKick(member.id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Kick
                        </button>
                        <button
                          onClick={() => handleBan(member.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Ban
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'bans' && (
              <div className="space-y-2">
                {bans.length === 0 ? (
                  <p className="text-discord-lightgray text-center py-8">No banned users</p>
                ) : (
                  bans.map((ban) => (
                    <div key={ban.id} className="bg-discord-darkest p-4 rounded flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{ban.username}</div>
                        {ban.reason && (
                          <div className="text-discord-lightgray text-sm">Reason: {ban.reason}</div>
                        )}
                        <div className="text-discord-lightgray text-xs">
                          Banned by {ban.banned_by_username}
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleUnban(ban.user_id)}
                          className="bg-discord-green hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerSettingsModal
