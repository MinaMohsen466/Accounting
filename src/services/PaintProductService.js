// Paint & Hardware Store Product Management Service

// تصنيفات المنتجات المتخصصة لمحل الأصباغ والدهانات
export const PRODUCT_CATEGORIES = {
  INTERIOR_PAINT: 'interior_paint',
  EXTERIOR_PAINT: 'exterior_paint', 
  PRIMER: 'primer',
  VARNISH: 'varnish',
  BRUSHES: 'brushes',
  TOOLS: 'tools',
  ACCESSORIES: 'accessories'
}

// وحدات القياس المتعددة
export const MEASUREMENT_UNITS = {
  LITER: 'liter',
  GALLON: 'gallon', 
  KILOGRAM: 'kilogram',
  PIECE: 'piece',
  METER: 'meter',
  SET: 'set',
  DRUM: 'drum',
  CUSTOM: 'custom'
}

// تفاصيل التصنيفات
export const CATEGORY_DETAILS = {
  [PRODUCT_CATEGORIES.INTERIOR_PAINT]: {
    nameAr: 'دهانات داخلية',
    nameEn: 'Interior Paint',
    icon: '🏠',
    color: '#e3f2fd',
    allowedUnits: [MEASUREMENT_UNITS.LITER, MEASUREMENT_UNITS.GALLON, MEASUREMENT_UNITS.KILOGRAM, MEASUREMENT_UNITS.DRUM],
    hasExpiryDate: true,
    hasColorCode: true,
    hasFormula: true,
    properties: ['finish_type', 'coverage', 'drying_time', 'washability']
  },
  [PRODUCT_CATEGORIES.EXTERIOR_PAINT]: {
    nameAr: 'دهانات خارجية',
    nameEn: 'Exterior Paint',
    icon: '🏢',
    color: '#f3e5f5',
    allowedUnits: [MEASUREMENT_UNITS.LITER, MEASUREMENT_UNITS.GALLON, MEASUREMENT_UNITS.KILOGRAM, MEASUREMENT_UNITS.DRUM],
    hasExpiryDate: true,
    hasColorCode: true,
    hasFormula: true,
    properties: ['weather_resistance', 'uv_protection', 'coverage', 'drying_time']
  },
  [PRODUCT_CATEGORIES.PRIMER]: {
    nameAr: 'برايمر',
    nameEn: 'Primer',
    icon: '🎨',
    color: '#fff3e0',
    allowedUnits: [MEASUREMENT_UNITS.LITER, MEASUREMENT_UNITS.GALLON, MEASUREMENT_UNITS.KILOGRAM, MEASUREMENT_UNITS.DRUM],
    hasExpiryDate: true,
    hasColorCode: false,
    hasFormula: false,
    properties: ['surface_type', 'coverage', 'drying_time']
  },
  [PRODUCT_CATEGORIES.VARNISH]: {
    nameAr: 'ورنيش',
    nameEn: 'Varnish',
    icon: '✨',
    color: '#f1f8e9',
    allowedUnits: [MEASUREMENT_UNITS.LITER, MEASUREMENT_UNITS.GALLON, MEASUREMENT_UNITS.KILOGRAM, MEASUREMENT_UNITS.DRUM],
    hasExpiryDate: true,
    hasColorCode: false,
    hasFormula: false,
    properties: ['finish_type', 'coverage', 'durability']
  },
  [PRODUCT_CATEGORIES.BRUSHES]: {
    nameAr: 'فرش',
    nameEn: 'Brushes',
    icon: '🖌️',
    color: '#fce4ec',
    allowedUnits: [MEASUREMENT_UNITS.PIECE, MEASUREMENT_UNITS.SET],
    hasExpiryDate: false,
    hasColorCode: false,
    hasFormula: false,
    properties: ['brush_size', 'hair_type', 'handle_material']
  },
  [PRODUCT_CATEGORIES.TOOLS]: {
    nameAr: 'أدوات',
    nameEn: 'Tools',
    icon: '🔧',
    color: '#e8f5e8',
    allowedUnits: [MEASUREMENT_UNITS.PIECE, MEASUREMENT_UNITS.SET, MEASUREMENT_UNITS.METER],
    hasExpiryDate: false,
    hasColorCode: false,
    hasFormula: false,
    properties: ['material', 'size', 'usage_type']
  },
  [PRODUCT_CATEGORIES.ACCESSORIES]: {
    nameAr: 'مستلزمات',
    nameEn: 'Accessories',
    icon: '🧰',
    color: '#fff8e1',
    allowedUnits: [MEASUREMENT_UNITS.PIECE, MEASUREMENT_UNITS.METER, MEASUREMENT_UNITS.SET],
    hasExpiryDate: false,
    hasColorCode: false,
    hasFormula: false,
    properties: ['material', 'size']
  }
}

// تفاصيل وحدات القياس
export const UNIT_DETAILS = {
  [MEASUREMENT_UNITS.LITER]: {
    nameAr: 'لتر',
    nameEn: 'Liter',
    symbol: 'L',
    conversionToBase: 1, // Base unit for liquids
    type: 'volume'
  },
  [MEASUREMENT_UNITS.GALLON]: {
    nameAr: 'جالون',
    nameEn: 'Gallon',
    symbol: 'Gal',
    conversionToBase: 3.78541, // 1 gallon = 3.78541 liters
    type: 'volume'
  },
  [MEASUREMENT_UNITS.KILOGRAM]: {
    nameAr: 'كيلوجرام',
    nameEn: 'Kilogram',
    symbol: 'Kg',
    conversionToBase: 1, // Base unit for weight
    type: 'weight'
  },
  [MEASUREMENT_UNITS.PIECE]: {
    nameAr: 'قطعة',
    nameEn: 'Piece',
    symbol: 'Pc',
    conversionToBase: 1, // Base unit for count
    type: 'count'
  },
  [MEASUREMENT_UNITS.METER]: {
    nameAr: 'متر',
    nameEn: 'Meter',
    symbol: 'M',
    conversionToBase: 1, // Base unit for length
    type: 'length'
  },
  [MEASUREMENT_UNITS.SET]: {
    nameAr: 'طقم',
    nameEn: 'Set',
    symbol: 'Set',
    conversionToBase: 1, // Base unit for sets
    type: 'set'
  },
  [MEASUREMENT_UNITS.DRUM]: {
    nameAr: 'درام',
    nameEn: 'Drum',
    symbol: 'Drum',
    conversionToBase: 200, // 1 drum = 200 liters typically
    type: 'volume'
  },
  [MEASUREMENT_UNITS.CUSTOM]: {
    nameAr: 'وحدة مخصصة',
    nameEn: 'Custom Unit',
    symbol: 'Custom',
    conversionToBase: 1, // Will be defined by user
    type: 'custom'
  }
}

// نظام رموز الألوان
export const COLOR_SYSTEMS = {
  RAL: 'ral',
  PANTONE: 'pantone',
  NCS: 'ncs',
  CUSTOM: 'custom'
}

// كلاس إدارة منتجات الأصباغ
export class PaintProductService {
  
  // تحويل وحدات القياس
  static convertUnit(quantity, fromUnit, toUnit) {
    const fromDetails = UNIT_DETAILS[fromUnit]
    const toDetails = UNIT_DETAILS[toUnit]
    
    if (!fromDetails || !toDetails) return quantity
    if (fromDetails.type !== toDetails.type) return quantity // لا يمكن تحويل أنواع مختلفة
    
    const baseQuantity = quantity * fromDetails.conversionToBase
    return baseQuantity / toDetails.conversionToBase
  }
  
  // التحقق من صلاحية المنتج
  static checkExpiryStatus(expiryDate) {
    if (!expiryDate) return { status: 'no_expiry', daysLeft: null }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const timeDiff = expiry.getTime() - today.getTime()
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    if (daysLeft < 0) return { status: 'expired', daysLeft: Math.abs(daysLeft) }
    if (daysLeft <= 30) return { status: 'expiring_soon', daysLeft }
    if (daysLeft <= 90) return { status: 'expiring_within_3_months', daysLeft }
    
    return { status: 'valid', daysLeft }
  }
  
  // التحقق من مستوى المخزون
  static checkStockLevel(quantity, minStockLevel, category) {
    const categoryDetails = CATEGORY_DETAILS[category]
    const defaultMinLevel = categoryDetails?.properties?.includes('high_demand') ? 20 : 10
    
    const minLevel = minStockLevel || defaultMinLevel
    
    if (quantity <= 0) return { status: 'out_of_stock', level: 'critical' }
    if (quantity <= minLevel * 0.3) return { status: 'critical_low', level: 'critical' }
    if (quantity <= minLevel) return { status: 'low_stock', level: 'warning' }
    if (quantity <= minLevel * 2) return { status: 'adequate', level: 'normal' }
    
    return { status: 'well_stocked', level: 'good' }
  }
  
  // إنشاء رمز منتج تلقائي
  static generateProductCode(category, name) {
    const categoryCode = Object.keys(PRODUCT_CATEGORIES).find(key => 
      PRODUCT_CATEGORIES[key] === category
    )?.substring(0, 3) || 'GEN'
    
    const nameCode = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()
    const timestamp = Date.now().toString().slice(-4)
    
    return `${categoryCode}-${nameCode}-${timestamp}`
  }
  
  // البحث في الألوان والرموز
  static searchColors(colorData, searchTerm) {
    if (!colorData || !searchTerm) return []
    
    const term = searchTerm.toLowerCase()
    return colorData.filter(color => 
      color.name?.toLowerCase().includes(term) ||
      color.code?.toLowerCase().includes(term) ||
      color.system?.toLowerCase().includes(term)
    )
  }
  
  // حساب التغطية المطلوبة
  static calculateCoverage(area, coats = 1, coverageRate = 10) {
    // التغطية بالمتر المربع لكل لتر
    return (area * coats) / coverageRate
  }
  
  // اقتراح المنتجات المرتبطة
  static getSuggestedProducts(category, productId) {
    const suggestions = {
      [PRODUCT_CATEGORIES.INTERIOR_PAINT]: [PRODUCT_CATEGORIES.PRIMER, PRODUCT_CATEGORIES.BRUSHES, PRODUCT_CATEGORIES.TOOLS],
      [PRODUCT_CATEGORIES.EXTERIOR_PAINT]: [PRODUCT_CATEGORIES.PRIMER, PRODUCT_CATEGORIES.BRUSHES, PRODUCT_CATEGORIES.TOOLS],
      [PRODUCT_CATEGORIES.PRIMER]: [PRODUCT_CATEGORIES.INTERIOR_PAINT, PRODUCT_CATEGORIES.EXTERIOR_PAINT],
      [PRODUCT_CATEGORIES.VARNISH]: [PRODUCT_CATEGORIES.BRUSHES, PRODUCT_CATEGORIES.TOOLS],
      [PRODUCT_CATEGORIES.BRUSHES]: [PRODUCT_CATEGORIES.ACCESSORIES],
      [PRODUCT_CATEGORIES.TOOLS]: [PRODUCT_CATEGORIES.ACCESSORIES],
      [PRODUCT_CATEGORIES.ACCESSORIES]: []
    }
    
    return suggestions[category] || []
  }
}

export default PaintProductService