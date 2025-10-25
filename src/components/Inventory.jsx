import { useState, useEffect, useRef } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  PRODUCT_CATEGORIES, 
  MEASUREMENT_UNITS, 
  CATEGORY_DETAILS, 
  UNIT_DETAILS,
  PaintProductService 
} from '../services/PaintProductService'
import UnitConverter from './UnitConverter'
import PermissionDenied from './PermissionDenied'
import './Inventory.css'

const Inventory = () => {
  const { 
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  } = useAccounting()
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()

  // Check if user has permission to view inventory
  if (!hasPermission('view_inventory')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض المخزون"
        description="تحتاج إلى صلاحية 'عرض المخزون' للوصول إلى هذه الصفحة"
      />
    )
  }

  // Get unique categories from existing items only
  const existingCategories = [...new Set(inventoryItems?.map(item => item.category).filter(Boolean))].sort()
  
  // Get the last 6 recently added categories (excluding predefined ones)
  const getRecentCategories = () => {
    const predefinedCategories = ['interior_paint', 'exterior_paint', 'primer', 'varnish', 'brushes', 'tools', 'accessories']
    const customCategories = existingCategories.filter(cat => !predefinedCategories.includes(cat))
    return customCategories.slice(-6).reverse() // Get last 6 and reverse to show newest first
  }

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showUnitConverter, setShowUnitConverter] = useState(false)
  
  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pendingEditItem, setPendingEditItem] = useState(null)
  // text-backed inputs for prices (use empty string initially so field is blank)
  const [priceInput, setPriceInput] = useState('')
  const [purchasePriceInput, setPurchasePriceInput] = useState('')
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
    
    // Additional properties
    manufacturer: '',
    batchNumber: '',
    description: '',
    properties: {},
    
    // Payment options (for new items only)
    recordPayment: false,
    paymentAccountId: ''
  })



  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Record payment for inventory purchase
  const recordInventoryPurchasePayment = (item) => {
    try {
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]')
      const paymentAccount = accounts.find(acc => acc.id === formData.paymentAccountId)
      
      if (!paymentAccount) {
        console.error('Payment account not found')
        return
      }

      // Find inventory asset account (1301) or create if not exists
      let inventoryAccount = accounts.find(acc => acc.code === '1301')
      if (!inventoryAccount) {
        inventoryAccount = {
          id: Date.now().toString(),
          code: '1301',
          name: 'المخزون',
          nameEn: 'Inventory',
          type: 'asset',
          balance: 0
        }
        accounts.push(inventoryAccount)
        localStorage.setItem('accounts', JSON.stringify(accounts))
      }

      const purchaseAmount = parseFloat(item.purchasePrice) * parseFloat(item.quantity)
      const description = `شراء ${item.name} (${item.quantity} ${item.unit})`

      // Create journal entry for purchase
      const purchaseEntry = {
        date: new Date().toISOString(),
        description,
        lines: [
          {
            accountId: inventoryAccount.id,
            accountName: inventoryAccount.name,
            debit: purchaseAmount,
            credit: 0,
            description
          },
          {
            accountId: paymentAccount.id,
            accountName: paymentAccount.name,
            debit: 0,
            credit: purchaseAmount,
            description
          }
        ]
      }

      // Save journal entry
      const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]')
      const newEntry = {
        id: Date.now().toString(),
        ...purchaseEntry
      }
      journalEntries.push(newEntry)
      localStorage.setItem('journalEntries', JSON.stringify(journalEntries))
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'))
      
      console.log('✅ Purchase payment recorded successfully')
    } catch (error) {
      console.error('Error recording purchase payment:', error)
    }
  }



  const openModal = (item = null) => {
    // Check if editing and PIN is required
    if (item) {
      const savedPin = localStorage.getItem('app_editInvoicePin')
      const pinSettings = JSON.parse(localStorage.getItem('app_pinProtectionSettings') || '{"inventory": true}')
      
      if (savedPin && pinSettings.inventory) {
        // PIN is set and protection is enabled, show PIN modal first
        setPendingEditItem(item)
        setShowPinModal(true)
        setPinInput('')
        setPinError('')
        return
      }
    }
    
    // No PIN required or creating new item
    proceedToEdit(item)
  }

  const proceedToEdit = (item = null) => {
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
        
        // Additional properties
        manufacturer: item.manufacturer || '',
        batchNumber: item.batchNumber || '',
        description: item.description || '',
        properties: item.properties || {}
      })
  // populate inputs from numeric values (as strings) or leave blank
  setPriceInput(item.price != null ? String(item.price) : (item.unitPrice != null ? String(item.unitPrice) : ''))
  setPurchasePriceInput(item.purchasePrice != null ? String(item.purchasePrice) : '')
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
        
        // Additional properties
        manufacturer: '',
        batchNumber: '',
        description: '',
        properties: {}
      })
  setPriceInput('')
  setPurchasePriceInput('')
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
      proceedToEdit(pendingEditItem)
      setPendingEditItem(null)
    } else {
      // PIN incorrect
      setPinError(language === 'ar' ? 'الرقم السري غير صحيح' : 'Incorrect PIN')
    }
  }

  const closePinModal = () => {
    setShowPinModal(false)
    setPinInput('')
    setPinError('')
    setPendingEditItem(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
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
      
      // Additional properties
      manufacturer: '',
      batchNumber: '',
      description: '',
      properties: {},
      
      // Payment options
      recordPayment: false,
      paymentAccountId: ''
    })
    // reset textual inputs to empty so fields show blank
    setPriceInput('')
    setPurchasePriceInput('')
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

  const handleSubmit = (e) => {
    e.preventDefault()
    // parse prices from inputs
    const parsedPrice = parseFloat(priceInput)
    const parsedPurchase = parseFloat(purchasePriceInput)

    if (!formData.name || !formData.sku || formData.quantity < 0 || isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedPurchase) || parsedPurchase < 0) {
      showNotification(t('fillRequiredFields'), 'error')
      return
    }

    // Validate payment account if payment is being recorded
    if (!editingItem && formData.recordPayment && !formData.paymentAccountId) {
      showNotification('يجب اختيار حساب الدفع', 'error')
      return
    }

    // Handle custom category
  const finalFormData = { ...formData, price: parsedPrice, purchasePrice: parsedPurchase }
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
        
        // Record purchase payment if requested
        if (result.success && formData.recordPayment && formData.paymentAccountId) {
          recordInventoryPurchasePayment(result.data)
        }
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
          {hasPermission('create_inventory_items') && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              {t('addProduct')}
            </button>
          )}
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
              {existingCategories.map(category => (
                <option key={category} value={category}>📦 {category}</option>
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
                    </div>
                  </td>
                  <td>
                    <div className="category-display">
                      <span className="category-badge-old">{item.category || 'غير محدد'}</span>
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
                  <td className="selling-price">{(item.price || item.unitPrice || 0).toFixed(3)} {t('kwd')}</td>
                  <td className="total-value">{(item.quantity * (item.price || item.unitPrice || 0)).toFixed(3)} {t('kwd')}</td>
                  <td>
                    {hasPermission('edit_inventory_items') && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(item)}
                      >
                        {t('edit')}
                      </button>
                    )}
                    {hasPermission('delete_inventory_items') && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item)}
                      >
                        {t('delete')}
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
                      {getRecentCategories().length > 0 && (
                        <optgroup label={language === 'ar' ? 'التصنيفات المستخدمة مؤخراً' : 'Recently Used Categories'}>
                          {getRecentCategories().map(category => (
                            <option key={category} value={category}>
                              📦 {category}
                            </option>
                          ))}
                        </optgroup>
                      )}
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
                      {Object.entries(UNIT_DETAILS).map(([key, details]) => (
                        <option key={key} value={key}>
                          {details.nameAr} ({details.symbol})
                        </option>
                      ))}
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
                      value={purchasePriceInput}
                      onChange={(e) => {
                        setPurchasePriceInput(e.target.value)
                        const v = parseFloat(e.target.value)
                        setFormData(prev => ({ ...prev, purchasePrice: isNaN(v) ? prev.purchasePrice : v }))
                      }}
                      required
                      placeholder=""
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('unitPrice')} *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={priceInput}
                      onChange={(e) => {
                        setPriceInput(e.target.value)
                        const v = parseFloat(e.target.value)
                        setFormData(prev => ({ ...prev, price: isNaN(v) ? prev.price : v }))
                      }}
                      required
                      placeholder=""
                    />
                  </div>
                </div>

                {/* حقول إضافية للمنتجات */}
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
                  <div className="form-group">
                    <label>{t('expiryDate')}</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                </div>

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

                <div className="profit-indicator">
                  <span className="profit-label">{t('expectedProfit')}: </span>
                  {(() => {
                    const p = parseFloat(priceInput)
                    const pp = parseFloat(purchasePriceInput)
                    if (isNaN(p) || isNaN(pp)) {
                      return <span className="profit-value">—</span>
                    }
                    const profit = p - pp
                    const pct = pp === 0 ? NaN : ((profit / pp) * 100)
                    return (
                      <>
                        <span className={`profit-value ${(profit >= 0) ? 'positive' : 'negative'}`}>
                          {profit.toFixed(3)} {t('kwd')}
                        </span>
                        {isFinite(pct) && (
                          <span className="profit-percentage">({pct.toFixed(1)}%)</span>
                        )}
                      </>
                    )
                  })()}
                </div>

                <div className="form-group">
                  <label>{t('description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                  />
                </div>

                {/* Purchase Payment Options (only for new items) - Enhanced Visibility */}
                {!editingItem && (
                  <div className="purchase-payment-section" style={{
                    marginTop: '25px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '12px',
                    border: '3px solid #e91e63',
                    boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '15px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      ⚠️ مهم: خيارات دفع الشراء ⚠️
                    </div>

                    <div style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px'
                    }}>
                      <div className="form-group">
                        <label className="checkbox-label" style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '15px'
                        }}>
                          <input
                            type="checkbox"
                            checked={formData.recordPayment}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              recordPayment: e.target.checked,
                              paymentAccountId: e.target.checked ? prev.paymentAccountId : ''
                            }))}
                            style={{ width: '20px', height: '20px' }}
                          />
                          <span style={{ color: '#e91e63', fontWeight: 'bold' }}>
                            💰 {t('recordPurchasePayment')}
                          </span>
                        </label>
                        <small style={{ 
                          display: 'block', 
                          marginTop: '5px',
                          marginLeft: '30px',
                          color: '#e74c3c',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}>
                          ⚠️ فعّل هذا الخيار لخصم المبلغ من البنك/الخزينة فوراً!
                        </small>
                        <small style={{ 
                          display: 'block', 
                          marginTop: '5px',
                          marginLeft: '30px',
                          color: '#6c757d',
                          fontSize: '0.85em'
                        }}>
                          {t('purchasePaymentDescription')}
                        </small>
                      </div>
                    </div>

                    {formData.recordPayment && (
                      <>
                        <div style={{
                          background: '#fff3e0',
                          padding: '15px',
                          borderRadius: '8px',
                          marginTop: '15px',
                          border: '2px solid #ff9800'
                        }}>
                          <div className="form-group">
                            <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                              {t('selectPaymentAccount')} *
                            </label>
                            <select
                              value={formData.paymentAccountId}
                              onChange={(e) => setFormData(prev => ({ ...prev, paymentAccountId: e.target.value }))}
                              required={formData.recordPayment}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #ff9800',
                                borderRadius: '6px',
                                fontSize: '15px',
                                backgroundColor: 'white',
                                fontWeight: 'bold'
                              }}
                            >
                              <option value="">-- {t('selectPaymentAccount')} --</option>
                              {(() => {
                                const accounts = JSON.parse(localStorage.getItem('accounts') || '[]')
                                const bankCashAccounts = accounts.filter(acc => 
                                  acc.type === 'bank' || acc.type === 'cash' || 
                                  acc.code?.startsWith('100')
                                )
                                return bankCashAccounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.code})
                                  </option>
                                ))
                              })()}
                            </select>
                          </div>
                        </div>

                        <div style={{
                          marginTop: '15px',
                          padding: '12px',
                          background: '#e3f2fd',
                          borderRadius: '6px',
                          border: '2px solid #2196f3'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 'bold'
                          }}>
                            <span>{t('totalPurchaseAmount')}:</span>
                            <span style={{ 
                              fontSize: '1.2em',
                              color: '#1976d2'
                            }}>
                              {(() => {
                                const pp = parseFloat(purchasePriceInput)
                                const qty = parseFloat(formData.quantity) || 0
                                if (isNaN(pp)) return '0.000'
                                return (pp * qty).toFixed(3)
                              })()} {t('kwd')}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
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

      {/* Unit Converter Modal */}
      <UnitConverter
        showModal={showUnitConverter}
        onClose={() => setShowUnitConverter(false)}
      />

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
                  ? 'يرجى إدخال الرقم السري للموافقة على تعديل المنتج' 
                  : 'Please enter PIN to authorize product editing'}
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

export default Inventory