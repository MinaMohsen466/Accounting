import { useState } from 'react'
import { useAccounting } from '../hooks/useAccounting'
import { useLanguage } from '../contexts/LanguageContext'
import './JournalEntries.css'

const JournalEntries = () => {
  const { 
    journalEntries, 
    accounts,
    addJournalEntry, 
    updateJournalEntry, 
    deleteJournalEntry 
  } = useAccounting()
  const { t, language } = useLanguage()

  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [notification, setNotification] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', accountName: '', debit: 0, credit: 0, description: '' },
      { accountId: '', accountName: '', debit: 0, credit: 0, description: '' }
    ]
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      lines: [
        { accountId: '', accountName: '', debit: 0, credit: 0, description: '' },
        { accountId: '', accountName: '', debit: 0, credit: 0, description: '' }
      ]
    })
    setEditingEntry(null)
  }

  const openModal = (entry = null) => {
    if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        reference: entry.reference || '',
        lines: entry.lines || [
          { accountId: '', accountName: '', debit: 0, credit: 0, description: '' },
          { accountId: '', accountName: '', debit: 0, credit: 0, description: '' }
        ]
      })
      setEditingEntry(entry)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', accountName: '', debit: 0, credit: 0, description: '' }]
    }))
  }

  const removeLine = (index) => {
    if (formData.lines.length > 2) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }))
    }
  }

  const updateLine = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }))
  }

  const handleAccountChange = (index, accountId) => {
    const selectedAccount = accounts.find(acc => acc.id === accountId)
    if (selectedAccount) {
      updateLine(index, 'accountId', accountId)
      updateLine(index, 'accountName', selectedAccount.name)
    }
  }

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0)
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0)
    return { totalDebit, totalCredit, difference: Math.abs(totalDebit - totalCredit) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.description.trim()) {
      showNotification('يرجى إدخال وصف القيد', 'error')
      return
    }

    const { totalDebit, totalCredit, difference } = calculateTotals()
    
    if (difference > 0.01) { // Allow small rounding differences
      showNotification('مجموع المدين يجب أن يساوي مجموع الدائن', 'error')
      return
    }

    if (totalDebit === 0 && totalCredit === 0) {
      showNotification('يجب إدخال قيم للمدين أو الدائن', 'error')
      return
    }

    // Check if all lines have accounts selected
    const invalidLines = formData.lines.filter(line => 
      (line.debit > 0 || line.credit > 0) && !line.accountId
    )
    
    if (invalidLines.length > 0) {
      showNotification('يجب اختيار حساب لكل سطر يحتوي على قيم', 'error')
      return
    }

    // Filter out empty lines
    const validLines = formData.lines.filter(line => 
      line.accountId && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0)
    )

    if (validLines.length < 2) {
      showNotification('يجب أن يحتوي القيد على سطرين على الأقل', 'error')
      return
    }

    const entryData = {
      ...formData,
      lines: validLines
    }

    try {
      let result
      if (editingEntry) {
        result = updateJournalEntry(editingEntry.id, entryData)
      } else {
        result = addJournalEntry(entryData)
      }

      if (result.success) {
        showNotification(
          editingEntry ? t('updateSuccess') : t('saveSuccess')
        )
        closeModal()
      } else {
        showNotification(result.error, 'error')
      }
    } catch (err) {
      showNotification(t('error'), 'error')
    }
  }

  const handleDelete = async (entry) => {
    if (window.confirm(`${t('confirmDelete')} "${entry.entryNumber}"؟`)) {
      const result = deleteJournalEntry(entry.id)
      if (result.success) {
        showNotification(t('deleteSuccess'))
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  return (
    <div className="journal-entries">
      <div className="page-header">
        <h1>{t('journalEntries')}</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          {t('journalEntriesAdd')}
        </button>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="table-container">
        {journalEntries.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('entryNumber')}</th>
                <th>{t('date')}</th>
                <th>{t('description')}</th>
                <th>{t('reference')}</th>
                <th>{t('debit')} {t('total')}</th>
                <th>{t('credit')} {t('total')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map(entry => {
                const totalDebit = entry.lines?.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0) || 0
                const totalCredit = entry.lines?.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0) || 0
                
                return (
                  <tr key={entry.id}>
                    <td>{entry.entryNumber}</td>
                    <td>{new Date(entry.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td>{entry.description}</td>
                    <td>{entry.reference || '-'}</td>
                    <td>{totalDebit.toFixed(2)}</td>
                    <td>{totalCredit.toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(entry)}
                      >
                        {t('view')}/{t('edit')}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(entry)}
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{t('noJournalEntries')}</p>
          </div>
        )}
      </div>

      {/* Journal Entry Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content journal-modal">
            <div className="modal-header">
              <h2>{editingEntry ? `تعديل القيد رقم ${editingEntry.entryNumber}` : 'إضافة قيد جديد'}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Entry Header */}
              <div className="entry-header">
                <div className="form-group">
                  <label>التاريخ *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>المرجع</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder={t('reference')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('description')} *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('description')}
                  rows="2"
                  required
                />
              </div>

              {/* Journal Lines */}
              <div className="journal-lines">
                <div className="lines-header">
                  <h3>{t('entryDetails')}</h3>
                  <button type="button" className="btn btn-secondary" onClick={addLine}>
                    {t('addLine')}
                  </button>
                </div>

                <div className="lines-table-container">
                  <table className="lines-table">
                    <thead>
                      <tr>
                        <th>{t('account')}</th>
                        <th>{t('description')}</th>
                        <th>{t('debit')}</th>
                        <th>{t('credit')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, index) => (
                        <tr key={index}>
                          <td>
                            <select
                              value={line.accountId}
                              onChange={(e) => handleAccountChange(index, e.target.value)}
                            >
                              <option value="">اختر حساب</option>
                              {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.code} - {account.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              placeholder="وصف السطر"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(index, 'debit', e.target.value)}
                              onFocus={(e) => {
                                if (line.credit > 0) updateLine(index, 'credit', 0)
                              }}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(index, 'credit', e.target.value)}
                              onFocus={(e) => {
                                if (line.debit > 0) updateLine(index, 'debit', 0)
                              }}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            {formData.lines.length > 2 && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeLine(index)}
                              >
                                حذف
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="totals-section">
                  <div className="totals-grid">
                    <div className="total-item">
                      <label>إجمالي المدين:</label>
                      <span>{calculateTotals().totalDebit.toFixed(2)}</span>
                    </div>
                    <div className="total-item">
                      <label>إجمالي الدائن:</label>
                      <span>{calculateTotals().totalCredit.toFixed(2)}</span>
                    </div>
                    <div className="total-item">
                      <label>الفرق:</label>
                      <span className={calculateTotals().difference > 0.01 ? 'error-text' : 'success-text'}>
                        {calculateTotals().difference.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingEntry ? 'حفظ التغييرات' : 'إضافة القيد'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JournalEntries