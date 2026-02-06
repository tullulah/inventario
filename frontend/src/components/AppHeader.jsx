import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Printer, ChevronRight, Home } from 'lucide-react'
import { getQueue } from '../utils/printQueue'

const routeNames = {
  '': 'Inicio',
  'captura': 'Capturar',
  'revision': 'Revisar',
  'ubicaciones': 'Ubicaciones',
  'inventario': 'Inventario',
  'ajustes': 'Ajustes',
  'print-queue': 'Cola de Impresión',
  'print-sheet': 'Vista Previa',
  'caja': 'Caja',
  'balda': 'Balda'
}

export default function AppHeader({ title, icon: Icon, onRefresh, showBack = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    updateQueueCount()

    const handleLabelAdded = () => {
      updateQueueCount()
    }
    window.addEventListener('labelAddedToQueue', handleLabelAdded)
    
    return () => {
      window.removeEventListener('labelAddedToQueue', handleLabelAdded)
    }
  }, [])

  const updateQueueCount = () => {
    const queue = getQueue()
    setQueueCount(queue.length)
  }

  // No mostrar botones en las páginas de impresión
  const isPrintPage = location.pathname.startsWith('/print-queue') || 
                      location.pathname.startsWith('/print-sheet') ||
                      location.pathname.startsWith('/caja/') ||
                      location.pathname.startsWith('/balda/')

  // Construir breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = [{ path: '/', label: 'Inicio' }]
  
  let currentPath = ''
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`
    
    // Si es un ID (número), usar el nombre de la ruta anterior + ID
    if (/^\d+$/.test(part) || part.startsWith('sheet_') || part.startsWith('caja_') || part.startsWith('balda_')) {
      breadcrumbs[breadcrumbs.length - 1].label += ` #${part.substring(0, 8)}`
    } else {
      breadcrumbs.push({
        path: currentPath,
        label: routeNames[part] || part
      })
    }
  })

  return (
    <header className="header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {showBack && (
          <button className="header-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
        )}
        {Icon && <Icon size={28} />}
        <h1 style={{ margin: 0 }}>{title}</h1>
        
        {!isPrintPage && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            {onRefresh && (
              <button 
                className="header-back" 
                onClick={onRefresh}
                title="Refrescar"
              >
                <RefreshCw size={20} />
              </button>
            )}
            
            <button 
              className="header-back" 
              style={{ position: 'relative' }}
              onClick={() => navigate('/print-queue')}
              title={queueCount > 0 ? `${queueCount} etiqueta${queueCount > 1 ? 's' : ''} en cola` : 'Cola de impresión'}
            >
              <Printer size={20} />
              {queueCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--error)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {queueCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Breadcrumb integrado */}
      <nav 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          opacity: 0.8,
          flexWrap: 'wrap',
          paddingLeft: showBack ? '48px' : '0'
        }}
        className="no-print"
      >
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {index > 0 && (
              <ChevronRight size={12} style={{ opacity: 0.5 }} />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span style={{ fontWeight: '500' }}>
                {crumb.label}
              </span>
            ) : (
              <Link 
                to={crumb.path}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: 0.7
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                  e.currentTarget.style.opacity = '0.7'
                }}
              >
                {index === 0 && <Home size={12} />}
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </header>
  )
}
