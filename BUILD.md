# Gene Editor - Desktop Build Guide

This guide explains how to build Gene Editor as a desktop application for Windows and Linux using Tauri.

## Prerequisites

### All Platforms
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://rustup.rs/) (latest stable)

### Windows Specific
- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - Install "Desktop development with C++" workload

### Linux Specific
```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel patchelf

# Arch Linux
sudo pacman -S --needed webkit2gtk-4.1 libappindicator-gtk3 librsvg patchelf
```

## Quick Build

### Windows
```bash
# Double-click the batch file, or run in terminal:
build-windows.bat
```

### Linux
```bash
# Make the script executable and run:
chmod +x build-linux.sh
./build-linux.sh
```

## Manual Build Steps

If the automated scripts don't work, you can build manually:

### 1. Install Dependencies
```bash
npm install
npm install -D @tauri-apps/cli
```

### 2. (Optional) Generate Icons
```bash
# If you have ImageMagick installed and want custom icons:
node build-icons.js path/to/your/icon.png

# Or create default icons:
node build-icons.js
```

### 3. Build the Application
```bash
# Build frontend
npm run build

# Build desktop app
npx tauri build
```

## Output Locations

### Windows
- Executable: `src-tauri\target\release\Gene Editor.exe`
- MSI Installer: `src-tauri\target\release\bundle\msi\`
- NSIS Installer: `src-tauri\target\release\bundle\nsis\`

### Linux
- Executable: `src-tauri/target/release/gene-editor`
- Debian Package: `src-tauri/target/release/bundle/deb/*.deb`
- RPM Package: `src-tauri/target/release/bundle/rpm/*.rpm`
- AppImage: `src-tauri/target/release/bundle/appimage/*.AppImage`

## Development Mode

To run the app in development mode with hot reload:

```bash
npx tauri dev
```

This will:
1. Start the Vite dev server
2. Launch the Tauri window
3. Enable hot reload for both frontend and Rust code

## Troubleshooting

### "Rust is not installed"
Install Rust from https://rustup.rs/ or use:
- Windows: `winget install Rustlang.Rustup`
- Linux/macOS: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### "Failed to build webkit2gtk"
On Linux, make sure you have the correct WebKit2GTK version:
```bash
# Check installed version
pkg-config --modversion webkit2gtk-4.1

# If not found, install it (see Linux prerequisites above)
```

### Build fails with memory errors
Tauri builds can be memory-intensive. Try:
```bash
# Reduce parallel jobs
CARGO_BUILD_JOBS=1 npx tauri build
```

## Packaging for Distribution

### Windows
The build script automatically creates:
- `.exe` - Standalone executable
- `.msi` - Windows Installer package
- `.exe` (NSIS) - Installer with optional components

### Linux
The build script creates:
- `.deb` - For Debian/Ubuntu
- `.rpm` - For Fedora/RHEL
- `.AppImage` - Universal Linux package (recommended)

## Cross-Compilation

### Build Windows on Windows
Run `build-windows.bat`

### Build Linux on Linux
Run `build-linux.sh`

### Cross-compiling from Windows to Linux
This requires additional setup (WSL2 recommended):
```bash
# In WSL2 Ubuntu
sudo apt-get update
sudo apt-get install -y gcc g++ pkg-config libssl-dev
# Then run the Linux build script
```

## License

The desktop wrapper code follows the same MIT license as the web application.
