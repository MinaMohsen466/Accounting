import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Simple user credentials (in real app, this would be from backend)
let VALID_USERS = {
  'admin': { password: 'admin123', name: 'المدير العام', role: 'admin' }
}

// Function to update password
const updatePassword = (username, newPassword) => {
  if (VALID_USERS[username]) {
    VALID_USERS[username].password = newPassword
    // In real app, this would be saved to backend/database
    localStorage.setItem('admin_password', newPassword)
    return true
  }
  return false
}

// Load saved password if exists
const savedPassword = localStorage.getItem('admin_password')
if (savedPassword) {
  VALID_USERS.admin.password = savedPassword
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem('auth_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (username, password) => {
    const validUser = VALID_USERS[username]
    
    if (validUser && validUser.password === password) {
      const userData = {
        username,
        name: validUser.name,
        role: validUser.role
      }
      
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      return { success: true }
    }
    
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  const changePassword = (currentPassword, newPassword) => {
    const validUser = VALID_USERS['admin']
    
    if (validUser && validUser.password === currentPassword) {
      const success = updatePassword('admin', newPassword)
      if (success) {
        return { success: true }
      }
    }
    
    return { success: false, error: 'كلمة المرور الحالية غير صحيحة' }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext