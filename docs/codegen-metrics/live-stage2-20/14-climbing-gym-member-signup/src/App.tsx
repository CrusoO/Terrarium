import { useState } from 'react'
import AppShell from './components/AppShell.tsx'
import Navbar from './components/Navbar.tsx'
import ListPage from './views/ListPage.tsx'
import DetailPage from './views/DetailPage.tsx'
import FormPage from './views/FormPage.tsx'

export default function App() {
  const [route, setRoute] = useState<'list' | 'detail' | 'form'>('list')
  const titles: Record<string, string> = { list: "Climbing Gym Member Signup", detail: "Climbing Gym Member Signup", form: "Climbing Gym Member Signup" }
  return (
    <AppShell>
      <div className="layout-split theme-tide">
      
      <Navbar title={titles[route] || titles.list} />
      <nav className="route-nav"><button type="button" data-route="list" onClick={() => setRoute('list')}>List</button>
        <button type="button" data-route="detail" onClick={() => setRoute('detail')}>Detail</button>
        <button type="button" data-route="form" onClick={() => setRoute('form')}>New</button></nav>
      { route === 'list' ? (
        <div className="split"><ListPage onOpen={() => setRoute('detail')} /><DetailPage /></div>
      ) : route === 'detail' ? (
        <DetailPage />
      ) : route === 'form' ? (
        <FormPage onDone={() => setRoute('list')} />
      ) : null }
      </div>
    </AppShell>
  )
}
