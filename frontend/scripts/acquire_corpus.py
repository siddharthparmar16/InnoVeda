import csv
import hashlib
import pathlib
import time
import requests
from datetime import datetime

# Setup directories
OUT_DIR = pathlib.Path("corpus/raw")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# List of essential IP statutes (Tier 1 & 3 from plan)
CORPUS_MANIFEST = [
    {
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1392/1/197039.pdf",
        "dest": "tier1_ip/patents_act_1970.pdf",
        "title": "Patents Act, 1970 (as amended)",
        "authority": "India Code",
        "version_date": "2024-01-01"
    },
    {
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2046/1/200318.pdf",
        "dest": "tier1_ip/biological_diversity_act_2002.pdf",
        "title": "Biological Diversity Act, 2002",
        "authority": "India Code",
        "version_date": "2003-02-05"
    },
    {
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2046/2/202310.pdf",  # Placeholder URL for amendment
        "dest": "tier1_ip/biological_diversity_amendment_2023.pdf",
        "title": "Biological Diversity (Amendment) Act, 2023",
        "authority": "India Code",
        "version_date": "2023-08-03"
    },
    {
        "url": "https://www.wipo.int/edocs/mdocs/tk/en/wipo_diplomatic_conference_gratk/wipo_diplomatic_conference_gratk_2024.pdf", # Placeholder URL
        "dest": "tier3_intl/wipo_gratk_2024.pdf",
        "title": "WIPO Treaty on IP, Genetic Resources & Associated TK",
        "authority": "WIPO",
        "version_date": "2024-05-24"
    }
]

def fetch(url, dest_str, retries=3):
    dest = OUT_DIR / dest_str
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    # If file exists, just return hash
    if dest.exists():
        with open(dest, "rb") as f:
            content = f.read()
            digest = hashlib.sha256(content).hexdigest()
        return {"path": str(dest), "sha256": digest, "bytes": len(content), "status": "CACHED"}

    for attempt in range(retries):
        try:
            print(f"Downloading {url} ...")
            r = requests.get(url, timeout=30, headers={"User-Agent": "SIH26045-research/1.0"})
            r.raise_for_status()
            dest.write_bytes(r.content)
            digest = hashlib.sha256(r.content).hexdigest()
            time.sleep(2)  # Be polite to government servers
            return {"path": str(dest), "sha256": digest, "bytes": len(r.content), "status": "DOWNLOADED"}
        except Exception as e:
            if attempt == retries - 1:
                return {"path": str(dest), "error": str(e), "status": "FAILED"}
            time.sleep(2 ** attempt)

def main():
    manifest_path = OUT_DIR / "manifest.csv"
    print(f"Starting corpus acquisition. Tracking manifest at {manifest_path}")
    
    results = []
    download_date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    for doc in CORPUS_MANIFEST:
        res = fetch(doc["url"], doc["dest"])
        doc_entry = {
            "filename": doc["dest"],
            "official_title": doc["title"],
            "issuing_authority": doc["authority"],
            "version_date": doc["version_date"],
            "source_url": doc["url"],
            "download_date": download_date,
            "sha256": res.get("sha256", "ERROR"),
            "status": res.get("status", "ERROR")
        }
        results.append(doc_entry)
        print(f"[{doc_entry['status']}] {doc['dest']} - {doc_entry['sha256'][:10]}...")

    # Write manifest.csv
    with open(manifest_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "filename", "official_title", "issuing_authority", 
            "version_date", "source_url", "download_date", "sha256", "status"
        ])
        writer.writeheader()
        for row in results:
            writer.writerow(row)

    print("Data acquisition complete.")

if __name__ == "__main__":
    main()
