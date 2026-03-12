@echo off
echo Starting AegisVee...

:: Start Backend
echo Starting Backend...
start "AegisVee Backend" cmd /k "cd /d %~dp0backend && d:\Work\VSaaS\envs\python.exe main.py"

:: Start Frontend
echo Starting Frontend...
start "AegisVee Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo AegisVee started!
exit
