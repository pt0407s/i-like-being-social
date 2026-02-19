import { useState, useEffect } from 'react'
import { Bookmark, X, ExternalLink } from 'lucide-react'
import api from '../lib/api'
import MessageRenderer from './MessageRenderer'

function BookmarksView({ onClose, onNavigate }) {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
    try {
      const data = await api.getBookmarks()
      setBookmarks(data)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBookmark = async (messageId) => {
    try {
      await api.unbookmarkMessage(messageId)
      setBookmarks(bookmarks.filter(b => b.id !== messageId))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col border border-dark-800 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Bookmarks</h2>
              <p className="text-dark-400 text-sm">{bookmarks.length} saved messages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-dark-400">Loading bookmarks...</div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bookmark className="w-16 h-16 text-dark-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-dark-400 max-w-sm">
                Bookmark important messages to save them here for easy access later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 hover:border-dark-600 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                        {bookmark.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{bookmark.display_name || bookmark.username}</div>
                        <div className="text-dark-400 text-sm">
                          {bookmark.server_name && `${bookmark.server_name} • `}
                          {bookmark.channel_name && `#${bookmark.channel_name} • `}
                          {formatDate(bookmark.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bookmark.channel_id && (
                        <button
                          onClick={() => onNavigate && onNavigate(bookmark.server_id, bookmark.channel_id)}
                          className="text-dark-400 hover:text-primary-400 transition-colors"
                          title="Go to message"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.id)}
                        className="text-dark-400 hover:text-red-400 transition-colors"
                        title="Remove bookmark"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-dark-200">
                    <MessageRenderer content={bookmark.content} isMarkdown={bookmark.is_markdown} />
                  </div>
                  {bookmark.attachments && bookmark.attachments.length > 0 && (
                    <div className="mt-2 text-dark-400 text-sm">
                      📎 {bookmark.attachments.length} attachment(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookmarksView
