import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import OrderCard from '../components/OrderCard';
import { useOrders } from '../hooks/useData.ts';

const STATUSES = ['Paid', 'Unpaid', 'Partial'];

export default function ListPage() {
  const orders = useOrders();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  const filtered = orders.filter((order) => {
    const matchesQuery =
      query === '' ||
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.customer.toLowerCase().includes(query.toLowerCase()) ||
      order.city.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = activeStatus === '' || order.paymentStatus === activeStatus;

    return matchesQuery && matchesStatus;
  });

  const handleSelectOrder = (id: string) => {
    console.log('Selected order:', id);
  };

  return (
    <AppShell>
      <Navbar title="Orders" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by ID, customer, or city..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
        </div>
        <div>
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              item={order}
              onSelect={handleSelectOrder}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
