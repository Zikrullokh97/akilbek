"""
Gesture Control AI — FastAPI Main Application
"""
import time
import json
import secrets
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.models.commands import WSCommand, WSResponse, CommandType
from app.core.command_router import command_router
from app.core.safety_manager import safety_manager
from app.automation.system import system_controller

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gesture-control-agent")

# Active sessions
active_sessions: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting Gesture Control Agent on {settings.host}:{settings.port}")
    logger.info(f"Auth token: {'*' * 8}{settings.auth_token[-4:]}")
    yield
    logger.info("Shutting down Gesture Control Agent")


app = FastAPI(
    title="Gesture Control AI — Desktop Agent",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — NOT authentication, just origin restriction
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── REST API ────────────────────────────────────────────────────────────────

class CommandRequest(BaseModel):
    type: str
    payload: dict[str, Any] = {}


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}


@app.get("/api/status")
async def get_status(token: str = Query(...)):
    if not secrets.compare_digest(token, settings.auth_token):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {
        "connected": True,
        "emergency_stop": safety_manager.is_stopped,
        "safety": safety_manager.get_status(),
        "system": system_controller.get_system_info(),
    }


@app.get("/api/capabilities")
async def get_capabilities(token: str = Query(...)):
    if not secrets.compare_digest(token, settings.auth_token):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {
        "commands": [ct.value for ct in CommandType],
        "platform": "macOS" if __import__("sys").platform == "darwin" else "unknown",
    }


@app.post("/api/command")
async def post_command(request: CommandRequest, token: str = Query(...)):
    if not secrets.compare_digest(token, settings.auth_token):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        cmd = WSCommand(
            request_id=f"rest-{int(time.time()*1000)}",
            type=CommandType(request.type),
            payload=request.payload,
        )
        response = await command_router.route(cmd)
        return response.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/emergency-stop")
async def emergency_stop(token: str = Query(...)):
    if not secrets.compare_digest(token, settings.auth_token):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    safety_manager.activate()
    return {"status": "activated", "message": "Emergency stop activated"}


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/control")
async def websocket_control(websocket: WebSocket, token: str = Query(default="")):
    # Authenticate
    if not secrets.compare_digest(token, settings.auth_token):
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    # Origin check
    origin = websocket.headers.get("origin", "")
    if origin and origin not in settings.allowed_origins_list:
        await websocket.close(code=4003, reason="Origin not allowed")
        return
    
    await websocket.accept()
    session_id = secrets.token_hex(8)
    active_sessions[session_id] = {"connected_at": time.time()}
    logger.info(f"WebSocket session {session_id} connected from {origin}")
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                raw = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "request_id": "unknown",
                    "status": "error",
                    "message": "Invalid JSON"
                })
                continue
            
            # Handle heartbeat
            if raw.get("type") == "heartbeat":
                await websocket.send_json({
                    "request_id": "hb",
                    "status": "success",
                    "message": "pong",
                    "data": {"timestamp": time.time()}
                })
                continue
            
            # Parse and validate command
            try:
                command = WSCommand(**raw)
            except Exception as e:
                await websocket.send_json({
                    "request_id": raw.get("request_id", "unknown"),
                    "status": "error",
                    "message": f"Invalid command: {str(e)}"
                })
                continue
            
            # Route command
            response = await command_router.route(command)
            await websocket.send_json(response.model_dump())
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket session {session_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        active_sessions.pop(session_id, None)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
