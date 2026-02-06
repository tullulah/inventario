const API_BASE = '/api'

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }))
    throw new Error(error.error || 'Error desconocido')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

// Stats
export const getStats = () => request('/stats')

// Ubicaciones
export const getEstanterias = () => request('/ubicaciones/estanterias')
export const createEstanteria = (data) => request('/ubicaciones/estanterias', {
  method: 'POST',
  body: JSON.stringify(data),
})
export const updateEstanteria = (id, data) => request(`/ubicaciones/estanterias/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
})
export const deleteEstanteria = (id) => request(`/ubicaciones/estanterias/${id}`, {
  method: 'DELETE',
})

export const getBaldas = (estanteriaId) => request(`/ubicaciones/estanterias/${estanteriaId}/baldas`)
export const createBalda = (estanteriaId, data) => request(`/ubicaciones/estanterias/${estanteriaId}/baldas`, {
  method: 'POST',
  body: JSON.stringify(data),
})
export const updateBalda = (id, data) => request(`/ubicaciones/baldas/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
})
export const deleteBalda = (id) => request(`/ubicaciones/baldas/${id}`, {
  method: 'DELETE',
})

export const getCajas = (baldaId) => request(`/ubicaciones/baldas/${baldaId}/cajas`)
export const createCaja = (baldaId, data) => request(`/ubicaciones/baldas/${baldaId}/cajas`, {
  method: 'POST',
  body: JSON.stringify(data),
})
export const updateCaja = (id, data) => request(`/ubicaciones/cajas/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
})
export const deleteCaja = (id) => request(`/ubicaciones/cajas/${id}`, {
  method: 'DELETE',
})

export const getArbolUbicaciones = () => request('/ubicaciones/arbol')

// Items
export const getItems = (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  return request(`/items${params ? `?${params}` : ''}`)
}
export const getItemsPendientes = () => request('/items/pendientes')
export const getItem = (id) => request(`/items/${id}`)
export const createItem = (data) => request('/items', {
  method: 'POST',
  body: JSON.stringify(data),
})
export const updateItem = (id, data) => request(`/items/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
})
export const revisarItem = (id, data) => request(`/items/${id}/revisar`, {
  method: 'PATCH',
  body: JSON.stringify(data),
})
export const deleteItem = (id) => request(`/items/${id}`, {
  method: 'DELETE',
})

// Fotos
export const uploadFoto = async (itemId, file, esPrincipal = false) => {
  const formData = new FormData()
  formData.append('foto', file)
  formData.append('es_principal', esPrincipal.toString())

  const response = await fetch(`${API_BASE}/fotos/upload/${itemId}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error al subir foto' }))
    throw new Error(error.error)
  }

  return response.json()
}

export const capturarItem = async (cajaId, file, yoloResult = null) => {
  const formData = new FormData()
  formData.append('foto', file)
  formData.append('caja_id', cajaId.toString())
  
  if (yoloResult) {
    formData.append('categoria_yolo', yoloResult.categoria)
    formData.append('confianza_yolo', yoloResult.confianza.toString())
  }

  const response = await fetch(`${API_BASE}/fotos/captura`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error al capturar item' }))
    throw new Error(error.error)
  }

  return response.json()
}

export const getFotosItem = (itemId) => request(`/fotos/item/${itemId}`)
export const setFotoPrincipal = (fotoId) => request(`/fotos/${fotoId}/principal`, {
  method: 'PATCH',
})
export const deleteFoto = (id) => request(`/fotos/${id}`, {
  method: 'DELETE',
})
export const redetectarItem = (itemId) => request(`/fotos/redetectar/${itemId}`, {
  method: 'POST',
})

// Categorías
export const getCategorias = () => request('/categorias')
export const getCategoriasArbol = () => request('/categorias/arbol')
export const createCategoria = (data) => request('/categorias', {
  method: 'POST',
  body: JSON.stringify(data),
})
export const updateCategoria = (id, data) => request(`/categorias/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
})
export const deleteCategoria = (id) => request(`/categorias/${id}`, {
  method: 'DELETE',
})
export const getCategoriasStats = () => request('/categorias/stats')
