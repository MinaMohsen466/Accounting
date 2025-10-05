import React, { useState } from 'react'
import { useBrand } from '../contexts/BrandContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import PermissionDenied from './PermissionDenied'
import './BrandManagement.css'

const BrandManagement = () => {
  const { brandSettings, saveBrandSettings, uploadImage, resetToDefaults } = useBrand()
  const { language } = useLanguage()
  const { hasPermission } = useAuth()

  // Check if user has permission to manage brand settings
  if (!hasPermission('manage_brand_settings')) {
    return (
      <PermissionDenied 
        message="ليس لديك صلاحية لإدارة الهوية البصرية"
        description="تحتاج إلى صلاحية 'إدارة الهوية البصرية' للوصول إلى هذه الصفحة"
      />
    )
  }
  
  const [formData, setFormData] = useState({
    ...brandSettings,
    // إعدادات الفواتير
    invoiceSettings: brandSettings.invoiceSettings || {
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
      footerText: 'شكراً لتعاملكم معنا',
      showLogo: true,
      logoSize: 'medium', // small, medium, large
      headerText: '',
      showCompanyInfo: true
    }
  })
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
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('invoice.')) {
      const invoiceField = name.replace('invoice.', '')
      setFormData(prev => ({
        ...prev,
        invoiceSettings: {
          ...prev.invoiceSettings,
          [invoiceField]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handlePolicyChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      invoiceSettings: {
        ...prev.invoiceSettings,
        policies: prev.invoiceSettings.policies.map((policy, i) => 
          i === index ? value : policy
        )
      }
    }))
  }

  const addPolicy = () => {
    setFormData(prev => ({
      ...prev,
      invoiceSettings: {
        ...prev.invoiceSettings,
        policies: [...prev.invoiceSettings.policies, '']
      }
    }))
  }

  const removePolicy = (index) => {
    setFormData(prev => ({
      ...prev,
      invoiceSettings: {
        ...prev.invoiceSettings,
        policies: prev.invoiceSettings.policies.filter((_, i) => i !== index)
      }
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

        {/* قسم إعدادات الفواتير */}
        <div className="brand-section">
          <h4>
            <span className="section-icon">🧾</span>
            إعدادات الفواتير المطبوعة
          </h4>
          
          {/* معلومات الشركة */}
          <div className="invoice-subsection">
            <h5>معلومات الشركة</h5>
            
            <div className="form-group">
              <label>اسم الشركة</label>
              <input
                type="text"
                name="invoice.companyName"
                value={formData.invoiceSettings.companyName}
                onChange={handleInputChange}
                placeholder="اسم الشركة أو المحل"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>رقم الهاتف</label>
                <input
                  type="text"
                  name="invoice.companyPhone"
                  value={formData.invoiceSettings.companyPhone}
                  onChange={handleInputChange}
                  placeholder="رقم هاتف الشركة"
                />
              </div>
              
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  name="invoice.companyEmail"
                  value={formData.invoiceSettings.companyEmail}
                  onChange={handleInputChange}
                  placeholder="email@company.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>عنوان الشركة</label>
              <textarea
                name="invoice.companyAddress"
                value={formData.invoiceSettings.companyAddress}
                onChange={handleInputChange}
                placeholder="العنوان الكامل للشركة"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>الموقع الإلكتروني</label>
              <input
                type="url"
                name="invoice.companyWebsite"
                value={formData.invoiceSettings.companyWebsite}
                onChange={handleInputChange}
                placeholder="https://www.company.com"
              />
            </div>
          </div>

          {/* إعدادات عرض اللوجو */}
          <div className="invoice-subsection">
            <h5>إعدادات اللوجو</h5>
            
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="invoice.showLogo"
                    checked={formData.invoiceSettings.showLogo}
                    onChange={handleInputChange}
                  />
                  عرض اللوجو في الفاتورة
                </label>
              </div>
              
              <div className="form-group">
                <label>حجم اللوجو</label>
                <select
                  name="invoice.logoSize"
                  value={formData.invoiceSettings.logoSize}
                  onChange={handleInputChange}
                  disabled={!formData.invoiceSettings.showLogo}
                >
                  <option value="small">صغير</option>
                  <option value="medium">متوسط</option>
                  <option value="large">كبير</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>نص إضافي في الرأس</label>
              <input
                type="text"
                name="invoice.headerText"
                value={formData.invoiceSettings.headerText}
                onChange={handleInputChange}
                placeholder="نص إضافي يظهر تحت اللوجو"
              />
            </div>
          </div>

          {/* إعدادات توقيع المستلم */}
          <div className="invoice-subsection">
            <h5>توقيع المستلم</h5>
            
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="invoice.showReceiverSignature"
                    checked={formData.invoiceSettings.showReceiverSignature}
                    onChange={handleInputChange}
                  />
                  عرض مساحة توقيع المستلم
                </label>
              </div>
              
              <div className="form-group">
                <label>عنوان التوقيع</label>
                <input
                  type="text"
                  name="invoice.receiverSignatureLabel"
                  value={formData.invoiceSettings.receiverSignatureLabel}
                  onChange={handleInputChange}
                  placeholder="توقيع المستلم"
                  disabled={!formData.invoiceSettings.showReceiverSignature}
                />
              </div>
            </div>
          </div>

          {/* سياسات المحل */}
          <div className="invoice-subsection">
            <h5>سياسات المحل</h5>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="invoice.showPolicies"
                  checked={formData.invoiceSettings.showPolicies}
                  onChange={handleInputChange}
                />
                عرض سياسات المحل في الفاتورة
              </label>
            </div>
            
            {formData.invoiceSettings.showPolicies && (
              <div className="policies-list">
                <div className="form-group">
                  <label>عنوان قسم السياسات:</label>
                  <input
                    type="text"
                    value={formData.invoiceSettings.policiesTitle || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      invoiceSettings: {
                        ...prev.invoiceSettings,
                        policiesTitle: e.target.value
                      }
                    }))}
                    placeholder="سياسات وشروط المحل"
                    className="form-input"
                  />
                </div>
                <label>قائمة السياسات:</label>
                {formData.invoiceSettings.policies.map((policy, index) => (
                  <div key={index} className="policy-item">
                    <input
                      type="text"
                      value={policy}
                      onChange={(e) => handlePolicyChange(index, e.target.value)}
                      placeholder={`السياسة ${index + 1}`}
                    />
                    {formData.invoiceSettings.policies.length > 1 && (
                      <button
                        type="button"
                        className="remove-policy-btn"
                        onClick={() => removePolicy(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-policy-btn"
                  onClick={addPolicy}
                >
                  + إضافة سياسة جديدة
                </button>
              </div>
            )}
          </div>

          {/* نص التذييل */}
          <div className="invoice-subsection">
            <h5>تذييل الفاتورة</h5>
            
            <div className="form-group">
              <label>نص الشكر والتقدير</label>
              <textarea
                name="invoice.footerText"
                value={formData.invoiceSettings.footerText}
                onChange={handleInputChange}
                placeholder="نص يظهر في نهاية الفاتورة"
                rows="2"
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
        {hasPermission('manage_brand_settings') && (
          <>
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
          </>
        )}
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