import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import MainApp from './components/MainApp'
import api from './lib/api'
import socket from './lib/socket'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.setToken(token)
      api.getMe()
        .then(userData => {
          setUser(userData)
          socket.connect(token)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setLoading(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleAuth = (userData, token) => {
    setUser(userData)
    socket.connect(token)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    api.setToken(null)
    socket.disconnect()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="h-screen bg-discord-darkest flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-discord-darkest">
      {!user ? (
        <Auth onAuth={handleAuth} />
      ) : (
        <MainApp user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
