import { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import OrderCard from '../components/OrderCard';
import { useOrders } from '../hooks/useData.js';

/**
 * ListPage component for displaying and filtering orders.
 * Provides search functionality, status filtering, and order selection.
 * @returns {JSX.Element} The list page with search, filters, and order cards.
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
   * Handle order selection by navigating to detail page.
   * @param {string} id - The order ID to select.
   */
  const handleSelectOrder = (id) => {
    // Navigation would be handled by router integration
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
          {filtered.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            filtered.map((order) => (
              <OrderCard
                key={order.id}
                item={order}
                onSelect={handleSelectOrder}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
