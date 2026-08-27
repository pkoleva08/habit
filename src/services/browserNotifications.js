import { getApiBaseUrl } from './api'

const POLL_INTERVAL_MS = 60_000 // check every 60 seconds
const NOTIFICATION_PREF_KEY = 'habitly_notification_pref'
let intervalId = null
let lastSeenId = null

function supportsNotifications() {
	return 'Notification' in window && typeof Notification.requestPermission === 'function'
}

function persistPreference(permission) {
	localStorage.setItem(NOTIFICATION_PREF_KEY, permission)
}

function getStoredPreference() {
	return localStorage.getItem(NOTIFICATION_PREF_KEY)
}

async function requestPermission({ promptUser = false } = {}) {
	if (!supportsNotifications()) return false
	if (Notification.permission === 'granted') {
		persistPreference('granted')
		return true
	}
	if (Notification.permission === 'denied') {
		persistPreference('denied')
		return false
	}

	if (promptUser) {
		const shouldEnable = window.confirm('Искате ли да получавате известия за напомняния и събития в Habitly?')
		if (!shouldEnable) {
			persistPreference('denied')
			return false
		}
	}

	try {
		const result = await Notification.requestPermission()
		const granted = result === 'granted'
		persistPreference(granted ? 'granted' : 'denied')
		return granted
	} catch {
		persistPreference('denied')
		return false
	}
}

function showBrowserNotification(title, body) {
	if (!supportsNotifications() || Notification.permission !== 'granted') return false

	try {
		new Notification(title, {
			body,
			icon: '/favicon.ico',
			tag: `habitly-${title}`,
		})
		if ('vibrate' in navigator) {
			navigator.vibrate([150, 80, 150])
		}
		return true
	} catch {
		return false
	}
}

async function pollAndNotify() {
	const token = localStorage.getItem('habitly_token')
	if (!token) return

	try {
		const apiBase = getApiBaseUrl()
		const res = await fetch(`${apiBase}/habits/notifications?limit=5`, {
			headers: { Authorization: `Bearer ${token}` },
		})

		if (!res.ok) return

		const { notifications } = await res.json()
		if (!notifications?.length) return

		// only show notifications newer than the last one we already showed
		const newest = notifications[0]
		if (lastSeenId === null) {
			lastSeenId = newest.id
			return
		}

		const fresh = notifications.filter((n) => n.id > lastSeenId)
		if (fresh.length === 0) return

		lastSeenId = newest.id

		fresh.reverse().forEach((n) => {
			const typeLabel =
				n.type === 'badge' ? '🏆 Постижение' :
				n.type === 'reminder' ? '⏰ Напомняне' : '🔔 Известие'
			showBrowserNotification(typeLabel, n.message)
		})
	} catch {
		// network error – silently ignore so polling doesn't break
	}
}

export async function startBrowserNotifications({ prompt = false } = {}) {
	const storedPreference = getStoredPreference()
	if (storedPreference === 'denied') return

	const granted = await requestPermission({ promptUser: prompt || !storedPreference })
	if (!granted) return

	await pollAndNotify()
	intervalId = setInterval(pollAndNotify, POLL_INTERVAL_MS)
}

export function stopBrowserNotifications() {
	if (intervalId !== null) {
		clearInterval(intervalId)
		intervalId = null
	}
}
