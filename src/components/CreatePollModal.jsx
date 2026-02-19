import { useState } from 'react'
import { X, Plus, Trash2, BarChart3 } from 'lucide-react'
import api from '../lib/api'

function CreatePollModal({ channelId, onClose, onCreated }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState(60) // minutes
  const [multipleChoice, setMultipleChoice] = useState(false)
  const [loading, setLoading] = useState(false)

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validOptions = options.filter(o => o.trim())
    if (!question.trim() || validOptions.length < 2) {
      alert('Please provide a question and at least 2 options')
      return
    }

    setLoading(true)
    try {
      const poll = await api.createPoll(channelId, question, validOptions, duration, multipleChoice)
      onCreated && onCreated(poll)
      onClose()
    } catch (error) {
      alert('Failed to create poll: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-2xl border border-dark-800 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white text-xl font-bold">Create Poll</h2>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Question */}
          <div className="mb-6">
            <label className="block text-dark-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="w-full bg-dark-800 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              required
              maxLength={200}
            />
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-dark-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-dark-800 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-dark-400 hover:text-red-400 transition-colors p-3"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            )}
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-dark-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full bg-dark-800 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={360}>6 hours</option>
              <option value={720}>12 hours</option>
              <option value={1440}>1 day</option>
              <option value={4320}>3 days</option>
              <option value={10080}>1 week</option>
              <option value={0}>No expiration</option>
            </select>
          </div>

          {/* Multiple Choice */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={multipleChoice}
                onChange={(e) => setMultipleChoice(e.target.checked)}
                className="w-5 h-5 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <div>
                <div className="text-white font-medium">Allow multiple choices</div>
                <div className="text-dark-400 text-sm">Users can select more than one option</div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-dark-800 hover:bg-dark-700 text-white py-3 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-glow"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePollModal
