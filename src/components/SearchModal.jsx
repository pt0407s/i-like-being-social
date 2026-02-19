import { useState, useEffect } from 'react'
import { Search, X, Hash, User, Server } from 'lucide-react'
import api from '../lib/api'
import MessageRenderer from './MessageRenderer'

function SearchModal({ onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('messages')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        performSearch()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setResults([])
    }
  }, [query, activeTab])

  const performSearch = async () => {
    setLoading(true)
    try {
      let data
      if (activeTab === 'messages') {
        data = await api.searchMessages(query)
        setResults(data.results || [])
      } else if (activeTab === 'users') {
        data = await api.searchUsers(query)
        setResults(data || [])
      } else if (activeTab === 'servers') {
        data = await api.searchServers(query)
        setResults(data || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col border border-dark-800 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-dark-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-white text-xl font-bold">Search</h2>
            </div>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages, users, or servers..."
              className="w-full bg-dark-800 text-white pl-12 pr-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'messages'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Messages
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'servers'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              <Server className="w-4 h-4 inline mr-2" />
              Servers
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="w-16 h-16 text-dark-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Start searching</h3>
              <p className="text-dark-400 max-w-sm">
                Type at least 2 characters to search for {activeTab}
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-dark-400">Searching...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="w-16 h-16 text-dark-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No results found</h3>
              <p className="text-dark-400 max-w-sm">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'messages' && results.map((result) => (
                <div
                  key={result.id}
                  className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 hover:border-dark-600 transition-all cursor-pointer"
                  onClick={() => onNavigate && onNavigate(result.server_id, result.channel_id, result.id)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {result.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">{result.display_name || result.username}</span>
                        <span className="text-dark-400 text-sm">
                          in #{result.channel_name} • {formatDate(result.created_at)}
                        </span>
                      </div>
                      <div className="text-dark-200 text-sm">
                        <MessageRenderer content={result.content} isMarkdown={result.is_markdown} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'users' && results.map((result) => (
                <div
                  key={result.id}
                  className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 hover:border-dark-600 transition-all cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                    {result.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{result.display_name || result.username}</div>
                    <div className="text-dark-400 text-sm">@{result.username}</div>
                    {result.custom_status && (
                      <div className="text-dark-300 text-sm mt-1">{result.custom_status}</div>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    result.status === 'online' ? 'bg-green-500' :
                    result.status === 'idle' ? 'bg-yellow-500' :
                    result.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                </div>
              ))}

              {activeTab === 'servers' && results.map((result) => (
                <div
                  key={result.id}
                  className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 hover:border-dark-600 transition-all cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                    {result.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{result.name}</div>
                    <div className="text-dark-400 text-sm">{result.member_count} members</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal
