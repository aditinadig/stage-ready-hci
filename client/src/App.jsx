import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import NotificationBanner from "./components/NotificationBanner.jsx";
import SimulateUpdateButton from "./components/SimulateUpdateButton.jsx";
import JoinTeamScreen from "./screens/JoinTeamScreen.jsx";
import UserCodeScreen from "./screens/UserCodeScreen.jsx";
import SongsScreen from "./screens/SongsScreen.jsx";
import SongDetailScreen from "./screens/SongDetailScreen.jsx";

function AppContent() {
  const { notification, hideNotification } = useApp();
  const [deviceMode, setDeviceMode] = useState("mobile"); // "mobile" | "tablet"

  return (
    <div className="app-shell">
      {/* Notification Banner - Outside device frame */}
      <NotificationBanner
        show={!!notification}
        message={notification?.message || ""}
        onClose={hideNotification}
      />

      {/* Toggle above the device */}
      {/* <div className="view-toggle">
        <span className="view-toggle__label">View:</span>
        <button
          type="button"
          className={
            deviceMode === "mobile"
              ? "view-toggle__btn view-toggle__btn--active"
              : "view-toggle__btn"
          }
          onClick={() => setDeviceMode("mobile")}
        >
          Mobile
        </button>
        <button
          type="button"
          className={
            deviceMode === "tablet"
              ? "view-toggle__btn view-toggle__btn--active"
              : "view-toggle__btn"
          }
          onClick={() => setDeviceMode("tablet")}
        >
          Tablet
        </button>
      </div> */}

      {/* Device frame */}
      <div className={`device-frame device-frame--tablet`}>
        {/* Header inside device */}
        {/* <header className="device-header">
          <div className="device-header__title">
            <span className="logo-dot" />
            <span className="logo-text">StageReady</span>
          </div>
        </header> */}

        {/* Main app area */}
        <main className="device-body">
          <Routes>
            <Route path="/" element={<JoinTeamScreen />} />
            <Route path="/user-code" element={<UserCodeScreen />} />
            <Route path="/songs" element={<SongsScreen />} />
            <Route path="/songs/:songId" element={<SongDetailScreen />} />
          </Routes>
        </main>
      </div>

      {/* Simulate Update Button - Outside device frame */}
      <SimulateUpdateButton />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
