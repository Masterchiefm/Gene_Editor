@echo off
chcp 65001 >nul
echo ==========================================
echo Gene Editor - Setup and Build
echo ==========================================
echo.

:: Check admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 建议以管理员身份运行此脚本
    echo.
)

echo [1/5] 检查并安装 Rust...
where rustc >nul 2>nul
if %errorlevel% equ 0 (
    echo     Rust 已安装
    rustc --version
) else (
    echo     正在下载 Rust...
    curl -L -o %TEMP%\rustup-init.exe https://win.rustup.rs/x86_64
    if %errorlevel% neq 0 (
        echo [错误] 下载失败，请手动访问 https://rustup.rs/ 安装 Rust
        pause
        exit /b 1
    )
    echo     正在安装 Rust...
    %TEMP%\rustup-init.exe -y --default-toolchain stable
    set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
    echo     Rust 安装完成
)

echo.
echo [2/5] 安装 Node.js 依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] npm install 失败
    pause
    exit /b 1
)
echo     完成

echo.
echo [3/5] 安装 Tauri CLI...
call npm install -D @tauri-apps/cli
if %errorlevel% neq 0 (
    echo [错误] Tauri CLI 安装失败
    pause
    exit /b 1
)
echo     完成

echo.
echo [4/5] 构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo     完成

echo.
echo [5/5] 构建 Windows 桌面应用...
echo     这可能需要几分钟，请耐心等待...
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
call npx tauri build
if %errorlevel% neq 0 (
    echo.
    echo [错误] 构建失败
    echo.
    echo 可能的解决方案：
    echo 1. 安装 Visual Studio C++ 构建工具
    echo    https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo    安装时选择 "Desktop development with C++"
    echo.
    echo 2. 重启电脑后再试
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 构建成功！
echo ==========================================
echo.

if exist "src-tauri\target\release\Gene Editor.exe" (
    echo 可执行文件: %CD%\src-tauri\target\release\Gene Editor.exe
)

for %%f in ("src-tauri\target\release\bundle\msi\*.msi") do (
    echo MSI 安装包: %%~ff
)

for %%f in ("src-tauri\target\release\bundle\nsis\*.exe") do (
    echo NSIS 安装包: %%~ff
)

echo.
pause
