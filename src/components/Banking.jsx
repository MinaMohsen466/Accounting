import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import PermissionDenied from './PermissionDenied'
import PaymentModal from './PaymentModal'
import './Banking.css'

const Banking = () => {
  const { 
    accounts, 
    journalEntries,
    customers,
    suppliers,
    addJournalEntry,
    loading 
  } = useAccounting()
  
  const { language } = useLanguage()
  const { hasPermission } = useAuth()
  
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [selectedTransactionType, setSelectedTransactionType] = useState('deposit')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedAccounts, setExpandedAccounts] = useState({}) // Track which accounts are expanded

  // Check permissions
  if (!hasPermission('view_banking')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض الخزينة والبنوك"
        description="تحتاج إلى صلاحية 'عرض البنوك' للوصول إلى هذه الصفحة"
      />
    )
  }

  // Get bank/cash accounts
  const bankAccounts = accounts.filter(a => 
    a && (a.type === 'bank' || a.type === 'cash')
  )

  // Calculate balance for an account
  const computeAccountBalance = (accountId) => {
    if (!accountId) return 0
    
    let debitTotal = 0
    let creditTotal = 0
    
    if (!Array.isArray(journalEntries)) return 0
    
    journalEntries.forEach(entry => {
      if (!entry || !Array.isArray(entry.lines)) return
      
      entry.lines.forEach(line => {
        if (!line) return
        
        if (String(line.accountId) === String(accountId)) {
          const debit = parseFloat(line.debit || 0)
          const credit = parseFloat(line.credit || 0)
          
          if (!isNaN(debit)) debitTotal += debit
          if (!isNaN(credit)) creditTotal += credit
        }
      })
    })
    
    const balance = debitTotal - creditTotal
    return isNaN(balance) ? 0 : balance
  }

  // Get transactions for an account - with safety checks
  const getAccountTransactions = (accountId) => {
    if (!accountId || !Array.isArray(journalEntries)) return []
    
    const transactions = []
    
    const sortedEntries = [...journalEntries].sort((a, b) => {
      const dateA = new Date(a?.date || 0)
      const dateB = new Date(b?.date || 0)
      return dateB - dateA
    })
    
    sortedEntries.forEach(entry => {
      if (!entry || !Array.isArray(entry.lines)) return
      
      entry.lines.forEach(line => {
        if (!line) return
        
        if (String(line.accountId) === String(accountId)) {
          const debit = parseFloat(line.debit || 0)
          const credit = parseFloat(line.credit || 0)
          
          transactions.push({
            id: entry.id,
            date: entry.date,
            reference: entry.reference,
            description: line.description || entry.description,
            type: entry.type,
            debit: isNaN(debit) ? 0 : debit,
            credit: isNaN(credit) ? 0 : credit,
            balance: 0 // Will be calculated
          })
        }
      })
    })
    
    // Calculate running balance
    let balance = 0
    transactions.reverse().forEach(t => {
      balance += (t.debit - t.credit)
      t.balance = balance
    })
    
    return transactions.reverse()
  }

  // Filter accounts - with safety checks
  const filteredAccounts = Array.isArray(bankAccounts) 
    ? bankAccounts.filter(account => {
        if (!account) return false
        
        const name = String(account.name || '').toLowerCase()
        const code = String(account.code || '').toLowerCase()
        const search = String(searchTerm || '').toLowerCase()
        
        const matchesSearch = name.includes(search) || code.includes(search)
        const matchesType = filterType === 'all' || account.type === filterType
        
        return matchesSearch && matchesType
      })
    : []

  // Calculate totals - with safety checks
  const totalBalance = Array.isArray(bankAccounts) 
    ? bankAccounts.reduce((sum, acc) => {
        const balance = computeAccountBalance(acc?.id)
        return sum + (isNaN(balance) ? 0 : balance)
      }, 0)
    : 0
    
  const cashBalance = Array.isArray(bankAccounts)
    ? bankAccounts
        .filter(a => a && a.type === 'cash')
        .reduce((sum, acc) => {
          const balance = computeAccountBalance(acc?.id)
          return sum + (isNaN(balance) ? 0 : balance)
        }, 0)
    : 0
    
  const bankBalance = Array.isArray(bankAccounts)
    ? bankAccounts
        .filter(a => a && a.type === 'bank')
        .reduce((sum, acc) => {
          const balance = computeAccountBalance(acc?.id)
          return sum + (isNaN(balance) ? 0 : balance)
        }, 0)
    : 0

  // Calculate available from sales - with safety checks
  const bankAccountIds = new Set(Array.isArray(bankAccounts) ? bankAccounts.map(a => a?.id).filter(Boolean) : [])
  const availableFromSales = Array.isArray(journalEntries)
    ? journalEntries.reduce((sum, entry) => {
        if (!entry) return sum
        
        const isSalesLike = 
          (entry.type === 'receipt' || entry.type === 'sales_receipt' || entry.type === 'deposit') ||
          (entry.reference && /^S\d+|INV|فاتورة|تحصيل/i.test(entry.reference)) ||
          /تحصيل|مبيعات|sales|receipt|deposit/i.test(entry.description || '')
        
        if (!isSalesLike) return sum
        
        if (Array.isArray(entry.lines)) {
          entry.lines.forEach(line => {
            if (!line) return
            
            if (bankAccountIds.has(line.accountId)) {
              const debit = parseFloat(line.debit || 0)
              if (!isNaN(debit) && debit > 0) {
                sum += debit
              }
            }
          })
        }
        
        return sum
      }, 0)
    : 0

  const handleOpenPaymentModal = (account, transactionType) => {
    setSelectedAccount(account)
    setSelectedTransactionType(transactionType)
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = (success) => {
    setShowPaymentModal(false)
    setSelectedAccount(null)
    if (success) {
      // Data will be refreshed automatically via event listener
    }
  }

  const toggleExpandAccount = (accountId) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return language === 'ar' ? date.toLocaleDateString('ar-EG') : date.toLocaleDateString('en-US')
  }

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ${language === 'ar' ? 'د.ك' : 'KD'}`
  }

  if (loading) {
    return <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
  }

  return (
    <div className="banking-page">
      {/* Header with Summary Cards */}
      <div className="banking-header">
        <h1>{language === 'ar' ? '🏦 الخزينة والبنوك' : '🏦 Banking'}</h1>
        <p>{language === 'ar' ? 'إدارة الحسابات البنكية والخزائن النقدية' : 'Manage bank accounts and cash'}</p>
      </div>

      {/* Summary Cards */}
      <div className="banking-summary">
        <div className="summary-card total">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>{language === 'ar' ? 'إجمالي الرصيد' : 'Total Balance'}</h3>
            <p className="amount">{formatCurrency(totalBalance)}</p>
            <span className="label">{language === 'ar' ? 'جميع الحسابات' : 'All Accounts'}</span>
          </div>
        </div>

        <div className="summary-card cash">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <h3>{language === 'ar' ? 'الخزائن النقدية' : 'Cash'}</h3>
            <p className="amount">{formatCurrency(cashBalance)}</p>
            <span className="label">{bankAccounts.filter(a => a.type === 'cash').length} {language === 'ar' ? 'حساب' : 'account(s)'}</span>
          </div>
        </div>

        <div className="summary-card bank">
          <div className="summary-icon">🏦</div>
          <div className="summary-content">
            <h3>{language === 'ar' ? 'الحسابات البنكية' : 'Banks'}</h3>
            <p className="amount">{formatCurrency(bankBalance)}</p>
            <span className="label">{bankAccounts.filter(a => a.type === 'bank').length} {language === 'ar' ? 'حساب' : 'account(s)'}</span>
          </div>
        </div>

        <div className="summary-card sales">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>{language === 'ar' ? 'متاح من المبيعات' : 'From Sales'}</h3>
            <p className="amount">{formatCurrency(availableFromSales)}</p>
            <span className="label">{language === 'ar' ? 'محصل فعلياً' : 'Actually received'}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="banking-controls">
        <div className="filter-group">
          <label>{language === 'ar' ? 'نوع الحساب:' : 'Account Type:'}</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
            <option value="cash">{language === 'ar' ? 'خزينة نقدية' : 'Cash'}</option>
            <option value="bank">{language === 'ar' ? 'حساب بنكي' : 'Bank'}</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder={language === 'ar' ? 'البحث في الحسابات...' : 'Search accounts...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {hasPermission('record_deposits') && (
          <button 
            className="btn-primary"
            onClick={() => handleOpenPaymentModal(null, 'deposit')}
          >
            ➕ {language === 'ar' ? 'حركة جديدة' : 'New Transaction'}
          </button>
        )}
      </div>

      {/* Accounts List */}
      <div className="banking-accounts">
        {filteredAccounts.length === 0 ? (
          <div className="empty-state">
            <p>{language === 'ar' ? 'لا توجد حسابات بنكية' : 'No bank accounts found'}</p>
            <small>{language === 'ar' ? 'قم بإضافة حساب بنكي أو خزينة من دليل الحسابات' : 'Add a bank account or cash from Chart of Accounts'}</small>
          </div>
        ) : (
          filteredAccounts.map(account => {
            const balance = computeAccountBalance(account.id)
            const transactions = getAccountTransactions(account.id)
            
            return (
              <div key={account.id} className="account-card">
                <div className="account-header">
                  <div className="account-info">
                    <div className="account-icon">
                      {account.type === 'cash' ? '💵' : '🏦'}
                    </div>
                    <div>
                      <h3>{account.name}</h3>
                      <span className="account-code">{account.code}</span>
                      {account.description && (
                        <p className="account-desc">{account.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="account-balance">
                    <span className="balance-label">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</span>
                    <span className={`balance-amount ${balance < 0 ? 'negative' : 'positive'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="account-actions">
                  {hasPermission('record_deposits') && (
                    <button 
                      className="action-btn deposit"
                      onClick={() => handleOpenPaymentModal(account, 'deposit')}
                    >
                      ⬇️ {language === 'ar' ? 'إيداع' : 'Deposit'}
                    </button>
                  )}
                  {hasPermission('record_withdrawals') && (
                    <button 
                      className="action-btn withdrawal"
                      onClick={() => handleOpenPaymentModal(account, 'withdrawal')}
                    >
                      ⬆️ {language === 'ar' ? 'سحب' : 'Withdraw'}
                    </button>
                  )}
                  {hasPermission('record_payments') && (
                    <button 
                      className="action-btn payment"
                      onClick={() => handleOpenPaymentModal(account, 'payment')}
                    >
                      💳 {language === 'ar' ? 'دفعة' : 'Payment'}
                    </button>
                  )}
                  {hasPermission('record_receipts') && (
                    <button 
                      className="action-btn receipt"
                      onClick={() => handleOpenPaymentModal(account, 'receipt')}
                    >
                      💵 {language === 'ar' ? 'تحصيل' : 'Receipt'}
                    </button>
                  )}
                </div>

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                  <div className="account-transactions">
                    <h4>{language === 'ar' ? 'آخر الحركات' : 'Recent Transactions'}</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                          <th>{language === 'ar' ? 'البيان' : 'Description'}</th>
                          <th>{language === 'ar' ? 'المرجع' : 'Reference'}</th>
                          <th className="amount-col">{language === 'ar' ? 'مدين' : 'Debit'}</th>
                          <th className="amount-col">{language === 'ar' ? 'دائن' : 'Credit'}</th>
                          <th className="amount-col">{language === 'ar' ? 'الرصيد' : 'Balance'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(expandedAccounts[account.id] ? transactions : transactions.slice(0, 5)).map((trans, idx) => (
                          <tr key={`${trans.id}-${idx}`}>
                            <td>{formatDate(trans.date)}</td>
                            <td className="description-col">{trans.description}</td>
                            <td className="reference-col">{trans.reference}</td>
                            <td className="amount-col debit">
                              {trans.debit > 0 ? formatCurrency(trans.debit) : '-'}
                            </td>
                            <td className="amount-col credit">
                              {trans.credit > 0 ? formatCurrency(trans.credit) : '-'}
                            </td>
                            <td className={`amount-col balance ${trans.balance < 0 ? 'negative' : 'positive'}`}>
                              {formatCurrency(trans.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {transactions.length > 5 && (
                      <div className="view-all">
                        <button 
                          className="view-all-btn"
                          onClick={() => toggleExpandAccount(account.id)}
                        >
                          {expandedAccounts[account.id] 
                            ? (language === 'ar' ? '▲ إخفاء الحركات' : '▲ Hide transactions')
                            : (language === 'ar' ? `▼ عرض جميع الحركات (${transactions.length})` : `▼ View all transactions (${transactions.length})`)
                          }
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {transactions.length === 0 && (
                  <div className="no-transactions">
                    <small>{language === 'ar' ? 'لا توجد حركات حتى الآن' : 'No transactions yet'}</small>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          transactionType={selectedTransactionType}
          accountId={selectedAccount?.id}
        />
      )}
    </div>
  )
}

export default Banking
