import AppShell from './components/AppShell.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './views/Dashboard.jsx';
import OrderList from './views/OrderList.jsx';
import NewOrder from './views/NewOrder.jsx';
import { OrderProvider } from './context/OrderContext.jsx';

export default function App() {
  return (
    <OrderProvider>
      <AppShell>
        <Navbar title="Orders" />
        <Dashboard />
        <OrderList />
        <NewOrder />
      </AppShell>
    </OrderProvider>
  );
}
