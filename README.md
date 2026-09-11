# InnoVeda (IP-SAKTI Sahayak)
### 🏛️ Intelligent Ayurveda IP & Statutory Guidance System
**Smart India Hackathon (SIH 2026)**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-purple?style=flat)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

**InnoVeda (IP-SAKTI Sahayak)** is an enterprise-grade, statutory-grounded Intellectual Property intelligence platform designed to protect, validate, and analyze Ayurvedic formulations and traditional botanical knowledge against global patent claims.

It bridges classical Ayurvedic pharmacology (*Charaka Samhita*, *Sushruta Samhita*, *Ashtanga Hridaya*, *Rasa Tarangini*) and modern patent statutory frameworks across four major jurisdictions:
- **India (IPO)**: Indian Patents Act 1970 — Section 3(p) [Traditional Knowledge], Section 3(d) [Incremental efficacy / Polymorphs], Section 3(e) [Mere admixture].
- **European Union (EPO)**: EPC Article 53(a) [Public order & morality] & Article 56 [Inventive step].
- **United States (USPTO)**: 35 U.S.C. § 101 [Subject matter eligibility & natural products doctrine] & 35 U.S.C. § 103 [Non-obviousness].
- **International (WIPO/PCT)**: PCT Rule 39 [Prior art searching & biological heritage requirements].

---

## 🌟 Key Capabilities & Features

### 1. 🌿 Classical Sanskrit Botanical Resolver
- Transliteration and phonetic normalization across Sanskrit, Hindi, and botanical binomial nomenclature (e.g., *Haridra* $\rightarrow$ *Curcuma longa*, *Ashwagandha* $\rightarrow$ *Withania somnifera*).
- Resolves botanical components, traditional extraction media (*Sneha Kalpana*, *Kashayam*), and traditional therapeutic indications.

### 2. ⚖️ Deterministic Statutory Rule Engine
- **Non-hallucinatory evaluation**: Computes statutory admissibility scores based on exact legal sections before LLM synthesis.
- Evaluates non-patentable combinations (*Section 3(p)*), synergistic efficacy validation (*Section 3(d)*), and biological source disclosure prerequisites (*Section 6/National Biodiversity Authority clearance*).

### 3. 🧠 Multilayer Resilient Fallback Engine & RAG
- **FastAPI Vector RAG Backend**: Connected to ChromaDB loaded with Ayurvedic jurisprudence and TKDL-aligned prior art.
- **Zero-Downtime Gemini Key Rotation**: Automatically rotates across API keys with exponential backoff and circuit-breaking when quota limits or rate limits are encountered.

### 4. 📊 Multi-Jurisdiction Statutory Matrix
- Interactive cross-jurisdiction comparison matrix comparing claims across IPO, USPTO, EPO, and WIPO.
- Prior art citation graph with graphical dependency trees and TKDL citation tags.

### 5. 📑 Multilingual Statutory Legal Memo Generator
- Dynamic generation of legal memos in English and 10+ Indian regional languages (Hindi, Gujarati, Tamil, Telugu, Marathi, Bengali, Kannada, Malayalam, etc.).
- One-click print-ready PDF export formatted for Patent Examiner office actions.

### 6. 🛡️ Prestige Obsidian & Gold Examiner Interface
- Built with a curated obsidian and champagne gold aesthetic tailored for patent examiners, patent attorneys, IP facilitators, and Ayurvedic researchers.
- Seamless authentication flow: Landing page $\rightarrow$ Dual-pane Auth gateway $\rightarrow$ Instant Demo Examiner Access for hackathon evaluation.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │      Client Browser       │
                                  │ (Next.js 14 Prestige UI)  │
                                  └─────────────┬─────────────┘
                                                │
                                    HTTP / WebSocket / SSE
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
          ┌──────────────────────────┐                    ┌──────────────────────────┐
          │     Next.js Frontend     │                    │  Python FastAPI Service  │
          │    (Port 3000 / 3001)    │                    │       (Port 8000)        │
          ├──────────────────────────┤                    ├──────────────────────────┤
          │ • Landing & Auth Gateway │                    │ • Key Rotation Manager   │
          │ • Statutory Rule Engine  │◄── RAG Requests ──►│ • ChromaDB Vector Search │
          │ • Botanical Resolver     │                    │ • SentenceTransformers   │
          │ • PDF Memo Generator     │                    │ • Gemini Fallback Chain  │
          └──────────────────────────┘                    └──────────────────────────┘
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **Python**: 3.10+ or 3.11+
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/siddharthparmar16/InnoVeda.git
cd InnoVeda
```

### 2. Setup and Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at **`http://localhost:3000`** (or `http://localhost:3001`).

### 3. Setup and Run the Gemini Fallback & RAG Service
```bash
cd ../gemini-fallback-service
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEYS (comma-separated)

python main.py
```
The backend service will start at **`http://localhost:8000`**. Check health at `http://localhost:8000/health`.

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
The frontend is optimized for zero-configuration deployment on **Vercel**:
1. Fork or push your code to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Next.js**.
5. Deploy!

### Backend Deployment (Render / Cloud Run / Railway)
The Python RAG fallback backend can be deployed using Docker or native Python runtimes:
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 👥 Contributors & Acknowledgements
- Developed for **Smart India Hackathon 2026**
- Traditional Knowledge references derived from TKDL, CCARS, and classical Ayurvedic Ayurvedic Pharmacopoeia of India (API) standards.