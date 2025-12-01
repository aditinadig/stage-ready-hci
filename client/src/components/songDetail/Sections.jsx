// src/components/songDetail/SectionsPanel.jsx
export default function SectionsPanel({
  sections,
  lyrics,
  user,
  sectionsCollapsed,
  setSectionsCollapsed,
  scrollToSection,
  getSectionDomId,
  getSectionKey,
}) {
  if (!sections || !lyrics || !user) {
    return (
      <section className="card sections-panel">
        <header className="sections-panel__header">
          <div className="sections-panel__title">
            <span>Your Sections</span>
            <span className="section-pill">0</span>
          </div>
        </header>
      </section>
    );
  }

  // Find sections where user has assigned lyrics, sorted by orderIndex
  const userSections = sections
    .filter(section => {
      const sectionLyrics = lyrics.filter(l => l.sectionId === section.id);
      return sectionLyrics.some(lyric => 
        lyric.assignedUserIds && lyric.assignedUserIds.includes(user.id)
      );
    })
    .sort((a, b) => {
      const aIndex = Number(a.orderIndex) || 0;
      const bIndex = Number(b.orderIndex) || 0;
      return aIndex - bIndex;
    });

  // Get line numbers for each section
  const getSectionInfo = (section) => {
    const sectionLyrics = lyrics
      .filter(l => l.sectionId === section.id && 
                   l.assignedUserIds && 
                   l.assignedUserIds.includes(user.id))
      .sort((a, b) => a.lineNumber - b.lineNumber);
    
    if (sectionLyrics.length === 0) return null;

    const lineNumbers = sectionLyrics.map(l => l.lineNumber);
    const firstLine = Math.min(...lineNumbers);
    const lastLine = Math.max(...lineNumbers);
    
    // Solo = 2 or fewer assigned lines
    const lineCount = sectionLyrics.length;
    const isSolo = lineCount > 0 && lineCount <= 2;
    
    return {
      firstLine,
      lastLine,
      count: lineCount,
      isSolo,
    };
  };

  return (
    <section className="card sections-panel">
      <header className="sections-panel__header">
        <div className="sections-panel__title">
          <span>Your Sections</span>
          <span className="section-pill">{userSections.length}</span>
        </div>

        <button
          className="icon-btn"
          onClick={() => setSectionsCollapsed(c => !c)}
        >
          {sectionsCollapsed ? "▸" : "▾"}
        </button>
      </header>

      {!sectionsCollapsed && (
        <div className="sections-panel__tags">
          {userSections.map((section) => {
            const info = getSectionInfo(section);
            if (!info) return null;

            const sectionId = getSectionDomId(section);
            const sectionType = section.sectionType.toLowerCase();
            
            // Chorus sections always show as "Chorus:" (not "Solo:")
            // Solo only applies to verse sections with 2 or fewer lines
            const isChorus = sectionType === 'chorus';
            const shouldShowAsSolo = !isChorus && info.isSolo;
            
            const tagClass = shouldShowAsSolo
              ? "section-tag section-tag--solo" 
              : `section-tag section-tag--${sectionType}`;

            const lineText = info.count === 1
              ? `Line ${info.firstLine}`
              : info.firstLine === info.lastLine
              ? `Line ${info.firstLine}`
              : `Lines ${info.firstLine}-${info.lastLine}`;

            return (
              <button
                key={section.id}
                className={tagClass}
                onClick={() => scrollToSection(sectionId)}
              >
                {section.displayName} – {lineText}
              </button>
            );
          })}
          
          {userSections.length === 0 && (
            <p className="helper-text">No sections assigned to you.</p>
          )}
        </div>
      )}
    </section>
  );
}
