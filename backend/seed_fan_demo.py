"""
Seed Script — Smart Fan System Demo Project

Deletes all existing projects and creates a single comprehensive demo project
that showcases every AegisVee feature:
- Hierarchical requirements with {{param}} templates
- System blocks with soc() formulas and budget rollup
- V&V rules with $Block.Property evaluation
- Verification measures, test results, traceability links
- Architecture elements, compliance evidence, and more

Usage:
    cd backend
    python seed_fan_demo.py
"""

import json
import os
import shutil
import sys
from datetime import datetime, timedelta

# Fix Windows console encoding for emoji/CJK characters
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Ensure CWD is backend/
os.chdir(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = "data"
PROJECTS_DIR = os.path.join(DATA_DIR, "projects")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
PROJECT_ID = "1"
PROJECT_DIR = os.path.join(PROJECTS_DIR, PROJECT_ID)


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def ts(days_ago=0, hours_ago=0):
    """Generate ISO timestamp relative to now."""
    return (datetime(2026, 3, 12, 10, 0, 0) - timedelta(days=days_ago, hours=hours_ago)).isoformat()


# ============================================================
# Step 0: Clean up
# ============================================================
print("Cleaning existing projects...")
if os.path.exists(PROJECTS_DIR):
    shutil.rmtree(PROJECTS_DIR)
os.makedirs(PROJECT_DIR, exist_ok=True)

# ============================================================
# Step 1: Project metadata
# ============================================================
print("Creating project: Smart Fan System")
write_json(PROJECTS_FILE, [
    {
        "id": 1,
        "title": "Smart Fan System",
        "status": "success",
        "statusText": "Release Candidate",
        "metrics": [
            {"label": "Traceability", "value": "75%"}
        ]
    }
])

# ============================================================
# Step 2: Requirements (16 total)
# ============================================================
def make_req(id, title, desc, status, priority, level, parent_id,
             params=None, eng_values=None, tags=None, assignee="",
             test_steps="", expected_result="", verification_method=None,
             linked_test_ids=None, days_ago=10):
    p = params or []
    ev = eng_values or []
    t = tags or []
    ltids = linked_test_ids or []
    return {
        "id": id,
        "wp_id": "17-00",
        "title": title,
        "description": desc,
        "req_type": "functional",
        "level": level,
        "status": status,
        "priority": priority,
        "formal_mode": False,
        "formal_expression": "",
        "coverage_target": "",
        "functional_group": "",
        "variant": "",
        "release": "1.0",
        "verification_method": verification_method,
        "test_steps": test_steps,
        "expected_result": expected_result,
        "parameters": p,
        "engineering_values": ev,
        "parent_id": parent_id,
        "tags": t,
        "assignee": assignee,
        "assignee_avatar": "",
        "specification_id": "",
        "level_label": "",
        "key": id,
        "linked_apis": [],
        "linked_test_ids": ltids,
        # v1 compat aliases
        "testSteps": test_steps,
        "expectedResult": expected_result,
        "linkedApis": [],
        "linkedTestIds": ltids,
        "created_at": ts(days_ago),
        "updated_at": ts(days_ago - 2),
        "version": 2,
        "created_by": assignee,
    }


requirements = [
    # --- Stakeholder requirements ---
    make_req("STK-001", "Fan shall provide adequate indoor cooling airflow",
             "The fan system shall provide adequate airflow for effective room cooling in spaces up to 20m2.",
             "Approved", "critical", "stakeholder", None,
             tags=["Performance", "Airflow"], assignee="Wei Lin", days_ago=30),
    make_req("STK-002", "Fan operating noise below 50dB",
             "The fan system shall operate at a noise level not exceeding 50 dB(A) measured at 1 meter distance under all operating conditions.",
             "Approved", "high", "stakeholder", None,
             tags=["Noise", "Comfort"], assignee="Wei Lin", days_ago=30),
    make_req("STK-003", "Energy efficiency: total power below 60W",
             "The fan system total power consumption shall not exceed 60W under all operating conditions to meet energy efficiency targets.",
             "Approved", "high", "stakeholder", None,
             tags=["Performance", "Efficiency"], assignee="Wei Lin", days_ago=30),
    make_req("STK-004", "Comply with household safety standards",
             "The fan system shall comply with household electrical safety standards including overcurrent protection and thermal shutdown.",
             "Approved", "critical", "stakeholder", None,
             tags=["Safety", "Compliance"], assignee="Wei Lin", days_ago=30),

    # --- System requirements ---
    make_req("REQ-001", "Motor speed control: {{rpm_nominal}} RPM",
             "The BLDC motor shall achieve a nominal speed of {{rpm_nominal}} RPM at {{voltage_nominal}}V input voltage, with a tolerance of +/-50 RPM after stabilization.",
             "Verified", "critical", "system", "STK-001",
             params=[
                 {"name": "rpm_nominal", "type": "int", "value": "5000", "unit": "RPM"},
                 {"name": "voltage_nominal", "type": "float", "value": "12", "unit": "V"},
             ],
             eng_values=[{"id": "EV-001", "name": "max_rpm", "formula": "5000", "value": 5000.0, "unit": "RPM",
                          "margin_percent": 0, "worst_case": 5000, "tags": [], "vali_type": "vali"}],
             tags=["Motor", "Control"], assignee="Jun Chen",
             verification_method="Test",
             test_steps="1. Apply {{voltage_nominal}}V DC to motor input.\n2. Send PWM command for maximum speed.\n3. Read tachometer value via UART.\n4. Verify speed is {{rpm_nominal}} RPM +/-50 RPM.",
             expected_result="Motor speed: {{rpm_nominal}} +/-50 RPM",
             linked_test_ids=["VM-0001"], days_ago=25),

    make_req("REQ-002", "Airflow output {{cfm_target}} CFM",
             "The fan shall deliver a minimum airflow of {{cfm_target}} CFM at maximum speed, measured at the outlet with a calibrated anemometer.",
             "Approved", "high", "system", "STK-001",
             params=[{"name": "cfm_target", "type": "float", "value": "350", "unit": "CFM"}],
             tags=["Airflow", "Performance"], assignee="Jun Chen",
             verification_method="Test",
             test_steps="1. Mount fan in AMCA 210 test chamber.\n2. Set motor to maximum speed.\n3. Read anemometer at outlet duct.\n4. Verify airflow >= {{cfm_target}} CFM.",
             expected_result="Airflow >= {{cfm_target}} CFM",
             linked_test_ids=["VM-0002"], days_ago=25),

    make_req("REQ-003", "Noise below {{noise_limit}}dB @ {{distance}}m",
             "The fan noise level shall be less than {{noise_limit}} dB(A) measured at {{distance}} meter distance from the fan center under maximum speed operation.",
             "Verified", "high", "system", "STK-002",
             params=[
                 {"name": "noise_limit", "type": "float", "value": "45", "unit": "dB"},
                 {"name": "distance", "type": "float", "value": "1", "unit": "m"},
             ],
             tags=["Noise", "Acoustic"], assignee="Mei Huang",
             verification_method="Test",
             test_steps="1. Place calibrated sound level meter at {{distance}}m from fan center.\n2. Run fan at maximum speed for 60 seconds.\n3. Record A-weighted SPL.\n4. Verify reading < {{noise_limit}} dB(A).",
             expected_result="Noise < {{noise_limit}} dB(A)",
             linked_test_ids=["VM-0003"], days_ago=24),

    make_req("REQ-004", "Motor power below {{power_limit}}W",
             "The motor assembly power consumption shall not exceed {{power_limit}}W at maximum speed under nominal operating conditions.",
             "Verified", "high", "system", "STK-003",
             params=[{"name": "power_limit", "type": "float", "value": "45", "unit": "W"}],
             tags=["Motor", "Power"], assignee="Jun Chen",
             verification_method="Test",
             test_steps="1. Connect power analyzer to motor input leads.\n2. Run motor at maximum speed.\n3. Record real power consumption.\n4. Verify power < {{power_limit}}W.",
             expected_result="Motor power < {{power_limit}}W",
             linked_test_ids=["VM-0004"], days_ago=24),

    make_req("REQ-005", "Controller board power below {{ctrl_power_limit}}W",
             "The controller board total power dissipation shall not exceed {{ctrl_power_limit}}W including all active components and regulators.",
             "Approved", "medium", "system", "STK-003",
             params=[{"name": "ctrl_power_limit", "type": "float", "value": "5", "unit": "W"}],
             tags=["Controller", "Power"], assignee="Xiao Li", days_ago=24),

    make_req("REQ-006", "Thermal protection: auto-shutdown at {{temp_limit}} deg C",
             "The motor controller shall automatically shut down the motor when winding temperature reaches {{temp_limit}} deg C, with restart inhibit until temperature drops below 70 deg C.",
             "Approved", "critical", "system", "STK-004",
             params=[{"name": "temp_limit", "type": "float", "value": "85", "unit": "deg C"}],
             tags=["Safety", "Thermal"], assignee="Mei Huang",
             verification_method="Test",
             test_steps="1. Mount thermocouple on motor winding.\n2. Block airflow to induce thermal rise.\n3. Monitor temperature and motor status.\n4. Verify shutdown occurs at {{temp_limit}} deg C.",
             expected_result="Auto-shutdown at {{temp_limit}} deg C",
             linked_test_ids=["VM-0005"], days_ago=24),

    make_req("REQ-007", "Total mass below 800g",
             "The complete fan assembly total mass shall not exceed 800g including motor, controller, impeller, housing, and power supply.",
             "Verified", "medium", "system", "STK-003",
             eng_values=[{"id": "EV-007", "name": "maximum_fan_mass", "formula": "800", "value": 800.0, "unit": "g",
                          "margin_percent": 0, "worst_case": 800, "tags": ["budget"], "vali_type": "vali"}],
             tags=["Weight", "Budget"], assignee="Jun Chen",
             verification_method="Inspection",
             test_steps="1. Weigh each sub-assembly on calibrated scale.\n2. Sum all component masses.\n3. Compare total against 800g limit.",
             expected_result="Total mass < 800g",
             linked_test_ids=["VM-0008"], days_ago=22),

    make_req("REQ-008", "PWM three-level speed control",
             "The controller shall support three PWM-driven speed levels: Low (30% duty), Medium (60% duty), and High (100% duty), selectable via hardware switch input.",
             "Draft", "medium", "system", "REQ-001",
             tags=["Motor", "Control", "PWM"], assignee="Xiao Li", days_ago=20),

    make_req("REQ-009", "Soft-start: reach target speed within {{ramp_time}}s",
             "The motor controller shall implement soft-start ramp-up from 0 to target speed within {{ramp_time}} seconds to reduce inrush current and mechanical stress.",
             "Draft", "low", "system", "REQ-001",
             params=[{"name": "ramp_time", "type": "float", "value": "2", "unit": "s"}],
             tags=["Motor", "Control"], assignee="Xiao Li", days_ago=20),

    make_req("REQ-010", "Vibration below {{vib_limit}} mm/s RMS",
             "The fan bearing vibration shall not exceed {{vib_limit}} mm/s RMS velocity measured at the bearing housing under all speed conditions.",
             "Review", "medium", "system", "STK-002",
             params=[{"name": "vib_limit", "type": "float", "value": "0.5", "unit": "mm/s"}],
             tags=["Vibration", "Mechanical"], assignee="Mei Huang",
             verification_method="Test",
             test_steps="1. Mount accelerometer on bearing housing.\n2. Run fan at maximum speed for 120 seconds.\n3. Record RMS velocity.\n4. Verify reading < {{vib_limit}} mm/s.",
             expected_result="Vibration RMS < {{vib_limit}} mm/s",
             linked_test_ids=["VM-0006"], days_ago=18),

    make_req("REQ-011", "EMC compliance with EN 55014",
             "The fan system shall comply with EN 55014-1 conducted and radiated emission limits for household appliances.",
             "Approved", "high", "system", "STK-004",
             tags=["Safety", "EMC", "Compliance"], assignee="Mei Huang",
             verification_method="Analysis",
             linked_test_ids=["VM-0007"], days_ago=22),

    make_req("REQ-012", "Input voltage range {{v_min}}-{{v_max}}V DC",
             "The fan system shall operate correctly over an input voltage range of {{v_min}}V to {{v_max}}V DC without degradation in performance or safety.",
             "Verified", "medium", "system", "REQ-001",
             params=[
                 {"name": "v_min", "type": "float", "value": "10", "unit": "V"},
                 {"name": "v_max", "type": "float", "value": "14", "unit": "V"},
             ],
             tags=["Power", "Motor"], assignee="Jun Chen", days_ago=22),
]

print(f"  {len(requirements)} requirements")
write_json(os.path.join(PROJECT_DIR, "requirements.json"), requirements)

# ============================================================
# Step 3: System Blocks (9)
# ============================================================
def make_prop(id, name, formula, value, unit, margin=0, tags=None):
    wc = round(value * (1 + margin / 100), 2) if margin else value
    return {"id": id, "name": name, "formula": str(formula), "value": value,
            "unit": unit, "margin_percent": margin, "worst_case": wc, "tags": tags or []}


blocks = [
    {
        "id": "BLK-0001", "name": "Valifan", "parent_id": "", "type": "subsystem",
        "description": "Smart Fan complete assembly — Top-level assembly combining motor, controller, impeller, housing, and power supply.",
        "properties": [
            make_prop("P-M0", "Mass", "soc(Mass)", 775, "g", 5, ["budget"]),
            make_prop("P-P0", "Power", "soc(Power)", 53.5, "W", 10, ["budget"]),
        ],
        "linked_requirement_ids": ["REQ-007", "STK-003"],
        "created_at": ts(28), "updated_at": ts(3), "version": 3,
    },
    {
        "id": "BLK-0002", "name": "Motor_Assembly", "parent_id": "BLK-0001", "type": "component",
        "description": "12V BLDC motor assembly including rotor, stator, and bearing pack.",
        "properties": [
            make_prop("P-M1", "Mass", "soc(Mass)", 250, "g", 5),
            make_prop("P-P1", "Power", "42", 42, "W", 5),
            make_prop("P-N1", "Noise_Level", "42", 42, "dB", 3),
            make_prop("P-T1", "Max_Temp", "78", 78, "deg C", 5),
        ],
        "linked_requirement_ids": ["REQ-001", "REQ-004", "REQ-006"],
        "created_at": ts(28), "updated_at": ts(5), "version": 2,
    },
    {
        "id": "BLK-0003", "name": "Rotor", "parent_id": "BLK-0002", "type": "component",
        "description": "Permanent magnet rotor assembly with NdFeB magnets.",
        "properties": [make_prop("P-M3", "Mass", "120", 120, "g", 3)],
        "linked_requirement_ids": [],
        "created_at": ts(28), "updated_at": ts(10), "version": 1,
    },
    {
        "id": "BLK-0004", "name": "Stator", "parent_id": "BLK-0002", "type": "component",
        "description": "12-slot stator with concentrated windings, class F insulation.",
        "properties": [make_prop("P-M4", "Mass", "100", 100, "g", 3)],
        "linked_requirement_ids": [],
        "created_at": ts(28), "updated_at": ts(10), "version": 1,
    },
    {
        "id": "BLK-0005", "name": "Bearing_Pack", "parent_id": "BLK-0002", "type": "component",
        "description": "Dual sealed ball bearing set (6001-2RS) with pre-loaded spring.",
        "properties": [make_prop("P-M5", "Mass", "30", 30, "g", 5)],
        "linked_requirement_ids": [],
        "created_at": ts(28), "updated_at": ts(10), "version": 1,
    },
    {
        "id": "BLK-0006", "name": "Controller_Board", "parent_id": "BLK-0001", "type": "component",
        "description": "STM32G4-based PWM motor controller with FET half-bridge and protection circuits.",
        "properties": [
            make_prop("P-M6", "Mass", "85", 85, "g", 5),
            make_prop("P-P6", "Power", "3.5", 3.5, "W", 10),
        ],
        "linked_requirement_ids": ["REQ-005", "REQ-008", "REQ-009"],
        "created_at": ts(26), "updated_at": ts(5), "version": 2,
    },
    {
        "id": "BLK-0007", "name": "Impeller", "parent_id": "BLK-0001", "type": "component",
        "description": "7-blade composite plastic impeller optimized for CFD-validated airflow.",
        "properties": [
            make_prop("P-M7", "Mass", "110", 110, "g", 3),
            make_prop("P-V7", "Vibration_RMS", "0.35", 0.35, "mm/s", 10),
        ],
        "linked_requirement_ids": ["REQ-002", "REQ-010"],
        "created_at": ts(26), "updated_at": ts(7), "version": 1,
    },
    {
        "id": "BLK-0008", "name": "Housing", "parent_id": "BLK-0001", "type": "component",
        "description": "ABS injection-molded housing with integrated finger guard and mounting bracket.",
        "properties": [make_prop("P-M8", "Mass", "180", 180, "g", 3)],
        "linked_requirement_ids": [],
        "created_at": ts(26), "updated_at": ts(10), "version": 1,
    },
    {
        "id": "BLK-0009", "name": "Power_Supply", "parent_id": "BLK-0001", "type": "component",
        "description": "AC-DC power adapter (100-240V AC to 12V DC, 5A) with EMI filter.",
        "properties": [
            make_prop("P-M9", "Mass", "150", 150, "g", 5),
            make_prop("P-P9", "Power", "8", 8, "W", 10),
        ],
        "linked_requirement_ids": ["REQ-012"],
        "created_at": ts(26), "updated_at": ts(8), "version": 1,
    },
]

print(f"  {len(blocks)} system blocks")
write_json(os.path.join(PROJECT_DIR, "blocks.json"), blocks)

# ============================================================
# Step 4: V&V Rules (9)
# ============================================================
vnv_rules = [
    {"id": "VVR-0001", "title": "Total Mass Budget", "requirement_id": "REQ-007", "block_id": "BLK-0001",
     "formula": "$Valifan.Mass < 800", "operator": "<",
     "left_value": 775, "left_label": "Valifan.Mass", "right_value": 800, "right_label": "maximum_fan_mass",
     "method": "analysis", "status": "verified", "last_checked": ts(1),
     "created_at": ts(15), "updated_at": ts(1), "version": 2},
    {"id": "VVR-0002", "title": "Motor Power Limit", "requirement_id": "REQ-004", "block_id": "BLK-0002",
     "formula": "$Motor_Assembly.Power <= 45", "operator": "<=",
     "left_value": 42, "left_label": "Motor_Assembly.Power", "right_value": 45, "right_label": "power_limit",
     "method": "test", "status": "verified", "last_checked": ts(1),
     "created_at": ts(15), "updated_at": ts(1), "version": 2},
    {"id": "VVR-0003", "title": "Controller Power Limit", "requirement_id": "REQ-005", "block_id": "BLK-0006",
     "formula": "$Controller_Board.Power <= 5", "operator": "<=",
     "left_value": 3.5, "left_label": "Controller_Board.Power", "right_value": 5, "right_label": "ctrl_power_limit",
     "method": "analysis", "status": "verified", "last_checked": ts(1),
     "created_at": ts(15), "updated_at": ts(1), "version": 2},
    {"id": "VVR-0004", "title": "Total Power Budget", "requirement_id": "STK-003", "block_id": "BLK-0001",
     "formula": "$Valifan.Power <= 60", "operator": "<=",
     "left_value": 53.5, "left_label": "Valifan.Power", "right_value": 60, "right_label": "total_power_limit",
     "method": "analysis", "status": "verified", "last_checked": ts(1),
     "created_at": ts(14), "updated_at": ts(1), "version": 2},
    {"id": "VVR-0005", "title": "Noise Limit", "requirement_id": "REQ-003", "block_id": "BLK-0002",
     "formula": "$Motor_Assembly.Noise_Level <= 45", "operator": "<=",
     "left_value": 42, "left_label": "Motor_Assembly.Noise_Level", "right_value": 45, "right_label": "noise_limit",
     "method": "test", "status": "verified", "last_checked": ts(2),
     "created_at": ts(14), "updated_at": ts(2), "version": 2},
    {"id": "VVR-0006", "title": "Vibration RMS Limit", "requirement_id": "REQ-010", "block_id": "BLK-0007",
     "formula": "$Impeller.Vibration_RMS <= 0.5", "operator": "<=",
     "left_value": 0.35, "left_label": "Impeller.Vibration_RMS", "right_value": 0.5, "right_label": "vib_limit",
     "method": "test", "status": "verified", "last_checked": ts(2),
     "created_at": ts(14), "updated_at": ts(2), "version": 2},
    {"id": "VVR-0007", "title": "Temperature Safety Limit", "requirement_id": "REQ-006", "block_id": "BLK-0002",
     "formula": "$Motor_Assembly.Max_Temp <= 85", "operator": "<=",
     "left_value": 78, "left_label": "Motor_Assembly.Max_Temp", "right_value": 85, "right_label": "temp_limit",
     "method": "test", "status": "verified", "last_checked": ts(2),
     "created_at": ts(13), "updated_at": ts(2), "version": 2},
    {"id": "VVR-0008", "title": "Rotor Mass Limit", "requirement_id": "", "block_id": "BLK-0003",
     "formula": "$Rotor.Mass <= 150", "operator": "<=",
     "left_value": 120, "left_label": "Rotor.Mass", "right_value": 150, "right_label": "rotor_mass_budget",
     "method": "inspection", "status": "not_verified", "last_checked": None,
     "created_at": ts(10), "updated_at": ts(10), "version": 1},
    {"id": "VVR-0009", "title": "Housing Mass Limit", "requirement_id": "", "block_id": "BLK-0008",
     "formula": "$Housing.Mass <= 200", "operator": "<=",
     "left_value": 180, "left_label": "Housing.Mass", "right_value": 200, "right_label": "housing_mass_budget",
     "method": "inspection", "status": "not_verified", "last_checked": None,
     "created_at": ts(10), "updated_at": ts(10), "version": 1},
]

print(f"  {len(vnv_rules)} V&V rules")
write_json(os.path.join(PROJECT_DIR, "vnv_rules.json"), vnv_rules)

# ============================================================
# Step 5: Verification Measures (8)
# ============================================================
verification_measures = [
    {"id": "VM-0001", "wp_id": "08-60", "title": "Motor Speed Test (HIL)", "technique": "test",
     "pass_criteria": "Motor speed {{rpm_nominal}} RPM +/-50 RPM after 5s stabilization",
     "conditions": "Supply voltage stable at {{voltage_nominal}}V, ambient 20-25 deg C",
     "environment": "HIL", "measure_type": "system", "script_type": "hil",
     "content": "import serial\nimport time\n\n# HIL Motor Speed Test\nser = serial.Serial('COM3', 115200)\nser.write(b'SET_SPEED {{rpm_nominal}}\\n')\ntime.sleep(5)\nrpm = int(ser.readline().strip())\nassert abs(rpm - {{rpm_nominal}}) <= 50, f'Speed {rpm} out of tolerance'\nprint(f'PASS: Motor speed {rpm} RPM')",
     "parameters_snapshot": {"rpm_nominal": "5000", "voltage_nominal": "12"},
     "requirement_id": "REQ-001",
     "created_at": ts(20), "updated_at": ts(5), "version": 2},
    {"id": "VM-0002", "wp_id": "08-60", "title": "Airflow Output Test", "technique": "test",
     "pass_criteria": "Airflow >= {{cfm_target}} CFM at maximum speed",
     "conditions": "AMCA 210 test chamber, standard atmospheric conditions",
     "environment": "bench", "measure_type": "system", "script_type": "manual",
     "content": "1. Mount fan in AMCA 210 test chamber.\n2. Set motor to maximum speed (100% duty).\n3. Wait 60s for flow stabilization.\n4. Read calibrated anemometer at outlet.\n5. Verify airflow >= {{cfm_target}} CFM.",
     "parameters_snapshot": {"cfm_target": "350"},
     "requirement_id": "REQ-002",
     "created_at": ts(20), "updated_at": ts(6), "version": 1},
    {"id": "VM-0003", "wp_id": "08-60", "title": "Noise Level Test", "technique": "test",
     "pass_criteria": "Noise < {{noise_limit}} dB(A) at {{distance}}m",
     "conditions": "Semi-anechoic chamber, background noise < 25 dB(A)",
     "environment": "bench", "measure_type": "system", "script_type": "manual",
     "content": "1. Place B&K Type 2250 SLM at {{distance}}m from fan center.\n2. Run fan at maximum speed.\n3. Record A-weighted Leq over 60s.\n4. Verify reading < {{noise_limit}} dB(A).",
     "parameters_snapshot": {"noise_limit": "45", "distance": "1"},
     "requirement_id": "REQ-003",
     "created_at": ts(19), "updated_at": ts(5), "version": 1},
    {"id": "VM-0004", "wp_id": "08-60", "title": "Power Consumption Test", "technique": "test",
     "pass_criteria": "Motor power < {{power_limit}}W at max speed",
     "conditions": "Input voltage 12.0V +/-0.1V, ambient 23 deg C",
     "environment": "bench", "measure_type": "system", "script_type": "manual",
     "content": "1. Connect Yokogawa WT310 power analyzer to motor input.\n2. Run motor at maximum speed.\n3. Wait 120s for thermal stabilization.\n4. Record real power (W).\n5. Verify power < {{power_limit}}W.",
     "parameters_snapshot": {"power_limit": "45"},
     "requirement_id": "REQ-004",
     "created_at": ts(19), "updated_at": ts(4), "version": 1},
    {"id": "VM-0005", "wp_id": "08-60", "title": "Thermal Protection Test (HIL)", "technique": "test",
     "pass_criteria": "Auto-shutdown triggers at {{temp_limit}} deg C +/-2 deg C",
     "conditions": "Motor operated with blocked airflow to induce heating",
     "environment": "HIL", "measure_type": "system", "script_type": "hil",
     "content": "import serial\nimport time\n\n# Thermal Protection HIL Test\nser = serial.Serial('COM3', 115200)\nser.write(b'BLOCK_AIRFLOW\\n')  # Activate airflow blocker\nwhile True:\n    temp = float(ser.readline().strip())\n    if temp >= {{temp_limit}}:\n        status = ser.readline().strip()\n        assert status == b'SHUTDOWN', 'Thermal protection did not trigger'\n        print(f'PASS: Shutdown at {temp} deg C')\n        break\n    time.sleep(1)",
     "parameters_snapshot": {"temp_limit": "85"},
     "requirement_id": "REQ-006",
     "created_at": ts(18), "updated_at": ts(3), "version": 1},
    {"id": "VM-0006", "wp_id": "08-60", "title": "Vibration Measurement", "technique": "test",
     "pass_criteria": "Vibration RMS < {{vib_limit}} mm/s",
     "conditions": "Fan mounted on rigid fixture, accelerometer on bearing housing",
     "environment": "bench", "measure_type": "system", "script_type": "manual",
     "content": "1. Mount PCB 352C03 accelerometer on bearing housing.\n2. Run fan at max speed for 120s.\n3. Record RMS velocity (mm/s) via DAQ.\n4. Verify < {{vib_limit}} mm/s.",
     "parameters_snapshot": {"vib_limit": "0.5"},
     "requirement_id": "REQ-010",
     "created_at": ts(18), "updated_at": ts(4), "version": 1},
    {"id": "VM-0007", "wp_id": "08-60", "title": "EMC Pre-Compliance Scan", "technique": "analysis",
     "pass_criteria": "Emissions below EN 55014-1 limits with 6dB margin",
     "conditions": "3m semi-anechoic chamber, CISPR 16 receiver",
     "environment": "desktop", "measure_type": "system", "script_type": "automated",
     "content": "1. Connect LISN to fan power input.\n2. Run spectrum analyzer 150kHz-30MHz (conducted).\n3. Run EMI receiver 30MHz-1GHz (radiated).\n4. Compare peaks against EN 55014-1 Class B limits.\n5. Verify 6dB margin on all peaks.",
     "parameters_snapshot": {},
     "requirement_id": "REQ-011",
     "created_at": ts(16), "updated_at": ts(8), "version": 1},
    {"id": "VM-0008", "wp_id": "08-60", "title": "Mass Budget Review", "technique": "inspection",
     "pass_criteria": "Total mass < 800g",
     "conditions": "All sub-assemblies weighed on calibrated scale (+/-0.5g)",
     "environment": "desktop", "measure_type": "system", "script_type": "manual",
     "content": "1. Weigh each sub-assembly individually.\n2. Record mass values in mass budget spreadsheet.\n3. Sum all components.\n4. Compare total against 800g limit.\n5. Calculate margin percentage.",
     "parameters_snapshot": {},
     "requirement_id": "REQ-007",
     "created_at": ts(16), "updated_at": ts(3), "version": 1},
]

print(f"  {len(verification_measures)} verification measures")
write_json(os.path.join(PROJECT_DIR, "verification_measures.json"), verification_measures)
# Also write legacy test_scripts.json for backward compat
write_json(os.path.join(PROJECT_DIR, "test_scripts.json"), verification_measures)

# ============================================================
# Step 6: Traceability Links (20)
# ============================================================
def make_link(id, src, src_type, tgt, tgt_type, link_type, rationale, days_ago=20):
    return {"id": id, "source_id": src, "source_type": src_type,
            "target_id": tgt, "target_type": tgt_type,
            "link_type": link_type, "rationale": rationale,
            "created_at": ts(days_ago), "created_by": "Jun Chen"}


traceability_links = [
    # Stakeholder -> System (derived_from)
    make_link("TL-0001", "REQ-001", "requirement", "STK-001", "requirement", "derived_from", "Motor speed supports airflow delivery"),
    make_link("TL-0002", "REQ-002", "requirement", "STK-001", "requirement", "derived_from", "Airflow delivery supports room cooling"),
    make_link("TL-0003", "REQ-003", "requirement", "STK-002", "requirement", "derived_from", "Noise limit supports quiet operation"),
    make_link("TL-0004", "REQ-004", "requirement", "STK-003", "requirement", "derived_from", "Motor power contributes to efficiency"),
    make_link("TL-0005", "REQ-005", "requirement", "STK-003", "requirement", "derived_from", "Controller power contributes to efficiency"),
    make_link("TL-0006", "REQ-006", "requirement", "STK-004", "requirement", "derived_from", "Thermal protection supports safety"),
    make_link("TL-0007", "REQ-007", "requirement", "STK-003", "requirement", "derived_from", "Mass budget supports efficiency/portability"),

    # Requirement -> Architecture (allocated_to)
    make_link("TL-0008", "REQ-001", "requirement", "BLK-0002", "architecture", "allocated_to", "Speed control allocated to motor assembly"),
    make_link("TL-0009", "REQ-002", "requirement", "BLK-0007", "architecture", "allocated_to", "Airflow allocated to impeller design"),
    make_link("TL-0010", "REQ-004", "requirement", "BLK-0002", "architecture", "allocated_to", "Power budget allocated to motor assembly"),
    make_link("TL-0011", "REQ-005", "requirement", "BLK-0006", "architecture", "allocated_to", "Power budget allocated to controller"),
    make_link("TL-0012", "REQ-006", "requirement", "BLK-0002", "architecture", "allocated_to", "Thermal protection allocated to motor/controller"),
    make_link("TL-0013", "REQ-012", "requirement", "BLK-0009", "architecture", "allocated_to", "Voltage range allocated to power supply"),

    # Verification -> Requirement (verifies)
    make_link("TL-0014", "VM-0001", "verification_measure", "REQ-001", "requirement", "verifies", "HIL motor speed test verifies REQ-001", 15),
    make_link("TL-0015", "VM-0002", "verification_measure", "REQ-002", "requirement", "verifies", "Airflow bench test verifies REQ-002", 15),
    make_link("TL-0016", "VM-0003", "verification_measure", "REQ-003", "requirement", "verifies", "Noise test verifies REQ-003", 15),
    make_link("TL-0017", "VM-0004", "verification_measure", "REQ-004", "requirement", "verifies", "Power test verifies REQ-004", 15),
    make_link("TL-0018", "VM-0005", "verification_measure", "REQ-006", "requirement", "verifies", "Thermal test verifies REQ-006", 14),
    make_link("TL-0019", "VM-0006", "verification_measure", "REQ-010", "requirement", "verifies", "Vibration test verifies REQ-010", 14),
    make_link("TL-0020", "VM-0008", "verification_measure", "REQ-007", "requirement", "verifies", "Mass inspection verifies REQ-007", 14),
]

print(f"  {len(traceability_links)} traceability links")
write_json(os.path.join(PROJECT_DIR, "traceability_links.json"), traceability_links)

# ============================================================
# Step 7: Architecture Elements (mirrors blocks for arch view)
# ============================================================
arch_elements = []
positions = {
    "BLK-0001": {"x": 400, "y": 50},
    "BLK-0002": {"x": 100, "y": 200},
    "BLK-0003": {"x": 0, "y": 380},
    "BLK-0004": {"x": 120, "y": 380},
    "BLK-0005": {"x": 240, "y": 380},
    "BLK-0006": {"x": 300, "y": 200},
    "BLK-0007": {"x": 500, "y": 200},
    "BLK-0008": {"x": 650, "y": 200},
    "BLK-0009": {"x": 800, "y": 200},
}

for blk in blocks:
    arch_id = blk["id"].replace("BLK-", "ARCH-")
    arch_elements.append({
        "id": arch_id, "wp_id": "04-06",
        "name": blk["name"], "element_type": blk["type"],
        "description": blk["description"],
        "aspect": "static",
        "interfaces": [],
        "parent_id": blk["parent_id"].replace("BLK-", "ARCH-") if blk["parent_id"] else "",
        "behavior_type": "",
        "behavior_data": {},
        "lifecycle_aspects": [],
        "design_rationale": "",
        "properties": blk["properties"],
        "linked_requirement_ids": blk["linked_requirement_ids"],
        "canvas_position": positions.get(blk["id"], {"x": 0, "y": 0}),
        "canvas_style": {},
        "created_at": blk["created_at"],
        "updated_at": blk["updated_at"],
        "version": blk["version"],
    })

print(f"  {len(arch_elements)} architecture elements")
write_json(os.path.join(PROJECT_DIR, "architecture_elements.json"), arch_elements)

# ============================================================
# Step 8: Requirement Attributes (6)
# ============================================================
req_attributes = [
    {"id": "RA-0001", "wp_id": "17-54", "requirement_id": "REQ-001",
     "attribute_name": "verifiability", "attribute_value": "High - measurable via tachometer and UART",
     "analysis_notes": "Test procedure fully defined with HIL setup", "score": 95,
     "created_at": ts(20), "updated_at": ts(10), "version": 1},
    {"id": "RA-0002", "wp_id": "17-54", "requirement_id": "REQ-003",
     "attribute_name": "verifiability", "attribute_value": "High - measurable via calibrated SLM",
     "analysis_notes": "Standard acoustic test procedure available", "score": 90,
     "created_at": ts(20), "updated_at": ts(10), "version": 1},
    {"id": "RA-0003", "wp_id": "17-54", "requirement_id": "REQ-007",
     "attribute_name": "completeness", "attribute_value": "Complete - all sub-assemblies accounted in BOM",
     "analysis_notes": "Mass budget covers all 5 major sub-assemblies", "score": 85,
     "created_at": ts(18), "updated_at": ts(8), "version": 1},
    {"id": "RA-0004", "wp_id": "17-54", "requirement_id": "REQ-008",
     "attribute_name": "clarity", "attribute_value": "Medium - PWM duty cycle values need specification",
     "analysis_notes": "Missing specific duty cycle percentages for Low/Med/High", "score": 60,
     "created_at": ts(15), "updated_at": ts(5), "version": 1},
    {"id": "RA-0005", "wp_id": "17-54", "requirement_id": "REQ-009",
     "attribute_name": "feasibility", "attribute_value": "High - standard motor driver ramp feature",
     "analysis_notes": "STM32G4 timer supports linear/S-curve ramp profiles natively", "score": 88,
     "created_at": ts(15), "updated_at": ts(8), "version": 1},
    {"id": "RA-0006", "wp_id": "17-54", "requirement_id": "REQ-011",
     "attribute_name": "verifiability", "attribute_value": "Medium - requires EMC test facility",
     "analysis_notes": "Pre-compliance scan possible in-house; final certification requires accredited lab", "score": 70,
     "created_at": ts(14), "updated_at": ts(7), "version": 1},
]

print(f"  {len(req_attributes)} requirement attributes")
write_json(os.path.join(PROJECT_DIR, "requirement_attributes.json"), req_attributes)

# ============================================================
# Step 9: Special Characteristics (4)
# ============================================================
special_chars = [
    {"id": "SC-0001", "wp_id": "17-57", "source_id": "REQ-006", "source_type": "requirement",
     "characteristic_type": "safety", "description": "Thermal protection shutdown - prevents fire risk",
     "rationale": "Over-temperature can cause winding insulation failure and fire risk in household environment",
     "classification": "Safety-Critical",
     "created_at": ts(22), "updated_at": ts(10), "version": 1},
    {"id": "SC-0002", "wp_id": "17-57", "source_id": "BLK-0002", "source_type": "architecture",
     "characteristic_type": "performance", "description": "Motor assembly is the primary performance-critical component",
     "rationale": "Motor assembly determines airflow, noise, and power - three of four stakeholder requirements",
     "classification": "Performance-Critical",
     "created_at": ts(22), "updated_at": ts(10), "version": 1},
    {"id": "SC-0003", "wp_id": "17-57", "source_id": "REQ-003", "source_type": "requirement",
     "characteristic_type": "reliability", "description": "Noise level impacts user comfort and product reviews",
     "rationale": "Noise is top customer complaint factor; directly impacts product reviews and NPS",
     "classification": "Customer-Facing",
     "created_at": ts(20), "updated_at": ts(8), "version": 1},
    {"id": "SC-0004", "wp_id": "17-57", "source_id": "BLK-0005", "source_type": "architecture",
     "characteristic_type": "reliability", "description": "Bearing wear is the primary failure mode",
     "rationale": "Bearing wear is primary failure mode - MTBF driven by bearing selection and lubrication",
     "classification": "Reliability-Critical",
     "created_at": ts(20), "updated_at": ts(8), "version": 1},
]

print(f"  {len(special_chars)} special characteristics")
write_json(os.path.join(PROJECT_DIR, "special_characteristics.json"), special_chars)

# ============================================================
# Step 10: Consistency Evidence (4)
# ============================================================
consistency_evidence = [
    {"id": "CE-0001", "wp_id": "13-51", "evidence_type": "tool_link",
     "source_id": "REQ-001", "source_type": "requirement",
     "target_id": "VM-0001", "target_type": "verification_measure",
     "description": "HIL test VM-0001 directly verifies motor speed requirement REQ-001",
     "status": "resolved", "deviation_rationale": "", "resolution": "",
     "created_at": ts(15), "updated_at": ts(5), "version": 1},
    {"id": "CE-0002", "wp_id": "13-51", "evidence_type": "review_record",
     "source_id": "REQ-007", "source_type": "requirement",
     "target_id": "BLK-0001", "target_type": "architecture",
     "description": "Mass budget review confirmed all sub-assemblies accounted for",
     "status": "resolved", "deviation_rationale": "", "resolution": "",
     "created_at": ts(14), "updated_at": ts(4), "version": 1},
    {"id": "CE-0003", "wp_id": "13-51", "evidence_type": "change_comment",
     "source_id": "REQ-004", "source_type": "requirement",
     "target_id": "BLK-0002", "target_type": "architecture",
     "description": "Motor power limit tightened from 50W to 45W per efficiency analysis",
     "status": "resolved", "deviation_rationale": "Efficiency analysis showed 45W achievable",
     "resolution": "Requirement updated, architecture confirmed compatible",
     "created_at": ts(12), "updated_at": ts(3), "version": 2},
    {"id": "CE-0004", "wp_id": "13-51", "evidence_type": "revision_history",
     "source_id": "REQ-008", "source_type": "requirement",
     "target_id": "REQ-001", "target_type": "requirement",
     "description": "PWM speed levels requirement derived from motor speed control - pending duty cycle specification",
     "status": "open", "deviation_rationale": "Specific duty cycle values TBD",
     "resolution": "",
     "created_at": ts(10), "updated_at": ts(5), "version": 1},
]

print(f"  {len(consistency_evidence)} consistency evidence")
write_json(os.path.join(PROJECT_DIR, "consistency_evidence.json"), consistency_evidence)

# ============================================================
# Step 11: Communication Evidence (3)
# ============================================================
communication_evidence = [
    {"id": "COM-0001", "wp_id": "13-52", "comm_type": "approval",
     "subject": "Stakeholder Requirements Baseline Review",
     "content": "All 4 stakeholder requirements (STK-001 through STK-004) reviewed and approved by product management and systems engineering team.",
     "participants": ["Wei Lin", "Jun Chen", "Mei Huang", "Xiao Li"],
     "decision": "Approved - baseline established for Smart Fan v1.0",
     "related_entity_ids": ["STK-001", "STK-002", "STK-003", "STK-004"],
     "comm_date": ts(28),
     "created_at": ts(28), "updated_at": ts(28), "version": 1},
    {"id": "COM-0002", "wp_id": "13-52", "comm_type": "review_sign_off",
     "subject": "System Architecture Review (SAR)",
     "content": "System architecture reviewed against all system requirements. Motor/controller/impeller decomposition approved. Action item: finalize bearing specification.",
     "participants": ["Jun Chen", "Xiao Li", "Mei Huang"],
     "decision": "Approved with action items (AI-001: bearing spec by Week 6)",
     "related_entity_ids": ["BLK-0001", "BLK-0002", "BLK-0006", "BLK-0007"],
     "comm_date": ts(22),
     "created_at": ts(22), "updated_at": ts(22), "version": 1},
    {"id": "COM-0003", "wp_id": "13-52", "comm_type": "status_update",
     "subject": "V&V Progress Report - Week 10",
     "content": "6 of 8 verification measures executed. VM-0007 (EMC) pending lab availability. VM-0006 vibration result marginal - under review.",
     "participants": ["Wei Lin", "Jun Chen"],
     "decision": "Continue. Escalate EMC lab scheduling. Review vibration data.",
     "related_entity_ids": ["VM-0001", "VM-0002", "VM-0003", "VM-0004", "VM-0005", "VM-0006"],
     "comm_date": ts(3),
     "created_at": ts(3), "updated_at": ts(3), "version": 1},
]

print(f"  {len(communication_evidence)} communication evidence")
write_json(os.path.join(PROJECT_DIR, "communication_evidence.json"), communication_evidence)

# ============================================================
# Step 12: Verification Results (7)
# ============================================================
verification_results = [
    {"id": "VR-0001", "wp_id": "15-52", "measure_id": "VM-0001", "data_id": "VD-0001",
     "result": "pass", "result_type": "quantitative",
     "summary": "Motor reached 4985 RPM at 12.01V - within +/-50 RPM tolerance",
     "defects": [], "deviation_notes": "", "reviewed_by": "Mei Huang", "review_date": ts(4),
     "created_at": ts(5), "updated_at": ts(4), "version": 1},
    {"id": "VR-0002", "wp_id": "15-52", "measure_id": "VM-0002", "data_id": "",
     "result": "pass", "result_type": "quantitative",
     "summary": "Airflow measured at 358 CFM - exceeds 350 CFM target",
     "defects": [], "deviation_notes": "", "reviewed_by": "Jun Chen", "review_date": ts(4),
     "created_at": ts(5), "updated_at": ts(4), "version": 1},
    {"id": "VR-0003", "wp_id": "15-52", "measure_id": "VM-0003", "data_id": "VD-0002",
     "result": "pass", "result_type": "quantitative",
     "summary": "Noise measured at 42.3 dB(A) at 1m - below 45 dB limit",
     "defects": [], "deviation_notes": "", "reviewed_by": "Jun Chen", "review_date": ts(3),
     "created_at": ts(4), "updated_at": ts(3), "version": 1},
    {"id": "VR-0004", "wp_id": "15-52", "measure_id": "VM-0004", "data_id": "VD-0003",
     "result": "pass", "result_type": "quantitative",
     "summary": "Motor power measured at 41.8W - below 45W limit (7.1% margin)",
     "defects": [], "deviation_notes": "", "reviewed_by": "Mei Huang", "review_date": ts(3),
     "created_at": ts(4), "updated_at": ts(3), "version": 1},
    {"id": "VR-0005", "wp_id": "15-52", "measure_id": "VM-0005", "data_id": "",
     "result": "pass", "result_type": "quantitative",
     "summary": "Thermal shutdown triggered at 84.7 deg C - within +/-2 deg C of 85 deg C spec",
     "defects": [], "deviation_notes": "", "reviewed_by": "Mei Huang", "review_date": ts(3),
     "created_at": ts(4), "updated_at": ts(3), "version": 1},
    {"id": "VR-0006", "wp_id": "15-52", "measure_id": "VM-0006", "data_id": "VD-0004",
     "result": "fail", "result_type": "quantitative",
     "summary": "Vibration measured at 0.48 mm/s RMS - marginally below 0.5 limit (4% margin). Third run showed 0.51 mm/s exceedance.",
     "defects": ["Intermittent vibration spike above 0.5 mm/s at 125Hz bearing frequency"],
     "deviation_notes": "Bearing preload adjustment may reduce vibration. Retest after adjustment scheduled.",
     "reviewed_by": "Jun Chen", "review_date": ts(2),
     "created_at": ts(3), "updated_at": ts(2), "version": 1},
    {"id": "VR-0007", "wp_id": "15-52", "measure_id": "VM-0008", "data_id": "",
     "result": "pass", "result_type": "quantitative",
     "summary": "Total mass 773g - below 800g limit (3.4% margin)",
     "defects": [], "deviation_notes": "", "reviewed_by": "Jun Chen", "review_date": ts(2),
     "created_at": ts(3), "updated_at": ts(2), "version": 1},
]

print(f"  {len(verification_results)} verification results")
write_json(os.path.join(PROJECT_DIR, "verification_results.json"), verification_results)

# ============================================================
# Step 13: Verification Data (4)
# ============================================================
verification_data = [
    {"id": "VD-0001", "wp_id": "03-50", "measure_id": "VM-0001",
     "execution_date": ts(5), "executor": "Jun Chen",
     "environment_config": {"platform": "STM32G4 Nucleo + custom motor driver shield", "firmware": "v0.9.2"},
     "raw_data": {"rpm_readings": [4980, 4985, 4990], "voltage": 12.01, "temperature_ambient": 25.2},
     "notes": "Stable readings after 5s ramp. No oscillation observed.",
     "attachments": [],
     "created_at": ts(5), "updated_at": ts(5), "version": 1},
    {"id": "VD-0002", "wp_id": "03-50", "measure_id": "VM-0003",
     "execution_date": ts(4), "executor": "Mei Huang",
     "environment_config": {"chamber": "Semi-anechoic room B2", "instrument": "B&K 2250 SLM"},
     "raw_data": {"dba_readings": [42.1, 42.3, 42.5], "distance_m": 1.0, "background_noise": 27.8},
     "notes": "Background noise verified < 30 dB(A) before test.",
     "attachments": [],
     "created_at": ts(4), "updated_at": ts(4), "version": 1},
    {"id": "VD-0003", "wp_id": "03-50", "measure_id": "VM-0004",
     "execution_date": ts(4), "executor": "Jun Chen",
     "environment_config": {"instrument": "Yokogawa WT310", "input_voltage": "12.0V regulated"},
     "raw_data": {"power_readings": [41.5, 41.8, 42.0], "voltage": 12.0, "current": 3.48},
     "notes": "Measurements taken after 120s thermal stabilization.",
     "attachments": [],
     "created_at": ts(4), "updated_at": ts(4), "version": 1},
    {"id": "VD-0004", "wp_id": "03-50", "measure_id": "VM-0006",
     "execution_date": ts(3), "executor": "Mei Huang",
     "environment_config": {"sensor": "PCB 352C03 accelerometer", "daq": "NI-9234 @ 25.6 kS/s"},
     "raw_data": {"rms_velocity": [0.45, 0.48, 0.51], "frequency_peak_hz": 125, "measurement_point": "bearing_housing"},
     "notes": "Third reading exceeded limit. Suspect bearing preload issue. Retest scheduled after adjustment.",
     "attachments": [],
     "created_at": ts(3), "updated_at": ts(3), "version": 1},
]

print(f"  {len(verification_data)} verification data records")
write_json(os.path.join(PROJECT_DIR, "verification_data.json"), verification_data)

# ============================================================
# Step 14: Analysis Results (4)
# ============================================================
analysis_results = [
    {"id": "AR-0001", "wp_id": "15-51", "source_id": "REQ-001", "source_type": "requirement",
     "analysis_type": "verifiability", "result": "Requirement is fully verifiable via HIL tachometer test",
     "score": 95, "issues": [], "recommendations": [],
     "risk_level": "low",
     "created_at": ts(18), "updated_at": ts(10), "version": 1},
    {"id": "AR-0002", "wp_id": "15-51", "source_id": "REQ-008", "source_type": "requirement",
     "analysis_type": "completeness", "result": "Missing specific PWM duty cycle values for Low/Med/High levels",
     "score": 55, "issues": ["Duty cycle percentages not specified", "Speed vs. duty cycle curve TBD"],
     "recommendations": ["Define duty cycles: Low=30%, Med=60%, High=100%", "Add speed-duty curve to design doc"],
     "risk_level": "medium",
     "created_at": ts(15), "updated_at": ts(8), "version": 1},
    {"id": "AR-0003", "wp_id": "15-51", "source_id": "BLK-0001", "source_type": "architecture",
     "analysis_type": "feasibility", "result": "Architecture is feasible with commercial-off-the-shelf components",
     "score": 90, "issues": [],
     "recommendations": ["Consider second-source for motor to reduce supply chain risk"],
     "risk_level": "low",
     "created_at": ts(15), "updated_at": ts(8), "version": 1},
    {"id": "AR-0004", "wp_id": "15-51", "source_id": "REQ-010", "source_type": "requirement",
     "analysis_type": "boundary", "result": "Vibration limit 0.5 mm/s has tight margin - measured 0.48, one run exceeded",
     "score": 65, "issues": ["Marginal vibration result at bearing fundamental frequency (125Hz)"],
     "recommendations": ["Adjust bearing preload", "Consider vibration damping mount", "Increase limit to 0.6 mm/s if acceptable"],
     "risk_level": "high",
     "created_at": ts(8), "updated_at": ts(3), "version": 2},
]

print(f"  {len(analysis_results)} analysis results")
write_json(os.path.join(PROJECT_DIR, "analysis_results.json"), analysis_results)

# ============================================================
# Step 15: Verification Selection Sets (2)
# ============================================================
selection_sets = [
    {"id": "SS-0001", "wp_id": "08-58", "title": "R1.0 System Verification Suite",
     "measure_ids": ["VM-0001", "VM-0002", "VM-0003", "VM-0004", "VM-0005", "VM-0006", "VM-0008"],
     "entry_criteria": "All firmware and hardware changes reviewed and approved",
     "exit_criteria": "All measures pass; no open critical defects",
     "release_scope": "Smart Fan v1.0 Release",
     "regression_strategy": "Full regression on firmware changes; smoke test on documentation changes",
     "selection_rationale": "Covers motor, airflow, noise, power, thermal, vibration, and mass",
     "created_at": ts(18), "updated_at": ts(5), "version": 2},
    {"id": "SS-0002", "wp_id": "08-58", "title": "EMC Pre-Compliance Test Suite",
     "measure_ids": ["VM-0007"],
     "entry_criteria": "Final PCB layout frozen; production-intent samples available",
     "exit_criteria": "All emissions below EN 55014-1 Class B limits with 6dB margin",
     "release_scope": "EMC Certification",
     "regression_strategy": "Full EMC scan on any PCB layout change",
     "selection_rationale": "EMC compliance is regulatory gate for market release",
     "created_at": ts(16), "updated_at": ts(8), "version": 1},
]

print(f"  {len(selection_sets)} verification selection sets")
write_json(os.path.join(PROJECT_DIR, "verification_selection_sets.json"), selection_sets)

# ============================================================
# Step 16: Integration Instructions (3)
# ============================================================
integration_instructions = [
    {"id": "II-0001", "wp_id": "06-50", "title": "Motor Sub-Assembly Integration",
     "sequence_order": 0,
     "instruction": "1. Press-fit rotor onto motor shaft.\n2. Insert stator into motor can.\n3. Install bearing pack with spring preload.\n4. Verify free rotation by hand.",
     "architecture_element_ids": ["ARCH-0003", "ARCH-0004", "ARCH-0005"],
     "prerequisites": ["Rotor magnetized and balanced", "Stator winding resistance verified"],
     "expected_outcome": "Motor sub-assembly rotates freely with < 0.1 Nm drag torque",
     "created_at": ts(20), "updated_at": ts(10), "version": 1},
    {"id": "II-0002", "wp_id": "06-50", "title": "Controller Board and Impeller Installation",
     "sequence_order": 1,
     "instruction": "1. Mount controller board on standoffs inside housing.\n2. Connect motor phase wires to FET bridge.\n3. Press-fit impeller onto motor shaft.\n4. Verify impeller clearance to housing (min 2mm).",
     "architecture_element_ids": ["ARCH-0006", "ARCH-0007"],
     "prerequisites": ["Motor sub-assembly complete (II-0001)", "Controller firmware loaded"],
     "expected_outcome": "Controller drives motor; impeller spins without interference",
     "created_at": ts(18), "updated_at": ts(8), "version": 1},
    {"id": "II-0003", "wp_id": "06-50", "title": "Final Assembly",
     "sequence_order": 2,
     "instruction": "1. Install motor+impeller assembly into housing.\n2. Route power supply cable through grommet.\n3. Attach finger guard.\n4. Connect power supply and run functional test.",
     "architecture_element_ids": ["ARCH-0002", "ARCH-0008", "ARCH-0009"],
     "prerequisites": ["Board and impeller integration complete (II-0002)", "Housing QC passed"],
     "expected_outcome": "Complete fan assembly operational at all 3 speed levels",
     "created_at": ts(15), "updated_at": ts(5), "version": 1},
]

print(f"  {len(integration_instructions)} integration instructions")
write_json(os.path.join(PROJECT_DIR, "integration_instructions.json"), integration_instructions)

# ============================================================
# Step 17: Integrated Systems (2)
# ============================================================
integrated_systems = [
    {"id": "IS-0001", "wp_id": "11-06", "title": "Motor Sub-Assembly",
     "element_ids": ["ARCH-0003", "ARCH-0004", "ARCH-0005"],
     "integration_instruction_ids": ["II-0001"],
     "integration_status": "completed",
     "integration_notes": "All 10 units assembled and tested. One unit reworked for bearing alignment.",
     "integration_date": ts(10),
     "created_at": ts(10), "updated_at": ts(5), "version": 1},
    {"id": "IS-0002", "wp_id": "11-06", "title": "Smart Fan Complete Assembly",
     "element_ids": ["ARCH-0001", "ARCH-0002", "ARCH-0003", "ARCH-0004", "ARCH-0005",
                      "ARCH-0006", "ARCH-0007", "ARCH-0008", "ARCH-0009"],
     "integration_instruction_ids": ["II-0001", "II-0002", "II-0003"],
     "integration_status": "in_progress",
     "integration_notes": "5 of 10 units fully assembled. Remaining 5 awaiting power supply delivery.",
     "integration_date": ts(5),
     "created_at": ts(5), "updated_at": ts(2), "version": 1},
]

print(f"  {len(integrated_systems)} integrated systems")
write_json(os.path.join(PROJECT_DIR, "integrated_systems.json"), integrated_systems)

# ============================================================
# Step 18: Empty files for remaining entity types
# ============================================================
# These exist but have no demo data - keep as empty arrays
# so the app doesn't complain about missing files

# ============================================================
# Step 19: Migration flags (prevent auto-migration overwriting seed data)
# ============================================================
with open(os.path.join(PROJECTS_DIR, ".migrated"), "w") as f:
    f.write("migrated")
with open(os.path.join(PROJECT_DIR, ".migrated_v2"), "w") as f:
    f.write("migrated_v2")

# ============================================================
# Summary
# ============================================================
print()
print("=" * 60)
print("Smart Fan System Demo Seed Complete")
print("=" * 60)
print(f"Project: Smart Fan System [id=1]")
print(f"  {len(requirements)} requirements (4 stakeholder + 12 system)")
print(f"  {len(blocks)} system blocks (hierarchical with soc())")
print(f"  {len(vnv_rules)} V&V rules (7 verified, 2 not_verified)")
print(f"  {len(verification_measures)} verification measures")
print(f"  {len(traceability_links)} traceability links")
print(f"  {len(arch_elements)} architecture elements")
print(f"  {len(req_attributes)} requirement attributes")
print(f"  {len(special_chars)} special characteristics")
print(f"  {len(consistency_evidence)} consistency evidence")
print(f"  {len(communication_evidence)} communication evidence")
print(f"  {len(verification_results)} verification results (6 pass, 1 fail)")
print(f"  {len(verification_data)} verification data records")
print(f"  {len(analysis_results)} analysis results")
print(f"  {len(selection_sets)} verification selection sets")
print(f"  {len(integration_instructions)} integration instructions")
print(f"  {len(integrated_systems)} integrated systems")
print()
print("Run the backend: python -m uvicorn main:app --reload --port 8000")
print("Run the frontend: cd ../frontend && npm run dev")
