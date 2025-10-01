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

  // Get unique categories from existing items only
  const existingCategories = [...new Set(inventoryItems?.map(item => item.category).filter(Boolean))].sort()

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    purchasePrice: 0,
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
        purchasePrice: item.purchasePrice || 0,
        description: item.description || ''
      })
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        quantity: 0,
        price: 0,
        purchasePrice: 0,
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
      price: 0,
      purchasePrice: 0,
      description: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.sku || formData.quantity < 0 || formData.price < 0 || formData.purchasePrice < 0) {
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

  // Search and filter logic
  const filteredAndSortedItems = () => {
    let filtered = inventoryItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = filterCategory === 'all' || 
        (item.category && item.category.toLowerCase() === filterCategory.toLowerCase())
      
      return matchesSearch && matchesCategory
    })

    // Sort the filtered items
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      // Handle numeric fields
      if (sortBy === 'quantity' || sortBy === 'price') {
        aValue = parseFloat(aValue) || 0
        bValue = parseFloat(bValue) || 0
      } else {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const displayedItems = filteredAndSortedItems()
  
  // Get unique categories for filter dropdown
  const categories = [...new Set(inventoryItems.map(item => item.category).filter(Boolean))]

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
          <p>{displayedItems?.length || 0} / {inventoryItems?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>{t('totalValue')}</h3>
          <p>{totalValue.toFixed(2)} {t('currency')}</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="inventory-controls">
        <div className="search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('searchInventory')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-controls">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('allCategories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">{t('sortByName')}</option>
              <option value="sku">{t('sortBySKU')}</option>
              <option value="category">{t('sortByCategory')}</option>
              <option value="quantity">{t('sortByQuantity')}</option>
              <option value="price">{t('sortByPrice')}</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
              title={sortOrder === 'asc' ? t('sortDescending') : t('sortAscending')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {(searchTerm || filterCategory !== 'all') && (
          <div className="search-results">
            <span>{t('showingResults')}: {displayedItems.length} {t('of')} {inventoryItems.length}</span>
            <button 
              onClick={() => {
                setSearchTerm('')
                setFilterCategory('all')
              }}
              className="clear-search-btn"
            >
              {t('clearSearch')}
            </button>
          </div>
        )}
      </div>

      <div className="table-container">
        {displayedItems?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('sku')}</th>
                <th>{t('productName')}</th>
                <th>{t('category')}</th>
                <th>{t('quantity')}</th>
                <th>{t('purchasePrice')}</th>
                <th>{t('unitPrice')}</th>
                <th>{t('totalValue')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map(item => (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`quantity-badge ${item.quantity < 10 ? 'low-stock' : 'normal-stock'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="purchase-price">{(item.purchasePrice || 0).toFixed(3)} {t('kwd')}</td>
                  <td className="selling-price">{(item.price || item.unitPrice || 0).toFixed(3)} {t('kwd')}</td>
                  <td className="total-value">{(item.quantity * (item.price || item.unitPrice || 0)).toFixed(3)} {t('kwd')}</td>
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
            {inventoryItems.length === 0 ? (
              <p>{t('noProducts')}</p>
            ) : (
              <p>{t('noSearchResults')}</p>
            )}
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
                    <label>{t('category')} 📂</label>
                    <div className="category-input-container">
                      <input
                        type="text"
                        list="categories-list"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder={t('selectOrTypeCategory')}
                        className="category-input"
                      />
                      <datalist id="categories-list">
                        {existingCategories.map((category, index) => (
                          <option key={index} value={category} />
                        ))}
                      </datalist>
                    </div>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('purchasePrice')} *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      required
                      placeholder="0.000"
                    />
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
                      placeholder="0.000"
                    />
                  </div>
                </div>

                <div className="profit-indicator">
                  <span className="profit-label">{t('expectedProfit')}: </span>
                  <span className={`profit-value ${(formData.price - formData.purchasePrice) >= 0 ? 'positive' : 'negative'}`}>
                    {(formData.price - formData.purchasePrice).toFixed(3)} {t('kwd')}
                  </span>
                  {formData.purchasePrice > 0 && (
                    <span className="profit-percentage">
                      ({(((formData.price - formData.purchasePrice) / formData.purchasePrice) * 100).toFixed(1)}%)
                    </span>
                  )}
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