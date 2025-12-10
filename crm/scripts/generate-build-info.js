#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get package.json version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

// Get current timestamp
const now = new Date();
const buildDate = now.toISOString();
const buildTimestamp = now.getTime();

// Try to get git commit hash
let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..') }).toString().trim();
} catch (error) {
  console.warn('Could not get git commit hash:', error.message);
}

// Try to get git branch
let branch = 'unknown';
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: path.join(__dirname, '..') }).toString().trim();
} catch (error) {
  console.warn('Could not get git branch:', error.message);
}

// Create build info object
const buildInfo = {
  version,
  buildDate,
  buildTimestamp,
  commitHash,
  branch,
  buildNumber: buildTimestamp, // Using timestamp as build number for simplicity
};

// Write to public directory so it can be accessed by the frontend
const outputPath = path.join(__dirname, '../public/build-info.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:', buildInfo);
console.log('Written to:', outputPath);
