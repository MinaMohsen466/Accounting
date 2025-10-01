import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { UNIT_DETAILS, PaintProductService } from '../services/PaintProductService'
import './UnitConverter.css'

const UnitConverter = ({ showModal, onClose }) => {
  const { t } = useLanguage()
  const [fromUnit, setFromUnit] = useState('liter')
  const [toUnit, setToUnit] = useState('gallon')
  const [quantity, setQuantity] = useState(1)
  const [result, setResult] = useState(0)

  // Get available units grouped by type
  const unitsByType = {
    volume: ['liter', 'gallon', 'drum'],
    weight: ['kilogram'],
    count: ['piece'],
    length: ['meter'],
    set: ['set'],
    custom: ['custom']
  }

  // Convert units when inputs change
  const handleConvert = () => {
    const convertedQuantity = PaintProductService.convertUnit(quantity, fromUnit, toUnit)
    setResult(convertedQuantity)
  }

  // Update result when inputs change
  useEffect(() => {
    handleConvert()
  }, [quantity, fromUnit, toUnit])

  // Get units of same type as selected unit
  const getCompatibleUnits = (selectedUnit) => {
    const unitType = UNIT_DETAILS[selectedUnit]?.type
    if (!unitType) return Object.keys(UNIT_DETAILS)
    
    return Object.keys(UNIT_DETAILS).filter(unit => 
      UNIT_DETAILS[unit].type === unitType
    )
  }

  // Handle unit change and update compatible units
  const handleFromUnitChange = (newFromUnit) => {
    setFromUnit(newFromUnit)
    const compatibleUnits = getCompatibleUnits(newFromUnit)
    if (!compatibleUnits.includes(toUnit)) {
      setToUnit(compatibleUnits[0] || newFromUnit)
    }
  }

  if (!showModal) return null

  return (
    <div className="modal-overlay">
      <div className="unit-converter-modal">
        <div className="modal-header">
          <h2>🔄 {t('unitConverter')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="converter-content">
          <div className="converter-section">
            <h3>{t('unitConversion')}</h3>
            
            <div className="conversion-form">
              <div className="input-group">
                <label>{t('quantity')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="quantity-input"
                />
              </div>

              <div className="unit-selectors">
                <div className="unit-group">
                  <label>{t('from')}</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => handleFromUnitChange(e.target.value)}
                    className="unit-select"
                  >
                    {Object.entries(UNIT_DETAILS).map(([key, details]) => (
                      <option key={key} value={key}>
                        {details.nameAr} ({details.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="conversion-arrow">
                  <span>→</span>
                </div>

                <div className="unit-group">
                  <label>{t('to')}</label>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="unit-select"
                  >
                    {getCompatibleUnits(fromUnit).map(unit => (
                      <option key={unit} value={unit}>
                        {UNIT_DETAILS[unit].nameAr} ({UNIT_DETAILS[unit].symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="result-display">
                <div className="result-box">
                  <span className="result-value">{result.toFixed(3)}</span>
                  <span className="result-unit">{UNIT_DETAILS[toUnit]?.nameAr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Examples */}
          <div className="examples-section">
            <h3>{t('conversionExamples')}</h3>
            <div className="examples-grid">
              
              {/* Volume Conversions */}
              <div className="example-category">
                <h4>🥤 {t('volumeConversions')}</h4>
                <div className="example-list">
                  <div className="example-item">
                    <span>1 {t('gallon')} = 3.785 {t('liter')}</span>
                  </div>
                  <div className="example-item">
                    <span>1 {t('liter')} = 0.264 {t('gallon')}</span>
                  </div>
                </div>
              </div>

              {/* Common Paint Quantities */}
              <div className="example-category">
                <h4>🎨 {t('commonPaintQuantities')}</h4>
                <div className="example-list">
                  <div className="example-item">
                    <span>{t('smallRoom')}: 2-3 {t('liter')}</span>
                  </div>
                  <div className="example-item">
                    <span>{t('mediumRoom')}: 4-5 {t('liter')}</span>
                  </div>
                  <div className="example-item">
                    <span>{t('largeRoom')}: 6-8 {t('liter')}</span>
                  </div>
                  <div className="example-item">
                    <span>{t('exteriorHouse')}: 15-20 {t('liter')}</span>
                  </div>
                </div>
              </div>

              {/* Coverage Information */}
              <div className="example-category">
                <h4>📏 {t('coverageInfo')}</h4>
                <div className="example-list">
                  <div className="example-item">
                    <span>1 {t('liter')} ≈ 10-12 م²</span>
                  </div>
                  <div className="example-item">
                    <span>1 {t('gallon')} ≈ 35-40 م²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Conversion Table */}
          <div className="quick-table-section">
            <h3>{t('quickConversionTable')}</h3>
            <div className="conversion-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('liter')}</th>
                    <th>{t('gallon')}</th>
                    <th>{t('coverage')} (م²)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>0.264</td>
                    <td>10-12</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>1.057</td>
                    <td>40-48</td>
                  </tr>
                  <tr>
                    <td>10</td>
                    <td>2.642</td>
                    <td>100-120</td>
                  </tr>
                  <tr>
                    <td>20</td>
                    <td>5.284</td>
                    <td>200-240</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnitConverter