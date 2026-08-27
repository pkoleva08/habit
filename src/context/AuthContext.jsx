import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getMe, loginUser, registerUser } from '../services/authService'
import { startBrowserNotifications, stopBrowserNotifications } from '../services/browserNotifications'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'habitly_token'

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [badges, setBadges] = useState([])
	const [loading, setLoading] = useState(true)

	const saveSession = useCallback((payload) => {
		localStorage.setItem(TOKEN_KEY, payload.token)
		setUser(payload.user)
		setBadges(payload.badges || [])
		startBrowserNotifications({ prompt: true })
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY)
		setUser(null)
		setBadges([])
		stopBrowserNotifications()
	}, [])

	const refreshMe = useCallback(async () => {
		try {
			const token = localStorage.getItem(TOKEN_KEY)
			if (!token) {
				setLoading(false)
				return
			}

			const data = await getMe()
			setUser(data.user)
			setBadges(data.badges || [])
			startBrowserNotifications({ prompt: false })
		} catch {
			logout()
		} finally {
			setLoading(false)
		}
	}, [logout])

	useEffect(() => {
		refreshMe()
	}, [refreshMe])

	const login = useCallback(
		async (payload) => {
			const data = await loginUser(payload)
			saveSession(data)
			return data.user
		},
		[saveSession],
	)

	const register = useCallback(
		async (payload) => {
			const data = await registerUser(payload)
			saveSession(data)
			return data.user
		},
		[saveSession],
	)

	const value = useMemo(
		() => ({
			user,
			badges,
			loading,
			login,
			register,
			logout,
			refreshMe,
		}),
		[badges, loading, login, logout, refreshMe, register, user],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
