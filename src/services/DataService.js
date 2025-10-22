// LocalStorage Data Management Service

const STORAGE_KEYS = {
  ACCOUNTS: 'accounts',  // تم تغييرها من 'accounting_accounts' إلى 'accounts'
  JOURNAL_ENTRIES: 'journalEntries',  // تم تغييرها من 'accounting_journal_entries' إلى 'journalEntries'
  INVOICES: 'invoices',  // تم تغييرها من 'accounting_invoices' إلى 'invoices'
  CUSTOMERS: 'customers',  // تم تغييرها من 'accounting_customers' إلى 'customers'
  SUPPLIERS: 'suppliers',  // تم تغييرها من 'accounting_suppliers' إلى 'suppliers'
  INVENTORY: 'inventoryItems',  // تم تغييرها من 'accounting_inventory' إلى 'inventoryItems'
  SETTINGS: 'accounting_settings'
}

class DataService {
  // Remove color-related fields from an inventory item (migration/sanitization)
  static sanitizeInventoryItem(item) {
    if (!item || typeof item !== 'object') return item
    const cleaned = { ...item }
    // Remove color system fields that may remain from older versions
    delete cleaned.colorCode
    delete cleaned.colorName
    delete cleaned.colorSystem
    delete cleaned.colorFormula
    return cleaned
  }
  // Generic methods for localStorage operations
  static get(key) {
    try {
      const data = localStorage.getItem(key)
      if (data === null || data === undefined) {
        return null
      }
      // التحقق من أن البيانات ليست فارغة أو معطوبة
      if (data === '' || data === 'null' || data === 'undefined') {
        return null
      }
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error getting data from localStorage for key ${key}:`, error)
      // في حالة الخطأ، نحاول مسح البيانات المعطوبة
      try {
        localStorage.removeItem(key)
      } catch (removeError) {
        console.error('Error removing corrupted data:', removeError)
      }
      return null
    }
  }

  static set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error setting data to localStorage:', error)
      return false
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing data from localStorage:', error)
      return false
    }
  }

  static clear() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  // Accounts Management
  static getAccounts() {
    return this.get(STORAGE_KEYS.ACCOUNTS) || []
  }

  static saveAccounts(accounts) {
    return this.set(STORAGE_KEYS.ACCOUNTS, accounts)
  }

  static addAccount(account) {
    const accounts = this.getAccounts()
    const newAccount = {
      ...account,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }
    accounts.push(newAccount)
    return this.saveAccounts(accounts) ? newAccount : null
  }

  static updateAccount(id, updatedAccount) {
    const accounts = this.getAccounts()
    const index = accounts.findIndex(acc => acc.id === id)
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updatedAccount, updatedAt: new Date().toISOString() }
      return this.saveAccounts(accounts) ? accounts[index] : null
    }
    return null
  }

  static deleteAccount(id) {
    const accounts = this.getAccounts()
    const filteredAccounts = accounts.filter(acc => acc.id !== id)
    return this.saveAccounts(filteredAccounts)
  }

  // Journal Entries Management
  static getJournalEntries() {
    return this.get(STORAGE_KEYS.JOURNAL_ENTRIES) || []
  }

  static saveJournalEntries(entries) {
    return this.set(STORAGE_KEYS.JOURNAL_ENTRIES, entries)
  }

  static addJournalEntry(entry) {
    const entries = this.getJournalEntries()
    const newEntry = {
      ...entry,
      id: this.generateId(),
      entryNumber: this.generateEntryNumber(),
      createdAt: new Date().toISOString()
    }
    entries.push(newEntry)
    return this.saveJournalEntries(entries) ? newEntry : null
  }

  static updateJournalEntry(id, updatedEntry) {
    const entries = this.getJournalEntries()
    const index = entries.findIndex(entry => entry.id === id)
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updatedEntry, updatedAt: new Date().toISOString() }
      return this.saveJournalEntries(entries) ? entries[index] : null
    }
    return null
  }

  static deleteJournalEntry(id) {
    const entries = this.getJournalEntries()
    const filteredEntries = entries.filter(entry => entry.id !== id)
    return this.saveJournalEntries(filteredEntries)
  }

  // Invoices Management
  static getInvoices() {
    return this.get(STORAGE_KEYS.INVOICES) || []
  }

  static saveInvoices(invoices) {
    return this.set(STORAGE_KEYS.INVOICES, invoices)
  }

  static addInvoice(invoice) {
    const invoices = this.getInvoices()
    const newInvoice = {
      ...invoice,
      id: this.generateId(),
      invoiceNumber: this.generateInvoiceNumber(invoice.type),
      createdAt: new Date().toISOString()
    }
    invoices.push(newInvoice)
    return this.saveInvoices(invoices) ? newInvoice : null
  }

  static updateInvoice(id, updatedInvoice) {
    const invoices = this.getInvoices()
    const index = invoices.findIndex(inv => inv.id === id)
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updatedInvoice, updatedAt: new Date().toISOString() }
      return this.saveInvoices(invoices) ? invoices[index] : null
    }
    return null
  }

  static deleteInvoice(id) {
    const invoices = this.getInvoices()
    const filteredInvoices = invoices.filter(inv => inv.id !== id)
    return this.saveInvoices(filteredInvoices)
  }

  // Customers Management
  static getCustomers() {
    return this.get(STORAGE_KEYS.CUSTOMERS) || []
  }

  static saveCustomers(customers) {
    return this.set(STORAGE_KEYS.CUSTOMERS, customers)
  }

  static addCustomer(customer) {
    const customers = this.getCustomers()
    const newCustomer = {
      ...customer,
      id: this.generateId(),
      type: 'customer',
      balance: customer.balance || 0,
      createdAt: new Date().toISOString()
    }
    customers.push(newCustomer)
    return this.saveCustomers(customers) ? newCustomer : null
  }

  static updateCustomer(id, updatedCustomer) {
    const customers = this.getCustomers()
    const index = customers.findIndex(cust => cust.id === id)
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updatedCustomer, updatedAt: new Date().toISOString() }
      return this.saveCustomers(customers) ? customers[index] : null
    }
    return null
  }

  static deleteCustomer(id) {
    const customers = this.getCustomers()
    const filteredCustomers = customers.filter(cust => cust.id !== id)
    return this.saveCustomers(filteredCustomers)
  }

  // Suppliers Management
  static getSuppliers() {
    return this.get(STORAGE_KEYS.SUPPLIERS) || []
  }

  static saveSuppliers(suppliers) {
    return this.set(STORAGE_KEYS.SUPPLIERS, suppliers)
  }

  static addSupplier(supplier) {
    const suppliers = this.getSuppliers()
    const newSupplier = {
      ...supplier,
      id: this.generateId(),
      type: 'supplier',
      balance: supplier.balance || 0,
      createdAt: new Date().toISOString()
    }
    suppliers.push(newSupplier)
    return this.saveSuppliers(suppliers) ? newSupplier : null
  }

  static updateSupplier(id, updatedSupplier) {
    const suppliers = this.getSuppliers()
    const index = suppliers.findIndex(supp => supp.id === id)
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...updatedSupplier, updatedAt: new Date().toISOString() }
      return this.saveSuppliers(suppliers) ? suppliers[index] : null
    }
    return null
  }

  static deleteSupplier(id) {
    const suppliers = this.getSuppliers()
    const filteredSuppliers = suppliers.filter(supp => supp.id !== id)
    return this.saveSuppliers(filteredSuppliers)
  }

  // Inventory Management
  static getInventoryItems() {
    const raw = this.get(STORAGE_KEYS.INVENTORY) || []
    // sanitize items on read (migration) and persist cleaned result if changed
    const cleaned = raw.map(item => this.sanitizeInventoryItem(item))
    try {
      const rawStr = JSON.stringify(raw)
      const cleanedStr = JSON.stringify(cleaned)
      if (rawStr !== cleanedStr) {
        // persist cleaned items to localStorage to remove stale color fields
        this.saveInventoryItems(cleaned)
      }
    } catch (err) {
      // ignore stringify errors and just return cleaned
    }
    return cleaned
  }

  static saveInventoryItems(items) {
    // sanitize before saving to ensure no color fields are stored
    const sanitized = (items || []).map(item => this.sanitizeInventoryItem(item))
    return this.set(STORAGE_KEYS.INVENTORY, sanitized)
  }

  static addInventoryItem(item) {
    const items = this.getInventoryItems()
    const newItem = this.sanitizeInventoryItem({
      ...item,
      id: this.generateId(),
      quantity: item.quantity || 0,
      price: item.unitPrice || item.price || 0, // Support both unitPrice and price
      
      // إضافة الخصائص الجديدة لمنتجات الأصباغ
      category: item.category || 'general',
      productType: item.productType || item.category || 'general',
      unit: item.unit || 'piece',
      minStockLevel: item.minStockLevel || 10,
      expiryDate: item.expiryDate || null,
      
      // خصائص إضافية
      properties: item.properties || {},
      manufacturer: item.manufacturer || '',
      batchNumber: item.batchNumber || '',
      
      // تواريخ
      lastPurchaseDate: item.lastPurchaseDate || null,
      lastPurchasePrice: item.lastPurchasePrice || null,
      
      createdAt: new Date().toISOString()
    })
    items.push(newItem)
    return this.saveInventoryItems(items) ? newItem : null
  }

  static updateInventoryItem(id, updatedItem) {
    const items = this.getInventoryItems()
    const index = items.findIndex(item => item.id === id)
    if (index !== -1) {
      // sanitize incoming update to strip any color fields
      const cleanedUpdate = this.sanitizeInventoryItem(updatedItem)
      items[index] = { ...items[index], ...cleanedUpdate, updatedAt: new Date().toISOString() }
      return this.saveInventoryItems(items) ? items[index] : null
    }
    return null
  }

  static deleteInventoryItem(id) {
    const items = this.getInventoryItems()
    const filteredItems = items.filter(item => item.id !== id)
    return this.saveInventoryItems(filteredItems)
  }

  // Utility methods
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  static generateEntryNumber() {
    const entries = this.getJournalEntries()
    return entries.length + 1
  }

  static generateInvoiceNumber(type) {
    const invoices = this.getInvoices().filter(inv => inv.type === type)
    const prefix = type === 'sales' ? 'S' : 'P'
    const number = (invoices.length + 1).toString().padStart(4, '0')
    return `${prefix}${number}`
  }

  // Initialize default accounts
  static initializeDefaultAccounts() {
    const existingAccounts = this.getAccounts()
    if (existingAccounts.length === 0) {
      const defaultAccounts = []
      
      defaultAccounts.forEach(account => {
        this.addAccount(account)
      })
    }
  }

  // Initialize default customers and suppliers
  static initializeDefaultCustomersSuppliers() {
    const existingCustomers = this.getCustomers()
    const existingSuppliers = this.getSuppliers()
    
    if (existingCustomers.length === 0) {
      const defaultCustomers = []
      
      defaultCustomers.forEach(customer => {
        this.addCustomer(customer)
      })
    }
    
    if (existingSuppliers.length === 0) {
      const defaultSuppliers = []
      
      defaultSuppliers.forEach(supplier => {
        this.addSupplier(supplier)
      })
    }
  }

  // Initialize default inventory items
  static initializeDefaultInventoryItems() {
    const existingItems = this.getInventoryItems()
    
    if (existingItems.length === 0) {
      const defaultItems = []
      
      defaultItems.forEach(item => {
        this.addInventoryItem(item)
      })
    }
  }

  // Get account balance calculation
  static getAccountBalance(accountId) {
    const journalEntries = this.getJournalEntries()
    let debitTotal = 0
    let creditTotal = 0
    
    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountId === accountId) {
          if (line.debit) debitTotal += parseFloat(line.debit)
          if (line.credit) creditTotal += parseFloat(line.credit)
        }
      })
    })
    
    return { debit: debitTotal, credit: creditTotal, balance: debitTotal - creditTotal }
  }

  // Debug method to check data status
  static getDataStatus() {
    const status = {
      accounts: this.getAccounts()?.length || 0,
      journalEntries: this.getJournalEntries()?.length || 0,
      invoices: this.getInvoices()?.length || 0,
      customers: this.getCustomers()?.length || 0,
      suppliers: this.getSuppliers()?.length || 0,
      inventoryItems: this.getInventoryItems()?.length || 0
    }
    
    console.log('📊 حالة البيانات الحالية:', status)
    return status
  }

  // Method to refresh all data
  static refreshAllData() {
    console.log('🔄 إعادة تحميل جميع البيانات...')
    
    // التحقق من وجود البيانات وإعادة تهيئتها إذا لزم الأمر
    this.initializeDefaultAccounts()
    this.initializeDefaultCustomersSuppliers()
    this.initializeDefaultInventoryItems()
    
    return this.getDataStatus()
  }
}

export default DataService
export { STORAGE_KEYS }