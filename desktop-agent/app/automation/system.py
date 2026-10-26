"""
macOS System Control
Volume, brightness, screenshots, screen lock.
"""
import sys
import subprocess


class SystemController:
    """macOS system-level control."""
    
    def set_volume(self, direction: str, amount: int = 5) -> bool:
        """Adjust system volume."""
        try:
            if sys.platform == "darwin":
                if direction == "mute":
                    subprocess.run(
                        ["osascript", "-e", "set volume with output muted"],
                        capture_output=True, timeout=5
                    )
                elif direction == "up":
                    # Get current volume and increase
                    result = subprocess.run(
                        ["osascript", "-e", "output volume of (get volume settings)"],
                        capture_output=True, text=True, timeout=5
                    )
                    current = int(result.stdout.strip()) if result.stdout.strip() else 50
                    new_vol = min(100, current + amount)
                    subprocess.run(
                        ["osascript", "-e", f"set volume output volume {new_vol}"],
                        capture_output=True, timeout=5
                    )
                elif direction == "down":
                    result = subprocess.run(
                        ["osascript", "-e", "output volume of (get volume settings)"],
                        capture_output=True, text=True, timeout=5
                    )
                    current = int(result.stdout.strip()) if result.stdout.strip() else 50
                    new_vol = max(0, current - amount)
                    subprocess.run(
                        ["osascript", "-e", f"set volume output volume {new_vol}"],
                        capture_output=True, timeout=5
                    )
                return True
            return False
        except Exception as e:
            print(f"Volume error: {e}")
            return False
    
    def set_brightness(self, direction: str, amount: int = 10) -> bool:
        """Adjust screen brightness."""
        try:
            if sys.platform == "darwin":
                # Use osascript to adjust brightness via System Events
                if direction == "up":
                    subprocess.run(
                        ["osascript", "-e", 
                         'tell application "System Events" to key code 144'],  # F2 (brightness up)
                        capture_output=True, timeout=5
                    )
                elif direction == "down":
                    subprocess.run(
                        ["osascript", "-e",
                         'tell application "System Events" to key code 145'],  # F1 (brightness down)
                        capture_output=True, timeout=5
                    )
                return True
            return False
        except Exception as e:
            print(f"Brightness error: {e}")
            return False
    
    def take_screenshot(self) -> bool:
        """Take a screenshot."""
        try:
            if sys.platform == "darwin":
                subprocess.run(
                    ["screencapture", "-x"],  # -x for silent
                    capture_output=True, timeout=10
                )
                return True
            return False
        except Exception as e:
            print(f"Screenshot error: {e}")
            return False
    
    def lock_screen(self) -> bool:
        """Lock the screen."""
        try:
            if sys.platform == "darwin":
                subprocess.run(
                    ["pmset", "displaysleepnow"],
                    capture_output=True, timeout=10
                )
                return True
            return False
        except Exception as e:
            print(f"Lock screen error: {e}")
            return False
    
    def get_system_info(self) -> dict:
        """Get basic system information."""
        import psutil
        return {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_mb": int(psutil.virtual_memory().used / (1024 * 1024)),
            "memory_percent": psutil.virtual_memory().percent,
            "platform": sys.platform,
        }


system_controller = SystemController()
