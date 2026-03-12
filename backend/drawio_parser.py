"""
Draw.io Parser
--------------
Parses a .drawio (mxGraph XML) file and extracts:
  - Blocks (mxCell with vertex="1") → candidate system components
  - Connections (mxCell with edge="1") → relationships between components

The output is used to AI-generate requirement drafts for each block.
"""

import xml.etree.ElementTree as ET
from typing import List, Dict, Any


def _clean_label(label: str) -> str:
    """Strip basic HTML tags that draw.io injects into labels."""
    import re
    return re.sub(r"<[^>]+>", "", label or "").strip()


def parse_drawio(xml_content: str) -> Dict[str, Any]:
    """
    Parse a .drawio XML string and return structured blocks + connections.

    Returns
    -------
    {
        "blocks": [
            {"id": "2", "label": "MCU", "style": "rounded=1;..."},
            ...
        ],
        "connections": [
            {"id": "3", "label": "SPI", "source": "2", "target": "4"},
            ...
        ]
    }
    """
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        raise ValueError(f"Invalid draw.io XML: {e}")

    blocks: List[Dict[str, Any]] = []
    connections: List[Dict[str, Any]] = []

    # draw.io XML structure:
    # <mxfile> → <diagram> → <mxGraphModel> → <root> → <mxCell ...>
    # Support both compressed (base64+deflate) and uncompressed diagrams.
    # We only handle the uncompressed (text-based) format here.

    for cell in root.iter("mxCell"):
        cell_id = cell.get("id", "")
        label = _clean_label(cell.get("value", ""))
        style = cell.get("style", "")

        # Skip the two root cells (id "0" and "1") which are always present
        if cell_id in ("0", "1"):
            continue

        is_vertex = cell.get("vertex") == "1"
        is_edge = cell.get("edge") == "1"

        if is_edge:
            connections.append({
                "id": cell_id,
                "label": label,
                "source": cell.get("source", ""),
                "target": cell.get("target", "")
            })
        elif is_vertex and label:
            # Only include named blocks (unlabelled spacer cells are skipped)
            blocks.append({
                "id": cell_id,
                "label": label,
                "style": style
            })

    return {"blocks": blocks, "connections": connections}


def build_requirement_prompt(block: Dict[str, Any], connections: List[Dict[str, Any]]) -> str:
    """
    Build an LLM prompt to generate a requirement from a single block and its connections.
    """
    block_label = block["label"]

    incoming = [c for c in connections if c["target"] == block["id"]]
    outgoing = [c for c in connections if c["source"] == block["id"]]

    context_lines = []
    if incoming:
        for c in incoming:
            src_label = c.get("source_label", c["source"])
            signal = f' via signal "{c["label"]}"' if c["label"] else ""
            context_lines.append(f'- Receives input from "{src_label}"{signal}')
    if outgoing:
        for c in outgoing:
            tgt_label = c.get("target_label", c["target"])
            signal = f' via signal "{c["label"]}"' if c["label"] else ""
            context_lines.append(f'- Sends output to "{tgt_label}"{signal}')

    context_str = "\n".join(context_lines) if context_lines else "  (No connections specified)"

    return f"""You are a systems requirements engineer writing embedded system requirements.
Given the following system block from an architecture diagram, write ONE clear, testable system requirement in "shall" language.

Block Name: {block_label}
Interface Context:
{context_str}

Rules:
1. Use the format: "The [Block Name] shall [function/behavior] [measurable condition if applicable]."
2. Be specific and testable. Include numeric thresholds if implied by the block type.
3. Output ONLY the requirement text. No markdown, no explanation.
"""


def enrich_connections_with_labels(
    blocks: List[Dict[str, Any]], connections: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Add source_label and target_label to each connection for richer prompts."""
    block_map = {b["id"]: b["label"] for b in blocks}
    for c in connections:
        c["source_label"] = block_map.get(c["source"], c["source"])
        c["target_label"] = block_map.get(c["target"], c["target"])
    return connections
