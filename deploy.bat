@echo off
echo ============================================================
echo  Student Analytics Dashboard - Automated AWS Deployment
echo ============================================================
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
pause
