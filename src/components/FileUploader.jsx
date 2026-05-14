import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, FileJson, FileText, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useAgent } from '../context/AgentContext'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

function FileUploader({ setIsAgentThinking }) {
  const { addFile, uploadedFiles, removeFile, parsedData } = useAgent()
  const [processing, setProcessing] = useState({})

  const parseFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    
    return new Promise((resolve, reject) => {
      if (ext === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve({
              headers: results.meta.fields,
              rows: results.data
            })
          },
          error: reject
        })
      } else if (ext === 'json') {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            const rows = Array.isArray(data) ? data : [data]
            const headers = Object.keys(rows[0] || {})
            resolve({ headers, rows })
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsText(file)
      } else if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'array' })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const data = XLSX.utils.sheet_to_json(firstSheet)
            const headers = Object.keys(data[0] || {})
            resolve({ headers, rows: data })
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      } else {
        reject(new Error('Unsupported file type'))
      }
    })
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      setProcessing(prev => ({ ...prev, [file.name]: true }))
      setIsAgentThinking(true)
      
      try {
        const data = await parseFile(file)
        addFile(file, data)
      } catch (err) {
        console.error('Error parsing file:', err)
      } finally {
        setProcessing(prev => ({ ...prev, [file.name]: false }))
        setIsAgentThinking(false)
      }
    }
  }, [addFile, setIsAgentThinking])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json']
    }
  })

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    switch (ext) {
      case 'csv': return <FileText className="w-5 h-5 text-green-400" />
      case 'xlsx':
      case 'xls': return <FileSpreadsheet className="w-5 h-5 text-blue-400" />
      case 'json': return <FileJson className="w-5 h-5 text-yellow-400" />
      default: return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Upload Financial Data Files</h2>
        <p className="text-gray-400 mt-1">
          Upload CSV, Excel, or JSON files. I'll analyze the structure and help you combine them.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-agent-border hover:border-blue-500/50 hover:bg-agent-card'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-400' : 'text-gray-500'}`} />
        {isDragActive ? (
          <p className="text-blue-400 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-white font-medium">Drag & drop files here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse</p>
          </>
        )}
        <div className="flex justify-center gap-4 mt-4">
          <span className="text-xs text-gray-500 bg-agent-card px-2 py-1 rounded">CSV</span>
          <span className="text-xs text-gray-500 bg-agent-card px-2 py-1 rounded">Excel (.xlsx)</span>
          <span className="text-xs text-gray-500 bg-agent-card px-2 py-1 rounded">JSON</span>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Uploaded Files ({uploadedFiles.length})</h3>
          
          <div className="space-y-2">
            {uploadedFiles.map(file => {
              const data = parsedData[file.id]
              const isAnalyzing = file.status === 'analyzing' || processing[file.name]
              
              return (
                <div 
                  key={file.id}
                  className="bg-agent-card border border-agent-border rounded-lg p-4 animate-slide-up"
                >
                  <div className="flex items-center gap-4">
                    {getFileIcon(file.name)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium truncate">{file.name}</h4>
                        {isAnalyzing ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : file.status === 'ready' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        {data && (
                          <>
                            <span>•</span>
                            <span>{data.rows.length.toLocaleString()} rows</span>
                            <span>•</span>
                            <span>{data.headers.length} columns</span>
                          </>
                        )}
                        {data?.analysis?.suggestedType && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">{data.analysis.suggestedType}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Data Quality Indicator */}
                    {data?.analysis?.dataQuality && (
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Quality</div>
                          <div className={`text-sm font-medium ${
                            parseFloat(data.analysis.dataQuality.completeness) > 80 
                              ? 'text-green-400' 
                              : parseFloat(data.analysis.dataQuality.completeness) > 50 
                                ? 'text-yellow-400' 
                                : 'text-red-400'
                          }`}>
                            {data.analysis.dataQuality.completeness}%
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Field Preview */}
                  {data && (
                    <div className="mt-3 pt-3 border-t border-agent-border">
                      <div className="flex flex-wrap gap-2">
                        {data.headers.slice(0, 8).map((header, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-1 rounded bg-agent-border text-gray-300"
                            title={data.analysis?.fields?.[header]?.semanticType || 'unknown'}
                          >
                            {header}
                            {data.analysis?.fields?.[header]?.semanticType !== 'unknown' && (
                              <span className="ml-1 text-blue-400">
                                ({data.analysis.fields[header].semanticType})
                              </span>
                            )}
                          </span>
                        ))}
                        {data.headers.length > 8 && (
                          <span className="text-xs px-2 py-1 text-gray-500">
                            +{data.headers.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">💡 Tips for best results</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Use descriptive column headers (e.g., "Revenue_Amount" instead of "Col1")</li>
          <li>• Ensure dates are in a consistent format across files</li>
          <li>• Include common key fields (like Account Code or Date) for joining data</li>
        </ul>
      </div>
    </div>
  )
}

export default FileUploader
