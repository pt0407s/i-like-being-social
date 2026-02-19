import { useState } from 'react'
import { MessageCircle, Mail, Lock, User } from 'lucide-react'
import api from '../lib/api'

function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await api.login(formData.username, formData.password)
      } else {
        result = await api.register(formData.username, formData.password, formData.email || undefined)
      }
      onAuth(result.user, result.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-discord-blurple to-purple-600">
      <div className="bg-discord-darker p-8 rounded-lg shadow-2xl w-96">
        <div className="flex items-center justify-center mb-6">
          <MessageCircle className="w-12 h-12 text-discord-blurple" />
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p className="text-discord-lightgray text-center mb-6">
          {isLogin ? 'Login to continue' : 'Sign up to get started'}
        </p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-discord-lightgray text-sm font-semibold mb-2">
              USERNAME
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-lightgray" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-discord-darkest text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label className="block text-discord-lightgray text-sm font-semibold mb-2">
                EMAIL (OPTIONAL)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-lightgray" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-discord-darkest text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                  placeholder="Enter email (optional)"
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-discord-lightgray text-sm font-semibold mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-lightgray" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-discord-darkest text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-discord-blurple hover:bg-blue-600 text-white font-semibold py-3 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-discord-blurple hover:underline text-sm"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
