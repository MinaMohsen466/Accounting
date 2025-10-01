import React, { useState, useMemo } from 'react';
import { useAccounting } from '../hooks/useAccounting';
import { useLanguage } from '../contexts/LanguageContext';
import './StockAlerts.css';

const StockAlerts = () => {
  const { products } = useAccounting();
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // حساب إنذارات المخزون
  const stockAlerts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products
      .filter(product => {
        const currentStock = parseFloat(product.quantity) || 0;
        const minStock = parseFloat(product.minStockLevel) || 0;
        const reorderLevel = parseFloat(product.reorderLevel) || 0;

        return currentStock <= Math.max(minStock, reorderLevel) && currentStock >= 0;
      })
      .map(product => {
        const currentStock = parseFloat(product.quantity) || 0;
        const minStock = parseFloat(product.minStockLevel) || 0;
        const reorderLevel = parseFloat(product.reorderLevel) || 0;
        const maxThreshold = Math.max(minStock, reorderLevel);

        let priority = 'low';
        let status = 'reorder_needed';

        if (currentStock === 0) {
          priority = 'critical';
          status = 'out_of_stock';
        } else if (currentStock <= minStock) {
          priority = 'high';
          status = 'critical_low';
        } else if (currentStock <= reorderLevel) {
          priority = 'medium';
          status = 'reorder_needed';
        }

        return {
          ...product,
          currentStock,
          minStock,
          reorderLevel,
          maxThreshold,
          priority,
          status,
          shortageAmount: maxThreshold - currentStock
        };
      })
      .sort((a, b) => {
        // ترتيب حسب الأولوية
        const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }, [products]);

  // إحصائيات التنبيهات
  const alertStats = useMemo(() => {
    const outOfStock = stockAlerts.filter(alert => alert.status === 'out_of_stock').length;
    const criticalLow = stockAlerts.filter(alert => alert.status === 'critical_low').length;
    const reorderNeeded = stockAlerts.filter(alert => alert.status === 'reorder_needed').length;

    return {
      outOfStock,
      criticalLow,
      reorderNeeded,
      total: stockAlerts.length
    };
  }, [stockAlerts]);

  // فلترة التنبيهات
  const filteredAlerts = useMemo(() => {
    if (selectedFilter === 'all') return stockAlerts;
    return stockAlerts.filter(alert => alert.status === selectedFilter);
  }, [stockAlerts, selectedFilter]);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const formatCurrency = (amount) => {
    return language === 'ar' ? `${amount} ج.م` : `${amount} EGP`;
  };

  const getStatusText = (status) => {
    const statusTexts = {
      out_of_stock: language === 'ar' ? 'نفد المخزون' : 'Out of Stock',
      critical_low: language === 'ar' ? 'مخزون منخفض جداً' : 'Critical Low',
      reorder_needed: language === 'ar' ? 'إعادة طلب مطلوبة' : 'Reorder Needed'
    };
    return statusTexts[status] || status;
  };

  const getPriorityText = (priority) => {
    const priorityTexts = {
      critical: language === 'ar' ? 'حرج' : 'Critical',
      high: language === 'ar' ? 'عالي' : 'High',
      medium: language === 'ar' ? 'متوسط' : 'Medium',
      low: language === 'ar' ? 'منخفض' : 'Low'
    };
    return priorityTexts[priority] || priority;
  };

  if (!products || products.length === 0) {
    return null;
  }

  if (stockAlerts.length === 0) {
    return (
      <div className="stock-alerts">
        <div className="alerts-header">
          <div className="alerts-title">
            <span className="alerts-icon">📦</span>
            <h3>{language === 'ar' ? 'تنبيهات المخزون' : 'Stock Alerts'}</h3>
          </div>
        </div>
        <div className="no-alerts">
          <p>{language === 'ar' ? 'جميع المنتجات بمستويات مخزون صحية! 👍' : 'All products have healthy stock levels! 👍'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-alerts">
      <div className="alerts-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="alerts-title">
          <span className="alerts-icon">📦</span>
          <h3>{language === 'ar' ? 'تنبيهات المخزون' : 'Stock Alerts'}</h3>
          <span className="alerts-count">{alertStats.total}</span>
        </div>
        <button className="collapse-btn">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* إحصائيات سريعة */}
          <div className="alerts-summary">
            <div className="summary-stats">
              <div 
                className={`stat-item out-of-stock ${selectedFilter === 'out_of_stock' ? 'active' : ''} ${alertStats.outOfStock === 0 ? 'disabled' : ''}`}
                onClick={() => handleFilterChange('out_of_stock')}
              >
                <div className="stat-number">{alertStats.outOfStock}</div>
                <div className="stat-label">{language === 'ar' ? 'نفد المخزون' : 'Out of Stock'}</div>
              </div>
              
              <div 
                className={`stat-item critical-low ${selectedFilter === 'critical_low' ? 'active' : ''} ${alertStats.criticalLow === 0 ? 'disabled' : ''}`}
                onClick={() => handleFilterChange('critical_low')}
              >
                <div className="stat-number">{alertStats.criticalLow}</div>
                <div className="stat-label">{language === 'ar' ? 'مخزون منخفض' : 'Critical Low'}</div>
              </div>
              
              <div 
                className={`stat-item reorder-needed ${selectedFilter === 'reorder_needed' ? 'active' : ''} ${alertStats.reorderNeeded === 0 ? 'disabled' : ''}`}
                onClick={() => handleFilterChange('reorder_needed')}
              >
                <div className="stat-number">{alertStats.reorderNeeded}</div>
                <div className="stat-label">{language === 'ar' ? 'إعادة طلب' : 'Reorder'}</div>
              </div>
              
              <div 
                className={`stat-item all ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                <div className="stat-number">{alertStats.total}</div>
                <div className="stat-label">{language === 'ar' ? 'الكل' : 'All'}</div>
              </div>
            </div>
          </div>

          {/* قائمة التنبيهات */}
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.status}`}>
                {/* معلومات المنتج */}
                <div className="alert-product">
                  <div className="product-header">
                    <span className="product-name">{alert.name}</span>
                    <span className="category-badge">{alert.category || 'عام'}</span>
                  </div>
                  <div className="product-details">
                    <span className="sku">رمز المنتج: {alert.sku || alert.id}</span>
                    {alert.brand && <span>العلامة التجارية: {alert.brand}</span>}
                    {alert.color && <span>اللون: {alert.color}</span>}
                  </div>
                </div>

                {/* معلومات المخزون */}
                <div className="stock-info">
                  <div className="stock-levels">
                    <div className="level-item current">
                      <span className="level-label">{language === 'ar' ? 'المخزون الحالي' : 'Current Stock'}</span>
                      <span className="level-value">{alert.currentStock} {alert.unit || 'قطعة'}</span>
                    </div>
                    <div className="level-item minimum">
                      <span className="level-label">{language === 'ar' ? 'الحد الأدنى' : 'Minimum Level'}</span>
                      <span className="level-value">{alert.minStock} {alert.unit || 'قطعة'}</span>
                    </div>
                    {alert.reorderLevel > 0 && (
                      <div className="level-item reorder">
                        <span className="level-label">{language === 'ar' ? 'نقطة إعادة الطلب' : 'Reorder Level'}</span>
                        <span className="level-value">{alert.reorderLevel} {alert.unit || 'قطعة'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="shortage-info">
                    <span className="shortage-label">{language === 'ar' ? 'النقص المطلوب' : 'Shortage Amount'}</span>
                    <span className="shortage-value">{alert.shortageAmount} {alert.unit || 'قطعة'}</span>
                  </div>
                </div>

                {/* معلومات التنبيه */}
                <div className="alert-info">
                  <div className="status-badge-container">
                    <span className={`status-badge ${alert.status}`}>
                      {getStatusText(alert.status)}
                    </span>
                  </div>
                  
                  <div className="priority-indicator">
                    <span className={`priority-badge ${alert.priority}`}>
                      {getPriorityText(alert.priority)}
                    </span>
                  </div>

                  {alert.lastPurchasePrice && (
                    <div className="price-info">
                      <span className="price-label">{language === 'ar' ? 'آخر سعر شراء' : 'Last Purchase Price'}</span>
                      <span className="price-value">{formatCurrency(alert.lastPurchasePrice)}</span>
                    </div>
                  )}
                </div>

                {/* إجراءات سريعة */}
                <div className="alert-actions">
                  <div className="estimated-cost">
                    {alert.lastPurchasePrice && (
                      <>
                        <span className="cost-label">{language === 'ar' ? 'التكلفة المقدرة' : 'Estimated Cost'}</span>
                        <span className="cost-value">
                          {formatCurrency((alert.lastPurchasePrice * alert.shortageAmount).toFixed(2))}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {alert.supplier && (
                    <div className="supplier-info">
                      <span className="supplier-label">{language === 'ar' ? 'المورد الأساسي' : 'Primary Supplier'}</span>
                      <span className="supplier-name">{alert.supplier}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StockAlerts;