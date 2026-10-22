import React from 'react';
import { useSelectedProduct } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const product = useSelectedProduct();

  return (
    <AppShell>
      <Navbar title="Product Detail" />
      <div className="page">
        {product ? (
          <div className="entity-card">
            <div>
              <h2>{product.name}</h2>
              <p>
                <strong>ID:</strong> {product.id}
              </p>
              <p>
                <strong>Category:</strong> <StatusBadge status={product.category} />
              </p>
              <p>
                <strong>Price:</strong> ${product.price}
              </p>
              <p>
                <strong>Stock:</strong> {product.stock}
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No product selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
