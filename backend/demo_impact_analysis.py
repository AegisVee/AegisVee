import sys
import os
import asyncio
from typing import List, Dict, Any

# Add current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import ImpactAnalysis
import rag_service
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FlowNode(BaseModel):
    id: str
    type: str # requirement, system, test, etc.
    data: Dict[str, Any]

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class GraphPayload(BaseModel):
    nodes: List[FlowNode]
    edges: List[FlowEdge]
import rag_service

async def run_demo():
    print("--- Starting AegisVee Impact Analysis Demo ---")
    
    # Initialize RAG (will load the new txt files)
    print("Initializing RAG Service...")
    rag_service.initialize_rag()
    
    # 1. Define the Engineering Graph (Battery Change Scenario)
    print("\n1. Constructing Engineering Graph...")
    nodes = [
        FlowNode(id="sys-batt", type="system", data={"title": "Battery Module", "description": "Current: Samsung 18650 25R, 4S2P"}),
        FlowNode(id="sys-holder", type="system", data={"title": "Battery Holder", "description": "Custom ABS holder for 18650 cells"}),
        FlowNode(id="req-therm", type="requirement", data={"title": "Thermal Safety", "description": "Max temp 60C, dissipation > 30W"}),
        FlowNode(id="req-safety", type="requirement", data={"title": "Safety Cutoff", "description": "Cutoff at 75C skin temp"})
    ]
    
    edges = [
        FlowEdge(id="e1", source="sys-batt", target="sys-holder", data={"label": "physically_mounted_in"}),
        FlowEdge(id="e2", source="sys-batt", target="req-therm", data={"label": "satisfies"}),
        FlowEdge(id="e3", source="sys-batt", target="req-safety", data={"label": "satisfies"})
    ]
    
    graph = GraphPayload(nodes=nodes, edges=edges)
    
    # 2. Simulate User Request
    target_node_id = "sys-batt"
    change_desc = "Replace Samsung 18650 with Molicel P45B (21700 cell)"
    
    print(f"\n2. User Proposal: '{change_desc}' on Node '{target_node_id}'")
    
    # 3. Traceability Logic (Simulated from logic.py)
    print("\n3. Running Traceability Analysis...")
    # Find neighbors
    impacted_nodes = []
    for edge in edges:
        if edge.source == target_node_id:
            impacted_nodes.append(edge.target)
        elif edge.target == target_node_id:
            impacted_nodes.append(edge.source)
            
    print(f"   -> Impacted Nodes detected: {impacted_nodes}")
    
    # 4. Gather Context
    context = []
    for nid in impacted_nodes:
        node = next(n for n in nodes if n.id == nid)
        context.append(f"[{node.type.upper()}] {node.data['title']}: {node.data['description']}")
    
    print(f"   -> Context gathered: {context}")
    
    # 5. RAG Analysis w/ Impact Logic
    print("\n4. AI Impact Analysis (RAG)...")
    try:
        analysis = rag_service.analyze_impact(
            target_element="Battery Module",
            change_description=change_desc,
            related_contexts=context
        )
        
        print("\n" + "="*50)
        print("AegisVee AI Analysis Report")
        print("="*50)
        print(f"Summary: {analysis.summary}")
        print(f"Risk Level: {analysis.risk_level}")
        print("\nConflicts Detected:")
        for c in analysis.conflicts:
            print(f" - {c}")
        print(f"\nRecommendation: {analysis.recommendation}")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"Analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_demo())
