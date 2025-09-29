// LocalStorage Data Management Service

const STORAGE_KEYS = {
  ACCOUNTS: 'accounting_accounts',
  JOURNAL_ENTRIES: 'accounting_journal_entries',
  INVOICES: 'accounting_invoices',
  CUSTOMERS: 'accounting_customers',
  SUPPLIERS: 'accounting_suppliers',
  INVENTORY: 'accounting_inventory',
  SETTINGS: 'accounting_settings'
}

class DataService {
  // Generic methods for localStorage operations
  static get(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting data from localStorage:', error)
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
    return this.get(STORAGE_KEYS.INVENTORY) || []
  }

  static saveInventoryItems(items) {
    return this.set(STORAGE_KEYS.INVENTORY, items)
  }

  static addInventoryItem(item) {
    const items = this.getInventoryItems()
    const newItem = {
      ...item,
      id: this.generateId(),
      quantity: item.quantity || 0,
      price: item.unitPrice || item.price || 0, // Support both unitPrice and price
      createdAt: new Date().toISOString()
    }
    items.push(newItem)
    return this.saveInventoryItems(items) ? newItem : null
  }

  static updateInventoryItem(id, updatedItem) {
    const items = this.getInventoryItems()
    const index = items.findIndex(item => item.id === id)
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedItem, updatedAt: new Date().toISOString() }
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
      const defaultAccounts = [
        // Assets
        { code: '1001', name: 'النقدية', type: 'asset', category: 'current' },
        { code: '1002', name: 'البنك', type: 'asset', category: 'current' },
        { code: '1101', name: 'العملاء', type: 'asset', category: 'current' },
        { code: '1201', name: 'المخزون', type: 'asset', category: 'current' },
        { code: '1501', name: 'الأثاث والمعدات', type: 'asset', category: 'fixed' },
        
        // Liabilities
        { code: '2001', name: 'الموردون', type: 'liability', category: 'current' },
        { code: '2101', name: 'القروض قصيرة الأجل', type: 'liability', category: 'current' },
        { code: '2501', name: 'القروض طويلة الأجل', type: 'liability', category: 'long_term' },
        
        // Equity
        { code: '3001', name: 'رأس المال', type: 'equity', category: 'capital' },
        { code: '3101', name: 'الأرباح المحتجزة', type: 'equity', category: 'retained_earnings' },
        
        // Revenue
        { code: '4001', name: 'مبيعات البضاعة', type: 'revenue', category: 'sales' },
        { code: '4101', name: 'إيرادات أخرى', type: 'revenue', category: 'other' },
        
        // Expenses
        { code: '5001', name: 'تكلفة البضاعة المباعة', type: 'expense', category: 'cost_of_goods' },
        { code: '5101', name: 'مصاريف التشغيل', type: 'expense', category: 'operating' },
        { code: '5201', name: 'مصاريف الإيجار', type: 'expense', category: 'operating' },
        { code: '5301', name: 'مصاريف الكهرباء', type: 'expense', category: 'operating' }
      ]
      
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
      const defaultCustomers = [
        { name: 'شركة الأعمال المتقدمة', phone: '0501234567', email: 'info@advanced.com', address: 'الرياض، المملكة العربية السعودية' },
        { name: 'مؤسسة التجارة الحديثة', phone: '0507654321', email: 'sales@modern.com', address: 'جدة، المملكة العربية السعودية' },
        { name: 'شركة الخليج للاستثمار', phone: '0503456789', email: 'contact@gulf.com', address: 'الدمام، المملكة العربية السعودية' }
      ]
      
      defaultCustomers.forEach(customer => {
        this.addCustomer(customer)
      })
    }
    
    if (existingSuppliers.length === 0) {
      const defaultSuppliers = [
        { name: 'شركة المواد الخام', phone: '0509876543', email: 'supply@rawmat.com', address: 'الرياض، المملكة العربية السعودية' },
        { name: 'مؤسسة التوريدات العامة', phone: '0506543210', email: 'orders@supplies.com', address: 'جدة، المملكة العربية السعودية' },
        { name: 'شركة الخدمات اللوجستية', phone: '0504321098', email: 'logistics@services.com', address: 'الخبر، المملكة العربية السعودية' }
      ]
      
      defaultSuppliers.forEach(supplier => {
        this.addSupplier(supplier)
      })
    }
  }

  // Initialize default inventory items
  static initializeDefaultInventoryItems() {
    const existingItems = this.getInventoryItems()
    
    // Force refresh for testing - remove this line in production
    if (existingItems.length === 0 || existingItems.some(item => !item.price && !item.unitPrice)) {
      const defaultItems = [
        { 
          id: 'item_1',
          name: 'كمبيوتر محمول Dell', 
          sku: 'DELL-LT-001', 
          category: 'أجهزة الكمبيوتر', 
          quantity: 15, 
          price: 250.000, 
          description: 'كمبيوتر محمول Dell Inspiron 15'
        },
        { 
          id: 'item_2',
          name: 'ماوس لاسلكي', 
          sku: 'MSE-WL-001', 
          category: 'ملحقات الكمبيوتر', 
          quantity: 50, 
          price: 8.500, 
          description: 'ماوس لاسلكي عالي الجودة'
        },
        { 
          id: 'item_3',
          name: 'لوحة مفاتيح آبل', 
          sku: 'APL-KB-001', 
          category: 'ملحقات الكمبيوتر', 
          quantity: 25, 
          price: 45.750, 
          description: 'لوحة مفاتيح Apple Magic Keyboard'
        },
        { 
          id: 'item_4',
          name: 'شاشة Samsung 24 بوصة', 
          sku: 'SAM-MON-24', 
          category: 'شاشات', 
          quantity: 12, 
          price: 120.500, 
          description: 'شاشة Samsung LED 24 بوصة Full HD'
        },
        { 
          id: 'item_5',
          name: 'طابعة HP LaserJet', 
          sku: 'HP-LJ-001', 
          category: 'طابعات', 
          quantity: 8, 
          price: 180.250, 
          description: 'طابعة HP LaserJet Pro للأعمال'
        },
        { 
          id: 'item_6',
          name: 'محرك أقراص خارجي 1TB', 
          sku: 'EXT-HD-1TB', 
          category: 'أجهزة التخزين', 
          quantity: 20, 
          price: 35.000, 
          description: 'محرك أقراص خارجي WD 1TB'
        }
      ]
      
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
}

export default DataService
export { STORAGE_KEYS }