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
  const { t } = useLanguage()
  
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

  // Account types and categories in Arabic
  const accountTypes = {
    asset: 'أصول',
    liability: 'خصوم',
    equity: 'حقوق الملكية',
    revenue: 'إيرادات',
    expense: 'مصاريف'
  }

  const accountCategories = {
    current: 'متداولة',
    fixed: 'ثابتة',
    long_term: 'طويلة الأجل',
    capital: 'رأس المال',
    retained_earnings: 'أرباح محتجزة',
    sales: 'مبيعات',
    other: 'أخرى',
    cost_of_goods: 'تكلفة البضاعة',
    operating: 'تشغيلية',
    administrative: 'إدارية'
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
      showNotification('رقم الحساب موجود بالفعل', 'error')
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
          editingAccount ? 'تم تحديث الحساب بنجاح' : 'تم إضافة الحساب بنجاح'
        )
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification('حدث خطأ غير متوقع', 'error')
    }
  }

  const handleDelete = async (account) => {
    if (window.confirm(`هل أنت متأكد من حذف الحساب "${account.name}"؟`)) {
      const result = deleteAccount(account.id)
      if (result.success) {
        showNotification('تم حذف الحساب بنجاح')
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
    return <div className="loading">جاري تحميل البيانات...</div>
  }

  return (
    <div className="chart-of-accounts">
      <div className="page-header">
        <h1>دليل الحسابات</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          إضافة حساب جديد
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
            <option value="all">جميع الحسابات</option>
            <option value="asset">الأصول</option>
            <option value="liability">الخصوم</option>
            <option value="equity">حقوق الملكية</option>
            <option value="revenue">الإيرادات</option>
            <option value="expense">المصاريف</option>
          </select>
        </div>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="البحث في الحسابات..."
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
                <th>رقم الحساب</th>
                <th>اسم الحساب</th>
                <th>النوع</th>
                <th>التصنيف</th>
                <th>الإجراءات</th>
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
                      تعديل
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(account)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>لا توجد حسابات متاحة</p>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>رقم الحساب *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="مثال: 1001"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>اسم الحساب *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: النقدية"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>نوع الحساب *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value, category: 'current'})}
                  required
                >
                  <option value="asset">أصول</option>
                  <option value="liability">خصوم</option>
                  <option value="equity">حقوق الملكية</option>
                  <option value="revenue">إيرادات</option>
                  <option value="expense">مصاريف</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>تصنيف الحساب *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  {formData.type === 'asset' && (
                    <>
                      <option value="current">متداولة</option>
                      <option value="fixed">ثابتة</option>
                    </>
                  )}
                  {formData.type === 'liability' && (
                    <>
                      <option value="current">متداولة</option>
                      <option value="long_term">طويلة الأجل</option>
                    </>
                  )}
                  {formData.type === 'equity' && (
                    <>
                      <option value="capital">رأس المال</option>
                      <option value="retained_earnings">أرباح محتجزة</option>
                    </>
                  )}
                  {formData.type === 'revenue' && (
                    <>
                      <option value="sales">مبيعات</option>
                      <option value="other">أخرى</option>
                    </>
                  )}
                  {formData.type === 'expense' && (
                    <>
                      <option value="cost_of_goods">تكلفة البضاعة</option>
                      <option value="operating">تشغيلية</option>
                      <option value="administrative">إدارية</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="form-group">
                <label>وصف الحساب</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف اختياري للحساب"
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'حفظ التغييرات' : 'إضافة الحساب'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  إلغاء
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