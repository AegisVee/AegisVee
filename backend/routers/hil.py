from fastapi import APIRouter, Request
import os
import subprocess
import inspect
import time
from stm32_uart_driver import STM32Driver

router = APIRouter(prefix="/api", tags=["HIL"])

@router.post("/run_script")
async def run_script(request: Request):
    try:
        body = await request.json()
        script_content = body.get("script", "")
        
        if not script_content:
            return {"error": "Script content is required"}
            
        full_script = f"""
import sys
import time
import inspect
sys.path.append('.')
from stm32_uart_driver import STM32Driver

hil = STM32Driver(port='COM3')

# --- User Script Start ---
{script_content}
# --- User Script End ---

if __name__ == "__main__":
    test_found = False
    current_locals = list(locals().items())
    for name, obj in current_locals:
        if name.startswith("test_") and inspect.isfunction(obj):
            test_found = True
            print(f"Running test: {{name}}")
            start_time = time.time()
            try:
                obj()
                duration = time.time() - start_time
                print(f"TEST RESULT: PASS (Duration: {{duration:.2f}}s)")
            except AssertionError as e:
                duration = time.time() - start_time
                print(f"TEST RESULT: FAIL - Assertion Error: {{e}} (Duration: {{duration:.2f}}s)")
            except Exception as e:
                duration = time.time() - start_time
                print(f"TEST RESULT: FAIL - Error: {{e}} (Duration: {{duration:.2f}}s)")
            finally:
                hil.disconnect()
    
    if not test_found:
        print("No test function (starting with 'test_') found.")
"""

        temp_script_path = "temp_hil_test.py"
        with open(temp_script_path, "w", encoding="utf-8") as f:
            f.write(full_script)
            
        try:
            result = subprocess.run(
                ["python", temp_script_path], 
                capture_output=True, 
                text=True, 
                timeout=30,
                cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
            )
            
            output = result.stdout
            if result.stderr:
                output += "\n[STDERR]\n" + result.stderr
                
            return {"output": output, "returncode": result.returncode}
            
        except subprocess.TimeoutExpired:
            return {"output": "Error: Test execution timed out (30s limit).", "returncode": -1}
        except Exception as e:
            return {"output": f"Error executing script: {str(e)}", "returncode": -1}
            
    except Exception as e:
        return {"error": str(e)}
