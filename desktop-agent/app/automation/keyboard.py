"""
macOS Keyboard Automation
Uses PyAutoGUI with macOS Quartz/Applescript fallback.
"""
import sys
import subprocess
import time

try:
    import pyautogui
    pyautogui.FAILSAFE = True
except ImportError:
    pyautogui = None

if sys.platform == "darwin":
    try:
        import Quartz
        from Quartz import (
            CGEventCreateKeyboardEvent,
            CGEventPost,
            CGEventSetFlags,
            kCGHIDEventTap,
            kCGEventFlagMaskShift,
            kCGEventFlagMaskControl,
            kCGEventFlagMaskAlternate,
            kCGEventFlagMaskCommand,
        )
        HAS_QUARTZ = True
    except ImportError:
        HAS_QUARTZ = False
else:
    HAS_QUARTZ = False


# Key name to keycode mapping (macOS)
KEY_CODES = {
    "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7,
    "c": 8, "v": 9, "b": 11, "q": 12, "w": 13, "e": 14, "r": 15,
    "y": 16, "t": 17, "1": 18, "2": 19, "3": 20, "4": 21, "5": 22,
    "6": 23, "7": 24, "8": 25, "9": 26, "0": 27, "return": 36,
    "tab": 48, "space": 49, "delete": 51, "escape": 53,
    "right": 124, "left": 123, "down": 125, "up": 126,
    "f1": 122, "f2": 120, "f3": 99, "f4": 118, "f5": 96,
    "f6": 97, "f7": 98, "f8": 100, "f9": 101, "f10": 109,
    "f11": 103, "f12": 111,
}

MODIFIER_FLAGS = {
    "shift": kCGEventFlagMaskShift if HAS_QUARTZ else 0,
    "ctrl": kCGEventFlagMaskControl if HAS_QUARTZ else 0,
    "alt": kCGEventFlagMaskAlternate if HAS_QUARTZ else 0,
    "cmd": kCGEventFlagMaskCommand if HAS_QUARTZ else 0,
    "command": kCGEventFlagMaskCommand if HAS_QUARTZ else 0,
    "option": kCGEventFlagMaskAlternate if HAS_QUARTZ else 0,
}


class KeyboardController:
    """Cross-platform keyboard controller with macOS native support."""
    
    def press_key(self, key: str, modifiers: list[str] | None = None) -> bool:
        """Press a key with optional modifiers."""
        try:
            if HAS_QUARTZ and key.lower() in KEY_CODES:
                keycode = KEY_CODES[key.lower()]
                
                # Calculate modifier flags
                flags = 0
                if modifiers:
                    for mod in modifiers:
                        flags |= MODIFIER_FLAGS.get(mod.lower(), 0)
                
                # Key down
                event_down = CGEventCreateKeyboardEvent(None, keycode, True)
                if flags:
                    CGEventSetFlags(event_down, flags)
                CGEventPost(kCGHIDEventTap, event_down)
                
                time.sleep(0.02)
                
                # Key up
                event_up = CGEventCreateKeyboardEvent(None, keycode, False)
                CGEventPost(kCGHIDEventTap, event_up)
                
                return True
            elif pyautogui:
                if modifiers:
                    pyautogui.hotkey(*modifiers, key)
                else:
                    pyautogui.press(key)
                return True
            return False
        except Exception as e:
            print(f"Keyboard error: {e}")
            return False
    
    def type_text(self, text: str) -> bool:
        """Type text string."""
        try:
            if pyautogui:
                pyautogui.typewrite(text, interval=0.02) if text.isascii() else self._type_unicode(text)
                return True
            return False
        except Exception as e:
            print(f"Type text error: {e}")
            return False
    
    def _type_unicode(self, text: str) -> bool:
        """Type unicode text using macOS clipboard."""
        if sys.platform == "darwin":
            try:
                # Use pbcopy to set clipboard, then Cmd+V to paste
                process = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
                process.communicate(text.encode("utf-8"))
                time.sleep(0.1)
                if pyautogui:
                    pyautogui.hotkey("command", "v")
                return True
            except Exception:
                return False
        return False
    
    def hotkey(self, *keys: str) -> bool:
        """Press a key combination."""
        try:
            if pyautogui:
                pyautogui.hotkey(*keys)
                return True
            return False
        except Exception as e:
            print(f"Hotkey error: {e}")
            return False


keyboard_controller = KeyboardController()
