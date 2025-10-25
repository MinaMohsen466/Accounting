import { useState, useEffect } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './PaymentModal.css'

const PaymentModal = ({ isOpen, onClose, transactionType = 'payment', accountId = null }) => {
  const { accounts, addJournalEntry } = useAccounting()
  const { language } = useLanguage()

  const [formData, setFormData] = useState({
    type: transactionType, // 'deposit', 'withdrawal', 'payment', 'receipt', 'expense'
    date: new Date().toISOString().split('T')[0],
    amount: '',
    bankAccountId: accountId || '',
    counterAccountId: '',
    description: '',
    reference: '',
    paymentMethod: 'cash',
    checkNumber: '',
    payeeName: ''
  })

  const [errors, setErrors] = useState({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: transactionType,
        date: new Date().toISOString().split('T')[0],
        amount: '',
        bankAccountId: accountId || '',
        counterAccountId: '',
        description: '',
        reference: '',
        paymentMethod: 'cash',
        checkNumber: '',
        payeeName: ''
      })
      setErrors({})
    }
  }, [isOpen, transactionType, accountId])

  // Get bank/cash accounts
  const bankAccounts = accounts.filter(a => 
    a && (a.type === 'bank' || a.type === 'cash')
  )

  // Get expense accounts
  const expenseAccounts = accounts.filter(a => a && a.type === 'expense')

  // Get revenue accounts
  const revenueAccounts = accounts.filter(a => a && a.type === 'revenue')

  // Get all other accounts (for custom selection)
  const otherAccounts = accounts.filter(a => 
    a && !['bank', 'cash'].includes(a.type)
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = language === 'ar' ? 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' : 'Amount is required and must be greater than zero'
    }

    if (!formData.bankAccountId) {
      newErrors.bankAccountId = language === 'ar' ? 'الحساب البنكي مطلوب' : 'Bank account is required'
    }

    if (!formData.counterAccountId) {
      newErrors.counterAccountId = language === 'ar' ? 'الحساب المقابل مطلوب' : 'Counter account is required'
    }

    if (!formData.description) {
      newErrors.description = language === 'ar' ? 'الوصف مطلوب' : 'Description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const bankAccount = accounts.find(a => a.id === formData.bankAccountId)
    const counterAccount = accounts.find(a => a.id === formData.counterAccountId)
    const amount = parseFloat(formData.amount)

    // Create journal entry based on transaction type
    let journalEntry = {
      date: formData.date,
      description: formData.description,
      reference: formData.reference || `${formData.type.toUpperCase()}-${Date.now()}`,
      type: formData.type,
      lines: []
    }

    // Determine debit/credit based on transaction type
    switch (formData.type) {
      case 'deposit':
        // إيداع: مدين البنك، دائن الحساب المقابل (رأس المال أو إيرادات)
        journalEntry.lines = [
          {
            accountId: bankAccount.id,
            accountName: bankAccount.name,
            debit: amount,
            credit: 0,
            description: formData.description
          },
          {
            accountId: counterAccount.id,
            accountName: counterAccount.name,
            debit: 0,
            credit: amount,
            description: formData.description
          }
        ]
        break

      case 'withdrawal':
      case 'payment':
      case 'expense':
        // سحب/دفعة/مصروف: مدين الحساب المقابل (مصروف)، دائن البنك
        journalEntry.lines = [
          {
            accountId: counterAccount.id,
            accountName: counterAccount.name,
            debit: amount,
            credit: 0,
            description: formData.description
          },
          {
            accountId: bankAccount.id,
            accountName: bankAccount.name,
            debit: 0,
            credit: amount,
            description: formData.description
          }
        ]
        break

      case 'receipt':
        // تحصيل: مدين البنك، دائن الحساب المقابل (عميل أو إيرادات)
        journalEntry.lines = [
          {
            accountId: bankAccount.id,
            accountName: bankAccount.name,
            debit: amount,
            credit: 0,
            description: formData.description
          },
          {
            accountId: counterAccount.id,
            accountName: counterAccount.name,
            debit: 0,
            credit: amount,
            description: formData.description
          }
        ]
        break

      default:
        break
    }

    // Add payment method and payee info to description if needed
    if (formData.payeeName) {
      journalEntry.payeeName = formData.payeeName
    }
    if (formData.paymentMethod === 'check' && formData.checkNumber) {
      journalEntry.checkNumber = formData.checkNumber
    }

    // Submit journal entry
    const result = addJournalEntry(journalEntry)
    
    if (result.success) {
      // Trigger data refresh
      window.dispatchEvent(new Event('accountingDataUpdated'))
      onClose(true) // Pass true to indicate success
    } else {
      setErrors({ submit: result.error })
    }
  }

  if (!isOpen) return null

  const transactionLabels = {
    deposit: language === 'ar' ? 'إيداع' : 'Deposit',
    withdrawal: language === 'ar' ? 'سحب' : 'Withdrawal',
    payment: language === 'ar' ? 'دفعة' : 'Payment',
    receipt: language === 'ar' ? 'تحصيل' : 'Receipt',
    expense: language === 'ar' ? 'مصروف' : 'Expense'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {transactionLabels[formData.type] || (language === 'ar' ? 'حركة مالية' : 'Transaction')}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>{language === 'ar' ? 'نوع الحركة' : 'Transaction Type'}</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="deposit">{language === 'ar' ? 'إيداع' : 'Deposit'}</option>
                <option value="withdrawal">{language === 'ar' ? 'سحب' : 'Withdrawal'}</option>
                <option value="payment">{language === 'ar' ? 'دفعة' : 'Payment'}</option>
                <option value="receipt">{language === 'ar' ? 'تحصيل' : 'Receipt'}</option>
                <option value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'التاريخ' : 'Date'}</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{language === 'ar' ? 'الحساب البنكي / الخزينة' : 'Bank/Cash Account'} *</label>
              <select
                name="bankAccountId"
                value={formData.bankAccountId}
                onChange={handleChange}
                className={errors.bankAccountId ? 'error' : ''}
              >
                <option value="">{language === 'ar' ? 'اختر الحساب' : 'Select Account'}</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
              {errors.bankAccountId && <span className="error-message">{errors.bankAccountId}</span>}
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'المبلغ' : 'Amount'} *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.amount ? 'error' : ''}
              />
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>
              {formData.type === 'deposit' || formData.type === 'receipt' 
                ? (language === 'ar' ? 'الحساب المقابل (مصدر الأموال)' : 'Counter Account (Source)')
                : (language === 'ar' ? 'الحساب المقابل (نوع المصروف/الدفعة)' : 'Counter Account (Expense Type)')
              } *
            </label>
            <select
              name="counterAccountId"
              value={formData.counterAccountId}
              onChange={handleChange}
              className={errors.counterAccountId ? 'error' : ''}
            >
              <option value="">{language === 'ar' ? 'اختر الحساب' : 'Select Account'}</option>
              
              {(formData.type === 'withdrawal' || formData.type === 'payment' || formData.type === 'expense') && (
                <>
                  <optgroup label={language === 'ar' ? 'حسابات المصروفات' : 'Expense Accounts'}>
                    {expenseAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
              
              {(formData.type === 'deposit' || formData.type === 'receipt') && (
                <>
                  <optgroup label={language === 'ar' ? 'حسابات الإيرادات' : 'Revenue Accounts'}>
                    {revenueAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
              
              <optgroup label={language === 'ar' ? 'حسابات أخرى' : 'Other Accounts'}>
                {otherAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </optgroup>
            </select>
            {errors.counterAccountId && <span className="error-message">{errors.counterAccountId}</span>}
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'الوصف / البيان' : 'Description'} *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder={language === 'ar' ? 'أدخل وصف الحركة...' : 'Enter transaction description...'}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{language === 'ar' ? 'المرجع / رقم السند' : 'Reference'}</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'اسم المستفيد' : 'Payee Name'}</label>
              <input
                type="text"
                name="payeeName"
                value={formData.payeeName}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="cash">{language === 'ar' ? 'نقداً' : 'Cash'}</option>
                <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="check">{language === 'ar' ? 'شيك' : 'Check'}</option>
                <option value="card">{language === 'ar' ? 'بطاقة' : 'Card'}</option>
              </select>
            </div>

            {formData.paymentMethod === 'check' && (
              <div className="form-group">
                <label>{language === 'ar' ? 'رقم الشيك' : 'Check Number'}</label>
                <input
                  type="text"
                  name="checkNumber"
                  value={formData.checkNumber}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'رقم الشيك' : 'Check #'}
                />
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentModal
