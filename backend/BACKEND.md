# ASA Policy App - Backend

FastAPI backend for the ASA Policy Management System with Supabase integration.

> Created with the help of Cursor AI

## Prerequisites

- Python 3.9 or higher
- A Supabase account and project
- pip (Python package manager)

## Quick Start

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Settings** → **API** to get your credentials:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_KEY)
   - **service_role** key (SUPABASE_SERVICE_KEY) - Keep this secret!

### 3. Set Up Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Open `database/database_schema.sql` from this project
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the script
5. Verify tables were created by going to **Table Editor** - you should see:
   - `policies`
   - `bylaws`
   - `suggestions`
   - `users`
   - `policy_versions`

**Note:** The schema file includes all necessary tables, indexes, triggers, and Row-Level Security (RLS) policies.

### 4. Configure Environment Variables

1. Create a `.env` file in the `backend` directory:

   ```bash
   touch .env
   ```

2. Add your Supabase credentials to `.env`:

   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-key-here
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

3. **Important**: Never commit the `.env` file to git (it's already in `.gitignore`)

### 5. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 6. Install Dependencies

```bash
pip install -r requirements.txt
```

### 7. Run the Backend

**Option 1: Using the run script (recommended)**

```bash
# Make sure the script is executable
chmod +x run.sh

# Run the backend
./run.sh
```

**Option 2: Manual run**

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Run the server
uvicorn main:app --reload
```

The backend will start at `http://localhost:8000`

### 8. Verify It's Working

- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Project Structure

```
backend/
├── app/
│   ├── core/           # Core functionality (auth, config, database)
│   ├── models/         # Pydantic schemas
│   └── routers/        # API route handlers
├── database/           # Database schema SQL files
│   └── database_schema.sql      # Complete database schema
├── main.py             # FastAPI application entry point
├── requirements.txt    # Python dependencies
└── BACKEND.md          # This file
```

## Database Schema Files

The database schema is located in the `database/` folder:

- **`database/database_schema.sql`** - Complete database schema with all tables, indexes, triggers, and RLS policies (run this for new installations)

## Creating Your First Admin User

After setting up the database:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password
4. Go to **Table Editor** → `users` table
5. Find the user by email and update the `role` field to `admin`

Or use SQL:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## API Endpoints

Once running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints:

- `POST /api/auth/login` - Login (admin or policy_working_group only)
- `GET /api/policies/approved` - Get approved policies (public)
- `POST /api/policies/` - Create policy (admin or policy_working_group)
- `PUT /api/policies/{policy_id}/approve` - Approve policy (admin only)
- `GET /api/suggestions/` - List suggestions (admin or policy_working_group)
- `DELETE /api/suggestions/{suggestion_id}` - Delete suggestion (admin or policy_working_group)

## Troubleshooting

### Virtual Environment Not Activated

If you get import errors, make sure the virtual environment is activated:

```bash
# Check if venv is active (should show venv path)
echo $VIRTUAL_ENV

# If empty, activate it
source venv/bin/activate  # macOS/Linux
```

### Module Not Found Errors

```bash
# Make sure you're in the virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt
```

### Database Connection Errors

- Verify your `.env` file has correct Supabase credentials
- Check that the database schema has been run in Supabase SQL Editor
- Ensure your Supabase project is active

### Port Already in Use

If port 8000 is already in use, you can change it:

```bash
uvicorn main:app --reload --port 8001
```

## Development

The backend uses:
- **FastAPI** - Web framework
- **Supabase** - Database and authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

For development, the server runs with `--reload` flag for auto-reloading on code changes.
