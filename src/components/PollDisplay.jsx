import { useState, useEffect } from 'react'
import { BarChart3, Clock, Users } from 'lucide-react'
import api from '../lib/api'

function PollDisplay({ poll: initialPoll, user }) {
  const [poll, setPoll] = useState(initialPoll)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    if (initialPoll.id) {
      loadPoll()
    }
  }, [initialPoll.id])

  const loadPoll = async () => {
    try {
      const data = await api.getPoll(initialPoll.id)
      setPoll(data)
    } catch (error) {
      console.error('Failed to load poll:', error)
    }
  }

  const handleVote = async (optionIndex) => {
    if (voting) return
    
    setVoting(true)
    try {
      const result = await api.votePoll(poll.id, optionIndex)
      await loadPoll() // Reload to get updated counts
    } catch (error) {
      console.error('Failed to vote:', error)
      alert('Failed to vote: ' + error.message)
    } finally {
      setVoting(false)
    }
  }

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date()
  const hasVoted = poll.userVote !== null && poll.userVote !== undefined
  const maxVotes = Math.max(...(poll.voteCounts || []), 1)

  const formatTimeRemaining = () => {
    if (!poll.expires_at) return 'No expiration'
    const now = new Date()
    const expires = new Date(poll.expires_at)
    const diff = expires - now
    
    if (diff < 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h remaining`
    if (hours > 0) return `${hours}h ${minutes % 60}m remaining`
    return `${minutes}m remaining`
  }

  return (
    <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700 my-3">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">{poll.question}</h3>
          <div className="flex items-center gap-4 text-dark-400 text-sm">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {poll.totalVotes || 0} votes
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTimeRemaining()}
            </span>
            {isExpired && (
              <span className="text-red-400 font-medium">Ended</span>
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options && poll.options.map((option, index) => {
          const votes = poll.voteCounts?.[index] || 0
          const percentage = poll.totalVotes > 0 ? (votes / poll.totalVotes * 100).toFixed(1) : 0
          const isUserVote = poll.userVote === index
          const isWinning = votes === maxVotes && votes > 0

          return (
            <button
              key={index}
              onClick={() => !isExpired && handleVote(index)}
              disabled={isExpired || voting}
              className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                isExpired || hasVoted
                  ? 'cursor-default'
                  : 'cursor-pointer hover:border-primary-500'
              } ${
                isUserVote
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 bg-dark-900/50'
              }`}
            >
              {/* Progress Bar */}
              <div
                className={`absolute inset-0 transition-all ${
                  isWinning ? 'bg-primary-500/20' : 'bg-dark-700/30'
                }`}
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isUserVote
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-dark-600'
                  }`}>
                    {isUserVote && (
                      <div className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-white font-medium">{option}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-dark-400 text-sm">{votes} votes</span>
                  <span className={`font-bold min-w-[3rem] text-right ${
                    isWinning ? 'text-primary-400' : 'text-white'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-dark-700 text-dark-400 text-sm">
        Created by <span className="text-white">{poll.display_name || poll.username}</span>
        {poll.multiple_choice && (
          <span className="ml-3 text-accent-400">• Multiple choice allowed</span>
        )}
      </div>
    </div>
  )
}

export default PollDisplay
