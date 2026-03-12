
import json
import os
import shutil
import time

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates", "space_v1")
DATA_DIR = os.path.join(BASE_DIR, "data")
REQ_FILE = os.path.join(DATA_DIR, "requirements.json")
PROJ_FILE = os.path.join(DATA_DIR, "projects.json")

def load_json(filepath, default=[]):
    if not os.path.exists(filepath):
        return default
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def instantiate_template():
    print("Instantiating Space Software Template...")
    
    # 1. Load Template Requirements
    template_reqs_path = os.path.join(TEMPLATE_DIR, "requirements.json")
    if not os.path.exists(template_reqs_path):
        print(f"Error: Template not found at {template_reqs_path}")
        return False
        
    template_reqs = load_json(template_reqs_path)
    print(f"Loaded {len(template_reqs)} template requirements.")
    
    # 2. Load Existing Data
    existing_reqs = load_json(REQ_FILE)
    existing_projects = load_json(PROJ_FILE)
    
    # 3. Determine New Requirement IDs
    # Find max numeric ID in existing reqs to avoid collision
    # Assuming REQ-XXX format
    max_id = 0
    for r in existing_reqs:
        try:
            parts = r["id"].split("-")
            if len(parts) == 2 and parts[1].isdigit():
                num = int(parts[1])
                if num > max_id: max_id = num
        except: pass
        
    new_reqs = []
    new_req_ids = []
    
    for req in template_reqs:
        max_id += 1
        new_id = f"REQ-{max_id}"
        # Create a copy to avoid modifying the template
        new_req = req.copy()
        new_req["id"] = new_id
        # Update key to be unique-ish
        new_req["key"] = str(len(existing_reqs) + len(new_reqs) + 1)
        
        new_reqs.append(new_req)
        new_req_ids.append(new_id)
        
    # 4. Append Requirements
    existing_reqs.extend(new_reqs)
    save_json(REQ_FILE, existing_reqs)
    print(f"Added {len(new_reqs)} requirements to {REQ_FILE}")
    
    # 5. Create New Project
    # Find max project ID
    max_proj_id = 0
    for p in existing_projects:
        if p.get("id", 0) > max_proj_id:
            max_proj_id = p["id"]
            
    new_project_id = max_proj_id + 1
    new_project = {
        "id": new_project_id,
        "title": "Space Software Project (Template)",
        "status": "warning",
        "statusText": "Initializing",
        "metrics": [
            { "label": "Requirements", "value": "0%", "trend": "0%" },
            { "label": "Test Coverage", "value": "0%", "trend": "0%" },
            { "label": "Open Issues", "value": "0", "trend": "0" }
        ],
        "linkedReqIds": new_req_ids
    }
    
    existing_projects.append(new_project)
    save_json(PROJ_FILE, existing_projects)
    print(f"Created new project 'Space Software Project (Template)' with ID {new_project_id}")
    
    # 6. (Optional) Copy Verification Scripts
    # For now, we just list them
    verification_src = os.path.join(TEMPLATE_DIR, "verification")
    print(f"Verification scripts available at: {verification_src}")
    
    return True

if __name__ == "__main__":
    instantiate_template()
