import { X } from 'lucide-react'

function UserProfileModal({ user, roles, onClose }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'dnd': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online'
      case 'idle': return 'Idle'
      case 'dnd': return 'Do Not Disturb'
      default: return 'Offline'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-darker rounded-lg w-[500px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-24 bg-gradient-to-r from-discord-blurple to-purple-600 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:text-gray-200 bg-black/30 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold text-3xl border-4 border-discord-darker">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-discord-darker ${getStatusColor(user.status)}`} />
            </div>
          </div>

          <div className="bg-discord-darkest rounded-lg p-4 mb-4">
            <div className="mb-3">
              <h2 className="text-white text-2xl font-bold">
                {user.display_name || user.username}
              </h2>
              <p className="text-discord-lightgray text-sm">@{user.username}</p>
            </div>

            {user.custom_status && (
              <div className="mb-3">
                <div className="text-white text-sm">{user.custom_status}</div>
              </div>
            )}

            <div className="border-t border-discord-gray pt-3 mt-3">
              <div className="text-discord-lightgray text-xs font-semibold uppercase mb-2">
                Status
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status)}`} />
                <span className="text-white text-sm">{getStatusText(user.status)}</span>
              </div>
            </div>

            {user.bio && (
              <div className="border-t border-discord-gray pt-3 mt-3">
                <div className="text-discord-lightgray text-xs font-semibold uppercase mb-2">
                  About Me
                </div>
                <div className="text-white text-sm whitespace-pre-wrap">{user.bio}</div>
              </div>
            )}

            {roles && roles.length > 0 && (
              <div className="border-t border-discord-gray pt-3 mt-3">
                <div className="text-discord-lightgray text-xs font-semibold uppercase mb-2">
                  Roles
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="px-3 py-1 rounded text-sm font-medium"
                      style={{ 
                        backgroundColor: role.color + '20',
                        color: role.color || '#99AAB5',
                        border: `1px solid ${role.color || '#99AAB5'}`
                      }}
                    >
                      {role.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-discord-gray pt-3 mt-3">
              <div className="text-discord-lightgray text-xs font-semibold uppercase mb-2">
                Member Since
              </div>
              <div className="text-white text-sm">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal
