import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations = {
  ar: {
    // General
    loading: 'جاري تحميل البيانات...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    add: 'إضافة',
    search: 'البحث...',
    actions: 'الإجراءات',
    date: 'التاريخ',
    description: 'الوصف',
    amount: 'المبلغ',
    total: 'الإجمالي',
    name: 'الاسم',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    balance: 'الرصيد',
    notes: 'ملاحظات',
    
    // App Title
    appTitle: 'نظام المحاسبة البسيط',
    welcome: 'مرحباً بك في نظام إدارة الحسابات',
    
    // Sidebar
    dashboard: 'الرئيسية',
    chartOfAccounts: 'دليل الحسابات',
    journalEntries: 'القيود اليومية',
    invoices: 'الفواتير',
    customersSuppliers: 'العملاء والموردين',
    inventory: 'إدارة المخزون',
    reports: 'التقارير',
    
    // Dashboard
    dashboardTitle: 'نظام المحاسبة البسيط',
    dashboardSubtitle: 'مرحباً بك في نظام إدارة الحسابات',
    accountsCount: 'دليل الحسابات',
    entriesCount: 'القيود اليومية',
    invoicesCount: 'إجمالي الفواتير',
    clientsCount: 'العملاء والموردين',
    accountsRegistered: 'حساب مُسجل',
    entriesRecorded: 'قيد محاسبي',
    invoicesIssued: 'فاتورة مُصدرة',
    clientsAndSuppliers: 'عميل ومورد',
    
    // Sales Overview
    salesOverview: 'نظرة عامة على المبيعات',
    salesInvoicesCount: 'عدد فواتير المبيعات:',
    totalSalesAmount: 'إجمالي قيمة المبيعات:',
    averageInvoiceAmount: 'متوسط قيمة الفاتورة:',
    
    // Purchase Overview
    purchaseOverview: 'نظرة عامة على المشتريات',
    purchaseInvoicesCount: 'عدد فواتير المشتريات:',
    totalPurchaseAmount: 'إجمالي قيمة المشتريات:',
    
    // Recent Activities
    recentEntries: 'آخر القيود المحاسبية',
    recentInvoices: 'آخر الفواتير',
    noEntriesYet: 'لا توجد قيود محاسبية حتى الآن',
    noInvoicesYet: 'لا توجد فواتير حتى الآن',
    
    // Quick Actions
    quickActions: 'إجراءات سريعة',
    addNewEntry: 'إضافة قيد جديد',
    addNewEntryDesc: 'سجل معاملة محاسبية جديدة',
    createInvoice: 'إنشاء فاتورة',
    createInvoiceDesc: 'أنشئ فاتورة مبيعات أو مشتريات',
    addClient: 'إضافة عميل',
    addClientDesc: 'سجل عميل أو مورد جديد',
    viewReports: 'عرض التقارير',
    viewReportsDesc: 'اطلع على التقارير المالية',
    exportData: 'تصدير البيانات',
    exportDataDesc: 'حفظ نسخة احتياطية من جميع البيانات',
    
    // Accounts
    addNewAccount: 'إضافة حساب جديد',
    accountCode: 'رقم الحساب',
    accountName: 'اسم الحساب',
    accountType: 'نوع الحساب',
    accountCategory: 'تصنيف الحساب',
    assets: 'أصول',
    liabilities: 'خصوم',
    equity: 'حقوق الملكية',
    revenue: 'إيرادات',
    expenses: 'مصاريف',
    
    // Journal Entries
    journalEntriesAdd: 'إضافة قيد جديد',
    entryNumber: 'رقم القيد',
    reference: 'المرجع',
    debit: 'مدين',
    credit: 'دائن',
    account: 'الحساب',
    noJournalEntries: 'لا توجد قيود محاسبية',
    entryDetails: 'تفاصيل القيد',
    addLine: 'إضافة سطر',
    
    // Invoices
    createNewInvoice: 'إنشاء فاتورة جديدة',
    invoiceNumber: 'رقم الفاتورة',
    invoiceType: 'نوع الفاتورة',
    salesInvoice: 'فاتورة مبيعات',
    purchaseInvoice: 'فاتورة مشتريات',
    client: 'العميل',
    supplier: 'المورد',
    selectProduct: 'اختر المنتج',
    subtotal: 'المجموع الفرعي',
    discount: 'خصم',
    vatRate: 'معدل ض.ق.م',
    vatAmount: 'مبلغ ض.ق.م',
    grandTotal: 'الإجمالي الكلي',
    kwd: 'د.ك',
    
    // Customers/Suppliers
    customers: 'العملاء',
    suppliers: 'الموردون',
    addNewCustomer: 'إضافة عميل جديد',
    addNewSupplier: 'إضافة مورد جديد',
    
    // Common messages
    saveSuccess: 'تم الحفظ بنجاح',
    deleteSuccess: 'تم الحذف بنجاح',
    updateSuccess: 'تم التحديث بنجاح',
    error: 'حدث خطأ',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    
    // Currency
    currency: 'د.ك',
    
    // Reports
    trialBalance: 'ميزان المراجعة',
    incomeStatement: 'قائمة الدخل',
    balanceSheet: 'الميزانية العمومية',
    developingSoon: 'قيد التطوير قريباً...',
    
    // Inventory
    inventoryManagement: 'إدارة المخزون',
    addProduct: 'إضافة منتج',
    products: 'المنتجات',
    productName: 'اسم المنتج',
    sku: 'رقم المنتج',
    category: 'التصنيف',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    totalValue: 'القيمة الإجمالية',
    stockLevel: 'مستوى المخزون',
    totalProducts: 'إجمالي المنتجات',
    noProducts: 'لا توجد منتجات',
    fillRequiredFields: 'يرجى ملء الحقول المطلوبة',
    
    // Search and Filter
    searchInventory: 'البحث في المخزون...',
    searchInvoices: 'البحث في الفواتير...',
    allCategories: 'جميع التصنيفات',
    allTypes: 'جميع الأنواع',
    allStatuses: 'جميع الحالات',
    sortByName: 'ترتيب بالاسم',
    sortBySKU: 'ترتيب برقم المنتج',
    sortByCategory: 'ترتيب بالتصنيف',
    sortByQuantity: 'ترتيب بالكمية',
    sortByPrice: 'ترتيب بالسعر',
    sortByDate: 'ترتيب بالتاريخ',
    sortByInvoiceNumber: 'ترتيب برقم الفاتورة',
    sortByClient: 'ترتيب بالعميل',
    sortByAmount: 'ترتيب بالمبلغ',
    sortAscending: 'ترتيب تصاعدي',
    sortDescending: 'ترتيب تنازلي',
    showingResults: 'عرض النتائج',
    of: 'من',
    clearSearch: 'مسح البحث',
    noSearchResults: 'لا توجد نتائج للبحث',
    salesInvoices: 'فواتير المبيعات',
    purchaseInvoices: 'فواتير المشتريات',
    paid: 'مدفوعة',
    pending: 'معلقة',
    overdue: 'متأخرة',
    
    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English'
  },
  
  en: {
    // General
    loading: 'Loading data...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    search: 'Search...',
    actions: 'Actions',
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    total: 'Total',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    balance: 'Balance',
    notes: 'Notes',
    
    // App Title
    appTitle: 'Simple Accounting System',
    welcome: 'Welcome to Accounting Management System',
    
    // Sidebar
    dashboard: 'Dashboard',
    chartOfAccounts: 'Chart of Accounts',
    journalEntries: 'Journal Entries',
    invoices: 'Invoices',
    customersSuppliers: 'Customers & Suppliers',
    inventory: 'Inventory Management',
    reports: 'Reports',
    
    // Dashboard
    dashboardTitle: 'Simple Accounting System',
    dashboardSubtitle: 'Welcome to Accounting Management System',
    accountsCount: 'Chart of Accounts',
    entriesCount: 'Journal Entries',
    invoicesCount: 'Total Invoices',
    clientsCount: 'Customers & Suppliers',
    accountsRegistered: 'accounts registered',
    entriesRecorded: 'journal entries',
    invoicesIssued: 'invoices issued',
    clientsAndSuppliers: 'customers & suppliers',
    
    // Sales Overview
    salesOverview: 'Sales Overview',
    salesInvoicesCount: 'Number of Sales Invoices:',
    totalSalesAmount: 'Total Sales Amount:',
    averageInvoiceAmount: 'Average Invoice Amount:',
    
    // Purchase Overview
    purchaseOverview: 'Purchase Overview',
    purchaseInvoicesCount: 'Number of Purchase Invoices:',
    totalPurchaseAmount: 'Total Purchase Amount:',
    
    // Recent Activities
    recentEntries: 'Recent Journal Entries',
    recentInvoices: 'Recent Invoices',
    noEntriesYet: 'No journal entries yet',
    noInvoicesYet: 'No invoices yet',
    
    // Quick Actions
    quickActions: 'Quick Actions',
    addNewEntry: 'Add New Entry',
    addNewEntryDesc: 'Record a new accounting transaction',
    createInvoice: 'Create Invoice',
    createInvoiceDesc: 'Create a sales or purchase invoice',
    addClient: 'Add Client',
    addClientDesc: 'Register a new customer or supplier',
    viewReports: 'View Reports',
    viewReportsDesc: 'View financial reports',
    exportData: 'Export Data',
    exportDataDesc: 'Save backup of all data',
    
    // Accounts
    addNewAccount: 'Add New Account',
    accountCode: 'Account Code',
    accountName: 'Account Name',
    accountType: 'Account Type',
    accountCategory: 'Account Category',
    assets: 'Assets',
    liabilities: 'Liabilities',
    equity: 'Equity',
    revenue: 'Revenue',
    expenses: 'Expenses',
    
    // Journal Entries
    journalEntriesAdd: 'Add New Entry',
    entryNumber: 'Entry Number',
    reference: 'Reference',
    debit: 'Debit',
    credit: 'Credit',
    account: 'Account',
    noJournalEntries: 'No journal entries found',
    entryDetails: 'Entry Details',
    addLine: 'Add Line',
    
    // Invoices
    createNewInvoice: 'Create New Invoice',
    invoiceNumber: 'Invoice Number',
    invoiceType: 'Invoice Type',
    salesInvoice: 'Sales Invoice',
    purchaseInvoice: 'Purchase Invoice',
    client: 'Customer',
    supplier: 'Supplier',
    selectProduct: 'Select Product',
    subtotal: 'Subtotal',
    discount: 'Discount',
    vatRate: 'VAT Rate',
    vatAmount: 'VAT Amount',
    grandTotal: 'Grand Total',
    kwd: 'KWD',
    
    // Customers/Suppliers
    customers: 'Customers',
    suppliers: 'Suppliers',
    addNewCustomer: 'Add New Customer',
    addNewSupplier: 'Add New Supplier',
    
    // Common messages
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    updateSuccess: 'Updated successfully',
    error: 'An error occurred',
    confirmDelete: 'Are you sure you want to delete?',
    
    // Currency
    currency: 'KWD',
    
    // Reports
    trialBalance: 'Trial Balance',
    incomeStatement: 'Income Statement',
    balanceSheet: 'Balance Sheet',
    developingSoon: 'Developing soon...',
    
    // Inventory
    inventoryManagement: 'Inventory Management',
    addProduct: 'Add Product',
    products: 'Products',
    productName: 'Product Name',
    sku: 'SKU',
    category: 'Category',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    totalValue: 'Total Value',
    stockLevel: 'Stock Level',
    totalProducts: 'Total Products',
    noProducts: 'No products found',
    fillRequiredFields: 'Please fill required fields',
    
    // Search and Filter
    searchInventory: 'Search inventory...',
    searchInvoices: 'Search invoices...',
    allCategories: 'All Categories',
    allTypes: 'All Types',
    allStatuses: 'All Statuses',
    sortByName: 'Sort by Name',
    sortBySKU: 'Sort by SKU',
    sortByCategory: 'Sort by Category',
    sortByQuantity: 'Sort by Quantity',
    sortByPrice: 'Sort by Price',
    sortByDate: 'Sort by Date',
    sortByInvoiceNumber: 'Sort by Invoice Number',
    sortByClient: 'Sort by Client',
    sortByAmount: 'Sort by Amount',
    sortAscending: 'Sort Ascending',
    sortDescending: 'Sort Descending',
    showingResults: 'Showing Results',
    of: 'of',
    clearSearch: 'Clear Search',
    noSearchResults: 'No search results found',
    salesInvoices: 'Sales Invoices',
    purchaseInvoices: 'Purchase Invoices',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    
    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('app_language')
    return savedLanguage || 'ar'
  })

  const [direction, setDirection] = useState(() => {
    return language === 'ar' ? 'rtl' : 'ltr'
  })

  useEffect(() => {
    localStorage.setItem('app_language', language)
    setDirection(language === 'ar' ? 'rtl' : 'ltr')
    
    // Update document direction and language
    document.documentElement.dir = direction
    document.documentElement.lang = language
  }, [language, direction])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    direction,
    toggleLanguage,
    setLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}