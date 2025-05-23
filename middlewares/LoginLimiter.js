const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 5 * 60 * 1000; // 5 minutos

// Almacén en memoria: { key: { count, lastAttempt, blockedUntil } }
const loginAttempts = new Map();

const trustedEmails = process.env.TRUSTED_ADMIN_EMAILS?.split(',') || [];
const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];

const loginLimiter = (req, res, next) => {
  // Solo aplica a POST /api/users/login
  if (!(req.originalUrl === '/api/users/login' && req.method === 'POST')) {
    return next();
  }

  const key = req.body.email || req.ip;

  // Permitir acceso libre a usuarios de confianza
  if (trustedEmails.includes(req.body.email) || trustedIPs.includes(req.ip)) {
    return next();
  }

  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, lastAttempt: 0, blockedUntil: null };

  // Bloqueo activo
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    const retryAfter = Math.ceil((attempt.blockedUntil - now) / 1000); // en segundos
    return res.status(429).json({
      code: 'TOO_MANY_REQUESTS',
      message: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(retryAfter / 60)} minutos.`,
      remaining: 0,
      retryAfter
    });
  }

  // Reset si ha pasado el tiempo de bloqueo
  if (now - attempt.lastAttempt > BLOCK_TIME_MS) {
    attempt.count = 0;
    attempt.blockedUntil = null;
  }

  attempt.lastAttempt = now;
  attempt.count++;

  const remaining = Math.max(0, MAX_ATTEMPTS - attempt.count);

  // Si excede los intentos, bloquear
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_TIME_MS;
    loginAttempts.set(key, attempt);
    return res.status(429).json({
      code: 'TOO_MANY_REQUESTS',
      message: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(BLOCK_TIME_MS / 60000)} minutos.`,
      remaining: 0,
      retryAfter: Math.ceil(BLOCK_TIME_MS / 1000)
    });
  }

  // Guardar progreso
  loginAttempts.set(key, attempt);

  // Agregar metadata útil al request
  req.loginTracking = {
    remaining,
    retryAfter: 0
  };

  // Headers útiles para el frontend (avisar solo si quedan 3 o menos)
  if (remaining <= 3) {
    res.set('x-warning-attempts', remaining);
  }

  next();
};

module.exports = loginLimiter;
