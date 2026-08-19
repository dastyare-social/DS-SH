# Versioning Guide

A complete, step-by-step guide to versioning Dastyare Social — SH. This document covers everything from understanding semantic versioning to creating your first release.

---

## TL;DR

```
1. Make changes on main
2. git tag v0.1.0
3. git push origin v0.1.0
4. GitHub Release is created automatically
```

That's it. The release workflow handles everything else.

---

## How It Works

Dastyare Social — SH uses **semantic versioning** (semver) with **Git tags** for releases. There is one branch (`main`) and releases are created by pushing a version tag.

```
main (default branch)
  │
  ├── commit: feat: add custom domains
  ├── commit: fix: resolve redirect loop
  │
  ▼
  git tag v0.1.0  ──►  GitHub Release (auto-generated changelog)
  │
  ├── commit: feat: add analytics dashboard
  ├── commit: fix: handle expired sessions
  │
  ▼
  git tag v0.2.0  ──►  GitHub Release (auto-generated changelog)
```

**You never need to create a branch for a release.** Just tag and push.

---

## Semantic Versioning

Every release follows this format: `vMAJOR.MINOR.PATCH`

| Part | When to bump | Example |
|------|-------------|---------|
| **MAJOR** | Breaking changes (API changes, database schema changes, removed features) | `v0.x.x` → `v1.0.0` |
| **MINOR** | New features (backwards compatible) | `v0.1.0` → `v0.2.0` |
| **PATCH** | Bug fixes (backwards compatible) | `v0.1.0` → `v0.1.1` |

### Examples

| Change | Version bump | New version |
|--------|-------------|-------------|
| Fixed a typo in the dashboard | PATCH | `v0.1.0` → `v0.1.1` |
| Added custom slug support | MINOR | `v0.1.1` → `v0.2.0` |
| Changed the REST API response format | MAJOR | `v0.2.0` → `v1.0.0` |
| Added click analytics | MINOR | `v0.2.0` → `v0.3.0` |
| Fixed a redirect counting bug | PATCH | `v0.3.0` → `v0.3.1` |

### Before v1.0.0

While the project is in early development (v0.x.x), **MINOR bumps can include small breaking changes**. This is normal for pre-1.0 software. Once you hit `v1.0.0`, the API is considered stable and breaking changes require a MAJOR bump.

---

## Step-by-Step: Creating a Release

### Step 1: Make sure everything is committed

```bash
git status
```

You should see a clean working tree. No uncommitted changes.

### Step 2: Decide the version number

Look at what changed since the last release:

```bash
# See all commits since the last tag
git log $(git tag --sort=-v:refname | head -1)..HEAD --oneline
```

Ask yourself:
- Did I add new features? → Bump MINOR
- Did I fix bugs only? → Bump PATCH
- Did I break the API or database schema? → Bump MAJOR

### Step 3: Create the tag

```bash
git tag v0.2.0
```

### Step 4: Push the tag

```bash
git push origin v0.2.0
```

### Step 5: Wait for the release

The GitHub Actions workflow will:
1. Run lint, type check, tests, and build
2. Generate a changelog from your commit messages
3. Create a GitHub Release at `https://github.com/dastyare-social/DS-SH/releases/tag/v0.2.0`

The changelog is automatically grouped by commit type:
- `feat:` commits → **Features** section
- `fix:` commits → **Bug Fixes** section
- Everything else → **Other Changes** section

---

## Commit Message Convention

The release workflow uses your commit messages to generate changelogs. Follow this format:

```
<type>: <description>
```

| Type | Purpose | Changelog section |
|------|---------|-------------------|
| `feat` | New feature | Features |
| `fix` | Bug fix | Bug Fixes |
| `docs` | Documentation changes | Other Changes |
| `chore` | Maintenance, dependencies | Other Changes |
| `refactor` | Code restructuring | Other Changes |
| `test` | Adding tests | Other Changes |
| `ci` | CI/CD changes | Other Changes |
| `style` | Code style (formatting) | Other Changes |

### Good examples

```
feat: add custom slug support
fix: resolve redirect loop on expired links
docs: update self-hosting guide
chore: upgrade Next.js to 16.1.7
feat: add click analytics dashboard
fix: handle null origin in auth middleware
```

### Bad examples

```
updated stuff          # No type, vague
fix bug                 # No colon, vague
WIP                     # Not descriptive
feat added new thing    # Wrong format
```

### Why this matters

When someone looks at a GitHub Release, they see:

```
v0.2.0

What's Changed

Features
- add custom slug support (a1b2c3d)
- add click analytics dashboard (e4f5g6h)

Bug Fixes
- resolve redirect loop on expired links (i7j8k9l)
- handle null origin in auth middleware (m0n1o2p)

Other Changes
- upgrade Next.js to 16.1.7 (q3r4s5t)
```

Clear, organized, professional.

---

## First Release

If this is your first release, all commits since the beginning will be included in the changelog:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The changelog will include every commit, grouped by type.

---

## Releasing a Hotfix

If you need to fix a bug in the current release:

```bash
# 1. Fix the bug on main
git commit -m "fix: resolve session expiration issue"

# 2. Tag the patch release
git tag v0.2.1

# 3. Push
git push origin v0.2.1
```

The release workflow creates a new release with just the fix.

---

## Listing All Releases

```bash
# List all tags locally
git tag --sort=-v:refname

# List all tags on remote
git ls-remote --tags origin

# See releases on GitHub
open https://github.com/dastyare-social/DS-SH/releases
```

---

## Deleting a Tag (if you made a mistake)

```bash
# Delete locally
git tag -d v0.2.0

# Delete on remote
git push origin --delete v0.2.0
```

Then create the correct tag and push again.

---

## What the Release Workflow Does

When you push a tag, `.github/workflows/release.yml` runs:

```
Push tag v0.2.0
       │
       ▼
┌─────────────────────────┐
│  1. Checkout code        │
│  2. Install Bun          │
│  3. Install dependencies │
│  4. Lint (biome check)   │
│  5. Type check (tsc)     │
│  6. Run tests            │
│  7. Build (next build)   │
└────────────┬────────────┘
             │
             ▼ (all pass)
┌─────────────────────────┐
│  8. Generate changelog   │
│  9. Create GitHub Release│
└─────────────────────────┘
```

If any step fails (lint error, type error, test failure, build error), the release is **not created**. This ensures only working code gets released.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Create a tag | `git tag v0.1.0` |
| Push a tag | `git push origin v0.1.0` |
| List local tags | `git tag --sort=-v:refname` |
| Delete a tag locally | `git tag -d v0.1.0` |
| Delete a tag on remote | `git push origin --delete v0.1.0` |
| View releases | `https://github.com/dastyare-social/DS-SH/releases` |

---

## FAQ

### Do I need to update version numbers in code?

No. The version is determined solely by Git tags. There's no `package.json` version field to update (it's set to `0.1.0` and stays there for now).

### Can I create a release from a branch other than main?

The workflow triggers on any tag push (`v*`), but you should always release from `main`. Releases from other branches create confusion.

### What if I push a tag before all tests pass?

The workflow will fail and no release will be created. Fix the issue, delete the tag, and push again:

```bash
git tag -d v0.1.0
git push origin --delete v0.1.0
# fix the issue
git commit -m "fix: resolve failing test"
git tag v0.1.0
git push origin v0.1.0
```

### Can I create a pre-release?

Yes. Use a suffix like `-beta.1` or `-rc.1`:

```bash
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

GitHub will mark it as a pre-release automatically.
