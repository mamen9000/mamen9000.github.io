@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\tag_repository.ps1"
if errorlevel 1 (echo. & echo Topic update failed.)
echo.
pause
