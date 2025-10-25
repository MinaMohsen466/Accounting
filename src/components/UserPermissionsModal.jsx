import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './UserPermissionsModal.css'

const UserPermissionsModal = ({ isOpen, onClose, userToEdit, onSave }) => {
  const { user } = useAuth()
  
  // Define all available permissions with Arabic names
  const availablePermissions = {
    // Dashboard & Analytics
    'view_dashboard': 'عرض لوحة التحكم',
    'view_analytics': 'عرض التحليلات والتقارير',
    
    // Journal Entries
    'view_journal_entries': 'عرض القيود اليومية',
    'create_journal_entries': 'إنشاء قيود يومية',
    'edit_journal_entries': 'تعديل القيود اليومية',
    'delete_journal_entries': 'حذف القيود اليومية',
    'approve_journal_entries': 'اعتماد القيود اليومية',
    
    // Chart of Accounts
    'view_chart_of_accounts': 'عرض دليل الحسابات',
    'create_accounts': 'إنشاء حسابات جديدة',
    'edit_accounts': 'تعديل الحسابات',
    'delete_accounts': 'حذف الحسابات',
    
    // Invoices
    'view_invoices': 'عرض الفواتير',
    'create_invoices': 'إنشاء فواتير',
    'edit_invoices': 'تعديل الفواتير',
    'delete_invoices': 'حذف الفواتير',
    'approve_invoices': 'اعتماد الفواتير',
    
    // Customers & Suppliers
    'view_customers_suppliers': 'عرض العملاء والموردين',
    'create_customers_suppliers': 'إضافة عملاء وموردين',
    'edit_customers_suppliers': 'تعديل العملاء والموردين',
    'delete_customers_suppliers': 'حذف العملاء والموردين',
    
    // Inventory
    'view_inventory': 'عرض المخزون',
    'create_inventory_items': 'إضافة عناصر المخزون',
    'edit_inventory_items': 'تعديل عناصر المخزون',
    'delete_inventory_items': 'حذف عناصر المخزون',
    'view_stock_alerts': 'عرض تنبيهات المخزون',
    'view_expiry_alerts': 'عرض تنبيهات انتهاء الصلاحية',
  // Account Statements
  'view_account_statements': 'عرض كشف الحساب',
  'manage_account_statements': 'إدارة كشف الحساب',
    
    // Reports
    'view_financial_reports': 'عرض التقارير المالية',
    'export_reports': 'تصدير التقارير',
    'print_reports': 'طباعة التقارير',
    
    // Data Management
    'import_data': 'استيراد البيانات',
    'export_data': 'تصدير البيانات',
    'backup_data': 'نسخ احتياطي للبيانات',
    'restore_data': 'استعادة البيانات',
    
    // Settings & Configuration
    'view_settings': 'عرض الإعدادات',
    'edit_general_settings': 'تعديل الإعدادات العامة',
    'edit_brand_settings': 'تعديل إعدادات الهوية البصرية',
    'manage_users': 'إدارة المستخدمين',
    'view_user_logs': 'عرض سجلات المستخدمين',
    
    // System Administration
    'system_maintenance': 'صيانة النظام',
    'view_system_logs': 'عرض سجلات النظام',
    'manage_system_backups': 'إدارة النسخ الاحتياطية'
  }

  // Default permissions for each role
  const defaultPermissionsByRole = {
    admin: Object.keys(availablePermissions), // All permissions
    manager: [
      'view_dashboard', 'view_analytics',
      'view_journal_entries', 'create_journal_entries', 'edit_journal_entries', 'approve_journal_entries',
      'view_chart_of_accounts', 'create_accounts', 'edit_accounts',
      'view_invoices', 'create_invoices', 'edit_invoices', 'approve_invoices',
      'view_customers_suppliers', 'create_customers_suppliers', 'edit_customers_suppliers',
      'view_inventory', 'create_inventory_items', 'edit_inventory_items',
      'view_stock_alerts', 'view_expiry_alerts',
  'view_account_statements', 'manage_account_statements',
      'view_financial_reports', 'export_reports', 'print_reports',
      'export_data', 'backup_data',
      'view_settings'
    ],
    accountant: [
      'view_dashboard',
      'view_journal_entries', 'create_journal_entries', 'edit_journal_entries',
      'view_chart_of_accounts',
      'view_invoices', 'create_invoices', 'edit_invoices',
      'view_customers_suppliers', 'create_customers_suppliers', 'edit_customers_suppliers',
      'view_inventory', 'create_inventory_items', 'edit_inventory_items',
      'view_stock_alerts', 'view_expiry_alerts',
  'view_account_statements',
  'view_financial_reports', 'export_reports'
    ],
    user: [
      'view_dashboard',
      'view_journal_entries',
      'view_chart_of_accounts',
      'view_invoices',
      'view_customers_suppliers',
      'view_inventory',
  'view_account_statements',
      'view_stock_alerts', 'view_expiry_alerts',
      'view_financial_reports'
    ]
  }

  // Initialize user permissions
  const [userPermissions, setUserPermissions] = useState(() => {
    if (!userToEdit) return []
    
    // If user already has custom permissions, use them
    if (userToEdit.permissions && Array.isArray(userToEdit.permissions)) {
      return userToEdit.permissions
    }
    
    // Otherwise, use default permissions for their role
    return defaultPermissionsByRole[userToEdit.role] || []
  })

  const [selectedRole, setSelectedRole] = useState(userToEdit?.role || 'user')

  if (!isOpen || !userToEdit) return null

  // Check if current user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="modal-overlay">
        <div className="modal-content permissions-modal">
          <div className="access-denied">
            <h3>غير مصرح لك</h3>
            <p>ليس لديك صلاحية لتعديل صلاحيات المستخدمين</p>
            <button onClick={onClose} className="btn-primary">إغلاق</button>
          </div>
        </div>
      </div>
    )
  }

  // Group permissions by category
  const permissionCategories = {
    'لوحة التحكم والتحليلات': ['view_dashboard', 'view_analytics'],
    'القيود اليومية': [
      'view_journal_entries', 'create_journal_entries', 
      'edit_journal_entries', 'delete_journal_entries', 'approve_journal_entries'
    ],
    'دليل الحسابات': [
      'view_chart_of_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts'
    ],
    'الفواتير': [
      'view_invoices', 'create_invoices', 'edit_invoices', 
      'delete_invoices', 'approve_invoices'
    ],
    'العملاء والموردين': [
      'view_customers_suppliers', 'create_customers_suppliers',
      'edit_customers_suppliers', 'delete_customers_suppliers'
    ],
    'المخزون والتنبيهات': [
      'view_inventory', 'create_inventory_items', 'edit_inventory_items',
      'delete_inventory_items', 'view_stock_alerts', 'view_expiry_alerts'
    ],
    'كشوف الحساب والحسابات': [
      'view_account_statements', 'manage_account_statements', 'view_customer_accounts'
    ],
    'التقارير': [
      'view_financial_reports', 'export_reports', 'print_reports'
    ],
    'إدارة البيانات': [
      'import_data', 'export_data', 'backup_data', 'restore_data'
    ],
    'الإعدادات': [
      'view_settings', 'edit_general_settings', 'edit_brand_settings',
      'manage_users', 'view_user_logs'
    ],
    'إدارة النظام': [
      'system_maintenance', 'view_system_logs', 'manage_system_backups'
    ]
  }

  const handlePermissionChange = (permission) => {
    setUserPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission)
      } else {
        return [...prev, permission]
      }
    })
  }

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole)
    // Auto-set default permissions for the role
    setUserPermissions(defaultPermissionsByRole[newRole] || [])
  }

  const handleSelectAll = (categoryPermissions) => {
    const allSelected = categoryPermissions.every(p => userPermissions.includes(p))
    
    if (allSelected) {
      // Deselect all in this category
      setUserPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)))
    } else {
      // Select all in this category
      setUserPermissions(prev => {
        const newPermissions = [...prev]
        categoryPermissions.forEach(p => {
          if (!newPermissions.includes(p)) {
            newPermissions.push(p)
          }
        })
        return newPermissions
      })
    }
  }

  const handleSave = () => {
    onSave({
      ...userToEdit,
      role: selectedRole,
      permissions: userPermissions
    })
    onClose()
  }

  const handleLoadDefaults = () => {
    setUserPermissions(defaultPermissionsByRole[selectedRole] || [])
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content permissions-modal">
        <div className="modal-header">
          <h2>تعديل صلاحيات المستخدم</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="user-info-section">
            <div className="user-avatar">
              {userToEdit.name?.charAt(0) || userToEdit.username?.charAt(0)}
            </div>
            <div className="user-details">
              <h3>{userToEdit.name}</h3>
              <p className="username">@{userToEdit.username}</p>
            </div>
          </div>

          <div className="role-selection-section">
            <h4>الدور الوظيفي</h4>
            <div className="role-options">
              {Object.entries({
                admin: 'مدير النظام',
                manager: 'مدير',
                accountant: 'محاسب',
                user: 'مستخدم'
              }).map(([role, label]) => (
                <label key={role} className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={userToEdit.username === 'admin' && role !== 'admin'}
                  />
                  <span className="role-label">{label}</span>
                </label>
              ))}
            </div>
            <button 
              className="load-defaults-btn"
              onClick={handleLoadDefaults}
            >
              تحميل الصلاحيات الافتراضية للدور
            </button>
          </div>

          <div className="permissions-section">
            <div className="permissions-header">
              <h4>الصلاحيات المخصصة</h4>
              <div className="permissions-summary">
                تم تحديد {userPermissions.length} من {Object.keys(availablePermissions).length} صلاحية
              </div>
            </div>

            <div className="permissions-categories">
              {Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) => {
                const allSelected = categoryPermissions.every(p => userPermissions.includes(p))
                const someSelected = categoryPermissions.some(p => userPermissions.includes(p))
                
                return (
                  <div key={categoryName} className="permission-category">
                    <div className="category-header">
                      <button
                        className={`category-toggle ${allSelected ? 'all-selected' : someSelected ? 'some-selected' : ''}`}
                        onClick={() => handleSelectAll(categoryPermissions)}
                      >
                        <span className="category-icon">
                          {allSelected ? '✓' : someSelected ? '○' : '○'}
                        </span>
                        <span className="category-name">{categoryName}</span>
                        <span className="category-count">
                          ({categoryPermissions.filter(p => userPermissions.includes(p)).length}/{categoryPermissions.length})
                        </span>
                      </button>
                    </div>
                    
                    <div className="category-permissions">
                      {categoryPermissions.map(permission => (
                        <label key={permission} className="permission-item">
                          <input
                            type="checkbox"
                            checked={userPermissions.includes(permission)}
                            onChange={() => handlePermissionChange(permission)}
                          />
                          <span className="permission-name">
                            {availablePermissions[permission]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn-primary" onClick={handleSave}>
            حفظ الصلاحيات
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserPermissionsModal