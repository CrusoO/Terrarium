import React, { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import OrderCard from '../components/OrderCard.jsx';
import { useOrders } from '../hooks/useData.js';

/**
 * ListPage component for displaying a list of orders with search and filter capabilities.
 * @returns {React.ReactNode} The rendered list page with orders.
 */
export default function ListPage() {
  const orders = useOrders();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');

  const STATUSES = ['All', 'Paid', 'Unpaid', 'Partial'];

  /**
   * Filter orders based on search query and active status.
   * @type {Array}
   */
  const filtered = orders.filter((order) => {
    const matchesQuery =
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.customer.toLowerCase().includes(query.toLowerCase()) ||
      order.city.toLowerCase().includes(query.toLowerCase());

    const matchesStatus =
      activeStatus === 'All' || order.paymentStatus === activeStatus;

    return matchesQuery && matchesStatus;
  });

  /**
   * Handle order selection.
   * @param {string} id - The order ID.
   */
  const handleSelectOrder = (id) => {
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
