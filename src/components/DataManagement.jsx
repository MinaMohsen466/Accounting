import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { ExportService } from '../services/ExportService'
import { ImportService } from '../services/ImportService'
import PermissionDenied from './PermissionDenied'
import './DataManagement.css'

const DataManagement = () => {
  const { t, language } = useLanguage()
  const { hasPermission } = useAuth()

  // Check if user has permission to manage data
  if (!hasPermission('export_data') && !hasPermission('import_data')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لإدارة البيانات"
        description="تحتاج إلى صلاحية 'تصدير البيانات' أو 'استيراد البيانات' للوصول إلى هذه الصفحة"
      />
    )
  }

  const [isImportEnabled, setIsImportEnabled] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [exportPath, setExportPath] = useState('')
  const [showImportWarning, setShowImportWarning] = useState(false)
  const [importStats, setImportStats] = useState(null)

  // تفعيل/إلغاء تفعيل الاستيراد
  const toggleImportEnabled = () => {
    if (!isImportEnabled) {
      setIsImportEnabled(true)
      setShowImportWarning(true)
      // إعادة تعطيل الاستيراد بعد 30 ثانية لأمان إضافي
      setTimeout(() => {
        setIsImportEnabled(false)
        setImportFile(null)
        setImportConfirmed(false)
        setShowImportWarning(false)
      }, 30000)
    } else {
      setIsImportEnabled(false)
      setImportFile(null)
      setImportConfirmed(false)
      setShowImportWarning(false)
    }
  }

  // معالجة اختيار ملف الاستيراد
  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        alert(t('invalidFileType'))
        return
      }
      setImportFile(file)
      
      // قراءة معلومات الملف للعرض
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const stats = {
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(2) + ' KB',
            exportDate: data.exportDate || t('unknown'),
            dataCount: data.dataCount || (data.data ? Object.keys(data.data).length : 0)
          }
          setImportStats(stats)
        } catch (error) {
          alert(t('invalidJsonFile'))
          setImportFile(null)
        }
      }
      reader.readAsText(file)
    }
  }

  // تأكيد الاستيراد
  const confirmImport = () => {
    setImportConfirmed(true)
  }

  // تنفيذ الاستيراد
  const executeImport = async () => {
    if (!importFile || !importConfirmed) {
      alert(t('pleaseConfirmImport'))
      return
    }

    try {
      const result = await ImportService.importLocalStorageFromFile(importFile)
      if (result) {
        alert(t('importSuccess'))
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload()
      }
    } catch (error) {
      console.error('Import error:', error)
      alert(t('importError') + ': ' + error.message)
    }
  }

  // تصدير البيانات مع اختيار المكان
  const handleExportWithLocation = () => {
    const timestamp = new Date().toISOString().split('T')[0]
    const defaultName = `accounting_backup_${timestamp}.json`
    
    // استخدام File System Access API إذا كان متاحاً (Chrome/Edge)
    if ('showSaveFilePicker' in window) {
      exportWithFilePicker(defaultName)
    } else {
      // التصدير التقليدي
      handleTraditionalExport(defaultName)
    }
  }

  // تصدير باستخدام File System Access API
  const exportWithFilePicker = async (defaultName) => {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] }
        }]
      })

      const data = ExportService.getAllLocalStorageData()
      const backupData = {
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        version: '1.0',
        dataCount: Object.keys(data).length,
        data: data
      }

      const jsonString = JSON.stringify(backupData, null, 2)
      const writable = await fileHandle.createWritable()
      await writable.write(jsonString)
      await writable.close()

      alert(t('exportSuccess'))
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Export error:', error)
        alert(t('exportError'))
      }
    }
  }

  // التصدير التقليدي
  const handleTraditionalExport = (defaultName) => {
    try {
      const data = ExportService.getAllLocalStorageData()
      const backupData = {
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        version: '1.0',
        dataCount: Object.keys(data).length,
        data: data
      }

      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const downloadLink = document.createElement('a')
      downloadLink.href = url
      downloadLink.download = defaultName
      downloadLink.style.display = 'none'
      
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(url)
      
      alert(t('exportSuccess'))
    } catch (error) {
      console.error('Export error:', error)
      alert(t('exportError'))
    }
  }

  // إعادة تعيين حالة الاستيراد
  const resetImportState = () => {
    setImportFile(null)
    setImportConfirmed(false)
    setImportStats(null)
    if (document.getElementById('importFile')) {
      document.getElementById('importFile').value = ''
    }
  }

  return (
    <div className="data-management">
      <div className="data-management-header">
        <h2>{t('dataManagement')}</h2>
        <p>{t('dataManagementDescription')}</p>
      </div>

      {/* قسم التصدير */}
      <div className="export-section">
        <div className="section-header">
          <h3>📤 {t('exportData')}</h3>
          <p>{t('exportDescription')}</p>
        </div>
        
        <div className="export-controls">
          {hasPermission('export_data') && (
            <button 
              className="btn btn-primary export-btn"
              onClick={handleExportWithLocation}
            >
              📁 {t('exportWithLocation')}
            </button>
          )}
          
          <div className="export-info">
            <small>{t('exportInfo')}</small>
          </div>
        </div>
      </div>

      {/* قسم الاستيراد */}
      <div className="import-section">
        <div className="section-header">
          <h3>📥 {t('importData')}</h3>
          <p>{t('importDescription')}</p>
        </div>

        {/* تحذير الاستيراد */}
        {showImportWarning && (
          <div className="import-warning">
            <div className="warning-content">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>{t('importWarningTitle')}</strong>
                <p>{t('importWarningMessage')}</p>
              </div>
            </div>
          </div>
        )}

        {/* تفعيل الاستيراد */}
        {hasPermission('import_data') && (
          <div className="import-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isImportEnabled}
                onChange={toggleImportEnabled}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {isImportEnabled ? t('importEnabled') : t('enableImport')}
            </span>
            {isImportEnabled && (
              <span className="timer-warning">
                ⏰ {t('autoDisableAfter30Seconds')}
              </span>
            )}
          </div>
        )}

        {/* اختيار الملف */}
        {isImportEnabled && (
          <div className="file-selection">
            <div className="file-input-wrapper">
              <input
                id="importFile"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={!isImportEnabled}
              />
              <label htmlFor="importFile" className="file-input-label">
                📁 {t('selectFile')}
              </label>
            </div>

            {importFile && importStats && (
              <div className="file-preview">
                <h4>{t('filePreview')}</h4>
                <div className="file-stats">
                  <div className="stat-item">
                    <span className="stat-label">{t('fileName')}:</span>
                    <span className="stat-value">{importStats.fileName}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('fileSize')}:</span>
                    <span className="stat-value">{importStats.fileSize}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('exportDate')}:</span>
                    <span className="stat-value">{importStats.exportDate}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('dataCount')}:</span>
                    <span className="stat-value">{importStats.dataCount}</span>
                  </div>
                </div>

                {/* تأكيد الاستيراد */}
                <div className="import-confirmation">
                  <label className="confirmation-checkbox">
                    <input
                      type="checkbox"
                      checked={importConfirmed}
                      onChange={(e) => setImportConfirmed(e.target.checked)}
                    />
                    <span>{t('confirmDataReplacement')}</span>
                  </label>
                </div>

                {/* أزرار التحكم */}
                <div className="import-actions">
                  {hasPermission('import_data') && (
                    <button
                      className="btn btn-danger import-btn"
                      onClick={executeImport}
                      disabled={!importConfirmed}
                    >
                      🔄 {t('executeImport')}
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={resetImportState}
                  >
                    🚫 {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DataManagement