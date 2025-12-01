/* eslint-disable no-unused-vars */
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";
import { songsAPI, sectionsAPI, lyricsAPI, updatesAPI } from "../services/api.js";

import UpdatesPanel from "../components/songDetail/Updates.jsx";
import SectionsPanel from "../components/songDetail/Sections.jsx";
import ControlsBar from "../components/songDetail/Controls.jsx";
import LyricsPanel from "../components/songDetail/Lyrics.jsx";
import CommentsModal from "../components/songDetail/Comments.jsx";

export default function SongDetailScreen() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [song, setSong] = useState(null);
  const [sections, setSections] = useState([]);
  const [lyrics, setLyrics] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [historyUpdates, setHistoryUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatesCollapsed, setUpdatesCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [showOnlyUnconfirmed, setShowOnlyUnconfirmed] = useState(false);

  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);

  const [cueMode, setCueMode] = useState("inline");
  const [brightness, setBrightness] = useState(1); // 0 = dim, 1 = normal, 2 = bright
  const [fontScale, setFontScale] = useState(1);

  const [commentUpdateId, setCommentUpdateId] = useState(null);

  const [expandedSections, setExpandedSections] = useState({});
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [highlightedSection, setHighlightedSection] = useState(null);
  const [highlightedUpdateId, setHighlightedUpdateId] = useState(null);

  // Load song data
  useEffect(() => {
    if (!user) {
      navigate("/songs");
      return;
    }
    loadSongData();
  }, [songId, user, navigate]);

  const loadSongData = async () => {
    try {
      setLoading(true);
      
      // Load song
      const songData = await songsAPI.getById(songId);
      setSong(songData);

      // Load sections
      const sectionsData = await sectionsAPI.getBySong(songId);
      setSections(sectionsData.sort((a, b) => a.orderIndex - b.orderIndex));

      // Initialize expanded sections
      const initialExpanded = {};
      sectionsData.forEach(section => {
        const key = getSectionKey(section);
        initialExpanded[key] = true;
      });
      setExpandedSections(initialExpanded);

      // Load lyrics
      const lyricsData = await lyricsAPI.getBySong(songId);
      setLyrics(lyricsData);

      // Load updates
      const allUpdates = await updatesAPI.getByUser(user.id);
      const songUpdates = allUpdates.filter(u => u.songId === songId);
      const pending = songUpdates.filter(u => u.status === 'pending');
      const confirmed = songUpdates.filter(u => u.status === 'confirmed');
      
      setUpdates(pending);
      setHistoryUpdates(confirmed);
    } catch (error) {
      console.error("Error loading song data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert section ID to key format
  const getSectionKey = (section) => {
    return `${section.sectionType}${section.sectionNumber}`.toLowerCase();
  };

  // Helper to convert section to DOM ID format
  const getSectionDomId = (section) => {
    return `section-${section.sectionType}${section.sectionNumber}`;
  };

  const confirmUpdate = async (id) => {
    if (!user) return;

    try {
      await updatesAPI.confirm(id, user.id);
      
      const found = updates.find((u) => u.id === id);
      if (found) {
        setConfirmationMessage(found.text + " confirmed");
        setTimeout(() => setConfirmationMessage(""), 2500);
        
        setHighlightedSection(null);
        setHighlightedUpdateId(null);

        // Reload updates
        const allUpdates = await updatesAPI.getByUser(user.id);
        const songUpdates = allUpdates.filter(u => u.songId === songId);
        const pending = songUpdates.filter(u => u.status === 'pending');
        const confirmed = songUpdates.filter(u => u.status === 'confirmed');
        
        setUpdates(pending);
        setHistoryUpdates(confirmed);
      }
    } catch (error) {
      console.error("Error confirming update:", error);
    }
  };

  const confirmAll = async () => {
    if (!user) return;

    try {
      await Promise.all(updates.map(u => updatesAPI.confirm(u.id, user.id)));
      
      // Reload updates
      const allUpdates = await updatesAPI.getByUser(user.id);
      const songUpdates = allUpdates.filter(u => u.songId === songId);
      const pending = songUpdates.filter(u => u.status === 'pending');
      const confirmed = songUpdates.filter(u => u.status === 'confirmed');
      
      setUpdates(pending);
      setHistoryUpdates(confirmed);
    } catch (error) {
      console.error("Error confirming all updates:", error);
    }
  };

  const scrollToSection = (sectionIdOrDomId, updateId) => {
    // Handle both database sectionId and DOM section ID
    let sectionDomId = sectionIdOrDomId;
    
    // If it's a database sectionId (not starting with "section-"), find the section
    if (sectionIdOrDomId && !sectionIdOrDomId.startsWith('section-')) {
      const section = sections.find(s => s.id === sectionIdOrDomId);
      if (section) {
        sectionDomId = getSectionDomId(section);
      } else {
        return; // Section not found
      }
    }

    if (!sectionDomId) return;

    const el = document.getElementById(sectionDomId);
    if (!el) return;

    setHighlightedSection(sectionDomId);
    setHighlightedUpdateId(updateId);

    // Find section and expand it
    const section = sections.find(s => getSectionDomId(s) === sectionDomId);
    if (section) {
      const key = getSectionKey(section);
      setExpandedSections((prev) => ({ ...prev, [key]: true }));
    }

    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("lyrics-section--highlight");
      setTimeout(() => {
        el.classList.remove("lyrics-section--highlight");
      }, 3000);
    }, 50);
  };

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const openComments = (id) => setCommentUpdateId(id);
  const closeComments = () => setCommentUpdateId(null);

  const changeFont = (dir) =>
    setFontScale((prev) =>
      Number(
        Math.min(
          1.4,
          Math.max(0.8, prev + (dir === "up" ? 0.1 : -0.1))
        ).toFixed(2)
      )
    );

  const increaseBrightness = () => {
    // Increase brightness: 0 (dim) -> 1 (normal) -> 2 (bright), max at 2
    setBrightness((b) => Math.min(2, b + 1));
  };

  const decreaseBrightness = () => {
    // Decrease brightness: 2 (bright) -> 1 (normal) -> 0 (dim), min at 0
    setBrightness((b) => Math.max(0, b - 1));
  };

  if (loading) {
    return (
      <div className="screen song-detail">
        <button className="back-link" onClick={() => navigate("/songs")}>
          ← Back
        </button>
        <h1 className="song-detail__title">Loading...</h1>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="screen song-detail">
        <button className="back-link" onClick={() => navigate("/songs")}>
          ← Back
        </button>
        <h1 className="song-detail__title">Song not found</h1>
      </div>
    );
  }

  return (
    <div
      className="screen song-detail"
      data-brightness={brightness}
      style={{ "--lyrics-font-scale": fontScale }}
    >
      <button className="back-link" onClick={() => navigate("/songs")}>
        ← Back
      </button>
      <h1 className="song-detail__title">{song.title}</h1>
      <p className="song-detail__subtitle">{song.artists?.join(", ") || ""}</p>
      {confirmationMessage && (
        <div className="update-notice">✓ {confirmationMessage}</div>
      )}
      <UpdatesPanel
        updates={updates}
        historyUpdates={historyUpdates}
        updatesCollapsed={updatesCollapsed}
        settingsOpen={settingsOpen}
        showHistory={showHistory}
        sortOrder={sortOrder}
        showOnlyUnconfirmed={showOnlyUnconfirmed}
        confirmUpdate={confirmUpdate}
        confirmAll={confirmAll}
        scrollToSection={scrollToSection}
        openComments={openComments}
        setShowHistory={setShowHistory}
        setSettingsOpen={setSettingsOpen}
        setUpdatesCollapsed={setUpdatesCollapsed}
        setSortOrder={setSortOrder}
        setShowOnlyUnconfirmed={setShowOnlyUnconfirmed}
      />
      <SectionsPanel
        sections={sections}
        lyrics={lyrics}
        user={user}
        sectionsCollapsed={sectionsCollapsed}
        setSectionsCollapsed={setSectionsCollapsed}
        scrollToSection={scrollToSection}
        getSectionDomId={getSectionDomId}
        getSectionKey={getSectionKey}
      />
      <ControlsBar
        cueMode={cueMode}
        brightness={brightness}
        setCueMode={setCueMode}
        increaseBrightness={increaseBrightness}
        decreaseBrightness={decreaseBrightness}
        changeFont={changeFont}
      />
      <LyricsPanel
        sections={sections}
        lyrics={lyrics}
        user={user}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        cueMode={cueMode}
        highlightedSection={highlightedSection}
        highlightedUpdateId={highlightedUpdateId}
        confirmUpdate={confirmUpdate}
        getSectionDomId={getSectionDomId}
        getSectionKey={getSectionKey}
      />
      {commentUpdateId && <CommentsModal close={closeComments} />}
    </div>
  );
}
