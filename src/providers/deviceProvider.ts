import * as vscode from 'vscode';
import { AndroidCommands } from '../commands/android';
import { IOSCommands } from '../commands/ios';
import { EmulatorDevice } from '../types';

export class DeviceProvider implements vscode.TreeDataProvider<DeviceItem | PlatformItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DeviceItem | PlatformItem | undefined | null | void> = new vscode.EventEmitter<DeviceItem | PlatformItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DeviceItem | PlatformItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private androidCommands: AndroidCommands;
    private iosCommands: IOSCommands;
    private devices: EmulatorDevice[] = [];

    constructor() {
        this.androidCommands = new AndroidCommands();
        this.iosCommands = new IOSCommands();
        this.refresh();
    }

    async refresh(): Promise<void> {
        try {
            const androidDevices = await this.androidCommands.getAvailableDevices();
            const iosDevices = await this.iosCommands.getAvailableDevices();
            
            this.devices = [...androidDevices, ...iosDevices];
            this._onDidChangeTreeData.fire();
        } catch (error) {
            console.error('Failed to refresh device list:', error);
            vscode.window.showErrorMessage('Failed to refresh device list');
        }
    }

    getTreeItem(element: DeviceItem | PlatformItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DeviceItem | PlatformItem): Thenable<(DeviceItem | PlatformItem)[]> {
        if (!element) {
            // Root level - show platform categories
            const platforms = this.getAvailablePlatforms();
            return Promise.resolve(platforms.map(platform => new PlatformItem(platform)));
        }

        if (element instanceof PlatformItem) {
            // Platform level - show devices for this platform
            const platformDevices = this.devices.filter(device => device.platform === element.platform);
            return Promise.resolve(platformDevices.map(device => new DeviceItem(device)));
        }

        return Promise.resolve([]);
    }

    private getAvailablePlatforms(): ('android' | 'ios')[] {
        const platforms = new Set<'android' | 'ios'>();
        this.devices.forEach(device => platforms.add(device.platform));
        return Array.from(platforms);
    }

    public async getAllDevices(): Promise<EmulatorDevice[]> {
        return this.devices;
    }

    public getDevice(id: string): EmulatorDevice | undefined {
        return this.devices.find(device => device.id === id);
    }

    public dispose(): void {
        this._onDidChangeTreeData.dispose();
    }
}

export class PlatformItem extends vscode.TreeItem {
    constructor(
        public readonly platform: 'android' | 'ios'
    ) {
        super(platform.toUpperCase(), vscode.TreeItemCollapsibleState.Expanded);
        
        this.tooltip = `${platform.toUpperCase()} devices`;
        this.contextValue = 'platform';
        
        // Set appropriate icons
        this.iconPath = new vscode.ThemeIcon(
            platform === 'android' ? 'device-mobile' : 'device-mobile'
        );
    }
}

export class DeviceItem extends vscode.TreeItem {
    constructor(
        public readonly device: EmulatorDevice
    ) {
        super(device.name, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = this.buildTooltip();
        this.description = this.buildDescription();
        this.contextValue = 'device';
        
        // Set icon based on state
        this.iconPath = this.getDeviceIcon();
        
        // Add command to start the device
        this.command = {
            command: 'mobile-emulator.start',
            title: 'Start Emulator',
            arguments: [this.device]
        };
    }

    private buildTooltip(): string {
        const parts = [
            `Name: ${this.device.name}`,
            `Platform: ${this.device.platform.toUpperCase()}`,
            `State: ${this.device.state}`
        ];

        if (this.device.apiLevel) {
            parts.push(`API Level: ${this.device.apiLevel}`);
        }

        if (this.device.osVersion) {
            parts.push(`OS Version: ${this.device.osVersion}`);
        }

        return parts.join('\n');
    }

    private buildDescription(): string {
        const parts = [];
        
        if (this.device.state === 'running') {
            parts.push('●');
        }
        
        if (this.device.apiLevel) {
            parts.push(`API ${this.device.apiLevel}`);
        } else if (this.device.osVersion) {
            parts.push(this.device.osVersion);
        }

        parts.push(this.device.state);

        return parts.join(' ');
    }

    private getDeviceIcon(): vscode.ThemeIcon {
        const baseIcon = this.device.platform === 'android' ? 'device-mobile' : 'device-mobile';
        
        switch (this.device.state) {
            case 'running':
                return new vscode.ThemeIcon(baseIcon, new vscode.ThemeColor('terminal.ansiGreen'));
            case 'online':
                return new vscode.ThemeIcon(baseIcon, new vscode.ThemeColor('terminal.ansiYellow'));
            case 'offline':
            default:
                return new vscode.ThemeIcon(baseIcon, new vscode.ThemeColor('terminal.ansiBlack'));
        }
    }
}