import serial
import time
import threading

class STM32Driver:
    def __init__(self, port, baudrate=115200, timeout=1):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None
        self.lock = threading.Lock()

    def connect(self):
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            print(f"Connected to {self.port} at {self.baudrate}")
            return True
        except serial.SerialException as e:
            print(f"Failed to connect: {e}")
            return False

    def disconnect(self):
        if self.serial and self.serial.is_open:
            self.serial.close()
            print("Disconnected")

    def send_command(self, cmd):
        if not self.serial or not self.serial.is_open:
            print("Serial port not open")
            return None

        with self.lock:
            try:
                full_cmd = f"{cmd}\n"
                self.serial.write(full_cmd.encode('ascii'))
                print(f"[TX] {cmd}") # Log TX
                response = self.serial.readline().decode('ascii').strip()
                if not response:
                    print(f"[RX] <TIMEOUT or NO DATA>")
                else:
                    print(f"[RX] {response}") # Log RX
                return response
            except Exception as e:
                print(f"Error sending command: {e}")
                return None

    def set_led(self, state):
        """
        state: 'ON', 'OFF', 'TOGGLE'
        """
        if state not in ['ON', 'OFF', 'TOGGLE']:
            print("Invalid LED state")
            return None
        return self.send_command(f"LED:{state}")

    def echo(self, text):
        return self.send_command(f"ECHO:{text}")

    def get_status(self):
        return self.send_command("STATUS")

    def set_speed(self, speed):
        """
        Set the simulated speed on the ECU.
        """
        return self.send_command(f"SPEED:{speed}")

    def get_speed(self):
        """
        Get the current speed from the ECU.
        """
        response = self.send_command("GET_SPEED")
        # Expected response: "SPEED:<value>"
        if response and response.startswith("SPEED:"):
            try:
                return float(response.split(":")[1])
            except ValueError:
                return 0.0
        return 0.0
