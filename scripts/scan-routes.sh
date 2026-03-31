#!/usr/bin/env bash
# scan-routes.sh — Scans a codebase for API route definitions across common frameworks
# Output: data/raw-routes.txt

set -euo pipefail

CONFIG="config/targets.json"
OUTPUT="data/raw-routes.txt"

# Read target repo path from config
REPO_PATH=$(jq -r '.repo_path' "$CONFIG")

if [ ! -d "$REPO_PATH" ]; then
  echo "ERROR: repo_path '$REPO_PATH' does not exist" >&2
  exit 1
fi

mkdir -p data
> "$OUTPUT"

echo "# Route scan — $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT"
echo "# Target: $REPO_PATH" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Determine search tool
if command -v rg &>/dev/null; then
  GREP_CMD="rg --no-heading -n"
else
  GREP_CMD="grep -rn"
fi

echo "=== EXPRESS / FASTIFY (JavaScript/TypeScript) ===" >> "$OUTPUT"
$GREP_CMD \
  -E "(app|router|server)\.(get|post|put|patch|delete|options|head)\s*\(['\"]/" \
  "$REPO_PATH" \
  --include="*.js" --include="*.ts" --include="*.mjs" \
  2>/dev/null >> "$OUTPUT" || true

echo "" >> "$OUTPUT"
echo "=== FASTAPI / FLASK (Python) ===" >> "$OUTPUT"
$GREP_CMD \
  -E "@(app|router|blueprint)\.(route|get|post|put|patch|delete)\s*\(['\"]/" \
  "$REPO_PATH" \
  --include="*.py" \
  2>/dev/null >> "$OUTPUT" || true

echo "" >> "$OUTPUT"
echo "=== RAILS (Ruby) ===" >> "$OUTPUT"
$GREP_CMD \
  -E "^\s*(get|post|put|patch|delete|resources|resource)\s+['\"]/" \
  "$REPO_PATH" \
  --include="*.rb" \
  2>/dev/null >> "$OUTPUT" || true

echo "" >> "$OUTPUT"
echo "=== SPRING (Java/Kotlin) ===" >> "$OUTPUT"
$GREP_CMD \
  -E "@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(['\"]/" \
  "$REPO_PATH" \
  --include="*.java" --include="*.kt" \
  2>/dev/null >> "$OUTPUT" || true

echo "" >> "$OUTPUT"
echo "=== DJANGO (Python) ===" >> "$OUTPUT"
$GREP_CMD \
  -E "path\s*\(['\"][^'\"]*['\"]" \
  "$REPO_PATH" \
  --include="*.py" \
  2>/dev/null >> "$OUTPUT" || true

echo "" >> "$OUTPUT"
echo "=== GO (gin, echo, net/http) ===" >> "$OUTPUT"
$GREP_CMD \
  -E "\.(GET|POST|PUT|DELETE|PATCH|Handle|HandleFunc)\s*\(['\"]/" \
  "$REPO_PATH" \
  --include="*.go" \
  2>/dev/null >> "$OUTPUT" || true

echo "" >> "$OUTPUT"
echo "=== SCAN COMPLETE ===" >> "$OUTPUT"
echo "Lines found: $(grep -c '/' "$OUTPUT" 2>/dev/null || echo 0)" >> "$OUTPUT"

echo "Route scan complete. Output written to $OUTPUT"
wc -l "$OUTPUT"
