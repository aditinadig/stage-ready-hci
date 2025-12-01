# StageReady Backend API

A Node.js + Express + SQLite backend for the StageReady application.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Initialize the database:**
   The database will be automatically created when you start the server, or you can run:
   ```bash
   npm run init-db
   ```

3. **Seed sample data (optional):**
   ```bash
   node scripts/seedData.js
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `GET /api/teams/code/:teamCode` - Get team by code
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Users
- `GET /api/users` - Get all users (query: `?teamId=`, `?teamCode=`, `?userCode=`)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/code/:teamCode/:userCode` - Get user by team code and user code
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Songs
- `GET /api/songs` - Get all songs (query: `?teamId=`)
- `GET /api/songs/:id` - Get song by ID
- `GET /api/songs/user/:userId` - Get songs assigned to a user
- `POST /api/songs` - Create new song
- `PUT /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song

### Sections
- `GET /api/sections` - Get all sections (query: `?songId=`)
- `GET /api/sections/:id` - Get section by ID
- `POST /api/sections` - Create new section
- `PUT /api/sections/:id` - Update section
- `DELETE /api/sections/:id` - Delete section

### Lyrics
- `GET /api/lyrics` - Get all lyrics (query: `?songId=`, `?sectionId=`)
- `GET /api/lyrics/:id` - Get lyric by ID
- `POST /api/lyrics` - Create new lyric line
- `PUT /api/lyrics/:id` - Update lyric
- `DELETE /api/lyrics/:id` - Delete lyric

### Updates
- `GET /api/updates` - Get all updates (query: `?songId=`, `?status=`, `?userId=`)
- `GET /api/updates/:id` - Get update by ID
- `POST /api/updates` - Create new update
- `PUT /api/updates/:id` - Update update
- `POST /api/updates/:id/confirm` - Confirm an update
- `DELETE /api/updates/:id` - Delete update

### Comments
- `GET /api/comments` - Get all comments (query: `?updateId=`, `?parentCommentId=`)
- `GET /api/comments/:id` - Get comment by ID
- `POST /api/comments` - Create new comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Assignments
- `GET /api/assignments` - Get all assignments (query: `?userId=`, `?songId=`, `?teamId=`)
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

## Database

The SQLite database file is stored in `backend/db/stageready.db`. You can inspect it using any SQLite client.

## Sample Data

After seeding, you can use:
- **Team Code:** `CHOIR24`
- **User Code:** `PHIL01`
- **Song:** "Into the Air Tonight"

