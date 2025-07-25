# Change Log

## [1.0.0] - 2025-01-25

### Added
- Initial release of VSCode Mobile Emulator extension
- Embedded Android emulator panel within VSCode
- Real-time screen capture using ADB commands
- Touch event forwarding from WebView to emulator
- Device control buttons (power, navigation, volume, rotation)
- Automatic device detection and connection
- Responsive WebView interface with emulator-like styling
- Support for multiple Android devices/emulators

### Features
- **WebView Panel Integration**: Emulator displayed as VSCode tab instead of separate window
- **ADB Integration**: Full integration with Android Debug Bridge for device communication
- **Real-time Display**: 10 FPS screen capture for smooth user experience
- **Touch Input**: Click-to-tap functionality with coordinate mapping
- **Device Controls**: Complete set of hardware button simulations
- **Auto-detection**: Automatically finds and connects to available Android devices

### Technical Implementation
- TypeScript-based VSCode extension
- HTML/CSS/JavaScript WebView content
- Child process integration for ADB commands
- Base64 image streaming for screen display
- Coordinate transformation for touch events