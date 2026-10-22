import AppShell from './components/AppShell.tsx'
import Navbar from './components/Navbar.tsx'
import ListPage from './views/ListPage.tsx'
import DetailPage from './views/DetailPage.tsx'
import FormPage from './views/FormPage.tsx'
import DashboardPage from './views/DashboardPage.tsx'

export default function App() {
  return (
    <AppShell>
      <Navbar title="Operations" />
      <ListPage />
      <DetailPage />
      <FormPage />
      <DashboardPage />
    </AppShell>
  )
}
