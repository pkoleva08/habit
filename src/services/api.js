function getApiBaseUrls() {
	const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : null
	const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
	const port = Number(import.meta.env.VITE_API_PORT || 4000)

	const candidates = new Set([
		'/api',
		envUrl,
		`${currentOrigin}/api`,
		`http://localhost:${port}/api`,
		`http://127.0.0.1:${port}/api`,
		`${currentOrigin.replace(/:\d+$/, '')}:${port}/api`,
	])

	return [...candidates].filter(Boolean)
}

export function getApiBaseUrl() {
	return getApiBaseUrls()[0] || 'http://localhost:4000/api'
}

const API_BASE_URL = getApiBaseUrl()

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

	const doFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis)
	let lastError = null
	for (const baseUrl of getApiBaseUrls()) {
		try {
			const requestUrl = String(baseUrl) + String(path)
			const response = await doFetch(requestUrl, {
				...options,
				headers,
			})

			const data = await response.json().catch(() => ({}))

			if (!response.ok) {
				throw new Error(data.message || 'Request failed')
			}

			return data
		} catch (error) {
			lastError = error
		}
	}

	throw new Error(lastError?.message || 'Cannot connect to the API server. Make sure the backend server is running on port 4000.')
}
