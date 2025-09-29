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
  const { t } = useLanguage()

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
    
    // Validation
    if (!formData.name.trim()) {
      showNotification('يرجى إدخال الاسم', 'error')
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
        showNotification(
          `تم ${editingItem ? 'تحديث' : 'إضافة'} ${isCustomer ? 'العميل' : 'المورد'} بنجاح`
        )
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification('حدث خطأ غير متوقع', 'error')
    }
  }

  const handleDelete = async (item) => {
    const isCustomer = activeTab === 'customers'
    const type = isCustomer ? 'العميل' : 'المورد'
    
    if (window.confirm(`هل أنت متأكد من حذف ${type} "${item.name}"؟`)) {
      const result = isCustomer 
        ? deleteCustomer(item.id)
        : deleteSupplier(item.id)
        
      if (result.success) {
        showNotification(`تم حذف ${type} بنجاح`)
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  // Get current data based on active tab
  const currentData = activeTab === 'customers' ? customers : suppliers
  
  // Filter data based on search term
  const filteredData = currentData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.phone && item.phone.includes(searchTerm)) ||
    (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="customers-suppliers">
      <div className="page-header">
        <h1>إدارة العملاء والموردين</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          إضافة {activeTab === 'customers' ? 'عميل' : 'مورد'} جديد
        </button>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="client-tabs">
        <button 
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('customers'); setSearchTerm('') }}
        >
          العملاء ({customers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('suppliers'); setSearchTerm('') }}
        >
          الموردون ({suppliers.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder={`البحث في ${activeTab === 'customers' ? 'العملاء' : 'الموردين'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Data Table */}
      <div className="table-container">
        {filteredData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>العنوان</th>
                <th>الرصيد</th>
                <th>الإجراءات</th>
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
                    {parseFloat(item.balance || 0).toFixed(2)}
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal(item)}
                    >
                      تعديل
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item)}
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
            <p>
              {searchTerm 
                ? `لا توجد نتائج للبحث "${searchTerm}"`
                : `لا يوجد ${activeTab === 'customers' ? 'عملاء' : 'موردين'} مسجلين`
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content client-modal">
            <div className="modal-header">
              <h2>
                {editingItem 
                  ? `تعديل ${activeTab === 'customers' ? 'العميل' : 'المورد'}`
                  : `إضافة ${activeTab === 'customers' ? 'عميل' : 'مورد'} جديد`
                }
              </h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>الاسم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم العميل أو المورد"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div className="form-group">
                  <label>البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>العنوان</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="العنوان الكامل"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>الرصيد الابتدائي</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>ملاحظات</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'حفظ التغييرات' : `إضافة ${activeTab === 'customers' ? 'العميل' : 'المورد'}`}
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

export default CustomersSuppliers