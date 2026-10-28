@echo off
title CampusConnect Web Portal
echo ====================================================
echo Starting CampusConnect Full-Stack Web Application...
echo ====================================================
echo.
echo URL: http://localhost:3000
echo.
echo Demo Accounts:
echo   Administrator : admin@campus.edu         / password123
echo   Staff (IT)    : staff.it@campus.edu      / password123
echo   Staff (Facil) : staff.facilities@campus.edu / password123
echo   Student (1)   : student1@campus.edu      / password123
echo   Student (2)   : student2@campus.edu      / password123
echo.
echo Opening browser in 3 seconds...
start "" http://localhost:3000
echo.
echo Starting Next.js Dev Server...
npm run dev
pause

