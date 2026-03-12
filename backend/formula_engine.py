"""
Formula Engine — Resolves $Block.Property references, soc() aggregation,
and safe arithmetic evaluation for Valispace-style engineering properties.

Usage:
    engine = FormulaEngine(blocks)
    updated_blocks = engine.recalculate_all()
"""

import re
import ast
import operator
from collections import defaultdict
from typing import List, Dict, Any, Optional, Set


# Safe arithmetic operators
_SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval(expr: str) -> float:
    """Evaluate a simple arithmetic expression safely.

    Only allows numbers, +, -, *, /, and parentheses.
    Raises ValueError on anything else.
    """
    expr = expr.strip()
    if not expr:
        return 0.0

    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError:
        raise ValueError(f"Invalid formula syntax: {expr}")

    def _eval_node(node):
        if isinstance(node, ast.Expression):
            return _eval_node(node.body)
        elif isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        elif isinstance(node, ast.BinOp):
            op_func = _SAFE_OPS.get(type(node.op))
            if op_func is None:
                raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
            left = _eval_node(node.left)
            right = _eval_node(node.right)
            if isinstance(node.op, ast.Div) and right == 0:
                raise ValueError("Division by zero")
            return op_func(left, right)
        elif isinstance(node, ast.UnaryOp):
            op_func = _SAFE_OPS.get(type(node.op))
            if op_func is None:
                raise ValueError(f"Unsupported unary operator: {type(node.op).__name__}")
            return op_func(_eval_node(node.operand))
        else:
            raise ValueError(f"Unsupported expression node: {type(node).__name__}")

    return _eval_node(tree)


# Regex patterns
_REF_PATTERN = re.compile(r'\$([A-Za-z_][\w]*(?:\s[\w]+)*)\.([A-Za-z_][\w]*)')
_SOC_PATTERN = re.compile(r'soc\(\s*([A-Za-z_][\w]*)\s*\)')


class FormulaEngine:
    """Resolves formulas across a block hierarchy.

    Supports:
    - $BlockName.PropertyName — reference another block's property value
    - soc(PropertyName) — sum-of-children aggregation
    - Standard arithmetic (+, -, *, /)
    - Margin propagation (worst_case = value * (1 + margin_percent/100))
    """

    def __init__(self, blocks: List[Dict[str, Any]]):
        self._blocks = blocks
        self._blocks_by_id: Dict[str, Dict] = {b["id"]: b for b in blocks}
        self._blocks_by_name: Dict[str, Dict] = {}
        self._children: Dict[str, List[Dict]] = defaultdict(list)

        # Build name index (last one wins if duplicates)
        for b in blocks:
            name = b.get("name", "")
            if name:
                self._blocks_by_name[name] = b

        # Build parent-children map
        for b in blocks:
            pid = b.get("parent_id", "")
            if pid:
                self._children[pid].append(b)

        # Resolution tracking to detect circular references
        self._resolving: Set[str] = set()

    def _get_property_value(self, block: Dict, prop_name: str) -> Optional[float]:
        """Get a property's value from a block by property name."""
        for prop in block.get("properties", []):
            if prop.get("name") == prop_name:
                return float(prop.get("value", 0.0))
        return None

    def _resolve_soc(self, block_id: str, prop_name: str) -> float:
        """Sum-of-children: sum the named property across all direct children."""
        children = self._children.get(block_id, [])
        total = 0.0
        for child in children:
            val = self._get_property_value(child, prop_name)
            if val is not None:
                total += val
        return total

    def _resolve_reference(self, block_name: str, prop_name: str) -> float:
        """Resolve $BlockName.PropertyName to a numeric value."""
        block = self._blocks_by_name.get(block_name)
        if block is None:
            raise ValueError(f"Block '{block_name}' not found")

        val = self._get_property_value(block, prop_name)
        if val is None:
            raise ValueError(f"Property '{prop_name}' not found on block '{block_name}'")
        return val

    def resolve_formula(self, formula: str, context_block_id: str) -> float:
        """Resolve a formula string to a numeric value.

        Args:
            formula: Formula string, e.g. "$Motor.Mass + $Propeller.Mass" or "soc(Mass)"
            context_block_id: The block this formula belongs to (for soc() context)

        Returns:
            Resolved numeric value
        """
        # Check for circular reference
        resolve_key = f"{context_block_id}:{formula}"
        if resolve_key in self._resolving:
            raise ValueError(f"Circular reference detected: {resolve_key}")
        self._resolving.add(resolve_key)

        try:
            resolved = formula

            # 1. Replace soc(PropName) with computed sum
            for match in _SOC_PATTERN.finditer(formula):
                prop_name = match.group(1)
                soc_value = self._resolve_soc(context_block_id, prop_name)
                resolved = resolved.replace(match.group(0), str(soc_value))

            # 2. Replace $BlockName.PropertyName with resolved values
            for match in _REF_PATTERN.finditer(formula):
                block_name = match.group(1)
                prop_name = match.group(2)
                ref_value = self._resolve_reference(block_name, prop_name)
                resolved = resolved.replace(match.group(0), str(ref_value))

            # 3. Evaluate the resulting arithmetic expression
            return _safe_eval(resolved)

        finally:
            self._resolving.discard(resolve_key)

    def _topological_order(self) -> List[Dict]:
        """Sort blocks bottom-up: leaves first, then parents.

        This ensures child values are computed before parent formulas
        that reference them via soc().
        """
        # Blocks with no children come first
        has_children = set(self._children.keys())
        leaves = [b for b in self._blocks if b["id"] not in has_children]
        parents = [b for b in self._blocks if b["id"] in has_children]

        # Simple multi-level sort: deepest parents last
        # For now, leaves then parents is sufficient for single-level soc()
        # For deeper hierarchies, we'd need full topological sort
        result = []
        processed = set()

        def process(block):
            bid = block["id"]
            if bid in processed:
                return
            # Process children first
            for child in self._children.get(bid, []):
                process(child)
            processed.add(bid)
            result.append(block)

        for b in self._blocks:
            process(b)

        return result

    def recalculate_all(self) -> List[Dict]:
        """Recalculate all block properties in topological order.

        Returns the updated blocks list with computed values and worst_case.
        """
        ordered = self._topological_order()

        for block in ordered:
            props = block.get("properties", [])
            for prop in props:
                formula = prop.get("formula", "")
                if not formula:
                    continue

                try:
                    # Try to resolve the formula
                    value = self.resolve_formula(formula, block["id"])
                    prop["value"] = round(value, 6)
                except (ValueError, ZeroDivisionError):
                    # If formula can't be resolved, try as plain number
                    try:
                        prop["value"] = float(formula)
                    except (ValueError, TypeError):
                        pass  # Keep existing value

                # Always recalculate worst_case from current value + margin
                margin = prop.get("margin_percent", 0.0)
                prop["worst_case"] = round(prop.get("value", 0.0) * (1 + margin / 100), 6)

        return self._blocks
