# VSCode Mobile Emulator Extension

A comprehensive VSCode extension that allows you to run Android and iOS emulators directly within docked panels in your development environment.

## Features

### 🤖 Android Emulator Support
- **Auto-detection** of Android SDK installation
- **List and manage** Android Virtual Devices (AVDs)
- **Start/Stop** emulators with one click
- **Integrated display** in VSCode webview panels
- **Device controls** (power, home, back, menu, volume)
- **Touch interaction** support

### 📱 iOS Simulator Support (macOS only)
- **Automatic detection** of Xcode iOS Simulator
- **List available** iOS device simulators
- **Start/Stop** simulators seamlessly
- **Webview integration** for simulator display
- **Device controls** and interaction support

### 🎯 User Interface
- **TreeView panel** showing all available devices
- **Command Palette** integration for quick access
- **Status bar** indicators for emulator status
- **Responsive webview** panels with device controls
- **Multi-emulator** support

## Installation

### Prerequisites

#### For Android Development:
- Android SDK installed and configured
- Android Virtual Devices (AVDs) created
- Environment variables set (`ANDROID_HOME` or `ANDROID_SDK_ROOT`)

#### For iOS Development (macOS only):
- Xcode installed with iOS Simulator
- iOS Simulator devices configured

### Install Extension

1. **From VSCode Marketplace**: Search for "Mobile Emulator" in the Extensions view
2. **From VSIX**: Download and install the `.vsix` file using `Extensions: Install from VSIX...`

## Usage

### Getting Started

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. **Run command**: `Mobile Emulator: Start Mobile Emulator`
3. **Select device** from the list of available emulators
4. **Wait for startup** - the emulator will appear in a new panel

### Available Commands

- `Mobile Emulator: Start Mobile Emulator` - Launch device selection
- `Mobile Emulator: Start Android Emulator` - Show Android devices only
- `Mobile Emulator: Start iOS Simulator` - Show iOS devices only (macOS)
- `Mobile Emulator: Stop Mobile Emulator` - Stop all running emulators
- `Mobile Emulator: Refresh Devices` - Refresh device list

### Device Tree View

- **Expand "Mobile Devices"** in the Explorer panel
- **Click on any device** to start it
- **Use refresh button** to update device list
- **View device details** in tooltips

### Emulator Controls

Each emulator panel includes:
- **🔄 Refresh** - Reload emulator connection
- **📷 Screenshot** - Capture emulator screen
- **⏻ Power** - Power button press
- **🏠 Home** - Home button press
- **⬅️ Back** - Back button (Android only)
- **☰ Menu** - Menu button (Android only)
- **🔊/🔉 Volume** - Volume up/down

### Touch Interaction

- **Click anywhere** on the emulator screen to simulate touch
- **Visual feedback** shows touch location
- **Coordinates** are automatically scaled to device resolution

## Configuration

Open VSCode Settings and search for "Mobile Emulator":

```json
{
  "mobileEmulator.androidSdkPath": "",
  "mobileEmulator.autoDetectSdk": true,
  "mobileEmulator.enableIOS": true,
  "mobileEmulator.emulatorWindowSize": "medium"
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `androidSdkPath` | string | `""` | Custom Android SDK path |
| `autoDetectSdk` | boolean | `true` | Auto-detect Android SDK |
| `enableIOS` | boolean | `true` | Enable iOS Simulator (macOS) |
| `emulatorWindowSize` | enum | `"medium"` | Default window size |

## Platform Support

| Platform | Android Emulator | iOS Simulator |
|----------|------------------|---------------|
| **Windows** | ✅ Full Support | ❌ Not Available |
| **macOS** | ✅ Full Support | ✅ Full Support |
| **Linux** | ✅ Full Support | ❌ Not Available |

## Troubleshooting

### Android Issues

**Q: "No Android emulators found"**
- Ensure Android SDK is installed
- Check `ANDROID_HOME` environment variable
- Verify AVDs are created in Android Studio
- Try setting custom SDK path in settings

**Q: "Emulator failed to start"**
- Check AVD configuration in Android Studio
- Ensure hardware acceleration is enabled
- Verify sufficient disk space and memory
- Check Android SDK tools are up to date

### iOS Issues (macOS only)

**Q: "iOS Simulator not available"**
- Ensure Xcode is installed
- Check iOS Simulator is available: `xcrun simctl list`
- Verify Xcode command line tools: `xcode-select --install`

**Q: "No iOS simulators found"**
- Open Xcode and download iOS runtimes
- Create simulator devices in Xcode
- Restart VSCode after Xcode setup

### General Issues

**Q: "Extension not activating"**
- Check VSCode version compatibility (requires 1.74.0+)
- Reload VSCode window
- Check Output panel for error messages

**Q: "Webview panel not loading"**
- Disable other webview extensions temporarily
- Check for JavaScript errors in Developer Tools
- Try refreshing the panel

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/ogulcanocakli/vscode-mobile-emulator.git
cd vscode-mobile-emulator

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package
```

### Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── commands/                 # Command implementations
│   ├── android.ts           # Android emulator commands
│   └── ios.ts               # iOS simulator commands
├── providers/               # TreeView providers
│   └── deviceProvider.ts    # Device list provider
├── webview/                 # WebView panels
│   ├── emulatorPanel.ts     # Emulator panel manager
│   └── media/               # WebView assets
├── utils/                   # Utility functions
│   ├── androidSdk.ts        # Android SDK utilities
│   └── iosSim.ts           # iOS Simulator utilities
└── types/                   # TypeScript definitions
    └── index.ts
```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add tests** for new functionality
5. **Submit** a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Enjoy mobile development directly in VSCode!** 🚀📱