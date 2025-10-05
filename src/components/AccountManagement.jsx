import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import './AccountManagement.css'

const AccountManagement = () => {
  const { user, logout, changePassword, hasPermission } = useAuth()
  const { language } = useLanguage()
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    name: user?.name || ''
  })
  
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showNameForm, setShowNameForm] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showMessage(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'error')
      return
    }

    if (formData.newPassword.length < 6) {
      showMessage(language === 'ar' ? 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' : 'New password must be at least 6 characters', 'error')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showMessage(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error')
      return
    }

    setIsLoading(true)
    
    // Use the changePassword function from AuthContext
    const result = changePassword(formData.currentPassword, formData.newPassword)
    
    if (result.success) {
      showMessage(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح! جارٍ تسجيل الخروج...' : 'Password changed successfully! Logging out...', 'success')
      
      // Clear form
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)
      setIsLoading(false)
      
      // Immediate logout after successful password change
      setTimeout(() => {
        logout()
      }, 1500)
    } else {
      setIsLoading(false)
      showMessage(result.error || (language === 'ar' ? 'فشل في تغيير كلمة المرور' : 'Failed to change password'), 'error')
    }
  }

  const handleNameChange = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showMessage(language === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter name', 'error')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      // Update user data in localStorage
      const updatedUser = { ...user, name: formData.name.trim() }
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      
      showMessage(language === 'ar' ? 'تم تحديث الاسم بنجاح' : 'Name updated successfully')
      setShowNameForm(false)
      setIsLoading(false)
      
      // Refresh page to update user display
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="account-management">
      <div className="account-header">
        <h2>{language === 'ar' ? 'إدارة الحساب' : 'Account Management'}</h2>
        <p>{language === 'ar' ? 'إدارة بيانات حسابك الشخصي' : 'Manage your account information'}</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Account Info */}
      <div className="account-section">
        <h3>{language === 'ar' ? 'معلومات الحساب' : 'Account Information'}</h3>
        
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">{language === 'ar' ? 'اسم المستخدم:' : 'Username:'}</span>
            <span className="info-value">admin</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
            <span className="info-value">{user?.name}</span>
            {hasPermission('manage_user_account') && (
              <button 
                className="edit-btn"
                onClick={() => setShowNameForm(!showNameForm)}
                disabled={isLoading}
              >
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </button>
            )}
          </div>
          
          <div className="info-row">
            <span className="info-label">{language === 'ar' ? 'الصلاحية:' : 'Role:'}</span>
            <span className="info-value role-badge">
              {language === 'ar' ? 'مدير عام' : 'Administrator'}
            </span>
          </div>
        </div>

        {/* Name Edit Form */}
        {showNameForm && hasPermission('manage_user_account') && (
          <form onSubmit={handleNameChange} className="edit-form">
            <h4>{language === 'ar' ? 'تعديل الاسم' : 'Edit Name'}</h4>
            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم الجديد:' : 'New Name:'}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
              </button>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setShowNameForm(false)}
                disabled={isLoading}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Password Change */}
      <div className="account-section">
        <h3>{language === 'ar' ? 'الأمان' : 'Security'}</h3>
        
        <div className="security-card">
          <div className="security-item">
            <div className="security-info">
              <h4>{language === 'ar' ? 'كلمة المرور' : 'Password'}</h4>
              <p>{language === 'ar' ? 'تغيير كلمة مرور الحساب' : 'Change your account password'}</p>
            </div>
            {hasPermission('manage_user_account') && (
              <button 
                className="change-password-btn"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                disabled={isLoading}
              >
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </button>
            )}
          </div>

          {/* Password Change Form */}
          {showPasswordForm && hasPermission('manage_user_account') && (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label>{language === 'ar' ? 'كلمة المرور الحالية:' : 'Current Password:'}</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{language === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                  minLength="6"
                />
              </div>
              
              <div className="form-group">
                <label>{language === 'ar' ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? (language === 'ar' ? 'جارٍ التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowPasswordForm(false)}
                  disabled={isLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Logout Section */}
      <div className="account-section danger-section">
        <h3>{language === 'ar' ? 'إنهاء الجلسة' : 'Session'}</h3>
        <div className="danger-card">
          <div className="danger-info">
            <h4>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</h4>
            <p>{language === 'ar' ? 'إنهاء الجلسة الحالية والعودة لصفحة الدخول' : 'End current session and return to login'}</p>
          </div>
          <button 
            className="logout-btn"
            onClick={() => {
              if (window.confirm(language === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to logout?')) {
                logout()
              }
            }}
            disabled={isLoading}
          >
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountManagement