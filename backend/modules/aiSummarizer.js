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
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

let ai = null;
const summaryCache = new Map(); // Simple in-memory cache

const MAX_SNIPPET_CHARS = 3000; // Character limit for code sent to Gemini

function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.length < 20) {
      console.error('❌ GEMINI_API_KEY is missing or invalid.');
      return null;
    }

    ai = new GoogleGenAI({ apiKey });
    console.log('✅ Gemini client initialized');
  }
  return ai;
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

  // Sort files by impact to only take the top 15 most important files
  const sortedFiles = [...allFiles].sort((a, b) => {
    const scoreA = scores[a]?.impact || 0;
    const scoreB = scores[b]?.impact || 0;
    return scoreB - scoreA;
  });

  const filesToSummarize = sortedFiles.slice(0, 15);

  // Immediately flag files outside the top 15
  for (const file of allFiles) {
    if (!filesToSummarize.includes(file)) {
      summaries[file] = generateFallbackSummary(file, deps[file], classifications[file]);
    }
  }

  console.log(`🤖 Generating AI summaries for top ${filesToSummarize.length} files in ONE batch...`);

  const fileDataForPrompt = [];
  
  for (const filename of filesToSummarize) {
    let snippet = '';
    const filePath = path.join(clonePath, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;
      if (lineCount > 1000) {
        summaries[filename] = generateFallbackSummary(filename, deps[filename], classifications[filename]);
        continue;
      }
      snippet = content.length > MAX_SNIPPET_CHARS
        ? content.slice(0, MAX_SNIPPET_CHARS) + '\n// ... (truncated)'
        : content;
        
      if (snippet.trim()) {
         fileDataForPrompt.push({ filename, deps: deps[filename], snippet });
      } else {
         summaries[filename] = generateFallbackSummary(filename, deps[filename], classifications[filename]);
      }
    } else {
      summaries[filename] = 'Empty file — no code to analyze.';
    }
  }

  if (fileDataForPrompt.length > 0) {
    const promptText = `Summarize the following code files. For each file, provide a 3-line summary containing: What it does (1 sentence), Its role in the architecture (1 sentence), Key responsibility (1 sentence).

Format your response EXACTLY as a raw JSON object string where keys are filenames and values are the summaries. DO NOT include markdown formatting like \`\`\`json.
Example:
{
  "file1.js": "Summary 1...",
  "file2.js": "Summary 2..."
}

Files to summarize:
${fileDataForPrompt.map(f => `--- File: ${f.filename} ---\nDependencies: ${f.deps?.length ? f.deps.join(', ') : 'None'}\nCode:\n${f.snippet}`).join('\n\n')}
`;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction: 'You are a senior software engineer reviewing a codebase. Output raw JSON object mapping filenames to their summaries.',
          maxOutputTokens: 2000,
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });
      
      const resultObj = JSON.parse(response.text);
      for (const [filename, summary] of Object.entries(resultObj)) {
         if (filesToSummarize.includes(filename)) {
            summaries[filename] = summary;
         }
      }
      
      // Fallback for any that were missed by the AI
      for (const f of fileDataForPrompt) {
         if (!summaries[f.filename]) {
             summaries[f.filename] = generateFallbackSummary(f.filename, f.deps, classifications[f.filename]);
         }
      }
    } catch (err) {
      console.error(`❌ Gemini Batch API error:`, err.message);
      for (const f of fileDataForPrompt) {
        summaries[f.filename] = generateFallbackSummary(f.filename, f.deps, classifications[f.filename]);
      }
    }
  }

  return summaries;
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
