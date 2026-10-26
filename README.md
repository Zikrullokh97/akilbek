# Gesture Control AI — macOS Intelligent Desktop Assistant

## 🚀 Quick Start

### Prerequisites

- macOS 12+ (Monterey or later)
- Python 3.12+
- Node.js 18+
- Homebrew (recommended)

### 1. Clone and Setup

```bash
# Frontend (React)
cd gesture-control-ai
npm install

# Backend (Python Desktop Agent)
cd desktop-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Configure Environment

Edit `desktop-agent/.env`:

```bash
# Generate a secure token
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the generated token to `AUTH_TOKEN` in `.env`.

### 3. Enable macOS Permissions

Go to **System Preferences → Privacy & Security**:

| Permission | Path | Required For |
|---|---|---|
| Camera | Privacy → Camera | Hand gesture tracking |
| Microphone | Privacy → Microphone | Voice commands |
| Accessibility | Privacy → Accessibility | Mouse/keyboard control |
| Automation | Privacy → Automation | App control |

### 4. Start the System

```bash
# Terminal 1 — Python Desktop Agent
cd desktop-agent
source venv/bin/activate
python -m app.main

# Terminal 2 — React Frontend
cd gesture-control-ai
npm run dev
```

### 5. Open the Dashboard

Navigate to **http://localhost:5173**

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Dashboard                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Camera   │ │  Voice   │ │  AI Chat │            │
│  │ +Gesture │ │  Engine  │ │  Panel   │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │             │            │                   │
│       └─────────────┼────────────┘                   │
│                     │                                │
│              WebSocket API                           │
│                     │                                │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│          Python Desktop Agent (FastAPI)              │
│                     │                                │
│         ┌───────────┼───────────┐                    │
│         │    Command Router     │                    │
│         └───────────┼───────────┘                    │
│                     │                                │
│    ┌────────────────┼────────────────┐               │
│    │                │                │               │
│  Mouse          Keyboard        Applications         │
│  Control        Control         Management           │
│    │                │                │               │
│    └────────────────┼────────────────┘               │
│                     │                                │
│              macOS Desktop                           │
└─────────────────────────────────────────────────────┘
```

## 🎮 Gesture Controls

| Gesture | Action |
|---|---|
| ☝️ Index finger extended | Move mouse cursor |
| 🤏 Thumb + index pinch | Left click |
| 🤏🤏 Two rapid pinches | Double click |
| 👌 Thumb + middle pinch | Right click |
| ✊ Closed fist | Pause pointer control |
| ✌️ Two fingers vertical | Scroll |
| 🤏💫 Pinch and hold | Drag and drop |
| 🖐️ Open palm (1 sec) | Toggle gesture mode |

## 🎤 Voice Commands

### English
- "Open Safari" / "Open Chrome" / "Open Terminal"
- "Increase volume" / "Decrease volume" / "Mute"
- "Take a screenshot"
- "Lock my screen"
- "Search Google for [query]"

### O'zbek
- "Safari'ni och"
- "Ovozni balandlat" / "Ovozni pasaytir"
- "Skrinshot ol"
- "Kompyuterni qulfla"

### Русский
- "Открой браузер"
- "Увеличь громкость"
- "Сделай скриншот"

### 한국어
- "사파리 열어 줘"
- "볼륨 높여 줘"
- "스크린샷 찍어 줘"

## 🔒 Security

- Agent binds to `127.0.0.1` only (localhost)
- WebSocket requires session token authentication
- Strict origin validation
- Command allowlist with Pydantic schema validation
- No arbitrary shell execution
- Emergency stop (Ctrl+Shift+Q)
- All data stays local

## ⚡ Emergency Controls

- **Dashboard**: Click the E-Stop button
- **Keyboard**: Press `Ctrl+Shift+Q`
- **PyAutoGUI Fail-Safe**: Move cursor to screen corner

## 📁 Project Structure

```
gesture-control-ai/
├── src/
│   ├── App.tsx              # Main dashboard
│   ├── components/          # UI panels
│   ├── hooks/               # Camera, gesture, voice, WebSocket
│   ├── store/               # Zustand state management
│   └── types/               # TypeScript types
├── desktop-agent/
│   ├── app/
│   │   ├── main.py          # FastAPI server
│   │   ├── config.py        # Configuration
│   │   ├── models/          # Pydantic schemas
│   │   ├── core/            # Router, safety, permissions
│   │   └── automation/      # Mouse, keyboard, apps, system
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## 🐛 Troubleshooting

### Camera not working
- Check browser permissions for camera access
- Ensure no other app is using the camera
- Try a different browser (Chrome recommended)

### Agent won't connect
- Verify the Python agent is running on port 8765
- Check the auth token matches in frontend and backend
- Check firewall isn't blocking localhost connections

### Gestures not recognized
- Ensure good lighting for camera
- Hold hand 30-60cm from camera
- Check gesture mode is enabled (open palm for 1 second)
- Adjust sensitivity in Gesture Settings

### Voice not working
- Check microphone permissions in browser
- Web Speech API works best in Chrome
- Select the correct language

---

Built with ❤️ for macOS productivity
