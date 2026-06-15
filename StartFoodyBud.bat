@echo off
title FoodyBud - Mobile Dev Server
color 0A
cls

echo.
echo  ==========================================
echo        FOODYBUD - MOBILE DEV SERVER
echo  ==========================================
echo.

:: Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"') do (
    set IP=%%a
    goto :found
)

:found
:: Remove leading space from IP
set IP=%IP: =%

echo  Your PC's local IP: %IP%
echo.
echo  ==========================================
echo   TYPE THIS ON YOUR PHONE'S BROWSER:
echo.
echo       http://%IP%:5173
echo.
echo  ==========================================
echo.
echo  Make sure your phone is on the same Wi-Fi!
echo  Starting server... (keep this window open)
echo.

cd /d "%~dp0"
npm run dev

pause
