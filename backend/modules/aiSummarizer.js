import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

let openai = null;

function getClient() {
  if (!openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Generate AI summaries for each file
 * Runs in batches of 5 to avoid rate limits
 */
export async function generateSummaries(deps, clonePath, classifications) {
  const client = getClient();
  const files = Object.keys(deps);
  const summaries = {};
  
  if (!client) {
    console.log('⚠️ OpenAI API key not set — using smart fallback summaries');
    for (const file of files) {
      summaries[file] = generateFallbackSummary(file, deps[file], classifications[file]);
    }
    return summaries;
  }
  
  console.log(`🤖 Generating AI summaries for ${files.length} files...`);
  
  // Process in batches of 5
  for (let i = 0; i < files.length; i += 5) {
    const batch = files.slice(i, i + 5);
    const batchPromises = batch.map(file => summarizeFile(client, file, deps[file], clonePath));
    
    const results = await Promise.allSettled(batchPromises);
    
    results.forEach((result, idx) => {
      const file = batch[idx];
      if (result.status === 'fulfilled') {
        summaries[file] = result.value;
      } else {
        summaries[file] = generateFallbackSummary(file, deps[file], classifications[file]);
      }
    });
    
    console.log(`  📝 Batch ${Math.floor(i / 5) + 1}/${Math.ceil(files.length / 5)} complete`);
    
    // Small delay between batches
    if (i + 5 < files.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return summaries;
}

/**
 * Summarize a single file using OpenAI
 */
async function summarizeFile(client, filename, deps, clonePath) {
  let snippet = '';
  try {
    const filePath = path.join(clonePath, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').slice(0, 20);
      snippet = lines.join('\n');
    }
  } catch {
    snippet = '(unable to read)';
  }
  
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `Explain what this file does in 2-3 simple sentences for a developer onboarding.
File: ${filename}
Imports: ${deps.join(', ') || 'none'}
Snippet:
${snippet}`
    }],
    max_tokens: 150,
    temperature: 0.3
  });
  
  return response.choices[0].message.content.trim();
}

/**
 * Smart fallback summary when OpenAI is not available
 */
function generateFallbackSummary(filename, deps, type) {
  const basename = filename.split('/').pop().replace(/\.\w+$/, '');
  const depCount = deps.length;
  
  const typeDescriptions = {
    entry: `Entry point module that bootstraps the application.`,
    core: `Core logic module that implements key business functionality.`,
    util: `Utility module providing shared helper functions.`,
    config: `Configuration module defining application settings.`
  };
  
  let summary = typeDescriptions[type] || typeDescriptions.core;
  
  if (depCount > 0) {
    summary += ` Depends on ${depCount} other module${depCount > 1 ? 's' : ''}: ${deps.slice(0, 3).join(', ')}${depCount > 3 ? '...' : ''}.`;
  } else {
    summary += ` This is a leaf module with no internal dependencies.`;
  }
  
  // Add context based on filename
  if (basename.includes('route') || basename.includes('router')) {
    summary = `Defines URL routing and request handling logic. ${summary}`;
  } else if (basename.includes('middleware')) {
    summary = `Middleware that processes requests in the pipeline. ${summary}`;
  } else if (basename.includes('model')) {
    summary = `Data model defining structure and validation. ${summary}`;
  } else if (basename.includes('controller')) {
    summary = `Controller handling request/response logic. ${summary}`;
  } else if (basename.includes('service')) {
    summary = `Service layer encapsulating business logic. ${summary}`;
  }
  
  return summary;
}
