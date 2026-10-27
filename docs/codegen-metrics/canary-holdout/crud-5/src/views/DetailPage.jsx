import { useState } from 'react'
import { useSelectedSku, useSkuActions } from '../hooks/useData.js'
import SkuCard from '../components/SkuCard.jsx'

/**
 * DetailPage
 * @returns {JSX.Element}
 */
export default function DetailPage() {
  const selectedSku = useSelectedSku()
  const { addItem, select } = useSkuActions()

  if (!selectedSku) {
    return (
      
        
        <div className="page">
          <p>No SKU selected</p>
        </div>
      
    )
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <h2>{selectedSku.name}</h2>
          <p><strong>ID:</strong> {selectedSku.id}</p>
          <p><strong>Aisle:</strong> {selectedSku.aisle}</p>
          <p><strong>Status:</strong> {selectedSku.status}</p>
          <p><strong>On Hand:</strong> {selectedSku.onHand}</p>
        </div>
      </div>
    
  )
}
