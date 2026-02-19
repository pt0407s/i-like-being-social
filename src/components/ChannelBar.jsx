import { Hash, ChevronDown } from 'lucide-react'

function ChannelBar({ channels, currentChannel, onChannelSelect }) {
  return (
    <div className="w-60 bg-discord-darker flex flex-col">
      <div className="h-12 px-4 flex items-center shadow-md border-b border-discord-darkest">
        <h2 className="text-white font-semibold flex items-center cursor-pointer hover:text-discord-lightgray transition-colors">
          School Chat
          <ChevronDown className="w-4 h-4 ml-1" />
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-4">
        <div className="px-2">
          <div className="text-discord-lightgray text-xs font-semibold px-2 mb-1 uppercase">
            Text Channels
          </div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel)}
              className={`w-full flex items-center px-2 py-1.5 rounded mb-0.5 group transition-colors ${
                currentChannel.id === channel.id
                  ? 'bg-discord-gray text-white'
                  : 'text-discord-lightgray hover:bg-discord-gray hover:text-white'
              }`}
            >
              <span className="mr-1.5">{channel.icon}</span>
              <Hash className="w-5 h-5 mr-1.5 text-discord-lightgray" />
              <span className="font-medium">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-14 bg-discord-darkest px-2 flex items-center">
        <div className="flex items-center flex-1">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: JSON.parse(localStorage.getItem('chatUser')).color }}
          >
            {JSON.parse(localStorage.getItem('chatUser')).username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-2 flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">
              {JSON.parse(localStorage.getItem('chatUser')).username}
            </div>
            <div className="text-discord-lightgray text-xs">
              Online
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChannelBar
