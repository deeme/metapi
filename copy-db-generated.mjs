#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const sourceDir = 'src/server/db/generated';
const targetDir = 'dist/server/db/generated';

if (!existsSync(sourceDir)) {
  console.error(`Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`Copied ${sourceDir} to ${targetDir}`);
