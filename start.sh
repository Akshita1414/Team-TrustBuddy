#!/bin/bash

echo "Starting TrustBuddy Application..."
echo

echo "Starting Backend Server..."
cd backend
gnome-terminal --title="TrustBuddy Backend" -- bash -c "python main.py; exec bash" &
cd ..

echo
echo "Starting Frontend Server..."
cd frontend
gnome-terminal --title="TrustBuddy Frontend" -- bash -c "npm start; exec bash" &
cd ..

echo
echo "Both services are starting..."
echo "Backend will be available at: http://localhost:8000"
echo "Frontend will be available at: http://localhost:3000"
echo
echo "Press Ctrl+C to stop this script (services will continue running)"
echo "To stop services, close the terminal windows or use 'pkill -f python' and 'pkill -f npm'" 