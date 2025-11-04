import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useBrand } from '../contexts/BrandContext'
import PermissionDenied from './PermissionDenied'
import './Vouchers.css'

const PaymentVouchers = () => {
  const { 
    suppliers,
    accounts,
    vouchers,
    invoices, // 🆕 لربط السند بفاتورة محددة
    addVoucher,
    updateInvoice, // 🆕 لتحديث حالة الفاتورة تلقائياً
    updateSupplier, // 🆕 لتحديث رصيد المورد عند الدفع من الرصيد الافتتاحي
    deleteVoucher,
    addJournalEntry,
    createJournalEntryFromInvoice // 🆕 لإنشاء قيد محاسبي للفاتورة عند الدفع
  } = useAccounting()
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()
  const { brandSettings } = useBrand()

  const [showModal, setShowModal] = useState(false)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  
  const [formData, setFormData] = useState({
    type: 'payment',
    supplierId: '',
    supplierName: '',
    invoiceId: '', // 🆕 اختياري: ربط السند بفاتورة محددة
    amount: 0,
    bankAccountId: '',
    date: new Date().toLocaleDateString('en-CA'),
    description: '',
    reference: '',
    paymentMethod: 'cash'
  })

  // Check permission
  if (!hasPermission('manage_vouchers')) {
    return (
      <PermissionDenied 
        message={language === 'ar' ? 'ليس لديك صلاحية لإدارة السندات' : 'You do not have permission to manage vouchers'}
        description={language === 'ar' ? 'تحتاج إلى صلاحية إدارة السندات للوصول إلى هذه الصفحة' : 'You need manage vouchers permission to access this page'}
      />
    )
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const resetForm = () => {
    setFormData({
      type: 'payment',
      supplierId: '',
      supplierName: '',
      invoiceId: '', // 🆕
      amount: 0,
      bankAccountId: '',
      date: new Date().toLocaleDateString('en-CA'),
      description: '',
      reference: '',
      paymentMethod: 'cash'
    })
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  // 🆕 دالة للحصول على فواتير المشتريات غير المدفوعة بالكامل للمورد
  const getUnpaidInvoicesForSupplier = (supplierId) => {
    if (!supplierId) return []
    return invoices.filter(inv => {
      if (inv.type !== 'purchase' || inv.isReturn || inv.clientId !== supplierId) {
        return false
      }
      
      // تجاهل الفواتير المدفوعة بالكامل
      if (inv.paymentStatus === 'paid') {
        return false
      }
      
      // ✅ الفاتورة الآن يتم تعديلها مباشرة عند الإرجاع، فلا داعي لطرح المرتجعات
      const invoiceTotal = parseFloat(inv.total || 0)
      const paidAmount = parseFloat(inv.paidAmount || 0)
      const netRemaining = invoiceTotal - paidAmount
      
      // إظهار الفاتورة فقط إذا كان هناك رصيد متبقي
      return netRemaining > 0.001  // نستخدم 0.001 لتجنب مشاكل الفواصل العشرية
    })
  }

  // ✅ دالة لحساب الرصيد الكامل للمورد (الافتتاحي + الفواتير غير المسددة)
  const calculateSupplierTotalBalance = (supplierId) => {
    if (!supplierId) return 0
    
    const supplier = suppliers.find(s => s.id === supplierId)
    const openingBalance = parseFloat(supplier?.balance || 0)
    
    // حساب الفواتير غير المسددة (الفاتورة الآن محدثة بالقيمة الصحيحة بعد الإرجاع)
    const unpaidInvoices = getUnpaidInvoicesForSupplier(supplierId)
    const unpaidTotal = unpaidInvoices.reduce((sum, inv) => {
      const invoiceTotal = parseFloat(inv.total || 0)
      const paidAmount = parseFloat(inv.paidAmount || 0)
      return sum + (invoiceTotal - paidAmount)
    }, 0)
    
    return openingBalance + unpaidTotal
  }

  // Get payment vouchers only
  const paymentVouchers = vouchers.filter(v => v.type === 'payment')

  // Get cash/bank accounts
  const cashBankAccounts = accounts.filter(acc => 
    acc.type === 'cash' || acc.type === 'bank'
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.supplierId) {
      showNotification(language === 'ar' ? 'الرجاء اختيار المورد' : 'Please select supplier', 'error')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      showNotification(language === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter valid amount', 'error')
      return
    }

    if (!formData.bankAccountId) {
      showNotification(language === 'ar' ? 'الرجاء اختيار الحساب (خزينة أو بنك)' : 'Please select account (cash or bank)', 'error')
      return
    }

    // ✅ التحقق: يجب وجود فاتورة أو رصيد ابتدائي
    const voucherAmount = parseFloat(formData.amount)
    
    if (!formData.invoiceId) {
      // إذا لم يتم اختيار فاتورة، تحقق من الرصيد الابتدائي
      const supplier = suppliers.find(s => s.id === formData.supplierId)
      const openingBalance = parseFloat(supplier?.balance || 0)
      
      // المورد يجب أن يكون لديه رصيد سالب (نحن مدينون له)
      if (openingBalance >= 0) {
        showNotification(
          language === 'ar' 
            ? '⚠️ يجب اختيار فاتورة محددة أو وجود رصيد ابتدائي سالب للمورد' 
            : '⚠️ Must select an invoice or supplier must have negative opening balance',
          'error'
        )
        return
      }
      
      // التحقق من أن المبلغ لا يتجاوز الرصيد المستحق (القيمة المطلقة)
      const absBalance = Math.abs(openingBalance)
      if (voucherAmount > absBalance + 0.001) {
        showNotification(
          language === 'ar'
            ? `⚠️ المبلغ المدخل (${voucherAmount.toFixed(3)} د.ك) أكبر من الرصيد المستحق (${absBalance.toFixed(3)} د.ك)`
            : `⚠️ Amount (${voucherAmount.toFixed(3)} KWD) exceeds due balance (${absBalance.toFixed(3)} KWD)`,
          'error'
        )
        return
      }
    } else {
      // ✅ التحقق من أن المبلغ لا يتجاوز المبلغ المستحق في الفاتورة
      const linkedInvoice = invoices.find(inv => inv.id === formData.invoiceId)
      if (linkedInvoice) {
        const invoiceTotal = parseFloat(linkedInvoice.total || 0)
        const paidAmount = parseFloat(linkedInvoice.paidAmount || 0)
        const netRemaining = invoiceTotal - paidAmount

        if (voucherAmount > netRemaining + 0.001) {
          showNotification(
            language === 'ar'
              ? `⚠️ المبلغ المدخل (${voucherAmount.toFixed(3)} د.ك) أكبر من المبلغ المستحق (${netRemaining.toFixed(3)} د.ك)`
              : `⚠️ Amount (${voucherAmount.toFixed(3)} KWD) exceeds remaining amount (${netRemaining.toFixed(3)} KWD)`,
            'error'
          )
          return
        }
      }
    }

    try {
      // 1. إنشاء السند
      const voucherData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      const newVoucher = addVoucher(voucherData)

      if (!newVoucher) {
        throw new Error('فشل في إنشاء سند الدفع')
      }

      // 2. إنشاء القيد المحاسبي
      // سند دفع = ندفع للمورد
      // من ح/ الموردون            [مدين]
      // إلى ح/ الخزينة (أو البنك)  [دائن]

      const selectedAccount = accounts.find(acc => acc.id === formData.bankAccountId)
      const supplierAccount = accounts.find(acc => acc.code === '2001') // حساب الموردون

      if (!selectedAccount || !supplierAccount) {
        throw new Error('لم يتم العثور على الحسابات المطلوبة')
      }

      const journalEntry = {
        date: formData.date,
        description: `سند دفع ${newVoucher.voucherNumber} - ${formData.supplierName}`,
        reference: `PV-${newVoucher.voucherNumber}`,
        type: 'payment_voucher',
        relatedVoucherId: newVoucher.id,
        lines: [
          {
            accountId: supplierAccount.id,
            accountCode: supplierAccount.code,
            accountName: supplierAccount.name,
            debit: parseFloat(formData.amount),
            credit: 0,
            description: `تخفيض رصيد المورد ${formData.supplierName}`
          },
          {
            accountId: selectedAccount.id,
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debit: 0,
            credit: parseFloat(formData.amount),
            description: `دفع للمورد ${formData.supplierName}`
          }
        ]
      }

      addJournalEntry(journalEntry)

      // 3. 🆕 تحديث حالة الفاتورة تلقائياً إذا تم ربط السند بفاتورة معينة
      if (formData.invoiceId) {
        const linkedInvoice = invoices.find(inv => inv.id === formData.invoiceId)
        
        if (linkedInvoice) {
          // حساب إجمالي المدفوعات للفاتورة (السندات المرتبطة بها)
          const relatedVouchers = vouchers.filter(v => 
            v.type === 'payment' && 
            v.invoiceId === formData.invoiceId
          )
          
          // إضافة السند الحالي
          const totalPaidViaVouchers = relatedVouchers.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0) + parseFloat(formData.amount)
          
          // المبلغ المدفوع مسبقاً في الفاتورة نفسها (إن وجد)
          const previouslyPaid = parseFloat(linkedInvoice.paidAmount || 0)
          
          // إجمالي المدفوعات
          const totalPaid = previouslyPaid + totalPaidViaVouchers
          
          // ✅ الفاتورة الآن يتم تعديلها مباشرة عند الإرجاع، فلا داعي لطرح المرتجعات
          // نستخدم القيمة المحدثة للفاتورة مباشرة
          const netInvoiceTotal = parseFloat(linkedInvoice.total || 0)
          
          console.log('💰 تحديث حالة الفاتورة:', {
            invoiceNumber: linkedInvoice.invoiceNumber,
            currentTotal: netInvoiceTotal,
            totalPaid: totalPaid,
            shouldBePaid: totalPaid >= netInvoiceTotal
          })
          
          // تحديث حالة الفاتورة
          if (netInvoiceTotal <= 0 || totalPaid >= netInvoiceTotal) {
            // المبلغ مدفوع بالكامل
            const wasNotPaid = linkedInvoice.paymentStatus !== 'paid'
            
            updateInvoice(linkedInvoice.id, {
              paymentStatus: 'paid',
              paidAmount: netInvoiceTotal > 0 ? netInvoiceTotal : 0
            })
            
            // ✅ إنشاء قيد محاسبي للفاتورة إذا كانت آجلة وأصبحت الآن مدفوعة
            if (wasNotPaid && netInvoiceTotal > 0) {
              console.log('📊 إنشاء قيد محاسبي للفاتورة بعد الدفع الكامل')
              const updatedInvoice = { ...linkedInvoice, paymentStatus: 'paid', paidAmount: netInvoiceTotal }
              createJournalEntryFromInvoice(updatedInvoice)
            }
            
            // ✅ معالجة الدفع الزائد (رصيد دائن لنا من المورد)
            const overpayment = totalPaid - netInvoiceTotal
            if (overpayment > 0.001) {
              showNotification(
                language === 'ar' 
                  ? `✅ تم إنشاء السند وتحديث الفاتورة ${linkedInvoice.invoiceNumber} إلى "مدفوع"\n💰 رصيد دائن لنا: ${overpayment.toFixed(3)} د.ك` 
                  : `✅ Voucher created and invoice ${linkedInvoice.invoiceNumber} marked as "Paid"\n💰 Credit balance for us: ${overpayment.toFixed(3)} KWD`,
                'success'
              )
            } else {
              showNotification(
                language === 'ar' 
                  ? `✅ تم إنشاء السند وتحديث حالة الفاتورة ${linkedInvoice.invoiceNumber} إلى "مدفوع"` 
                  : `✅ Voucher created and invoice ${linkedInvoice.invoiceNumber} marked as "Paid"`,
                'success'
              )
            }
          } else {
            // دفع جزئي
            updateInvoice(linkedInvoice.id, {
              paymentStatus: 'partial',
              paidAmount: totalPaid
            })
            
            showNotification(
              language === 'ar' 
                ? `✅ تم إنشاء السند ${newVoucher.voucherNumber} - المتبقي: ${(netInvoiceTotal - totalPaid).toFixed(3)}` 
                : `✅ Voucher ${newVoucher.voucherNumber} created - Remaining: ${(netInvoiceTotal - totalPaid).toFixed(3)}`,
              'success'
            )
          }
        }
      } else {
        // ✅ لم يتم ربط السند بفاتورة محددة - إذن هو دفع من الرصيد الافتتاحي
        // يجب تحديث رصيد المورد
        const supplier = suppliers.find(s => s.id === formData.supplierId)
        if (supplier) {
          const currentBalance = parseFloat(supplier.balance || 0)
          const voucherAmount = parseFloat(formData.amount)
          // المورد رصيده سالب (نحن ندين له)، فعند الدفع نزيد الرصيد (يصبح أقل سلبية)
          const newBalance = currentBalance + voucherAmount
          
          console.log('💰 تحديث الرصيد الافتتاحي للمورد:', {
            supplierName: supplier.name,
            oldBalance: currentBalance,
            payment: voucherAmount,
            newBalance: newBalance
          })
          
          updateSupplier(supplier.id, {
            balance: newBalance
          })
          
          const remainingDebt = Math.abs(newBalance)
          showNotification(
            language === 'ar' 
              ? `✅ تم إنشاء سند الدفع ${newVoucher.voucherNumber}\n💰 الرصيد المتبقي للمورد: ${remainingDebt.toFixed(3)} د.ك` 
              : `✅ Payment voucher ${newVoucher.voucherNumber} created\n💰 Supplier remaining balance: ${remainingDebt.toFixed(3)} KWD`,
            'success'
          )
        } else {
          showNotification(
            language === 'ar' 
              ? `تم إنشاء سند الدفع ${newVoucher.voucherNumber} بنجاح` 
              : `Payment voucher ${newVoucher.voucherNumber} created successfully`,
            'success'
          )
        }
      }

      closeModal()
    } catch (error) {
      console.error('Error creating payment voucher:', error)
      showNotification(
        language === 'ar' ? 'حدث خطأ أثناء إنشاء سند الدفع' : 'Error creating payment voucher',
        'error'
      )
    }
  }

  const handleDelete = async (voucher) => {
    if (!window.confirm(
      language === 'ar' 
        ? `هل أنت متأكد من حذف سند الدفع ${voucher.voucherNumber}؟` 
        : `Are you sure you want to delete payment voucher ${voucher.voucherNumber}?`
    )) {
      return
    }

    try {
      // ✅ إذا كان السند غير مرتبط بفاتورة (دفع من الرصيد الافتتاحي)
      // يجب إرجاع المبلغ إلى رصيد المورد
      if (!voucher.invoiceId && voucher.supplierId) {
        const supplier = suppliers.find(s => s.id === voucher.supplierId)
        if (supplier) {
          const currentBalance = parseFloat(supplier.balance || 0)
          const voucherAmount = parseFloat(voucher.amount || 0)
          // المورد رصيده سالب، فعند حذف السند نطرح المبلغ (يصبح أكثر سلبية)
          const newBalance = currentBalance - voucherAmount
          
          console.log('🔄 إرجاع المبلغ إلى الرصيد الافتتاحي عند حذف السند:', {
            supplierName: supplier.name,
            oldBalance: currentBalance,
            voucherAmount: voucherAmount,
            newBalance: newBalance
          })
          
          updateSupplier(supplier.id, {
            balance: newBalance
          })
        }
      }
      
      deleteVoucher(voucher.id)
      
      showNotification(
        language === 'ar' ? 'تم حذف سند الدفع بنجاح وإرجاع المبلغ للرصيد' : 'Payment voucher deleted and amount returned to balance',
        'success'
      )
    } catch (error) {
      console.error('Error deleting voucher:', error)
      showNotification(
        language === 'ar' ? 'حدث خطأ أثناء حذف السند' : 'Error deleting voucher',
        'error'
      )
    }
  }

  // Filter and sort vouchers
  const filteredVouchers = paymentVouchers.filter(voucher => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        voucher.voucherNumber?.toLowerCase().includes(term) ||
        voucher.supplierName?.toLowerCase().includes(term) ||
        voucher.description?.toLowerCase().includes(term)
      )
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'desc' 
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    }
    if (sortBy === 'amount') {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount
    }
    return 0
  })

  // Calculate total payments
  const totalPayments = paymentVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0)

  return (
    <div className="vouchers-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="vouchers-header">
        <div className="header-content">
          <h2>💸 {language === 'ar' ? 'سندات الدفع' : 'Payment Vouchers'}</h2>
          <p className="subtitle">
            {language === 'ar' 
              ? 'إدارة سندات الدفع للموردين' 
              : 'Manage payment vouchers to suppliers'}
          </p>
        </div>
        {hasPermission('create_vouchers') && (
          <button className="btn btn-primary" onClick={openModal}>
            ➕ {language === 'ar' ? 'سند دفع جديد' : 'New Payment'}
          </button>
        )}
      </div>

      <div className="vouchers-stats">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">{language === 'ar' ? 'إجمالي السندات' : 'Total Payments'}</div>
            <div className="stat-value">{paymentVouchers.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">{language === 'ar' ? 'إجمالي المبالغ' : 'Total Amount'}</div>
            <div className="stat-value">{totalPayments.toFixed(3)}</div>
          </div>
        </div>
      </div>

      <div className="vouchers-filters">
        <input
          type="text"
          className="search-input"
          placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">{language === 'ar' ? 'التاريخ' : 'Date'}</option>
          <option value="amount">{language === 'ar' ? 'المبلغ' : 'Amount'}</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">{language === 'ar' ? 'تنازلي' : 'Descending'}</option>
          <option value="asc">{language === 'ar' ? 'تصاعدي' : 'Ascending'}</option>
        </select>
      </div>

      <div className="vouchers-list">
        {filteredVouchers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h3>{language === 'ar' ? 'لا توجد سندات دفع' : 'No payment vouchers'}</h3>
            <p>{language === 'ar' ? 'ابدأ بإنشاء سند دفع جديد' : 'Start by creating a new payment voucher'}</p>
          </div>
        ) : (
          <table className="vouchers-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{language === 'ar' ? 'المورد' : 'Supplier'}</th>
                <th>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                <th>{language === 'ar' ? 'البيان' : 'Description'}</th>
                <th>{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map(voucher => (
                <tr key={voucher.id}>
                  <td className="voucher-number">{voucher.voucherNumber}</td>
                  <td>{new Date(voucher.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                  <td>{voucher.supplierName}</td>
                  <td className="amount">{parseFloat(voucher.amount).toFixed(3)}</td>
                  <td>
                    <span className={`payment-badge ${voucher.paymentMethod}`}>
                      {voucher.paymentMethod === 'cash' && (language === 'ar' ? 'نقدي' : 'Cash')}
                      {voucher.paymentMethod === 'bank' && (language === 'ar' ? 'بنك' : 'Bank')}
                      {voucher.paymentMethod === 'check' && (language === 'ar' ? 'شيك' : 'Check')}
                    </span>
                  </td>
                  <td>{voucher.description || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      {hasPermission('delete_vouchers') && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(voucher)}
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💸 {language === 'ar' ? 'سند دفع جديد' : 'New Payment Voucher'}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{language === 'ar' ? 'المورد *' : 'Supplier *'}</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => {
                      const supplier = suppliers.find(s => s.id === e.target.value)
                      setFormData({
                        ...formData,
                        supplierId: e.target.value,
                        supplierName: supplier?.name || '',
                        invoiceId: '' // إعادة تعيين الفاتورة عند تغيير المورد
                      })
                    }}
                    required
                  >
                    <option value="">{language === 'ar' ? '-- اختر المورد --' : '-- Select Supplier --'}</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 🆕 حقل اختياري لربط السند بفاتورة محددة أو الرصيد الابتدائي */}
                {formData.supplierId && (
                  <div className="form-group">
                    <label>
                      {language === 'ar' ? 'سداد من (اختياري)' : 'Payment From (Optional)'}
                      <small style={{ display: 'block', color: '#6b7280', fontSize: '0.85em', marginTop: '4px' }}>
                        {language === 'ar' 
                          ? 'اختر فاتورة أو الرصيد الابتدائي للتسديد' 
                          : 'Select an invoice or opening balance to pay'}
                      </small>
                    </label>
                    <select
                      value={formData.invoiceId}
                      onChange={(e) => {
                        const value = e.target.value
                        
                        if (value === 'OPENING_BALANCE') {
                          // تسديد من الرصيد الابتدائي
                          const supplier = suppliers.find(s => s.id === formData.supplierId)
                          const openingBalance = parseFloat(supplier?.balance || 0)
                          
                          setFormData({
                            ...formData,
                            invoiceId: '',
                            amount: openingBalance < 0 ? Math.abs(openingBalance).toFixed(3) : 0
                          })
                        } else if (value) {
                          // تسديد فاتورة محددة
                          const selectedInvoice = invoices.find(inv => inv.id === value)
                          if (selectedInvoice) {
                            // ✅ حساب المبلغ المتبقي = الإجمالي - المدفوع (الفاتورة محدثة بعد الإرجاع)
                            const invoiceTotal = parseFloat(selectedInvoice.total || 0)
                            const paidAmount = parseFloat(selectedInvoice.paidAmount || 0)
                            const remaining = invoiceTotal - paidAmount
                            
                            setFormData({ 
                              ...formData, 
                              invoiceId: value,
                              amount: remaining > 0 ? remaining.toFixed(3) : 0
                            })
                          }
                        } else {
                          setFormData({ ...formData, invoiceId: '', amount: 0 })
                        }
                      }}
                    >
                      <option value="">{language === 'ar' ? '-- بدون سداد --' : '-- No Payment --'}</option>
                      
                      {/* خيار رصيد المورد (الافتتاحي + الفواتير غير المسددة) */}
                      {(() => {
                        const supplier = suppliers.find(s => s.id === formData.supplierId)
                        const openingBalance = parseFloat(supplier?.balance || 0)
                        const totalBalance = calculateSupplierTotalBalance(formData.supplierId)
                        const unpaidInvoicesTotal = totalBalance - openingBalance
                        
                        if (totalBalance < 0) { // المورد دائن (رصيد سالب = نحن مدينون له)
                          return (
                            <option value="OPENING_BALANCE" style={{ fontWeight: 'bold', background: '#ffe0e0' }}>
                              💰 {language === 'ar' ? 'رصيد المورد:' : 'Supplier Balance:'} {Math.abs(totalBalance).toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}
                              {openingBalance < 0 && unpaidInvoicesTotal < 0 && ` (${language === 'ar' ? 'افتتاحي' : 'opening'}: ${Math.abs(openingBalance).toFixed(3)} + ${language === 'ar' ? 'فواتير' : 'invoices'}: ${Math.abs(unpaidInvoicesTotal).toFixed(3)})`}
                            </option>
                          )
                        }
                        return null
                      })()}
                      
                      {/* الفواتير غير المسددة */}
                      {getUnpaidInvoicesForSupplier(formData.supplierId).length > 0 && (
                        <optgroup label={language === 'ar' ? '📋 الفواتير غير المسددة' : '📋 Unpaid Invoices'}>
                          {getUnpaidInvoicesForSupplier(formData.supplierId).map(invoice => {
                        // ✅ حساب المبلغ المتبقي (الفاتورة محدثة بعد الإرجاع)
                        const invoiceTotal = parseFloat(invoice.total || 0)
                        const paidAmount = parseFloat(invoice.paidAmount || 0)
                        const remaining = invoiceTotal - paidAmount
                        
                        return (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {language === 'ar' ? 'المتبقي:' : 'Remaining:'} {remaining.toFixed(3)}
                          </option>
                        )
                      })}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>{language === 'ar' ? 'المبلغ *' : 'Amount *'}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'الحساب *' : 'Account *'}</label>
                  <select
                    value={formData.bankAccountId}
                    onChange={(e) => {
                      const accountId = e.target.value
                      const selectedAccount = accounts.find(acc => acc.id === accountId)
                      const isCash = selectedAccount?.type === 'cash'
                      
                      setFormData({ 
                        ...formData, 
                        bankAccountId: accountId,
                        paymentMethod: isCash ? 'cash' : formData.paymentMethod
                      })
                    }}
                    required
                  >
                    <option value="">{language === 'ar' ? '-- اختر الحساب --' : '-- Select Account --'}</option>
                    {cashBankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    {(() => {
                      const selectedAccount = accounts.find(acc => acc.id === formData.bankAccountId)
                      const isCashAccount = selectedAccount?.type === 'cash'
                      
                      if (isCashAccount) {
                        // الخزينة = نقدي فقط
                        return <option value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                      } else {
                        // البنك = جميع الطرق
                        return (
                          <>
                            <option value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                            <option value="bank">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                            <option value="check">{language === 'ar' ? 'شيك' : 'Check'}</option>
                          </>
                        )
                      }
                    })()}
                  </select>
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'التاريخ *' : 'Date *'}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'المرجع (شيك/تحويل)' : 'Reference (Check/Transfer)'}</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder={language === 'ar' ? 'رقم الشيك أو التحويل' : 'Check or transfer number'}
                  />
                </div>

                <div className="form-group full-width">
                  <label>{language === 'ar' ? 'البيان' : 'Description'}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder={language === 'ar' ? 'تفاصيل إضافية...' : 'Additional details...'}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 {language === 'ar' ? 'حفظ السند' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentVouchers
