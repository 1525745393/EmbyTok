# Push code to both Gitee and GitHub

# Get current branch name
$currentBranch = git rev-parse --abbrev-ref HEAD

Write-Host "Current branch: $currentBranch"
Write-Host ""

Write-Host "Pushing code to Gitee..."
git push origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully pushed code to Gitee"
} else {
    Write-Host "✗ Failed to push code to Gitee"
    pause
    exit 1
}

Write-Host ""
Write-Host "Pushing code to GitHub..."
# Push directly to GitHub main branch
if ($currentBranch -eq "master") {
    git push github master:main -f
} else {
    git push github $currentBranch
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully pushed code to GitHub"
} else {
    Write-Host "✗ Failed to push code to GitHub"
    pause
    exit 1
}

Write-Host "🎉 All platforms pushed successfully!"
pause
