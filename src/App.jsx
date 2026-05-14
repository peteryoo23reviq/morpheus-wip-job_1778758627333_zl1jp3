import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import FileUploader from './components/FileUploader'
import DataDiagnostics from './components/DataDiagnostics'
import MappingStudio from './components/MappingStudio'
import AgentChat from './components/AgentChat'
import TemplateBuilder from './components/TemplateBuilder'
import CombinedDataView from './components/CombinedDataView'
import RulesManager from './components/RulesManager'
import { AgentProvider } from './context/AgentContext'
import { Brain } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [isAgentThinking, setIsAgentThinking] = useState(false)

  return (
    <AgentProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-agent-card border-b border-agent-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 ${isAgentThinking ? 'animate-pulse-glow' : ''}`}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">FinanceAgent AI</h1>
                  <p className="text-sm text-gray-400">Intelligent Financial Data Processor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isAgentThinking ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                <span className="text-sm text-gray-400">
                  {isAgentThinking ? 'Processing...' : 'Ready'}
                </span>
              </div>
            </div>
          </header>

          {/* Main Area */}
          <main className="flex-1 overflow-auto p-6">
            {activeTab === 'upload' && <FileUploader setIsAgentThinking={setIsAgentThinking} />}
            {activeTab === 'diagnostics' && <DataDiagnostics setIsAgentThinking={setIsAgentThinking} />}
            {activeTab === 'mapping' && <MappingStudio setIsAgentThinking={setIsAgentThinking} />}
            {activeTab === 'combined' && <CombinedDataView />}
            {activeTab === 'templates' && <TemplateBuilder setIsAgentThinking={setIsAgentThinking} />}
            {activeTab === 'rules' && <RulesManager />}
            {activeTab === 'chat' && <AgentChat setIsAgentThinking={setIsAgentThinking} />}
          </main>
        </div>
      </div>
    </AgentProvider>
  )
}

export default App
