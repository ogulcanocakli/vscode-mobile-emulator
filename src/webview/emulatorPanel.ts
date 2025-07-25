import * as vscode from 'vscode';
import * as path from 'path';
import { EmulatorDevice, EmulatorPanel } from '../types';

export class EmulatorPanelManager {
    private panels: Map<string, EmulatorPanel> = new Map();
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async createEmulatorPanel(device: EmulatorDevice): Promise<vscode.WebviewPanel> {
        // Check if panel already exists for this device
        const existingPanel = this.panels.get(device.id);
        if (existingPanel) {
            existingPanel.panel.reveal();
            return existingPanel.panel;
        }

        // Create new webview panel
        const panel = vscode.window.createWebviewPanel(
            'mobileEmulator',
            `${device.name} - ${device.platform.toUpperCase()}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'media')
                ]
            }
        );

        // Set the webview content
        panel.webview.html = this.getWebviewContent(panel.webview, device);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message, device),
            undefined,
            this.context.subscriptions
        );

        // Handle panel disposal
        panel.onDidDispose(
            () => this.onPanelDisposed(device.id),
            null,
            this.context.subscriptions
        );

        // Store the panel
        const emulatorPanel: EmulatorPanel = {
            panel,
            device
        };
        this.panels.set(device.id, emulatorPanel);

        return panel;
    }

    private getWebviewContent(webview: vscode.Webview, device: EmulatorDevice): string {
        // Get URIs for CSS and JS files
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'media', 'emulator.css')
        );
        
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'media', 'emulator.js')
        );

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>${device.name} Emulator</title>
</head>
<body>
    <div class="emulator-container">
        <div class="emulator-header">
            <h2>${device.name}</h2>
            <div class="emulator-controls">
                <button id="refreshBtn" title="Refresh">🔄</button>
                <button id="screenshotBtn" title="Take Screenshot">📷</button>
                <button id="volumeUpBtn" title="Volume Up">🔊</button>
                <button id="volumeDownBtn" title="Volume Down">🔉</button>
                <button id="powerBtn" title="Power">⏻</button>
                <button id="homeBtn" title="Home">🏠</button>
                <button id="backBtn" title="Back" ${device.platform === 'ios' ? 'style="display:none"' : ''}>⬅️</button>
                <button id="menuBtn" title="Menu" ${device.platform === 'ios' ? 'style="display:none"' : ''}>☰</button>
            </div>
        </div>
        
        <div class="emulator-screen-container">
            <div class="emulator-screen" id="emulatorScreen">
                <div class="loading-message">
                    <div class="spinner"></div>
                    <p>Connecting to ${device.name}...</p>
                    <p class="loading-details">
                        Platform: ${device.platform.toUpperCase()}<br>
                        ${device.apiLevel ? `API Level: ${device.apiLevel}` : ''}
                        ${device.osVersion ? `OS: ${device.osVersion}` : ''}
                    </p>
                </div>
            </div>
        </div>
        
        <div class="emulator-footer">
            <div class="status-info">
                Status: <span id="statusText">Starting...</span>
            </div>
            <div class="connection-info">
                Platform: ${device.platform.toUpperCase()} | 
                Device: ${device.name}
            </div>
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
    <script nonce="${nonce}">
        window.deviceInfo = ${JSON.stringify(device)};
        initializeEmulator();
    </script>
</body>
</html>`;
    }

    private handleWebviewMessage(message: any, device: EmulatorDevice): void {
        switch (message.command) {
            case 'refresh':
                this.refreshEmulatorView(device);
                break;
            case 'screenshot':
                this.takeScreenshot(device);
                break;
            case 'power':
                this.sendKeyEvent(device, 'power');
                break;
            case 'home':
                this.sendKeyEvent(device, 'home');
                break;
            case 'back':
                this.sendKeyEvent(device, 'back');
                break;
            case 'menu':
                this.sendKeyEvent(device, 'menu');
                break;
            case 'volumeUp':
                this.sendKeyEvent(device, 'volume_up');
                break;
            case 'volumeDown':
                this.sendKeyEvent(device, 'volume_down');
                break;
            case 'touch':
                this.sendTouchEvent(device, message.x, message.y);
                break;
            case 'log':
                console.log(`Emulator ${device.name}:`, message.message);
                break;
        }
    }

    private async refreshEmulatorView(device: EmulatorDevice): Promise<void> {
        const panel = this.panels.get(device.id);
        if (panel) {
            // Send refresh message to webview
            panel.panel.webview.postMessage({
                command: 'refresh',
                device: device
            });
        }
    }

    private async takeScreenshot(device: EmulatorDevice): Promise<void> {
        try {
            // Implementation would depend on the platform
            vscode.window.showInformationMessage(`Taking screenshot of ${device.name}...`);
            
            // For now, just show a message
            // In a real implementation, this would capture the emulator screen
            setTimeout(() => {
                vscode.window.showInformationMessage('Screenshot saved to workspace');
            }, 1000);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to take screenshot: ${error}`);
        }
    }

    private async sendKeyEvent(device: EmulatorDevice, key: string): Promise<void> {
        try {
            // Implementation would send the key event to the emulator
            console.log(`Sending ${key} to ${device.name}`);
            
            const panel = this.panels.get(device.id);
            if (panel) {
                panel.panel.webview.postMessage({
                    command: 'keyPressed',
                    key: key
                });
            }
        } catch (error) {
            console.error(`Failed to send key event: ${error}`);
        }
    }

    private async sendTouchEvent(device: EmulatorDevice, x: number, y: number): Promise<void> {
        try {
            // Implementation would send touch coordinates to the emulator
            console.log(`Touch event at (${x}, ${y}) on ${device.name}`);
        } catch (error) {
            console.error(`Failed to send touch event: ${error}`);
        }
    }

    private onPanelDisposed(deviceId: string): void {
        this.panels.delete(deviceId);
    }

    public async stopAllEmulators(): Promise<void> {
        for (const [deviceId, panel] of this.panels) {
            panel.panel.dispose();
        }
        this.panels.clear();
    }

    public getActivePanel(deviceId: string): EmulatorPanel | undefined {
        return this.panels.get(deviceId);
    }

    public getAllActivePanels(): EmulatorPanel[] {
        return Array.from(this.panels.values());
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose(): void {
        this.stopAllEmulators();
    }
}