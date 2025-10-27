import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import './AddUserModal.css'

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const { addNewUser } = useAuth()
  const { language } = useLanguage()
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user'
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const roles = [
    { value: 'admin', label: 'مدير عام', description: 'صلاحيات كاملة لجميع الوظائف' },
    { value: 'manager', label: 'مدير', description: 'صلاحيات إدارية محدودة' },
    { value: 'accountant', label: 'محاسب', description: 'صلاحيات محاسبية' },
    { value: 'user', label: 'مستخدم عادي', description: 'صلاحيات أساسية للعرض' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب'
    } else if (formData.username.length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط'
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم الكامل مطلوب'
    }

    if (!formData.role) {
      newErrors.role = 'يجب اختيار دور المستخدم'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const result = addNewUser({
        username: formData.username.trim(),
        password: formData.password,
        name: formData.name.trim(),
        role: formData.role
      })
      
      if (result.success) {
        onUserAdded()
        onClose()
        // Reset form
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: 'user'
        })
        setErrors({})
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      setErrors({ submit: 'حدث خطأ أثناء إضافة المستخدم' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'user'
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container add-user-modal">
        <div className="modal-header">
          <h2>إضافة مستخدم جديد</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="add-user-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username">اسم المستخدم *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={errors.username ? 'error' : ''}
                disabled={loading}
                placeholder="username123"
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
              <small className="input-hint">حروف إنجليزية وأرقام فقط، لا مسافات</small>
            </div>

            <div className="form-group">
              <label htmlFor="name">الاسم الكامل *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                disabled={loading}
                placeholder="الاسم الكامل"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">كلمة المرور *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                disabled={loading}
                placeholder="••••••••"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
              <small className="input-hint">6 أحرف على الأقل</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                disabled={loading}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="role-selection">
            <label className="section-label">دور المستخدم *</label>
            <div className="roles-grid">
              {roles.map(role => (
                <label key={role.value} className={`role-option ${formData.role === role.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <div className="role-content">
                    <h4>{role.label}</h4>
                    <p>{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'جاري الإضافة...' : 'إضافة المستخدم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUserModal