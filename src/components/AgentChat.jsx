import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Lightbulb,
  FileUp,
  GitMerge,
  BarChart3,
  BookOpen,
  Loader2
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'
import { processAgentQuery } from '../utils/aiEngine'

const quickActions = [
  { icon: FileUp, label: 'Analyze my files', query: 'Analyze my uploaded files and tell me what you found' },
  { icon: GitMerge, label: 'Suggest mappings', query: 'Can you suggest how to map fields between my files?' },
  { icon: BarChart3, label: 'Create a report', query: 'Help me create a financial report template' },
  { icon: BookOpen, label: 'Show rules', query: 'What rules have you learned so far?' },
]

function AgentChat({ setIsAgentThinking }) {
  const { 
    chatHistory, 
    addChatMessage, 
    parsedData, 
    fieldMappings, 
    combinedData, 
    learnedRules,
    combineData,
    getAIMappingSuggestions,
    addMapping
  } = useAgent()
  
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    addChatMessage('user', userMessage)
    setIsProcessing(true)
    setIsAgentThinking(true)

    // Process the query
    setTimeout(() => {
      const context = {
        parsedData,
        fieldMappings,
        combinedData,
        learnedRules
      }

      const result = processAgentQuery(userMessage, context)
      
      addChatMessage('agent', result.response, {
        suggestions: result.suggestions,
        action: result.action
      })

      setIsProcessing(false)
      setIsAgentThinking(false)
    }, 500 + Math.random() * 500) // Simulate thinking time
  }

  const handleQuickAction = (action) => {
    setInput(action.query)
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleActionButton = (action) => {
    if (!action) return

    switch (action.type) {
      case 'combine_ready':
        combineData()
        addChatMessage('agent', '✅ Data combined successfully! You can view the results in the Combined Data tab.')
        break
      
      case 'mapping_suggestions':
        const suggestions = action.suggestions || getAIMappingSuggestions()
        if (suggestions.length > 0) {
          suggestions.slice(0, 5).forEach(s => {
            addMapping({
              sourceFileId: s.sourceFileId,
              sourceField: s.sourceField,
              targetField: s.targetField,
              transform: s.suggestedTransform,
              isAISuggested: true
            })
          })
          addChatMessage('agent', `✅ Applied ${Math.min(5, suggestions.length)} suggested mappings! Check the Mapping Studio to review them.`)
        }
        break
      
      default:
        break
    }
  }

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-agent-bg px-1 rounded text-blue-300">$1</code>')
      .replace(/^• /gm, '<span class="text-blue-400 mr-2">•</span>')
      .replace(/^\d+\. /gm, (match) => `<span class="text-blue-400 mr-2">${match.trim()}</span>`)
      .split('\n').map((line, i) => 
        `<p class="${line.startsWith('<span') ? 'flex items-start' : ''} ${i > 0 ? 'mt-1' : ''}">${line || '&nbsp;'}</p>`
      ).join('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-agent-border flex-shrink-0">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Agent Chat</h2>
          <p className="text-sm text-gray-400">Ask me anything about your financial data</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 py-4 overflow-x-auto flex-shrink-0">
        {quickActions.map((action, idx) => {
          const Icon = action.icon
          return (
            <button
              key={idx}
              onClick={() => handleQuickAction(action)}
              className="flex items-center gap-2 px-3 py-2 bg-agent-card border border-agent-border rounded-lg text-sm text-gray-300 hover:border-blue-500 hover:text-white whitespace-nowrap transition-colors"
            >
              <Icon className="w-4 h-4 text-blue-400" />
              {action.label}
            </button>
          )
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {chatHistory.map((message, idx) => (
          <div 
            key={idx}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'agent' 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                : 'bg-gray-600'
            }`}>
              {message.role === 'agent' ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-3 rounded-lg ${
                message.role === 'agent'
                  ? 'bg-agent-card border border-agent-border text-left'
                  : 'bg-blue-600 text-white'
              }`}>
                {message.role === 'agent' ? (
                  <div 
                    className="text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>

              {/* Suggestions */}
              {message.role === 'agent' && message.suggestions && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.suggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 bg-agent-border text-gray-300 text-xs rounded-full hover:bg-agent-accent hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {message.role === 'agent' && message.action?.type === 'combine_ready' && (
                <div className="mt-3">
                  <button
                    onClick={() => handleActionButton(message.action)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Combine Data Now
                  </button>
                </div>
              )}

              {message.role === 'agent' && message.action?.type === 'mapping_suggestions' && (
                <div className="mt-3">
                  <button
                    onClick={() => handleActionButton(message.action)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Apply Suggested Mappings
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isProcessing && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-agent-card border border-agent-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pt-4 border-t border-agent-border">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me about your data, mappings, or reports..."
              className="w-full px-4 py-3 pr-12 bg-agent-card border border-agent-border rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hints */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Lightbulb className="w-3 h-3" />
          <span>Try: "How many rows do I have?" or "Create a variance report"</span>
        </div>
      </div>
    </div>
  )
}

export default AgentChat
