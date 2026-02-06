import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { X, Printer, Plus } from 'lucide-react'
import { addToQueue } from '../utils/printQueue'
import { getCategoryIcon } from '../constants/boxCategories'

export default function LabelPrint({ type, data, onClose }) {
  const qrCanvasRef = useRef(null)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    // Obtener la URL base (puede ser configurada en localStorage)
    const savedUrl = localStorage.getItem('baseUrl') || window.location.origin
    setBaseUrl(savedUrl)

    // Handlers para antes y después de imprimir
    const beforePrint = () => {
      document.body.classList.add('printing-label')
    }
    const afterPrint = () => {
      document.body.classList.remove('printing-label')
    }

    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)

    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
      document.body.classList.remove('printing-label')
    }
  }, [])

  useEffect(() => {
    if (qrCanvasRef.current && baseUrl) {
      generateQR()
    }
  }, [baseUrl, data])

  const generateQR = async () => {
    const url = type === 'caja' 
      ? `${baseUrl}/caja/${data.id}`
      : `${baseUrl}/balda/${data.id}`

    try {
      await QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (err) {
      console.error('Error generando QR:', err)
    }
  }

  const handlePrint = () => {
    // Añadir clase al body inmediatamente
    document.body.classList.add('printing-label')
    // Forzar repaint
    void document.body.offsetHeight
    // Pequeño delay para asegurar que se aplican los estilos
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleAddToQueue = () => {
    addToQueue(type, data)
    onClose()
    // Mostrar notificación
    const event = new CustomEvent('labelAddedToQueue')
    window.dispatchEvent(event)
  }

  if (type === 'caja') {
    const categoryInfo = getCategoryIcon(data.categoria)
    const CategoryIcon = categoryInfo.icon
    
    return (
      <div className="label-print-overlay" onClick={onClose}>
        <div className="label-print-container" onClick={(e) => e.stopPropagation()}>
          <button className="label-close-btn" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="label-preview">
            <div className="label-content">
              {/* Etiqueta para caja */}
              <div className="label-header">
                <div className="label-location">
                  <div className="label-estanteria">{data.estanteria_nombre}</div>
                  <div className="label-balda">
                    Balda {data.balda_numero ?? data.balda ?? data.balda_id ?? ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {data.categoria && (
                    <CategoryIcon size={32} style={{ color: categoryInfo.color }} />
                  )}
                  <div className="label-caja-numero">
                    CAJA {data.numero}
                  </div>
                </div>
              </div>

              {data.etiqueta && (
                <div className="label-title">
                  {data.etiqueta}
                </div>
              )}

              {data.descripcion && (
                <div className="label-description">
                  {data.descripcion}
                </div>
              )}

              <div className="label-qr-section">
                <canvas ref={qrCanvasRef} />
              </div>
            </div>
          </div>

          <div className="label-actions">
            <button className="button button-outline" onClick={handleAddToQueue}>
              <Plus size={20} />
              Añadir a Cola
            </button>
            <button className="button button-primary" onClick={handlePrint}>
              <Printer size={20} />
              Imprimir Ahora
            </button>
            <button className="button button-outline" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Etiqueta para balda
  return (
    <div className="label-print-overlay" onClick={onClose}>
      <div className="label-print-container" onClick={(e) => e.stopPropagation()}>
        <button className="label-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="label-preview">
          <div className="label-content">
            <div className="label-header">
              <div className="label-location">
                <div className="label-estanteria">{data.estanteria_nombre}</div>
              </div>
              <div className="label-balda-numero">
                BALDA {data.numero}
              </div>
            </div>

            <div className="label-qr-section">
              <canvas ref={qrCanvasRef} />
              <div className="label-qr-text">
                Escanea para ver cajas
              </div>
            </div>

            {data.descripcion && (
              <div className="label-description">
                {data.descripcion}
              </div>
            )}

            <div className="label-cajas-info">
              {data.num_cajas || 0} cajas
            </div>
          </div>
        </div>

        <div className="label-actions">
          <button className="button button-outline" onClick={handleAddToQueue}>
            <Plus size={20} />
            Añadir a Cola
          </button>
          <button className="button button-primary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir Ahora
          </button>
          <button className="button button-outline" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
