import logging
import pathlib
import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger("rag_engine")

DB_DIR = pathlib.Path("./chroma_db")

class RAGEngine:
    def __init__(self):
        logger.info("Initializing RAG Engine and connecting to ChromaDB...")
        self.client = chromadb.PersistentClient(path=str(DB_DIR))
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        
        try:
            self.collection = self.client.get_collection(
                name="ip_sakti_legal_chunks",
                embedding_function=self.ef
            )
        except Exception as e:
            logger.warning("Collection 'ip_sakti_legal_chunks' not found. Ensure init_vector_db.py has been run.")
            self.collection = None

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        """
        Searches the ChromaDB for the most relevant statutory chunks based on the query.
        Returns a list of metadata dictionaries.
        """
        if not self.collection:
            logger.error("ChromaDB collection is not initialized.")
            return []

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            # The results object contains lists of lists for documents, metadatas, distances, etc.
            if results and results.get("metadatas") and len(results["metadatas"]) > 0:
                # Return the metadatas for the first query
                return results["metadatas"][0]
            
            return []
            
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return []

    def format_context_for_prompt(self, metadatas: list[dict]) -> str:
        """
        Formats the retrieved metadatas into a readable string to inject into the LLM prompt.
        """
        if not metadatas:
            return "No relevant statutory context found."
            
        context_parts = ["--- RELEVANT STATUTORY CONTEXT ---"]
        for meta in metadatas:
            part = f"""
Act: {meta.get('act_title')} ({meta.get('jurisdiction')})
Authority: {meta.get('authority', 'N/A')}
Version Tag: {meta.get('version_tag', 'N/A')} | Amendment: {meta.get('amendment_year', 'N/A')}
Section: {meta.get('section_number')} - {meta.get('heading')}
Text: {meta.get('raw_text')}
Explanation: {meta.get('explanation')}
Severity: {meta.get('severity')}
Citation: {meta.get('citation_code')}
SHA-256 Integrity: {meta.get('sha256_hash', 'N/A')}
"""
            context_parts.append(part.strip())
            
        context_parts.append("----------------------------------")
        return "\n\n".join(context_parts)

# Singleton instance
rag_engine = RAGEngine()
