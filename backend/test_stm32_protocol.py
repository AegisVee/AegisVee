import time
import sys
from stm32_uart_driver import STM32Driver

# Configuration
# NOTE: User needs to update the COM port to match their system
COM_PORT = "COM4" 

def test_protocol():
    driver = STM32Driver(COM_PORT)
    
    if not driver.connect():
        print("Could not connect to STM32. Please check connection and COM port.")
        return

    try:
        print("\n--- Testing STATUS ---")
        response = driver.get_status()
        print(f"Response: {response}")
        if response == "STATUS:RUNNING":
            print("PASS")
        else:
            print("FAIL")

        print("\n--- Testing ECHO ---")
        test_str = "HelloSTM32"
        response = driver.echo(test_str)
        print(f"Response: {response}")
        if response == f"ECHO:{test_str}":
            print("PASS")
        else:
            print("FAIL")

        print("\n--- Testing LED Control ---")
        print("Turning LEDs ON...")
        response = driver.set_led("ON")
        print(f"Response: {response}")
        time.sleep(1)
        
        print("Turning LEDs OFF...")
        response = driver.set_led("OFF")
        print(f"Response: {response}")
        time.sleep(1)

        print("Toggling LEDs...")
        response = driver.set_led("TOGGLE")
        print(f"Response: {response}")
        time.sleep(1)
        
        print("Toggling LEDs again...")
        response = driver.set_led("TOGGLE")
        print(f"Response: {response}")

    except KeyboardInterrupt:
        print("Test interrupted")
    finally:
        driver.disconnect()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        COM_PORT = sys.argv[1]
    test_protocol()
