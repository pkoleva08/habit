import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateStreakFromDates, calculateStreakMetrics } from './streakService.js'

test('daily streak resets after a missed day while best streak is preserved', () => {
	const today = new Date('2026-08-09T12:00:00Z')
	const dates = [
		'2026-08-01T08:00:00Z',
		'2026-08-02T08:00:00Z',
		'2026-08-03T08:00:00Z',
		'2026-08-04T08:00:00Z',
		'2026-08-05T08:00:00Z',
		'2026-08-06T08:00:00Z',
		'2026-08-08T08:00:00Z',
	]

	const result = calculateStreakMetrics(dates, 'daily', today)

	assert.equal(result.current, 0)
	assert.equal(result.best, 6)
	assert.equal(calculateStreakFromDates(dates, 'daily', today), 0)
})

test('daily streak starts again after a missed day and best streak keeps its record', () => {
	const today = new Date('2026-08-10T12:00:00Z')
	const dates = [
		'2026-08-01T08:00:00Z',
		'2026-08-02T08:00:00Z',
		'2026-08-03T08:00:00Z',
		'2026-08-04T08:00:00Z',
		'2026-08-05T08:00:00Z',
		'2026-08-06T08:00:00Z',
		'2026-08-08T08:00:00Z',
		'2026-08-10T08:00:00Z',
	]

	const result = calculateStreakMetrics(dates, 'daily', today)

	assert.equal(result.current, 1)
	assert.equal(result.best, 6)
})

test('best streak keeps growing when current streak improves', () => {
	const today = new Date('2026-08-12T12:00:00Z')
	const dates = [
		'2026-08-05T08:00:00Z',
		'2026-08-06T08:00:00Z',
		'2026-08-07T08:00:00Z',
		'2026-08-08T08:00:00Z',
		'2026-08-09T08:00:00Z',
		'2026-08-10T08:00:00Z',
		'2026-08-11T08:00:00Z',
		'2026-08-12T08:00:00Z',
	]

	const result = calculateStreakMetrics(dates, 'daily', today)

	assert.equal(result.current, 8)
	assert.equal(result.best, 8)
})

test('date-only values stay on the correct local day for streaks and calendar state', () => {
	const today = new Date(2026, 8, 10, 12, 0, 0)
	const dates = ['2026-09-09', '2026-09-10']

	const result = calculateStreakMetrics(dates, 'daily', today)

	assert.equal(result.current, 2)
	assert.equal(result.best, 2)
})
