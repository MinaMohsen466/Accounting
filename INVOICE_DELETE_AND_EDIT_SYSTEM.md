# نظام حذف وتعديل الفواتير المحسّن

## 📋 نظرة عامة

تم تطوير نظام شامل لإدارة حذف وتعديل الفواتير في نظام المحاسبة، مع التركيز على:
- ✅ حماية البيانات من الحذف غير الآمن
- ✅ التحقق من المخزون قبل أي عملية
- ✅ التحكم الكامل في الصلاحيات
- ✅ عكس القيود المحاسبية والمخزون بدقة

---

## 🔐 1. صلاحيات السندات (Vouchers Permissions)

### التغييرات في `UserPermissionsModal.jsx`

تمت إضافة صلاحيات السندات (قبض وصرف) في واجهة إدارة المستخدمين:

#### الصلاحيات الجديدة:
```javascript
// Vouchers (Receipt & Payment)
'view_vouchers': 'عرض السندات',
'create_receipt_vouchers': 'إنشاء سندات قبض',
'create_payment_vouchers': 'إنشاء سندات صرف',
'edit_vouchers': 'تعديل السندات',
'delete_vouchers': 'حذف السندات',
```

#### توزيع الصلاحيات حسب الدور:

##### مدير النظام (Admin):
- ✅ جميع صلاحيات السندات

##### مدير (Manager):
- ✅ عرض السندات
- ✅ إنشاء سندات قبض
- ✅ إنشاء سندات صرف
- ✅ تعديل السندات
- ❌ حذف السندات (محمية للمدير العام فقط)

##### محاسب (Accountant):
- ✅ عرض السندات
- ✅ إنشاء سندات قبض
- ✅ إنشاء سندات صرف
- ✅ تعديل السندات
- ❌ حذف السندات

##### مستخدم عادي (User):
- ✅ عرض السندات فقط
- ❌ لا يمكنه إنشاء أو تعديل أو حذف

### فئة جديدة في واجهة الصلاحيات:
```javascript
'السندات (قبض وصرف)': [
  'view_vouchers',
  'create_receipt_vouchers',
  'create_payment_vouchers',
  'edit_vouchers',
  'delete_vouchers'
]
```

---

## 🗑️ 2. نظام حذف الفاتورة المحسّن

### ميزات النظام الجديد:

#### أ. منع حذف المرتجعات
```javascript
// ✅ التحقق من أن الفاتورة ليست مرتجع
if (invoice.isReturn) {
  alert('❌ لا يمكن حذف المرتجعات!');
  return;
}
```

**السبب:** المرتجعات مرتبطة بفواتير أصلية ويجب عدم حذفها بشكل مستقل.

---

#### ب. منع حذف الفاتورة التي لها مرتجعات
```javascript
// ✅ التحقق من عدم وجود مرتجعات مرتبطة
const relatedReturns = invoices.filter(inv => 
  inv.isReturn && inv.originalInvoiceId === invoice.id
);

if (relatedReturns.length > 0) {
  alert(`❌ لا يمكن حذف هذه الفاتورة!\n\n` +
        `يوجد ${relatedReturns.length} مرتجع مرتبط بهذه الفاتورة.\n` +
        `يجب حذف المرتجعات أولاً قبل حذف الفاتورة الأصلية.`);
  return;
}
```

**السبب:** حذف الفاتورة الأصلية قبل المرتجعات يؤدي إلى بيانات يتيمة (orphaned data).

---

#### ج. التحقق من المخزون (فواتير المشتريات فقط)

```javascript
if (invoice.type === 'purchase' && invoice.items) {
  const inventoryItems = getInventoryItems();
  const insufficientItems = [];
  
  invoice.items.forEach(item => {
    const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName);
    const currentQty = parseFloat(inventoryItem.quantity) || 0;
    const itemQty = parseFloat(item.quantity) || 0;
    
    // عند حذف فاتورة مشتريات، سنخصم الكمية من المخزون
    if (currentQty < itemQty) {
      insufficientItems.push({
        name: item.itemName,
        required: itemQty,
        available: currentQty,
        shortage: itemQty - currentQty
      });
    }
  });
  
  if (insufficientItems.length > 0) {
    // عرض رسالة تفصيلية بالأصناف الناقصة
    alert('❌ لا يمكن حذف فاتورة المشتريات!\n\n' + 
          'الأصناف التالية غير متوفرة بالكميات المطلوبة...');
    return;
  }
}
```

**الفرق بين المشتريات والمبيعات:**

| نوع الفاتورة | عند الإنشاء | عند الحذف | التحقق المطلوب |
|-------------|-------------|-----------|----------------|
| **مشتريات** | إضافة للمخزون | خصم من المخزون | ✅ **نعم** - يجب توفر الكمية |
| **مبيعات** | خصم من المخزون | إضافة للمخزون | ❌ **لا** - الإضافة دائماً آمنة |

**مثال:**
- فاتورة مشتريات: اشتريت 100 قطعة
- بعتَ 80 قطعة من الـ100
- متبقي في المخزون: 20 قطعة
- **لا يمكن حذف فاتورة المشتريات** لأن المخزون لا يحتوي على 100 قطعة للخصم!

---

#### د. رسالة تأكيد تفصيلية

```javascript
const confirmMessage = 
  `هل أنت متأكد من حذف الفاتورة "${invoice.invoiceNumber}"?\n\n` +
  `سيتم:\n` +
  `• عكس القيود المحاسبية\n` +
  `• ${invoice.type === 'sales' ? 'إضافة الكميات إلى' : 'خصم الكميات من'} المخزون\n` +
  `• حذف الفاتورة نهائياً`;
```

---

#### هـ. إخفاء زر الحذف من المرتجعات

```javascript
{/* زر الحذف: يظهر فقط للفواتير الأصلية وليس للمرتجعات */}
{hasPermission('delete_invoices') && !invoice.isReturn && (
  <button 
    className="btn btn-danger btn-sm"
    onClick={() => handleDelete(invoice)}
  >
    🗑️ {language === 'ar' ? 'حذف' : 'Delete'}
  </button>
)}
```

**النتيجة:** المرتجعات لا تحتوي على زر حذف من الأساس!

---

### خطوات الحذف بالتفصيل:

```javascript
// 1. التحقق من الصلاحيات (hasPermission('delete_invoices'))
// 2. التحقق من أن الفاتورة ليست مرتجع
// 3. التحقق من عدم وجود مرتجعات مرتبطة
// 4. التحقق من المخزون (للمشتريات فقط)
// 5. تأكيد المستخدم
// 6. عكس القيود المحاسبية (reverseJournalEntriesForInvoice)
// 7. عكس تأثير المخزون (reverseInventoryEffectsOnDelete)
// 8. حذف الفاتورة من قاعدة البيانات (deleteInvoice)
// 9. تحديث البيانات (refreshAllData)
```

---

## ✏️ 3. نظام تعديل فواتير المبيعات

### الفرق بين تعديل المشتريات والمبيعات:

| نوع الفاتورة | إمكانية التعديل | السبب |
|-------------|-----------------|-------|
| **مشتريات** | ❌ الملاحظات فقط | تجنب تعقيدات المخزون وتكلفة البضاعة |
| **مبيعات** | ✅ تعديل كامل | مرونة في خدمة العملاء وتصحيح الأخطاء |

### ميزات تعديل فاتورة المبيعات:

#### أ. زر التعديل المحسّن
```javascript
{hasPermission('edit_invoices') && (
  <button 
    className="btn btn-secondary btn-sm"
    onClick={() => openModal(invoice)}
  >
    {invoice.type === 'sales' && !invoice.isReturn ? '✏️ ' : ''}
    {language === 'ar' ? 'عرض/تعديل' : 'View/Edit'}
  </button>
)}
```

**الفوائد:**
- زر واحد لعرض وتعديل الفاتورة
- أيقونة قلم ✏️ لفواتير المبيعات فقط
- واضح للمستخدم أنه يمكن التعديل

---

#### ب. التحقق من المخزون عند التعديل

```javascript
if (editingInvoice && formData.type === 'sales') {
  const inventoryItems = getInventoryItems();
  
  // حساب الكميات الأصلية والجديدة
  const productQuantities = {};
  const originalProductQuantities = {};
  
  validItems.forEach(item => {
    productQuantities[item.itemName] = 
      (productQuantities[item.itemName] || 0) + parseFloat(item.quantity);
  });
  
  editingInvoice.items.forEach(item => {
    originalProductQuantities[item.itemName] = 
      (originalProductQuantities[item.itemName] || 0) + parseFloat(item.quantity);
  });
  
  // التحقق من الفرق في الاستهلاك
  for (const [productName, newQuantity] of Object.entries(productQuantities)) {
    const originalQuantity = originalProductQuantities[productName] || 0;
    const quantityDifference = newQuantity - originalQuantity;
    
    // إذا كان الفرق موجب (زيادة في الاستهلاك)
    if (quantityDifference > 0) {
      const inventoryItem = inventoryItems.find(inv => inv.name === productName);
      const currentQty = parseFloat(inventoryItem.quantity) || 0;
      
      if (currentQty < quantityDifference) {
        setModalError(
          `الكمية الإضافية المطلوبة من ${productName} غير متوفرة\n` +
          `الزيادة المطلوبة: ${quantityDifference} • المتوفر: ${currentQty}`
        );
        return;
      }
    }
  }
}
```

**المنطق:**
- ✅ إذا زادت الكمية المباعة → تحقق من توفر الزيادة في المخزون
- ✅ إذا قلّت الكمية المباعة → لا تحقق (ستُرجع للمخزون تلقائياً)
- ✅ إذا بقيت نفس الكمية → لا تحقق

---

#### ج. خطوات التعديل الكاملة

```javascript
if (editingInvoice.type === 'sales') {
  // 1️⃣ عكس تأثير الفاتورة القديمة على المخزون
  editingInvoice.items.forEach(item => {
    const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName);
    if (inventoryItem) {
      const currentQty = parseFloat(inventoryItem.quantity) || 0;
      const oldItemQty = parseFloat(item.quantity) || 0;
      const newQuantity = currentQty + oldItemQty; // إرجاع الكمية
      
      updateInventoryItem(inventoryItem.id, {
        ...inventoryItem,
        quantity: newQuantity
      });
    }
  });
  
  // 2️⃣ عكس القيود المحاسبية القديمة
  reverseJournalEntriesForInvoice(editingInvoice);
  
  // 3️⃣ تحديث بيانات الفاتورة
  result = updateInvoice(editingInvoice.id, invoiceData);
  
  if (result.success) {
    // 4️⃣ تطبيق تأثير الفاتورة الجديدة على المخزون
    updateInventoryForSale(validItems);
    
    // 5️⃣ تسجيل القيود المحاسبية الجديدة
    // (يتم تلقائياً عند حفظ الفاتورة)
  }
}
```

**النتيجة:** التعديل يتم بدقة محاسبية كاملة!

---

## 📊 4. عكس القيود المحاسبية

### دالة `reverseJournalEntriesForInvoice`

```javascript
const reverseJournalEntriesForInvoice = (invoice) => {
  const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
  
  // البحث عن القيود المرتبطة بالفاتورة (باستثناء العكسية)
  const relatedEntries = journalEntries.filter(entry => {
    if (!entry.reference) return false;
    if (entry.reference.startsWith('REV-')) return false; // تجاهل العكسية
    if (entry.type === 'reversal') return false;
    
    return entry.reference.includes(invoice.invoiceNumber);
  });
  
  // إنشاء قيد عكسي لكل قيد
  relatedEntries.forEach(entry => {
    const reversedLines = entry.lines.map(line => ({
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: parseFloat(line.credit) || 0,  // 🔄 عكس المدين والدائن
      credit: parseFloat(line.debit) || 0,
      description: line.description
    }));
    
    const reversalEntry = {
      date: new Date().toISOString().split('T')[0],
      description: `قيد عكسي - حذف فاتورة - ${entry.description}`,
      reference: `REV-${entry.reference}`,
      lines: reversedLines,
      type: 'reversal'
    };
    
    addJournalEntry(reversalEntry);
  });
};
```

**مثال:**

**القيد الأصلي (فاتورة مبيعات):**
```
من حـ/ النقدية         1000 دينار  (مدين)
    إلى حـ/ المبيعات            1000 دينار  (دائن)
```

**القيد العكسي (عند الحذف):**
```
من حـ/ المبيعات       1000 دينار  (مدين)
    إلى حـ/ النقدية            1000 دينار  (دائن)
```

---

## 📦 5. عكس تأثير المخزون

### دالة `reverseInventoryEffectsOnDelete`

```javascript
const reverseInventoryEffectsOnDelete = (deletedInvoice) => {
  if (!deletedInvoice || !deletedInvoice.items) return;
  
  deletedInvoice.items.forEach(item => {
    const inventoryItems = getInventoryItems();
    const inventoryItem = inventoryItems.find(inv => inv.name === item.itemName);
    
    if (inventoryItem) {
      const currentQty = parseFloat(inventoryItem.quantity) || 0;
      const itemQty = parseFloat(item.quantity) || 0;
      let newQuantity = currentQty;
      
      if (deletedInvoice.type === 'sales') {
        // فاتورة مبيعات محذوفة → إرجاع الكمية للمخزون
        newQuantity = currentQty + itemQty;
      } else if (deletedInvoice.type === 'purchase') {
        // فاتورة مشتريات محذوفة → خصم الكمية من المخزون
        newQuantity = Math.max(0, currentQty - itemQty);
      }
      
      updateInventoryItem(inventoryItem.id, {
        ...inventoryItem,
        quantity: newQuantity
      });
    }
  });
};
```

**مثال:**

| نوع الفاتورة | الكمية الأصلية | الكمية في الفاتورة | بعد الحذف | الحساب |
|--------------|----------------|-------------------|----------|---------|
| **مبيعات** | 50 | 10 | 60 | 50 + 10 = 60 |
| **مشتريات** | 60 | 10 | 50 | 60 - 10 = 50 |

---

## 🎯 6. ملخص الفوائد

### حماية البيانات:
- ✅ منع حذف المرتجعات نهائياً
- ✅ منع حذف الفاتورة التي لها مرتجعات
- ✅ التحقق من المخزون قبل الحذف (للمشتريات)
- ✅ رسائل خطأ واضحة ومفصلة

### الدقة المحاسبية:
- ✅ عكس القيود المحاسبية بدقة
- ✅ عكس تأثير المخزون بشكل صحيح
- ✅ تسجيل قيود عكسية بمرجع واضح (REV-)
- ✅ تحديث شامل للبيانات بعد كل عملية

### المرونة:
- ✅ تعديل كامل لفواتير المبيعات
- ✅ التحقق الذكي من المخزون (الفرق فقط)
- ✅ واجهة مستخدم محسّنة مع أيقونات واضحة
- ✅ صلاحيات مفصّلة للسندات

### تجربة المستخدم:
- ✅ رسائل تأكيد تفصيلية
- ✅ رسائل خطأ توضح السبب والحل
- ✅ أزرار واضحة ومتسقة
- ✅ إخفاء أزرار غير مناسبة (مثل حذف المرتجع)

---

## 🧪 7. سيناريوهات الاختبار

### السيناريو 1: حذف فاتورة مشتريات (نجاح)
1. **الإعداد:** فاتورة مشتريات 100 قطعة، المخزون: 100
2. **الإجراء:** حذف الفاتورة
3. **النتيجة المتوقعة:** 
   - ✅ المخزون يصبح 0
   - ✅ عكس القيود المحاسبية
   - ✅ حذف الفاتورة

### السيناريو 2: حذف فاتورة مشتريات (فشل)
1. **الإعداد:** فاتورة مشتريات 100 قطعة، المخزون: 30 (تم بيع 70)
2. **الإجراء:** محاولة حذف الفاتورة
3. **النتيجة المتوقعة:**
   - ❌ رسالة خطأ: "الكمية المطلوبة غير متوفرة"
   - ❌ لم يتم الحذف

### السيناريو 3: حذف فاتورة لها مرتجع
1. **الإعداد:** فاتورة مبيعات + مرتجع مرتبط بها
2. **الإجراء:** محاولة حذف الفاتورة الأصلية
3. **النتيجة المتوقعة:**
   - ❌ رسالة خطأ: "يوجد X مرتجع مرتبط"
   - ❌ لم يتم الحذف

### السيناريو 4: محاولة حذف مرتجع
1. **الإعداد:** مرتجع مبيعات
2. **الإجراء:** النقر على منطقة الفاتورة (لا يوجد زر حذف!)
3. **النتيجة المتوقعة:**
   - ✅ لا يظهر زر حذف
   - ✅ إذا تم استدعاء handleDelete بطريقة ما → رسالة خطأ

### السيناريو 5: تعديل فاتورة مبيعات (زيادة الكمية)
1. **الإعداد:** فاتورة مبيعات 10 قطع، المخزون: 5
2. **الإجراء:** تعديل الكمية إلى 12 قطعة (زيادة 2)
3. **النتيجة المتوقعة:**
   - ❌ رسالة خطأ: "الزيادة المطلوبة: 2 • المتوفر: 5"
   - ❌ لم يتم التعديل

### السيناريو 6: تعديل فاتورة مبيعات (تقليل الكمية)
1. **الإعداد:** فاتورة مبيعات 10 قطع، المخزون: 0
2. **الإجراء:** تعديل الكمية إلى 8 قطع (تقليل 2)
3. **النتيجة المتوقعة:**
   - ✅ نجح التعديل (لا حاجة للتحقق)
   - ✅ المخزون يصبح 2

---

## 📝 8. الملفات المعدلة

### `src/components/UserPermissionsModal.jsx`
- ✅ إضافة صلاحيات السندات (5 صلاحيات جديدة)
- ✅ تحديث الصلاحيات الافتراضية للأدوار الأربعة
- ✅ إضافة فئة جديدة "السندات (قبض وصرف)"

### `src/components/Invoices.jsx`
- ✅ تحديث دالة `handleDelete` (من 20 سطر → 90 سطر)
  - إضافة التحقق من المرتجعات
  - إضافة التحقق من المخزون
  - رسائل تأكيد مفصلة
- ✅ إخفاء زر الحذف من المرتجعات
- ✅ تحسين زر التعديل (إضافة أيقونة ✏️)
- ✅ إصلاح استدعاء `reverseJournalEntriesForInvoice`

---

## 🚀 9. التوصيات المستقبلية

### قصيرة المدى:
1. إضافة سجل تدقيق (Audit Log) لكل عملية حذف/تعديل
2. إمكانية استعادة الفواتير المحذوفة (Soft Delete)
3. تقرير بالقيود العكسية

### متوسطة المدى:
1. إشعارات للمدير عند حذف فواتير كبيرة
2. حد أقصى لقيمة الفاتورة المسموح بحذفها بدون موافقة
3. نظام موافقات متعدد المستويات

### طويلة المدى:
1. نظام workflow كامل للعمليات المالية
2. تكامل مع أنظمة ERP خارجية
3. تحليلات متقدمة لأنماط الحذف والتعديل

---

## 📞 الدعم الفني

في حالة وجود أي مشاكل:
1. تحقق من صلاحيات المستخدم
2. تحقق من سجلات Console (F12)
3. تحقق من رسائل الخطأ المعروضة
4. راجع هذا المستند للسلوك المتوقع

---

**آخر تحديث:** 2025-01-01  
**الإصدار:** 5.2  
**المطور:** MinaMohsen466

---

