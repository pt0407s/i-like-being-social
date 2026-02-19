import { useState } from 'react'
import { Home, Plus, Compass, FolderPlus } from 'lucide-react'
import CreateServerModal from './modals/CreateServerModal'
import DiscoverServersModal from './modals/DiscoverServersModal'

function ServerList({ servers, currentView, onServerSelect, onHomeClick, onServerCreated, user }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDiscoverModal, setShowDiscoverModal] = useState(false)

  return (
    <>
      <div className="h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent w-10 my-2" />
      <div className="w-20 bg-gradient-to-b from-dark-950 to-dark-900 flex flex-col items-center py-3 gap-3 overflow-y-auto border-r border-dark-800/50">
        <button
          onClick={onHomeClick}
          className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            currentView.type === 'friends' ? 'bg-discord-blurple' : 'bg-discord-darker hover:bg-discord-blurple'
          }`}
        >
          <Home className="w-6 h-6 text-white" />
        </button>
        
        {servers.map((server, index) => (
          <button
            key={server.id}
            onClick={() => onServerSelect(server)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all transform hover:scale-110 ${
              currentView.type === 'server' && currentView.server?.id === server.id
                ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-glow scale-105'
                : 'bg-dark-800/50 text-dark-300 hover:bg-gradient-to-br hover:from-primary-500/80 hover:to-accent-500/80 hover:text-white border border-dark-700'
            } animate-scale-in`}
            style={{ animationDelay: `${index * 50}ms` }}
            title={server.name}
          >
            {server.name.charAt(0).toUpperCase()}
          </button>
        ))}
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-14 h-14 rounded-2xl bg-dark-800/50 text-primary-400 hover:bg-gradient-to-br hover:from-primary-500 hover:to-accent-500 hover:text-white transition-all transform hover:scale-110 flex items-center justify-center border border-dark-700 hover:border-transparent shadow-lg hover:shadow-glow"
          title="Create Server"
        >
          <Plus className="w-7 h-7" />
        </button>

        <button
          onClick={() => setShowDiscoverModal(true)}
          className="w-14 h-14 rounded-2xl bg-dark-800/50 text-accent-400 hover:bg-gradient-to-br hover:from-accent-500 hover:to-primary-500 hover:text-white transition-all transform hover:scale-110 flex items-center justify-center border border-dark-700 hover:border-transparent shadow-lg hover:shadow-glow-accent"
          title="Discover Servers"
        >
          <Compass className="w-7 h-7" />
        </button>
      </div>

      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onServerCreated={onServerCreated}
        />
      )}

      {showDiscoverModal && (
        <DiscoverServersModal
          onClose={() => setShowDiscoverModal(false)}
          onServerJoined={onServerCreated}
        />
      )}
    </>
  )
}

export default ServerList
