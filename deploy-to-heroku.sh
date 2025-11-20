#!/bin/bash

# Heroku Deployment Script for ForgeArena
# This script helps automate the Heroku deployment process

echo "🚀 ForgeArena Heroku Deployment Script"
echo "========================================"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null
then
    echo "❌ Heroku CLI is not installed."
    echo "Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo "✅ Heroku CLI found"
echo ""

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null
then
    echo "❌ You are not logged in to Heroku."
    echo "Please run: heroku login"
    exit 1
fi

echo "✅ Logged in to Heroku as: $(heroku auth:whoami)"
echo ""

# Check if git remote 'heroku' exists
if git remote get-url heroku &> /dev/null
then
    echo "✅ Heroku remote found: $(git remote get-url heroku)"
    echo ""
    read -p "Do you want to deploy to this app? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        echo "Deployment cancelled."
        exit 0
    fi
else
    echo "⚠️  No Heroku app linked to this repository."
    echo ""
    read -p "Enter Heroku app name (leave blank to create new app): " app_name
    
    if [ -z "$app_name" ]
    then
        echo "Creating new Heroku app..."
        heroku create
    else
        echo "Creating Heroku app: $app_name"
        heroku create "$app_name"
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create Heroku app"
        exit 1
    fi
    
    echo "✅ Heroku app created successfully"
    echo ""
fi

# Set environment variables
echo "Setting environment variables..."
heroku config:set NODE_ENV=production

echo ""
read -p "Do you want to set Firebase environment variables? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Please enter your Firebase configuration:"
    read -p "FIREBASE_API_KEY: " firebase_api_key
    read -p "FIREBASE_AUTH_DOMAIN: " firebase_auth_domain
    read -p "FIREBASE_PROJECT_ID: " firebase_project_id
    read -p "FIREBASE_STORAGE_BUCKET: " firebase_storage_bucket
    read -p "FIREBASE_MESSAGING_SENDER_ID: " firebase_sender_id
    read -p "FIREBASE_APP_ID: " firebase_app_id
    
    heroku config:set FIREBASE_API_KEY="$firebase_api_key"
    heroku config:set FIREBASE_AUTH_DOMAIN="$firebase_auth_domain"
    heroku config:set FIREBASE_PROJECT_ID="$firebase_project_id"
    heroku config:set FIREBASE_STORAGE_BUCKET="$firebase_storage_bucket"
    heroku config:set FIREBASE_MESSAGING_SENDER_ID="$firebase_sender_id"
    heroku config:set FIREBASE_APP_ID="$firebase_app_id"
    
    echo "✅ Firebase environment variables set"
fi

echo ""
echo "Current environment variables:"
heroku config
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]
then
    echo "⚠️  You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes before deploying? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        echo "✅ Changes committed"
    else
        echo "⚠️  Deploying without committing changes"
    fi
fi

echo ""
echo "🚀 Deploying to Heroku..."
echo "This may take a few minutes..."
echo ""

# Deploy to Heroku
git push heroku main

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed. Check the logs above for errors."
    echo "Try running: heroku logs --tail"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# Open the app
read -p "Do you want to open the app in your browser? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    heroku open
fi

echo ""
echo "📊 View logs: heroku logs --tail"
echo "🔄 Restart app: heroku restart"
echo "⚙️  View config: heroku config"
echo "🌐 Open app: heroku open"
echo ""
echo "✨ Deployment complete!"

