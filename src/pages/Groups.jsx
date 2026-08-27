import { useEffect, useState } from 'react'
import { createGroup, getGroups, getLeaderboard, joinGroup, leaveGroup } from '../services/habitService'

export default function Groups() {
	const [groups, setGroups] = useState([])
	const [leaderboard, setLeaderboard] = useState([])
	const [form, setForm] = useState({ name: '', description: '' })
	const [joinCode, setJoinCode] = useState('')
	const [notice, setNotice] = useState('')
	const [error, setError] = useState('')
	const [openMenuId, setOpenMenuId] = useState(null)

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
			const data = await createGroup(form)
			setForm({ name: '', description: '' })
			setNotice(data.group?.invite_code ? `Group created. Invite code: ${data.group.invite_code}` : 'Group created')
			await loadGroups()
		} catch (e) {
			setError(e.message)
		}
	}

	const onJoin = async (event) => {
		event.preventDefault()
		setError('')
		try {
			await joinGroup(joinCode.trim())
			setJoinCode('')
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

	const onLeaveGroup = async (groupId, action = 'transfer') => {
		setError('')
		setOpenMenuId(null)
		try {
			const data = await leaveGroup(groupId, action)
			setNotice(data.message || 'You left the group')
			await loadGroups()
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
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						placeholder="6-digit invite code"
						value={joinCode}
						onKeyDown={(event) => {
							const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
							if (/[0-9]/.test(event.key) || allowed.includes(event.key)) {
								return
							}
							event.preventDefault()
						}}
						onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
						required
					/>
					<button type="submit">Join</button>
				</form>
			</article>

			<article className="card">
				<h3>Your groups</h3>
				<div className="list">
					{groups.map((group) => (
						<div key={group.id} className="group-item">
							<div className="group-meta">
								<strong>{group.name}</strong>
								<p className="muted">Members: {group.member_count}</p>
								<p className="muted">Your role: {group.member_role === 'admin' ? 'Admin' : 'Member'}</p>
								{group.member_role === 'admin' && group.admin_invite_code ? (
									<p className="muted">Invite code: {group.admin_invite_code}</p>
								) : null}
							</div>
							<div className="group-actions">
								<button type="button" onClick={() => onViewBoard(group.id)}>
									View leaderboard
								</button>
								<div className="menu-wrapper">
									<button
										type="button"
										className="icon-button"
										onClick={() => setOpenMenuId(openMenuId === group.id ? null : group.id)}
										aria-label="Open group menu"
									>
										⋮
									</button>
									{openMenuId === group.id ? (
										<div className="group-menu">
											{group.member_role === 'admin' ? (
												<>
													<button type="button" onClick={() => onLeaveGroup(group.id, 'transfer')}>
														Leave & transfer admin
													</button>
													<button type="button" onClick={() => onLeaveGroup(group.id, 'delete')}>
														Delete group
													</button>
												</>
											) : (
												<button type="button" onClick={() => onLeaveGroup(group.id, 'transfer')}>
													Leave group
												</button>
											)}
										</div>
									) : null}
								</div>
							</div>
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
