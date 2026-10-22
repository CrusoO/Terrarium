import { useState } from 'react'
import { useSelectedSku, useSkuActions } from '../hooks/useData.js'
import SkuCard from '../components/SkuCard.jsx'

/**
 * DetailPage
 * @returns {JSX.Element}
 */
export default function DetailPage() {
  const selectedSku = useSelectedSku()
  const { addItem } = useSkuActions()
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    aisle: '',
    status: 'Ok',
    onHand: 0
  })

  const handleEdit = () => {
    if (selectedSku) {
      setFormData({
        name: selectedSku.name,
        aisle: selectedSku.aisle,
        status: selectedSku.status,
        onHand: selectedSku.onHand
      })
      setEditMode(true)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setFormData({
      name: '',
      aisle: '',
      status: 'Ok',
      onHand: 0
    })
  }

  const handleSave = () => {
    if (selectedSku) {
      addItem({
        id: selectedSku.id,
        ...formData
      })
      setEditMode(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'onHand' ? parseInt(value, 10) || 0 : value
    }))
  }

  if (!selectedSku) {
    return (
      
        
        <div className="page">
          <p>No SKU selected</p>
        </div>
      
    )
  }

  return (
    
      
      <div className="page">
        {!editMode ? (
          <div>
            <div className="entity-card">
              <h2>{selectedSku.name}</h2>
              <p><strong>ID:</strong> {selectedSku.id}</p>
              <p><strong>Aisle:</strong> {selectedSku.aisle}</p>
              <p><strong>Status:</strong> {selectedSku.status}</p>
              <p><strong>On Hand:</strong> {selectedSku.onHand}</p>
              <button onClick={handleEdit}>Edit</button>
            </div>
          </div>
        ) : (
          <div className="entity-card">
            <h2>Edit SKU</h2>
            <div>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <div>
              <label>
                Aisle:
                <input
                  type="text"
                  name="aisle"
                  value={formData.aisle}
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <div>
              <label>
                Status:
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Ok">Ok</option>
                  <option value="Low">Low</option>
                  <option value="Out">Out</option>
                </select>
              </label>
            </div>
            <div>
              <label>
                On Hand:
                <input
                  type="number"
                  name="onHand"
                  value={formData.onHand}
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>
    
  )
}
