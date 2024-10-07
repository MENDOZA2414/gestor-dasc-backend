const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Obtener el token del encabezado de la solicitud
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado, no hay token.' });
    }

    try {
        // Verificar el token con el secreto
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Añadir el usuario verificado al objeto req para que esté disponible en la ruta
        next(); // Continuar al siguiente middleware o controlador
    } catch (error) {
        // Si el token no es válido o ha expirado, devolver un error
        return res.status(400).json({ message: 'Token no válido.' });
    }
};

module.exports = authMiddleware;
