import re
import json
import pathlib

OUT_DIR = pathlib.Path("corpus/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Regex to capture Section Number (e.g. "3(p)", "6(1)") and Heading, ignoring tokens.
SECTION_RE = re.compile(r"^\s*(?:Section\s+)?(\d+[a-zA-Z]?(?:\(\w+\))*)\.?\s+([^\n]+)", re.MULTILINE)

def split_sections(text: string, act_name: string, act_year: string, version_date: string):
    matches = list(SECTION_RE.finditer(text))
    chunks = []
    
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        
        section_id = m.group(1).strip()
        heading = m.group(2).strip()
        chunk_text = text[start:end].strip()
        
        # Validation Gate: Ensure chunk is not garbage
        if len(chunk_text) > 15:
            chunks.append({
                "act": act_name,
                "act_year": act_year,
                "section": section_id,
                "heading": heading,
                "text": chunk_text,
                "version_date": version_date,
                "citation": f"{act_name} {act_year}, s.{section_id}"
            })
            
    return chunks

# Example testing function
def test_parser():
    sample_text = """
    Section 3(p) Traditional knowledge not patentable
    An invention which in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components.
    
    Section 4 Inventions relating to atomic energy not patentable
    No patent shall be granted in respect of an invention relating to atomic energy.
    """
    
    chunks = split_sections(sample_text, "Patents Act", "1970", "2024-01-01")
    print(json.dumps(chunks, indent=2))
    
if __name__ == "__main__":
    test_parser()
