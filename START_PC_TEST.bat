@echo off
setlocal
cd /d "%~dp0"
title TimeAttack PWA PC Test
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0local_server.ps1" -Port 8080
if errorlevel 1 (
 echo.
 echo Local server could not start.
 echo Please send a screenshot of this window.
 pause
)
endlocal
