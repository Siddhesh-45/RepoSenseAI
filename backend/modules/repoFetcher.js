import simpleGit from 'simple-git';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '..', 'temp');

/**
 * Clone a GitHub repository into ./temp/{repoName}
 * Supports both full URLs and shorthand user/repo
 */
export async function fetchRepo(repoUrl) {
  // Normalize URL
  let normalizedUrl = repoUrl.trim();
  
  // Support shorthand: user/repo → https://github.com/user/repo
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://github.com/${normalizedUrl}`;
  }
  
  // Remove trailing .git if present
  normalizedUrl = normalizedUrl.replace(/\.git$/, '');
  
  // Extract repo name from URL
  const urlParts = normalizedUrl.replace(/\/$/, '').split('/');
  const repoName = urlParts[urlParts.length - 1];
  const repoOwner = urlParts[urlParts.length - 2];
  const fullName = `${repoOwner}/${repoName}`;
  
  const uniqueId = Date.now();
  const clonePath = path.join(TEMP_DIR, `${repoOwner}_${repoName}_${uniqueId}`);
  
  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  console.log(`📦 Cloning ${fullName} into ${clonePath}...`);
  
  const git = simpleGit();
  await git.clone(normalizedUrl + '.git', clonePath, ['--depth', '1']);
  
  console.log(`✅ Repository cloned successfully`);
  
  return {
    clonePath,
    repoName,
    repoOwner,
    fullName
  };
}
