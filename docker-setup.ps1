# Docker setup script for Artifex

Write-Host "Artifex Docker Setup" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[OK] Docker is installed" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[INFO] Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] .env file created" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[IMPORTANT] Edit the .env file and add your API keys:" -ForegroundColor Yellow
    Write-Host "   - CLERK_SECRET_KEY" -ForegroundColor White
    Write-Host "   - CLERK_PUBLISHABLE_KEY" -ForegroundColor White
    Write-Host "   - FREEPIK_API_KEY" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Have you added your API keys to .env? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "" 
        Write-Host "[WARNING] Please edit .env file and run this script again." -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
} else {
    Write-Host "[OK] .env file already exists" -ForegroundColor Green
    Write-Host ""
}

# Build and start containers
Write-Host "[INFO] Building Docker images (this may take several minutes)..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Docker build failed. Check the errors above." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Docker images built successfully" -ForegroundColor Green
Write-Host ""

# Start containers
Write-Host "[INFO] Starting containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Failed to start containers. Check the errors above." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Containers started successfully!" -ForegroundColor Green
Write-Host ""

# Wait for services to be healthy
Write-Host "[INFO] Waiting for services to be healthy (this may take up to 60 seconds)..." -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 10

# Show container status
Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Setup complete! Your application is running:" -ForegroundColor Green
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   MongoDB:   localhost:27017" -ForegroundColor White
Write-Host ""

Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:           docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop containers:     docker-compose down" -ForegroundColor White
Write-Host "   Restart containers:  docker-compose restart" -ForegroundColor White
Write-Host "   View this help:      See DOCKER_README.md" -ForegroundColor White
Write-Host ""

Write-Host "Happy coding!" -ForegroundColor Magenta
