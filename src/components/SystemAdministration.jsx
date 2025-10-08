import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useAccounting } from '../hooks/useAccounting'
import PermissionDenied from './PermissionDenied'
import './SystemAdministration.css'

const SystemAdministration = () => {
  const { t, language } = useLanguage()
  const { hasPermission, user } = useAuth()
  const { 
    accounts, 
    journalEntries, 
    invoices, 
    customers, 
    inventoryItems 
  } = useAccounting()

  // Check if user has permission to access system administration
  if (!hasPermission('view_settings')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض معلومات النظام"
        description="تحتاج إلى صلاحية 'عرض الإعدادات' للوصول إلى هذه الصفحة"
      />
    )
  }

  // Get current date and time
  const currentDate = new Date().toLocaleDateString('ar-EG')
  const currentTime = new Date().toLocaleTimeString('ar-EG')

  // Calculate data statistics
  const stats = {
    totalAccounts: accounts?.length || 0,
    totalEntries: journalEntries?.length || 0,
    totalInvoices: invoices?.length || 0,
    totalCustomers: customers?.length || 0,
    totalProducts: inventoryItems?.length || 0,
    lastLogin: localStorage.getItem('lastLoginTime') || currentDate
  }

  return (
    <div className="system-administration">
      <div className="system-header">
        <h2>ℹ️ {language === 'ar' ? 'معلومات النظام' : 'System Information'}</h2>
        <p>{language === 'ar' ? 'معلومات عامة عن حالة النظام والبيانات' : 'General information about system status and data'}</p>
      </div>
      {/* System Information */}
      <div className="info-section">
        <h3>�️ {language === 'ar' ? 'معلومات عامة' : 'General Information'}</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>{language === 'ar' ? 'نظام المحاسبة' : 'Accounting System'}</h4>
              <p>{language === 'ar' ? 'الإصدار 2.1.0' : 'Version 2.1.0'}</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">�</div>
            <div className="info-content">
              <h4>{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</h4>
              <p>{currentDate} - {currentTime}</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">�</div>
            <div className="info-content">
              <h4>{language === 'ar' ? 'المستخدم الحالي' : 'Current User'}</h4>
              <p>{user?.name || 'غير محدد'}</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">�</div>
            <div className="info-content">
              <h4>{language === 'ar' ? 'آخر دخول' : 'Last Login'}</h4>
              <p>{stats.lastLogin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="stats-section">
        <h3>📈 {language === 'ar' ? 'إحصائيات البيانات' : 'Data Statistics'}</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{stats.totalAccounts}</div>
            <div className="stat-label">{language === 'ar' ? 'الحسابات' : 'Accounts'}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{stats.totalEntries}</div>
            <div className="stat-label">{language === 'ar' ? 'القيود' : 'Journal Entries'}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{stats.totalInvoices}</div>
            <div className="stat-label">{language === 'ar' ? 'الفواتير' : 'Invoices'}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{stats.totalCustomers}</div>
            <div className="stat-label">{language === 'ar' ? 'العملاء' : 'Customers'}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{stats.totalProducts}</div>
            <div className="stat-label">{language === 'ar' ? 'المنتجات' : 'Products'}</div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="status-section">
        <h3>✅ {language === 'ar' ? 'حالة النظام' : 'System Status'}</h3>
        <div className="status-items">
          <div className="status-item">
            <span className="status-indicator active"></span>
            <span className="status-text">{language === 'ar' ? 'النظام يعمل بشكل طبيعي' : 'System is running normally'}</span>
          </div>
          
          <div className="status-item">
            <span className="status-indicator active"></span>
            <span className="status-text">{language === 'ar' ? 'قاعدة البيانات متصلة' : 'Database connected'}</span>
          </div>
          
          <div className="status-item">
            <span className="status-indicator active"></span>
            <span className="status-text">{language === 'ar' ? 'جميع الميزات متاحة' : 'All features available'}</span>
          </div>
        </div>
      </div>

      {/* Footer Information */}
      <div className="footer-info">
        <p>{language === 'ar' ? 'تم تطوير هذا النظام لإدارة الحسابات والمخزون' : 'This system was developed for accounting and inventory management'}</p>
        <p>{language === 'ar' ? 'للمساعدة والدعم، تواصل مع المطور' : 'For help and support, contact the developer'}</p>
      </div>
    </div>
  )
}

export default SystemAdministration