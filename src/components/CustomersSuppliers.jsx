import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { getOverdueInvoices, getInvoicesDueSoon, getDaysInfo } from '../utils/invoiceUtils'
import PermissionDenied from './PermissionDenied'
import './CustomersSuppliers.css'

const CustomersSuppliers = () => {
  const { 
    customers,
    suppliers,
    invoices,
    vouchers, // 🆕 السندات لحساب الرصيد
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    hasTransactions // 🆕 دالة للتحقق من وجود معاملات
  } = useAccounting()
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()

  // Check if user has permission to view customers and suppliers
  if (!hasPermission('view_customers_suppliers')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض العملاء والموردين"
        description="تحتاج إلى صلاحية 'عرض العملاء والموردين' للوصول إلى هذه الصفحة"
      />
    )
  }

  const [activeTab, setActiveTab] = useState('customers')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    balanceType: 'all', // all, positive, negative, zero
    sortBy: 'name', // name, balance, recent
    sortOrder: 'asc' // asc, desc
  })
  
  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pendingEditItem, setPendingEditItem] = useState(null)
  const [pendingEditType, setPendingEditType] = useState(null) // 'customer' or 'supplier'
  
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
    // Check if editing and PIN is required
    if (item) {
      const savedPin = localStorage.getItem('app_editInvoicePin')
      const pinSettings = JSON.parse(localStorage.getItem('app_pinProtectionSettings') || '{"customers": true}')
      
      if (savedPin && pinSettings.customers) {
        // PIN is set and protection is enabled, show PIN modal first
        setPendingEditItem(item)
        setPendingEditType(activeTab === 'customers' ? 'customer' : 'supplier')
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

  const handlePinVerification = () => {
    const savedPin = localStorage.getItem('app_editInvoicePin')
    
    if (pinInput === savedPin) {
      // PIN correct, proceed to edit
      setShowPinModal(false)
      setPinInput('')
      setPinError('')
      proceedToEdit(pendingEditItem)
      setPendingEditItem(null)
      setPendingEditType(null)
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
    setPendingEditType(null)
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
      
      // ✅ التحقق من الرصيد الابتدائي
      const balance = parseFloat(formData.balance || 0)
      if (isCustomer && balance < 0) {
        showNotification(
          language === 'ar'
            ? '⚠️ لا يمكن إضافة رصيد ابتدائي سالب للعميل\nالعميل يجب أن يكون مديناً (رصيد موجب) أو صفر'
            : '⚠️ Cannot add negative opening balance for customer\nCustomer must have debit balance (positive) or zero',
          'error'
        )
        return
      }
      
      if (!isCustomer && balance > 0) {
        showNotification(
          language === 'ar'
            ? '⚠️ لا يمكن إضافة رصيد ابتدائي موجب للمورد\nالمورد يجب أن يكون دائناً لنا (رصيد سالب) أو صفر'
            : '⚠️ Cannot add positive opening balance for supplier\nSupplier must have credit balance (negative) or zero',
          'error'
        )
        return
      }
      
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

  const handleExport = () => {
    try {
      const dataToExport = currentData.map(item => ({
        [language === 'ar' ? 'الاسم' : 'Name']: item.name,
        [language === 'ar' ? 'الهاتف' : 'Phone']: item.phone || '',
        [language === 'ar' ? 'الإيميل' : 'Email']: item.email || '',
        [language === 'ar' ? 'العنوان' : 'Address']: item.address || '',
        [language === 'ar' ? 'الرصيد' : 'Balance']: parseFloat(item.balance || 0).toFixed(3),
        [language === 'ar' ? 'ملاحظات' : 'Notes']: item.notes || ''
      }))

      // Create CSV content
      const headers = Object.keys(dataToExport[0] || {})
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => 
            `"${(row[header] || '').toString().replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n')

      // Download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const fileName = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
      link.download = fileName
      link.click()

      showNotification(
        language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully',
        'success'
      )
    } catch (error) {
      showNotification(
        language === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Error occurred during export',
        'error'
      )
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        showNotification(
          language === 'ar' ? 'الملف فارغ أو غير صحيح' : 'File is empty or invalid',
          'error'
        )
        return
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const importedData = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        
        if (values.length >= headers.length) {
          const item = {
            name: values[0] || '',
            phone: values[1] || '',
            email: values[2] || '',
            address: values[3] || '',
            balance: parseFloat(values[4]) || 0,
            notes: values[5] || ''
          }

          if (item.name) {
            importedData.push(item)
          }
        }
      }

      if (importedData.length === 0) {
        showNotification(
          language === 'ar' ? 'لا توجد بيانات صحيحة في الملف' : 'No valid data found in file',
          'error'
        )
        return
      }

      // Add imported data
      let successCount = 0
      for (const item of importedData) {
        const result = activeTab === 'customers' 
          ? addCustomer(item)
          : addSupplier(item)
        
        if (result.success) {
          successCount++
        }
      }

      showNotification(
        language === 'ar' 
          ? `تم استيراد ${successCount} عنصر بنجاح من أصل ${importedData.length}`
          : `Successfully imported ${successCount} items out of ${importedData.length}`,
        'success'
      )

      // Reset file input
      event.target.value = ''

    } catch (error) {
      showNotification(
        language === 'ar' ? 'حدث خطأ أثناء استيراد الملف' : 'Error occurred during import',
        'error'
      )
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
  
  // دالة حساب الرصيد الإجمالي (الافتتاحي + الفواتير - السندات)
  const calculateTotalBalance = (client) => {
    // 1️⃣ الرصيد الافتتاحي (Opening Balance) - ثابت لا يتغير
    const openingBalance = parseFloat(client.balance || 0)
    
    // 2️⃣ حساب الفواتير غير المدفوعة (أو المدفوعة جزئياً)
    const clientInvoices = invoices.filter(inv => 
      inv.clientId === client.id || inv.clientName === client.name
    )
    
    let invoicesBalance = 0  // رصيد الفواتير الإجمالي
    let paidBalance = 0      // المدفوع من الفواتير
    let partialCount = 0
    let partialPaidAmount = 0

    clientInvoices.forEach(invoice => {
      const amount = parseFloat(invoice.total || 0)
      const paidAmt = parseFloat(invoice.paidAmount || 0)

      if (invoice.paymentStatus === 'partial') {
        partialCount++
        partialPaidAmount += paidAmt
      }

      if (invoice.type === 'sales') {
        // فواتير المبيعات
        if (invoice.isReturn) {
          // ❌ مرتجع مبيعات = نرد للعميل (يقلل رصيده)
          invoicesBalance -= amount
        } else {
          // ✅ فاتورة مبيعات = العميل مدين (فقط المبلغ غير المدفوع)
          invoicesBalance += (amount - paidAmt)
        }
        paidBalance += paidAmt
        
      } else if (invoice.type === 'purchase') {
        // فواتير المشتريات
        if (invoice.isReturn) {
          // ❌ مرتجع مشتريات = المورد يرد لنا (يقلل رصيده)
          invoicesBalance -= amount
        } else {
          // ✅ فاتورة مشتريات = نحن مدينون للمورد (فقط المبلغ غير المدفوع)
          invoicesBalance += (amount - paidAmt)
        }
        paidBalance += paidAmt
      }
    })
    
    // 3️⃣ حساب السندات غير المرتبطة بفواتير محددة
    // ⚠️ ملاحظة مهمة: السندات غير المرتبطة بفاتورة يتم تحديث openingBalance مباشرة
    // لذلك لا نحتاج لحسابها هنا مرة أخرى، فقط نحسب عددها للإحصائيات
    let vouchersBalance = 0
    let vouchersCount = 0
    
    if (vouchers && vouchers.length > 0) {
      const clientVouchers = vouchers.filter(v => 
        (v.customerId === client.id || v.customerName === client.name ||
         v.supplierId === client.id || v.supplierName === client.name) &&
        !v.invoiceId  // 🔥 فقط السندات غير المرتبطة بفاتورة محددة
      )
      
      vouchersCount = clientVouchers.length
      
      // ❌ لا نحسب vouchersBalance هنا لأن السندات غير المرتبطة بفاتورة
      // تقوم بتحديث client.balance مباشرة في ReceiptVouchers.jsx و PaymentVouchers.jsx
      // إذا حسبناها هنا سيتم احتسابها مرتين!
    }
    
    // 4️⃣ الرصيد الإجمالي = الافتتاحي + الفواتير غير المدفوعة
    // ✅ openingBalance يتم تحديثه تلقائياً عند إنشاء سندات غير مرتبطة بفواتير
    // ✅ السندات المرتبطة بفواتير محددة تم احتسابها في paidAmount داخل الفواتير
    const totalBalance = openingBalance + invoicesBalance
    
    return {
      openingBalance,        // الرصيد الافتتاحي (ثابت)
      initialBalance: openingBalance,  // للتوافق
      invoicesBalance,       // رصيد الفواتير (غير المدفوع فقط)
      unpaidBalance: invoicesBalance,  // للتوافق
      vouchersBalance,       // رصيد السندات غير المرتبطة (سالب)
      vouchersCount,         // عدد السندات غير المرتبطة
      paidBalance,           // المدفوع من الفواتير (عبر السندات المرتبطة)
      totalBalance,          // الرصيد النهائي = افتتاحي + فواتير - سندات
      invoiceCount: clientInvoices.length,
      unpaidInvoices: clientInvoices.filter(inv => inv.paymentStatus !== 'paid').length,
      paidInvoices: clientInvoices.filter(inv => inv.paymentStatus === 'paid').length,
      partialInvoices: partialCount,
      partialPaidAmount
    }
  }

  // Get overdue and due soon invoices for a specific client
  const getClientInvoiceAlerts = (client) => {
    const clientInvoices = invoices.filter(inv => 
      inv.clientId === client.id || inv.clientName === client.name
    )
    
    const overdue = getOverdueInvoices(clientInvoices)
    const dueSoon = getInvoicesDueSoon(clientInvoices, 7)
    
    return {
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      hasAlerts: overdue.length > 0 || dueSoon.length > 0,
      overdueAmount: overdue.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
      dueSoonAmount: dueSoon.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
    }
  }
  
  const filteredData = currentData.filter(item => {
    // Text search filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm)) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Balance type filter using total balance
    const { totalBalance } = calculateTotalBalance(item)
    let matchesBalance = true
    
    switch (filters.balanceType) {
      case 'positive':
        matchesBalance = totalBalance > 0
        break
      case 'negative':
        matchesBalance = totalBalance < 0
        break
      case 'zero':
        matchesBalance = totalBalance === 0
        break
      default:
        matchesBalance = true
    }
    
    return matchesSearch && matchesBalance
  }).sort((a, b) => {
    let comparison = 0
    
    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'balance':
        const balanceA = calculateTotalBalance(a).totalBalance
        const balanceB = calculateTotalBalance(b).totalBalance
        comparison = balanceA - balanceB
        break
      default:
        comparison = 0
    }
    
    return filters.sortOrder === 'desc' ? -comparison : comparison
  })

  // Calculate statistics with total balance
  const customerStats = {
    total: customers.length,
    withPositiveBalance: customers.filter(c => calculateTotalBalance(c).totalBalance > 0).length,
    withNegativeBalance: customers.filter(c => calculateTotalBalance(c).totalBalance < 0).length,
    totalBalance: customers.reduce((sum, c) => sum + calculateTotalBalance(c).totalBalance, 0)
  }

  const supplierStats = {
    total: suppliers.length,
    withPositiveBalance: suppliers.filter(s => calculateTotalBalance(s).totalBalance > 0).length,
    withNegativeBalance: suppliers.filter(s => calculateTotalBalance(s).totalBalance < 0).length,
    totalBalance: suppliers.reduce((sum, s) => sum + calculateTotalBalance(s).totalBalance, 0)
  }

  const currentStats = activeTab === 'customers' ? customerStats : supplierStats

  return (
    <div className="customers-suppliers">
      <div className="page-header">
        <h1>{t('customersAndSuppliers')}</h1>
        <div className="header-actions">
          {/* <div className="export-import-buttons">
            <button 
              className="btn btn-success btn-sm"
              onClick={handleExport}
              title={language === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}
            >
              📊 {language === 'ar' ? 'تصدير' : 'Export'}
            </button>
            <label className="btn btn-info btn-sm import-btn">
              📁 {language === 'ar' ? 'استيراد' : 'Import'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div> */}
          {hasPermission('create_customers_suppliers') && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              {activeTab === 'customers' ? t('addNewCustomer') : t('addNewSupplier')}
            </button>
          )}
        </div>
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

      {/* Statistics Cards */}
      <div className="client-stats">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="number">{currentStats.total}</div>
            <div className="label">
              {activeTab === 'customers' 
                ? (language === 'ar' ? 'إجمالي العملاء' : 'Total Customers')
                : (language === 'ar' ? 'إجمالي الموردين' : 'Total Suppliers')
              }
            </div>
          </div>
        </div>

        <div className="stat-card positive">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="number">{currentStats.withPositiveBalance}</div>
            <div className="label">
              {language === 'ar' ? 'رصيد دائن' : 'Positive Balance'}
            </div>
          </div>
        </div>

        <div className="stat-card negative">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <div className="number">{currentStats.withNegativeBalance}</div>
            <div className="label">
              {language === 'ar' ? 'رصيد مدين' : 'Negative Balance'}
            </div>
          </div>
        </div>

        <div className="stat-card balance">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className={`number ${currentStats.totalBalance >= 0 ? 'positive' : 'negative'}`}>
              {Math.abs(currentStats.totalBalance).toFixed(3)}
            </div>
            <div className="label">
              {language === 'ar' ? 'إجمالي الرصيد (د.ك)' : 'Total Balance (KWD)'}
            </div>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-controls">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={t('searchCustomersSuppliers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input compact"
            />
          </div>
          
          <div className="filters-compact">
            <select
              value={filters.balanceType}
              onChange={(e) => setFilters(prev => ({ ...prev, balanceType: e.target.value }))}
              className="filter-select compact"
            >
              <option value="all">{language === 'ar' ? 'جميع الأرصدة' : 'All Balances'}</option>
              <option value="positive">{language === 'ar' ? 'دائن' : 'Credit'}</option>
              <option value="negative">{language === 'ar' ? 'مدين' : 'Debit'}</option>
              <option value="zero">{language === 'ar' ? 'صفر' : 'Zero'}</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="filter-select compact"
            >
              <option value="name">{language === 'ar' ? 'الاسم' : 'Name'}</option>
              <option value="balance">{language === 'ar' ? 'الرصيد' : 'Balance'}</option>
            </select>

            <button
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
              className="sort-btn compact"
              title={filters.sortOrder === 'asc' ? 
                (language === 'ar' ? 'تصاعدي' : 'Ascending') : 
                (language === 'ar' ? 'تنازلي' : 'Descending')
              }
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            <button
              onClick={() => {
                setSearchTerm('')
                setFilters({
                  balanceType: 'all',
                  sortBy: 'name',
                  sortOrder: 'asc'
                })
              }}
              className="clear-btn compact"
              title={language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="results-summary">
          <span className="results-count">
            {filteredData.length} / {currentData.length} {activeTab === 'customers' ? 
              (language === 'ar' ? 'عميل' : 'customers') : 
              (language === 'ar' ? 'مورد' : 'suppliers')
            }
          </span>
        </div>
      </div>

      <div className="table-container">
        {filteredData.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="desktop-view">
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
                      <td className="contact-cell">
                        {item.phone ? (
                          <div className="contact-info">
                            <a href={`tel:${item.phone}`} className="phone-link">
                              📞 {item.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="no-data">-</span>
                        )}
                      </td>
                      <td className="contact-cell">
                        {item.email ? (
                          <div className="contact-info">
                            <a href={`mailto:${item.email}`} className="email-link">
                              ✉️ {item.email}
                            </a>
                          </div>
                        ) : (
                          <span className="no-data">-</span>
                        )}
                      </td>
                      <td className="address-cell">{item.address || '-'}</td>
                      <td className="balance-cell">
                        {(() => {
                          const balanceInfo = calculateTotalBalance(item)
                          const isPositive = balanceInfo.totalBalance > 0
                          const isNegative = balanceInfo.totalBalance < 0
                          const isCustomer = activeTab === 'customers'
                          
                          // ✅ للعملاء: موجب=مدين (أخضر)، سالب=دائن (أحمر)
                          // ✅ للموردين: سالب=دائن (أحمر)، موجب=مدين (أخضر) - عكس المنطق
                          const shouldShowRed = isCustomer ? isNegative : isPositive
                          const shouldShowGreen = isCustomer ? isPositive : isNegative
                          
                          return (
                            <div className="balance-details">
                              <div className={`total-balance ${shouldShowGreen ? 'positive' : shouldShowRed ? 'negative' : 'zero'}`}>
                                <strong>{Math.abs(balanceInfo.totalBalance).toFixed(3)}</strong> {language === 'ar' ? 'د.ك' : 'KWD'}
                                {isPositive && <span className="balance-type"> ({language === 'ar' ? 'مدين' : 'Debit'})</span>}
                                {isNegative && <span className="balance-type"> ({language === 'ar' ? 'دائن' : 'Credit'})</span>}
                              </div>
                              
                              {(balanceInfo.initialBalance !== 0 || balanceInfo.unpaidBalance !== 0 || balanceInfo.vouchersBalance !== 0) && (
                                <div className="balance-breakdown">
                                  <small>
                                    {language === 'ar' ? 'ابتدائي:' : 'Initial:'} {balanceInfo.initialBalance.toFixed(3)}
                                    {balanceInfo.unpaidBalance !== 0 && (
                                      <span>
                                        {' | '}
                                        {language === 'ar' ? 'فواتير:' : 'Invoices:'} {balanceInfo.unpaidBalance.toFixed(3)}
                                      </span>
                                    )}
                                    {balanceInfo.vouchersBalance !== 0 && (
                                      <span>
                                        {' | '}
                                        {language === 'ar' ? 'سندات:' : 'Vouchers:'} {balanceInfo.vouchersBalance.toFixed(3)}
                                      </span>
                                    )}
                                  </small>
                                </div>
                              )}
                              
                              {balanceInfo.unpaidInvoices > 0 && (
                                <div className="unpaid-warning">
                                  <small>⚠️ {balanceInfo.unpaidInvoices} {language === 'ar' ? 'فاتورة غير مدفوعة' : 'unpaid invoice(s)'}</small>
                                </div>
                              )}
                              
                              {(() => {
                                const alerts = getClientInvoiceAlerts(item)
                                if (alerts.hasAlerts) {
                                  return (
                                    <div className="invoice-alerts">
                                      {alerts.overdue > 0 && (
                                        <div className="alert-item overdue">
                                          <small>🚨 {alerts.overdue} {language === 'ar' ? 'متأخرة' : 'overdue'}</small>
                                        </div>
                                      )}
                                      {alerts.dueSoon > 0 && (
                                        <div className="alert-item due-soon">
                                          <small>⏰ {alerts.dueSoon} {language === 'ar' ? 'قريبة الاستحقاق' : 'due soon'}</small>
                                        </div>
                                      )}
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          )
                        })()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {hasPermission('edit_customers_suppliers') && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => openModal(item)}
                            >
                              {language === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                          )}
                          {hasPermission('delete_customers_suppliers') && (
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item)}
                            >
                              {language === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-view">
              {filteredData.map(item => (
                <div key={item.id} className="client-card">
                  <div className="card-header">
                    <div className="client-name">
                      <h3>{item.name}</h3>
                      {item.notes && <span className="card-notes">{item.notes}</span>}
                    </div>
                    <div className="client-balance-mobile">
                      {(() => {
                        const balanceInfo = calculateTotalBalance(item)
                        const isPositive = balanceInfo.totalBalance > 0
                        const isNegative = balanceInfo.totalBalance < 0
                        
                        return (
                          <div className="mobile-balance-details">
                            <div className={`total-balance ${isPositive ? 'positive' : isNegative ? 'negative' : 'zero'}`}>
                              <strong>{Math.abs(balanceInfo.totalBalance).toFixed(3)}</strong> {language === 'ar' ? 'د.ك' : 'KWD'}
                            </div>
                            <div className="balance-status">
                              {isPositive && <span className="debit">{language === 'ar' ? 'مدين' : 'Debit'}</span>}
                              {isNegative && <span className="credit">{language === 'ar' ? 'دائن' : 'Credit'}</span>}
                              {!isPositive && !isNegative && <span className="balanced">{language === 'ar' ? 'متوازن' : 'Balanced'}</span>}
                            </div>
                            {balanceInfo.unpaidInvoices > 0 && (
                              <div className="unpaid-mobile">
                                <small>⚠️ {balanceInfo.unpaidInvoices}</small>
                              </div>
                            )}
                            
                            {(() => {
                              const alerts = getClientInvoiceAlerts(item)
                              if (alerts.hasAlerts) {
                                return (
                                  <div className="invoice-alerts-mobile">
                                    {alerts.overdue > 0 && (
                                      <div className="alert-item overdue">
                                        <small>🚨 {alerts.overdue} {language === 'ar' ? 'متأخرة' : 'overdue'}</small>
                                      </div>
                                    )}
                                    {alerts.dueSoon > 0 && (
                                      <div className="alert-item due-soon">
                                        <small>⏰ {alerts.dueSoon} {language === 'ar' ? 'قريبة الاستحقاق' : 'due soon'}</small>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="card-content">
                    {item.phone && (
                      <div className="contact-row">
                        <span className="contact-label">📞</span>
                        <a href={`tel:${item.phone}`} className="contact-value">
                          {item.phone}
                        </a>
                      </div>
                    )}

                    {item.email && (
                      <div className="contact-row">
                        <span className="contact-label">✉️</span>
                        <a href={`mailto:${item.email}`} className="contact-value">
                          {item.email}
                        </a>
                      </div>
                    )}

                    {item.address && (
                      <div className="contact-row">
                        <span className="contact-label">📍</span>
                        <span className="contact-value">{item.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    {hasPermission('edit_customers_suppliers') && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(item)}
                      >
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                    )}
                    {hasPermission('delete_customers_suppliers') && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item)}
                      >
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
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
            
            <div className="modal-body-scrollable">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{activeTab === 'customers' ? t('customerName') : t('supplierName')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'ar' ? 'اسم العميل أو المورد' : 'Customer or Supplier name'}
                    required
                    className="name-input"
                  />
                  <small className="field-hint required-hint">
                    {language === 'ar' ? '* هذا الحقل مطلوب' : '* This field is required'}
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('phone')}</label>
                    <div className="phone-input-group">
                      <span className="phone-prefix">+965</span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="50000000"
                        className="phone-input"
                        maxLength="8"
                      />
                    </div>
                    <small className="field-hint">
                      {language === 'ar' ? 'أدخل رقم الهاتف (8 أرقام)' : 'Enter phone number (8 digits)'}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>{t('email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                      className="email-input"
                    />
                    <small className="field-hint">
                      {language === 'ar' ? 'عنوان البريد الإلكتروني (اختياري)' : 'Email address (optional)'}
                    </small>
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
                    <label>{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'} *</label>
                    <div className="currency-input-group">
                      <input
                        type="number"
                        step="0.001"
                        value={formData.balance}
                        onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                        placeholder="0.000"
                        className="balance-input"
                        min={activeTab === 'customers' ? '0' : undefined}
                        max={activeTab === 'customers' ? undefined : '0'}
                        disabled={editingItem && hasTransactions ? hasTransactions(editingItem.id, activeTab === 'customers' ? 'customer' : 'supplier') : false}
                        title={
                          editingItem && hasTransactions && hasTransactions(editingItem.id, activeTab === 'customers' ? 'customer' : 'supplier')
                            ? (language === 'ar' ? 'لا يمكن تعديل الرصيد الافتتاحي بعد إجراء معاملات' : 'Cannot edit opening balance after transactions')
                            : activeTab === 'customers'
                              ? (language === 'ar' ? 'العملاء: رصيد موجب أو صفر فقط' : 'Customers: Positive or zero only')
                              : (language === 'ar' ? 'الموردين: رصيد سالب أو صفر فقط' : 'Suppliers: Negative or zero only')
                        }
                      />
                      <span className="currency-symbol">{language === 'ar' ? 'د.ك' : 'KWD'}</span>
                    </div>
                    <small className="field-hint">
                      {editingItem && hasTransactions && hasTransactions(editingItem.id, activeTab === 'customers' ? 'customer' : 'supplier') ? (
                        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                          {language === 'ar' 
                            ? '⚠️ الرصيد الافتتاحي مقفل بعد إجراء معاملات (فواتير أو سندات). استخدم السندات لتعديل الرصيد.' 
                            : '⚠️ Opening balance is locked after transactions (invoices or vouchers). Use vouchers to adjust balance.'
                          }
                        </span>
                      ) : (
                        <span style={{ color: activeTab === 'customers' ? '#3498db' : '#e67e22', fontWeight: 'bold' }}>
                          {language === 'ar' 
                            ? activeTab === 'customers'
                              ? '✅ العملاء: رصيد موجب فقط (مدين) أو صفر • لا يمكن أن يكون العميل دائناً لنا'
                              : '✅ الموردين: رصيد سالب فقط (دائن) أو صفر • نحن مدينون للمورد'
                            : activeTab === 'customers'
                              ? '✅ Customers: Positive balance only (debit) or zero • Customer cannot be creditor'
                              : '✅ Suppliers: Negative balance only (credit) or zero • We owe supplier'
                          }
                        </span>
                      )}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>{t('notes')}</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)'}
                      className="notes-input"
                    />
                    <small className="field-hint">
                      {language === 'ar' 
                        ? 'ملاحظات مفيدة لتذكر معلومات إضافية'
                        : 'Useful notes to remember additional information'
                      }
                    </small>
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
                  ? `يرجى إدخال الرقم السري للموافقة على تعديل ${pendingEditType === 'customer' ? 'العميل' : 'المورد'}` 
                  : `Please enter PIN to authorize ${pendingEditType} editing`}
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

export default CustomersSuppliers
