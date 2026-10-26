"""
Command Router — Routes validated commands to the appropriate automation module.
"""
import time
from typing import Any

from app.models.commands import CommandType, WSCommand, WSResponse, CommandValidation
from app.automation.mouse import mouse_controller
from app.automation.keyboard import keyboard_controller
from app.automation.applications import app_controller
from app.automation.system import system_controller
from app.core.safety_manager import safety_manager


class CommandRouter:
    """Routes incoming commands to the correct automation handler."""
    
    def __init__(self):
        self._last_cursor_pos: tuple[int, int] = (0, 0)
        self._command_count: int = 0
        self._command_window_start: float = time.time()
    
    async def route(self, command: WSCommand) -> WSResponse:
        """Route a validated command to the appropriate handler."""
        request_id = command.request_id
        
        # Check emergency stop
        if safety_manager.is_stopped and command.type != CommandType.HEARTBEAT:
            return WSResponse(
                request_id=request_id,
                status="error",
                message="Emergency stop active — all automation disabled"
            )
        
        # Rate limiting
        if not self._check_rate_limit(command.type):
            return WSResponse(
                request_id=request_id,
                status="error",
                message="Rate limit exceeded"
            )
        
        try:
            # Validate payload
            validated_payload = CommandValidation.validate(command.type, command.payload)
            
            # Route to handler
            result = await self._execute(command.type, validated_payload)
            
            return WSResponse(
                request_id=request_id,
                status="success",
                message=result
            )
        except ValueError as e:
            return WSResponse(
                request_id=request_id,
                status="error",
                message=f"Validation error: {str(e)}"
            )
        except Exception as e:
            return WSResponse(
                request_id=request_id,
                status="error",
                message=f"Execution error: {str(e)}"
            )
    
    async def _execute(self, cmd_type: CommandType, payload: dict) -> str:
        """Execute the command and return a status message."""
        match cmd_type:
            case CommandType.MOUSE_MOVE:
                x, y = payload["x"], payload["y"]
                # Safety: check for unreasonable cursor jumps
                if not safety_manager.validate_cursor_move(x, y):
                    return "Cursor move rejected — exceeds maximum jump distance"
                success = mouse_controller.move_to(x, y)
                self._last_cursor_pos = (x, y)
                return f"Cursor moved to ({x}, {y})" if success else "Failed to move cursor"
            
            case CommandType.MOUSE_CLICK:
                button = payload.get("button", "left")
                clicks = payload.get("click_count", 1)
                success = mouse_controller.click(button, clicks)
                return f"{'Double ' if clicks > 1 else ''}{'Right' if button == 'right' else 'Left'} click executed" if success else "Click failed"
            
            case CommandType.MOUSE_SCROLL:
                direction = payload.get("direction", "down")
                amount = payload.get("amount", 3)
                success = mouse_controller.scroll(direction, amount)
                return f"Scrolled {direction} by {amount}" if success else "Scroll failed"
            
            case CommandType.KEYBOARD_SHORTCUT:
                key = payload["key"]
                modifiers = payload.get("modifiers", [])
                success = keyboard_controller.press_key(key, modifiers)
                mods_str = "+".join(modifiers) + "+" if modifiers else ""
                return f"Pressed {mods_str}{key}" if success else "Key press failed"
            
            case CommandType.TYPE_TEXT:
                text = payload["text"]
                success = keyboard_controller.type_text(text)
                return f"Typed {len(text)} characters" if success else "Typing failed"
            
            case CommandType.OPEN_APPLICATION:
                app = payload["application"]
                success = app_controller.open_application(app)
                return f"Opened {app}" if success else f"Failed to open {app}"
            
            case CommandType.FOCUS_APPLICATION:
                app = payload.get("application", "")
                success = app_controller.focus_application(app)
                return f"Focused {app}" if success else f"Failed to focus {app}"
            
            case CommandType.CLOSE_WINDOW:
                success = app_controller.close_window()
                return "Closed window" if success else "Failed to close window"
            
            case CommandType.OPEN_URL:
                url = payload["url"]
                success = app_controller.open_url(url)
                return f"Opened URL: {url}" if success else "Failed to open URL"
            
            case CommandType.BROWSER_SEARCH:
                query = payload.get("query", "")
                app = payload.get("application", "Safari")
                success = app_controller.browser_search(query, app)
                return f"Searching for '{query}' in {app}" if success else "Search failed"
            
            case CommandType.TAKE_SCREENSHOT:
                success = system_controller.take_screenshot()
                return "Screenshot taken" if success else "Screenshot failed"
            
            case CommandType.SET_VOLUME:
                direction = payload.get("direction", "up")
                amount = payload.get("amount", 5)
                success = system_controller.set_volume(direction, amount)
                return f"Volume {direction}" if success else "Volume control failed"
            
            case CommandType.SET_BRIGHTNESS:
                direction = payload.get("direction", "up")
                success = system_controller.set_brightness(direction)
                return f"Brightness {direction}" if success else "Brightness control failed"
            
            case CommandType.LOCK_SCREEN:
                success = system_controller.lock_screen()
                return "Screen locked" if success else "Lock failed"
            
            case CommandType.EMERGENCY_STOP:
                safety_manager.activate()
                return "Emergency stop activated"
            
            case CommandType.HEARTBEAT:
                return "pong"
            
            case _:
                return f"Unknown command type: {cmd_type}"
    
    def _check_rate_limit(self, cmd_type: CommandType) -> bool:
        """Simple rate limiting."""
        now = time.time()
        window = 1.0  # 1 second window
        
        if now - self._command_window_start > window:
            self._command_count = 0
            self._command_window_start = now
        
        # Cursor moves have a higher limit
        limit = 60 if cmd_type == CommandType.MOUSE_MOVE else 30
        self._command_count += 1
        
        return self._command_count <= limit


command_router = CommandRouter()
