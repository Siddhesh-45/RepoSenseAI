import express from 'express';
import multer from 'multer';
import extract from 'extract-zip';
import path from 'path';
import fs from 'fs';
import { fetchRepo, fetchCommitHistory } from '../modules/repoFetcher.js';
import { analyzeDependencies } from '../modules/dependencyAnalyzer.js';
import { classifyAllFiles } from '../modules/fileClassifier.js';
import { scoreImpact } from '../modules/impactScorer.js';
import { generateSummaries } from '../modules/aiSummarizer.js';
import { summarizeRepo } from '../modules/repoSummarizer.js';
import { buildOnboardingPath } from '../modules/onboardingPath.js';
import { searchNodes } from '../modules/queryEngine.js';
import { buildGraph } from '../modules/graphBuilder.js';
import { answerQuestion } from '../modules/qaEngine.js';
import { cleanup } from '../utils/cleanup.js';
import { getCachedAnalysis, setCachedAnalysis } from '../utils/cache.js';

const router = express.Router();

// Multer setup for zip uploads
const upload = multer({ dest: path.join(process.cwd(), 'temp') });



/**
 * POST /api/analyze
 * Body: { repoUrl: "expressjs/express" }
 */
router.post('/analyze', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

  const cached = getCachedAnalysis(repoUrl);
  if (cached) {
    console.log(`⚡ Returning cached analysis for ${repoUrl}`);
    return res.json(cached);
  }
  
  try {
    console.log('\n🚀 Starting analysis pipeline (GitHub URL)...');
    const repoInfo = await fetchRepo(repoUrl);

    // Fire off commit history fetch in parallel (non-blocking)
    console.log('📜 Fetching commit history from GitHub API...');
    const commitsPromise = fetchCommitHistory(repoInfo.repoOwner, repoInfo.repoName);

    // Step 2: Analyze dependencies
    const deps = await analyzeDependencies(repoInfo.clonePath);

    if (Object.keys(deps).length === 0) {
      cleanup(repoInfo.clonePath);
      return res.status(400).json({ error: 'No JavaScript/TypeScript files found in directory' });
    }

    // Steps 3 & 4: Classify + Score (can run together)
    const classifications = classifyAllFiles(deps);
    const impact = scoreImpact(deps);

    // Step 5: AI summaries
    console.log('📝 Generating AI summaries...');
    const aiSummaries = await generateSummaries(deps, repoInfo.clonePath, classifications, impact);

    // Step 5.5: Repo overview
    console.log('🧠 Generating repository overview...');
    const repoOverview = await summarizeRepo(repoInfo.clonePath, aiSummaries, classifications);

    // Step 6: Onboarding path
    console.log('🛤️  Building onboarding path...');
    const onboardingPath = buildOnboardingPath(deps, classifications, impact);

    // Step 7: Assemble graph
    console.log('🏗️  Assembling graph payload...');
    const graphData = buildGraph(deps, classifications, impact, aiSummaries, onboardingPath);

    // Attach extras — wait for commits now that everything else is done
    graphData.repoSummary = repoOverview;
    graphData.repoInfo = { name: repoInfo.fullName, url: repoUrl, analyzedAt: new Date().toISOString() };
    graphData.commits = await commitsPromise;
    console.log(`📜 Loaded ${graphData.commits.length} commits`);

    setCachedAnalysis(repoUrl, graphData);
    console.log('✅ Analysis complete!');

    cleanup(repoInfo.clonePath);
    return res.json(graphData);

  } catch (error) {
    console.error('❌ Git fetch failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch repository', message: error.message });
  }
});


/**
 * POST /api/upload
 * FormData: { repoZip: [File] }
 */
router.post('/upload', upload.single('repoZip'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No ZIP file uploaded' });

  const zipPath = req.file.path;
  const extractPath = `${zipPath}_extracted`;
  const repoName = req.file.originalname.replace('.zip', '') || 'Uploaded Local Repo';

  try {
    console.log('\n🚀 Starting analysis pipeline (ZIP Upload)...');
    
    await extract(zipPath, { dir: extractPath });
    fs.unlinkSync(zipPath);

    let targetPath = extractPath;
    const contents = fs.readdirSync(extractPath);
    if (contents.length === 1) {
      const firstItem = path.join(extractPath, contents[0]);
      if (fs.statSync(firstItem).isDirectory()) targetPath = firstItem;
    }

    const deps = await analyzeDependencies(targetPath);

    if (Object.keys(deps).length === 0) {
      try { cleanup(extractPath); } catch(e) {}
      return res.status(400).json({ error: 'No JavaScript/TypeScript files found in ZIP' });
    }

    const classifications = classifyAllFiles(deps);
    const impact = scoreImpact(deps);

    console.log('📝 Generating AI summaries...');
    const aiSummaries = await generateSummaries(deps, targetPath, classifications, impact);

    console.log('🧠 Generating repository overview...');
    const repoOverview = await summarizeRepo(targetPath, aiSummaries, classifications);

    console.log('🛤️  Building onboarding path...');
    const onboardingPath = buildOnboardingPath(deps, classifications, impact);

    console.log('🏗️  Assembling graph payload...');
    const graphData = buildGraph(deps, classifications, impact, aiSummaries, onboardingPath);

    graphData.repoSummary = repoOverview;
    graphData.repoInfo = { name: repoName, url: 'local/' + repoName, analyzedAt: new Date().toISOString() };
    graphData.commits = []; // No git history for ZIP uploads

    console.log('✅ ZIP analysis complete!');

    try { cleanup(extractPath); } catch(e) {}

    return res.json(graphData);

  } catch (err) {
    console.error('❌ ZIP extraction failed:', err.message);
    try { cleanup(zipPath); cleanup(extractPath); } catch(e) {}
    return res.status(500).json({ error: 'Failed to process ZIP file', message: err.message });
  }
});


/**
 * GET /api/repos/:username
 * Fetches all public repos for a given GitHub username
 */
router.get('/repos/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }
    const repos = await response.json();
    return res.json(repos.map(r => ({
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      description: r.description,
      language: r.language
    })));
  } catch (error) {
    console.error(`❌ Failed to fetch repos for ${username}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch repositories', message: error.message });
  }
});

/**
 * POST /api/search
 */
router.post('/search', (req, res) => {
  const { query, nodes } = req.body;
  if (!query || !nodes) return res.status(400).json({ error: 'query and nodes are required' });
  const results = searchNodes(query, nodes);
  return res.json({ results });
});

/**
 * POST /api/qa
 */
router.post('/qa', async (req, res) => {
  const { question, nodes } = req.body;
  if (!question || !nodes) return res.status(400).json({ error: 'question and nodes are required' });

  try {
    const result = await answerQuestion(question, nodes);
    return res.json(result);
  } catch (err) {
    console.error('❌ QA route error:', err.message);
    return res.status(500).json({ error: 'QA failed', message: err.message });
  }
});

export default router;
