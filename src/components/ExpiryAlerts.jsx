import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { PaintProductService, CATEGORY_DETAILS } from '../services/PaintProductService'
import './ExpiryAlerts.css'

const ExpiryAlerts = () => {
  const { inventoryItems } = useAccounting()
  const { t } = useLanguage()
  const [alerts, setAlerts] = useState([])
  const [showExpired, setShowExpired] = useState(true)
  const [showExpiringSoon, setShowExpiringSoon] = useState(true)
  const [showExpiring3Months, setShowExpiring3Months] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const expiryAlerts = []

    inventoryItems.forEach(item => {
      const expiryStatus = PaintProductService.checkExpiryStatus(item.expiryDate)
      
      if (expiryStatus.status !== 'no_expiry' && expiryStatus.status !== 'valid') {
        const categoryDetails = CATEGORY_DETAILS[item.category] || CATEGORY_DETAILS[item.productType]
        
        expiryAlerts.push({
          ...item,
          expiryStatus,
          categoryDetails,
          priority: getPriority(expiryStatus.status),
          daysText: getDaysText(expiryStatus)
        })
      }
    })

    // Sort by priority (most urgent first)
    expiryAlerts.sort((a, b) => b.priority - a.priority)
    setAlerts(expiryAlerts)
  }, [inventoryItems])

  const getPriority = (status) => {
    switch (status) {
      case 'expired': return 5
      case 'expiring_soon': return 4
      case 'expiring_within_3_months': return 3
      default: return 1
    }
  }

  const getDaysText = (expiryStatus) => {
    if (expiryStatus.status === 'expired') {
      return `منتهي منذ ${expiryStatus.daysLeft} ${expiryStatus.daysLeft === 1 ? 'يوم' : 'أيام'}`
    } else {
      return `${expiryStatus.daysLeft} ${expiryStatus.daysLeft === 1 ? 'يوم' : 'أيام'} متبقية`
    }
  }

  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      if (alert.expiryStatus.status === 'expired' && !showExpired) return false
      if (alert.expiryStatus.status === 'expiring_soon' && !showExpiringSoon) return false
      if (alert.expiryStatus.status === 'expiring_within_3_months' && !showExpiring3Months) return false
      return true
    })
  }

  const filteredAlerts = getFilteredAlerts()
  const expiredCount = alerts.filter(a => a.expiryStatus.status === 'expired').length
  const expiringSoonCount = alerts.filter(a => a.expiryStatus.status === 'expiring_soon').length
  const expiring3MonthsCount = alerts.filter(a => a.expiryStatus.status === 'expiring_within_3_months').length

  if (alerts.length === 0) return null

  return (
    <div className="expiry-alerts">
      <div className="alerts-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="alerts-title">
          <span className="alerts-icon">⚠️</span>
          <h3>{t('expiryAlerts')}</h3>
          <span className="alerts-count">{filteredAlerts.length}</span>
        </div>
        <button className="collapse-btn">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Summary */}
          <div className="alerts-summary">
            <div className="summary-stats">
              <div 
                className={`stat-item expired ${!showExpired ? 'disabled' : ''}`}
                onClick={() => setShowExpired(!showExpired)}
              >
                <span className="stat-number">{expiredCount}</span>
                <span className="stat-label">{t('expired')}</span>
              </div>
              <div 
                className={`stat-item expiring-soon ${!showExpiringSoon ? 'disabled' : ''}`}
                onClick={() => setShowExpiringSoon(!showExpiringSoon)}
              >
                <span className="stat-number">{expiringSoonCount}</span>
                <span className="stat-label">{t('expiringSoon')}</span>
              </div>
              <div 
                className={`stat-item expiring-3months ${!showExpiring3Months ? 'disabled' : ''}`}
                onClick={() => setShowExpiring3Months(!showExpiring3Months)}
              >
                <span className="stat-number">{expiring3MonthsCount}</span>
                <span className="stat-label">{t('expiring3Months')}</span>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="alerts-list">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.expiryStatus.status}`}
              >
                <div className="alert-product">
                  <div className="product-header">
                    <span className="product-name">{alert.name}</span>
                    {alert.categoryDetails && (
                      <span 
                        className="category-badge"
                        style={{backgroundColor: alert.categoryDetails.color}}
                      >
                        {alert.categoryDetails.icon} {alert.categoryDetails.nameAr}
                      </span>
                    )}
                  </div>
                  
                  <div className="product-details">
                    <span className="sku">SKU: {alert.sku}</span>
                    <span className="manufacturer">
                      {alert.manufacturer && `${t('manufacturer')}: ${alert.manufacturer}`}
                    </span>
                    {alert.batchNumber && (
                      <span className="batch">رقم الدفعة: {alert.batchNumber}</span>
                    )}
                  </div>
                </div>

                <div className="alert-info">
                  <div className="expiry-date">
                    <span className="date-label">{t('expiryDate')}:</span>
                    <span className="date-value">
                      {new Date(alert.expiryDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  
                  <div className={`status-badge ${alert.expiryStatus.status}`}>
                    {alert.daysText}
                  </div>
                </div>

                <div className="alert-actions">
                  <div className="quantity-info">
                    <span className="quantity">{alert.quantity}</span>
                    <span className="unit">{alert.unit || 'قطعة'}</span>
                  </div>
                  
                  {alert.expiryStatus.status === 'expired' && (
                    <div className="urgency-indicator critical">
                      {t('urgent')}
                    </div>
                  )}
                  {alert.expiryStatus.status === 'expiring_soon' && (
                    <div className="urgency-indicator warning">
                      {t('attention')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="no-alerts">
              <p>{t('noExpiryAlerts')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ExpiryAlerts