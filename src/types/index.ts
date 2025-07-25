// Type definitions for the Mobile Emulator extension

export interface EmulatorDevice {
    id: string;
    name: string;
    platform: 'android' | 'ios';
    state: 'offline' | 'online' | 'running';
    apiLevel?: string;
    osVersion?: string;
}

export interface AndroidAVD {
    name: string;
    device: string;
    path: string;
    target: string;
    apiLevel: string;
    abi: string;
    state?: 'offline' | 'running';
}

export interface IOSDevice {
    udid: string;
    name: string;
    runtime: string;
    state: string;
    isAvailable: boolean;
}

export interface EmulatorConfig {
    androidSdkPath?: string;
    autoDetectSdk: boolean;
    enableIOS: boolean;
    emulatorWindowSize: 'small' | 'medium' | 'large' | 'auto';
}

export interface EmulatorPanel {
    panel: any; // vscode.WebviewPanel
    device: EmulatorDevice;
    process?: any; // child_process.ChildProcess
}