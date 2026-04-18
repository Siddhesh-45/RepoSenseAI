/**
 * Purpose:
 * Generates concise, context-aware AI descriptions for every file in the
 * dependency graph using OpenAI's GPT-4.1-mini model.
 *
 * Role in System:
 * Acts as the intelligence layer of the analysis pipeline — the only module
 * that makes external API calls. Its output (the summaries map) is the primary
 * human-readable content displayed in node tooltips and the FileDetailPanel
 * sidebar on the frontend.
 *
 * Key Responsibility:
 * Prioritizes the top 30 files by impact score, reads their source code,
 * truncates content to 3000 characters, and dispatches batches of 5 concurrent
 * OpenAI requests. Falls back to a deterministic rule-based summary generator
 * for all files outside the top 30, files exceeding 1000 lines, or when the
 * API key is absent/invalid.
 *
 * Important Insight:
 * Used by the analyze route as Step 5 of the 8-step pipeline — the most
 * time-consuming step due to external API latency. This file depends on 3
 * modules (openai, fs, path) and is used by 1 file (routes/analyze.js).
 * It likely handles rate-limit batching, in-memory caching, large-file
 * exclusion, and graceful API error recovery.
 */
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

let openai = null;
const summaryCache = new Map(); // Simple in-memory cache

const MAX_SNIPPET_CHARS = 3000; // Character limit for code sent to OpenAI

function getClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey.length < 20) {
      console.error('❌ OPENAI_API_KEY is missing or invalid.');
      console.error('   Current value:', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '(empty)');
      return null;
    }

    openai = new OpenAI({ apiKey });
    console.log('✅ OpenAI client initialized');
  }
  return openai;
}

/**
 * Generate AI summaries for each file
 * Runs in batches of 5 to avoid rate limits
 */
export async function generateSummaries(deps, clonePath, classifications, scores = {}) {
  const client = getClient();
  const allFiles = Object.keys(deps);
  const summaries = {};

  if (!client) {
    console.log('⚠️ OpenAI API key not set — using smart fallback summaries');
    for (const file of allFiles) {
      summaries[file] = generateFallbackSummary(file, deps[file], classifications[file]);
    }
    return summaries;
  }

  // Sort files by impact to only take the top 30 most important files
  const sortedFiles = [...allFiles].sort((a, b) => {
    const scoreA = scores[a]?.impact || 0;
    const scoreB = scores[b]?.impact || 0;
    return scoreB - scoreA;
  });

  const filesToSummarize = sortedFiles.slice(0, 30);

  // Immediately flag files outside the top 30
  for (const file of allFiles) {
    if (!filesToSummarize.includes(file)) {
      summaries[file] = generateFallbackSummary(file, deps[file], classifications[file]);
    }
  }

  console.log(`🤖 Generating AI summaries for top ${filesToSummarize.length} files...`);

  // Process in batches of 5
  for (let i = 0; i < filesToSummarize.length; i += 5) {
    const batch = filesToSummarize.slice(i, i + 5);
    const batchPromises = batch.map(file => summarizeFile(client, file, deps[file], clonePath, classifications[file]));

    const results = await Promise.allSettled(batchPromises);

    results.forEach((result, idx) => {
      const file = batch[idx];
      if (result.status === 'fulfilled' && result.value) {
        summaries[file] = result.value;
      } else {
        const errorMsg = result.status === 'rejected'
          ? result.reason?.message || String(result.reason)
          : 'Empty response';
        console.error(`⚠️ Summary failed for ${file}: ${errorMsg}`);
        // Use intelligent fallback instead of "Summary not available"
        summaries[file] = generateFallbackSummary(file, deps[file], classifications[file]);
      }
    });

    console.log(`  📝 Batch ${Math.floor(i / 5) + 1}/${Math.ceil(filesToSummarize.length / 5)} complete`);

    // Small delay between batches to respect rate limits
    if (i + 5 < filesToSummarize.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return summaries;
}

/**
 * Summarize a single file using OpenAI
 */
async function summarizeFile(client, filename, deps, clonePath, fileType) {
  let snippet = '';

  try {
    const filePath = path.join(clonePath, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Skip truly huge files
      const lineCount = content.split('\n').length;
      if (lineCount > 1000) {
        console.log(`⏭️  Skipping large file ${filename} (${lineCount} lines) — using fallback`);
        return generateFallbackSummary(filename, deps, fileType);
      }

      // Truncate to MAX_SNIPPET_CHARS for the API call
      snippet = content.length > MAX_SNIPPET_CHARS
        ? content.slice(0, MAX_SNIPPET_CHARS) + '\n// ... (truncated)'
        : content;
    }
  } catch (err) {
    console.warn(`⚠️ Could not read file ${filename}: ${err.message}`);
    snippet = '(unable to read file contents)';
  }

  if (!snippet || snippet.trim().length === 0) {
    return 'Empty file — no code to analyze.';
  }

  // Check memory cache
  const cacheKey = `${filename}-${snippet.length}`;
  if (summaryCache.has(cacheKey)) {
    return summaryCache.get(cacheKey);
  }

  console.log(`  🔍 Summarizing: ${filename}`);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software engineer reviewing a codebase. Explain code clearly and concisely. Highlight responsibilities and the file\'s role in the system architecture.'
        },
        {
          role: 'user',
          content: `Explain this code file in simple terms.

File Name: ${filename}
Dependencies: ${deps?.length ? deps.join(', ') : 'None (standalone)'}

Code:
${snippet}

Give:
- What this file does (1 sentence)
- Its role in the project architecture (1 sentence)
- Key responsibility (1 sentence)

Keep it under 3 lines total. Be specific, not generic.`
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const result = response.choices?.[0]?.message?.content?.trim();

    if (!result) {
      console.warn(`⚠️ Empty AI response for ${filename}`);
      return generateFallbackSummary(filename, deps, fileType);
    }

    // Cache the result
    summaryCache.set(cacheKey, result);
    return result;

  } catch (apiError) {
    // Detailed error logging to help diagnose issues
    console.error(`❌ OpenAI API error for ${filename}:`);
    console.error(`   Status: ${apiError.status || 'N/A'}`);
    console.error(`   Message: ${apiError.message}`);
    console.error(`   Type: ${apiError.type || apiError.code || 'unknown'}`);

    // If the key is invalid/revoked, stop trying for remaining files
    if (apiError.status === 401 || apiError.code === 'invalid_api_key') {
      console.error('🚨 API KEY IS INVALID OR REVOKED. Generate a new key at https://platform.openai.com/api-keys');
      throw new Error('OpenAI API key is invalid. Please generate a new key.');
    }

    // If model not found, log it clearly
    if (apiError.status === 404 || apiError.message?.includes('model')) {
      console.error('🚨 Model "gpt-4.1-mini" not available. Check your OpenAI plan.');
      throw new Error('Model not available. Check OpenAI plan access.');
    }

    return generateFallbackSummary(filename, deps, fileType);
  }
}

/**
 * Smart fallback summary when OpenAI is not available
 */
function generateFallbackSummary(filename, deps, type) {
  const basename = filename.split('/').pop().replace(/\.\w+$/, '');
  const depCount = Array.isArray(deps) ? deps.length : 0;

  const typeDescriptions = {
    entry: `System Entrypoint:`,
    core: `Core Architecture:`,
    util: `Utility Collection:`,
    config: `Configuration Setup:`
  };

  let summary = `${typeDescriptions[type] || 'Module:'} This file specifically manages the '${basename}' functionality within the system.`;

  if (depCount > 0) {
    const depNames = deps.slice(0, 2).map(d => d.split('/').pop());
    summary += ` It orchestrates logic by interacting with ${depCount} other component${depCount > 1 ? 's' : ''} (e.g., ${depNames.join(', ')}).`;
  } else {
    summary += ` This is a standalone leaf module that executes independently.`;
  }

  // Add context based on filename
  if (basename.toLowerCase().includes('route')) {
    summary += ` It acts as a routing controller for endpoints.`;
  } else if (basename.toLowerCase().includes('middleware')) {
    summary += ` It intercepts and processes traffic in the request pipeline.`;
  } else if (basename.toLowerCase().includes('model')) {
    summary += ` It defines structural data constraints and database interactions.`;
  } else if (basename.toLowerCase().includes('analyzer')) {
    summary += ` It analyzes and parses data logic dynamically.`;
  } else if (basename.toLowerCase().includes('helper')) {
    summary += ` It provides shared helper abstractions.`;
  } else if (basename.toLowerCase().includes('app') || basename.toLowerCase().includes('main')) {
    summary += ` It is an essential root-level orchestrator.`;
  }

  return summary;
}
