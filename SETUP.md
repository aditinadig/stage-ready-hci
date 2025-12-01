# StageReady Setup Instructions

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Seed the database with sample data (optional but recommended):**
   ```bash
   node scripts/seedData.js
   ```
   
   This will create:
   - Team: `CHOIR24`
   - User: `PHIL01`
   - Song: "Into the Air Tonight" with sections and lyrics

4. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

## Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173` (or the port Vite assigns)

## Testing the Application

1. **Start both servers:**
   - Backend: `cd backend && npm start`
   - Frontend: `cd client && npm run dev`

2. **Use the sample data:**
   - Team Code: `CHOIR24`
   - User Code: `PHIL01`

3. **Navigate through the app:**
   - Enter team code → Enter user code → View songs → View song details

## Database

The SQLite database is stored in `backend/db/stageready.db`. It's automatically created when you first run the server or seed script.

## API Endpoints

All API endpoints are prefixed with `/api`:

- Teams: `/api/teams`
- Users: `/api/users`
- Songs: `/api/songs`
- Sections: `/api/sections`
- Lyrics: `/api/lyrics`
- Updates: `/api/updates`
- Comments: `/api/comments`
- Assignments: `/api/assignments`

See `backend/README.md` for detailed API documentation.

## Troubleshooting

- **Backend won't start:** Make sure port 3001 is not in use
- **Frontend can't connect to API:** Ensure backend is running on port 3001
- **Database errors:** Delete `backend/db/stageready.db` and run the seed script again
- **CORS errors:** The backend has CORS enabled for all origins (development only)

