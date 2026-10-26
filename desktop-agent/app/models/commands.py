"""
Gesture Control AI — Command Models (Pydantic Schemas)
"""
from typing import Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class CommandType(str, Enum):
    """Allowed command types — strict allowlist."""
    MOUSE_MOVE = "mouse_move"
    MOUSE_CLICK = "mouse_click"
    MOUSE_SCROLL = "mouse_scroll"
    KEYBOARD_SHORTCUT = "keyboard_shortcut"
    TYPE_TEXT = "type_text"
    OPEN_APPLICATION = "open_application"
    FOCUS_APPLICATION = "focus_application"
    CLOSE_WINDOW = "close_window"
    OPEN_URL = "open_url"
    TAKE_SCREENSHOT = "take_screenshot"
    SET_VOLUME = "set_volume"
    SET_BRIGHTNESS = "set_brightness"
    LOCK_SCREEN = "lock_screen"
    BROWSER_SEARCH = "browser_search"
    EMERGENCY_STOP = "emergency_stop"
    HEARTBEAT = "heartbeat"


class WSCommand(BaseModel):
    """Incoming WebSocket command from the frontend."""
    version: str = "1.0"
    request_id: str
    type: CommandType
    payload: dict[str, Any] = Field(default_factory=dict)


class WSResponse(BaseModel):
    """Response sent back to the frontend."""
    request_id: str
    status: str  # success, error, pending
    message: str
    data: Optional[dict[str, Any]] = None


class MouseMovePayload(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)


class MouseClickPayload(BaseModel):
    button: str = "left"  # left, right, middle
    click_count: int = Field(default=1, ge=1, le=3)


class MouseScrollPayload(BaseModel):
    direction: str = "down"  # up, down, left, right
    amount: int = Field(default=3, ge=1, le=20)


class KeyboardPayload(BaseModel):
    key: str
    modifiers: list[str] = Field(default_factory=list)


class TypeTextPayload(BaseModel):
    text: str = Field(max_length=1000)


class OpenAppPayload(BaseModel):
    application: str = Field(max_length=100)


class OpenURLPayload(BaseModel):
    url: str = Field(max_length=2000)


class VolumePayload(BaseModel):
    direction: str  # up, down, mute
    amount: int = Field(default=5, ge=1, le=50)


class CommandValidation:
    """Validate command payloads against their schemas."""
    
    SCHEMAS = {
        CommandType.MOUSE_MOVE: MouseMovePayload,
        CommandType.MOUSE_CLICK: MouseClickPayload,
        CommandType.MOUSE_SCROLL: MouseScrollPayload,
        CommandType.KEYBOARD_SHORTCUT: KeyboardPayload,
        CommandType.TYPE_TEXT: TypeTextPayload,
        CommandType.OPEN_APPLICATION: OpenAppPayload,
        CommandType.OPEN_URL: OpenURLPayload,
        CommandType.SET_VOLUME: VolumePayload,
    }
    
    @classmethod
    def validate(cls, command_type: CommandType, payload: dict) -> dict:
        """Validate payload against the appropriate schema."""
        schema = cls.SCHEMAS.get(command_type)
        if schema:
            validated = schema(**payload)
            return validated.model_dump()
        return payload
