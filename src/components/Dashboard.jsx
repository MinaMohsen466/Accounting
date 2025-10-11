import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import InvoiceNotifications from './InvoiceNotifications'
import { updateInvoicesStatus, getInvoiceNotifications } from '../utils/invoiceUtils'
import ExpiryAlerts from './ExpiryAlerts'
import StockAlerts from './StockAlerts'
import './Dashboard.css'

const Dashboard = ({ onNavigate }) => {
  const { 
    accounts, 
    journalEntries, 
    invoices, 
    customers, 
    suppliers,
    inventoryItems,
    loading 
  } = useAccounting()

  const { t, language, notificationsEnabled } = useLanguage()
  const { hasPermission } = useAuth()

  if (loading) {
    return <div className="loading">{t('loading')}</div>
  }

  // Prepare invoices and notifications for display
  const invoicesForNotifications = updateInvoicesStatus(Array.isArray(invoices) ? invoices : [])
  const notificationsSummary = getInvoiceNotifications(invoicesForNotifications)
  const totalNotifCount = (notificationsSummary?.overdue?.count || 0) + (notificationsSummary?.dueToday?.count || 0) + (notificationsSummary?.dueSoon?.count || 0)

  // Calculate low stock items
  const lowStockItems = inventoryItems?.filter(item => {
    const min = (item.minStockLevel != null) ? Number(item.minStockLevel) : null
    return min !== null && Number(item.quantity) < min
  }) || []

  // Calculate expired items (within 30 days)
  const expiredItems = inventoryItems?.filter(item => {
    if (!item.expiryDate) return false
    const today = new Date()
    const expiry = new Date(item.expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays >= 0
  }) || []

  // Calculate statistics
  const totalSalesInvoices = invoices.filter(inv => inv.type === 'sales').length
  const totalPurchaseInvoices = invoices.filter(inv => inv.type === 'purchase').length
  const totalSalesAmount = invoices
    .filter(inv => inv.type === 'sales')
    .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
  const totalPurchaseAmount = invoices
    .filter(inv => inv.type === 'purchase')
    .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)

  // Recent activities (last 5 items)
  const recentEntries = journalEntries
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return language === 'ar' ? date.toLocaleDateString('ar-EG') : date.toLocaleDateString('en-US')
  }

  // وظائف التنقل للأزرار
  const handleAddNewEntry = () => {
    if (onNavigate) onNavigate('entries')
  }

  const handleCreateInvoice = () => {
    if (onNavigate) onNavigate('invoices')
  }

  const handleAddClient = () => {
    if (onNavigate) onNavigate('customers')
  }

  const handleViewReports = () => {
    if (onNavigate) onNavigate('reports')
  }

  const handleOpenSettings = () => {
    if (onNavigate) onNavigate('settings')
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboardTitle')}</h1>
        <p>{t('dashboardSubtitle')}</p>
      </div>

      {/* Modern Notifications Panel */}
      {(notificationsEnabled || totalNotifCount > 0 || lowStockItems.length > 0 || expiredItems.length > 0) && (
        <div className="modern-notifications-panel">
          <div className="notifications-header">
            <h2>🔔 التنبيهات والإشعارات</h2>
            <span className="total-count">
              {totalNotifCount + lowStockItems.length + expiredItems.length}
            </span>
          </div>
          
          <div className="notifications-grid">
            {/* Invoice Notifications */}
            {totalNotifCount > 0 && (
              <div className="notification-card invoice-card">
                <div className="card-header">
                  <span className="card-icon">💳</span>
                  <h3>الفواتير</h3>
                  <span className="badge">{totalNotifCount}</span>
                </div>
                <div className="card-content">
                  {notificationsSummary.overdue.count > 0 && (
                    <div className="notification-item overdue">
                      <span className="item-icon">🚨</span>
                      <span className="item-text">{notificationsSummary.overdue.count} فاتورة متأخرة</span>
                      <span className="item-amount">{notificationsSummary.overdue.amount.toFixed(2)} د.ك</span>
                    </div>
                  )}
                  {notificationsSummary.dueToday.count > 0 && (
                    <div className="notification-item due-today">
                      <span className="item-icon">📅</span>
                      <span className="item-text">{notificationsSummary.dueToday.count} مستحقة اليوم</span>
                      <span className="item-amount">{notificationsSummary.dueToday.amount.toFixed(2)} د.ك</span>
                    </div>
                  )}
                  {notificationsSummary.dueSoon.count > 0 && (
                    <div className="notification-item due-soon">
                      <span className="item-icon">⏰</span>
                      <span className="item-text">{notificationsSummary.dueSoon.count} قريبة الاستحقاق</span>
                      <span className="item-amount">{notificationsSummary.dueSoon.amount.toFixed(2)} د.ك</span>
                    </div>
                  )}
                </div>
                <div className="card-action">
                  <button onClick={() => onNavigate && onNavigate('invoices')} className="action-btn">
                    عرض الفواتير
                  </button>
                </div>
              </div>
            )}

            {/* Stock Alerts */}
            {lowStockItems.length > 0 && (
              <div className="notification-card stock-card">
                <div className="card-header">
                  <span className="card-icon">📦</span>
                  <h3>المخزون</h3>
                  <span className="badge">{lowStockItems.length}</span>
                </div>
                <div className="card-content">
                  <div className="notification-item low-stock">
                    <span className="item-icon">⚠️</span>
                    <span className="item-text">منتجات أقل من الحد الأدنى</span>
                  </div>
                  <div className="stock-items">
                    {lowStockItems.slice(0, 3).map(item => (
                      <div key={item.id} className="stock-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">{item.quantity} متبقي</span>
                      </div>
                    ))}
                    {lowStockItems.length > 3 && (
                      <div className="more-items">+{lowStockItems.length - 3} منتج آخر</div>
                    )}
                  </div>
                </div>
                <div className="card-action">
                  <button onClick={() => onNavigate && onNavigate('inventory')} className="action-btn">
                    عرض المخزون
                  </button>
                </div>
              </div>
            )}

            {/* Expiry Alerts */}
            {expiredItems.length > 0 && (
              <div className="notification-card expiry-card">
                <div className="card-header">
                  <span className="card-icon">⏳</span>
                  <h3>انتهاء الصلاحية</h3>
                  <span className="badge">{expiredItems.length}</span>
                </div>
                <div className="card-content">
                  <div className="notification-item expired">
                    <span className="item-icon">🗓️</span>
                    <span className="item-text">منتجات قريبة من انتهاء الصلاحية</span>
                  </div>
                  <div className="expiry-items">
                    {expiredItems.slice(0, 3).map(item => (
                      <div key={item.id} className="expiry-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-date">{new Date(item.expiryDate).toLocaleDateString('ar-EG')}</span>
                      </div>
                    ))}
                    {expiredItems.length > 3 && (
                      <div className="more-items">+{expiredItems.length - 3} منتج آخر</div>
                    )}
                  </div>
                </div>
                <div className="card-action">
                  <button onClick={() => onNavigate && onNavigate('inventory')} className="action-btn">
                    عرض المخزون
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Statistics */}
      <div className="dashboard-stats">
        {hasPermission('view_chart_of_accounts') && (
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{t('accountsCount')}</h3>
              <p>{accounts.length}</p>
              <span>{t('accountsRegistered')}</span>
            </div>
          </div>
        )}

        {hasPermission('view_journal_entries') && (
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>{t('entriesCount')}</h3>
              <p>{journalEntries.length}</p>
              <span>{t('entriesRecorded')}</span>
            </div>
          </div>
        )}

        {hasPermission('view_invoices') && (
          <div className="stat-card">
            <div className="stat-icon">🧾</div>
            <div className="stat-info">
              <h3>{t('invoicesCount')}</h3>
              <p>{invoices.length}</p>
              <span>{t('invoicesIssued')}</span>
            </div>
          </div>
        )}

        {hasPermission('view_customers_suppliers') && (
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{t('clientsCount')}</h3>
              <p>{customers.length + suppliers.length}</p>
              <span>{t('clientsAndSuppliers')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sales & Purchase Overview */}
      {hasPermission('view_invoices') && (
        <div className="overview-section">
          <div className="overview-card sales">
            <h3>📈 {t('salesOverview')}</h3>
            <div className="overview-stats">
              <div className="overview-item">
                <label>{t('salesInvoicesCount')}</label>
                <span>{totalSalesInvoices}</span>
              </div>
              <div className="overview-item">
                <label>{t('totalSalesAmount')}</label>
                <span className="amount">{totalSalesAmount.toFixed(2)} {t('currency')}</span>
              </div>
              <div className="overview-item">
                <label>{t('averageInvoiceAmount')}</label>
                <span className="amount">
                  {totalSalesInvoices > 0 ? (totalSalesAmount / totalSalesInvoices).toFixed(2) : '0.00'} {t('currency')}
                </span>
              </div>
            </div>
          </div>

          <div className="overview-card purchases">
            <h3>📉 {t('purchaseOverview')}</h3>
            <div className="overview-stats">
              <div className="overview-item">
                <label>{t('purchaseInvoicesCount')}</label>
                <span>{totalPurchaseInvoices}</span>
              </div>
              <div className="overview-item">
                <label>{t('totalPurchaseAmount')}</label>
                <span className="amount">{totalPurchaseAmount.toFixed(2)} {t('currency')}</span>
              </div>
              <div className="overview-item">
                <label>{t('averageInvoiceAmount')}</label>
                <span className="amount">
                  {totalPurchaseInvoices > 0 ? (totalPurchaseAmount / totalPurchaseInvoices).toFixed(2) : '0.00'} {t('currency')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="recent-activities">
        {hasPermission('view_journal_entries') && (
          <div className="activity-section">
            <h3>{t('recentEntries')}</h3>
            {recentEntries.length > 0 ? (
              <div className="activity-list">
                {recentEntries.map(entry => (
                  <div key={entry.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-details">
                      <div className="activity-title">
                        {language === 'ar' 
                          ? `القيد رقم ${entry.entryNumber}`
                          : `Entry #${entry.entryNumber}`
                        }
                      </div>
                      <div className="activity-desc">{entry.description}</div>
                      <div className="activity-date">
                        {formatDate(entry.date)}
                      </div>
                    </div>
                    <div className="activity-amount">
                      {entry.lines?.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0).toFixed(2)} {t('currency')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-activity">{t('noEntriesYet')}</div>
            )}
          </div>
        )}

        {hasPermission('view_invoices') && (
          <div className="activity-section">
            <h3>{t('recentInvoices')}</h3>
            {recentInvoices.length > 0 ? (
            <div className="activity-list">
              {recentInvoices.map(invoice => (
                <div key={invoice.id} className="activity-item">
                  <div className={`activity-icon ${invoice.type}`}>
                    {invoice.type === 'sales' ? '💰' : '🛒'}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">
                      {language === 'ar' 
                        ? `فاتورة ${invoice.type === 'sales' ? 'مبيعات' : 'مشتريات'} رقم ${invoice.invoiceNumber}`
                        : `${invoice.type === 'sales' ? 'Sales' : 'Purchase'} Invoice #${invoice.invoiceNumber}`
                      }
                    </div>
                    <div className="activity-desc">{invoice.clientName}</div>
                    <div className="activity-date">
                      {formatDate(invoice.date)}
                    </div>
                  </div>
                  <div className="activity-amount">
                    {parseFloat(invoice.total).toFixed(2)} {t('currency')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">{t('noInvoicesYet')}</div>
          )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>{t('quickActions')}</h3>
        <div className="actions-container">
          <div className="actions-grid">
            {hasPermission('create_journal_entries') && (
              <div className="action-card" onClick={handleAddNewEntry} style={{cursor: 'pointer'}}>
                <div className="action-icon">📝</div>
                <h4>{t('addNewEntry')}</h4>
                <p>{t('addNewEntryDesc')}</p>
              </div>
            )}
            {hasPermission('create_invoices') && (
              <div className="action-card" onClick={handleCreateInvoice} style={{cursor: 'pointer'}}>
                <div className="action-icon">🧾</div>
                <h4>{t('createInvoice')}</h4>
                <p>{t('createInvoiceDesc')}</p>
              </div>
            )}
            {hasPermission('create_customers_suppliers') && (
              <div className="action-card" onClick={handleAddClient} style={{cursor: 'pointer'}}>
                <div className="action-icon">👤</div>
                <h4>{t('addClient')}</h4>
                <p>{t('addClientDesc')}</p>
              </div>
            )}
            {hasPermission('view_financial_reports') && (
              <div className="action-card" onClick={handleViewReports} style={{cursor: 'pointer'}}>
                <div className="action-icon">📈</div>
                <h4>{t('viewReports')}</h4>
                <p>{t('viewReportsDesc')}</p>
              </div>
            )}
            {hasPermission('view_settings') && (
              <div className="action-card" onClick={handleOpenSettings} style={{cursor: 'pointer'}}>
                <div className="action-icon">⚙️</div>
                <h4>{t('settings')}</h4>
                <p>{t('settingsDescription')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard