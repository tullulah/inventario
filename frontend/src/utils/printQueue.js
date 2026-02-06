// Sistema de gestión de cola de impresión

const QUEUE_KEY = 'print_queue'
const SHEETS_KEY = 'print_sheets'

// Estructura de una etiqueta en cola
// {
//   id: unique_id,
//   type: 'caja' | 'balda',
//   data: { ...data de la caja/balda },
//   createdAt: timestamp
// }

// Estructura de una hoja
// {
//   id: sheet_id,
//   name: 'Hoja 1',
//   positions: [null, null, label, null, label, null, null, null] // 8 posiciones
// }

export const addToQueue = (type, data) => {
  const queue = getQueue()
  const newLabel = {
    id: `${type}_${data.id}_${Date.now()}`,
    type,
    data,
    createdAt: Date.now()
  }
  queue.push(newLabel)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return newLabel
}

export const getQueue = () => {
  const stored = localStorage.getItem(QUEUE_KEY)
  return stored ? JSON.parse(stored) : []
}

export const removeFromQueue = (labelId) => {
  const queue = getQueue()
  const filtered = queue.filter(label => label.id !== labelId)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
}

export const clearQueue = () => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]))
}

// Gestión de hojas
export const getSheets = () => {
  const stored = localStorage.getItem(SHEETS_KEY)
  return stored ? JSON.parse(stored) : []
}

export const createSheet = (name) => {
  const sheets = getSheets()
  const newSheet = {
    id: `sheet_${Date.now()}`,
    name: name || `Hoja ${sheets.length + 1}`,
    positions: Array(8).fill(null) // 8 posiciones vacías
  }
  sheets.push(newSheet)
  localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets))
  return newSheet
}

export const updateSheet = (sheetId, positions) => {
  const sheets = getSheets()
  const index = sheets.findIndex(s => s.id === sheetId)
  if (index !== -1) {
    sheets[index].positions = positions
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets))
  }
}

export const deleteSheet = (sheetId) => {
  const sheets = getSheets()
  const filtered = sheets.filter(s => s.id !== sheetId)
  localStorage.setItem(SHEETS_KEY, JSON.stringify(filtered))
}

export const assignLabelToSheet = (sheetId, position, label) => {
  const sheets = getSheets()
  const sheet = sheets.find(s => s.id === sheetId)
  if (sheet && position >= 0 && position < 8) {
    sheet.positions[position] = label
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets))
    // Remover de la cola
    removeFromQueue(label.id)
  }
}

export const removeLabelFromSheet = (sheetId, position) => {
  const sheets = getSheets()
  const sheet = sheets.find(s => s.id === sheetId)
  if (sheet && position >= 0 && position < 8) {
    const label = sheet.positions[position]
    sheet.positions[position] = null
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets))
    // Devolver a la cola
    if (label) {
      const queue = getQueue()
      queue.push(label)
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    }
  }
}

export const clearSheet = (sheetId) => {
  const sheets = getSheets()
  const sheet = sheets.find(s => s.id === sheetId)
  if (sheet) {
    // Devolver todas las etiquetas a la cola
    const queue = getQueue()
    sheet.positions.forEach(label => {
      if (label) queue.push(label)
    })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    
    // Limpiar hoja
    sheet.positions = Array(8).fill(null)
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets))
  }
}
