import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import './LoginOverlay.css'

const LoginOverlay = () => {
  const { login } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError(language === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password')
      return
    }

    setIsLoading(true)
    
    // Simulate loading delay
    setTimeout(() => {
      const result = login(formData.username, formData.password)
      
      if (result.success) {
        setSuccess(true)
        setError('')
        // Clear form on successful login
        setFormData({ username: '', password: '' })
      } else {
        setError(result.error)
        setSuccess(false)
      }
      
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="login-header">
          <h1>📊 {language === 'ar' ? 'نظام المحاسبة' : 'Accounting System'}</h1>
          <p>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {success && (
          <div className="login-success">
            {language === 'ar' ? 'تم تسجيل الدخول بنجاح! جارٍ التوجه للصفحة الرئيسية...' : 'Login successful! Redirecting to dashboard...'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...'
            ) : (
              language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginOverlay