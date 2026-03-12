import serial
import time

# Configuration
# In a real deployment, this should be configurable via env vars or UI
SERIAL_PORT = 'COM3' 
BAUD_RATE = 115200
TIMEOUT = 2

def run_hil(command):
    """
    Sends a command to the STM32 HIL board and returns the response.
    
    Args:
        command (str): The command string to send (e.g., "airbag_deployment_test").
        
    Returns:
        float: The numeric value returned by the board (e.g., execution time in ms).
               Returns -1.0 if communication fails or response is invalid.
    """
    try:
        # Open serial connection
        # Note: In a high-throughput scenario, we might want to keep this open
        # globally, but for MVP script execution, opening/closing per test is safer.
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=TIMEOUT) as ser:
            print(f"[HIL] Connecting to {SERIAL_PORT}...")
            
            # Clear buffers
            ser.reset_input_buffer()
            ser.reset_output_buffer()
            
            # Send command
            # Protocol: TEST:<COMMAND>\n
            full_command = f"TEST:{command}\n"
            print(f"[HIL] Sending: {full_command.strip()}")
            ser.write(full_command.encode('utf-8'))
            
            # Wait for response
            # We expect: RESULT:<VALUE>
            start_time = time.time()
            while (time.time() - start_time) < TIMEOUT:
                if ser.in_waiting:
                    line = ser.readline().decode('utf-8').strip()
                    print(f"[HIL] Received: {line}")
                    
                    if line.startswith("RESULT:"):
                        value_str = line.split(":")[1]
                        try:
                            return float(value_str)
                        except ValueError:
                            print(f"[HIL] Invalid numeric value: {value_str}")
                            return -1.0
                    elif line.startswith("ERROR:"):
                        print(f"[HIL] Device Error: {line}")
                        return -1.0
                time.sleep(0.01)
            
            print("[HIL] Timeout waiting for response.")
            return -1.0
                
    except serial.SerialException as e:
        print(f"[HIL] Serial Error: {e}")
        return -1.0
    except Exception as e:
        print(f"[HIL] Unexpected Error: {e}")
        return -1.0

# Mock function for testing without hardware
# Uncomment this to test if you don't have the board connected yet
# def run_hil(command):
#     print(f"[HIL-MOCK] Sending: {command}")
#     time.sleep(0.5)
#     return 24.0
