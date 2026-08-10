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

export function getGroups() {
	return apiRequest('/groups')
}

export function createGroup(payload) {
	return apiRequest('/groups', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function joinGroup(groupId) {
	return apiRequest(`/groups/${groupId}/join`, {
		method: 'POST',
		body: JSON.stringify({}),
	})
}

export function getLeaderboard(groupId) {
	return apiRequest(`/groups/${groupId}/leaderboard`)
}

export function getAnalyticsOverview() {
	return apiRequest('/analytics/overview')
}
