import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartDrawer from './components/CartDrawer';

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header onCartClick={() => setCartOpen(true)} />
        <main style={{ flex: 1 }}>
          {selectedProduct ? (
            <ProductDetailPage
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
              onCartOpen={() => setCartOpen(true)}
            />
          ) : (
            <CataloguePage onSelectProduct={setSelectedProduct} />
          )}
        </main>
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </CartProvider>
  );
}
