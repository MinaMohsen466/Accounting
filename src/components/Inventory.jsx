import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  PRODUCT_CATEGORIES, 
  MEASUREMENT_UNITS, 
  CATEGORY_DETAILS, 
  UNIT_DETAILS,
  PaintProductService 
} from '../services/PaintProductService'
import ColorManager from './ColorManager'
import UnitConverter from './UnitConverter'
import './Inventory.css'

const Inventory = () => {
  const { 
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  } = useAccounting()
  const { t, language } = useLanguage()

  // Get unique categories from existing items only
  const existingCategories = [...new Set(inventoryItems?.map(item => item.category).filter(Boolean))].sort()

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showColorManager, setShowColorManager] = useState(false)
  const [selectedColor, setSelectedColor] = useState(null)
  const [showUnitConverter, setShowUnitConverter] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    productType: '',
    unit: 'piece',
    customUnitName: '',
    customCategoryName: '',
    quantity: 0,
    price: 0,
    purchasePrice: 0,
    minStockLevel: 10,
    expiryDate: '',
    
    // Color properties
    colorCode: '',
    colorName: '',
    colorSystem: '',
    colorFormula: '',
    
    // Additional properties
    manufacturer: '',
    batchNumber: '',
    description: '',
    properties: {}
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const openModal = (item = null) => {
    setEditingItem(item)
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || '',
        productType: item.productType || item.category || '',
        unit: item.unit || 'piece',
        customUnitName: item.customUnitName || '',
        customCategoryName: item.customCategoryName || '',
        quantity: item.quantity || 0,
        price: item.price || item.unitPrice || 0,
        purchasePrice: item.purchasePrice || 0,
        minStockLevel: item.minStockLevel || 10,
        expiryDate: item.expiryDate || '',
        
        // Color properties
        colorCode: item.colorCode || '',
        colorName: item.colorName || '',
        colorSystem: item.colorSystem || '',
        colorFormula: item.colorFormula || '',
        
        // Additional properties
        manufacturer: item.manufacturer || '',
        batchNumber: item.batchNumber || '',
        description: item.description || '',
        properties: item.properties || {}
      })
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        productType: '',
        unit: 'piece',
        customUnitName: '',
        customCategoryName: '',
        quantity: 0,
        price: 0,
        purchasePrice: 0,
        minStockLevel: 10,
        expiryDate: '',
        
        // Color properties
        colorCode: '',
        colorName: '',
        colorSystem: '',
        colorFormula: '',
        
        // Additional properties
        manufacturer: '',
        batchNumber: '',
        description: '',
        properties: {}
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setSelectedColor(null)
    setFormData({
      name: '',
      sku: '',
      category: '',
      productType: '',
      unit: 'piece',
      customUnitName: '',
      customCategoryName: '',
      quantity: 0,
      price: 0,
      purchasePrice: 0,
      minStockLevel: 10,
      expiryDate: '',
      
      // Color properties
      colorCode: '',
      colorName: '',
      colorSystem: '',
      colorFormula: '',
      
      // Additional properties
      manufacturer: '',
      batchNumber: '',
      description: '',
      properties: {}
    })
  }

  // Clear custom unit name when unit changes from custom
  useEffect(() => {
    if (formData.unit !== 'custom') {
      setFormData(prev => ({ ...prev, customUnitName: '' }))
    }
  }, [formData.unit])

  // Clear custom category name when category changes from custom
  useEffect(() => {
    if (formData.category !== 'custom') {
      setFormData(prev => ({ ...prev, customCategoryName: '' }))
    }
  }, [formData.category])

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color)
    setFormData(prev => ({
      ...prev,
      colorCode: color.code,
      colorName: color.name,
      colorSystem: color.system,
      colorFormula: color.formula || ''
    }))
    setShowColorManager(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.sku || formData.quantity < 0 || formData.price < 0 || formData.purchasePrice < 0) {
      showNotification(t('fillRequiredFields'), 'error')
      return
    }

    // Handle custom category
    const finalFormData = { ...formData }
    if (formData.category === 'custom' && formData.customCategoryName) {
      finalFormData.category = formData.customCategoryName
      finalFormData.productType = formData.customCategoryName
    }

    try {
      let result
      if (editingItem) {
        result = updateInventoryItem(editingItem.id, finalFormData)
      } else {
        result = addInventoryItem(finalFormData)
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
        <div className="header-actions">
          <button 
            className="btn btn-info" 
            onClick={() => setShowUnitConverter(true)}
            title={t('unitConverter')}
          >
            🔄 {t('unitConverter')}
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            {t('addProduct')}
          </button>
        </div>
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
              {Object.entries(CATEGORY_DETAILS).map(([key, details]) => (
                <option key={key} value={key}>
                  {details.icon} {details.nameAr}
                </option>
              ))}
              {categories.filter(cat => !Object.keys(CATEGORY_DETAILS).includes(cat)).map(category => (
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
                <th>{t('unit')}</th>
                <th>{t('quantity')}</th>
                <th>{t('purchasePrice')}</th>
                <th>{t('unitPrice')}</th>
                <th>{t('totalValue')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map(item => {
                const categoryDetails = CATEGORY_DETAILS[item.category] || CATEGORY_DETAILS[item.productType]
                const stockStatus = PaintProductService.checkStockLevel(item.quantity, item.minStockLevel, item.category)
                const expiryStatus = PaintProductService.checkExpiryStatus(item.expiryDate)
                const unitDetails = UNIT_DETAILS[item.unit]
                
                return (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>
                    <div className="product-info">
                      <span className="product-name">{item.name}</span>
                      {item.colorCode && (
                        <span className="color-info">
                          <span className="color-badge">{item.colorCode}</span>
                          {item.colorName && <small>{item.colorName}</small>}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="category-display">
                      {categoryDetails ? (
                        <span className="category-badge" style={{backgroundColor: categoryDetails.color}}>
                          {categoryDetails.icon} {categoryDetails.nameAr}
                        </span>
                      ) : (
                        <span className="category-badge-old">{item.category}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {item.unit === 'custom' && item.customUnitName ? (
                      <span className="unit-display">{item.customUnitName}</span>
                    ) : unitDetails ? (
                      <span className="unit-display">{unitDetails.nameAr} ({unitDetails.symbol})</span>
                    ) : (
                      <span>{item.unit || 'قطعة'}</span>
                    )}
                  </td>
                  <td>
                    <div className="quantity-display">
                      <span className={`quantity-badge ${stockStatus.level}`}>
                        {item.quantity} {item.unit === 'custom' && item.customUnitName ? item.customUnitName : (unitDetails?.symbol || item.unit)}
                      </span>
                      
                      {/* Quick conversion for volume units */}
                      {item.unit === 'liter' && item.quantity > 0 && (
                        <small className="conversion-hint">
                          ≈ {PaintProductService.convertUnit(item.quantity, 'liter', 'gallon').toFixed(2)} Gal
                        </small>
                      )}
                      {item.unit === 'gallon' && item.quantity > 0 && (
                        <small className="conversion-hint">
                          ≈ {PaintProductService.convertUnit(item.quantity, 'gallon', 'liter').toFixed(2)} L
                        </small>
                      )}
                      
                      {expiryStatus.status === 'expired' && (
                        <span className="expiry-warning expired">منتهي الصلاحية</span>
                      )}
                      {expiryStatus.status === 'expiring_soon' && (
                        <span className="expiry-warning soon">ينتهي قريباً</span>
                      )}
                    </div>
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
                )
              })}
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
                    <label>{t('category')} *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, productType: e.target.value }))}
                      required
                    >
                      <option value="">{t('selectCategory')}</option>
                      {Object.entries(CATEGORY_DETAILS).map(([key, details]) => (
                        <option key={key} value={key}>
                          {details.icon} {details.nameAr}
                        </option>
                      ))}
                      <option value="custom">➕ {language === 'ar' ? 'إضافة تصنيف جديد' : 'Add New Category'}</option>
                    </select>
                  </div>
                  
                  {/* Custom Category Name Field */}
                  {formData.category === 'custom' && (
                    <div className="form-group">
                      <label>{language === 'ar' ? 'اسم التصنيف الجديد' : 'New Category Name'} *</label>
                      <input
                        type="text"
                        value={formData.customCategoryName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customCategoryName: e.target.value }))}
                        placeholder={language === 'ar' ? 'مثل: أدوات التنظيف، مواد البناء، إلخ' : 'e.g: Cleaning Tools, Construction Materials, etc'}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>{t('unit')} *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      required
                    >
                      <option value="">{t('selectUnit')}</option>
                      {formData.category && CATEGORY_DETAILS[formData.category] ? 
                        CATEGORY_DETAILS[formData.category].allowedUnits.map(unit => (
                          <option key={unit} value={unit}>
                            {UNIT_DETAILS[unit]?.nameAr || t(unit)} ({UNIT_DETAILS[unit]?.symbol})
                          </option>
                        )) :
                        Object.entries(UNIT_DETAILS).map(([key, details]) => (
                          <option key={key} value={key}>
                            {details.nameAr} ({details.symbol})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                
                {/* Custom Unit Name Field */}
                {formData.unit === 'custom' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>{language === 'ar' ? 'اسم الوحدة المخصصة' : 'Custom Unit Name'} *</label>
                      <input
                        type="text"
                        value={formData.customUnitName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customUnitName: e.target.value }))}
                        placeholder={language === 'ar' ? 'مثل: صندوق، كرتون، إلخ' : 'e.g: Box, Carton, etc'}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
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

                {/* حقول متخصصة لمنتجات الأصباغ */}
                {formData.category && CATEGORY_DETAILS[formData.category] && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('minStockLevel')}</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.minStockLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 10 }))}
                          placeholder="10"
                        />
                      </div>
                      {CATEGORY_DETAILS[formData.category].hasExpiryDate && (
                        <div className="form-group">
                          <label>{t('expiryDate')}</label>
                          <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    {/* حقول الألوان للدهانات */}
                    {CATEGORY_DETAILS[formData.category].hasColorCode && (
                      <>
                        <div className="color-selection-section">
                          <div className="color-header">
                            <h4>{t('colorInformation')}</h4>
                            <button 
                              type="button"
                              className="btn btn-info btn-sm"
                              onClick={() => setShowColorManager(true)}
                            >
                              🎨 {t('chooseColor')}
                            </button>
                          </div>
                          
                          {selectedColor && (
                            <div className="selected-color-preview">
                              <div 
                                className="color-swatch"
                                style={{ backgroundColor: selectedColor.hexValue }}
                              ></div>
                              <div className="color-details">
                                <span className="color-name">{selectedColor.name}</span>
                                <span className="color-code">{selectedColor.code}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>{t('colorCode')}</label>
                            <input
                              type="text"
                              value={formData.colorCode}
                              onChange={(e) => setFormData(prev => ({ ...prev, colorCode: e.target.value }))}
                              placeholder="RAL 9010"
                            />
                          </div>
                          <div className="form-group">
                            <label>{t('colorName')}</label>
                            <input
                              type="text"
                              value={formData.colorName}
                              onChange={(e) => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
                              placeholder={t('colorName')}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>{t('colorFormula')}</label>
                            <textarea
                              value={formData.colorFormula}
                              onChange={(e) => setFormData(prev => ({ ...prev, colorFormula: e.target.value }))}
                              placeholder={t('colorFormulaPlaceholder')}
                              rows="2"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('manufacturer')}</label>
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                          placeholder={t('manufacturer')}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t('batchNumber')}</label>
                        <input
                          type="text"
                          value={formData.batchNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                          placeholder={t('batchNumber')}
                        />
                      </div>
                    </div>
                  </>
                )}

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

      {/* Color Manager Modal */}
      <ColorManager
        showModal={showColorManager}
        onClose={() => setShowColorManager(false)}
        onColorSelect={handleColorSelect}
        selectedColor={selectedColor}
      />

      {/* Unit Converter Modal */}
      <UnitConverter
        showModal={showUnitConverter}
        onClose={() => setShowUnitConverter(false)}
      />
    </div>
  )
}

export default Inventory