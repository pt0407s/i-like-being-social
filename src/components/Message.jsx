function Message({ message }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (isToday) {
      return `Today at ${timeStr}`
    }
    
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric',
      year: 'numeric'
    })
    
    return `${dateStr} ${timeStr}`
  }

  return (
    <div className="flex items-start py-1 px-4 hover:bg-discord-darker/30 group">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: message.color }}
      >
        {message.username.charAt(0).toUpperCase()}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-baseline">
          <span className="text-white font-semibold hover:underline cursor-pointer">
            {message.username}
          </span>
          <span className="text-discord-lightgray text-xs ml-2">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="text-discord-lightgray break-words">
          {message.text}
        </div>
      </div>
    </div>
  )
}

export default Message
