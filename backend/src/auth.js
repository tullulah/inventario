import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import db from './database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'inventario-secret-key-change-in-production'
const SALT_ROUNDS = 10

// Crear tabla de usuarios si no existe
function initAuth() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // Crear usuario por defecto si no existe ninguno
  const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get()
  if (userCount.count === 0) {
    const defaultPassword = bcrypt.hashSync('admin123', SALT_ROUNDS)
    db.prepare('INSERT INTO usuarios (username, password) VALUES (?, ?)').run('admin', defaultPassword)
    console.log('⚠️  Usuario por defecto creado: admin / admin123')
    console.log('⚠️  CAMBIA LA CONTRASEÑA INMEDIATAMENTE')
  }
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' })
    }
    req.user = user
    next()
  })
}

// Login
async function login(username, password) {
  console.log('🔐 [LOGIN] Intento de login para usuario:', username)
  console.log('🔐 [LOGIN] Longitud de contraseña recibida:', password ? password.length : 0)
  console.log('🔐 [LOGIN] Tipo de contraseña:', typeof password)
  
  const user = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username)
  
  if (!user) {
    console.log('❌ [LOGIN] Usuario no encontrado:', username)
    throw new Error('Usuario no encontrado')
  }

  console.log('✓ [LOGIN] Usuario encontrado en BD:', username)
  console.log('🔐 [LOGIN] Hash almacenado existe:', !!user.password)
  console.log('🔐 [LOGIN] Longitud del hash:', user.password ? user.password.length : 0)
  
  const validPassword = await bcrypt.compare(password, user.password)
  console.log('🔐 [LOGIN] Validación de contraseña:', validPassword ? '✓ CORRECTA' : '❌ INCORRECTA')
  
  if (!validPassword) {
    console.log('❌ [LOGIN] Contraseña incorrecta para usuario:', username)
    throw new Error('Contraseña incorrecta')
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  console.log('✓ [LOGIN] Token generado exitosamente para:', username)
  
  return {
    token,
    user: { id: user.id, username: user.username }
  }
}

// Cambiar contraseña
async function changePassword(userId, oldPassword, newPassword) {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(userId)
  
  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  const validPassword = await bcrypt.compare(oldPassword, user.password)
  if (!validPassword) {
    throw new Error('Contraseña actual incorrecta')
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
  db.prepare('UPDATE usuarios SET password = ? WHERE id = ?').run(hashedPassword, userId)
}

export {
  initAuth,
  authenticateToken,
  login,
  changePassword,
  JWT_SECRET
}
