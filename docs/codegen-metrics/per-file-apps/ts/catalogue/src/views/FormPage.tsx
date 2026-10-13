import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useProductActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useProductActions();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kitchen');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && price && stock) {
      addItem({
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
      });
      setName('');
      setCategory('Kitchen');
      setPrice('');
      setStock('');
    }
  };

  return (
    <AppShell>
      <Navbar title="Add Product" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name"
            />
          </div>
          <div>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Kitchen">Kitchen</option>
              <option value="Garden">Garden</option>
              <option value="Desk">Desk</option>
            </select>
          </div>
          <div>
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </div>
          <button type="submit">Add Product</button>
        </form>
      </div>
    </AppShell>
  );
}
