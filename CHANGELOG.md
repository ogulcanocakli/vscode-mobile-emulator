# Changelog

All notable changes to the VSCode Mobile Emulator extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2024-01-01

### Added
- Initial release of VSCode Mobile Emulator extension
- Android emulator support with SDK auto-detection
- iOS Simulator support for macOS
- TreeView device explorer in VSCode sidebar
- WebView panels for emulator display
- Device control interface (power, home, back, menu, volume)
- Touch interaction support with visual feedback
- Command Palette integration
- Settings/configuration support
- Multi-platform support (Windows, macOS, Linux)
- Real-time device status monitoring
- Screenshot capability
- Responsive emulator panel layout

### Features
- **Android Integration**:
  - Automatic Android SDK detection
  - AVD (Android Virtual Device) listing and management
  - Emulator start/stop controls
  - Android-specific device controls (back, menu buttons)
  
- **iOS Integration** (macOS only):
  - iOS Simulator detection via Xcode
  - iOS device listing and management
  - Simulator start/stop controls
  - iOS-specific interface adaptations

- **User Interface**:
  - Device TreeView with platform categorization
  - Interactive WebView panels with device frames
  - Touch/click interaction with coordinate mapping
  - Status indicators and connection management
  - Responsive design for different screen sizes

- **Developer Experience**:
  - Command Palette commands for quick access
  - Auto-refresh device lists
  - Error handling and user feedback
  - Configuration options for SDK paths
  - Extension activation on demand

### Technical
- Built with TypeScript and VSCode Extension API
- WebView-based emulator display with HTML5/CSS3/JavaScript
- Child process management for emulator lifecycle
- Cross-platform file system operations
- SDK and simulator detection utilities
- Event-driven architecture for real-time updates

### Requirements
- VSCode 1.74.0 or higher
- Node.js runtime
- Android SDK (for Android emulator support)
- Xcode with iOS Simulator (for iOS support on macOS)

### Known Issues
- Initial emulator startup may take longer than expected
- WebView touch events may need calibration on high-DPI displays
- iOS Simulator requires Xcode command line tools

### Platform Support
- Windows: Android emulator support
- macOS: Full Android and iOS support
- Linux: Android emulator support