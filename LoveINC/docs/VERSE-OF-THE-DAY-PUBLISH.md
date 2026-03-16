# Verse of the Day: GitHub Package Publish & Update Instructions

This document describes how to build, publish, and update the `@upstart-productions/verse-of-the-day` npm package on GitHub Packages.

## Prerequisites

- GitHub account with write access to the repository
- [GitHub Personal Access Token](https://github.com/settings/tokens) with `write:packages` and `read:packages` scope
- npm installed

## Step 1: Build the Package

From the LoveINC project root:

```bash
cd LoveINC
npm run build:verse-of-the-day
```

This runs ng-packagr and produces `packages/verse-of-the-day/dist/`.

## Step 2: Authenticate with GitHub Packages

One-time setup (or when your token expires):

```bash
npm login --registry=https://npm.pkg.github.com
```

When prompted:

- **Username:** your GitHub username
- **Password:** your Personal Access Token (not your GitHub password)
- **Email:** your email

## Step 3: Publish to GitHub Packages

```bash
cd LoveINC/packages/verse-of-the-day/dist
npm publish
```

The `dist` folder is the publish root (the fix script updates its `package.json`). Publishing uses the scope `@upstart-productions` from the package name.

## Step 4: Update Consumers to Use the Published Package

### Option A: Switch from `file:` to Published Version

In the LoveINC app's `package.json`, change:

```json
"@upstart-productions/verse-of-the-day": "file:packages/verse-of-the-day"
```

to:

```json
"@upstart-productions/verse-of-the-day": "^2.0.0"
```

(or whatever version you published)

### Option B: Add `.npmrc` for GitHub Packages

Create or update `.npmrc` in the consumer project root:

```
@upstart-productions:registry=https://npm.pkg.github.com
```

This tells npm to resolve `@upstart-productions/*` packages from GitHub Packages.

### Option C: Install in a New Project

```bash
# Add .npmrc first (see Option B)
npm install @upstart-productions/verse-of-the-day
```

## Step 5: Version Bumping

Before each publish, bump the version in `packages/verse-of-the-day/package.json`:

- **Patch** (1.0.0 → 1.0.1): Bug fixes, no API changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

Use [semver](https://semver.org/).

## Troubleshooting

### 401 Unauthorized

- Ensure your token has `write:packages` scope
- Re-run `npm login --registry=https://npm.pkg.github.com`

### ENEEDAUTH / "need auth for registry.npmjs.org"

npm is trying to publish to the default npm registry instead of GitHub Packages. The package has `publishConfig.registry` set to `https://npm.pkg.github.com`; rebuild with `npm run build:verse-of-the-day` and try again.

### 404 Not Found

- Verify the package name is `@upstart-productions/verse-of-the-day`
- Ensure `.npmrc` in the consumer has `@upstart-productions:registry=https://npm.pkg.github.com`

### Build Fails

- Run `npm install` from the LoveINC root first
- Ensure Angular, Ionic, and ng-packagr versions are compatible
