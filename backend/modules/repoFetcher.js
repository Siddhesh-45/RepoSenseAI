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

/**
 * Fetch commit history for a repo via the GitHub REST API.
 * Uses GITHUB_TOKEN if set for higher rate limits (5000/hr vs 60/hr).
 * Returns an array of rich commit objects.
 */
export async function fetchCommitHistory(repoOwner, repoName) {
  const token = process.env.GITHUB_TOKEN;
  const tokenAvailable = token && token !== 'your_github_token_here';

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'RepoSenseAI',
  };
  if (tokenAvailable) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Using GITHUB_TOKEN for authenticated commit fetch');
  } else {
    console.warn('⚠️  No GITHUB_TOKEN set — using unauthenticated API (60 req/hr limit)');
  }

  try {
    // Fetch the list of commits (up to 60)
    const listUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=60`;
    const listRes = await fetch(listUrl, { headers });

    if (!listRes.ok) {
      const msg = await listRes.text();
      console.warn(`⚠️  GitHub commits list API returned ${listRes.status}: ${msg}`);
      return [];
    }

    const commits = await listRes.json();
    if (!Array.isArray(commits)) return [];

    // For each commit, fetch individual detail (stats) — limit to 20 to avoid rate limit
    const detailed = await Promise.all(
      commits.slice(0, 20).map(async (c) => {
        let stats = null;
        try {
          const detailRes = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${c.sha}`,
            { headers }
          );
          if (detailRes.ok) {
            const detail = await detailRes.json();
            stats = detail.stats || null; // { additions, deletions, total }
          }
        } catch (_) { /* stats optional */ }

        return {
          hash:       c.sha.substring(0, 7),
          fullSha:    c.sha,
          message:    c.commit.message.split('\n')[0],
          author:     c.commit.author?.name || 'Unknown',
          username:   c.author?.login || null,
          avatarUrl:  c.author?.avatar_url || null,
          date:       c.commit.author?.date || new Date().toISOString(),
          url:        c.html_url,
          additions:  stats?.additions ?? null,
          deletions:  stats?.deletions ?? null,
          filesChanged: stats?.total ?? null,
        };
      })
    );

    // Remaining commits (21–60) without stats
    const rest = commits.slice(20).map(c => ({
      hash:       c.sha.substring(0, 7),
      fullSha:    c.sha,
      message:    c.commit.message.split('\n')[0],
      author:     c.commit.author?.name || 'Unknown',
      username:   c.author?.login || null,
      avatarUrl:  c.author?.avatar_url || null,
      date:       c.commit.author?.date || new Date().toISOString(),
      url:        c.html_url,
      additions:  null,
      deletions:  null,
      filesChanged: null,
    }));

    return [...detailed, ...rest];

  } catch (err) {
    console.warn(`⚠️  Could not fetch commit history: ${err.message}`);
    return [];
  }
}
