# Verse of the Day: API Options Deep Dive

A comparison of Bible APIs for implementing the Verse of the Day feature, including footnotes, alternate readings, and study content.

---

## 1. NET Bible (labs.bible.org) — *Current reference source*

| Aspect | Details |
|--------|---------|
| **Verse of the day** | Built-in: `?passage=votd&type=json` — returns the official NET Bible verse of the day |
| **Auth** | None required |
| **CORS** | Generally permissive |
| **Footnotes / notes** | No — plain text only |
| **Formats** | JSON, XML, text, JSONP |
| **Rate limits** | Not documented (appears generous) |
| **Bibles** | NET Bible only |

**Use case:** Ideal as the **reference source** for “which verse today?” — simple, reliable, no key needed. Not suitable for rich content (notes, footnotes).

---

## 2. API.Bible (American Bible Society)

| Aspect | Details |
|--------|---------|
| **Verse of the day** | No built-in VOTD — you supply a list of verses and pick one (e.g. by date or random) |
| **Auth** | `api-key` header; sign up at [scripture.api.bible](https://scripture.api.bible/) |
| **Base URL** | `https://api.scripture.api.bible/v1` or `https://rest.api.bible/v1` |
| **Bibles** | ~1,500–2,500 versions, 1,000+ languages |
| **Footnotes / notes** | Yes — `include-notes` parameter on passages/verses |
| **Other params** | `include-titles`, `include-chapter-numbers` |
| **Rate limits** | 5,000 queries/day (non-commercial); 500 consecutive verses max per request |
| **Cost** | Free for non-commercial |

**Endpoints:**
- `GET /v1/bibles` — list Bibles (filtered by your API key)
- `GET /v1/bibles/{bible_id}/verses/{verse_id}` — single verse (e.g. `JHN.3.16`)
- `GET /v1/bibles/{bible_id}/passages/{passage}` — passage range (e.g. `MAT.1.12-MAT.1.20`)
- `GET /v1/bibles/{bible_id}/search?query={verse_id}` — search (used in their VOTD tutorial)

**VOTD tutorial approach:**  
Hardcode ~20–31 verses, pick by `new Date().getDate()` or random, then fetch via search or verses endpoint.

**Pros:** Large Bible selection, `include-notes`, free tier, good docs  
**Cons:** No built-in VOTD; you must maintain your own verse list

---

## 3. ESV API (api.esv.org)

| Aspect | Details |
|--------|---------|
| **Verse of the day** | No built-in VOTD — you pass the passage in `q` |
| **Auth** | `Authorization: Token YOUR_KEY` |
| **Base URL** | `https://api.esv.org/v3/` |
| **Bibles** | ESV only |
| **Footnotes** | Yes — `include-footnotes`, `include-footnote-body` (default true) |
| **Cross-refs** | Yes — `include-crossrefs` |
| **Headings** | Yes — `include-headings`, `include-subheadings` |
| **Output** | HTML (passage/html) or text |

**Passage HTML endpoint:**  
`GET /v3/passage/html/?q=John+11:35`

**Pros:** Strong footnotes and cross-refs, flexible passage parsing  
**Cons:** ESV only; you previously said notes weren’t good enough for your use case

---

## 4. YouVersion API (api.youversion.com)

| Aspect | Details |
|--------|---------|
| **Verse of the day** | No built-in VOTD — you pass passage ID |
| **Auth** | `X-YVP-App-Key` header |
| **Base URL** | `https://api.youversion.com/v1` |
| **Bibles** | Depends on app key; your key has ~12 (BSB, ASV, WEB, etc.) |
| **Footnotes / notes** | Yes — `include_notes=true` (translator footnotes, alternate readings) |
| **Headings** | Yes — `include_headings=true` |
| **Output** | HTML or text |

**Passage endpoint:**  
`GET /v1/bibles/{bible_id}/passages/{passage_id}?format=html&include_notes=true`

**Passage ID format:** USFM (e.g. `ROM.5.1`, `JHN.3.16`, `ROM.5.1-3`)

**Pros:** Notes in BSB; no CORS issues in native app  
**Cons:** CORS can block browser dev; limited Bibles on your key; no study Bibles

---

## Recommended Architecture

### Option A: NET Bible + API.Bible (recommended)

1. **Reference:** Keep NET Bible `?passage=votd` for “which verse today?”
2. **Content:** Fetch that verse from API.Bible with `include-notes=true`
3. **Benefits:** Built-in VOTD, large Bible choice, notes, free tier

**Flow:**
```
NET Bible votd → reference (e.g. "Romans 5:1")
       ↓
API.Bible GET /v1/bibles/{id}/passages/ROM.5.1?include-notes=true
       ↓
Display verse + footnotes
```

**Requirements:** API.Bible key; map NET reference to API.Bible passage format (e.g. ROM.5.1).

---

### Option B: API.Bible only (curated list)

1. Maintain a list of 31 verses (one per day of month) or 365 for full year
2. Pick verse by `new Date().getDate()` or similar
3. Fetch from API.Bible with `include-notes=true`

**Pros:** Single API; full control over verse list  
**Cons:** You must curate and maintain the list

---

### Option C: NET Bible + ESV (if ESV notes work for you)

1. NET Bible for VOTD reference
2. ESV API for passage HTML with footnotes and cross-refs

**Pros:** Strong ESV study features  
**Cons:** You previously found ESV notes lacking

---

### Option D: Keep current (NET + YouVersion)

1. NET Bible for VOTD reference
2. YouVersion for BSB content with translator footnotes

**Pros:** Already implemented  
**Cons:** CORS in browser dev; limited Bibles; footnotes may not appear for every verse

---

## Next Steps

1. **Get an API.Bible key** at [scripture.api.bible](https://scripture.api.bible/) (or [api.bible/sign-up](https://api.bible/sign-up))
2. **List Bibles** via `GET /v1/bibles` to find IDs and which include notes
3. **Test a passage** with `include-notes=true` to confirm footnote format
4. **Implement Option A** if API.Bible notes meet your needs

---

## References

- [API.Bible VOTD Tutorial](https://docs.api.bible/tutorials/verse-of-the-day/)
- [API.Bible Getting Started](https://docs.api.bible/api-reference/getting-started)
- [API.Bible Passages](https://docs.api.bible/guides/passages/)
- [ESV API Passage HTML](https://api.esv.org/docs/passage-html/)
- [YouVersion API](https://developers.youversion.com/api)
- [NET Bible API](https://labs.bible.org/api_web_service)
