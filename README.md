# Loomra

A modern goal tracking and habit building desktop application built with Next.js and Tauri.

### Setup

```bash
git clone https://github.com/MostafaWaleed0/loomra.git
cd loomra
npm install
```

## 🛠️ Development

```bash
npm run tauri dev
```

## 🏗️ Build

**Windows:**

```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**macOS:**

```bash
npm run tauri build -- --target aarch64-apple-darwin
```

**Linux:**

```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## 🗄️ Database

SQLite tables: `goals`, `habits`, `habit_completions`, `tasks`

All operations handled via Tauri commands for security.

## 📝 Scripts

| Command               | Description        |
| --------------------- | ------------------ |
| `npm run tauri dev`   | Development mode   |
| `npm run tauri build` | Production build   |
| `npm run next:build`  | Build Next.js only |

## 🤝 Contributing

Contributions welcome! Fork, create a feature branch, and submit a PR.
