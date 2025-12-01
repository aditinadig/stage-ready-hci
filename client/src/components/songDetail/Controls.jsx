// src/components/songDetail/ControlsBar.jsx
export default function ControlsBar({
  cueMode,
  brightness,
  setCueMode,
  increaseBrightness,
  decreaseBrightness,
  changeFont
}) {
  return (
    <section className="card controls-bar">
      <div className="controls-bar__row controls-bar__row--single">

        <div className="controls-bar__title">Controls</div>

        <div className="controls-bar__right">

          {/* Cue format */}
          <div className="controls-bar__center">
            <select
              className="controls-select controls-select--pill"
              value={cueMode}
              onChange={(e) => setCueMode(e.target.value)}
            >
              <option value="inline">Cue Display Format</option>
              <option value="inline">Inline cues</option>
              <option value="margin">Margin notes</option>
              <option value="minimal">Minimal (hide cues)</option>
            </select>
          </div>

          {/* Brightness buttons */}
          <div className="controls-bar__brightness">
            <button
              type="button"
              className={`round-icon ${brightness === 2 ? "round-icon--active" : ""}`}
              onClick={increaseBrightness}
            >
              ☀
            </button>

            <button
              type="button"
              className={`round-icon ${brightness === 0 ? "round-icon--active" : ""}`}
              onClick={decreaseBrightness}
            >
              ●
            </button>
          </div>

          <div className="controls-bar__divider" />

          {/* Font */}
          <div className="controls-bar__font">
            <button
              type="button"
              className="round-text-btn"
              onClick={() => changeFont("up")}
            >
              A+
            </button>
            <button
              type="button"
              className="round-text-btn"
              onClick={() => changeFont("down")}
            >
              A-
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
