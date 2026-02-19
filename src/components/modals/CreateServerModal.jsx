import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../../lib/api'

function CreateServerModal({ onClose, onServerCreated }) {
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const server = await api.createServer(name, isPublic)
      onServerCreated(server)
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-darker rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Create Server</h2>
          <button onClick={onClose} className="text-discord-lightgray hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-discord-lightgray text-sm font-semibold mb-2">
              SERVER NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              placeholder="Enter server name"
              required
              maxLength={50}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded bg-discord-darkest border-discord-gray"
              />
              <span className="ml-2 text-white">Make server public</span>
            </label>
            <p className="text-discord-lightgray text-xs mt-1 ml-7">
              Public servers can be discovered by anyone
            </p>
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateServerModal
