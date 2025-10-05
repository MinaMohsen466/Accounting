import React, { createContext, useContext, useState, useEffect } from 'react'

const BrandContext = createContext()

// الإعدادات الافتراضية للهوية
const DEFAULT_BRAND_SETTINGS = {
  appName: 'AccouTech Pro - نظام المحاسبة',
  appNameEn: 'AccouTech Pro - Accounting System',
  logoUrl: '', // سيتم استخدام لوجو افتراضي إذا كان فارغ
  faviconUrl: '/favicon.svg',
  companyName: 'AccouTech Pro',
  companyNameEn: 'AccouTech Pro',
  tagline: 'نظام محاسبة متكامل',
  taglineEn: 'Complete Accounting System',
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  // إعدادات الفواتير
  invoiceSettings: {
    companyName: 'AccouTech Pro',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    receiverSignatureLabel: 'توقيع المستلم',
    showReceiverSignature: true,
    policies: [
      'جميع المبيعات نهائية',
      'يرجى فحص البضاعة قبل الاستلام',
      'المرتجعات خلال 7 أيام فقط'
    ],
    showPolicies: true,
    policiesTitle: 'سياسات وشروط المحل',
    footerText: 'شكراً لتعاملكم معنا',
    showLogo: true,
    logoSize: 'medium', // small, medium, large
    headerText: '',
    showCompanyInfo: true
  }
}

export const BrandProvider = ({ children }) => {
  const [brandSettings, setBrandSettings] = useState(DEFAULT_BRAND_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // تحميل إعدادات الهوية من localStorage عند التشغيل
  useEffect(() => {
    const loadBrandSettings = () => {
      try {
        const saved = localStorage.getItem('app_brand_settings')
        if (saved) {
          const parsedSettings = JSON.parse(saved)
          setBrandSettings({ ...DEFAULT_BRAND_SETTINGS, ...parsedSettings })
        }
      } catch (error) {
        console.error('Error loading brand settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBrandSettings()
  }, [])

  // حفظ إعدادات الهوية في localStorage
  const saveBrandSettings = (newSettings) => {
    try {
      const updatedSettings = { ...brandSettings, ...newSettings }
      setBrandSettings(updatedSettings)
      localStorage.setItem('app_brand_settings', JSON.stringify(updatedSettings))
      
      // تحديث عنوان الصفحة
      document.title = updatedSettings.appName
      
      // تحديث الفافيكون إذا تم تغييره
      if (newSettings.faviconUrl && newSettings.faviconUrl !== brandSettings.faviconUrl) {
        updateFavicon(newSettings.faviconUrl)
      }
      
      // تحديث المتغيرات CSS للألوان
      if (newSettings.primaryColor || newSettings.secondaryColor) {
        updateCSSVariables(updatedSettings)
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error saving brand settings:', error)
      return { success: false, error: 'فشل في حفظ الإعدادات' }
    }
  }

  // تحديث الفافيكون
  const updateFavicon = (faviconUrl) => {
    try {
      // إزالة الفافيكون القديم
      const existingLinks = document.querySelectorAll('link[rel*="icon"]')
      existingLinks.forEach(link => link.remove())

      // إضافة الفافيكون الجديد
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'
      link.href = faviconUrl
      document.head.appendChild(link)

      // إضافة أيقونة بديلة
      const altLink = document.createElement('link')
      altLink.rel = 'alternate icon'
      altLink.type = 'image/x-icon'
      altLink.href = faviconUrl.endsWith('.svg') ? '/favicon.ico' : faviconUrl
      document.head.appendChild(altLink)
    } catch (error) {
      console.error('Error updating favicon:', error)
    }
  }

  // تحديث المتغيرات CSS للألوان
  const updateCSSVariables = (settings) => {
    try {
      const root = document.documentElement
      root.style.setProperty('--primary-color', settings.primaryColor)
      root.style.setProperty('--secondary-color', settings.secondaryColor)
      
      // حساب ألوان مشتقة
      const primaryRgb = hexToRgb(settings.primaryColor)
      const secondaryRgb = hexToRgb(settings.secondaryColor)
      
      if (primaryRgb) {
        root.style.setProperty('--primary-color-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`)
        root.style.setProperty('--primary-color-dark', darkenColor(settings.primaryColor, 20))
      }
      
      if (secondaryRgb) {
        root.style.setProperty('--secondary-color-light', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1)`)
      }
    } catch (error) {
      console.error('Error updating CSS variables:', error)
    }
  }

  // تحويل HEX إلى RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // تدكين اللون
  const darkenColor = (hex, percent) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex

    const darken = (color) => Math.max(0, Math.floor(color * (100 - percent) / 100))
    
    return `#${[darken(rgb.r), darken(rgb.g), darken(rgb.b)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`
  }

  // رفع الصورة وتحويلها إلى base64
  const uploadImage = (file, type = 'logo') => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('لم يتم اختيار ملف'))
        return
      }

      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, GIF, SVG, أو WebP'))
        return
      }

      // التحقق من حجم الملف (5MB حد أقصى)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        reject(new Error('حجم الملف كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const base64 = e.target.result
          resolve(base64)
        } catch (error) {
          reject(new Error('فشل في قراءة الملف'))
        }
      }
      reader.onerror = () => reject(new Error('فشل في قراءة الملف'))
      reader.readAsDataURL(file)
    })
  }

  // إعادة تعيين الإعدادات للافتراضية
  const resetToDefaults = () => {
    setBrandSettings(DEFAULT_BRAND_SETTINGS)
    localStorage.removeItem('app_brand_settings')
    document.title = DEFAULT_BRAND_SETTINGS.appName
    updateFavicon(DEFAULT_BRAND_SETTINGS.faviconUrl)
    updateCSSVariables(DEFAULT_BRAND_SETTINGS)
    return { success: true }
  }

  // تطبيق الإعدادات الحالية عند التحميل
  useEffect(() => {
    if (!isLoading && brandSettings) {
      document.title = brandSettings.appName
      updateCSSVariables(brandSettings)
      if (brandSettings.faviconUrl && brandSettings.faviconUrl !== DEFAULT_BRAND_SETTINGS.faviconUrl) {
        updateFavicon(brandSettings.faviconUrl)
      }
    }
  }, [isLoading, brandSettings])

  const value = {
    brandSettings,
    isLoading,
    saveBrandSettings,
    uploadImage,
    resetToDefaults,
    updateFavicon,
    updateCSSVariables
  }

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  )
}

// Hook لاستخدام البراند
export const useBrand = () => {
  const context = useContext(BrandContext)
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}

export default BrandContext