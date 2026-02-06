import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home, Camera, ClipboardList, Settings, Package, MapPin } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import HomePage from './pages/HomePage'
import CapturePage from './pages/CapturePage'
import ReviewPage from './pages/ReviewPage'
import InventoryPage from './pages/InventoryPage'
import SettingsPage from './pages/SettingsPage'
import LocationsPage from './pages/LocationsPage'
import CajaDetailPage from './pages/CajaDetailPage'
import BaldaDetailPage from './pages/BaldaDetailPage'
import PrintQueuePage from './pages/PrintQueuePage'
import PrintSheetPage from './pages/PrintSheetPage'

function App() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/captura', icon: Camera, label: 'Capturar' },
    { path: '/ubicaciones', icon: MapPin, label: 'Ubicaciones' },
    { path: '/inventario', icon: Package, label: 'Inventario' },
    { path: '/ajustes', icon: Settings, label: 'Ajustes' },
  ]

  return (
    <div className="app">
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/captura" element={<CapturePage />} />
        <Route path="/revision" element={<ReviewPage />} />
        <Route path="/ubicaciones" element={<LocationsPage />} />
        <Route path="/caja/:cajaId" element={<CajaDetailPage />} />
        <Route path="/balda/:baldaId" element={<BaldaDetailPage />} />
        <Route path="/print-queue" element={<PrintQueuePage />} />
        <Route path="/print-sheet" element={<PrintSheetPage />} />
        <Route path="/inventario" element={<InventoryPage />} />
        <Route path="/ajustes" element={<SettingsPage />} />
      </Routes>

      <nav className="bottom-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon size={24} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App
