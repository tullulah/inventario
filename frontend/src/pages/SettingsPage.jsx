import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, FolderOpen, Layers, Box, Globe } from 'lucide-react'
import { 
  getEstanterias, createEstanteria, updateEstanteria, deleteEstanteria,
  getBaldas, createBalda, deleteBalda,
  getCajas, createCaja, deleteCaja,
  getCategorias, createCategoria, deleteCategoria
} from '../api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('ubicaciones')
  const [toast, setToast] = useState(null)

  // Estado de ubicaciones
  const [estanterias, setEstanterias] = useState([])
  const [selectedEstanteria, setSelectedEstanteria] = useState(null)
  const [baldas, setBaldas] = useState([])
  const [selectedBalda, setSelectedBalda] = useState(null)
  const [cajas, setCajas] = useState([])

  // Estado de categorías
  const [categorias, setCategorias] = useState([])

  // Estado de configuración
  const [baseUrl, setBaseUrl] = useState('')
  const [editingUrl, setEditingUrl] = useState(false)

  // Modales
  const [showNewEstanteria, setShowNewEstanteria] = useState(false)
  const [newEstanteriaName, setNewEstanteriaName] = useState('')

  useEffect(() => {
    loadEstanterias()
    loadCategorias()
    loadConfig()
  }, [])

  const loadConfig = () => {
    const savedUrl = localStorage.getItem('baseUrl') || window.location.origin
    setBaseUrl(savedUrl)
  }

  const saveBaseUrl = () => {
    localStorage.setItem('baseUrl', baseUrl)
    setEditingUrl(false)
    showToast('URL guardada correctamente')
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // === ESTANTERÍAS ===
  const loadEstanterias = async () => {
    try {
      const data = await getEstanterias()
      setEstanterias(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCreateEstanteria = async () => {
    if (!newEstanteriaName.trim()) return
    try {
      await createEstanteria({ nombre: newEstanteriaName })
      setNewEstanteriaName('')
      setShowNewEstanteria(false)
      loadEstanterias()
      showToast('Estantería creada')
    } catch (error) {
      showToast('Error al crear estantería')
    }
  }

  const handleDeleteEstanteria = async (id) => {
    if (!confirm('¿Eliminar esta estantería y todo su contenido?')) return
    try {
      await deleteEstanteria(id)
      loadEstanterias()
      if (selectedEstanteria?.id === id) {
        setSelectedEstanteria(null)
        setBaldas([])
      }
      showToast('Estantería eliminada')
    } catch (error) {
      showToast('Error al eliminar')
    }
  }

  const selectEstanteria = async (est) => {
    setSelectedEstanteria(est)
    setSelectedBalda(null)
    setCajas([])
    try {
      const data = await getBaldas(est.id)
      setBaldas(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // === BALDAS ===
  const handleCreateBalda = async () => {
    if (!selectedEstanteria) return
    const numero = baldas.length + 1
    try {
      await createBalda(selectedEstanteria.id, { numero })
      const data = await getBaldas(selectedEstanteria.id)
      setBaldas(data)
      showToast('Balda creada')
    } catch (error) {
      showToast('Error al crear balda')
    }
  }

  const handleDeleteBalda = async (id) => {
    if (!confirm('¿Eliminar esta balda y todo su contenido?')) return
    try {
      await deleteBalda(id)
      const data = await getBaldas(selectedEstanteria.id)
      setBaldas(data)
      if (selectedBalda?.id === id) {
        setSelectedBalda(null)
        setCajas([])
      }
      showToast('Balda eliminada')
    } catch (error) {
      showToast('Error al eliminar')
    }
  }

  const selectBalda = async (balda) => {
    setSelectedBalda(balda)
    try {
      const data = await getCajas(balda.id)
      setCajas(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // === CAJAS ===
  const handleCreateCaja = async () => {
    if (!selectedBalda) return
    const numero = cajas.length + 1
    try {
      await createCaja(selectedBalda.id, { numero })
      const data = await getCajas(selectedBalda.id)
      setCajas(data)
      showToast('Caja creada')
    } catch (error) {
      showToast('Error al crear caja')
    }
  }

  const handleDeleteCaja = async (id) => {
    if (!confirm('¿Eliminar esta caja y todo su contenido?')) return
    try {
      await deleteCaja(id)
      const data = await getCajas(selectedBalda.id)
      setCajas(data)
      showToast('Caja eliminada')
    } catch (error) {
      showToast('Error al eliminar')
    }
  }

  // === CATEGORÍAS ===
  const loadCategorias = async () => {
    try {
      const data = await getCategorias()
      setCategorias(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const [newCategoriaName, setNewCategoriaName] = useState('')
  const handleCreateCategoria = async () => {
    if (!newCategoriaName.trim()) return
    try {
      await createCategoria({ nombre: newCategoriaName })
      setNewCategoriaName('')
      loadCategorias()
      showToast('Categoría creada')
    } catch (error) {
      showToast('Error al crear categoría')
    }
  }

  const handleDeleteCategoria = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await deleteCategoria(id)
      loadCategorias()
      showToast('Categoría eliminada')
    } catch (error) {
      showToast('Error al eliminar')
    }
  }

  return (
    <>
      <header className="header">
        <button className="header-back" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Ajustes</h1>
      </header>

      <main className="main-content">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'ubicaciones' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => setActiveTab('ubicaciones')}
          >
            <Layers size={18} />
            Ubicaciones
          </button>
          <button
            className={`btn ${activeTab === 'categorias' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => setActiveTab('categorias')}
          >
            <FolderOpen size={18} />
            Categorías
          </button>
          <button
            className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => setActiveTab('config')}
          >
            <Globe size={18} />
            Config
          </button>
        </div>

        {/* Tab: Ubicaciones */}
        {activeTab === 'ubicaciones' && (
          <>
            {/* Estanterías */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Estanterías</h3>
                <button 
                  className="btn btn-primary btn-icon"
                  onClick={() => setShowNewEstanteria(true)}
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {estanterias.length === 0 ? (
                <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>
                  No hay estanterías. Crea una para empezar.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {estanterias.map(est => (
                    <div 
                      key={est.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: selectedEstanteria?.id === est.id ? '#eff6ff' : 'var(--gray-50)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => selectEstanteria(est)}
                    >
                      <Layers size={20} color="var(--primary)" />
                      <span style={{ flex: 1, fontWeight: 500 }}>{est.nombre}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        {est.num_baldas || 0} baldas
                      </span>
                      <button 
                        className="btn btn-icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEstanteria(est.id)
                        }}
                      >
                        <Trash2 size={16} color="var(--danger)" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Baldas */}
            {selectedEstanteria && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    Baldas de {selectedEstanteria.nombre}
                  </h3>
                  <button 
                    className="btn btn-primary btn-icon"
                    onClick={handleCreateBalda}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {baldas.length === 0 ? (
                  <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>
                    Sin baldas. Añade una.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {baldas.map(balda => (
                      <div 
                        key={balda.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: selectedBalda?.id === balda.id ? '#eff6ff' : 'var(--gray-50)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => selectBalda(balda)}
                      >
                        <span style={{ flex: 1, fontWeight: 500 }}>Balda {balda.numero}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          {balda.num_cajas || 0} cajas
                        </span>
                        <button 
                          className="btn btn-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBalda(balda.id)
                          }}
                        >
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cajas */}
            {selectedBalda && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    Cajas de Balda {selectedBalda.numero}
                  </h3>
                  <button 
                    className="btn btn-primary btn-icon"
                    onClick={handleCreateCaja}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {cajas.length === 0 ? (
                  <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>
                    Sin cajas. Añade una.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {cajas.map(caja => (
                      <div 
                        key={caja.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--gray-50)',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <Box size={16} color="var(--gray-500)" />
                        <span>{caja.etiqueta || `Caja ${caja.numero}`}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          ({caja.num_items || 0})
                        </span>
                        <button 
                          className="btn btn-icon"
                          style={{ padding: '0.25rem' }}
                          onClick={() => handleDeleteCaja(caja.id)}
                        >
                          <X size={14} color="var(--danger)" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab: Categorías */}
        {activeTab === 'categorias' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Categorías personalizadas</h3>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Nueva categoría..."
                value={newCategoriaName}
                onChange={(e) => setNewCategoriaName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategoria()}
              />
              <button 
                className="btn btn-primary"
                onClick={handleCreateCategoria}
              >
                <Plus size={20} />
              </button>
            </div>

            {categorias.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>
                No hay categorías personalizadas.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {categorias.map(cat => (
                  <div 
                    key={cat.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--gray-100)',
                      borderRadius: '1rem'
                    }}
                  >
                    <span>{cat.nombre}</span>
                    <button 
                      className="btn btn-icon"
                      style={{ padding: '0.25rem' }}
                      onClick={() => handleDeleteCategoria(cat.id)}
                    >
                      <X size={14} color="var(--danger)" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Configuración */}
        {activeTab === 'config' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">URL de la Aplicación</h3>
            </div>
            
            <div style={{ padding: '1rem' }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--gray-600)', 
                marginBottom: '1rem' 
              }}>
                Esta URL se usará en los códigos QR de las etiquetas. 
                Configúrala con la IP fija de tu Raspberry Pi.
              </p>

              <div className="form-group">
                <label className="form-label">URL Base</label>
                {editingUrl ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      className="form-input"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://192.168.1.100:5173"
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="button button-primary"
                      onClick={saveBaseUrl}
                      style={{ minWidth: 'auto', padding: '0 1rem' }}
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      className="button button-outline"
                      onClick={() => {
                        loadConfig()
                        setEditingUrl(false)
                      }}
                      style={{ minWidth: 'auto', padding: '0 1rem' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--gray-50)'
                  }}>
                    <code style={{ flex: 1, fontSize: '0.875rem' }}>{baseUrl}</code>
                    <button 
                      className="button button-outline"
                      onClick={() => setEditingUrl(true)}
                      style={{ minWidth: 'auto', padding: '0.5rem' }}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                backgroundColor: 'var(--gray-50)',
                borderRadius: '8px',
                border: '1px solid var(--gray-200)'
              }}>
                <h4 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem' 
                }}>
                  Ejemplos de configuración:
                </h4>
                <ul style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-600)',
                  paddingLeft: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  <li>Desarrollo: <code>http://localhost:5173</code></li>
                  <li>IP local: <code>http://192.168.1.100:5173</code></li>
                  <li>Dominio: <code>https://inventario.midominio.com</code></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal nueva estantería */}
      {showNewEstanteria && (
        <div className="modal-overlay" onClick={() => setShowNewEstanteria(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Estantería</h3>
              <button 
                className="btn btn-icon"
                onClick={() => setShowNewEstanteria(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEstanteriaName}
                  onChange={(e) => setNewEstanteriaName(e.target.value)}
                  placeholder="Ej: Estantería D"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowNewEstanteria(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateEstanteria}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
