import { useState } from 'react';
import { useExpenses } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import ExpenseCard from '../components/ExpenseCard';
import Navbar from '../components/Navbar';
import AppShell from '../components/AppShell';

const CATEGORIES = ['Travel', 'Meals', 'Supplies'];

export default function ListPage() {
  const expenses = useExpenses();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const filtered = expenses.filter((expense) => {
    const matchesQuery =
      expense.merchant.toLowerCase().includes(query.toLowerCase()) ||
      expense.id.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !activeCategory || expense.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const handleSelectExpense = (id: string) => {
    console.log('Selected expense:', id);
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
          <FilterTabs
            statuses={CATEGORIES}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>
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
