"""
Test script for the Gemini Fallback Chain.

Usage:
    cd gemini-fallback-service
    python test_chain.py

Tests the fallback chain directly (no FastAPI server needed).
Requires a .env file with at least one valid GEMINI_API_KEYS entry.
"""

import asyncio
import logging
from dotenv import load_dotenv

# Load .env before importing config
load_dotenv()

from config import get_settings
from key_manager import KeyManager
from fallback_chain import GeminiFallbackChain, AllKeysExhaustedError

# Configure logging for test output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(message)s",
    datefmt="%H:%M:%S",
)


def print_header(text: str):
    """Print a formatted section header."""
    print(f"\n{'━' * 60}")
    print(f"  {text}")
    print(f"{'━' * 60}")


def print_result(result: dict):
    """Print a formatted success result."""
    print(f"  ✅ Success!")
    print(f"  Model     : {result['model']}")
    print(f"  Key Used  : {result['key_used']}")
    print(f"  Attempts  : {result['attempts']}")
    print(f"  Latency   : {result['latency_ms']:.0f}ms")
    text = result.get("text", "")
    if len(text) > 200:
        print(f"  Response  : {text[:200]}...")
    else:
        print(f"  Response  : {text}")
    if result.get("usage"):
        print(f"  Tokens    : {result['usage']}")
    if result.get("finish_reason"):
        print(f"  Finish    : {result['finish_reason']}")


def create_chain() -> tuple[KeyManager, GeminiFallbackChain]:
    """Create a fresh KeyManager + GeminiFallbackChain for testing."""
    settings = get_settings()
    km = KeyManager(
        api_keys=settings.GEMINI_API_KEYS,
        max_retries_per_key=settings.MAX_RETRIES_PER_KEY,
        cooldown_seconds=settings.KEY_COOLDOWN_SECONDS,
    )
    return km, GeminiFallbackChain(km)


async def test_basic_generation():
    """Test 1: Simple content generation."""
    print_header("Test 1: Basic Content Generation")
    _, chain = create_chain()

    try:
        result = await chain.generate_content(
            prompt="What is the capital of France? Answer in one sentence.",
        )
        print_result(result)
        return True
    except AllKeysExhaustedError as e:
        print(f"  ❌ All keys exhausted: {e}")
        for err in e.errors:
            print(f"     Key {err['key']}: {err['error']}")
        return False


async def test_with_system_instruction():
    """Test 2: Generation with system instruction and config."""
    print_header("Test 2: System Instruction + Config")
    _, chain = create_chain()

    try:
        result = await chain.generate_content(
            prompt="Explain quantum computing",
            system_instruction="You are a helpful teacher. Explain concepts simply in 2-3 sentences.",
            temperature=0.7,
            max_output_tokens=200,
        )
        print_result(result)
        return True
    except AllKeysExhaustedError as e:
        print(f"  ❌ All keys exhausted: {e}")
        return False


async def test_streaming():
    """Test 3: Streaming generation."""
    print_header("Test 3: Streaming Generation")
    _, chain = create_chain()

    try:
        print("  Streaming: ", end="", flush=True)
        async for chunk in chain.generate_content_stream(
            prompt="Write a haiku about programming.",
        ):
            if chunk.get("text"):
                print(chunk["text"], end="", flush=True)
            if chunk.get("is_final"):
                print(
                    f"\n  ✅ Stream complete "
                    f"({chunk.get('total_chunks', 0)} chunks, "
                    f"key: {chunk['key_used']})"
                )
        return True
    except AllKeysExhaustedError as e:
        print(f"\n  ❌ All keys exhausted: {e}")
        return False


async def test_model_override():
    """Test 4: Using a specific model override."""
    print_header("Test 4: Model Override")
    _, chain = create_chain()

    try:
        result = await chain.generate_content(
            prompt="Say hello in Japanese. One word only.",
            model="gemini-2.0-flash",
            max_output_tokens=50,
        )
        print_result(result)
        return True
    except AllKeysExhaustedError as e:
        print(f"  ❌ All keys exhausted: {e}")
        return False


async def test_key_health_stats():
    """Test 5: Check key health statistics."""
    print_header("Test 5: Key Health Stats")
    km, _ = create_chain()

    stats = km.get_all_key_stats()
    print(f"  Total keys: {km.total_keys}")
    print(f"  Active keys: {km.active_keys_count}")
    print()
    for s in stats:
        print(
            f"  Key {s['index']} ({s['masked_key']}): "
            f"{s['status']} │ "
            f"reqs={s['total_requests']} "
            f"ok={s['total_successes']} "
            f"fail={s['total_failures']} "
            f"rate={s['success_rate_pct']}%"
        )
    return True


async def main():
    """Run all tests sequentially."""
    settings = get_settings()

    print("\n🔗 Gemini Fallback Chain — Test Suite")
    print(f"   Keys configured : {len(settings.GEMINI_API_KEYS)}")
    print(f"   Default model   : {settings.GEMINI_DEFAULT_MODEL}")
    print(f"   Max retries/key : {settings.MAX_RETRIES_PER_KEY}")
    print(f"   Key cooldown    : {settings.KEY_COOLDOWN_SECONDS}s")

    if not settings.GEMINI_API_KEYS:
        print("\n  ⚠️  No API keys configured! Create a .env file first.")
        print("     Copy .env.example to .env and add your keys.")
        return

    results = {
        "Basic Generation": await test_basic_generation(),
        "System Instruction": await test_with_system_instruction(),
        "Streaming": await test_streaming(),
        "Model Override": await test_model_override(),
        "Health Stats": await test_key_health_stats(),
    }

    print_header("Test Results Summary")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    for name, passed_test in results.items():
        icon = "✅" if passed_test else "❌"
        print(f"  {icon} {name}")

    print(f"\n  Result: {passed}/{total} tests passed")


if __name__ == "__main__":
    asyncio.run(main())
