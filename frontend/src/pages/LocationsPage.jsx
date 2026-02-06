import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Plus, X, Minus, ArrowRight, Printer, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getArbolUbicaciones, getItems, deleteItem, updateItem, createCaja, deleteCaja, updateCaja } from '../api'
import LabelPrint from '../components/LabelPrint'
import AppHeader from '../components/AppHeader'
import { addToQueue, getQueue } from '../utils/printQueue'
import { BOX_CATEGORIES, getCategoryIcon } from '../constants/boxCategories'

export default function LocationsPage() {
  const navigate = useNavigate()
  const [ubicaciones, setUbicaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCaja, setSelectedCaja] = useState(null)
  const [cajaItems, setCajaItems] = useState([])
  const [showMoveDialog, setShowMoveDialog] = useState(null)
  const [labelToPrint, setLabelToPrint] = useState(null)
  const [newCajaNumbers, setNewCajaNumbers] = useState({})
  const [editingCaja, setEditingCaja] = useState(null)
  const [editForm, setEditForm] = useState({ descripcion: '', categoria: '' })

  useEffect(() => {
    loadUbicaciones()
  }, [])

  const loadUbicaciones = async () => {
    try {
      setLoading(true)
      const data = await getArbolUbicaciones()
      setUbicaciones(data)
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCajaItems = async (caja) => {
    try {
      const items = await getItems({ caja_id: caja.id })
      setCajaItems(items)
      setSelectedCaja(caja)
    } catch (error) {
      console.error('Error cargando items:', error)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('¿Eliminar este item?')) return
    try {
      await deleteItem(itemId)
      loadCajaItems(selectedCaja)
    } catch (error) {
      console.error('Error eliminando item:', error)
    }
  }

  const handleMoveItem = async (itemId, newCajaId) => {
    try {
      await updateItem(itemId, { caja_id: newCajaId })
      loadCajaItems(selectedCaja)
      setShowMoveDialog(null)
    } catch (error) {
      console.error('Error moviendo item:', error)
    }
  }

  const handleCreateCaja = async (baldaId) => {
    const totalCajas = parseInt(newCajaNumbers[baldaId])
    if (!totalCajas || isNaN(totalCajas) || totalCajas <= 0) return

    try {
      // Encontrar la balda actual
      const balda = ubicaciones
        .flatMap(e => e.baldas)
        .find(b => b.id === baldaId)
      
      if (!balda) return

      const cajasActuales = balda.cajas.length
      
      if (totalCajas <= cajasActuales) {
        toast.error(`Ya hay ${cajasActuales} cajas. Especifica un número mayor.`)
        return
      }

      // Crear las cajas faltantes
      for (let i = cajasActuales + 1; i <= totalCajas; i++) {
        await createCaja(baldaId, { numero: i })
      }

      setNewCajaNumbers({ ...newCajaNumbers, [baldaId]: '' })
      loadUbicaciones()
    } catch (error) {
      console.error('Error creando cajas:', error)
      toast.error(error.message)
    }
  }

  const handleDeleteCaja = async (cajaId, cajaNumero) => {
    if (!confirm(`¿Eliminar Caja ${cajaNumero}?`)) return
    
    try {
      await deleteCaja(cajaId)
      loadUbicaciones()
    } catch (error) {
      console.error('Error eliminando caja:', error)
      toast.error(error.message)
    }
  }

  const handleAddToQueue = (type, data) => {
    addToQueue(type, data)
    const event = new CustomEvent('labelAddedToQueue')
    window.dispatchEvent(event)
  }

  const handleAddBaldaCajasToQueue = (balda, estanteriaNombre) => {
    const queue = getQueue()
    const existingIds = new Set(
      queue
        .filter(item => item.type === 'caja')
        .map(item => item.data.id)
    )

    let addedCount = 0
    balda.cajas.forEach(caja => {
      if (!existingIds.has(caja.id)) {
        addToQueue('caja', {
          ...caja,
          estanteria_nombre: estanteriaNombre,
          balda_numero: balda.numero
        })
        addedCount++
      }
    })

    if (addedCount > 0) {
      const event = new CustomEvent('labelAddedToQueue')
      window.dispatchEvent(event)
      toast.success(`${addedCount} etiqueta${addedCount > 1 ? 's' : ''} añadida${addedCount > 1 ? 's' : ''} a la cola`)
    } else {
      toast.info('Todas las cajas ya están en la cola')
    }
  }

  const handleEditCaja = (caja) => {
    setEditingCaja(caja)
    setEditForm({
      descripcion: caja.descripcion || '',
      categoria: caja.categoria || 'general'
    })
  }

  const handleSaveEditCaja = async () => {
    if (!editingCaja) return
    
    try {
      await updateCaja(editingCaja.id, {
        numero: editingCaja.numero,
        etiqueta: editingCaja.etiqueta,
        descripcion: editForm.descripcion,
        categoria: editForm.categoria
      })
      
      setEditingCaja(null)
      setEditForm({ descripcion: '', categoria: '' })
      loadUbicaciones()
      toast.success('Caja actualizada')
    } catch (error) {
      console.error('Error actualizando caja:', error)
      toast.error(error.message)
    }
  }

  return (
    <>
      <AppHeader 
        title="Ubicaciones"
        onRefresh={loadUbicaciones}
      />

      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Cargando...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {ubicaciones.map(estanteria => (
              <div key={estanteria.id} className="card">
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: 'var(--primary)'
                }}>
                  {estanteria.nombre}
                </h2>
                {estanteria.descripcion && (
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--gray-400)', 
                    marginBottom: '1rem' 
                  }}>
                    {estanteria.descripcion}
                  </p>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {estanteria.baldas.map(balda => (
                    <div 
                      key={balda.id}
                      style={{
                        border: '2px solid var(--gray-200)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        backgroundColor: 'var(--gray-50)'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        marginBottom: '0.5rem',
                        color: 'var(--gray-600)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>Balda {balda.numero}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Total"
                            min="1"
                            value={newCajaNumbers[balda.id] || ''}
                            onChange={(e) => setNewCajaNumbers({ ...newCajaNumbers, [balda.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateCaja(balda.id)
                              }
                            }}
                            style={{
                              width: '60px',
                              padding: '0.25rem',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              textAlign: 'center'
                            }}
                            title={`Actualmente ${balda.cajas.length} cajas. Añade hasta el número que especifiques.`}
                          />
                          <button
                            onClick={() => handleCreateCaja(balda.id)}
                            style={{
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Añadir caja"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setLabelToPrint({
                                type: 'balda',
                                data: {
                                  ...balda,
                                  estanteria_nombre: estanteria.nombre,
                                  num_cajas: balda.cajas.length
                                }
                              })
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              color: 'var(--gray-600)'
                            }}
                          >
                            <Printer size={14} />
                            Etiqueta
                          </button>
                          {balda.cajas.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddBaldaCajasToQueue(balda, estanteria.nombre)
                              }}
                              style={{
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem'
                              }}
                              title="Añadir todas las cajas a la cola"
                            >
                              <Printer size={14} />
                              Todas
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {balda.cajas.map(caja => {
                          const categoryInfo = getCategoryIcon(caja.categoria)
                          const CategoryIcon = categoryInfo.icon
                          
                          return (
                          <div key={caja.id} style={{ position: 'relative' }}>
                            <button
                              onClick={() => loadCajaItems(caja)}
                              style={{
                                width: '100%',
                                border: '2px solid var(--primary)',
                                borderRadius: '6px',
                                padding: '0.75rem',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'center',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)'
                                e.currentTarget.style.borderColor = 'var(--primary-dark)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.borderColor = 'var(--primary)'
                              }}
                            >
                              {caja.categoria ? (
                                <CategoryIcon 
                                  size={24} 
                                  style={{ 
                                    margin: '0 auto 0.25rem',
                                    color: categoryInfo.color 
                                  }} 
                                />
                              ) : (
                                <Package size={24} style={{ margin: '0 auto 0.25rem' }} />
                              )}
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '600',
                                marginBottom: '0.25rem'
                              }}>
                                {caja.etiqueta || `Caja ${caja.numero}`}
                              </div>
                              {caja.descripcion && (
                                <div style={{ 
                                  fontSize: '0.625rem', 
                                  color: 'var(--gray-500)',
                                  marginBottom: '0.25rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {caja.descripcion}
                                </div>
                              )}
                              <div style={{ 
                                fontSize: '0.625rem', 
                                color: 'var(--gray-400)' 
                              }}>
                                {caja.num_items || 0} items
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditCaja(caja)
                              }}
                              style={{
                                position: 'absolute',
                                top: '0.25rem',
                                left: '0.25rem',
                                background: 'white',
                                border: '1px solid var(--gray-300)',
                                borderRadius: '4px',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 1
                              }}
                              title="Editar caja"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToQueue('caja', {
                                  ...caja,
                                  estanteria_nombre: estanteria.nombre,
                                  balda_numero: balda.numero
                                })
                              }}
                              style={{
                                position: 'absolute',
                                top: '0.25rem',
                                right: '0.25rem',
                                background: 'white',
                                border: '1px solid var(--gray-300)',
                                borderRadius: '4px',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 1
                              }}
                              title="Añadir etiqueta a cola"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCaja(caja.id, caja.numero)
                              }}
                              style={{
                                position: 'absolute',
                                bottom: '0.25rem',
                                right: '0.25rem',
                                background: 'white',
                                border: '1px solid var(--error)',
                                borderRadius: '4px',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--error)',
                                zIndex: 1
                              }}
                              title="Eliminar caja"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )})}
                        
                        {balda.cajas.length === 0 && (
                          <div style={{ 
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '1rem',
                            color: 'var(--gray-400)',
                            fontSize: '0.875rem'
                          }}>
                            Sin cajas
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de contenido de caja */}
        {selectedCaja && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setSelectedCaja(null)}
          >
            <div 
              className="card"
              style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCaja(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)'
                }}
              >
                <X size={24} />
              </button>

              <h2 style={{ marginBottom: '0.5rem' }}>
                {selectedCaja.etiqueta || `Caja ${selectedCaja.numero}`}
              </h2>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {cajaItems.length} items
              </p>

              <button
                onClick={() => navigate('/captura', { 
                  state: { cajaId: selectedCaja.id } 
                })}
                className="button button-primary"
                style={{ marginBottom: '1rem', width: '100%' }}
              >
                <Plus size={20} />
                Añadir Item
              </button>

              {cajaItems.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: 'var(--gray-400)'
                }}>
                  Esta caja está vacía
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cajaItems.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      {item.foto_principal && (
                        <img 
                          src={item.foto_principal}
                          alt={item.nombre}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px'
                          }}
                        />
                      )}
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {item.nombre || item.categoria_yolo || 'Item sin nombre'}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--gray-400)' 
                        }}>
                          Cantidad: {item.cantidad}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowMoveDialog(item)}
                        className="button button-outline"
                        style={{ 
                          padding: '0.5rem',
                          minWidth: 'auto'
                        }}
                        title="Mover a otra caja"
                      >
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="button button-outline"
                        style={{ 
                          padding: '0.5rem',
                          minWidth: 'auto',
                          color: 'var(--error)',
                          borderColor: 'var(--error)'
                        }}
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de mover item */}
        {showMoveDialog && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setShowMoveDialog(null)}
          >
            <div 
              className="card"
              style={{
                maxWidth: '500px',
                width: '100%',
                maxHeight: '70vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '1rem' }}>
                Mover "{showMoveDialog.nombre || 'Item'}" a:
              </h3>

              {ubicaciones.map(estanteria => (
                <div key={estanteria.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    fontWeight: '600', 
                    marginBottom: '0.5rem',
                    color: 'var(--primary)'
                  }}>
                    {estanteria.nombre}
                  </div>
                  {estanteria.baldas.map(balda => (
                    <div key={balda.id} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        marginBottom: '0.25rem',
                        marginLeft: '0.5rem',
                        color: 'var(--gray-600)'
                      }}>
                        Balda {balda.numero}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '0.5rem',
                        marginLeft: '1rem'
                      }}>
                        {balda.cajas.map(caja => (
                          <button
                            key={caja.id}
                            onClick={() => handleMoveItem(showMoveDialog.id, caja.id)}
                            disabled={caja.id === selectedCaja.id}
                            className="button button-outline"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              opacity: caja.id === selectedCaja.id ? 0.5 : 1
                            }}
                          >
                            {caja.etiqueta || `Caja ${caja.numero}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <button
                onClick={() => setShowMoveDialog(null)}
                className="button button-outline"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Modal de edición de caja */}
        {editingCaja && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setEditingCaja(null)}
          >
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                Editar Caja {editingCaja.numero}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                  placeholder="Ej: Tornillos y herramientas pequeñas"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Categoría
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {BOX_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    const isSelected = editForm.categoria === cat.value
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setEditForm({ ...editForm, categoria: cat.value })}
                        style={{
                          border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--gray-300)',
                          borderRadius: '8px',
                          padding: '0.75rem 0.5rem',
                          backgroundColor: isSelected ? `${cat.color}10` : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = cat.color
                            e.currentTarget.style.backgroundColor = `${cat.color}05`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'var(--gray-300)'
                            e.currentTarget.style.backgroundColor = 'white'
                          }
                        }}
                      >
                        <Icon size={24} style={{ color: cat.color }} />
                        <span style={{ 
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          fontWeight: isSelected ? '600' : '400'
                        }}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setEditingCaja(null)}
                  className="button button-outline"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditCaja}
                  className="button button-primary"
                  style={{ flex: 1 }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Componente de impresión de etiquetas */}
        {labelToPrint && (
          <LabelPrint
            type={labelToPrint.type}
            data={labelToPrint.data}
            onClose={() => setLabelToPrint(null)}
          />
        )}
      </main>
    </>
  )
}
