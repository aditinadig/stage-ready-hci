import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { songsAPI, updatesAPI } from "../services/api.js";

function SongsScreen() {
  const navigate = useNavigate();
  const { user, clearSession } = useApp();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/user-code");
      return;
    }

    loadSongs();
  }, [user, navigate]);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const userSongs = await songsAPI.getByUser(user.id);
      
      // Get pending updates for each song to show tags
      const songsWithTags = await Promise.all(
        userSongs.map(async (song) => {
          try {
            const updates = await updatesAPI.getByUser(user.id, "pending");
            const songUpdates = updates.filter(u => u.songId === song.id);
            return {
              ...song,
              tag: songUpdates.length > 0 ? `${songUpdates.length} pending update${songUpdates.length > 1 ? 's' : ''}` : null
            };
          } catch (e) {
            return { ...song, tag: null };
          }
        })
      );
      
      setSongs(songsWithTags);
    } catch (err) {
      setError("Failed to load songs. Please try again.");
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    clearSession();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="screen">
        <h1 className="screen-title">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Welcome, {user?.name || "User"}</h1>
      <p className="screen-subtitle">
        These are the songs assigned to your part in this team.
      </p>

      {error && (
        <div className="card card--padded" style={{ marginBottom: '12px', color: 'red' }}>
          {error}
        </div>
      )}

      <div className="card card--padded">
        {songs.length === 0 ? (
          <p className="helper-text">No songs assigned yet.</p>
        ) : (
          <ul className="song-list">
            {songs.map((song) => (
              <li key={song.id} className="song-row">
                <div className="song-row__info">
                  <span className="song-title">{song.title}</span>
                  {song.tag && <span className="song-tag">{song.tag}</span>}
                </div>
                <Link
                  to={`/songs/${song.id}`}
                  className="song-row__go"
                  aria-label={`Open ${song.title}`}
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="secondary-btn" onClick={handleStartOver}>
          Start over
        </button>
      </div>
    </div>
  );
}

export default SongsScreen;
