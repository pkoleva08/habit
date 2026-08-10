import { useEffect, useState } from 'react'
import { getAnalyticsOverview } from '../services/habitService'

function TrendRow({ label, value }) {
	return (
		<div className="trend-row">
			<span>{label}</span>
			<div className="bar-wrap">
				<div className="bar" style={{ width: `${Math.min(100, value)}%` }} />
			</div>
			<strong>{value}%</strong>
		</div>
	)
}

export default function Analytics() {
	const [overview, setOverview] = useState({ weekly: [], monthly: [], recommendations: [] })
	const [error, setError] = useState('')

	useEffect(() => {
		getAnalyticsOverview()
			.then((data) => setOverview(data))
			.catch((e) => setError(e.message))
	}, [])

	return (
		<section className="grid two-col">
			<article className="card">
				<h3>Weekly success trend</h3>
				{(overview.weekly || []).map((item) => (
					<TrendRow
						key={`w-${item.period}`}
						label={new Date(item.period).toLocaleDateString()}
						value={Number(item.successRate || 0)}
					/>
				))}
			</article>

			<article className="card">
				<h3>Monthly success trend</h3>
				{(overview.monthly || []).map((item) => (
					<TrendRow
						key={`m-${item.period}`}
						label={new Date(item.period).toLocaleDateString(undefined, {
							month: 'short',
							year: 'numeric',
						})}
						value={Number(item.successRate || 0)}
					/>
				))}
			</article>

			<article className="card full-width">
				<h3>Personalized recommendations</h3>
				<ul className="plain-list">
					{(overview.recommendations || []).map((item, index) => (
						<li key={`${item}-${index}`}>{item}</li>
					))}
				</ul>
			</article>

			{error ? <p className="error">{error}</p> : null}
		</section>
	)
}
