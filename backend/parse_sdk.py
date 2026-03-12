import os
import re
import json
import glob

SDK_ROOT = r"D:\Work\aegis-vee-mvp\Refence\3.1.0.sdk"
OUTPUT_FILE = r"D:\Work\aegis-vee-mvp\backend\data\sdk_metadata.json"

# Regex to match C function declarations
# This is a simplified regex and might need tuning
# Matches: ReturnType FunctionName(Args);
FUNC_PATTERN = re.compile(r'^\s*([a-zA-Z0-9_]+[\s\*]+)+([a-zA-Z0-9_]+)\s*\(([^;]*)\)\s*;', re.MULTILINE)

# Regex for Doxygen comments
COMMENT_PATTERN = re.compile(r'/\*\*([\s\S]*?)\*/')

def parse_header_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    functions = []
    
    # Find all function declarations
    # We iterate line by line to easier associate comments, or use a more complex approach
    # Let's try a split approach to handle comments better
    
    # Normalize newlines
    content = content.replace('\r\n', '\n')
    
    # Find all matches
    for match in FUNC_PATTERN.finditer(content):
        ret_type = match.group(1).strip()
        func_name = match.group(2).strip()
        args = match.group(3).strip()
        full_match = match.group(0).strip()
        start_index = match.start()
        
        # Look backwards for comments
        # We look for the last closing */ before this function
        preceding_text = content[:start_index].strip()
        doc = ""
        if preceding_text.endswith('*/'):
            # Find the start of this comment
            comment_end = len(preceding_text)
            comment_start = preceding_text.rfind('/**')
            if comment_start != -1:
                doc = preceding_text[comment_start:comment_end]
                # Clean up the doc
                doc = re.sub(r'/\*\*|\*/', '', doc)
                doc = re.sub(r'\n\s*\*', '\n', doc)
                doc = doc.strip()

        functions.append({
            "name": func_name,
            "return_type": ret_type,
            "args": args,
            "signature": full_match,
            "description": doc,
            "file": os.path.basename(filepath),
            "path": filepath
        })
        
    return functions

def main():
    print(f"Scanning SDK at {SDK_ROOT}...")
    
    # Target directories to scan
    # We focus on services and core APIs
    dirs_to_scan = [
        os.path.join(SDK_ROOT, "espf", "core", "services"),
        os.path.join(SDK_ROOT, "espf", "core", "include"), # Assuming there might be common includes
        os.path.join(SDK_ROOT, "espf", "app") # App level headers
    ]
    
    all_apis = []
    
    for root_dir in dirs_to_scan:
        if not os.path.exists(root_dir):
            print(f"Skipping missing directory: {root_dir}")
            continue
            
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(".h"):
                    filepath = os.path.join(root, file)
                    print(f"Parsing {file}...")
                    apis = parse_header_file(filepath)
                    if apis:
                        # Add category based on folder name
                        category = os.path.basename(root)
                        for api in apis:
                            api['category'] = category
                        all_apis.extend(apis)

    print(f"Found {len(all_apis)} APIs.")
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_apis, f, indent=4)
        
    print(f"Saved metadata to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
