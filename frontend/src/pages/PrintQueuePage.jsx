import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Printer, FileText, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getQueue, 
  getSheets, 
  createSheet, 
  deleteSheet,
  assignLabelToSheet,
  removeLabelFromSheet,
  clearQueue,
  clearSheet
} from '../utils/printQueue'

export default function PrintQueuePage() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const [sheets, setSheets] = useState([])
  const [selectedSheet, setSelectedSheet] = useState(null)
  const [draggedLabel, setDraggedLabel] = useState(null)
  const [draggedFromPosition, setDraggedFromPosition] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setQueue(getQueue())
    const loadedSheets = getSheets()
    setSheets(loadedSheets)
    if (loadedSheets.length > 0 && !selectedSheet) {
      setSelectedSheet(loadedSheets[0])
    }
  }

  const handleCreateSheet = () => {
    const newSheet = createSheet()
    loadData()
    setSelectedSheet(newSheet)
  }

  const handleDeleteSheet = (sheetId) => {
    if (!confirm('¿Eliminar esta hoja? Las etiquetas volverán a la cola.')) return
    deleteSheet(sheetId)
    loadData()
    if (selectedSheet?.id === sheetId) {
      setSelectedSheet(null)
    }
  }

  const handleClearSheet = (sheetId) => {
    if (!confirm('¿Limpiar esta hoja? Las etiquetas volverán a la cola.')) return
    clearSheet(sheetId)
    loadData()
  }

  const handleDragStart = (label, fromPosition = null) => {
    setDraggedLabel(label)
    setDraggedFromPosition(fromPosition)
  }

  const handleDrop = (position) => {
    if (draggedLabel && selectedSheet) {
      // Si viene de otra posición, quitarla primero
      if (draggedFromPosition !== null && draggedFromPosition !== position) {
        removeLabelFromSheet(selectedSheet.id, draggedFromPosition)
      }
      
      // Si la posición está ocupada, mover la etiqueta existente de vuelta a la cola
      const existingLabel = selectedSheet.positions[position]
      if (existingLabel && draggedFromPosition !== position) {
        removeLabelFromSheet(selectedSheet.id, position)
      }
      
      // Solo asignar si no es la misma posición
      if (draggedFromPosition !== position) {
        assignLabelToSheet(selectedSheet.id, position, draggedLabel)
      }
      
      setDraggedLabel(null)
      setDraggedFromPosition(null)
      loadData()
    }
  }

  const handleRemoveFromPosition = (position) => {
    if (selectedSheet) {
      removeLabelFromSheet(selectedSheet.id, position)
      loadData()
    }
  }

  const handlePrintSheet = (sheet) => {
    // Navegar a la página de impresión (muestra todas las hojas)
    navigate('/print-sheet')
  }

  const handleAutoAssign = () => {
    let currentQueue = [...getQueue()]
    let currentSheets = getSheets()
    
    // Si no hay hojas, crear una
    if (currentSheets.length === 0) {
      const newSheet = createSheet()
      currentSheets = getSheets() // Recargar después de crear
      setSelectedSheet(currentSheets[0])
    }

    let assignedCount = 0
    
    // Iterar sobre cada etiqueta en la cola
    for (const label of currentQueue) {
      let assigned = false
      
      // Recargar hojas para tener datos actualizados
      currentSheets = getSheets()
      
      // Buscar una posición vacía en las hojas existentes
      for (const sheet of currentSheets) {
        const emptyPositionIndex = sheet.positions.findIndex(pos => pos === null)
        if (emptyPositionIndex !== -1) {
          assignLabelToSheet(sheet.id, emptyPositionIndex, label)
          assigned = true
          assignedCount++
          break
        }
      }
      
      // Si no se encontró espacio, crear nueva hoja
      if (!assigned) {
        createSheet()
        currentSheets = getSheets() // Recargar después de crear
        const newSheet = currentSheets[currentSheets.length - 1]
        assignLabelToSheet(newSheet.id, 0, label)
        assignedCount++
      }
    }

    loadData()
    if (assignedCount > 0) {
      toast.success(`${assignedCount} etiqueta${assignedCount > 1 ? 's asignadas' : ' asignada'} automáticamente`)
    }
  }

  const getPositionLabel = (index) => {
    const row = Math.floor(index / 2) + 1
    const col = (index % 2) + 1
    return `${row}-${col}`
  }

  return (
    <>
      <header className="header">
        <button className="header-back" onClick={() => navigate('/ubicaciones')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Cola de Impresión</h1>
        {queue.length > 0 && (
          <button 
            className="header-back" 
            style={{ marginLeft: 'auto' }}
            onClick={handleAutoAssign}
            title="Asignar automáticamente"
          >
            <Sparkles size={20} />
          </button>
        )}
        <button 
          className="header-back" 
          onClick={handleCreateSheet}
        >
          <Plus size={20} />
        </button>
      </header>

      <main className="main-content">
        {/* Cola de etiquetas pendientes */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">
              Etiquetas Pendientes ({queue.length})
            </h2>
            {queue.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Limpiar toda la cola?')) {
                    clearQueue()
                    loadData()
                  }
                }}
                className="button button-outline"
                style={{ padding: '0.5rem', minWidth: 'auto' }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: 'var(--gray-400)' 
            }}>
              No hay etiquetas en cola. Añade etiquetas desde la página de ubicaciones.
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.75rem',
              padding: '1rem 0'
            }}>
              {queue.map(label => (
                <div
                  key={label.id}
                  draggable
                  onDragStart={() => handleDragStart(label)}
                  style={{
                    border: '2px solid var(--primary)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    cursor: 'grab',
                    backgroundColor: 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                  onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                >
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: 'var(--primary)'
                  }}>
                    {label.type === 'caja' ? '📦 Caja' : '📋 Balda'}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {label.type === 'caja' 
                      ? (label.data.etiqueta || `Caja ${label.data.numero}`)
                      : `Balda ${label.data.numero}`
                    }
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)',
                    marginTop: '0.25rem'
                  }}>
                    {label.data.estanteria_nombre}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pestañas de hojas */}
        {sheets.length > 0 && (
          <>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              {sheets.map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet)}
                  className="button"
                  style={{
                    backgroundColor: selectedSheet?.id === sheet.id ? 'var(--primary)' : 'white',
                    color: selectedSheet?.id === sheet.id ? 'white' : 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <FileText size={16} />
                  {sheet.name}
                </button>
              ))}
            </div>

            {/* Vista de hoja A4 */}
            {selectedSheet && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">{selectedSheet.name}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handlePrintSheet(selectedSheet)}
                      className="button button-primary"
                      disabled={selectedSheet.positions.every(p => p === null)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      <Printer size={16} />
                      Imprimir
                    </button>
                    <button
                      onClick={() => handleClearSheet(selectedSheet.id)}
                      className="button button-outline"
                      style={{ padding: '0.5rem', minWidth: 'auto' }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSheet(selectedSheet.id)}
                      className="button button-outline"
                      style={{ 
                        padding: '0.5rem', 
                        minWidth: 'auto',
                        color: 'var(--error)',
                        borderColor: 'var(--error)'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Grid de 8 posiciones (2x4) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '8px'
                }}>
                  {selectedSheet.positions.map((label, index) => (
                    <div
                      key={index}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(index)}
                      style={{
                        border: '2px dashed var(--gray-300)',
                        borderRadius: '8px',
                        padding: '1rem',
                        minHeight: '120px',
                        backgroundColor: label ? 'white' : 'transparent',
                        borderColor: label ? 'var(--success)' : 'var(--gray-300)',
                        borderStyle: label ? 'solid' : 'dashed',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--gray-400)',
                        fontWeight: '600'
                      }}>
                        {getPositionLabel(index)}
                      </div>

                      {label ? (
                        <>
                          <button
                            onClick={() => handleRemoveFromPosition(index)}
                            style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              background: 'var(--error)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              zIndex: 1
                            }}
                            title="Quitar de esta posición"
                          >
                            <X size={14} />
                          </button>
                          <div
                            draggable
                            onDragStart={() => handleDragStart(label, index)}
                            style={{
                              cursor: 'grab',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                            onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                          >
                            <div style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              marginBottom: '0.25rem',
                              color: 'var(--primary)'
                            }}>
                              {label.type === 'caja' ? '📦 Caja' : '📋 Balda'}
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {label.type === 'caja' 
                                ? (label.data.etiqueta || `Caja ${label.data.numero}`)
                                : `Balda ${label.data.numero}`
                              }
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--gray-500)',
                              marginTop: '0.25rem'
                            }}>
                              {label.data.estanteria_nombre}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          color: 'var(--gray-400)',
                          fontSize: '0.875rem'
                        }}>
                          Arrastra aquí
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {sheets.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <FileText size={48} style={{ 
              margin: '0 auto 1rem', 
              color: 'var(--gray-400)' 
            }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No hay hojas creadas</h3>
            <p style={{ 
              color: 'var(--gray-500)', 
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              Crea una hoja para organizar tus etiquetas antes de imprimir
            </p>
            <button 
              className="button button-primary"
              onClick={handleCreateSheet}
            >
              <Plus size={20} />
              Crear Primera Hoja
            </button>
          </div>
        )}
      </main>
    </>
  )
}
