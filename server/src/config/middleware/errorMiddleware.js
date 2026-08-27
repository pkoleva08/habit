export function errorHandler(error, req, res, next) {
	// Log error details
	console.error('Error:', {
		message: error.message,
		status: error.status || 500,
		path: req.path,
		method: req.method,
		userId: req.user?.id || null,
		stack: error.stack,
	})

	if (error.status) {
		// Custom API errors with status
		return res.status(error.status).json({
			message: error.message,
			status: error.status,
		})
	}

	if (error.code === '23505') {
		// PostgreSQL unique constraint violation
		return res.status(409).json({
			message: 'Resource already exists',
		})
	}

	if (error.code === '23503') {
		// PostgreSQL foreign key constraint violation
		return res.status(400).json({
			message: 'Invalid reference to related resource',
		})
	}

	if (error.name === 'JsonWebTokenError') {
		// JWT validation errors
		return res.status(401).json({
			message: 'Invalid or expired token',
		})
	}

	if (error.name === 'ValidationError') {
		// Schema validation errors
		return res.status(400).json({
			message: 'Validation failed',
			details: error.details,
		})
	}

	res.status(error.status || 500).json({
		message: error.message || 'Internal server error',
		status: error.status || 500,
	})
}


export function notFoundHandler(req, res) {
	res.status(404).json({
		message: `Route not found: ${req.method} ${req.originalUrl}`,
	})
}

export function asyncHandler(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next)
	}
}
