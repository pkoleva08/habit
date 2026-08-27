import { apiRequest } from './api'

export function getHabits() {
	return apiRequest('/habits')
}

export function createHabit(payload) {
	return apiRequest('/habits', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function updateHabit(habitId, payload) {
	return apiRequest(`/habits/${habitId}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export function deleteHabit(habitId) {
	return apiRequest(`/habits/${habitId}`, {
		method: 'DELETE',
	})
}

export function deleteAllHabits() {
	return apiRequest('/habits', {
		method: 'DELETE',
	})
}

export function completeHabit(habitId) {
	return apiRequest(`/habits/${habitId}/complete`, {
		method: 'POST',
		body: JSON.stringify({}),
	})
}

export function getHabitCalendar(habitId, year, month) {
	return apiRequest(`/habits/${habitId}/calendar?year=${year}&month=${month}`)
}

export function getReminders() {
	return apiRequest('/habits/reminders')
}

export function getNotifications(limit = 20) {
	return apiRequest(`/habits/notifications?limit=${limit}`)
}

export function clearUserNotifications() {
	return apiRequest('/habits/notifications', {
		method: 'DELETE',
	})
}

export function getGroups() {
	return apiRequest('/groups')
}

export function createGroup(payload) {
	return apiRequest('/groups', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function joinGroup(code) {
	return apiRequest('/groups/join', {
		method: 'POST',
		body: JSON.stringify({ code }),
	})
}

export function leaveGroup(groupId, action = 'transfer') {
	return apiRequest(`/groups/${groupId}/leave`, {
		method: 'POST',
		body: JSON.stringify({ action }),
	})
}

export function getLeaderboard(groupId) {
	return apiRequest(`/groups/${groupId}/leaderboard`)
}

export function getAnalyticsOverview() {
	return apiRequest('/analytics/overview')
}

export function clearRecommendations() {
	return apiRequest('/analytics/recommendations', {
		method: 'DELETE',
	})
}
