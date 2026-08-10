const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken() {
	return localStorage.getItem('habitly_token')
}

export async function apiRequest(path, options = {}) {
	const headers = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	}

	const token = getToken()
	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	let response
	try {
		response = await fetch(`${API_BASE_URL}${path}`, {
			...options,
			headers,
		})
	} catch {
		throw new Error('Cannot connect to API server. Start the application with npm run dev from the project folder.')
	}

	const data = await response.json().catch(() => ({}))

	if (!response.ok) {
		throw new Error(data.message || 'Request failed')
	}

	return data
}
