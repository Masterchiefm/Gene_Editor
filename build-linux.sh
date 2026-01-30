#!/bin/bash

echo "=========================================="
echo "Gene Editor - Linux Build Script"
echo "=========================================="
echo ""

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "[ERROR] Rust is not installed!"
    echo "Please install Rust from: https://rustup.rs/"
    echo ""
    echo "Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "[1/5] Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
elif command -v dnf &> /dev/null; then
    # Fedora
    sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel patchelf
elif command -v pacman &> /dev/null; then
    # Arch Linux
    sudo pacman -S --needed --noconfirm webkit2gtk-4.1 libappindicator-gtk3 librsvg patchelf
else
    echo "[WARNING] Unknown package manager. Please install WebKit2GTK 4.1 manually."
fi

echo ""
echo "[2/5] Installing Tauri CLI..."
npm install -D @tauri-apps/cli
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Tauri CLI"
    exit 1
fi

echo ""
echo "[3/5] Installing Rust dependencies..."
cd src-tauri
cargo fetch
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to fetch Rust dependencies"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "[4/5] Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build frontend"
    exit 1
fi

echo ""
echo "[5/5] Building Linux executable..."
npx tauri build
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build Linux executable"
    exit 1
fi

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
echo ""
echo "Executable location:"
echo "  src-tauri/target/release/gene-editor"
echo ""
echo "Package locations:"
echo "  src-tauri/target/release/bundle/deb/*.deb     (Debian/Ubuntu)"
echo "  src-tauri/target/release/bundle/rpm/*.rpm     (Fedora/RHEL)"
echo "  src-tauri/target/release/bundle/appimage/*.AppImage  (Universal)"
echo ""
