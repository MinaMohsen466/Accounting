import React from 'react'
import './PermissionDenied.css'

const PermissionDenied = ({ 
  title = "🚫 غير مصرح لك", 
  message = "ليس لديك صلاحية لعرض هذه الصفحة",
  description = "يرجى التواصل مع المدير لطلب الصلاحية المطلوبة"
}) => {
  return (
    <div className="permission-denied">
      <div className="permission-denied-content">
        <div className="permission-denied-icon">🔒</div>
        <h3>{title}</h3>
        <p className="permission-denied-message">{message}</p>
        <p className="permission-denied-description">{description}</p>
        <div className="permission-denied-suggestions">
          <h4>💡 اقتراحات:</h4>
          <ul>
            <li>تواصل مع مدير النظام لطلب الصلاحية</li>
            <li>تأكد من تسجيل الدخول بالحساب الصحيح</li>
            <li>راجع دورك الوظيفي في النظام</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PermissionDenied