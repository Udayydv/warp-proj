@echo off
echo Starting MicroCourses Application...

echo.
echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo Application is starting...
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul