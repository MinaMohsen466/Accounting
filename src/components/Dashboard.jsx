import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './Dashboard.css'

const Dashboard = ({ onNavigate }) => {
  const { 
    accounts, 
    journalEntries, 
    invoices, 
    customers, 
    suppliers,
    loading 
  } = useAccounting()

  const { t, language } = useLanguage()

  if (loading) {
    return <div className="loading">{t('loading')}</div>
  }

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboardTitle')}</h1>
        <p>{t('dashboardSubtitle')}</p>
      </div>

      {/* Main Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{t('accountsCount')}</h3>
            <p>{accounts.length}</p>
            <span>{t('accountsRegistered')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{t('entriesCount')}</h3>
            <p>{journalEntries.length}</p>
            <span>{t('entriesRecorded')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-info">
            <h3>{t('invoicesCount')}</h3>
            <p>{invoices.length}</p>
            <span>{t('invoicesIssued')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{t('clientsCount')}</h3>
            <p>{customers.length + suppliers.length}</p>
            <span>{t('clientsAndSuppliers')}</span>
          </div>
        </div>
      </div>

      {/* Sales & Purchase Overview */}
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

      {/* Recent Activities */}
      <div className="recent-activities">
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
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>{t('quickActions')}</h3>
        <div className="actions-container">
          <div className="actions-grid">
            <div className="action-card" onClick={handleAddNewEntry} style={{cursor: 'pointer'}}>
              <div className="action-icon">📝</div>
              <h4>{t('addNewEntry')}</h4>
              <p>{t('addNewEntryDesc')}</p>
            </div>
            <div className="action-card" onClick={handleCreateInvoice} style={{cursor: 'pointer'}}>
              <div className="action-icon">🧾</div>
              <h4>{t('createInvoice')}</h4>
              <p>{t('createInvoiceDesc')}</p>
            </div>
            <div className="action-card" onClick={handleAddClient} style={{cursor: 'pointer'}}>
              <div className="action-icon">👤</div>
              <h4>{t('addClient')}</h4>
              <p>{t('addClientDesc')}</p>
            </div>
            <div className="action-card" onClick={handleViewReports} style={{cursor: 'pointer'}}>
              <div className="action-icon">📈</div>
              <h4>{t('viewReports')}</h4>
              <p>{t('viewReportsDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard