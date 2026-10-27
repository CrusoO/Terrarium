import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useExpenseActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useExpenseActions();
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Travel');
  const [amount, setAmount] = useState('');
  const [spentOn, setSpentOn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount || !spentOn) return;

    addItem({
      merchant,
      category,
      amount: parseFloat(amount),
      spentOn,
    });

    setMerchant('');
    setCategory('Travel');
    setAmount('');
    setSpentOn('');
  };

  return (
    <AppShell>
      <Navbar title="Add Expense" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label>Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Enter merchant name"
            />
          </div>
          <div>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Travel</option>
              <option>Meals</option>
              <option>Supplies</option>
            </select>
          </div>
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
            />
          </div>
          <div>
            <label>Spent On</label>
            <input
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
            />
          </div>
          <button type="submit">Add Expense</button>
        </form>
      </div>
    </AppShell>
  );
}
