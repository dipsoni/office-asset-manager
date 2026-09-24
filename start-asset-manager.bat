@echo off
title Personal Asset Management System - AssetVault
echo ====================================================
echo Starting Personal Asset Management System (Offline)
echo ====================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/2] Starting Node.js + SQLite Local Backend (Port 5000)...
start "AssetVault Backend" cmd /k "cd /d "%SCRIPT_DIR%backend" && node server.js"

echo [2/2] Starting React + Vite Frontend (Port 5173)...
start "AssetVault Frontend" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm.cmd run dev -- --port 5173 --host 0.0.0.0"

timeout /t 3 >nul
echo.
echo ====================================================
echo AssetVault is now RUNNING!
echo Local Address:          http://localhost:5173
echo Office Network Address: http://192.168.1.18:5173
echo ====================================================
start http://localhost:5173

pause
