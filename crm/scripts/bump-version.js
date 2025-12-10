#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Parse current version
const currentVersion = packageJson.version;
const versionParts = currentVersion.split('.').map(Number);

// Increment patch version (third part)
if (versionParts.length === 3) {
  versionParts[2] += 1;
} else {
  // If version format is unexpected, add a patch version
  versionParts.push(1);
}

const newVersion = versionParts.join('.');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

// Also update the deploy script to include version bump if needed
// We could optionally commit the version change
try {
  execSync(`git add ${packageJsonPath}`, { cwd: path.join(__dirname, '..') });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('Version change committed to git');
} catch (error) {
  console.warn('Could not commit version change to git:', error.message);
  console.log('Version bumped but not committed');
}
