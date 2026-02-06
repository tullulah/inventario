import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ClipboardCheck, Package, ArrowRight, MapPin } from 'lucide-react'
import { getStats } from '../api'
import AppHeader from '../components/AppHeader'

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getStats()
      setStats(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <>
      <AppHeader 
        title="Inventario" 
        icon={Package}
        onRefresh={loadStats}
        showBack={false}
      />

      <main className="main-content">
        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
          </div>
        ) : stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.items}</div>
                <div className="stat-label">Items totales</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.itemsPendientes}</div>
                <div className="stat-label">Pendientes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.itemsRevisados}</div>
                <div className="stat-label">Revisados</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.fotos}</div>
                <div className="stat-label">Fotos</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Ubicaciones</h2>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {stats.estanterias}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Estanterías</div>
                </div>
                <div style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {stats.baldas}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Baldas</div>
                </div>
                <div style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {stats.cajas}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Cajas</div>
                </div>
              </div>
            </div>
          </>
        )}

        <h2 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Acciones rápidas</h2>

        <Link to="/captura" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '0.75rem', 
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={24} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Capturar items</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Tomar fotos de nuevos objetos
              </div>
            </div>
            <ArrowRight size={20} color="var(--gray-400)" />
          </div>
        </Link>

        <Link to="/revision" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '0.75rem', 
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardCheck size={24} color="var(--warning)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Revisar clasificaciones</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                {stats ? `${stats.itemsPendientes} items pendientes` : 'Validar predicciones YOLO'}
              </div>
            </div>
            <ArrowRight size={20} color="var(--gray-400)" />
          </div>
        </Link>

        <Link to="/ubicaciones" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '0.75rem', 
              background: '#e9d5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={24} color="#9333ea" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Gestionar ubicaciones</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Ver estanterías, baldas y cajas
              </div>
            </div>
            <ArrowRight size={20} color="var(--gray-400)" />
          </div>
        </Link>

        <Link to="/inventario" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '0.75rem', 
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="var(--success)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Ver inventario</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Explorar todos los items
              </div>
            </div>
            <ArrowRight size={20} color="var(--gray-400)" />
          </div>
        </Link>
      </main>
    </>
  )
}
