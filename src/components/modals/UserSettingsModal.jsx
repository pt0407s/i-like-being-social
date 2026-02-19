import { useState } from 'react'
import { X, User, LogOut } from 'lucide-react'
import api from '../../lib/api'

function UserSettingsModal({ user, onClose, onUpdate, onLogout }) {
  const [formData, setFormData] = useState({
    username: user.username,
    displayName: user.display_name || user.username,
    customStatus: user.custom_status || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const updated = await api.updateMe({
        username: formData.username !== user.username ? formData.username : undefined,
        display_name: formData.displayName,
        custom_status: formData.customStatus
      })
      onUpdate(updated)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-darker rounded-lg w-[600px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-discord-darkest">
          <h2 className="text-white text-xl font-bold">User Settings</h2>
          <button onClick={onClose} className="text-discord-lightgray hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">My Account</h3>
              
              <div className="bg-discord-darkest rounded p-4 mb-4">
                <div className="flex items-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-semibold text-lg">{user.display_name || user.username}</div>
                    <div className="text-discord-lightgray text-sm">@{user.username}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                  placeholder="Enter username"
                  required
                  maxLength={32}
                />
                <p className="text-discord-lightgray text-xs mt-1">
                  This is your unique identifier. Others use this to find you.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                  placeholder="Enter display name"
                  maxLength={32}
                />
                <p className="text-discord-lightgray text-xs mt-1">
                  This is how others see your name. Can be anything!
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                  CUSTOM STATUS
                </label>
                <input
                  type="text"
                  value={formData.customStatus}
                  onChange={(e) => setFormData({ ...formData, customStatus: e.target.value })}
                  className="w-full bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                  placeholder="What's on your mind?"
                  maxLength={128}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-discord-darkest hover:bg-discord-gray text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-discord-blurple hover:bg-blue-600 text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-discord-darkest">
            <button
              onClick={onLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettingsModal
