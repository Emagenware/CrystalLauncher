<h1 align="center">Crystal Launcher</h1>

<p align="center">
  <a href="https://discord.gg/pDfkc7DrrG">
    <img src="https://img.shields.io/discord/1458190097714385071?logo=discord&label=Discord" />
  </a>
  <img src="https://img.shields.io/github/license/Emagenware/CrystalLauncher" />
  <img src="https://img.shields.io/github/last-commit/Emagenware/CrystalLauncher" />
</p>

<p align="center">
  A modern, lightweight Minecraft launcher built with Tauri, Rust, and Svelte.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#setup">Setup</a>
</p>

## Features

- **Microsoft Account Integration** – Sign in securely with your Microsoft account.
- **Version Management** – Easily install and switch between Minecraft versions.
- **Instance System** – Create separate instances to keep mods, saves, and settings organized.
- **Auto Login** – Stay signed in between sessions.
- **Live Installation Progress** – Track downloads and installations in real time.
- **Cross-Platform** – Available on Windows, macOS, and Linux.

## Tech Stack

- **Frontend**: Svelte 5, TypeScript, Tailwind CSS
- **Backend**: Rust, Tauri v2
- **UI Components**: Custom shadcn-svelte components

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [Bun](https://bun.sh/) (or npm)

### Setup

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

### Project Structure

```
├── src/                    # Frontend Svelte code
│   ├── lib/               # Shared utilities and components
│   │   ├── components/    # UI components
│   │   └── helpers/       # Helper functions
│   └── pages/             # Page components
├── src-tauri/             # Rust backend code
│   ├── src/
│   │   ├── commands/      # Tauri command handlers
│   │   ├── models/        # Data structures
│   │   └── core/          # Core functionality
│   └── icons/             # Application icons
```

## License and Website

Crystal Launcher uses the [MIT](LICENSE) License. In simple words, the MIT License lets anyone use, modify, and share your code for almost any purpose, including commercial projects, as long as they keep the original license and copyright notice, while providing the software without any warranty or liability from the creator.

The official website for Crystal Launcher can be visited by going to [crystalmc.gg](http://crystalmc.gg/)
