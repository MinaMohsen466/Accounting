import { useState, useEffect } from 'react'
import './App.css'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'

// Import Components
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ChartOfAccounts from './components/ChartOfAccounts'
import JournalEntries from './components/JournalEntries'
import Invoices from './components/Invoices'
import CustomersSuppliers from './components/CustomersSuppliers'
import Inventory from './components/Inventory'
import Reports from './components/Reports'

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const { direction } = useLanguage()

  useEffect(() => {
    // Update body class for direction
    document.body.className = direction === 'rtl' ? 'rtl' : 'ltr'
  }, [direction])

  const renderContent = () => {
    switch (currentView) {
      case 'accounts':
        return <ChartOfAccounts />
      case 'entries':
        return <JournalEntries />
      case 'invoices':
        return <Invoices />
      case 'customers':
        return <CustomersSuppliers />
      case 'inventory':
        return <Inventory />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  return (
    <div className={`app ${direction === 'ltr' ? 'ltr' : ''}`}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
