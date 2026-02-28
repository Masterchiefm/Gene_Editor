@echo off
chcp 65001 >nul
echo ==========================================
echo Gene Editor - Windows Build Script
echo ==========================================
echo.

:: Check if Rust is installed
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Rust is not installed!
    echo Please install Rust from: https://rustup.rs/
    echo.
    echo Or run: winget install Rustlang.Rustup
    pause
    exit /b 1
)

echo [1/4] Installing Tauri CLI...
call npm install -D @tauri-apps/cli
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Tauri CLI
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Rust dependencies...
cd src-tauri
call cargo fetch
if %errorlevel% neq 0 (
    echo [ERROR] Failed to fetch Rust dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build frontend
    pause
    exit /b 1
)

echo.
echo [4/4] Building Windows executable...
call npx tauri build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Windows executable
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Build completed successfully!
echo ==========================================
echo.
echo Executable location:
echo   src-tauri\\target\\release\\Gene Editor.exe
echo.
echo Installer location:
echo   src-tauri\\target\\release\\bundle\\msi
echo   src-tauri\\target\\release\\bundle\\nsis
echo.
pause
