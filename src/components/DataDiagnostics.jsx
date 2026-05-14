import React, { useState } from 'react'
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Database,
  Hash,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Percent,
  Globe,
  Building
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'

const typeIcons = {
  date: Calendar,
  amount: DollarSign,
  account: Hash,
  category: Tag,
  description: FileText,
  identifier: Hash,
  percentage: Percent,
  currency: DollarSign,
  entity: Building,
  region: Globe,
  unknown: Database
}

function DataDiagnostics({ setIsAgentThinking }) {
  const { uploadedFiles, parsedData } = useAgent()
  const [expandedFile, setExpandedFile] = useState(null)
  const [expandedFields, setExpandedFields] = useState({})

  if (uploadedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Database className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No Files to Analyze</h3>
        <p className="text-gray-400">Upload some financial data files to see their diagnostics.</p>
      </div>
    )
  }

  const toggleField = (fileId, field) => {
    const key = `${fileId}_${field}`
    setExpandedFields(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getQualityColor = (value) => {
    const num = parseFloat(value)
    if (num >= 90) return 'text-green-400'
    if (num >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getQualityBg = (value) => {
    const num = parseFloat(value)
    if (num >= 90) return 'bg-green-500'
    if (num >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Data Diagnostics</h2>
        <p className="text-gray-400 mt-1">
          Detailed analysis of your uploaded files. I've identified field types and data quality metrics.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Files</div>
          <div className="text-2xl font-bold text-white">{uploadedFiles.length}</div>
        </div>
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Rows</div>
          <div className="text-2xl font-bold text-white">
            {Object.values(parsedData).reduce((sum, f) => sum + f.rows.length, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Fields</div>
          <div className="text-2xl font-bold text-white">
            {Object.values(parsedData).reduce((sum, f) => sum + f.headers.length, 0)}
          </div>
        </div>
        <div className="bg-agent-card border border-agent-border rounded-lg p-4">
          <div className="text-gray-400 text-sm">Detected Patterns</div>
          <div className="text-2xl font-bold text-white">
            {Object.values(parsedData).reduce((sum, f) => sum + (f.analysis?.detectedPatterns?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* File Analysis */}
      <div className="space-y-4">
        {uploadedFiles.map(file => {
          const data = parsedData[file.id]
          if (!data) return null
          
          const { analysis } = data
          const isExpanded = expandedFile === file.id

          return (
            <div key={file.id} className="bg-agent-card border border-agent-border rounded-lg overflow-hidden">
              {/* File Header */}
              <button
                onClick={() => setExpandedFile(isExpanded ? null : file.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-agent-border/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-left">{file.name}</h3>
                    <p className="text-sm text-gray-400">
                      {analysis?.suggestedType} • {data.rows.length.toLocaleString()} rows • {data.headers.length} fields
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Data Quality Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Quality</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-12 h-2 rounded-full bg-agent-border overflow-hidden`}>
                        <div 
                          className={`h-full ${getQualityBg(analysis?.dataQuality?.completeness)}`}
                          style={{ width: `${analysis?.dataQuality?.completeness}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getQualityColor(analysis?.dataQuality?.completeness)}`}>
                        {analysis?.dataQuality?.completeness}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-agent-border animate-slide-up">
                  {/* Data Quality Issues */}
                  {analysis?.dataQuality?.issues?.length > 0 && (
                    <div className="px-4 py-3 bg-yellow-900/20 border-b border-agent-border">
                      <h4 className="text-yellow-400 font-medium flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Data Quality Issues
                      </h4>
                      <div className="space-y-1">
                        {analysis.dataQuality.issues.map((issue, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                            <span className={`w-2 h-2 rounded-full ${
                              issue.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                            }`} />
                            {issue.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detected Patterns */}
                  {analysis?.detectedPatterns?.length > 0 && (
                    <div className="px-4 py-3 bg-blue-900/20 border-b border-agent-border">
                      <h4 className="text-blue-400 font-medium flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        Detected Patterns
                      </h4>
                      <div className="space-y-2">
                        {analysis.detectedPatterns.map((pattern, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                            <div>
                              <span className="text-white font-medium">{pattern.type}</span>
                              <span className="text-gray-400"> - {pattern.description}</span>
                              <span className="text-blue-400 ml-2">({(pattern.confidence * 100).toFixed(0)}% confidence)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field Details */}
                  <div className="px-4 py-3">
                    <h4 className="text-white font-medium mb-3">Field Analysis</h4>
                    <div className="space-y-2">
                      {Object.entries(analysis?.fields || {}).map(([fieldName, fieldInfo]) => {
                        const Icon = typeIcons[fieldInfo.semanticType] || Database
                        const fieldKey = `${file.id}_${fieldName}`
                        const isFieldExpanded = expandedFields[fieldKey]

                        return (
                          <div key={fieldName} className="border border-agent-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleField(file.id, fieldName)}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-agent-border/30"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4 text-blue-400" />
                                <span className="text-white">{fieldName}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-agent-border text-gray-300">
                                  {fieldInfo.semanticType}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {fieldInfo.dataType}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm ${getQualityColor(fieldInfo.completeness)}`}>
                                  {fieldInfo.completeness}% complete
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isFieldExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {isFieldExpanded && (
                              <div className="px-3 py-2 bg-agent-bg border-t border-agent-border text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-gray-400">Unique values:</span>
                                    <span className="text-white ml-2">{fieldInfo.uniqueCount.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Non-empty:</span>
                                    <span className="text-white ml-2">{fieldInfo.nonEmptyCount.toLocaleString()} / {fieldInfo.totalCount.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Confidence:</span>
                                    <span className="text-white ml-2">{(fieldInfo.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Cardinality:</span>
                                    <span className="text-white ml-2">{(fieldInfo.cardinality * 100).toFixed(1)}%</span>
                                  </div>
                                </div>
                                
                                {fieldInfo.statistics && (
                                  <div className="mt-2 pt-2 border-t border-agent-border">
                                    <span className="text-gray-400">Statistics:</span>
                                    <div className="grid grid-cols-4 gap-2 mt-1">
                                      <div className="text-center p-2 bg-agent-card rounded">
                                        <div className="text-xs text-gray-400">Min</div>
                                        <div className="text-white">{fieldInfo.statistics.min.toLocaleString()}</div>
                                      </div>
                                      <div className="text-center p-2 bg-agent-card rounded">
                                        <div className="text-xs text-gray-400">Max</div>
                                        <div className="text-white">{fieldInfo.statistics.max.toLocaleString()}</div>
                                      </div>
                                      <div className="text-center p-2 bg-agent-card rounded">
                                        <div className="text-xs text-gray-400">Avg</div>
                                        <div className="text-white">{fieldInfo.statistics.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                      </div>
                                      <div className="text-center p-2 bg-agent-card rounded">
                                        <div className="text-xs text-gray-400">Sum</div>
                                        <div className="text-white">{fieldInfo.statistics.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {fieldInfo.sampleValues?.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-agent-border">
                                    <span className="text-gray-400">Sample values:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {fieldInfo.sampleValues.map((val, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-agent-card rounded text-gray-300 text-xs">
                                          {String(val).substring(0, 30)}{String(val).length > 30 ? '...' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DataDiagnostics
