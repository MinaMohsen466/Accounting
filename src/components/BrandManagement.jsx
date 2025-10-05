import React, { useState } from 'react'
import { useBrand } from '../contexts/BrandContext'
import { useLanguage } from '../contexts/LanguageContext'
import './BrandManagement.css'

const BrandManagement = () => {
  const { brandSettings, saveBrandSettings, uploadImage, resetToDefaults } = useBrand()
  const { language } = useLanguage()
  
  const [formData, setFormData] = useState(brandSettings)
  const [uploading, setUploading] = useState({
    logo: false,
    favicon: false
  })
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    const result = saveBrandSettings(formData)
    if (result.success) {
      showNotification('تم حفظ إعدادات الهوية البصرية بنجاح', 'success')
    } else {
      showNotification(result.error || 'فشل في حفظ الإعدادات', 'error')
    }
  }

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(prev => ({ ...prev, [type]: true }))

    try {
      const base64 = await uploadImage(file, type)
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logoUrl: base64 }))
        showNotification('تم رفع اللوجو بنجاح', 'success')
      } else if (type === 'favicon') {
        setFormData(prev => ({ ...prev, faviconUrl: base64 }))
        showNotification('تم رفع الفافيكون بنجاح', 'success')
      }
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }))
    showNotification('تم حذف اللوجو', 'success')
  }

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات الهوية البصرية للافتراضية؟')) {
      const result = resetToDefaults()
      if (result.success) {
        setFormData({
          appName: 'AccouTech Pro - نظام المحاسبة',
          appNameEn: 'AccouTech Pro - Accounting System',
          logoUrl: '',
          faviconUrl: '/favicon.svg',
          companyName: 'AccouTech Pro',
          companyNameEn: 'AccouTech Pro',
          tagline: 'نظام محاسبة متكامل',
          taglineEn: 'Complete Accounting System',
          primaryColor: '#1e40af',
          secondaryColor: '#3b82f6'
        })
        showNotification('تم إعادة تعيين الإعدادات للافتراضية', 'success')
      }
    }
  }

  return (
    <div className="brand-management">
      <div className="brand-header">
        <h3>إدارة الهوية البصرية</h3>
        <p>تخصيص شعار وألوان ومعلومات التطبيق</p>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="brand-sections">
        {/* قسم اللوجو */}
        <div className="brand-section">
          <h4>
            <span className="section-icon">🎨</span>
            اللوجو
          </h4>
          
          <div className="logo-upload">
            <div className="current-logo">
              {formData.logoUrl ? (
                <div className="logo-preview">
                  <img src={formData.logoUrl} alt="Current Logo" />
                  <button 
                    className="remove-logo-btn"
                    onClick={handleRemoveLogo}
                    title="حذف اللوجو"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="no-logo">
                  <span>📷</span>
                  <p>لا يوجد لوجو</p>
                </div>
              )}
            </div>
            
            <div className="upload-controls">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'logo')}
                disabled={uploading.logo}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="logo-upload" 
                className={`upload-btn ${uploading.logo ? 'uploading' : ''}`}
              >
                {uploading.logo ? 'جاري الرفع...' : 'اختيار لوجو'}
              </label>
              <p className="upload-hint">
                صيغ مدعومة: JPG, PNG, SVG, GIF (حد أقصى 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* قسم الفافيكون */}
        <div className="brand-section">
          <h4>
            <span className="section-icon">🔖</span>
            أيقونة الموقع (Favicon)
          </h4>
          
          <div className="favicon-upload">
            <div className="current-favicon">
              {formData.faviconUrl && (
                <img src={formData.faviconUrl} alt="Current Favicon" />
              )}
            </div>
            
            <div className="upload-controls">
              <input
                type="file"
                id="favicon-upload"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'favicon')}
                disabled={uploading.favicon}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="favicon-upload" 
                className={`upload-btn ${uploading.favicon ? 'uploading' : ''}`}
              >
                {uploading.favicon ? 'جاري الرفع...' : 'اختيار أيقونة'}
              </label>
              <p className="upload-hint">
                يُفضل استخدام أيقونة 32x32 أو 64x64 بكسل
              </p>
            </div>
          </div>
        </div>

        {/* قسم معلومات التطبيق */}
        <div className="brand-section">
          <h4>
            <span className="section-icon">📝</span>
            معلومات التطبيق
          </h4>
          
          <div className="form-grid">
            <div className="form-group">
              <label>اسم التطبيق (عربي)</label>
              <input
                type="text"
                name="appName"
                value={formData.appName}
                onChange={handleInputChange}
                placeholder="AccouTech Pro - نظام المحاسبة"
              />
            </div>

            <div className="form-group">
              <label>اسم التطبيق (إنجليزي)</label>
              <input
                type="text"
                name="appNameEn"
                value={formData.appNameEn}
                onChange={handleInputChange}
                placeholder="AccouTech Pro - Accounting System"
              />
            </div>

            <div className="form-group">
              <label>الشعار الفرعي (عربي)</label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleInputChange}
                placeholder="نظام محاسبة متكامل"
              />
            </div>

            <div className="form-group">
              <label>الشعار الفرعي (إنجليزي)</label>
              <input
                type="text"
                name="taglineEn"
                value={formData.taglineEn}
                onChange={handleInputChange}
                placeholder="Complete Accounting System"
              />
            </div>
          </div>
        </div>

        {/* قسم الألوان */}
        <div className="brand-section">
          <h4>
            <span className="section-icon">🎨</span>
            ألوان التطبيق
          </h4>
          
          <div className="color-grid">
            <div className="color-group">
              <label>اللون الأساسي</label>
              <div className="color-input-group">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  placeholder="#1e40af"
                />
              </div>
            </div>

            <div className="color-group">
              <label>اللون الثانوي</label>
              <div className="color-input-group">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار الحفظ والإعادة تعيين */}
      <div className="brand-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleReset}
        >
          إعادة تعيين افتراضي
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
        >
          حفظ التغييرات
        </button>
      </div>

      {/* معاينة سريعة */}
      <div className="brand-preview">
        <h4>معاينة</h4>
        <div className="preview-card" style={{
          backgroundColor: formData.primaryColor + '10',
          borderColor: formData.primaryColor
        }}>
          {formData.logoUrl && (
            <img src={formData.logoUrl} alt="Preview Logo" className="preview-logo" />
          )}
          <h5 style={{ color: formData.primaryColor }}>
            {language === 'ar' ? formData.appName : formData.appNameEn}
          </h5>
          <p style={{ color: formData.secondaryColor }}>
            {language === 'ar' ? formData.tagline : formData.taglineEn}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BrandManagement