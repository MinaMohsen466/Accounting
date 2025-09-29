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
      const newInvoice = DataService.addInvoice(invoiceData)
      if (newInvoice) {
        setInvoices(prev => [...prev, newInvoice])
        
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
        setInvoices(prev => prev.filter(inv => inv.id !== id))
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
      const newCustomer = DataService.addCustomer(customerData)
      if (newCustomer) {
        setCustomers(prev => [...prev, newCustomer])
        return { success: true, data: newCustomer }
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
      const newSupplier = DataService.addSupplier(supplierData)
      if (newSupplier) {
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
      // Sales invoice: Debit Customer, Credit Sales
      const customersAccount = accounts.find(acc => acc.code === '1101') // العملاء
      const salesAccount = accounts.find(acc => acc.code === '4001') // المبيعات
      
      if (customersAccount && salesAccount) {
        lines.push({
          accountId: customersAccount.id,
          accountName: customersAccount.name,
          debit: invoice.total,
          credit: 0,
          description: `فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
        
        lines.push({
          accountId: salesAccount.id,
          accountName: salesAccount.name,
          debit: 0,
          credit: invoice.total,
          description: `فاتورة مبيعات رقم ${invoice.invoiceNumber}`
        })
      }
    } else if (invoice.type === 'purchase') {
      // Purchase invoice: Debit Inventory/Expenses, Credit Supplier
      const suppliersAccount = accounts.find(acc => acc.code === '2001') // الموردون
      const inventoryAccount = accounts.find(acc => acc.code === '1201') // المخزون
      
      if (suppliersAccount && inventoryAccount) {
        lines.push({
          accountId: inventoryAccount.id,
          accountName: inventoryAccount.name,
          debit: invoice.total,
          credit: 0,
          description: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        })
        
        lines.push({
          accountId: suppliersAccount.id,
          accountName: suppliersAccount.name,
          debit: 0,
          credit: invoice.total,
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
    
    // Utility
    setError
  }
}