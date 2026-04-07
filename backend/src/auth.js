import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'inventario-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Login
async function login(username, password) {
  const { rows: [user] } = await pool.query(
    'SELECT * FROM usuarios WHERE username = $1', [username]
  );

  if (!user) throw new Error('Usuario o contraseña incorrectos');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Usuario o contraseña incorrectos');

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, username: user.username } };
}

// Cambiar contraseña
async function changePassword(userId, oldPassword, newPassword) {
  const { rows: [user] } = await pool.query(
    'SELECT * FROM usuarios WHERE id = $1', [userId]
  );

  if (!user) throw new Error('Usuario no encontrado');

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) throw new Error('Contraseña actual incorrecta');

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashed, userId]);
}

export { authenticateToken, login, changePassword, JWT_SECRET, bcrypt, SALT_ROUNDS };
