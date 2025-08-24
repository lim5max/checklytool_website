#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Stop current containers
echo "🛑 Stopping current containers..."
docker-compose down

# Remove old images (optional - saves disk space)
echo "🗑️ Removing old Docker images..."
docker image prune -f

# Build and start new containers
echo "🏗️ Building and starting new containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Checking services status..."
docker-compose ps

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is running."
else
    echo "❌ Health check failed!"
    docker-compose logs
    exit 1
fi

echo "🎉 Deployment completed successfully!"