# WebSocket & Redis Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Artifex - WebSocket & Redis Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Return to root
Set-Location ..

# Check for .env file
Write-Host "Checking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# MongoDB
MONGODB_URI=mongodb://admin:admin123@localhost:27017/artifex?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_WEBHOOK_SECRET=

# Freepik API
FREEPIK_API_KEY=your_freepik_api_key_here
FREEPIK_API_URL=https://api.freepik.com/v1/ai/mystic

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Server Configuration
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
"@
    
    $envTemplate | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ .env template created. Please fill in your API keys." -ForegroundColor Green
}
Write-Host ""

# Start Docker Compose
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
Write-Host "This will start: MongoDB, Redis, Backend, Frontend" -ForegroundColor Cyan
Write-Host ""

docker-compose up -d mongodb redis

# Wait for services to be healthy
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $mongoHealthy = docker inspect --format='{{.State.Health.Status}}' artifex-mongodb 2>$null
    $redisHealthy = docker inspect --format='{{.State.Health.Status}}' artifex-redis 2>$null
    
    if ($mongoHealthy -eq "healthy" -and $redisHealthy -eq "healthy") {
        Write-Host "✅ All services are healthy!" -ForegroundColor Green
        break
    }
    
    $attempt++
    Write-Host "  Attempt $attempt/$maxAttempts - MongoDB: $mongoHealthy, Redis: $redisHealthy" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "⚠️  Services took too long to start. Check Docker logs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure your .env file has valid API keys" -ForegroundColor White
Write-Host "2. Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "3. Start the frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker Compose to start everything:" -ForegroundColor Yellow
Write-Host "  docker-compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Redis:    localhost:6379" -ForegroundColor Cyan
Write-Host "  MongoDB:  localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitor Redis:" -ForegroundColor Yellow
Write-Host "  docker exec -it artifex-redis redis-cli" -ForegroundColor White
Write-Host "  > KEYS bull:*" -ForegroundColor Gray
Write-Host "  > MONITOR" -ForegroundColor Gray
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f backend" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  See WEBSOCKET_REDIS_GUIDE.md for detailed usage" -ForegroundColor White
Write-Host ""
