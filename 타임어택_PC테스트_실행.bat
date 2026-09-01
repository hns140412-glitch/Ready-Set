@echo off
chcp 65001 >nul
setlocal
title 타임어택 PWA - PC 테스트
cd /d "%~dp0"

set "PORT=8080"
set "URL=http://localhost:%PORT%"

echo ==========================================
echo       타임어택 PWA PC 테스트
echo ==========================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    echo 로컬 서버를 시작합니다...
    start "" cmd /c "timeout /t 2 /nobreak >nul & start "" "%URL%""
    echo.
    echo 브라우저 주소: %URL%
    echo 테스트 종료: 이 창에서 Ctrl+C
    echo.
    python -m http.server %PORT% --bind 127.0.0.1
    goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo 로컬 서버를 시작합니다...
    start "" cmd /c "timeout /t 2 /nobreak >nul & start "" "%URL%""
    echo.
    echo 브라우저 주소: %URL%
    echo 테스트 종료: 이 창에서 Ctrl+C
    echo.
    py -m http.server %PORT% --bind 127.0.0.1
    goto :end
)

echo Python이 설치되어 있지 않아 실행할 수 없습니다.
echo.
echo 1. Python을 설치합니다.
echo 2. 설치 화면에서 "Add Python to PATH"를 체크합니다.
echo 3. 설치 후 이 파일을 다시 더블클릭합니다.
echo.
pause

:end
endlocal
