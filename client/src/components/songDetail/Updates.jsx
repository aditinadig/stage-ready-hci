/* eslint-disable no-unused-vars */
// src/components/songDetail/Updates.jsx
import { useState, useMemo } from 'react';

export default function Updates({
  updates,
  historyUpdates,
  updatesCollapsed,
  settingsOpen,
  showHistory,
  sortOrder,
  showOnlyUnconfirmed,
  confirmUpdate,
  confirmAll,
  scrollToSection,
  openComments,
  setShowHistory,
  setSettingsOpen,
  setUpdatesCollapsed,
  setSortOrder,
  setShowOnlyUnconfirmed
}) {
  const isHistoryView = showHistory;

  // Filter and sort updates based on settings
  const filteredUpdates = useMemo(() => {
    let filtered = [...updates];
    
    // Filter by unconfirmed status if setting is enabled
    if (showOnlyUnconfirmed) {
      filtered = filtered.filter(u => u.status === 'pending');
    }
    
    // Sort updates
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    return filtered;
  }, [updates, sortOrder, showOnlyUnconfirmed]);

  const headerCount = isHistoryView ? historyUpdates.length : filteredUpdates.length;

  return (
    <section className="card updates-panel">
      {/* Header */}
      <header className="updates-panel__header">
        <div className="updates-panel__title">
          <span>{isHistoryView ? "Recently Confirmed Updates" : "Updates"}</span>
          <span
            className={
              "updates-pill" + (isHistoryView ? " updates-pill--history" : "")
            }
          >
            {headerCount}
          </span>
        </div>

        <div className="updates-panel__actions">
          {/* Confirm All + settings only in normal view */}
          {!isHistoryView && (
            <>
              <button
                className="chip chip--primary"
                type="button"
                onClick={confirmAll}
                disabled={filteredUpdates.length === 0}
              >
                Confirm All
              </button>

              <button
                className="icon-btn"
                type="button"
                onClick={() => setSettingsOpen(o => !o)}
                aria-label="Settings"
              >
                ⚙
              </button>
            </>
          )}

          <button
            className="icon-btn"
            type="button"
            onClick={() => setUpdatesCollapsed(c => !c)}
            aria-label={updatesCollapsed ? "Expand updates" : "Collapse updates"}
          >
            {updatesCollapsed ? "▸" : "▾"}
          </button>
        </div>
      </header>

      {/* Settings only shown in normal view */}
      {!isHistoryView && settingsOpen && (
        <div className="settings-menu">
          <div className="settings-menu__title">Update Settings</div>
          
          <div className="settings-menu__option">
            <label className="settings-menu__label">
              <span>Sort order</span>
            </label>
            <div className="settings-menu__radio-group">
              <label className="settings-menu__radio">
                <input
                  type="radio"
                  name="sortOrder"
                  value="newest"
                  checked={sortOrder === 'newest'}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
                <span>Newest first</span>
              </label>
              <label className="settings-menu__radio">
                <input
                  type="radio"
                  name="sortOrder"
                  value="oldest"
                  checked={sortOrder === 'oldest'}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
                <span>Oldest first</span>
              </label>
            </div>
          </div>

          <div className="settings-menu__option">
            <label className="settings-menu__checkbox">
              <input
                type="checkbox"
                checked={showOnlyUnconfirmed}
                onChange={(e) => setShowOnlyUnconfirmed(e.target.checked)}
              />
              <span>Show only unconfirmed</span>
            </label>
          </div>
        </div>
      )}

      {/* Body */}
      {!updatesCollapsed && (
        <>
          <button
            className={
              "link-inline" + (isHistoryView ? " link-inline--danger" : "")
            }
            type="button"
            onClick={() => setShowHistory(s => !s)}
          >
            {isHistoryView ? "Show Updates" : "Recently Confirmed Updates"}
          </button>

          {/* NORMAL VIEW: pending updates in red */}
          {!isHistoryView && (
            <div className="updates-list">
              {filteredUpdates.map(u => (
                <div key={u.id} className="update-row">
                  <span className="update-row__bar" />
                  <span className="update-row__text">{u.text}</span>

                  <div className="update-row__actions">
                    <button
                      className="icon-circle"
                      type="button"
                      onClick={() => scrollToSection(u.sectionId, u.id)}
                      aria-label="Jump to change"
                    >
                      🔍
                    </button>
                    <button
                      className="icon-circle"
                      type="button"
                      onClick={() => openComments(u.id)}
                      aria-label="View comments"
                    >
                      💬
                    </button>
                    <button
                      className="chip chip--confirm"
                      type="button"
                      onClick={() => confirmUpdate(u.id)}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ))}

              {filteredUpdates.length === 0 && (
                <p className="helper-text" style={{ marginTop: 4 }}>
                  {showOnlyUnconfirmed ? 'No unconfirmed updates.' : 'All caught up. No pending updates.'}
                </p>
              )}
            </div>
          )}

          {/* HISTORY VIEW: confirmed updates in blue, no Confirm button */}
          {isHistoryView && (
            <div className="updates-list">
              {historyUpdates.map(h => (
                <div
                  key={h.id}
                  className="update-row update-row--history"
                >
                  <span className="update-row__bar update-row__bar--history" />
                  <span className="update-row__text">{h.text}</span>

                  <div className="update-row__actions">
                    {/* Always show magnifying glass, like current updates */}
                    <button
                      className="icon-circle"
                      type="button"
                      onClick={() => scrollToSection(h.sectionId, h.id)}
                      aria-label="Jump to change"
                    >
                      🔍
                    </button>

                    <button
                      className="icon-circle"
                      type="button"
                      onClick={() => openComments(h.id)}
                      aria-label="View comments"
                    >
                      💬
                    </button>
                    {/* no Confirm here */}
                  </div>
                </div>
              ))}

              {historyUpdates.length === 0 && (
                <p className="helper-text" style={{ marginTop: 4 }}>
                  No confirmed updates yet.
                </p>
              )}
            </div>
          )}

        </>
      )}
    </section>
  );
}
