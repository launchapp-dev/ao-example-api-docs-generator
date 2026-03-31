# API Documentation Generator

Automated pipeline that scans a codebase for API route definitions, extracts request/response schemas, generates multi-language code examples, assembles a valid OpenAPI 3.1 spec, and publishes documentation to GitHub Pages — all on autopilot.

## Why

API docs go stale. Developers add endpoints, change schemas, rename parameters — and the docs lag behind. This pipeline regenerates documentation directly from source code on every run, keeping docs in sync with reality.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     API Documentation Generator                          │
└─────────────────────────────────────────────────────────────────────────┘

  [scan-routes]          bash script — grep for route patterns across frameworks
       │
       ▼
  [extract-endpoints]    route-scanner (haiku) — parse raw matches → endpoints.json
       │
       ├── no-endpoints ──► STOP (no APIs found)
       │
       ▼ has-endpoints
  [extract-schemas]      schema-extractor (sonnet) — read handler code → schemas.json
       │
       ▼
  [generate-examples]    example-generator (sonnet) — curl/JS/Python snippets → examples.json
       │
       ▼
  [validate-examples]    bash script — syntax-check JSON, validate curl commands
       │
       ▼
  [format-openapi]       schema-extractor (sonnet) — assemble OpenAPI spec + markdown docs
       │
       ▼
  [review-docs]          doc-reviewer (sonnet) — quality gate (5-point checklist)
       │
       ├── rework ──────────────────────────────────────► [generate-examples]
       │   (max 3 attempts, with specific feedback)              ▲
       │                                                         │
       ├── reject ──► STOP (fundamentally broken)                │
       │                                                    (loop back)
       ▼ publish
  [publish-docs]         doc-publisher (sonnet) — GitHub Pages PR with change summary
```

## Quick Start

```bash
cd examples/api-docs-generator

# Point to your target repo
edit config/targets.json   # set repo_path to your API project

# Start the daemon and run the pipeline
ao daemon start
ao queue enqueue \
  --title "api-docs-generator" \
  --description "Regenerate API docs from source" \
  --workflow-ref generate-api-docs

# Watch progress
ao daemon stream --pretty
```

## Agents

| Agent | Model | Role |
|---|---|---|
| **route-scanner** | claude-haiku-4-5 | Fast parser — scans raw grep output, classifies endpoints by method/path/framework |
| **schema-extractor** | claude-sonnet-4-6 | Deep analyzer — reads handler code, extracts full request/response schemas; also assembles final OpenAPI spec |
| **example-generator** | claude-sonnet-4-6 | Writes realistic curl, JavaScript, and Python examples with proper error handling |
| **doc-reviewer** | claude-sonnet-4-6 | Quality gate — 5-point checklist, sends back for rework with specific feedback |
| **doc-publisher** | claude-sonnet-4-6 | Formats OpenAPI spec, creates GitHub Pages branch, opens PR with change summary |

## AO Features Demonstrated

| Feature | Where Used |
|---|---|
| **Command phases** | `scan-routes` (grep script) and `validate-examples` (JSON/curl checker) |
| **Multi-model pipeline** | haiku for fast parsing, sonnet for deep analysis and generation |
| **Decision contracts** | `extract-endpoints` → `has-endpoints`/`no-endpoints` routing |
| **Rework loops** | `review-docs` → `generate-examples` with structured feedback (max 3 attempts) |
| **Early termination** | `no-endpoints` and `reject` verdicts stop the pipeline cleanly |
| **Multiple workflows** | `generate-api-docs` (full) + `quick-scan` (lightweight inventory) |
| **Scheduled runs** | Weekly full refresh + daily endpoint scan to detect drift |
| **Sequential thinking** | Schema inference and quality review use structured reasoning |

## Directory Structure

```
api-docs-generator/
├── .ao/workflows/
│   ├── agents.yaml           # 5 agents with detailed system prompts
│   ├── phases.yaml           # 8 phases: command + agent + decision
│   ├── workflows.yaml        # generate-api-docs + quick-scan workflows
│   ├── mcp-servers.yaml      # filesystem, github, sequential-thinking
│   └── schedules.yaml        # weekly + daily cron schedules
├── config/
│   └── targets.json          # Target repo path and framework hints
├── data/                     # Runtime intermediate files (gitignored)
│   └── .gitkeep
├── output/                   # Final artifacts (gitignored)
│   └── .gitkeep
├── templates/
│   ├── openapi-template.yaml # Base OpenAPI 3.1 spec skeleton
│   └── endpoint-page.md      # Markdown template for per-endpoint docs
├── scripts/
│   ├── scan-routes.sh        # Route pattern scanner (grep/ripgrep)
│   └── validate-examples.sh  # Example syntax and JSON validator
├── sample-data/
│   └── sample-express-app/   # Tiny Express app for demo/testing
│       ├── src/routes/
│       └── package.json
├── CLAUDE.md
└── README.md
```

## Requirements

### API Keys / Tokens

| Variable | Required For |
|---|---|
| `GH_TOKEN` | Publishing docs to GitHub Pages via PR |

### CLI Tools

- `bash` (route scanning and validation)
- `jq` (JSON validation in validate-examples.sh)
- `node` / `npx` (MCP servers)

### MCP Servers (auto-installed via npx)

- `@modelcontextprotocol/server-filesystem` — read source code, write artifacts
- `gh-cli-mcp` — create GitHub branches and PRs
- `@modelcontextprotocol/server-sequential-thinking` — structured reasoning

## Configuration

Edit `config/targets.json` to point at your API project:

```json
{
  "repo_path": "/path/to/your/api-project",
  "framework_hints": ["express"],
  "base_url": "https://api.yourapp.com",
  "output_format": "openapi-3.1",
  "languages": ["curl", "javascript", "python"],
  "include_patterns": ["src/routes/**", "src/api/**"],
  "exclude_patterns": ["**/test/**", "**/spec/**"]
}
```

Supported framework hints: `express`, `fastify`, `fastapi`, `flask`, `rails`, `spring`, `django`, `gin`, `echo`

## Example Output

After a successful run:

```
output/
├── openapi.yaml                    # Valid OpenAPI 3.1 spec
├── publish-summary.md              # PR URL, counts, timestamp
└── docs/
    ├── index.md                    # TOC grouped by resource
    └── endpoints/
        ├── auth-login.md
        ├── auth-register.md
        ├── users-list.md
        ├── users-get.md
        └── ...
```

## Workflows

### `generate-api-docs` (default)
Full pipeline — scan → extract → generate → validate → format → review → publish. Run this for complete doc regeneration.

### `quick-scan`
Lightweight — scan → extract → extract-schemas only. Produces `data/schemas.json` as an endpoint inventory without generating examples or publishing. Useful for CI checks to detect new/removed endpoints.
