import { apiRequest } from './api'

export function registerUser(payload) {
	return apiRequest('/auth/register', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function loginUser(payload) {
	return apiRequest('/auth/login', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function getMe() {
	return apiRequest('/auth/me')
}
