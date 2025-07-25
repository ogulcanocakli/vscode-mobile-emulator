import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('VSCode Mobile Emulator extension is now active!');

	let disposable = vscode.commands.registerCommand('vscode-mobile-emulator.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from VSCode Mobile Emulator!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}