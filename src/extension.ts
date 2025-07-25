import * as vscode from 'vscode';
import { DeviceProvider } from './providers/deviceProvider';
import { AndroidCommands } from './commands/android';
import { IOSCommands } from './commands/ios';
import { EmulatorPanelManager } from './webview/emulatorPanel';

let deviceProvider: DeviceProvider;
let androidCommands: AndroidCommands;
let iosCommands: IOSCommands;
let panelManager: EmulatorPanelManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Mobile Emulator extension is now active!');

    // Initialize providers and managers
    deviceProvider = new DeviceProvider();
    androidCommands = new AndroidCommands();
    iosCommands = new IOSCommands();
    panelManager = new EmulatorPanelManager(context);

    // Register TreeView
    vscode.window.createTreeView('mobileEmulatorDevices', {
        treeDataProvider: deviceProvider,
        showCollapseAll: true
    });

    // Register commands
    const commands = [
        vscode.commands.registerCommand('mobile-emulator.start', async (device?) => {
            if (device) {
                await startEmulator(device);
            } else {
                await selectAndStartEmulator();
            }
        }),

        vscode.commands.registerCommand('mobile-emulator.stop', async () => {
            await panelManager.stopAllEmulators();
            vscode.window.showInformationMessage('All emulators stopped');
        }),

        vscode.commands.registerCommand('mobile-emulator.refresh', async () => {
            await deviceProvider.refresh();
            vscode.window.showInformationMessage('Device list refreshed');
        }),

        vscode.commands.registerCommand('mobile-emulator.startAndroid', async () => {
            const devices = await androidCommands.getAvailableDevices();
            if (devices.length === 0) {
                vscode.window.showWarningMessage('No Android emulators found. Make sure Android SDK is installed.');
                return;
            }
            
            const selected = await vscode.window.showQuickPick(
                devices.map(d => ({ label: d.name, description: d.apiLevel, device: d })),
                { placeHolder: 'Select Android emulator to start' }
            );
            
            if (selected) {
                await startEmulator(selected.device);
            }
        }),

        vscode.commands.registerCommand('mobile-emulator.startIOS', async () => {
            if (process.platform !== 'darwin') {
                vscode.window.showErrorMessage('iOS Simulator is only available on macOS');
                return;
            }
            
            const devices = await iosCommands.getAvailableDevices();
            if (devices.length === 0) {
                vscode.window.showWarningMessage('No iOS simulators found. Make sure Xcode is installed.');
                return;
            }
            
            const selected = await vscode.window.showQuickPick(
                devices.map(d => ({ label: d.name, description: d.osVersion || 'iOS', device: d })),
                { placeHolder: 'Select iOS simulator to start' }
            );
            
            if (selected) {
                await startEmulator(selected.device);
            }
        })
    ];

    context.subscriptions.push(...commands);

    // Initialize device detection
    initializeDeviceDetection();
}

export function deactivate() {
    console.log('Mobile Emulator extension is being deactivated');
    if (panelManager) {
        panelManager.dispose();
    }
}

async function initializeDeviceDetection() {
    try {
        await deviceProvider.refresh();
    } catch (error) {
        console.error('Failed to initialize device detection:', error);
    }
}

async function selectAndStartEmulator() {
    const allDevices = await deviceProvider.getAllDevices();
    
    if (allDevices.length === 0) {
        vscode.window.showWarningMessage('No emulators found. Make sure Android SDK or Xcode is installed.');
        return;
    }

    const selected = await vscode.window.showQuickPick(
        allDevices.map(d => ({
            label: d.name,
            description: `${d.platform.toUpperCase()} - ${d.state}`,
            device: d
        })),
        { placeHolder: 'Select emulator to start' }
    );

    if (selected) {
        await startEmulator(selected.device);
    }
}

async function startEmulator(device: any) {
    try {
        vscode.window.showInformationMessage(`Starting ${device.name}...`);
        
        if (device.platform === 'android') {
            await androidCommands.startEmulator(device);
        } else if (device.platform === 'ios') {
            await iosCommands.startSimulator(device);
        }
        
        // Create webview panel for the emulator
        await panelManager.createEmulatorPanel(device);
        
        vscode.window.showInformationMessage(`${device.name} started successfully`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start ${device.name}: ${error}`);
    }
}