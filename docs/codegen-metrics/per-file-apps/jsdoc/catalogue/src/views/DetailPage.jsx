import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useSelectedProduct } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays detailed information about a selected product
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const selectedProduct = useSelectedProduct();

  return (
    <AppShell>
      <Navbar title="Product Detail" />
      <div className="page">
        {selectedProduct ? (
          <div className="entity-card">
            <div>
              <h2>{selectedProduct.name}</h2>
              <p><strong>ID:</strong> {selectedProduct.id}</p>
              <p><strong>Category:</strong> {selectedProduct.category}</p>
              <p><strong>Price:</strong> ${selectedProduct.price}</p>
              <p><strong>Stock:</strong> {selectedProduct.stock}</p>
            </div>
          </div>
        ) : (
          <div className="entity-card">
            <p>No product selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
