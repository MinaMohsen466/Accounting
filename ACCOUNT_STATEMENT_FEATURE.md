# ميزة كشف حساب العملاء والموردين - Customer & Supplier Statement Feature

## نظرة عامة / Overview

تم إضافة ميزة كشف الحساب للعملاء والموردين إلى نظام المحاسبة، والتي تتيح للمستخدمين عرض جميع الفواتير والحركات المالية لأي عميل أو مورد خلال فترة زمنية محددة مع إمكانية الطباعة والتصدير.

A new Customer & Supplier Account Statement feature has been added to the accounting system, allowing users to view all invoices and financial transactions for any customer or supplier within a specified time period with print and export capabilities.

## الملفات المضافة / Added Files

1. **src/components/AccountStatement.jsx** - المكون الرئيسي لكشف الحساب
2. **src/components/AccountStatement.css** - تنسيقات الصفحة والطباعة

## الملفات المعدلة / Modified Files

1. **src/App.jsx** - إضافة المسار للمكون الجديد
2. **src/components/Sidebar.jsx** - إضافة عنصر القائمة
3. **src/hooks/useAccounting.js** - إضافة دالة `getAccountStatement`
4. **src/contexts/LanguageContext.jsx** - إضافة الترجمات العربية والإنجليزية

## المميزات / Features

### 1. اختيار نوع الحساب / Account Type Selection
- التبديل بين العملاء والموردين
- واجهة موحدة لكلا النوعين
- Switch between customers and suppliers seamlessly

### 2. البحث عن العملاء/الموردين / Search Functionality
- بحث سريع بالاسم أو رقم الهاتف
- قائمة منسدلة تعرض جميع الخيارات المتاحة
- دعم كامل للغة العربية والإنجليزية

### 3. فلترة حسب الفترة الزمنية / Date Range Filter
- اختيار تاريخ البداية والنهاية
- القيم الافتراضية: من أول الشهر الحالي إلى اليوم
- حساب الرصيد الافتتاحي تلقائياً

### 4. عرض الكشف / Statement Display
- **رأسية احترافية** تشمل:
  - شعار الشركة (إن وُجد)
  - اسم العميل/المورد
  - معلومات الاتصال (هاتف، بريد، عنوان)
  - الفترة الزمنية
  - تاريخ الطباعة
- **الرصيد الافتتاحي** - Opening Balance
- **جميع الفواتير** مع:
  - التاريخ / Date
  - رقم الفاتورة / Invoice Number
  - الوصف / Description
  - المدين / Debit (للعملاء: مبيعات)
  - الدائن / Credit (للموردين: مشتريات)
  - الرصيد الجاري / Running Balance
- **الرصيد الختامي** - Closing Balance
- **ملخص الإجماليات**:
  - إجمالي المدين / Total Debit
  - إجمالي الدائن / Total Credit
  - الرصيد النهائي / Final Balance
  - الحالة: له/عليه (Receivable/Payable)

### 5. التصدير والطباعة / Export & Print
- **طباعة**: تنسيق احترافي يشمل شعار الشركة
- **تصدير إلى Excel**: ملف CSV بترميز UTF-8 يدعم العربية
- اسم الملف يتضمن: اسم العميل/المورد والتاريخ
- إخفاء عناصر التحكم عند الطباعة

### 6. الألوان الدلالية / Color Coding
- 🟢 **أخضر** للأرصدة الموجبة (Positive - له)
- 🔴 **أحمر** للأرصدة السالبة (Negative - عليه)
- تمييز واضح للرصيد الافتتاحي والختامي

### 7. دعم الطباعة المحترف / Professional Print Support
- رأسية تحتوي على شعار الشركة
- معلومات كاملة للعميل/المورد
- تنسيق مناسب للورق A4
- جداول منظمة وسهلة القراءة
### 8. واجهة سهلة الاستخدام / User-Friendly Interface
- رسائل واضحة عند عدم وجود بيانات
- تصميم متجاوب (Responsive)
- دعم كامل للـ RTL (العربية)
- أيقونات توضيحية

## الاستخدام العملي / Practical Usage

### حالات الاستخدام / Use Cases

#### 1. كشف حساب عميل
- لمعرفة المبالغ المستحقة على العميل
- متابعة الفواتير غير المسددة
- طباعة كشف لإرساله للعميل

#### 2. كشف حساب مورد
- لمعرفة المبالغ المستحقة للمورد
- تسوية الحسابات مع الموردين
- مراجعة المشتريات خلال فترة معينة

## كيفية الاستخدام / How to Use

### 1. الوصول للصفحة / Access the Page
انقر على "📋 كشف حساب" من القائمة الجانبية
Click on "📋 Account Statement" from the sidebar menu

### 2. اختيار نوع الحساب / Select Account Type
- اختر "عميل" أو "مورد" من القائمة المنسدلة
- Select "Customer" or "Supplier" from the dropdown

### 3. البحث واختيار العميل/المورد / Search and Select
- استخدم حقل البحث للعثور على الاسم
- أو اختر من القائمة المنسدلة مباشرة

### 4. تحديد الفترة / Set Date Range
- اختر "من تاريخ" و "إلى تاريخ"
- أو استخدم القيم الافتراضية

### 5. عرض الكشف / Generate Statement
انقر على زر "عرض الكشف" / Click "Generate Statement"

### 6. طباعة أو تصدير / Print or Export
- 🖨️ زر الطباعة للطباعة مباشرة (مع الشعار)
- 📊 زر التصدير لحفظ ملف Excel

## الصلاحيات المطلوبة / Required Permissions

- `view_customers_suppliers` - لعرض كشوف حسابات العملاء والموردين

## الوظائف البرمجية / Functions

### getCustomerSupplierStatement(entityId, entityType, startDate, endDate)

**Parameters:**
- `entityId` (string): معرف العميل أو المورد
- `entityType` (string): 'customer' أو 'supplier'
- `startDate` (string): تاريخ البداية (YYYY-MM-DD)
- `endDate` (string): تاريخ النهاية (YYYY-MM-DD)

**Returns:**
```javascript
{
  entityId: string,
  entityType: 'customer' | 'supplier',
  startDate: string,
  endDate: string,
  openingBalance: number,
  transactions: [{
    date: string,
    invoiceNumber: string,
    description: string,
    debit: number,
    credit: number,
    balance: number,
    status: string
  }],
  totalDebit: number,
  totalCredit: number,
  closingBalance: number
}
```

**Logic:**
- للعملاء (Customers): فواتير المبيعات تُحتسب كـ مدين (Debit)
- للموردين (Suppliers): فواتير المشتريات تُحتسب كـ دائن (Credit)
- الرصيد الموجب يعني "له" والسالب يعني "عليه"

## التنسيقات / Styling

### الألوان / Colors
- **Primary Color**: `var(--primary-color, #3498db)`
- **Positive Balance**: `#27ae60` (أخضر)
- **Negative Balance**: `#e74c3c` (أحمر)
- **Table Header**: `#34495e` (رمادي داكن)

### الاستجابة / Responsive
- شاشات كبيرة: عرض كامل
- شاشات متوسطة: تكيف تلقائي
- شاشات صغيرة: عمود واحد

## الترجمة / Translations

تم إضافة المفاتيح التالية:
```javascript
ar: {
  accountStatement: 'كشف حساب'
}

en: {
  accountStatement: 'Account Statement'
}
```

## ملاحظات تقنية / Technical Notes

1. **مصدر البيانات**: يتم استخراج البيانات من الفواتير (Invoices) وليس القيود اليومية
2. **الأداء**: الحسابات تتم في الذاكرة للسرعة
3. **الترتيب**: الفواتير مرتبة حسب التاريخ تصاعدياً
4. **الدقة**: استخدام `toFixed(3)` للأرقام العشرية (3 منازل)
5. **الترميز**: UTF-8 BOM للتصدير لدعم العربية في Excel
6. **الشعار**: يتم جلب الشعار من `BrandContext`
7. **المنطق المحاسبي**:
   - عميل: مبيعات = مدين، دفعات = دائن
   - مورد: مشتريات = دائن، دفعات = مدين

## التطوير المستقبلي / Future Enhancements

- [ ] إضافة الدفعات (Payments) إلى الكشف
- [ ] فلترة حسب حالة السداد (مدفوع/غير مدفوع/جزئي)
- [ ] إضافة ملاحظات على الفواتير
- [ ] تصدير PDF مع تصميم احترافي
- [ ] إرسال الكشف بالبريد الإلكتروني
- [ ] تذكيرات تلقائية للمتأخرات
- [ ] جدولة الكشوفات الدورية
- [ ] مقارنة فترات زمنية مختلفة
- [ ] رسوم بيانية للرصيد
- [ ] تقرير شيخوخة الديون (Aging Report)

## المساهمة / Contributing

عند إضافة ميزات جديدة:
1. اتبع نفس نمط الكود
2. أضف الترجمات العربية والإنجليزية
3. اختبر في كلا الاتجاهين (RTL/LTR)
4. تأكد من الطباعة والتصدير

---

**تاريخ الإنشاء**: 19 أكتوبر 2025
**الإصدار**: 1.0.0
