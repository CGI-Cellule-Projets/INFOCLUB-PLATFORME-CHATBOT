# 🎓 University Club API

A backend built with **FastAPI** + **SQLModel** + **MySQL**.

---

## 📁 Project Structure

```
club_app/
├── main.py                  ← App entry point
├── requirements.txt         ← All dependencies
├── .env.example             ← Copy this to .env and fill in your DB info
│
├── core/
│   ├── database.py          ← MySQL connection
│   └── security.py          ← Password hashing & JWT tokens
│
├── models/
│   └── models.py            ← All 3 database tables
│
└── routers/
    ├── auth.py              ← Login / Get my profile
    ├── members.py           ← Member management
    ├── events.py            ← Event scheduling + attendance
    └── posts.py             ← Blog posts
```

---

## 🗄️ Database Tables

### 👥 Member
| Column | Type | Notes |
|---|---|---|
| id | int | Primary key |
| full_name | str | |
| email | str | Unique, used for login |
| student_id | str | Optional, unique |
| major | str | Optional |
| year_of_study | int | 1–4 |
| phone | str | Optional |
| role | enum | `head` or `cell` |
| status | enum | `pending`, `active`, `inactive` |
| head_id | int | FK → Member (Cell belongs to a Head) |
| hashed_password | str | Never exposed in API |
| joined_at | datetime | Auto set |

### 📅 Event
| Column | Type | Notes |
|---|---|---|
| id | int | Primary key |
| title | str | |
| description | str | Optional |
| location | str | Optional |
| starts_at | datetime | |
| ends_at | datetime | Optional |
| status | enum | `upcoming`, `ongoing`, `finished`, `cancelled` |
| max_attendees | int | Optional (None = unlimited) |
| created_by_id | int | FK → Member |
| created_at | datetime | Auto set |

### 📝 Post
| Column | Type | Notes |
|---|---|---|
| id | int | Primary key |
| title | str | |
| content | str | Full blog body |
| image_url | str | Optional cover image |
| is_published | bool | Draft or live |
| likes_count | int | Auto incremented |
| comments_count | int | Auto incremented |
| views_count | int | Auto incremented on read |
| author_id | int | FK → Member |
| created_at | datetime | Auto set |
| updated_at | datetime | Auto updated |

---

## 🚀 Setup & Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up your database
Create a MySQL database called `club_db`, then copy `.env.example` to `.env` and fill in your credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=club_db
SECRET_KEY=any-long-random-string
```

### 3. Run the server
```bash
uvicorn main:app --reload
```

### 4. Open the interactive docs
Visit → **http://localhost:8000/docs**

All tables are created automatically on first run. ✅

---

## 🔐 Roles

| Role | Can do |
|---|---|
| **Head** | Everything — manage members, create events, write posts |
| **Cell** | Register, login, view events/posts, RSVP to events |
