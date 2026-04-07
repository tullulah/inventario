import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, X } from 'lucide-react'
import { getItems, deleteItem, updateItem } from '../api'

export default function CajaDetailPage() {
  const { cajaId } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cajaInfo, setCajaInfo] = useState(null)
  const [showMoveDialog, setShowMoveDialog] = useState(null)
  const [zoomedImage, setZoomedImage] = useState(null)

  useEffect(() => {
    loadItems()
  }, [cajaId])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await getItems({ caja_id: cajaId })
      setItems(data)
      if (data.length > 0) {
        setCajaInfo({
          caja_numero: data[0].caja_numero,
          caja_etiqueta: data[0].caja_etiqueta,
          balda_numero: data[0].balda_numero,
          estanteria_nombre: data[0].estanteria_nombre
        })
      }
    } catch (error) {
      console.error('Error cargando items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('¿Eliminar este item?')) return
    try {
      await deleteItem(itemId)
      loadItems()
    } catch (error) {
      console.error('Error eliminando item:', error)
    }
  }

  return (
    <>
      <header className="header">
        <button className="header-back" onClick={() => navigate('/ubicaciones')}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1>{cajaInfo?.caja_etiqueta || `Caja ${cajaInfo?.caja_numero || ''}`}</h1>
          {cajaInfo && (
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
              {cajaInfo.estanteria_nombre} - Balda {cajaInfo.balda_numero}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Cargando...
          </div>
        ) : (
          <>
            <button
              onClick={() => navigate('/captura', { 
                state: { cajaId: parseInt(cajaId) } 
              })}
              className="button button-primary"
              style={{ marginBottom: '1rem', width: '100%' }}
            >
              <Plus size={20} />
              Añadir Item
            </button>

            {items.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--gray-400)'
              }}>
                Esta caja está vacía
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map(item => (
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
                        onClick={() => setZoomedImage(item.foto_principal)}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      />
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {item.categoria_manual || item.nombre || item.descripcion || item.categoria_yolo || 'Item sin nombre'}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--gray-400)' 
                      }}>
                        Cantidad: {item.cantidad}
                      </div>
                    </div>

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
          </>
        )}
      </main>

      {/* Modal de imagen ampliada */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1001
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={zoomedImage}
            alt="Vista ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </>
  )
}
