// src/components/songDetail/Lyrics.jsx
export default function Lyrics({
  sections,
  lyrics,
  user,
  expandedSections,
  toggleSection,
  cueMode,
  highlightedSection,
  highlightedUpdateId,
  confirmUpdate,
  getSectionDomId,
  getSectionKey,
}) {
  if (!sections || !lyrics) {
    return (
      <section className={`card lyrics-card lyrics-card--mode-${cueMode}`}>
        <p>Loading lyrics...</p>
      </section>
    );
  }

  // Group lyrics by section
  const lyricsBySection = {};
  lyrics.forEach(lyric => {
    if (!lyricsBySection[lyric.sectionId]) {
      lyricsBySection[lyric.sectionId] = [];
    }
    lyricsBySection[lyric.sectionId].push(lyric);
  });

  // Sort lyrics within each section by lineNumber
  Object.keys(lyricsBySection).forEach(sectionId => {
    lyricsBySection[sectionId].sort((a, b) => a.lineNumber - b.lineNumber);
  });

  // Check if user has assigned lines in a section
  const hasUserLines = (sectionId) => {
    const sectionLyrics = lyricsBySection[sectionId] || [];
    return sectionLyrics.some(lyric => 
      lyric.assignedUserIds && lyric.assignedUserIds.includes(user?.id)
    );
  };

  return (
    <section className={`card lyrics-card lyrics-card--mode-${cueMode}`}>
      {sections.map((section) => {
        const sectionId = getSectionDomId(section);
        const sectionKey = getSectionKey(section);
        const sectionLyrics = lyricsBySection[section.id] || [];
        const userHasLines = hasUserLines(section.id);
        const isHighlighted = highlightedSection === sectionId;
        const sectionType = section.sectionType.toLowerCase();

        // Determine section class
        let sectionClass = "lyrics-section";
        if (sectionType === "chorus") {
          sectionClass += " lyrics-section--chorus";
        } else if (sectionType === "verse") {
          sectionClass += " lyrics-section--verse";
        }
        if (!userHasLines) {
          sectionClass += " lyrics-section--muted";
        }

        return (
          <div key={section.id} id={sectionId} className={sectionClass}>
            {/* Floating confirm button */}
            {isHighlighted && highlightedUpdateId && (
              <div className="floating-confirm-wrapper">
                <button
                  className="floating-confirm-btn"
                  onClick={() => confirmUpdate(highlightedUpdateId)}
                >
                  Confirm
                </button>
              </div>
            )}

            {/* Section header */}
            <div
              className="lyrics-section__header"
              onClick={() => toggleSection(sectionKey)}
            >
              <span className="caret">
                {expandedSections[sectionKey] ? "▼" : "▶"}
              </span>
              <span className="lyrics-section__title">{section.displayName}</span>
            </div>

            {/* Section content */}
            {expandedSections[sectionKey] && (
              <div className="lyrics-body">
                {sectionLyrics.map((lyric, index) => {
                  const isUserLine = lyric.assignedUserIds && lyric.assignedUserIds.includes(user?.id);
                  const isOwn = lyric.lineType === "own" || isUserLine;
                  
                  // Determine line class
                  let lineClass = "lyrics-line";
                  if (isOwn && sectionType === "chorus") {
                    lineClass += " lyrics-line--own-chorus";
                  } else if (isOwn && sectionType === "verse") {
                    lineClass += " lyrics-line--own-verse";
                  } else {
                    lineClass += " lyrics-line--muted";
                  }

                  // Check if there's a cue before this line
                  const showCueBefore = lyric.cueText && (
                    index === 0 || 
                    !sectionLyrics[index - 1]?.cueText ||
                    sectionLyrics[index - 1]?.lineNumber !== lyric.lineNumber - 1
                  );

                  return (
                    <div key={lyric.id}>
                      {/* Cue banner before line */}
                      {showCueBefore && lyric.cueText && (
                        <div className={`cue-banner cue-banner--${lyric.cueType || 'primary'} ${!userHasLines ? 'cue-banner--muted' : ''}`}>
                          {lyric.cueType === 'secondary' ? (
                            <>
                              <div className="cue-banner__main">{lyric.cueText}</div>
                            </>
                          ) : (
                            lyric.cueText
                          )}
                        </div>
                      )}

                      {/* Lyric line */}
                      <p className={lineClass}>{lyric.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
