import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Package, Image, ChevronRight, X, Sparkles, Loader2 } from 'lucide-react'
import { getItems, getArbolUbicaciones, getItem, updateItem, redetectarItem } from '../api'
import AppHeader from '../components/AppHeader'

export default function InventoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, reviewed
  const [ubicaciones, setUbicaciones] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [ubicacionFilter, setUbicacionFilter] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadItems()
  }, [filter, searchTerm, ubicacionFilter])

  const loadData = async () => {
    try {
      const ubicacionesData = await getArbolUbicaciones()
      setUbicaciones(ubicacionesData)
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    }
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      const filters = {}
      
      if (filter === 'pending') filters.revisado = 'false'
      if (filter === 'reviewed') filters.revisado = 'true'
      if (searchTerm) filters.buscar = searchTerm
      if (ubicacionFilter) filters.caja_id = ubicacionFilter

      const data = await getItems(filters)
      setItems(data)
    } catch (error) {
      console.error('Error cargando items:', error)
    } finally {
      setLoading(false)
    }
  }

  const openItemDetail = async (item) => {
    try {
      const fullItem = await getItem(item.id)
      setSelectedItem(fullItem)
    } catch (error) {
      console.error('Error cargando detalle:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadItems()
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleRedetectar = async () => {
    if (!selectedItem) return
    try {
      setDetecting(true)
      const result = await redetectarItem(selectedItem.id)
      if (result.success && result.categoria) {
        showToast(`Detectado: ${result.categoria} (${Math.round(result.confianza * 100)}%)`)
        // Actualizar el item en el estado
        setSelectedItem(prev => ({
          ...prev,
          categoria_yolo: result.categoria,
          confianza_yolo: result.confianza
        }))
        // Recargar lista
        loadItems()
      } else {
        showToast('No se detectó ningún objeto')
      }
    } catch (error) {
      showToast('Error al detectar: ' + error.message)
    } finally {
      setDetecting(false)
    }
  }

  return (
    <>
      <AppHeader 
        title="Inventario" 
        icon={Package}
        onRefresh={loadData}
      />
      
      {/* Botón de filtros adicional */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '8rem',
        zIndex: 10
      }}>
        <button 
          className="header-back" 
          onClick={() => setShowFilters(!showFilters)}
          title="Filtros"
        >
          <Filter size={20} />
        </button>
      </div>

      <main className="main-content">
        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)'
              }} 
            />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>
        </form>

        {/* Filtros */}
        {showFilters && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'reviewed', label: 'Revisados' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`btn ${filter === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem' }}
                    onClick={() => setFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {ubicacionFilter && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => setUbicacionFilter(null)}
                >
                  Limpiar filtro de ubicación
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resultados */}
        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package size={64} color="var(--gray-400)" />
            </div>
            <h2 className="empty-state-title">No hay items</h2>
            <p>No se encontraron items con los filtros actuales</p>
          </div>
        ) : (
          <>
            <p style={{ 
              marginBottom: '1rem', 
              color: 'var(--gray-500)',
              fontSize: '0.875rem'
            }}>
              {items.length} items encontrados
            </p>

            <div className="item-list">
              {items.map(item => (
                <div
                  key={item.id}
                  className="item-card"
                  onClick={() => openItemDetail(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.foto_principal ? (
                    <img 
                      src={item.foto_principal} 
                      alt="" 
                      className="item-card-image"
                    />
                  ) : (
                    <div 
                      className="item-card-image"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Image size={24} color="var(--gray-400)" />
                    </div>
                  )}
                  <div className="item-card-content">
                    <div className="item-card-title">
                      {item.nombre || item.categoria_manual || item.categoria_yolo || 'Sin nombre'}
                    </div>
                    <div className="item-card-meta">
                      {item.estanteria_nombre} → Balda {item.balda_numero} → Caja {item.caja_numero}
                    </div>
                    <span className={`item-card-badge ${item.revisado ? 'badge-reviewed' : 'badge-pending'}`}>
                      {item.revisado ? 'Revisado' : 'Pendiente'}
                    </span>
                  </div>
                  <ChevronRight size={20} color="var(--gray-400)" />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal de detalle */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle del item</h3>
              <button 
                className="btn btn-icon"
                onClick={() => setSelectedItem(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Imagen */}
              {selectedItem.fotos?.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  <img 
                    src={selectedItem.fotos[0].filepath}
                    alt=""
                    style={{ 
                      width: '100%', 
                      borderRadius: '0.5rem',
                      maxHeight: '250px',
                      objectFit: 'contain',
                      background: 'var(--gray-100)'
                    }}
                  />
                  {selectedItem.fotos.length > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      marginTop: '0.5rem',
                      overflowX: 'auto'
                    }}>
                      {selectedItem.fotos.slice(1).map(foto => (
                        <img 
                          key={foto.id}
                          src={foto.filepath}
                          alt=""
                          style={{ 
                            width: '60px', 
                            height: '60px',
                            borderRadius: '0.25rem',
                            objectFit: 'cover'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  height: '150px', 
                  background: 'var(--gray-100)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Image size={48} color="var(--gray-400)" />
                </div>
              )}

              {/* Info */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>
                  {selectedItem.nombre || 'Sin nombre'}
                </h4>
                {selectedItem.descripcion && (
                  <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    {selectedItem.descripcion}
                  </p>
                )}
              </div>

              {/* Ubicación */}
              <div className="card" style={{ background: 'var(--gray-50)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                  Ubicación
                </div>
                <div style={{ fontWeight: 500 }}>
                  {selectedItem.estanteria_nombre} → Balda {selectedItem.balda_numero} → Caja {selectedItem.caja_numero}
                </div>
              </div>

              {/* Categorías */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {selectedItem.categoria_manual && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Categoría</div>
                    <div style={{ fontWeight: 500 }}>{selectedItem.categoria_manual}</div>
                  </div>
                )}
                {selectedItem.categoria_yolo && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>YOLO detectó</div>
                    <div style={{ fontWeight: 500 }}>
                      {selectedItem.categoria_yolo}
                      {selectedItem.confianza_yolo && (
                        <span style={{ fontWeight: 'normal', color: 'var(--gray-500)' }}>
                          {' '}({Math.round(selectedItem.confianza_yolo * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div>
                <span className={`item-card-badge ${selectedItem.revisado ? 'badge-reviewed' : 'badge-pending'}`}>
                  {selectedItem.revisado ? 'Revisado' : 'Pendiente de revisión'}
                </span>
              </div>

              {/* Botón Re-detectar */}
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: '1rem' }}
                onClick={handleRedetectar}
                disabled={detecting}
              >
                {detecting ? (
                  <>
                    <Loader2 size={20} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                    Detectando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Re-detectar con YOLO
                  </>
                )}
              </button>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedItem(null)}
              >
                Cerrar
              </button>
              {!selectedItem.revisado && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedItem(null)
                    navigate('/revision')
                  }}
                >
                  Revisar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
