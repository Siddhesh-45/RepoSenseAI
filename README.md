<div align="center">

# **⬡ RepoSense AI**
### **Understand Any Codebase. In Under 2 Minutes.**

> Transform any GitHub repository into an interactive AI-powered architecture map —
> dependency graphs, file explanations, and guided onboarding paths, generated in seconds.

</div>

<div align="center">

</div>

---

## What It Does

Paste a GitHub repository URL. Get back:

- An **interactive dependency graph** — every file is a node, every import is an edge
- **Color-coded risk heatmap** — critical files glow red, safe utilities stay gray
- **AI-generated file summaries** — plain English explanation of what each file does
- **"What breaks if I change this?"** — cascading impact analysis on any node
- **Guided onboarding path** — BFS-ordered reading list for new developers
- **Natural language search** — type `where is auth?` and the right nodes highlight

---

## Screenshots

**Landing Page**
`[IMAGE — Landing page with URL input and feature cards]`

**Graph View**
`[IMAGE — Interactive dependency graph with color-coded nodes]`

**File Detail Panel**
`[IMAGE — Right sidebar showing AI summary, impact score, imports, dependents]`

**Search Overlay (Cmd+K)**
`[IMAGE — Search modal with NL query and filtered results]`

**AI Summarizer**
`[IMAGE — Full-repo intelligence view with architecture insights and onboarding timeline]`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Flow, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Repo Analysis | simple-git (cloning), Madge (dependency extraction) |
| AI | Claude API — Sonnet 4 (summaries, NL search, onboarding) |
| Data Source | GitHub REST API v3 |

---

## Project Structure

```
RepoSenceAI/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx               # Landing page
│       │   └── Analyzer.jsx           # Main graph page
│       ├── components/
│       │   ├── Graph/
│       │   │   ├── GraphCanvas.jsx    # React Flow wrapper
│       │   │   ├── CustomNode.jsx     # Styled node component
│       │   │   └── graphHelpers.js    # Layout utilities
│       │   ├── Sidebar/
│       │   │   ├── FileDetailPanel.jsx
│       │   │   └── AISummaryCard.jsx
│       │   ├── Onboarding/
│       │   │   └── OnboardingPath.jsx
│       │   ├── Search/
│       │   │   └── QueryBar.jsx       # Cmd+K overlay
│       │   ├── Dashboard/
│       │   │   └── MetricsBar.jsx
│       │   └── Loading/
│       │       └── AnalysisLoader.jsx
│       └── services/
│           └── api.js
│
└── backend/
    ├── server.js
    ├── routes/
    │   └── analyze.js
    ├── modules/
    │   ├── repoFetcher.js             # Clone via simple-git
    │   ├── dependencyAnalyzer.js      # Madge runner
    │   ├── fileClassifier.js          # Rule-based file typing
    │   ├── impactScorer.js            # Incoming edge scoring
    │   ├── aiSummarizer.js            # Claude API calls
    │   ├── onboardingPath.js          # BFS traversal
    │   ├── queryEngine.js             # NL search
    │   └── graphBuilder.js            # Final JSON assembly
    └── utils/
        └── cleanup.js                 # Temp folder removal
```

---

## How It Works

```
GitHub URL
  → Clone repo (simple-git)
  → Extract dependencies (Madge)
  → Classify files by type (entry / core / util / config)
  → Score impact by incoming edge count
  → Generate AI summaries (Claude API, batched)
  → BFS traversal → onboarding path
  → Assemble graph JSON { nodes, edges, onboardingPath, metrics }
  → React Flow renders interactive graph
  → Cleanup temp folder
```

---

## Running Locally

### Prerequisites

- Node.js v18+
- Git
- A [GitHub Personal Access Token](https://github.com/settings/tokens) — select `repo` scope
- An [Anthropic API Key](https://console.anthropic.com)

---

### 1. Clone the repository

```bash
git clone https://github.com/Siddhesh-45/RepoSenceAI.git
cd RepoSenceAI
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
GITHUB_TOKEN=your_github_token_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

---

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

### 4. Open the app

Go to `http://localhost:5173` and paste any public GitHub repository URL.

**Suggested repos to test with:**
```
https://github.com/expressjs/express
https://github.com/axios/axios
https://github.com/sindresorhus/got
```

---

## API Reference

### `POST /api/analyze`

**Request:**
```json
{
  "repoUrl": "https://github.com/expressjs/express"
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "index.js",
      "type": "entry",
      "impact": 9,
      "highImpact": true,
      "ai": "Main entry point. Loads the core application factory and exports it.",
      "deps": ["application.js", "utils.js"],
      "position": { "x": 400, "y": 80 }
    }
  ],
  "edges": [
    { "id": "e1", "source": "index.js", "target": "application.js" }
  ],
  "onboardingPath": ["utils.js", "router/index.js", "application.js", "index.js"],
  "metrics": {
    "totalFiles": 12,
    "highImpactFiles": 3,
    "totalEdges": 18,
    "density": 1.5,
    "entryPoints": 1
  }
}
```

---

## Node Color Reference

| Color | Type | Description |
|---|---|---|
| 🟢 Green `#22c55e` | Entry point | Application bootstrap |
| 🔵 Blue `#3b82f6` | Core logic | Routes, controllers, middleware |
| 🟣 Purple `#a855f7` | Utility | Helpers, shared functions |
| 🟡 Amber `#f59e0b` | Config | Environment, configuration files |
| 🔴 Red `#ef4444` | High impact | Files with 7+ dependents |

---

