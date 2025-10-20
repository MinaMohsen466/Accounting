import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import DataManagement from './DataManagement'
import AccountManagement from './AccountManagement'
import BrandManagement from './BrandManagement'
import UserManagement from './UserManagement'
import SystemAdministration from './SystemAdministration'
import './Settings.css'

const Settings = () => {
  const { language, setLanguage, notificationsEnabled, setNotificationsEnabled, t, direction } = useLanguage()
  const { user, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  
  // Settings states
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('app_autoSave')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme')
    return saved || 'light'
  })

  const [editInvoicePin, setEditInvoicePin] = useState(() => {
    const saved = localStorage.getItem('app_editInvoicePin')
    return saved || ''
  })

  // PIN protection settings for different modules
  const [pinProtectionSettings, setPinProtectionSettings] = useState(() => {
    const saved = localStorage.getItem('app_pinProtectionSettings')
    return saved ? JSON.parse(saved) : {
      invoices: true,
      inventory: true,
      customers: true,
      journalEntries: true,
      chartOfAccounts: true
    }
  })

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')

  const tabs = [
    {
      id: 'general',
      label: t('generalSettings') || 'الإعدادات العامة',
      icon: '⚙️'
    },
    ...(hasPermission('manage_user_account') ? [{
      id: 'account',
      label: language === 'ar' ? 'إدارة الحساب' : 'Account Management',
      icon: '👤'
    }] : []),
    ...(hasPermission('manage_users') ? [{
      id: 'users',
      label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
      icon: '👥'
    }] : []),
    ...(hasPermission('manage_brand_settings') ? [{
      id: 'brand',
      label: language === 'ar' ? 'الهوية البصرية' : 'Brand Identity',
      icon: '🎨'
    }] : []),
    {
      id: 'language',
      label: t('languageSettings') || 'إعدادات اللغة',
      icon: '🌐'
    },
    ...(hasPermission('export_data') || hasPermission('import_data') ? [{
      id: 'data',
      label: t('dataManagement') || 'إدارة البيانات',
      icon: '💾'
    }] : []),
    ...(hasPermission('system_maintenance') || hasPermission('view_system_logs') || hasPermission('manage_system_backups') ? [{
      id: 'system',
      label: language === 'ar' ? 'إدارة النظام' : 'System Administration',
      icon: '🔧'
    }] : [])
  ]

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
  }

  const handleNotificationsChange = (enabled) => {
    setNotificationsEnabled(enabled)
  }

  const handleAutoSaveChange = (enabled) => {
    setAutoSave(enabled)
    localStorage.setItem('app_autoSave', JSON.stringify(enabled))
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app_theme', newTheme)
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handlePinChange = () => {
    setPinError('')
    
    // Validate
    if (!newPin) {
      setPinError(language === 'ar' ? 'يرجى إدخال الرقم السري' : 'Please enter PIN')
      return
    }
    
    if (newPin.length < 4) {
      setPinError(language === 'ar' ? 'الرقم السري يجب أن يكون 4 أرقام على الأقل' : 'PIN must be at least 4 digits')
      return
    }
    
    if (newPin !== confirmPin) {
      setPinError(language === 'ar' ? 'الرقم السري غير متطابق' : 'PIN does not match')
      return
    }
    
    // Save PIN
    localStorage.setItem('app_editInvoicePin', newPin)
    setEditInvoicePin(newPin)
    setNewPin('')
    setConfirmPin('')
    
    // Show success message
    alert(language === 'ar' ? 'تم حفظ الرقم السري بنجاح!' : 'PIN saved successfully!')
  }

  const handlePinRemove = () => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من إزالة الرقم السري؟' : 'Are you sure you want to remove the PIN?')) {
      localStorage.removeItem('app_editInvoicePin')
      setEditInvoicePin('')
      setNewPin('')
      setConfirmPin('')
      alert(language === 'ar' ? 'تم إزالة الرقم السري' : 'PIN removed')
    }
  }

  const handlePinProtectionToggle = (section, enabled) => {
    const newSettings = {
      ...pinProtectionSettings,
      [section]: enabled
    }
    setPinProtectionSettings(newSettings)
    localStorage.setItem('app_pinProtectionSettings', JSON.stringify(newSettings))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <h3>{t('generalSettings') || 'الإعدادات العامة'}</h3>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>{t('theme') || 'المظهر'}</h4>
                  <p>{t('themeDescription') || 'اختر مظهر التطبيق'}</p>
                </div>
                <select 
                  className="setting-control"
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                >
                  <option value="light">{t('lightTheme') || 'فاتح'}</option>
                  <option value="dark">{t('darkTheme') || 'داكن'}</option>
                </select>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h4>{t('notifications') || 'الإشعارات'}</h4>
                  <p>{t('notificationsDescription') || 'تمكين الإشعارات'}</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled}
                    onChange={(e) => handleNotificationsChange(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h4>{t('autoSave') || 'الحفظ التلقائي'}</h4>
                  <p>{t('autoSaveDescription') || 'حفظ البيانات تلقائياً'}</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={autoSave}
                    onChange={(e) => handleAutoSaveChange(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {/* PIN Security Setting - Admin Only */}
            {hasPermission('system_maintenance') && (
              <div className="settings-group" style={{ marginTop: '30px' }}>
                <h4 style={{ marginBottom: '15px', color: '#6366f1' }}>
                  🔐 {language === 'ar' ? 'حماية التعديلات بالرقم السري' : 'Edit Protection with PIN'}
                </h4>
                
                <div className="pin-security-section">
                  <div className="setting-info" style={{ marginBottom: '15px' }}>
                    <p>
                      {language === 'ar' 
                        ? 'قم بإنشاء رقم سري لحماية عمليات التعديل. يمكنك التحكم في الأقسام التي تتطلب رقم سري.' 
                        : 'Create a PIN to protect editing operations. You can control which sections require a PIN.'}
                    </p>
                  </div>

                  {editInvoicePin ? (
                    <div className="pin-status-box">
                      <div className="pin-active-indicator">
                        <span style={{ fontSize: '24px' }}>✅</span>
                        <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#22c55e' }}>
                          {language === 'ar' ? 'الرقم السري مفعّل' : 'PIN is Active'}
                        </span>
                      </div>

                      {/* PIN Protection Toggles */}
                      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <h5 style={{ marginBottom: '15px', fontSize: '14px', color: '#495057' }}>
                          {language === 'ar' ? 'تفعيل الحماية للأقسام:' : 'Enable Protection for Sections:'}
                        </h5>
                        
                        <div className="setting-item" style={{ marginBottom: '10px' }}>
                          <div className="setting-info">
                            <h4 style={{ fontSize: '13px', margin: 0 }}>
                              📄 {language === 'ar' ? 'الفواتير' : 'Invoices'}
                            </h4>
                            <p style={{ fontSize: '11px', margin: 0, color: '#6c757d' }}>
                              {language === 'ar' ? 'طلب رقم سري عند تعديل الفواتير' : 'Require PIN when editing invoices'}
                            </p>
                          </div>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={pinProtectionSettings.invoices}
                              onChange={(e) => handlePinProtectionToggle('invoices', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-item" style={{ marginBottom: '10px' }}>
                          <div className="setting-info">
                            <h4 style={{ fontSize: '13px', margin: 0 }}>
                              📦 {language === 'ar' ? 'المنتجات' : 'Products'}
                            </h4>
                            <p style={{ fontSize: '11px', margin: 0, color: '#6c757d' }}>
                              {language === 'ar' ? 'طلب رقم سري عند تعديل المنتجات' : 'Require PIN when editing products'}
                            </p>
                          </div>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={pinProtectionSettings.inventory}
                              onChange={(e) => handlePinProtectionToggle('inventory', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-item" style={{ marginBottom: '10px' }}>
                          <div className="setting-info">
                            <h4 style={{ fontSize: '13px', margin: 0 }}>
                              👥 {language === 'ar' ? 'العملاء والموردين' : 'Customers & Suppliers'}
                            </h4>
                            <p style={{ fontSize: '11px', margin: 0, color: '#6c757d' }}>
                              {language === 'ar' ? 'طلب رقم سري عند تعديل العملاء والموردين' : 'Require PIN when editing customers/suppliers'}
                            </p>
                          </div>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={pinProtectionSettings.customers}
                              onChange={(e) => handlePinProtectionToggle('customers', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-item" style={{ marginBottom: '10px' }}>
                          <div className="setting-info">
                            <h4 style={{ fontSize: '13px', margin: 0 }}>
                              📒 {language === 'ar' ? 'القيود اليومية' : 'Journal Entries'}
                            </h4>
                            <p style={{ fontSize: '11px', margin: 0, color: '#6c757d' }}>
                              {language === 'ar' ? 'طلب رقم سري عند تعديل القيود اليومية' : 'Require PIN when editing journal entries'}
                            </p>
                          </div>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={pinProtectionSettings.journalEntries}
                              onChange={(e) => handlePinProtectionToggle('journalEntries', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-item" style={{ marginBottom: '0' }}>
                          <div className="setting-info">
                            <h4 style={{ fontSize: '13px', margin: 0 }}>
                              📊 {language === 'ar' ? 'دليل الحسابات' : 'Chart of Accounts'}
                            </h4>
                            <p style={{ fontSize: '11px', margin: 0, color: '#6c757d' }}>
                              {language === 'ar' ? 'طلب رقم سري عند تعديل الحسابات' : 'Require PIN when editing accounts'}
                            </p>
                          </div>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={pinProtectionSettings.chartOfAccounts}
                              onChange={(e) => handlePinProtectionToggle('chartOfAccounts', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>

                      <button 
                        className="btn-danger"
                        onClick={handlePinRemove}
                        style={{ marginTop: '15px' }}
                      >
                        {language === 'ar' ? 'إزالة الرقم السري' : 'Remove PIN'}
                      </button>
                    </div>
                  ) : (
                    <div className="pin-setup-box">
                      <div className="form-group">
                        <label>{language === 'ar' ? 'الرقم السري الجديد (4 أرقام على الأقل)' : 'New PIN (min 4 digits)'}</label>
                        <input
                          type="password"
                          className="form-control"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder={language === 'ar' ? 'أدخل الرقم السري' : 'Enter PIN'}
                          maxLength="8"
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginTop: '10px' }}>
                        <label>{language === 'ar' ? 'تأكيد الرقم السري' : 'Confirm PIN'}</label>
                        <input
                          type="password"
                          className="form-control"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          placeholder={language === 'ar' ? 'أعد إدخال الرقم السري' : 'Re-enter PIN'}
                          maxLength="8"
                        />
                      </div>

                      {pinError && (
                        <div className="error-message" style={{ marginTop: '10px', color: '#ef4444' }}>
                          {pinError}
                        </div>
                      )}

                      <button 
                        className="btn-primary"
                        onClick={handlePinChange}
                        style={{ marginTop: '15px' }}
                      >
                        {language === 'ar' ? 'حفظ الرقم السري' : 'Save PIN'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      
      case 'language':
        return (
          <div className="settings-section">
            <h3>{t('languageSettings') || 'إعدادات اللغة'}</h3>
            <div className="language-selection">
              <div 
                className={`language-option ${language === 'ar' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('ar')}
              >
                <div className="language-flag">🇸🇦</div>
                <div className="language-info">
                  <h4>العربية</h4>
                  <p>اللغة العربية</p>
                </div>
                {hasPermission('change_language') && (
                  <button 
                    className={`language-btn ${language === 'ar' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('ar')}
                  >
                    {language === 'ar' ? '✓ مفعل' : 'تفعيل'}
                  </button>
                )}
              </div>
              
              <div 
                className={`language-option ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                <div className="language-flag">🇺🇸</div>
                <div className="language-info">
                  <h4>English</h4>
                  <p>English Language</p>
                </div>
                {hasPermission('change_language') && (
                  <button 
                    className={`language-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('en')}
                  >
                    {language === 'en' ? '✓ Active' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'account':
        return (
          <div className="settings-section">
            <AccountManagement />
          </div>
        )
      
      case 'users':
        return (
          <div className="settings-section">
            <UserManagement />
          </div>
        )
      
      case 'brand':
        return (
          <div className="settings-section">
            <BrandManagement />
          </div>
        )
      
      case 'data':
        return (
          <div className="settings-section">
            <h3>{t('dataManagement') || 'إدارة البيانات'}</h3>
            <div className="data-management-wrapper">
              <DataManagement />
            </div>
          </div>
        )
      
      case 'system':
        return (
          <div className="settings-section">
            <SystemAdministration />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>{t('settings') || 'الإعدادات'}</h1>
        <p>{t('settingsDescription') || 'إدارة إعدادات التطبيق والبيانات'}</p>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-label">{tab.label}</span>
                <span className="tab-icon">{tab.icon}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default Settings
