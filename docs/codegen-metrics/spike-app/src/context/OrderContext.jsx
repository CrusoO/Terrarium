import { createContext, useContext, useState } from "react";
import { SEED_ORDERS } from "../data/seedData.js";

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [selectedId, setSelectedId] = useState(null);

  function addOrder(draft) {
    const nextNum = orders.reduce((max, o) => {
      const n = parseInt(o.id.replace("ORD-", ""), 10);
      return n > max ? n : max;
    }, 1000);
    const newOrder = { ...draft, id: `ORD-${nextNum + 1}` };
    setOrders((prev) => [...prev, newOrder]);
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder, selectedId, setSelectedId }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used inside OrderProvider");
  return ctx;
}
