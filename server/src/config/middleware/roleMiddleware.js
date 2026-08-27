export function requireRole(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user?.role) {
			return res.status(403).json({ message: 'Role not found in token' })
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ message: 'Insufficient permissions' })
		}

		return next()
	}
}
