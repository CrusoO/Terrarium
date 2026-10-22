import AppShell from './components/AppShell.tsx'
import Navbar from './components/Navbar.tsx'
import ListPage from './views/ListPage.tsx'
import FormPage from './views/FormPage.tsx'
import DashboardPage from './views/DashboardPage.tsx'

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
