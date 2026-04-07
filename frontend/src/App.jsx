import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home, Camera, ClipboardList, Settings, Package, MapPin } from 'lucide-react'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
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

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/captura', icon: Camera, label: 'Capturar' },
  { path: '/ubicaciones', icon: MapPin, label: 'Ubicaciones' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/ajustes', icon: Settings, label: 'Ajustes' },
]

function AppLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/captura" element={<PrivateRoute><CapturePage /></PrivateRoute>} />
        <Route path="/revision" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        <Route path="/ubicaciones" element={<PrivateRoute><LocationsPage /></PrivateRoute>} />
        <Route path="/caja/:cajaId" element={<PrivateRoute><CajaDetailPage /></PrivateRoute>} />
        <Route path="/balda/:baldaId" element={<PrivateRoute><BaldaDetailPage /></PrivateRoute>} />
        <Route path="/print-queue" element={<PrivateRoute><PrintQueuePage /></PrivateRoute>} />
        <Route path="/print-sheet" element={<PrivateRoute><PrintSheetPage /></PrivateRoute>} />
        <Route path="/inventario" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
        <Route path="/ajustes" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      </Routes>

      {!isLogin && (
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
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}

export default App
