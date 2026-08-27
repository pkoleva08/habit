# Database documentation

## Overview

The Habitly application uses PostgreSQL as its primary relational database. The schema is defined in [database/schema.sql](../database/schema.sql) and is loaded by the server configuration in [server/src/config/database.js](../server/src/config/database.js).

The database stores:
- users and authentication data
- habits and completion history
- groups and memberships
- badges and earned badges
- notifications for the user

## PostgreSQL setup

### 1. Create the database

Run the following commands in PostgreSQL:

```sql
CREATE DATABASE habitly;
CREATE USER habitly_user WITH PASSWORD 'habitly_password';
ALTER DATABASE habitly OWNER TO habitly_user;
GRANT ALL PRIVILEGES ON DATABASE habitly TO habitly_user;
```

### 2. Configure the application

Set these environment variables before starting the server:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=habitly_user
DB_PASSWORD=habitly_password
DB_NAME=habitly
```

### 3. Create the schema

```bash
psql -U habitly_user -d habitly -f database/schema.sql
psql -U habitly_user -d habitly -f database/seed.sql
```

## Tables

### users
Stores account information for each user.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| name | varchar(120) | Display name |
| email | varchar(255) | Unique email |
| password_hash | text | Hashed password |
| role | varchar(20) | Either admin or user |
| created_at | timestamptz | Creation timestamp |

### habits
Stores habits created by a user.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| user_id | integer | Related user |
| name | varchar(150) | Habit title |
| frequency | varchar(20) | daily or weekly |
| reminder_time | time | Optional reminder time |
| streak | integer | Current streak value |
| created_at | timestamptz | Creation timestamp |

### habit_completions
Stores the completed dates for each habit.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| habit_id | integer | Related habit |
| completed_at | timestamptz | Completion timestamp |

### groups
Stores accountability groups.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| name | varchar(150) | Group name |
| description | text | Group description |
| owner_id | integer | Group creator |
| created_at | timestamptz | Creation timestamp |

### group_members
Maps users to groups with a role.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| group_id | integer | Related group |
| user_id | integer | Related user |
| role | varchar(20) | admin or member |
| joined_at | timestamptz | Join timestamp |

### badges
Stores available badge definitions.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| name | varchar(120) | Badge name |
| description | text | Badge description |
| created_at | timestamptz | Creation timestamp |

### user_badges
Stores which badges a user has earned.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| user_id | integer | Related user |
| badge_id | integer | Related badge |
| earned_at | timestamptz | Earned timestamp |

### notifications
Stores user-facing notifications.

| Column | Type | Description |
| --- | --- | --- |
| id | integer | Primary key |
| user_id | integer | Related user |
| type | varchar(30) | reminder, badge, or system |
| message | text | Notification message |
| read_at | timestamptz | Read timestamp |
| created_at | timestamptz | Creation timestamp |

## Relationships

- users -> habits: one-to-many
- habits -> habit_completions: one-to-many
- users -> groups: one-to-many through owner_id
- groups -> group_members -> users: many-to-many
- users -> badges through user_badges: many-to-many
- users -> notifications: one-to-many

## Useful queries

### List habits for a user

```sql
SELECT id, name, frequency, streak, created_at
FROM habits
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Show completion history for a habit

```sql
SELECT completed_at
FROM habit_completions
WHERE habit_id = 1
ORDER BY completed_at DESC;
```

### Show group members

```sql
SELECT g.name, u.name, gm.role
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
JOIN users u ON u.id = gm.user_id;
```

## Notes

The server can fall back to an in-memory PostgreSQL-compatible database with pg-mem when a live PostgreSQL instance is not available. For production, it is recommended to use a real PostgreSQL server and the environment variables described above.
