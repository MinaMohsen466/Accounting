/* eslint-disable */
// NEW BLACK & WHITE COMPACT PRINT FUNCTION FOR ACCOUNT STATEMENT
// نسخة محسّنة أبيض وأسود مع حجم أصغر واسم الشركة والسياسات

const printStatement = () => {
  if (!statementData || !selectedEntity) {
    alert(language === 'ar' ? 'لا يوجد كشف للطباعة' : 'No statement to print')
    return
  }

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
