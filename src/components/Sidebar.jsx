import { Hash, LogOut, Settings } from 'lucide-react'

function Sidebar({ user, onLogout }) {
  return (
    <div className="w-16 bg-discord-dark flex flex-col items-center py-3 space-y-2">
      <div className="w-12 h-12 bg-discord-blurple rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group">
        <Hash className="w-7 h-7 text-white" />
      </div>
      
      <div className="w-8 h-0.5 bg-discord-darker rounded-full" />
      
      <div className="flex-1" />
      
      <button
        onClick={onLogout}
        className="w-12 h-12 bg-discord-darker hover:bg-red-500 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group"
        title="Logout"
      >
        <LogOut className="w-5 h-5 text-discord-lightgray group-hover:text-white" />
      </button>
    </div>
  )
}

export default Sidebar
