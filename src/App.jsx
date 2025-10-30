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
import Banking from './components/Banking'
import Reports from './components/Reports'
import AccountStatement from './components/AccountStatement'
import DataManagement from './components/DataManagement'
import Settings from './components/Settings'
import LoginOverlay from './components/LoginOverlay'
import ReceiptVouchers from './components/ReceiptVouchers' // 🆕 سندات القبض
import PaymentVouchers from './components/PaymentVouchers' // 🆕 سندات الدفع

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const { direction } = useLanguage()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Update body class for direction
    document.body.className = direction === 'rtl' ? 'rtl' : 'ltr'
  }, [direction])

  // Reset to dashboard when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard')
    }
  }, [isAuthenticated])

  // Listen for programmatic navigation requests from other components
  useEffect(() => {
    const handler = (e) => {
      const detail = (e && e.detail) || {}
      const view = detail.view
      const invoiceId = detail.invoiceId
      const invoice = detail.invoice

      if (view) setCurrentView(view)

      // If caller also requested opening an invoice on the Invoices page,
      // dispatch an `openInvoice` event after a short delay so the Invoices
      // component has a chance to mount and register its listener.
      if (view === 'invoices' && (invoiceId || invoice)) {
        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent('openInvoice', { detail: { invoiceId, invoice } }))
          } catch (err) {
            // ignore
          }
        }, 60)
      }
    }

    window.addEventListener('navigateTo', handler)
    return () => window.removeEventListener('navigateTo', handler)
  }, [])

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
      case 'banking':
        return <Banking />
      case 'receiptVouchers': // 🆕 سندات القبض
        return <ReceiptVouchers />
      case 'paymentVouchers': // 🆕 سندات الدفع
        return <PaymentVouchers />
      case 'reports':
        return <Reports />
      case 'accountStatement':
        return <AccountStatement />
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
