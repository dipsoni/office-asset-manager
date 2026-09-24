@echo off
title Allow AssetVault Office Network Access
echo ==========================================================
echo Configuring Windows Firewall for Office Multi-User Access
echo ==========================================================
echo.
echo Requesting Administrator permission to open ports 5173 and 5000...
echo.

powershell -Command "Start-Process cmd -ArgumentList '/c echo Adding Firewall Rules for AssetVault... & netsh advfirewall firewall add rule name=\"AssetVault Web\" dir=in action=allow protocol=TCP localport=5173 & netsh advfirewall firewall add rule name=\"AssetVault API\" dir=in action=allow protocol=TCP localport=5000 & echo. & echo SUCCESS! Both ports are now open for other office PCs. & timeout /t 4' -Verb RunAs"

echo Done. Other people on your office Wi-Fi can now connect.
pause
