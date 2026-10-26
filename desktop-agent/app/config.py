"""
Gesture Control AI — Desktop Agent Configuration
"""
import os
import secrets
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    host: str = "127.0.0.1"
    port: int = 8765
    
    # Security
    auth_token: str = secrets.token_urlsafe(32)
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    # AI
    ai_provider: str = "none"  # none, ollama, openai
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"
    
    # Rate Limiting
    max_commands_per_second: int = 30
    max_cursor_moves_per_second: int = 60
    
    # Safety
    max_cursor_jump_pixels: int = 500
    require_confirmation_for: str = "lock_screen,close_application"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]
    
    @property
    def confirmation_required_actions(self) -> list[str]:
        return [a.strip() for a in self.require_confirmation_for.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
