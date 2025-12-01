import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { teamsAPI } from "../services/api.js";

function JoinTeamScreen() {
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTeam } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = teamCode.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const team = await teamsAPI.getByCode(trimmed);
      setTeam(team);
      navigate("/user-code");
    } catch (err) {
      setError("Team not found. Please check your team code.");
      console.error("Error joining team:", err);
    } finally {
      setLoading(false);
    }
  };

  const isReady = teamCode.trim().length > 0;

  return (
    <div className="screen">
      <h1 className="screen-title">Join your team</h1>
      <p className="screen-subtitle">
        Enter the team code your manager shared with you.
      </p>

      <div className="card card--padded">
        <form onSubmit={handleSubmit} className="form">
          <label className="label">
            Team Code
            <input
              className="input"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              placeholder="e.g. XYZ123"
            />
          </label>

          <p className="helper-text">
            Example: <span className="mono">CHOIR24</span> or{" "}
            <span className="mono">BAND01</span>
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
            {loading ? "Joining..." : "Join team"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinTeamScreen;
