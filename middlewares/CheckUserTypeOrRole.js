module.exports = (allowedUserTypes = [], allowedRoles = []) => {
  return (req, res, next) => {
    const userTypeName = req.user?.userTypeName;
    const userRoles = req.user?.roles || [];

    const isUserTypeAllowed = allowedUserTypes.includes(userTypeName);
    const isRoleAllowed = userRoles.some(role => allowedRoles.includes(role));

    if (!isUserTypeAllowed && !isRoleAllowed) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }

    next();
  };
};
