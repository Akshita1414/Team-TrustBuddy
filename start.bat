@echo off
echo Starting TrustBuddy Application...
echo.

echo Starting Backend Server...
cd backend
start "TrustBuddy Backend" cmd /k "python main.py"
cd ..

echo.
echo Starting Frontend Server...
cd frontend
start "TrustBuddy Frontend" cmd /k "npm start"
cd ..

echo.
echo Both services are starting...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to exit this script (services will continue running)
pause > nul 