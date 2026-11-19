#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for publishing SwaraKala Studio as a private GitHub repository
# under @adityarachuri, provisioning GitHub Actions & Cloudflare Workers secrets,
# and deploying cleanly to Cloudflare Workers.
#
# Prerequisites on your workstation:
#   gh auth login
#   npx wrangler login
#
# Usage:
#   export CLOUDFLARE_API_TOKEN="..."
#   export CLOUDFLARE_ACCOUNT_ID="..."
#   export GEMINI_API_KEY="..."
#   bash scripts/bootstrap-github-cloudflare.sh

REPO_OWNER="adityarachuri"
REPO_NAME="swarakala-studio"
FULL_REPO="${REPO_OWNER}/${REPO_NAME}"

echo "==> 1/5 Verifying local compliance, lint, build & Cloudflare Worker bundle"
node scripts/verify-repo-compliance.mjs
npm run lint
npm run build
npx esbuild worker/index.ts --bundle --format=esm --platform=browser --outfile=/tmp/swarakala-worker.mjs
node scripts/verify-repo-compliance.mjs --with-dist

echo "==> 2/5 Creating private GitHub repository ${FULL_REPO} and pushing main"
if ! gh repo view "${FULL_REPO}" >/dev/null 2>&1; then
  gh repo create "${FULL_REPO}" --private --source=. --remote=origin --push
else
  git push -u origin main
fi

echo "==> 3/5 Configuring GitHub Actions & Release secrets"
for SECRET_NAME in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID GEMINI_API_KEY; do
  if [ -z "${!SECRET_NAME:-}" ]; then
    echo "ERROR: Export ${SECRET_NAME} in your shell before running this script."
    exit 1
  fi
  printf '%s' "${!SECRET_NAME}" | gh secret set "${SECRET_NAME}" --repo "${FULL_REPO}"
done

echo "==> 4/5 Enabling branch protection on main with DevSecOps required checks & CODEOWNERS"
gh api -X PUT "repos/${FULL_REPO}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Gate 1 · Codeowner, Attribution & Secret Hygiene",
      "Gate 2 · CodeQL SAST & Dependency Audit",
      "Gate 3 · Typecheck, Vite/PWA Build, Worker Bundle & SBOM"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
EOF

echo "==> 5/5 Syncing runtime secret & deploying to Cloudflare Workers"
printf '%s' "${GEMINI_API_KEY}" | npx wrangler secret put GEMINI_API_KEY
npm run cf:deploy

echo "Done! Verify deployment URL printed above by Wrangler and workflows at:"
echo "  https://github.com/${FULL_REPO}/actions"
