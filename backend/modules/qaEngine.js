/**
 * Purpose:
 * Answers natural-language questions about an analyzed codebase using a
 * Retrieval-Augmented Generation (RAG) approach.
 *
 * Role in System:
 * Acts as the Q&A intelligence layer. Given a user question and the full
 * analyzed graph (nodes with AI summaries, deps, types), it:
 *   1. Retrieves the most relevant code chunks via keyword scoring
 *   2. Builds a grounded prompt using those chunks
 *   3. Calls OpenAI to produce a precise, file-referenced answer
 *
 * Key Responsibility:
 * Bridges the analyzed graph data with conversational AI — users can ask
 * "where is authentication?", "what does graphBuilder do?", "which files
 * depend on impactScorer?" and get grounded, citation-backed answers.
 *
 * Important Insight:
 * Used exclusively by POST /api/qa. This file depends on 1 module (openai)
 * and is used by 1 file (routes/analyze.js). It likely handles context
 * retrieval ranking, prompt construction, and answer formatting.
 */
import { GoogleGenAI } from '@google/genai';

let ai = null;

function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 20) return null;
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Score a node's relevance to the user question using keyword overlap.
 * Weights: filename (3x) · type (2x) · AI summary (1x) · deps (1x)
 */
function scoreRelevance(node, terms) {
  let score = 0;
  const id = node.id.toLowerCase();
  const basename = id.split('/').pop();
  const ai = (node.ai || '').toLowerCase();
  const type = (node.type || '').toLowerCase();
  const deps = (node.deps || []).join(' ').toLowerCase();

  for (const term of terms) {
    // Filename matches
    if (basename.includes(term)) score += 3;
    else if (id.includes(term)) score += 2;

    // Type matches
    if (type.includes(term)) score += 2;

    // AI summary matches
    const aiOccurrences = (ai.match(new RegExp(term, 'g')) || []).length;
    score += aiOccurrences * 1;

    // Dependency name matches
    if (deps.includes(term)) score += 1;
  }

  // Bonus for high-impact nodes (they're usually more important)
  if (node.highImpact) score += 0.5;
  if (node.type === 'entry') score += 0.5;

  return score;
}

/**
 * Retrieve the top-K most relevant nodes for the given question.
 * Returns formatted code context chunks ready for the LLM prompt.
 */
function retrieveContext(question, nodes, topK = 8) {
  // Tokenize question: remove stopwords, extract meaningful terms
  const stopwords = new Set([
    'the', 'is', 'in', 'it', 'of', 'and', 'a', 'to', 'what', 'where',
    'how', 'does', 'do', 'which', 'file', 'files', 'code', 'function',
    'that', 'for', 'are', 'this', 'with', 'was', 'on', 'at', 'by',
    'from', 'or', 'an', 'be', 'has', 'have', 'its', 'all', 'can', 'i',
  ]);

  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t));

  if (terms.length === 0) {
    // No meaningful terms — return top K by impact
    return nodes
      .slice()
      .sort((a, b) => (b.impact || 0) - (a.impact || 0))
      .slice(0, topK);
  }

  // Score all nodes
  const scored = nodes.map(node => ({
    node,
    score: scoreRelevance(node, terms),
  }));

  // Sort by score descending, take top K (only those with score > 0)
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.node);
}

/**
 * Format retrieved nodes into a code context string for the prompt.
 */
function formatContext(relevantNodes) {
  if (!relevantNodes || relevantNodes.length === 0) {
    return 'No relevant code context found in the analyzed repository.';
  }

  return relevantNodes.map(node => {
    const deps = node.deps && node.deps.length > 0
      ? `Dependencies: ${node.deps.join(', ')}`
      : 'Dependencies: None (standalone)';

    return [
      `--- File: ${node.id} ---`,
      `Type: ${node.type} | Impact: ${node.impact}/10${node.highImpact ? ' | ⚠ HIGH IMPACT' : ''}`,
      deps,
      `AI Summary: ${node.ai || 'No summary available.'}`,
    ].join('\n');
  }).join('\n\n');
}

/**
 * Main entry point: answer a natural language question about the repo.
 *
 * @param {string} question - The user's natural language question
 * @param {Array}  nodes    - The full array of analyzed graph nodes
 * @returns {Promise<{ answer: string, sources: string[] }>}
 */
export async function answerQuestion(question, nodes) {
  if (!question || !question.trim()) {
    return { answer: 'Please ask a question about the codebase.', sources: [] };
  }

  if (!nodes || nodes.length === 0) {
    return { answer: 'No analyzed repository data available.', sources: [] };
  }

  // 1. Retrieve relevant context
  const relevantNodes = retrieveContext(question, nodes);
  const codeContext = formatContext(relevantNodes);
  const sourceIds = relevantNodes.map(n => n.id);

  // 2. Build the grounded prompt
  const systemPrompt = `You are a senior software engineer analyzing a GitHub repository.

Your job is to answer questions about the codebase using the provided context.

Rules:
- Only use the given code context to answer
- Be precise and technical
- Mention file names and functions where relevant
- If the answer is not in the context, say: "Not found in the analyzed code"
- Do NOT guess`;

  const userPrompt = `When answering:
- Explain clearly
- Reference exact files
- Show code snippets if needed

Question:
${question}

Relevant Code Context:
${codeContext}`;

  const client = getClient();

  // Fallback: no Gemini client → return context-based answer
  if (!client) {
    const fallback = relevantNodes.length > 0
      ? `Based on the analyzed code, these files are most likely relevant to your question:\n\n${relevantNodes.map((n, i) => `${i + 1}. **${n.id}** (${n.type}) — ${n.ai || 'No summary.'}`).join('\n')}`
      : 'Not found in the analyzed code.';

    return { answer: fallback, sources: sourceIds };
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 600,
          temperature: 0.2, // Low temp for factual grounded answers
      }
    });

    const answer = response.text?.trim()
      || 'Not found in the analyzed code.';

    return { answer, sources: sourceIds };

  } catch (err) {
    console.error('❌ QA Engine error:', err.message);

    // Return the actual error message so the user knows WHY it failed
    const fallback = `⚠️ **AI Generation Failed**\n\nThe AI could not generate an answer because of the following external API error:\n\`${err.message}\`\n\n*(If you see a \"429 Quota Exceeded\" error, it means your OpenAI API Key has run out of credits and you need to top up your account!)*\n\n**Relevant files that were retrieved:**\n${relevantNodes.map(n => `• \`${n.id}\``).join('\n')}`;

    return { answer: fallback, sources: sourceIds };
  }
}
