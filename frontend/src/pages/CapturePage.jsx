import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Camera, RotateCcw, Check, Plus, ChevronRight } from 'lucide-react'
import { getEstanterias, getBaldas, getCajas, createBalda, createCaja, capturarItem } from '../api'
import AppHeader from '../components/AppHeader'

export default function CapturePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Estado de selección de ubicación
  const [step, setStep] = useState('estanteria') // estanteria, balda, caja, camera, preview
  const [estanterias, setEstanterias] = useState([])
  const [baldas, setBaldas] = useState([])
  const [cajas, setCajas] = useState([])
  const [selectedEstanteria, setSelectedEstanteria] = useState(null)
  const [selectedBalda, setSelectedBalda] = useState(null)
  const [selectedCaja, setSelectedCaja] = useState(null)
  
  // Estado de captura
  const [capturedImage, setCapturedImage] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [saving, setSaving] = useState(false)
  const [itemCount, setItemCount] = useState(0)
  const [toast, setToast] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')

  // Cargar estanterías al inicio
  useEffect(() => {
    loadEstanterias()
    
    // Si viene cajaId del state, ir directo a la cámara
    if (location.state?.cajaId) {
      loadCajaDirecta(location.state.cajaId)
    }
  }, [])

  const loadCajaDirecta = async (cajaId) => {
    try {
      // Obtener todas las cajas para encontrar la seleccionada
      const estanteriasData = await getEstanterias()
      
      for (const estanteria of estanteriasData) {
        const baldasData = await getBaldas(estanteria.id)
        for (const balda of baldasData) {
          const cajasData = await getCajas(balda.id)
          const caja = cajasData.find(c => c.id === cajaId)
          if (caja) {
            setSelectedEstanteria(estanteria)
            setSelectedBalda(balda)
            setSelectedCaja(caja)
            setStep('camera')
            return
          }
        }
      }
    } catch (error) {
      console.error('Error cargando caja directa:', error)
    }
  }

  const loadEstanterias = async () => {
    try {
      const data = await getEstanterias()
      setEstanterias(data)
    } catch (error) {
      console.error('Error cargando estanterías:', error)
    }
  }

  const loadBaldas = async (estanteriaId) => {
    try {
      const data = await getBaldas(estanteriaId)
      setBaldas(data)
    } catch (error) {
      console.error('Error cargando baldas:', error)
    }
  }

  const loadCajas = async (baldaId) => {
    try {
      const data = await getCajas(baldaId)
      setCajas(data)
    } catch (error) {
      console.error('Error cargando cajas:', error)
    }
  }

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setCameraError('No se pudo acceder a la cámara. Por favor, permite el acceso.')
    }
  }, [facingMode])

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  // Iniciar/detener cámara según el paso
  useEffect(() => {
    if (step === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [step, startCamera, stopCamera])

  // Cambiar cámara
  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  // Capturar foto
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageDataUrl)

    canvas.toBlob(blob => {
      setCapturedBlob(blob)
    }, 'image/jpeg', 0.9)

    setStep('preview')
    stopCamera()
  }

  // Guardar item
  const saveItem = async () => {
    if (!capturedBlob || !selectedCaja) return

    try {
      setSaving(true)
      
      // Crear archivo desde blob
      const file = new File([capturedBlob], `item_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      // Capturar item (crea item + foto en una sola llamada)
      await capturarItem(selectedCaja.id, file)
      
      setItemCount(prev => prev + 1)
      showToast('Item guardado correctamente')
      
      // Volver a capturar más
      setCapturedImage(null)
      setCapturedBlob(null)
      setStep('camera')
    } catch (error) {
      console.error('Error guardando item:', error)
      showToast('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Retomar foto
  const retakePhoto = () => {
    setCapturedImage(null)
    setCapturedBlob(null)
    setStep('camera')
  }

  // Toast
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // Añadir nueva balda
  const addBalda = async () => {
    const numero = baldas.length + 1
    try {
      const nuevaBalda = await createBalda(selectedEstanteria.id, { numero })
      setBaldas(prev => [...prev, nuevaBalda])
      showToast(`Balda ${numero} creada`)
    } catch (error) {
      showToast('Error al crear balda')
    }
  }

  // Añadir nueva caja
  const addCaja = async () => {
    const numero = cajas.length + 1
    try {
      const nuevaCaja = await createCaja(selectedBalda.id, { numero })
      setCajas(prev => [...prev, nuevaCaja])
      showToast(`Caja ${numero} creada`)
    } catch (error) {
      showToast('Error al crear caja')
    }
  }

  // Seleccionar estantería
  const selectEstanteria = (estanteria) => {
    setSelectedEstanteria(estanteria)
    loadBaldas(estanteria.id)
    setStep('balda')
  }

  // Seleccionar balda
  const selectBalda = (balda) => {
    setSelectedBalda(balda)
    loadCajas(balda.id)
    setStep('caja')
  }

  // Seleccionar caja
  const selectCaja = (caja) => {
    setSelectedCaja(caja)
    setStep('camera')
  }

  // Volver atrás
  const goBack = () => {
    if (step === 'preview') {
      retakePhoto()
    } else if (step === 'camera') {
      setStep('caja')
    } else if (step === 'caja') {
      setSelectedBalda(null)
      setCajas([])
      setStep('balda')
    } else if (step === 'balda') {
      setSelectedEstanteria(null)
      setBaldas([])
      setStep('estanteria')
    } else {
      navigate('/')
    }
  }

  // Título según el paso
  const getTitle = () => {
    switch (step) {
      case 'estanteria': return 'Seleccionar Estantería'
      case 'balda': return `${selectedEstanteria?.nombre} - Seleccionar Balda`
      case 'caja': return `Balda ${selectedBalda?.numero} - Seleccionar Caja`
      case 'camera': 
      case 'preview': 
        return `Caja ${selectedCaja?.numero}`
      default: return 'Capturar'
    }
  }

  return (
    <>
      <AppHeader 
        title={getTitle()}
        icon={Camera}
        showBack={true}
      />

      <main className="main-content">
        {/* Contador de items capturados */}
        {itemCount > 0 && (
          <div style={{ 
            padding: '0.5rem 1rem',
            background: 'var(--primary)',
            color: 'white',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {itemCount} item{itemCount > 1 ? 's' : ''} capturado{itemCount > 1 ? 's' : ''}
          </div>
        )}
        
        {/* Breadcrumb de ubicación */}
        {step !== 'estanteria' && (
          <div className="location-breadcrumb">
            <span>{selectedEstanteria?.nombre}</span>
            {selectedBalda && (
              <>
                <ChevronRight size={16} />
                <span>Balda {selectedBalda.numero}</span>
              </>
            )}
            {selectedCaja && (
              <>
                <ChevronRight size={16} />
                <span>Caja {selectedCaja.numero}</span>
              </>
            )}
          </div>
        )}

        {/* Selección de estantería */}
        {step === 'estanteria' && (
          <div className="selector-grid">
            {estanterias.map(est => (
              <div
                key={est.id}
                className="selector-item"
                onClick={() => selectEstanteria(est)}
              >
                <div className="selector-item-title">{est.nombre}</div>
                <div className="selector-item-subtitle">
                  {est.num_baldas || 0} baldas
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selección de balda */}
        {step === 'balda' && (
          <>
            <div className="selector-grid">
              {baldas.map(balda => (
                <div
                  key={balda.id}
                  className="selector-item"
                  onClick={() => selectBalda(balda)}
                >
                  <div className="selector-item-title">Balda {balda.numero}</div>
                  <div className="selector-item-subtitle">
                    {balda.num_cajas || 0} cajas
                  </div>
                </div>
              ))}
              <div
                className="selector-item"
                onClick={addBalda}
                style={{ borderStyle: 'dashed' }}
              >
                <Plus size={24} style={{ marginBottom: '0.5rem' }} />
                <div className="selector-item-title">Añadir balda</div>
              </div>
            </div>
          </>
        )}

        {/* Selección de caja */}
        {step === 'caja' && (
          <>
            <div className="selector-grid">
              {cajas.map(caja => (
                <div
                  key={caja.id}
                  className="selector-item"
                  onClick={() => selectCaja(caja)}
                >
                  <div className="selector-item-title">
                    {caja.etiqueta || `Caja ${caja.numero}`}
                  </div>
                  <div className="selector-item-subtitle">
                    {caja.num_items || 0} items
                  </div>
                </div>
              ))}
              <div
                className="selector-item"
                onClick={addCaja}
                style={{ borderStyle: 'dashed' }}
              >
                <Plus size={24} style={{ marginBottom: '0.5rem' }} />
                <div className="selector-item-title">Añadir caja</div>
              </div>
            </div>
          </>
        )}

        {/* Cámara */}
        {step === 'camera' && (
          <div className="camera-container">
            {cameraError ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--danger)' }}>{cameraError}</p>
                <button className="btn btn-primary" onClick={startCamera}>
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                <div className="camera-overlay">
                  <button className="camera-btn" onClick={switchCamera}>
                    <RotateCcw size={24} />
                  </button>
                  <button className="camera-btn camera-btn-capture" onClick={capturePhoto}>
                    <Camera size={28} color="white" />
                  </button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && capturedImage && (
          <>
            <div className="image-preview">
              <img src={capturedImage} alt="Captura" />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginTop: '1rem',
              justifyContent: 'center'
            }}>
              <button 
                className="btn btn-secondary" 
                onClick={retakePhoto}
                disabled={saving}
              >
                <RotateCcw size={20} />
                Retomar
              </button>
              <button 
                className="btn btn-success" 
                onClick={saveItem}
                disabled={saving}
              >
                {saving ? (
                  <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }}></div>
                ) : (
                  <>
                    <Check size={20} />
                    Guardar
                  </>
                )}
              </button>
            </div>

            <p style={{ 
              textAlign: 'center', 
              marginTop: '1rem', 
              color: 'var(--gray-500)',
              fontSize: '0.875rem'
            }}>
              La clasificación automática se realizará después
            </p>
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
