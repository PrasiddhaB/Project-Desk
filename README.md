<<<<<<< HEAD
# Project Desk

A comprehensive task management and collaborative note-taking platform built with Django DRF + React + TypeScript + Tailwind CSS + PostgreSQL.

## Tech Stack

### Backend
- **Django 4.2+** - Python web framework
- **Django REST Framework** - REST API toolkit
- **Django Simple JWT** - JWT authentication
- **PostgreSQL** - Database
- **pgAdmin 4** - Database management

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool
- **React Router v6** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
Project_Desk/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── serializers/
│   │   │   ├── views/
│   │   │   ├── services/
│   │   │   ├── models.py
│   │   │   ├── urls.py
│   │   │   ├── permissions.py
│   │   │   └── admin.py
│   │   └── common/
│   │       ├── permissions.py
│   │       ├── exceptions.py
│   │       └── utils.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router/
│   │   │   └── providers/
│   │   ├── services/
│   │   │   ├── http/
│   │   │   └── auth/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   ├── api/
│   │   │   │   ├── hooks/
│   │   │   │   └── types.ts
│   │   │   └── dashboard/
│   │   │       └── pages/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── layout/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
│
└── db/
    └── init.sql
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- pgAdmin 4 (optional, for database management)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Create PostgreSQL database:
```bash
# Using psql
createdb project_desk_db

# Or using pgAdmin 4
# Create a new database named 'project_desk_db'
```

6. Run migrations:
```bash
python manage.py migrate
```

7. Create superuser:
```bash
python manage.py createsuperuser
```

8. Run development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# .env file is already configured for development
# Modify if needed:
VITE_API_BASE_URL=http://localhost:8000/api
```

4. Run development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173/`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/logout/` | User logout |
| GET | `/api/auth/me/` | Get current user |
| POST | `/api/auth/token/refresh/` | Refresh access token |

### Request/Response Examples

#### Register
```json
POST /api/auth/register/
{
  "full_name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "full_name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "employee"
    },
    "tokens": {
      "access": "eyJ...",
      "refresh": "eyJ..."
    }
  }
}
```

#### Login
```json
POST /api/auth/login/
{
  "username": "johndoe",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "access": "eyJ...",
      "refresh": "eyJ..."
    }
  }
}
```

## Features (Sprint 1)

- [x] User Registration
- [x] User Login
- [x] JWT Authentication
- [x] Protected Routes
- [x] Role-based Access (Admin/Employee)
- [x] Dashboard Page
- [x] Responsive Design

## Color Scheme

The application uses a consistent color scheme:

- **Primary Gradient**: `#667eea` to `#764ba2` (Purple gradient)
- **Primary Blue**: `#1a73e8` (Google Blue)
- **Dark Blue**: `#0d47a1`
- **Background**: `#f8f9fa` (Light gray)

## Development

### Running Tests

Backend:
```bash
cd backend
python manage.py test
```

Frontend:
```bash
cd frontend
npm run lint
```

### Building for Production

Backend:
```bash
# Set DJANGO_SETTINGS_MODULE=config.settings.prod
python manage.py collectstatic
```

Frontend:
```bash
npm run build
```

## Database Management with pgAdmin 4

1. Open pgAdmin 4
2. Add a new server connection:
   - Host: localhost
   - Port: 5432
   - Database: project_desk_db
   - Username: postgres
   - Password: your_password

3. You can view and manage:
   - Users table
   - Security questions
   - All Django tables

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
=======
# Project-Desk
A web-based productivity system combining tasks, notes, collaboration, role-based access, and subscription features with Khalti payment integration.
>>>>>>> 50cd6d383bf6cc249d2a2625c1b192d5c2af29aa
