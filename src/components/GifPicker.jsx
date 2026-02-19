import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ' // Free public key
const TENOR_API_URL = 'https://tenor.googleapis.com/v2'

function GifPicker({ onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    loadFeatured()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        searchGifs(searchTerm)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setGifs(featured)
    }
  }, [searchTerm, featured])

  const loadFeatured = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${TENOR_API_URL}/featured?key=${TENOR_API_KEY}&client_key=discord_clone&limit=20&media_filter=gif,tinygif`
      )
      const data = await response.json()
      setFeatured(data.results || [])
      setGifs(data.results || [])
    } catch (error) {
      console.error('Failed to load featured GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchGifs = async (query) => {
    try {
      setLoading(true)
      const response = await fetch(
        `${TENOR_API_URL}/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&client_key=discord_clone&limit=20&media_filter=gif,tinygif`
      )
      const data = await response.json()
      setGifs(data.results || [])
    } catch (error) {
      console.error('Failed to search GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGifSelect = (gif) => {
    const gifUrl = gif.media_formats.gif.url
    onSelect(gifUrl)
    onClose()
  }

  return (
    <div className="absolute bottom-20 right-4 w-96 h-96 bg-discord-darker rounded-lg shadow-2xl flex flex-col overflow-hidden z-50">
      <div className="p-3 border-b border-discord-darkest flex items-center justify-between">
        <h3 className="text-white font-semibold">GIFs</h3>
        <button onClick={onClose} className="text-discord-lightgray hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 border-b border-discord-darkest">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-lightgray" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for GIFs"
            className="w-full bg-discord-darkest text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-discord-lightgray">Loading GIFs...</div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-discord-lightgray">No GIFs found</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <div
                key={gif.id}
                className="relative aspect-square cursor-pointer rounded overflow-hidden hover:opacity-80 transition-opacity"
                onClick={() => handleGifSelect(gif)}
              >
                <img
                  src={gif.media_formats.tinygif.url}
                  alt={gif.content_description}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-discord-darkest">
        <div className="text-xs text-discord-lightgray text-center">
          Powered by Tenor
        </div>
      </div>
    </div>
  )
}

export default GifPicker
