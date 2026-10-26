"""
Safety Manager — Emergency stop, cursor constraints, and safety controls.
"""
import time
from typing import Optional


class SafetyManager:
    """Manages safety controls for desktop automation."""
    
    def __init__(self):
        self._is_stopped: bool = False
        self._stop_time: Optional[float] = None
        self._max_cursor_jump: int = 500  # pixels
        self._last_cursor_pos: tuple[int, int] = (0, 0)
        self._last_cursor_time: float = 0
        self._max_commands_per_second: int = 30
        self._command_times: list[float] = []
    
    @property
    def is_stopped(self) -> bool:
        return self._is_stopped
    
    def activate(self) -> None:
        """Activate emergency stop."""
        self._is_stopped = True
        self._stop_time = time.time()
        print("[SAFETY] Emergency stop ACTIVATED")
    
    def deactivate(self) -> None:
        """Deactivate emergency stop."""
        self._is_stopped = False
        self._stop_time = None
        print("[SAFETY] Emergency stop deactivated")
    
    def validate_cursor_move(self, x: int, y: int) -> bool:
        """Validate that a cursor move is within safe bounds."""
        if self._is_stopped:
            return False
        
        # Check for unreasonable jumps (possible detection glitch)
        dx = abs(x - self._last_cursor_pos[0])
        dy = abs(y - self._last_cursor_pos[1])
        
        if dx > self._max_cursor_jump or dy > self._max_cursor_jump:
            # Allow if it's the first move or enough time has passed
            if time.time() - self._last_cursor_time > 0.5:
                self._last_cursor_pos = (x, y)
                self._last_cursor_time = time.time()
                return True
            return False
        
        self._last_cursor_pos = (x, y)
        self._last_cursor_time = time.time()
        return True
    
    def check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        now = time.time()
        self._command_times = [t for t in self._command_times if now - t < 1.0]
        
        if len(self._command_times) >= self._max_commands_per_second:
            return False
        
        self._command_times.append(now)
        return True
    
    def get_status(self) -> dict:
        """Get current safety status."""
        return {
            "emergency_stop": self._is_stopped,
            "stop_time": self._stop_time,
            "max_cursor_jump": self._max_cursor_jump,
            "last_cursor_position": self._last_cursor_pos,
        }


safety_manager = SafetyManager()
