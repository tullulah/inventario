import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { getArbolUbicaciones, getItems } from '../api'

export default function BaldaDetailPage() {
  const { baldaId } = useParams()
  const navigate = useNavigate()
  const [cajas, setCajas] = useState([])
  const [baldaInfo, setBaldaInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBalda()
  }, [baldaId])

  const loadBalda = async () => {
    try {
      setLoading(true)
      const arbol = await getArbolUbicaciones()
      
      // Buscar la balda en el árbol
      for (const estanteria of arbol) {
        const balda = estanteria.baldas.find(b => b.id === parseInt(baldaId))
        if (balda) {
          setBaldaInfo({
            numero: balda.numero,
            descripcion: balda.descripcion,
            estanteria_nombre: estanteria.nombre
          })
          setCajas(balda.cajas)
          break
        }
      }
    } catch (error) {
      console.error('Error cargando balda:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="header">
        <button className="header-back" onClick={() => navigate('/ubicaciones')}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1>Balda {baldaInfo?.numero || ''}</h1>
          {baldaInfo && (
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
              {baldaInfo.estanteria_nombre}
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
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Cajas en esta balda
              </h2>
              
              {cajas.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: 'var(--gray-400)'
                }}>
                  No hay cajas en esta balda
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '1rem'
                }}>
                  {cajas.map(caja => (
                    <button
                      key={caja.id}
                      onClick={() => navigate(`/caja/${caja.id}`)}
                      style={{
                        border: '2px solid var(--primary)',
                        borderRadius: '8px',
                        padding: '1rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
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
                      <Package size={32} style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        marginBottom: '0.25rem'
                      }}>
                        {caja.etiqueta || `Caja ${caja.numero}`}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--gray-400)' 
                      }}>
                        {caja.num_items || 0} items
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  )
}
