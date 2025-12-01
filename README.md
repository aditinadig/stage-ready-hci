# StageReady – Full Project README

## 1. Overview
StageReady is a rehearsal companion app for singers and musicians. It focuses on revealing personalized lyrics, timing cues, notifications, and assignment-based highlighting during practice sessions.

The app has no login or authentication system. Instead, users enter:

- **Team Code** – identifies the rehearsal group (e.g., Choir, Band)
- **User Code (Persona Code)** – identifies the specific role/performer (e.g., Phil, Jane, Guitarist)

Once inside, the user sees only the content relevant to their persona.

---

## 2. UI Breakdown

### **2.1 Join Flow**
- Enter **Team Code**
- Enter **User Code**
- App resolves both from Firestore
- User enters the main rehearsal dashboard

### **2.2 Song List Screen**
Shows list of available songs for the team:
- Song title
- Assigned personas summary
- Indicator for new updates (derived from Firestore)
- Opens into *Song Detail Screen*

---

## 3. Song Detail Screen (Main UI)

This is the core of the app.

### **3.1 Updates Panel**
Displays rehearsal updates:
- *Pending Updates* (red left bar)
- *Recently Confirmed Updates* (blue left bar)
- Magnifying glass (🔍) to jump to the referenced section
- Comment bubble (💬) to open update-specific discussion
- "Confirm" button for pending updates
- "Confirm All" button
- History toggle ("Recently Confirmed Updates")

### **3.2 Sections Panel ("Your Sections")**
Highlights:
- Sections where this persona sings
- Specific line numbers assigned to the persona
- Jump button scrolls into lyrics panel

### **3.3 Controls Bar**
User-display controls:
- Brightness (☀ for higher / ● for lower)
- Font size (A+ / A-)
- Cue display mode:
  - Inline
  - Margin
  - Minimal (hide cues)

### **3.4 Lyrics Panel**
Shows the full lyrics divided into sections.

#### **Colors**
- **Green sections** → Choruses  
- **Blue sections** → Verses  
- **Grey sections** → Other parts or muted sections  

#### **Line highlighting**
Each line may be:

| Line Type | Meaning |
|----------|---------|
| **Own chorus** (green text) | User sings this line (in chorus) |
| **Own verse** (blue text) | User sings this line (in verse) |
| **Muted** (grey text) | Line belongs to someone else |

#### **Cue Banners**
Yellow strips showing:
- Entrance timings  
- Bar counts  
- Notes from manager  

Cue visibility depends on **cueMode** selected in Controls Bar.

---

## 4. Functionality Summary

### **4.1 No Authentication**
User identity = persona code.

### **4.2 Personalized Lyrics**
UI matches:
- Assigned lines
- Section ownership
- Cue placement

### **4.3 Notification System**
Each persona individually confirms updates:
- Confirm one
- Confirm all
- View history
- Comments per update

### **4.4 Smart Scrolling**
From:
- Update rows
- “Your Sections”
- Cues referencing line numbers

The app expands collapsed sections and scrolls to the line.

### **4.5 Display Controls**
Brightness affects background CSS variables.  
Font scaling affects `--lyrics-font-scale`.

---

## 5. Firestore Database Schema

### **5.1 Teams**
```
/teams/{teamId} {
  name: string,
  teamCode: string,
  isActive: boolean,
  createdAt: Timestamp
}
```

### **5.2 Personas**
```
/teams/{teamId}/personas/{personaId} {
  name: string,
  displayLabel: string,
  userCode: string,
  roleType: "singer" | "musician" | "manager",
  isActive: boolean
}
```

### **5.3 Songs**
```
/teams/{teamId}/songs/{songId} {
  title: string,
  orderIndex: number,
  bpm?: number,
  key?: string
}
```

### **5.4 Sections + Lines**
```
/teams/{teamId}/songs/{songId}/sections/{sectionId} {
  title: string,
  type: "chorus" | "verse" | "bridge" | "other",
  orderIndex: number,
  lines: [
    {
      index: number,
      text: string,
      assignedPersonaCodes: string[]
    }
  ],
  cue?: {
    text: string,
    meta?: string,
    position: "top" | "after-line",
    targetLineIndex?: number
  }
}
```

### **5.5 Updates**
```
/teams/{teamId}/songs/{songId}/updates/{updateId} {
  text: string,
  type: string,
  sectionId?: string,
  lineIndices?: number[],
  appliesToPersonaCodes: string[] | "all",
  createdAt: Timestamp,
  confirmedByPersonaCodes: {
    [personaCode: string]: Timestamp
  }
}
```

### **5.6 Comments**
```
/teams/{teamId}/songs/{songId}/updates/{updateId}/comments/{commentId} {
  text: string,
  createdByPersonaCode: string,
  createdAt: Timestamp
}
```

---

## 6. Running the project

### **Install dependencies**
```
npm install
```

### **Start development server**
```
npm run dev
```

### **Build for production**
```
npm run build
```

### **Preview production build**
```
npm run preview
```

---

## 7. Notes
This README covers:
- Full UI breakdown
- Functional behavior
- DB schema matching all UI interactions
- Controls & notification mechanics
- Scroll behavior
- Persona-driven view logic

This is the authoritative documentation for the StageReady interface.

