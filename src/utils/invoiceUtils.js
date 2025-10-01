// Invoice utility functions for date checking and status updates

/**
 * Calculate the number of days between two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date  
 * @returns {number} - Number of days (positive if date1 is after date2)
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const timeDiff = d1.getTime() - d2.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Get the current payment status based on due date
 * @param {string} dueDate - The due date of the invoice
 * @param {string} currentStatus - The current payment status
 * @returns {string} - Updated payment status
 */
export const getAutoPaymentStatus = (dueDate, currentStatus) => {
  // If already paid, don't change status
  if (currentStatus === 'paid') {
    return 'paid'
  }

  // If no due date specified, keep current status
  if (!dueDate) {
    return currentStatus || 'pending'
  }

  const today = new Date()
  const due = new Date(dueDate)
  
  // Remove time component for accurate date comparison
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  
  if (due < today) {
    return 'overdue'
  } else {
    return 'pending'
  }
}

/**
 * Update invoice payment status automatically based on due date
 * @param {Array} invoices - Array of invoices to check
 * @returns {Array} - Updated invoices array
 */
export const updateInvoicesStatus = (invoices) => {
  return invoices.map(invoice => {
    const newStatus = getAutoPaymentStatus(invoice.dueDate, invoice.paymentStatus)
    
    // Only update if status has changed
    if (newStatus !== invoice.paymentStatus) {
      return {
        ...invoice,
        paymentStatus: newStatus,
        lastStatusUpdate: new Date().toISOString()
      }
    }
    
    return invoice
  })
}

/**
 * Get invoices that are overdue
 * @param {Array} invoices - Array of invoices
 * @returns {Array} - Overdue invoices
 */
export const getOverdueInvoices = (invoices) => {
  return invoices.filter(invoice => 
    invoice.paymentStatus !== 'paid' && 
    invoice.dueDate && 
    getAutoPaymentStatus(invoice.dueDate, invoice.paymentStatus) === 'overdue'
  )
}

/**
 * Get invoices that are due soon (within specified days)
 * @param {Array} invoices - Array of invoices
 * @param {number} days - Number of days to look ahead (default: 7)
 * @returns {Array} - Invoices due soon
 */
export const getInvoicesDueSoon = (invoices, days = 7) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return invoices.filter(invoice => {
    if (invoice.paymentStatus === 'paid' || !invoice.dueDate) {
      return false
    }
    
    const due = new Date(invoice.dueDate)
    due.setHours(0, 0, 0, 0)
    
    const daysDiff = daysBetween(due, today)
    
    // Due within the specified days but not overdue yet
    return daysDiff >= 0 && daysDiff <= days
  })
}

/**
 * Get notification summary for invoices
 * @param {Array} invoices - Array of invoices
 * @returns {Object} - Notification summary
 */
export const getInvoiceNotifications = (invoices) => {
  const overdue = getOverdueInvoices(invoices)
  const dueSoon = getInvoicesDueSoon(invoices, 7) // 7 days warning
  const dueToday = getInvoicesDueSoon(invoices, 0) // Due today
  
  // Calculate total amounts
  const overdueAmount = overdue.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
  const dueSoonAmount = dueSoon.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
  const dueTodayAmount = dueToday.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
  
  return {
    overdue: {
      count: overdue.length,
      amount: overdueAmount,
      invoices: overdue
    },
    dueSoon: {
      count: dueSoon.length,
      amount: dueSoonAmount,
      invoices: dueSoon
    },
    dueToday: {
      count: dueToday.length,
      amount: dueTodayAmount,
      invoices: dueToday
    }
  }
}

/**
 * Get days until due or days overdue
 * @param {string} dueDate - The due date
 * @returns {Object} - Status information
 */
export const getDaysInfo = (dueDate) => {
  if (!dueDate) {
    return { status: 'no-due-date', days: 0, text: '' }
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const daysDiff = daysBetween(due, today)
  
  if (daysDiff < 0) {
    return {
      status: 'overdue',
      days: Math.abs(daysDiff),
      text: `${Math.abs(daysDiff)} days overdue`
    }
  } else if (daysDiff === 0) {
    return {
      status: 'due-today',
      days: 0,
      text: 'Due today'
    }
  } else {
    return {
      status: 'due-future',
      days: daysDiff,
      text: `Due in ${daysDiff} days`
    }
  }
}