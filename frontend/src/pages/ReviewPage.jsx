import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, X, Image, Sparkles, Crop, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getItemsPendientes, revisarItem, deleteItem, getCategorias, redetectarItem } from '../api'
import AppHeader from '../components/AppHeader'

export default function ReviewPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [detecting, setDetecting] = useState(false)
  
  // Campos editables
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaManual, setCategoriaManual] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Selector de área
  const [selectingArea, setSelectingArea] = useState(false)
  const [cropStart, setCropStart] = useState(null)
  const [cropEnd, setCropEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, categoriasData] = await Promise.all([
        getItemsPendientes(),
        getCategorias()
      ])
      setItems(itemsData)
      setCategorias(categoriasData)
      
      if (itemsData.length > 0) {
        updateFormFromItem(itemsData[0])
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFormFromItem = (item) => {
    setNombre(item.nombre || item.categoria_yolo || '')
    setDescripcion(item.descripcion || '')
    setCategoriaManual(item.categoria_manual || item.categoria_yolo || '')
    // Reset crop cuando cambia de item
    setSelectingArea(false)
    setCropStart(null)
    setCropEnd(null)
  }

  const currentItem = items[currentIndex]

  const goToItem = (index) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index)
      updateFormFromItem(items[index])
    }
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // Funciones de selección de área
  const getMousePos = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return {
      x: Math.max(0, Math.min(touch.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(touch.clientY - rect.top, rect.height))
    }
  }

  const handleMouseDown = (e) => {
    if (!selectingArea) return
    e.preventDefault()
    const pos = getMousePos(e)
    setCropStart(pos)
    setCropEnd(pos)
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !selectingArea) return
    e.preventDefault()
    setCropEnd(getMousePos(e))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getCropRect = () => {
    if (!cropStart || !cropEnd) return null
    return {
      left: Math.min(cropStart.x, cropEnd.x),
      top: Math.min(cropStart.y, cropEnd.y),
      width: Math.abs(cropEnd.x - cropStart.x),
      height: Math.abs(cropEnd.y - cropStart.y)
    }
  }

  const handleRedetectar = async (useCrop = false) => {
    if (!currentItem) return
    
    try {
      setDetecting(true)
      
      let result
      
      if (useCrop && cropStart && cropEnd && imageRef.current) {
        // Recortar la imagen y enviarla
        const img = imageRef.current
        const rect = containerRef.current.getBoundingClientRect()
        const scaleX = img.naturalWidth / rect.width
        const scaleY = img.naturalHeight / rect.height
        
        const cropRect = getCropRect()
        const canvas = document.createElement('canvas')
        canvas.width = cropRect.width * scaleX
        canvas.height = cropRect.height * scaleY
        const ctx = canvas.getContext('2d')
        
        ctx.drawImage(
          img,
          cropRect.left * scaleX,
          cropRect.top * scaleY,
          cropRect.width * scaleX,
          cropRect.height * scaleY,
          0, 0,
          canvas.width,
          canvas.height
        )
        
        // Convertir a blob y enviar
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
        const formData = new FormData()
        formData.append('file', blob, 'crop.jpg')
        
        const response = await fetch('http://localhost:8000/classify', {
          method: 'POST',
          body: formData
        })
        result = await response.json()
        
        if (result.success && result.primary_class) {
          // Actualizar en el backend
          await fetch(`/api/items/${currentItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...currentItem,
              categoria_yolo: result.primary_class,
              confianza_yolo: result.primary_confidence
            })
          })
        }
      } else {
        // Usar la imagen completa
        result = await redetectarItem(currentItem.id)
      }
      
      if (result.success && result.primary_class) {
        showToast(`Detectado: ${result.primary_class} (${Math.round(result.primary_confidence * 100)}%)`)
        setCategoriaManual(result.primary_class)
        // Actualizar item en la lista
        setItems(prev => prev.map((item, i) => 
          i === currentIndex 
            ? { ...item, categoria_yolo: result.primary_class, confianza_yolo: result.primary_confidence }
            : item
        ))
        setSelectingArea(false)
        setCropStart(null)
        setCropEnd(null)
      } else {
        showToast('No se detectó ningún objeto')
      }
    } catch (error) {
      showToast('Error al detectar: ' + error.message)
    } finally {
      setDetecting(false)
    }
  }

  const handleApprove = async () => {
    if (!currentItem) return

    try {
      setSaving(true)
      await revisarItem(currentItem.id, {
        nombre: nombre || null,
        descripcion: descripcion || null,
        categoria_manual: categoriaManual || null
      })

      // Remover item de la lista
      const newItems = items.filter((_, i) => i !== currentIndex)
      setItems(newItems)
      
      showToast('Item clasificado correctamente')

      // Ajustar índice si es necesario
      if (currentIndex >= newItems.length && newItems.length > 0) {
        setCurrentIndex(newItems.length - 1)
        updateFormFromItem(newItems[newItems.length - 1])
      } else if (newItems.length > 0) {
        updateFormFromItem(newItems[currentIndex])
      }
    } catch (error) {
      console.error('Error al aprobar:', error)
      showToast('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentItem) return

    try {
      setSaving(true)
      await deleteItem(currentItem.id)

      const newItems = items.filter((_, i) => i !== currentIndex)
      setItems(newItems)
      setShowDeleteConfirm(false)
      showToast('Item eliminado')

      if (currentIndex >= newItems.length && newItems.length > 0) {
        setCurrentIndex(newItems.length - 1)
        updateFormFromItem(newItems[newItems.length - 1])
      } else if (newItems.length > 0) {
        updateFormFromItem(newItems[currentIndex])
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      showToast('Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (currentIndex < items.length - 1) {
      goToItem(currentIndex + 1)
    }
  }

  // Categorías sugeridas basadas en YOLO
  const suggestedCategories = [
    'Herramientas',
    'Electrónica',
    'Cables',
    'Tornillería',
    'Decoración',
    'Libros',
    'Ropa',
    'Juguetes',
    'Cocina',
    'Otros'
  ]

  if (loading) {
    return (
      <>
        <AppHeader 
          title="Revisar Clasificaciones"
          icon={Check}
          showBack={true}
        />
        <main className="main-content">
          <div className="loader">
            <div className="spinner"></div>
          </div>
        </main>
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <AppHeader 
          title="Revisar Clasificaciones"
          icon={Check}
          showBack={true}
        />
        <main className="main-content">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Check size={64} color="var(--success)" />
            </div>
            <h2 className="empty-state-title">¡Todo revisado!</h2>
            <p>No hay items pendientes de clasificar</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AppHeader 
        title={`Revisar (${currentIndex + 1}/${items.length})`}
        icon={Check}
        showBack={true}
      />

      <main className="main-content">
        {/* Navegación entre items */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <button 
            className="btn btn-secondary btn-icon"
            onClick={() => goToItem(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>
          <span style={{ color: 'var(--gray-500)' }}>
            {items.length} pendientes
          </span>
          <button 
            className="btn btn-secondary btn-icon"
            onClick={() => goToItem(currentIndex + 1)}
            disabled={currentIndex === items.length - 1}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Imagen del item */}
        <div 
          className="card" 
          style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          {currentItem?.foto_principal ? (
            <>
              <img 
                ref={imageRef}
                src={currentItem.foto_principal} 
                alt="Item"
                style={{ 
                  width: '100%', 
                  maxHeight: '300px', 
                  objectFit: 'contain', 
                  background: 'var(--gray-100)',
                  cursor: selectingArea ? 'crosshair' : 'default',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                draggable={false}
              />
              {/* Overlay de selección */}
              {selectingArea && cropStart && cropEnd && (
                <div style={{
                  position: 'absolute',
                  left: getCropRect()?.left,
                  top: getCropRect()?.top,
                  width: getCropRect()?.width,
                  height: getCropRect()?.height,
                  border: '2px dashed #3b82f6',
                  background: 'rgba(59, 130, 246, 0.2)',
                  pointerEvents: 'none'
                }} />
              )}
              {selectingArea && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}>
                  Dibuja un rectángulo sobre el objeto
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--gray-100)'
            }}>
              <Image size={48} color="var(--gray-400)" />
            </div>
          )}
        </div>

        {/* Botones de detección */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {!selectingArea ? (
            <>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectingArea(true)}
                disabled={detecting}
              >
                <Crop size={18} />
                Seleccionar área
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => handleRedetectar(false)}
                disabled={detecting}
              >
                {detecting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
                {detecting ? 'Detectando...' : 'Re-detectar'}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectingArea(false)
                  setCropStart(null)
                  setCropEnd(null)
                }}
              >
                <X size={18} />
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => handleRedetectar(true)}
                disabled={detecting || !cropStart || !cropEnd || getCropRect()?.width < 20}
              >
                {detecting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
                {detecting ? 'Detectando...' : 'Detectar selección'}
              </button>
            </>
          )}
        </div>

        {/* Ubicación */}
        <div className="location-breadcrumb" style={{ marginTop: '1rem' }}>
          <span>{currentItem?.estanteria_nombre}</span>
          <ChevronRight size={16} />
          <span>Balda {currentItem?.balda_numero}</span>
          <ChevronRight size={16} />
          <span>Caja {currentItem?.caja_numero}</span>
        </div>

        {/* Predicción YOLO */}
        {currentItem?.categoria_yolo && (
          <div className="card" style={{ 
            background: '#eff6ff', 
            border: '1px solid #bfdbfe',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Clasificación automática:
            </div>
            <div style={{ 
              fontWeight: 600, 
              fontSize: '1.125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {currentItem.categoria_yolo}
              {currentItem.confianza_yolo && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)',
                  fontWeight: 'normal'
                }}>
                  ({Math.round(currentItem.confianza_yolo * 100)}% confianza)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Formulario de edición */}
        <div className="card">
          <div className="form-group">
            <label className="form-label">Nombre del item</label>
            <input
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Destornillador Phillips"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {suggestedCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`btn ${categoriaManual === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  onClick={() => setCategoriaManual(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="form-input"
              value={categoriaManual}
              onChange={(e) => setCategoriaManual(e.target.value)}
              placeholder="O escribe una categoría..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <textarea
              className="form-textarea"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Añade detalles adicionales..."
              rows={2}
            />
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button 
            className="btn btn-danger btn-icon"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            <X size={24} />
          </button>
          <button 
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={handleSkip}
            disabled={saving || currentIndex === items.length - 1}
          >
            Saltar
          </button>
          <button 
            className="btn btn-success"
            style={{ flex: 2 }}
            onClick={handleApprove}
            disabled={saving}
          >
            {saving ? (
              <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }}></div>
            ) : (
              <>
                <Check size={20} />
                Aprobar
              </>
            )}
          </button>
        </div>
      </main>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Eliminar item</h3>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que quieres eliminar este item? Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
