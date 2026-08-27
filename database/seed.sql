INSERT INTO users (name, email, password_hash, role)
VALUES
	('Admin User', 'admin@habitly.dev', '$2a$10$PNtc2QW7hj9kaK0OA2JGfuxyWWdZABCsRAITaiGGFZ1gNpV0HmzWS', 'admin'),
	('Demo User', 'user@habitly.dev', '$2a$10$PNtc2QW7hj9kaK0OA2JGfuxyWWdZABCsRAITaiGGFZ1gNpV0HmzWS', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO habits (user_id, name, frequency, reminder_time, streak)
VALUES
	((SELECT id FROM users WHERE email = 'user@habitly.dev'), '30 min reading', 'daily', '08:00', 5),
	((SELECT id FROM users WHERE email = 'user@habitly.dev'), 'Gym session', 'weekly', '18:30', 2)
ON CONFLICT DO NOTHING;

INSERT INTO groups (name, description, owner_id)
VALUES (
	'Morning Momentum',
	'Small accountability challenge for daily consistency',
	(SELECT id FROM users WHERE email = 'user@habitly.dev')
)
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, user_id, role)
VALUES (
	(SELECT id FROM groups WHERE name = 'Morning Momentum'),
	(SELECT id FROM users WHERE email = 'user@habitly.dev'),
	'admin'
)
ON CONFLICT (group_id, user_id) DO NOTHING;

INSERT INTO group_members (group_id, user_id, role)
VALUES (
	(SELECT id FROM groups WHERE name = 'Morning Momentum'),
	(SELECT id FROM users WHERE email = 'admin@habitly.dev'),
	'member'
)
ON CONFLICT (group_id, user_id) DO NOTHING;

INSERT INTO habit_completions (habit_id, completed_at)
VALUES
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '0 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '1 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '2 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '4 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '5 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '7 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '8 day'),
	((SELECT id FROM habits WHERE name = '30 min reading'), NOW() - INTERVAL '9 day');
