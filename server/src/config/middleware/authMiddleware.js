import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization
	const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

	if (!token) {
		return res.status(401).json({ message: 'Missing auth token' })
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
		req.user = payload
		return next()
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token' })
	}
}
