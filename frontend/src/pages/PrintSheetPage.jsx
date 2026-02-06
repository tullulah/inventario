import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import QRCode from 'qrcode'
import { getSheets } from '../utils/printQueue'
import { getCategoryIcon } from '../constants/boxCategories'

export default function PrintSheetPage() {
  const navigate = useNavigate()
  const [sheets, setSheets] = useState([])
  const [baseUrl, setBaseUrl] = useState('')
  const canvasRefs = useRef({})
  const [qrGenerated, setQrGenerated] = useState(false)

  useEffect(() => {
    const savedUrl = localStorage.getItem('baseUrl') || window.location.origin
    setBaseUrl(savedUrl)

    const loadedSheets = getSheets()
    setSheets(loadedSheets)
  }, [])

  useEffect(() => {
    if (sheets.length > 0 && baseUrl && !qrGenerated) {
      // Pequeño delay para asegurar que los canvas están montados
      setTimeout(() => {
        generateAllQRs()
        setQrGenerated(true)
      }, 200)
    }
  }, [sheets, baseUrl, qrGenerated])

  const generateAllQRs = async () => {
    console.log('🎨 Iniciando generación de QR codes...', { sheets: sheets.length, baseUrl })
    
    for (const sheet of sheets) {
      for (let i = 0; i < 8; i++) {
        const label = sheet.positions[i]
        
        if (label) {
          const url = label.type === 'caja' 
            ? `${baseUrl}/caja/${label.data.id}`
            : `${baseUrl}/balda/${label.data.id}`

          // Generar QR para ambos canvas (preview y print)
          for (const context of ['preview', 'print']) {
            const canvasKey = `${context}_${sheet.id}_${i}`
            
            // Esperar hasta que el canvas esté disponible
            let retries = 0
            const maxRetries = 10
            
            while (!canvasRefs.current[canvasKey] && retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 50))
              retries++
            }
            
            if (canvasRefs.current[canvasKey]) {
              try {
                await QRCode.toCanvas(canvasRefs.current[canvasKey], url, {
                  width: 150,
                  margin: 1,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  }
                })
                console.log(`✅ QR generado: ${canvasKey}`, url)
              } catch (err) {
                console.error(`❌ Error generando QR ${canvasKey}:`, err)
              }
            } else {
              console.warn(`⚠️ Canvas no encontrado para ${canvasKey}`)
            }
          }
        }
      }
    }
    console.log('🎨 Generación de QR codes completada')
  }

  const handlePrint = () => {
    document.body.classList.add('printing-sheet')
    void document.body.offsetHeight
    setTimeout(() => {
      window.print()
    }, 100)
  }

  useEffect(() => {
    const beforePrint = () => {
      document.body.classList.add('printing-sheet')
    }
    const afterPrint = () => {
      document.body.classList.remove('printing-sheet')
    }

    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)

    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
      document.body.classList.remove('printing-sheet')
    }
  }, [])

  const renderLabel = (label, sheetId, index, context = 'preview') => {
    if (!label) return null

    const canvasKey = `${context}_${sheetId}_${index}`

    if (label.type === 'caja') {
      const categoryInfo = getCategoryIcon(label.data.categoria)
      const CategoryIcon = categoryInfo.icon
      
      return (
        <div className="a4-label-content">
          <div className="label-header">
            <div className="label-location">
              <div className="label-estanteria">{label.data.estanteria_nombre}</div>
              <div className="label-balda">
                Balda {label.data.balda_numero ?? label.data.balda ?? label.data.balda_id ?? ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {label.data.categoria && (
                <CategoryIcon size={32} style={{ color: categoryInfo.color }} />
              )}
              <div className="label-caja-numero">
                CAJA {label.data.numero}
              </div>
            </div>
          </div>

          {label.data.etiqueta && (
            <div className="label-title">
              {label.data.etiqueta}
            </div>
          )}

          {label.data.descripcion && (
            <div className="label-description">
              {label.data.descripcion}
            </div>
          )}

          <div className="label-qr-section">
            <canvas ref={el => canvasRefs.current[canvasKey] = el} />
          </div>
        </div>
      )
    } else {
      // Balda
      return (
        <div className="a4-label-content">
          <div className="label-header">
            <div className="label-location">
              <div className="label-estanteria">{label.data.estanteria_nombre}</div>
            </div>
            <div className="label-balda-numero">
              BALDA {label.data.numero}
            </div>
          </div>

          <div className="label-qr-section">
            <canvas ref={el => canvasRefs.current[canvasKey] = el} />
            <div className="label-qr-text">
              Escanea para ver cajas
            </div>
          </div>

          {label.data.descripcion && (
            <div className="label-description">
              {label.data.descripcion}
            </div>
          )}

          <div className="label-cajas-info">
            {label.data.num_cajas || 0} cajas
          </div>
        </div>
      )
    }
  }

  if (sheets.length === 0) {
    return <div>Cargando...</div>
  }

  return (
    <>
      <header className="header no-print">
        <button className="header-back" onClick={() => navigate('/print-queue')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Vista Previa - {sheets.length} hoja{sheets.length > 1 ? 's' : ''}</h1>
        <button 
          className="header-back"
          onClick={handlePrint}
          style={{ marginLeft: 'auto' }}
          title="Imprimir todas las hojas"
        >
          <Printer size={20} />
        </button>
      </header>

      <main className="main-content no-print" style={{ paddingBottom: '2rem' }}>
        {sheets.map((sheet, sheetIndex) => (
          <div key={sheet.id} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>{sheet.name}</h2>
            <div className="a4-sheet-preview">
              <div className="a4-grid">
                {sheet.positions.map((label, index) => (
                  <div key={index} className="a4-label-cell">
                    {renderLabel(label, sheet.id, index, 'preview')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Hojas para imprimir (ocultas en pantalla) */}
      {sheets.map((sheet) => (
        <div key={`print-${sheet.id}`} className="a4-sheet-print">
          <div className="a4-grid-print">
            {sheet.positions.map((label, index) => (
              <div key={index} className="a4-label-cell-print">
                {renderLabel(label, sheet.id, index, 'print')}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
