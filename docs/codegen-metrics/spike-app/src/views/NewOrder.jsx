import { useState } from "react";
import { useOrders } from "../context/OrderContext";

export default function NewOrder() {
  const { addOrder } = useOrders();

  const emptyItem = { name: "", qty: 1, price: 0 };

  const [customer, setCustomer] = useState("");
  const [city, setCity] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateItem(index, field, value) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  }

  function addItem() {
    setItems(prev => [...prev, { ...emptyItem }]);
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!customer.trim()) return setError("Customer name is required.");
    if (!city.trim()) return setError("City is required.");
    if (!pickupDate) return setError("Pickup date is required.");
    if (items.length === 0) return setError("At least one item is required.");

    for (const it of items) {
      if (!it.name.trim()) return setError("Each item must have a name.");
      if (!Number.isInteger(Number(it.qty)) || Number(it.qty) < 1)
        return setError("Quantity must be an integer greater than zero.");
      if (isNaN(Number(it.price)) || Number(it.price) < 0)
        return setError("Price must be a valid number.");
    }

    addOrder({
      customer: customer.trim(),
      city: city.trim(),
      pickupDate,
      paymentStatus,
      items: items.map(it => ({
        name: it.name.trim(),
        qty: parseInt(it.qty, 10),
        price: parseFloat(it.price),
      })),
    });

    setCustomer("");
    setCity("");
    setPickupDate("");
    setPaymentStatus("Unpaid");
    setItems([{ ...emptyItem }]);
    setSuccess("Order added successfully.");
  }

  return (
    <div className="page">
      <h2>New order</h2>
      <form className="order-form" onSubmit={handleSubmit}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <label>Customer
          <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer" />
        </label>

        <label>City
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
        </label>

        <label>Pickup date
          <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
        </label>

        <label>Payment status
          <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
          </select>
        </label>

        <h3>Items</h3>
        {items.map((it, i) => (
          <div key={i} className="item-row">
            <input value={it.name} onChange={e => updateItem(i, "name", e.target.value)} placeholder="Item" />
            <input type="number" min="1" value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} placeholder="Quantity" />
            <input type="number" min="0" step="0.01" value={it.price} onChange={e => updateItem(i, "price", e.target.value)} placeholder="Price" />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(i)}>Remove</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addItem}>Add item</button>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
