#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

const ROOT = process.cwd();
const withDist = process.argv.includes('--with-dist');
const errors = [];

function checkExists(relPath, description) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    errors.push(`Missing required file (${description}): ${relPath}`);
  }
}

function walkFiles(dir, result = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'dev-dist' ||
      entry.name === 'coverage' ||
      entry.name === '.git'
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, result);
    } else if (
      /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|html|toml|svg|sh)$/.test(entry.name) ||
      entry.name === 'CODEOWNERS' ||
      entry.name === 'LICENSE'
    ) {
      result.push(full);
    }
  }
  return result;
}

// 1. GitHub Community Health & Governance Compliance
const requiredFiles = [
  ['README.md', 'Project documentation'],
  ['LICENSE', 'MIT Open-Source License'],
  ['SECURITY.md', 'Security disclosure policy'],
  ['CONTRIBUTING.md', 'Contribution guide'],
  ['CODE_OF_CONDUCT.md', 'Contributor Covenant Code of Conduct'],
  ['CHANGELOG.md', 'Release changelog'],
  ['.github/CODEOWNERS', 'Permanent codeowner definition'],
  ['.github/dependabot.yml', 'Automated dependency & security updates'],
  ['.github/PULL_REQUEST_TEMPLATE.md', 'Pull Request checklist template'],
  ['.github/ISSUE_TEMPLATE/config.yml', 'Issue template configuration'],
  ['.github/ISSUE_TEMPLATE/bug_report.yml', 'Bug report template'],
  ['.github/ISSUE_TEMPLATE/feature_request.yml', 'Feature request template'],
  ['.github/workflows/ci-devsecops.yml', 'DevSecOps CI pipeline'],
  ['.github/workflows/release-cloudflare.yml', 'Cloudflare Workers release pipeline'],
  ['wrangler.toml', 'Cloudflare Workers manifest'],
  ['worker/index.ts', 'Cloudflare Workers runtime entrypoint'],
  ['public/icon.svg', 'Studio SVG brand icon'],
  ['public/pwa-192x192.png', 'PWA 192x192 PNG icon'],
  ['public/pwa-512x512.png', 'PWA 512x512 PNG icon'],
  ['public/pwa-maskable-512x512.png', 'PWA 512x512 maskable PNG icon'],
  ['public/apple-touch-icon.png', 'iOS Apple Touch 180x180 PNG icon'],
];

for (const [rel, desc] of requiredFiles) {
  checkExists(rel, desc);
}

// 2. Permanent Codeowner & Metadata Integrity Checks
try {
  const codeowners = fs.readFileSync(path.join(ROOT, '.github/CODEOWNERS'), 'utf8');
  if (!codeowners.includes('@adityarachuri')) {
    errors.push('.github/CODEOWNERS must designate @adityarachuri.');
  }
} catch {}

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (!String(pkg.author || '').includes('adityarachuri')) {
    errors.push('package.json author must include @adityarachuri.');
  }
  if (pkg.license !== 'MIT') {
    errors.push('package.json license must be MIT.');
  }
} catch (err) {
  errors.push(`Invalid package.json: ${err.message}`);
}

// 3. Hygiene Scan: Zero External Assistant Tool References & Zero Committed Secrets
const forbiddenPatterns = [
  new RegExp('clau' + 'de', 'i'),
  new RegExp('anthro' + 'pic', 'i'),
  new RegExp('open' + 'ai', 'i'),
  new RegExp('chat' + 'gpt', 'i'),
  new RegExp('copi' + 'lot', 'i'),
  new RegExp('\\.cur' + 'sor|cur' + 'sor\\s*(ide|ai|agent|editor)', 'i'),
  new RegExp('wind' + 'surf', 'i'),
  new RegExp('aistudio' + '-build', 'i'),
  new RegExp('ai\\s+' + 'studio', 'i'),
  new RegExp('generated\\s+' + 'by', 'i'),
  new RegExp('co-authored' + '-by', 'i'),
];

const secretPatterns = [/AIzaSy[0-9A-Za-z_-]{30,}/, /ghp_[0-9A-Za-z]{30,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];

for (const fullPath of walkFiles(ROOT)) {
  const rel = path.relative(ROOT, fullPath);
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const pat of forbiddenPatterns) {
    if (pat.test(content)) {
      errors.push(`Forbidden attribution/tool reference (${pat}) found in ${rel}`);
    }
  }
  for (const pat of secretPatterns) {
    if (pat.test(content)) {
      errors.push(`Potential credential/secret pattern found in ${rel}`);
    }
  }
}

// Verify no tracked .env files and clean git history if inside a git worktree
try {
  const tracked = execSync('git ls-files', {encoding: 'utf8'}).split('\n').filter(Boolean);
  for (const file of tracked) {
    if (/^\.env(\..+)?$/.test(file) && file !== '.env.example') {
      errors.push(`Environment file must never be committed: ${file}`);
    }
  }
  const hasHead = (() => {
    try {
      execSync('git rev-parse --verify HEAD', {stdio: 'ignore'});
      return true;
    } catch {
      return false;
    }
  })();
  if (hasHead) {
    const log = execSync('git log -n 25 --format="%an <%ae> %s %b"', {encoding: 'utf8'});
    for (const pat of forbiddenPatterns) {
      if (pat.test(log)) {
        errors.push(`Forbidden tool/attribution reference (${pat}) found in git commit history`);
      }
    }
  }
} catch {
  // Not a git repo yet
}

// 4. Optional Built Bundle & PWA Verification
if (withDist) {
  for (const artifact of ['dist/index.html', 'dist/manifest.webmanifest', 'dist/sw.js']) {
    checkExists(artifact, 'Built PWA output');
  }
  const assetsDir = path.join(ROOT, 'dist/assets');
  if (!fs.existsSync(assetsDir)) {
    errors.push('Missing dist/assets directory');
  } else {
    for (const file of fs.readdirSync(assetsDir)) {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
        if (content.includes('GEMINI_API_KEY') || /AIzaSy[0-9A-Za-z_-]{30,}/.test(content)) {
          errors.push(`Client bundle leak detected in dist/assets/${file}`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Compliance audit failed:\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}

console.log(
  `SwaraKala Studio Compliance Audit PASSED (${withDist ? 'Source + Governance + Built Dist/PWA' : 'Source + Governance'}). Permanent Codeowner: @adityarachuri`
);
