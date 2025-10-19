import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useBrand } from '../contexts/BrandContext'
import PermissionDenied from './PermissionDenied'
import './AccountStatement.css'

const AccountStatement = () => {
  const { 
    customers,
    suppliers,
    invoices,
    getCustomerSupplierStatement 
  } = useAccounting()
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()
  const { brandSettings } = useBrand()

  // Check if user has permission to view account statements
  if (!hasPermission('view_customers_suppliers')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لعرض كشوف الحسابات"
        description="تحتاج إلى صلاحية 'عرض العملاء والموردين' للوصول إلى هذه الصفحة"
      />
    )
  }

  const [entityType, setEntityType] = useState('customer') // customer or supplier
  const [selectedEntityId, setSelectedEntityId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statementData, setStatementData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Set default dates (first day of current month to today)
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  // Get current entities based on type
  const currentEntities = entityType === 'customer' ? customers : suppliers
  
  // Filter entities based on search term
  const filteredEntities = currentEntities.filter(entity => 
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entity.phone && entity.phone.includes(searchTerm))
  )

  const generateStatement = () => {
    if (!selectedEntityId || !startDate || !endDate) {
      alert(language === 'ar' ? 'يرجى اختيار العميل/المورد والفترة الزمنية' : 'Please select customer/supplier and date range')
      return
    }

    console.log('📊 Generating statement:', {
      entityId: selectedEntityId,
      entityType: entityType,
      startDate,
      endDate,
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length
    })

    const statement = getCustomerSupplierStatement(selectedEntityId, entityType, startDate, endDate)
    console.log('📋 Statement result:', statement)
    setStatementData(statement)
  }

  const printStatement = () => {
    if (!statementData || !selectedEntity) {
      alert(language === 'ar' ? 'لا يوجد كشف للطباعة' : 'No statement to print')
      return
    }

    // Open new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    const entityLabel = language === 'ar' 
      ? (entityType === 'customer' ? 'العميل' : 'المورد')
      : (entityType === 'customer' ? 'Customer' : 'Supplier')
    
    // Get invoice settings for company info and policies
    const invoiceSettings = brandSettings?.invoiceSettings || {}
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}" lang="${language === 'ar' ? 'ar' : 'en'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${language === 'ar' ? 'كشف حساب' : 'Account Statement'} - ${selectedEntity.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif;
            padding: 8px;
            color: #000;
            direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            background: white;
            font-size: 10px;
            line-height: 1.2;
          }
          
          .statement-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #000;
          }
          
          /* Compact Header */
          .statement-header {
            border-bottom: 2px solid #000;
            padding: 10px 12px;
            background: #f5f5f5;
          }
          
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .company-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            border: 1px solid #666;
          }
          
          .company-info h1 {
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 2px;
            color: #000;
          }
          
          .company-info .header-text {
            font-size: 0.65rem;
            color: #666;
            line-height: 1.1;
          }
          
          .statement-details {
            text-align: ${language === 'ar' ? 'left' : 'right'};
            border: 1px solid #666;
            padding: 5px 6px;
            background: white;
          }
          
          .statement-title {
            font-size: 0.9rem;
            font-weight: bold;
            margin-bottom: 2px;
            color: #000;
          }
          
          .statement-date {
            font-size: 0.65rem;
            color: #666;
          }
          
          /* Entity Info Section */
          .entity-info {
            padding: 8px 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            border-bottom: 1px solid #999;
            background: #fafafa;
          }
          
          .info-section h3 {
            color: #333;
            font-size: 0.7rem;
            margin-bottom: 4px;
            padding-bottom: 2px;
            border-bottom: 1px solid #666;
            font-weight: bold;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            padding: 1px 0;
            font-size: 0.6rem;
          }
          
          .info-label {
            font-weight: bold;
            color: #333;
          }
          
          .info-value {
            color: #000;
          }
          
          /* Compact Statement Table */
          .statement-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 0.6rem;
          }
          
          .statement-table thead {
            background: #333;
            color: white;
          }
          
          .statement-table th {
            padding: 4px 3px;
            text-align: ${language === 'ar' ? 'right' : 'left'};
            font-weight: bold;
            border: 1px solid #333;
            font-size: 0.55rem;
          }
          
          .statement-table td {
            padding: 3px 3px;
            border: 1px solid #ccc;
            text-align: ${language === 'ar' ? 'right' : 'left'};
            font-size: 0.55rem;
            vertical-align: top;
          }
          
          .statement-table tbody tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          /* Row Styles (Black & White) */
          .opening-balance {
            background: #e0e0e0 !important;
            font-weight: bold;
            border-top: 2px solid #000;
          }
          
          .closing-balance {
            background: #d0d0d0 !important;
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          
          .paid-row {
            background: #f5f5f5 !important;
          }
          
          .overdue-row {
            background: #e8e8e8 !important;
            font-style: italic;
          }
          
          /* Simple Text Badges */
          .type-badge {
            font-weight: bold;
            font-size: 0.5rem;
            padding: 1px 2px;
            border: 1px solid #666;
            border-radius: 2px;
            background: white;
          }
          
          /* Summary Section */
          .summary-section {
            padding: 8px 12px;
            background: #f5f5f5;
            border-top: 1px solid #999;
          }
          
          .summary-section h3 {
            font-size: 0.7rem;
            margin-bottom: 5px;
            color: #000;
            text-align: center;
            font-weight: bold;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 6px;
            background: white;
            border: 1px solid #999;
            font-size: 0.6rem;
          }
          
          .summary-label {
            font-weight: bold;
            color: #333;
          }
          
          .summary-value {
            font-weight: bold;
            color: #000;
          }
          
          /* Statistics */
          .statistics {
            padding: 6px 12px;
            background: #fafafa;
            border-top: 1px solid #ccc;
          }
          
          .statistics h3 {
            font-size: 0.65rem;
            margin-bottom: 4px;
            color: #000;
            text-align: center;
            font-weight: bold;
          }
          
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5px;
          }
          
          .stat-card {
            padding: 5px;
            border: 1px solid #999;
            text-align: center;
            background: white;
            font-size: 0.55rem;
          }
          
          .stat-label {
            font-size: 0.5rem;
            color: #666;
            margin-bottom: 2px;
          }
          
          .stat-value {
            font-size: 0.75rem;
            font-weight: bold;
            color: #000;
          }
          
          .stat-amount {
            font-size: 0.5rem;
            margin-top: 2px;
            color: #333;
          }
          
          /* Policies Section */
          .policies-section {
            padding: 6px 12px;
            background: #f8f8f8;
            border-top: 1px solid #ccc;
          }
          
          .policies-title {
            color: #000;
            font-size: 0.65rem;
            font-weight: bold;
            margin-bottom: 4px;
            text-align: center;
            padding: 2px 5px;
            background: white;
            border: 1px solid #999;
          }
          
          .policies-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .policy-item {
            padding: 2px 0;
            font-size: 0.55rem;
            color: #333;
            border-bottom: 1px dotted #ccc;
            line-height: 1.2;
          }
          
          .policy-item:last-child {
            border-bottom: none;
          }
          
          /* Footer */
          .statement-footer {
            padding: 6px 12px;
            text-align: center;
            border-top: 2px solid #000;
            background: #f5f5f5;
            font-size: 0.55rem;
            color: #666;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 0.6cm;
            }
            
            body {
              padding: 0;
            }
            
            .statement-table {
              page-break-inside: auto;
            }
            
            .statement-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            .statement-table thead {
              display: table-header-group;
            }
          }
        </style>
      </head>
      <body>
        <div class="statement-container">
          <!-- Header -->
          <div class="statement-header">
            <div class="header-content">
              <div class="logo-section">
                ${brandSettings?.logoUrl ? `<img src="${brandSettings.logoUrl}" alt="Logo" class="company-logo" />` : ''}
                <div class="company-info">
                  <h1>${brandSettings?.companyName || (language === 'ar' ? 'اسم الشركة' : 'Company Name')}</h1>
                  ${invoiceSettings.showPhone && brandSettings?.companyPhone ? 
                    `<div class="header-text">☎ ${brandSettings.companyPhone}</div>` : ''}
                  ${invoiceSettings.showEmail && brandSettings?.companyEmail ? 
                    `<div class="header-text">✉ ${brandSettings.companyEmail}</div>` : ''}
                  ${invoiceSettings.showAddress && brandSettings?.companyAddress ? 
                    `<div class="header-text">📍 ${brandSettings.companyAddress}</div>` : ''}
                </div>
              </div>
              
              <div class="statement-details">
                <div class="statement-title">${language === 'ar' ? 'كشف حساب' : 'Account Statement'}</div>
                <div class="statement-date">${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
              </div>
            </div>
          </div>
          
          <!-- Entity Info -->
          <div class="entity-info">
            <div class="info-section">
              <h3>${entityLabel}: ${selectedEntity.name}</h3>
              <div class="info-item">
                <span class="info-label">${language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                <span class="info-value">${selectedEntity.phone || '-'}</span>
              </div>
              ${selectedEntity.email ? `
              <div class="info-item">
                <span class="info-label">${language === 'ar' ? 'البريد:' : 'Email:'}</span>
                <span class="info-value">${selectedEntity.email}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-section">
              <h3>${language === 'ar' ? 'معلومات الفترة' : 'Period Info'}</h3>
              <div class="info-item">
                <span class="info-label">${language === 'ar' ? 'من:' : 'From:'}</span>
                <span class="info-value">${new Date(startDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${language === 'ar' ? 'إلى:' : 'To:'}</span>
                <span class="info-value">${new Date(endDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
            </div>
          </div>
          
          <!-- Statement Table -->
          <table class="statement-table">
            <thead>
              <tr>
                <th>${language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>${language === 'ar' ? 'الفاتورة' : 'Invoice'}</th>
                <th>${language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th>${language === 'ar' ? 'النوع' : 'Type'}</th>
                <th>${language === 'ar' ? 'مدين' : 'Debit'}</th>
                <th>${language === 'ar' ? 'دائن' : 'Credit'}</th>
                <th>${language === 'ar' ? 'الرصيد' : 'Balance'}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Opening Balance -->
              <tr class="opening-balance">
                <td colspan="4"><strong>${language === 'ar' ? 'رصيد افتتاحي' : 'Opening Balance'}</strong></td>
                <td>-</td>
                <td>-</td>
                <td><strong>${statementData.openingBalance.toFixed(3)}</strong></td>
              </tr>
              
              <!-- Transactions -->
              ${statementData.transactions.map(trans => {
                const isDebitRow = trans.debit > 0 && trans.credit === 0
                const isCreditRow = trans.credit > 0 && trans.debit === 0
                const isBothRow = trans.debit > 0 && trans.credit > 0
                
                const typeText = isBothRow 
                  ? (language === 'ar' ? 'كلاهما' : 'Both')
                  : isDebitRow 
                    ? (language === 'ar' ? 'مدين' : 'Debit')
                    : isCreditRow 
                      ? (language === 'ar' ? 'دائن' : 'Credit')
                      : '-'
                
                const rowClass = trans.isPaid ? 'paid-row' : trans.status === 'overdue' ? 'overdue-row' : ''
                
                return `
                  <tr class="${rowClass}">
                    <td>${new Date(trans.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td>${trans.invoiceNumber}</td>
                    <td>${trans.description}</td>
                    <td><span class="type-badge">${typeText}</span></td>
                    <td>${trans.debit > 0 ? trans.debit.toFixed(3) : '-'}</td>
                    <td>${trans.credit > 0 ? trans.credit.toFixed(3) : '-'}</td>
                    <td>${trans.balance.toFixed(3)}</td>
                  </tr>
                `
              }).join('')}
              
              <!-- Closing Balance -->
              <tr class="closing-balance">
                <td colspan="4"><strong>${language === 'ar' ? 'الرصيد الختامي' : 'Closing Balance'}</strong></td>
                <td><strong>${statementData.totalDebit.toFixed(3)}</strong></td>
                <td><strong>${statementData.totalCredit.toFixed(3)}</strong></td>
                <td><strong>${statementData.closingBalance.toFixed(3)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <!-- Summary -->
          <div class="summary-section">
            <h3>${language === 'ar' ? 'ملخص الحساب' : 'Summary'}</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">${language === 'ar' ? 'إجمالي المدين:' : 'Total Debit:'}</span>
                <span class="summary-value">${statementData.totalDebit.toFixed(3)}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">${language === 'ar' ? 'إجمالي الدائن:' : 'Total Credit:'}</span>
                <span class="summary-value">${statementData.totalCredit.toFixed(3)}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">${language === 'ar' ? 'الرصيد:' : 'Balance:'}</span>
                <span class="summary-value">${statementData.closingBalance.toFixed(3)}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">${language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                <span class="summary-value">
                  ${statementData.closingBalance > 0 
                    ? (language === 'ar' ? 'مدين' : 'Debit')
                    : statementData.closingBalance < 0 
                      ? (language === 'ar' ? 'دائن' : 'Credit')
                      : (language === 'ar' ? 'متوازن' : 'Balanced')
                  }
                </span>
              </div>
            </div>
          </div>
          
          <!-- Statistics -->
          ${statementData.summary ? `
            <div class="statistics">
              <h3>${language === 'ar' ? 'إحصائيات الفواتير' : 'Invoice Statistics'}</h3>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-label">${language === 'ar' ? 'الإجمالي' : 'Total'}</div>
                  <div class="stat-value">${statementData.summary.totalInvoices}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">${language === 'ar' ? 'مدفوعة' : 'Paid'}</div>
                  <div class="stat-value">${statementData.summary.paidInvoices}</div>
                  <div class="stat-amount">${statementData.summary.totalPaidAmount.toFixed(3)}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">${language === 'ar' ? 'معلقة' : 'Pending'}</div>
                  <div class="stat-value">${statementData.summary.pendingInvoices}</div>
                  <div class="stat-amount">${statementData.summary.totalPendingAmount.toFixed(3)}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">${language === 'ar' ? 'متأخرة' : 'Overdue'}</div>
                  <div class="stat-value">${statementData.summary.overdueInvoices}</div>
                  <div class="stat-amount">${statementData.summary.totalOverdueAmount.toFixed(3)}</div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Policies -->
          ${invoiceSettings.showPolicies && invoiceSettings.policies && invoiceSettings.policies.length > 0 ? `
            <div class="policies-section">
              <div class="policies-title">${language === 'ar' ? 'الشروط والسياسات' : 'Terms & Policies'}</div>
              <ul class="policies-list">
                ${invoiceSettings.policies.map(policy => 
                  `<li class="policy-item">• ${policy}</li>`
                ).join('')}
              </ul>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="statement-footer">
            ${language === 'ar' ? 'شكراً لتعاملكم معنا' : 'Thank you for your business'}
          </div>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const exportToExcel = () => {
    if (!statementData) return

    const selectedEntity = currentEntities.find(ent => ent.id === selectedEntityId)
    const entityLabel = language === 'ar' 
      ? (entityType === 'customer' ? 'عميل' : 'مورد')
      : (entityType === 'customer' ? 'Customer' : 'Supplier')
    
    let csv = '\ufeff' // UTF-8 BOM for Excel to recognize Arabic characters
    csv += `${language === 'ar' ? 'كشف حساب' : 'Account Statement'}\n`
    csv += `${entityLabel}: ${selectedEntity?.name}\n`
    csv += `${language === 'ar' ? 'الهاتف' : 'Phone'}: ${selectedEntity?.phone || '-'}\n`
    csv += `${language === 'ar' ? 'من تاريخ' : 'From'}: ${startDate} ${language === 'ar' ? 'إلى تاريخ' : 'To'}: ${endDate}\n\n`
    
    csv += `${language === 'ar' ? 'التاريخ' : 'Date'},${language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'},${language === 'ar' ? 'الوصف' : 'Description'},${language === 'ar' ? 'النوع' : 'Type'},${language === 'ar' ? 'مدين' : 'Debit'},${language === 'ar' ? 'دائن' : 'Credit'},${language === 'ar' ? 'الرصيد' : 'Balance'}\n`
    
    // Opening balance
    csv += `${startDate},-,${language === 'ar' ? 'رصيد افتتاحي' : 'Opening Balance'},-,,,${statementData.openingBalance.toFixed(3)}\n`
    
    // Transactions
    statementData.transactions.forEach(trans => {
      const isDebitRow = trans.debit > 0 && trans.credit === 0
      const isCreditRow = trans.credit > 0 && trans.debit === 0
      const isBothRow = trans.debit > 0 && trans.credit > 0
      
      const typeText = isBothRow 
        ? (language === 'ar' ? 'مدين ودائن' : 'Debit & Credit')
        : isDebitRow 
          ? (language === 'ar' ? 'مدين' : 'Debit')
          : isCreditRow 
            ? (language === 'ar' ? 'دائن' : 'Credit')
            : '-'
      
      csv += `${trans.date},"${trans.invoiceNumber}","${trans.description}","${typeText}",${trans.debit.toFixed(3)},${trans.credit.toFixed(3)},${trans.balance.toFixed(3)}\n`
    })
    
    // Closing balance
    csv += `\n,,,${language === 'ar' ? 'الرصيد الختامي' : 'Closing Balance'},${statementData.totalDebit.toFixed(3)},${statementData.totalCredit.toFixed(3)},${statementData.closingBalance.toFixed(3)}\n`
    
    // Summary statistics
    if (statementData.summary) {
      csv += `\n${language === 'ar' ? 'إحصائيات الفواتير' : 'Invoice Statistics'}\n`
      csv += `${language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'},${statementData.summary.totalInvoices}\n`
      csv += `${language === 'ar' ? 'فواتير مدفوعة' : 'Paid Invoices'},${statementData.summary.paidInvoices},${statementData.summary.totalPaidAmount.toFixed(3)}\n`
      csv += `${language === 'ar' ? 'فواتير معلقة' : 'Pending Invoices'},${statementData.summary.pendingInvoices},${statementData.summary.totalPendingAmount.toFixed(3)}\n`
      csv += `${language === 'ar' ? 'فواتير متأخرة' : 'Overdue Invoices'},${statementData.summary.overdueInvoices},${statementData.summary.totalOverdueAmount.toFixed(3)}\n`
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `statement_${selectedEntity?.name}_${startDate}_${endDate}.csv`
    link.click()
  }

  const selectedEntity = currentEntities.find(ent => ent.id === selectedEntityId)

  return (
    <div className="account-statement">
      <div className="page-header no-print">
        <h1>{language === 'ar' ? 'كشف حساب' : 'Account Statement'}</h1>
        <p>{language === 'ar' ? 'عرض كشف حساب العملاء والموردين' : 'View customer and supplier account statements'}</p>
      </div>

      <div className="statement-controls no-print">
        <div className="control-row">
          <div className="form-group">
            <label>{language === 'ar' ? 'نوع الحساب' : 'Account Type'}</label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value)
                setSelectedEntityId('')
                setStatementData(null)
              }}
              className="type-select"
            >
              <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
              <option value="supplier">{language === 'ar' ? 'مورد' : 'Supplier'}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'بحث' : 'Search'}</label>
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="form-group">
            <label>
              {language === 'ar' 
                ? (entityType === 'customer' ? 'اختر العميل' : 'اختر المورد')
                : (entityType === 'customer' ? 'Select Customer' : 'Select Supplier')
              }
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="entity-select"
            >
              <option value="">
                {language === 'ar' ? '-- اختر --' : '-- Select --'}
              </option>
              {filteredEntities.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.name} {entity.phone ? `- ${entity.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-row">
          <div className="form-group">
            <label>{language === 'ar' ? 'من تاريخ' : 'From Date'}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group action-buttons">
            <button onClick={generateStatement} className="btn-primary">
              {language === 'ar' ? 'عرض الكشف' : 'Generate Statement'}
            </button>
          </div>
        </div>
      </div>

      {statementData && (
        <div className="statement-report">
          <div className="report-header">
            <div className="company-info">
              {brandSettings.logoUrl && (
                <img 
                  src={brandSettings.logoUrl} 
                  alt="Logo" 
                  className="company-logo"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <h2>{language === 'ar' ? 'كشف حساب' : 'Account Statement'}</h2>
              <div className="entity-info">
                <p>
                  <strong>{language === 'ar' ? (entityType === 'customer' ? 'العميل:' : 'المورد:') : (entityType === 'customer' ? 'Customer:' : 'Supplier:')}</strong> 
                  {selectedEntity?.name}
                </p>
                {selectedEntity?.phone && (
                  <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {selectedEntity.phone}</p>
                )}
                {selectedEntity?.email && (
                  <p><strong>{language === 'ar' ? 'البريد:' : 'Email:'}</strong> {selectedEntity.email}</p>
                )}
                {selectedEntity?.address && (
                  <p><strong>{language === 'ar' ? 'العنوان:' : 'Address:'}</strong> {selectedEntity.address}</p>
                )}
              </div>
              <div className="date-range">
                <p><strong>{language === 'ar' ? 'الفترة:' : 'Period:'}</strong> {new Date(startDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'إلى' : 'to'} {new Date(endDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                <p><strong>{language === 'ar' ? 'تاريخ الطباعة:' : 'Print Date:'}</strong> {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
              </div>
            </div>
            
            <div className="action-buttons no-print">
              <button onClick={printStatement} className="btn-print">
                🖨️ {language === 'ar' ? 'طباعة' : 'Print'}
              </button>
              <button onClick={exportToExcel} className="btn-export">
                📊 {language === 'ar' ? 'تصدير Excel' : 'Export to Excel'}
              </button>
            </div>
          </div>

          <table className="statement-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th>{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                <th className="amount-col">{language === 'ar' ? 'مدين' : 'Debit'}</th>
                <th className="amount-col">{language === 'ar' ? 'دائن' : 'Credit'}</th>
                <th className="amount-col">{language === 'ar' ? 'الرصيد' : 'Balance'}</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr className="opening-balance">
                <td>{new Date(startDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                <td>-</td>
                <td><strong>{language === 'ar' ? 'رصيد افتتاحي' : 'Opening Balance'}</strong></td>
                <td>-</td>
                <td className="amount-col">-</td>
                <td className="amount-col">-</td>
                <td className={`amount-col ${statementData.openingBalance >= 0 ? 'positive' : 'negative'}`}>
                  {statementData.openingBalance.toFixed(3)}
                </td>
              </tr>

              {/* Transactions */}
              {statementData.transactions.length > 0 ? (
                statementData.transactions.map((trans, index) => {
                  // Determine if this row shows debit or credit based on which column has value
                  const isDebitRow = trans.debit > 0 && trans.credit === 0
                  const isCreditRow = trans.credit > 0 && trans.debit === 0
                  const isBothRow = trans.debit > 0 && trans.credit > 0 // Paid invoice
                  
                  return (
                    <tr key={index} className={trans.isPaid ? 'paid-row' : trans.status === 'overdue' ? 'overdue-row' : ''}>
                      <td>{new Date(trans.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                      <td>{trans.invoiceNumber}</td>
                      <td>{trans.description}</td>
                      <td>
                        {isBothRow ? (
                          <span className="type-badge both">
                            {language === 'ar' ? '📋 مدين ودائن' : '📋 Debit & Credit'}
                          </span>
                        ) : isDebitRow ? (
                          <span className="type-badge debit">
                            {language === 'ar' ? '📤 مدين' : '📤 Debit'}
                          </span>
                        ) : isCreditRow ? (
                          <span className="type-badge credit">
                            {language === 'ar' ? '📥 دائن' : '📥 Credit'}
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="amount-col">{trans.debit > 0 ? trans.debit.toFixed(3) : '-'}</td>
                      <td className="amount-col">{trans.credit > 0 ? trans.credit.toFixed(3) : '-'}</td>
                      <td className={`amount-col ${trans.balance >= 0 ? 'positive' : 'negative'}`}>
                        {trans.balance.toFixed(3)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    {language === 'ar' ? 'لا توجد حركات في هذه الفترة' : 'No transactions in this period'}
                  </td>
                </tr>
              )}

              {/* Closing Balance */}
              <tr className="closing-balance">
                <td colSpan="4"><strong>{language === 'ar' ? 'الرصيد الختامي' : 'Closing Balance'}</strong></td>
                <td className="amount-col"><strong>{statementData.totalDebit.toFixed(3)}</strong></td>
                <td className="amount-col"><strong>{statementData.totalCredit.toFixed(3)}</strong></td>
                <td className={`amount-col ${statementData.closingBalance >= 0 ? 'positive' : 'negative'}`}>
                  <strong>{statementData.closingBalance.toFixed(3)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="statement-summary">
            <div className="summary-item">
              <span className="summary-label">{language === 'ar' ? 'إجمالي المدين:' : 'Total Debit:'}</span>
              <span className="summary-value">{statementData.totalDebit.toFixed(3)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{language === 'ar' ? 'إجمالي الدائن:' : 'Total Credit:'}</span>
              <span className="summary-value">{statementData.totalCredit.toFixed(3)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{language === 'ar' ? 'الرصيد النهائي:' : 'Final Balance:'}</span>
              <span className={`summary-value ${statementData.closingBalance >= 0 ? 'positive' : 'negative'}`}>
                {statementData.closingBalance.toFixed(3)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
              <span className={`summary-value ${statementData.closingBalance >= 0 ? 'positive' : 'negative'}`}>
                {language === 'ar' 
                  ? (statementData.closingBalance > 0 
                      ? 'مدين' 
                      : statementData.closingBalance < 0 
                        ? 'دائن' 
                        : 'متوازن'
                    )
                  : (statementData.closingBalance > 0 
                      ? 'Debit' 
                      : statementData.closingBalance < 0 
                        ? 'Credit' 
                        : 'Balanced'
                    )
                }
              </span>
            </div>
          </div>

          {/* Invoice Statistics */}
          {statementData.summary && (
            <div className="invoice-statistics">
              <h3>{language === 'ar' ? 'إحصائيات الفواتير' : 'Invoice Statistics'}</h3>
              <div className="stats-grid">
                <div className="stat-card total">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">{language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}</div>
                    <div className="stat-value">{statementData.summary.totalInvoices}</div>
                  </div>
                </div>
                
                <div className="stat-card paid">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-label">{language === 'ar' ? 'فواتير مدفوعة' : 'Paid Invoices'}</div>
                    <div className="stat-value">{statementData.summary.paidInvoices}</div>
                    <div className="stat-amount">{statementData.summary.totalPaidAmount.toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}</div>
                  </div>
                </div>
                
                <div className="stat-card pending">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <div className="stat-label">{language === 'ar' ? 'فواتير معلقة' : 'Pending Invoices'}</div>
                    <div className="stat-value">{statementData.summary.pendingInvoices}</div>
                    <div className="stat-amount">{statementData.summary.totalPendingAmount.toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}</div>
                  </div>
                </div>
                
                <div className="stat-card overdue">
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-content">
                    <div className="stat-label">{language === 'ar' ? 'فواتير متأخرة' : 'Overdue Invoices'}</div>
                    <div className="stat-value">{statementData.summary.overdueInvoices}</div>
                    <div className="stat-amount">{statementData.summary.totalOverdueAmount.toFixed(3)} {language === 'ar' ? 'د.ك' : 'KWD'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!statementData && (
        <div className="empty-state no-print">
          <div className="empty-icon">📊</div>
          <h3>{language === 'ar' ? 'لم يتم إنشاء الكشف بعد' : 'No Statement Generated Yet'}</h3>
          <p>
            {language === 'ar' 
              ? 'اختر عميلاً أو مورداً والفترة الزمنية لعرض كشف الحساب'
              : 'Select a customer or supplier and date range to view the statement'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default AccountStatement
