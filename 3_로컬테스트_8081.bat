@echo off
chcp 65001 > nul
title 타임어택 PWA 로컬 테스트 8081
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8081"
  python -m http.server 8081
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8081"
  py -m http.server 8081
  goto :eof
)

echo Python을 찾을 수 없습니다.
pause
