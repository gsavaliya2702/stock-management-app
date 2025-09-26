@echo off
echo Stock Management App - Database Reset ^& Seed Tool
echo =============================================
echo.
echo WARNING: This will delete ALL data from your database!
echo This includes products, categories, suppliers, customers, stock-in and stock-out records.
echo.
echo [1] Reset only (delete all data)
echo [2] Reset and seed (delete all data and add sample data)
echo [3] Cancel
echo.

set /p choice=Enter your choice (1-3): 

if "%choice%"=="1" (
    echo.
    echo Running database reset...
    call npm run reset-db
    echo.
    echo Database reset complete!
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Running database reset and seed...
    call npm run reset-and-seed
    echo.
    echo Database reset and seed complete!
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Operation cancelled.
    goto end
)

echo.
echo Invalid choice. Operation cancelled.

:end
pause
