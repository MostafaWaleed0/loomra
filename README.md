# Loomra

<div align="center">

**A modern, feature-rich goal tracker and habit manager built with Electron and Next.js**

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/MostafaWaleed0/loomra)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-38.2.1-47848F.svg)](https://www.electronjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black.svg)](https://nextjs.org/)

</div>

---

## ✨ Features

- **📊 Goal Management** - Create, track, and achieve your goals with detailed progress monitoring
- **✅ Habit Tracking** - Build consistent habits with flexible frequency scheduling
- **📝 Task Organization** - Keep your daily tasks organized and connected to your goals
- **📈 Progress Visualization** - Beautiful charts and statistics powered by Recharts
- **🎨 Customizable Interface** - Personalize colors, icons, and themes to match your style
- **💾 Local-First** - All data stored securely on your device using SQLite
- **🌙 Dark Mode** - Elegant dark theme support with next-themes
- **🔄 Auto-Updates** - Seamless application updates with electron-updater
- **🖱️ Drag & Drop** - Intuitive task and habit reordering with @dnd-kit
- **📅 Smart Scheduling** - Advanced frequency system for habits (daily, weekly, monthly, custom)

---

## 🚀 Tech Stack

### Frontend

- **Next.js 15** - React framework for production
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icon library

### Desktop

- **Electron 38** - Cross-platform desktop framework
- **Better-SQLite3** - Fast, synchronous SQLite3 database
- **Electron Store** - Persistent user preferences
- **Electron Window State** - Remember window size and position

### State & Forms

- **React Hook Form** - Performant form management
- **Custom Hooks** - Specialized hooks for goals, habits, and tasks

---

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm or yarn

### Clone and Install

```bash
git clone https://github.com/MostafaWaleed0/loomra.git
cd loomra
npm install
```

---

## 🛠️ Development

### Run in Development Mode

```bash
npm run dev
```

This starts both the Next.js development server and Electron application concurrently.

### Build for Production

```bash
npm run build:win
```

Creates a Windows installer in the `dist/` directory.

### Publish Release

```bash
npm run publish
```

Builds and publishes to GitHub releases with auto-update support.

---

## 📁 Project Structure

```
loomra/
├── app/                      # Next.js application
│   ├── components/           # React components
│   │   ├── form/            # Form components (inputs, pickers, validation)
│   │   ├── goals/           # Goal-related components
│   │   ├── habits/          # Habit tracking components
│   │   ├── tasks/           # Task management components
│   │   ├── layout/          # Layout components (sidebars, header)
│   │   └── ui/              # Radix UI components (shadcn/ui)
│   ├── lib/                 # Core logic and utilities
│   │   ├── core/            # Shared utilities (date, color, validation)
│   │   ├── goal/            # Goal business logic
│   │   ├── habit/           # Habit tracking system
│   │   ├── hooks/           # Custom React hooks
│   │   └── types.ts         # TypeScript definitions
│   └── page.tsx             # Main application page
├── electron/                # Electron main process
│   ├── database-manager.js  # SQLite database operations
│   ├── ipc-handlers.js      # IPC communication handlers
│   └── preload.js           # Preload script for renderer
├── public/                  # Static assets (logo, icons)
└── electron.js              # Electron main entry point
```

---

## 🎯 Key Components

### Goal System

- Goal creation with metadata (dates, priority, category)
- Progress tracking with completion percentage
- Notes and description support
- Visual progress indicators

### Habit System

- Flexible frequency scheduling (daily, weekly, monthly, custom intervals)
- Completion tracking with streak statistics
- Goal association for habit-goal alignment
- Customizable colors and icons

### Task Management

- Quick task input with goal association
- Drag-and-drop task reordering
- Task completion tracking
- Context menu actions

---

## 🗄️ Database

Loomra uses **Better-SQLite3** for local data storage with the following tables:

- `goals` - Goal information and metadata
- `habits` - Habit definitions and settings
- `habit_completions` - Habit completion history
- `tasks` - Task records and associations

All database operations are handled through IPC for security and performance.

---

## 🔧 Configuration

### Electron Builder

The application uses `electron-builder` for packaging with configuration in `package.json`:

- Windows NSIS installer
- Auto-update via GitHub releases
- Asset optimization and tree-shaking

### Environment

- Development: `http://localhost:3000`
- Production: Static Next.js export served locally

---

## 📝 Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start development environment |
| `npm run next:dev`     | Start Next.js dev server only |
| `npm run next:build`   | Build Next.js application     |
| `npm run electron:dev` | Start Electron in dev mode    |
| `npm run build:win`    | Build Windows installer       |
| `npm run publish`      | Build and publish to GitHub   |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
