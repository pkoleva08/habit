import { useEffect, useState } from 'react'
import { createGroup, getGroups, getLeaderboard, joinGroup } from '../services/habitService'

export default function Groups() {
	const [groups, setGroups] = useState([])
	const [leaderboard, setLeaderboard] = useState([])
	const [form, setForm] = useState({ name: '', description: '' })
	const [joinId, setJoinId] = useState('')
	const [notice, setNotice] = useState('')
	const [error, setError] = useState('')

	const loadGroups = async () => {
		const data = await getGroups()
		setGroups(data.groups || [])
		if (data.groups?.length) {
			const board = await getLeaderboard(data.groups[0].id)
			setLeaderboard(board.leaderboard || [])
		}
	}

	useEffect(() => {
		loadGroups().catch((e) => setError(e.message))
	}, [])

	const onCreate = async (event) => {
		event.preventDefault()
		setError('')
		try {
			await createGroup(form)
			setForm({ name: '', description: '' })
			setNotice('Group created')
			await loadGroups()
		} catch (e) {
			setError(e.message)
		}
	}

	const onJoin = async (event) => {
		event.preventDefault()
		setError('')
		try {
			await joinGroup(Number(joinId))
			setJoinId('')
			setNotice('Joined group')
			await loadGroups()
		} catch (e) {
			setError(e.message)
		}
	}

	const onViewBoard = async (groupId) => {
		try {
			const data = await getLeaderboard(groupId)
			setLeaderboard(data.leaderboard || [])
		} catch (e) {
			setError(e.message)
		}
	}

	return (
		<section className="grid two-col">
			<article className="card">
				<h3>Create group challenge</h3>
				<form className="inline-form" onSubmit={onCreate}>
					<input
						type="text"
						placeholder="Group name"
						value={form.name}
						onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
						required
					/>
					<input
						type="text"
						placeholder="Description"
						value={form.description}
						onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
					/>
					<button type="submit">Create</button>
				</form>
			</article>

			<article className="card">
				<h3>Join group</h3>
				<form className="inline-form" onSubmit={onJoin}>
					<input
						type="number"
						placeholder="Group id"
						value={joinId}
						onChange={(event) => setJoinId(event.target.value)}
						required
					/>
					<button type="submit">Join</button>
				</form>
			</article>

			<article className="card">
				<h3>Your groups</h3>
				<div className="list">
					{groups.map((group) => (
						<div key={group.id} className="row-between">
							<div>
								<strong>{group.name}</strong>
								<p className="muted">Members: {group.member_count}</p>
							</div>
							<button type="button" onClick={() => onViewBoard(group.id)}>
								View leaderboard
							</button>
						</div>
					))}
				</div>
			</article>

			<article className="card">
				<h3>Leaderboard</h3>
				<div className="list">
					{leaderboard.map((item, index) => (
						<div key={item.id} className="row-between">
							<span>
								{index + 1}. {item.name}
							</span>
							<span>
								{item.completions} completions / best streak {item.best_streak}
							</span>
						</div>
					))}
				</div>
			</article>

			{notice ? <p className="notice">{notice}</p> : null}
			{error ? <p className="error">{error}</p> : null}
		</section>
	)
}
