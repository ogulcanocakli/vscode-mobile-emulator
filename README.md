# VSCode Mobile Emulator

VSCode extension that provides an embedded Android emulator panel within the editor.

## Features

- **Embedded Emulator Display**: View Android emulator directly within VSCode as a WebView panel
- **Real-time Screen Capture**: Live streaming of emulator screen using ADB commands
- **Touch Event Forwarding**: Click on the emulator screen to send touch events to the device
- **Device Controls**: Built-in controls for power, navigation, volume, and rotation
- **No Separate Window**: Everything integrated within VSCode interface

## Requirements

- Android SDK with ADB (Android Debug Bridge) installed and available in PATH
- Running Android emulator or connected Android device
- VSCode version 1.74.0 or higher

## Usage

1. Start an Android emulator or connect an Android device
2. Open VSCode
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette
4. Type "Start Mobile Emulator" and select the command
5. The emulator will open in a new panel within VSCode

## Controls

The extension provides several built-in controls:

### Power Controls
- **Power**: Toggle device power
- **Sleep**: Put device to sleep

### Navigation
- **Home**: Go to home screen
- **Back**: Navigate back
- **Recent Apps**: Open recent applications
- **Menu**: Open menu

### Volume
- **Volume Up/Down**: Adjust volume
- **Mute**: Toggle mute

### Rotation
- **Rotate**: Rotate device orientation

## How It Works

1. **Screen Capture**: Uses `adb exec-out screencap -p` to capture device screen in real-time
2. **Touch Events**: Converts WebView click coordinates to device coordinates using `adb shell input tap`
3. **Device Controls**: Sends key events using `adb shell input keyevent`

## Development

To build and run the extension locally:

```bash
npm install
npm run compile
```

To watch for changes during development:

```bash
npm run watch
```