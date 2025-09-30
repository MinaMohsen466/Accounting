export class ExportService {
  /**
   * قراءة جميع البيانات من localStorage
   * @returns {Object} جميع البيانات المخزنة في localStorage
   */
  static getAllLocalStorageData() {
    const data = {}
    
    // قراءة جميع المفاتيح من localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      try {
        // محاولة تحويل القيمة إلى JSON، إذا فشلت سيتم حفظها كنص
        const value = localStorage.getItem(key)
        try {
          data[key] = JSON.parse(value)
        } catch {
          // إذا لم تكن القيمة JSON صالح، احفظها كنص
          data[key] = value
        }
      } catch (error) {
        console.warn(`تعذر قراءة المفتاح: ${key}`, error)
      }
    }
    
    return data
  }

  /**
   * تصدير البيانات مع اختيار مكان الحفظ
   */
  static async exportWithLocationPicker() {
    try {
      const data = this.getAllLocalStorageData()
      const backupData = {
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        version: '1.0',
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        },
        dataCount: Object.keys(data).length,
        totalSize: JSON.stringify(data).length,
        data: data
      }

      const jsonString = JSON.stringify(backupData, null, 2)
      const timestamp = new Date().toISOString().split('T')[0]
      const defaultName = `accounting_backup_${timestamp}.json`

      // استخدام File System Access API إذا كان متاحاً
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultName,
            types: [{
              description: 'JSON Backup Files',
              accept: { 'application/json': ['.json'] }
            }]
          })

          const writable = await fileHandle.createWritable()
          await writable.write(jsonString)
          await writable.close()

          return { success: true, method: 'filePicker' }
        } catch (error) {
          if (error.name === 'AbortError') {
            return { success: false, canceled: true }
          }
          throw error
        }
      } else {
        // التصدير التقليدي للمتصفحات القديمة
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

        return { success: true, method: 'traditional' }
      }
    } catch (error) {
      console.error('خطأ في التصدير:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * إنشاء نسخة احتياطية مبسطة (البيانات فقط بدون معلومات إضافية)
   */
  static exportSimpleBackup() {
    try {
      const data = this.getAllLocalStorageData()
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      const downloadLink = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      downloadLink.href = url
      downloadLink.download = `backup_simple_${new Date().toISOString().split('T')[0]}.json`
      downloadLink.style.display = 'none'
      
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('خطأ في التصدير المبسط:', error)
      return false
    }
  }

  /**
   * الحصول على إحصائيات localStorage
   * @returns {Object} إحصائيات حول البيانات المخزنة
   */
  static getLocalStorageStats() {
    const stats = {
      totalKeys: localStorage.length,
      keys: [],
      totalSize: 0,
      largestKey: null,
      largestSize: 0
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      const size = value ? value.length : 0

      stats.keys.push({
        key: key,
        size: size,
        sizeKB: (size / 1024).toFixed(2)
      })

      stats.totalSize += size

      if (size > stats.largestSize) {
        stats.largestSize = size
        stats.largestKey = key
      }
    }

    stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2)
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2)

    return stats
  }

  /**
   * استيراد البيانات من ملف JSON
   * @param {File} file ملف JSON المراد استيراده
   * @returns {Promise} وعد بنتيجة الاستيراد
   */
  static importFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('لم يتم تحديد ملف'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result)
          
          // التحقق من نوع البيانات
          let dataToImport = jsonData
          
          // إذا كان الملف يحتوي على معلومات النسخة الاحتياطية
          if (jsonData.data && typeof jsonData.data === 'object') {
            dataToImport = jsonData.data
          }
          
          // استيراد البيانات إلى localStorage
          Object.keys(dataToImport).forEach(key => {
            const value = dataToImport[key]
            if (typeof value === 'object') {
              localStorage.setItem(key, JSON.stringify(value))
            } else {
              localStorage.setItem(key, value)
            }
          })
          
          resolve({
            success: true,
            importedKeys: Object.keys(dataToImport).length,
            data: dataToImport
          })
          
        } catch (error) {
          reject(new Error(`خطأ في قراءة الملف: ${error.message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('خطأ في قراءة الملف'))
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * مسح جميع بيانات localStorage
   * @param {Array} excludeKeys مفاتيح يجب تجنب مسحها (اختياري)
   */
  static clearLocalStorage(excludeKeys = []) {
    const keysToRemove = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!excludeKeys.includes(key)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    return keysToRemove.length
  }
}