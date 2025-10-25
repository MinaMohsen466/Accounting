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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize data on component mount
  useEffect(() => {
    try {
      // Initialize default accounts if none exist
      DataService.initializeDefaultAccounts()
      
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
      // If the form provided only a date (YYYY-MM-DD) it will be interpreted
      // as midnight UTC which can display as a shifted time (e.g. 03:00) in local TZ.
      // Combine the selected date with the current local time so the stored
      // invoice.date reflects the creation time the user expects.
      const invoiceToSave = { ...invoiceData }
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
      if (newInvoice) {
        setInvoices(prev => [...prev, newInvoice])
        // Refresh customers/suppliers in case DataService adjusted balances
        setCustomers(DataService.getCustomers())
        setSuppliers(DataService.getSuppliers())
        window.dispatchEvent(new Event('accountingDataUpdated'))
        
        // Create automatic journal entry for the invoice
        if (invoiceData.createJournalEntry) {
          const journalEntry = createJournalEntryFromInvoice(newInvoice)
          addJournalEntry(journalEntry)
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
        // 2. إنشاء حساب محاسبي للمورد تلقائياً
        const supplierAccount = {
          code: `2101-${newSupplier.id.slice(0, 8)}`,
          name: `مورد: ${newSupplier.name}`,
          nameEn: `Supplier: ${newSupplier.name}`,
          type: 'liability',
          category: 'current_liabilities',
          subcategory: 'accounts_payable',
          parentAccount: '2101',
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

  // Helper function to create journal entry from invoice
  const createJournalEntryFromInvoice = (invoice) => {
    const lines = []
    
    if (invoice.type === 'sales') {
      // Sales invoice: Debit Customer Account, Credit Sales, Handle Discount and VAT
      
      // البحث عن حساب العميل المحدد (إن وُجد)
      let customerAccount = null
      if (invoice.customerId) {
        customerAccount = accounts.find(acc => 
          acc.linkedEntityType === 'customer' && 
          acc.linkedEntityId === invoice.customerId
        )
      }
      
      // إذا لم يُعثر على حساب خاص بالعميل، استخدم حساب العملاء العام
      if (!customerAccount) {
        customerAccount = accounts.find(acc => acc.code === '1101') // العملاء (الذمم المدينة)
      }
      
      const salesAccount = accounts.find(acc => acc.code === '4001') // المبيعات
      const discountAccount = accounts.find(acc => acc.code === '5201') // خصم مسموح
      const vatAccount = accounts.find(acc => acc.code === '2102') // ضريبة القيمة المضافة مستحقة
      
      const subtotal = parseFloat(invoice.subtotal) || 0
      const invoiceDiscountAmount = parseFloat(invoice.discountAmount) || 0
      
      // Calculate total discount from line items
      let itemsDiscountAmount = 0
      if (invoice.items && Array.isArray(invoice.items)) {
        itemsDiscountAmount = invoice.items.reduce((sum, item) => {
          const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)
          const itemDiscount = (itemTotal * parseFloat(item.discount || 0)) / 100
          return sum + itemDiscount
        }, 0)
      }
      
      const totalDiscountAmount = invoiceDiscountAmount + itemsDiscountAmount
      const vatAmount = parseFloat(invoice.vatAmount) || 0
      const total = parseFloat(invoice.total) || 0
      
      if (customerAccount && salesAccount) {
        // Debit Customer for total amount (including VAT, minus discount)
        lines.push({
          accountId: customerAccount.id,
          accountName: customerAccount.name,
          debit: total,
          credit: 0,
          description: `فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
        
        // Credit Sales for subtotal (before discount and VAT)
        lines.push({
          accountId: salesAccount.id,
          accountName: salesAccount.name,
          debit: 0,
          credit: subtotal,
          description: `فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
        
        // Handle discount if any (both invoice discount and line item discounts)
        if (totalDiscountAmount > 0 && discountAccount) {
          lines.push({
            accountId: discountAccount.id,
            accountName: discountAccount.name,
            debit: totalDiscountAmount,
            credit: 0,
            description: `خصم مسموح - فاتورة مبيعات رقم ${invoice.invoiceNumber}`
          })
        }
        
        // Handle VAT if any
        if (vatAmount > 0 && vatAccount) {
          lines.push({
            accountId: vatAccount.id,
            accountName: vatAccount.name,
            debit: 0,
            credit: vatAmount,
            description: `ضريبة قيمة مضافة - فاتورة مبيعات رقم ${invoice.invoiceNumber}`
          })
        }
      }
    } else if (invoice.type === 'purchase') {
      // Purchase invoice: Debit Inventory/Expenses, Credit Supplier, Handle Discount and VAT
      const suppliersAccount = accounts.find(acc => acc.code === '2001') // الموردون
      const inventoryAccount = accounts.find(acc => acc.code === '1201') // المخزون
      const discountAccount = accounts.find(acc => acc.code === '4002') // خصم مكتسب
      const vatAccount = accounts.find(acc => acc.code === '1301') // ضريبة القيمة المضافة قابلة للاسترداد
      
      const subtotal = parseFloat(invoice.subtotal) || 0
      const invoiceDiscountAmount = parseFloat(invoice.discountAmount) || 0
      
      // Calculate total discount from line items
      let itemsDiscountAmount = 0
      if (invoice.items && Array.isArray(invoice.items)) {
        itemsDiscountAmount = invoice.items.reduce((sum, item) => {
          const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)
          const itemDiscount = (itemTotal * parseFloat(item.discount || 0)) / 100
          return sum + itemDiscount
        }, 0)
      }
      
      const totalDiscountAmount = invoiceDiscountAmount + itemsDiscountAmount
      const vatAmount = parseFloat(invoice.vatAmount) || 0
      const total = parseFloat(invoice.total) || 0
      
      if (suppliersAccount && inventoryAccount) {
        // Debit Inventory for subtotal (before discount and VAT)
        lines.push({
          accountId: inventoryAccount.id,
          accountName: inventoryAccount.name,
          debit: subtotal,
          credit: 0,
          description: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        })
        
        // Handle discount if any (both invoice discount and line item discounts)
        if (totalDiscountAmount > 0 && discountAccount) {
          lines.push({
            accountId: discountAccount.id,
            accountName: discountAccount.name,
            debit: 0,
            credit: totalDiscountAmount,
            description: `خصم مكتسب - فاتورة مشتريات رقم ${invoice.invoiceNumber}`
          })
        }
        
        // Handle VAT if any
        if (vatAmount > 0 && vatAccount) {
          lines.push({
            accountId: vatAccount.id,
            accountName: vatAccount.name,
            debit: vatAmount,
            credit: 0,
            description: `ضريبة قيمة مضافة - فاتورة مشتريات رقم ${invoice.invoiceNumber}`
          })
        }
        
        // Credit Supplier for total amount
        lines.push({
          accountId: suppliersAccount.id,
          accountName: suppliersAccount.name,
          debit: 0,
          credit: total,
          description: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        })
      }
    }

    return {
      date: invoice.date,
      description: `قيد تلقائي من ${invoice.type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'} رقم ${invoice.invoiceNumber}`,
      lines: lines,
      reference: `INV-${invoice.invoiceNumber}`,
      type: 'automatic'
    }
  }

  // Get account statement for a specific account and date range
  const getAccountStatement = (accountId, startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Include the entire end date
    
    // Get all transactions for this account
    const transactions = []
    let openingBalance = 0
    
    // Process journal entries
    journalEntries.forEach(entry => {
      const entryDate = new Date(entry.date)
      
      entry.lines.forEach(line => {
        if (line.accountId === accountId) {
          const transaction = {
            date: entry.date,
            description: line.description || entry.description,
            reference: entry.reference || '',
            debit: parseFloat(line.debit) || 0,
            credit: parseFloat(line.credit) || 0,
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
    
    // Sort transactions by date
    transactions.sort((a, b) => a.entryDate - b.entryDate)
    
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
    
    // Start with the entity's initial balance
    let openingBalance = parseFloat(entity?.balance || 0)
    const transactions = []
    
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
        debit = total
        // If paid, also show credit (payment) in the same transaction
        credit = invoice.paymentStatus === 'paid' ? total : 0
      } else {
        // Purchase invoice - we owe supplier (credit to supplier)
        credit = total
        // If paid, also show debit (payment) in the same transaction
        debit = invoice.paymentStatus === 'paid' ? total : 0
      }
      
      // Determine status label
      let statusLabel = ''
      if (invoice.paymentStatus === 'paid') {
        statusLabel = ' - مدفوعة'
      } else if (invoice.paymentStatus === 'overdue') {
        statusLabel = ' - متأخرة'
      } else if (invoice.paymentStatus === 'pending') {
        statusLabel = ' - معلقة'
      }
      
      const transaction = {
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber,
        description: `${invoice.description || (invoice.type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات')} ${statusLabel}`,
        debit: debit,
        credit: credit,
        invoiceDate: invoiceDate,
        status: invoice.paymentStatus,
        dueDate: invoice.dueDate,
        isPaid: invoice.paymentStatus === 'paid'
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
    const pendingInvoices = entityInvoices.filter(inv => inv.paymentStatus === 'pending').length
    const overdueInvoices = entityInvoices.filter(inv => inv.paymentStatus === 'overdue').length
    
    const totalPaidAmount = entityInvoices
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
    
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

  return {
    // State
    accounts,
    journalEntries,
    invoices,
    customers,
    suppliers,
    inventoryItems,
    loading,
    error,
    
    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,
    
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
    
    // Reports
    getAccountStatement,
    getCustomerSupplierStatement,
    
    // Utility
    setError
  }
}