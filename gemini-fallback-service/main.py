"""
Gemini Fallback Chain API — FastAPI Server.

Exposes the multilayer fallback chain as a REST API with:
  POST /generate          → Generate content (with automatic key fallback)
  POST /generate/stream   → Stream content (SSE with automatic key fallback)
  GET  /health            → Key health dashboard & monitoring
  GET  /                  → API info & docs link
"""

import logging
import json
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import cachetools

from config import get_settings
from key_manager import KeyManager
from fallback_chain import GeminiFallbackChain, AllKeysExhaustedError
from rag_engine import RAGEngine

# ── Logging Configuration ────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)-28s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("gemini-fallback")

# ── Robust TTL Cache for RAG ─────────────────────────────
# Cache up to 200 items, each expiring after 10 minutes (600 seconds)
rag_cache = cachetools.TTLCache(maxsize=200, ttl=600)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Application Lifespan
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and teardown the fallback chain on server start/stop."""
    settings = get_settings()

    if not settings.GEMINI_API_KEYS:
        raise RuntimeError(
            "No Gemini API keys configured! "
            "Set GEMINI_API_KEYS in your .env file (comma-separated)."
        )

    app.state.key_manager = KeyManager(
        api_keys=settings.GEMINI_API_KEYS,
        max_retries_per_key=settings.MAX_RETRIES_PER_KEY,
        cooldown_seconds=settings.KEY_COOLDOWN_SECONDS,
    )
    app.state.chain = GeminiFallbackChain(app.state.key_manager)
    
    rag = RAGEngine()
    rag._initialize_collection() # Pre-load model on startup instead of lazily
    app.state.rag_engine = rag

    logger.info("━" * 55)
    logger.info("🚀 Gemini Fallback Chain API — ONLINE")
    logger.info(f"   Keys loaded      : {app.state.key_manager.total_keys}")
    logger.info(f"   Default model     : {settings.GEMINI_DEFAULT_MODEL}")
    logger.info(f"   Max retries/key   : {settings.MAX_RETRIES_PER_KEY}")
    logger.info(f"   Key cooldown      : {settings.KEY_COOLDOWN_SECONDS}s")
    logger.info(f"   Request timeout   : {settings.REQUEST_TIMEOUT_MS}ms")
    logger.info(f"   Listening on      : {settings.HOST}:{settings.PORT}")
    logger.info("━" * 55)

    yield

    logger.info("Shutting down Gemini Fallback Chain API...")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  FastAPI Application
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app = FastAPI(
    title="Gemini Fallback Chain API",
    description=(
        "Production-grade multilayer fallback chain for Google Gemini API "
        "with automatic key rotation, health monitoring, and streaming support."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for unexpected errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred."}
    )

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Dependencies
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_chain(request: Request) -> GeminiFallbackChain:
    return request.app.state.chain

def get_key_manager(request: Request) -> KeyManager:
    return request.app.state.key_manager

def get_rag_engine(request: Request) -> RAGEngine:
    return request.app.state.rag_engine


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Request / Response Models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class GenerateRequest(BaseModel):
    """Request body for content generation."""
    prompt: str = Field(
        ...,
        description="The prompt to send to Gemini",
        min_length=1,
        examples=["Explain quantum computing in simple terms"],
    )
    retrieval_query: Optional[str] = Field(
        None,
        description="Optional isolated query used only for RAG vector search, instead of using the entire prompt.",
    )
    model: Optional[str] = Field(
        None,
        description="Model override (e.g. gemini-2.0-flash, gemini-1.5-pro)",
    )
    system_instruction: Optional[str] = Field(
        None,
        description="System instruction to guide the model's behavior",
    )
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_output_tokens: Optional[int] = Field(None, ge=1, le=65536)
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(None, ge=1)
    stream: bool = Field(False, description="Enable streaming response (use POST /generate/stream instead)")


class GenerateResponse(BaseModel):
    """Response body for content generation."""
    text: str
    model: str
    key_used: str
    attempts: int
    latency_ms: float
    finish_reason: Optional[str] = None
    usage: Optional[dict] = None
    cache_hit: Optional[bool] = False


class HealthResponse(BaseModel):
    """Response body for health check."""
    status: str
    total_keys: int
    active_keys: int
    default_model: str
    keys: list[dict]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  API Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, chain: GeminiFallbackChain = Depends(get_chain)):
    """Generate content using Gemini with automatic key fallback.

    If one API key fails (rate limit, quota, auth error, timeout, server error),
    the system automatically tries the next available key in the chain.
    """
    if request.stream:
        return await generate_stream(request, chain=chain)

    import hashlib
    cache_key = hashlib.sha256(f"gen_{request.prompt}".encode('utf-8')).hexdigest()
    if cache_key in rag_cache:
        logger.info(f"Generate Cache HIT for prompt hash: {cache_key}")
        cached_result = rag_cache[cache_key].copy()
        cached_result["cache_hit"] = True
        return GenerateResponse(**cached_result)

    try:
        result = await chain.generate_content(
            prompt=request.prompt,
            model=request.model,
            system_instruction=request.system_instruction,
            temperature=request.temperature,
            max_output_tokens=request.max_output_tokens,
            top_p=request.top_p,
            top_k=request.top_k,
        )
        
        # Save to TTLCache only for healthy responses
        finish_reason = result.get("finish_reason", "")
        if "MAX_TOKENS" not in str(finish_reason) and len(result.get("text", "").strip()) > 50:
            rag_cache[cache_key] = result
        
        return GenerateResponse(**result)

    except AllKeysExhaustedError as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": str(e),
                "attempts": e.attempts,
                "errors_log": e.errors,
                "latency_ms": e.latency_ms,
            },
        )


@app.post("/generate_rag", response_model=GenerateResponse)
async def generate_rag(
    request: GenerateRequest,
    chain: GeminiFallbackChain = Depends(get_chain),
    rag: RAGEngine = Depends(get_rag_engine)
):
    """
    RAG-enabled endpoint.
    Retrieves semantic chunks from ChromaDB using the incoming prompt (query),
    injects them into the system_instruction, and delegates to Gemini fallback chain.
    """
    import hashlib
    cache_key = hashlib.sha256(request.prompt.encode('utf-8')).hexdigest()
    if cache_key in rag_cache:
        logger.info(f"RAG Cache HIT for prompt hash: {cache_key}")
        cached_result = rag_cache[cache_key].copy()
        cached_result["cache_hit"] = True
        return GenerateResponse(**cached_result)

    # Search ChromaDB asynchronously with a hard cap so RAG never stalls the request
    search_query = request.retrieval_query if request.retrieval_query else request.prompt
    try:
        retrieved_chunks = await asyncio.wait_for(
            rag.search_async(query=search_query[:1000], top_k=3, distance_threshold=1.5),
            timeout=5.0,
        )
    except asyncio.TimeoutError:
        logger.warning("RAG search timed out after 5s — proceeding without context")
        retrieved_chunks = []
    formatted_context = rag.format_context_for_prompt(retrieved_chunks)
    
    # Prepend context to existing system instruction (ample room for context + schema)
    base_instruction = request.system_instruction or "You are a helpful AI assistant."
    augmented_instruction = f"{base_instruction}\n\n{formatted_context}"
    if len(augmented_instruction) > 12000:
        augmented_instruction = augmented_instruction[:12000]
    prompt = request.prompt[:4000]
    
    try:
        result = await chain.generate_content(
            prompt=prompt,
            model=request.model,
            system_instruction=augmented_instruction,
            temperature=request.temperature,
            max_output_tokens=request.max_output_tokens,
            top_p=request.top_p,
            top_k=request.top_k,
        )

        # Save to TTLCache only for healthy, non-truncated responses
        finish_reason = result.get("finish_reason", "")
        if "MAX_TOKENS" not in str(finish_reason) and len(result.get("text", "").strip()) > 50:
            rag_cache[cache_key] = result
        else:
            logger.warning("Skipping cache for truncated or short response")

        return GenerateResponse(**result)

    except AllKeysExhaustedError as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": str(e),
                "attempts": e.attempts,
                "errors_log": e.errors,
                "latency_ms": e.latency_ms,
            },
        )


@app.post("/generate/stream")
async def generate_stream(request: GenerateRequest, chain: GeminiFallbackChain = Depends(get_chain)):
    """Stream generated content using Server-Sent Events (SSE).

    Each chunk is sent as a JSON object in SSE format:
      data: {"text": "...", "key_used": "...xY4z", "chunk_index": 1, "is_final": false}

    The final chunk has `is_final: true` and includes `total_chunks`.
    """
    async def event_generator():
        try:
            async for chunk in chain.generate_content_stream(
                prompt=request.prompt,
                model=request.model,
                system_instruction=request.system_instruction,
                temperature=request.temperature,
                max_output_tokens=request.max_output_tokens,
                top_p=request.top_p,
                top_k=request.top_k,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        except AllKeysExhaustedError as e:
            error_data = {
                "error": str(e),
                "attempts": e.attempts,
                "errors_log": e.errors,
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/health", response_model=HealthResponse)
async def health(key_manager: KeyManager = Depends(get_key_manager)):
    """Health check and key status dashboard.

    Returns the status of each API key including:
    - Current state (active/cooldown/exhausted)
    - Request counts and success rates
    - Remaining cooldown time
    - Last error message
    """
    settings = get_settings()
    active = key_manager.active_keys_count
    total = key_manager.total_keys

    if active == total:
        status = "healthy"
    elif active > 0:
        status = "degraded"
    else:
        status = "critical"

    return HealthResponse(
        status=status,
        total_keys=total,
        active_keys=active,
        default_model=settings.GEMINI_DEFAULT_MODEL,
        keys=key_manager.get_all_key_stats(),
    )


@app.get("/")
async def root():
    """Root endpoint — API info and quick reference."""
    return {
        "service": "Gemini Fallback Chain API",
        "version": "1.0.0",
        "description": "Multilayer fallback chain for Google Gemini with automatic key rotation",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "POST /generate": "Generate content with automatic key fallback",
            "POST /generate_rag": "Generate content using RAG with semantic search",
            "POST /generate/stream": "Stream content via SSE with key fallback",
            "GET /health": "Key health dashboard and monitoring",
        },
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Direct Run Support
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="warning",
    )
