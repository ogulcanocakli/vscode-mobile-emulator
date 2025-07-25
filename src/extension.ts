import * as vscode from 'vscode';
import { EmulatorService } from './emulatorService';

export function activate(context: vscode.ExtensionContext) {
    const emulatorService = new EmulatorService(context);
    
    let disposable = vscode.commands.registerCommand('mobileEmulator.start', () => {
        emulatorService.startEmulator();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}