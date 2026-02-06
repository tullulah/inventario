import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

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

export default function Breadcrumb() {
  const location = useLocation()
  
  const pathParts = location.pathname.split('/').filter(Boolean)
  
  // Construir breadcrumbs
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
    <nav 
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--gray-50)',
        borderBottom: '1px solid var(--gray-200)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        flexWrap: 'wrap'
      }}
      className="no-print"
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {index > 0 && (
            <ChevronRight size={14} style={{ color: 'var(--gray-400)' }} />
          )}
          {index === breadcrumbs.length - 1 ? (
            <span style={{ color: 'var(--gray-600)', fontWeight: '500' }}>
              {crumb.label}
            </span>
          ) : (
            <Link 
              to={crumb.path}
              style={{
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {index === 0 && <Home size={14} />}
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
