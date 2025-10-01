import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { getInvoiceNotifications } from '../utils/invoiceUtils'
import './InvoiceNotifications.css'

const InvoiceNotifications = ({ invoices, onInvoiceClick }) => {
  const { t, language } = useLanguage()
  const [isCollapsed, setIsCollapsed] = useState(true) // مصغرة افتراضياً
  const notifications = getInvoiceNotifications(invoices)

  // Don't render if no notifications
  if (notifications.overdue.count === 0 && 
      notifications.dueToday.count === 0 && 
      notifications.dueSoon.count === 0) {
    return null
  }

  return (
    <div className="invoice-notifications">
      <div className="notifications-header">
        <div className="header-content">
          <h3>🔔 {t('invoiceNotifications')}</h3>
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'إظهار التفاصيل' : 'إخفاء التفاصيل'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
        {isCollapsed && (
          <div className="notifications-summary">
            {notifications.overdue.count > 0 && (
              <span className="summary-item overdue">
                🚨 {notifications.overdue.count} متأخرة
              </span>
            )}
            {notifications.dueToday.count > 0 && (
              <span className="summary-item due-today">
                🔔 {notifications.dueToday.count} مستحقة اليوم
              </span>
            )}
            {notifications.dueSoon.count > 0 && (
              <span className="summary-item due-soon">
                ⏰ {notifications.dueSoon.count} قريبة الاستحقاق
              </span>
            )}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="notifications-grid">
          {/* Overdue Invoices */}
          {notifications.overdue.count > 0 && (
            <div className="notification-card overdue">
              <div className="notification-icon">⚠️</div>
              <div className="notification-content">
                <div className="notification-title">{t('overdueInvoices')}</div>
                <div className="notification-stats">
                  <span className="count">{notifications.overdue.count}</span>
                  <span className="amount">{notifications.overdue.amount.toFixed(3)} {t('kwd')}</span>
                </div>
                <div className="notification-label">{t('urgentNotice')}</div>
              </div>
              {onInvoiceClick && (
                <div className="notification-actions">
                  {notifications.overdue.invoices.slice(0, 2).map(invoice => (
                    <div 
                      key={invoice.id}
                      className="invoice-quick-item"
                      onClick={() => onInvoiceClick(invoice)}
                    >
                      <span className="invoice-number">{invoice.invoiceNumber}</span>
                      <span className="client-name">{invoice.clientName}</span>
                      <span className="amount">{parseFloat(invoice.total).toFixed(3)}</span>
                    </div>
                  ))}
                  {notifications.overdue.count > 2 && (
                    <div className="more-items">
                      +{notifications.overdue.count - 2} {t('more')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Due Today */}
          {notifications.dueToday.count > 0 && (
            <div className="notification-card due-today">
              <div className="notification-icon">🔔</div>
              <div className="notification-content">
                <div className="notification-title">{t('invoicesDueToday')}</div>
                <div className="notification-stats">
                  <span className="count">{notifications.dueToday.count}</span>
                  <span className="amount">{notifications.dueToday.amount.toFixed(3)} {t('kwd')}</span>
                </div>
                <div className="notification-label">{t('dueToday')}</div>
              </div>
              {onInvoiceClick && (
                <div className="notification-actions">
                  {notifications.dueToday.invoices.slice(0, 2).map(invoice => (
                    <div 
                      key={invoice.id}
                      className="invoice-quick-item"
                      onClick={() => onInvoiceClick(invoice)}
                    >
                      <span className="invoice-number">{invoice.invoiceNumber}</span>
                      <span className="client-name">{invoice.clientName}</span>
                      <span className="amount">{parseFloat(invoice.total).toFixed(3)}</span>
                    </div>
                  ))}
                  {notifications.dueToday.count > 2 && (
                    <div className="more-items">
                      +{notifications.dueToday.count - 2} {t('more')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Due Soon */}
          {notifications.dueSoon.count > 0 && (
            <div className="notification-card due-soon">
              <div className="notification-icon">⏰</div>
              <div className="notification-content">
                <div className="notification-title">{t('invoicesDueSoon')}</div>
                <div className="notification-stats">
                  <span className="count">{notifications.dueSoon.count}</span>
                  <span className="amount">{notifications.dueSoon.amount.toFixed(3)} {t('kwd')}</span>
                </div>
                <div className="notification-label">{t('paymentReminder')}</div>
              </div>
              {onInvoiceClick && (
                <div className="notification-actions">
                  {notifications.dueSoon.invoices.slice(0, 2).map(invoice => (
                    <div 
                      key={invoice.id}
                      className="invoice-quick-item"
                      onClick={() => onInvoiceClick(invoice)}
                    >
                      <span className="invoice-number">{invoice.invoiceNumber}</span>
                      <span className="client-name">{invoice.clientName}</span>
                      <span className="amount">{parseFloat(invoice.total).toFixed(3)}</span>
                    </div>
                  ))}
                  {notifications.dueSoon.count > 2 && (
                    <div className="more-items">
                      +{notifications.dueSoon.count - 2} {t('more')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InvoiceNotifications