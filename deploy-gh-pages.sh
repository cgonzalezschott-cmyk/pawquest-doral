#!/usr/bin/env bash
# One-time publish to GitHub Pages (free). Requires: gh auth login (done once by the account owner).
set -euo pipefail
cd "$(dirname "$0")"
gh repo create pawquest-doral --public --source . --remote origin --push --description "PawQuest Doral — gamified dog-walking PWA"
OWNER=$(gh api user -q .login)
gh api -X POST "repos/$OWNER/pawquest-doral/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null || true
echo "Live in ~1 min at: https://$OWNER.github.io/pawquest-doral/"
