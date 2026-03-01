#!/bin/bash
# Christian Context API (getcontext.xyz) test script
# No API key required

BASE="https://getcontext.xyz/api/api.php"

echo "=== 1. Query by theme (Wisdom) ==="
curl -s "${BASE}?query=wisdom" | jq '.' 2>/dev/null || curl -s "${BASE}?query=wisdom"

echo ""
echo "=== 2. Query by theme (Love) ==="
curl -s "${BASE}?query=Love" | jq '.' 2>/dev/null || curl -s "${BASE}?query=Love"

echo ""
echo "=== 3. Query by verse (John 3:16) ==="
curl -s "${BASE}?query=John%203:16" | jq '.' 2>/dev/null || curl -s "${BASE}?query=John%203:16"
