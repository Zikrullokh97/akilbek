"""
macOS Mouse Automation
Uses PyAutoGUI with macOS Quartz fallback for precise control.
"""
import sys
import time
from typing import Optional

try:
    import pyautogui
    pyautogui.FAILSAFE = True  # Move mouse to corner to abort
    pyautogui.PAUSE = 0.01
except ImportError:
    pyautogui = None

# macOS Quartz for native cursor control
if sys.platform == "darwin":
    try:
        import Quartz
        from Quartz import (
            CGEventCreateMouseEvent,
            CGEventPost,
            kCGEventMouseMoved,
            kCGEventLeftMouseDown,
            kCGEventLeftMouseUp,
            kCGEventRightMouseDown,
            kCGEventRightMouseUp,
            kCGMouseButtonLeft,
            kCGMouseButtonRight,
            kCGHIDEventTap,
            CGPointMake,
        )
        HAS_QUARTZ = True
    except ImportError:
        HAS_QUARTZ = False
else:
    HAS_QUARTZ = False


class MouseController:
    """Cross-platform mouse controller with macOS native support."""
    
    def __init__(self):
        self._last_position: Optional[tuple[int, int]] = None
        self._last_move_time: float = 0
    
    def move_to(self, x: int, y: int) -> bool:
        """Move cursor to absolute position."""
        try:
            if HAS_QUARTZ:
                point = CGPointMake(x, y)
                event = CGEventCreateMouseEvent(None, kCGEventMouseMoved, point, kCGMouseButtonLeft)
                CGEventPost(kCGHIDEventTap, event)
            elif pyautogui:
                pyautogui.moveTo(x, y, duration=0, _pause=False)
            else:
                return False
            self._last_position = (x, y)
            return True
        except Exception as e:
            print(f"Mouse move error: {e}")
            return False
    
    def click(self, button: str = "left", clicks: int = 1) -> bool:
        """Perform mouse click."""
        try:
            if HAS_QUARTZ:
                pos = self._last_position or self.get_position()
                point = CGPointMake(pos[0], pos[1])
                
                if button == "right":
                    down_type = kCGEventRightMouseDown
                    up_type = kCGEventRightMouseUp
                    btn = kCGMouseButtonRight
                else:
                    down_type = kCGEventLeftMouseDown
                    up_type = kCGEventLeftMouseUp
                    btn = kCGMouseButtonLeft
                
                for _ in range(clicks):
                    event_down = CGEventCreateMouseEvent(None, down_type, point, btn)
                    CGEventPost(kCGHIDEventTap, event_down)
                    time.sleep(0.05)
                    event_up = CGEventCreateMouseEvent(None, up_type, point, btn)
                    CGEventPost(kCGHIDEventTap, event_up)
                    if clicks > 1:
                        time.sleep(0.05)
            elif pyautogui:
                pyautogui.click(button=button, clicks=clicks)
            else:
                return False
            return True
        except Exception as e:
            print(f"Mouse click error: {e}")
            return False
    
    def scroll(self, direction: str = "down", amount: int = 3) -> bool:
        """Scroll in the given direction."""
        try:
            clicks = amount if direction == "up" else -amount
            if pyautogui:
                pyautogui.scroll(clicks)
            else:
                return False
            return True
        except Exception as e:
            print(f"Mouse scroll error: {e}")
            return False
    
    def drag_to(self, x: int, y: int, duration: float = 0.3) -> bool:
        """Drag from current position to target."""
        try:
            if pyautogui:
                pyautogui.dragTo(x, y, duration=duration, button="left")
            else:
                return False
            return True
        except Exception as e:
            print(f"Mouse drag error: {e}")
            return False
    
    def get_position(self) -> tuple[int, int]:
        """Get current cursor position."""
        try:
            if HAS_QUARTZ:
                event = Quartz.CGEventCreate(None)
                point = Quartz.CGEventGetLocation(event)
                return (int(point.x), int(point.y))
            elif pyautogui:
                return pyautogui.position()
        except Exception:
            pass
        return (0, 0)


mouse_controller = MouseController()
