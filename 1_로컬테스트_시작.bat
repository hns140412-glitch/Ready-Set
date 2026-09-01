@echo off
chcp 65001 > nul
title 타임어택 PWA 로컬 테스트
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  echo.
  echo [타임어택 PWA] 로컬 서버를 시작합니다.
  echo 브라우저 주소: http://localhost:8080
  echo 종료하려면 이 창에서 Ctrl+C 를 누르세요.
  echo.
  python -m http.server 8080
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  echo.
  echo [타임어택 PWA] 로컬 서버를 시작합니다.
  echo 브라우저 주소: http://localhost:8080
  echo 종료하려면 이 창에서 Ctrl+C 를 누르세요.
  echo.
  py -m http.server 8080
  goto :eof
)

echo.
echo Python을 찾을 수 없습니다.
echo Python 설치 후 다시 실행해주세요.
echo 설치 후 명령 프롬프트에서 python --version 으로 확인할 수 있습니다.
echo.
pause
