import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import teamsRoutes from './routes/teams.js';
import usersRoutes from './routes/users.js';
import songsRoutes from './routes/songs.js';
import sectionsRoutes from './routes/sections.js';
import lyricsRoutes from './routes/lyrics.js';
import updatesRoutes from './routes/updates.js';
import commentsRoutes from './routes/comments.js';
import assignmentsRoutes from './routes/assignments.js';
import simulateRoutes from './routes/simulate.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/teams', teamsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/simulate', simulateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StageReady API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 StageReady API server running on http://localhost:${PORT}`);
});

