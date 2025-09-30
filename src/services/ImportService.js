export class ImportService {
  static async importLocalStorageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.name.endsWith('.json')) {
        reject(new Error('Invalid file type'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = function(event) {
        try {
          const fileContent = event.target.result
          const backupData = JSON.parse(fileContent)
          
          let dataToImport = backupData.data || backupData
          
          ImportService.clearAllData()
          
          Object.keys(dataToImport).forEach(key => {
            const value = dataToImport[key]
            let storageKey = ImportService.normalizeKey(key)
            
            if (typeof value === 'object') {
              localStorage.setItem(storageKey, JSON.stringify(value))
            } else {
              localStorage.setItem(storageKey, value)
            }
          })
          
          resolve({ success: true })
          
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('File read error'))
      }
      
      reader.readAsText(file)
    })
  }

  static normalizeKey(key) {
    const keyMappings = {
      'accounting_accounts': 'accounts',
      'accounting_journal_entries': 'journalEntries',
      'accounting_invoices': 'invoices',
      'accounting_customers': 'customers',
      'accounting_suppliers': 'suppliers',
      'accounting_inventory': 'inventoryItems'
    }
    
    return keyMappings[key] || key
  }

  static clearAllData(excludeKeys = ['app_language']) {
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

  static validateBackupFile(backupData) {
    if (!backupData || typeof backupData !== 'object') {
      return false
    }

    if (backupData.data && typeof backupData.data === 'object') {
      return Object.keys(backupData.data).length > 0
    }

    return Object.keys(backupData).length > 0
  }
}