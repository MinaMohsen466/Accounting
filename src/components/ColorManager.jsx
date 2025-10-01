import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { COLOR_SYSTEMS } from '../services/PaintProductService'
import './ColorManager.css'

const ColorManager = ({ onColorSelect, selectedColor, showModal, onClose }) => {
  const { t } = useLanguage()
  const [colors, setColors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSystem, setSelectedSystem] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newColor, setNewColor] = useState({
    name: '',
    code: '',
    system: 'ral',
    hexValue: '#FFFFFF',
    formula: '',
    notes: ''
  })

  // Load colors from localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem('paintColors')
    if (savedColors) {
      setColors(JSON.parse(savedColors))
    } else {
      // Initialize with default RAL colors
      const defaultColors = [
        { id: 1, name: 'أبيض ناصع', code: 'RAL 9010', system: 'ral', hexValue: '#F8F8FF', formula: 'White Base + Titanium Dioxide' },
        { id: 2, name: 'أزرق سماوي', code: 'RAL 5015', system: 'ral', hexValue: '#2271B3', formula: 'Blue Base + Ultramarine' },
        { id: 3, name: 'أخضر نعناعي', code: 'RAL 6029', system: 'ral', hexValue: '#20603D', formula: 'Green Base + Chrome Oxide' },
        { id: 4, name: 'أحمر إشارة', code: 'RAL 3001', system: 'ral', hexValue: '#A52019', formula: 'Red Base + Iron Oxide' },
        { id: 5, name: 'أصفر ذهبي', code: 'RAL 1004', system: 'ral', hexValue: '#CDA434', formula: 'Yellow Base + Chrome Yellow' },
        { id: 6, name: 'بني شوكولاتة', code: 'RAL 8017', system: 'ral', hexValue: '#45322E', formula: 'Brown Base + Umber' },
        { id: 7, name: 'رمادي فاتح', code: 'RAL 7035', system: 'ral', hexValue: '#D7D7D7', formula: 'White Base + Carbon Black' },
        { id: 8, name: 'بنفسجي', code: 'RAL 4008', system: 'ral', hexValue: '#924969', formula: 'Purple Base + Quinacridone' }
      ]
      setColors(defaultColors)
      localStorage.setItem('paintColors', JSON.stringify(defaultColors))
    }
  }, [])

  // Filter colors based on search and system
  const filteredColors = colors.filter(color => {
    const matchesSearch = color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         color.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSystem = selectedSystem === 'all' || color.system === selectedSystem
    return matchesSearch && matchesSystem
  })

  // Add new color
  const handleAddColor = () => {
    if (!newColor.name || !newColor.code) return

    const newColorWithId = {
      ...newColor,
      id: Date.now(),
      createdAt: new Date().toISOString()
    }

    const updatedColors = [...colors, newColorWithId]
    setColors(updatedColors)
    localStorage.setItem('paintColors', JSON.stringify(updatedColors))
    
    setNewColor({
      name: '',
      code: '',
      system: 'ral',
      hexValue: '#FFFFFF',
      formula: '',
      notes: ''
    })
    setShowAddForm(false)
  }

  // Delete color
  const handleDeleteColor = (colorId) => {
    if (window.confirm(t('confirmDelete'))) {
      const updatedColors = colors.filter(color => color.id !== colorId)
      setColors(updatedColors)
      localStorage.setItem('paintColors', JSON.stringify(updatedColors))
    }
  }

  // Select color
  const handleSelectColor = (color) => {
    if (onColorSelect) {
      onColorSelect(color)
    }
  }

  if (!showModal) return null

  return (
    <div className="modal-overlay">
      <div className="color-manager-modal">
        <div className="modal-header">
          <h2>🎨 {t('colorManagement')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="color-manager-content">
          {/* Search and Filter Controls */}
          <div className="color-controls">
            <div className="search-section">
              <input
                type="text"
                placeholder={t('searchColors')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="color-search"
              />
              
              <select
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
                className="system-filter"
              >
                <option value="all">{t('allSystems')}</option>
                <option value="ral">RAL</option>
                <option value="pantone">PANTONE</option>
                <option value="ncs">NCS</option>
                <option value="custom">{t('customColor')}</option>
              </select>

              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? t('cancel') : t('addNewColor')}
              </button>
            </div>
          </div>

          {/* Add New Color Form */}
          {showAddForm && (
            <div className="add-color-form">
              <h3>{t('addNewColor')}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('colorName')} *</label>
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('colorName')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('colorCode')} *</label>
                  <input
                    type="text"
                    value={newColor.code}
                    onChange={(e) => setNewColor(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="RAL 9010"
                  />
                </div>

                <div className="form-group">
                  <label>{t('colorSystem')}</label>
                  <select
                    value={newColor.system}
                    onChange={(e) => setNewColor(prev => ({ ...prev, system: e.target.value }))}
                  >
                    <option value="ral">RAL</option>
                    <option value="pantone">PANTONE</option>
                    <option value="ncs">NCS</option>
                    <option value="custom">{t('customColor')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('hexColor')}</label>
                  <div className="hex-input-container">
                    <input
                      type="color"
                      value={newColor.hexValue}
                      onChange={(e) => setNewColor(prev => ({ ...prev, hexValue: e.target.value }))}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={newColor.hexValue}
                      onChange={(e) => setNewColor(prev => ({ ...prev, hexValue: e.target.value }))}
                      className="hex-input"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>{t('colorFormula')}</label>
                  <textarea
                    value={newColor.formula}
                    onChange={(e) => setNewColor(prev => ({ ...prev, formula: e.target.value }))}
                    placeholder={t('colorFormulaPlaceholder')}
                    rows="2"
                  />
                </div>

                <div className="form-group full-width">
                  <label>{t('notes')}</label>
                  <textarea
                    value={newColor.notes}
                    onChange={(e) => setNewColor(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('notesPlaceholder')}
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddColor}
                  disabled={!newColor.name || !newColor.code}
                >
                  {t('addColor')}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Colors Grid */}
          <div className="colors-grid">
            {filteredColors.map(color => (
              <div 
                key={color.id} 
                className={`color-card ${selectedColor?.id === color.id ? 'selected' : ''}`}
                onClick={() => handleSelectColor(color)}
              >
                <div 
                  className="color-preview"
                  style={{ backgroundColor: color.hexValue }}
                ></div>
                
                <div className="color-info">
                  <div className="color-name">{color.name}</div>
                  <div className="color-code">{color.code}</div>
                  <div className="color-system">{color.system.toUpperCase()}</div>
                  {color.hexValue && (
                    <div className="color-hex">{color.hexValue}</div>
                  )}
                </div>

                {color.formula && (
                  <div className="color-formula">
                    <small>{t('formula')}: {color.formula}</small>
                  </div>
                )}

                <div className="color-actions">
                  <button 
                    className="btn-action btn-select"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectColor(color)
                      onClose()
                    }}
                  >
                    {t('select')}
                  </button>
                  <button 
                    className="btn-action btn-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteColor(color.id)
                    }}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredColors.length === 0 && (
            <div className="no-colors">
              <p>{t('noColorsFound')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ColorManager