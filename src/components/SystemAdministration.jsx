import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import PermissionDenied from './PermissionDenied'
import './SystemAdministration.css'

const SystemAdministration = () => {
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()
  const [logs, setLogs] = useState([])
  const [systemStatus, setSystemStatus] = useState({
    uptime: '24:15:30',
    memory: '2.1 GB / 8 GB',
    storage: '45 GB / 100 GB',
    activeUsers: 5,
    lastBackup: '2025-10-05 09:30:00'
  })

  // Check if user has permission to access system administration
  if (!hasPermission('system_maintenance') && !hasPermission('view_system_logs') && !hasPermission('manage_system_backups')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لإدارة النظام"
        description="تحتاج إلى صلاحية 'صيانة النظام' أو 'عرض سجلات النظام' للوصول إلى هذه الصفحة"
      />
    )
  }

  const handleSystemMaintenance = () => {
    if (!hasPermission('system_maintenance')) {
      alert('ليس لديك صلاحية لصيانة النظام')
      return
    }
    
    if (window.confirm('هل أنت متأكد من إجراء صيانة النظام؟ قد يستغرق هذا بضع دقائق.')) {
      // Simulate system maintenance
      alert('تم بدء صيانة النظام بنجاح')
    }
  }

  const handleCreateBackup = () => {
    if (!hasPermission('manage_system_backups')) {
      alert('ليس لديك صلاحية لإدارة النسخ الاحتياطية')
      return
    }
    
    if (window.confirm('هل تريد إنشاء نسخة احتياطية من النظام؟')) {
      // Simulate backup creation
      const now = new Date().toLocaleString('ar-EG')
      setSystemStatus(prev => ({ ...prev, lastBackup: now }))
      alert('تم إنشاء النسخة الاحتياطية بنجاح')
    }
  }

  const handleClearLogs = () => {
    if (!hasPermission('view_system_logs')) {
      alert('ليس لديك صلاحية لإدارة سجلات النظام')
      return
    }
    
    if (window.confirm('هل تريد مسح جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setLogs([])
      alert('تم مسح السجلات بنجاح')
    }
  }

  const handleRestartSystem = () => {
    if (!hasPermission('system_maintenance')) {
      alert('ليس لديك صلاحية لإعادة تشغيل النظام')
      return
    }
    
    if (window.confirm('هل أنت متأكد من إعادة تشغيل النظام؟ سيتم قطع الاتصال عن جميع المستخدمين.')) {
      alert('سيتم إعادة تشغيل النظام خلال 30 ثانية')
    }
  }

  return (
    <div className="system-administration">
      <div className="system-header">
        <h2>🔧 {language === 'ar' ? 'إدارة النظام' : 'System Administration'}</h2>
        <p>{language === 'ar' ? 'مراقبة وصيانة النظام' : 'Monitor and maintain system'}</p>
      </div>

      {/* System Status */}
      <div className="system-status-section">
        <h3>📊 {language === 'ar' ? 'حالة النظام' : 'System Status'}</h3>
        <div className="status-cards">
          <div className="status-card">
            <div className="status-icon">⏱️</div>
            <div className="status-info">
              <h4>{language === 'ar' ? 'وقت التشغيل' : 'Uptime'}</h4>
              <p>{systemStatus.uptime}</p>
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-icon">💾</div>
            <div className="status-info">
              <h4>{language === 'ar' ? 'الذاكرة' : 'Memory'}</h4>
              <p>{systemStatus.memory}</p>
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-icon">💽</div>
            <div className="status-info">
              <h4>{language === 'ar' ? 'التخزين' : 'Storage'}</h4>
              <p>{systemStatus.storage}</p>
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-icon">👥</div>
            <div className="status-info">
              <h4>{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</h4>
              <p>{systemStatus.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="system-actions-section">
        <h3>⚙️ {language === 'ar' ? 'إجراءات النظام' : 'System Actions'}</h3>
        <div className="actions-grid">
          {hasPermission('system_maintenance') && (
            <button className="action-btn maintenance" onClick={handleSystemMaintenance}>
              <span className="action-icon">🔧</span>
              <span className="action-label">{language === 'ar' ? 'صيانة النظام' : 'System Maintenance'}</span>
              <span className="action-desc">{language === 'ar' ? 'تنظيف وتحسين الأداء' : 'Clean and optimize performance'}</span>
            </button>
          )}

          {hasPermission('manage_system_backups') && (
            <button className="action-btn backup" onClick={handleCreateBackup}>
              <span className="action-icon">💾</span>
              <span className="action-label">{language === 'ar' ? 'إنشاء نسخة احتياطية' : 'Create Backup'}</span>
              <span className="action-desc">{language === 'ar' ? 'حفظ نسخة من البيانات' : 'Save data copy'}</span>
            </button>
          )}

          {hasPermission('view_system_logs') && (
            <button className="action-btn logs" onClick={handleClearLogs}>
              <span className="action-icon">📋</span>
              <span className="action-label">{language === 'ar' ? 'مسح السجلات' : 'Clear Logs'}</span>
              <span className="action-desc">{language === 'ar' ? 'حذف سجلات النظام القديمة' : 'Delete old system logs'}</span>
            </button>
          )}

          {hasPermission('system_maintenance') && (
            <button className="action-btn restart" onClick={handleRestartSystem}>
              <span className="action-icon">🔄</span>
              <span className="action-label">{language === 'ar' ? 'إعادة تشغيل النظام' : 'Restart System'}</span>
              <span className="action-desc">{language === 'ar' ? 'إعادة تشغيل كامل للنظام' : 'Full system restart'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Backup Information */}
      {hasPermission('manage_system_backups') && (
        <div className="backup-section">
          <h3>💾 {language === 'ar' ? 'معلومات النسخ الاحتياطية' : 'Backup Information'}</h3>
          <div className="backup-info">
            <div className="backup-item">
              <span className="backup-label">{language === 'ar' ? 'آخر نسخة احتياطية:' : 'Last Backup:'}</span>
              <span className="backup-value">{systemStatus.lastBackup}</span>
            </div>
            <div className="backup-item">
              <span className="backup-label">{language === 'ar' ? 'حجم النسخة الاحتياطية:' : 'Backup Size:'}</span>
              <span className="backup-value">1.2 GB</span>
            </div>
            <div className="backup-item">
              <span className="backup-label">{language === 'ar' ? 'مكان التخزين:' : 'Storage Location:'}</span>
              <span className="backup-value">/backups/accounting-system/</span>
            </div>
          </div>
        </div>
      )}

      {/* System Logs */}
      {hasPermission('view_system_logs') && (
        <div className="logs-section">
          <h3>📋 {language === 'ar' ? 'سجلات النظام' : 'System Logs'}</h3>
          {logs.length === 0 ? (
            <div className="no-logs">
              <p>{language === 'ar' ? 'لا توجد سجلات لعرضها' : 'No logs to display'}</p>
            </div>
          ) : (
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className={`log-item ${log.type}`}>
                  <span className="log-time">{log.time}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SystemAdministration