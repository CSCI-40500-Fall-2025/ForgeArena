# Heroku Deployment Script for ForgeArena (PowerShell)
# This script helps automate the Heroku deployment process on Windows

Write-Host "🚀 ForgeArena Heroku Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Heroku CLI is installed
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI found" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Heroku CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
}

# Check if user is logged in to Heroku
try {
    $whoami = heroku auth:whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Logged in to Heroku as: $whoami" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ You are not logged in to Heroku." -ForegroundColor Red
    Write-Host "Please run: heroku login"
    exit 1
}

# Check if git remote 'heroku' exists
try {
    $herokuRemote = git remote get-url heroku 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Heroku remote found: $herokuRemote" -ForegroundColor Green
        Write-Host ""
        $deploy = Read-Host "Do you want to deploy to this app? (y/n)"
        if ($deploy -notmatch '^[Yy]$') {
            Write-Host "Deployment cancelled."
            exit 0
        }
    } else {
        throw "No remote"
    }
} catch {
    Write-Host "⚠️  No Heroku app linked to this repository." -ForegroundColor Yellow
    Write-Host ""
    $appName = Read-Host "Enter Heroku app name (leave blank to create new app)"
    
    if ([string]::IsNullOrWhiteSpace($appName)) {
        Write-Host "Creating new Heroku app..."
        heroku create
    } else {
        Write-Host "Creating Heroku app: $appName"
        heroku create $appName
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create Heroku app" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Heroku app created successfully" -ForegroundColor Green
    Write-Host ""
}

# Set environment variables
Write-Host "Setting environment variables..."
heroku config:set NODE_ENV=production

Write-Host ""
$setFirebase = Read-Host "Do you want to set Firebase environment variables? (y/n)"
if ($setFirebase -match '^[Yy]$') {
    Write-Host "Please enter your Firebase configuration:"
    $firebaseApiKey = Read-Host "FIREBASE_API_KEY"
    $firebaseAuthDomain = Read-Host "FIREBASE_AUTH_DOMAIN"
    $firebaseProjectId = Read-Host "FIREBASE_PROJECT_ID"
    $firebaseStorageBucket = Read-Host "FIREBASE_STORAGE_BUCKET"
    $firebaseSenderId = Read-Host "FIREBASE_MESSAGING_SENDER_ID"
    $firebaseAppId = Read-Host "FIREBASE_APP_ID"
    
    heroku config:set "FIREBASE_API_KEY=$firebaseApiKey"
    heroku config:set "FIREBASE_AUTH_DOMAIN=$firebaseAuthDomain"
    heroku config:set "FIREBASE_PROJECT_ID=$firebaseProjectId"
    heroku config:set "FIREBASE_STORAGE_BUCKET=$firebaseStorageBucket"
    heroku config:set "FIREBASE_MESSAGING_SENDER_ID=$firebaseSenderId"
    heroku config:set "FIREBASE_APP_ID=$firebaseAppId"
    
    Write-Host "✅ Firebase environment variables set" -ForegroundColor Green
}

Write-Host ""
Write-Host "Current environment variables:"
heroku config
Write-Host ""

# Check for uncommitted changes
$gitStatus = git status -s
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    git status -s
    Write-Host ""
    $commitChanges = Read-Host "Do you want to commit these changes before deploying? (y/n)"
    if ($commitChanges -match '^[Yy]$') {
        $commitMsg = Read-Host "Enter commit message"
        git add .
        git commit -m "$commitMsg"
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Deploying without committing changes" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..."
Write-Host ""

# Deploy to Heroku
git push heroku main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the logs above for errors." -ForegroundColor Red
    Write-Host "Try running: heroku logs --tail"
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Open the app
$openApp = Read-Host "Do you want to open the app in your browser? (y/n)"
if ($openApp -match '^[Yy]$') {
    heroku open
}

Write-Host ""
Write-Host "📊 View logs: heroku logs --tail" -ForegroundColor Cyan
Write-Host "🔄 Restart app: heroku restart" -ForegroundColor Cyan
Write-Host "⚙️  View config: heroku config" -ForegroundColor Cyan
Write-Host "🌐 Open app: heroku open" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Deployment complete!" -ForegroundColor Green

