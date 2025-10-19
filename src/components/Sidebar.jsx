import { useState } from 'react'
import './Sidebar.css'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useBrand } from '../contexts/BrandContext'

const Sidebar = ({ currentView, setCurrentView }) => {
  const { t, direction, language } = useLanguage()
  const { user, logout, hasPermission } = useAuth()
  const { brandSettings } = useBrand()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // Define menu items with their required permissions
  const allMenuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '🏠', permission: 'view_dashboard' },
    { id: 'accounts', label: t('chartOfAccounts'), icon: '📊', permission: 'view_chart_of_accounts' },
    { id: 'entries', label: t('journalEntries'), icon: '📝', permission: 'view_journal_entries' },
    { id: 'invoices', label: t('invoices'), icon: '🧾', permission: 'view_invoices' },
    { id: 'customers', label: t('customersSuppliers'), icon: '👥', permission: 'view_customers_suppliers' },
    { id: 'inventory', label: t('inventory'), icon: '📦', permission: 'view_inventory' },
    { id: 'accountStatement', label: t('accountStatement'), icon: '📋', permission: 'view_customers_suppliers' },
    { id: 'reports', label: t('reports'), icon: '📈', permission: 'view_financial_reports' },
  ]

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasPermission(item.permission))

  const handleLogout = () => {
    if (window.confirm(language === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <aside className={`sidebar ${direction}`}>
      <div className="sidebar-header">
        {brandSettings.logoUrl && (
          <div className="app-logo">
            <img 
              src={brandSettings.logoUrl} 
              alt="Company Logo" 
              className="logo-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
        <div className="app-info">
          <h2 className="app-title">
            {language === 'ar' ? brandSettings.appName : brandSettings.appNameEn}
          </h2>
          {(brandSettings.tagline || brandSettings.taglineEn) && (
            <p className="app-tagline">
              {language === 'ar' ? brandSettings.tagline : brandSettings.taglineEn}
            </p>
          )}
        </div>
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
        {hasPermission('view_settings') && (
          <button
            className={`nav-item settings-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">{t('settings')}</span>
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar