# Contributing to SwaraKala Studio

Thank you for your interest in **SwaraKala Studio**. This codebase is maintained by its permanent codeowner **Aditya Rachuri (`@adityarachuri`)**.

---

## Governance & Commit Policy

1. **Codeowner Approval**: All pull requests targeting `main` require review and approval from `@adityarachuri` (enforced via `.github/CODEOWNERS`).
2. **Author Attribution**: Commits must carry genuine human author metadata and clean descriptive commit messages. Do not include external automation/assistant attribution trailers or tool references anywhere in source code, comments, documentation, or commits.
3. **Musicological Integrity**: Any Raga, Melakarta, Shruti, Tala, or historical treatise additions must align with documented primary classical scholarship and never fabricate historical attributions.

---

## Local Verification Checklist

Before pushing or opening a pull request:

```bash
npm run lint
npm run build
npm run verify:compliance
```

Enable the repository pre-commit hook locally:

```bash
git config core.hooksPath .githooks
```
