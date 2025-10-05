import { useState, useEffect, useRef } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useBrand } from '../contexts/BrandContext'
import { updateInvoicesStatus, getInvoiceNotifications, getDaysInfo } from '../utils/invoiceUtils'
import InvoiceNotifications from './InvoiceNotifications'
import PermissionDenied from './PermissionDenied'
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
  const { t, language, notificationsEnabled } = useLanguage()
  const { hasPermission } = useAuth()
  const { brandSettings } = useBrand()

  // Check if user has permission to view invoices
  if (!hasPermission('view_invoices')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض الفواتير"
        description="تحتاج إلى صلاحية 'عرض الفواتير' للوصول إلى هذه الصفحة"
      />
    )
  }

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
      { 
        itemId: '', 
        itemName: '', 
        quantity: 1, 
        unitPrice: 0, 
        total: 0,
        discount: 0,
        discountAmount: 0,
        discountType: 'amount',
        discountRate: 0,
        // حقول اللون الجديدة
        color: '',
        colorCode: '',
        colorPrice: 0,
        requiresColor: false,
        productType: '',
        // حقول اللون المخصص
        customColorName: '',
        customColorCode: ''
      }
    ],
    subtotal: 0,
    discount: 0, // discount amount (not percentage)
    discountAmount: 0, // Always contains the actual discount amount
    discountType: 'amount', // 'amount' or 'percentage'
    discountRate: 0, // calculated discount percentage
    vatRate: 0, // VAT amount (not percentage)
    vatType: 'amount', // 'amount' or 'percentage'
    vatPercentage: 0, // calculated VAT percentage
    vatAmount: 0,
    total: 0,
    createJournalEntry: true
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Auto-update invoice statuses based on due dates
  useEffect(() => {
    if (invoices.length > 0) {
      const updatedInvoices = updateInvoicesStatus(invoices)
      
      // Check if any invoices were updated
      const hasUpdates = updatedInvoices.some((invoice, index) => 
        invoice.paymentStatus !== invoices[index].paymentStatus
      )
      
      if (hasUpdates) {
        // Update invoices in bulk
        updatedInvoices.forEach((invoice, index) => {
          if (invoice.paymentStatus !== invoices[index].paymentStatus) {
            updateInvoice(invoice.id, { paymentStatus: invoice.paymentStatus })
          }
        })
        
        // Show notification about auto updates
        const updatedCount = updatedInvoices.filter((invoice, index) => 
          invoice.paymentStatus !== invoices[index].paymentStatus
        ).length
        
        if (updatedCount > 0) {
          showNotification(
            `${t('autoStatusUpdate')}: ${updatedCount} ${t('invoiceStatusUpdated')}`, 
            'info'
          )
        }
      }
    }
  }, [invoices.length]) // Only run when invoices array length changes to avoid infinite loops

  // Helper functions to check for discount and VAT
  const hasDiscount = (invoice) => {
    const invoiceDiscount = parseFloat(invoice.discountAmount || invoice.discount) || 0
    return invoiceDiscount > 0
  }

  const hasVAT = (invoice) => {
    return parseFloat(invoice.vatAmount) > 0
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
        { 
          itemId: '', 
          itemName: '', 
          quantity: 1, 
          unitPrice: 0, 
          total: 0,
          discount: 0,
          discountAmount: 0,
          discountType: 'amount',
          discountRate: 0,
          // حقول اللون الجديدة
          color: '',
          colorCode: '',
          colorPrice: 0,
          requiresColor: false,
          productType: '',
          // حقول اللون المخصص
          customColorName: '',
          customColorCode: ''
        }
      ],
      subtotal: 0,
      discount: 0,
      discountAmount: 0,
      discountType: 'amount',
      discountRate: 0,
      vatRate: 0,
      vatType: 'amount',
      vatPercentage: 0,
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
        total: parseFloat(it.total) || 0,
        discount: parseFloat(it.discount) || 0,
        discountAmount: parseFloat(it.discountAmount) || 0,
        discountType: it.discountType || 'amount',
        discountRate: parseFloat(it.discountRate) || 0,
        // حقول اللون
        color: it.color || '',
        colorCode: it.colorCode || '',
        colorPrice: parseFloat(it.colorPrice) || 0,
        requiresColor: it.requiresColor || false,
        productType: it.productType || '',
        // حقول اللون المخصص
        customColorName: it.customColorName || '',
        customColorCode: it.customColorCode || ''
      }))

      const populated = {
        type: invoice.type,
        clientId: invoice.clientId,
        clientName: invoice.clientName || '',
        date: invoice.date,
        dueDate: invoice.dueDate || '',
        description: invoice.description || '',
        paymentStatus: invoice.paymentStatus || 'paid',
        items: normalizedItems.length ? normalizedItems : [{ 
          itemId: '', 
          itemName: '', 
          quantity: 1, 
          unitPrice: 0, 
          total: 0,
          discount: 0,
          discountAmount: 0,
          discountType: 'amount',
          discountRate: 0,
          // حقول اللون الجديدة
          color: '',
          colorCode: '',
          colorPrice: 0,
          requiresColor: false,
          productType: '',
          // حقول اللون المخصص
          customColorName: '',
          customColorCode: ''
        }],
        subtotal: parseFloat(invoice.subtotal) || 0,
        discount: parseFloat(invoice.discount) || 0,
        discountAmount: parseFloat(invoice.discountAmount) || 0,
        discountType: invoice.discountType || 'amount',
        discountRate: parseFloat(invoice.discountRate) || 0,
        vatRate: parseFloat(invoice.vatRate) || 0,
        vatType: invoice.vatType || 'amount',
        vatPercentage: parseFloat(invoice.vatPercentage) || 0,
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
    setFormData(prev => calculateTotals({
      ...prev,
      items: [...prev.items, { 
        itemId: '', 
        itemName: '', 
        quantity: 1, 
        unitPrice: 0, 
        total: 0,
        discount: 0,
        discountAmount: 0,
        discountType: 'amount',
        discountRate: 0,
        // إضافة حقول جديدة للون والسعر الإضافي
        color: '',
        colorCode: '',
        colorPrice: 0,
        requiresColor: false,
        productType: '',
        // حقول اللون المخصص
        customColorName: '',
        customColorCode: ''
      }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => calculateTotals({
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
    const unitPrice = product.price || product.unitPrice || 0
    const quantity = parseFloat(newItems[itemIndex].quantity) || 1
    const discount = parseFloat(newItems[itemIndex].discount) || 0
    
    // التحقق من نوع المنتج والحاجة للون
    const requiresColor = ['interior_paint', 'exterior_paint', 'primer', 'varnish'].includes(product.category || product.productType)
    
    // Calculate total for this item
    const lineTotal = quantity * unitPrice
    const discountAmount = (lineTotal * discount) / 100
    const total = lineTotal - discountAmount
    
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      itemId: product.id,
      itemName: product.name,
      unitPrice: unitPrice,
      total: total,
      // إضافة خصائص اللون
      requiresColor: requiresColor,
      productType: product.category || product.productType || '',
      color: '',
      colorCode: '',
      colorPrice: 0,
      // مسح الألوان المخصصة عند تغيير المنتج
      customColorName: '',
      customColorCode: ''
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

          // إذا تم تحديث اللون، حساب السعر الإضافي
          if (field === 'color' || field === 'colorCode') {
            const colors = JSON.parse(localStorage.getItem('paintColors') || '[]')
            const selectedColor = colors.find(color => 
              color.name === value || color.code === value
            )
            if (selectedColor && selectedColor.additionalCost) {
              updatedItem.colorPrice = parseFloat(selectedColor.additionalCost) || 0
            } else if (value !== 'custom') {
              updatedItem.colorPrice = 0
            }
            // إذا كان اللون مخصص، لا نغير السعر الإضافي إلا إذا تم تحديده يدوياً
          }

          // إذا تم تحديث السعر الإضافي مباشرة (للألوان المخصصة)
          if (field === 'colorPrice') {
            updatedItem.colorPrice = parseFloat(value) || 0
          }
          
          // Calculate total for this item with discount and color price
          const quantity = parseFloat(updatedItem.quantity) || 0
          const baseUnitPrice = parseFloat(updatedItem.unitPrice) || 0
          const colorPrice = parseFloat(updatedItem.colorPrice) || 0
          const effectiveUnitPrice = baseUnitPrice + colorPrice // السعر النهائي مع إضافة اللون
          const discount = parseFloat(updatedItem.discount) || 0
          const discountType = updatedItem.discountType || 'amount'
          
          let subtotalBeforeDiscount = quantity * effectiveUnitPrice
          let discountAmount = 0
          
          if (discountType === 'percentage') {
            discountAmount = (subtotalBeforeDiscount * discount) / 100
          } else {
            discountAmount = discount
          }
          
          // Calculate discountAmount and discountRate for this item
          updatedItem.discountAmount = discountAmount
          updatedItem.discountRate = subtotalBeforeDiscount > 0 ? (discountAmount / subtotalBeforeDiscount) * 100 : 0
          
          // Final total after discount
          updatedItem.total = Math.max(0, subtotalBeforeDiscount - discountAmount)
          
          return updatedItem
        }
        return item
      })
      
      return calculateTotals({ ...prev, items: newItems })
    })
  }

  const calculateTotals = (data) => {
    const subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    
    // Calculate discount
    let discountAmount = 0
    let discountRate = 0
    
    if (data.discountType === 'percentage') {
      discountRate = parseFloat(data.discount) || 0
      discountAmount = (subtotal * discountRate) / 100
    } else {
      discountAmount = parseFloat(data.discount) || 0
      discountRate = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0
    }
    
    const subtotalAfterDiscount = subtotal - discountAmount
    
    // Calculate VAT
    let vatAmount = 0
    let vatPercentage = 0
    
    if (data.vatType === 'percentage') {
      vatPercentage = parseFloat(data.vatRate) || 0
      vatAmount = (subtotalAfterDiscount * vatPercentage) / 100
    } else {
      vatAmount = parseFloat(data.vatRate) || 0
      vatPercentage = subtotalAfterDiscount > 0 ? (vatAmount / subtotalAfterDiscount) * 100 : 0
    }
    
    const total = subtotalAfterDiscount + vatAmount
    
    return {
      ...data,
      subtotal,
      discount: data.discountType === 'percentage' ? discountRate : discountAmount,
      discountAmount, // Always save the actual discount amount
      discountRate,
      vatRate: data.vatType === 'percentage' ? vatPercentage : vatAmount,
      vatAmount, // Always save the actual VAT amount
      vatPercentage,
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
        
        // Calculate new cost price (no discount on items now)
        const newCostPrice = parseFloat(item.unitPrice) || 0
        
        // Calculate weighted average price if there's existing inventory
        let finalPrice = newCostPrice
        if (currentQty > 0) {
          const currentPrice = parseFloat(inventoryItem.price || inventoryItem.unitPrice) || 0
          const currentValue = currentQty * currentPrice
          const newValue = addQty * newCostPrice
          const totalValue = currentValue + newValue
          const totalQuantity = currentQty + addQty
          finalPrice = totalQuantity > 0 ? totalValue / totalQuantity : newCostPrice
        }
        
        updateInventoryItem(inventoryItem.id, {
          ...inventoryItem,
          quantity: newQuantity,
          price: finalPrice,
          unitPrice: finalPrice, // Ensure both fields are updated
          lastPurchasePrice: newCostPrice,
          lastUpdated: new Date().toISOString()
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
        
        // Calculate new cost price (no discount on items now)
        const newCostPrice = parseFloat(newItem.unitPrice) || 0
        
        // Calculate weighted average price if there's existing inventory
        let finalPrice = newCostPrice
        if (invQty > 0) {
          const currentPrice = parseFloat(inv.price || inv.unitPrice) || 0
          const currentValue = invQty * currentPrice
          const newValue = newQty * newCostPrice
          const totalValue = currentValue + newValue
          const totalQuantity = invQty + newQty
          finalPrice = totalQuantity > 0 ? totalValue / totalQuantity : newCostPrice
        }
        
        updateInventoryItem(inv.id, { 
          ...inv, 
          quantity: updatedQty,
          price: finalPrice,
          unitPrice: finalPrice,
          lastPurchasePrice: newCostPrice,
          lastUpdated: new Date().toISOString()
        })
      }
    })
  }

  // Function to display simple invoice number
  const getDisplayInvoiceNumber = (invoice) => {
    if (invoice.number && invoice.number !== invoice.id && !invoice.number.startsWith('INV-')) {
      return invoice.number
    }
    
    // If no custom number, show temporary ID until printed
    return `#${invoice.id.slice(-6)}` // Show last 6 characters of ID
  }

  // Function to format invoice number with explanation
  const formatInvoiceNumberWithHint = (invoiceNumber) => {
    if (invoiceNumber.includes('-') && invoiceNumber.match(/^\d+-\d{4}$/)) {
      const [num, dateCode] = invoiceNumber.split('-')
      const month = dateCode.substring(0, 2)
      const day = dateCode.substring(2, 4)
      return `${invoiceNumber} (${num} - ${month}/${day})`
    }
    return invoiceNumber
  }

  // Enhanced Print invoice function with full customization
  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    // Get client name with better fallback
    const client = invoice.type === 'sales' 
      ? customers.find(c => c.id === invoice.clientId)
      : suppliers.find(s => s.id === invoice.clientId)
    const clientName = client?.name || invoice.clientName || (invoice.type === 'sales' ? 'عميل غير محدد' : 'مورد غير محدد')

    // Generate simple daily invoice number
    const generateInvoiceNumber = () => {
      if (invoice.number && invoice.number !== invoice.id && !invoice.number.startsWith('INV-')) {
        return invoice.number
      }
      
      const now = new Date()
      const month = now.getMonth() + 1 // الشهر (1-12)
      const day = now.getDate() // اليوم (1-31)
      
      // Format: MMDD (مثل 0510 للـ 5/10)
      const dateCode = `${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
      
      // Get today's date in YYYYMMDD format for comparison
      const today = `${now.getFullYear()}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
      
      // Get all invoices from localStorage to count today's invoices
      const allInvoices = JSON.parse(localStorage.getItem('app_invoices') || '[]')
      
      // Count how many invoices were created today
      const todayInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.date)
        const invDateStr = `${invDate.getFullYear()}${(invDate.getMonth() + 1).toString().padStart(2, '0')}${invDate.getDate().toString().padStart(2, '0')}`
        return invDateStr === today
      })
      
      // Daily invoice number (starts from 1)
      const dailyNumber = todayInvoices.length + 1
      
      // Simple format: N-MMDD (مثل: 1-0510)
      return `${dailyNumber}-${dateCode}`
    }
    
    const invoiceNumber = generateInvoiceNumber()
    
    // Update invoice with new number if it doesn't have one
    if (!invoice.number || invoice.number === invoice.id || invoice.number.startsWith('INV-')) {
      const updatedInvoice = { ...invoice, number: invoiceNumber }
      const allInvoices = JSON.parse(localStorage.getItem('app_invoices') || '[]')
      const updatedInvoices = allInvoices.map(inv => 
        inv.id === invoice.id ? updatedInvoice : inv
      )
      localStorage.setItem('app_invoices', JSON.stringify(updatedInvoices))
    }

    // Calculate totals
    const subtotal = invoice.items?.reduce((sum, item) => sum + item.total, 0) || 0
    const discountAmount = invoice.discountAmount || 0
    const vatAmount = invoice.vatAmount || 0
    const total = subtotal - discountAmount + vatAmount

    // Get invoice settings
    const invoiceSettings = brandSettings?.invoiceSettings || {}
    
    // Logo size styles
    const logoSizes = {
      small: { width: '60px', height: '60px' },
      medium: { width: '80px', height: '80px' },
      large: { width: '100px', height: '100px' }
    }
    
    const logoStyle = logoSizes[invoiceSettings.logoSize] || logoSizes.medium

    const printContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t('printInvoice')} - ${invoice.number || invoice.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 10px;
            color: #333;
            direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            line-height: 1.4;
            background: white;
            font-size: 12px;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #666;
            overflow: hidden;
          }
          
          /* Compact Header Section */
          .invoice-header {
            border-bottom: 2px solid #666;
            padding: 15px 20px;
          }
          
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .company-logo {
            width: ${logoStyle.width === '100px' ? '60px' : logoStyle.width === '80px' ? '50px' : '40px'};
            height: ${logoStyle.height === '100px' ? '60px' : logoStyle.height === '80px' ? '50px' : '40px'};
            object-fit: contain;
            border: 1px solid #666;
          }
          
          .company-info h1 {
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 3px;
            color: #000;
          }
          
          .company-info .header-text {
            font-size: 0.8rem;
            color: #666;
          }
          
          .invoice-details {
            text-align: ${language === 'ar' ? 'left' : 'right'};
            border: 1px solid #666;
            padding: 8px;
            background: #f5f5f5;
          }
          
          .invoice-number {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 3px;
            color: #000;
          }
          
          .invoice-type {
            font-size: 0.8rem;
            color: #666;
          }
          
          /* Compact Invoice Info Section */
          .invoice-info {
            padding: 15px 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            border-bottom: 1px solid #ccc;
            background: #fafafa;
          }
          
          .info-section h3 {
            color: #333;
            font-size: 0.85rem;
            margin-bottom: 6px;
            padding-bottom: 2px;
            border-bottom: 1px solid #666;
            font-weight: bold;
            line-height: 1.3;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            padding: 2px 0;
            font-size: 0.75rem;
            line-height: 1.2;
          }
          
          .info-label {
            font-weight: bold;
            color: #333;
          }
          
          .info-value {
            color: #000;
          }
          
          /* Expanded Items Table - Main Focus */
          .items-section {
            padding: 10px 20px;
            flex-grow: 1;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 0.75rem;
          }
          
          .items-table th {
            background: #555;
            color: white;
            padding: 8px 6px;
            text-align: ${language === 'ar' ? 'right' : 'left'};
            font-weight: bold;
            border: 1px solid #555;
            font-size: 0.7rem;
            line-height: 1.2;
          }
          
          .items-table td {
            padding: 6px 6px;
            border: 1px solid #ccc;
            text-align: ${language === 'ar' ? 'right' : 'left'};
            font-size: 0.7rem;
            vertical-align: top;
          }
          
          .items-table tbody tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          .color-cell {
            color: #666;
            font-size: 0.65rem;
            font-style: italic;
          }
          
          .item-name {
            font-weight: bold;
            max-width: 120px;
            word-wrap: break-word;
          }
          
          /* Compact Totals Section */
          .totals-section {
            padding: 15px 20px;
            background: #f5f5f5;
          }
          
          .totals-container {
            max-width: 300px;
            margin-${language === 'ar' ? 'right' : 'left'}: auto;
            background: white;
            border: 2px solid #666;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 12px;
            border-bottom: 1px solid #ccc;
            font-size: 0.75rem;
            line-height: 1.2;
          }
          
          .total-row:last-child {
            border-bottom: none;
          }
          
          .final-total {
            background: #666;
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
          }
          
          /* Compact Signature Section */
          .signature-section {
            padding: 10px 20px;
            border-top: 1px solid #ccc;
            background: #fafafa;
          }
          
          .signature-box {
            border: 1px solid #666;
            padding: 15px 8px 8px;
            text-align: center;
            background: white;
            margin: 8px auto;
            max-width: 180px;
            position: relative;
            border-radius: 3px;
          }
          
          .signature-label {
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0 4px;
            font-weight: bold;
            color: #333;
            font-size: 0.65rem;
          }
          
          /* Compact Policies Section */
          .policies-section {
            padding: 10px 20px;
            background: #f8f8f8;
            border-top: 1px solid #ccc;
          }
          
          .policies-title {
            color: #333;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 6px;
            text-align: center;
            padding: 4px 8px;
            background: white;
            border-radius: 3px;
            border: 1px solid #ddd;
          }
          
          .policies-list {
            list-style: none;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          
          .policies-list li {
            background: white;
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 2px;
            font-size: 0.65rem;
            border-${language === 'ar' ? 'right' : 'left'}: 2px solid #666;
          }
          
          .policies-list li:before {
            content: "• ";
            color: #666;
            font-weight: bold;
            margin-${language === 'ar' ? 'left' : 'right'}: 3px;
          }
          
          /* Light Gray Footer */
          .invoice-footer {
            background: #f5f5f5;
            color: #333;
            padding: 10px 20px;
            text-align: center;
            border-top: 1px solid #666;
          }
          
          .footer-text {
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 4px;
            color: #333;
          }
          
          /* Contact Information in Footer */
          .footer-contact {
            margin: 8px 0;
          }
          
          .company-details-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 4px;
            margin: 6px 0;
          }
          
          .footer-contact-item {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-size: 0.65rem;
            color: #555;
            background: white;
            padding: 2px 6px;
            border-radius: 2px;
            border: 1px solid #ddd;
            margin: 1px;
          }
          
          .footer-contact-item.address-item {
            flex-basis: 100%;
            justify-content: center;
            margin-bottom: 3px;
          }
          
          .footer-contact-icon {
            font-size: 0.7rem;
            color: #666;
          }
          
          .contact-label {
            font-weight: bold;
            color: #333;
          }
          
          .contact-value {
            color: #555;
          }
          
          .footer-date {
            font-size: 0.6rem;
            color: #666;
            margin-top: 6px;
            font-style: italic;
            border-top: 1px solid #ddd;
            padding-top: 4px;
          }
          
          /* Print Styles */
          @media print {
            body { 
              margin: 0; 
              font-size: 10px;
            }
            .invoice-container {
              border: 2px solid #666;
              max-width: 100%;
            }
            .no-print { 
              display: none; 
            }
            .items-table {
              font-size: 0.7rem;
            }
            .items-table th,
            .items-table td {
              padding: 4px 4px;
            }
            .invoice-footer {
              background: #f5f5f5 !important;
              color: #333 !important;
              padding: 8px 20px !important;
            }
            .footer-contact-item {
              background: white !important;
              border: 1px solid #ddd !important;
              font-size: 0.6rem !important;
            }
            .policies-section {
              padding: 8px 20px !important;
            }
            .signature-section {
              padding: 8px 20px !important;
            }
          }
          
          /* Responsive */
          @media (max-width: 600px) {
            .header-content {
              flex-direction: column;
              text-align: center;
            }
            
            .invoice-info {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            
            .company-details-grid {
              flex-direction: column;
              align-items: center;
            }
            
            .footer-contact-item {
              font-size: 0.6rem !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header with Logo and Company Info -->
          <div class="invoice-header">
            <div class="header-content">
              <div class="logo-section">
                ${invoiceSettings.showLogo && brandSettings?.logoUrl ? `
                  <img src="${brandSettings.logoUrl}" alt="Logo" class="company-logo" />
                ` : ''}
                <div class="company-info">
                  <h1>${invoiceSettings.companyName || brandSettings?.companyName || 'AccouTech Pro'}</h1>
                  ${invoiceSettings.headerText ? `<div class="header-text">${invoiceSettings.headerText}</div>` : ''}
                </div>
              </div>
              <div class="invoice-details">
                <div class="invoice-number">${language === 'ar' ? 'رقم الفاتورة | Invoice No' : 'Invoice No | رقم الفاتورة'}: ${invoiceNumber}</div>
                <div class="invoice-type">${invoice.type === 'sales' ? 
                  (language === 'ar' ? 'فاتورة مبيعات | Sales Invoice' : 'Sales Invoice | فاتورة مبيعات') : 
                  (language === 'ar' ? 'فاتورة مشتريات | Purchase Invoice' : 'Purchase Invoice | فاتورة مشتريات')
                }</div>
              </div>
            </div>
          </div>
          
          <!-- Invoice Information -->
          <div class="invoice-info">
            <div class="info-section">
              <h3>${language === 'ar' ? 'تفاصيل الفاتورة | Invoice Details' : 'Invoice Details | تفاصيل الفاتورة'}</h3>
              <div class="info-item">
                <span class="info-label">${language === 'ar' ? 'التاريخ | Date' : 'Date | التاريخ'}:</span>
                <span class="info-value">${new Date(invoice.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
              ${invoice.dueDate ? `
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'تاريخ الاستحقاق | Due Date' : 'Due Date | تاريخ الاستحقاق'}:</span>
                  <span class="info-value">${new Date(invoice.dueDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                </div>
              ` : ''}
            </div>
            <div class="info-section">
              <h3>${language === 'ar' ? 'نوع الفاتورة | Invoice Type' : 'Invoice Type | نوع الفاتورة'}</h3>
              <div class="info-item">
                <span class="info-label">${language === 'ar' ? 'النوع | Type' : 'Type | النوع'}:</span>
                <span class="info-value">${invoice.type === 'sales' ? 
                  (language === 'ar' ? 'فاتورة مبيعات | Sales Invoice' : 'Sales Invoice | فاتورة مبيعات') : 
                  (language === 'ar' ? 'فاتورة مشتريات | Purchase Invoice' : 'Purchase Invoice | فاتورة مشتريات')
                }</span>
              </div>
            </div>
          </div>
          
          <!-- Items Table -->
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th>${language === 'ar' ? 'العنصر | Item' : 'Item | العنصر'}</th>
                  <th>${language === 'ar' ? 'اللون | Color' : 'Color | اللون'}</th>
                  <th>${language === 'ar' ? 'الكمية | Qty' : 'Qty | الكمية'}</th>
                  <th>${language === 'ar' ? 'سعر الوحدة | Unit Price' : 'Unit Price | سعر الوحدة'}</th>
                  <th>${language === 'ar' ? 'الخصم | Discount' : 'Discount | الخصم'}</th>
                  <th>${language === 'ar' ? 'المجموع | Total' : 'Total | المجموع'}</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map(item => {
                  const discountAmount = item.discountAmount || 0;
                  const discountDisplay = discountAmount > 0 ? discountAmount.toFixed(2) : '-';
                  
                  // عرض اللون
                  let colorDisplay = '-';
                  if (item.color === 'custom' && item.customColorName) {
                    colorDisplay = item.customColorName;
                    if (item.colorPrice > 0) colorDisplay += ` (+${item.colorPrice})`;
                  } else if (item.color && item.color !== 'custom') {
                    colorDisplay = item.color;
                    if (item.colorPrice > 0) colorDisplay += ` (+${item.colorPrice})`;
                  }
                  
                  const colorPrice = item.colorPrice || 0;
                  const basePrice = item.unitPrice || 0;
                  const totalPrice = basePrice + colorPrice;
                  const priceDisplay = colorPrice > 0 ? 
                    `${basePrice.toFixed(2)} + ${colorPrice.toFixed(2)} = ${totalPrice.toFixed(2)}` : 
                    basePrice.toFixed(2);
                  
                  return `
                    <tr>
                      <td class="item-name">${item.itemName}</td>
                      <td class="color-cell">${colorDisplay}</td>
                      <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                      <td style="text-align: center;">${priceDisplay}</td>
                      <td style="text-align: center;">${discountDisplay}</td>
                      <td style="text-align: center; font-weight: bold;">${item.total?.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('') || ''}
              </tbody>
            </table>
          </div>
          
          <!-- Totals -->
          <div class="totals-section">
            <div class="totals-container">
              <div class="total-row">
                <span>${language === 'ar' ? 'المجموع الفرعي | Subtotal' : 'Subtotal | المجموع الفرعي'}:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              ${discountAmount > 0 ? `
                <div class="total-row">
                  <span>${language === 'ar' ? 'الخصم | Discount' : 'Discount | الخصم'}:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${vatAmount > 0 ? `
                <div class="total-row">
                  <span>${language === 'ar' ? 'ضريبة القيمة المضافة | VAT' : 'VAT | ضريبة القيمة المضافة'}:</span>
                  <span>${vatAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row final-total">
                <span>${language === 'ar' ? 'الإجمالي | Total' : 'Total | الإجمالي'}:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <!-- Receiver Signature -->
          ${invoiceSettings.showReceiverSignature ? `
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-label">${invoiceSettings.receiverSignatureLabel || 
                  (language === 'ar' ? 'توقيع المستلم | Receiver Signature' : 'Receiver Signature | توقيع المستلم')
                }</div>
              </div>
            </div>
          ` : ''}
          
          <!-- Enhanced Store Policies -->
          ${invoiceSettings.showPolicies && invoiceSettings.policies?.length > 0 ? `
            <div class="policies-section">
              <div class="policies-title">
                ${invoiceSettings.policiesTitle || (language === 'ar' ? 
                  (invoice.type === 'sales' ? 'سياسات وشروط البيع' : 'سياسات وشروط الشراء') : 
                  (invoice.type === 'sales' ? 'Sales Terms & Policies' : 'Purchase Terms & Policies')
                )}
              </div>
              <ul class="policies-list">
                ${invoiceSettings.policies.filter(policy => policy.trim()).map(policy => `
                  <li>${policy}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <!-- Footer with Complete Company Info -->
          <div class="invoice-footer">
            <div class="footer-text">${invoiceSettings.footerText || 'شكراً لتعاملكم معنا'}</div>
            
            <!-- Complete Company Information -->
            <div class="footer-contact">
              <div class="company-details-grid">
                ${invoiceSettings.companyAddress ? `
                  <div class="footer-contact-item address-item">
                    <span class="footer-contact-icon">📍</span>
                    <span class="contact-label">${language === 'ar' ? 'العنوان | Address' : 'Address | العنوان'}:</span>
                    <span class="contact-value">${invoiceSettings.companyAddress}</span>
                  </div>
                ` : ''}
                
                ${invoiceSettings.companyPhone ? `
                  <div class="footer-contact-item">
                    <span class="footer-contact-icon">📞</span>
                    <span class="contact-label">${language === 'ar' ? 'الهاتف | Phone' : 'Phone | الهاتف'}:</span>
                    <span class="contact-value">${invoiceSettings.companyPhone}</span>
                  </div>
                ` : ''}
                
                ${invoiceSettings.companyEmail ? `
                  <div class="footer-contact-item">
                    <span class="footer-contact-icon">📧</span>
                    <span class="contact-label">${language === 'ar' ? 'البريد | Email' : 'Email | البريد'}:</span>
                    <span class="contact-value">${invoiceSettings.companyEmail}</span>
                  </div>
                ` : ''}
                
                ${invoiceSettings.companyWebsite ? `
                  <div class="footer-contact-item">
                    <span class="footer-contact-icon">🌐</span>
                    <span class="contact-label">${language === 'ar' ? 'الموقع | Website' : 'Website | الموقع'}:</span>
                    <span class="contact-value">${invoiceSettings.companyWebsite}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="footer-date">${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
          </div>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.clientId) {
      showNotification(t('selectClientSupplier'), 'error')
      return
    }

    if (!formData.description) {
      showNotification(t('enterInvoiceDescription'), 'error')
      return
    }

    // Filter valid items
    const validItems = formData.items.filter(item => 
      item.itemName && item.quantity > 0 && item.unitPrice > 0
    )

    if (validItems.length === 0) {
      showNotification(t('addAtLeastOneItem'), 'error')
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
          editingInvoice ? t('invoiceUpdatedSuccess') : t('invoiceCreatedSuccess')
        )
        refreshAllData() // Force refresh of all related data
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification(t('unexpectedError'), 'error')
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
    if (window.confirm(`${t('confirmDelete')} "${invoice.invoiceNumber}"؟`)) {
      // First reverse the inventory effects before deleting
      reverseInventoryEffectsOnDelete(invoice)
      
      // Then delete the invoice
      const result = deleteInvoice(invoice.id)
      if (result.success) {
        showNotification(t('invoiceDeletedSuccess'))
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
      let matchesTab = false
      if (activeTab === 'all') {
        matchesTab = true
      } else if (activeTab === 'sales' || activeTab === 'purchase') {
        matchesTab = invoice.type === activeTab
      } else if (activeTab === 'withDiscount') {
        matchesTab = hasDiscount(invoice)
      } else if (activeTab === 'withVAT') {
        matchesTab = hasVAT(invoice)
      }
      
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
        <h1>{t('invoicesManagement')}</h1>
        {hasPermission('create_invoices') && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            {t('createNewInvoice')}
          </button>
        )}
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Invoice Notifications - Only show if notifications are enabled */}
      {notificationsEnabled && (
        <InvoiceNotifications 
          invoices={invoices}
          onInvoiceClick={(invoice) => openModal(invoice)}
        />
      )}

      {/* Tabs */}
      <div className="invoice-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {t('allInvoices')} ({invoices.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          {t('salesInvoices')} ({invoices.filter(i => i.type === 'sales').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          {t('purchaseInvoices')} ({invoices.filter(i => i.type === 'purchase').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'withDiscount' ? 'active' : ''}`}
          onClick={() => setActiveTab('withDiscount')}
        >
          📊 {t('withDiscount')} ({invoices.filter(i => hasDiscount(i)).length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'withVAT' ? 'active' : ''}`}
          onClick={() => setActiveTab('withVAT')}
        >
          💰 {t('withVAT')} ({invoices.filter(i => hasVAT(i)).length})
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
                <th>{t('invoiceNum')}</th>
                <th>{t('type')}</th>
                <th>{t('clientSupplier')}</th>
                <th>{t('date')}</th>
                <th>{t('dueDate')}</th>
                <th>{t('totalAmount')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>
                    <span 
                      className="invoice-number"
                      data-has-custom={invoice.number && invoice.number !== invoice.id && !invoice.number.startsWith('INV-') ? 'true' : 'false'}
                    >
                      {getDisplayInvoiceNumber(invoice)}
                    </span>
                  </td>
                  <td>
                    <span className={`invoice-type ${invoice.type}`}>
                      {invoice.type === 'sales' ? t('sales') : t('purchase')}
                      {hasDiscount(invoice) && <span className="discount-indicator" title={t('hasDiscount')}> 📊</span>}
                      {hasVAT(invoice) && <span className="vat-indicator" title={t('hasVAT')}> 💰</span>}
                    </span>
                  </td>
                  <td>{invoice.clientName}</td>
                  <td>{new Date(invoice.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                  <td>
                    {invoice.dueDate ? (
                      <div className="due-date-cell">
                        <div>{new Date(invoice.dueDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
                        {(() => {
                          const daysInfo = getDaysInfo(invoice.dueDate)
                          return (
                            <div className={`days-info ${daysInfo.status}`}>
                              {daysInfo.status === 'overdue' && (
                                <small className="overdue-text">⚠️ {daysInfo.days} {t('daysOverdue')}</small>
                              )}
                              {daysInfo.status === 'due-today' && (
                                <small className="due-today-text">🔔 {t('dueToday')}</small>
                              )}
                              {daysInfo.status === 'due-future' && daysInfo.days <= 7 && (
                                <small className="due-soon-text">⏰ {daysInfo.days} {t('daysDue')}</small>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      <small className="no-due-date">{t('noDueDate')}</small>
                    )}
                  </td>
                  <td>{parseFloat(invoice.total).toFixed(3)} {t('kwd')}</td>
                  <td>
                    <span className={`payment-status ${invoice.paymentStatus || 'paid'}`}>
                      {invoice.paymentStatus === 'paid' && t('paid')}
                      {invoice.paymentStatus === 'pending' && t('pending')}
                      {invoice.paymentStatus === 'overdue' && t('overdue')}
                      {!invoice.paymentStatus && t('paid')}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasPermission('edit_invoices') && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openModal(invoice)}
                        >
                          {t('viewEdit')}
                        </button>
                      )}
                      {hasPermission('print_reports') && (
                        <button 
                          className="btn btn-info btn-sm"
                          onClick={() => printInvoice(invoice)}
                        >
                          {t('print')}
                        </button>
                      )}
                      {hasPermission('delete_invoices') && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(invoice)}
                        >
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            {invoices.length === 0 ? (
              <p>{t('noInvoicesAvailable')}</p>
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
              <h2>{editingInvoice ? `${t('editInvoice')} ${editingInvoice.invoiceNumber}` : t('createNewInvoice')}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Invoice Header */}
              <div className="invoice-header">
                <div className="form-group">
                  <label>{t('invoiceType')} *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, clientId: '', clientName: '' }))}
                    disabled={editingInvoice}
                  >
                    <option value="sales">{t('salesInvoice')}</option>
                    <option value="purchase">{t('purchaseInvoice')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{formData.type === 'sales' ? t('client') : t('supplier')} *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                  >
                    <option value="">{formData.type === 'sales' ? t('selectClient') : t('selectSupplier')}</option>
                    {(formData.type === 'sales' ? customers : suppliers).map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('invoiceDate')} *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('dueDate')}</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>{t('paymentStatus')} *</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    required
                  >
                    <option value="paid">{t('paid')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="overdue">{t('overdue')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('invoiceDescription')} *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('invoiceDescriptionPlaceholder')}
                  rows="2"
                  required
                />
              </div>

              {/* Invoice Items */}
              <div className="invoice-items">
                <div className="items-header">
                  <h3>{t('invoiceItems')}</h3>
                  <button type="button" className="btn btn-secondary" onClick={addItem}>
                    {t('addItem')}
                  </button>
                </div>

                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>{t('products')}</th>
                        <th>{language === 'ar' ? 'اللون' : 'Color'}</th>
                        <th>{t('quantity')}</th>
                        <th>{t('unitPrice')}</th>
                        <th>{t('itemDiscount')}</th>
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
                                <input
                                  ref={el => inputRefs.current[index] = el}
                                  type="text"
                                  value={item.itemName}
                                  onChange={(e) => handleProductSearch(index, e.target.value)}
                                  placeholder={t('searchProduct')}
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
                                                <span className="stock-available"> • {t('available')}: {product.quantity}</span>
                                              ) : (
                                                <span className="stock-out"> • {t('notAvailable')}</span>
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
                                      🔍 {t('noProductsFound')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Color Selection Column */}
                          <td>
                            {item.requiresColor ? (
                              <div className="color-select-container">
                                <select
                                  value={item.color === 'custom' ? 'custom' : item.color}
                                  onChange={(e) => {
                                    const selectedColorName = e.target.value
                                    if (selectedColorName === 'custom') {
                                      updateItem(index, 'color', 'custom')
                                      updateItem(index, 'colorCode', '')
                                      updateItem(index, 'colorPrice', 0)
                                    } else if (selectedColorName) {
                                      const colors = JSON.parse(localStorage.getItem('paintColors') || '[]')
                                      const selectedColor = colors.find(color => color.name === selectedColorName)
                                      
                                      updateItem(index, 'color', selectedColorName)
                                      if (selectedColor) {
                                        updateItem(index, 'colorCode', selectedColor.code)
                                        updateItem(index, 'colorPrice', selectedColor.additionalCost || 0)
                                      }
                                    } else {
                                      // مسح جميع بيانات اللون عند اختيار "بدون لون"
                                      updateItem(index, 'color', '')
                                      updateItem(index, 'colorCode', '')
                                      updateItem(index, 'colorPrice', 0)
                                      updateItem(index, 'customColorName', '')
                                      updateItem(index, 'customColorCode', '')
                                    }
                                  }}
                                  className="color-select compact"
                                >
                                  <option value="">{language === 'ar' ? 'بدون لون' : 'No Color'}</option>
                                  {JSON.parse(localStorage.getItem('paintColors') || '[]').map(color => (
                                    <option key={color.id} value={color.name}>
                                      {color.name} {color.additionalCost > 0 && `+${color.additionalCost}`}
                                    </option>
                                  ))}
                                  <option value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</option>
                                </select>
                                
                                {/* Compact Custom Color Input - Single Line */}
                                {item.color === 'custom' && (
                                  <div className="custom-color-compact">
                                    <input
                                      type="text"
                                      value={item.customColorName || ''}
                                      onChange={(e) => updateItem(index, 'customColorName', e.target.value)}
                                      placeholder={language === 'ar' ? 'اسم اللون' : 'Color name'}
                                      className="custom-input-compact"
                                    />
                                    <input
                                      type="number"
                                      value={item.colorPrice || 0}
                                      onChange={(e) => updateItem(index, 'colorPrice', parseFloat(e.target.value) || 0)}
                                      placeholder={language === 'ar' ? 'سعر إضافي' : 'Extra cost'}
                                      min="0"
                                      step="0.25"
                                      className="custom-price-compact"
                                      title={language === 'ar' ? 'سعر إضافي للون' : 'Additional color cost'}
                                    />
                                  </div>
                                )}
                                
                                {/* Compact Color Display */}
                                {((item.color && item.color !== 'custom') || (item.color === 'custom' && item.customColorName)) && item.colorPrice > 0 && (
                                  <div className="color-price-compact">
                                    +{item.colorPrice} {t('currency')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="no-color-compact">-</span>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              min="1"
                              step="1"
                              required
                            />
                          </td>
                          <td>
                            <div className="price-display">
                              <input
                                type="number"
                                value={(parseFloat(item.unitPrice) || 0) + (parseFloat(item.colorPrice) || 0)}
                                min="0"
                                step="0.001"
                                placeholder="0"
                                readOnly
                                className="readonly-input price-input-main"
                              />
                              {item.colorPrice > 0 && (
                                <div className="price-breakdown">
                                  <small className="base-price">
                                    {language === 'ar' ? 'الأساسي:' : 'Base:'} {parseFloat(item.unitPrice).toFixed(3)} {t('currency')}
                                  </small>
                                  <small className="color-price">
                                    {language === 'ar' ? 'اللون:' : 'Color:'} +{parseFloat(item.colorPrice).toFixed(3)} {t('currency')}
                                  </small>
                                  <small className="total-price">
                                    {language === 'ar' ? 'الإجمالي:' : 'Total:'} {(parseFloat(item.unitPrice) + parseFloat(item.colorPrice)).toFixed(3)} {t('currency')}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="discount-input-group">
                              <input
                                type="number"
                                value={item.discount || 0}
                                onChange={(e) => updateItem(index, 'discount', e.target.value)}
                                min="0"
                                step="1"
                                placeholder="0"
                                className="discount-input"
                              />
                              <select
                                value={item.discountType || 'amount'}
                                onChange={(e) => updateItem(index, 'discountType', e.target.value)}
                                className="discount-type-select"
                              >
                                <option value="amount">د.ك</option>
                                <option value="percentage">%</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            <div className="item-total-container">
                              <span className="item-total">{item.total.toFixed(3)} {t('kwd')}</span>
                              {item.discountAmount > 0 && (
                                <div className="item-discount-indicator has-discount">
                                  -{item.discountAmount.toFixed(3)} {t('kwd')}
                                </div>
                              )}
                            </div>
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
                    
                    <div className="total-line discount-line compact">
                      <label>{t('discount')}:</label>
                      <div className="compact-input-group">
                        <input
                          type="number"
                          value={formData.discount}
                          onChange={(e) => updateInvoiceField('discount', e.target.value)}
                          min="0"
                          step="0.1"
                          placeholder="0"
                          className="compact-input"
                        />
                        <select
                          className="compact-select"
                          value={formData.discountType}
                          onChange={(e) => updateInvoiceField('discountType', e.target.value)}
                        >
                          <option value="amount">{t('kwd')}</option>
                          <option value="percentage">%</option>
                        </select>
                        <span className="calculated-value">
                          ({formData.discountAmount.toFixed(3)} {t('kwd')})
                        </span>
                      </div>
                    </div>
                    
                    <div className="total-line vat-line compact">
                      <label>{t('vatRate')}:</label>
                      <div className="compact-input-group">
                        <input
                          type="number"
                          value={formData.vatRate}
                          onChange={(e) => updateInvoiceField('vatRate', e.target.value)}
                          min="0"
                          step="0.1"
                          placeholder="0"
                          className="compact-input"
                        />
                        <select
                          className="compact-select"
                          value={formData.vatType}
                          onChange={(e) => updateInvoiceField('vatType', e.target.value)}
                        >
                          <option value="amount">{t('kwd')}</option>
                          <option value="percentage">%</option>
                        </select>
                        <span className="calculated-value">
                          ({formData.vatAmount.toFixed(3)} {t('kwd')})
                        </span>
                      </div>
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
                    {t('createJournalEntry')}
                  </label>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingInvoice ? t('saveChanges') : t('createInvoiceBtn')}
                </button>
                {editingInvoice && (
                  <button 
                    type="button" 
                    className="btn btn-info"
                    onClick={() => printInvoice(editingInvoice)}
                  >
                    {t('printInvoice')}
                  </button>
                )}
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

export default Invoices