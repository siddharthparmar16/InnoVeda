import logging
import pathlib
import asyncio
import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger("rag_engine")

DB_DIR = pathlib.Path("./chroma_db")

class RAGEngine:
    def __init__(self):
        logger.info("Initializing RAG Engine and connecting to ChromaDB...")
        self.client = chromadb.PersistentClient(path=str(DB_DIR))
        self.ef = None
        self.collection = None
        self._initialized = False

    def _initialize_collection(self):
        """Lazy load the embedding model and get the collection."""
        if self._initialized:
            return

        logger.info("Lazy loading SentenceTransformer embedding model...")
        try:
            self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            self.collection = self.client.get_collection(
                name="ip_sakti_legal_chunks",
                embedding_function=self.ef
            )
        except Exception as e:
            logger.warning(f"Collection 'ip_sakti_legal_chunks' not found or error loading model: {e}")
            self.collection = None
        
        self._initialized = True

    def search(self, query: str, top_k: int = 3, distance_threshold: float = 1.5) -> list[dict]:
        """
        Searches the ChromaDB for the most relevant statutory chunks based on the query.
        Returns a list of metadata dictionaries.
        """
        self._initialize_collection()
        
        if not self.collection:
            logger.error("ChromaDB collection is not initialized.")
            return []

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            valid_metadatas = []
            
            # The results object contains lists of lists for documents, metadatas, distances, etc.
            if results and results.get("metadatas") and len(results["metadatas"]) > 0:
                metadatas = results["metadatas"][0]
                distances = results.get("distances", [[0] * len(metadatas)])[0]
                
                # Filter by distance
                for meta, dist in zip(metadatas, distances):
                    if dist <= distance_threshold:
                        valid_metadatas.append(meta)
                    else:
                        logger.debug(f"Filtered out chunk due to high distance: {dist:.2f}")
                        
                return valid_metadatas
            
            return []
            
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return []

    async def search_async(self, query: str, top_k: int = 3, distance_threshold: float = 1.5) -> list[dict]:
        """
        Asynchronous wrapper for searching ChromaDB to prevent blocking the event loop.
        """
        return await asyncio.to_thread(self.search, query, top_k, distance_threshold)

    def format_context_for_prompt(self, metadatas: list[dict], max_chars_per_chunk: int = 600) -> str:
        """
        Formats the retrieved metadatas into a readable string to inject into the LLM prompt.
        SPEED: truncates long statutory texts so the LLM prompt stays small and fast.
        """
        if not metadatas:
            return "No relevant statutory context found."

        def _clip(v, n=max_chars_per_chunk):
            s = str(v or "")
            return s if len(s) <= n else s[:n] + "…"

        context_parts = ["--- RELEVANT STATUTORY CONTEXT ---"]
        for meta in metadatas:
            part = f"""
Act: {meta.get('act_title')} ({meta.get('jurisdiction')})
Section: {meta.get('section_number')} - {meta.get('heading')}
Text: {_clip(meta.get('raw_text'))}
Explanation: {_clip(meta.get('explanation'))}
Citation: {meta.get('citation_code')}
"""
            context_parts.append(part.strip())

        context_parts.append("----------------------------------")
        return "\n\n".join(context_parts)

# Expose a default instance, but we will move to DI in FastAPI.
rag_engine = RAGEngine()
