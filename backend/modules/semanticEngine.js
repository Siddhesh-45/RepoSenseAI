import { GoogleGenAI } from '@google/genai';

let ai = null;
function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function generateSemanticAnalysis(nodeId, nodes, edges) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) throw new Error("Node not found");

  const targetDeps = edges
    .filter(e => e.source === nodeId || (typeof e.source === 'object' && e.source.id === nodeId))
    .map(e => typeof e.target === 'object' ? e.target.id : e.target);

  const targetDependents = edges
    .filter(e => e.target === nodeId || (typeof e.target === 'object' && e.target.id === nodeId))
    .map(e => typeof e.source === 'object' ? e.source.id : e.source);

  const context = `
File: ${nodeId}
Type: ${node.type}
Basic AI Summary: ${node.ai || 'None provided'}
Dependencies (Imports): ${targetDeps.join(', ') || 'None'}
Dependents (Imported By): ${targetDependents.join(', ') || 'None'}
  `;

  const systemPrompt = `You are a static code analysis engine. Analyze the provided graph node representing a source file.
Generate a structured JSON semantic analysis report based only on the provided context.
Return raw JSON only. Do not use markdown wrappers.
Required JSON schema:
{
  "modulePurpose": "Domain responsibility and bounded context",
  "exportedInterface": ["List of likely exported interfaces/functions"],
  "dependencies": ["List of dependencies"],
  "dependents": ["List of consumers"],
  "dataFlow": "Input -> Processing -> Output narrative",
  "algorithms": "Description of any core logic or complexity",
  "designPatterns": ["Factory", "Observer", "React Component", "Utility", etc],
  "architecturalLayer": "Presentation Layer | Domain Layer | Infrastructure Layer | Application Layer",
  "stateContracts": "Does this own or mutate state?"
}`;

  const client = getClient();
  if (!client) {
     return {
         modulePurpose: node.ai || 'Unanalyzed component',
         exportedInterface: ['Unknown'],
         dependencies: targetDeps,
         dependents: targetDependents,
         dataFlow: 'Unknown',
         algorithms: 'Unknown',
         designPatterns: [],
         architecturalLayer: node.type,
         stateContracts: 'Unknown'
     };
  }

  try {
     const response = await client.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: context,
         config: {
             systemInstruction: systemPrompt,
             temperature: 0.1,
             responseMimeType: 'application/json'
         }
     });
     return JSON.parse(response.text);
  } catch (err) {
      console.error("Semantic analysis failed:", err.message);
      return {
         modulePurpose: node.ai || 'Error analyzing component',
         exportedInterface: ['Error'],
         dependencies: targetDeps,
         dependents: targetDependents,
         dataFlow: 'Error',
         algorithms: 'Error',
         designPatterns: [],
         architecturalLayer: node.type,
         stateContracts: 'Error'
     };
  }
}
