# API Documentation Generator — Workflow Plan

## Overview

Automated pipeline that scans a codebase for API route definitions, extracts request/response schemas, generates example requests with curl and SDK snippets, validates examples actually work, formats everything as an OpenAPI spec and markdown documentation site, and publishes via GitHub Pages with a PR for doc updates. Solves the universal problem of API docs going stale — this pipeline regenerates them directly from code on every run.

## Agents

| Agent | Model | Role |
|---|---|---|
| **route-scanner** | claude-haiku-4-5 | Fast parser — scans codebase for route definitions, extracts endpoints, methods, params |
| **schema-extractor** | claude-sonnet-4-6 | Deep analysis — extracts request/response schemas, types, validation rules from handlers |
| **example-generator** | claude-sonnet-4-6 | Writes curl commands, SDK snippets (JS, Python), and realistic example payloads |
| **doc-reviewer** | claude-sonnet-4-6 | Quality gate — checks completeness, accuracy, formatting; decides publish/rework |
| **doc-publisher** | claude-sonnet-4-6 | Formats final OpenAPI spec + markdown, creates GitHub Pages PR |

## Phase Pipeline

```
scan-routes → extract-schemas → generate-examples → validate-examples → review-docs ─┐
                                      ↑                                                │
                                      └──────────── rework ────────────────────────────┘
                                                                                       │
                                                                                  publish-docs
```

## Phase Details

### 1. scan-routes (command)
**What:** Run a bash script that uses grep/ripgrep to find route definitions across common frameworks (Express, FastAPI, Rails, Spring, etc.) and dump raw matches to a file.
**Script:** `scripts/scan-routes.sh` — scans for patterns like `app.get(`, `@app.route(`, `@GetMapping`, `router.post(` etc.
**Input:** Target repo path from config/targets.json
**Output:** `data/raw-routes.txt` — raw grep output of all route-like patterns found

### 2. extract-endpoints (agent: route-scanner)
**What:** Parse raw route matches into structured endpoint definitions. Classify each endpoint by HTTP method, path, path params, query params.
**Input:** `data/raw-routes.txt`
**Output:** `data/endpoints.json` — structured array of endpoint objects
**Decision:** verdict = `has-endpoints` | `no-endpoints` (terminates if no APIs found)

### 3. extract-schemas (agent: schema-extractor)
**What:** For each endpoint, read the handler code and extract request body schema, response schema, auth requirements, status codes, and error responses. Uses sequential-thinking for complex type inference.
**Input:** `data/endpoints.json` + source files via filesystem MCP
**Output:** `data/schemas.json` — endpoint schemas with full request/response types

### 4. generate-examples (agent: example-generator)
**What:** For each endpoint+schema, generate realistic example requests (curl, JavaScript fetch, Python requests) with valid payloads, and expected response bodies.
**Input:** `data/schemas.json`
**Output:** `data/examples.json` — examples per endpoint with curl, JS, Python snippets

### 5. validate-examples (command)
**What:** Run a bash script that syntax-checks generated curl commands and validates JSON payloads are well-formed. Checks that all referenced paths exist in examples.
**Script:** `scripts/validate-examples.sh`
**Input:** `data/examples.json`
**Output:** `data/validation-results.json` — pass/fail per example with error details

### 6. format-openapi (agent: schema-extractor)
**What:** Assemble all endpoint data, schemas, and examples into a valid OpenAPI 3.1 spec. Also generate a markdown documentation site with per-endpoint pages.
**Input:** `data/schemas.json`, `data/examples.json`, `data/validation-results.json`, `templates/openapi-template.yaml`, `templates/endpoint-page.md`
**Output:** `output/openapi.yaml`, `output/docs/` directory with markdown pages, `output/docs/index.md`

### 7. review-docs (agent: doc-reviewer)
**What:** Quality gate — reviews generated docs for completeness (all endpoints documented, all have examples, all schemas accurate), formatting, and consistency. Uses sequential-thinking for thorough evaluation.
**Input:** `output/openapi.yaml`, `output/docs/`
**Output:** `data/review-feedback.md` (if rework)
**Decision:** verdict = `publish` | `rework` | `reject`
  - `publish` → proceed to publish
  - `rework` → loop back to generate-examples with feedback
  - `reject` → terminate (fundamentally broken input)

### 8. publish-docs (agent: doc-publisher)
**What:** Create a GitHub Pages branch, commit the docs, and open a PR. Generates a summary of what changed since last run.
**Input:** `output/openapi.yaml`, `output/docs/`
**Output:** GitHub PR created, `output/publish-summary.md`

## MCP Servers Needed

| Server | Package | Purpose |
|---|---|---|
| filesystem | `@modelcontextprotocol/server-filesystem` | Read source code, write data/output files |
| github | `gh-cli-mcp` | Create branches, PRs, manage GitHub Pages |
| sequential-thinking | `@modelcontextprotocol/server-sequential-thinking` | Complex schema inference and doc review reasoning |

## Directory Structure

```
api-docs-generator/
├── .ao/workflows/
│   ├── agents.yaml
│   ├── phases.yaml
│   ├── workflows.yaml
│   ├── mcp-servers.yaml
│   └── schedules.yaml
├── config/
│   └── targets.json          # Target repo path and framework hints
├── data/                      # Runtime intermediate files
│   └── .gitkeep
├── output/                    # Final artifacts
│   └── .gitkeep
├── templates/
│   ├── openapi-template.yaml  # Base OpenAPI spec skeleton
│   └── endpoint-page.md       # Markdown template for per-endpoint docs
├── scripts/
│   ├── scan-routes.sh         # Route pattern scanner (grep-based)
│   └── validate-examples.sh   # Example syntax validator
├── sample-data/
│   └── sample-express-app/    # Tiny Express app for demo/testing
├── CLAUDE.md
└── README.md
```

## Workflow Features Demonstrated

- **Command phases** — shell scripts for route scanning and example validation
- **Multi-agent pipeline** — 5 agents with distinct specializations (haiku for speed, sonnet for depth)
- **Decision contracts** — route-scanner decides if endpoints exist; reviewer gates publishing
- **Rework loops** — reviewer can send back to example generation with feedback (max 3 attempts)
- **Output contracts** — structured OpenAPI spec, markdown docs, JSON intermediates
- **Phase routing** — early termination on no-endpoints, rework on quality failure
- **Template-driven output** — OpenAPI and markdown templates for consistent formatting
- **Scheduled runs** — weekly re-scan to catch doc drift
- **Real tool usage** — grep/ripgrep for scanning, jq for JSON validation, gh CLI for publishing

## Sample Input (config/targets.json)

```json
{
  "repo_path": ".",
  "framework_hints": ["express", "fastify"],
  "base_url": "https://api.example.com",
  "output_format": "openapi-3.1",
  "languages": ["curl", "javascript", "python"],
  "include_patterns": ["src/routes/**", "src/api/**", "app/controllers/**"],
  "exclude_patterns": ["**/test/**", "**/spec/**", "**/__tests__/**"]
}
```

## Sample Output (output/docs/index.md)

```markdown
# API Documentation

Generated: 2026-03-31 | Endpoints: 24 | Version: 1.5.0

## Endpoints

### Authentication
- [POST /auth/login](endpoints/auth-login.md) — Authenticate user and receive JWT
- [POST /auth/register](endpoints/auth-register.md) — Create new user account
- [POST /auth/refresh](endpoints/auth-refresh.md) — Refresh expired JWT token

### Users
- [GET /users](endpoints/users-list.md) — List all users (paginated)
- [GET /users/:id](endpoints/users-get.md) — Get user by ID
- [PUT /users/:id](endpoints/users-update.md) — Update user profile
- [DELETE /users/:id](endpoints/users-delete.md) — Deactivate user account

### Products
- [GET /products](endpoints/products-list.md) — Search products
- [POST /products](endpoints/products-create.md) — Create new product
...
```
