import { Routes, Route, Navigate } from 'react-router-dom'
import { InventoryProvider } from './context/InventoryContext'
import Header from './components/Header'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import InventoryPage from './pages/InventoryPage'
import SalesPage from './pages/SalesPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import BalancePage from './pages/BalancePage'

function App() {
  return (
    <InventoryProvider>
      <div className="app-shell">
        <Header />
        <NavBar />

        <main className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/inventario" replace />} />
            <Route path="/inventario" element={<InventoryPage />} />
            <Route path="/ventas" element={<SalesPage />} />
            <Route path="/historial-ventas" element={<SalesHistoryPage />} />
            <Route path="/balance" element={<BalancePage />} />
            <Route path="*" element={<Navigate to="/inventario" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </InventoryProvider>
  )
}

export default App
