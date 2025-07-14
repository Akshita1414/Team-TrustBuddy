@echo off
echo ========================================
echo TrustBuddy Setup and Test Script
echo ========================================
echo.

echo Step 1: Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully
cd ..

echo.
echo Step 2: Installing Backend Dependencies...
cd backend
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully
cd ..

echo.
echo Step 3: Starting Backend Server...
cd backend
start "TrustBuddy Backend" cmd /k "python main.py"
cd ..

echo.
echo Step 4: Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 5: Testing Backend Connection...
python test_integration.py

echo.
echo Step 6: Starting Frontend Server...
cd frontend
start "TrustBuddy Frontend" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul 