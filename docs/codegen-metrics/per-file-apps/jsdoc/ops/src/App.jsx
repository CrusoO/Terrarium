import AppShell from './components/AppShell.jsx'
import Navbar from './components/Navbar.jsx'
import ListPage from './views/ListPage.jsx'
import DetailPage from './views/DetailPage.jsx'
import FormPage from './views/FormPage.jsx'
import DashboardPage from './views/DashboardPage.jsx'

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
