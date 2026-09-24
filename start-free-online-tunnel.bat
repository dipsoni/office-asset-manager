@echo off
title AssetVault - Free Online Cloud Server (Cloudflare)
echo ====================================================
echo Starting AssetVault Unified Server + Cloudflare Tunnel
echo ====================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/2] Launching AssetVault Server (Port 5000)...
start "AssetVault Server" cmd /k "cd /d "%SCRIPT_DIR%backend" && node server.js"

timeout /t 3 >nul

echo [2/2] Starting Free Public Cloudflare HTTPS Tunnel...
echo ====================================================
echo Look for the link ending in: .trycloudflare.com
echo Share that link with your colleague on another PC!
echo No passwords required - opens directly in browser!
echo ====================================================
echo.
.\cloudflared.exe tunnel --url http://localhost:5000
pause
