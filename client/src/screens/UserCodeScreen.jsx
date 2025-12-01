import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { usersAPI } from "../services/api.js";

function UserCodeScreen() {
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { team, setUser } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = userCode.trim().toUpperCase();
    if (!trimmed) return;

    if (!team) {
      setError("Please join a team first.");
      navigate("/");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await usersAPI.getByCode(team.teamCode, trimmed);
      setUser(user);
      navigate("/songs");
    } catch (err) {
      setError("User not found. Please check your user code.");
      console.error("Error finding user:", err);
    } finally {
      setLoading(false);
    }
  };

  const isReady = userCode.trim().length > 0;

  return (
    <div className="screen">
      <h1 className="screen-title">Who are you in this team?</h1>
      <p className="screen-subtitle">
        Enter the user code linked to your part (for example, Phil’s Tenor line).
      </p>

      <div className="card card--padded">
        <form onSubmit={handleSubmit} className="form">
          <label className="label">
            Your User Code
            <input
              className="input"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="e.g. PHIL01"
            />
          </label>

          <p className="helper-text">
            This is usually assigned by your conductor or rehearsal manager.
          </p>

          {error && (
            <p className="helper-text" style={{ color: 'red', marginTop: '8px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`primary-btn ${isReady && !loading ? "primary-btn--active" : ""}`}
            disabled={!isReady || loading}
          >
            {loading ? "Loading..." : "See my songs"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserCodeScreen;
