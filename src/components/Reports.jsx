import { useState, useEffect, useMemo } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './Reports.css'

const Reports = () => {
  const { 
    accounts, 
    journalEntries,
    customers,
    suppliers,
    invoices,
    inventoryItems
  } = useAccounting()
  const { t, language } = useLanguage()

  const [activeReport, setActiveReport] = useState('trialBalance')
  const [refreshKey, setRefreshKey] = useState(0)
  const [dateFilter, setDateFilter] = useState({
    type: 'current_year', // today, current_week, current_month, current_year, custom, all_time
    startDate: '',
    endDate: ''
  })

  // خيارات الفلترة الزمنية
  const dateFilterOptions = [
    { value: 'today', label: language === 'ar' ? 'اليوم' : 'Today' },
    { value: 'current_week', label: language === 'ar' ? 'هذا الأسبوع' : 'This Week' },
    { value: 'current_month', label: language === 'ar' ? 'هذا الشهر' : 'This Month' },
    { value: 'current_year', label: language === 'ar' ? 'هذه السنة' : 'This Year' },
    { value: 'custom', label: language === 'ar' ? 'فترة مخصصة' : 'Custom Period' },
    { value: 'all_time', label: language === 'ar' ? 'جميع الفترات' : 'All Time' }
  ]

  // حساب نطاق التواريخ بناءً على نوع الفلتر
  const getDateRange = () => {
    const today = new Date()
    const startOfToday = new Date(today.setHours(0, 0, 0, 0))
    const endOfToday = new Date(today.setHours(23, 59, 59, 999))

    switch (dateFilter.type) {
      case 'today':
        return {
          start: startOfToday,
          end: endOfToday
        }
      
      case 'current_week':
        const startOfWeek = new Date(today)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
        startOfWeek.setDate(diff)
        startOfWeek.setHours(0, 0, 0, 0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        
        return {
          start: startOfWeek,
          end: endOfWeek
        }
      
      case 'current_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endOfMonth.setHours(23, 59, 59, 999)
        
        return {
          start: startOfMonth,
          end: endOfMonth
        }
      
      case 'current_year':
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        const endOfYear = new Date(today.getFullYear(), 11, 31)
        endOfYear.setHours(23, 59, 59, 999)
        
        return {
          start: startOfYear,
          end: endOfYear
        }
      
      case 'custom':
        return {
          start: dateFilter.startDate ? new Date(dateFilter.startDate) : new Date(0),
          end: dateFilter.endDate ? new Date(dateFilter.endDate) : new Date()
        }
      
      case 'all_time':
      default:
        return {
          start: new Date(0),
          end: new Date()
        }
    }
  }

  // فلترة البيانات حسب النطاق الزمني
  const getFilteredData = () => {
    const { start, end } = getDateRange()
    
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date)
      return invoiceDate >= start && invoiceDate <= end
    })

    const filteredJournalEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= start && entryDate <= end
    })

    return {
      invoices: filteredInvoices,
      journalEntries: filteredJournalEntries,
      dateRange: {
        start: start.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
        end: end.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
      }
    }
  }

  // الاستماع لتحديثات البيانات المحاسبية
  useEffect(() => {
    const handleDataUpdate = () => {
      setRefreshKey(prev => prev + 1)
    }

    // الاستماع للأحداث المخصصة لتحديث البيانات
    window.addEventListener('accountingDataUpdated', handleDataUpdate)
    
    // تنظيف المستمع عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener('accountingDataUpdated', handleDataUpdate)
    }
  }, [])

  // مراقبة تغييرات بيانات الفواتير مباشرة
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
  }, [invoices, inventoryItems, dateFilter])

  // حساب قائمة الدخل مع الفلترة الزمنية
  const getIncomeStatement = () => {
    const { invoices: filteredInvoices, dateRange } = getFilteredData()

    // حساب الإيرادات (جميع فواتير المبيعات - بغض النظر عن حالة الدفع)
    const salesRevenue = filteredInvoices
      .filter(invoice => invoice.type === 'sales')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // حساب تكلفة البضاعة المباعة (جميع فواتير المشتريات - بغض النظر عن حالة الدفع)
    const costOfGoodsSold = filteredInvoices
      .filter(invoice => invoice.type === 'purchase')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // تفصيل الإيرادات حسب حالة الدفع للمعلومات الإضافية
    const paidSalesRevenue = filteredInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)
    
    const unpaidSalesRevenue = filteredInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus !== 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // حساب الخصومات والضرائب
    const totalDiscount = filteredInvoices
      .filter(invoice => invoice.type === 'sales')
      .reduce((total, invoice) => total + (parseFloat(invoice.discount) || 0), 0)

    const totalVAT = filteredInvoices
      .filter(invoice => invoice.type === 'sales')
      .reduce((total, invoice) => total + (parseFloat(invoice.vat) || 0), 0)

    // حساب مجمل الربح
    const grossProfit = salesRevenue - costOfGoodsSold

    // مصروفات تشغيلية مقدرة (يمكن تخصيصها لاحقاً)
    const operatingExpenses = 0 // يمكن إضافة حسابات المصروفات هنا

    // صافي الربح
    const netIncome = grossProfit - operatingExpenses

    // احصائيات إضافية
    const salesCount = filteredInvoices.filter(invoice => invoice.type === 'sales').length
    const purchaseCount = filteredInvoices.filter(invoice => invoice.type === 'purchase').length
    const averageSaleAmount = salesCount > 0 ? salesRevenue / salesCount : 0
    const averagePurchaseAmount = purchaseCount > 0 ? costOfGoodsSold / purchaseCount : 0

    return {
      salesRevenue,
      paidSalesRevenue,
      unpaidSalesRevenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      netIncome,
      totalDiscount,
      totalVAT,
      salesCount,
      purchaseCount,
      averageSaleAmount,
      averagePurchaseAmount,
      period: `${dateRange.start} - ${dateRange.end}`,
      filterType: dateFilter.type
    }
  }

  // حساب الميزانية العمومية مع الفلترة الزمنية
  const getBalanceSheet = () => {
    const { invoices: filteredInvoices, dateRange } = getFilteredData()

    // الأصول المتداولة
    // النقدية (الفواتير المدفوعة فقط)
    const paidSales = filteredInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)
    
    const paidPurchases = filteredInvoices
      .filter(invoice => invoice.type === 'purchase' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    const cash = paidSales - paidPurchases

    // الذمم المدينة (جميع فواتير المبيعات غير المدفوعة)
    const accountsReceivable = filteredInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus !== 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // المخزون (قيمة المخزون الحالي - متأثر بجميع الفواتير)
    const inventoryValue = inventoryItems
      .reduce((total, item) => {
        const quantity = parseFloat(item.quantity) || 0
        const price = parseFloat(item.price) || 0
        return total + (quantity * price)
      }, 0)

    // إجمالي الأصول المتداولة
    const currentAssets = cash + accountsReceivable + inventoryValue

    // الأصول الثابتة (افتراضية - يمكن إضافتها لاحقاً)
    const fixedAssets = 0

    // إجمالي الأصول
    const totalAssets = currentAssets + fixedAssets

    // الخصوم المتداولة
    // الذمم الدائنة (جميع فواتير المشتريات غير المدفوعة)
    const accountsPayable = filteredInvoices
      .filter(invoice => invoice.type === 'purchase' && invoice.paymentStatus !== 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // إجمالي الخصوم
    const totalLiabilities = accountsPayable

    // حقوق الملكية
    const retainedEarnings = getIncomeStatement().netIncome
    const totalEquity = retainedEarnings

    // احصائيات إضافية
    const receivableCount = filteredInvoices.filter(invoice => 
      invoice.type === 'sales' && invoice.paymentStatus !== 'paid'
    ).length

    const payableCount = filteredInvoices.filter(invoice => 
      invoice.type === 'purchase' && invoice.paymentStatus !== 'paid'
    ).length

    return {
      assets: {
        currentAssets: {
          cash,
          accountsReceivable,
          inventory: inventoryValue,
          total: currentAssets
        },
        fixedAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable,
          total: accountsPayable
        },
        totalLiabilities
      },
      equity: {
        retainedEarnings,
        totalEquity
      },
      additionalInfo: {
        receivableCount,
        payableCount,
        inventoryItemsCount: inventoryItems.length
      },
      period: `${dateRange.start} - ${dateRange.end}`,
      date: new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
    }
  }

  // حساب ميزان المراجعة مع الفلترة الزمنية
  const getTrialBalance = () => {
    const { journalEntries: filteredEntries, dateRange } = getFilteredData()
    
    const balances = accounts.map(account => {
      let debit = 0
      let credit = 0

      // حساب الأرصدة من القيود المفلترة
      filteredEntries.forEach(entry => {
        entry.lines?.forEach(line => {
          if (line.accountId === account.id) {
            debit += parseFloat(line.debit) || 0
            credit += parseFloat(line.credit) || 0
          }
        })
      })

      const balance = debit - credit
      return {
        ...account,
        debit: debit > 0 ? debit : 0,
        credit: credit > 0 ? credit : 0,
        balance: balance,
        hasActivity: debit > 0 || credit > 0
      }
    }).filter(account => account.hasActivity)

    // حساب الإجماليات
    const totalDebits = balances.reduce((sum, account) => sum + account.debit, 0)
    const totalCredits = balances.reduce((sum, account) => sum + account.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    return {
      balances,
      totals: {
        totalDebits,
        totalCredits,
        difference: totalDebits - totalCredits,
        isBalanced
      },
      period: `${dateRange.start} - ${dateRange.end}`,
      entriesCount: filteredEntries.length
    }
  }

  // إضافة تقرير التدفق النقدي
  const getCashFlowStatement = () => {
    const { invoices: filteredInvoices, dateRange } = getFilteredData()

    // التدفقات النقدية من الأنشطة التشغيلية
    const cashFromSales = filteredInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    const cashToPurchases = filteredInvoices
      .filter(invoice => invoice.type === 'purchase' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    const netCashFromOperations = cashFromSales - cashToPurchases

    // التدفقات النقدية من الأنشطة الاستثمارية (افتراضية)
    const netCashFromInvesting = 0

    // التدفقات النقدية من الأنشطة التمويلية (افتراضية)
    const netCashFromFinancing = 0

    // صافي التغيير في النقد
    const netCashChange = netCashFromOperations + netCashFromInvesting + netCashFromFinancing

    return {
      operating: {
        cashFromSales,
        cashToPurchases,
        netCashFromOperations
      },
      investing: {
        netCashFromInvesting
      },
      financing: {
        netCashFromFinancing
      },
      netCashChange,
      period: `${dateRange.start} - ${dateRange.end}`
    }
  }

  // دالة لتنسيق الأرقام
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-KW' : 'en-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount || 0)
  }

  return (
    <div className="reports">
      <div className="page-header">
        <h1>{t('reports')}</h1>
        <p>{language === 'ar' ? 'التقارير المالية والمحاسبية المفصلة' : 'Detailed Financial and Accounting Reports'}</p>
      </div>

      {/* فلاتر التاريخ */}
      <div className="date-filters">
        <div className="filter-group">
          <label>{language === 'ar' ? 'فترة التقرير:' : 'Report Period:'}</label>
          <select 
            value={dateFilter.type} 
            onChange={(e) => setDateFilter({...dateFilter, type: e.target.value})}
            className="filter-select"
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {dateFilter.type === 'custom' && (
          <div className="custom-date-range">
            <div className="date-input-group">
              <label>{language === 'ar' ? 'من تاريخ:' : 'From Date:'}</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>{language === 'ar' ? 'إلى تاريخ:' : 'To Date:'}</label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="date-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* شريط التنقل بين التقارير */}
      <div className="reports-nav">
        <button 
          className={`nav-btn ${activeReport === 'trialBalance' ? 'active' : ''}`}
          onClick={() => setActiveReport('trialBalance')}
        >
          <span className="nav-icon">⚖️</span>
          {t('trialBalance')}
        </button>
        <button 
          className={`nav-btn ${activeReport === 'incomeStatement' ? 'active' : ''}`}
          onClick={() => setActiveReport('incomeStatement')}
        >
          <span className="nav-icon">📊</span>
          {t('incomeStatement')}
        </button>
        <button 
          className={`nav-btn ${activeReport === 'balanceSheet' ? 'active' : ''}`}
          onClick={() => setActiveReport('balanceSheet')}
        >
          <span className="nav-icon">🏦</span>
          {t('balanceSheet')}
        </button>
        <button 
          className={`nav-btn ${activeReport === 'cashFlow' ? 'active' : ''}`}
          onClick={() => setActiveReport('cashFlow')}
        >
          <span className="nav-icon">💰</span>
          {language === 'ar' ? 'التدفق النقدي' : 'Cash Flow'}
        </button>
      </div>

      <div className="reports-content">
        {/* تقرير ميزان المراجعة */}
        {activeReport === 'trialBalance' && (
          <div className="report-content" key={`trial-balance-${refreshKey}`}>
            <div className="report-header">
              <h2>{t('trialBalance')}</h2>
              <div className="report-period">
                {getTrialBalance().period}
              </div>
            </div>
            
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-icon">📋</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'عدد الحسابات النشطة' : 'Active Accounts'}</h4>
                  <p>{getTrialBalance().balances.length}</p>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">✅</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'حالة التوازن' : 'Balance Status'}</h4>
                  <p className={getTrialBalance().totals.isBalanced ? 'balanced' : 'unbalanced'}>
                    {getTrialBalance().totals.isBalanced ? 
                      (language === 'ar' ? 'متوازن' : 'Balanced') : 
                      (language === 'ar' ? 'غير متوازن' : 'Unbalanced')
                    }
                  </p>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">📝</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'عدد القيود' : 'Journal Entries'}</h4>
                  <p>{getTrialBalance().entriesCount}</p>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t('accountCode')}</th>
                    <th>{t('accountName')}</th>
                    <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                    <th>{t('debit')}</th>
                    <th>{t('credit')}</th>
                    <th>{language === 'ar' ? 'الرصيد' : 'Balance'}</th>
                  </tr>
                </thead>
                <tbody>
                  {getTrialBalance().balances.map(account => (
                    <tr key={account.id}>
                      <td>{account.code}</td>
                      <td>{account.name}</td>
                      <td>
                        <span className={`account-type ${account.type}`}>
                          {language === 'ar' ? 
                            (account.type === 'asset' ? 'أصول' :
                             account.type === 'liability' ? 'خصوم' :
                             account.type === 'equity' ? 'حقوق ملكية' :
                             account.type === 'revenue' ? 'إيرادات' :
                             account.type === 'expense' ? 'مصروفات' : account.type) :
                            account.type
                          }
                        </span>
                      </td>
                      <td className="amount">{formatCurrency(account.debit)}</td>
                      <td className="amount">{formatCurrency(account.credit)}</td>
                      <td className={`amount ${account.balance >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(Math.abs(account.balance))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="totals-row">
                    <td colSpan="3"><strong>{language === 'ar' ? 'الإجماليات' : 'Totals'}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getTrialBalance().totals.totalDebits)}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getTrialBalance().totals.totalCredits)}</strong></td>
                    <td className={`amount ${getTrialBalance().totals.isBalanced ? 'balanced' : 'unbalanced'}`}>
                      <strong>
                        {getTrialBalance().totals.isBalanced ? 
                          (language === 'ar' ? 'متوازن' : 'Balanced') :
                          formatCurrency(Math.abs(getTrialBalance().totals.difference))
                        }
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* تقرير قائمة الدخل */}
        {activeReport === 'incomeStatement' && (
          <div className="report-content" key={`income-statement-${refreshKey}`}>
            <div className="report-header">
              <h2>{t('incomeStatement')}</h2>
              <div className="report-period">
                {getIncomeStatement().period}
              </div>
            </div>

            <div className="report-summary">
              <div className="summary-card revenue">
                <div className="summary-icon">💰</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</h4>
                  <p>{formatCurrency(getIncomeStatement().salesRevenue)}</p>
                  <span>{getIncomeStatement().salesCount} {language === 'ar' ? 'فاتورة' : 'invoices'}</span>
                </div>
              </div>
              <div className="summary-card expense">
                <div className="summary-icon">💸</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'تكلفة المشتريات' : 'Cost of Purchases'}</h4>
                  <p>{formatCurrency(getIncomeStatement().costOfGoodsSold)}</p>
                  <span>{getIncomeStatement().purchaseCount} {language === 'ar' ? 'فاتورة' : 'invoices'}</span>
                </div>
              </div>
              <div className="summary-card profit">
                <div className="summary-icon">📈</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'صافي الربح' : 'Net Income'}</h4>
                  <p className={getIncomeStatement().netIncome >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(getIncomeStatement().netIncome)}
                  </p>
                  <span>
                    {((getIncomeStatement().netIncome / getIncomeStatement().salesRevenue) * 100 || 0).toFixed(1)}% 
                    {language === 'ar' ? ' هامش ربح' : ' profit margin'}
                  </span>
                </div>
              </div>
            </div>

            <div className="income-statement-details">
              <table className="report-table">
                <tbody>
                  <tr className="revenue-section">
                    <td><strong>{language === 'ar' ? 'الإيرادات' : 'Revenue'}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getIncomeStatement().salesRevenue)}</strong></td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'مبيعات مدفوعة' : 'Paid Sales'}</td>
                    <td className="amount">{formatCurrency(getIncomeStatement().paidSalesRevenue)}</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'مبيعات غير مدفوعة' : 'Unpaid Sales'}</td>
                    <td className="amount">{formatCurrency(getIncomeStatement().unpaidSalesRevenue)}</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'إجمالي الخصومات' : 'Total Discounts'}</td>
                    <td className="amount negative">({formatCurrency(getIncomeStatement().totalDiscount)})</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'إجمالي الضرائب' : 'Total VAT'}</td>
                    <td className="amount">{formatCurrency(getIncomeStatement().totalVAT)}</td>
                  </tr>
                  
                  <tr className="expense-section">
                    <td><strong>{language === 'ar' ? 'تكلفة البضاعة المباعة' : 'Cost of Goods Sold'}</strong></td>
                    <td className="amount"><strong>({formatCurrency(getIncomeStatement().costOfGoodsSold)})</strong></td>
                  </tr>
                  
                  <tr className="profit-section">
                    <td><strong>{language === 'ar' ? 'مجمل الربح' : 'Gross Profit'}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getIncomeStatement().grossProfit)}</strong></td>
                  </tr>
                  
                  <tr>
                    <td><strong>{language === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'}</strong></td>
                    <td className="amount"><strong>({formatCurrency(getIncomeStatement().operatingExpenses)})</strong></td>
                  </tr>
                  
                  <tr className="net-income-section">
                    <td><strong>{language === 'ar' ? 'صافي الربح' : 'Net Income'}</strong></td>
                    <td className={`amount ${getIncomeStatement().netIncome >= 0 ? 'positive' : 'negative'}`}>
                      <strong>{formatCurrency(getIncomeStatement().netIncome)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="additional-metrics">
                <h3>{language === 'ar' ? 'مقاييس إضافية' : 'Additional Metrics'}</h3>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <label>{language === 'ar' ? 'متوسط قيمة البيع' : 'Average Sale Amount'}</label>
                    <span>{formatCurrency(getIncomeStatement().averageSaleAmount)}</span>
                  </div>
                  <div className="metric-item">
                    <label>{language === 'ar' ? 'متوسط قيمة الشراء' : 'Average Purchase Amount'}</label>
                    <span>{formatCurrency(getIncomeStatement().averagePurchaseAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* تقرير الميزانية العمومية */}
        {activeReport === 'balanceSheet' && (
          <div className="report-content" key={`balance-sheet-${refreshKey}`}>
            <div className="report-header">
              <h2>{t('balanceSheet')}</h2>
              <div className="report-period">
                {getBalanceSheet().period}
              </div>
            </div>

            <div className="report-summary">
              <div className="summary-card assets">
                <div className="summary-icon">🏢</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}</h4>
                  <p>{formatCurrency(getBalanceSheet().assets.totalAssets)}</p>
                </div>
              </div>
              <div className="summary-card liabilities">
                <div className="summary-icon">📋</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'إجمالي الخصوم' : 'Total Liabilities'}</h4>
                  <p>{formatCurrency(getBalanceSheet().liabilities.totalLiabilities)}</p>
                </div>
              </div>
              <div className="summary-card equity">
                <div className="summary-icon">👥</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'حقوق الملكية' : 'Total Equity'}</h4>
                  <p>{formatCurrency(getBalanceSheet().equity.totalEquity)}</p>
                </div>
              </div>
            </div>

            <div className="balance-sheet-details">
              <div className="balance-sheet-section">
                <h3>{language === 'ar' ? 'الأصول' : 'Assets'}</h3>
                <table className="report-table">
                  <tbody>
                    <tr className="section-header">
                      <td><strong>{language === 'ar' ? 'الأصول المتداولة' : 'Current Assets'}</strong></td>
                      <td className="amount"><strong>{formatCurrency(getBalanceSheet().assets.currentAssets.total)}</strong></td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'النقدية' : 'Cash'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.cash)}</td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'الذمم المدينة' : 'Accounts Receivable'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.accountsReceivable)}</td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'المخزون' : 'Inventory'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.inventory)}</td>
                    </tr>
                    <tr>
                      <td><strong>{language === 'ar' ? 'الأصول الثابتة' : 'Fixed Assets'}</strong></td>
                      <td className="amount"><strong>{formatCurrency(getBalanceSheet().assets.fixedAssets)}</strong></td>
                    </tr>
                    <tr className="total-row">
                      <td><strong>{language === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}</strong></td>
                      <td className="amount"><strong>{formatCurrency(getBalanceSheet().assets.totalAssets)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="balance-sheet-section">
                <h3>{language === 'ar' ? 'الخصوم وحقوق الملكية' : 'Liabilities and Equity'}</h3>
                <table className="report-table">
                  <tbody>
                    <tr className="section-header">
                      <td><strong>{language === 'ar' ? 'الخصوم المتداولة' : 'Current Liabilities'}</strong></td>
                      <td className="amount"><strong>{formatCurrency(getBalanceSheet().liabilities.currentLiabilities.total)}</strong></td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'الذمم الدائنة' : 'Accounts Payable'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().liabilities.currentLiabilities.accountsPayable)}</td>
                    </tr>
                    <tr>
                      <td><strong>{language === 'ar' ? 'إجمالي الخصوم' : 'Total Liabilities'}</strong></td>
                      <td className="amount"><strong>{formatCurrency(getBalanceSheet().liabilities.totalLiabilities)}</strong></td>
                    </tr>
                    <tr className="section-header">
                      <td><strong>{language === 'ar' ? 'حقوق الملكية' : 'Equity'}</strong></td>
                      <td className="amount"><strong>{formatCurrency(getBalanceSheet().equity.totalEquity)}</strong></td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'الأرباح المحتجزة' : 'Retained Earnings'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().equity.retainedEarnings)}</td>
                    </tr>
                    <tr className="total-row">
                      <td><strong>{language === 'ar' ? 'إجمالي الخصوم وحقوق الملكية' : 'Total Liabilities and Equity'}</strong></td>
                      <td className="amount">
                        <strong>{formatCurrency(getBalanceSheet().liabilities.totalLiabilities + getBalanceSheet().equity.totalEquity)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="additional-info">
                <h3>{language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>{language === 'ar' ? 'عدد الفواتير المستحقة' : 'Outstanding Invoices'}</label>
                    <span>{getBalanceSheet().additionalInfo.receivableCount}</span>
                  </div>
                  <div className="info-item">
                    <label>{language === 'ar' ? 'عدد الفواتير المستحقة الدفع' : 'Payable Invoices'}</label>
                    <span>{getBalanceSheet().additionalInfo.payableCount}</span>
                  </div>
                  <div className="info-item">
                    <label>{language === 'ar' ? 'عدد أصناف المخزون' : 'Inventory Items'}</label>
                    <span>{getBalanceSheet().additionalInfo.inventoryItemsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* تقرير التدفق النقدي */}
        {activeReport === 'cashFlow' && (
          <div className="report-content" key={`cash-flow-${refreshKey}`}>
            <div className="report-header">
              <h2>{language === 'ar' ? 'قائمة التدفق النقدي' : 'Cash Flow Statement'}</h2>
              <div className="report-period">
                {getCashFlowStatement().period}
              </div>
            </div>

            <div className="report-summary">
              <div className="summary-card inflow">
                <div className="summary-icon">💰</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'النقد من المبيعات' : 'Cash from Sales'}</h4>
                  <p>{formatCurrency(getCashFlowStatement().operating.cashFromSales)}</p>
                </div>
              </div>
              <div className="summary-card outflow">
                <div className="summary-icon">💸</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'النقد للمشتريات' : 'Cash for Purchases'}</h4>
                  <p>{formatCurrency(getCashFlowStatement().operating.cashToPurchases)}</p>
                </div>
              </div>
              <div className="summary-card net-cash">
                <div className="summary-icon">📊</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'صافي التغيير النقدي' : 'Net Cash Change'}</h4>
                  <p className={getCashFlowStatement().netCashChange >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(getCashFlowStatement().netCashChange)}
                  </p>
                </div>
              </div>
            </div>

            <div className="cash-flow-details">
              <table className="report-table">
                <tbody>
                  <tr className="section-header">
                    <td><strong>{language === 'ar' ? 'التدفقات النقدية من الأنشطة التشغيلية' : 'Cash Flows from Operating Activities'}</strong></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'النقد المحصل من العملاء' : 'Cash received from customers'}</td>
                    <td className="amount positive">{formatCurrency(getCashFlowStatement().operating.cashFromSales)}</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'النقد المدفوع للموردين' : 'Cash paid to suppliers'}</td>
                    <td className="amount negative">({formatCurrency(getCashFlowStatement().operating.cashToPurchases)})</td>
                  </tr>
                  <tr className="subtotal-row">
                    <td><strong>{language === 'ar' ? 'صافي النقد من الأنشطة التشغيلية' : 'Net cash from operating activities'}</strong></td>
                    <td className={`amount ${getCashFlowStatement().operating.netCashFromOperations >= 0 ? 'positive' : 'negative'}`}>
                      <strong>{formatCurrency(getCashFlowStatement().operating.netCashFromOperations)}</strong>
                    </td>
                  </tr>
                  
                  <tr className="section-header">
                    <td><strong>{language === 'ar' ? 'التدفقات النقدية من الأنشطة الاستثمارية' : 'Cash Flows from Investing Activities'}</strong></td>
                    <td></td>
                  </tr>
                  <tr className="subtotal-row">
                    <td><strong>{language === 'ar' ? 'صافي النقد من الأنشطة الاستثمارية' : 'Net cash from investing activities'}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getCashFlowStatement().investing.netCashFromInvesting)}</strong></td>
                  </tr>
                  
                  <tr className="section-header">
                    <td><strong>{language === 'ar' ? 'التدفقات النقدية من الأنشطة التمويلية' : 'Cash Flows from Financing Activities'}</strong></td>
                    <td></td>
                  </tr>
                  <tr className="subtotal-row">
                    <td><strong>{language === 'ar' ? 'صافي النقد من الأنشطة التمويلية' : 'Net cash from financing activities'}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getCashFlowStatement().financing.netCashFromFinancing)}</strong></td>
                  </tr>
                  
                  <tr className="total-row">
                    <td><strong>{language === 'ar' ? 'صافي التغيير في النقد' : 'Net change in cash'}</strong></td>
                    <td className={`amount ${getCashFlowStatement().netCashChange >= 0 ? 'positive' : 'negative'}`}>
                      <strong>{formatCurrency(getCashFlowStatement().netCashChange)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports