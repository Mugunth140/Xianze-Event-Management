---
description: Git workflow for team collaboration with development, sharan, and production branches
---

# Team Git Workflow 🔀

## Branch Setup

```
              production (LIVE)
                    ↑
          ┌────────┴────────┐
          │                 │
     development         sharan
       (YOU)           (COLLEAGUE)
```

**Both of you can deploy to production!**

---

## Daily Work

### YOU (on `development`)
// turbo
```bash
git checkout development
git pull origin development
# ... do your work ...
git add . && git commit -m "your message" && git push
```

### COLLEAGUE (on `sharan`)
// turbo
```bash
git checkout sharan
git pull origin sharan
# ... do their work ...
git add . && git commit -m "their message" && git push
```

---

## Deploy to Production

### YOU deploying:
```bash
git checkout production
git pull origin production
git merge origin/development --no-edit
git push origin production
```

### COLLEAGUE deploying:
```bash
git checkout production
git pull origin production
git merge origin/sharan --no-edit
git push origin production
```

---

## Sync Each Other's Work

### YOU get colleague's changes:
```bash
git checkout development
git pull origin development
git merge origin/sharan --no-edit
git push origin development
```

### COLLEAGUE gets your changes:
```bash
git checkout sharan
git pull origin sharan
git merge origin/development --no-edit
git push origin sharan
```

---

## Best Practice: Full Sync Before Deploy

Before deploying, sync everyone's work first:

### YOU:
```bash
git checkout development
git merge origin/sharan --no-edit
git push origin development
git checkout production
git merge development --no-edit
git push origin production
```

### COLLEAGUE:
```bash
git checkout sharan
git merge origin/development --no-edit
git push origin sharan
git checkout production
git merge sharan --no-edit
git push origin production
```

---

## Conflict Resolution 🚨

If you see:
```
<<<<<<< HEAD
your code
=======
their code
>>>>>>> origin/sharan
```

1. Keep what you need, delete markers
2. `git add . && git commit -m "fix: resolve conflict" && git push`

---

## Quick Reference

| Action | You | Colleague |
|--------|-----|-----------|
| Work branch | `development` | `sharan` |
| Get their work | `git merge origin/sharan` | `git merge origin/development` |
| Deploy | `git checkout production && git merge development && git push` | `git checkout production && git merge sharan && git push` |
