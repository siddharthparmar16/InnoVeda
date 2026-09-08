import json
import hashlib
import pathlib
import logging
import chromadb
from chromadb.utils import embedding_functions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_vector_db")

# Paths
CORPUS_PATH = pathlib.Path("../frontend/src/data/corpus/legal_statutory_corpus.json")
DB_DIR = pathlib.Path("./chroma_db")

def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def main():
    if not CORPUS_PATH.exists():
        logger.error(f"Corpus file not found: {CORPUS_PATH}")
        return

    logger.info("Initializing ChromaDB persistent client...")
    client = chromadb.PersistentClient(path=str(DB_DIR))
    
    # Use sentence-transformers embedding function
    logger.info("Loading embedding function (sentence-transformers)...")
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

    # Get or create collection
    collection = client.get_or_create_collection(
        name="ip_sakti_legal_chunks",
        embedding_function=sentence_transformer_ef
    )

    logger.info("Reading version-tracked corpus JSON...")
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        acts = json.load(f)

    documents = []
    metadatas = []
    ids = []

    for act in acts:
        act_id = act.get("act_id")
        act_title = act.get("act_title")
        jurisdiction = act.get("jurisdiction")
        authority = act.get("authority", "")
        act_version_tag = act.get("version_tag", "")
        amendment_year = str(act.get("amendment_year", ""))
        
        for section in act.get("sections", []):
            sec_id = section.get("section_id")
            raw_text = section.get("text", "")
            heading = section.get("heading", "")
            explanation = section.get("explanation", "")
            
            # Combine heading, text, and explanation into a rich document for embedding
            content = f"{heading}\n\n{raw_text}\n\nExplanation: {explanation}\nAuthority: {authority}"
            sha256_hash = compute_sha256(raw_text)
            
            meta = {
                "act_id": act_id,
                "act_title": act_title,
                "jurisdiction": jurisdiction,
                "section_id": sec_id,
                "section_number": section.get("section_number"),
                "heading": heading,
                "severity": section.get("severity"),
                "citation_code": section.get("citation_code"),
                "raw_text": raw_text,
                "explanation": explanation,
                "sha256_hash": sha256_hash,
                "version_tag": section.get("version_tag", act_version_tag),
                "gazette_ref": section.get("gazette_ref", ""),
                "authority": authority,
                "amendment_year": amendment_year
            }
            
            documents.append(content)
            metadatas.append(meta)
            ids.append(f"{act_id}_{sec_id}")

    if not documents:
        logger.warning("No documents found to index.")
        return

    logger.info(f"Adding {len(documents)} version-tracked statutory chunks to ChromaDB...")
    
    # Upsert handles inserting new records or updating existing ones with the same ID
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    logger.info("Vector DB initialization complete with cryptographic hashes & version metadata! 🚀")

if __name__ == "__main__":
    main()
