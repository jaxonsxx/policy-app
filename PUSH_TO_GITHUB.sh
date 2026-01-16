#!/bin/bash
# Script to push this project to your own GitHub repository
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual GitHub username and repository name

echo "🚀 Setting up your GitHub repository..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "➕ Adding all files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Initial commit - Ready for Netlify deployment"

# Instructions
echo ""
echo "✅ Files are ready to push!"
echo ""
echo "Now run these commands (replace YOUR_USERNAME and YOUR_REPO_NAME):"
echo ""
echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
echo "Or if you prefer SSH:"
echo ""
echo "  git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""

