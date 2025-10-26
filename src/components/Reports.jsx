import { useState, useEffect, useMemo } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import PermissionDenied from './PermissionDenied'
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
  const { hasPermission } = useAuth()

  // Check if user has permission to view financial reports
  if (!hasPermission('view_financial_reports')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض التقارير المالية"
        description="تحتاج إلى صلاحية 'عرض التقارير المالية' للوصول إلى هذه الصفحة"
      />
    )
  }

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

  // حساب قائمة الدخل مع الفلترة الزمنية - من القيود اليومية
  const getIncomeStatement = () => {
    const { journalEntries: filteredEntries, dateRange } = getFilteredData()

    // حساب الإيرادات من القيود اليومية (حسابات الإيرادات 4xxx)
    let totalRevenue = 0
    let salesRevenue = 0
    let otherIncome = 0

    // حساب المصروفات من القيود اليومية (حسابات المصروفات 5xxx)
    let totalExpenses = 0
    let costOfSales = 0
    let operatingExpenses = 0
    let discountsAllowed = 0

    filteredEntries.forEach(entry => {
      entry.lines?.forEach(line => {
        const account = accounts.find(acc => acc.id === line.accountId)
        if (account) {
          const credit = parseFloat(line.credit) || 0
          const debit = parseFloat(line.debit) || 0

          // الإيرادات (دائن في حسابات 4xxx)
          if (account.code?.startsWith('4')) {
            if (account.code === '4001') {
              salesRevenue += credit - debit
            } else {
              otherIncome += credit - debit
            }
            totalRevenue += credit - debit
          }

          // المصروفات (مدين في حسابات 5xxx)
          if (account.code?.startsWith('5')) {
            if (account.code === '5001') {
              costOfSales += debit - credit
            } else if (account.code === '5201') {
              discountsAllowed += debit - credit
            } else {
              operatingExpenses += debit - credit
            }
            totalExpenses += debit - credit
          }
        }
      })
    })

    // حساب مجمل الربح والصافي
    const grossProfit = salesRevenue - costOfSales
    const netIncome = totalRevenue - totalExpenses

    // احصائيات إضافية من الفواتير
    const { invoices: filteredInvoices } = getFilteredData()
    const salesCount = filteredInvoices.filter(invoice => invoice.type === 'sales').length
    const purchaseCount = filteredInvoices.filter(invoice => invoice.type === 'purchase').length

    return {
      revenue: {
        salesRevenue,
        otherIncome,
        totalRevenue
      },
      expenses: {
        costOfSales,
        operatingExpenses,
        discountsAllowed,
        totalExpenses
      },
      grossProfit,
      netIncome,
      salesCount,
      purchaseCount,
      period: `${dateRange.start} - ${dateRange.end}`,
      filterType: dateFilter.type
    }
  }

  // حساب الميزانية العمومية من القيود اليومية
  const getBalanceSheet = () => {
    const { journalEntries: filteredEntries, dateRange } = getFilteredData()

    // حساب أرصدة جميع الحسابات من القيود اليومية
    const accountBalances = {}
    
    filteredEntries.forEach(entry => {
      entry.lines?.forEach(line => {
        if (!accountBalances[line.accountId]) {
          accountBalances[line.accountId] = { debit: 0, credit: 0 }
        }
        accountBalances[line.accountId].debit += parseFloat(line.debit) || 0
        accountBalances[line.accountId].credit += parseFloat(line.credit) || 0
      })
    })

    // الأصول المتداولة
    let cash = 0 // حسابات 1001-1002 (خزينة وبنك)
    let accountsReceivable = 0 // حساب 1101 (عملاء)
    let inventory = 0 // حساب 1201 (مخزون)
    let vatPaid = 0 // حساب 1301 (ضريبة مدفوعة)
    let otherCurrentAssets = 0

    // الخصوم المتداولة
    let accountsPayable = 0 // حساب 2001 (موردون)
    let vatPayable = 0 // حساب 2102 (ضريبة مستحقة)
    let otherCurrentLiabilities = 0

    // حساب الأرصدة
    accounts.forEach(account => {
      const balance = accountBalances[account.id]
      if (balance) {
        const netBalance = balance.debit - balance.credit

        // تصنيف الحسابات حسب الكود
        if (account.code === '1001' || account.code === '1002') {
          cash += netBalance
        } else if (account.code === '1101') {
          accountsReceivable += netBalance
        } else if (account.code === '1201') {
          inventory += netBalance
        } else if (account.code === '1301') {
          vatPaid += netBalance
        } else if (account.code?.startsWith('1')) {
          otherCurrentAssets += netBalance
        } else if (account.code === '2001') {
          accountsPayable += Math.abs(netBalance) // الخصوم قيمة موجبة
        } else if (account.code === '2102') {
          vatPayable += Math.abs(netBalance)
        } else if (account.code?.startsWith('2')) {
          otherCurrentLiabilities += Math.abs(netBalance)
        }
      }
    })

    // إجمالي الأصول المتداولة
    const currentAssets = cash + accountsReceivable + inventory + vatPaid + otherCurrentAssets

    // الأصول الثابتة (من حسابات 15xx إن وجدت)
    const fixedAssets = 0 // يمكن إضافتها لاحقاً

    // إجمالي الأصول
    const totalAssets = currentAssets + fixedAssets

    // إجمالي الخصوم
    const totalLiabilities = accountsPayable + vatPayable + otherCurrentLiabilities

    // حقوق الملكية = صافي الربح من قائمة الدخل
    const retainedEarnings = getIncomeStatement().netIncome
    const totalEquity = totalAssets - totalLiabilities // المعادلة المحاسبية

    // احصائيات إضافية
    const { invoices: filteredInvoices } = getFilteredData()
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
          inventory,
          vatPaid,
          other: otherCurrentAssets,
          total: currentAssets
        },
        fixedAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable,
          vatPayable,
          other: otherCurrentLiabilities,
          total: totalLiabilities
        },
        totalLiabilities
      },
      equity: {
        retainedEarnings: totalEquity,
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

  // إضافة تقرير التدفق النقدي من القيود اليومية
  const getCashFlowStatement = () => {
    const { journalEntries: filteredEntries, dateRange } = getFilteredData()

    // التدفقات النقدية من حسابات الخزينة والبنك (1001, 1002)
    let cashInflows = 0
    let cashOutflows = 0

    filteredEntries.forEach(entry => {
      entry.lines?.forEach(line => {
        const account = accounts.find(acc => acc.id === line.accountId)
        if (account && (account.code === '1001' || account.code === '1002')) {
          const debit = parseFloat(line.debit) || 0
          const credit = parseFloat(line.credit) || 0
          
          cashInflows += debit
          cashOutflows += credit
        }
      })
    })

    // صافي التدفق النقدي
    const netCashFlow = cashInflows - cashOutflows

    // تفصيل حسب نوع النشاط (من الفواتير للمعلومات)
    const { invoices: filteredInvoices } = getFilteredData()
    
    const cashFromSales = filteredInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    const cashToPurchases = filteredInvoices
      .filter(invoice => invoice.type === 'purchase' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    const netCashFromOperations = cashFromSales - cashToPurchases

    return {
      operating: {
        cashInflows,
        cashOutflows,
        cashFromSales,
        cashToPurchases,
        netCashFromOperations
      },
      investing: {
        netCashFromInvesting: 0
      },
      financing: {
        netCashFromFinancing: 0
      },
      netCashFlow,
      netCashChange: netCashFlow,
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
                  <h4>{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</h4>
                  <p>{formatCurrency(getIncomeStatement().revenue.totalRevenue)}</p>
                  <span>{getIncomeStatement().salesCount} {language === 'ar' ? 'فاتورة مبيعات' : 'sales invoices'}</span>
                </div>
              </div>
              <div className="summary-card expense">
                <div className="summary-icon">💸</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</h4>
                  <p>{formatCurrency(getIncomeStatement().expenses.totalExpenses)}</p>
                  <span>{getIncomeStatement().purchaseCount} {language === 'ar' ? 'فاتورة شراء' : 'purchase invoices'}</span>
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
                    {getIncomeStatement().revenue.totalRevenue > 0 
                      ? ((getIncomeStatement().netIncome / getIncomeStatement().revenue.totalRevenue) * 100).toFixed(1)
                      : '0.0'
                    }% 
                    {language === 'ar' ? ' هامش ربح' : ' profit margin'}
                  </span>
                </div>
              </div>
            </div>

            <div className="income-statement-details">
              <table className="report-table">
                <tbody>
                  <tr className="section-header">
                    <td><strong>{language === 'ar' ? 'الإيرادات' : 'Revenue'}</strong></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'إيرادات المبيعات' : 'Sales Revenue'}</td>
                    <td className="amount">{formatCurrency(getIncomeStatement().revenue.salesRevenue)}</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'إيرادات أخرى' : 'Other Income'}</td>
                    <td className="amount">{formatCurrency(getIncomeStatement().revenue.otherIncome)}</td>
                  </tr>
                  <tr className="subtotal-row">
                    <td><strong>{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</strong></td>
                    <td className="amount"><strong>{formatCurrency(getIncomeStatement().revenue.totalRevenue)}</strong></td>
                  </tr>
                  
                  <tr className="section-header">
                    <td><strong>{language === 'ar' ? 'المصروفات' : 'Expenses'}</strong></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'تكلفة المبيعات' : 'Cost of Sales'}</td>
                    <td className="amount negative">({formatCurrency(getIncomeStatement().expenses.costOfSales)})</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'مصروفات تشغيلية' : 'Operating Expenses'}</td>
                    <td className="amount negative">({formatCurrency(getIncomeStatement().expenses.operatingExpenses)})</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'خصم مسموح به' : 'Discounts Allowed'}</td>
                    <td className="amount negative">({formatCurrency(getIncomeStatement().expenses.discountsAllowed)})</td>
                  </tr>
                  <tr className="subtotal-row">
                    <td><strong>{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</strong></td>
                    <td className="amount"><strong>({formatCurrency(getIncomeStatement().expenses.totalExpenses)})</strong></td>
                  </tr>
                  
                  <tr className="subtotal-row">
                    <td><strong>{language === 'ar' ? 'مجمل الربح' : 'Gross Profit'}</strong></td>
                    <td className={`amount ${getIncomeStatement().grossProfit >= 0 ? 'positive' : 'negative'}`}>
                      <strong>{formatCurrency(getIncomeStatement().grossProfit)}</strong>
                    </td>
                  </tr>
                  
                  <tr className="total-row">
                    <td><strong>{language === 'ar' ? 'صافي الربح (الخسارة)' : 'Net Income (Loss)'}</strong></td>
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
                      <td className="indent">{language === 'ar' ? 'النقدية (خزينة وبنك)' : 'Cash (Cash & Bank)'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.cash)}</td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'الذمم المدينة (عملاء)' : 'Accounts Receivable (Customers)'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.accountsReceivable)}</td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'المخزون' : 'Inventory'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.inventory)}</td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'ضريبة مدفوعة' : 'VAT Paid'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.vatPaid)}</td>
                    </tr>
                    {getBalanceSheet().assets.currentAssets.other > 0 && (
                      <tr>
                        <td className="indent">{language === 'ar' ? 'أصول متداولة أخرى' : 'Other Current Assets'}</td>
                        <td className="amount">{formatCurrency(getBalanceSheet().assets.currentAssets.other)}</td>
                      </tr>
                    )}
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
                      <td className="indent">{language === 'ar' ? 'الذمم الدائنة (موردون)' : 'Accounts Payable (Suppliers)'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().liabilities.currentLiabilities.accountsPayable)}</td>
                    </tr>
                    <tr>
                      <td className="indent">{language === 'ar' ? 'ضريبة مستحقة' : 'VAT Payable'}</td>
                      <td className="amount">{formatCurrency(getBalanceSheet().liabilities.currentLiabilities.vatPayable)}</td>
                    </tr>
                    {getBalanceSheet().liabilities.currentLiabilities.other > 0 && (
                      <tr>
                        <td className="indent">{language === 'ar' ? 'خصوم متداولة أخرى' : 'Other Current Liabilities'}</td>
                        <td className="amount">{formatCurrency(getBalanceSheet().liabilities.currentLiabilities.other)}</td>
                      </tr>
                    )}
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
                  <h4>{language === 'ar' ? 'التدفقات النقدية الداخلة' : 'Cash Inflows'}</h4>
                  <p>{formatCurrency(getCashFlowStatement().operating.cashInflows)}</p>
                </div>
              </div>
              <div className="summary-card outflow">
                <div className="summary-icon">💸</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'التدفقات النقدية الخارجة' : 'Cash Outflows'}</h4>
                  <p>{formatCurrency(getCashFlowStatement().operating.cashOutflows)}</p>
                </div>
              </div>
              <div className="summary-card net-cash">
                <div className="summary-icon">📊</div>
                <div className="summary-info">
                  <h4>{language === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'}</h4>
                  <p className={getCashFlowStatement().netCashFlow >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(getCashFlowStatement().netCashFlow)}
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
                    <td className="indent">{language === 'ar' ? 'إجمالي النقد الداخل (مدين)' : 'Total Cash Inflows (Debit)'}</td>
                    <td className="amount positive">{formatCurrency(getCashFlowStatement().operating.cashInflows)}</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'إجمالي النقد الخارج (دائن)' : 'Total Cash Outflows (Credit)'}</td>
                    <td className="amount negative">({formatCurrency(getCashFlowStatement().operating.cashOutflows)})</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'النقد من المبيعات المدفوعة' : 'Cash from paid sales'}</td>
                    <td className="amount positive">{formatCurrency(getCashFlowStatement().operating.cashFromSales)}</td>
                  </tr>
                  <tr>
                    <td className="indent">{language === 'ar' ? 'النقد للمشتريات المدفوعة' : 'Cash for paid purchases'}</td>
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
                    <td><strong>{language === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'}</strong></td>
                    <td className={`amount ${getCashFlowStatement().netCashFlow >= 0 ? 'positive' : 'negative'}`}>
                      <strong>{formatCurrency(getCashFlowStatement().netCashFlow)}</strong>
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