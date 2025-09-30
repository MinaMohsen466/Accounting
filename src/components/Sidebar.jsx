import './Sidebar.css'
import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'

const Sidebar = ({ currentView, setCurrentView }) => {
  const { t, language, toggleLanguage, direction } = useLanguage()
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef(null)
  
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '🏠' },
    { id: 'accounts', label: t('chartOfAccounts'), icon: '📊' },
    { id: 'entries', label: t('journalEntries'), icon: '📝' },
    { id: 'invoices', label: t('invoices'), icon: '🧾' },
    { id: 'customers', label: t('customersSuppliers'), icon: '👥' },
    { id: 'inventory', label: t('inventory'), icon: '📦' },
    { id: 'reports', label: t('reports'), icon: '📈' },
    { id: 'dataManagement', label: t('dataManagement'), icon: '💾' },
  ]

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <aside className={`sidebar ${direction}`}>
      <div className="sidebar-header">
        <h2>{t('appTitle')}</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="sidebar-footer" ref={settingsRef}>
        <button
          className={`nav-item settings-btn ${showSettings ? 'active' : ''}`}
          onClick={() => setShowSettings(!showSettings)}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">{t('settings')}</span>
        </button>
        
        {showSettings && (
          <div className="settings-dropdown">
            <button 
              className="settings-option language-option" 
              onClick={toggleLanguage}
            >
              <span className="option-icon">🌐</span>
              <span className="option-label">{t('language')}</span>
              <span className="option-value">{language === 'ar' ? 'عربي' : 'English'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar