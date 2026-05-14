// AI Engine for Financial Data Processing
// This handles field analysis, mapping suggestions, and learning

// Common financial field patterns
const FINANCIAL_PATTERNS = {
  date: {
    patterns: [/date/i, /period/i, /month/i, /year/i, /quarter/i, /fiscal/i, /^dt$/i, /timestamp/i],
    valuePatterns: [/^\d{4}-\d{2}-\d{2}/, /^\d{1,2}\/\d{1,2}\/\d{2,4}/, /^\d{8}$/]
  },
  amount: {
    patterns: [/amount/i, /total/i, /sum/i, /value/i, /price/i, /cost/i, /revenue/i, /sales/i, /profit/i, /margin/i, /balance/i, /^amt$/i],
    valuePatterns: [/^-?\$?[\d,]+\.?\d*$/, /^-?[\d,]+\.?\d*$/]
  },
  account: {
    patterns: [/account/i, /acct/i, /gl/i, /ledger/i, /code/i, /^acc$/i],
    valuePatterns: [/^\d{3,10}$/, /^[A-Z]{2,4}-?\d{3,8}$/]
  },
  category: {
    patterns: [/category/i, /type/i, /class/i, /segment/i, /division/i, /department/i, /dept/i, /group/i],
    valuePatterns: []
  },
  description: {
    patterns: [/description/i, /desc/i, /name/i, /memo/i, /note/i, /comment/i, /detail/i],
    valuePatterns: []
  },
  identifier: {
    patterns: [/id$/i, /^id/i, /number/i, /num/i, /ref/i, /code/i, /key/i],
    valuePatterns: [/^\d+$/, /^[A-Z0-9-]+$/i]
  },
  percentage: {
    patterns: [/percent/i, /pct/i, /rate/i, /ratio/i, /%/],
    valuePatterns: [/^\d+\.?\d*%?$/, /^0\.\d+$/]
  },
  currency: {
    patterns: [/currency/i, /curr/i, /ccy/i, /fx/i],
    valuePatterns: [/^[A-Z]{3}$/, /^USD|EUR|GBP|JPY|CAD$/i]
  },
  entity: {
    patterns: [/company/i, /entity/i, /org/i, /business/i, /unit/i, /subsidiary/i, /vendor/i, /customer/i, /client/i],
    valuePatterns: []
  },
  region: {
    patterns: [/region/i, /country/i, /state/i, /location/i, /geo/i, /territory/i, /market/i],
    valuePatterns: []
  }
}

// Analyze the structure of uploaded file data
export function analyzeFileStructure(data, filename) {
  const rows = data.rows || data
  const headers = data.headers || Object.keys(rows[0] || {})
  
  const analysis = {
    filename,
    totalRows: rows.length,
    totalColumns: headers.length,
    fields: {},
    dataQuality: {
      completeness: 0,
      consistency: 0,
      issues: []
    },
    suggestedType: detectFileType(filename, headers),
    detectedPatterns: []
  }
  
  // Analyze each field
  headers.forEach(header => {
    const fieldAnalysis = analyzeField(header, rows)
    analysis.fields[header] = fieldAnalysis
  })
  
  // Calculate data quality metrics
  analysis.dataQuality = calculateDataQuality(rows, headers, analysis.fields)
  
  // Detect overall patterns
  analysis.detectedPatterns = detectDataPatterns(analysis.fields)
  
  return analysis
}

function analyzeField(fieldName, rows) {
  const values = rows.map(row => row[fieldName]).filter(v => v !== null && v !== undefined && v !== '')
  const totalValues = rows.length
  const nonEmptyCount = values.length
  const uniqueValues = new Set(values)
  
  // Sample values for analysis
  const sampleValues = values.slice(0, 100)
  
  // Detect semantic type
  const semanticType = detectSemanticType(fieldName, sampleValues)
  
  // Detect data type
  const dataType = detectDataType(sampleValues)
  
  // Calculate statistics for numeric fields
  let statistics = null
  if (dataType === 'number') {
    const numericValues = sampleValues.map(v => parseFloat(String(v).replace(/[$,]/g, ''))).filter(n => !isNaN(n))
    if (numericValues.length > 0) {
      statistics = {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        sum: numericValues.reduce((a, b) => a + b, 0)
      }
    }
  }
  
  return {
    originalName: fieldName,
    normalizedName: normalizeFieldName(fieldName),
    semanticType,
    dataType,
    nonEmptyCount,
    totalCount: totalValues,
    completeness: (nonEmptyCount / totalValues * 100).toFixed(1),
    uniqueCount: uniqueValues.size,
    cardinality: uniqueValues.size / Math.max(nonEmptyCount, 1),
    sampleValues: sampleValues.slice(0, 5),
    statistics,
    confidence: calculateTypeConfidence(semanticType, fieldName, sampleValues)
  }
}

function detectSemanticType(fieldName, values) {
  const normalizedName = fieldName.toLowerCase().trim()
  
  // Check against patterns
  for (const [type, config] of Object.entries(FINANCIAL_PATTERNS)) {
    // Check field name patterns
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedName)) {
        return type
      }
    }
  }
  
  // Check value patterns if name didn't match
  for (const [type, config] of Object.entries(FINANCIAL_PATTERNS)) {
    if (config.valuePatterns.length > 0) {
      const matchCount = values.filter(v => 
        config.valuePatterns.some(p => p.test(String(v)))
      ).length
      
      if (matchCount > values.length * 0.5) {
        return type
      }
    }
  }
  
  return 'unknown'
}

function detectDataType(values) {
  if (values.length === 0) return 'unknown'
  
  const sample = values.slice(0, 50)
  
  // Check for numbers
  const numericCount = sample.filter(v => {
    const cleaned = String(v).replace(/[$,%-]/g, '').trim()
    return !isNaN(parseFloat(cleaned)) && isFinite(cleaned)
  }).length
  
  if (numericCount > sample.length * 0.8) return 'number'
  
  // Check for dates
  const dateCount = sample.filter(v => {
    const d = new Date(v)
    return !isNaN(d.getTime()) && String(v).length > 4
  }).length
  
  if (dateCount > sample.length * 0.8) return 'date'
  
  // Check for booleans
  const boolCount = sample.filter(v => 
    ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(String(v).toLowerCase())
  ).length
  
  if (boolCount > sample.length * 0.8) return 'boolean'
  
  return 'string'
}

function normalizeFieldName(fieldName) {
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function calculateTypeConfidence(type, fieldName, values) {
  let confidence = 0.5 // Base confidence
  
  if (type !== 'unknown') {
    // Boost confidence if field name matches pattern
    const config = FINANCIAL_PATTERNS[type]
    if (config) {
      for (const pattern of config.patterns) {
        if (pattern.test(fieldName)) {
          confidence += 0.3
          break
        }
      }
      
      // Boost if values match patterns
      if (config.valuePatterns.length > 0) {
        const matchRate = values.filter(v => 
          config.valuePatterns.some(p => p.test(String(v)))
        ).length / Math.max(values.length, 1)
        
        confidence += matchRate * 0.2
      }
    }
  }
  
  return Math.min(confidence, 1.0)
}

function calculateDataQuality(rows, headers, fields) {
  const issues = []
  let completeness = 0
  let consistency = 0
  
  // Calculate completeness
  let totalCells = rows.length * headers.length
  let filledCells = 0
  
  rows.forEach(row => {
    headers.forEach(h => {
      if (row[h] !== null && row[h] !== undefined && row[h] !== '') {
        filledCells++
      }
    })
  })
  
  completeness = (filledCells / totalCells * 100).toFixed(1)
  
  // Check for issues
  headers.forEach(header => {
    const field = fields[header]
    
    if (parseFloat(field.completeness) < 50) {
      issues.push({
        type: 'missing_data',
        field: header,
        severity: 'warning',
        message: `Field "${header}" is ${field.completeness}% complete`
      })
    }
    
    if (field.cardinality === 1 && field.uniqueCount === 1) {
      issues.push({
        type: 'constant_value',
        field: header,
        severity: 'info',
        message: `Field "${header}" has only one unique value`
      })
    }
  })
  
  // Calculate consistency based on type detection confidence
  const avgConfidence = Object.values(fields).reduce((sum, f) => sum + f.confidence, 0) / headers.length
  consistency = (avgConfidence * 100).toFixed(1)
  
  return { completeness, consistency, issues }
}

function detectDataPatterns(fields) {
  const patterns = []
  const fieldTypes = Object.entries(fields).map(([name, info]) => ({ name, ...info }))
  
  // Check for time series data
  const dateFields = fieldTypes.filter(f => f.semanticType === 'date')
  const amountFields = fieldTypes.filter(f => f.semanticType === 'amount')
  
  if (dateFields.length > 0 && amountFields.length > 0) {
    patterns.push({
      type: 'time_series',
      description: 'Data appears to be time-series financial data',
      confidence: 0.8,
      relevantFields: [...dateFields.map(f => f.originalName), ...amountFields.map(f => f.originalName)]
    })
  }
  
  // Check for transactional data
  const idFields = fieldTypes.filter(f => f.semanticType === 'identifier')
  if (idFields.length > 0 && amountFields.length > 0) {
    patterns.push({
      type: 'transactional',
      description: 'Data appears to contain financial transactions',
      confidence: 0.7,
      relevantFields: [...idFields.map(f => f.originalName), ...amountFields.map(f => f.originalName)]
    })
  }
  
  // Check for dimensional data
  const categoryFields = fieldTypes.filter(f => ['category', 'entity', 'region'].includes(f.semanticType))
  if (categoryFields.length >= 2) {
    patterns.push({
      type: 'dimensional',
      description: 'Data contains multiple dimensions for analysis',
      confidence: 0.75,
      relevantFields: categoryFields.map(f => f.originalName)
    })
  }
  
  return patterns
}

function detectFileType(filename, headers) {
  const name = filename.toLowerCase()
  const headerStr = headers.join(' ').toLowerCase()
  
  if (name.includes('gl') || name.includes('ledger') || headerStr.includes('account')) {
    return 'General Ledger'
  }
  if (name.includes('budget') || headerStr.includes('budget')) {
    return 'Budget Data'
  }
  if (name.includes('forecast') || headerStr.includes('forecast')) {
    return 'Forecast Data'
  }
  if (name.includes('actual') || headerStr.includes('actual')) {
    return 'Actuals Data'
  }
  if (name.includes('pl') || name.includes('income') || name.includes('pnl')) {
    return 'P&L Statement'
  }
  if (name.includes('balance') || name.includes('bs')) {
    return 'Balance Sheet'
  }
  if (name.includes('cash') || name.includes('cf')) {
    return 'Cash Flow'
  }
  if (name.includes('sales') || name.includes('revenue')) {
    return 'Sales/Revenue Data'
  }
  
  return 'Financial Data'
}

// Suggest mappings between files based on analysis
export function suggestMappings(parsedData, learnedRules, userCorrections) {
  const suggestions = []
  const fileIds = Object.keys(parsedData)
  
  if (fileIds.length < 2) {
    return suggestions
  }
  
  // Compare each file pair
  for (let i = 0; i < fileIds.length; i++) {
    for (let j = i + 1; j < fileIds.length; j++) {
      const file1 = parsedData[fileIds[i]]
      const file2 = parsedData[fileIds[j]]
      
      // Find matching fields
      Object.entries(file1.analysis.fields).forEach(([field1, info1]) => {
        Object.entries(file2.analysis.fields).forEach(([field2, info2]) => {
          const similarity = calculateFieldSimilarity(field1, info1, field2, info2)
          
          if (similarity > 0.6) {
            // Check if there's a learned rule for this
            const rule = learnedRules.find(r => 
              r.condition.sourceField === field1 || r.condition.targetField === field2
            )
            
            suggestions.push({
              sourceFileId: fileIds[i],
              sourceField: field1,
              targetFileId: fileIds[j],
              targetField: field2,
              similarity,
              confidence: rule ? Math.min(similarity + 0.2, 1.0) : similarity,
              reason: generateMappingReason(field1, info1, field2, info2, similarity),
              suggestedTransform: suggestTransform(info1, info2),
              hasLearnedRule: !!rule
            })
          }
        })
      })
    }
  }
  
  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence)
  
  return suggestions
}

function calculateFieldSimilarity(name1, info1, name2, info2) {
  let score = 0
  
  // Exact name match
  if (name1.toLowerCase() === name2.toLowerCase()) {
    score += 0.5
  } else {
    // Normalized name match
    if (info1.normalizedName === info2.normalizedName) {
      score += 0.4
    } else {
      // Partial match
      const words1 = info1.normalizedName.split('_')
      const words2 = info2.normalizedName.split('_')
      const commonWords = words1.filter(w => words2.includes(w))
      score += (commonWords.length / Math.max(words1.length, words2.length)) * 0.3
    }
  }
  
  // Same semantic type
  if (info1.semanticType === info2.semanticType && info1.semanticType !== 'unknown') {
    score += 0.3
  }
  
  // Same data type
  if (info1.dataType === info2.dataType) {
    score += 0.2
  }
  
  return Math.min(score, 1.0)
}

function generateMappingReason(name1, info1, name2, info2, similarity) {
  const reasons = []
  
  if (name1.toLowerCase() === name2.toLowerCase()) {
    reasons.push('exact field name match')
  } else if (info1.normalizedName === info2.normalizedName) {
    reasons.push('normalized names match')
  }
  
  if (info1.semanticType === info2.semanticType && info1.semanticType !== 'unknown') {
    reasons.push(`both are ${info1.semanticType} fields`)
  }
  
  if (info1.dataType === info2.dataType) {
    reasons.push(`same data type (${info1.dataType})`)
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'potential match based on analysis'
}

function suggestTransform(sourceInfo, targetInfo) {
  if (sourceInfo.dataType === targetInfo.dataType) {
    return { type: 'direct', description: 'Direct mapping (no transformation needed)' }
  }
  
  if (sourceInfo.dataType === 'string' && targetInfo.dataType === 'number') {
    return { type: 'parse_number', description: 'Parse string to number' }
  }
  
  if (sourceInfo.dataType === 'number' && targetInfo.dataType === 'string') {
    return { type: 'to_string', description: 'Convert number to string' }
  }
  
  if (sourceInfo.semanticType === 'date' && targetInfo.semanticType === 'date') {
    return { type: 'date_format', description: 'Standardize date format' }
  }
  
  return { type: 'custom', description: 'May need custom transformation' }
}

// Generate combined data from multiple sources
export function generateCombinedData(parsedData, fieldMappings, learnedRules) {
  const fileIds = Object.keys(parsedData)
  
  if (fileIds.length === 0) {
    return { headers: [], rows: [], metadata: {} }
  }
  
  // Build target schema from mappings
  const targetSchema = buildTargetSchema(parsedData, fieldMappings)
  
  // Combine all rows
  const combinedRows = []
  
  fileIds.forEach(fileId => {
    const file = parsedData[fileId]
    const rows = file.rows
    
    rows.forEach(row => {
      const combinedRow = { _sourceFile: fileId }
      
      targetSchema.forEach(field => {
        const mapping = fieldMappings.find(m => 
          m.sourceFileId === fileId && m.targetField === field.name
        )
        
        if (mapping) {
          combinedRow[field.name] = applyTransform(row[mapping.sourceField], mapping.transform)
        } else {
          // Try direct field name match
          if (row.hasOwnProperty(field.name)) {
            combinedRow[field.name] = row[field.name]
          } else if (row.hasOwnProperty(field.originalName)) {
            combinedRow[field.name] = row[field.originalName]
          } else {
            combinedRow[field.name] = null
          }
        }
      })
      
      combinedRows.push(combinedRow)
    })
  })
  
  return {
    headers: targetSchema.map(f => f.name),
    rows: combinedRows,
    schema: targetSchema,
    metadata: {
      totalRows: combinedRows.length,
      sourceFiles: fileIds.length,
      combinedAt: new Date().toISOString(),
      mappingsApplied: fieldMappings.length
    }
  }
}

function buildTargetSchema(parsedData, fieldMappings) {
  const schemaMap = new Map()
  
  // Add all target fields from mappings
  fieldMappings.forEach(mapping => {
    if (!schemaMap.has(mapping.targetField)) {
      schemaMap.set(mapping.targetField, {
        name: mapping.targetField,
        originalName: mapping.sourceField,
        sources: [mapping.sourceFileId]
      })
    } else {
      schemaMap.get(mapping.targetField).sources.push(mapping.sourceFileId)
    }
  })
  
  // Add remaining fields from all files
  Object.entries(parsedData).forEach(([fileId, file]) => {
    file.headers.forEach(header => {
      const normalizedName = normalizeFieldName(header)
      if (!schemaMap.has(normalizedName)) {
        schemaMap.set(normalizedName, {
          name: normalizedName,
          originalName: header,
          sources: [fileId]
        })
      }
    })
  })
  
  return Array.from(schemaMap.values())
}

function applyTransform(value, transform) {
  if (!transform || transform.type === 'direct') {
    return value
  }
  
  switch (transform.type) {
    case 'parse_number':
      const num = parseFloat(String(value).replace(/[$,]/g, ''))
      return isNaN(num) ? null : num
    
    case 'to_string':
      return String(value)
    
    case 'date_format':
      const date = new Date(value)
      return isNaN(date.getTime()) ? value : date.toISOString().split('T')[0]
    
    case 'uppercase':
      return String(value).toUpperCase()
    
    case 'lowercase':
      return String(value).toLowerCase()
    
    case 'trim':
      return String(value).trim()
    
    default:
      return value
  }
}

// Process natural language query about the data
export function processAgentQuery(query, context) {
  const { parsedData, fieldMappings, combinedData, learnedRules } = context
  
  const lowerQuery = query.toLowerCase()
  
  // Detect intent
  if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
    return handleCountQuery(query, context)
  }
  
  if (lowerQuery.includes('combine') || lowerQuery.includes('merge') || lowerQuery.includes('join')) {
    return handleCombineQuery(query, context)
  }
  
  if (lowerQuery.includes('map') || lowerQuery.includes('match')) {
    return handleMappingQuery(query, context)
  }
  
  if (lowerQuery.includes('analyze') || lowerQuery.includes('quality') || lowerQuery.includes('issue')) {
    return handleAnalysisQuery(query, context)
  }
  
  if (lowerQuery.includes('template') || lowerQuery.includes('report') || lowerQuery.includes('format')) {
    return handleTemplateQuery(query, context)
  }
  
  if (lowerQuery.includes('learn') || lowerQuery.includes('remember') || lowerQuery.includes('rule')) {
    return handleLearningQuery(query, context)
  }
  
  // Default response
  return {
    response: `I understand you're asking about: "${query}". I can help you with:
    
• **Analyzing files** - Upload data files and I'll diagnose their structure
• **Creating mappings** - Tell me which fields should map to each other
• **Combining data** - I'll merge your files based on the mappings
• **Building templates** - Create reporting formats for your combined data
• **Learning rules** - Teach me your preferences and I'll remember them

What would you like to do?`,
    suggestions: ['Analyze my uploaded files', 'Show mapping suggestions', 'Create a new template'],
    action: null
  }
}

function handleCountQuery(query, context) {
  const { parsedData, combinedData } = context
  const fileCount = Object.keys(parsedData).length
  const totalRows = Object.values(parsedData).reduce((sum, f) => sum + f.rows.length, 0)
  
  return {
    response: `Here's a summary of your data:

📁 **Files uploaded:** ${fileCount}
📊 **Total rows:** ${totalRows.toLocaleString()}
${combinedData ? `🔗 **Combined rows:** ${combinedData.rows.length.toLocaleString()}` : ''}

${Object.entries(parsedData).map(([id, data]) => 
  `• ${data.analysis?.filename || id}: ${data.rows.length.toLocaleString()} rows, ${data.headers.length} columns`
).join('\n')}`,
    suggestions: ['Show data quality issues', 'Suggest field mappings'],
    action: null
  }
}

function handleCombineQuery(query, context) {
  const { parsedData, fieldMappings } = context
  
  if (Object.keys(parsedData).length < 2) {
    return {
      response: "To combine data, please upload at least 2 files first. I'll analyze them and suggest how to merge them together.",
      suggestions: ['Go to Upload tab'],
      action: { type: 'navigate', tab: 'upload' }
    }
  }
  
  if (fieldMappings.length === 0) {
    return {
      response: "I see you have multiple files. Before combining, let's set up field mappings to tell me how the fields relate to each other. Would you like me to suggest some mappings?",
      suggestions: ['Show mapping suggestions', 'Go to Mapping Studio'],
      action: { type: 'navigate', tab: 'mapping' }
    }
  }
  
  return {
    response: `Great! You have ${fieldMappings.length} field mappings configured. I can combine the data now. This will merge all your files based on these mappings.

Would you like me to proceed with combining the data?`,
    suggestions: ['Combine data now', 'Review mappings first'],
    action: { type: 'combine_ready' }
  }
}

function handleMappingQuery(query, context) {
  const suggestions = suggestMappings(context.parsedData, context.learnedRules, [])
  
  if (suggestions.length === 0) {
    return {
      response: "I couldn't find any automatic mapping suggestions. This might be because the field names are very different across your files. You can create custom mappings in the Mapping Studio.",
      suggestions: ['Go to Mapping Studio'],
      action: { type: 'navigate', tab: 'mapping' }
    }
  }
  
  const topSuggestions = suggestions.slice(0, 5)
  return {
    response: `I found ${suggestions.length} potential field mappings! Here are the top suggestions:

${topSuggestions.map((s, i) => 
  `${i + 1}. **${s.sourceField}** → **${s.targetField}** (${(s.confidence * 100).toFixed(0)}% confidence)
   _${s.reason}_`
).join('\n\n')}

Would you like me to apply these mappings, or would you prefer to review them in the Mapping Studio?`,
    suggestions: ['Apply suggested mappings', 'Go to Mapping Studio'],
    action: { type: 'mapping_suggestions', suggestions }
  }
}

function handleAnalysisQuery(query, context) {
  const { parsedData } = context
  const allIssues = []
  
  Object.entries(parsedData).forEach(([fileId, data]) => {
    if (data.analysis?.dataQuality?.issues) {
      data.analysis.dataQuality.issues.forEach(issue => {
        allIssues.push({ ...issue, file: data.analysis.filename || fileId })
      })
    }
  })
  
  if (allIssues.length === 0) {
    return {
      response: "✅ Great news! I didn't find any significant data quality issues in your uploaded files. The data looks clean and ready for processing.",
      suggestions: ['Proceed to mapping', 'View detailed diagnostics'],
      action: null
    }
  }
  
  return {
    response: `I found ${allIssues.length} potential data quality issues:

${allIssues.slice(0, 5).map(issue => 
  `⚠️ **${issue.file}** - ${issue.message}`
).join('\n')}

${allIssues.length > 5 ? `\n_...and ${allIssues.length - 5} more issues_` : ''}

Would you like to see more details or proceed despite these issues?`,
    suggestions: ['View all issues', 'Proceed anyway', 'Go to Diagnostics'],
    action: { type: 'navigate', tab: 'diagnostics' }
  }
}

function handleTemplateQuery(query, context) {
  return {
    response: `I can help you create reporting templates! Here are some common financial templates I can generate:

📊 **Variance Report** - Compare actuals vs budget/forecast
📈 **Trend Analysis** - Time-series analysis of key metrics
💰 **P&L Summary** - Profit and loss statement format
📋 **Data Summary** - Overview of all combined data

Which type of template would you like to create?`,
    suggestions: ['Variance Report', 'Trend Analysis', 'P&L Summary', 'Custom Template'],
    action: { type: 'navigate', tab: 'templates' }
  }
}

function handleLearningQuery(query, context) {
  const { learnedRules } = context
  
  return {
    response: `I'm designed to learn from your corrections and preferences! Here's how it works:

🧠 **Current knowledge:** ${learnedRules.length} learned rules

**How I learn:**
1. When you correct a mapping, I remember the pattern
2. When you set a preference, I apply it to future data
3. The more you use me, the smarter I get!

You can also explicitly teach me rules like:
- "Always map 'Revenue' to 'Sales'"
- "Convert all dates to YYYY-MM-DD format"
- "Department codes starting with 'FIN' are Finance"

What would you like to teach me?`,
    suggestions: ['Show learned rules', 'Add a new rule', 'Clear all rules'],
    action: { type: 'navigate', tab: 'rules' }
  }
}
