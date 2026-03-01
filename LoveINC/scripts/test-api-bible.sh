#!/bin/bash
# API.Bible CURL test script for Verse of the Day
# Replace YOUR_API_KEY with your key from environment.ts (apiBibleKey)
# Uses rest.api.bible (current API.Bible endpoint per dashboard)

API_KEY="${API_BIBLE_KEY:-YOUR_API_KEY}"
BASE="https://rest.api.bible/v1"
# KJV Bible ID (from your verse-of-the-day.service.ts)
BIBLE_ID="de4e12af7f28f599-01"

echo "=== 1. List available bibles (verify API key) ==="
curl -s -X GET "${BASE}/bibles" \
  -H "api-key: ${API_KEY}" | jq '.data[:3] | .[].name' 2>/dev/null || curl -s -X GET "${BASE}/bibles" -H "api-key: ${API_KEY}"

echo ""
echo "=== 2. Get single verse (JHN.3.16) - verses endpoint ==="
curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/verses/JHN.3.16?include-notes=true&include-titles=true" \
  -H "api-key: ${API_KEY}" | jq '.' 2>/dev/null || curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/verses/JHN.3.16?include-notes=true&include-titles=true" -H "api-key: ${API_KEY}"

echo ""
echo "=== 3. Get passage (ROM.5.1) - passages endpoint (what your service uses) ==="
curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/passages/ROM.5.1?include-notes=true&include-titles=true" \
  -H "api-key: ${API_KEY}" | jq '.' 2>/dev/null || curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/passages/ROM.5.1?include-notes=true&include-titles=true" -H "api-key: ${API_KEY}"

echo ""
echo "=== 4. Get passage range (ROM.5.1-3) ==="
curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/passages/ROM.5.1-3?include-notes=true&include-titles=true" \
  -H "api-key: ${API_KEY}" | jq '.' 2>/dev/null || curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/passages/ROM.5.1-3?include-notes=true&include-titles=true" -H "api-key: ${API_KEY}"

echo ""
echo "=== 5. Search for passage (John 3:16) - tutorial approach ==="
curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/search?query=%22John%203:16%22" \
  -H "api-key: ${API_KEY}" | jq '.' 2>/dev/null || curl -s -X GET "${BASE}/bibles/${BIBLE_ID}/search?query=%22John%203:16%22" -H "api-key: ${API_KEY}"
