"""
V&V Rule Evaluator — Evaluates verification & validation rules against
live block property and requirement engineering values.

Supports:
- $Block.Property references (resolved from blocks store)
- $REQ.EngineeringValue references (resolved from requirements store)
- Comparison operators: <, >, <=, >=, ==, !=
- Explicit left_value/right_value (no formula needed)
"""

import re
import operator
from datetime import datetime
from typing import List, Dict, Any, Optional


# Reference patterns
_BLOCK_REF = re.compile(r'\$([A-Za-z_][\w]*(?:\s[\w]+)*)\.([A-Za-z_][\w]*)')
_REQ_REF = re.compile(r'\$REQ\.([A-Za-z_][\w]*)')

# Operator map
_OPERATORS = {
    "<": operator.lt,
    ">": operator.gt,
    "<=": operator.le,
    ">=": operator.ge,
    "==": operator.eq,
    "!=": operator.ne,
}


class VnVEvaluator:
    """Evaluates V&V rules by resolving references and applying comparisons."""

    def __init__(self, blocks: List[Dict[str, Any]], requirements: List[Dict[str, Any]]):
        self._blocks_by_id: Dict[str, Dict] = {b["id"]: b for b in blocks}
        self._blocks_by_name: Dict[str, Dict] = {}
        self._requirements_by_id: Dict[str, Dict] = {r["id"]: r for r in requirements}

        for b in blocks:
            name = b.get("name", "")
            if name:
                self._blocks_by_name[name] = b

    def _resolve_block_property(self, block_name: str, prop_name: str) -> Optional[float]:
        """Resolve $BlockName.PropertyName to a numeric value."""
        block = self._blocks_by_name.get(block_name)
        if block is None:
            return None

        for prop in block.get("properties", []):
            if prop.get("name") == prop_name:
                try:
                    return float(prop.get("value", 0.0))
                except (ValueError, TypeError):
                    return None
        return None

    def _resolve_req_engineering_value(self, req_id: str, value_name: str) -> Optional[float]:
        """Resolve a requirement's engineering value by name."""
        req = self._requirements_by_id.get(req_id)
        if req is None:
            return None

        for ev in req.get("engineering_values", []):
            if ev.get("name") == value_name:
                try:
                    return float(ev.get("value", 0.0))
                except (ValueError, TypeError):
                    return None
        return None

    def _resolve_formula_value(self, formula: str, rule: Dict) -> Optional[float]:
        """Try to resolve a formula string to a float value.

        Handles:
        - $BlockName.PropertyName references
        - $REQ.ValueName references (uses rule's requirement_id for context)
        - Plain numeric strings
        """
        if not formula:
            return None

        # Check for $REQ.ValueName FIRST (more specific pattern)
        req_match = _REQ_REF.search(formula)
        if req_match:
            value_name = req_match.group(1)
            req_id = rule.get("requirement_id", "")
            if req_id:
                return self._resolve_req_engineering_value(req_id, value_name)
            return None

        # Check for $BlockName.PropertyName
        block_match = _BLOCK_REF.search(formula)
        if block_match:
            block_name = block_match.group(1)
            prop_name = block_match.group(2)
            return self._resolve_block_property(block_name, prop_name)

        # Try as plain number
        try:
            return float(formula)
        except (ValueError, TypeError):
            return None

    def evaluate_rule(self, rule: Dict) -> Dict:
        """Evaluate a single V&V rule.

        Resolution strategy:
        1. If the rule has a formula, try to extract left/right from it
        2. Otherwise, use the explicit left_value/right_value fields
        3. Apply the operator comparison
        4. Return the rule with updated status, resolved values, and timestamp

        Returns:
            Updated rule dict with status, left_value, right_value, last_checked
        """
        now = datetime.now().isoformat()
        result = {**rule, "last_checked": now}

        formula = rule.get("formula", "")
        op_str = rule.get("operator", "<=")
        op_func = _OPERATORS.get(op_str)

        if op_func is None:
            result["status"] = "error"
            return result

        left_val = None
        right_val = None

        if formula:
            # Try to parse formula as "left_expr operator right_expr"
            # e.g., "$Motor.Mass < 300" or "$System.Power <= $REQ.MaxPower"
            parts = None
            for op_candidate in ["<=", ">=", "!=", "==", "<", ">"]:
                if op_candidate in formula:
                    parts = formula.split(op_candidate, 1)
                    op_str = op_candidate
                    op_func = _OPERATORS.get(op_str)
                    break

            if parts and len(parts) == 2:
                left_val = self._resolve_formula_value(parts[0].strip(), rule)
                right_val = self._resolve_formula_value(parts[1].strip(), rule)
            else:
                # Formula is a single expression — resolve as left value
                left_val = self._resolve_formula_value(formula, rule)
                # Use explicit right_value
                try:
                    right_val = float(rule.get("right_value")) if rule.get("right_value") is not None else None
                except (ValueError, TypeError):
                    right_val = None
        else:
            # No formula — use explicit left_value and right_value
            try:
                left_val = float(rule.get("left_value")) if rule.get("left_value") is not None else None
            except (ValueError, TypeError):
                left_val = None
            try:
                right_val = float(rule.get("right_value")) if rule.get("right_value") is not None else None
            except (ValueError, TypeError):
                right_val = None

        # Update resolved values
        result["left_value"] = left_val
        result["right_value"] = right_val

        # Evaluate
        if left_val is None or right_val is None:
            result["status"] = "error"
        else:
            try:
                passed = op_func(left_val, right_val)
                result["status"] = "verified" if passed else "not_verified"
            except Exception:
                result["status"] = "error"

        return result
