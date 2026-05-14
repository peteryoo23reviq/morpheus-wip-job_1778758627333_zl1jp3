import React, { useState, useEffect } from 'react'
import { 
  GitMerge, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  X, 
  Check,
  Lightbulb,
  RefreshCw,
  Trash2,
  Edit2,
  Save
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'

const transformOptions = [
  { value: 'direct', label: 'Direct (no change)' },
  { value: 'parse_number', label: 'Parse as Number' },
  { value: 'to_string', label: 'Convert to Text' },
  { value: 'date_format', label: 'Standardize Date' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'trim', label: 'Trim Whitespace' },
]

function MappingStudio({ setIsAgentThinking }) {
  const { 
    uploadedFiles, 
    parsedData, 
    fieldMappings, 
    addMapping, 
    updateMapping, 
    removeMapping,
    getAIMappingSuggestions,
    learnFromCorrection
  } = useAgent()
  
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editingMapping, setEditingMapping] = useState(null)
  const [newMapping, setNewMapping] = useState({
    sourceFileId: '',
    sourceField: '',
    targetField: '',
    transform: { type: 'direct' }
  })

  const generateSuggestions = () => {
    setIsAgentThinking(true)
    setTimeout(() => {
      const newSuggestions = getAIMappingSuggestions()
      setSuggestions(newSuggestions)
      setShowSuggestions(true)
      setIsAgentThinking(false)
    }, 500)
  }

  const applySuggestion = (suggestion) => {
    addMapping({
      sourceFileId: suggestion.sourceFileId,
      sourceField: suggestion.sourceField,
      targetField: suggestion.targetField,
      transform: suggestion.suggestedTransform,
      confidence: suggestion.confidence,
      isAISuggested: true
    })
    
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => 
      !(s.sourceFileId === suggestion.sourceFileId && s.sourceField === suggestion.sourceField)
    ))
  }

  const applyAllSuggestions = () => {
    suggestions.forEach(s => applySuggestion(s))
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleAddMapping = () => {
    if (newMapping.sourceFileId && newMapping.sourceField && newMapping.targetField) {
      addMapping(newMapping)
      
      // Learn from this user action
      learnFromCorrection({
        type: 'mapping_preference',
        condition: { 
          sourceField: newMapping.sourceField 
        },
        action: { 
          targetField: newMapping.targetField,
          transform: newMapping.transform 
        }
      })
      
      setNewMapping({
        sourceFileId: '',
        sourceField: '',
        targetField: '',
        transform: { type: 'direct' }
      })
    }
  }

  const getFieldsForFile = (fileId) => {
    const data = parsedData[fileId]
    return data?.headers || []
  }

  if (uploadedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <GitMerge className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No Files to Map</h3>
        <p className="text-gray-400">Upload some files first, then I'll help you create field mappings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mapping Studio</h2>
          <p className="text-gray-400 mt-1">
            Define how fields from different files should be combined.
          </p>
        </div>
        
        <button
          onClick={generateSuggestions}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          AI Suggestions
        </button>
      </div>

      {/* AI Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-blue-300 font-medium flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI-Suggested Mappings ({suggestions.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={applyAllSuggestions}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Apply All
              </button>
              <button
                onClick={() => setShowSuggestions(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between bg-agent-bg/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-400">
                      {uploadedFiles.find(f => f.id === suggestion.sourceFileId)?.name}:
                    </span>
                    <span className="text-white font-medium ml-1">{suggestion.sourceField}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{suggestion.targetField}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    suggestion.confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
                    suggestion.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {(suggestion.confidence * 100).toFixed(0)}% match
                  </span>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="p-1.5 bg-blue-600 rounded hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Mappings */}
      <div className="bg-agent-card border border-agent-border rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">
          Active Mappings ({fieldMappings.length})
        </h3>
        
        {fieldMappings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <GitMerge className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No mappings defined yet.</p>
            <p className="text-sm">Click "AI Suggestions" or add mappings manually below.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fieldMappings.map(mapping => (
              <div 
                key={mapping.id}
                className="flex items-center justify-between bg-agent-bg rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-400">
                      {uploadedFiles.find(f => f.id === mapping.sourceFileId)?.name || 'Unknown'}:
                    </span>
                    <span className="text-white font-medium ml-1">{mapping.sourceField}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{mapping.targetField}</span>
                  {mapping.transform?.type !== 'direct' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      {mapping.transform?.type}
                    </span>
                  )}
                  {mapping.isAISuggested && (
                    <Sparkles className="w-4 h-4 text-blue-400" title="AI Suggested" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingMapping(mapping)}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeMapping(mapping.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Mapping */}
      <div className="bg-agent-card border border-agent-border rounded-lg p-4">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Manual Mapping
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Source File */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source File</label>
            <select
              value={newMapping.sourceFileId}
              onChange={(e) => setNewMapping(prev => ({ ...prev, sourceFileId: e.target.value, sourceField: '' }))}
              className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select file...</option>
              {uploadedFiles.map(file => (
                <option key={file.id} value={file.id}>{file.name}</option>
              ))}
            </select>
          </div>

          {/* Source Field */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source Field</label>
            <select
              value={newMapping.sourceField}
              onChange={(e) => setNewMapping(prev => ({ ...prev, sourceField: e.target.value }))}
              className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={!newMapping.sourceFileId}
            >
              <option value="">Select field...</option>
              {getFieldsForFile(newMapping.sourceFileId).map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>

          {/* Target Field */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target Field Name</label>
            <input
              type="text"
              value={newMapping.targetField}
              onChange={(e) => setNewMapping(prev => ({ ...prev, targetField: e.target.value }))}
              placeholder="e.g., revenue_amount"
              className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Transform */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Transform</label>
            <div className="flex gap-2">
              <select
                value={newMapping.transform?.type || 'direct'}
                onChange={(e) => setNewMapping(prev => ({ ...prev, transform: { type: e.target.value } }))}
                className="flex-1 px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {transformOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleAddMapping}
                disabled={!newMapping.sourceFileId || !newMapping.sourceField || !newMapping.targetField}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mapping Modal */}
      {editingMapping && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-agent-card border border-agent-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white font-medium mb-4">Edit Mapping</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Target Field Name</label>
                <input
                  type="text"
                  value={editingMapping.targetField}
                  onChange={(e) => setEditingMapping(prev => ({ ...prev, targetField: e.target.value }))}
                  className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Transform</label>
                <select
                  value={editingMapping.transform?.type || 'direct'}
                  onChange={(e) => setEditingMapping(prev => ({ ...prev, transform: { type: e.target.value } }))}
                  className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white"
                >
                  {transformOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingMapping(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateMapping(editingMapping.id, editingMapping)
                  setEditingMapping(null)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MappingStudio
