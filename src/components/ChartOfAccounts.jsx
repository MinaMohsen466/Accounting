import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import PermissionDenied from './PermissionDenied'
import './ChartOfAccounts.css'

const ChartOfAccounts = () => {
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount,
    resetAccountsToDefaults, // 🆕 دالة إعادة التهيئة
    loading, 
    error 
  } = useAccounting()
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()
  
  // Check if user has permission to view chart of accounts
  if (!hasPermission('view_chart_of_accounts')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض دليل الحسابات"
        description="تحتاج إلى صلاحية 'عرض دليل الحسابات' للوصول إلى هذه الصفحة"
      />
    )
  }
  
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState(null)
  
  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pendingEditAccount, setPendingEditAccount] = useState(null)
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    category: 'current',
    description: '',
    parentAccount: '' // Parent account code for sub-accounts
  })

  // Account types and categories with translation support
  const accountTypes = {
    asset: language === 'ar' ? 'أصول' : 'Assets',
    liability: language === 'ar' ? 'خصوم' : 'Liabilities',
    equity: language === 'ar' ? 'حقوق الملكية' : 'Equity',
    revenue: language === 'ar' ? 'إيرادات' : 'Revenue',
    expense: language === 'ar' ? 'مصاريف' : 'Expenses',
    bank: language === 'ar' ? '🏦 حساب بنكي' : '🏦 Bank Account',
    cash: language === 'ar' ? '💰 خزينة نقدية' : '💰 Cash'
  }

  const accountCategories = {
    current: language === 'ar' ? 'متداولة' : 'Current',
    fixed: language === 'ar' ? 'ثابتة' : 'Fixed',
    long_term: language === 'ar' ? 'طويلة الأجل' : 'Long Term',
    capital: language === 'ar' ? 'رأس المال' : 'Capital',
    retained_earnings: language === 'ar' ? 'أرباح محتجزة' : 'Retained Earnings',
    sales: language === 'ar' ? 'مبيعات' : 'Sales',
    other: language === 'ar' ? 'أخرى' : 'Other',
    cost_of_goods: language === 'ar' ? 'تكلفة البضاعة' : 'Cost of Goods',
    operating: language === 'ar' ? 'تشغيلية' : 'Operating',
    administrative: language === 'ar' ? 'إدارية' : 'Administrative'
    ,
    bank_cash: language === 'ar' ? 'بنكي / خزينة' : 'Bank / Cash'
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'asset',
      category: 'current',
      description: '',
      parentAccount: ''
    })
    setEditingAccount(null)
  }

  const openModal = (account = null) => {
    // Check if editing and PIN is required
    if (account) {
      const savedPin = localStorage.getItem('app_editInvoicePin')
      const pinSettings = JSON.parse(localStorage.getItem('app_pinProtectionSettings') || '{"chartOfAccounts": true}')
      
      if (savedPin && pinSettings.chartOfAccounts) {
        // PIN is set and protection is enabled, show PIN modal first
        setPendingEditAccount(account)
        setShowPinModal(true)
        setPinInput('')
        setPinError('')
        return
      }
    }
    
    // No PIN required or creating new account
    proceedToEdit(account)
  }

  const proceedToEdit = (account = null) => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        description: account.description || '',
        parentAccount: account.parentAccount || ''
      })
      setEditingAccount(account)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handlePinVerification = () => {
    const savedPin = localStorage.getItem('app_editInvoicePin')
    
    if (pinInput === savedPin) {
      // PIN correct, proceed to edit
      setShowPinModal(false)
      setPinInput('')
      setPinError('')
      proceedToEdit(pendingEditAccount)
      setPendingEditAccount(null)
    } else {
      // PIN incorrect
      setPinError(language === 'ar' ? 'الرقم السري غير صحيح' : 'Incorrect PIN')
    }
  }

  const closePinModal = () => {
    setShowPinModal(false)
    setPinInput('')
    setPinError('')
    setPendingEditAccount(null)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.code || !formData.name) {
      showNotification('يرجى ملء جميع الحقول المطلوبة', 'error')
      return
    }

    // Check for duplicate account code (excluding current account when editing)
    const existingAccount = accounts.find(acc => 
      acc.code === formData.code && (!editingAccount || acc.id !== editingAccount.id)
    )
    
    if (existingAccount) {
      showNotification(t('accountCodeExists'), 'error')
      return
    }

    try {
      let result
      if (editingAccount) {
        result = updateAccount(editingAccount.id, formData)
      } else {
        result = addAccount(formData)
      }

      if (result.success) {
        showNotification(
          editingAccount ? t('accountUpdatedSuccess') : t('accountAddedSuccess')
        )
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification(t('unexpectedError'), 'error')
    }
  }

  const handleDelete = async (account) => {
    if (window.confirm(`${t('confirmDeleteAccount')} "${account.name}"؟`)) {
      const result = deleteAccount(account.id)
      if (result.success) {
        showNotification(t('accountDeletedSuccess'))
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  // Filter and search accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesType = filterType === 'all' || account.type === filterType
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.includes(searchTerm)
    return matchesType && matchesSearch
  })

  if (loading) {
    return <div className="loading">{t('loadingData')}</div>
  }

  return (
    <div className="chart-of-accounts">
      <div className="page-header">
        <h1>{t('chartOfAccounts')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('create_accounts') && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              {t('addNewAccount')}
            </button>
          )}
          {hasPermission('delete_accounts') && (
            <button 
              className="btn btn-warning" 
              onClick={() => {
                if (window.confirm('⚠️ هل أنت متأكد من حذف جميع الحسابات وإنشاء الحسابات الأساسية؟\n\nسيتم حذف:\n- جميع الحسابات الموجودة\n\nسيتم إنشاء:\n- 11 حساب أساسي فقط (خزينة، بنك، عملاء، موردين، مخزون، مبيعات، مشتريات، خصومات، ضريبة)\n\nلن يتم حذف: الفواتير والقيود اليومية')) {
                  const result = resetAccountsToDefaults()
                  if (result.success) {
                    setNotification({ type: 'success', message: result.message })
                  } else {
                    setNotification({ type: 'error', message: result.error })
                  }
                  setTimeout(() => setNotification(null), 3000)
                }
              }}
              style={{ backgroundColor: '#ff9800' }}
            >
              🔄 إعادة تهيئة الحسابات
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="form-group">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('filterAll')}</option>
            <option value="asset">{t('assets')}</option>
            <option value="liability">{t('liabilities')}</option>
            <option value="equity">{t('equity')}</option>
            <option value="revenue">{t('revenue')}</option>
            <option value="expense">{t('expenses')}</option>
          </select>
        </div>
        
        <div className="form-group">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="table-container">
        {filteredAccounts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('accountCode')}</th>
                <th>{t('accountName')}</th>
                <th>{t('accountType')}</th>
                <th>{t('accountCategory')}</th>
                <th>{language === 'ar' ? 'الحساب الرئيسي' : 'Parent Account'}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => {
                const isSubAccount = account.parentAccount && account.parentAccount !== ''
                return (
                  <tr key={account.id} className={isSubAccount ? 'sub-account-row' : ''}>
                    <td>{account.code}</td>
                    <td>
                      {isSubAccount && <span style={{ marginRight: language === 'ar' ? '20px' : '0', marginLeft: language === 'ar' ? '0' : '20px' }}>↳ </span>}
                      {account.name}
                    </td>
                    <td>{accountTypes[account.type]}</td>
                    <td>{accountCategories[account.category]}</td>
                    <td>
                      {account.parentAccount 
                        ? `${account.parentAccount}`
                        : (language === 'ar' ? '-' : '-')
                      }
                    </td>
                    <td>
                      {hasPermission('edit_accounts') && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openModal(account)}
                        >
                          {t('editAccount')}
                        </button>
                      )}
                      {hasPermission('delete_accounts') && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(account)}
                        >
                          {t('deleteAccount')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{language === 'ar' ? 'لا توجد حسابات متاحة' : 'No accounts available'}</p>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content account-modal">
            <div className="modal-header">
              <h2>{editingAccount ? t('editAccount') : t('addNewAccount')}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body-scrollable">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{t('accountCode')} *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder={language === 'ar' ? 'مثال: 1001' : 'Example: 1001'}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('accountName')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={language === 'ar' ? 'مثال: النقدية' : 'Example: Cash'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'الحساب الرئيسي (اختياري)' : 'Parent Account (Optional)'}</label>
                  <select
                    value={formData.parentAccount}
                    onChange={(e) => setFormData({...formData, parentAccount: e.target.value})}
                  >
                    <option value="">{language === 'ar' ? '-- لا يوجد (حساب رئيسي) --' : '-- None (Main Account) --'}</option>
                    {accounts
                      .filter(acc => !editingAccount || acc.id !== editingAccount.id) // Don't show self
                      .filter(acc => formData.type ? acc.type === formData.type : true) // Filter by same type
                      .map(acc => (
                        <option key={acc.id} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))
                    }
                  </select>
                  <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
                    {language === 'ar' 
                      ? 'اختر حساباً رئيسياً لإنشاء حساب فرعي تحته' 
                      : 'Select a parent account to create a sub-account under it'}
                  </small>
                </div>
                
                <div className="form-group">
                  <label>{t('accountType')} *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value
                      // Set a sensible default category depending on type
                      const defaultCategory = (newType === 'bank' || newType === 'cash') ? 'bank_cash' : 'current'
                      setFormData({...formData, type: newType, category: defaultCategory})
                    }}
                    required
                  >
                    <option value="asset">{accountTypes.asset}</option>
                    <option value="liability">{accountTypes.liability}</option>
                    <option value="equity">{accountTypes.equity}</option>
                    <option value="revenue">{accountTypes.revenue}</option>
                    <option value="expense">{accountTypes.expense}</option>
                    <option value="bank">{accountTypes.bank}</option>
                    <option value="cash">{accountTypes.cash}</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('accountCategory')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    {/* Bank/Cash accounts get a dedicated category to avoid empty select */}
                    {(formData.type === 'bank' || formData.type === 'cash') && (
                      <>
                        <option value="bank_cash">{accountCategories.bank_cash}</option>
                      </>
                    )}
                    {formData.type === 'asset' && (
                      <>
                        <option value="current">{accountCategories.current}</option>
                        <option value="fixed">{accountCategories.fixed}</option>
                      </>
                    )}
                    {formData.type === 'liability' && (
                      <>
                        <option value="current">{accountCategories.current}</option>
                        <option value="long_term">{accountCategories.long_term}</option>
                      </>
                    )}
                    {formData.type === 'equity' && (
                      <>
                        <option value="capital">{accountCategories.capital}</option>
                        <option value="retained_earnings">{accountCategories.retained_earnings}</option>
                      </>
                    )}
                    {formData.type === 'revenue' && (
                      <>
                        <option value="sales">{accountCategories.sales}</option>
                        <option value="other">{accountCategories.other}</option>
                      </>
                    )}
                    {formData.type === 'expense' && (
                      <>
                        <option value="cost_of_goods">{accountCategories.cost_of_goods}</option>
                        <option value="operating">{accountCategories.operating}</option>
                        <option value="administrative">{accountCategories.administrative}</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={language === 'ar' ? 'وصف اختياري للحساب' : 'Optional account description'}
                    rows="3"
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingAccount ? t('save') : t('addNewAccount')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="modal-overlay" onClick={closePinModal}>
          <div className="modal-content pin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔐 {language === 'ar' ? 'التحقق من الرقم السري' : 'PIN Verification'}</h2>
              <button className="close-btn" onClick={closePinModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#64748b', textAlign: 'center' }}>
                {language === 'ar' 
                  ? 'يرجى إدخال الرقم السري للموافقة على تعديل الحساب' 
                  : 'Please enter PIN to authorize account editing'}
              </p>
              
              <div className="form-group">
                <label>{language === 'ar' ? 'الرقم السري' : 'PIN'}</label>
                <input
                  type="password"
                  className="form-control pin-input"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value)
                    setPinError('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePinVerification()
                    }
                  }}
                  placeholder={language === 'ar' ? 'أدخل الرقم السري' : 'Enter PIN'}
                  autoFocus
                  maxLength="8"
                />
              </div>

              {pinError && (
                <div className="error-message" style={{ 
                  color: '#ef4444', 
                  marginTop: '10px', 
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  ❌ {pinError}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handlePinVerification}
                  disabled={!pinInput}
                >
                  {language === 'ar' ? 'تأكيد' : 'Verify'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={closePinModal}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChartOfAccounts