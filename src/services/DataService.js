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
    
    const saved = this.saveJournalEntries(entries)
    
    // تطبيق القيد على أرصدة الحسابات - كل حركة يجب أن تنعكس فوراً على الحسابات
    // Apply journal entry to account balances so bank/cash balances reflect immediately
    if (saved) {
      try {
        const accounts = this.getAccounts()
        let accountsModified = false
        
        (newEntry.lines || []).forEach(line => {
          // البحث عن الحساب بواسطة accountId أو accountCode
          let accountIndex = -1
          if (line.accountId) {
            accountIndex = accounts.findIndex(acc => acc.id === line.accountId)
          }
          if (accountIndex === -1 && line.accountCode) {
            accountIndex = accounts.findIndex(acc => acc.code === line.accountCode)
          }
          
          if (accountIndex !== -1) {
            const account = accounts[accountIndex]
            const currentBalance = parseFloat(account.balance) || 0
            const debit = parseFloat(line.debit) || 0
            const credit = parseFloat(line.credit) || 0
            const newBalance = currentBalance + debit - credit
            
            accounts[accountIndex] = {
              ...account,
              balance: newBalance,
              lastUpdated: new Date().toISOString()
            }
            accountsModified = true
            
            console.log(`💰 تحديث رصيد الحساب ${account.name}: ${currentBalance.toFixed(3)} → ${newBalance.toFixed(3)}`)
          }
        })
        
        if (accountsModified) {
          this.saveAccounts(accounts)
          // إطلاق حدث لإعلام المكونات بتحديث البيانات
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('accountingDataUpdated'))
          }
        }
      } catch (error) {
        console.error('❌ خطأ في تطبيق القيد على أرصدة الحسابات:', error)
      }
    }
    
    return saved ? newEntry : null
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
    const saved = this.saveInvoices(invoices)

    // NOTE: We do NOT mutate stored customers/suppliers opening balances here.
    // Balances shown in statements are calculated from the entity's stored
    // opening balance plus invoices/payments (see getCustomerSupplierStatement).
    // Mutating the stored `balance` on invoice add/delete causes double-counting
    // because statements also iterate invoices when computing running balances.
    return saved ? newInvoice : null
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
    const invoiceToDelete = invoices.find(inv => inv.id === id)
    if (!invoiceToDelete) return false

    // Remove the invoice from storage
    const filteredInvoices = invoices.filter(inv => inv.id !== id)
    const invoicesSaved = this.saveInvoices(filteredInvoices)

    // NOTE: We do NOT mutate stored customers/suppliers opening balances here.
    // Deleting an invoice removes it from the invoices list. Statements will
    // reflect the deletion because they compute balances from the stored
    // opening balance plus the remaining invoices/payments.
    return invoicesSaved
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
      
      // إضافة الخصائص الجديدة لمنتجات الأصباغ
      category: item.category || 'general',
      productType: item.productType || item.category || 'general',
      unit: item.unit || 'piece',
      minStockLevel: item.minStockLevel || 10,
      expiryDate: item.expiryDate || null,
      
      // نظام الألوان والرموز
      colorCode: item.colorCode || null,
      colorName: item.colorName || null,
      colorSystem: item.colorSystem || null,
      colorFormula: item.colorFormula || null,
      
      // خصائص إضافية
      properties: item.properties || {},
      manufacturer: item.manufacturer || '',
      batchNumber: item.batchNumber || '',
      
      // تواريخ
      lastPurchaseDate: item.lastPurchaseDate || null,
      lastPurchasePrice: item.lastPurchasePrice || null,
      
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

  // Settings helpers
  static getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS) || {}
  }

  static saveSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings)
  }

  // Toggle to prevent automatic seeding of default accounts.
  // Call this before intentionally clearing all accounts to keep them cleared.
  static setSkipDefaultAccountsInitialization(skip = true) {
    const settings = this.getSettings()
    settings.skipDefaultAccountsInitialization = !!skip
    return this.saveSettings(settings)
  }

  // إعادة تهيئة الحسابات بشكل كامل (حذف القديمة وإنشاء جديدة)
  static resetAccountsToDefaults() {
    console.log('🔄 إعادة تهيئة الحسابات...')
    
    // حذف جميع الحسابات الموجودة
    this.saveAccounts([])
    
    // إلغاء علامة منع التهيئة التلقائية
    const settings = this.getSettings()
    settings.skipDefaultAccountsInitialization = false
    this.saveSettings(settings)
    
    // إنشاء الحسابات الأساسية
    this.createEssentialAccounts()
    
    console.log('✅ تم إعادة تهيئة الحسابات بنجاح')
    return this.getAccounts()
  }

  // إنشاء الحسابات الأساسية فقط (اللازمة لعمل التطبيق)
  static createEssentialAccounts() {
    const essentialAccounts = [
      // 1. النقدية - أساسي للدفع الفوري
      {
        code: '1001',
        name: 'الخزينة',
        nameEn: 'Cash',
        type: 'cash',
        category: 'current_assets',
        description: 'الخزينة النقدية',
        balance: 0
      },
      
      // 2. البنك - أساسي للمعاملات البنكية
      {
        code: '1002',
        name: 'البنك',
        nameEn: 'Bank',
        type: 'bank',
        category: 'current_assets',
        description: 'الحساب البنكي',
        balance: 0
      },
      
      // 3. العملاء - أساسي لفواتير المبيعات الآجلة
      {
        code: '1101',
        name: 'العملاء',
        nameEn: 'Customers',
        type: 'asset',
        category: 'current_assets',
        subcategory: 'accounts_receivable',
        description: 'حسابات العملاء',
        balance: 0
      },
      
      // 4. المخزون - أساسي لحساب تكلفة البضاعة
      {
        code: '1201',
        name: 'المخزون',
        nameEn: 'Inventory',
        type: 'asset',
        category: 'current_assets',
        description: 'مخزون البضاعة',
        balance: 0
      },
      
      // 5. الموردون - أساسي لفواتير المشتريات الآجلة
      {
        code: '2001',
        name: 'الموردون',
        nameEn: 'Suppliers',
        type: 'liability',
        category: 'current_liabilities',
        description: 'حسابات الموردين',
        balance: 0
      },
      
      // 6. ضريبة القيمة المضافة (مستحقة) - أساسي للمبيعات
      {
        code: '2102',
        name: 'ضريبة القيمة المضافة مستحقة',
        nameEn: 'VAT Payable',
        type: 'liability',
        category: 'current_liabilities',
        description: 'ضريبة مستحقة على المبيعات',
        balance: 0
      },
      
      // 7. ضريبة القيمة المضافة (مدفوعة) - أساسي للمشتريات
      {
        code: '1301',
        name: 'ضريبة القيمة المضافة مدفوعة',
        nameEn: 'VAT Paid',
        type: 'asset',
        category: 'current_assets',
        description: 'ضريبة مدفوعة على المشتريات',
        balance: 0
      },
      
      // 8. المبيعات - أساسي لفواتير المبيعات
      {
        code: '4001',
        name: 'المبيعات',
        nameEn: 'Sales',
        type: 'revenue',
        category: 'operating_revenue',
        description: 'إيرادات المبيعات',
        balance: 0
      },
      
      // 9. المشتريات - أساسي لفواتير المشتريات
      {
        code: '5001',
        name: 'المشتريات',
        nameEn: 'Purchases',
        type: 'expense',
        category: 'cost_of_sales',
        description: 'تكلفة المشتريات',
        balance: 0
      },
      
      // 10. خصم مسموح به - أساسي للخصومات على المبيعات
      {
        code: '5201',
        name: 'خصم مسموح به',
        nameEn: 'Sales Discounts',
        type: 'expense',
        category: 'selling_expenses',
        description: 'خصومات ممنوحة للعملاء',
        balance: 0
      },
      
      // 11. خصم مكتسب - أساسي للخصومات على المشتريات
      {
        code: '4002',
        name: 'خصم مكتسب',
        nameEn: 'Purchase Discounts',
        type: 'revenue',
        category: 'other_revenue',
        description: 'خصومات مكتسبة من الموردين',
        balance: 0
      },
      
      // 12. مصروفات الرواتب
      {
        code: '5101',
        name: 'مصروفات الرواتب',
        nameEn: 'Salaries Expense',
        type: 'expense',
        category: 'operating_expenses',
        description: 'رواتب ومكافآت الموظفين',
        balance: 0
      },
      
      // 13. مصروفات الإيجار
      {
        code: '5102',
        name: 'مصروفات الإيجار',
        nameEn: 'Rent Expense',
        type: 'expense',
        category: 'operating_expenses',
        description: 'إيجار المحل أو المكتب',
        balance: 0
      },
      
      // 14. مصروفات الضيافة
      {
        code: '5103',
        name: 'مصروفات الضيافة',
        nameEn: 'Hospitality Expense',
        type: 'expense',
        category: 'operating_expenses',
        description: 'مصروفات الضيافة والاستقبال',
        balance: 0
      }
    ]
    
    essentialAccounts.forEach(account => {
      this.addAccount(account)
    })
    
    console.log('✅ تم إنشاء 14 حساب أساسي')
  }

  // Initialize default accounts
  static initializeDefaultAccounts() {
    const existingAccounts = this.getAccounts()
    const settings = this.getSettings()

    // If an admin/user has explicitly disabled seeding defaults, do nothing.
    if (settings && settings.skipDefaultAccountsInitialization) {
      // Respect user's decision to keep an empty accounts list.
      return
    }

    if (existingAccounts.length === 0) {
      const defaultAccounts = [
        // الأصول المتداولة - النقدية والبنوك
        {
          code: '1001',
          name: 'الخزينة الرئيسية',
          nameEn: 'Main Cash',
          type: 'cash',
          category: 'current_assets',
          description: 'الخزينة النقدية الرئيسية',
          balance: 0
        },
        {
          code: '1002',
          name: 'البنك الوطني - الحساب الجاري',
          nameEn: 'National Bank - Current Account',
          type: 'bank',
          category: 'current_assets',
          description: 'حساب جاري في البنك الوطني',
          balance: 0
        },
        {
          code: '1003',
          name: 'بنك الخليج - حساب التوفير',
          nameEn: 'Gulf Bank - Savings Account',
          type: 'bank',
          category: 'current_assets',
          description: 'حساب توفير في بنك الخليج',
          balance: 0
        },
        
        // الأصول المتداولة - الذمم المدينة
        {
          code: '1101',
          name: 'العملاء (الذمم المدينة)',
          nameEn: 'Accounts Receivable',
          type: 'asset',
          category: 'current_assets',
          subcategory: 'accounts_receivable',
          description: 'حساب العملاء والمستحقات',
          balance: 0
        },
        
        // الأصول المتداولة - المخزون
        {
          code: '1201',
          name: 'المخزون',
          nameEn: 'Inventory',
          type: 'asset',
          category: 'current_assets',
          description: 'مخزون البضاعة',
          balance: 0
        },
        
        // الخصوم المتداولة - الذمم الدائنة
        {
          code: '2101',
          name: 'الموردون (الذمم الدائنة)',
          nameEn: 'Accounts Payable',
          type: 'liability',
          category: 'current_liabilities',
          description: 'حساب الموردين والمستحقات',
          balance: 0
        },
        {
          code: '2102',
          name: 'ضريبة القيمة المضافة مستحقة',
          nameEn: 'VAT Payable',
          type: 'liability',
          category: 'current_liabilities',
          description: 'ضريبة القيمة المضافة المستحقة للحكومة',
          balance: 0
        },
        
        // حقوق الملكية
        {
          code: '3001',
          name: 'رأس المال',
          nameEn: 'Capital',
          type: 'equity',
          category: 'equity',
          description: 'رأس مال المشروع',
          balance: 0
        },
        {
          code: '3002',
          name: 'الأرباح المحتجزة',
          nameEn: 'Retained Earnings',
          type: 'equity',
          category: 'equity',
          description: 'الأرباح المرحلة من سنوات سابقة',
          balance: 0
        },
        
        // الإيرادات
        {
          code: '4001',
          name: 'المبيعات',
          nameEn: 'Sales Revenue',
          type: 'revenue',
          category: 'operating_revenue',
          description: 'إيرادات المبيعات',
          balance: 0
        },
        {
          code: '4002',
          name: 'إيرادات أخرى',
          nameEn: 'Other Income',
          type: 'revenue',
          category: 'other_revenue',
          description: 'إيرادات متنوعة',
          balance: 0
        },
        
        // المصروفات التشغيلية
        {
          code: '5001',
          name: 'تكلفة المبيعات',
          nameEn: 'Cost of Sales',
          type: 'expense',
          category: 'cost_of_sales',
          description: 'تكلفة البضاعة المباعة',
          balance: 0
        },
        {
          code: '5101',
          name: 'مصروفات الرواتب',
          nameEn: 'Salaries Expense',
          type: 'expense',
          category: 'operating_expenses',
          description: 'رواتب ومكافآت الموظفين',
          balance: 0
        },
        {
          code: '5102',
          name: 'مصروفات الإيجار',
          nameEn: 'Rent Expense',
          type: 'expense',
          category: 'operating_expenses',
          description: 'إيجار المحل أو المكتب',
          balance: 0
        },
        {
          code: '5103',
          name: 'مصروفات الضيافة',
          nameEn: 'Hospitality Expense',
          type: 'expense',
          category: 'operating_expenses',
          description: 'مصروفات الضيافة والاستقبال',
          balance: 0
        },
        {
          code: '5104',
          name: 'مصروفات الكهرباء والماء',
          nameEn: 'Utilities Expense',
          type: 'expense',
          category: 'operating_expenses',
          description: 'فواتير الكهرباء والماء',
          balance: 0
        },
        {
          code: '5105',
          name: 'مصروفات الاتصالات',
          nameEn: 'Communication Expense',
          type: 'expense',
          category: 'operating_expenses',
          description: 'هاتف وإنترنت',
          balance: 0
        },
        {
          code: '5106',
          name: 'مصروفات الصيانة',
          nameEn: 'Maintenance Expense',
          type: 'expense',
          category: 'operating_expenses',
          description: 'صيانة المعدات والمباني',
          balance: 0
        },
        {
          code: '5199',
          name: 'مصروفات أخرى',
          nameEn: 'Other Expenses',
          type: 'expense',
          category: 'operating_expenses',
          description: 'مصروفات متفرقة',
          balance: 0
        },
        {
          code: '5201',
          name: 'خصم مسموح به',
          nameEn: 'Discounts Allowed',
          type: 'expense',
          category: 'selling_expenses',
          description: 'الخصومات الممنوحة للعملاء',
          balance: 0
        }
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