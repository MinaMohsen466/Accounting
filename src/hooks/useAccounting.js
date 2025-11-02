import { useState, useEffect } from 'react'
import DataService from '../services/DataService'

// Custom hook for managing accounting data
export const useAccounting = () => {
  const [accounts, setAccounts] = useState([])
  const [journalEntries, setJournalEntries] = useState([])
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [vouchers, setVouchers] = useState([]) // 🆕 سندات القبض والدفع
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize data on component mount
  useEffect(() => {
    try {
      // التأكد من وجود الحسابات الأساسية الضرورية عند بدء التطبيق
      const loadedAccounts = DataService.getAccounts()
      
      // إنشاء الحسابات الأساسية إذا لم تكن موجودة
      const essentialAccounts = [
        { code: '1001', name: 'الخزينة', nameEn: 'Cash', type: 'cash', category: 'current_assets', description: 'الخزينة النقدية', balance: 0 },
        { code: '1002', name: 'البنك', nameEn: 'Bank', type: 'bank', category: 'current_assets', description: 'الحساب البنكي', balance: 0 },
        { code: '1101', name: 'العملاء', nameEn: 'Customers', type: 'asset', category: 'current_assets', subcategory: 'accounts_receivable', description: 'حسابات العملاء', balance: 0 },
        { code: '1201', name: 'المخزون', nameEn: 'Inventory', type: 'asset', category: 'current_assets', description: 'مخزون البضاعة', balance: 0 },
        { code: '1301', name: 'ضريبة القيمة المضافة مدفوعة', nameEn: 'VAT Paid', type: 'asset', category: 'current_assets', description: 'ضريبة مدفوعة على المشتريات', balance: 0 },
        { code: '2001', name: 'الموردون', nameEn: 'Suppliers', type: 'liability', category: 'current_liabilities', description: 'حسابات الموردين', balance: 0 },
        { code: '2102', name: 'ضريبة القيمة المضافة مستحقة', nameEn: 'VAT Payable', type: 'liability', category: 'current_liabilities', description: 'ضريبة مستحقة على المبيعات', balance: 0 },
        { code: '4001', name: 'المبيعات', nameEn: 'Sales', type: 'revenue', category: 'operating_revenue', description: 'إيرادات المبيعات', balance: 0 },
        { code: '4002', name: 'خصم مكتسب', nameEn: 'Purchase Discounts', type: 'revenue', category: 'other_revenue', description: 'خصومات مكتسبة من الموردين', balance: 0 },
        { code: '5001', name: 'المشتريات', nameEn: 'Purchases', type: 'expense', category: 'cost_of_sales', description: 'تكلفة المشتريات', balance: 0 },
        { code: '5101', name: 'مصروفات الرواتب', nameEn: 'Salaries Expense', type: 'expense', category: 'operating_expenses', description: 'رواتب ومكافآت الموظفين', balance: 0 },
        { code: '5102', name: 'مصروفات الإيجار', nameEn: 'Rent Expense', type: 'expense', category: 'operating_expenses', description: 'إيجار المحل أو المكتب', balance: 0 },
        { code: '5103', name: 'مصروفات الضيافة', nameEn: 'Hospitality Expense', type: 'expense', category: 'operating_expenses', description: 'مصروفات الضيافة والاستقبال', balance: 0 },
        { code: '5201', name: 'خصم مسموح به', nameEn: 'Sales Discounts', type: 'expense', category: 'selling_expenses', description: 'خصومات ممنوحة للعملاء', balance: 0 }
      ]
      
      let accountsCreated = 0
      essentialAccounts.forEach(accData => {
        const exists = loadedAccounts.find(acc => acc.code === accData.code)
        if (!exists) {
          DataService.addAccount(accData)
          accountsCreated++
        }
      })
      
      if (accountsCreated > 0) {
        console.log(`✅ تم إنشاء ${accountsCreated} حساب أساسي تلقائياً`)
      }

      // Initialize default customers and suppliers
      DataService.initializeDefaultCustomersSuppliers()

      // Initialize default inventory items
      DataService.initializeDefaultInventoryItems()
      
      // Load all data
      setAccounts(DataService.getAccounts())
      setJournalEntries(DataService.getJournalEntries())
      setInvoices(DataService.getInvoices())
      setCustomers(DataService.getCustomers())
      setSuppliers(DataService.getSuppliers())
      setInventoryItems(DataService.getInventoryItems())
      setVouchers(DataService.getVouchers()) // 🆕 تحميل السندات
    } catch (err) {
      setError('خطأ في تحميل البيانات')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for data update events and refresh data
  useEffect(() => {
    const handleDataUpdate = () => {
      setAccounts(DataService.getAccounts())
      setJournalEntries(DataService.getJournalEntries())
      setInvoices(DataService.getInvoices())
      setCustomers(DataService.getCustomers())
      setSuppliers(DataService.getSuppliers())
      setInventoryItems(DataService.getInventoryItems())
      setVouchers(DataService.getVouchers()) // 🆕 تحديث السندات
    }

    window.addEventListener('accountingDataUpdated', handleDataUpdate)
    return () => window.removeEventListener('accountingDataUpdated', handleDataUpdate)
  }, [])

  // Account operations
  const addAccount = (accountData) => {
    try {
      const newAccount = DataService.addAccount(accountData)
      if (newAccount) {
        setAccounts(prev => [...prev, newAccount])
        return { success: true, data: newAccount }
      }
      return { success: false, error: 'فشل في إضافة الحساب' }
    } catch (err) {
      console.error('Error adding account:', err)
      return { success: false, error: 'خطأ في إضافة الحساب' }
    }
  }

  const updateAccount = (id, updatedData) => {
    try {
      const updatedAccount = DataService.updateAccount(id, updatedData)
      if (updatedAccount) {
        setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc))
        return { success: true, data: updatedAccount }
      }
      return { success: false, error: 'فشل في تحديث الحساب' }
    } catch (err) {
      console.error('Error updating account:', err)
      return { success: false, error: 'خطأ في تحديث الحساب' }
    }
  }

  const deleteAccount = (id) => {
    try {
      if (DataService.deleteAccount(id)) {
        setAccounts(prev => prev.filter(acc => acc.id !== id))
        return { success: true }
      }
      return { success: false, error: 'فشل في حذف الحساب' }
    } catch (err) {
      console.error('Error deleting account:', err)
      return { success: false, error: 'خطأ في حذف الحساب' }
    }
  }

  // Journal entry operations
  const addJournalEntry = (entryData) => {
    try {
      const newEntry = DataService.addJournalEntry(entryData)
      if (newEntry) {
        setJournalEntries(prev => [...prev, newEntry])
        return { success: true, data: newEntry }
      }
      return { success: false, error: 'فشل في إضافة القيد' }
    } catch (err) {
      console.error('Error adding journal entry:', err)
      return { success: false, error: 'خطأ في إضافة القيد' }
    }
  }

  const updateJournalEntry = (id, updatedData) => {
    try {
      const updatedEntry = DataService.updateJournalEntry(id, updatedData)
      if (updatedEntry) {
        setJournalEntries(prev => prev.map(entry => entry.id === id ? updatedEntry : entry))
        return { success: true, data: updatedEntry }
      }
      return { success: false, error: 'فشل في تحديث القيد' }
    } catch (err) {
      console.error('Error updating journal entry:', err)
      return { success: false, error: 'خطأ في تحديث القيد' }
    }
  }

  const deleteJournalEntry = (id) => {
    try {
      if (DataService.deleteJournalEntry(id)) {
        setJournalEntries(prev => prev.filter(entry => entry.id !== id))
        return { success: true }
      }
      return { success: false, error: 'فشل في حذف القيد' }
    } catch (err) {
      console.error('Error deleting journal entry:', err)
      return { success: false, error: 'خطأ في حذف القيد' }
    }
  }

  // Invoice operations
  const addInvoice = (invoiceData) => {
    try {
      console.log('📥 إضافة فاتورة جديدة:', {
        type: invoiceData.type,
        invoiceNumber: invoiceData.invoiceNumber,
        subtotal: invoiceData.subtotal,
        discountAmount: invoiceData.discountAmount,
        vatAmount: invoiceData.vatAmount,
        total: invoiceData.total,
        itemsCount: invoiceData.items?.length,
        createJournalEntry: invoiceData.createJournalEntry
      })
      
      // 🔥 إصلاح: إذا كانت الفاتورة مدفوعة، تعيين paidAmount = total
      const invoiceToSave = { ...invoiceData }
      if (invoiceToSave.paymentStatus === 'paid' && !invoiceToSave.paidAmount) {
        invoiceToSave.paidAmount = invoiceToSave.total
        console.log('✅ تم تعيين paidAmount للفاتورة المدفوعة:', invoiceToSave.paidAmount)
      }
      
      // If the form provided only a date (YYYY-MM-DD) it will be interpreted
      // as midnight UTC which can display as a shifted time (e.g. 03:00) in local TZ.
      // Combine the selected date with the current local time so the stored
      // invoice.date reflects the creation time the user expects.
      try {
        const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(String(invoiceData.date))
        if (dateOnlyMatch) {
          const parts = invoiceData.date.split('-').map(Number)
          const now = new Date()
          const combined = new Date()
          combined.setFullYear(parts[0], parts[1] - 1, parts[2])
          combined.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
          invoiceToSave.date = combined.toISOString()
        } else if (!invoiceData.date) {
          invoiceToSave.date = new Date().toISOString()
        }
      } catch {
        // fallback to current timestamp if anything goes wrong
        invoiceToSave.date = new Date().toISOString()
      }

      const newInvoice = DataService.addInvoice(invoiceToSave)
      console.log('✅ الفاتورة بعد الحفظ:', {
        id: newInvoice?.id,
        subtotal: newInvoice?.subtotal,
        discountAmount: newInvoice?.discountAmount,
        vatAmount: newInvoice?.vatAmount,
        total: newInvoice?.total
      })
      
      if (newInvoice) {
        setInvoices(prev => [...prev, newInvoice])
        // Refresh customers/suppliers in case DataService adjusted balances
        setCustomers(DataService.getCustomers())
        setSuppliers(DataService.getSuppliers())
        window.dispatchEvent(new Event('accountingDataUpdated'))
        
        // Create automatic journal entry for the invoice
        if (invoiceData.createJournalEntry) {
          console.log('🔄 إنشاء قيد يومي تلقائي...')
          const journalEntry = createJournalEntryFromInvoice(newInvoice)
          console.log('📋 القيد المُنشأ:', {
            reference: journalEntry.reference,
            linesCount: journalEntry.lines?.length,
            lines: journalEntry.lines?.map(l => ({
              accountName: l.accountName,
              debit: l.debit,
              credit: l.credit
            }))
          })
          
          // التحقق من عدم وجود قيد نشط (غير معكوس) بنفس المرجع
          const existingEntries = DataService.getJournalEntries()
          const existingEntry = existingEntries.find(entry => entry.reference === journalEntry.reference)
          const hasReversalEntry = existingEntries.find(entry => entry.reference === `REV-${journalEntry.reference}`)
          
          // إذا كان القيد موجود ولم يتم عكسه، فهو مكرر
          if (existingEntry && !hasReversalEntry) {
            console.warn('⚠️ القيد موجود مسبقاً ونشط (لم يتم عكسه):', journalEntry.reference)
            console.log('   → تخطي إنشاء قيد مكرر')
          } else {
            if (existingEntry && hasReversalEntry) {
              console.log('✅ القيد القديم تم عكسه، يمكن إنشاء قيد جديد:', journalEntry.reference)
            }
            addJournalEntry(journalEntry)
            console.log('✅ تم إضافة القيد بنجاح')
          }
        }
        
        return { success: true, data: newInvoice }
      }
      return { success: false, error: 'فشل في إضافة الفاتورة' }
    } catch (err) {
      console.error('Error adding invoice:', err)
      return { success: false, error: 'خطأ في إضافة الفاتورة' }
    }
  }

  const updateInvoice = (id, updatedData) => {
    try {
      const updatedInvoice = DataService.updateInvoice(id, updatedData)
      if (updatedInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv))
        return { success: true, data: updatedInvoice }
      }
      return { success: false, error: 'فشل في تحديث الفاتورة' }
    } catch (err) {
      console.error('Error updating invoice:', err)
      return { success: false, error: 'خطأ في تحديث الفاتورة' }
    }
  }

  const deleteInvoice = (id) => {
    try {
      if (DataService.deleteInvoice(id)) {
        // Refresh invoices and related entities so UI reflects updated opening balances
        setInvoices(DataService.getInvoices())
        setCustomers(DataService.getCustomers())
        setSuppliers(DataService.getSuppliers())
        // Notify any listeners that accounting data changed
        window.dispatchEvent(new Event('accountingDataUpdated'))
        return { success: true }
      }
      return { success: false, error: 'فشل في حذف الفاتورة' }
    } catch (err) {
      console.error('Error deleting invoice:', err)
      return { success: false, error: 'خطأ في حذف الفاتورة' }
    }
  }

  // Customer operations
  const addCustomer = (customerData) => {
    try {
      // 1. إضافة العميل أولاً
      const newCustomer = DataService.addCustomer(customerData)
      if (newCustomer) {
        // 2. إنشاء حساب محاسبي للعميل تلقائياً
        const customerAccount = {
          code: `1101-${newCustomer.id.slice(0, 8)}`,
          name: `عميل: ${newCustomer.name}`,
          nameEn: `Customer: ${newCustomer.name}`,
          type: 'asset',
          category: 'current_assets',
          subcategory: 'accounts_receivable',
          parentAccount: '1101',
          description: `حساب العميل ${newCustomer.name}`,
          linkedEntityType: 'customer',
          linkedEntityId: newCustomer.id,
          balance: 0
        }
        
        const accountResult = addAccount(customerAccount)
        
        // 3. ربط الحساب بالعميل
        if (accountResult.success) {
          DataService.updateCustomer(newCustomer.id, {
            accountId: accountResult.data.id
          })
          
          // 4. تسجيل الرصيد الابتدائي إذا كان موجوداً
          if (customerData.balance && parseFloat(customerData.balance) !== 0) {
            const balance = parseFloat(customerData.balance)
            const openingEntry = {
              date: new Date().toISOString().split('T')[0],
              description: `رصيد افتتاحي للعميل: ${newCustomer.name}`,
              reference: `OP-CUST-${newCustomer.id.slice(0, 8)}`,
              lines: balance > 0 
                ? [
                    // رصيد مدين (العميل مدين لنا)
                    {
                      accountCode: accountResult.data.code,
                      accountName: accountResult.data.name,
                      debit: Math.abs(balance),
                      credit: 0,
                      description: 'رصيد افتتاحي مدين'
                    },
                    {
                      accountCode: '3101', // حساب رأس المال أو الأرباح المرحلة
                      accountName: 'رأس المال',
                      debit: 0,
                      credit: Math.abs(balance),
                      description: 'مقابل رصيد افتتاحي'
                    }
                  ]
                : [
                    // رصيد دائن (دفعنا للعميل مقدماً)
                    {
                      accountCode: accountResult.data.code,
                      accountName: accountResult.data.name,
                      debit: 0,
                      credit: Math.abs(balance),
                      description: 'رصيد افتتاحي دائن'
                    },
                    {
                      accountCode: '3101',
                      accountName: 'رأس المال',
                      debit: Math.abs(balance),
                      credit: 0,
                      description: 'مقابل رصيد افتتاحي'
                    }
                  ]
            }
            
            addJournalEntry(openingEntry)
          }
        }
        
        setCustomers(prev => [...prev, newCustomer])
        window.dispatchEvent(new Event('accountingDataUpdated'))
        
        return { 
          success: true, 
          data: newCustomer, 
          account: accountResult.success ? accountResult.data : null 
        }
      }
      return { success: false, error: 'فشل في إضافة العميل' }
    } catch (err) {
      console.error('Error adding customer:', err)
      return { success: false, error: 'خطأ في إضافة العميل' }
    }
  }

  const updateCustomer = (id, updatedData) => {
    try {
      const updatedCustomer = DataService.updateCustomer(id, updatedData)
      if (updatedCustomer) {
        setCustomers(prev => prev.map(cust => cust.id === id ? updatedCustomer : cust))
        return { success: true, data: updatedCustomer }
      }
      return { success: false, error: 'فشل في تحديث العميل' }
    } catch (err) {
      console.error('Error updating customer:', err)
      return { success: false, error: 'خطأ في تحديث العميل' }
    }
  }

  const deleteCustomer = (id) => {
    try {
      if (DataService.deleteCustomer(id)) {
        setCustomers(prev => prev.filter(cust => cust.id !== id))
        return { success: true }
      }
      return { success: false, error: 'فشل في حذف العميل' }
    } catch (err) {
      console.error('Error deleting customer:', err)
      return { success: false, error: 'خطأ في حذف العميل' }
    }
  }

  // Supplier operations
  const addSupplier = (supplierData) => {
    try {
      // 1. إضافة المورد أولاً
      const newSupplier = DataService.addSupplier(supplierData)
      if (newSupplier) {
        // 2. إنشاء حساب محاسبي للمورد تلقائياً (حساب فرعي من 2001 - الموردون)
        const supplierAccount = {
          code: `2001-${newSupplier.id.slice(0, 8)}`,
          name: `مورد: ${newSupplier.name}`,
          nameEn: `Supplier: ${newSupplier.name}`,
          type: 'liability',
          category: 'current_liabilities',
          subcategory: 'accounts_payable',
          parentAccount: '2001',  // ✅ الحساب الأب: 2001 - الموردون
          description: `حساب المورد ${newSupplier.name}`,
          linkedEntityType: 'supplier',
          linkedEntityId: newSupplier.id,
          balance: 0
        }
        
        const accountResult = addAccount(supplierAccount)
        
        // 3. ربط الحساب بالمورد
        if (accountResult.success) {
          DataService.updateSupplier(newSupplier.id, {
            accountId: accountResult.data.id
          })
          
          // 4. تسجيل الرصيد الابتدائي إذا كان موجوداً
          if (supplierData.balance && parseFloat(supplierData.balance) !== 0) {
            const balance = parseFloat(supplierData.balance)
            const openingEntry = {
              date: new Date().toISOString().split('T')[0],
              description: `رصيد افتتاحي للمورد: ${newSupplier.name}`,
              reference: `OP-SUP-${newSupplier.id.slice(0, 8)}`,
              lines: balance > 0 
                ? [
                    // رصيد دائن (علينا للمورد)
                    {
                      accountCode: accountResult.data.code,
                      accountName: accountResult.data.name,
                      debit: 0,
                      credit: Math.abs(balance),
                      description: 'رصيد افتتاحي دائن'
                    },
                    {
                      accountCode: '3101', // حساب رأس المال أو الأرباح المرحلة
                      accountName: 'رأس المال',
                      debit: Math.abs(balance),
                      credit: 0,
                      description: 'مقابل رصيد افتتاحي'
                    }
                  ]
                : [
                    // رصيد مدين (للمورد علينا - دفعنا مقدماً)
                    {
                      accountCode: accountResult.data.code,
                      accountName: accountResult.data.name,
                      debit: Math.abs(balance),
                      credit: 0,
                      description: 'رصيد افتتاحي مدين'
                    },
                    {
                      accountCode: '3101',
                      accountName: 'رأس المال',
                      debit: 0,
                      credit: Math.abs(balance),
                      description: 'مقابل رصيد افتتاحي'
                    }
                  ]
            }
            
            addJournalEntry(openingEntry)
          }
        }
        
        setSuppliers(prev => [...prev, newSupplier])
        return { success: true, data: newSupplier }
      }
      return { success: false, error: 'فشل في إضافة المورد' }
    } catch (err) {
      console.error('Error adding supplier:', err)
      return { success: false, error: 'خطأ في إضافة المورد' }
    }
  }

  const updateSupplier = (id, updatedData) => {
    try {
      const updatedSupplier = DataService.updateSupplier(id, updatedData)
      if (updatedSupplier) {
        setSuppliers(prev => prev.map(supp => supp.id === id ? updatedSupplier : supp))
        return { success: true, data: updatedSupplier }
      }
      return { success: false, error: 'فشل في تحديث المورد' }
    } catch (err) {
      console.error('Error updating supplier:', err)
      return { success: false, error: 'خطأ في تحديث المورد' }
    }
  }

  const deleteSupplier = (id) => {
    try {
      if (DataService.deleteSupplier(id)) {
        setSuppliers(prev => prev.filter(supp => supp.id !== id))
        return { success: true }
      }
      return { success: false, error: 'فشل في حذف المورد' }
    } catch (err) {
      console.error('Error deleting supplier:', err)
      return { success: false, error: 'خطأ في حذف المورد' }
    }
  }

  // Inventory operations
  const addInventoryItem = (itemData) => {
    try {
      const newItem = DataService.addInventoryItem(itemData)
      if (newItem) {
        setInventoryItems(prev => [...prev, newItem])
        return { success: true, data: newItem }
      }
      return { success: false, error: 'فشل في إضافة الصنف' }
    } catch (err) {
      console.error('Error adding inventory item:', err)
      return { success: false, error: 'خطأ في إضافة الصنف' }
    }
  }

  const updateInventoryItem = (id, updatedData) => {
    try {
      const updatedItem = DataService.updateInventoryItem(id, updatedData)
      if (updatedItem) {
        setInventoryItems(prev => prev.map(item => item.id === id ? updatedItem : item))
        return { success: true, data: updatedItem }
      }
      return { success: false, error: 'فشل في تحديث الصنف' }
    } catch (err) {
      console.error('Error updating inventory item:', err)
      return { success: false, error: 'خطأ في تحديث الصنف' }
    }
  }

  const deleteInventoryItem = (id) => {
    try {
      if (DataService.deleteInventoryItem(id)) {
        setInventoryItems(prev => prev.filter(item => item.id !== id))
        return { success: true }
      }
      return { success: false, error: 'فشل في حذف الصنف' }
    } catch (err) {
      console.error('Error deleting inventory item:', err)
      return { success: false, error: 'خطأ في حذف الصنف' }
    }
  }

  // دالة مساعدة لإنشاء حساب إذا لم يكن موجوداً
  const ensureAccountExists = (code, accountData) => {
    let account = accounts.find(acc => acc.code === code)
    if (!account) {
      console.log(`⚠️ الحساب ${code} غير موجود، جاري إنشاؤه...`)
      const result = addAccount({ ...accountData, code })
      if (result.success) {
        account = result.data
        console.log(`✅ تم إنشاء الحساب ${code} - ${accountData.name}`)
      } else {
        console.error(`❌ فشل إنشاء الحساب ${code}`)
      }
    }
    return account
  }

  // Helper function to create journal entry from invoice
  const createJournalEntryFromInvoice = (invoice) => {
    const lines = []
    const isReturn = invoice.isReturn === true
    const isPaid = invoice.paymentStatus === 'paid'
    const paymentMethod = invoice.paymentMethod || 'cash'
    const paymentBankAccountId = invoice.paymentBankAccountId
    
    console.log('🔍 بدء إنشاء القيد من الفاتورة:', {
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      isReturn,
      isPaid,
      paymentMethod,
      paymentBankAccountId,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      vatAmount: invoice.vatAmount,
      total: invoice.total
    })
    
    if (invoice.type === 'sales') {
      // Sales invoice: Debit Customer Account, Credit Sales, Handle Discount and VAT
      
      // البحث عن حساب العميل المحدد (إن وُجد) - دعم الحقول clientId أو customerId
      let customerAccount = null
      const customerId = invoice.clientId || invoice.customerId
      if (customerId) {
        customerAccount = accounts.find(acc => 
          acc.linkedEntityType === 'customer' && 
          acc.linkedEntityId === customerId
        )
      }
      
      // إذا لم يُعثر على حساب خاص بالعميل، استخدم حساب العملاء العام (وأنشئه إن لم يكن موجوداً)
      if (!customerAccount) {
        customerAccount = ensureAccountExists('1101', {
          name: 'العملاء',
          nameEn: 'Customers',
          type: 'asset',
          category: 'current_assets',
          subcategory: 'accounts_receivable',
          description: 'حسابات العملاء',
          balance: 0
        })
      }
      
      // التأكد من وجود الحسابات الأساسية (وإنشائها تلقائياً إن لم تكن موجودة)
      const salesAccount = ensureAccountExists('4001', {
        name: 'المبيعات',
        nameEn: 'Sales',
        type: 'revenue',
        category: 'operating_revenue',
        description: 'إيرادات المبيعات',
        balance: 0
      })
      
      const discountAccount = ensureAccountExists('5201', {
        name: 'خصم مسموح به',
        nameEn: 'Sales Discounts',
        type: 'expense',
        category: 'selling_expenses',
        description: 'خصومات ممنوحة للعملاء',
        balance: 0
      })
      
      const vatAccount = ensureAccountExists('2102', {
        name: 'ضريبة القيمة المضافة مستحقة',
        nameEn: 'VAT Payable',
        type: 'liability',
        category: 'current_liabilities',
        description: 'ضريبة مستحقة على المبيعات',
        balance: 0
      })
      
      console.log('🔍 الحسابات المستخدمة في قيد المبيعات:', {
        customerAccount: customerAccount ? { code: customerAccount.code, name: customerAccount.name } : 'غير موجود',
        salesAccount: salesAccount ? { code: salesAccount.code, name: salesAccount.name } : 'غير موجود',
        discountAccount: discountAccount ? { code: discountAccount.code, name: discountAccount.name } : 'غير موجود',
        vatAccount: vatAccount ? { code: vatAccount.code, name: vatAccount.name } : 'غير موجود'
      })
      
      const subtotal = parseFloat(invoice.subtotal) || 0
      const invoiceDiscountAmount = parseFloat(invoice.discountAmount) || 0
      const vatAmount = parseFloat(invoice.vatAmount) || 0
      const total = parseFloat(invoice.total) || 0
      
      console.log('💰 القيم المحسوبة:', {
        subtotal,
        invoiceDiscountAmount,
        vatAmount,
        total
      })
      
      if (!customerAccount || !salesAccount) {
        console.error('❌ فشل إنشاء الحسابات الأساسية!')
        return {
          date: invoice.date,
          description: `⚠️ فشل إنشاء قيد تلقائي - فشل إنشاء الحسابات - فاتورة مبيعات رقم ${invoice.invoiceNumber}`,
          lines: [],
          reference: `INV-${invoice.invoiceNumber}`,
          type: 'automatic'
        }
      }
      
      // ✅ تحديد الحساب المستخدم في القيد
      // 
      // 🔹 فاتورة مبيعات عادية (ليست مرتجع):
      //    - إذا مدفوعة: نستخدم الخزينة/البنك
      //    - إذا آجلة: نستخدم حساب العميل
      //
      // 🔹 مرتجع مبيعات:
      //    - دائماً نستخدم الخزينة (لأننا نرجع المال للعميل)
      //    - و حساب العميل (لتخفيض مديونيته لنا)
      
      let paymentAccount = customerAccount
      
      if (isReturn || isPaid) {
        // ✅ المرتجع أو الفاتورة المدفوعة: نستخدم الخزينة/البنك
        if (paymentMethod === 'bank' && paymentBankAccountId) {
          paymentAccount = accounts.find(acc => acc.id === paymentBankAccountId)
          if (!paymentAccount) {
            console.warn('⚠️ لم يتم العثور على حساب البنك، استخدام الخزينة')
            paymentAccount = ensureAccountExists('1001', {
              name: 'الخزينة',
              nameEn: 'Cash',
              type: 'asset',
              category: 'current_assets',
              description: 'الخزينة النقدية',
              balance: 0
            })
          }
        } else {
          paymentAccount = ensureAccountExists('1001', {
            name: 'الخزينة',
            nameEn: 'Cash',
            type: 'asset',
            category: 'current_assets',
            description: 'الخزينة النقدية',
            balance: 0
          })
        }
        console.log('💳 استخدام حساب:', {
          code: paymentAccount.code,
          name: paymentAccount.name,
          reason: isReturn ? 'مرتجع (إرجاع مال)' : 'مدفوعة',
          paymentMethod
        })
      }
      
      // ✅ تصحيح منطق مرتجع المبيعات
      //
      // 🔹 فاتورة مبيعات عادية:
      //    - مدين: العميل (أو الخزينة إذا مدفوعة)
      //    - دائن: المبيعات، الضريبة
      //    → العميل مدين لنا (أو استلمنا المال في الخزينة)
      //
      // 🔹 مرتجع مبيعات:
      //    - مدين: المبيعات، الضريبة (نعكس القيد)
      //    - دائن: الخزينة (نرجع المال للعميل)
      //    - دائن: العميل (نُنقص مديونيته لنا)
      
      if (isReturn) {
        // ✅ في حالة مرتجع المبيعات:
        // القيد الصحيح:
        //   من حـ/ مردودات المبيعات (مدين - نسجل المرتجع)
        //       إلى حـ/ الخزينة (دائن - نرجع المال فعلياً)
        //
        // ملاحظة: رصيد العميل لا يتأثر بالقيد لأن الفاتورة نفسها (isReturn=true)
        // يتم استثناؤها من حساب الرصيد في calculateTotalBalance
        
        const cashAccount = ensureAccountExists('1001', {
          name: 'الخزينة',
          nameEn: 'Cash',
          type: 'asset',
          category: 'current_assets',
          description: 'الخزينة النقدية',
          balance: 0
        })
        
        lines.push({
          accountId: cashAccount.id,
          accountName: cashAccount.name,
          debit: 0,
          credit: total,  // دائن (نرجع المال من الخزينة)
          description: `إرجاع مبلغ مرتجع مبيعات رقم ${invoice.invoiceNumber}`
        })
      } else {
        // ✅ فاتورة عادية: العميل/الخزينة/البنك مدين
        lines.push({
          accountId: paymentAccount.id,
          accountName: paymentAccount.name,
          debit: total,  // مدين (العميل يدين لنا أو استلمنا المال)
          credit: 0,
          description: `فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
      }
      
      // Credit Sales for subtotal (before discount and VAT)
      // إذا كانت فاتورة إرجاع، نعكس المدين والدائن
      lines.push({
        accountId: salesAccount.id,
        accountName: salesAccount.name,
        debit: isReturn ? subtotal : 0,
        credit: isReturn ? 0 : subtotal,
        description: `${isReturn ? 'إرجاع ' : ''}فاتورة مبيعات رقم ${invoice.invoiceNumber}`
      })
      
      // Handle discount if any
      if (invoiceDiscountAmount > 0 && discountAccount) {
        lines.push({
          accountId: discountAccount.id,
          accountName: discountAccount.name,
          debit: isReturn ? 0 : invoiceDiscountAmount,
          credit: isReturn ? invoiceDiscountAmount : 0,
          description: `خصم مسموح - ${isReturn ? 'إرجاع ' : ''}فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
      }
      
      // Handle VAT if any
      if (vatAmount > 0 && vatAccount) {
        lines.push({
          accountId: vatAccount.id,
          accountName: vatAccount.name,
          debit: isReturn ? vatAmount : 0,
          credit: isReturn ? 0 : vatAmount,
          description: `ضريبة قيمة مضافة - ${isReturn ? 'إرجاع ' : ''}فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
      }
      
    } else if (invoice.type === 'purchase') {
      // Purchase invoice: Debit Inventory/Expenses, Credit Supplier, Handle Discount and VAT
      
      // البحث عن حساب المورد المحدد (إن وُجد)
      let supplierAccount = null
      const supplierId = invoice.clientId || invoice.supplierId
      if (supplierId) {
        supplierAccount = accounts.find(acc => 
          acc.linkedEntityType === 'supplier' && 
          acc.linkedEntityId === supplierId
        )
      }
      
      // إذا لم يُعثر على حساب خاص بالمورد، استخدم حساب الموردين العام (وأنشئه إن لم يكن موجوداً)
      if (!supplierAccount) {
        supplierAccount = ensureAccountExists('2001', {
          name: 'الموردون',
          nameEn: 'Suppliers',
          type: 'liability',
          category: 'current_liabilities',
          description: 'حسابات الموردين',
          balance: 0
        })
      }
      
      // التأكد من وجود الحسابات الأساسية (وإنشائها تلقائياً إن لم تكن موجودة)
      const purchasesAccount = ensureAccountExists('5001', {
        name: 'المشتريات',
        nameEn: 'Purchases',
        type: 'expense',
        category: 'cost_of_sales',
        description: 'تكلفة المشتريات',
        balance: 0
      })
      
      const inventoryAccount = ensureAccountExists('1201', {
        name: 'المخزون',
        nameEn: 'Inventory',
        type: 'asset',
        category: 'current_assets',
        description: 'مخزون البضاعة',
        balance: 0
      })
      
      const discountAccount = ensureAccountExists('4002', {
        name: 'خصم مكتسب',
        nameEn: 'Purchase Discounts',
        type: 'revenue',
        category: 'other_revenue',
        description: 'خصومات مكتسبة من الموردين',
        balance: 0
      })
      
      const vatAccount = ensureAccountExists('1301', {
        name: 'ضريبة القيمة المضافة مدفوعة',
        nameEn: 'VAT Paid',
        type: 'asset',
        category: 'current_assets',
        description: 'ضريبة مدفوعة على المشتريات',
        balance: 0
      })
      
      console.log('🔍 الحسابات المستخدمة في قيد المشتريات:', {
        supplierAccount: supplierAccount ? { code: supplierAccount.code, name: supplierAccount.name } : 'غير موجود',
        purchasesAccount: purchasesAccount ? { code: purchasesAccount.code, name: purchasesAccount.name } : 'غير موجود',
        inventoryAccount: inventoryAccount ? { code: inventoryAccount.code, name: inventoryAccount.name } : 'غير موجود',
        discountAccount: discountAccount ? { code: discountAccount.code, name: discountAccount.name } : 'غير موجود',
        vatAccount: vatAccount ? { code: vatAccount.code, name: vatAccount.name } : 'غير موجود'
      })
      
      const subtotal = parseFloat(invoice.subtotal) || 0
      const invoiceDiscountAmount = parseFloat(invoice.discountAmount) || 0
      const vatAmount = parseFloat(invoice.vatAmount) || 0
      const total = parseFloat(invoice.total) || 0
      
      console.log('💰 القيم المحسوبة:', {
        subtotal,
        invoiceDiscountAmount,
        vatAmount,
        total
      })
      
      if (!supplierAccount || !purchasesAccount) {
        console.error('❌ فشل إنشاء الحسابات الأساسية!')
        return {
          date: invoice.date,
          description: `⚠️ فشل إنشاء قيد تلقائي - فشل إنشاء الحسابات - فاتورة مشتريات رقم ${invoice.invoiceNumber}`,
          lines: [],
          reference: `INV-${invoice.invoiceNumber}`,
          type: 'automatic'
        }
      }
      
      // 🔥 تحديد الحساب المستخدم في القيد
      let paymentAccount = supplierAccount
      
      // ✅ إذا كانت فاتورة إرجاع، نستخدم الخزينة/البنك دائماً (نسترجع المال)
      // ✅ إذا كانت فاتورة مدفوعة، نستخدم الخزينة/البنك (تم الدفع)
      // ❌ إذا كانت آجلة (غير مدفوعة وغير مرتجع)، نستخدم حساب المورد
      if (isReturn || isPaid) {
        if (paymentMethod === 'bank' && paymentBankAccountId) {
          // البحث عن حساب البنك المحدد
          paymentAccount = accounts.find(acc => acc.id === paymentBankAccountId)
          if (!paymentAccount) {
            console.warn('⚠️ لم يتم العثور على حساب البنك، استخدام الخزينة')
            paymentAccount = ensureAccountExists('1001', {
              name: 'الخزينة',
              nameEn: 'Cash',
              type: 'asset',
              category: 'current_assets',
              description: 'الخزينة النقدية',
              balance: 0
            })
          }
        } else {
          // استخدام حساب الخزينة للدفع النقدي أو الإرجاع
          paymentAccount = ensureAccountExists('1001', {
            name: 'الخزينة',
            nameEn: 'Cash',
            type: 'asset',
            category: 'current_assets',
            description: 'الخزينة النقدية',
            balance: 0
          })
        }
        console.log('💳 استخدام حساب:', {
          code: paymentAccount.code,
          name: paymentAccount.name,
          reason: isReturn ? 'مرتجع (استرجاع مال)' : 'مدفوعة',
          paymentMethod
        })
      }
      
      // Debit Purchases for subtotal (before discount and VAT)
      // إذا كانت فاتورة إرجاع، نعكس المدين والدائن
      lines.push({
        accountId: purchasesAccount.id,
        accountName: purchasesAccount.name,
        debit: isReturn ? 0 : subtotal,
        credit: isReturn ? subtotal : 0,
        description: `${isReturn ? 'إرجاع ' : ''}فاتورة مشتريات رقم ${invoice.invoiceNumber}`
      })
      
      // Handle discount if any
      if (invoiceDiscountAmount > 0 && discountAccount) {
        lines.push({
          accountId: discountAccount.id,
          accountName: discountAccount.name,
          debit: isReturn ? invoiceDiscountAmount : 0,
          credit: isReturn ? 0 : invoiceDiscountAmount,
          description: `خصم مكتسب - ${isReturn ? 'إرجاع ' : ''}فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        })
      }
      
      // Handle VAT if any
      if (vatAmount > 0 && vatAccount) {
        lines.push({
          accountId: vatAccount.id,
          accountName: vatAccount.name,
          debit: isReturn ? 0 : vatAmount,
          credit: isReturn ? vatAmount : 0,
          description: `ضريبة قيمة مضافة - ${isReturn ? 'إرجاع ' : ''}فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        })
      }
      
      // ✅ تصحيح منطق مرتجع المشتريات
      // 
      // 🔹 فاتورة مشتريات عادية (ليست مرتجع):
      //    - مدين: المشتريات، الضريبة
      //    - دائن: المورد (أو الخزينة إذا مدفوعة)
      //    → نحن مدينون للمورد (أو دفعنا له من الخزينة)
      //
      // 🔹 مرتجع مشتريات:
      //    - مدين: المورد (نُنقص مديونيتنا له)
      //    - مدين: الخزينة (نسترجع المال)
      //    - دائن: المشتريات، الضريبة (نعكس القيد)
      //    → المورد يصبح مدين لنا (نُنقص مديونيتنا له)
      //
      // ⚠️ الفرق المهم:
      // - فاتورة عادية: المورد دائن (نحن ندين له)
      // - مرتجع: المورد مدين (نُنقص مديونيتنا له)
      
      if (isReturn) {
        // ✅ في حالة مرتجع المشتريات:
        // القيد الصحيح:
        //   من حـ/ الخزينة (مدين - نسترجع المال)
        //       إلى حـ/ مردودات المشتريات (دائن - نسجل المرتجع)
        //
        // ملاحظة: رصيد المورد لا يتأثر بالقيد لأن الفاتورة نفسها (isReturn=true)
        // يتم استثناؤها من حساب الرصيد في calculateTotalBalance
        
        const cashAccount = ensureAccountExists('1001', {
          name: 'الخزينة',
          nameEn: 'Cash',
          type: 'asset',
          category: 'current_assets',
          description: 'الخزينة النقدية',
          balance: 0
        })
        
        lines.push({
          accountId: cashAccount.id,
          accountName: cashAccount.name,
          debit: total,  // مدين (نسترجع المال في الخزينة)
          credit: 0,
          description: `استرجاع مبلغ مرتجع مشتريات رقم ${invoice.invoiceNumber}`
        })
      } else {
        // ✅ فاتورة عادية: المورد/الخزينة/البنك دائن
        lines.push({
          accountId: paymentAccount.id,
          accountName: paymentAccount.name,
          debit: 0,
          credit: total,  // دائن (نحن ندين للمورد أو دفعنا من الخزينة)
          description: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        })
      }
    }

    console.log('📋 القيد النهائي:', {
      linesCount: lines.length,
      totalDebit: lines.reduce((sum, l) => sum + (l.debit || 0), 0),
      totalCredit: lines.reduce((sum, l) => sum + (l.credit || 0), 0)
    })

    return {
      date: invoice.date,
      description: `${isReturn ? 'قيد إرجاع من' : 'قيد تلقائي من'} ${
        isReturn 
          ? (invoice.type === 'sales' ? 'مرتجع مبيعات' : 'مرتجع مشتريات')
          : (invoice.type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات')
      } رقم ${invoice.invoiceNumber}`,
      lines: lines,
      reference: `INV-${invoice.invoiceNumber}`,
      type: 'automatic'
    }
  }

  // 🆕 دالة للحصول على جميع الحسابات الفرعية بشكل تكراري (recursive)
  const getAllSubAccounts = (parentAccountCode) => {
    const subAccounts = []
    
    // البحث عن جميع الحسابات التي لها هذا الحساب كحساب رئيسي
    const directChildren = accounts.filter(acc => acc.parentAccount === parentAccountCode)
    
    directChildren.forEach(child => {
      subAccounts.push(child)
      // البحث التكراري عن الحسابات الفرعية للحساب الفرعي
      const childSubAccounts = getAllSubAccounts(child.code)
      subAccounts.push(...childSubAccounts)
    })
    
    return subAccounts
  }

  // Get account statement for a specific account and date range
  const getAccountStatement = (accountId, startDate, endDate, includeSubAccounts = true) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Include the entire end date
    
    // 🔍 البحث عن الحساب المطلوب
    const mainAccount = accounts.find(acc => acc.id === accountId)
    if (!mainAccount) {
      console.error('❌ الحساب غير موجود!')
      return null
    }
    
    // 🌳 إذا كان includeSubAccounts = true، نحصل على جميع الحسابات الفرعية
    const accountIdsToInclude = [accountId]
    
    if (includeSubAccounts) {
      const subAccounts = getAllSubAccounts(mainAccount.code)
      subAccounts.forEach(sub => {
        accountIdsToInclude.push(sub.id)
      })
      
      console.log('📊 كشف حساب شامل:', {
        mainAccount: mainAccount.name,
        mainAccountCode: mainAccount.code,
        subAccountsCount: subAccounts.length,
        subAccounts: subAccounts.map(s => ({ code: s.code, name: s.name }))
      })
    }
    
    // Get all transactions for this account (and sub-accounts if applicable)
    const transactions = []
    let openingBalance = 0
    
    // Process journal entries
    journalEntries.forEach(entry => {
      const entryDate = new Date(entry.date)
      
      entry.lines.forEach(line => {
        // ✅ تحقق إذا كان القيد يخص الحساب الرئيسي أو أي من حساباته الفرعية
        if (accountIdsToInclude.includes(line.accountId)) {
          const transaction = {
            date: entry.date,
            description: line.description || entry.description,
            reference: entry.reference || '',
            debit: parseFloat(line.debit) || 0,
            credit: parseFloat(line.credit) || 0,
            accountName: line.accountName, // 🆕 اسم الحساب الفرعي
            entryDate: entryDate
          }
          
          // If before start date, add to opening balance
          if (entryDate < start) {
            openingBalance += transaction.debit - transaction.credit
          } 
          // If within date range, add to transactions
          else if (entryDate >= start && entryDate <= end) {
            transactions.push(transaction)
          }
        }
      })
    })
    
    // NOTE: We will sort and calculate running balances AFTER we
    // include invoices and vouchers (below) so the resulting
    // transactions list contains both journal lines and invoice/voucher
    // pseudo-transactions before computing totals and balances.
    
    let transactionsWithBalance = []
    let totalDebit = 0
    let totalCredit = 0
    let closingBalance = openingBalance
    
    // ------------------------------------------------------------------
    // Include invoices and vouchers for accounts that represent customers
    // or suppliers (so parent accounts like 1101 / 2001 show their
    // sub-accounts' invoice activity as well).
    // ------------------------------------------------------------------
    try {
      const accountIsAR = mainAccount.code && String(mainAccount.code).startsWith('1101')
      const accountIsAP = mainAccount.code && String(mainAccount.code).startsWith('2001')

      if (accountIsAR || accountIsAP) {
        // Find sub accounts that are linked to customers/suppliers
        const linkedAccounts = accounts.filter(acc => accountIdsToInclude.includes(acc.id) && (acc.linkedEntityType === 'customer' || acc.linkedEntityType === 'supplier'))

        // For each linked account, pull invoices and vouchers
        linkedAccounts.forEach(acc => {
          const entityId = acc.linkedEntityId
          if (!entityId) return

          // invoices
          invoices.forEach(inv => {
            const invDate = new Date(inv.date)
            const total = parseFloat(inv.total) || 0
            let debit = 0, credit = 0

            if (acc.linkedEntityType === 'customer' && inv.type === 'sales' && (inv.customerId === entityId || inv.clientId === entityId)) {
              if (inv.isReturn) credit = total; else debit = total
            }

            if (acc.linkedEntityType === 'supplier' && inv.type === 'purchase' && (inv.supplierId === entityId || inv.clientId === entityId)) {
              if (inv.isReturn) debit = total; else credit = total
            }

            if (debit !== 0 || credit !== 0) {
              const txn = {
                date: inv.date,
                description: inv.isReturn ? (inv.type === 'sales' ? 'مرتجع مبيعات' : 'مرتجع مشتريات') : (inv.type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'),
                reference: inv.invoiceNumber || '',
                debit,
                credit,
                accountName: acc.name,
                entryDate: invDate
              }

              if (invDate < start) {
                openingBalance += txn.debit - txn.credit
              } else if (invDate >= start && invDate <= end) {
                transactions.push(txn)
              }
            }
          })

          // vouchers (receipt/payment)
          vouchers.forEach(v => {
            const vDate = new Date(v.date)
            const amount = parseFloat(v.amount) || 0
            let debit = 0, credit = 0

            if (acc.linkedEntityType === 'customer' && v.type === 'receipt' && v.customerId === entityId) {
              credit = amount
            }

            if (acc.linkedEntityType === 'supplier' && v.type === 'payment' && v.supplierId === entityId) {
              debit = amount
            }

            if (debit !== 0 || credit !== 0) {
              const txn = {
                date: v.date,
                description: v.type === 'receipt' ? `سند قبض ${v.voucherNumber}` : `سند دفع ${v.voucherNumber}`,
                reference: v.voucherNumber || '',
                debit,
                credit,
                accountName: acc.name,
                entryDate: vDate
              }

              if (vDate < start) {
                openingBalance += txn.debit - txn.credit
              } else if (vDate >= start && vDate <= end) {
                transactions.push(txn)
              }
            }
          })
        })
      }
    } catch (err) {
      console.error('Error including invoices/vouchers in account statement:', err)
    }

    // After including invoices/vouchers we must sort and compute running
    // balances and totals so the returned statement is correct.
    try {
      transactions.sort((a, b) => a.entryDate - b.entryDate)
      let runningBalance = openingBalance
      transactionsWithBalance = transactions.map(trans => {
        runningBalance += trans.debit - trans.credit
        return {
          ...trans,
          balance: runningBalance
        }
      })

      totalDebit = transactions.reduce((sum, trans) => sum + (trans.debit || 0), 0)
      totalCredit = transactions.reduce((sum, trans) => sum + (trans.credit || 0), 0)
      closingBalance = openingBalance + totalDebit - totalCredit
    } catch (err) {
      console.error('Error finalizing account statement balances:', err)
    }

    return {
      accountId,
      startDate,
      endDate,
      openingBalance,
      transactions: transactionsWithBalance,
      totalDebit,
      totalCredit,
      closingBalance
    }
  }

  // Get customer or supplier statement
  const getCustomerSupplierStatement = (entityId, entityType, startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    
    // Get the entity (customer or supplier) to access their initial balance
    const entity = entityType === 'customer' 
      ? customers.find(c => c.id === entityId)
      : suppliers.find(s => s.id === entityId)
    
    // Get all invoices for this customer/supplier
    const entityInvoices = invoices.filter(invoice => {
      if (entityType === 'customer') {
        // Check both customerId and clientId for backward compatibility
        return invoice.type === 'sales' && (invoice.customerId === entityId || invoice.clientId === entityId)
      } else {
        // Check both supplierId and clientId for backward compatibility
        return invoice.type === 'purchase' && (invoice.supplierId === entityId || invoice.clientId === entityId)
      }
    })
    
    // Debug: log the filtering results
    console.log('🔍 Statement Debug:', {
      entityId,
      entityType,
      entityInitialBalance: entity?.balance || 0,
      totalInvoices: invoices.length,
      filteredInvoices: entityInvoices.length,
      invoicesSample: invoices.slice(0, 2).map(inv => ({
        id: inv.id,
        type: inv.type,
        clientId: inv.clientId,
        customerId: inv.customerId,
        supplierId: inv.supplierId
      }))
    })
    
    // Start with the entity's initial balance (الرصيد الافتتاحي)
    let openingBalance = parseFloat(entity?.balance || 0)
    const transactions = []
    
    // 🆕 Get vouchers for this entity (سندات القبض والدفع)
    const entityVouchers = vouchers.filter(voucher => {
      if (entityType === 'customer') {
        return voucher.type === 'receipt' && voucher.customerId === entityId
      } else {
        return voucher.type === 'payment' && voucher.supplierId === entityId
      }
    })
    
    // Process invoices
    entityInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date)
      const total = parseFloat(invoice.total) || 0
      
      // For customers: invoice increases their balance (debit)
      // For suppliers: invoice increases our liability to them (credit)
      let debit = 0
      let credit = 0
      
      if (entityType === 'customer') {
        // Sales invoice - customer owes us (debit to customer)
        // إذا كانت فاتورة إرجاع، نعكس: دائن بدلاً من مدين
        if (invoice.isReturn) {
          credit = total  // إرجاع مبيعات: نرد للعميل (دائن)
        } else {
          debit = total   // مبيعات: العميل يدين لنا (مدين)
        }
      } else {
        // Purchase invoice - we owe supplier (credit to supplier)
        // إذا كانت فاتورة إرجاع، نعكس: مدين بدلاً من دائن
        if (invoice.isReturn) {
          debit = total   // إرجاع مشتريات: المورد يرد لنا (مدين)
        } else {
          credit = total  // مشتريات: نحن ندين للمورد (دائن)
        }
      }
      
      // Determine status label
      let statusLabel = ''
      if (invoice.paymentStatus === 'paid') {
        statusLabel = ' - مدفوعة'
      } else if (invoice.paymentStatus === 'partial') {
        statusLabel = ' - مدفوعة جزئياً'
      } else if (invoice.paymentStatus === 'overdue') {
        statusLabel = ' - متأخرة'
      } else if (invoice.paymentStatus === 'pending') {
        statusLabel = ' - معلقة'
      }
      
      const transaction = {
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber,
        description: `${invoice.description || (invoice.isReturn 
          ? (invoice.type === 'sales' ? 'مرتجع مبيعات' : 'مرتجع مشتريات')
          : (invoice.type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات')
        )} ${statusLabel}`,
        debit: debit,
        credit: credit,
        invoiceDate: invoiceDate,
        status: invoice.paymentStatus,
        dueDate: invoice.dueDate,
        isPaid: invoice.paymentStatus === 'paid',
        isPartial: invoice.paymentStatus === 'partial'
      }
      
      // If before start date, add to opening balance
      if (invoiceDate < start) {
        openingBalance += debit - credit
      } 
      // If within date range, add to transactions
      else if (invoiceDate >= start && invoiceDate <= end) {
        transactions.push(transaction)
      }
    })
    
    // 🆕 Process vouchers (سندات القبض والدفع)
    entityVouchers.forEach(voucher => {
      const voucherDate = new Date(voucher.date)
      const amount = parseFloat(voucher.amount) || 0
      
      let debit = 0
      let credit = 0
      
      if (voucher.type === 'receipt') {
        // سند قبض: العميل يدفع لنا → يقلل من رصيد العميل (دائن)
        credit = amount
      } else if (voucher.type === 'payment') {
        // سند دفع: ندفع للمورد → يقلل من رصيد المورد (مدين)
        debit = amount
      }
      
      const transaction = {
        date: voucher.date,
        voucherNumber: voucher.voucherNumber,
        description: voucher.type === 'receipt' 
          ? `سند قبض ${voucher.voucherNumber}` 
          : `سند دفع ${voucher.voucherNumber}`,
        debit: debit,
        credit: credit,
        invoiceDate: voucherDate,
        isVoucher: true
      }
      
      // If before start date, add to opening balance
      if (voucherDate < start) {
        openingBalance += debit - credit
      } 
      // If within date range, add to transactions
      else if (voucherDate >= start && voucherDate <= end) {
        transactions.push(transaction)
      }
    })
    
    // Sort transactions by date
    transactions.sort((a, b) => a.invoiceDate - b.invoiceDate)
    
    // Calculate running balance
    let runningBalance = openingBalance
    const transactionsWithBalance = transactions.map(trans => {
      runningBalance += trans.debit - trans.credit
      return {
        ...trans,
        balance: runningBalance
      }
    })
    
    // Calculate totals
    const totalDebit = transactions.reduce((sum, trans) => sum + trans.debit, 0)
    const totalCredit = transactions.reduce((sum, trans) => sum + trans.credit, 0)
    const closingBalance = openingBalance + totalDebit - totalCredit
    
    // Debug: log calculation details
    console.log('💰 Balance Calculation:', {
      openingBalance,
      totalDebit,
      totalCredit,
      calculation: `${openingBalance} + ${totalDebit} - ${totalCredit}`,
      closingBalance,
      transactionsCount: transactions.length
    })
    
    // Calculate summary statistics
    const paidInvoices = entityInvoices.filter(inv => inv.paymentStatus === 'paid').length
    const partialInvoices = entityInvoices.filter(inv => inv.paymentStatus === 'partial').length
    const pendingInvoices = entityInvoices.filter(inv => inv.paymentStatus === 'pending').length
    const overdueInvoices = entityInvoices.filter(inv => inv.paymentStatus === 'overdue').length

    // totalPaidAmount should sum actual paid amounts (paidAmount) when available,
    // or fall back to invoice.total when status is 'paid' but paidAmount missing
    const totalPaidAmount = entityInvoices.reduce((sum, inv) => {
      const paid = parseFloat(inv.paidAmount) || (inv.paymentStatus === 'paid' ? parseFloat(inv.total) || 0 : 0)
      return sum + paid
    }, 0)

    const totalPartialAmount = entityInvoices
      .filter(inv => inv.paymentStatus === 'partial')
      .reduce((sum, inv) => sum + (parseFloat(inv.paidAmount) || 0), 0)

    const totalPendingAmount = entityInvoices
      .filter(inv => inv.paymentStatus === 'pending')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)

    const totalOverdueAmount = entityInvoices
      .filter(inv => inv.paymentStatus === 'overdue')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
    
    return {
      entityId,
      entityType,
      startDate,
      endDate,
      openingBalance,
      transactions: transactionsWithBalance,
      totalDebit,
      totalCredit,
      closingBalance,
      summary: {
        totalInvoices: entityInvoices.length,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalPaidAmount,
        totalPendingAmount,
        totalOverdueAmount
      }
    }
  }

  // إعادة تهيئة الحسابات (حذف القديمة وإنشاء أساسية جديدة)
  const resetAccountsToDefaults = () => {
    try {
      const newAccounts = DataService.resetAccountsToDefaults()
      setAccounts(newAccounts)
      // إعادة تحميل القيود والفواتير لضمان التزامن
      setJournalEntries(DataService.getJournalEntries())
      setInvoices(DataService.getInvoices())
      return { success: true, message: 'تم إعادة تهيئة الحسابات بنجاح' }
    } catch (err) {
      console.error('Error resetting accounts:', err)
      return { success: false, error: 'خطأ في إعادة تهيئة الحسابات' }
    }
  }

  // 🆕 Voucher operations (سندات القبض والدفع)
  const addVoucher = (voucherData) => {
    try {
      const newVoucher = DataService.addVoucher(voucherData)
      if (newVoucher) {
        setVouchers(prev => [...prev, newVoucher])
        return newVoucher
      }
      return null
    } catch (err) {
      console.error('Error adding voucher:', err)
      return null
    }
  }

  const updateVoucher = (id, updatedData) => {
    try {
      const updatedVoucher = DataService.updateVoucher(id, updatedData)
      if (updatedVoucher) {
        setVouchers(prev => prev.map(v => v.id === id ? updatedVoucher : v))
        return updatedVoucher
      }
      return null
    } catch (err) {
      console.error('Error updating voucher:', err)
      return null
    }
  }

  const deleteVoucher = (id) => {
    try {
      // 1. جلب السند قبل الحذف
      const voucher = vouchers.find(v => v.id === id)
      if (!voucher) {
        console.error('السند غير موجود')
        return false
      }

      console.log('🗑️ حذف السند:', voucher.voucherNumber)

      // 2. حذف أو عكس القيد المحاسبي المرتبط
      const relatedEntry = journalEntries.find(entry => entry.relatedVoucherId === id)
      if (relatedEntry) {
        console.log('🔄 عكس القيد المحاسبي:', relatedEntry.reference)
        
        // إنشاء قيد عكسي
        const reversalEntry = {
          date: new Date().toISOString().split('T')[0],
          description: `عكس ${relatedEntry.description} (حذف السند)`,
          reference: `REV-${relatedEntry.reference}`,
          type: 'reversal',
          originalEntryId: relatedEntry.id,
          lines: relatedEntry.lines.map(line => ({
            ...line,
            debit: line.credit,  // عكس المدين والدائن
            credit: line.debit
          }))
        }
        
        addJournalEntry(reversalEntry)
      }

      // 3. إذا كان السند مرتبط بفاتورة، إعادة حساب حالة الفاتورة
      if (voucher.invoiceId) {
        const invoice = invoices.find(inv => inv.id === voucher.invoiceId)
        if (invoice) {
          console.log('📝 إعادة حساب حالة الفاتورة:', invoice.invoiceNumber)
          
          // حساب إجمالي المدفوعات المتبقية (بدون السند المحذوف)
          const remainingVouchers = vouchers.filter(v => 
            v.id !== id && 
            v.invoiceId === voucher.invoiceId &&
            v.type === voucher.type
          )
          
          const totalPaidViaVouchers = remainingVouchers.reduce((sum, v) => 
            sum + parseFloat(v.amount || 0), 0
          )
          
          const previouslyPaid = parseFloat(invoice.paidAmount || 0)
          const voucherAmount = parseFloat(voucher.amount || 0)
          
          // طرح مبلغ السند المحذوف
          const newPaidAmount = Math.max(0, previouslyPaid - voucherAmount)
          const invoiceTotal = parseFloat(invoice.total || 0)
          
          // حساب المرتجعات
          const invoiceReturns = invoices
            .filter(inv => inv.isReturn && inv.originalInvoiceId === invoice.id)
            .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
          
          const netInvoiceTotal = invoiceTotal - invoiceReturns
          
          // تحديث حالة الفاتورة
          let newStatus = 'pending'
          if (newPaidAmount >= netInvoiceTotal) {
            newStatus = 'paid'
          } else if (newPaidAmount > 0) {
            newStatus = 'partial'
          }
          
          updateInvoice(invoice.id, {
            paymentStatus: newStatus,
            paidAmount: newPaidAmount
          })
          
          console.log('✅ تم تحديث حالة الفاتورة إلى:', newStatus)
        }
      }

      // 4. حذف السند
      if (DataService.deleteVoucher(id)) {
        setVouchers(prev => prev.filter(v => v.id !== id))
        console.log('✅ تم حذف السند بنجاح')
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error deleting voucher:', err)
      return false
    }
  }

  // 🆕 Helper: Check if entity has any transactions (for locking openingBalance)
  const hasTransactions = (entityId, entityType) => {
    // Check invoices
    const hasInvoices = invoices.some(inv => 
      entityType === 'customer' ? inv.clientId === entityId : inv.supplierId === entityId
    )
    
    // Check vouchers
    const hasVouchers = vouchers.some(v => 
      entityType === 'customer' ? v.customerId === entityId : v.supplierId === entityId
    )
    
    return hasInvoices || hasVouchers
  }

  return {
    // State
    accounts,
    journalEntries,
    invoices,
    customers,
    suppliers,
    inventoryItems,
    vouchers, // 🆕 السندات
    loading,
    error,
    
    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,
    resetAccountsToDefaults, // 🆕 دالة جديدة لإعادة التهيئة
    getAllSubAccounts, // 🆕 دالة للحصول على جميع الحسابات الفرعية
    
    // Journal entry operations
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    
    // Invoice operations
    addInvoice,
    updateInvoice,
    deleteInvoice,
    
    // Customer operations
    addCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Supplier operations
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Inventory operations
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryItems: () => DataService.getInventoryItems(),
    
    // 🆕 Voucher operations
    addVoucher,
    updateVoucher,
    deleteVoucher,
    
    // 🆕 Utility
    hasTransactions, // للتحقق من وجود معاملات قبل قفل الرصيد الافتتاحي
    
    // Reports
    getAccountStatement,
    getCustomerSupplierStatement,
    
    // Utility functions
    createJournalEntryFromInvoice, // 🆕 إتاحة دالة إنشاء القيد من الفاتورة لإعادة استخدامها
    setError
  }
}