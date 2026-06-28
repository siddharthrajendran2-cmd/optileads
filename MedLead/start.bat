@echo off
echo Starting MedLeads...

:: Start Flask backend
start "Flask Backend" cmd /k "cd /d %~dp0 && python app.py"

:: Wait a moment then start React frontend
timeout /t 2 /nobreak > nul
start "React Frontend" cmd /k "cd /d %~dp0\frontend && npm start"

echo.
echo MedLeads is starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
