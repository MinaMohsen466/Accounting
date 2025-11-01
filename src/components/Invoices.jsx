import { useState, useEffect, useRef } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useBrand } from '../contexts/BrandContext'
import { updateInvoicesStatus, getInvoiceNotifications, getDaysInfo, getAutoPaymentStatus } from '../utils/invoiceUtils'
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
    updateInventoryItem,
    addJournalEntry,
    createJournalEntryFromInvoice
  } = useAccounting()
  const { t, language, notificationsEnabled } = useLanguage()
  const { hasPermission } = useAuth()
  const { brandSettings } = useBrand()

  // Hook and ref declarations MUST run on every render. Move them above
  // any early returns (permission checks) so React Hooks order stays stable.
  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [notification, setNotification] = useState(null)
  const [modalError, setModalError] = useState(null) // رسالة خطأ داخل المودال
  const [searchResults, setSearchResults] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState(null)
  const [suppressSuggestions, setSuppressSuggestions] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pendingEditInvoice, setPendingEditInvoice] = useState(null)

  // 🆕 Return Invoice States (إرجاع الفاتورة)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returningInvoice, setReturningInvoice] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [returnReason, setReturnReason] = useState('')
  const [returnInventoryStatus, setReturnInventoryStatus] = useState({}) // لتتبع توفر المنتجات

  // Refs for dropdown management
  const dropdownRefs = useRef({})
  const inputRefs = useRef({})

  // Check if user has permission to view invoices
  if (!hasPermission('view_invoices')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض الفواتير"
        description="تحتاج إلى صلاحية 'عرض الفواتير' للوصول إلى هذه الصفحة"
      />
    )
  }

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

  // Build client/supplier suggestions from search term
  useEffect(() => {
    if (suppressSuggestions) {
      // clear suppression shortly after selection so typing can reopen suggestions
      const timer = setTimeout(() => setSuppressSuggestions(false), 600)
      setSuggestions([])
      return () => clearTimeout(timer)
    }

    const term = (searchTerm || '').trim().toLowerCase()
    if (!term) {
      setSuggestions([])
      setSelectedCounterpartyId(null)
      return
    }

    const pool = [
      ...customers.map(c => ({ ...c, type: 'customer' })),
      ...suppliers.map(s => ({ ...s, type: 'supplier' }))
    ]

    const matches = pool.filter(p => p.name && p.name.toLowerCase().includes(term)).slice(0, 6)
    setSuggestions(matches)
  }, [searchTerm, customers, suppliers])
  
  const [formData, setFormData] = useState({
    type: 'sales', // sales or purchase
    clientId: '',
    clientName: '',
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
    dueDate: '',
    paymentStatus: '', // 🔥 فارغ - يجب اختيار حالة الدفع
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
        // حقول اللون الجديدة - دائماً مخصص
        color: 'custom',
        colorCode: '',
        colorPrice: 0,
        requiresColor: false,
        productType: '',
        // حقول اللون المخصص
        customColorName: '',
        customColorCode: '',
    expiryMonth: '',
    expiryYear: ''
  // تاريخ انتهاء الصلاحية للشحنة الجديدة (محذوف من واجهة الفاتورة)
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
    createJournalEntry: true,
    recordPaymentNow: false,
    paymentBankAccountId: '',
    deductFromBalance: false, // خصم من الرصيد الابتدائي
    // Control whether to show the Color column when printing this invoice
    showColorInPrint: true
  })
  // show/hide compact payment options dropdown
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)

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
    // Try to pre-select a main bank/cash account if available
    const accountsList = JSON.parse(localStorage.getItem('accounts') || '[]')
    const mainBankCash = accountsList.find(acc => acc.type === 'bank' || acc.type === 'cash')
    const preselectedAccountId = mainBankCash ? mainBankCash.id : ''

    setFormData({
      type: 'sales',
      clientId: '',
      clientName: '',
      date: new Date().toLocaleDateString('en-CA'),
      dueDate: '',
      paymentStatus: '', // 🔥 فارغ - يجب اختيار حالة الدفع
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
          // حقول اللون الجديدة - دائماً مخصص
          color: 'custom',
          colorCode: '',
          colorPrice: 0,
          requiresColor: false,
          productType: '',
          // حقول اللون المخصص
          customColorName: '',
          customColorCode: '',
          // تاريخ انتهاء الصلاحية (شهر/سنة)
          expiryMonth: '',
          expiryYear: ''
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
      createJournalEntry: true,
      recordPaymentNow: true,
      paymentBankAccountId: preselectedAccountId,
      deductFromBalance: false,
      // Control whether to show the Color column when printing this invoice
      showColorInPrint: true
    })
    setEditingInvoice(null)
  }

  const openModal = (invoice = null) => {
    // Check if editing and PIN is required
    if (invoice) {
      const savedPin = localStorage.getItem('app_editInvoicePin')
      const pinSettings = JSON.parse(localStorage.getItem('app_pinProtectionSettings') || '{"invoices": true}')
      
      if (savedPin && pinSettings.invoices) {
        // PIN is set and protection is enabled, show PIN modal first
        setPendingEditInvoice(invoice)
        setShowPinModal(true)
        setPinInput('')
        setPinError('')
        return
      }
    }
    
    // No PIN required or creating new invoice
    proceedToEdit(invoice)
  }

  const proceedToEdit = (invoice = null) => {
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
        customColorCode: it.customColorCode || '',
  // (expiryDate removed from invoice UI; keep any stored value in item if present)
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
          customColorCode: '',
          // (expiryDate removed from invoice UI)
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
        createJournalEntry: !!invoice.createJournalEntry,
        recordPaymentNow: !!invoice.recordPaymentNow,
        paymentBankAccountId: invoice.paymentBankAccountId || ''
        ,
        showColorInPrint: invoice.showColorInPrint !== undefined ? !!invoice.showColorInPrint : true
      }
  // Recalculate to ensure consistency
  setFormData(() => calculateTotals(populated))
      setEditingInvoice(invoice)
    } else {
      resetForm()
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
      proceedToEdit(pendingEditInvoice)
      setPendingEditInvoice(null)
    } else {
      // PIN incorrect
      setPinError(language === 'ar' ? 'الرقم السري غير صحيح' : 'Incorrect PIN')
    }
  }

  const closePinModal = () => {
    setShowPinModal(false)
    setPinInput('')
    setPinError('')
    setPendingEditInvoice(null)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
    // Clear search results when closing modal
    setSearchResults({})
    // Clear modal error message
    setModalError(null)
  }

  // Force data refresh to ensure all components reflect latest changes
  const refreshAllData = () => {
    // Force React to re-read from localStorage by triggering a minimal state update
    // This is a workaround to ensure data consistency across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('accountingDataUpdated'))
    }
  }

  // Listen for external requests to open a specific invoice (from AccountStatement)
  useEffect(() => {
    const handler = (e) => {
      const d = (e && e.detail) || {}
      const { invoiceId, invoice } = d
      if (invoice) {
        openModal(invoice)
        return
      }

      if (invoiceId) {
        // First try exact id match
        let found = invoices.find(inv => String(inv.id) === String(invoiceId))
        // Fallback: maybe the caller sent the invoiceNumber (S0001 etc.)
        if (!found) {
          found = invoices.find(inv => String(inv.invoiceNumber) === String(invoiceId))
        }

        if (found) {
          openModal(found)
        } else {
          // If not found yet, wait a tick — invoices may refresh — then try again
          setTimeout(() => {
            const retry = invoices.find(inv => String(inv.id) === String(invoiceId) || String(inv.invoiceNumber) === String(invoiceId))
            if (retry) openModal(retry)
          }, 100)
        }
      }
    }

    window.addEventListener('openInvoice', handler)
    return () => window.removeEventListener('openInvoice', handler)
  }, [invoices])

  // التحقق من توفر المنتجات في المخزون عند تغيير كميات الإرجاع
  useEffect(() => {
    if (!showReturnModal || returnItems.length === 0 || !returningInvoice) {
      setReturnInventoryStatus({})
      return
    }

    const inventoryItems = getInventoryItems()
    const status = {}

    returnItems.forEach((item, index) => {
      if (item.returnQuantity > 0) {
        const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
        
        if (returningInvoice.type === 'purchase') {
          // إرجاع مشتريات: يجب التحقق من توفر الكمية
          if (!inventoryItem) {
            status[index] = {
              available: false,
              message: language === 'ar' ? 'المنتج غير موجود في المخزون' : 'Product not in inventory',
              color: '#dc3545'
            }
          } else {
            const availableQty = parseFloat(inventoryItem.quantity) || 0
            const isAvailable = availableQty >= item.returnQuantity
            
            status[index] = {
              available: isAvailable,
              availableQty: availableQty,
              message: isAvailable 
                ? `✓ ${language === 'ar' ? 'متوفر' : 'Available'} (${availableQty})`
                : `✗ ${language === 'ar' ? 'غير كافي' : 'Insufficient'} (${language === 'ar' ? 'متوفر' : 'available'}: ${availableQty})`,
              color: isAvailable ? '#28a745' : '#dc3545'
            }
          }
        } else if (returningInvoice.type === 'sales') {
          // إرجاع مبيعات: لا يشترط توفر المنتج - سيتم إضافته
          status[index] = {
            available: true,
            message: `✓ ${language === 'ar' ? 'سيتم الإضافة للمخزون' : 'Will be added to inventory'}`,
            color: '#28a745'
          }
        }
      }
    })

    setReturnInventoryStatus(status)
  }, [returnItems, showReturnModal, returningInvoice, language])

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
        // إضافة حقول جديدة للون والسعر الإضافي - دائماً مخصص
        color: 'custom',
        colorCode: '',
        colorPrice: 0,
        requiresColor: false,
        productType: '',
        // حقول اللون المخصص
        customColorName: '',
        customColorCode: '',
        // تاريخ انتهاء الصلاحية للشحنة الجديدة
        expiryMonth: '',
        expiryYear: ''
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
    
    // تحديد السعر المناسب حسب نوع الفاتورة
    let unitPrice = 0
    if (formData.type === 'purchase') {
      // للمشتريات: استخدم سعر الشراء فقط (لا تستخدم سعر البيع كبديل)
      unitPrice = product.purchasePrice || 0
    } else {
      // للمبيعات: استخدم سعر البيع
      unitPrice = product.price || product.unitPrice || 0
    }
    
    const quantity = parseFloat(newItems[itemIndex].quantity) || 1
    const discount = parseFloat(newItems[itemIndex].discount) || 0
    
    // التحقق من نوع الوحدة والحاجة للون - الألوان مطلوبة للوحدات: لتر، كيلو، جالون، درام
    const requiresColor = ['liter', 'kilogram', 'gallon', 'drum'].includes(product.unit)
    
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
      // إضافة خصائص اللون - دائماً مخصص
      requiresColor: requiresColor,
      productType: product.category || product.productType || '',
      color: requiresColor ? 'custom' : '',
      colorCode: '',
      colorPrice: 0,
      // خانات اللون المخصص
      customColorName: '',
      customColorCode: '',
      // تاريخ انتهاء الصلاحية - فارغ دائماً للمنتجات الجديدة (شهر/سنة)
      expiryMonth: '',
      expiryYear: ''
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
              // استخدام السعر المناسب حسب نوع الفاتورة
              if (prev.type === 'purchase') {
                // فواتير المشتريات: استخدام سعر الشراء
                updatedItem.unitPrice = selectedInventoryItem.purchasePrice || 0
              } else {
                // فواتير المبيعات: استخدام سعر البيع
                updatedItem.unitPrice = selectedInventoryItem.price || 0
              }
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
    // جمع الكميات للمنتجات المكررة
    const productQuantities = {}
    items.forEach(item => {
      if (productQuantities[item.itemName]) {
        productQuantities[item.itemName] += parseFloat(item.quantity) || 0
      } else {
        productQuantities[item.itemName] = parseFloat(item.quantity) || 0
      }
    })
    
    // تحديث المخزون بناءً على إجمالي الكميات
    Object.entries(productQuantities).forEach(([productName, totalQuantity]) => {
      const inventoryItems = getInventoryItems() // Get fresh data each time
      const inventoryItem = inventoryItems.find(inv => inv.name === productName)
      if (inventoryItem) {
        const currentQty = parseFloat(inventoryItem.quantity) || 0
        const newQuantity = Math.max(0, currentQty - totalQuantity)
        updateInventoryItem(inventoryItem.id, {
          ...inventoryItem,
          quantity: newQuantity
        })
      }
    })
  }

  // Function to update inventory when purchasing products (increase stock)
  const updateInventoryForPurchase = (items) => {
    // جمع الكميات والأسعار للمنتجات المكررة
    const productData = {}
    items.forEach(item => {
      const productName = item.itemName
      const quantity = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unitPrice) || 0
      
      if (productData[productName]) {
        // جمع الكميات وحساب متوسط السعر المرجح
        const existingQty = productData[productName].totalQuantity
        const existingValue = productData[productName].totalValue
        const newValue = quantity * price
        
        productData[productName].totalQuantity += quantity
        productData[productName].totalValue += newValue
        productData[productName].weightedPrice = productData[productName].totalValue / productData[productName].totalQuantity
        
        // استخدام آخر تاريخ انتهاء صلاحية محدد
        if (item.expiryDate) {
          productData[productName].expiryDate = item.expiryDate
        }
      } else {
        productData[productName] = {
          totalQuantity: quantity,
          totalValue: quantity * price,
          weightedPrice: price,
          expiryDate: item.expiryDate || ''
        }
      }
    })
    
    // تحديث المخزون بناءً على البيانات المجمعة
    Object.entries(productData).forEach(([productName, data]) => {
      const inventoryItems = getInventoryItems() // Get fresh data each time
      const inventoryItem = inventoryItems.find(inv => inv.name === productName)
      if (inventoryItem) {
        const currentQty = parseFloat(inventoryItem.quantity) || 0
        const addQty = data.totalQuantity
        const newQuantity = currentQty + addQty
        
        // Calculate new purchase price (weighted average)
        const newPurchasePrice = data.weightedPrice
        
        // Calculate weighted average purchase price with existing inventory
        let finalPurchasePrice = newPurchasePrice
        if (currentQty > 0) {
          const currentPurchasePrice = parseFloat(inventoryItem.purchasePrice) || 0
          const currentValue = currentQty * currentPurchasePrice
          const newValue = addQty * newPurchasePrice
          const totalValue = currentValue + newValue
          const totalQuantity = currentQty + addQty
          finalPurchasePrice = totalQuantity > 0 ? totalValue / totalQuantity : newPurchasePrice
        }
        
        // Handle expiry date logic
        let finalExpiryDate = inventoryItem.expiryDate
        
        // If the invoice item has an expiry date, use it (highest priority)
        if (data.expiryDate) {
          finalExpiryDate = data.expiryDate
        } else {
          // If no expiry date provided in invoice, keep current expiry date
          // Only update if current stock is expired/expiring and we have substantial new stock
          if (inventoryItem.expiryDate && addQty > currentQty * 0.5) {
            const expiryDate = new Date(inventoryItem.expiryDate)
            const today = new Date()
            const daysDifference = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
            
            // Only update expiry if current stock is significantly expired/expiring
            if (daysDifference <= 15) {
              // Set new expiry date to 2 years from now
              const newExpiryDate = new Date()
              newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 2)
              finalExpiryDate = newExpiryDate.toISOString().split('T')[0]
            }
          }
          // If no current expiry date and adding new stock without specifying expiry,
          // set a default expiry date
          else if (!inventoryItem.expiryDate && addQty > 0) {
            const newExpiryDate = new Date()
            newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 2)
            finalExpiryDate = newExpiryDate.toISOString().split('T')[0]
          }
        }
        
        updateInventoryItem(inventoryItem.id, {
          ...inventoryItem,
          quantity: newQuantity,
          purchasePrice: finalPurchasePrice, // Update purchase price (weighted average)
          lastPurchasePrice: newPurchasePrice, // Keep track of last purchase price
          expiryDate: finalExpiryDate, // Update expiry date based on logical rules
          lastUpdated: new Date().toISOString()
          // Keep selling price (price/unitPrice) unchanged
        })
      }
    })
  }

  // Updated inventory reconciliation - aggregate per-product adjustments
  const reconcileInventoryOnEdit = (oldInvoice, newItems, newPaymentStatus) => {
    if (!oldInvoice) return

    // Aggregate totals per product for old and new invoice
    const oldTotals = {}
    ;(oldInvoice.items || []).forEach(i => {
      oldTotals[i.itemName] = (oldTotals[i.itemName] || 0) + (parseFloat(i.quantity) || 0)
    })

    const newTotals = {}
    ;(newItems || []).forEach(i => {
      newTotals[i.itemName] = (newTotals[i.itemName] || 0) + (parseFloat(i.quantity) || 0)
    })

    // 1) Undo old totals once per product
    let currentInventory = getInventoryItems()
    Object.entries(oldTotals).forEach(([name, qty]) => {
      const inv = currentInventory.find(x => x.name === name)
      if (!inv) return
      const invQty = parseFloat(inv.quantity) || 0
      if (oldInvoice.type === 'sales') {
        const restored = invQty + qty
        const res = updateInventoryItem(inv.id, { ...inv, quantity: restored })
        if (res.success) inv.quantity = restored
      } else if (oldInvoice.type === 'purchase') {
        const adjusted = Math.max(0, invQty - qty)
        const res = updateInventoryItem(inv.id, { ...inv, quantity: adjusted })
        if (res.success) inv.quantity = adjusted
      }
    })

    // Refresh inventory snapshot
    currentInventory = getInventoryItems()

    // 2) Apply new totals once per product
    Object.entries(newTotals).forEach(([name, qty]) => {
      const inv = currentInventory.find(x => x.name === name)
      if (!inv) return
      const invQty = parseFloat(inv.quantity) || 0
      if (oldInvoice.type === 'sales') {
        const updatedQty = Math.max(0, invQty - qty)
        updateInventoryItem(inv.id, { ...inv, quantity: updatedQty })
      } else if (oldInvoice.type === 'purchase') {
        const updatedQty = invQty + qty
        const unit = (newItems.find(i => i.itemName === name) || {}).unitPrice || 0
        const newCostPrice = parseFloat(unit) || 0
        let finalPrice = newCostPrice
        if (invQty > 0) {
          const currentPrice = parseFloat(inv.price || inv.unitPrice) || 0
          const totalValue = (invQty * currentPrice) + (qty * newCostPrice)
          const totalQuantity = invQty + qty
          finalPrice = totalQuantity > 0 ? totalValue / totalQuantity : newCostPrice
        }
        updateInventoryItem(inv.id, { ...inv, quantity: updatedQty, price: finalPrice })
      }
    })
  }

  // دالة عكس القيود المحاسبية المرتبطة بالفاتورة
  // Reverse journal entries related to an invoice (for edit/delete operations)
  const reverseJournalEntriesForInvoice = (invoice) => {
    if (!invoice || !invoice.invoiceNumber) {
      console.log('⚠️ لا يمكن عكس القيود - فاتورة غير صالحة')
      return
    }

    try {
      const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]')
      
      console.log('📋 إجمالي القيود في النظام:', journalEntries.length)
      console.log('🔍 البحث عن قيود للفاتورة:', invoice.invoiceNumber)
      
      // البحث عن جميع القيود المرتبطة بهذه الفاتورة (باستثناء القيود العكسية)
      // نبحث عن: INV-رقم_الفاتورة، PAY-رقم_الفاتورة، BAL-DED-رقم_الفاتورة
      const relatedEntries = journalEntries.filter(entry => {
        if (!entry.reference) return false
        
        // تجاهل القيود العكسية
        if (entry.reference.startsWith('REV-')) return false
        if (entry.type === 'reversal') return false
        
        // البحث عن القيود المرتبطة بهذه الفاتورة
        // يجب أن يحتوي reference على رقم الفاتورة كاملاً
        const hasInvoiceNumber = entry.reference.includes(invoice.invoiceNumber)
        
        if (hasInvoiceNumber) {
          console.log(`   ✅ قيد مطابق: ${entry.reference}`)
        }
        
        return hasInvoiceNumber
      })

      console.log(`� عدد القيود المرتبطة (غير العكسية): ${relatedEntries.length}`)

      if (relatedEntries.length === 0) {
        console.log('⚠️ لا توجد قيود محاسبية مرتبطة بالفاتورة:', invoice.invoiceNumber)
        return
      }

      console.log(`🔄 إنشاء قيود عكسية لـ ${relatedEntries.length} قيد`)

      // إنشاء قيد عكسي لكل قيد مرتبط
      let successCount = 0
      relatedEntries.forEach((entry, index) => {
        console.log(`\n🔄 [${index + 1}/${relatedEntries.length}] عكس القيد: ${entry.reference}`)
        
        const reversedLines = (entry.lines || []).map(line => {
          const reversed = {
            accountId: line.accountId,
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit: parseFloat(line.credit) || 0,  // عكس المدين والدائن
            credit: parseFloat(line.debit) || 0,
            description: line.description
          }
          console.log(`   ${line.accountName}: مدين ${line.debit} / دائن ${line.credit} → مدين ${reversed.debit} / دائن ${reversed.credit}`)
          return reversed
        })

        const reversalEntry = {
          date: new Date().toISOString().split('T')[0],
          description: `${language === 'ar' ? 'قيد عكسي - حذف فاتورة' : 'Reversal - Invoice Deletion'} - ${entry.description || entry.reference}`,
          reference: `REV-${entry.reference}`,
          lines: reversedLines,
          type: 'reversal'
        }

        // استخدام addJournalEntry من الـ hook حتى يتم تحديث أرصدة الحسابات تلقائياً
        const result = addJournalEntry(reversalEntry)
        if (result.success) {
          successCount++
          console.log(`✅ تم إنشاء القيد العكسي: ${reversalEntry.reference}`)
        } else {
          console.error(`❌ فشل إنشاء القيد العكسي: ${reversalEntry.reference}`, result.error)
        }
      })

      console.log(`\n✅ تم إنشاء ${successCount} من ${relatedEntries.length} قيد عكسي بنجاح`)

      // إطلاق حدث لتحديث البيانات في جميع المكونات
      window.dispatchEvent(new Event('accountingDataUpdated'))
    } catch (error) {
      console.error('❌ خطأ في عكس القيود المحاسبية:', error)
    }
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
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
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
          
          /* تنسيق عمود الرقم المسلسل في الطباعة */
          .items-table th:first-child {
            background: #333;
            color: white;
            text-align: center;
            width: 40px;
            font-weight: bold;
          }
          
          .items-table td:first-child {
            background: #f8f9fa;
            color: #495057;
            text-align: center;
            font-weight: bold;
            border-right: 2px solid #007bff;
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
                <div class="invoice-type">${invoice.isReturn 
                  ? (invoice.type === 'sales'
                      ? (language === 'ar' ? 'مرتجع مبيعات | Sales Return' : 'Sales Return | مرتجع مبيعات')
                      : (language === 'ar' ? 'مرتجع مشتريات | Purchase Return' : 'Purchase Return | مرتجع مشتريات'))
                  : (invoice.type === 'sales' 
                      ? (language === 'ar' ? 'فاتورة مبيعات | Sales Invoice' : 'Sales Invoice | فاتورة مبيعات') 
                      : (language === 'ar' ? 'فاتورة مشتريات | Purchase Invoice' : 'Purchase Invoice | فاتورة مشتريات'))
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
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>${language === 'ar' ? 'العنصر | Item' : 'Item | العنصر'}</th>
                  ${invoice.showColorInPrint !== false ? `<th>${language === 'ar' ? 'الإضافات | Extras' : 'Extras | الإضافات'}</th>` : ''}
                  <th>${language === 'ar' ? 'الكمية | Qty' : 'Qty | الكمية'}</th>
                  <th>${language === 'ar' ? 'سعر الوحدة | Unit Price' : 'Unit Price | سعر الوحدة'}</th>
                  <th>${language === 'ar' ? 'الخصم | Discount' : 'Discount | الخصم'}</th>
                  <th>${language === 'ar' ? 'المجموع | Total' : 'Total | المجموع'}</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map((item, index) => {
                  const discountAmount = item.discountAmount || 0;
                  const discountDisplay = discountAmount > 0 ? discountAmount.toFixed(2) : '-';
                  
                  // عرض اللون / الإضافات — إذا كان هناك سعر إضافي فقط اعرضه حتى بدون اسم
                  let colorDisplay = '-';
                  if (item.color === 'custom' && item.customColorName) {
                    colorDisplay = item.customColorName;
                    if (item.colorPrice > 0) colorDisplay += ` (+${item.colorPrice})`;
                  } else if (item.color && item.color !== 'custom') {
                    colorDisplay = item.color;
                    if (item.colorPrice > 0) colorDisplay += ` (+${item.colorPrice})`;
                  } else if ((item.colorPrice || 0) > 0) {
                    // No color name but there is an extras price — show the price
                    colorDisplay = `+${item.colorPrice}`
                  }
                  
                  const colorPrice = item.colorPrice || 0;
                  const basePrice = item.unitPrice || 0;
                  const totalPrice = basePrice + colorPrice;
                  // Show detailed breakdown only when color price exists AND the invoice flag allows showing color details on print
                  const priceDisplay = (colorPrice > 0 && invoice.showColorInPrint !== false) ?
                    `${basePrice.toFixed(2)} + ${colorPrice.toFixed(2)} = ${totalPrice.toFixed(2)}` :
                    totalPrice.toFixed(2);
                  
                  return `
                    <tr>
                      <td style="text-align: center; font-weight: bold; background: #f8f9fa; color: #495057;">${index + 1}</td>
                      <td class="item-name">${item.itemName}</td>
                      ${invoice.showColorInPrint !== false ? `<td class="color-cell">${colorDisplay}</td>` : ''}
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
            
            <!-- Footer date removed per request -->
          </div>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Record immediate payment when invoice is created
  const recordImmediatePayment = (invoice) => {
    try {
      const paymentAccountId = invoice.paymentBankAccountId || formData.paymentBankAccountId
      const bankAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
        .find(acc => acc.id === paymentAccountId)
      
      if (!bankAccount) {
        console.error('Bank account not found')
        return
      }

      // Get customer account
      let customerAccount = null
      if (invoice.customerId) {
        customerAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
          .find(acc => acc.linkedEntityType === 'customer' && acc.linkedEntityId === invoice.customerId)
      }
      
      if (!customerAccount) {
        customerAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
          .find(acc => acc.code === '1101')
      }

      if (!customerAccount) {
        console.error('Customer account not found')
        return
      }

      const amount = parseFloat(invoice.total) || 0
      const description = `${invoice.type === 'sales' ? 'تحصيل' : 'دفع'} فاتورة رقم ${invoice.invoiceNumber}`

      // Create journal entry for payment
      const paymentReference = `PAY-${invoice.invoiceNumber}`
      const paymentEntry = {
        date: new Date().toISOString(),
        description,
        reference: paymentReference,
        type: 'payment',
        lines: []
      }

      if (invoice.type === 'sales') {
        // Sales: Debit Bank, Credit Customer
        paymentEntry.lines.push({
          accountId: bankAccount.id,
          accountName: bankAccount.name,
          debit: amount,
          credit: 0,
          description
        })
        paymentEntry.lines.push({
          accountId: customerAccount.id,
          accountName: customerAccount.name,
          debit: 0,
          credit: amount,
          description
        })
      } else {
        // Purchase: Debit Supplier, Credit Bank
        let supplierAccount = null
        if (invoice.supplierId) {
          supplierAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
            .find(acc => acc.linkedEntityType === 'supplier' && acc.linkedEntityId === invoice.supplierId)
        }
        
        if (!supplierAccount) {
          supplierAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
            .find(acc => acc.code === '2001')
        }

        if (supplierAccount) {
          paymentEntry.lines.push({
            accountId: supplierAccount.id,
            accountName: supplierAccount.name,
            debit: amount,
            credit: 0,
            description
          })
          paymentEntry.lines.push({
            accountId: bankAccount.id,
            accountName: bankAccount.name,
            debit: 0,
            credit: amount,
            description
          })
        }
      }

      // Save journal entry only if not duplicate
      if (paymentEntry.lines.length > 0) {
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]')
        
        // التحقق من عدم وجود قيد دفع نشط (غير معكوس) بنفس المرجع
        const existingPayment = journalEntries.find(entry => entry.reference === paymentReference)
        const hasReversalEntry = journalEntries.find(entry => entry.reference === `REV-${paymentReference}`)
        
        // إذا كان القيد موجود ولم يتم عكسه، فهو مكرر
        if (existingPayment && !hasReversalEntry) {
          console.warn('⚠️ قيد الدفع موجود مسبقاً ونشط (لم يتم عكسه):', paymentReference)
          console.log('   → تخطي إنشاء قيد دفع مكرر')
        } else {
          if (existingPayment && hasReversalEntry) {
            console.log('✅ قيد الدفع القديم تم عكسه، يمكن إنشاء قيد جديد:', paymentReference)
          }
          const newEntry = {
            id: Date.now().toString(),
            ...paymentEntry
          }
          journalEntries.push(newEntry)
          localStorage.setItem('journalEntries', JSON.stringify(journalEntries))
          
          // Trigger storage event for other components
          window.dispatchEvent(new Event('storage'))
          
          console.log('✅ Payment recorded successfully:', paymentReference)
        }
      }
    } catch (error) {
      console.error('Error recording payment:', error)
    }
  }

  // دالة خصم المبلغ من الرصيد الابتدائي للعميل/المورد
  const deductFromBalance = (invoice) => {
    console.log('🔵 بدء خصم من الرصيد...', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      customerId: invoice.customerId,
      supplierId: invoice.supplierId,
      total: invoice.total
    })
    
    try {
      const amount = parseFloat(invoice.total) || 0
      
      // استخدام clientId (الحقل الفعلي في الفاتورة)
      const entityId = invoice.clientId || invoice.customerId || invoice.supplierId
      
      if (!entityId) {
        console.error('❌ خطأ: لا يوجد clientId في الفاتورة!')
        console.error('بيانات الفاتورة الكاملة:', invoice)
        return
      }
      
      if (invoice.type === 'sales') {
        // فاتورة مبيعات: نخصم من رصيد العميل الدائن أو نضيف للمدين
        const customers = JSON.parse(localStorage.getItem('customers') || '[]')
        console.log('📊 قائمة العملاء:', customers.length, 'عميل')
        
        const customerIndex = customers.findIndex(c => c.id === entityId)
        console.log('🔍 البحث عن العميل:', entityId, '→ الموقع:', customerIndex)
        
        if (customerIndex !== -1) {
          const customer = customers[customerIndex]
          
          // التأكد من أن الرصيد رقم صحيح (القيمة الافتراضية صفر)
          const currentBalance = parseFloat(customer.balance) || 0
          
          console.log('📋 بيانات العميل:', {
            name: customer.name,
            currentBalance: currentBalance,
            invoiceAmount: amount
          })
          
          /**
           * المنطق:
           * - رصيد سالب (-250) = العميل دائن لنا (نحن ندين له)
           * - فاتورة مبيعات (+200) = العميل يشتري منا
           * - نخصم من دينه: -250 + 200 = -50
           * 
           * - رصيد صفر (0) = لا يوجد رصيد
           * - فاتورة مبيعات (+200) = العميل يشتري منا
           * - يصبح مديناً: 0 + 200 = +200 (مدين لنا)
           * 
           * - رصيد موجب (+100) = العميل مدين لنا
           * - فاتورة مبيعات (+200) = العميل يشتري منا
           * - يزيد دينه: 100 + 200 = +300 (مدين لنا)
           */
          const newBalance = currentBalance + amount
          
          // تحديث الرصيد في القائمة
          customers[customerIndex].balance = newBalance
          
          console.log(`📝 قبل الحفظ - الرصيد الجديد: ${newBalance}`)
          
          // حفظ القائمة المحدثة
          const saveResult = localStorage.setItem('customers', JSON.stringify(customers))
          console.log(`💾 نتيجة الحفظ:`, saveResult === undefined ? 'نجح' : 'فشل')
          
          console.log(`✅ تم حفظ الرصيد الجديد في localStorage`)
          
          // Verify the save
          const verifyCustomers = JSON.parse(localStorage.getItem('customers') || '[]')
          const verifyCustomer = verifyCustomers.find(c => c.id === entityId)
          console.log('🔍 التحقق من الحفظ - الرصيد الآن:', verifyCustomer?.balance)
          
          // تسجيل قيد محاسبي للخصم من الرصيد
          const customerAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
            .find(acc => acc.linkedEntityType === 'customer' && acc.linkedEntityId === entityId)
          
          if (customerAccount) {
            const balanceReference = `BAL-DED-${invoice.invoiceNumber}`
            const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]')
            
            // التحقق من عدم وجود قيد خصم رصيد نشط (غير معكوس) بنفس المرجع
            const existingBalanceEntry = journalEntries.find(entry => entry.reference === balanceReference)
            const hasReversalEntry = journalEntries.find(entry => entry.reference === `REV-${balanceReference}`)
            
            // إذا كان القيد موجود ولم يتم عكسه، فهو مكرر
            if (existingBalanceEntry && !hasReversalEntry) {
              console.warn('⚠️ قيد خصم الرصيد موجود مسبقاً ونشط (لم يتم عكسه):', balanceReference)
            } else {
              if (existingBalanceEntry && hasReversalEntry) {
                console.log('✅ قيد خصم الرصيد القديم تم عكسه، يمكن إنشاء قيد جديد:', balanceReference)
              }
              
              const journalEntry = {
                date: new Date().toISOString().split('T')[0],
                description: `خصم من رصيد العميل - فاتورة رقم ${invoice.invoiceNumber}`,
                reference: balanceReference,
                lines: [
                  {
                    accountCode: customerAccount.code,
                    accountName: customerAccount.name,
                    debit: 0,
                    credit: amount,
                    description: 'خصم من رصيد العميل'
                  },
                  {
                    accountCode: '1101',
                    accountName: 'المذمم - العملاء',
                    debit: amount,
                    credit: 0,
                    description: 'تسديد من الرصيد'
                  }
                ]
              }
              
              const newEntry = {
                id: Date.now().toString(),
                entryNumber: journalEntries.length + 1,
                createdAt: new Date().toISOString(),
                ...journalEntry
              }
              journalEntries.push(newEntry)
              localStorage.setItem('journalEntries', JSON.stringify(journalEntries))
              console.log('✅ تم إنشاء قيد خصم الرصيد:', balanceReference)
            }
          }
          
          console.log(`✅ تم تحديث رصيد العميل: ${currentBalance.toFixed(3)} → ${newBalance.toFixed(3)} د.ك`)
          
          // Trigger storage event immediately
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new Event('accountingDataUpdated'))
        } else {
          console.error('❌ لم يتم العثور على العميل في القائمة')
        }
      } else if (invoice.type === 'purchase') {
        // فاتورة مشتريات: نخصم من رصيد المورد
        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]')
        const supplierIndex = suppliers.findIndex(s => s.id === entityId)
        
        if (supplierIndex !== -1) {
          const supplier = suppliers[supplierIndex]
          
          // التأكد من أن الرصيد رقم صحيح (القيمة الافتراضية صفر)
          const currentBalance = parseFloat(supplier.balance) || 0
          
          /**
           * المنطق:
           * - رصيد موجب (+500) = المورد دائن لنا (نحن ندين له)
           * - فاتورة مشتريات (-200) = نشتري منه
           * - نخصم من دينه: 500 - 200 = 300
           * 
           * - رصيد صفر (0) = لا يوجد رصيد
           * - فاتورة مشتريات (-200) = نشتري منه
           * - يصبح دائناً: 0 - 200 = -200 (مدين لنا - حالة نادرة)
           */
          const newBalance = currentBalance - amount
          
          suppliers[supplierIndex].balance = newBalance
          localStorage.setItem('suppliers', JSON.stringify(suppliers))
          
          // تسجيل قيد محاسبي للخصم من الرصيد
          const supplierAccount = JSON.parse(localStorage.getItem('accounts') || '[]')
            .find(acc => acc.linkedEntityType === 'supplier' && acc.linkedEntityId === entityId)
          
          if (supplierAccount) {
            const balanceReference = `BAL-DED-${invoice.invoiceNumber}`
            const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]')
            
            // التحقق من عدم وجود قيد خصم رصيد نشط (غير معكوس) بنفس المرجع
            const existingBalanceEntry = journalEntries.find(entry => entry.reference === balanceReference)
            const hasReversalEntry = journalEntries.find(entry => entry.reference === `REV-${balanceReference}`)
            
            // إذا كان القيد موجود ولم يتم عكسه، فهو مكرر
            if (existingBalanceEntry && !hasReversalEntry) {
              console.warn('⚠️ قيد خصم الرصيد موجود مسبقاً ونشط (لم يتم عكسه):', balanceReference)
            } else {
              if (existingBalanceEntry && hasReversalEntry) {
                console.log('✅ قيد خصم الرصيد القديم تم عكسه، يمكن إنشاء قيد جديد:', balanceReference)
              }
              
              const journalEntry = {
                date: new Date().toISOString().split('T')[0],
                description: `خصم من رصيد المورد - فاتورة رقم ${invoice.invoiceNumber}`,
                reference: balanceReference,
                lines: [
                  {
                    accountCode: supplierAccount.code,
                    accountName: supplierAccount.name,
                    debit: amount,
                    credit: 0,
                    description: 'خصم من رصيد المورد'
                  },
                  {
                    accountCode: '2101',
                    accountName: 'الدائنون - الموردين',
                    debit: 0,
                    credit: amount,
                    description: 'تسديد من الرصيد'
                  }
                ]
              }
              
              const newEntry = {
                id: Date.now().toString(),
                entryNumber: journalEntries.length + 1,
                createdAt: new Date().toISOString(),
                ...journalEntry
              }
              journalEntries.push(newEntry)
              localStorage.setItem('journalEntries', JSON.stringify(journalEntries))
              console.log('✅ تم إنشاء قيد خصم الرصيد:', balanceReference)
            }
          }
          
          console.log(`✅ تم تحديث رصيد المورد: ${currentBalance.toFixed(3)} → ${newBalance.toFixed(3)} د.ك`)
          
          // Trigger storage event immediately
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new Event('accountingDataUpdated'))
        } else {
          console.error('❌ لم يتم العثور على المورد في القائمة')
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ في خصم من الرصيد:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.clientId) {
      showNotification(t('selectClientSupplier'), 'error')
      return
    }

    // 🔥 التحقق من اختيار حالة الدفع
    if (!formData.paymentStatus) {
      setModalError(language === 'ar' ? 'يرجى اختيار حالة الدفع' : 'Please select payment status')
      return
    }

    // Filter valid items
    const validItems = formData.items.filter(item => 
      item.itemName && item.quantity > 0 && item.unitPrice > 0
    )

    if (validItems.length === 0) {
      setModalError(t('addAtLeastOneItem'))
      return
    }

    // Clear any previous error
    setModalError(null)

    // Check inventory for sales invoices
    if (formData.type === 'sales') {
      const inventoryItems = getInventoryItems()
      
      // جمع الكميات للمنتجات المكررة في نفس الفاتورة الجديدة
      const productQuantities = {}
      validItems.forEach(item => {
        if (productQuantities[item.itemName]) {
          productQuantities[item.itemName] += parseFloat(item.quantity) || 0
        } else {
          productQuantities[item.itemName] = parseFloat(item.quantity) || 0
        }
      })
      
      // إذا كان هذا تعديل فاتورة، احسب الفرق في الاستهلاك فقط
      if (editingInvoice && editingInvoice.type === 'sales') {
        // جمع كميات المنتجات من الفاتورة الأصلية
        const originalProductQuantities = {}
        editingInvoice.items.forEach(item => {
          if (originalProductQuantities[item.itemName]) {
            originalProductQuantities[item.itemName] += parseFloat(item.quantity) || 0
          } else {
            originalProductQuantities[item.itemName] = parseFloat(item.quantity) || 0
          }
        })
        
        // التحقق من المخزون بناءً على الفرق في الاستهلاك لكل منتج
        for (const [productName, newQuantity] of Object.entries(productQuantities)) {
          const originalQuantity = originalProductQuantities[productName] || 0
          const quantityDifference = newQuantity - originalQuantity // الفرق في الاستهلاك
          
          const inventoryItem = inventoryItems.find(inv => inv.name === productName)
          
          if (!inventoryItem) {
            setModalError(`المنتج ${productName} غير موجود في المخزون`)
            return
          }
          
          // إذا كان الفرق موجب (زيادة في الاستهلاك)، تحقق من توفر الكمية الإضافية
          if (quantityDifference > 0) {
            const currentQty = parseFloat(inventoryItem.quantity) || 0
            if (currentQty < quantityDifference) {
              setModalError(
                `الكمية الإضافية المطلوبة من ${productName} غير متوفرة في المخزون\n` +
                `الزيادة المطلوبة: ${quantityDifference} • المتوفر: ${currentQty}`
              )
              return
            }
          }
          // إذا كان الفرق سالب أو صفر (تقليل أو بقاء نفس الكمية)، لا حاجة للتحقق
        }
      } else {
        // فاتورة جديدة - التحقق العادي من المخزون
        for (const [productName, totalQuantity] of Object.entries(productQuantities)) {
          const inventoryItem = inventoryItems.find(inv => inv.name === productName)
          if (inventoryItem && inventoryItem.quantity < totalQuantity) {
            setModalError(
              `الكمية الإجمالية المطلوبة من ${productName} غير متوفرة في المخزون\n` +
              `المطلوب: ${totalQuantity} • المتوفر: ${inventoryItem.quantity}`
            )
            return
          } else if (!inventoryItem) {
            setModalError(`المنتج ${productName} غير موجود في المخزون`)
            return
          }
        }
      }
    }

    // Ensure totals are freshly calculated from the validated items before saving
    const invoiceData = calculateTotals({
      ...formData,
      items: validItems
    })

    try {
      let result
      if (editingInvoice) {
        console.log('✏️ تعديل فاتورة موجودة:', editingInvoice.invoiceNumber)
        
        if (editingInvoice.type === 'purchase') {
          // فواتير المشتريات: لا يمكن تعديلها، فقط الملاحظات
          console.log('📝 تعديل ملاحظات فاتورة المشتريات فقط')
          result = updateInvoice(editingInvoice.id, {
            ...editingInvoice,
            notes: formData.notes,
          })
          
          if (result.success) {
            console.log('✅ تم تحديث ملاحظات فاتورة المشتريات بنجاح')
          }
        } else if (editingInvoice.type === 'sales') {
          // فواتير المبيعات: يمكن تعديلها بالكامل
          console.log('🔄 تعديل كامل لفاتورة المبيعات')
          
          // 1. عكس تأثير الفاتورة القديمة على المخزون
          console.log('📦 عكس تأثير الفاتورة القديمة على المخزون')
          editingInvoice.items.forEach(item => {
            const inventoryItems = getInventoryItems()
            const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
            if (inventoryItem) {
              const currentQty = parseFloat(inventoryItem.quantity) || 0
              const oldItemQty = parseFloat(item.quantity) || 0
              const newQuantity = currentQty + oldItemQty // إرجاع الكمية القديمة للمخزون
              
              updateInventoryItem(inventoryItem.id, {
                ...inventoryItem,
                quantity: newQuantity
              })
              console.log(`  - ${item.itemName}: ${currentQty} -> ${newQuantity} (إرجاع ${oldItemQty})`)
            }
          })
          
          // 2. عكس القيود المحاسبية القديمة
          console.log('📊 عكس القيود المحاسبية القديمة')
          reverseJournalEntriesForInvoice(editingInvoice)
          
          // 3. تطبيق الفاتورة الجديدة
          console.log('✨ تطبيق الفاتورة المعدلة الجديدة')
          result = updateInvoice(editingInvoice.id, invoiceData)
          
          if (result.success) {
            // 4. تطبيق تأثير الفاتورة الجديدة على المخزون
            console.log('📦 تطبيق تأثير الفاتورة الجديدة على المخزون (خصم من المخزون)')
            updateInventoryForSale(validItems)
            
            // 5. تسجيل القيود المحاسبية الجديدة
            console.log('📊 تسجيل القيود المحاسبية الجديدة')
            if (formData.recordPaymentNow && formData.paymentBankAccountId) {
              recordImmediatePayment(result.data)
            }
            
            if (formData.deductFromBalance) {
              deductFromBalance(result.data)
            }
            
            console.log('✅ تم تحديث فاتورة المبيعات بنجاح')
          }
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
          
          // ملاحظة: لا نحتاج لاستدعاء recordImmediatePayment هنا
          // لأن القيد المحاسبي التلقائي (INV-) يتضمن بالفعل حساب الخزينة/البنك
          // عندما تكون الفاتورة مدفوعة (paymentStatus: 'paid')
          
          // ❌ تم إزالة خيار "خصم من الرصيد الابتدائي" - غير منطقي محاسبياً
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
      console.error('❌ خطأ في معالجة الفاتورة:', err)
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
    // ✅ 1. التحقق من أن الفاتورة ليست مرتجع (المرتجعات لا يمكن حذفها)
    if (invoice.isReturn) {
      alert(
        language === 'ar'
          ? '❌ لا يمكن حذف المرتجعات!\n\nالمرتجعات لا تحتوي على زر حذف ولا يمكن حذفها.'
          : '❌ Cannot delete returns!\n\nReturns do not have a delete button and cannot be deleted.'
      )
      return
    }
    
    // ✅ 2. التحقق من عدم وجود مرتجعات مرتبطة بالفاتورة
    const relatedReturns = invoices.filter(inv => 
      inv.isReturn && inv.originalInvoiceId === invoice.id
    )
    
    if (relatedReturns.length > 0) {
      alert(
        language === 'ar'
          ? `❌ لا يمكن حذف هذه الفاتورة!\n\nيوجد ${relatedReturns.length} مرتجع مرتبط بهذه الفاتورة.\nيجب حذف المرتجعات أولاً قبل حذف الفاتورة الأصلية.`
          : `❌ Cannot delete this invoice!\n\nThere are ${relatedReturns.length} return(s) linked to this invoice.\nYou must delete the returns first before deleting the original invoice.`
      )
      return
    }
    
    // ✅ 3. التحقق من توفر الكميات في المخزون (فقط لفواتير المشتريات)
    if (invoice.type === 'purchase' && invoice.items && invoice.items.length > 0) {
      const inventoryItems = getInventoryItems()
      const insufficientItems = []
      
      invoice.items.forEach(item => {
        const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
        if (inventoryItem) {
          const currentQty = parseFloat(inventoryItem.quantity) || 0
          const itemQty = parseFloat(item.quantity) || 0
          
          // عند حذف فاتورة مشتريات، سنخصم الكمية من المخزون
          // لذلك يجب التأكد من توفر الكمية
          if (currentQty < itemQty) {
            insufficientItems.push({
              name: item.itemName,
              required: itemQty,
              available: currentQty,
              shortage: itemQty - currentQty
            })
          }
        }
      })
      
      if (insufficientItems.length > 0) {
        const itemsList = insufficientItems.map(item => 
          `• ${item.name}: متوفر ${item.available} (مطلوب ${item.required}) - نقص: ${item.shortage}`
        ).join('\n')
        
        alert(
          language === 'ar'
            ? `❌ لا يمكن حذف فاتورة المشتريات!\n\nالأصناف التالية غير متوفرة بالكميات المطلوبة:\n\n${itemsList}\n\nيجب توفر الكمية في المخزون قبل الحذف.`
            : `❌ Cannot delete purchase invoice!\n\nThe following items are not available in sufficient quantities:\n\n${itemsList}\n\nQuantities must be available in inventory before deletion.`
        )
        return
      }
    }
    
    // ✅ 4. تأكيد الحذف من المستخدم
    const confirmMessage = language === 'ar'
      ? `هل أنت متأكد من حذف الفاتورة "${invoice.invoiceNumber}"؟\n\nسيتم:\n• عكس القيود المحاسبية\n• ${invoice.type === 'sales' ? 'إضافة الكميات إلى' : 'خصم الكميات من'} المخزون\n• حذف الفاتورة نهائياً`
      : `Are you sure you want to delete invoice "${invoice.invoiceNumber}"?\n\nThis will:\n• Reverse accounting entries\n• ${invoice.type === 'sales' ? 'Add quantities to' : 'Deduct quantities from'} inventory\n• Delete the invoice permanently`
    
    if (window.confirm(confirmMessage)) {
      console.log('🗑️ حذف الفاتورة:', invoice.invoiceNumber)
      
      // 5. عكس القيود المحاسبية المرتبطة بالفاتورة
      reverseJournalEntriesForInvoice(invoice)
      
      // 6. عكس تأثير المخزون
      reverseInventoryEffectsOnDelete(invoice)
      
      // 7. حذف الفاتورة
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

  // 🆕 فتح نموذج إرجاع الفاتورة
  const openReturnModal = (invoice) => {
    console.log('🔄 فتح نموذج إرجاع للفاتورة:', invoice.invoiceNumber)
    
    // 🔥 حساب الكميات المرتجعة سابقاً من هذه الفاتورة
    const previousReturns = invoices.filter(inv => 
      inv.isReturn && 
      inv.originalInvoiceId === invoice.id
    )
    
    // إعداد عناصر الإرجاع مع الكميات القابلة للإرجاع
    const items = (invoice.items || []).map(item => {
      const originalQty = parseFloat(item.quantity) || 0
      
      // حساب الكمية المرتجعة سابقاً من هذا المنتج
      let returnedQty = 0
      previousReturns.forEach(returnInv => {
        const returnedItem = (returnInv.items || []).find(ri => ri.itemName === item.itemName)
        if (returnedItem) {
          returnedQty += parseFloat(returnedItem.quantity) || 0
        }
      })
      
      // الكمية المتاحة للإرجاع = الأصلية - المرتجعة سابقاً
      const availableToReturn = Math.max(0, originalQty - returnedQty)
      
      return {
        ...item,
        returnQuantity: 0, // الكمية المراد إرجاعها الآن
        maxQuantity: availableToReturn, // ✅ الكمية المتاحة للإرجاع (بعد طرح المرتجع سابقاً)
        originalQuantity: originalQty, // الكمية الأصلية
        previouslyReturned: returnedQty, // الكمية المرتجعة سابقاً
        canReturn: availableToReturn > 0
      }
    })
    
    setReturningInvoice(invoice)
    setReturnItems(items)
    setReturnReason('')
    setShowReturnModal(true)
  }

  // 🆕 معالجة إرجاع الفاتورة
  const handleReturnInvoice = async () => {
    if (!returningInvoice) return

    // التحقق من وجود عناصر للإرجاع
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0)
    
    if (itemsToReturn.length === 0) {
      setModalError(language === 'ar' ? 'يرجى تحديد كمية للإرجاع' : 'Please specify quantity to return')
      return
    }

    // التحقق من المخزون حسب نوع الفاتورة
    const inventoryItems = getInventoryItems()
    
    console.log('🔍 التحقق من توفر المنتجات في المخزون...')
    console.log(`📋 نوع الفاتورة: ${returningInvoice.type}`)
    
    for (const item of itemsToReturn) {
      const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
      
      if (returningInvoice.type === 'purchase') {
        // إرجاع مشتريات: يجب أن تتوفر الكمية في المخزون (سنخصم منه ونسترجع المال)
        if (!inventoryItem) {
          setModalError(`❌ المنتج "${item.itemName}" غير موجود في المخزون`)
          console.error(`❌ المنتج "${item.itemName}" غير موجود في المخزون`)
          return
        }
        
        const availableQty = parseFloat(inventoryItem.quantity) || 0
        if (availableQty < item.returnQuantity) {
          setModalError(
            `❌ الكمية المتوفرة من "${item.itemName}" غير كافية للإرجاع للمورد\n` +
            `المطلوب: ${item.returnQuantity} • المتوفر: ${availableQty}`
          )
          console.error(`❌ ${item.itemName}: مطلوب ${item.returnQuantity} لكن متوفر ${availableQty}`)
          return
        }
        
        console.log(`  ✅ ${item.itemName}: متوفر ${availableQty} (مطلوب ${item.returnQuantity})`)
      } else if (returningInvoice.type === 'sales') {
        // إرجاع مبيعات: لا نحتاج للتحقق لأننا سنضيف للمخزون
        console.log(`  ℹ️ ${item.itemName}: إرجاع مبيعات - سيتم إضافة ${item.returnQuantity} للمخزون`)
      }
    }
    
    console.log('✅ التحقق من المخزون اكتمل بنجاح')

    // حساب إجمالي الإرجاع
    const returnTotal = itemsToReturn.reduce((sum, item) => {
      const originalQty = parseFloat(item.originalQuantity) || parseFloat(item.quantity) || 1
      const returnQty = item.returnQuantity
      const unitPrice = parseFloat(item.unitPrice) || 0
      const originalDiscount = parseFloat(item.discount) || 0
      
      // حساب الخصم النسبي للكمية المرتجعة
      // إذا كانت الكمية الأصلية 3 والخصم 3، والمرتجع 1، فالخصم المرتجع = 3 × (1/3) = 1
      const proportionalDiscount = originalQty > 0 ? (originalDiscount * returnQty) / originalQty : 0
      
      const itemSubtotal = returnQty * unitPrice
      const itemTotal = itemSubtotal - proportionalDiscount
      
      console.log(`📦 حساب المرتجع - ${item.itemName}:`, {
        originalQty,
        returnQty,
        unitPrice,
        originalDiscount,
        proportionalDiscount,
        itemSubtotal,
        itemTotal
      })
      
      return sum + itemTotal
    }, 0)

    try {
      console.log('🔄 بدء عملية الإرجاع للفاتورة:', returningInvoice.invoiceNumber)
      console.log(`💰 المبلغ الإجمالي للفاتورة الأصلية: ${returningInvoice.total.toFixed(3)} د.ك`)
      console.log(`� المبلغ المرتجع: ${returnTotal.toFixed(3)} د.ك`)
      
      // إنشاء فاتورة إرجاع مع قيود محاسبية للمبلغ المرتجع فقط
      console.log('📝 إنشاء فاتورة إرجاع مع قيود محاسبية')
      const returnInvoiceData = {
        type: returningInvoice.type,
        clientId: returningInvoice.clientId,
        clientName: returningInvoice.clientName,
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: `RET-${returningInvoice.invoiceNumber}`,
        originalInvoiceNumber: returningInvoice.invoiceNumber,
        originalInvoiceId: returningInvoice.id, // 🆕 ربط بالفاتورة الأصلية بالـ ID
        isReturn: true,
        returnReason: returnReason,
        items: itemsToReturn.map(item => {
          // حساب الإجمالي لكل صنف مع الخصم النسبي
          const originalQty = parseFloat(item.originalQuantity) || parseFloat(item.quantity) || 1
          const returnQty = item.returnQuantity
          const unitPrice = parseFloat(item.unitPrice) || 0
          const originalDiscount = parseFloat(item.discount) || 0
          
          // حساب الخصم النسبي للكمية المرتجعة
          const proportionalDiscount = originalQty > 0 ? (originalDiscount * returnQty) / originalQty : 0
          
          const itemSubtotal = returnQty * unitPrice
          const itemTotal = itemSubtotal - proportionalDiscount
          
          return {
            ...item,
            quantity: returnQty,
            discount: proportionalDiscount,  // ✅ الخصم النسبي
            total: itemTotal  // ✅ تعيين الإجمالي بشكل صحيح
          }
        }),
        subtotal: returnTotal,
        discount: 0,
        discountAmount: 0,
        vatAmount: 0,
        total: returnTotal,
        paymentStatus: 'n/a', // 🔥 فواتير المرتجع لا تحتاج حالة دفع
        paidAmount: 0, // لا يوجد مبلغ مدفوع في المرتجعات
        createJournalEntry: true, // ✅ ننشئ قيود للمبلغ المرتجع
        paymentMethod: returningInvoice.paymentMethod || 'cash',
        paymentBankAccountId: returningInvoice.paymentBankAccountId || null
      }

      const result = addInvoice(returnInvoiceData)
      
      if (result.success) {
        console.log('✅ تم إنشاء فاتورة الإرجاع بنجاح')
        console.log('📊 تم إنشاء قيود محاسبية للمبلغ المرتجع')
        
        // تحديث المخزون حسب نوع الفاتورة
        console.log('📦 تحديث المخزون')
        
        if (returningInvoice.type === 'purchase') {
          // إرجاع مشتريات: خصم من المخزون (نرجع للمورد) + زيادة الرصيد
          console.log('  📦 إرجاع مشتريات: خصم من المخزون')
          itemsToReturn.forEach(item => {
            const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
            if (inventoryItem) {
              const oldQty = parseFloat(inventoryItem.quantity) || 0
              const newQty = Math.max(0, oldQty - item.returnQuantity)
              updateInventoryItem(inventoryItem.id, { ...inventoryItem, quantity: newQty })
              console.log(`    📦 ${item.itemName}: ${oldQty} -> ${newQty} (-${item.returnQuantity})`)
            }
          })
          console.log(`  💰 زيادة رصيد الخزينة/البنوك: +${returnTotal.toFixed(3)} د.ك`)
        } else if (returningInvoice.type === 'sales') {
          // إرجاع مبيعات: إضافة للمخزون (يرجع من العميل) + تقليل الرصيد
          console.log('  📦 إرجاع مبيعات: إضافة للمخزون')
          itemsToReturn.forEach(item => {
            const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName)
            if (inventoryItem) {
              const oldQty = parseFloat(inventoryItem.quantity) || 0
              const newQty = oldQty + item.returnQuantity
              updateInventoryItem(inventoryItem.id, { ...inventoryItem, quantity: newQty })
              console.log(`    📦 ${item.itemName}: ${oldQty} -> ${newQty} (+${item.returnQuantity})`)
            }
          })
          console.log(`  � تقليل رصيد الخزينة/البنوك: -${returnTotal.toFixed(3)} د.ك`)
        }

        console.log('✅ عملية الإرجاع اكتملت بنجاح')
        
        // 4. إغلاق النموذج وإظهار رسالة نجاح
        setShowReturnModal(false)
        showNotification(
          language === 'ar' 
            ? `✅ تم إنشاء فاتورة إرجاع رقم ${result.data.invoiceNumber}` 
            : `✅ Return invoice ${result.data.invoiceNumber} created successfully`
        )
        refreshAllData()
      } else {
        console.error('❌ فشل في إنشاء فاتورة الإرجاع:', result.error)
        setModalError(result.error)
      }
    } catch (err) {
      console.error('❌ خطأ في معالجة الإرجاع:', err)
      setModalError(language === 'ar' ? 'حدث خطأ في معالجة الإرجاع' : 'Error processing return')
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

      // If a client/supplier was selected from suggestions, filter by their id
      const matchesSelectedCounterparty = !selectedCounterpartyId || invoice.clientId === selectedCounterpartyId
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || 
        (invoice.paymentStatus || 'paid') === filterStatus
      
      // Type filter
      const matchesType = filterType === 'all' || invoice.type === filterType
      
      return matchesTab && matchesSearch && matchesStatus && matchesType && matchesSelectedCounterparty
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
            {/* Suggestions dropdown for clients/suppliers */}
            {suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map(s => (
                  <div
                    key={s.id}
                    className="suggestion-item"
                    onClick={() => {
                      setSearchTerm(s.name)
                      setSelectedCounterpartyId(s.id)
                      setSuggestions([])
                      // prevent the suggestions effect from immediately repopulating
                      setSuppressSuggestions(true)
                    }}
                  >
                    <strong>{s.name}</strong> <span className="suggestion-type">{s.type === 'customer' ? t('client') : t('supplier')}</span>
                  </div>
                ))}
              </div>
            )}
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
              <option value="partial">{language === 'ar' ? 'مدفوعة جزئياً' : 'Partial'}</option>
              <option value="pending">{language === 'ar' ? 'آجل' : 'Credit'}</option>
              <option value="overdue">{language === 'ar' ? 'متأخر السداد' : 'Overdue'}</option>
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
          <table className="invoices-table">
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
                    <span className={`invoice-type ${invoice.type} ${invoice.isReturn ? 'return' : ''}`}>
                      {invoice.isReturn 
                        ? (invoice.type === 'sales' 
                            ? (language === 'ar' ? 'مرتجع مبيعات' : 'Sales Return') 
                            : (language === 'ar' ? 'مرتجع مشتريات' : 'Purchase Return'))
                        : (invoice.type === 'sales' ? t('sales') : t('purchase'))
                      }
                      {hasDiscount(invoice) && <span className="discount-indicator" title={t('hasDiscount')}> 📊</span>}
                      {hasVAT(invoice) && <span className="vat-indicator" title={t('hasVAT')}> 💰</span>}
                    </span>
                  </td>
                  <td>{invoice.clientName}</td>
                  <td>
                    <span className="invoice-datetime" dir="ltr">
                      {new Date(invoice.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      <small className="invoice-time">
                        {new Date(invoice.date).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </small>
                    </span>
                  </td>
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
                    {invoice.isReturn ? (
                      <span className="payment-status neutral">
                        {language === 'ar' ? 'مرتجع' : 'Return'}
                      </span>
                    ) : (
                      <span className={`payment-status ${invoice.paymentStatus || 'paid'}`}>
                        {invoice.paymentStatus === 'paid' && t('paid')}
                        {invoice.paymentStatus === 'partial' && (language === 'ar' ? 'مدفوعة جزئياً' : 'Partial')}
                        {invoice.paymentStatus === 'pending' && (language === 'ar' ? 'آجل' : 'Credit')}
                        {invoice.paymentStatus === 'overdue' && (language === 'ar' ? 'متأخر السداد' : 'Overdue')}
                        {invoice.paymentStatus === 'n/a' && (language === 'ar' ? 'غير متاح' : 'N/A')}
                        {!invoice.paymentStatus && t('paid')}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasPermission('edit_invoices') && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openModal(invoice)}
                        >
                          {invoice.type === 'sales' && !invoice.isReturn ? '✏️ ' : ''}{language === 'ar' ? 'عرض/تعديل' : 'View/Edit'}
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
                      {hasPermission('delete_invoices') && !invoice.isReturn && (
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => openReturnModal(invoice)}
                          style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}
                        >
                          🔄 {language === 'ar' ? 'إرجاع' : 'Return'}
                        </button>
                      )}
                      {/* زر الحذف: يظهر فقط للفواتير الأصلية وليس للمرتجعات */}
                      {hasPermission('delete_invoices') && !invoice.isReturn && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(invoice)}
                        >
                          🗑️ {language === 'ar' ? 'حذف' : 'Delete'}
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
              <h2>{editingInvoice ? `${language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'} ${editingInvoice.invoiceNumber}` : t('createNewInvoice')}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            {/* تنبيه عند عرض فاتورة موجودة */}
            {editingInvoice && (
              <div style={{
                backgroundColor: '#d1ecf1',
                border: '1px solid #17a2b8',
                borderRadius: '8px',
                padding: '12px 16px',
                margin: '0 20px 15px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <span style={{ fontSize: '20px' }}>👁️</span>
                <div style={{ flex: 1, fontSize: '14px', color: '#0c5460' }}>
                  <strong>{language === 'ar' ? 'عرض الفاتورة:' : 'View Invoice:'}</strong>
                  {' '}
                  {language === 'ar' 
                    ? 'هذه الفاتورة للعرض فقط. يمكنك عرض التفاصيل وتعديل الملاحظات فقط. لإجراء تغييرات، يرجى استخدام خيار "إرجاع".'
                    : 'This invoice is view-only. You can view details and edit notes only. To make changes, please use "Return" option.'
                  }
                </div>
              </div>
            )}
            
            {/* Error Message Display */}
            {modalError && (
              <div className="modal-error-message">
                <div className="error-content">
                  <i className="error-icon">⚠️</i>
                  <span className="error-text">{modalError}</span>
                  <button 
                    className="error-close" 
                    onClick={() => setModalError(null)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            <div className="invoice-modal-body">
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
                      disabled={editingInvoice}
                    >
                      <option value="">{formData.type === 'sales' ? t('selectClient') : t('selectSupplier')}</option>
                      {(formData.type === 'sales' ? customers : suppliers).map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date and Payment Row */}
                <div className="date-payment-row">
                  <div className="form-group">
                    <label>{t('invoiceDate')} *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                      disabled={editingInvoice}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('dueDate')}</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      disabled={editingInvoice}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('paymentStatus')} *</label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      required
                      disabled={editingInvoice}
                    >
                      <option value="">{language === 'ar' ? '-- اختر حالة الدفع --' : '-- Select Payment Status --'}</option>
                      <option value="paid">{t('paid')}</option>
                      <option value="partial">{language === 'ar' ? 'مدفوعة جزئياً' : 'Partial'}</option>
                      <option value="pending">{language === 'ar' ? 'آجل' : 'Credit'}</option>
                      <option value="overdue">{language === 'ar' ? 'متأخر السداد' : 'Overdue'}</option>
                    </select>
                  </div>
                </div>

              {/* Invoice Items */}
              <div className="invoice-items">
                <div className="items-header">
                  <h3>{t('invoiceItems')}</h3>
                </div>

                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{width: '50px', textAlign: 'center'}}>#</th>
                        <th>{t('products')}</th>
                        <th>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{language === 'ar' ? 'الإضافات' : 'Extras'}</span>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} title={language === 'ar' ? 'إظهار حقل الإضافات عند الطباعة' : 'Show extras field on printed invoice'}>
                              <input
                                type="checkbox"
                                checked={!!formData.showColorInPrint}
                                onChange={() => setFormData(prev => ({ ...prev, showColorInPrint: !prev.showColorInPrint }))}
                              />
                            </label>
                          </div>
                        </th>
                        <th>{t('quantity')}</th>
                        {/* Expiry column removed */}
                        <th>
                          {formData.type === 'purchase' 
                            ? (language === 'ar' ? 'سعر الشراء' : 'Purchase Price')
                            : (language === 'ar' ? 'سعر البيع' : 'Selling Price')
                          }
                        </th>
                        <th>{t('itemDiscount')}</th>
                        {/* Expiry Date column removed for purchase invoices */}
                        <th>{t('total')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td style={{textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8f9fa'}}>
                            {index + 1}
                          </td>
                          <td>
                            <div 
                              className="product-select-container"
                              ref={el => dropdownRefs.current[index] = el}
                              style={{ position: 'relative' }}
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
                                  disabled={editingInvoice}
                                  style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                  title={editingInvoice ? (language === 'ar' ? 'الفاتورة للعرض فقط' : 'Invoice is view-only') : ''}
                                />
                              </div>
                            </div>
                          </td>
                          {/* Color Selection Column */}
                          <td>
                            {formData.type === 'purchase' ? (
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  value={item.colorPrice || 0}
                                  onChange={(e) => updateItem(index, 'colorPrice', parseFloat(e.target.value) || 0)}
                                  placeholder={language === 'ar' ? 'سعر إضافي' : 'Extra cost'}
                                  min="0"
                                  step="0.25"
                                  className="custom-price-compact"
                                  title={language === 'ar' ? 'سعر إضافي' : 'Extra cost'}
                                  disabled={editingInvoice}
                                  style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                />
                              </div>
                            ) : (
                              <div className="color-select-container">
                                {/* Custom Color Input - Always Visible for All Items in Sales */}
                                <div className="custom-color-compact">
                                  <input
                                    type="text"
                                    value={item.customColorName || ''}
                                    onChange={(e) => updateItem(index, 'customColorName', e.target.value)}
                                    placeholder={language === 'ar' ? 'اسم اللون' : 'Color name'}
                                    className="custom-input-compact"
                                    disabled={editingInvoice}
                                    style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
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
                                    disabled={editingInvoice}
                                    style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                  />
                                </div>
                              
                                {/* Color Price Display */}
                                {item.customColorName && item.colorPrice > 0 && (
                                  <div className="color-price-compact">
                                    +{item.colorPrice} {t('currency')}
                                  </div>
                                )}
                              </div>
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
                              disabled={editingInvoice}
                              style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                              title={editingInvoice ? (language === 'ar' ? 'الفاتورة للعرض فقط' : 'Invoice is view-only') : ''}
                            />
                          </td>
                          {/* expiry inputs removed */}
                          <td>
                            <div className="price-display">
                              <input
                                type="number"
                                value={(parseFloat(item.unitPrice) || 0) + (parseFloat(item.colorPrice) || 0)}
                                min="0"
                                step="0.25"
                                placeholder="0"
                                readOnly
                                className="readonly-input price-input-main"
                              />
                              {item.colorPrice > 0 && formData.showColorInPrint && (
                                <div className="price-breakdown">
                                  <small className="base-price">
                                    {language === 'ar' ? 'الأساسي:' : 'Base:'} {parseFloat(item.unitPrice).toFixed(3)} {t('currency')}
                                  </small>
                                  <small className="color-price">
                                    {language === 'ar' ? 'الإضافات:' : 'Extras:'} +{parseFloat(item.colorPrice).toFixed(3)} {t('currency')}
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
                                step="0.001"
                                placeholder="0"
                                className="discount-input"
                                disabled={editingInvoice}
                                style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                title={editingInvoice ? (language === 'ar' ? 'الفاتورة للعرض فقط' : 'Invoice is view-only') : ''}
                              />
                              <select
                                value={item.discountType || 'amount'}
                                onChange={(e) => updateItem(index, 'discountType', e.target.value)}
                                className="discount-type-select"
                                disabled={editingInvoice}
                                style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                              >
                                <option value="amount">د.ك</option>
                                <option value="percentage">%</option>
                              </select>
                            </div>
                          </td>
                          {/* expiry date column removed for purchase invoices */}
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
                            <div className="action-buttons">
                              {/* إخفاء زر الحذف عند عرض فاتورة موجودة */}
                              {formData.items.length > 1 && !editingInvoice && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeItem(index)}
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
                </div>

                {/* زر إضافة عنصر - مخفي عند عرض فاتورة موجودة */}
                {!editingInvoice && (
                  <div style={{ marginTop: '10px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}>
                      ➕ {t('addItem')}
                    </button>
                  </div>
                )}

                {/* Product Search Dropdowns - خارج الجدول للظهور فوق كل شيء */}
                {Object.keys(searchResults).map(itemIndex => (
                  searchResults[itemIndex] && (
                    <div
                      key={itemIndex}
                      className="product-dropdown-overlay"
                      style={{
                        position: 'fixed',
                        top: getDropdownStyle(parseInt(itemIndex)).top || '50%',
                        left: getDropdownStyle(parseInt(itemIndex)).left || '50%',
                        width: getDropdownStyle(parseInt(itemIndex)).width || '300px',
                        backgroundColor: 'white',
                        border: '2px solid #007bff',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        zIndex: 999999,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '2px'
                      }}
                      ref={el => dropdownRefs.current[itemIndex] = el}
                    >
                      {searchResults[itemIndex].length > 0 ? (
                        searchResults[itemIndex].map(product => (
                          <div
                            key={product.id}
                            className="product-option"
                            onClick={() => selectProduct(parseInt(itemIndex), product)}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              backgroundColor: 'white'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              SKU: {product.sku}
                              <br />
                              {formData.type === 'purchase' ? (
                                <>
                                  <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                    شراء: {(product.purchasePrice || 0).toFixed(3)} {t('kwd')}
                                  </span>
                                  {product.price > 0 && (
                                    <span style={{ color: '#7f8c8d', marginLeft: '10px' }}>
                                      (بيع: {(product.price || product.unitPrice || 0).toFixed(3)})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                    بيع: {(product.price || product.unitPrice || 0).toFixed(3)} {t('kwd')}
                                  </span>
                                  {product.purchasePrice > 0 && (
                                    <span style={{ color: '#7f8c8d', marginLeft: '10px' }}>
                                      (شراء: {(product.purchasePrice || 0).toFixed(3)})
                                    </span>
                                  )}
                                </>
                              )}
                              {product.quantity !== undefined && (
                                product.quantity > 0 ? (
                                  <span style={{ color: 'green' }}> • متوفر: {product.quantity}</span>
                                ) : (
                                  <span style={{ color: 'red' }}> • غير متوفر</span>
                                )
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px 16px', color: '#666', textAlign: 'center' }}>
                          🔍 لا توجد منتجات
                        </div>
                      )}
                    </div>
                  )
                ))}

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
                          step="0.25"
                          placeholder="0"
                          className="compact-input"
                          disabled={editingInvoice}
                          style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                          title={editingInvoice ? (language === 'ar' ? 'الفاتورة للعرض فقط' : 'Invoice is view-only') : ''}
                        />
                        <select
                          className="compact-select"
                          value={formData.discountType}
                          onChange={(e) => updateInvoiceField('discountType', e.target.value)}
                          disabled={editingInvoice}
                          style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
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
                          disabled={editingInvoice}
                          style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                          title={editingInvoice ? (language === 'ar' ? 'الفاتورة للعرض فقط' : 'Invoice is view-only') : ''}
                        />
                        <select
                          className="compact-select"
                          value={formData.vatType}
                          onChange={(e) => updateInvoiceField('vatType', e.target.value)}
                          disabled={editingInvoice}
                          style={editingInvoice ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
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

              {/* Invoice Description - At the end */}
              <div className="form-group">
                <label>{t('invoiceDescription')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('invoiceDescriptionPlaceholder')}
                  rows="2"
                />
              </div>

              {!editingInvoice && (
                <>
                  {/* Compact Payment Options Dropdown Header */}
                  <div style={{ marginTop: '18px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPaymentOptions(prev => !prev)}
                      className="btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '2px solid #5a67d8',
                        background: 'linear-gradient(90deg,#6c5ce7,#a29bfe)',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      aria-expanded={showPaymentOptions}
                    >
                      ⚠️ خيارات الدفع والقيود
                      <span style={{ marginLeft: '6px', transform: showPaymentOptions ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </button>

                    {/* Summary badges when collapsed to save space */}
                    {!showPaymentOptions && (
                      <div style={{ display: 'inline-block', marginLeft: '12px', verticalAlign: 'middle' }}>
                        <span style={{ background: formData.recordPaymentNow ? '#2ecc71' : '#bdc3c7', color: 'white', padding: '6px 10px', borderRadius: '16px', fontWeight: 'bold', marginRight: '6px' }}>
                          {formData.recordPaymentNow ? 'تسجيل الدفع فوراً: مفعل' : 'تسجيل الدفع فوراً: معطل'}
                        </span>
                        <span style={{ background: formData.deductFromBalance ? '#9b59b6' : '#bdc3c7', color: 'white', padding: '6px 10px', borderRadius: '16px', fontWeight: 'bold' }}>
                          خصم من الرصيد: {formData.deductFromBalance ? 'نعم' : 'لا'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded content - replicates previous detailed panel but hidden when collapsed */}
                  {showPaymentOptions && (
                    <div style={{
                      marginTop: '12px',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      border: '3px solid #5a67d8',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '12px',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ مهم: خيارات الدفع والقيود المحاسبية ⚠️
                      </div>

                      <div style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', opacity: 0.8 }}>
                            <input
                              type="checkbox"
                              checked={formData.createJournalEntry}
                              onChange={(e) => setFormData(prev => ({ ...prev, createJournalEntry: e.target.checked }))}
                              style={{ width: '18px', height: '18px' }}
                              title={language === 'ar' ? 'مفعل افتراضياً — يمكنك تعطيله إن رغبت' : 'Enabled by default — you may disable it'}
                            />
                            <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>
                              ✅ {t('createJournalEntry')} ({language === 'ar' ? 'مفعل افتراضياً' : 'Enabled by default'})
                            </span>
                          </label>
                        </div>

                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                            <input
                              type="checkbox"
                              checked={formData.recordPaymentNow}
                              onChange={(e) => {
                                const checked = e.target.checked
                                // find a sensible default bank/cash account
                                const accountsList = JSON.parse(localStorage.getItem('accounts') || '[]')
                                const mainBankCash = accountsList.find(acc => acc.type === 'bank' || acc.type === 'cash')
                                const mainId = mainBankCash ? mainBankCash.id : ''
                                setFormData(prev => ({ 
                                  ...prev, 
                                  recordPaymentNow: checked,
                                  paymentBankAccountId: checked ? (prev.paymentBankAccountId || mainId) : ''
                                }))
                              }}
                              style={{ width: '18px', height: '18px' }}
                            />
                            <span style={{ color: formData.type === 'sales' ? '#27ae60' : '#e67e22', fontWeight: 'bold' }}>
                              💰 {t('recordPaymentNow')}
                            </span>
                          </label>
                          <small style={{ display: 'block', marginTop: '6px', marginLeft: '26px', color: '#e74c3c', fontWeight: 'bold', fontSize: '13px' }}>
                            {formData.type === 'sales' 
                              ? '⚠️ فعّل هذا الخيار لإضافة المبلغ للبنك/الخزينة فوراً!' 
                              : '⚠️ فعّل هذا الخيار لخصم المبلغ من البنك/الخزينة فوراً!'}
                          </small>
                        </div>

                        {/* ❌ تم إزالة خيار "خصم من الرصيد الابتدائي" - غير منطقي محاسبياً */}
                      </div>

                      {formData.recordPaymentNow && (
                        <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '8px', border: '2px solid #4caf50' }}>
                          <div className="form-group">
                            <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>{t('selectBankAccount')} *</label>
                            <select
                              value={formData.paymentBankAccountId}
                              onChange={(e) => setFormData(prev => ({ ...prev, paymentBankAccountId: e.target.value }))}
                              required={formData.recordPaymentNow}
                              style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '2px solid #4caf50', backgroundColor: 'white' }}
                            >
                              <option value="">-- {t('selectBankAccount')} --</option>
                              {JSON.parse(localStorage.getItem('accounts') || '[]')
                                .filter(acc => acc.type === 'bank' || acc.type === 'cash')
                                .map(acc => (
                                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Explanation Box */}
                      <div style={{ background: 'rgba(255,255,255,0.95)', padding: '12px', borderRadius: '8px', marginTop: '10px', border: '2px dashed #5a67d8' }}>
                        <div style={{ fontSize: '13px', color: '#2c3e50', lineHeight: '1.7' }}>
                          {formData.type === 'sales' ? (
                            <>
                              <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#27ae60' }}>📊 عند إنشاء فاتورة مبيعات:</div>
                              <div style={{ marginBottom: '4px' }}>✅ <strong>القيد التلقائي:</strong> يُسجل المخزون (خصم) والعميل (دين) تلقائياً</div>
                              <div style={{ marginBottom: '4px' }}>💰 <strong>تسجيل الدفع فوراً:</strong> يُضيف المبلغ للبنك/الخزينة ويخصم من حساب العميل</div>
                              <div>💳 <strong>خصم من الرصيد:</strong> يخصم المبلغ من رصيد العميل الابتدائي</div>
                            </>
                          ) : (
                            <>
                              <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#e67e22' }}>📦 عند إنشاء فاتورة مشتريات:</div>
                              <div style={{ marginBottom: '4px' }}>✅ <strong>القيد التلقائي:</strong> يُسجل المخزون (إضافة) والمورد (دائن) تلقائياً</div>
                              <div style={{ marginBottom: '4px' }}>💰 <strong>تسجيل الدفع فوراً:</strong> يخصم المبلغ من البنك/الخزينة ويُسدد دين المورد</div>
                              <div>💳 <strong>خصم من الرصيد:</strong> يخصم المبلغ من رصيد المورد الابتدائي</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="modal-actions">
                {!editingInvoice && (
                  <button type="submit" className="btn btn-primary">
                    {t('createInvoiceBtn')}
                  </button>
                )}
                {editingInvoice && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleSubmit}
                    >
                      {language === 'ar' ? 'حفظ الملاحظات' : 'Save Notes'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-info"
                      onClick={() => printInvoice(editingInvoice)}
                    >
                      {t('printInvoice')}
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  {editingInvoice ? t('close') : t('cancel')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

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
                  ? 'يرجى إدخال الرقم السري للموافقة على تعديل الفاتورة' 
                  : 'Please enter PIN to authorize invoice editing'}
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

      {/* 🆕 نموذج إرجاع الفاتورة */}
      {showReturnModal && returningInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>
                🔄 {language === 'ar' ? 'إرجاع' : 'Return'} {returningInvoice.type === 'sales' ? (language === 'ar' ? 'فاتورة مبيعات' : 'Sales Invoice') : (language === 'ar' ? 'فاتورة مشتريات' : 'Purchase Invoice')}
                {' - '}
                {returningInvoice.invoiceNumber}
              </h2>
              <button className="close-btn" onClick={() => setShowReturnModal(false)}>&times;</button>
            </div>

            <div className="modal-body" style={{ padding: '20px', maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
              {/* رسالة توضيحية */}
              <div style={{
                backgroundColor: returningInvoice.type === 'purchase' ? '#d1ecf1' : '#fff3cd',
                border: `1px solid ${returningInvoice.type === 'purchase' ? '#17a2b8' : '#ffc107'}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, color: returningInvoice.type === 'purchase' ? '#0c5460' : '#856404', fontSize: '14px' }}>
                  {returningInvoice.type === 'purchase' ? (
                    <>
                      <strong>📦 إرجاع مشتريات:</strong><br />
                      {language === 'ar'
                        ? '• المخزون: سينقص (إرجاع للمورد) ✓\n• الرصيد: سيزيد (استرجاع المال) ✓\n• يجب توفر الكمية في المخزون'
                        : '• Inventory: Will decrease (return to supplier) ✓\n• Balance: Will increase (get money back) ✓\n• Quantity must be available in inventory'
                      }
                    </>
                  ) : (
                    <>
                      <strong>🛒 إرجاع مبيعات:</strong><br />
                      {language === 'ar'
                        ? '• المخزون: سيزيد (استلام من العميل) ✓\n• الرصيد: سينقص (إرجاع المال للعميل) ✓\n• لا يشترط توفر المنتج مسبقاً'
                        : '• Inventory: Will increase (receive from customer) ✓\n• Balance: Will decrease (refund money) ✓\n• Product availability not required'
                      }
                    </>
                  )}
                </p>
              </div>

              {/* Error Message */}
              {modalError && (
                <div className="modal-error-message" style={{ marginBottom: '15px' }}>
                  <div className="error-content">
                    <i className="error-icon">⚠️</i>
                    <span className="error-text">{modalError}</span>
                    <button 
                      className="error-close" 
                      onClick={() => setModalError(null)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* معلومات الفاتورة الأصلية */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px'
              }}>
                <div>
                  <strong>{language === 'ar' ? 'العميل/المورد:' : 'Client/Supplier:'}</strong>
                  <div>{returningInvoice.clientName}</div>
                </div>
                <div>
                  <strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong>
                  <div>{new Date(returningInvoice.date).toLocaleDateString('ar-EG')}</div>
                </div>
                <div>
                  <strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong>
                  <div>{parseFloat(returningInvoice.total).toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}</div>
                </div>
              </div>

              {/* جدول العناصر */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>{language === 'ar' ? 'العناصر:' : 'Items:'}</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="items-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>{language === 'ar' ? 'المنتج' : 'Product'}</th>
                      <th style={{ width: '100px' }}>{language === 'ar' ? 'الكمية الأصلية' : 'Original Qty'}</th>
                      <th style={{ width: '120px' }}>{language === 'ar' ? 'كمية الإرجاع' : 'Return Qty'}</th>
                      <th style={{ width: '120px' }}>{language === 'ar' ? 'حالة المخزون' : 'Inventory Status'}</th>
                      <th style={{ width: '100px' }}>{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th style={{ width: '100px' }}>{language === 'ar' ? 'المجموع' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, index) => (
                      <tr key={index} style={{ 
                        backgroundColor: item.returnQuantity > 0 && returnInventoryStatus[index] && !returnInventoryStatus[index].available 
                          ? '#ffebee' 
                          : 'transparent'
                      }}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>{item.itemName}</td>
                        <td style={{ textAlign: 'center' }}>{item.maxQuantity}</td>
                        <td>
                          <input
                            type="number"
                            value={item.returnQuantity}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              const maxQty = item.maxQuantity
                              const newQty = Math.min(Math.max(0, value), maxQty)
                              
                              setReturnItems(prev => prev.map((it, i) => 
                                i === index ? { ...it, returnQuantity: newQty } : it
                              ))
                            }}
                            min="0"
                            max={item.maxQuantity}
                            step="1"
                            style={{ width: '100%', padding: '5px' }}
                          />
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          fontSize: '12px',
                          color: item.returnQuantity > 0 && returnInventoryStatus[index] 
                            ? returnInventoryStatus[index].color 
                            : '#6c757d',
                          fontWeight: item.returnQuantity > 0 ? 'bold' : 'normal'
                        }}>
                          {item.returnQuantity > 0 && returnInventoryStatus[index] 
                            ? returnInventoryStatus[index].message
                            : '-'
                          }
                        </td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(item.unitPrice).toFixed(3)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {(item.returnQuantity * parseFloat(item.unitPrice)).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '10px' }}>
                        {language === 'ar' ? 'إجمالي الإرجاع:' : 'Return Total:'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', paddingTop: '10px' }}>
                        {returnItems.reduce((sum, item) => 
                          sum + (item.returnQuantity * parseFloat(item.unitPrice)), 0
                        ).toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </div>

              {/* سبب الإرجاع */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {language === 'ar' ? 'سبب الإرجاع:' : 'Return Reason:'}
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اختياري - اذكر سبب الإرجاع...' : 'Optional - Enter return reason...'}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleReturnInvoice}
                  disabled={
                    returnItems.every(item => item.returnQuantity === 0) ||
                    Object.values(returnInventoryStatus).some(status => !status.available)
                  }
                  style={{
                    opacity: returnItems.every(item => item.returnQuantity === 0) ||
                            Object.values(returnInventoryStatus).some(status => !status.available)
                      ? 0.5 
                      : 1,
                    cursor: returnItems.every(item => item.returnQuantity === 0) ||
                            Object.values(returnInventoryStatus).some(status => !status.available)
                      ? 'not-allowed' 
                      : 'pointer'
                  }}
                  title={
                    returnItems.every(item => item.returnQuantity === 0)
                      ? (language === 'ar' ? 'يرجى تحديد كمية للإرجاع' : 'Please specify return quantity')
                      : Object.values(returnInventoryStatus).some(status => !status.available)
                        ? (language === 'ar' ? 'بعض المنتجات غير متوفرة في المخزون' : 'Some products are not available in inventory')
                        : (language === 'ar' ? 'تأكيد الإرجاع' : 'Confirm Return')
                  }
                >
                  ✅ {language === 'ar' ? 'تأكيد الإرجاع' : 'Confirm Return'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowReturnModal(false)}
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

export default Invoices