# Stock Management App - Database Reset & Seed Tool
Write-Host "Stock Management App - Database Reset & Seed Tool" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "WARNING: This will delete ALL data from your database!" -ForegroundColor Red
Write-Host "This includes products, categories, suppliers, customers, stock-in and stock-out records." -ForegroundColor Red
Write-Host ""

$options = @(
    "Reset only (delete all data)",
    "Reset and seed (delete all data and add sample data)",
    "Cancel"
)

for ($i = 0; $i -lt $options.Count; $i++) {
    Write-Host "[$($i+1)] $($options[$i])"
}

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running database reset..." -ForegroundColor Cyan
        npm run reset-db
        Write-Host ""
        Write-Host "Database reset complete!" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "Running database reset and seed..." -ForegroundColor Cyan
        npm run reset-and-seed
        Write-Host ""
        Write-Host "Database reset and seed complete!" -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host ""
        Write-Host "Invalid choice. Operation cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
