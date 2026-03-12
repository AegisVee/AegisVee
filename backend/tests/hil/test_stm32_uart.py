import pytest
import time
from backend.stm32_uart_driver import STM32Driver

# Check if pyrenode3 is available
try:
    from pyrenode3.wrappers import Emulation, Monitor
except ImportError:
    Emulation = None

@pytest.mark.skipif(Emulation is None, reason="pyrenode3 not installed")
def test_uart_loopback():
    emulation = Emulation()
    
    # Setup Renode simulation
    emulation.CreatePlatform("STM32F4", "renodes/stm32f4_discovery.repl")
    
    # Ideally verify with a real firmware binary, but we might just check UART plumbing
    # emulation.LoadELF("renodes/firmware.elf") 
    
    # Create UART Hub to connect host to simulation
    # This part is tricky in pure Python without creating a virtual COM port (PTY/ETS)
    # Usually we use the Renode 'CreateSocket' or similar.
    # For this test, we might just verify the driver logic IF we had a real COM.
    
    # Strategy: Mock the Serial in the driver to point to a PTY created by Renode? 
    # Or just verify the driver sends what we expect.
    
    # Real HIL with Renode often uses a socket-terminal.
    pass

def test_driver_logic_mocked_serial(mocker):
    """
    Test the driver logic with a mocked serial port, 
    since setting up full Renode-UART-Host plumbing in a script 
    without external setup is complex.
    """
    mock_serial = mocker.Mock()
    mock_serial.is_open = True
    mock_serial.readline.return_value = b"SPEED:50.0\n"
    
    mocker.patch("serial.Serial", return_value=mock_serial)
    
    driver = STM32Driver(port="COM99")
    driver.connect()
    
    speed = driver.get_speed()
    assert speed == 50.0
    
    driver.send_command("LED:ON")
    mock_serial.write.assert_called_with(b"LED:ON\n")
