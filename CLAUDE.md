# API Documentation Generator — Agent Context

## What This Project Does

This is an AO workflow that automatically generates API documentation from source code. It scans a target codebase for route definitions, extracts schemas from handler code, generates multi-language examples, assembles an OpenAPI 3.1 spec, and publishes to GitHub Pages.

## Key Directories

| Path | Purpose |
|---|---|
| `config/targets.json` | Target repo path and scan configuration |
| `data/` | Runtime intermediate files (populated during runs) |
| `output/` | Final OpenAPI spec and markdown docs (populated during runs) |
| `templates/` | OpenAPI and markdown templates |
| `scripts/` | Bash scripts for route scanning and example validation |
| `sample-data/` | Demo Express app for testing the pipeline |

## Data Flow

```
config/targets.json
       │
       ▼
scripts/scan-routes.sh → data/raw-routes.txt
                              │
                              ▼
              route-scanner → data/endpoints.json
                                    │
                                    ▼
              schema-extractor → data/schemas.json
                                       │
                                       ▼
              example-generator → data/examples.json
                                         │
                                         ▼
              scripts/validate-examples.sh → data/validation-results.json
                                                   │
                                                   ▼
              schema-extractor → output/openapi.yaml + output/docs/
                                                              │
                                                              ▼
              doc-reviewer ─── rework? ──► example-generator (loop)
                    │
                    ▼ publish
              doc-publisher → GitHub PR
```

## Agent Responsibilities

- **route-scanner** — reads `data/raw-routes.txt`, writes `data/endpoints.json`, decides `has-endpoints`/`no-endpoints`
- **schema-extractor** — reads source code via filesystem MCP, writes `data/schemas.json`; also runs `format-openapi` phase to produce `output/openapi.yaml` and `output/docs/`
- **example-generator** — reads `data/schemas.json` (and `data/review-feedback.md` if present), writes `data/examples.json`
- **doc-reviewer** — reads all output files, decides `publish`/`rework`/`reject`, writes `data/review-feedback.md` on rework
- **doc-publisher** — creates GitHub Pages branch and PR, writes `output/publish-summary.md`

## Important Conventions

- All intermediate data goes in `data/` — never in `output/`
- Final artifacts go in `output/` — `openapi.yaml`, `docs/`, `publish-summary.md`
- Endpoint IDs in examples.json must match exactly with schemas.json (method + path as key)
- The scan script writes to `data/raw-routes.txt` — if this file is empty, no routes were found
- Review feedback is cumulative — address ALL items in `data/review-feedback.md`, not just the latest

## Templates

- `templates/openapi-template.yaml` — base OpenAPI 3.1 skeleton; fill in paths/components
- `templates/endpoint-page.md` — markdown template for per-endpoint doc pages; use for all endpoint pages in `output/docs/endpoints/`

## Sample Data

`sample-data/sample-express-app/` contains a small Express app you can use to test the pipeline without pointing at a real project. Set `config/targets.json` `repo_path` to `sample-data/sample-express-app`.

## Environment Variables

- `GH_TOKEN` — GitHub personal access token with repo scope (needed for publish phase)
