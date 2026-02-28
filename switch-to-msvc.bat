@echo off
chcp 65001 >nul
echo ==========================================
echo Switching Rust to MSVC toolchain
echo ==========================================
echo.

echo [1/3] 安装 MSVC 工具链...
rustup toolchain install stable-x86_64-pc-windows-msvc
if %errorlevel% neq 0 (
    echo [错误] 安装 MSVC 工具链失败
    pause
    exit /b 1
)

echo.
echo [2/3] 设置默认工具链...
rustup default stable-x86_64-pc-windows-msvc
if %errorlevel% neq 0 (
    echo [错误] 设置默认工具链失败
    pause
    exit /b 1
)

echo.
echo [3/3] 验证安装...
rustc --version
cargo --version

echo.
echo ==========================================
echo 切换完成！
echo ==========================================
echo.
echo 现在请安装 Visual Studio Build Tools:
echo 1. 访问 https://aka.ms/vs/17/release/vs_BuildTools.exe
echo 2. 安装 "Desktop development with C++" 工作负载
echo 3. 然后重新运行 build-windows.bat
echo.
pause
