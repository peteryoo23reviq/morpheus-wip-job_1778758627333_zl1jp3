import React, { useState } from 'react'
import { 
  Database, 
  Download, 
  RefreshCw, 
  Table, 
  BarChart3,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

function CombinedDataView() {
  const { combinedData, combineData, uploadedFiles, fieldMappings } = useAgent()
  const [view, setView] = useState('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const rowsPerPage = 50

  const handleCombine = () => {
    combineData()
    setCurrentPage(1)
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const downloadCSV = () => {
    if (!combinedData) return
    const csv = Papa.unparse(combinedData.rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `combined_data_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const downloadExcel = () => {
    if (!combinedData) return
    const ws = XLSX.utils.json_to_sheet(combinedData.rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Combined Data')
    XLSX.writeFile(wb, `combined_data_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Filter and sort data
  const getProcessedData = () => {
    if (!combinedData?.rows) return []
    
    let data = [...combinedData.rows]
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      data = data.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(term)
        )
      )
    }
    
    // Apply column filter
    if (filterColumn && filterValue) {
      data = data.filter(row => 
        String(row[filterColumn] || '').toLowerCase().includes(filterValue.toLowerCase())
      )
    }
    
    // Apply sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }
        
        return sortConfig.direction === 'asc' 
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    }
    
    return data
  }

  const processedData = getProcessedData()
  const totalPages = Math.ceil(processedData.length / rowsPerPage)
  const paginatedData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Check if we can combine
  const canCombine = uploadedFiles.length > 0

  if (!combinedData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Database className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No Combined Data Yet</h3>
        <p className="text-gray-400 mb-6">
          {canCombine 
            ? `Ready to combine ${uploadedFiles.length} files with ${fieldMappings.length} mappings.`
            : 'Upload files and create mappings first.'
          }
        </p>
        {canCombine && (
          <button
            onClick={handleCombine}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className="w-5 h-5" />
            Combine Data Now
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Combined Data</h2>
          <p className="text-gray-400 mt-1">
            {combinedData.metadata.totalRows.toLocaleString()} rows from {combinedData.metadata.sourceFiles} source files
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCombine}
            className="flex items-center gap-2 px-3 py-2 bg-agent-card border border-agent-border text-white rounded-lg hover:bg-agent-border"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-2 bg-agent-card border border-agent-border text-white rounded-lg hover:bg-agent-border"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search all columns..."
            className="w-full pl-10 pr-4 py-2 bg-agent-card border border-agent-border rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="px-3 py-2 bg-agent-card border border-agent-border rounded-lg text-white"
          >
            <option value="">Filter column...</option>
            {combinedData.headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {filterColumn && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder="Filter value..."
              className="px-3 py-2 bg-agent-card border border-agent-border rounded-lg text-white placeholder-gray-500"
            />
          )}
        </div>

        <div className="flex items-center gap-1 bg-agent-card border border-agent-border rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded ${view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('summary')}
            className={`p-2 rounded ${view === 'summary' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400 flex-shrink-0">
        Showing {paginatedData.length} of {processedData.length} rows
        {searchTerm && ` (filtered from ${combinedData.rows.length})`}
      </div>

      {/* Data Table */}
      {view === 'table' && (
        <div className="flex-1 overflow-auto bg-agent-card border border-agent-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-agent-card border-b border-agent-border">
              <tr>
                {combinedData.headers.map(header => (
                  <th 
                    key={header}
                    onClick={() => handleSort(header)}
                    className="px-4 py-3 text-left text-gray-400 font-medium cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      {header}
                      {sortConfig.key === header && (
                        <span className="text-blue-400">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr 
                  key={idx}
                  className="border-b border-agent-border hover:bg-agent-border/30"
                >
                  {combinedData.headers.map(header => (
                    <td key={header} className="px-4 py-2 text-gray-300">
                      {row[header] !== null && row[header] !== undefined 
                        ? String(row[header]).substring(0, 50) 
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary View */}
      {view === 'summary' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinedData.headers.map(header => {
              const values = combinedData.rows.map(r => r[header]).filter(v => v !== null && v !== undefined)
              const numericValues = values.map(v => parseFloat(String(v).replace(/[$,]/g, ''))).filter(n => !isNaN(n))
              const isNumeric = numericValues.length > values.length * 0.5
              
              return (
                <div key={header} className="bg-agent-card border border-agent-border rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">{header}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Non-null values:</span>
                      <span className="text-white">{values.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unique values:</span>
                      <span className="text-white">{new Set(values).size.toLocaleString()}</span>
                    </div>
                    {isNumeric && numericValues.length > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sum:</span>
                          <span className="text-white">{numericValues.reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average:</span>
                          <span className="text-white">{(numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Min / Max:</span>
                          <span className="text-white">{Math.min(...numericValues).toLocaleString()} / {Math.max(...numericValues).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {view === 'table' && totalPages > 1 && (
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-agent-card border border-agent-border rounded-lg text-white disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-agent-card border border-agent-border rounded-lg text-white disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CombinedDataView
