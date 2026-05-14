import React, { useState } from 'react'
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Save,
  X,
  Lightbulb,
  ArrowRight,
  Zap,
  History,
  Brain
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'

const ruleTypes = [
  { value: 'mapping_preference', label: 'Field Mapping', description: 'How fields should be matched' },
  { value: 'transform_rule', label: 'Data Transform', description: 'How to convert values' },
  { value: 'validation_rule', label: 'Validation', description: 'Data quality checks' },
  { value: 'naming_convention', label: 'Naming Convention', description: 'Field naming standards' },
]

function RulesManager() {
  const { learnedRules, setLearnedRules, learnFromCorrection } = useAgent()
  const [showAddRule, setShowAddRule] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [newRule, setNewRule] = useState({
    type: 'mapping_preference',
    condition: { sourceField: '', pattern: '' },
    action: { targetField: '', transform: '' },
    description: ''
  })

  const handleAddRule = () => {
    const rule = learnFromCorrection({
      type: newRule.type,
      condition: newRule.condition,
      action: newRule.action,
      description: newRule.description
    })
    
    setShowAddRule(false)
    setNewRule({
      type: 'mapping_preference',
      condition: { sourceField: '', pattern: '' },
      action: { targetField: '', transform: '' },
      description: ''
    })
  }

  const handleDeleteRule = (ruleId) => {
    setLearnedRules(prev => prev.filter(r => r.id !== ruleId))
  }

  const handleUpdateRule = (rule) => {
    setLearnedRules(prev => prev.map(r => r.id === rule.id ? rule : r))
    setEditingRule(null)
  }

  const getRuleTypeInfo = (type) => {
    return ruleTypes.find(t => t.value === type) || { label: type, description: '' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Learned Rules
          </h2>
          <p className="text-gray-400 mt-1">
            These are the patterns and preferences I've learned from your interactions.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4" />
          Teach New Rule
        </button>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{learnedRules.length}</div>
              <div className="text-sm text-gray-400">Total Rules</div>
            </div>
          </div>
        </div>
        
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {learnedRules.filter(r => r.type === 'mapping_preference').length}
              </div>
              <div className="text-sm text-gray-400">Mapping Rules</div>
            </div>
          </div>
        </div>
        
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ArrowRight className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {learnedRules.filter(r => r.type === 'transform_rule').length}
              </div>
              <div className="text-sm text-gray-400">Transform Rules</div>
            </div>
          </div>
        </div>
        
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <History className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {learnedRules.reduce((sum, r) => sum + (r.usageCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Times Applied</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {learnedRules.length > 0 ? (
        <div className="space-y-3">
          {learnedRules.map(rule => {
            const typeInfo = getRuleTypeInfo(rule.type)
            
            return (
              <div key={rule.id} className="bg-agent-card border border-agent-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm">
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(rule.createdAt).toLocaleDateString()}
                      </span>
                      {rule.usageCount > 0 && (
                        <span className="text-xs text-green-400">
                          Used {rule.usageCount} times
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">When:</span>
                        <span className="text-white font-mono bg-agent-bg px-2 py-1 rounded">
                          {rule.condition?.sourceField || rule.condition?.pattern || 'any'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Then:</span>
                        <span className="text-white font-mono bg-agent-bg px-2 py-1 rounded">
                          {rule.action?.targetField || rule.action?.transform || 'apply'}
                        </span>
                      </div>
                    </div>
                    
                    {rule.description && (
                      <p className="text-sm text-gray-400 mt-2">{rule.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <div className="w-20 h-1.5 bg-agent-bg rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${(rule.confidence || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {((rule.confidence || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-8 text-center">
          <Lightbulb className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Rules Learned Yet</h3>
          <p className="text-gray-400 mb-4">
            I'll learn from your interactions! When you create mappings, correct suggestions, 
            or set preferences, I'll remember them for next time.
          </p>
          <p className="text-sm text-gray-500">
            You can also teach me rules directly by clicking "Teach New Rule" above.
          </p>
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {(showAddRule || editingRule) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-agent-card border border-agent-border rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-agent-border">
              <h3 className="text-white font-medium">
                {editingRule ? 'Edit Rule' : 'Teach New Rule'}
              </h3>
              <button
                onClick={() => {
                  setShowAddRule(false)
                  setEditingRule(null)
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Rule Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rule Type</label>
                <select
                  value={editingRule?.type || newRule.type}
                  onChange={(e) => editingRule 
                    ? setEditingRule(prev => ({ ...prev, type: e.target.value }))
                    : setNewRule(prev => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white"
                >
                  {ruleTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">When (Condition)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingRule?.condition?.sourceField || newRule.condition.sourceField}
                    onChange={(e) => editingRule
                      ? setEditingRule(prev => ({ ...prev, condition: { ...prev.condition, sourceField: e.target.value } }))
                      : setNewRule(prev => ({ ...prev, condition: { ...prev.condition, sourceField: e.target.value } }))
                    }
                    placeholder="Field name or pattern..."
                    className="flex-1 px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white placeholder-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">e.g., "Revenue", "GL_*", "date fields"</p>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Then (Action)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingRule?.action?.targetField || newRule.action.targetField}
                    onChange={(e) => editingRule
                      ? setEditingRule(prev => ({ ...prev, action: { ...prev.action, targetField: e.target.value } }))
                      : setNewRule(prev => ({ ...prev, action: { ...prev.action, targetField: e.target.value } }))
                    }
                    placeholder="Target field or action..."
                    className="flex-1 px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white placeholder-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">e.g., "sales_amount", "standardize dates", "uppercase"</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                <textarea
                  value={editingRule?.description || newRule.description}
                  onChange={(e) => editingRule
                    ? setEditingRule(prev => ({ ...prev, description: e.target.value }))
                    : setNewRule(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe what this rule does..."
                  className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white placeholder-gray-500 resize-none"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-agent-border">
              <button
                onClick={() => {
                  setShowAddRule(false)
                  setEditingRule(null)
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => editingRule ? handleUpdateRule(editingRule) : handleAddRule()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                {editingRule ? 'Update Rule' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RulesManager
