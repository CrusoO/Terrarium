import { useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import OrderCard from "../components/OrderCard.jsx";
import { useOrders } from "../context/OrderContext.jsx";

const STATUSES = ["All", "Paid", "Unpaid", "Partial"];

export default function OrderList() {
  const { orders, setSelectedId } = useOrders();
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const filtered = orders.filter((order) => {
    const matchesStatus =
      activeStatus === "All" || order.paymentStatus === activeStatus;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      order.customer.toLowerCase().includes(q) ||
      order.city.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page">
      <div className="search-bar">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders"
        />
      </div>
      <div className="filter-row">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={activeStatus === s ? "active" : ""}
          >
            {s}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        filtered.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onClick={() => setSelectedId(order.id)}
          />
        ))
      )}
    </div>
  );
}
