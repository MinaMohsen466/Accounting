import { useState } from 'react'
import './Sidebar.css'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ currentView, setCurrentView }) => {
  const { t, direction, language } = useLanguage()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '🏠' },
    { id: 'accounts', label: t('chartOfAccounts'), icon: '📊' },
    { id: 'entries', label: t('journalEntries'), icon: '📝' },
    { id: 'invoices', label: t('invoices'), icon: '🧾' },
    { id: 'customers', label: t('customersSuppliers'), icon: '👥' },
    { id: 'inventory', label: t('inventory'), icon: '📦' },
    { id: 'reports', label: t('reports'), icon: '📈' },
  ]

  const handleLogout = () => {
    if (window.confirm(language === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <aside className={`sidebar ${direction}`}>
      <div className="sidebar-header">
        <h2>{t('appTitle')}</h2>
      </div>

      {/* User Info */}
      {user && (
        <div className="user-info">
          <div className="user-details" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="user-text">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {language === 'ar' ? 'مدير النظام' : 'System Admin'}
              </span>
            </div>
            <span className="dropdown-icon">{showUserMenu ? '▲' : '▼'}</span>
          </div>
          
          {showUserMenu && (
            <div className="user-menu">
              <button className="user-menu-item" onClick={handleLogout}>
                <span className="menu-icon">🚪</span>
                {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      )}

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