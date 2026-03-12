from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import networkx as nx
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse
from fastapi.responses import StreamingResponse
from rag_service import query_structured, analyze_impact
from models import TestScript, ImpactAnalysis

router = APIRouter(prefix="/api/logic", tags=["Logic"])

# --- Models for Graph Data ---
class NodeData(BaseModel):
    id: str
    title: Optional[str] = None
    label: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

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

class TestPlanRequest(BaseModel):
    requirement_id: str
    requirement_text: str
    context_nodes: List[Dict[str, Any]] = [] # Other related nodes for context

class ImpactRequest(BaseModel):
    target_node_id: str
    change_description: str
    graph_data: GraphPayload

# --- Traceability Logic ---

@router.post("/traceability/matrix")
async def generate_traceability_matrix(payload: GraphPayload):
    """
    Analyzes the graph to produce a traceability matrix (CSV/Excel).
    Relies on identifying chains like: Requirement -> Component -> Test
    """
    try:
        # Build NetworkX Graph
        G = nx.DiGraph()
        
        nodes_map = {n.id: n for n in payload.nodes}
        
        for node in payload.nodes:
            G.add_node(node.id, type=node.type, label=node.data.get("title") or node.data.get("label") or node.id)
            
        for edge in payload.edges:
            G.add_edge(edge.source, edge.target, relation=edge.data.get("label", "relates_to") if edge.data else "relates_to")

        # Logic: Find all "requirement" nodes and traverse out
        requirements = [n.id for n in payload.nodes if n.type == 'requirement']
        
        matrix_rows = []
        
        for req_id in requirements:
            req_node = nodes_map[req_id]
            req_label = req_node.data.get("title", req_id)
            
            # Find downstream components (Successors)
            # We look for immediate successors or reachable nodes that are 'system' or 'test'
            # Simple approach: Immediate neighbors
            successors = list(G.successors(req_id))
            
            systems = []
            tests = []
            
            for s_id in successors:
                s_node = nodes_map.get(s_id)
                if not s_node: continue
                
                if s_node.type == 'system':
                    systems.append(s_node.data.get("label", s_id))
                    # Check for tests linked to this system
                    sys_successors = list(G.successors(s_id))
                    for ss_id in sys_successors:
                        ss_node = nodes_map.get(ss_id)
                        if ss_node and ss_node.type == 'test':
                             tests.append(ss_node.data.get("label", ss_id))
                
                elif s_node.type == 'test' or 'test' in s_id.lower(): # Direct link to test
                     tests.append(s_node.data.get("label", s_id))

            # Also check if tests link BACK to requirement (Verification)
            # In V-Model, Test verifies Requirement, so arrow might be Test -> Req? 
            # Or Req -> Test (Satisfied by). Let's check predecessors too for 'verification' semantics if needed.
            # For now, assuming standard flow source->target.

            matrix_rows.append({
                "Requirement ID": req_node.data.get("id", req_id),
                "Requirement Title": req_label,
                "Linked Components": ", ".join(systems),
                "Linked Tests": ", ".join(tests),
                "Status": req_node.data.get("status", "Unknown")
            })

        df = pd.DataFrame(matrix_rows)
        
        # Export to Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        
        return StreamingResponse(
            output, 
            headers={'Content-Disposition': 'attachment; filename="traceability_matrix.xlsx"'},
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- AI Test Plan Generator ---

@router.post("/generate/testplan")
async def generate_test_plan_ai(request: TestPlanRequest):
    """
    Generates a structured Test Plan based on a requirement.
    Uses RAG Service.
    """
    prompt = f"""
    ROLE: Senior QA Engineer.
    TASK: Create a detailed test case for the following requirement.
    
    REQUIREMENT:
    ID: {request.requirement_id}
    Description: {request.requirement_text}
    
    CONTEXT:
    {request.context_nodes}
    
    OUTPUT FORMAT:
    Produce a JSON object matching the TestScript schema, with title and list of steps.
    """
    
    try:
        # User query_structured from rag_service
        # Pass TestScript model (already defined in models.py)
        result = query_structured(prompt, TestScript)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")

# --- Impact Analysis ---

@router.post("/impact_analysis")
async def impact_analysis(request: ImpactRequest):
    """
    Analyzes the impact of a change on the system graph.
    """
    try:
        # 1. Build Graph
        G = nx.DiGraph()
        nodes_map = {n.id: n for n in request.graph_data.nodes}
        for node in request.graph_data.nodes:
            G.add_node(node.id, type=node.type, label=node.data.get("title") or node.data.get("label") or node.id, description=node.data.get("description", ""))
        for edge in request.graph_data.edges:
            G.add_edge(edge.source, edge.target)
            G.add_edge(edge.target, edge.source) # Treat as undirected for impact? Or trace dependencies?
            # For impact, if A depends on B, changing B impacts A.
            # Edge usually Source -> Target. 
            # If Batt (S) -> PowerSys (T), changing Batt impacts PowerSys.
            # So we trace Successors.
            # But sometimes people draw Req -> System (System satisfies Req).
            # If System changes, Req might be impacted (compliance check).
            # So bidirectional traversal is safer for "Potential Impact".
            
        # 2. Find Impacted Nodes (1-hop for now, or full subgraph)
        if request.target_node_id not in G:
            raise HTTPException(status_code=404, detail="Target node not found in graph")
            
        target_node = nodes_map[request.target_node_id]
        target_label = target_node.data.get("title", request.target_node_id)
        
        # Simple BFS/Neighbor finding
        impacted_ids = list(nx.node_connected_component(G.to_undirected(), request.target_node_id))
        # Filter to relevant ones (Requirements, Systems)
        
        context_list = []
        for nid in impacted_ids:
            if nid == request.target_node_id: continue
            
            node = nodes_map.get(nid)
            if not node: continue
            
            n_type = node.type
            n_label = node.data.get("title", nid)
            n_desc = node.data.get("description", "")
            
            context_list.append(f"[{n_type.upper()}] {n_label}: {n_desc}")
            
        # 3. Call AI Analysis
        analysis = analyze_impact(
            target_element=target_label,
            change_description=request.change_description,
            related_contexts=context_list
        )
        
        return {
            "impact_graph": impacted_ids, # List of IDs impacted
            "analysis": analysis
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
