Write-Host " Démarrage de ShopTonik..." -ForegroundColor Cyan

# Démarrer le backend FastAPI
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# Attendre 2 secondes
Start-Sleep -Seconds 2

# Démarrer le frontend Next.js
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; npm run dev"

Write-Host " Backend: http://localhost:8000" -ForegroundColor Green
Write-Host " Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host " Documentation API: http://localhost:8000/docs" -ForegroundColor Yellow
