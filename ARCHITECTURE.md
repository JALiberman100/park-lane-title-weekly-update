# Architecture Proposal: Multi-User Weekly Update System

## Tech Stack Recommendation

### Frontend
- **React 18** + **Vite** - Fast dev server, modern React features
- **TypeScript** - Type safety for better maintainability
- **TanStack Query (React Query)** - Server state management, caching, auto-refetch
- **Zustand** - Lightweight client state (user name, UI state)
- **React Hook Form** - Form handling
- **Tailwind CSS** or **styled-components** - Styling (keep existing CSS or modernize)

### Backend
- **Node.js** + **Express** - Web server framework
- **TypeScript** - Type safety
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auto APIs + Real-time)
- **@supabase/supabase-js** - Supabase JavaScript client
- **Zod** - Runtime validation

### Infrastructure
- **Supabase** - Managed PostgreSQL database + hosting
- **Railway** or **Vercel** - Frontend hosting (optional, can also use Supabase hosting)
- **Environment variables** - Config management

### Why Supabase?
- ✅ **Free tier** - Perfect for small teams (5-10 users)
- ✅ **No database setup** - Managed PostgreSQL, no installation needed
- ✅ **Auto-generated APIs** - REST and GraphQL APIs out of the box
- ✅ **Real-time subscriptions** - Built-in WebSocket support (we'll use this later!)
- ✅ **Easy to use** - Simple JavaScript client, no complex ORM setup
- ✅ **Great dashboard** - Visual database editor, SQL editor, API docs
- ✅ **Scales easily** - Can upgrade as you grow

## Database Schema

```sql
-- Users table (simple, no auth yet)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Weekly updates (one per week)
CREATE TABLE weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_date DATE NOT NULL UNIQUE, -- Format: YYYY-MM-DD (Monday of week)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Project tracker items (6 business functions)
CREATE TABLE project_tracker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  business_need VARCHAR(100) NOT NULL, -- e.g., "Entity Formation & Licensing"
  description TEXT,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Weekly checklist tasks
CREATE TABLE checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  department VARCHAR(50) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'Medium',
  due_date DATE,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Underwriter checklist items
CREATE TABLE underwriter_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Weekly notes (multiple note blocks per week)
CREATE TABLE weekly_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  contributor UUID REFERENCES users(id),
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log (track all changes)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'completed'
  entity_type VARCHAR(50) NOT NULL, -- 'project_tracker', 'checklist_task', etc.
  entity_id UUID NOT NULL,
  changes JSONB, -- Store what changed
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Design

### REST Endpoints

```
GET    /api/weekly-updates/:weekDate          # Get specific week's data
GET    /api/weekly-updates                    # List all weeks (for archive)
POST   /api/weekly-updates/:weekDate         # Create new week
PATCH  /api/weekly-updates/:weekDate          # Update week metadata

GET    /api/project-tracker/:weekDate         # Get project tracker for week
PATCH  /api/project-tracker/:id               # Update specific project item

GET    /api/checklist/:weekDate              # Get checklist for week
POST   /api/checklist                         # Create new task
PATCH  /api/checklist/:id                     # Update task
DELETE /api/checklist/:id                     # Delete task

GET    /api/underwriter/:weekDate             # Get underwriter checklist
POST   /api/underwriter                       # Create item
PATCH  /api/underwriter/:id                   # Update item
DELETE /api/underwriter/:id                   # Delete item

GET    /api/notes/:weekDate                   # Get notes for week
POST   /api/notes                             # Create note block
PATCH  /api/notes/:id                         # Update note
DELETE /api/notes/:id                         # Delete note

GET    /api/activity/:weekDate                # Get activity log for week
GET    /api/users                             # List users (for dropdowns)
POST   /api/users                             # Create/register user (just name)
```

## Implementation Plan - Detailed Step-by-Step Guide

> **Note for Beginners**: This guide assumes you have Node.js installed. If not, download it from [nodejs.org](https://nodejs.org/) (get the LTS version). After installing, open a terminal/command prompt and type `node --version` to verify it worked.

---

## Phase 1: Setup & Migration

### Step 1.1: Install Prerequisites

**What you need:**
- **Node.js** (v18 or higher) - JavaScript runtime
- **npm** (comes with Node.js) - Package manager
- **Git** (optional but recommended) - Version control

**Verify installation:**
```bash
# Open terminal/command prompt (PowerShell on Windows)
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

**If Node.js isn't installed:**
1. Go to https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer (accept all defaults)
4. Restart your terminal
5. Run the commands above again

---

### Step 1.2: Create Project Structure

**What we're doing:** Creating folders for frontend and backend code.

**Commands to run:**
```bash
# Navigate to your project folder
cd "c:\Users\lucas\Desktop\Jakes Title App"

# Create the folder structure
mkdir frontend
mkdir backend
mkdir shared

# Verify folders were created
ls  # On Windows PowerShell, use: dir
```

**What this does:**
- `frontend/` - All React code (what users see)
- `backend/` - All server code (API, database)
- `shared/` - Code used by both (TypeScript types)

---

### Step 1.3: Initialize Frontend (React + Vite + TypeScript)

**What we're doing:** Setting up the React frontend with Vite (fast build tool) and TypeScript.

**Commands:**
```bash
# Navigate to frontend folder
cd frontend

# Create React + TypeScript project with Vite
npm create vite@latest . -- --template react-ts

# This will ask you some questions:
# - Package name: press Enter (uses folder name)
# - Select a framework: React (should be default)
# - Select a variant: TypeScript (should be default)

# Install dependencies (this downloads all the packages)
npm install

# Install additional packages we'll need
npm install @tanstack/react-query zustand react-hook-form axios

# Install development dependencies for TypeScript types
npm install --save-dev @types/node
```

**What each package does:**
- `@tanstack/react-query` - Manages server data (fetching, caching, updates)
- `zustand` - Simple state management (user name, UI state)
- `react-hook-form` - Makes forms easier to handle
- `axios` - Makes HTTP requests to backend
- `@types/node` - TypeScript definitions for Node.js

**Verify it works:**
```bash
# Start the development server
npm run dev

# You should see something like:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# Open this URL in your browser - you should see a React logo
```

**Press Ctrl+C to stop the server when done testing.**

---

### Step 1.4: Initialize Backend (Express + TypeScript)

**What we're doing:** Setting up the Node.js backend server.

**Commands:**
```bash
# Navigate to backend folder (from project root)
cd ../backend

# Initialize a new Node.js project
npm init -y

# Install Express and TypeScript
npm install express cors dotenv
npm install --save-dev typescript @types/node @types/express @types/cors ts-node nodemon

# Install Supabase (database + backend)
npm install @supabase/supabase-js

# Install validation library
npm install zod
```

**What each package does:**
- `express` - Web server framework
- `cors` - Allows frontend to talk to backend
- `dotenv` - Loads environment variables (.env file)
- `typescript` - TypeScript compiler
- `ts-node` - Run TypeScript directly
- `nodemon` - Auto-restarts server when code changes
- `@supabase/supabase-js` - Supabase JavaScript client (database + APIs)
- `zod` - Validates data

**Create TypeScript config:**
Create a file `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Update package.json scripts:**
Open `backend/package.json` and replace the `"scripts"` section:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.ts"
  }
}
```

**Create basic server file:**
Create `backend/src/server.ts`:
```typescript
import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Parse JSON request bodies

// Basic route to test server
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

**Test the backend:**
```bash
# Start the backend server
npm run dev

# In another terminal, test it:
# On Windows PowerShell:
curl http://localhost:3001/api/health

# Or open browser to: http://localhost:3001/api/health
# You should see: {"status":"ok","message":"Server is running!"}
```

---

### Step 1.5: Set Up Supabase Database

**What we're doing:** Creating a Supabase project and setting up our database schema. Supabase gives us a PostgreSQL database plus auto-generated APIs - much easier than setting up Prisma!

**Create Supabase Account & Project:**

1. **Sign up for Supabase** (it's free!)
   - Go to https://supabase.com/
   - Click "Start your project"
   - Sign up with GitHub, Google, or email
   - Verify your email if needed

2. **Create a new project**
   - Click "New Project"
   - Fill in:
     - **Name**: `park-lane-title` (or whatever you want)
     - **Database Password**: Create a strong password (SAVE THIS! You'll need it)
     - **Region**: Choose closest to you (e.g., `US East`)
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

3. **Get your API keys**
   - Once project is ready, go to **Settings** → **API**
   - You'll see:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon public key**: `eyJhbGc...` (long string)
     - **service_role key**: `eyJhbGc...` (keep this secret!)
   - Copy these - you'll need them!

**Install Supabase Client:**

```bash
# Still in backend folder
npm install @supabase/supabase-js

# Also install in frontend (we'll use it there too)
cd ../frontend
npm install @supabase/supabase-js
cd ../backend
```

**Create environment file:**

Create `backend/.env` file:
```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...

# Server port
PORT=3001
```

**Create the database tables in Supabase:**

1. **Go to Supabase Dashboard**
   - Open your project
   - Click **SQL Editor** in the left sidebar

2. **Run this SQL to create all tables:**

Copy and paste this entire SQL script into the SQL Editor, then click "Run":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simple, no auth yet)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Weekly updates (one per week)
CREATE TABLE IF NOT EXISTS weekly_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Project tracker items (6 business functions)
CREATE TABLE IF NOT EXISTS project_tracker_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  business_need VARCHAR(100) NOT NULL,
  description TEXT,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Weekly checklist tasks
CREATE TABLE IF NOT EXISTS checklist_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  department VARCHAR(50) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'Medium',
  due_date DATE,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Underwriter checklist items
CREATE TABLE IF NOT EXISTS underwriter_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Weekly notes (multiple note blocks per week)
CREATE TABLE IF NOT EXISTS weekly_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  contributor UUID REFERENCES users(id),
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log (track all changes)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_update_id UUID REFERENCES weekly_updates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_updates_week_date ON weekly_updates(week_date);
CREATE INDEX IF NOT EXISTS idx_project_tracker_weekly_update ON project_tracker_items(weekly_update_id);
CREATE INDEX IF NOT EXISTS idx_checklist_weekly_update ON checklist_tasks(weekly_update_id);
CREATE INDEX IF NOT EXISTS idx_underwriter_weekly_update ON underwriter_checklist_items(weekly_update_id);
CREATE INDEX IF NOT EXISTS idx_notes_weekly_update ON weekly_notes(weekly_update_id);
CREATE INDEX IF NOT EXISTS idx_activity_weekly_update ON activity_log(weekly_update_id);
```

3. **Verify tables were created**
   - Go to **Table Editor** in left sidebar
   - You should see all 7 tables listed!

**Set up Row Level Security (RLS) - Optional but Recommended:**

Since we're not using auth yet, we can either:
- **Option A**: Disable RLS for now (simpler, but less secure)
  - Go to **Authentication** → **Policies**
  - For each table, you can disable RLS temporarily
  - Or create policies that allow all operations

- **Option B**: Create policies that allow all operations (better practice)
  - In SQL Editor, run:
```sql
-- Allow all operations on all tables (since we're not using auth yet)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tracker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE underwriter_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies that allow everything (we'll restrict later when we add auth)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on weekly_updates" ON weekly_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on project_tracker_items" ON project_tracker_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on checklist_tasks" ON checklist_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on underwriter_checklist_items" ON underwriter_checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on weekly_notes" ON weekly_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
```

**Verify it worked:**
- Go to **Table Editor** → Click on any table
- You should see an empty table with the correct columns
- Try inserting a test row manually to make sure it works!

---

### Step 1.6: Create Basic API Endpoints

**What we're doing:** Building the REST API endpoints that the frontend will call.

**Create folder structure:**
```bash
# In backend folder
mkdir src\routes
mkdir src\controllers
mkdir src\middleware
mkdir src\utils
```

**Set up Supabase Client:**
Create `backend/src/utils/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key (bypasses RLS)
// Use service role for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Also export a client for frontend use (with anon key)
// This will be used in frontend code
export function createSupabaseClient(anonKey: string) {
  return createClient(supabaseUrl, anonKey);
}
```

**Create user middleware:**
Create `backend/src/middleware/user.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';

// This middleware finds or creates a user based on the name in the request header
export async function findOrCreateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userName = req.headers['x-user-name'] as string;

  if (!userName) {
    return res.status(400).json({ error: 'User name is required' });
  }

  try {
    // Find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('name', userName)
      .single();

    let user;

    if (existingUser) {
      // Update last seen
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ name: userName })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    res.status(500).json({ error: 'Failed to process user' });
  }
}
```

**Create weekly updates route:**
Create `backend/src/routes/weekly-updates.ts`:
```typescript
import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { findOrCreateUser } from '../middleware/user';

const router = Router();

// Get all weekly updates (for archive page)
router.get('/', async (req, res) => {
  try {
    const { data: updates, error } = await supabase
      .from('weekly_updates')
      .select(`
        *,
        created_by_user:users!weekly_updates_created_by_fkey(name),
        updated_by_user:users!weekly_updates_updated_by_fkey(name)
      `)
      .order('week_date', { ascending: false });

    if (error) throw error;
    res.json(updates);
  } catch (error) {
    console.error('Error fetching weekly updates:', error);
    res.status(500).json({ error: 'Failed to fetch weekly updates' });
  }
});

// Get specific week's data
router.get('/:weekDate', findOrCreateUser, async (req, res) => {
  try {
    const { weekDate } = req.params;
    const userId = (req as any).user?.id;

    // Try to get existing weekly update
    const { data: existingUpdate, error: findError } = await supabase
      .from('weekly_updates')
      .select(`
        *,
        project_tracker_items:project_tracker_items(*),
        checklist_tasks:checklist_tasks(*),
        underwriter_checklist_items:underwriter_checklist_items(*),
        weekly_notes:weekly_notes(
          *,
          contributor_user:users!weekly_notes_contributor_fkey(name)
        )
      `)
      .eq('week_date', weekDate)
      .single();

    let weeklyUpdate;

    if (existingUpdate) {
      weeklyUpdate = existingUpdate;
    } else {
      // Create if doesn't exist
      const { data: newUpdate, error: createError } = await supabase
        .from('weekly_updates')
        .insert({
          week_date: weekDate,
          created_by: userId,
          updated_by: userId,
        })
        .select(`
          *,
          project_tracker_items:project_tracker_items(*),
          checklist_tasks:checklist_tasks(*),
          underwriter_checklist_items:underwriter_checklist_items(*),
          weekly_notes:weekly_notes(
            *,
            contributor_user:users!weekly_notes_contributor_fkey(name)
          )
        `)
        .single();

      if (createError) throw createError;
      weeklyUpdate = newUpdate;
    }

    res.json(weeklyUpdate);
  } catch (error) {
    console.error('Error fetching weekly update:', error);
    res.status(500).json({ error: 'Failed to fetch weekly update' });
  }
});

export default router;
```

**Update server.ts to use routes:**
Update `backend/src/server.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import weeklyUpdatesRoutes from './routes/weekly-updates';
import { findOrCreateUser } from './middleware/user';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// API routes (with user middleware)
app.use('/api/weekly-updates', findOrCreateUser, weeklyUpdatesRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

**Test the API:**
```bash
# Start backend server
npm run dev

# In another terminal, test it:
# Windows PowerShell:
curl -H "x-user-name: Test User" http://localhost:3001/api/weekly-updates/2025-01-13

# Should return JSON with weekly update data
```

---

### Step 1.7: Migrate HTML/CSS to React Components

**What we're doing:** Converting the existing HTML into React components.

**Create component structure:**
```bash
# In frontend folder
cd ../frontend
mkdir src\components
mkdir src\components\ProjectTracker
mkdir src\components\Checklist
mkdir src\components\UnderwriterChecklist
mkdir src\components\WeeklyNotes
mkdir src\components\Archive
mkdir src\hooks
mkdir src\services
mkdir src\store
mkdir src\types
```

**Copy existing CSS:**
```bash
# Copy styles.css to frontend
copy ..\styles.css src\styles.css
```

**Create API service:**
Create `frontend/src/services/api.ts`:
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get user name from localStorage
const getUserName = () => {
  return localStorage.getItem('userName') || '';
};

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user name to every request
api.interceptors.request.use((config) => {
  const userName = getUserName();
  if (userName) {
    config.headers['x-user-name'] = userName;
  }
  return config;
});

export default api;
```

**Create user store:**
Create `frontend/src/store/userStore.ts`:
```typescript
import { create } from 'zustand';

interface UserState {
  userName: string;
  setUserName: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userName: localStorage.getItem('userName') || '',
  setUserName: (name: string) => {
    localStorage.setItem('userName', name);
    set({ userName: name });
  },
}));
```

**Create types:**
Create `frontend/src/types/index.ts`:
```typescript
export interface WeeklyUpdate {
  id: string;
  weekDate: string;
  createdAt: string;
  updatedAt: string;
  projectTrackerItems: ProjectTrackerItem[];
  checklistTasks: ChecklistTask[];
  underwriterChecklistItems: UnderwriterChecklistItem[];
  weeklyNotes: WeeklyNote[];
}

export interface ProjectTrackerItem {
  id: string;
  businessNeed: string;
  description: string | null;
  details: string | null;
  status: string;
  dueDate: string | null;
}

export interface ChecklistTask {
  id: string;
  description: string;
  department: string;
  priority: string;
  dueDate: string | null;
  notes: string | null;
  completed: boolean;
}

export interface UnderwriterChecklistItem {
  id: string;
  description: string;
  completed: boolean;
}

export interface WeeklyNote {
  id: string;
  content: string;
  contributor: string | null;
  isClosed: boolean;
}
```

**Create basic App component:**
Update `frontend/src/App.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { useUserStore } from './store/userStore';
import './styles.css';

function App() {
  const { userName, setUserName } = useUserStore();
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    // Check if user name exists
    if (!userName) {
      const saved = localStorage.getItem('userName');
      if (saved) {
        setUserName(saved);
      }
    }
  }, [userName, setUserName]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setNameInput('');
    }
  };

  if (!userName) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Welcome to Park Lane Title Weekly Update</h1>
        <p>Please enter your name to continue:</p>
        <form onSubmit={handleNameSubmit}>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            style={{ padding: '0.5rem', marginRight: '0.5rem' }}
          />
          <button type="submit">Continue</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <header style={{ padding: '1rem', background: '#1e3a8a', color: 'white' }}>
        <h1>Park Lane Title - Weekly Update</h1>
        <p>Welcome, {userName}!</p>
      </header>
      <main style={{ padding: '2rem' }}>
        <p>Main content will go here...</p>
        {/* TODO: Add components */}
      </main>
    </div>
  );
}

export default App;
```

**Test the frontend:**
```bash
# Start frontend dev server
npm run dev

# Open http://localhost:5173
# You should see the name input form
# After entering your name, you should see the welcome message
```

---

## Phase 2: Core Features

### Step 2.1: User Name Input on First Visit

**What we're doing:** Making sure users enter their name before using the app.

**This is already done in Step 1.7!** The `App.tsx` component checks for a user name and shows a form if it doesn't exist.

**Enhancement - Add name change option:**
Update `frontend/src/App.tsx` to add a "Change Name" button:
```typescript
// Add this button in the header section
<button onClick={() => setUserName('')}>Change Name</button>
```

---

### Step 2.2: Weekly Update CRUD Operations

**What we're doing:** Creating React Query hooks to fetch and update weekly data.

**Install React Query:**
```bash
# Already installed in Step 1.3, but verify:
npm install @tanstack/react-query
```

**Set up React Query:**
Update `frontend/src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Create React Query hooks:**
Create `frontend/src/hooks/useWeeklyUpdate.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { WeeklyUpdate } from '../types';

// Get current week date (Monday of current week)
function getCurrentWeekDate(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Fetch weekly update
export function useWeeklyUpdate(weekDate?: string) {
  const date = weekDate || getCurrentWeekDate();

  return useQuery({
    queryKey: ['weeklyUpdate', date],
    queryFn: async () => {
      const response = await api.get<WeeklyUpdate>(`/weekly-updates/${date}`);
      return response.data;
    },
  });
}

// Create or update weekly update
export function useUpdateWeeklyUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ weekDate, data }: { weekDate: string; data: Partial<WeeklyUpdate> }) => {
      const response = await api.patch(`/weekly-updates/${weekDate}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Refetch the weekly update after update
      queryClient.invalidateQueries({ queryKey: ['weeklyUpdate', variables.weekDate] });
    },
  });
}
```

**Use the hook in App:**
Update `frontend/src/App.tsx`:
```typescript
import { useWeeklyUpdate } from './hooks/useWeeklyUpdate';

function App() {
  // ... existing code ...
  
  const { data: weeklyUpdate, isLoading, error } = useWeeklyUpdate();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      {/* ... existing header ... */}
      <main>
        <p>Week of: {weeklyUpdate?.weekDate}</p>
        {/* TODO: Add components that use weeklyUpdate data */}
      </main>
    </div>
  );
}
```

---

### Step 2.3: Project Tracker Editing

**What we're doing:** Creating a component to display and edit the project tracker table.

**Create Project Tracker component:**
Create `frontend/src/components/ProjectTracker/ProjectTracker.tsx`:
```typescript
import { useState } from 'react';
import { ProjectTrackerItem } from '../../types';
import api from '../../services/api';

interface ProjectTrackerProps {
  items: ProjectTrackerItem[];
  weeklyUpdateId: string;
  onUpdate: () => void;
}

const BUSINESS_NEEDS = [
  'Entity Formation & Licensing',
  'Qualia Go Live',
  'Insurance & Bonding',
  'Bank Selection & Account Set Up',
  'Underwriter Appointments',
  'VP/GM Hiring',
  'Legal',
];

export function ProjectTracker({ items, weeklyUpdateId, onUpdate }: ProjectTrackerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, field: string, value: string) => {
    try {
      await api.patch(`/project-tracker/${id}`, { [field]: value });
      onUpdate();
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update. Please try again.');
    }
  };

  return (
    <div>
      <h2>PROJECT TRACKER</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Business Need</th>
            <th>Description</th>
            <th>Details</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {BUSINESS_NEEDS.map((businessNeed) => {
            const item = items.find((i) => i.businessNeed === businessNeed);
            return (
              <tr key={businessNeed}>
                <td>{businessNeed}</td>
                <td
                  contentEditable
                  onBlur={(e) => {
                    if (item) {
                      handleUpdate(item.id, 'description', e.currentTarget.textContent || '');
                    }
                  }}
                >
                  {item?.description || ''}
                </td>
                <td
                  contentEditable
                  onBlur={(e) => {
                    if (item) {
                      handleUpdate(item.id, 'details', e.currentTarget.textContent || '');
                    }
                  }}
                >
                  {item?.details || ''}
                </td>
                <td>
                  {item && (
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdate(item.id, 'status', e.target.value)}
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>On Track</option>
                      <option>At Risk</option>
                      <option>Complete</option>
                    </select>
                  )}
                </td>
                <td>
                  {item && (
                    <input
                      type="date"
                      value={item.dueDate || ''}
                      onChange={(e) => handleUpdate(item.id, 'dueDate', e.target.value)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Create API endpoint for project tracker:**
Create `backend/src/routes/project-tracker.ts`:
```typescript
import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { findOrCreateUser } from '../middleware/user';

const router = Router();

// Update project tracker item
router.patch('/:id', findOrCreateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = (req as any).user.id;

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.details !== undefined) dbUpdates.details = updates.details;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    dbUpdates.updated_by = userId;
    dbUpdates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('project_tracker_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    console.error('Error updating project tracker:', error);
    res.status(500).json({ error: 'Failed to update project tracker' });
  }
});

export default router;
```

**Add route to server:**
Update `backend/src/server.ts`:
```typescript
import projectTrackerRoutes from './routes/project-tracker';

// Add this line:
app.use('/api/project-tracker', findOrCreateUser, projectTrackerRoutes);
```

---

### Step 2.4: Checklist Management

**What we're doing:** Creating components to add, edit, and delete checklist tasks.

**Create Checklist component:**
Create `frontend/src/components/Checklist/Checklist.tsx`:
```typescript
import { useState } from 'react';
import { ChecklistTask } from '../../types';
import api from '../../services/api';

interface ChecklistProps {
  tasks: ChecklistTask[];
  weeklyUpdateId: string;
  onUpdate: () => void;
}

export function Checklist({ tasks, weeklyUpdateId, onUpdate }: ChecklistProps) {
  const [newTask, setNewTask] = useState({
    description: '',
    department: 'Other',
    priority: 'Medium',
    dueDate: '',
  });

  const handleAddTask = async () => {
    if (!newTask.description.trim()) return;

    try {
      await api.post('/checklist', {
        ...newTask,
        weeklyUpdateId,
      });
      setNewTask({ description: '', department: 'Other', priority: 'Medium', dueDate: '' });
      onUpdate();
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('Failed to add task');
    }
  };

  const handleToggleComplete = async (task: ChecklistTask) => {
    try {
      await api.patch(`/checklist/${task.id}`, {
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null,
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      await api.delete(`/checklist/${id}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div>
      <h2>WEEKLY CHECKLIST</h2>
      
      {/* Add new task form */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Task description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <select
          value={newTask.department}
          onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
        >
          <option>VP/GM Hiring</option>
          <option>Revenue Forecast</option>
          <option>Technology</option>
          <option>Finance</option>
          <option>Insurance</option>
          <option>Bonding</option>
          <option>Legal</option>
          <option>Other</option>
        </select>
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
        />
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      {/* Task list */}
      <ul>
        {tasks.map((task) => (
          <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => handleToggleComplete(task)}
            />
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.description}
            </span>
            <span>{task.department}</span>
            <span>{task.priority}</span>
            <button onClick={() => handleDelete(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Create checklist API routes:**
Create `backend/src/routes/checklist.ts`:
```typescript
import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { findOrCreateUser } from '../middleware/user';

const router = Router();

// Create task
router.post('/', findOrCreateUser, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Convert camelCase to snake_case
    const taskData = {
      weekly_update_id: req.body.weeklyUpdateId,
      description: req.body.description,
      department: req.body.department,
      priority: req.body.priority,
      due_date: req.body.dueDate || null,
      notes: req.body.notes || null,
      created_by: userId,
      updated_by: userId,
    };

    const { data: task, error } = await supabase
      .from('checklist_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.patch('/:id', findOrCreateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Convert camelCase to snake_case
    const updates: any = {};
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.department !== undefined) updates.department = req.body.department;
    if (req.body.priority !== undefined) updates.priority = req.body.priority;
    if (req.body.dueDate !== undefined) updates.due_date = req.body.dueDate;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.completed !== undefined) updates.completed = req.body.completed;
    if (req.body.completedAt !== undefined) updates.completed_at = req.body.completedAt;
    updates.updated_by = userId;
    updates.updated_at = new Date().toISOString();

    const { data: task, error } = await supabase
      .from('checklist_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('checklist_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
```

**Add route to server:**
```typescript
import checklistRoutes from './routes/checklist';
app.use('/api/checklist', findOrCreateUser, checklistRoutes);
```

---

### Step 2.5: Real-time Updates (Optional - Polling)

**What we're doing:** Automatically refresh data every few seconds so users see updates from others.

**Update React Query config:**
Update `frontend/src/main.tsx`:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchInterval: 5000, // Refetch every 5 seconds
      retry: 1,
    },
  },
});
```

**That's it!** React Query will automatically refetch data every 5 seconds.

**For WebSockets (more advanced, skip for now):**
- Would require Socket.io or similar
- More complex setup
- Better for real-time collaboration
- Can add later if needed

---

## Phase 3: Multi-user Features

### Step 3.1: Activity Log Display

**What we're doing:** Showing who made what changes and when.

**Create activity log component:**
Create `frontend/src/components/ActivityLog/ActivityLog.tsx`:
```typescript
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface ActivityLogProps {
  weeklyUpdateId: string;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string;
  user: { name: string };
  createdAt: string;
  changes: any;
}

export function ActivityLog({ weeklyUpdateId }: ActivityLogProps) {
  const { data: activities } = useQuery({
    queryKey: ['activity', weeklyUpdateId],
    queryFn: async () => {
      const response = await api.get<ActivityLogEntry[]>(`/activity/${weeklyUpdateId}`);
      return response.data;
    },
  });

  if (!activities || activities.length === 0) {
    return <div>No activity yet</div>;
  }

  return (
    <div>
      <h3>Recent Activity</h3>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>
            <strong>{activity.user.name}</strong> {activity.action} {activity.entityType} at{' '}
            {new Date(activity.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Create activity log API:**
Create `backend/src/routes/activity.ts`:
```typescript
import { Router } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

router.get('/:weeklyUpdateId', async (req, res) => {
  try {
    const { weeklyUpdateId } = req.params;
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user:users!activity_log_user_id_fkey(name)
      `)
      .eq('weekly_update_id', weeklyUpdateId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
```

**Add activity logging middleware:**
Create `backend/src/middleware/activityLog.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';

export async function logActivity(
  req: Request,
  res: Response,
  action: string,
  entityType: string,
  entityId: string,
  changes?: any
) {
  try {
    const userId = (req as any).user?.id;
    const weeklyUpdateId = (req as any).weeklyUpdateId;

    if (userId && weeklyUpdateId) {
      const { error } = await supabase
        .from('activity_log')
        .insert({
          user_id: userId,
          weekly_update_id: weeklyUpdateId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          changes: changes || {},
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't fail the request if logging fails
  }
}
```

---

### Step 3.2: Show "Last Updated By" on Items

**What we're doing:** Displaying who last modified each item.

**Update Project Tracker component:**
Add to the table row:
```typescript
// In ProjectTracker.tsx, add a column for "Updated By"
// You'll need to fetch the updatedByUser relation in your API call
```

**Update API to include user info:**
Update `backend/src/routes/weekly-updates.ts`:
```typescript
// In the include section, add:
projectTrackerItems: {
  include: {
    updatedByUser: { select: { name: true } },
  },
},
```

---

### Step 3.3: Conflict Resolution

**What we're doing:** Handling cases where two people edit the same thing at the same time.

**Add version field to schema:**
Update `backend/prisma/schema.prisma`:
```prisma
model WeeklyUpdate {
  // ... existing fields ...
  version Int @default(1) // Add this
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_version_field
```

**Update API to check version:**
```typescript
// In update routes, check version matches
const { data: current, error } = await supabase
  .from('weekly_updates')
  .select('version')
  .eq('id', id)
  .single();

if (current && current.version !== req.body.version) {
  return res.status(409).json({ error: 'Conflict: data was modified by another user' });
}
```

**Handle conflict in frontend:**
```typescript
// Show error message and refresh data
if (error.response?.status === 409) {
  alert('Someone else modified this. Refreshing...');
  queryClient.invalidateQueries();
}
```

---

### Step 3.4: User Presence Indicators

**What we're doing:** Showing who's currently viewing/editing.

**Create presence API:**
```typescript
// Track last activity timestamp
// Show users active in last 30 seconds
```

**This is more advanced - can skip for now and add later if needed.**

---

## Phase 4: Polish

### Step 4.1: Better Error Handling

**What we're doing:** Showing user-friendly error messages instead of crashes.

**Create error boundary:**
Create `frontend/src/components/ErrorBoundary.tsx`:
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Step 4.2: Loading States

**What we're doing:** Showing spinners/loading messages while data loads.

**Already handled by React Query!** Use the `isLoading` state:
```typescript
const { data, isLoading } = useWeeklyUpdate();

if (isLoading) {
  return <div>Loading...</div>;
}
```

**Add a spinner component:**
```typescript
// Create a nice loading spinner
// Or use a library like react-spinners
```

---

### Step 4.3: Offline Support

**What we're doing:** Allowing the app to work without internet (advanced, skip for now).

**Would require:**
- Service Worker
- IndexedDB for local storage
- Sync queue for when back online

**Can add later if needed.**

---

### Step 4.4: Export Functionality

**What we're doing:** Allowing users to download PDF or HTML versions.

**Install PDF library:**
```bash
npm install jspdf html2canvas
```

**Create export function:**
```typescript
// Convert React component to PDF
// Or generate HTML file
```

---

## Next Steps Summary

1. ✅ **Complete Phase 1** - Get basic structure working
2. ✅ **Complete Phase 2** - Get core features working
3. ⏭️ **Test locally** - Make sure everything works
4. ⏭️ **Deploy to Railway** - Get it online
5. ⏭️ **Add Phase 3 features** - Multi-user enhancements
6. ⏭️ **Add Phase 4 polish** - Make it production-ready

## Common Issues & Solutions

**Problem:** `npm install` fails
- **Solution:** Make sure Node.js is installed and you're in the right folder

**Problem:** Database connection fails
- **Solution:** Check your DATABASE_URL in .env file

**Problem:** CORS errors in browser
- **Solution:** Make sure backend has `app.use(cors())` middleware

**Problem:** Port already in use
- **Solution:** Change PORT in .env or kill the process using that port

## Resources for Learning

- **React:** https://react.dev/learn
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Supabase:** https://supabase.com/docs
- **React Query:** https://tanstack.com/query/latest
- **Express:** https://expressjs.com/en/guide/routing.html
- **Railway:** https://docs.railway.app/

## Getting Help

If you get stuck:
1. Check browser console (F12) for errors
2. Check terminal/command prompt for backend errors
3. Search error messages on Google/Stack Overflow
4. Check the documentation links above

## Key Features to Implement

### User Tracking (No Auth)
- On first visit, prompt for name
- Store in localStorage
- Send name with every API request
- Backend creates/updates user record automatically
- Show user name in UI (who made what change)

### Conflict Resolution
- Add `version` field to weekly_updates table
- On update, check version matches
- If conflict, show diff and let user choose
- Or use "last write wins" for simplicity

### Real-time Updates (Optional)
- WebSocket connection for live updates
- Or polling every 5-10 seconds
- Show "User X is editing..." indicators

## File Structure

```
park-lane-title-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProjectTracker/
│   │   │   ├── Checklist/
│   │   │   ├── UnderwriterChecklist/
│   │   │   ├── WeeklyNotes/
│   │   │   └── Archive/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── userStore.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── shared/
│   └── types.ts  # Shared TypeScript types
└── railway.json  # Railway config
```

## Railway Configuration

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Migration Strategy

1. **Keep existing app running** while building new one
2. **Export existing data** from localStorage/JSON files
3. **Create migration script** to import into PostgreSQL
4. **Deploy new app** to Railway (can use subdomain initially)
5. **Test with team**, then switch over

## Alternative: Simpler Stack

If you want to move faster:
- **Next.js** (full-stack React framework)
  - API routes built-in
  - Single codebase
  - Easy Railway deployment
- **Supabase** (instead of custom backend)
  - Postgres + Auth + Real-time + Storage
  - Free tier for small teams
  - Auto-generated APIs

## Next Steps

1. Choose stack (React+Vite+Express vs Next.js vs Next.js+Supabase)
2. Set up project structure
3. Create database schema
4. Build API endpoints
5. Migrate frontend to React
6. Add user tracking
7. Deploy to Railway

Would you like me to:
- Generate the initial project structure?
- Create the database schema files?
- Set up the API endpoints?
- Convert the HTML to React components?
