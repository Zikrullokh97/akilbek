"""
macOS Application Management
Uses subprocess/osascript for application control.
"""
import sys
import subprocess
import time


class ApplicationController:
    """macOS application controller using osascript and subprocess."""
    
    # Map common names to macOS app names/bundle IDs
    APP_ALIASES = {
        "safari": "Safari",
        "chrome": "Google Chrome",
        "firefox": "Firefox",
        "finder": "Finder",
        "terminal": "Terminal",
        "calculator": "Calculator",
        "notes": "Notes",
        "mail": "Mail",
        "messages": "Messages",
        "music": "Music",
        "photos": "Photos",
        "maps": "Maps",
        "calendar": "Calendar",
        "reminders": "Reminders",
        "preview": "Preview",
        "textedit": "TextEdit",
        "vscode": "Visual Studio Code",
        "code": "Visual Studio Code",
        "slack": "Slack",
        "discord": "Discord",
        "spotify": "Spotify",
    }
    
    def open_application(self, app_name: str) -> bool:
        """Open an application by name."""
        resolved_name = self._resolve_app_name(app_name)
        try:
            if sys.platform == "darwin":
                subprocess.run(
                    ["open", "-a", resolved_name],
                    check=True,
                    capture_output=True,
                    timeout=10
                )
            else:
                subprocess.run([resolved_name.lower()], capture_output=True, timeout=10)
            return True
        except Exception as e:
            print(f"Failed to open {resolved_name}: {e}")
            return False
    
    def focus_application(self, app_name: str) -> bool:
        """Bring application to foreground."""
        resolved_name = self._resolve_app_name(app_name)
        try:
            if sys.platform == "darwin":
                script = f'''
                tell application "{resolved_name}" to activate
                '''
                subprocess.run(
                    ["osascript", "-e", script],
                    check=True,
                    capture_output=True,
                    timeout=5
                )
            return True
        except Exception as e:
            print(f"Failed to focus {resolved_name}: {e}")
            return False
    
    def close_window(self) -> bool:
        """Close the frontmost window."""
        try:
            if sys.platform == "darwin":
                script = '''
                tell application "System Events"
                    keystroke "w" using command down
                end tell
                '''
                subprocess.run(
                    ["osascript", "-e", script],
                    check=True,
                    capture_output=True,
                    timeout=5
                )
            return True
        except Exception as e:
            print(f"Failed to close window: {e}")
            return False
    
    def open_url(self, url: str) -> bool:
        """Open a URL in the default browser."""
        try:
            if not url.startswith(("http://", "https://")):
                url = f"https://{url}"
            
            if sys.platform == "darwin":
                subprocess.run(["open", url], check=True, capture_output=True, timeout=10)
            else:
                subprocess.run(["xdg-open", url], capture_output=True, timeout=10)
            return True
        except Exception as e:
            print(f"Failed to open URL {url}: {e}")
            return False
    
    def browser_search(self, query: str, application: str = "Safari") -> bool:
        """Open a browser search."""
        import urllib.parse
        encoded_query = urllib.parse.quote_plus(query)
        url = f"https://www.google.com/search?q={encoded_query}"
        
        if sys.platform == "darwin":
            resolved = self._resolve_app_name(application)
            try:
                subprocess.run(
                    ["open", "-a", resolved, url],
                    check=True,
                    capture_output=True,
                    timeout=10
                )
                return True
            except Exception:
                # Fallback to default browser
                return self.open_url(url)
        return self.open_url(url)
    
    def _resolve_app_name(self, name: str) -> str:
        """Resolve app alias to actual macOS app name."""
        return self.APP_ALIASES.get(name.lower(), name)


app_controller = ApplicationController()
