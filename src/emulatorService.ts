import * as vscode from 'vscode';
import { spawn, exec } from 'child_process';
import * as path from 'path';

export class EmulatorService {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private screenCaptureInterval: NodeJS.Timeout | undefined;
    private currentDeviceId: string | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async startEmulator() {
        // First, get available devices
        const devices = await this.getAvailableDevices();
        
        if (devices.length === 0) {
            vscode.window.showErrorMessage('No Android devices/emulators found. Please start an emulator first.');
            return;
        }

        // Use the first available device
        this.currentDeviceId = devices[0];
        
        // Create webview panel
        this.createWebViewPanel();
        
        // Start screen capture
        this.startScreenCapture();
    }

    private async getAvailableDevices(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            exec('adb devices', (error, stdout, stderr) => {
                if (error) {
                    console.error('Error getting devices:', error);
                    resolve([]);
                    return;
                }

                const lines = stdout.split('\n');
                const devices = lines
                    .slice(1) // Skip header
                    .filter(line => line.trim() && line.includes('device'))
                    .map(line => line.split('\t')[0]);
                
                resolve(devices);
            });
        });
    }

    private createWebViewPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'emulatorView',
            'Android Emulator',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        this.panel.webview.html = this.getWebViewContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'touch':
                        this.sendTouchEvent(message.x, message.y);
                        break;
                    case 'key':
                        this.sendKeyEvent(message.keyCode);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        // Clean up when panel is disposed
        this.panel.onDidDispose(
            () => {
                this.stopScreenCapture();
                this.panel = undefined;
            },
            null,
            this.context.subscriptions
        );
    }

    private getWebViewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Android Emulator</title>
    <style>
        body {
            margin: 0;
            padding: 10px;
            background-color: #1e1e1e;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .emulator-container {
            display: flex;
            gap: 20px;
            height: 100vh;
        }
        
        .emulator-screen {
            background-color: #000;
            border: 2px solid #333;
            border-radius: 20px;
            padding: 20px;
            position: relative;
            max-width: 400px;
        }
        
        .screen-display {
            width: 100%;
            max-width: 360px;
            height: 640px;
            background-color: #000;
            border-radius: 10px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .screen-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .controls-panel {
            background-color: #2d2d30;
            border-radius: 10px;
            padding: 20px;
            min-width: 200px;
        }
        
        .control-group {
            margin-bottom: 20px;
        }
        
        .control-group h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #cccccc;
        }
        
        .control-button {
            background-color: #0e639c;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            margin: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        
        .control-button:hover {
            background-color: #1177bb;
        }
        
        .control-button:active {
            background-color: #0d5a8a;
        }
        
        .status-bar {
            background-color: #3c3c3c;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 14px;
            color: #cccccc;
        }
    </style>
</head>
<body>
    <div class="emulator-container">
        <div class="emulator-screen">
            <div class="status-bar">
                Device: <span id="device-id">Connecting...</span>
            </div>
            <div class="screen-display" id="screen-display">
                <div class="loading">Loading emulator screen...</div>
            </div>
        </div>
        
        <div class="controls-panel">
            <div class="control-group">
                <h3>Power Controls</h3>
                <button class="control-button" onclick="sendKey(26)">Power</button>
                <button class="control-button" onclick="sendKey(223)">Sleep</button>
            </div>
            
            <div class="control-group">
                <h3>Navigation</h3>
                <button class="control-button" onclick="sendKey(3)">Home</button>
                <button class="control-button" onclick="sendKey(4)">Back</button>
                <button class="control-button" onclick="sendKey(187)">Recent Apps</button>
                <button class="control-button" onclick="sendKey(82)">Menu</button>
            </div>
            
            <div class="control-group">
                <h3>Volume</h3>
                <button class="control-button" onclick="sendKey(24)">Volume Up</button>
                <button class="control-button" onclick="sendKey(25)">Volume Down</button>
                <button class="control-button" onclick="sendKey(164)">Mute</button>
            </div>
            
            <div class="control-group">
                <h3>Rotation</h3>
                <button class="control-button" onclick="sendKey(168)">Rotate</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const screenDisplay = document.getElementById('screen-display');
        const deviceIdSpan = document.getElementById('device-id');
        
        // Handle touch events on screen
        screenDisplay.addEventListener('click', (event) => {
            const rect = screenDisplay.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Scale coordinates to emulator resolution (assuming 1080x1920)
            const scaleX = 1080 / rect.width;
            const scaleY = 1920 / rect.height;
            
            const emulatorX = Math.round(x * scaleX);
            const emulatorY = Math.round(y * scaleY);
            
            vscode.postMessage({
                type: 'touch',
                x: emulatorX,
                y: emulatorY
            });
        });
        
        function sendKey(keyCode) {
            vscode.postMessage({
                type: 'key',
                keyCode: keyCode
            });
        }
        
        // Listen for screen updates
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'updateScreen':
                    const img = document.querySelector('.screen-image');
                    if (img) {
                        img.src = 'data:image/png;base64,' + message.data;
                    } else {
                        screenDisplay.innerHTML = '<img class="screen-image" src="data:image/png;base64,' + message.data + '" alt="Emulator Screen">';
                    }
                    break;
                case 'deviceInfo':
                    deviceIdSpan.textContent = message.deviceId;
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    private startScreenCapture() {
        if (!this.currentDeviceId) {
            return;
        }

        // Send device info to webview
        this.panel?.webview.postMessage({
            type: 'deviceInfo',
            deviceId: this.currentDeviceId
        });

        // Capture screen every 100ms (10 FPS)
        this.screenCaptureInterval = setInterval(async () => {
            const screenshot = await this.captureScreen();
            if (screenshot && this.panel) {
                this.panel.webview.postMessage({
                    type: 'updateScreen',
                    data: screenshot
                });
            }
        }, 100);
    }

    private stopScreenCapture() {
        if (this.screenCaptureInterval) {
            clearInterval(this.screenCaptureInterval);
            this.screenCaptureInterval = undefined;
        }
    }

    private async captureScreen(): Promise<string | null> {
        if (!this.currentDeviceId) {
            return null;
        }

        return new Promise((resolve) => {
            exec(`adb -s ${this.currentDeviceId} exec-out screencap -p`, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Screen capture error:', error);
                    resolve(null);
                    return;
                }

                if (stdout && stdout.length > 0) {
                    const base64 = stdout.toString('base64');
                    resolve(base64);
                } else {
                    resolve(null);
                }
            });
        });
    }

    private async sendTouchEvent(x: number, y: number) {
        if (!this.currentDeviceId) {
            return;
        }

        exec(`adb -s ${this.currentDeviceId} shell input tap ${x} ${y}`, (error, stdout, stderr) => {
            if (error) {
                console.error('Touch event error:', error);
            }
        });
    }

    private async sendKeyEvent(keyCode: number) {
        if (!this.currentDeviceId) {
            return;
        }

        exec(`adb -s ${this.currentDeviceId} shell input keyevent ${keyCode}`, (error, stdout, stderr) => {
            if (error) {
                console.error('Key event error:', error);
            }
        });
    }
}