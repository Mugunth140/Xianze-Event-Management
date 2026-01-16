---
description: Git workflow for team collaboration with development, sharan, and production branches
---

# Team Git Workflow 🔀

## Your Branch Setup

```
        production (LIVE SITE - final merged code)
              ↑
    ┌─────────┴─────────┐
    │                   │
development         sharan
 (YOU)            (COLLEAGUE)
```

Both `development` and `sharan` feed into `production`.

---

## Daily Workflow

### YOU (on `development`)
// turbo
```bash
# Start of day - get latest
git checkout development
git pull origin development

# Work on your code...

# End of day - push your work
git add .
git commit -m "feat: your message"
git push origin development
```

### COLLEAGUE (on `sharan`)
// turbo
```bash
# Start of day - get latest
git checkout sharan
git pull origin sharan

# Work on their code...

# End of day - push their work
git add .
git commit -m "feat: their message"
git push origin sharan
```

---

## Syncing Each Other's Work (Weekly or as needed)

### YOU want COLLEAGUE's changes:
```bash
git checkout development
git pull origin development
git merge origin/sharan --no-edit
git push origin development
```

### COLLEAGUE wants YOUR changes:
```bash
git checkout sharan
git pull origin sharan
git merge origin/development --no-edit
git push origin sharan
```

---

## Deploy to Production (When ready to go live)

### Step 1: Sync both branches first
```bash
# Get colleague's latest work into development
git checkout development
git pull origin development
git merge origin/sharan --no-edit
git push origin development
```

### Step 2: Deploy to production
```bash
git checkout production
git pull origin production
git merge development --no-edit
git push origin production
```

---

## Merge Conflict Resolution 🚨

If you see conflict markers like:
```
<<<<<<< HEAD
your code
=======
their code
>>>>>>> sharan
```

1. Keep the code you want (or combine both)
2. Delete the `<<<<<<<`, `=======`, `>>>>>>>` lines
3. Save and commit:
```bash
git add .
git commit -m "fix: resolve merge conflict"
git push
```

---

## Quick Commands

| Action | Command |
|--------|---------|
| Start work | `git pull` |
| Save work | `git add . && git commit -m "msg" && git push` |
| Get colleague's work | `git merge origin/sharan` (on development) |
| Deploy | `git checkout production && git merge development && git push` |

---

## Golden Rules ⚠️

1. **Pull before you start working**
2. **Push at end of day**
3. **Sync weekly** to avoid big conflicts
4. **Only deploy from `development`** after merging colleague's work
