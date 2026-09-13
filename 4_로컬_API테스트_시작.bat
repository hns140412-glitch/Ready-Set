@echo off
chcp 65001 > nul
title Ready & Set 로컬 API 무과금 연결 테스트
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
  >.env.local echo READY_CHARACTER_PAID_GENERATION=false
  echo [Ready ^& Set] .env.local을 무과금 잠금 상태로 생성했습니다.
)

set READY_CHARACTER_PAID_GENERATION=false

echo.
echo [Ready ^& Set] 로컬 UI + API 무과금 연결 테스트를 시작합니다.
echo 브라우저 주소: http://localhost:8080
echo 이미지 생성 API: LOCKED
 echo 이 실행에서는 실제 이미지 생성 비용이 발생하지 않습니다.
echo 종료: Ctrl+C
start "" http://localhost:8080
node local_dev_server.mjs
