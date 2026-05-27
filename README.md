<img width="256" height="256" alt="image" src="https://github.com/user-attachments/assets/002a0695-8c81-48ff-9112-a6e4d8664f6b" />

#  Habitor Desktop — Gamified Habit Tracker & Self-Discipline Sanctuary

Habitor is a premium, beautifully-designed, offline-first habit tracker that turns your daily routines into a gamified RPG journey. Ascend your self-discipline, gain XP, climb levels, and unlock milestones.

Built on a modern engineering stack featuring **React Native Web**, **Vite**, and **Electron**, Habitor offers native desktop performance on Windows with beautiful animations and deep visual aesthetics.

<img width="1920" height="1200" alt="Screenshot 2026-05-27 115830" src="https://github.com/user-attachments/assets/fd64c2c7-3864-4443-bff0-564fca079330" />

---

## 🎨 Design & Aesthetic Philosophy
Habitor is crafted to be visually stunning, encouraging daily engagement through cohesive UX and responsive design:
- **Curated HSL Color System**: Deep, relaxing slate-dark background (`#0B0F19`) contrasted with vibrant accent highlights.
- **Glassmorphism Backdrops**: Overlay dialogs (such as level-ups and milestone unlocks) use advanced CSS backdrop filter blur effects (`backdropFilter: 'blur(12px)'`) to focus user interaction elegantly.
- **Micro-Animations**: Smooth theme transitions featuring circular visual clip reveals, responsive button highlights, and real-time biometric progress graphs.

<img width="1920" height="1200" alt="Screenshot 2026-05-27 115910" src="https://github.com/user-attachments/assets/daeacfce-673c-430e-9c9e-46476fbcb12d" />

---

## 🚀 Core Features & Mechanics

### 👾 Self-Discipline Gamification
- **RPG Leveling Engine**: Earn XP by logging progress on your habits. Each level increases the XP required for the next, scaling with your discipline.
- **Milestone Achievements**: Unlock badges with rewards like *First Step* (first completion), *Consistent Pioneer* (20 completions), *Centurion* (100 completions), and *Power User* (Level 5).
- **Milestone Popups**: Get motivated with high-fidelity, premium modal celebration overlays displaying badge descriptions and XP rewards.

### 📊 Health & Biometrics Dashboard
- **Activity Ring Graphs**: Visualize sleep duration, deep sleep, and quality percentages using interactive Apple-style circular SVG rings.
- **Heart Rate Monitor**: Track resting pulse metrics linked directly with a dynamic SVG heart-rate pulse wave.
- **Cortisol Gauge**: Monitor stress indicators via a custom sliding gradient gauge widget.
- **Book Tracker**: Log reading session parameters, titles, and author details.
- **Widescale Consistency Heatmap**: Track annual completion grids across multi-view timelines (Daily, Weekly, Monthly, and Yearly grids) similar to GitHub's contribution graph.

<img width="1920" height="1200" alt="Screenshot 2026-05-27 120007" src="https://github.com/user-attachments/assets/292b9b82-1b37-4b0e-a91a-6b8087e71115" />


---

## 🛠 Tech Stack
- **Framework**: [React Native Web](https://necolas.github.io/react-native-web/) (facilitates web outputs from native components).
- **Build Tool**: [Vite](https://vite.dev/) (lightning-fast client compilation and hot reloading).
- **Core Wrapper**: [Electron](https://www.electronjs.org/) (native app packaging & chromium browser execution).
- **Storage**: Offline-first AsyncStorage persistent caching.

<img width="1920" height="1200" alt="Screenshot 2026-05-27 120056" src="https://github.com/user-attachments/assets/9e8e0040-f18f-4d4b-a29a-8940c3c04b84" />

---

## 💻 Installation & Setup

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 1. Clone & Setup Workspace
```bash
# Clone the repository
git clone https://github.com/Piyush-echelon/Habitor-desktop.git
cd Habitor-desktop
```

### 2. Run the React Web Application (Vite Dev Server)
```bash
# Enter the web project directory
cd HabitTracker

# Install dependencies
npm install

# Run the local development server (runs on localhost:5173)
npm run dev
```

### 3. Run the Desktop Application (Electron)
To run the desktop client wrapping your local Vite development server:
```bash
# Enter the electron folder
cd ../electron-app

# Install wrapper dependencies
npm install

# Launch Electron in development mode
npm start
```

---

## 📦 Building & Packaging (Windows Distribution)

To build web resources and bundle them into a standalone Windows installer or portable application:

```bash
# 1. Compile the static web assets into electron-app build path
cd HabitTracker
npm run build

# 2. Package into a portable executable or installer
cd ../electron-app
npm run package
```

The compiled executables will be output to:
- `electron-app/dist-electron/Habitor 1.0.1.exe` (Portable Windows Executable)
- `electron-app/dist-electron/Habitor Setup 1.0.1.exe` (Windows NSIS Setup Installer)

---

## 🔒 License
This project is licensed under the MIT License - see the LICENSE file for details.
