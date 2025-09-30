import { useState, useEffect, useRef } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './Invoices.css'

const Invoices = () => {
  const { 
    invoices,
    customers,
    suppliers,
    inventoryItems,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInventoryItems,
    updateInventoryItem
  } = useAccounting()
  const { t, language } = useLanguage()

  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [notification, setNotification] = useState(null)
  const [searchResults, setSearchResults] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Refs for dropdown management
  const dropdownRefs = useRef({})
  const inputRefs = useRef({})

  // Function to calculate dropdown position
  const getDropdownStyle = (index) => {
    if (!inputRefs.current[index]) return {}
    
    const inputRect = inputRefs.current[index].getBoundingClientRect()
    return {
      top: inputRect.bottom + 2,
      left: inputRect.left,
      width: Math.max(300, inputRect.width)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(searchResults).forEach(index => {
        if (dropdownRefs.current[index] && !dropdownRefs.current[index].contains(event.target)) {
          setSearchResults(prev => {
            const newResults = { ...prev }
            delete newResults[index]
            return newResults
          })
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchResults])
  
  const [formData, setFormData] = useState({
    type: 'sales', // sales or purchase
    clientId: '',
    clientName: '',
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
    dueDate: '',
    paymentStatus: 'paid', // paid, pending, overdue
    description: '',
    items: [
      { itemId: '', itemName: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }
    ],
    subtotal: 0,
    discount: 0,
    vatRate: 0, // VAT rate percentage
    vatAmount: 0,
    total: 0,
    createJournalEntry: true
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const resetForm = () => {
    setFormData({
      type: 'sales',
      clientId: '',
      clientName: '',
      date: new Date().toLocaleDateString('en-CA'),
      dueDate: '',
      paymentStatus: 'paid',
      description: '',
      items: [
        { itemId: '', itemName: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }
      ],
      subtotal: 0,
      discount: 0,
      vatRate: 0,
      vatAmount: 0,
      total: 0,
      createJournalEntry: true
    })
    setEditingInvoice(null)
  }

  const openModal = (invoice = null) => {
    if (invoice) {
      // Normalize items (ensure required fields exist)
      const normalizedItems = (invoice.items || []).map(it => ({
        itemId: it.itemId || it.id || '',
        itemName: it.itemName || it.name || '',
        quantity: parseFloat(it.quantity) || 0,
        unitPrice: parseFloat(it.unitPrice ?? it.price ?? 0) || 0,
        discount: parseFloat(it.discount) || 0,
        total: parseFloat(it.total) || 0
      }))

      const populated = {
        type: invoice.type,
        clientId: invoice.clientId,
        clientName: invoice.clientName || '',
        date: invoice.date,
        dueDate: invoice.dueDate || '',
        description: invoice.description || '',
        paymentStatus: invoice.paymentStatus || 'paid',
        items: normalizedItems.length ? normalizedItems : [{ itemId: '', itemName: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }],
        subtotal: parseFloat(invoice.subtotal) || 0,
        discount: parseFloat(invoice.discount) || 0,
        vatRate: parseFloat(invoice.vatRate) || 0,
        vatAmount: parseFloat(invoice.vatAmount) || 0,
        total: parseFloat(invoice.total) || 0,
        createJournalEntry: false
      }
      // Recalculate to ensure consistency
      setFormData(prev => calculateTotals(populated))
      setEditingInvoice(invoice)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
    // Clear search results when closing modal
    setSearchResults({})
  }

  // Force data refresh to ensure all components reflect latest changes
  const refreshAllData = () => {
    // Force React to re-read from localStorage by triggering a minimal state update
    // This is a workaround to ensure data consistency across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('accountingDataUpdated'))
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', itemName: '', quantity: 1, unitPrice: 0, total: 0 }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
      
      // Clear search results for removed item
      const newSearchResults = { ...searchResults }
      delete newSearchResults[index]
      setSearchResults(newSearchResults)
    }
  }

  // Handle product search with enhanced filtering
  const handleProductSearch = (itemIndex, searchTerm) => {
    // Update the item name in formData
    const newItems = [...formData.items]
    newItems[itemIndex] = { ...newItems[itemIndex], itemName: searchTerm }
    setFormData(prev => ({ ...prev, items: newItems }))

    // Perform search if searchTerm has at least 1 character
    if (searchTerm.trim().length > 0) {
      const searchLower = searchTerm.toLowerCase()
      const filtered = inventoryItems?.filter(product => {
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        // Sort by relevance: exact matches first, then name matches, then SKU matches
        const aName = a.name?.toLowerCase() || ''
        const bName = b.name?.toLowerCase() || ''
        const aSku = a.sku?.toLowerCase() || ''
        const bSku = b.sku?.toLowerCase() || ''
        
        const aExactName = aName === searchLower
        const bExactName = bName === searchLower
        const aStartsName = aName.startsWith(searchLower)
        const bStartsName = bName.startsWith(searchLower)
        const aExactSku = aSku === searchLower
        const bExactSku = bSku === searchLower
        
        if (aExactName && !bExactName) return -1
        if (!aExactName && bExactName) return 1
        if (aExactSku && !bExactSku) return -1
        if (!aExactSku && bExactSku) return 1
        if (aStartsName && !bStartsName) return -1
        if (!aStartsName && bStartsName) return 1
        
        return aName.localeCompare(bName)
      }) || []
      
      console.log('Search term:', searchTerm, 'Results:', filtered.length) // Debug log
      
      setSearchResults(prev => ({
        ...prev,
        [itemIndex]: filtered.slice(0, 8) // Show up to 8 results
      }))
    } else {
      // Clear search results if search term is empty
      const newSearchResults = { ...searchResults }
      delete newSearchResults[itemIndex]
      setSearchResults(newSearchResults)
    }
  }

  // Handle product selection from dropdown
  const selectProduct = (itemIndex, product) => {
    const newItems = [...formData.items]
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      itemId: product.id,
      itemName: product.name,
      unitPrice: product.price || product.unitPrice || 0
    }
    
    setFormData(prev => calculateTotals({ ...prev, items: newItems }))
    
    // Clear search results after selection
    const newSearchResults = { ...searchResults }
    delete newSearchResults[itemIndex]
    setSearchResults(newSearchResults)
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map((item, i) => {
        if (i === index) {
          let updatedItem = { ...item, [field]: value }
          
          // If itemId is selected, auto-fill the price from inventory
          if (field === 'itemId' && value) {
            const selectedInventoryItem = inventoryItems?.find(invItem => invItem.id === value)
            if (selectedInventoryItem) {
              updatedItem.itemName = selectedInventoryItem.name
              updatedItem.unitPrice = selectedInventoryItem.price || 0
            }
          }
          
          // Recalculate total for this item
          const quantity = parseFloat(updatedItem.quantity) || 0
          const unitPrice = parseFloat(updatedItem.unitPrice) || 0
          const discount = parseFloat(updatedItem.discount) || 0
          const lineTotal = quantity * unitPrice
          const discountAmount = (lineTotal * discount) / 100
          updatedItem.total = lineTotal - discountAmount
          
          return updatedItem
        }
        return item
      })
      
      return calculateTotals({ ...prev, items: newItems })
    })
  }

  const calculateTotals = (data) => {
    const subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    const totalDiscount = parseFloat(data.discount) || 0
    const discountAmount = (subtotal * totalDiscount) / 100
    const subtotalAfterDiscount = subtotal - discountAmount
    const vatAmount = (subtotalAfterDiscount * (parseFloat(data.vatRate) || 0)) / 100
    const total = subtotalAfterDiscount + vatAmount
    
    return {
      ...data,
      subtotal,
      vatAmount,
      total
    }
  }

  const updateInvoiceField = (field, value) => {
    setFormData(prev => calculateTotals({ ...prev, [field]: value }))
  }

  const handleClientChange = (clientId) => {
    const clientsList = formData.type === 'sales' ? customers : suppliers
    const selectedClient = clientsList.find(client => client.id === clientId)
    
    setFormData(prev => ({
      ...prev,
      clientId,
      clientName: selectedClient ? selectedClient.name : ''
    }))
  }

  // Function to update inventory when selling products
  const updateInventoryForSale = (items) => {
    items.forEach(item => {
      const inventoryItems = getInventoryItems() // Get fresh data each time
      const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
      if (inventoryItem) {
        const currentQty = parseFloat(inventoryItem.quantity) || 0
        const delta = parseFloat(item.quantity) || 0
        const newQuantity = Math.max(0, currentQty - delta)
        updateInventoryItem(inventoryItem.id, {
          ...inventoryItem,
          quantity: newQuantity
        })
      }
    })
  }

  // Function to update inventory when purchasing products (increase stock)
  const updateInventoryForPurchase = (items) => {
    items.forEach(item => {
      const inventoryItems = getInventoryItems() // Get fresh data each time
      const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
      if (inventoryItem) {
        const currentQty = parseFloat(inventoryItem.quantity) || 0
        const addQty = parseFloat(item.quantity) || 0
        const newQuantity = currentQty + addQty
        updateInventoryItem(inventoryItem.id, {
          ...inventoryItem,
          quantity: newQuantity
        })
      }
    })
  }

  // Updated inventory reconciliation - deduct products in all payment statuses
  const reconcileInventoryOnEdit = (oldInvoice, newItems, newPaymentStatus) => {
    if (!oldInvoice) return
    
    // Get fresh inventory data
    let currentInventory = getInventoryItems()

    // Create maps for old and new quantities
    const oldMap = {}
    oldInvoice.items.forEach(item => {
      oldMap[item.itemName] = (oldMap[item.itemName] || 0) + (parseFloat(item.quantity) || 0)
    })

    const newMap = {}
    newItems.forEach(item => {
      newMap[item.itemName] = (newMap[item.itemName] || 0) + (parseFloat(item.quantity) || 0)
    })

    // First, undo the old invoice effects completely
    oldInvoice.items.forEach(oldItem => {
      const inv = currentInventory.find(i => i.name === oldItem.itemName)
      if (!inv) return
      const invQty = parseFloat(inv.quantity) || 0
      const oldQty = parseFloat(oldItem.quantity) || 0
      
      if (oldInvoice.type === 'sales') {
        // Return stock back (undo previous sale deduction)
        const newQty = invQty + oldQty
        const result = updateInventoryItem(inv.id, { ...inv, quantity: newQty })
        if (result.success) {
          inv.quantity = newQty
        }
      } else if (oldInvoice.type === 'purchase') {
        // Remove previously added stock (undo previous purchase addition)
        const adjusted = Math.max(0, invQty - oldQty)
        const result = updateInventoryItem(inv.id, { ...inv, quantity: adjusted })
        if (result.success) {
          inv.quantity = adjusted
        }
      }
    })

    // Refresh inventory after undoing old effects
    currentInventory = getInventoryItems()

    // Now apply the new invoice effects regardless of payment status
    // This means products are always deducted/added regardless of paid/pending/overdue status
    newItems.forEach(newItem => {
      const inv = currentInventory.find(i => i.name === newItem.itemName)
      if (!inv) return
      const invQty = parseFloat(inv.quantity) || 0
      const newQty = parseFloat(newItem.quantity) || 0
      
      if (oldInvoice.type === 'sales') {
        // Deduct from inventory for sales (regardless of payment status)
        const updatedQty = Math.max(0, invQty - newQty)
        updateInventoryItem(inv.id, { ...inv, quantity: updatedQty })
      } else if (oldInvoice.type === 'purchase') {
        // Add to inventory for purchases (regardless of payment status)  
        const updatedQty = invQty + newQty
        updateInventoryItem(inv.id, { ...inv, quantity: updatedQty })
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.clientId) {
      showNotification('يرجى اختيار العميل/المورد', 'error')
      return
    }

    if (!formData.description) {
      showNotification('يرجى إدخال وصف الفاتورة', 'error')
      return
    }

    // Filter valid items
    const validItems = formData.items.filter(item => 
      item.itemName && item.quantity > 0 && item.unitPrice > 0
    )

    if (validItems.length === 0) {
      showNotification('يجب إضافة عنصر واحد على الأقل', 'error')
      return
    }

    // Check inventory for sales invoices
    if (formData.type === 'sales') {
      const inventoryItems = getInventoryItems()
      for (const item of validItems) {
        const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
        if (inventoryItem && inventoryItem.quantity < item.quantity) {
          showNotification(`الكمية المطلوبة من ${item.itemName} غير متوفرة في المخزون (المتوفر: ${inventoryItem.quantity})`, 'error')
          return
        }
      }
    }

    const invoiceData = {
      ...formData,
      items: validItems
    }

    try {
      let result
      if (editingInvoice) {
        // Reconcile inventory according to old invoice before saving new one
        reconcileInventoryOnEdit(editingInvoice, validItems, formData.paymentStatus)
        
        result = updateInvoice(editingInvoice.id, invoiceData)
        
        if (result.success) {
          // Force refresh of inventory data after update to ensure UI consistency
          setTimeout(() => {
            // This ensures the UI reflects the latest inventory changes
            const freshInventory = getInventoryItems()
          }, 100)
        }
      } else {
        result = addInvoice(invoiceData)
        // Updated inventory logic: affect inventory in all payment statuses
        if (result.success) {
          // Apply inventory changes regardless of payment status
          if (formData.type === 'sales') {
            updateInventoryForSale(validItems)
          } else if (formData.type === 'purchase') {
            updateInventoryForPurchase(validItems)
          }
        }
      }

      if (result.success) {
        showNotification(
          editingInvoice ? 'تم تحديث الفاتورة بنجاح' : 'تم إنشاء الفاتورة بنجاح'
        )
        refreshAllData() // Force refresh of all related data
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification('حدث خطأ غير متوقع', 'error')
    }
  }

  // Function to reverse inventory effects when deleting an invoice
  const reverseInventoryEffectsOnDelete = (deletedInvoice) => {
    if (!deletedInvoice || !deletedInvoice.items) return

    deletedInvoice.items.forEach(item => {
      const inventoryItems = getInventoryItems() // Get fresh data
      const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
      if (inventoryItem) {
        const currentQty = parseFloat(inventoryItem.quantity) || 0
        const itemQty = parseFloat(item.quantity) || 0
        let newQuantity = currentQty

        if (deletedInvoice.type === 'sales') {
          // For deleted sales invoice: add back the sold quantity to inventory
          newQuantity = currentQty + itemQty
        } else if (deletedInvoice.type === 'purchase') {
          // For deleted purchase invoice: subtract the purchased quantity from inventory
          newQuantity = Math.max(0, currentQty - itemQty)
        }

        updateInventoryItem(inventoryItem.id, {
          ...inventoryItem,
          quantity: newQuantity
        })
      }
    })
  }

  const handleDelete = async (invoice) => {
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة رقم "${invoice.invoiceNumber}"؟`)) {
      // First reverse the inventory effects before deleting
      reverseInventoryEffectsOnDelete(invoice)
      
      // Then delete the invoice
      const result = deleteInvoice(invoice.id)
      if (result.success) {
        showNotification('تم حذف الفاتورة بنجاح')
        // Force refresh of all data to update reports
        refreshAllData()
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  // Enhanced filter and search functionality
  const filteredAndSortedInvoices = () => {
    let filtered = invoices.filter(invoice => {
      // Tab filter
      const matchesTab = activeTab === 'all' || invoice.type === activeTab
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(invoice.total || 0).includes(searchTerm)
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || 
        (invoice.paymentStatus || 'paid') === filterStatus
      
      // Type filter
      const matchesType = filterType === 'all' || invoice.type === filterType
      
      return matchesTab && matchesSearch && matchesStatus && matchesType
    })

    // Sort the filtered invoices
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      // Handle date sorting
      if (sortBy === 'date' || sortBy === 'dueDate') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      // Handle numeric fields
      else if (sortBy === 'total') {
        aValue = parseFloat(aValue) || 0
        bValue = parseFloat(bValue) || 0
      }
      // Handle string fields
      else {
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

  const filteredInvoices = filteredAndSortedInvoices()

  return (
    <div className="invoices">
      <div className="page-header">
        <h1>إدارة الفواتير</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          إنشاء فاتورة جديدة
        </button>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="invoice-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          جميع الفواتير ({invoices.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          فواتير المبيعات ({invoices.filter(i => i.type === 'sales').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          فواتير المشتريات ({invoices.filter(i => i.type === 'purchase').length})
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="invoice-controls">
        <div className="search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('searchInvoices')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-controls">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('allTypes')}</option>
              <option value="sales">{t('salesInvoices')}</option>
              <option value="purchase">{t('purchaseInvoices')}</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="overdue">{t('overdue')}</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">{t('sortByDate')}</option>
              <option value="invoiceNumber">{t('sortByInvoiceNumber')}</option>
              <option value="clientName">{t('sortByClient')}</option>
              <option value="total">{t('sortByAmount')}</option>
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
        
        {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
          <div className="search-results">
            <span>{t('showingResults')}: {filteredInvoices.length} {t('of')} {invoices.length}</span>
            <button 
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterType('all')
              }}
              className="clear-search-btn"
            >
              {t('clearSearch')}
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        {filteredInvoices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>النوع</th>
                <th>العميل/المورد</th>
                <th>التاريخ</th>
                <th>المبلغ الإجمالي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>
                    <span className={`invoice-type ${invoice.type}`}>
                      {invoice.type === 'sales' ? 'مبيعات' : 'مشتريات'}
                    </span>
                  </td>
                  <td>{invoice.clientName}</td>
                  <td>{new Date(invoice.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                  <td>{parseFloat(invoice.total).toFixed(3)} {t('kwd')}</td>
                  <td>
                    <span className={`payment-status ${invoice.paymentStatus || 'paid'}`}>
                      {invoice.paymentStatus === 'paid' && 'مدفوعة'}
                      {invoice.paymentStatus === 'pending' && 'معلقة'}
                      {invoice.paymentStatus === 'overdue' && 'متأخرة'}
                      {!invoice.paymentStatus && 'مدفوعة'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal(invoice)}
                    >
                      عرض/تعديل
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(invoice)}
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
            {invoices.length === 0 ? (
              <p>لا توجد فواتير متاحة</p>
            ) : (
              <p>{t('noSearchResults')}</p>
            )}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content invoice-modal">
            <div className="modal-header">
              <h2>{editingInvoice ? `تعديل الفاتورة ${editingInvoice.invoiceNumber}` : 'إنشاء فاتورة جديدة'}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Invoice Header */}
              <div className="invoice-header">
                <div className="form-group">
                  <label>نوع الفاتورة *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, clientId: '', clientName: '' }))}
                    disabled={editingInvoice}
                  >
                    <option value="sales">فاتورة مبيعات</option>
                    <option value="purchase">فاتورة مشتريات</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{formData.type === 'sales' ? 'العميل *' : 'المورد *'}</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                  >
                    <option value="">اختر {formData.type === 'sales' ? 'العميل' : 'المورد'}</option>
                    {(formData.type === 'sales' ? customers : suppliers).map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>تاريخ الفاتورة *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>حالة الدفع *</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    required
                  >
                    <option value="paid">مدفوعة</option>
                    <option value="pending">معلقة</option>
                    <option value="overdue">متأخرة</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>وصف الفاتورة *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للفاتورة"
                  rows="2"
                  required
                />
              </div>

              {/* Invoice Items */}
              <div className="invoice-items">
                <div className="items-header">
                  <h3>عناصر الفاتورة</h3>
                  <button type="button" className="btn btn-secondary" onClick={addItem}>
                    إضافة عنصر
                  </button>
                </div>

                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>{t('products')}</th>
                        <th>{t('quantity')}</th>
                        <th>{t('unitPrice')}</th>
                        <th>{t('discount')} %</th>
                        <th>{t('total')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div 
                              className="product-select-container"
                              ref={el => dropdownRefs.current[index] = el}
                            >
                              <div className="product-search-wrapper">
                                <span className="product-search-icon">🔍</span>
                                <input
                                  ref={el => inputRefs.current[index] = el}
                                  type="text"
                                  value={item.itemName}
                                  onChange={(e) => handleProductSearch(index, e.target.value)}
                                  placeholder="ابحث عن المنتج..."
                                  className="product-search-input"
                                  required
                                />
                              </div>
                              {searchResults[index] && (
                                <div 
                                  className="product-dropdown"
                                  style={getDropdownStyle(index)}
                                >
                                  {searchResults[index].length > 0 ? (
                                    searchResults[index].map(product => (
                                      <div
                                        key={product.id}
                                        className="product-option"
                                        onClick={() => selectProduct(index, product)}
                                      >
                                        <div className="product-header">
                                          <span className="product-name">{product.name}</span>
                                          {product.category && (
                                            <span className="product-category">{product.category}</span>
                                          )}
                                        </div>
                                        <div className="product-details">
                                          <div className="product-info">
                                            <span className="product-sku">
                                              <strong>SKU:</strong> {product.sku}
                                            </span>
                                            {product.quantity !== undefined && (
                                              product.quantity > 0 ? (
                                                <span className="stock-available"> • متوفر: {product.quantity}</span>
                                              ) : (
                                                <span className="stock-out"> • غير متوفر</span>
                                              )
                                            )}
                                          </div>
                                          <span className="product-price">
                                            {(product.price || product.unitPrice || 0).toFixed(3)} {t('kwd')}
                                          </span>
                                        </div>
                                        {product.description && (
                                          <div className="product-description">
                                            {product.description}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="product-dropdown-empty">
                                      🔍 لا توجد منتجات مطابقة للبحث
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              min="1"
                              step="0.01"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="0.000"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <span className="item-total">{item.total.toFixed(3)} {t('kwd')}</span>
                          </td>
                          <td>
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeItem(index)}
                              >
                                {t('delete')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invoice Totals */}
                <div className="invoice-totals">
                  <div className="totals-section">
                    <div className="total-line">
                      <label>{t('subtotal')}:</label>
                      <span>{formData.subtotal.toFixed(3)} {t('kwd')}</span>
                    </div>
                    
                    <div className="total-line discount-line">
                      <label>{t('discount')} %:</label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => updateInvoiceField('discount', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="total-line vat-line">
                      <label>{t('vatRate')} %:</label>
                      <input
                        type="number"
                        value={formData.vatRate}
                        onChange={(e) => updateInvoiceField('vatRate', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="total-line">
                      <label>{t('vatAmount')}:</label>
                      <span>{formData.vatAmount.toFixed(3)} {t('kwd')}</span>
                    </div>
                    
                    <div className="total-line final-total">
                      <label>{t('grandTotal')}:</label>
                      <span>{formData.total.toFixed(3)} {t('kwd')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {!editingInvoice && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.createJournalEntry}
                      onChange={(e) => setFormData(prev => ({ ...prev, createJournalEntry: e.target.checked }))}
                    />
                    إنشاء قيد محاسبي تلقائي
                  </label>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingInvoice ? 'حفظ التغييرات' : 'إنشاء الفاتورة'}
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

export default Invoices