import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import AddUserModal from './AddUserModal'
import UserPermissionsModal from './UserPermissionsModal'
import './UserManagement.css'

const UserManagement = () => {
  const { getAllUsers, deleteUser, toggleUserStatus, updateUser, isAdmin } = useAuth()
  const { language } = useLanguage()
  
  const [users, setUsers] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const loadUsers = () => {
    try {
      const result = getAllUsers()
      if (result.success) {
        setUsers(result.users)
      } else {
        showNotification(result.error, 'error')
      }
    } catch (error) {
      showNotification('فشل في تحميل المستخدمين', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const handleDeleteUser = (username) => {
    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      const result = deleteUser(username)
      if (result.success) {
        showNotification(result.message)
        loadUsers()
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  const handleToggleStatus = (username) => {
    const user = users.find(u => u.username === username)
    const action = user.active ? 'تعطيل' : 'تفعيل'
    
    if (window.confirm(`هل أنت متأكد من ${action} المستخدم "${username}"؟`)) {
      const result = toggleUserStatus(username)
      if (result.success) {
        showNotification(result.message)
        loadUsers()
      } else {
        showNotification(result.error, 'error')
      }
    }
  }

  const handleUserAdded = () => {
    showNotification('تم إضافة المستخدم بنجاح')
    loadUsers()
  }

  const handleEditPermissions = (user) => {
    setSelectedUserForPermissions(user)
    setIsPermissionsModalOpen(true)
  }

  const handleSavePermissions = (updatedUser) => {
    const result = updateUser(updatedUser.username, {
      role: updatedUser.role,
      permissions: updatedUser.permissions
    })
    
    if (result.success) {
      showNotification('تم تحديث صلاحيات المستخدم بنجاح')
      loadUsers()
    } else {
      showNotification(result.error, 'error')
    }
  }

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'مدير عام',
      manager: 'مدير',
      accountant: 'محاسب',
      user: 'مستخدم عادي'
    }
    return roles[role] || role
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'role-admin',
      manager: 'role-manager',
      accountant: 'role-accountant',
      user: 'role-user'
    }
    return colors[role] || 'role-user'
  }

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h3>🚫 الوصول مرفوض</h3>
          <p>ليس لديك صلاحية لإدارة المستخدمين</p>
          <p>هذه الصفحة متاحة للمدير العام فقط</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري تحميل المستخدمين...</p>
      </div>
    )
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-content">
          <h2>👥 إدارة المستخدمين</h2>
          <p>إضافة وإدارة مستخدمي النظام وصلاحياتهم</p>
        </div>
        <button 
          className="add-user-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span>+</span>
          إضافة مستخدم جديد
        </button>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="users-stats">
        <div className="stat-card">
          <h4>إجمالي المستخدمين</h4>
          <span className="stat-number">{users.length}</span>
        </div>
        <div className="stat-card">
          <h4>المستخدمين النشطين</h4>
          <span className="stat-number">{users.filter(u => u.active !== false).length}</span>
        </div>
        <div className="stat-card">
          <h4>المديرين</h4>
          <span className="stat-number">{users.filter(u => u.role === 'admin').length}</span>
        </div>
      </div>

      <div className="users-list">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>لا توجد مستخدمين مسجلين</p>
            <button 
              className="add-first-user-btn"
              onClick={() => setIsAddModalOpen(true)}
            >
              إضافة أول مستخدم
            </button>
          </div>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div key={user.username} className={`user-card ${user.active === false ? 'inactive' : ''}`}>
                <div className="user-header">
                  <div className="user-avatar">
                    {user.name.charAt(0)}
                  </div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p className="username">@{user.username}</p>
                  </div>
                  <div className="user-status">
                    <span className={`status-badge ${user.active !== false ? 'active' : 'inactive'}`}>
                      {user.active !== false ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                </div>

                <div className="user-details">
                  <div className="user-role">
                    <span className={`role-badge ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  
                  <div className="user-meta">
                    <p><strong>تاريخ الإنشاء:</strong></p>
                    <p>{new Date(user.createdAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>

                {user.username !== 'admin' && (
                  <div className="user-actions">
                    <button
                      className="action-btn permissions"
                      onClick={() => handleEditPermissions(user)}
                      title="تعديل صلاحيات المستخدم"
                    >
                      🔐 الصلاحيات
                    </button>
                    <button
                      className={`action-btn ${user.active !== false ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(user.username)}
                      title={user.active !== false ? 'تعطيل المستخدم' : 'تفعيل المستخدم'}
                    >
                      {user.active !== false ? '⏸️ تعطيل' : '▶️ تفعيل'}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.username)}
                      title="حذف المستخدم نهائياً"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                )}

                {user.username === 'admin' && (
                  <div className="user-actions">
                    <button
                      className="action-btn permissions admin-permissions"
                      onClick={() => handleEditPermissions(user)}
                      title="تعديل صلاحيات المدير"
                    >
                      🔐 الصلاحيات
                    </button>
                  </div>
                )}

                {user.username === 'admin' && (
                  <div className="admin-badge">
                    👑 المدير العام
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <UserPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false)
          setSelectedUserForPermissions(null)
        }}
        userToEdit={selectedUserForPermissions}
        onSave={handleSavePermissions}
      />
    </div>
  )
}

export default UserManagement
