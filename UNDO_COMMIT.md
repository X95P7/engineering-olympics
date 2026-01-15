# Instructions to Undo Commit with Electron Build Artifacts

## Step 1: Undo the last commit (keeps changes staged)
```bash
git reset --soft HEAD~1
```

## Step 2: Remove build artifacts from git tracking
```bash
git rm -r --cached app/dist/ app/release/
git rm --cached app/release/*.exe app/release/*.exe.blockmap 2>$null
```

## Step 3: Commit again with just the .gitignore update
```bash
git add .gitignore
git commit -m "Update .gitignore to exclude Electron build artifacts"
```

## Alternative: If you want to completely remove the commit and unstage everything
```bash
git reset HEAD~1
# Then manually remove build artifacts from tracking
git rm -r --cached app/dist/ app/release/ 2>$null
# Then add and commit .gitignore
git add .gitignore
git commit -m "Update .gitignore to exclude Electron build artifacts"
```

## Note
The build artifacts will remain on your local filesystem but will no longer be tracked by git.

