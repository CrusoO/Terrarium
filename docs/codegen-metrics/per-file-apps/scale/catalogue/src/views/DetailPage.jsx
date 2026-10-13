import React from 'react';
import { useSelectedProduct } from '../hooks/useData.js';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';

/**
 * DetailPage component
 * Displays detailed information about a selected product
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const product = useSelectedProduct();

  return (
    <AppShell>
      <Navbar title="Product Detail" />
      <div className="page">
        {product ? (
          <div className="entity-card">
            <h2>{product.name}</h2>
            <p><strong>ID:</strong> {product.id}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Stock:</strong> {product.stock}</p>
          </div>
        ) : (
          <p>No product selected</p>
        )}
      </div>
    </AppShell>
  );
}
