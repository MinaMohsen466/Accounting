import { useState, useEffect } from 'react'
import './App.css'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BrandProvider } from './contexts/BrandContext'

// Import Components
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ChartOfAccounts from './components/ChartOfAccounts'
import JournalEntries from './components/JournalEntries'
import Invoices from './components/Invoices'
import CustomersSuppliers from './components/CustomersSuppliers'
import Inventory from './components/Inventory'
import Reports from './components/Reports'
import DataManagement from './components/DataManagement'
import Settings from './components/Settings'
import LoginOverlay from './components/LoginOverlay'

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const { direction } = useLanguage()
  const { isAuthenticated, isLoading } = useAuth()

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
      case 'dataManagement':
        return <DataManagement />
      case 'settings':
        return <Settings />
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
      
      {/* Show login overlay if not authenticated */}
      {!isLoading && !isAuthenticated && <LoginOverlay />}
    </div>
  )
}

function App() {
  return (
    <BrandProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </BrandProvider>
  )
}

export default App
