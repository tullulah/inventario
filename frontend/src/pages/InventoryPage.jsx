import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Package, Image, ChevronRight, X, Sparkles, Loader2 } from 'lucide-react'
import { getItems, getArbolUbicaciones, getItem, updateItem, redetectarItem } from '../api'
import AppHeader from '../components/AppHeader'
import { ITEM_CATEGORIES } from '../utils/categories'

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
  const [editingItem, setEditingItem] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editCategoria, setEditCategoria] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')

  const suggestedCategories = ITEM_CATEGORIES

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadItems()
  }, [filter, searchTerm, ubicacionFilter, categoriaFilter])

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

      let data = await getItems(filters)
      
      // Filtrar por categoría en el frontend
      if (categoriaFilter === 'sin-categoria') {
        data = data.filter(item => !item.categoria_manual && !item.nombre)
      } else if (categoriaFilter) {
        data = data.filter(item => 
          item.categoria_manual === categoriaFilter || item.nombre === categoriaFilter
        )
      }
      
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
      setEditingItem(false)
      setEditNombre(fullItem.nombre || fullItem.categoria_manual || fullItem.descripcion || '')
      setEditCategoria(fullItem.categoria_manual || '')
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

  const handleSaveEdit = async () => {
    if (!selectedItem) return
    try {
      await updateItem(selectedItem.id, {
        nombre: editNombre || null,
        categoria_manual: editCategoria || null,
        revisado: true
      })
      showToast('Item actualizado correctamente')
      setEditingItem(false)
      loadItems()
      // Actualizar el item seleccionado
      setSelectedItem(prev => ({
        ...prev,
        nombre: editNombre,
        categoria_manual: editCategoria,
        revisado: true
      }))
    } catch (error) {
      showToast('Error al actualizar: ' + error.message)
    }
  }

  return (
    <>
      <AppHeader 
        title="Inventario" 
        icon={Package}
        onRefresh={loadData}
      />

      <main className="main-content">
        {/* Barra de búsqueda y filtros */}
        <div style={{ marginBottom: '1rem' }}>
          <form onSubmit={handleSearch} style={{ marginBottom: '0.75rem' }}>
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
          
          {/* Filtros de categoría y estado */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-input"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">📦 Todas las categorías</option>
              <option value="sin-categoria">🔍 Sin categoría</option>
              <optgroup label="Categorías">
                {suggestedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            </select>
            
            <button 
              className="header-back" 
              onClick={() => setShowFilters(!showFilters)}
              title="Más filtros"
              style={{ flexShrink: 0 }}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

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

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Categoría</label>
              <select
                className="form-input"
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                <option value="sin-categoria">🔍 Sin categoría</option>
                <optgroup label="Categorías">
                  {suggestedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {(ubicacionFilter || categoriaFilter) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                {ubicacionFilter && (
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setUbicacionFilter(null)}
                  >
                    Limpiar ubicación
                  </button>
                )}
                {categoriaFilter && (
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setCategoriaFilter('')}
                  >
                    Limpiar categoría
                  </button>
                )}
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
                      {item.categoria_manual || item.nombre || item.descripcion || item.categoria_yolo || 'Sin nombre'}
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
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedItem(null)}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflowY: 'auto'
          }}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              margin: '2rem auto',
              maxWidth: '500px'
            }}
          >
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
                {editingItem ? (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        placeholder="Nombre del item"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Categoría</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {suggestedCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            className={`btn ${editCategoria === cat ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setEditCategoria(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={editCategoria}
                        onChange={(e) => setEditCategoria(e.target.value)}
                        placeholder="O escribe una categoría..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setEditingItem(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleSaveEdit}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>
                      {selectedItem.categoria_manual || selectedItem.nombre || selectedItem.descripcion || 'Sin nombre'}
                    </h4>
                    {selectedItem.descripcion && (
                      <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        {selectedItem.descripcion}
                      </p>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: '0.5rem', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => setEditingItem(true)}
                    >
                      Editar
                    </button>
                  </div>
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
