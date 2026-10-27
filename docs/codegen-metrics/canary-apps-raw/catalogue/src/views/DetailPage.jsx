import React from 'react';
import { useSelectedProduct, useProductActions } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays details of a selected product
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const selectedProduct = useSelectedProduct();
  const { select } = useProductActions();

  if (!selectedProduct) {
    return (
      
        
        <div className="page">
          <p>No product selected</p>
        </div>
      
    );
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div>
            <strong>ID:</strong> {selectedProduct.id}
          </div>
          <div>
            <strong>Name:</strong> {selectedProduct.name}
          </div>
          <div>
            <strong>Category:</strong> {selectedProduct.category}
          </div>
          <div>
            <strong>Price:</strong> ${selectedProduct.price}
          </div>
          <div>
            <strong>Stock:</strong> {selectedProduct.stock}
          </div>
        </div>
      </div>
    
  );
}
