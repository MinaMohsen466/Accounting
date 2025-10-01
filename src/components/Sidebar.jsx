import './Sidebar.css'
import { useLanguage } from '../contexts/LanguageContext'

const Sidebar = ({ currentView, setCurrentView }) => {
  const { t, direction } = useLanguage()
  
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '🏠' },
    { id: 'accounts', label: t('chartOfAccounts'), icon: '📊' },
    { id: 'entries', label: t('journalEntries'), icon: '📝' },
    { id: 'invoices', label: t('invoices'), icon: '🧾' },
    { id: 'customers', label: t('customersSuppliers'), icon: '👥' },
    { id: 'inventory', label: t('inventory'), icon: '📦' },
    { id: 'reports', label: t('reports'), icon: '📈' },
  ]

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
      
      <div className="sidebar-footer">
        <button
          className={`nav-item settings-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">{t('settings')}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar