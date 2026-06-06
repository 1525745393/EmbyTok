#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_PATH = path.join(__dirname, '..', 'package.json');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

function readPackageJson() {
  const content = fs.readFileSync(PACKAGE_PATH, 'utf-8');
  return JSON.parse(content);
}

function writePackageJson(data) {
  fs.writeFileSync(PACKAGE_PATH, JSON.stringify(data, null, 2) + '\n');
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);

  switch (type) {
    case 'major':
      return formatVersion({ major: major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatVersion({ major, minor: minor + 1, patch: 0 });
    case 'patch':
      return formatVersion({ major, minor, patch: patch + 1 });
    default:
      throw new Error(`Invalid version type: ${type}. Use major, minor, or patch.`);
  }
}

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateChangelogEntry(version) {
  const date = getCurrentDate();
  return `## [${version}] - ${date}

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

`;
}

function updateChangelog(version) {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.log('CHANGELOG.md not found, skipping changelog update');
    return;
  }

  const currentContent = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  const newEntry = generateChangelogEntry(version);

  // 在文件开头（标题之后）插入新条目
  const title = '# Changelog\n';
  if (currentContent.startsWith(title)) {
    const restContent = currentContent.slice(title.length);
    const newContent = title + newEntry + restContent;
    fs.writeFileSync(CHANGELOG_PATH, newContent);
    console.log(`✅ CHANGELOG.md updated with v${version} entry`);
  } else {
    console.log('⚠️  Could not find title in CHANGELOG.md, skipping');
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Version Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/version-manager.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  current              - Show current version');
    console.log('  bump <type>          - Bump version (major|minor|patch)');
    console.log('  set <version>        - Set specific version');
    console.log('  changelog <version>  - Generate changelog entry');
    console.log('');
    const pkg = readPackageJson();
    console.log(`Current version: ${pkg.version}`);
    process.exit(0);
  }

  const command = args[0];
  const pkg = readPackageJson();

  switch (command) {
    case 'current':
      console.log(pkg.version);
      break;

    case 'bump':
      if (args.length < 2) {
        console.error('Error: Please specify version type (major|minor|patch)');
        process.exit(1);
      }
      const type = args[1];
      const newVersion = bumpVersion(pkg.version, type);
      pkg.version = newVersion;
      writePackageJson(pkg);
      console.log(`✅ Version bumped to ${newVersion}`);
      updateChangelog(newVersion);
      break;

    case 'set':
      if (args.length < 2) {
        console.error('Error: Please specify version');
        process.exit(1);
      }
      const specificVersion = args[1];
      if (!/^\d+\.\d+\.\d+$/.test(specificVersion)) {
        console.error('Error: Invalid version format. Use x.y.z');
        process.exit(1);
      }
      pkg.version = specificVersion;
      writePackageJson(pkg);
      console.log(`✅ Version set to ${specificVersion}`);
      break;

    case 'changelog':
      if (args.length < 2) {
        console.error('Error: Please specify version');
        process.exit(1);
      }
      updateChangelog(args[1]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main();
