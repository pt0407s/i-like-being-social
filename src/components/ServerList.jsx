import { useState } from 'react'
import { Home, Plus, Compass, FolderPlus } from 'lucide-react'
import CreateServerModal from './modals/CreateServerModal'
import DiscoverServersModal from './modals/DiscoverServersModal'

function ServerList({ servers, currentView, onServerSelect, onHomeClick, onServerCreated, user }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDiscoverModal, setShowDiscoverModal] = useState(false)

  return (
    <>
      <div className="w-18 bg-discord-dark flex flex-col items-center py-3 space-y-2 overflow-y-auto">
        <button
          onClick={onHomeClick}
          className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            currentView.type === 'friends' ? 'bg-discord-blurple' : 'bg-discord-darker hover:bg-discord-blurple'
          }`}
        >
          <Home className="w-6 h-6 text-white" />
        </button>
        
        <div className="w-8 h-0.5 bg-discord-darker rounded-full" />
        
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => onServerSelect(server)}
            className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer text-white font-bold ${
              currentView.type === 'server' && currentView.server?.id === server.id
                ? 'bg-discord-blurple'
                : 'bg-discord-darker hover:bg-discord-blurple'
            }`}
            title={server.name}
          >
            {server.icon || server.name.charAt(0).toUpperCase()}
          </button>
        ))}
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 bg-discord-darker hover:bg-discord-green rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group"
          title="Create Server"
        >
          <Plus className="w-6 h-6 text-discord-green group-hover:text-white" />
        </button>

        <button
          onClick={() => setShowDiscoverModal(true)}
          className="w-12 h-12 bg-discord-darker hover:bg-discord-green rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group"
          title="Discover Servers"
        >
          <Compass className="w-6 h-6 text-discord-green group-hover:text-white" />
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
