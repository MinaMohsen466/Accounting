import { useState } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './CustomersSuppliers.css'

const CustomersSuppliers = () => {
  const { 
    customers,
    suppliers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier
  } = useAccounting()
  const { t, language } = useLanguage()

  const [activeTab, setActiveTab] = useState('customers')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: 0,
    notes: ''
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      balance: 0,
      notes: ''
    })
    setEditingItem(null)
  }

  const openModal = (item = null) => {
    if (item) {
      setFormData({
        name: item.name,
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        balance: item.balance || 0,
        notes: item.notes || ''
      })
      setEditingItem(item)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showNotification(
        language === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter name', 
        'error'
      )
      return
    }

    try {
      let result
      const isCustomer = activeTab === 'customers'
      
      if (editingItem) {
        result = isCustomer 
          ? updateCustomer(editingItem.id, formData)
          : updateSupplier(editingItem.id, formData)
      } else {
        result = isCustomer 
          ? addCustomer(formData)
          : addSupplier(formData)
      }

      if (result.success) {
        const successMessage = editingItem
          ? (isCustomer ? t('customerUpdatedSuccess') : t('supplierUpdatedSuccess'))
          : (isCustomer ? t('customerAddedSuccess') : t('supplierAddedSuccess'))
        showNotification(successMessage)
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification(t('unexpectedError'), 'error')
    }
  }

  const handleDelete = async (item) => {
    const isCustomer = activeTab === 'customers'
    const confirmMessage = isCustomer 
      ? `${t('confirmDeleteCustomer')} "${item.name}"؟`
      : `${t('confirmDeleteSupplier')} "${item.name}"؟`
    
    if (window.confirm(confirmMessage)) {
      const result = isCustomer 
        ? deleteCustomer(item.id)
        : deleteSupplier(item.id)
        
      if (result.success) {
        const successMessage = isCustomer 
          ? t('customerDeletedSuccess')
          : t('supplierDeletedSuccess')
        showNotification(successMessage)
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  const currentData = activeTab === 'customers' ? customers : suppliers
  
  const filteredData = currentData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.phone && item.phone.includes(searchTerm)) ||
    (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="customers-suppliers">
      <div className="page-header">
        <h1>{t('customersAndSuppliers')}</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          {activeTab === 'customers' ? t('addNewCustomer') : t('addNewSupplier')}
        </button>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="client-tabs">
        <button 
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('customers'); setSearchTerm('') }}
        >
          {t('customers')} ({customers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('suppliers'); setSearchTerm('') }}
        >
          {t('suppliers')} ({suppliers.length})
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder={t('searchCustomersSuppliers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        {filteredData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                <th>{t('phone')}</th>
                <th>{t('email')}</th>
                <th>{t('address')}</th>
                <th>{t('balance')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id}>
                  <td className="name-cell">
                    <div className="name-info">
                      <span className="name">{item.name}</span>
                      {item.notes && <span className="notes">({item.notes})</span>}
                    </div>
                  </td>
                  <td>{item.phone || '-'}</td>
                  <td>{item.email || '-'}</td>
                  <td className="address-cell">{item.address || '-'}</td>
                  <td className={`balance-cell ${item.balance > 0 ? 'positive' : item.balance < 0 ? 'negative' : ''}`}>
                    {parseFloat(item.balance || 0).toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal(item)}
                    >
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item)}
                    >
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>
              {searchTerm 
                ? (language === 'ar' 
                    ? `لا توجد نتائج للبحث "${searchTerm}"`
                    : `No results found for "${searchTerm}"`)
                : (activeTab === 'customers' 
                    ? t('noCustomersFound')
                    : t('noSuppliersFound'))
              }
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content client-modal">
            <div className="modal-header">
              <h2>
                {editingItem 
                  ? (activeTab === 'customers' ? t('editCustomer') : t('editSupplier'))
                  : (activeTab === 'customers' ? t('addNewCustomer') : t('addNewSupplier'))
                }
              </h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{activeTab === 'customers' ? t('customerName') : t('supplierName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'ar' ? 'اسم العميل أو المورد' : 'Customer or Supplier name'}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div className="form-group">
                  <label>{t('email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('address')}</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={language === 'ar' ? 'العنوان الكامل' : 'Full address'}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'الرصيد الابتدائي' : 'Initial Balance'}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                    placeholder="0.000"
                  />
                </div>

                <div className="form-group">
                  <label>{t('notes')}</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes'}
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 
                    (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : 
                    (activeTab === 'customers' ? 
                      (language === 'ar' ? 'إضافة عميل' : 'Add Customer') : 
                      (language === 'ar' ? 'إضافة مورد' : 'Add Supplier')
                    )
                  }
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

export default CustomersSuppliers
