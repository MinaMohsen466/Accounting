import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './ChartOfAccounts.css'

const ChartOfAccounts = () => {
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount, 
    loading, 
    error 
  } = useAccounting()
  const { t, language } = useLanguage()
  
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState(null)
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    category: 'current',
    description: ''
  })

  // Account types and categories with translation support
  const accountTypes = {
    asset: language === 'ar' ? 'أصول' : 'Assets',
    liability: language === 'ar' ? 'خصوم' : 'Liabilities',
    equity: language === 'ar' ? 'حقوق الملكية' : 'Equity',
    revenue: language === 'ar' ? 'إيرادات' : 'Revenue',
    expense: language === 'ar' ? 'مصاريف' : 'Expenses'
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
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'asset',
      category: 'current',
      description: ''
    })
    setEditingAccount(null)
  }

  const openModal = (account = null) => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        description: account.description || ''
      })
      setEditingAccount(account)
    } else {
      resetForm()
    }
    setShowModal(true)
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
        <button className="btn btn-primary" onClick={() => openModal()}>
          {t('addNewAccount')}
        </button>
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
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => (
                <tr key={account.id}>
                  <td>{account.code}</td>
                  <td>{account.name}</td>
                  <td>{accountTypes[account.type]}</td>
                  <td>{accountCategories[account.category]}</td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal(account)}
                    >
                      {t('editAccount')}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(account)}
                    >
                      {t('deleteAccount')}
                    </button>
                  </td>
                </tr>
              ))}
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
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingAccount ? t('editAccount') : t('addNewAccount')}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
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
                <label>{t('accountType')} *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value, category: 'current'})}
                  required
                >
                  <option value="asset">{accountTypes.asset}</option>
                  <option value="liability">{accountTypes.liability}</option>
                  <option value="equity">{accountTypes.equity}</option>
                  <option value="revenue">{accountTypes.revenue}</option>
                  <option value="expense">{accountTypes.expense}</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{t('accountCategory')} *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
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
      )}
    </div>
  )
}

export default ChartOfAccounts