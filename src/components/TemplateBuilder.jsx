import React, { useState } from 'react'
import { 
  FileSpreadsheet, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Copy,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  Table,
  Eye,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'
import * as XLSX from 'xlsx'

const templateTypes = [
  { id: 'variance', name: 'Variance Report', icon: BarChart3, description: 'Compare actuals vs budget/forecast' },
  { id: 'trend', name: 'Trend Analysis', icon: TrendingUp, description: 'Time-series analysis of metrics' },
  { id: 'pnl', name: 'P&L Summary', icon: DollarSign, description: 'Profit and loss statement' },
  { id: 'summary', name: 'Data Summary', icon: Table, description: 'Overview of all data' },
  { id: 'custom', name: 'Custom Template', icon: FileSpreadsheet, description: 'Build your own template' },
]

const aggregationOptions = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'first', label: 'First Value' },
  { value: 'last', label: 'Last Value' },
]

function TemplateBuilder({ setIsAgentThinking }) {
  const { templates, saveTemplate, deleteTemplate, combinedData, parsedData } = useAgent()
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  
  const [templateConfig, setTemplateConfig] = useState({
    name: '',
    type: '',
    description: '',
    columns: [],
    groupBy: [],
    filters: [],
    sortBy: null,
    calculations: []
  })

  const availableFields = combinedData?.headers || 
    Object.values(parsedData).flatMap(d => d.headers).filter((v, i, a) => a.indexOf(v) === i)

  const handleSelectType = (type) => {
    setSelectedType(type)
    
    // Pre-configure based on type
    let preConfig = {
      name: type.name,
      type: type.id,
      description: type.description,
      columns: [],
      groupBy: [],
      filters: [],
      calculations: []
    }
    
    // Auto-suggest columns based on template type
    if (type.id === 'variance' && combinedData) {
      const amountFields = combinedData.headers.filter(h => 
        /amount|total|value|actual|budget|forecast/i.test(h)
      )
      preConfig.columns = amountFields.slice(0, 5)
    } else if (type.id === 'trend' && combinedData) {
      const dateFields = combinedData.headers.filter(h => /date|period|month|year/i.test(h))
      const amountFields = combinedData.headers.filter(h => /amount|total|value/i.test(h))
      preConfig.columns = [...dateFields.slice(0, 1), ...amountFields.slice(0, 3)]
      preConfig.groupBy = dateFields.slice(0, 1)
    } else if (type.id === 'pnl' && combinedData) {
      const categoryFields = combinedData.headers.filter(h => /category|account|type|description/i.test(h))
      const amountFields = combinedData.headers.filter(h => /amount|total|value|revenue|expense|cost/i.test(h))
      preConfig.columns = [...categoryFields.slice(0, 2), ...amountFields.slice(0, 3)]
    }
    
    setTemplateConfig(preConfig)
  }

  const handleAddColumn = (field) => {
    if (!templateConfig.columns.includes(field)) {
      setTemplateConfig(prev => ({
        ...prev,
        columns: [...prev.columns, field]
      }))
    }
  }

  const handleRemoveColumn = (field) => {
    setTemplateConfig(prev => ({
      ...prev,
      columns: prev.columns.filter(c => c !== field)
    }))
  }

  const handleAddCalculation = () => {
    setTemplateConfig(prev => ({
      ...prev,
      calculations: [...prev.calculations, { name: '', formula: '', sourceFields: [] }]
    }))
  }

  const handleSaveTemplate = () => {
    const template = {
      ...templateConfig,
      id: editingTemplate?.id || undefined
    }
    saveTemplate(template)
    setShowNewTemplate(false)
    setSelectedType(null)
    setEditingTemplate(null)
    setTemplateConfig({
      name: '',
      type: '',
      description: '',
      columns: [],
      groupBy: [],
      filters: [],
      calculations: []
    })
  }

  const generateReport = (template) => {
    if (!combinedData) return null
    
    let data = [...combinedData.rows]
    
    // Apply filters
    template.filters?.forEach(filter => {
      data = data.filter(row => {
        const value = row[filter.field]
        switch (filter.operator) {
          case 'equals': return value === filter.value
          case 'contains': return String(value).includes(filter.value)
          case 'greater': return parseFloat(value) > parseFloat(filter.value)
          case 'less': return parseFloat(value) < parseFloat(filter.value)
          default: return true
        }
      })
    })
    
    // Group data if needed
    if (template.groupBy?.length > 0) {
      const grouped = {}
      data.forEach(row => {
        const key = template.groupBy.map(g => row[g]).join('|')
        if (!grouped[key]) {
          grouped[key] = { rows: [], key: {} }
          template.groupBy.forEach(g => grouped[key].key[g] = row[g])
        }
        grouped[key].rows.push(row)
      })
      
      // Aggregate
      data = Object.values(grouped).map(group => {
        const result = { ...group.key }
        template.columns.filter(c => !template.groupBy.includes(c)).forEach(col => {
          const values = group.rows.map(r => parseFloat(r[col])).filter(n => !isNaN(n))
          result[col] = values.reduce((a, b) => a + b, 0) // Default to sum
        })
        return result
      })
    }
    
    // Select only template columns
    const finalData = data.map(row => {
      const filtered = {}
      template.columns.forEach(col => {
        filtered[col] = row[col]
      })
      
      // Add calculated fields
      template.calculations?.forEach(calc => {
        if (calc.formula === 'variance' && calc.sourceFields.length === 2) {
          const a = parseFloat(row[calc.sourceFields[0]]) || 0
          const b = parseFloat(row[calc.sourceFields[1]]) || 0
          filtered[calc.name] = a - b
        } else if (calc.formula === 'percentage' && calc.sourceFields.length === 2) {
          const a = parseFloat(row[calc.sourceFields[0]]) || 0
          const b = parseFloat(row[calc.sourceFields[1]]) || 1
          filtered[calc.name] = ((a / b) * 100).toFixed(2) + '%'
        }
      })
      
      return filtered
    })
    
    return finalData
  }

  const downloadReport = (template, format) => {
    const data = generateReport(template)
    if (!data) return
    
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, template.name)
      XLSX.writeFile(wb, `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
    }
  }

  const handlePreview = (template) => {
    const data = generateReport(template)
    setPreviewTemplate({ ...template, previewData: data })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Report Templates</h2>
          <p className="text-gray-400 mt-1">
            Create reusable templates for your financial reports.
          </p>
        </div>
        
        <button
          onClick={() => setShowNewTemplate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Existing Templates */}
      {templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => {
            const TypeIcon = templateTypes.find(t => t.id === template.type)?.icon || FileSpreadsheet
            
            return (
              <div key={template.id} className="bg-agent-card border border-agent-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TypeIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{template.name}</h3>
                      <p className="text-xs text-gray-400">{template.type}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                
                <div className="text-xs text-gray-500 mb-3">
                  {template.columns?.length || 0} columns
                  {template.calculations?.length > 0 && ` • ${template.calculations.length} calculations`}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-agent-border text-white text-sm rounded hover:bg-agent-border/80"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => downloadReport(template, 'xlsx')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setTemplateConfig(template)
                      setSelectedType(templateTypes.find(t => t.id === template.type))
                      setShowNewTemplate(true)
                    }}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 && !showNewTemplate && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSpreadsheet className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Templates Yet</h3>
          <p className="text-gray-400 mb-6">Create your first reporting template to get started.</p>
          <button
            onClick={() => setShowNewTemplate(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      )}

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-agent-card border border-agent-border rounded-lg w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-agent-border">
              <h3 className="text-white font-medium">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <button
                onClick={() => {
                  setShowNewTemplate(false)
                  setSelectedType(null)
                  setEditingTemplate(null)
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {!selectedType ? (
                // Template Type Selection
                <div>
                  <p className="text-gray-400 mb-4">Choose a template type:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templateTypes.map(type => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleSelectType(type)}
                          className="flex items-center gap-3 p-4 bg-agent-bg border border-agent-border rounded-lg hover:border-blue-500 text-left transition-colors"
                        >
                          <Icon className="w-8 h-8 text-blue-400" />
                          <div>
                            <div className="text-white font-medium">{type.name}</div>
                            <div className="text-sm text-gray-400">{type.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                // Template Configuration
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Template Name</label>
                      <input
                        type="text"
                        value={templateConfig.name}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white"
                        placeholder="My Report"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={templateConfig.description}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white"
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>

                  {/* Column Selection */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Columns</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {templateConfig.columns.map(col => (
                        <span
                          key={col}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm"
                        >
                          {col}
                          <button onClick={() => handleRemoveColumn(col)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 bg-agent-bg rounded-lg max-h-32 overflow-y-auto">
                      {availableFields.filter(f => !templateConfig.columns.includes(f)).map(field => (
                        <button
                          key={field}
                          onClick={() => handleAddColumn(field)}
                          className="px-2 py-1 bg-agent-border text-gray-300 rounded text-sm hover:bg-agent-border/80"
                        >
                          + {field}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Group By */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Group By (optional)</label>
                    <select
                      value={templateConfig.groupBy[0] || ''}
                      onChange={(e) => setTemplateConfig(prev => ({ 
                        ...prev, 
                        groupBy: e.target.value ? [e.target.value] : [] 
                      }))}
                      className="w-full px-3 py-2 bg-agent-bg border border-agent-border rounded-lg text-white"
                    >
                      <option value="">No grouping</option>
                      {templateConfig.columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Calculations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">Calculated Fields</label>
                      <button
                        onClick={handleAddCalculation}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        + Add Calculation
                      </button>
                    </div>
                    
                    {templateConfig.calculations.map((calc, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={calc.name}
                          onChange={(e) => {
                            const newCalcs = [...templateConfig.calculations]
                            newCalcs[idx].name = e.target.value
                            setTemplateConfig(prev => ({ ...prev, calculations: newCalcs }))
                          }}
                          placeholder="Field name"
                          className="flex-1 px-2 py-1 bg-agent-bg border border-agent-border rounded text-white text-sm"
                        />
                        <select
                          value={calc.formula}
                          onChange={(e) => {
                            const newCalcs = [...templateConfig.calculations]
                            newCalcs[idx].formula = e.target.value
                            setTemplateConfig(prev => ({ ...prev, calculations: newCalcs }))
                          }}
                          className="px-2 py-1 bg-agent-bg border border-agent-border rounded text-white text-sm"
                        >
                          <option value="">Formula...</option>
                          <option value="variance">Variance (A - B)</option>
                          <option value="percentage">Percentage (A / B)</option>
                        </select>
                        <button
                          onClick={() => {
                            const newCalcs = templateConfig.calculations.filter((_, i) => i !== idx)
                            setTemplateConfig(prev => ({ ...prev, calculations: newCalcs }))
                          }}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedType && (
              <div className="flex justify-between p-4 border-t border-agent-border">
                <button
                  onClick={() => setSelectedType(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateConfig.name || templateConfig.columns.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-agent-card border border-agent-border rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-agent-border flex-shrink-0">
              <h3 className="text-white font-medium">Preview: {previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {previewTemplate.previewData?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-agent-card">
                    <tr>
                      {Object.keys(previewTemplate.previewData[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left text-gray-400 font-medium border-b border-agent-border">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewTemplate.previewData.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="border-b border-agent-border">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-3 py-2 text-gray-300">
                            {val !== null && val !== undefined ? String(val) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No data to preview. Make sure you have combined data first.
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-4 border-t border-agent-border flex-shrink-0">
              <button
                onClick={() => downloadReport(previewTemplate, 'xlsx')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateBuilder
