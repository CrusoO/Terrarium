import { useState } from 'react';
import { useProductActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new products.
 * Manages form state for product fields and submits via addItem action.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback fired after successful product creation
 * @returns {JSX.Element} Form page with product creation inputs
 */
export default function FormPage({ onDone }) {
  const { addItem } = useProductActions();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kitchen');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  /**
   * Handles form submission.
   * Creates new product object and calls addItem action.
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    addItem({
      name,
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
    });
    setName('');
    setCategory('Kitchen');
    setPrice('');
    setStock('');
    if (onDone) {
      onDone();
    }
  };

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
              required
            />
          </div>
          <div>
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Product</button>
        </form>
      </div>
    
  );
}
