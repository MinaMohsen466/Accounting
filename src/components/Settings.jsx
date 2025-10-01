import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import DataManagement from './DataManagement'
import './Settings.css'

const Settings = () => {
  const { language, setLanguage, notificationsEnabled, setNotificationsEnabled, t, direction } = useLanguage()
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

  const tabs = [
    {
      id: 'general',
      label: t('generalSettings') || 'الإعدادات العامة',
      icon: '⚙️'
    },
    {
      id: 'language',
      label: t('languageSettings') || 'إعدادات اللغة',
      icon: '🌐'
    },
    {
      id: 'data',
      label: t('dataManagement') || 'إدارة البيانات',
      icon: '💾'
    }
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
                <button 
                  className={`language-btn ${language === 'ar' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('ar')}
                >
                  {language === 'ar' ? '✓ مفعل' : 'تفعيل'}
                </button>
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
                <button 
                  className={`language-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  {language === 'en' ? '✓ Active' : 'Activate'}
                </button>
              </div>
            </div>
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
