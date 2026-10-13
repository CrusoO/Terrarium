import AppShell from './components/AppShell.jsx'
import Navbar from './components/Navbar.jsx'
import ListPage from './views/ListPage.jsx'
import FormPage from './views/FormPage.jsx'
import DashboardPage from './views/DashboardPage.jsx'

export default function App() {
  return (
    <AppShell>
      <Navbar title="Expenses" />
      <ListPage />
      <FormPage />
      <DashboardPage />
    </AppShell>
  )
}
