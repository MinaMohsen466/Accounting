import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Simple user credentials (in real app, this would be from backend)
let VALID_USERS = {
  'admin': { 
    password: 'admin123', 
    name: 'المدير العام', 
    role: 'admin', 
    createdAt: new Date().toISOString(), 
    active: true 
  },
  'manager': { 
    password: 'manager123', 
    name: 'مدير المبيعات', 
    role: 'manager', 
    createdAt: new Date().toISOString(), 
    active: true,
    permissions: [
      // Dashboard & Analytics
      'view_dashboard', 'view_analytics',
      
      // Journal Entries
      'view_journal_entries', 'create_journal_entries', 'edit_journal_entries',
      
      // Chart of Accounts
      'view_chart_of_accounts', 'create_accounts',
      
      // Invoices
      'view_invoices', 'create_invoices', 'edit_invoices',
      
      // Customers & Suppliers
      'view_customers_suppliers', 'create_customers_suppliers', 'edit_customers_suppliers',
      
      // Inventory
      'view_inventory', 'create_inventory_items', 'edit_inventory_items', 
      'view_stock_alerts', 'view_expiry_alerts', 'manage_brands', 'manage_colors',
      
      // Vouchers
      'view_vouchers', 'create_vouchers', 'edit_vouchers', 'delete_vouchers', 'manage_vouchers',
      
      // Account Statements
      'view_account_statements', 'manage_account_statements', 'export_statements',
      
      // Reports
      'view_financial_reports', 'export_reports', 'print_reports',
      
      // Banking
      'view_banking', 'manage_bank_accounts', 'record_payments', 'record_receipts', 'record_expenses',
      
      // Treasury
      'view_treasury', 'manage_treasury', 'record_cash_deposits', 'record_cash_withdrawals',
      
      // Settings
      'view_settings', 'edit_brand_settings'
    ]
  },
  'accountant': { 
    password: 'accountant123', 
    name: 'المحاسب الرئيسي', 
    role: 'accountant', 
    createdAt: new Date().toISOString(), 
    active: true,
    permissions: [
      // Dashboard
      'view_dashboard',
      
      // Journal Entries
      'view_journal_entries', 'create_journal_entries', 'edit_journal_entries',
      
      // Chart of Accounts
      'view_chart_of_accounts', 'create_accounts',
      
      // Invoices
      'view_invoices', 'create_invoices',
      
      // Customers & Suppliers
      'view_customers_suppliers', 'create_customers_suppliers',
      
      // Inventory
      'view_inventory', 'view_stock_alerts', 'view_expiry_alerts',
      
      // Vouchers
      'view_vouchers', 'create_vouchers', 'edit_vouchers', 'delete_vouchers', 'manage_vouchers',
      
      // Account Statements
      'view_account_statements', 'export_statements',
      
      // Reports
      'view_financial_reports', 'print_reports',
      
      // Banking
      'view_banking', 'record_deposits', 'record_withdrawals', 'record_payments', 'record_receipts',
      
      // Treasury
      'view_treasury', 'record_cash_deposits', 'record_cash_withdrawals'
    ]
  },
  'user': { 
    password: 'user123', 
    name: 'موظف المبيعات', 
    role: 'user', 
    createdAt: new Date().toISOString(), 
    active: true,
    permissions: [
      'view_dashboard',
      'view_invoices',
      'view_customers_suppliers',
      'view_inventory',
      'view_account_statements',
      'view_banking',
      'view_treasury'
    ]
  }
}

// Function to save users to localStorage
const saveUsersToStorage = () => {
  try {
    localStorage.setItem('app_users', JSON.stringify(VALID_USERS))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

// Function to load users from localStorage
const loadUsersFromStorage = () => {
  try {
    const saved = localStorage.getItem('app_users')
    if (saved) {
      const loadedUsers = JSON.parse(saved)
      
      // Migrate old users to include permissions if they don't have them
      Object.keys(loadedUsers).forEach(username => {
        const user = loadedUsers[username]
        if (!user.permissions) {
          // Add default permissions based on role
          const defaultPermissionsByRole = {
            admin: [], // Admin gets all permissions (handled in hasPermission)
            manager: [
              'view_dashboard', 'view_analytics',
              'view_journal_entries', 'create_journal_entries', 'edit_journal_entries',
              'view_chart_of_accounts', 'create_accounts',
              'view_invoices', 'create_invoices', 'edit_invoices',
              'view_customers_suppliers', 'create_customers_suppliers', 'edit_customers_suppliers',
              'view_inventory', 'create_inventory_items',
              'view_account_statements', 'manage_account_statements',
              'view_financial_reports', 'export_reports',
              'view_settings',
              'view_banking', 'manage_bank_accounts', 'record_payments', 'record_receipts', 'record_expenses',
              'view_treasury', 'manage_treasury', 'record_cash_deposits', 'record_cash_withdrawals'
            ],
            accountant: [
              'view_dashboard',
              'view_journal_entries', 'create_journal_entries',
              'view_chart_of_accounts',
              'view_invoices', 'create_invoices',
              'view_customers_suppliers',
              'view_inventory',
              'view_account_statements',
              'view_financial_reports',
              'view_banking', 'record_deposits', 'record_withdrawals', 'record_payments', 'record_receipts',
              'view_treasury', 'record_cash_deposits', 'record_cash_withdrawals'
            ],
            user: [
              'view_dashboard',
              'view_invoices',
              'view_customers_suppliers',
              'view_inventory',
              'view_account_statements',
              'view_banking',
              'view_treasury'
            ]
          }
          
          user.permissions = defaultPermissionsByRole[user.role] || []
        }
      })
      
      VALID_USERS = loadedUsers
      // Save back with updated permissions
      saveUsersToStorage()
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

// Load users on startup
loadUsersFromStorage()

// Function to update password
const updatePassword = (username, newPassword) => {
  if (VALID_USERS[username]) {
    VALID_USERS[username].password = newPassword
    saveUsersToStorage()
    return true
  }
  return false
}

// Function to add new user (Admin only)
const addNewUser = (userData, currentUser) => {
  // Check if current user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'ليس لديك صلاحية لإضافة مستخدمين جدد' }
  }

  // Check if username already exists
  if (VALID_USERS[userData.username]) {
    return { success: false, error: 'اسم المستخدم موجود بالفعل' }
  }

  // Validate required fields
  if (!userData.username || !userData.password || !userData.name || !userData.role) {
    return { success: false, error: 'جميع الحقول مطلوبة' }
  }

  // Add new user
  VALID_USERS[userData.username] = {
    password: userData.password,
    name: userData.name,
    role: userData.role,
    createdAt: new Date().toISOString(),
    active: true
  }

  saveUsersToStorage()
  return { success: true, message: 'تم إضافة المستخدم بنجاح' }
}

// Function to get all users (Admin only)
const getAllUsers = (currentUser) => {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'ليس لديك صلاحية لعرض المستخدمين' }
  }

  const users = Object.keys(VALID_USERS).map(username => ({
    username,
    name: VALID_USERS[username].name,
    role: VALID_USERS[username].role,
    createdAt: VALID_USERS[username].createdAt,
    active: VALID_USERS[username].active,
    permissions: VALID_USERS[username].permissions || []
  }))

  return { success: true, users }
}

// Function to update user (Admin only)
const updateUser = (username, updateData, currentUser, setUser) => {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'ليس لديك صلاحية لتعديل المستخدمين' }
  }

  if (!VALID_USERS[username]) {
    return { success: false, error: 'المستخدم غير موجود' }
  }

  // Prevent admin from changing their own role
  if (username === 'admin' && updateData.role && updateData.role !== 'admin') {
    return { success: false, error: 'لا يمكن تغيير دور المدير العام' }
  }

  // Update user data
  VALID_USERS[username] = {
    ...VALID_USERS[username],
    ...updateData
  }

  // If the updated user is the currently logged in user, update the session
  if (currentUser.username === username && setUser) {
    const updatedUserData = {
      username,
      name: VALID_USERS[username].name,
      role: VALID_USERS[username].role,
      permissions: VALID_USERS[username].permissions || []
    }
    setUser(updatedUserData)
    localStorage.setItem('auth_user', JSON.stringify(updatedUserData))
  }

  saveUsersToStorage()
  return { success: true, message: 'تم تحديث المستخدم بنجاح' }
}

// Function to delete user (Admin only)
const deleteUser = (username, currentUser) => {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'ليس لديك صلاحية لحذف المستخدمين' }
  }

  // Prevent deleting admin
  if (username === 'admin') {
    return { success: false, error: 'لا يمكن حذف المدير العام' }
  }

  if (!VALID_USERS[username]) {
    return { success: false, error: 'المستخدم غير موجود' }
  }

  delete VALID_USERS[username]
  saveUsersToStorage()
  return { success: true, message: 'تم حذف المستخدم بنجاح' }
}

// Function to toggle user active status (Admin only)
const toggleUserStatus = (username, currentUser) => {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'ليس لديك صلاحية لتغيير حالة المستخدمين' }
  }

  if (username === 'admin') {
    return { success: false, error: 'لا يمكن تعطيل المدير العام' }
  }

  if (!VALID_USERS[username]) {
    return { success: false, error: 'المستخدم غير موجود' }
  }

  VALID_USERS[username].active = !VALID_USERS[username].active
  saveUsersToStorage()
  
  const status = VALID_USERS[username].active ? 'تم تفعيل' : 'تم تعطيل'
  return { success: true, message: `${status} المستخدم بنجاح` }
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
        const parsedUser = JSON.parse(savedUser)
        // Check if saved user has permissions array, if not, re-authenticate them
        if (parsedUser && parsedUser.username && VALID_USERS[parsedUser.username]) {
          const currentUserData = VALID_USERS[parsedUser.username]
          const updatedUserData = {
            username: parsedUser.username,
            name: currentUserData.name,
            role: currentUserData.role,
            permissions: currentUserData.permissions || []
          }
          setUser(updatedUserData)
          localStorage.setItem('auth_user', JSON.stringify(updatedUserData))
        } else {
          // Invalid saved data, remove it
          localStorage.removeItem('auth_user')
        }
      } catch (error) {
        localStorage.removeItem('auth_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (username, password) => {
    const validUser = VALID_USERS[username]
    
    // Check if user exists, password matches, and user is active
    if (validUser && validUser.password === password && validUser.active !== false) {
      const userData = {
        username,
        name: validUser.name,
        role: validUser.role,
        permissions: validUser.permissions || []
      }
      
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      // Reset current view to dashboard on login
      localStorage.setItem('current_view', 'dashboard')
      
      return { success: true }
    }
    
    if (validUser && validUser.active === false) {
      return { success: false, error: 'تم تعطيل هذا الحساب، يرجى التواصل مع الإدارة' }
    }
    
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('current_view')
  }

  const changePassword = (currentPassword, newPassword) => {
    if (!user) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' }
    }

    const validUser = VALID_USERS[user.username]
    
    if (validUser && validUser.password === currentPassword) {
      const success = updatePassword(user.username, newPassword)
      if (success) {
        return { success: true }
      }
    }
    
    return { success: false, error: 'كلمة المرور الحالية غير صحيحة' }
  }

  // Helper function to check if current user is admin
  const isAdmin = () => {
    return user && user.role === 'admin'
  }

  // Helper function to check user permissions
  const hasPermission = (permission) => {
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === 'admin') return true
    
    // Check if user has specific permission
    return user.permissions && user.permissions.includes(permission)
  }

  // Get user's effective permissions (role-based + custom)
  const getUserPermissions = () => {
    if (!user) return []
    
    // Admin has all permissions
    if (user.role === 'admin') {
      return [
        // Dashboard & Analytics
        'view_dashboard', 'view_analytics',
        
        // Journal Entries
        'view_journal_entries', 'create_journal_entries', 'edit_journal_entries', 'delete_journal_entries', 'approve_journal_entries',
        
        // Chart of Accounts
        'view_chart_of_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts',
        
        // Invoices
        'view_invoices', 'create_invoices', 'edit_invoices', 'delete_invoices', 'approve_invoices',
        
        // Customers & Suppliers
        'view_customers_suppliers', 'create_customers_suppliers', 'edit_customers_suppliers', 'delete_customers_suppliers',
        
        // Inventory
        'view_inventory', 'create_inventory_items', 'edit_inventory_items', 'delete_inventory_items', 
        'view_stock_alerts', 'view_expiry_alerts', 'manage_brands', 'manage_colors',
        
        // Vouchers (السندات) - 🆕
        'view_vouchers', 'create_vouchers', 'edit_vouchers', 'delete_vouchers', 'manage_vouchers',
        
        // Account Statements
        'view_account_statements', 'manage_account_statements', 'export_statements',
        
        // Financial Reports
        'view_financial_reports', 'export_reports', 'print_reports',
        
        // Banking
        'view_banking', 'manage_bank_accounts', 'record_deposits', 'record_withdrawals', 
        'record_payments', 'record_receipts', 'record_expenses', 'view_customer_accounts',
        
        // Treasury (الخزينة)
        'view_treasury', 'manage_treasury', 'record_cash_deposits', 'record_cash_withdrawals',
        
        // Data Management
        'import_data', 'export_data', 'backup_data', 'restore_data',
        
        // Settings
        'view_settings', 'edit_general_settings', 'edit_brand_settings', 'edit_invoice_settings',
        
        // User Management
        'manage_users', 'view_user_logs', 'create_users', 'edit_users', 'delete_users',
        
        // System
        'system_maintenance', 'view_system_logs', 'manage_system_backups'
      ]
    }
    
    // Return user's custom permissions or default based on role
    return user.permissions || []
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    hasPermission,
    getUserPermissions,
    login,
    logout,
    changePassword,
    // Admin only functions
    addNewUser: (userData) => addNewUser(userData, user),
    getAllUsers: () => getAllUsers(user),
    updateUser: (username, updateData) => updateUser(username, updateData, user, setUser),
    deleteUser: (username) => deleteUser(username, user),
    toggleUserStatus: (username) => toggleUserStatus(username, user)
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