# IP-SAKTI Sahayak — SIH 2026 Action Plan

> **Project Code:** SIH26045 | **Target:** Ministry of Ayush, Smart India Hackathon 2026
> **Status:** Strong prototype with a credibility gap. This document lists every change
> required to close it, ordered by impact on the outcome.

---

## Honest Baseline Assessment

### What is genuinely strong

- **The Gemini fallback chain is real production engineering.** `key_manager.py` +
  `fallback_chain.py` (~630 lines) implement thread-safe key rotation, per-key health
  tracking, cooldown with auto-recovery, permanent exhaustion on auth errors, and error
  classification. This is well above typical hackathon quality.
- **The domain research is sharp.** Sec 3(p) / 3(d) / 3(e) / 3(h), BDA Sec 6(1), WIPO
  GRATK Article 3, D&C Rules 158A/158B, Schedule T. This is what separates the project
  from teams who wrapped an LLM in a chat box.
- **Thoughtful safety design.** DPDP PII scrubbing, medical-query abstention, and a strict
  structured verdict schema.
- **Good data schemas.** `biopiracy_precedent` and `classical_formulation_presence` on the
  ontology, and `gazette_ref` / `version_tag` / `authority` on statute chunks, are exactly
  the fields that make the output look official. Keep them.

### What will lose the finale

| # | Problem | Evidence |
|---|---|---|
| 1 | The "RAG vector database" holds **13 statutory sections (~13 KB)** — hand-written summaries, not statute text | `legal_statutory_corpus.json` |
| 2 | Ontology has **10 plants**, formulation index **5 entries**, TKDL corpus **3 entries** | `src/data/` |
| 3 | **Citations are never validated** against the corpus — the LLM invents `text_snippet` and section codes, and the UI labels them cryptographically verified | `statutory-rule-engine.ts:227` |
| 4 | Jurisdiction diff and adversarial examiner return **hardcoded strings** regardless of input | `statutory-rule-engine.ts:250-311` |
| 5 | `verifyCitationNLI` is `sleep(200); return true` | `statutory-rule-engine.ts:246` |
| 6 | Fabricated latency shown to judges | `main.py:203` |
| 7 | A 32-bit shift hash is labelled `sha256_...` | `statutory-rule-engine.ts:50-57` |
| 8 | The eval harness **has never been run** — no results file exists | `run_eval.py` |
| 9 | Repo history is one commit: `Initial commit from Create Next App`; Python service not in a repo | `git log` |
| 10 | Backend URL hardcoded to `127.0.0.1:8000`; nothing deployed | `statutory-rule-engine.ts:206` |

**Bottom line:** the depth currently lives in the pitch narrative rather than in the data.
Tier 0 + Tier 1 below closes that gap.

---

## Tier 0 — Integrity Fixes

**Effort: ~3 hours. Do these first.** Each one actively damages you if a judge finds it.

### 0.1 Remove the fake latency

`gemini-fallback-service/main.py:203`

```python
cached_result["latency_ms"] = 5.0 # Make it look blazingly fast in the UI
```

You are displaying a fabricated performance number to judges, with a code comment saying
so. Return the real cached latency and add a `cache_hit: true` field instead.

- [x] **Level:** delete the line; surface `cache_hit` in the UI. A cache hit is legitimately
      impressive — show the real thing.

### 0.2 Fix the mislabeled hash

`frontend/src/lib/domain-engine/statutory-rule-engine.ts:50-57` computes a 32-bit shift
hash and names the result `sha256_...`.

- [x] **Level:** use real SHA-256 (`crypto.createHash` / `crypto.subtle.digest`), **or**
      rename the field to `query_fingerprint` and stop calling it cryptographic.

### 0.3 Kill the "Verified" fallback

`frontend/src/lib/domain-engine/memo-generator.ts:37` renders
`sha256_hash || 'Verified'` — so a missing hash prints the word **"Verified"** in the
position of a cryptographic hash, inside an exported legal memo.

- [x] **Level:** print `UNVERIFIED` when no hash is present, and flag it visually.

### 0.4 Resolve the fake NLI step

`verifyCitationNLI` sleeps 200 ms and returns `true` unconditionally, while the UI
presents it as a verification pass.

- [x] **Level:** either implement it properly (subsumed by task 1.2 below) or remove it
      from the UI entirely. Do not ship a verification step that always returns true.

---

## Tier 1 — The Three Things That Decide Win/Lose

### 1.1 Data scale

**Effort: 2–3 days, parallelizable across 3 people. Biggest single lever.**

Today, a judge typing an unscripted query gets an empty entity list and a generic answer.
This is the most likely public failure mode.

| Asset | Now | Target | Rationale |
|---|---|---|---|
| `ayurvedic_botanical_ontology.json` | 10 | **150–200 species** | The Ayurvedic Pharmacopoeia of India has ~645 single-drug monographs; the top 150 cover the overwhelming majority of realistic queries |
| `classical_formulations_index.json` | 5 | **200+** | AFI Part I lists ~640 formulations; 200 makes the Sec 3(p) prior-art check genuinely functional |
| `tkdl_sample_corpus.json` | 3 | **60–100** | Enough that Charaka / Sushruta / Astanga Hridaya citations resolve for common queries |
| `legal_statutory_corpus.json` | 13 sections | **250–400 chunks** | See task 1.3 |

Keep the existing JSON schemas exactly as they are — they are well designed. This is
volume work, not design work.

- [x] Expand ontology to 150–200 species
- [x] Expand formulation index to 200+
- [x] Expand TKDL corpus to 60–100
### Tier 1 — Data scale and Citation Grounding (Priority: High)
- [x] **1.1 Data scale:**
  - [x] Expand ontology to 150-200 species (currently ~12)
  - [x] Expand formulation index to 200+ (currently ~5)
  - [x] Expand TKDL corpus to 60-100 (currently ~3)
  - [x] *1.1a Remove the duplicated synonym map in `transliteration-normalizer.ts`*
  - [x] *1.1b Fix the entity matcher in `botanical-resolver.ts` to not use string.includes()*
- [x] **1.2 Ground the citations against the corpus:**
  - [x] *1.2a Fix the retrieval query so we aren't embedding the JSON into the vector search.*
- [x] **1.3 Ingest real statutory text:**
  - [x] Patents Act 1970 (Sec 3, 2, 10, 25, 64)
  - [x] Biological Diversity Act 2002
  - [x] WIPO GRATK 2024
  - [x] Drugs & Cosmetics Rules
  - [x] Manual of Patent Office Practice and Procedure
- [x] **1.4 Actually run the evaluation:**
  - [x] Expand `legal_eval_benchmark.json` to 30 cases.
  - [x] Run it and output `eval_results.json` so you have real metrics for the pitch deck.

#### 1.1a Remove the duplicated synonym map

`VERNACULAR_SYNONYMS` in `transliteration-normalizer.ts` hardcodes Hindi and Marathi names
that **already exist** as `hindi_name` / `marathi_name` fields in the ontology JSON. Two
sources of truth will drift at 200 entries.

- [x] **Level:** generate the synonym map from the ontology at build time. Keep the manual
      map only for extra aliases the ontology does not carry (e.g. "indian ginseng").

#### 1.1b Fix the entity matcher

`resolveBotanicalEntities` does naive `String.includes` over every entry. At 200 entries
with short Sanskrit names this produces false positives (a name like "Bala" matches inside
unrelated words).

- [x] **Level:** word-boundary matching, longest-match-first, and add a `matched_alias`
      field so the UI can show *why* an entity matched.

---

### 1.2 Ground the citations against the corpus

**Effort: ~1 day. Highest technical value in the project.**

The pitch claims "cryptographic citation vault, zero hallucination." Trace the real data
path:

1. `init_vector_db.py` computes genuine SHA-256 hashes of statute text ✅
2. Those hashes are injected into the prompt **as plain text**
3. The LLM is asked to emit `citation.text_snippet`, `citation_code`, and `version_tag`
   in its own JSON output
4. `statutory-rule-engine.ts:227` spreads `...parsedVerdict` straight into the response

**Nothing checks that the citation the LLM produced corresponds to anything real.** The
model can invent a section number and a quotation, and the UI will display it inside a box
labelled as cryptographically verified. The real hashes never reach the frontend.

**The fix.** After parsing the LLM JSON, for each `reasoning_chain[].citation`:

- Look up `section_id` in the statutory corpus.
- If found: **overwrite** `text_snippet`, `heading`, and `version_tag` with the canonical
  corpus values, and attach the real SHA-256.
- If not found: drop the reasoning step and record it as `HALLUCINATED_CITATION_REJECTED`.

- [x] **Level:** ~60–80 lines in a new `frontend/src/lib/domain-engine/citation-validator.ts`.

This is also the best demo moment available to you: display a live counter reading
**"3 citations verified against corpus · 0 rejected."** It converts the project's central
claim from marketing into something provable on stage.

#### 1.2a Fix the retrieval query

`/generate_rag` embeds `request.prompt`, which is the entire user prompt **including the
stringified context JSON**. That is a long, diluted embedding query producing poor
retrieval. With `top_k=3` over 13 chunks it barely matters; over 300 chunks it matters a
great deal.

- [x] **Level:** add a separate `retrieval_query` field to `GenerateRequest` containing
      only the user's actual question plus the resolved botanical names.

---

### 1.3 Ingest real statutory text

**Effort: ~1 day.**

Replace the 13 hand-written summaries with actual statute text:

- **Patents Act 1970** — all of Sec 3 (a) through (p), Sec 2 definitions, Sec 10,
  Sec 25 and Sec 64 (opposition / revocation — directly relevant to biopiracy)
- **Biological Diversity Act 2002 (as amended 2023)** — Sec 2, 3, 4, 6, 7, 19, 20, 21, 40
- **WIPO GRATK 2024** — all articles, not two
- **Drugs & Cosmetics Rules** — 158A, 158B, Schedule T
- **Add:** Manual of Patent Office Practice and Procedure, sections on traditional
  knowledge; and the TKDL access-agreement framing

- [x] **Level: 250–400 chunks minimum.** Chunk by sub-section. Keep the existing metadata
      schema. Below roughly 200 chunks, calling this a "vector database" remains an
      overstatement a domain judge will catch.

---

### 1.4 Actually run the evaluation

**Effort: ~half a day.**

`run_eval.py` exists and has never been executed — no results file exists anywhere in the
project.

- [x] Expand `legal_eval_benchmark.json` from 5 to **30 cases**, distributed roughly:
  - 10 classical / barred
  - 6 process-patentable
  - 5 admixture requiring synergy proof
  - 4 abstention / medical out-of-scope
  - 5 vernacular (Hindi, Marathi, Tamil)
- [x] Run it; write `eval_results.json`
- [x] Add an `npm run eval` script so it can be re-run after every change
- [x] Put the real accuracy number on its own slide

An honest **"88% verdict accuracy, 100% abstention accuracy across 30 cases"** beats every
architecture diagram in the room.

---

## Tier 2 — Make the Faked Features Real

**Effort: ~1.5 days.**

### 2.1 Jurisdiction diff

`statutory-rule-engine.ts:262-311` returns three hardcoded verdict objects regardless of
input. The fallback-chain infrastructure to do this properly already exists — it is three
parallel calls with per-jurisdiction system prompts.

- [x] **Level:** real LLM calls for INDIA and USPTO at minimum. If time runs out, keep EPO
      hardcoded **and label it "Phase 2 roadmap" in the UI.** Right now all three are fake
      and none are labelled — that is the problem.

### 2.2 Adversarial examiner

`generateAdversarialArgument` returns one of two fixed strings.

- [x] **Level:** one LLM call prompted as *"act as an Indian Patent Office examiner
      drafting a First Examination Report objection"*, seeded with the verdict. ~20 lines.

This is a genuinely novel feature and currently the most impressive-sounding thing in the
project that is completely fake.

### 2.3 Bhashini / voice input

The existing explanation ("we used native Web Speech APIs to avoid network latency during
the demo; the architecture is designed for Bhashini REST integration in Phase 2") is a good
answer and worth keeping. Bhashini integration is real work for marginal judging benefit.

- [x] **Level:** leave the implementation as-is, but have the actual Bhashini endpoint
      names and auth flow on the roadmap slide, so the answer sounds researched rather
      than improvised.

---

## Tier 3 — Deployment and Deliverables

**Effort: ~1.5 days.**

### 3.1 Deploy both services

Backend URL is hardcoded at `statutory-rule-engine.ts:206`.

- [ ] Replace with `process.env.RAG_BACKEND_URL`, defaulting to localhost
- [ ] Frontend to Vercel
- [ ] Python service to Render or Railway
- [ ] **Level:** a live URL judges can open on their own phone. Disproportionately persuasive.

### 3.2 Repository hygiene

Current history is a single commit reading `Initial commit from Create Next App`, and the
Python service is not under version control at all.

- [ ] Single repo at the project root containing both services
- [ ] Real `README.md` with architecture diagram and setup steps
- [ ] MIT license
- [ ] Meaningful commit messages from here on

Do **not** fabricate backdated commits. The work in this plan will produce a real history.

### 3.3 Reconcile the standalone demo

`ip_sakti_demo_and_flow.html` (58 KB) at the project root is a separate artifact from the
Next.js app.

- [ ] **Level:** verify it still matches current app behaviour, or delete it. A judge
      finding two divergent versions will ask which one is real.

### 3.4 Deck and video

- [ ] **10-slide pitch deck.** Lead with the Sec 3(p) domain insight, **not** the tech
      stack — the Ayush jury cares that you understand *why* Ayurvedic patents fail.
      Give the eval number and the citation-rejection counter their own slide.
- [ ] **1-minute demo video.** Hindi query → Sec 3(p) rejection → DPDP scrubbing →
      citation vault → prior-art knowledge graph.
- [ ] Both `.env` files configured: `frontend/.env.local`, `gemini-fallback-service/.env`

---

## Suggested Sequencing

Assuming roughly six days and a full team:

| Day | Work | Allocation |
|---|---|---|
| 1 | All of Tier 0; begin ontology + formulation expansion | 1 dev on Tier 0, 3 on data |
| 2–3 | Data expansion continues; statute ingestion; citation validator | 3 on data, 1 on validator |
| 4 | Jurisdiction diff + adversarial examiner made real; expand eval to 30 cases | 2 dev, 1 on eval |
| 5 | Run eval, fix what it exposes, deploy both services | all |
| 6 | Deck, video, README; rehearse the demo end-to-end twice | all |

---

## Live Demo Checklist

- [ ] `cd gemini-fallback-service && python main.py`
- [ ] `cd frontend && npm run dev`
- [ ] **Step 1:** Query a known admixture — *"Haridra and Maricha for joint pain"*
- [ ] **Step 2:** Highlight DPDP scrubbing in the loading state
- [ ] **Step 3:** Show the verdict — barred under Section 3(p)
- [ ] **Step 4:** Open the citation vault; show verified-vs-rejected counter
- [ ] **Step 5:** Show the prior-art knowledge graph
- [ ] **Step 6 (new):** Let a judge type their own herb — this now works because of Tier 1.1

---

## Talking Points for Judge Questions

Emphasise these three, in this order:

1. **Deep domain expertise.** Name the codes out loud: Section 3(p), Section 3(e),
   Biological Diversity Act 2023 (NBA Form III), WIPO GRATK Article 3. Showing you
   understand the specific legal barriers to Ayurvedic patenting proves you understand the
   Ministry's actual problem.
2. **Verified citations, not generated ones.** After task 1.2 you can say truthfully that
   every statutory citation is validated against a hashed corpus and hallucinated ones are
   rejected before display. This is the strongest defensible claim in the project.
3. **Production-grade backend.** Not "we used an LLM" — an API key load balancer that
   handles 429s, quota exhaustion, and automatic key rotation with zero downtime.

### Honest framing for anything still simulated

If a feature remains hardcoded at submission time, label it in the UI as a Phase 2
prototype **before** a judge asks. Volunteering the limitation reads as engineering
maturity; being caught reads as overselling.

---

## Priority Summary

| Priority | Item | Effort | Effect |
|---|---|---|---|
| **P0** | Tier 0 integrity fixes | 3 h | Removes findings that actively damage credibility |
| **P0** | 1.2 Citation validator | 1 d | Makes the project's central claim true and demoable |
| **P0** | 1.1 Data scale | 2–3 d | Removes the most likely live-demo failure |
| **P1** | 1.3 Real statute ingestion | 1 d | Turns a lookup table into actual retrieval |
| **P1** | 1.4 Run the eval | 0.5 d | Gives you a hard number to present |
| **P2** | Tier 2 de-faking | 1.5 d | Removes questions you currently cannot answer |
| **P2** | Tier 3 deploy + deliverables | 1.5 d | Table stakes currently missing |

**Tier 0 + Tier 1 is the difference between an impressive prototype and a defensible
submission.** Start with 1.2 — it is self-contained, highest technical value, and it makes
the central claim true.
