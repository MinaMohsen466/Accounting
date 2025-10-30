import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useBrand } from '../contexts/BrandContext'
import PermissionDenied from './PermissionDenied'
import './Vouchers.css'

const ReceiptVouchers = () => {
  const { 
    customers,
    accounts,
    vouchers,
    invoices, // 🆕 لربط السند بفاتورة محددة
    addVoucher,
    updateInvoice, // 🆕 لتحديث حالة الفاتورة تلقائياً
    deleteVoucher,
    addJournalEntry
  } = useAccounting()
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()
  const { brandSettings } = useBrand()

  const [showModal, setShowModal] = useState(false)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all') // all, customer, date
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  
  const [formData, setFormData] = useState({
    type: 'receipt',
    customerId: '',
    customerName: '',
    invoiceId: '', // 🆕 اختياري: ربط السند بفاتورة معينة
    amount: 0,
    bankAccountId: '', // الحساب البنكي أو الخزينة
    date: new Date().toLocaleDateString('en-CA'),
    description: '',
    reference: '', // رقم مرجعي (شيك، تحويل، إلخ)
    paymentMethod: 'cash' // cash, bank, check
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
      type: 'receipt',
      customerId: '',
      customerName: '',
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

  // Get receipt vouchers only
  const receiptVouchers = vouchers.filter(v => v.type === 'receipt')

  // 🆕 دالة لحساب إجمالي المرتجعات المرتبطة بفاتورة معينة
  const getInvoiceReturns = (invoiceId) => {
    if (!invoiceId) return 0
    const returns = invoices.filter(inv => 
      inv.isReturn &&
      inv.originalInvoiceId === invoiceId  // فواتير مرتجع مرتبطة بالفاتورة الأصلية
    )
    return returns.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
  }

  // 🆕 دالة للحصول على فواتير المبيعات غير المدفوعة بالكامل للعميل
  const getUnpaidInvoicesForCustomer = (customerId) => {
    if (!customerId) return []
    return invoices.filter(inv => {
      if (inv.type !== 'sales' || inv.isReturn || inv.clientId !== customerId) {
        return false
      }
      
      // تجاهل الفواتير المدفوعة بالكامل
      if (inv.paymentStatus === 'paid') {
        return false
      }
      
      // ✅ حساب المبلغ المتبقي الفعلي (بعد المرتجعات)
      const invoiceTotal = parseFloat(inv.total || 0)
      const paidAmount = parseFloat(inv.paidAmount || 0)
      const returns = getInvoiceReturns(inv.id)
      const netRemaining = invoiceTotal - paidAmount - returns
      
      // إظهار الفاتورة فقط إذا كان هناك رصيد متبقي
      return netRemaining > 0.001  // نستخدم 0.001 لتجنب مشاكل الفواصل العشرية
    })
  }

  // Get cash/bank accounts for payment
  const cashBankAccounts = accounts.filter(acc => 
    acc.type === 'cash' || acc.type === 'bank'
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.customerId) {
      showNotification(language === 'ar' ? 'الرجاء اختيار العميل' : 'Please select customer', 'error')
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

    try {
      // 1. إنشاء السند
      const voucherData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      const newVoucher = addVoucher(voucherData)

      if (!newVoucher) {
        throw new Error('فشل في إنشاء سند القبض')
      }

      // 2. إنشاء القيد المحاسبي
      // سند قبض = العميل يدفع لنا
      // من ح/ الخزينة (أو البنك)  [مدين]
      // إلى ح/ العملاء              [دائن]

      const selectedAccount = accounts.find(acc => acc.id === formData.bankAccountId)
      const customerAccount = accounts.find(acc => acc.code === '1101') // حساب العملاء

      if (!selectedAccount || !customerAccount) {
        throw new Error('لم يتم العثور على الحسابات المطلوبة')
      }

      const journalEntry = {
        date: formData.date,
        description: `سند قبض ${newVoucher.voucherNumber} - ${formData.customerName}`,
        reference: `RV-${newVoucher.voucherNumber}`,
        type: 'receipt_voucher',
        relatedVoucherId: newVoucher.id,
        lines: [
          {
            accountId: selectedAccount.id,
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debit: parseFloat(formData.amount),
            credit: 0,
            description: `استلام من ${formData.customerName}`
          },
          {
            accountId: customerAccount.id,
            accountCode: customerAccount.code,
            accountName: customerAccount.name,
            debit: 0,
            credit: parseFloat(formData.amount),
            description: `تخفيض رصيد العميل ${formData.customerName}`
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
            v.type === 'receipt' && 
            v.invoiceId === formData.invoiceId
          )
          
          // إضافة السند الحالي
          const totalPaidViaVouchers = relatedVouchers.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0) + parseFloat(formData.amount)
          
          // المبلغ المدفوع مسبقاً في الفاتورة نفسها (إن وجد)
          const previouslyPaid = parseFloat(linkedInvoice.paidAmount || 0)
          
          // إجمالي المدفوعات
          const totalPaid = previouslyPaid + totalPaidViaVouchers
          
          // 🔥 حساب إجمالي الفاتورة بعد طرح المرتجعات
          const invoiceTotal = parseFloat(linkedInvoice.total || 0)
          const invoiceReturns = getInvoiceReturns(linkedInvoice.id)
          const netInvoiceTotal = invoiceTotal - invoiceReturns
          
          console.log('💰 تحديث حالة الفاتورة:', {
            invoiceNumber: linkedInvoice.invoiceNumber,
            originalTotal: invoiceTotal,
            returns: invoiceReturns,
            netTotal: netInvoiceTotal,
            totalPaid: totalPaid,
            shouldBePaid: totalPaid >= netInvoiceTotal
          })
          
          // تحديث حالة الفاتورة
          if (netInvoiceTotal <= 0 || totalPaid >= netInvoiceTotal) {
            // المبلغ مدفوع بالكامل (أو الفاتورة مرتجعة بالكامل)
            updateInvoice(linkedInvoice.id, {
              paymentStatus: 'paid',
              paidAmount: netInvoiceTotal > 0 ? netInvoiceTotal : 0
            })
            
            showNotification(
              language === 'ar' 
                ? `✅ تم إنشاء السند وتحديث حالة الفاتورة ${linkedInvoice.invoiceNumber} إلى "مدفوع"` 
                : `✅ Voucher created and invoice ${linkedInvoice.invoiceNumber} marked as "Paid"`,
              'success'
            )
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
        // لم يتم ربط السند بفاتورة محددة
        showNotification(
          language === 'ar' 
            ? `تم إنشاء سند القبض ${newVoucher.voucherNumber} بنجاح` 
            : `Receipt voucher ${newVoucher.voucherNumber} created successfully`,
          'success'
        )
      }

      closeModal()
    } catch (error) {
      console.error('Error creating receipt voucher:', error)
      showNotification(
        language === 'ar' ? 'حدث خطأ أثناء إنشاء سند القبض' : 'Error creating receipt voucher',
        'error'
      )
    }
  }

  const handleDelete = async (voucher) => {
    if (!window.confirm(
      language === 'ar' 
        ? `هل أنت متأكد من حذف سند القبض ${voucher.voucherNumber}؟` 
        : `Are you sure you want to delete receipt voucher ${voucher.voucherNumber}?`
    )) {
      return
    }

    try {
      // حذف السند
      deleteVoucher(voucher.id)
      
      // ملاحظة: يجب أيضاً حذف أو عكس القيد المحاسبي المرتبط
      // سيتم إضافة هذا لاحقاً في useAccounting

      showNotification(
        language === 'ar' ? 'تم حذف سند القبض بنجاح' : 'Receipt voucher deleted successfully',
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
  const filteredVouchers = receiptVouchers.filter(voucher => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        voucher.voucherNumber?.toLowerCase().includes(term) ||
        voucher.customerName?.toLowerCase().includes(term) ||
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

  // Calculate total receipts
  const totalReceipts = receiptVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0)

  return (
    <div className="vouchers-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="vouchers-header">
        <div className="header-content">
          <h2>🧾 {language === 'ar' ? 'سندات القبض' : 'Receipt Vouchers'}</h2>
          <p className="subtitle">
            {language === 'ar' 
              ? 'إدارة سندات القبض من العملاء' 
              : 'Manage receipt vouchers from customers'}
          </p>
        </div>
        {hasPermission('create_vouchers') && (
          <button className="btn btn-primary" onClick={openModal}>
            ➕ {language === 'ar' ? 'سند قبض جديد' : 'New Receipt'}
          </button>
        )}
      </div>

      <div className="vouchers-stats">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">{language === 'ar' ? 'إجمالي السندات' : 'Total Receipts'}</div>
            <div className="stat-value">{receiptVouchers.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">{language === 'ar' ? 'إجمالي المبالغ' : 'Total Amount'}</div>
            <div className="stat-value">{totalReceipts.toFixed(3)}</div>
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
            <div className="empty-icon">🧾</div>
            <h3>{language === 'ar' ? 'لا توجد سندات قبض' : 'No receipt vouchers'}</h3>
            <p>{language === 'ar' ? 'ابدأ بإنشاء سند قبض جديد' : 'Start by creating a new receipt voucher'}</p>
          </div>
        ) : (
          <table className="vouchers-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
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
                  <td>{voucher.customerName}</td>
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
              <h3>🧾 {language === 'ar' ? 'سند قبض جديد' : 'New Receipt Voucher'}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{language === 'ar' ? 'العميل *' : 'Customer *'}</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value)
                      setFormData({
                        ...formData,
                        customerId: e.target.value,
                        customerName: customer?.name || '',
                        invoiceId: '' // إعادة تعيين الفاتورة عند تغيير العميل
                      })
                    }}
                    required
                  >
                    <option value="">{language === 'ar' ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 🆕 حقل اختياري لربط السند بفاتورة محددة */}
                {formData.customerId && getUnpaidInvoicesForCustomer(formData.customerId).length > 0 && (
                  <div className="form-group">
                    <label>
                      {language === 'ar' ? 'ربط بفاتورة (اختياري)' : 'Link to Invoice (Optional)'}
                      <small style={{ display: 'block', color: '#6b7280', fontSize: '0.85em', marginTop: '4px' }}>
                        {language === 'ar' 
                          ? 'اختر فاتورة لتحديث حالتها تلقائياً عند اكتمال الدفع' 
                          : 'Select an invoice to auto-update its status when payment is complete'}
                      </small>
                    </label>
                    <select
                      value={formData.invoiceId}
                      onChange={(e) => {
                        const selectedInvoice = invoices.find(inv => inv.id === e.target.value)
                        if (selectedInvoice) {
                          // ✅ حساب المبلغ المتبقي = الإجمالي - المدفوع - المرتجعات
                          const invoiceTotal = parseFloat(selectedInvoice.total || 0)
                          const paidAmount = parseFloat(selectedInvoice.paidAmount || 0)
                          const returns = getInvoiceReturns(selectedInvoice.id)
                          const remaining = invoiceTotal - paidAmount - returns
                          
                          setFormData({ 
                            ...formData, 
                            invoiceId: e.target.value,
                            amount: remaining > 0 ? remaining.toFixed(3) : 0
                          })
                        } else {
                          setFormData({ ...formData, invoiceId: '', amount: 0 })
                        }
                      }}
                    >
                      <option value="">{language === 'ar' ? '-- بدون ربط بفاتورة --' : '-- No Invoice Link --'}</option>
                      {getUnpaidInvoicesForCustomer(formData.customerId).map(invoice => {
                        // ✅ حساب المبلغ المتبقي مع المرتجعات
                        const invoiceTotal = parseFloat(invoice.total || 0)
                        const paidAmount = parseFloat(invoice.paidAmount || 0)
                        const returns = getInvoiceReturns(invoice.id)
                        const remaining = invoiceTotal - paidAmount - returns
                        
                        return (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {language === 'ar' ? 'المتبقي:' : 'Remaining:'} {remaining.toFixed(3)}
                            {returns > 0 && ` (${language === 'ar' ? 'مرتجع' : 'returned'}: ${returns.toFixed(3)})`}
                          </option>
                        )
                      })}
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
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
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
                    <option value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                    <option value="bank">{language === 'ar' ? 'بنك' : 'Bank'}</option>
                    <option value="check">{language === 'ar' ? 'شيك' : 'Check'}</option>
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

export default ReceiptVouchers
