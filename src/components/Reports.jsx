import { useState, useEffect } from 'react'
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
  const { t } = useLanguage()

  const [activeReport, setActiveReport] = useState('trialBalance')
  const [refreshKey, setRefreshKey] = useState(0)

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
  }, [invoices, inventoryItems])

  // حساب قائمة الدخل
  const getIncomeStatement = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

    // فلترة الفواتير للسنة الحالية
    const currentYearInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date)
      return invoiceDate.getFullYear() === currentYear
    })

    // حساب الإيرادات (جميع فواتير المبيعات - بغض النظر عن حالة الدفع)
    const salesRevenue = currentYearInvoices
      .filter(invoice => invoice.type === 'sales')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // حساب تكلفة البضاعة المباعة (جميع فواتير المشتريات - بغض النظر عن حالة الدفع)
    const costOfGoodsSold = currentYearInvoices
      .filter(invoice => invoice.type === 'purchase')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // تفصيل الإيرادات حسب حالة الدفع للمعلومات الإضافية
    const paidSalesRevenue = currentYearInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)
    
    const unpaidSalesRevenue = currentYearInvoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus !== 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // حساب مجمل الربح
    const grossProfit = salesRevenue - costOfGoodsSold

    // مصروفات تشغيلية مقدرة (يمكن تخصيصها لاحقاً)
    const operatingExpenses = 0 // يمكن إضافة حسابات المصروفات هنا

    // صافي الربح
    const netIncome = grossProfit - operatingExpenses

    return {
      salesRevenue,
      paidSalesRevenue,
      unpaidSalesRevenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      netIncome,
      period: `السنة المالية ${currentYear}`
    }
  }

  // حساب الميزانية العمومية
  const getBalanceSheet = () => {
    const currentDate = new Date()

    // الأصول المتداولة
    // النقدية (الفواتير المدفوعة فقط)
    const paidSales = invoices
      .filter(invoice => invoice.type === 'sales' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)
    
    const paidPurchases = invoices
      .filter(invoice => invoice.type === 'purchase' && invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    const cash = paidSales - paidPurchases

    // الذمم المدينة (جميع فواتير المبيعات غير المدفوعة)
    const accountsReceivable = invoices
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
    const accountsPayable = invoices
      .filter(invoice => invoice.type === 'purchase' && invoice.paymentStatus !== 'paid')
      .reduce((total, invoice) => total + (parseFloat(invoice.total) || 0), 0)

    // إجمالي الخصوم
    const totalLiabilities = accountsPayable

    // حقوق الملكية
    const retainedEarnings = getIncomeStatement().netIncome
    const totalEquity = retainedEarnings

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
      date: currentDate.toLocaleDateString('ar-EG')
    }
  }

  // حساب ميزان المراجعة
  const getTrialBalance = () => {
    const balances = accounts.map(account => {
      let debit = 0
      let credit = 0

      // حساب الأرصدة من القيود
      journalEntries.forEach(entry => {
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
        balance: balance
      }
    }).filter(account => account.debit > 0 || account.credit > 0)

    return balances
  }

  return (
    <div className="reports">
      <div className="page-header">
        <h1>{t('reports')}</h1>
      </div>

      <div className="reports-nav">
        <button 
          className={`nav-btn ${activeReport === 'trialBalance' ? 'active' : ''}`}
          onClick={() => setActiveReport('trialBalance')}
        >
          {t('trialBalance')}
        </button>
        <button 
          className={`nav-btn ${activeReport === 'incomeStatement' ? 'active' : ''}`}
          onClick={() => setActiveReport('incomeStatement')}
        >
          {t('incomeStatement')}
        </button>
        <button 
          className={`nav-btn ${activeReport === 'balanceSheet' ? 'active' : ''}`}
          onClick={() => setActiveReport('balanceSheet')}
        >
          {t('balanceSheet')}
        </button>
      </div>

      <div className="reports-content">
        {activeReport === 'trialBalance' && (
          <div className="report-content" key={`trial-balance-${refreshKey}`}>
            <h2>{t('trialBalance')}</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('accountCode')}</th>
                    <th>{t('accountName')}</th>
                    <th>{t('debit')}</th>
                    <th>{t('credit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {getTrialBalance().map(account => (
                    <tr key={account.id}>
                      <td>{account.code}</td>
                      <td>{account.name}</td>
                      <td>{account.debit.toFixed(2)}</td>
                      <td>{account.credit.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="2"><strong>{t('total')}</strong></td>
                    <td><strong>{getTrialBalance().reduce((sum, acc) => sum + acc.debit, 0).toFixed(2)}</strong></td>
                    <td><strong>{getTrialBalance().reduce((sum, acc) => sum + acc.credit, 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeReport === 'incomeStatement' && (
          <div className="report-content" key={`income-statement-${refreshKey}`}>
            <h2>{t('incomeStatement')}</h2>
            <div className="income-statement">{(() => {
                const incomeData = getIncomeStatement()
                return (
                  <div className="financial-statement">
                    <div className="statement-header">
                      <h3>{incomeData.period}</h3>
                      <p>بالدينار الكويتي</p>
                    </div>
                    <div className="table-container">
                      <table>
                        <tbody>
                          <tr className="revenue-section">
                            <td><strong>الإيرادات</strong></td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="indent">إيرادات المبيعات</td>
                            <td>{incomeData.salesRevenue.toFixed(3)}</td>
                          </tr>
                          <tr>
                            <td className="indent sub-detail">منها مدفوعة</td>
                            <td className="sub-detail">{incomeData.paidSalesRevenue.toFixed(3)}</td>
                          </tr>
                          <tr>
                            <td className="indent sub-detail">منها غير مدفوعة</td>
                            <td className="sub-detail">{incomeData.unpaidSalesRevenue.toFixed(3)}</td>
                          </tr>
                          <tr className="subtotal">
                            <td><strong>إجمالي الإيرادات</strong></td>
                            <td><strong>{incomeData.salesRevenue.toFixed(3)}</strong></td>
                          </tr>
                          
                          <tr className="expense-section">
                            <td><strong>تكلفة البضاعة المباعة</strong></td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="indent">تكلفة المشتريات</td>
                            <td>({incomeData.costOfGoodsSold.toFixed(3)})</td>
                          </tr>
                          <tr className="subtotal">
                            <td><strong>إجمالي تكلفة البضاعة المباعة</strong></td>
                            <td><strong>({incomeData.costOfGoodsSold.toFixed(3)})</strong></td>
                          </tr>
                          
                          <tr className="gross-profit">
                            <td><strong>مجمل الربح</strong></td>
                            <td><strong>{incomeData.grossProfit.toFixed(3)}</strong></td>
                          </tr>
                          
                          <tr className="expense-section">
                            <td><strong>المصروفات التشغيلية</strong></td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="indent">مصروفات أخرى</td>
                            <td>({incomeData.operatingExpenses.toFixed(3)})</td>
                          </tr>
                          <tr className="subtotal">
                            <td><strong>إجمالي المصروفات التشغيلية</strong></td>
                            <td><strong>({incomeData.operatingExpenses.toFixed(3)})</strong></td>
                          </tr>
                          
                          <tr className="net-income">
                            <td><strong>صافي الربح</strong></td>
                            <td><strong>{incomeData.netIncome.toFixed(3)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
        
        {activeReport === 'balanceSheet' && (
          <div className="report-content" key={`balance-sheet-${refreshKey}`}>
            <h2>{t('balanceSheet')}</h2>
            <div className="balance-sheet">
              {(() => {
                const balanceData = getBalanceSheet()
                return (
                  <div className="financial-statement">
                    <div className="statement-header">
                      <h3>كما في {balanceData.date}</h3>
                      <p>بالدينار الكويتي</p>
                    </div>
                    <div className="table-container">
                      <table>
                        <tbody>
                          {/* الأصول */}
                          <tr className="section-header">
                            <td colSpan="2"><strong>الأصول</strong></td>
                          </tr>
                          
                          <tr className="subsection-header">
                            <td><strong>الأصول المتداولة</strong></td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="indent">النقدية</td>
                            <td>{balanceData.assets.currentAssets.cash.toFixed(3)}</td>
                          </tr>
                          <tr>
                            <td className="indent">الذمم المدينة</td>
                            <td>{balanceData.assets.currentAssets.accountsReceivable.toFixed(3)}</td>
                          </tr>
                          <tr>
                            <td className="indent">المخزون</td>
                            <td>{balanceData.assets.currentAssets.inventory.toFixed(3)}</td>
                          </tr>
                          <tr className="subtotal">
                            <td><strong>إجمالي الأصول المتداولة</strong></td>
                            <td><strong>{balanceData.assets.currentAssets.total.toFixed(3)}</strong></td>
                          </tr>
                          
                          <tr className="subsection-header">
                            <td><strong>الأصول الثابتة</strong></td>
                            <td><strong>{balanceData.assets.fixedAssets.toFixed(3)}</strong></td>
                          </tr>
                          
                          <tr className="total-assets">
                            <td><strong>إجمالي الأصول</strong></td>
                            <td><strong>{balanceData.assets.totalAssets.toFixed(3)}</strong></td>
                          </tr>
                          
                          {/* فاصل */}
                          <tr className="separator">
                            <td colSpan="2"></td>
                          </tr>
                          
                          {/* الخصوم وحقوق الملكية */}
                          <tr className="section-header">
                            <td colSpan="2"><strong>الخصوم وحقوق الملكية</strong></td>
                          </tr>
                          
                          <tr className="subsection-header">
                            <td><strong>الخصوم المتداولة</strong></td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="indent">الذمم الدائنة</td>
                            <td>{balanceData.liabilities.currentLiabilities.accountsPayable.toFixed(3)}</td>
                          </tr>
                          <tr className="subtotal">
                            <td><strong>إجمالي الخصوم</strong></td>
                            <td><strong>{balanceData.liabilities.totalLiabilities.toFixed(3)}</strong></td>
                          </tr>
                          
                          <tr className="subsection-header">
                            <td><strong>حقوق الملكية</strong></td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="indent">الأرباح المحتجزة</td>
                            <td>{balanceData.equity.retainedEarnings.toFixed(3)}</td>
                          </tr>
                          <tr className="subtotal">
                            <td><strong>إجمالي حقوق الملكية</strong></td>
                            <td><strong>{balanceData.equity.totalEquity.toFixed(3)}</strong></td>
                          </tr>
                          
                          <tr className="total-liabilities-equity">
                            <td><strong>إجمالي الخصوم وحقوق الملكية</strong></td>
                            <td><strong>{(balanceData.liabilities.totalLiabilities + balanceData.equity.totalEquity).toFixed(3)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports