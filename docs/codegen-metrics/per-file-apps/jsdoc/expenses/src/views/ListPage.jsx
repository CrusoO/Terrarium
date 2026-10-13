import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AppShell from '../components/AppShell';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import ExpenseCard from '../components/ExpenseCard';
import { useExpenses } from '../hooks/useData.js';

/**
 * ListPage component for displaying and filtering expenses.
 * @returns {React.ReactNode} The rendered list page.
 */
export default function ListPage() {
  const expenses = useExpenses();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const CATEGORIES = ['All', 'Travel', 'Meals', 'Supplies'];

  const filtered = expenses.filter((expense) => {
    const matchesQuery =
      expense.merchant.toLowerCase().includes(query.toLowerCase()) ||
      expense.id.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || expense.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const handleSelectExpense = (id) => {
    // Navigate or select expense (placeholder for future routing)
  };

  return (
    <AppShell>
      <Navbar title="Expenses" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by merchant or ID..."
          />
        </div>
        <FilterTabs
          statuses={CATEGORIES}
          active={activeCategory}
          onChange={setActiveCategory}
        />
        <div>
          {filtered.map((expense) => (
            <ExpenseCard
              key={expense.id}
              item={expense}
              onSelect={handleSelectExpense}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
