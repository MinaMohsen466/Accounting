import { useState } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './Inventory.css'

const Inventory = () => {
  const { 
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  } = useAccounting()
  const { t } = useLanguage()

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [notification, setNotification] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    description: ''
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const openModal = (item = null) => {
    setEditingItem(item)
    if (item) {
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        price: item.price || item.unitPrice || 0,
        description: item.description || ''
      })
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        quantity: 0,
        price: 0,
        description: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      unitPrice: 0,
      description: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.sku || formData.quantity < 0 || formData.price < 0) {
      showNotification(t('fillRequiredFields'), 'error')
      return
    }

    try {
      let result
      if (editingItem) {
        result = updateInventoryItem(editingItem.id, formData)
      } else {
        result = addInventoryItem(formData)
      }

      if (result.success) {
        showNotification(
          editingItem ? t('updateSuccess') : t('saveSuccess')
        )
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification(t('error'), 'error')
    }
  }

  const handleDelete = (item) => {
    if (window.confirm(`${t('confirmDelete')} "${item.name}"؟`)) {
      const result = deleteInventoryItem(item.id)
      if (result.success) {
        showNotification(t('deleteSuccess'))
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  const totalValue = inventoryItems.reduce((sum, item) => 
    sum + (item.quantity * (item.price || item.unitPrice || 0)), 0
  )

  return (
    <div className="inventory">
      <div className="page-header">
        <h1>{t('inventoryManagement')}</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          {t('addProduct')}
        </button>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="inventory-stats">
        <div className="stat-card">
          <h3>{t('totalProducts')}</h3>
          <p>{inventoryItems?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>{t('totalValue')}</h3>
          <p>{totalValue.toFixed(2)} {t('currency')}</p>
        </div>
      </div>

      <div className="table-container">
        {inventoryItems?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('sku')}</th>
                <th>{t('productName')}</th>
                <th>{t('category')}</th>
                <th>{t('quantity')}</th>
                <th>{t('unitPrice')}</th>
                <th>{t('totalValue')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map(item => (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.quantity}</td>
                  <td>{(item.price || item.unitPrice || 0).toFixed(3)}</td>
                  <td>{(item.quantity * (item.price || item.unitPrice || 0)).toFixed(3)}</td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal(item)}
                    >
                      {t('edit')}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item)}
                    >
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{t('noProducts')}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingItem ? t('edit') + ' ' + t('products') : t('addProduct')}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('productName')} *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('sku')} *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('category')}</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('quantity')} *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('unitPrice')} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory