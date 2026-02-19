import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

const COLORS = [
  '#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245',
  '#3BA55D', '#FAA61A', '#F26522', '#F47FFF', '#00D9FF'
]

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim()) {
      onLogin(username.trim(), selectedColor)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-discord-blurple to-purple-600">
      <div className="bg-discord-darker p-8 rounded-lg shadow-2xl w-96">
        <div className="flex items-center justify-center mb-6">
          <MessageCircle className="w-12 h-12 text-discord-blurple" />
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome Back!
        </h1>
        <p className="text-discord-lightgray text-center mb-6">
          Enter your username to get started
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-discord-lightgray text-sm font-semibold mb-2">
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-discord-darkest text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              placeholder="Enter your username"
              maxLength={20}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-discord-lightgray text-sm font-semibold mb-2">
              CHOOSE YOUR COLOR
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-discord-blurple hover:bg-blue-600 text-white font-semibold py-3 rounded transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
