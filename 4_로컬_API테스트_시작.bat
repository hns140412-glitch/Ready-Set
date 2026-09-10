@echo off
chcp 65001 > nul
title Ready & Set 로컬 API 테스트
cd /d "%~dp0"

where node >nul 2>nul
if not %errorlevel%==0 (
  echo.
  echo Node.js가 설치되어 있지 않습니다.
  echo Node.js 설치 후 다시 실행해 주세요.
  echo.
  pause
  goto :eof
)

if not exist .env.local (
  echo.
  echo .env.local 파일이 없습니다.
  echo 아래 두 값을 Ready-Set 폴더의 .env.local에 넣어 주세요.
  echo OPENAI_API_KEY=여기에_API_KEY
  echo READY_CHARACTER_PAID_GENERATION=true
  echo.
  pause
  goto :eof
)

echo.
echo [Ready & Set] 완전 로컬 UI + API 테스트를 시작합니다.
echo 브라우저 주소: http://localhost:8080
echo 종료: Ctrl+C
start "" http://localhost:8080
node local_dev_server.mjs
