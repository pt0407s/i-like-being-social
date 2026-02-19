import { useState } from 'react'
import { X, Copy, RefreshCw, Check } from 'lucide-react'
import api from '../../lib/api'

function ServerInviteModal({ server, onClose }) {
  const [inviteCode, setInviteCode] = useState(server.invite_code)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    setLoading(true)
    try {
      const result = await api.regenerateInvite(server.id)
      setInviteCode(result.inviteCode)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-darker rounded-lg p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Invite Friends to {server.name}</h2>
          <button onClick={onClose} className="text-discord-lightgray hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-discord-lightgray text-sm font-semibold mb-2">
            INVITE CODE
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              readOnly
              className="flex-1 bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none font-mono"
            />
            <button
              onClick={handleCopy}
              className="bg-discord-blurple hover:bg-blue-600 text-white px-4 py-3 rounded transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-discord-lightgray text-xs mt-2">
            Share this code with friends so they can join your server
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-discord-lightgray text-sm font-semibold mb-2">
            OR SHARE THIS LINK
          </label>
          <div className="bg-discord-darkest text-discord-lightgray px-4 py-3 rounded text-sm break-all">
            {inviteUrl}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex-1 bg-discord-darkest hover:bg-discord-gray text-white py-2 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Code
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-discord-blurple hover:bg-blue-600 text-white py-2 rounded transition-colors"
          >
            Done
          </button>
        </div>

        <p className="text-discord-lightgray text-xs mt-4 text-center">
          Regenerating the code will invalidate the old one
        </p>
      </div>
    </div>
  )
}

export default ServerInviteModal
