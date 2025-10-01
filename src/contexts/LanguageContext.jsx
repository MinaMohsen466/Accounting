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
    appTitle: 'AccounTech Pro - نظام المحاسبة',
    welcome: 'مرحباً بك في AccounTech - نظام إدارة الحسابات',
    
    // Sidebar
    dashboard: 'الرئيسية',
    chartOfAccounts: 'دليل الحسابات',
    journalEntries: 'القيود اليومية',
    invoices: 'الفواتير',
    invoicesManagement: 'إدارة الفواتير',
    customersSuppliers: 'العملاء والموردين',
    enhancedCustomers: 'نظام العملاء المحسن',
    paintCalculator: 'حاسبة الدهان',
    pricingTiers: 'الأسعار المتدرجة',
    inventory: 'إدارة المخزون',
    reports: 'التقارير',
    
    // Dashboard
    dashboardTitle: 'نظام المحاسبة ',
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
    
    // Chart of Accounts Messages
    accountCodeExists: 'رقم الحساب موجود بالفعل',
    accountUpdatedSuccess: 'تم تحديث الحساب بنجاح',
    accountAddedSuccess: 'تم إضافة الحساب بنجاح',
    confirmDeleteAccount: 'هل أنت متأكد من حذف الحساب',
    accountDeletedSuccess: 'تم حذف الحساب بنجاح',
    unexpectedError: 'حدث خطأ غير متوقع',
    loadingData: 'جاري تحميل البيانات...',
    filterAll: 'الكل',
    searchPlaceholder: 'البحث في الحسابات...',
    editAccount: 'تعديل الحساب',
    deleteAccount: 'حذف الحساب',
    save: 'حفظ',
    cancel: 'إلغاء',
    description: 'الوصف',
    actions: 'الإجراءات',
    
    // Customers & Suppliers
    customersAndSuppliers: 'إدارة العملاء والموردين',
    customers: 'العملاء',
    suppliers: 'الموردين',
    addNewCustomer: 'إضافة عميل جديد',
    addNewSupplier: 'إضافة مورد جديد',
    editCustomer: 'تعديل العميل',
    editSupplier: 'تعديل المورد',
    customerName: 'اسم العميل',
    supplierName: 'اسم المورد',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    balance: 'الرصيد',
    notes: 'ملاحظات',
    customerUpdatedSuccess: 'تم تحديث العميل بنجاح',
    customerAddedSuccess: 'تم إضافة العميل بنجاح',
    supplierUpdatedSuccess: 'تم تحديث المورد بنجاح',
    supplierAddedSuccess: 'تم إضافة المورد بنجاح',
    confirmDeleteCustomer: 'هل أنت متأكد من حذف العميل',
    confirmDeleteSupplier: 'هل أنت متأكد من حذف المورد',
    customerDeletedSuccess: 'تم حذف العميل بنجاح',
    supplierDeletedSuccess: 'تم حذف المورد بنجاح',
    noCustomersFound: 'لا توجد عملاء',
    noSuppliersFound: 'لا توجد موردين',
    searchCustomersSuppliers: 'البحث في العملاء والموردين...',
    unexpectedError: 'حدث خطأ غير متوقع',
    
    // Enhanced Customer System - نظام العملاء المحسن
    customerTypes: 'أنواع العملاء',
    customerType: 'نوع العميل',
    individual: 'أفراد',
    contractor: 'مقاولين',
    company: 'شركات',
    retailer: 'تجار تجزئة',
    
    // Pricing System - نظام الأسعار
    pricingTiers: 'الأسعار المتدرجة',
    discountRate: 'معدل الخصم',
    volumeDiscount: 'خصم الكمية',
    customerDiscount: 'خصم العميل',
    
    // Projects - المشاريع
    projects: 'المشاريع',
    projectName: 'اسم المشروع',
    projectStatus: 'حالة المشروع',
    projectLocation: 'موقع المشروع',
    projectStartDate: 'تاريخ بداية المشروع',
    projectEndDate: 'تاريخ انتهاء المشروع',
    projectValue: 'قيمة المشروع',
    active: 'نشط',
    completed: 'مكتمل',
    onHold: 'معلق',
    cancelled: 'ملغي',
    
    // Paint Calculator - حاسبة الدهان
    paintCalculator: 'حاسبة متطلبات الدهان',
    surfaceArea: 'مساحة السطح',
    surfaceType: 'نوع السطح',
    coatsNeeded: 'عدد الطبقات',
    paintRequired: 'كمية الدهان المطلوبة',
    coverage: 'التغطية',
    smooth: 'أملس',
    textured: 'خشن',
    rough: 'خشن جداً',
    
    // Customer Details - تفاصيل العميل
    customerDetails: 'تفاصيل العميل',
    registrationNumber: 'رقم التسجيل',
    taxNumber: 'الرقم الضريبي',
    creditLimit: 'حد الائتمان',
    paymentTerms: 'شروط الدفع',
    preferredPayment: 'طريقة الدفع المفضلة',
    
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
    editInvoice: 'تعديل الفاتورة',
    invoiceNumber: 'رقم الفاتورة',
    invoiceType: 'نوع الفاتورة',
    salesInvoice: 'فاتورة مبيعات',
    purchaseInvoice: 'فاتورة مشتريات',
    client: 'العميل',
    supplier: 'المورد',
    project: 'المشروع',
    selectProject: 'اختر المشروع',
    selectProduct: 'اختر المنتج',
    selectClient: 'اختر العميل',
    selectSupplier: 'اختر المورد',
    invoiceDate: 'تاريخ الفاتورة',
    dueDate: 'تاريخ الاستحقاق',
    paymentStatus: 'حالة الدفع',
    invoiceDescription: 'وصف الفاتورة',
    invoiceDescriptionPlaceholder: 'وصف مختصر للفاتورة',
    invoiceItems: 'عناصر الفاتورة',
    addItem: 'إضافة عنصر',
    searchProduct: 'ابحث عن المنتج...',
    noProductsFound: 'لا توجد منتجات مطابقة للبحث',
    available: 'متوفر',
    notAvailable: 'غير متوفر',
    subtotal: 'المجموع الفرعي',
    discount: 'خصم',
    itemDiscount: 'خصم المنتج',
    discountAmount: 'مبلغ الخصم',
    discountRate: 'نسبة الخصم',
    discountType: 'نوع الخصم',
    amount: 'مبلغ',
    percentage: 'نسبة مئوية',
    vatRate: 'معدل ض.ق.م',
    vatAmount: 'مبلغ ض.ق.م',
    vatPercentage: 'نسبة ض.ق.م',
    vatType: 'نوع ض.ق.م',
    grandTotal: 'الإجمالي الكلي',
    createJournalEntry: 'إنشاء قيد محاسبي تلقائي',
    createInvoiceBtn: 'إنشاء الفاتورة',
    saveChanges: 'حفظ التغييرات',
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
    
    // Invoice validation messages
    selectClientSupplier: 'يرجى اختيار العميل/المورد',
    enterInvoiceDescription: 'يرجى إدخال وصف الفاتورة',
    addAtLeastOneItem: 'يجب إضافة عنصر واحد على الأقل',
    invoiceCreatedSuccess: 'تم إنشاء الفاتورة بنجاح',
    invoiceUpdatedSuccess: 'تم تحديث الفاتورة بنجاح',
    invoiceDeletedSuccess: 'تم حذف الفاتورة بنجاح',
    unexpectedError: 'حدث خطأ غير متوقع',
    
    // Invoice types and statuses
    sales: 'مبيعات',
    purchase: 'مشتريات',
    
    // Button texts
    viewEdit: 'عرض/تعديل',
    print: 'طباعة',
    printInvoice: 'طباعة الفاتورة',
    
    // Table headers
    invoiceNum: 'رقم الفاتورة',
    type: 'النوع',
    clientSupplier: 'العميل/المورد',
    totalAmount: 'المبلغ الإجمالي',
    status: 'الحالة',
    
    // Invoice tabs
    allInvoices: 'جميع الفواتير',
    salesInvoices: 'فواتير المبيعات',
    purchaseInvoices: 'فواتير المشتريات',
    withDiscount: 'بخصم',
    withVAT: 'بضريبة',
    hasDiscount: 'يحتوي على خصم',
    hasVAT: 'يحتوي على ضريبة قيمة مضافة',
    
    // Messages
    noInvoicesAvailable: 'لا توجد فواتير متاحة',
    
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
    selectCategory: 'اختر التصنيف',
    selectOrTypeCategory: 'اختر أو اكتب التصنيف',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    purchasePrice: 'سعر الشراء',
    expectedProfit: 'الربح المتوقع',
    totalValue: 'القيمة الإجمالية',
    stockLevel: 'مستوى المخزون',
    totalProducts: 'إجمالي المنتجات',
    noProducts: 'لا توجد منتجات',
    fillRequiredFields: 'يرجى ملء الحقول المطلوبة',
    
    // Paint Store Specific Categories
    interiorPaint: 'دهانات داخلية',
    exteriorPaint: 'دهانات خارجية', 
    primer: 'برايمر',
    varnish: 'ورنيش',
    brushes: 'فرش',
    tools: 'أدوات',
    accessories: 'مستلزمات',
    
    // Measurement Units
    unit: 'الوحدة',
    selectUnit: 'اختر الوحدة',
    liter: 'لتر',
    gallon: 'جالون',
    kilogram: 'كيلوجرام',
    piece: 'قطعة',
    meter: 'متر',
    set: 'طقم',
    
    // Color Management
    colorCode: 'رمز اللون',
    colorName: 'اسم اللون',
    colorSystem: 'نظام الألوان',
    colorFormula: 'تركيبة اللون',
    ralSystem: 'نظام RAL',
    pantoneSystem: 'نظام PANTONE',
    ncsSystem: 'نظام NCS',
    customColor: 'لون مخصص',
    
    // Expiry and Stock Management
    expiryDate: 'تاريخ انتهاء الصلاحية',
    minStockLevel: 'مستوى الإنذار',
    manufacturer: 'الشركة المصنعة',
    batchNumber: 'رقم الدفعة',
    lastPurchaseDate: 'تاريخ آخر شراء',
    lastPurchasePrice: 'سعر آخر شراء',
    
    // Stock Status
    outOfStock: 'نفد المخزون',
    criticalLow: 'مستوى حرج',
    lowStock: 'مخزون منخفض',
    adequateStock: 'مخزون كافي',
    wellStocked: 'مخزون جيد',
    
    // Expiry Status
    expired: 'منتهي الصلاحية',
    expiringSoon: 'ينتهي قريباً',
    expiringWithin3Months: 'ينتهي خلال 3 أشهر',
    validProduct: 'صالح',
    noExpiryDate: 'لا يوجد تاريخ انتهاء',
    
    // Properties
    properties: 'الخصائص',
    finishType: 'نوع اللمسة النهائية',
    coverage: 'التغطية',
    dryingTime: 'وقت الجفاف',
    washability: 'قابلية الغسيل',
    weatherResistance: 'مقاومة الطقس',
    uvProtection: 'الحماية من الأشعة فوق البنفسجية',
    surfaceType: 'نوع السطح',
    durability: 'المتانة',
    brushSize: 'حجم الفرشاة',
    hairType: 'نوع الشعر',
    handleMaterial: 'مادة المقبض',
    material: 'المادة',
    size: 'الحجم',
    usageType: 'نوع الاستخدام',
    
    // Color Management System
    colorManagement: 'إدارة الألوان',
    searchColors: 'البحث في الألوان...',
    allSystems: 'جميع الأنظمة',
    addNewColor: 'إضافة لون جديد',
    addColor: 'إضافة اللون',
    hexColor: 'اللون السادس عشري',
    colorFormulaPlaceholder: 'مثال: White Base + Titanium Dioxide',
    notesPlaceholder: 'ملاحظات إضافية...',
    noColorsFound: 'لم يتم العثور على ألوان',
    select: 'اختيار',
    formula: 'التركيبة',
    notes: 'ملاحظات',
    chooseColor: 'اختر اللون',
    colorPalette: 'لوحة الألوان',
    colorInformation: 'معلومات اللون',
    
    // Unit Converter
    unitConverter: 'محول الوحدات',
    unitConversion: 'تحويل الوحدات',
    from: 'من',
    to: 'إلى',
    conversionExamples: 'أمثلة التحويل',
    volumeConversions: 'تحويلات الحجم',
    commonPaintQuantities: 'كميات الدهان الشائعة',
    coverageInfo: 'معلومات التغطية',
    quickConversionTable: 'جدول التحويل السريع',
    coverage: 'التغطية',
    smallRoom: 'غرفة صغيرة',
    mediumRoom: 'غرفة متوسطة',
    largeRoom: 'غرفة كبيرة',
    exteriorHouse: 'منزل خارجي',
    
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
    
    // Data Management
    dataManagement: 'إدارة البيانات',
    dataManagementDescription: 'تصدير واستيراد بيانات النظام مع إجراءات الحماية',
    exportData: 'تصدير البيانات',
    exportDescription: 'تصدير جميع بيانات النظام إلى ملف JSON',
    exportWithLocation: 'تصدير مع اختيار المكان',
    exportInfo: 'سيتم تصدير جميع البيانات (الحسابات، القيود، الفواتير، العملاء، المخزون) إلى ملف JSON يمكن استيراده لاحقاً',
    exportSuccess: 'تم تصدير البيانات بنجاح',
    exportError: 'حدث خطأ أثناء التصدير',
    importData: 'استيراد البيانات',
    importDescription: 'استيراد البيانات من ملف النسخة الاحتياطية',
    enableImport: 'تفعيل الاستيراد',
    importEnabled: 'الاستيراد مفعل',
    autoDisableAfter30Seconds: 'سيتم إلغاء التفعيل تلقائياً بعد 30 ثانية',
    importWarningTitle: 'تحذير مهم!',
    importWarningMessage: 'استيراد البيانات سيؤدي إلى حذف جميع البيانات الموجودة واستبدالها بالبيانات من الملف المختار. تأكد من أن لديك نسخة احتياطية قبل المتابعة.',
    selectFile: 'اختيار ملف',
    filePreview: 'معاينة الملف',
    fileName: 'اسم الملف',
    fileSize: 'حجم الملف',
    exportDate: 'تاريخ التصدير',
    dataCount: 'عدد العناصر',
    confirmDataReplacement: 'أؤكد أنني أريد استبدال جميع البيانات الحالية',
    executeImport: 'تنفيذ الاستيراد',
    importSuccess: 'تم استيراد البيانات بنجاح! سيتم إعادة تحميل الصفحة',
    importError: 'حدث خطأ أثناء الاستيراد',
    pleaseConfirmImport: 'يرجى تأكيد الاستيراد أولاً',
    invalidFileType: 'نوع الملف غير صحيح. يرجى اختيار ملف JSON',
    invalidJsonFile: 'الملف المختار ليس ملف JSON صحيح',
    unknown: 'غير معروف',
    pending: 'معلقة',
    overdue: 'متأخرة',
    
    // Invoice Notifications and Due Dates
    invoiceNotifications: 'تنبيهات الفواتير',
    overdueInvoices: 'فواتير متأخرة',
    invoicesDueSoon: 'فواتير قريبة الاستحقاق',
    invoicesDueToday: 'فواتير مستحقة اليوم',
    daysOverdue: 'يوم متأخر',
    daysDue: 'يوم متبقي',
    dueToday: 'مستحقة اليوم',
    noDueDate: 'لا يوجد تاريخ استحقاق',
    totalOverdueAmount: 'إجمالي المبالغ المتأخرة',
    totalDueAmount: 'إجمالي المبالغ المستحقة',
    urgentNotice: 'تنبيه عاجل',
    paymentReminder: 'تذكير بالدفع',
    autoStatusUpdate: 'تم تحديث الحالة تلقائياً',
    invoiceStatusUpdated: 'تم تحديث حالة الفواتير تلقائياً بناءً على تاريخ الاستحقاق',
    more: 'المزيد',
    
    // Language
    language: 'اللغة',
    settings: 'الإعدادات',
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
    appTitle: 'AccounTech Pro - Accounting System',
    welcome: 'Welcome to AccounTech Pro - Advanced Business Management System',
    
    // Sidebar
    dashboard: 'Dashboard',
    chartOfAccounts: 'Chart of Accounts',
    journalEntries: 'Journal Entries',
    invoices: 'Invoices',
    invoicesManagement: 'Invoice Management',
    customersSuppliers: 'Customers & Suppliers',
    enhancedCustomers: 'Enhanced Customer System',
    paintCalculator: 'Paint Calculator',
    pricingTiers: 'Pricing Tiers',
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
    
    // Chart of Accounts Messages
    accountCodeExists: 'Account code already exists',
    accountUpdatedSuccess: 'Account updated successfully',
    accountAddedSuccess: 'Account added successfully',
    confirmDeleteAccount: 'Are you sure you want to delete the account',
    accountDeletedSuccess: 'Account deleted successfully',
    unexpectedError: 'An unexpected error occurred',
    loadingData: 'Loading data...',
    filterAll: 'All',
    searchPlaceholder: 'Search accounts...',
    editAccount: 'Edit Account',
    deleteAccount: 'Delete Account',
    save: 'Save',
    cancel: 'Cancel',
    description: 'Description',
    actions: 'Actions',
    
    // Customers & Suppliers
    customersAndSuppliers: 'Customers & Suppliers Management',
    customers: 'Customers',
    suppliers: 'Suppliers',
    addNewCustomer: 'Add New Customer',
    addNewSupplier: 'Add New Supplier',
    editCustomer: 'Edit Customer',
    editSupplier: 'Edit Supplier',
    customerName: 'Customer Name',
    supplierName: 'Supplier Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    balance: 'Balance',
    notes: 'Notes',
    customerUpdatedSuccess: 'Customer updated successfully',
    customerAddedSuccess: 'Customer added successfully',
    supplierUpdatedSuccess: 'Supplier updated successfully',
    supplierAddedSuccess: 'Supplier added successfully',
    confirmDeleteCustomer: 'Are you sure you want to delete the customer',
    confirmDeleteSupplier: 'Are you sure you want to delete the supplier',
    customerDeletedSuccess: 'Customer deleted successfully',
    supplierDeletedSuccess: 'Supplier deleted successfully',
    noCustomersFound: 'No customers found',
    noSuppliersFound: 'No suppliers found',
    searchCustomersSuppliers: 'Search customers & suppliers...',
    unexpectedError: 'An unexpected error occurred',
    
    // Enhanced Customer System
    customerTypes: 'Customer Types',
    customerType: 'Customer Type',
    individual: 'Individual',
    contractor: 'Contractor',
    company: 'Company',
    retailer: 'Retailer',
    
    // Pricing System
    pricingTiers: 'Pricing Tiers',
    discountRate: 'Discount Rate',
    volumeDiscount: 'Volume Discount',
    customerDiscount: 'Customer Discount',
    
    // Projects
    projects: 'Projects',
    projectName: 'Project Name',
    projectStatus: 'Project Status',
    projectLocation: 'Project Location',
    projectStartDate: 'Project Start Date',
    projectEndDate: 'Project End Date',
    projectValue: 'Project Value',
    active: 'Active',
    completed: 'Completed',
    onHold: 'On Hold',
    cancelled: 'Cancelled',
    
    // Paint Calculator
    paintCalculator: 'Paint Requirements Calculator',
    surfaceArea: 'Surface Area',
    surfaceType: 'Surface Type',
    coatsNeeded: 'Coats Needed',
    paintRequired: 'Paint Required',
    coverage: 'Coverage',
    smooth: 'Smooth',
    textured: 'Textured',
    rough: 'Rough',
    
    // Customer Details
    customerDetails: 'Customer Details',
    registrationNumber: 'Registration Number',
    taxNumber: 'Tax Number',
    creditLimit: 'Credit Limit',
    paymentTerms: 'Payment Terms',
    preferredPayment: 'Preferred Payment Method',
    
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
    editInvoice: 'Edit Invoice',
    invoiceNumber: 'Invoice Number',
    invoiceType: 'Invoice Type',
    salesInvoice: 'Sales Invoice',
    purchaseInvoice: 'Purchase Invoice',
    client: 'Customer',
    supplier: 'Supplier',
    project: 'Project',
    selectProject: 'Select Project',
    selectProduct: 'Select Product',
    selectClient: 'Select Customer',
    selectSupplier: 'Select Supplier',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    paymentStatus: 'Payment Status',
    invoiceDescription: 'Invoice Description',
    invoiceDescriptionPlaceholder: 'Brief description of the invoice',
    invoiceItems: 'Invoice Items',
    addItem: 'Add Item',
    searchProduct: 'Search for product...',
    noProductsFound: 'No products found matching the search',
    available: 'Available',
    notAvailable: 'Not Available',
    subtotal: 'Subtotal',
    discount: 'Discount',
    itemDiscount: 'Item Discount',
    discountAmount: 'Discount Amount',
    discountRate: 'Discount Rate',
    discountType: 'Discount Type',
    amount: 'Amount',
    percentage: 'Percentage',
    vatRate: 'VAT Rate',
    vatAmount: 'VAT Amount',
    vatPercentage: 'VAT Percentage',
    vatType: 'VAT Type',
    grandTotal: 'Grand Total',
    createJournalEntry: 'Create automatic journal entry',
    createInvoiceBtn: 'Create Invoice',
    saveChanges: 'Save Changes',
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
    
    // Invoice validation messages
    selectClientSupplier: 'Please select customer/supplier',
    enterInvoiceDescription: 'Please enter invoice description',
    addAtLeastOneItem: 'Must add at least one item',
    invoiceCreatedSuccess: 'Invoice created successfully',
    invoiceUpdatedSuccess: 'Invoice updated successfully',
    invoiceDeletedSuccess: 'Invoice deleted successfully',
    unexpectedError: 'An unexpected error occurred',
    
    // Invoice types and statuses
    sales: 'Sales',
    purchase: 'Purchase',
    
    // Button texts
    viewEdit: 'View/Edit',
    print: 'Print',
    printInvoice: 'Print Invoice',
    
    // Table headers
    invoiceNum: 'Invoice Number',
    type: 'Type',
    clientSupplier: 'Customer/Supplier',
    totalAmount: 'Total Amount',
    status: 'Status',
    
    // Invoice tabs
    allInvoices: 'All Invoices',
    salesInvoices: 'Sales Invoices',
    purchaseInvoices: 'Purchase Invoices',
    withDiscount: 'With Discount',
    withVAT: 'With VAT',
    hasDiscount: 'Has Discount',
    hasVAT: 'Has VAT',
    
    // Messages
    noInvoicesAvailable: 'No invoices available',
    
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
    selectCategory: 'Select Category',
    selectOrTypeCategory: 'Select or type category',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    purchasePrice: 'Purchase Price',
    expectedProfit: 'Expected Profit',
    totalValue: 'Total Value',
    stockLevel: 'Stock Level',
    totalProducts: 'Total Products',
    noProducts: 'No products found',
    fillRequiredFields: 'Please fill required fields',
    
    // Paint Store Specific Categories
    interiorPaint: 'Interior Paint',
    exteriorPaint: 'Exterior Paint',
    primer: 'Primer',
    varnish: 'Varnish',
    brushes: 'Brushes',
    tools: 'Tools',
    accessories: 'Accessories',
    
    // Measurement Units
    unit: 'Unit',
    selectUnit: 'Select Unit',
    liter: 'Liter',
    gallon: 'Gallon',
    kilogram: 'Kilogram',
    piece: 'Piece',
    meter: 'Meter',
    set: 'Set',
    
    // Color Management
    colorCode: 'Color Code',
    colorName: 'Color Name',
    colorSystem: 'Color System',
    colorFormula: 'Color Formula',
    ralSystem: 'RAL System',
    pantoneSystem: 'PANTONE System',
    ncsSystem: 'NCS System',
    customColor: 'Custom Color',
    
    // Expiry and Stock Management
    expiryDate: 'Expiry Date',
    minStockLevel: 'Minimum Stock Level',
    manufacturer: 'Manufacturer',
    batchNumber: 'Batch Number',
    lastPurchaseDate: 'Last Purchase Date',
    lastPurchasePrice: 'Last Purchase Price',
    
    // Stock Status
    outOfStock: 'Out of Stock',
    criticalLow: 'Critical Low',
    lowStock: 'Low Stock',
    adequateStock: 'Adequate Stock',
    wellStocked: 'Well Stocked',
    
    // Expiry Status
    expired: 'Expired',
    expiringSoon: 'Expiring Soon',
    expiringWithin3Months: 'Expiring Within 3 Months',
    validProduct: 'Valid',
    noExpiryDate: 'No Expiry Date',
    
    // Properties
    properties: 'Properties',
    finishType: 'Finish Type',
    coverage: 'Coverage',
    dryingTime: 'Drying Time',
    washability: 'Washability',
    weatherResistance: 'Weather Resistance',
    uvProtection: 'UV Protection',
    surfaceType: 'Surface Type',
    durability: 'Durability',
    brushSize: 'Brush Size',
    hairType: 'Hair Type',
    handleMaterial: 'Handle Material',
    material: 'Material',
    size: 'Size',
    usageType: 'Usage Type',
    
    // Color Management System
    colorManagement: 'Color Management',
    searchColors: 'Search colors...',
    allSystems: 'All Systems',
    addNewColor: 'Add New Color',
    addColor: 'Add Color',
    hexColor: 'Hex Color',
    colorFormulaPlaceholder: 'Example: White Base + Titanium Dioxide',
    notesPlaceholder: 'Additional notes...',
    noColorsFound: 'No colors found',
    select: 'Select',
    formula: 'Formula',
    notes: 'Notes',
    chooseColor: 'Choose Color',
    colorPalette: 'Color Palette',
    colorInformation: 'Color Information',
    
    // Unit Converter
    unitConverter: 'Unit Converter',
    unitConversion: 'Unit Conversion',
    from: 'From',
    to: 'To',
    conversionExamples: 'Conversion Examples',
    volumeConversions: 'Volume Conversions',
    commonPaintQuantities: 'Common Paint Quantities',
    coverageInfo: 'Coverage Information',
    quickConversionTable: 'Quick Conversion Table',
    coverage: 'Coverage',
    smallRoom: 'Small Room',
    mediumRoom: 'Medium Room',
    largeRoom: 'Large Room',
    exteriorHouse: 'Exterior House',
    
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
    
    // Invoice Notifications and Due Dates
    invoiceNotifications: 'Invoice Notifications',
    overdueInvoices: 'Overdue Invoices',
    invoicesDueSoon: 'Invoices Due Soon',
    invoicesDueToday: 'Invoices Due Today',
    daysOverdue: 'days overdue',
    daysDue: 'days remaining',
    dueToday: 'due today',
    noDueDate: 'No due date',
    totalOverdueAmount: 'Total Overdue Amount',
    totalDueAmount: 'Total Due Amount',
    urgentNotice: 'Urgent Notice',
    paymentReminder: 'Payment Reminder',
    autoStatusUpdate: 'Auto Status Update',
    invoiceStatusUpdated: 'Invoice statuses updated automatically based on due dates',
    more: 'more',
    
    // Data Management
    dataManagement: 'Data Management',
    dataManagementDescription: 'Export and import system data with security measures',
    exportData: 'Export Data',
    exportDescription: 'Export all system data to a JSON file',
    exportWithLocation: 'Export with Location Selection',
    exportInfo: 'All data (accounts, entries, invoices, customers, inventory) will be exported to a JSON file that can be imported later',
    exportSuccess: 'Data exported successfully',
    exportError: 'Error occurred during export',
    importData: 'Import Data',
    importDescription: 'Import data from backup file',
    enableImport: 'Enable Import',
    importEnabled: 'Import Enabled',
    autoDisableAfter30Seconds: 'Will auto-disable after 30 seconds',
    importWarningTitle: 'Important Warning!',
    importWarningMessage: 'Importing data will delete all existing data and replace it with data from the selected file. Make sure you have a backup before proceeding.',
    selectFile: 'Select File',
    filePreview: 'File Preview',
    fileName: 'File Name',
    fileSize: 'File Size',
    exportDate: 'Export Date',
    dataCount: 'Data Count',
    confirmDataReplacement: 'I confirm that I want to replace all current data',
    executeImport: 'Execute Import',
    importSuccess: 'Data imported successfully! Page will reload',
    importError: 'Error occurred during import',
    pleaseConfirmImport: 'Please confirm import first',
    invalidFileType: 'Invalid file type. Please select a JSON file',
    invalidJsonFile: 'Selected file is not a valid JSON file',
    unknown: 'Unknown',
    
    // Language
    language: 'Language',
    settings: 'Settings',
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