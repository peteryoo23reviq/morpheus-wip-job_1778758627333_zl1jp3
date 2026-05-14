import React from 'react'
import { 
  Upload, 
  Search, 
  GitMerge, 
  Database, 
  FileSpreadsheet, 
  BookOpen,
  MessageSquare,
  Brain,
  Settings
} from 'lucide-react'
import { useAgent } from '../context/AgentContext'

const menuItems = [
  { id: 'upload', label: 'Upload Files', icon: Upload, description: 'Import data files' },
  { id: 'diagnostics', label: 'Diagnostics', icon: Search, description: 'Analyze structure' },
  { id: 'mapping', label: 'Mapping Studio', icon: GitMerge, description: 'Map fields' },
  { id: 'combined', label: 'Combined Data', icon: Database, description: 'View merged data' },
  { id: 'templates', label: 'Templates', icon: FileSpreadsheet, description: 'Build reports' },
  { id: 'rules', label: 'Learned Rules', icon: BookOpen, description: 'Agent knowledge' },
  { id: 'chat', label: 'Agent Chat', icon: MessageSquare, description: 'Ask anything' },
]

function Sidebar({ activeTab, setActiveTab }) {
  const { uploadedFiles, learnedRules, fieldMappings } = useAgent()

  const getBadge = (id) => {
    switch(id) {
      case 'upload': return uploadedFiles.length > 0 ? uploadedFiles.length : null
      case 'mapping': return fieldMappings.length > 0 ? fieldMappings.length : null
      case 'rules': return learnedRules.length > 0 ? learnedRules.length : null
      default: return null
    }
  }

  return (
    <aside className="w-64 bg-agent-card border-r border-agent-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-agent-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">FinanceAgent</h1>
            <p className="text-xs text-gray-400">AI Data Processor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const badge = getBadge(item.id)
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-agent-accent text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-agent-border/50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{item.label}</div>
                <div className={`text-xs ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                  {item.description}
                </div>
              </div>
              {badge && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-agent-border">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Agent ready</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
