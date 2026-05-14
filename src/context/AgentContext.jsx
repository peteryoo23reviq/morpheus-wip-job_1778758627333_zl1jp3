import React, { createContext, useContext, useState, useCallback } from 'react'
import { analyzeFileStructure, suggestMappings, generateCombinedData } from '../utils/aiEngine'

const AgentContext = createContext()

export function AgentProvider({ children }) {
  // File storage
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [parsedData, setParsedData] = useState({}) // { fileId: { headers, rows, analysis } }
  
  // Mapping & Rules
  const [fieldMappings, setFieldMappings] = useState([]) // [{ sourceFile, sourceField, targetField, transform }]
  const [learnedRules, setLearnedRules] = useState([]) // Rules the agent has learned
  const [userCorrections, setUserCorrections] = useState([]) // User corrections for learning
  
  // Combined Data
  const [combinedData, setCombinedData] = useState(null)
  
  // Templates
  const [templates, setTemplates] = useState([])
  const [activeTemplate, setActiveTemplate] = useState(null)
  
  // Agent conversation
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'agent',
      content: "Hello! I'm your Financial Data Agent. I can help you combine data files, create mappings, and generate reports. Upload some files to get started, or ask me anything about financial data processing!",
      timestamp: new Date().toISOString()
    }
  ])

  // Add uploaded file
  const addFile = useCallback((file, data) => {
    const fileEntry = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type || getFileType(file.name),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'analyzing'
    }
    
    setUploadedFiles(prev => [...prev, fileEntry])
    
    // Analyze the file
    const analysis = analyzeFileStructure(data, fileEntry.name)
    
    setParsedData(prev => ({
      ...prev,
      [fileEntry.id]: {
        headers: data.headers || Object.keys(data[0] || {}),
        rows: data.rows || data,
        analysis,
        rawData: data
      }
    }))
    
    // Update file status
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileEntry.id ? { ...f, status: 'ready', rowCount: (data.rows || data).length } : f)
    )
    
    return fileEntry.id
  }, [])

  // Remove file
  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    setParsedData(prev => {
      const newData = { ...prev }
      delete newData[fileId]
      return newData
    })
    setFieldMappings(prev => prev.filter(m => m.sourceFileId !== fileId))
  }, [])

  // Add field mapping
  const addMapping = useCallback((mapping) => {
    setFieldMappings(prev => [...prev, { ...mapping, id: `map_${Date.now()}` }])
  }, [])

  // Update mapping
  const updateMapping = useCallback((mappingId, updates) => {
    setFieldMappings(prev => 
      prev.map(m => m.id === mappingId ? { ...m, ...updates } : m)
    )
  }, [])

  // Remove mapping
  const removeMapping = useCallback((mappingId) => {
    setFieldMappings(prev => prev.filter(m => m.id !== mappingId))
  }, [])

  // Learn from user correction
  const learnFromCorrection = useCallback((correction) => {
    setUserCorrections(prev => [...prev, correction])
    
    // Create a rule from the correction
    const newRule = {
      id: `rule_${Date.now()}`,
      type: correction.type,
      condition: correction.condition,
      action: correction.action,
      confidence: 0.8,
      createdAt: new Date().toISOString(),
      usageCount: 0
    }
    
    setLearnedRules(prev => [...prev, newRule])
    
    return newRule
  }, [])

  // Generate combined dataset
  const combineData = useCallback(() => {
    const combined = generateCombinedData(parsedData, fieldMappings, learnedRules)
    setCombinedData(combined)
    return combined
  }, [parsedData, fieldMappings, learnedRules])

  // Add chat message
  const addChatMessage = useCallback((role, content) => {
    setChatHistory(prev => [...prev, {
      role,
      content,
      timestamp: new Date().toISOString()
    }])
  }, [])

  // Save template
  const saveTemplate = useCallback((template) => {
    const templateEntry = {
      ...template,
      id: template.id || `template_${Date.now()}`,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setTemplates(prev => {
      const existing = prev.findIndex(t => t.id === templateEntry.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = templateEntry
        return updated
      }
      return [...prev, templateEntry]
    })
    
    return templateEntry
  }, [])

  // Delete template
  const deleteTemplate = useCallback((templateId) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }, [])

  // Get AI suggestions for mappings
  const getAIMappingSuggestions = useCallback(() => {
    return suggestMappings(parsedData, learnedRules, userCorrections)
  }, [parsedData, learnedRules, userCorrections])

  const value = {
    // State
    uploadedFiles,
    parsedData,
    fieldMappings,
    learnedRules,
    combinedData,
    templates,
    activeTemplate,
    chatHistory,
    
    // Actions
    addFile,
    removeFile,
    addMapping,
    updateMapping,
    removeMapping,
    learnFromCorrection,
    combineData,
    addChatMessage,
    saveTemplate,
    deleteTemplate,
    setActiveTemplate,
    getAIMappingSuggestions,
    setLearnedRules
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const types = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    json: 'application/json'
  }
  return types[ext] || 'text/plain'
}
