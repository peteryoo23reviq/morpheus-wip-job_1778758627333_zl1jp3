# FinanceAgent AI 🧠💰

An intelligent AI-powered financial data agent that helps you combine massive amounts of financial data files, create field mappings, and generate reporting and forecasting templates.

![FinanceAgent Screenshot](https://via.placeholder.com/800x400?text=FinanceAgent+AI)

## Features

### 📁 Smart File Upload & Analysis
- Upload CSV, Excel (.xlsx), or JSON files
- Automatic field type detection (dates, amounts, accounts, categories, etc.)
- Data quality analysis and issue detection
- Pattern recognition for financial data

### 🔗 Intelligent Field Mapping
- AI-powered mapping suggestions between files
- Visual mapping studio for manual adjustments
- Support for data transformations (parse numbers, format dates, etc.)
- Learn from your corrections to improve future suggestions

### 🧠 Learnable Agent
- Remembers your mapping preferences
- Creates reusable rules from your interactions
- Gets smarter with every file you process
- Teach it custom rules directly

### 📊 Template Builder
- Create variance reports (actuals vs budget)
- Build trend analysis templates
- Generate P&L summaries
- Custom template configuration

### 💬 Conversational Interface
- Ask questions about your data
- Natural language queries
- Quick actions for common tasks

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/financial-data-agent.git
cd financial-data-agent

# Install dependencies
pnpm install

# Build for production
pnpm build

# Start the server
node server.js
```

### Development

```bash
# Start development server
pnpm dev
```

## How to Use

### 1. Upload Your Files
Drag and drop your financial data files (CSV, Excel, JSON) into the upload area. The agent will automatically analyze the structure and detect field types.

### 2. Review Diagnostics
Check the Diagnostics tab to see detailed analysis of each file, including:
- Field type detection
- Data quality metrics
- Detected patterns

### 3. Create Mappings
Use the Mapping Studio to define how fields should be combined:
- Click "AI Suggestions" for automatic mapping recommendations
- Manually create mappings for custom requirements
- The agent learns from your choices

### 4. Combine Data
Navigate to Combined Data to merge your files based on the mappings. Export to CSV or Excel.

### 5. Build Templates
Create reusable report templates:
- Variance Reports
- Trend Analysis
- P&L Summaries
- Custom Templates

### 6. Chat with the Agent
Use the Agent Chat for natural language queries:
- "How many rows do I have?"
- "Show me data quality issues"
- "Create a variance report"

## Supported File Types

| Format | Extension | Notes |
|--------|-----------|-------|
| CSV | .csv | Comma-separated values |
| Excel | .xlsx | Modern Excel format |
| Excel Legacy | .xls | Older Excel format |
| JSON | .json | Array of objects |

## Field Types Detected

- **Date/Time**: Periods, months, years, quarters
- **Amount**: Revenue, costs, totals, balances
- **Account**: GL codes, account numbers
- **Category**: Types, segments, departments
- **Description**: Names, memos, notes
- **Identifier**: IDs, reference numbers
- **Percentage**: Rates, ratios
- **Currency**: Currency codes
- **Entity**: Companies, vendors, customers
- **Region**: Countries, territories, markets

## Architecture

```
financial-data-agent/
├── src/
│   ├── components/       # React components
│   │   ├── AgentChat.jsx
│   │   ├── CombinedDataView.jsx
│   │   ├── DataDiagnostics.jsx
│   │   ├── FileUploader.jsx
│   │   ├── MappingStudio.jsx
│   │   ├── RulesManager.jsx
│   │   ├── Sidebar.jsx
│   │   └── TemplateBuilder.jsx
│   ├── context/          # React context
│   │   └── AgentContext.jsx
│   ├── utils/            # AI engine
│   │   └── aiEngine.js
│   ├── App.jsx
│   └── main.jsx
├── dist/                 # Production build
├── server.js            # Express server
└── package.json
```

## Deployment

### Netlify
```bash
netlify deploy --prod --dir=dist
```

### Vercel
```bash
vercel deploy --prod
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build
EXPOSE 3000
CMD ["node", "server.js"]
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
