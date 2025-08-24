#!/bin/bash

echo "🛑 Stopping PM2 processes and nginx..."

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    echo "📦 Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    echo "✅ PM2 processes stopped"
else
    echo "ℹ️  PM2 not found or not running"
fi

# Check if nginx is running as a service
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "🌐 Stopping nginx service..."
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    echo "✅ Nginx service stopped and disabled"
elif pgrep nginx > /dev/null; then
    echo "🌐 Stopping nginx processes..."
    sudo pkill nginx 2>/dev/null || true
    echo "✅ Nginx processes stopped"
else
    echo "ℹ️  Nginx not running"
fi

# Check for any processes on port 80 and 443
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Something is still running on port 80"
    lsof -Pi :80 -sTCP:LISTEN
fi

if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Something is still running on port 443"
    lsof -Pi :443 -sTCP:LISTEN
fi

echo "🎉 Old services cleanup completed!"