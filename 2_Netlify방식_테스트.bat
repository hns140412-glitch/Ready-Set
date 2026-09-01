@echo off
chcp 65001 > nul
title 타임어택 PWA Netlify 방식 테스트
cd /d "%~dp0"

where netlify >nul 2>nul
if not %errorlevel%==0 (
  echo.
  echo Netlify CLI가 설치되어 있지 않습니다.
  echo Node.js 설치 후 아래 명령을 먼저 실행하세요:
  echo npm install -g netlify-cli
  echo.
  pause
  goto :eof
)

echo.
echo [타임어택 PWA] Netlify 개발 서버를 시작합니다.
echo 처음이면 Netlify 로그인을 요구할 수 있습니다.
echo 종료하려면 Ctrl+C 를 누르세요.
echo.
netlify dev
