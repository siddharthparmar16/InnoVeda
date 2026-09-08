# IP-SAKTI Sahayak — Required Documents, Datasets & Files Checklist

> **Project Code:** SIH26045 | **Target:** Ministry of Ayush (Smart India Hackathon 2026)  
> **Goal:** Complete preparation inventory required before building full backend RAG pipeline & AI reasoning engine.

---

## 1. 📜 Legal Statutory Corpus Files (PDFs / TXT / JSON)

To power the RAG (Retrieval-Augmented Generation) vector database and citation engine, prepare clean digital copies of these statutory documents:

| # | Document / Act | File Name | Key Sections / Purpose | Priority |
|---|---|---|---|---|
| 1 | **Indian Patents Act, 1970** *(Amended 2024)* | `patents_act_1970.pdf` | **Sec 3(p)** (TK bar), **Sec 3(d)** (Efficacy), **Sec 3(e)** (Admixture), **Sec 10** | **CRITICAL** |
| 2 | **Biological Diversity Act, 2002** *(Amended 2023)* | `bda_act_2002.pdf` | **Sec 3, 4, 6** (Mandatory NBA approval prior to IP filing), Form III specs | **CRITICAL** |
| 3 | **WIPO GRATK Treaty (2024)** | `wipo_gratk_2024.pdf` | **Article 3** (Mandatory Disclosure of Genetic Resources & TK in PCT filings) | **HIGH** |
| 4 | **Drugs & Cosmetics Act, 1940 & Rules 1945** | `drugs_cosmetics_act_ayush.pdf` | **Rule 158 / 158A** (Proof of effectiveness for Ayurvedic/Siddha/Unani drugs) | **HIGH** |
| 5 | **PPV&FR Act, 2001** *(Protection of Plant Varieties)* | `ppvfr_act_2001.pdf` | Plant breeder rights & farmer variety registrations | **MEDIUM** |

---

## 2. 🌿 Botanical Taxonomy & Ayurveda Datasets (CSV / JSON)

To resolve multi-lingual queries and bridge classical Ayurvedic terms with modern botanical science:

| File Name | Format | Content & Schema | Source / Purpose |
|---|---|---|---|
| `ayush_botanical_synonyms.json` | JSON | `{"sanskrit_name": "Haridra", "hindi_name": "Haldi", "marathi_name": "Halad", "latin_name": "Curcuma longa L.", "plant_part": "Rhizome"}` | Maps regional Indian plant names to international botanical taxonomy. |
| `classical_formulations_index.json` | JSON | Prior art catalog of classical formulations (e.g. *Triphala*, *Trikatu*, *Dashamula*, *Chyawanprash*) listed in AFI/API. | Flags 100% classical recipes that trigger Section 3(p) product patent bar. |
| `tkdl_sample_corpus.json` | JSON | Key classical text references (*Charaka Samhita*, *Sushruta Samhita*, *Astanga Hridaya*) with verse/chapter numbers. | Enables exact citation tracing to ancient texts. |

---

## 3. ⚙️ Environment Configuration & API Keys (`.env.local`)

Configuration file for connecting backend services and AI models:

```env
# AI Models Key (Google Gemini API / Vertex AI)
GEMINI_API_KEY=your_gemini_api_key_here

# Vector Database (Qdrant / Pinecone / Chroma / Postgres PGVector)
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_COLLECTION=ip_sakti_legal_chunks

# App Environment
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 4. 📐 Structured Output Schemas (`/schemas/`)

Define strict TypeScript / JSON interfaces for AI reasoning outputs to avoid hallucinated legal advice:

```typescript
// verdict_schema.ts
export interface LegalVerdict {
  verdict: 'PATENTABLE' | 'NOT_PATENTABLE' | 'CONDITIONALLY_PATENTABLE';
  primary_reason: string;
  statutory_bars_triggered: {
    act: string;
    section: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  nba_approval_required: boolean;
  nba_form_required?: string; // e.g. "Form III"
  wipo_disclosure_mandatory: boolean;
  alternative_routes: {
    type: 'PROCESS_PATENT' | 'GEOGRAPHICAL_INDICATION' | 'TRADEMARK' | 'TRADE_SECRET';
    title: string;
    guidance: string;
  }[];
  citation_vault: {
    section_code: string;
    source_document: string;
    verifiable_sha256: string;
    exact_text_snippet: string;
  }[];
}
```

---

## 5. 🧪 Benchmark Evaluation Suite (`test_queries.json`)

Prepare a ground-truth dataset of 15–20 real-world formulation scenarios to test the accuracy of your AI reasoning engine:

1. **Pure Classical Combination:** *Haridra + Maricha for Joint Pain* (Expected: Barred under Sec 3(p)).
2. **Novel Process Extraction:** *Aqueous supercritical CO2 extract of Guduchi with 98% purity* (Expected: Process patentable under Sec 3(h) / Sec 3(p) exception).
3. **Synergistic Admixture:** *Ashwagandha + Curcumin + Synthetic Bio-enhancer* (Expected: Requires proof of synergy under Sec 3(e) + NBA approval under Sec 6).
4. **Geographical Specificity:** *Lakadong Turmeric High Curcumin Extract* (Expected: Recommend GI Tag + NBA Form III).

---

## 6. 📊 Hackathon Presentation & Demonstration Deliverables

For final submission and presentation to Ministry of Ayush judges:

- [x] **Interactive Prototype**: `ip_sakti_demo_and_flow.html` (Already Created!)
- [ ] **Pitch Deck (10-Slide PPTX)**: Covering Problem Statement, Solution, Tech Stack, SIH Alignment, and Future Roadmap.
- [ ] **1-Minute Demo Video Screen Recording**: Demonstrating full query-to-verdict lifecycle.
- [ ] **GitHub Repository**: Clean modular code with `README.md`, setup guide, and license.

---

### 🚀 Recommended Next Steps:
1. Gather the PDF files for **Patents Act 1970** and **Biological Diversity Act 2002** into a `/data/statutes/` folder.
2. Setup `.env.local` with your API Key.
3. Proceed with initializing backend RAG embeddings and API routes in Next.js!
