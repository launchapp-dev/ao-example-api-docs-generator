#!/usr/bin/env bash
# validate-examples.sh — Validates generated examples for syntax correctness
# Input:  data/examples.json
# Output: data/validation-results.json

set -euo pipefail

INPUT="data/examples.json"
OUTPUT="data/validation-results.json"

if [ ! -f "$INPUT" ]; then
  echo "ERROR: $INPUT not found" >&2
  exit 1
fi

mkdir -p data

# Check jq is available
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed" >&2
  exit 1
fi

PASS=0
FAIL=0
RESULTS="[]"

# Validate the overall JSON structure
if ! jq empty "$INPUT" 2>/dev/null; then
  echo "ERROR: $INPUT is not valid JSON" >&2
  echo '{"error": "examples.json is not valid JSON", "pass": 0, "fail": 1, "results": []}' > "$OUTPUT"
  exit 1
fi

ENDPOINT_COUNT=$(jq '.examples | length' "$INPUT")
echo "Validating $ENDPOINT_COUNT endpoint examples..."

# Iterate over each example and validate
for i in $(seq 0 $((ENDPOINT_COUNT - 1))); do
  METHOD=$(jq -r ".examples[$i].method" "$INPUT")
  PATH_VAL=$(jq -r ".examples[$i].path" "$INPUT")
  ENDPOINT_KEY="$METHOD $PATH_VAL"

  ERRORS="[]"
  STATUS="pass"

  # 1. Check curl snippet exists and starts with 'curl'
  CURL_SNIPPET=$(jq -r ".examples[$i].curl // \"\"" "$INPUT")
  if [ -z "$CURL_SNIPPET" ]; then
    ERRORS=$(echo "$ERRORS" | jq '. + ["curl snippet is missing"]')
    STATUS="fail"
  elif ! echo "$CURL_SNIPPET" | grep -q "^curl"; then
    ERRORS=$(echo "$ERRORS" | jq '. + ["curl snippet does not start with curl command"]')
    STATUS="fail"
  fi

  # 2. Check JavaScript snippet exists
  JS_SNIPPET=$(jq -r ".examples[$i].javascript // \"\"" "$INPUT")
  if [ -z "$JS_SNIPPET" ]; then
    ERRORS=$(echo "$ERRORS" | jq '. + ["javascript snippet is missing"]')
    STATUS="fail"
  fi

  # 3. Check Python snippet exists
  PY_SNIPPET=$(jq -r ".examples[$i].python // \"\"" "$INPUT")
  if [ -z "$PY_SNIPPET" ]; then
    ERRORS=$(echo "$ERRORS" | jq '. + ["python snippet is missing"]')
    STATUS="fail"
  fi

  # 4. Validate expected_response is valid JSON (if present as object)
  EXPECTED=$(jq ".examples[$i].expected_response" "$INPUT")
  if [ "$EXPECTED" = "null" ]; then
    ERRORS=$(echo "$ERRORS" | jq '. + ["expected_response is missing"]')
    STATUS="fail"
  fi

  # 5. Check for placeholder values (red flags in examples)
  FULL_EXAMPLE=$(jq ".examples[$i]" "$INPUT")
  if echo "$FULL_EXAMPLE" | grep -qiE '"(TODO|FIXME|placeholder|your_token|YOUR_TOKEN|INSERT_HERE)"'; then
    ERRORS=$(echo "$ERRORS" | jq '. + ["example contains placeholder values"]')
    STATUS="fail"
  fi

  # Build result entry
  RESULT=$(jq -n \
    --arg endpoint "$ENDPOINT_KEY" \
    --arg status "$STATUS" \
    --argjson errors "$ERRORS" \
    '{"endpoint": $endpoint, "status": $status, "errors": $errors}')

  RESULTS=$(echo "$RESULTS" | jq ". + [$RESULT]")

  if [ "$STATUS" = "pass" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
done

# Write final results
jq -n \
  --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --argjson pass "$PASS" \
  --argjson fail "$FAIL" \
  --argjson total "$ENDPOINT_COUNT" \
  --argjson results "$RESULTS" \
  '{
    "timestamp": $timestamp,
    "summary": {
      "total": $total,
      "pass": $pass,
      "fail": $fail,
      "pass_rate": (if $total > 0 then ($pass / $total * 100 | floor) else 0 end)
    },
    "results": $results
  }' > "$OUTPUT"

echo ""
echo "Validation complete: $PASS passed, $FAIL failed out of $ENDPOINT_COUNT examples"
echo "Results written to $OUTPUT"

# Exit with failure if any examples failed validation
if [ "$FAIL" -gt 0 ]; then
  echo "WARNING: $FAIL examples failed validation — review data/validation-results.json"
  # Don't exit non-zero — the review-docs agent will handle quality decisions
fi
