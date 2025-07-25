import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { AndroidAVD } from '../types';

export class AndroidSDKUtils {
    private sdkPath: string | null = null;

    constructor() {
        this.detectSDKPath();
    }

    private detectSDKPath(): void {
        // Try multiple common locations for Android SDK
        const possiblePaths = [
            process.env.ANDROID_HOME,
            process.env.ANDROID_SDK_ROOT,
            path.join(os.homedir(), 'Android', 'Sdk'),
            path.join(os.homedir(), 'Library', 'Android', 'sdk'), // macOS
            '/opt/android-sdk',
            'C:\\Android\\Sdk', // Windows
            'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Android\\Sdk'
        ];

        for (const sdkPath of possiblePaths) {
            if (sdkPath && this.isValidSDKPath(sdkPath)) {
                this.sdkPath = sdkPath;
                break;
            }
        }
    }

    private isValidSDKPath(path: string): boolean {
        try {
            const platformToolsPath = this.joinPath(path, 'platform-tools');
            const emulatorPath = this.joinPath(path, 'emulator');
            
            return fs.existsSync(platformToolsPath) && fs.existsSync(emulatorPath);
        } catch {
            return false;
        }
    }

    private joinPath(...paths: string[]): string {
        return path.join(...paths);
    }

    public getSDKPath(): string | null {
        return this.sdkPath;
    }

    public setSDKPath(path: string): boolean {
        if (this.isValidSDKPath(path)) {
            this.sdkPath = path;
            return true;
        }
        return false;
    }

    public getEmulatorPath(): string | null {
        if (!this.sdkPath) {
            return null;
        }
        
        const emulatorDir = this.joinPath(this.sdkPath, 'emulator');
        const emulatorBin = process.platform === 'win32' ? 'emulator.exe' : 'emulator';
        const emulatorPath = this.joinPath(emulatorDir, emulatorBin);
        
        return fs.existsSync(emulatorPath) ? emulatorPath : null;
    }

    public getAVDManagerPath(): string | null {
        if (!this.sdkPath) {
            return null;
        }
        
        const cmdlineToolsPath = this.joinPath(this.sdkPath, 'cmdline-tools', 'latest', 'bin');
        const avdManagerBin = process.platform === 'win32' ? 'avdmanager.bat' : 'avdmanager';
        const avdManagerPath = this.joinPath(cmdlineToolsPath, avdManagerBin);
        
        if (fs.existsSync(avdManagerPath)) {
            return avdManagerPath;
        }
        
        // Try tools directory (older SDK structure)
        const toolsPath = this.joinPath(this.sdkPath, 'tools', 'bin');
        const avdManagerPathOld = this.joinPath(toolsPath, avdManagerBin);
        
        return fs.existsSync(avdManagerPathOld) ? avdManagerPathOld : null;
    }

    public async getAVDList(): Promise<AndroidAVD[]> {
        const avdManagerPath = this.getAVDManagerPath();
        if (!avdManagerPath) {
            throw new Error('AVD Manager not found. Make sure Android SDK is properly installed.');
        }

        try {
            const output = execSync(`"${avdManagerPath}" list avd`, { 
                encoding: 'utf-8',
                timeout: 10000 
            });
            
            return this.parseAVDList(output);
        } catch (error) {
            console.error('Failed to get AVD list:', error);
            return [];
        }
    }

    private parseAVDList(output: string): AndroidAVD[] {
        const avds: AndroidAVD[] = [];
        const lines = output.split('\n');
        let currentAVD: Partial<AndroidAVD> = {};

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('Name:')) {
                if (currentAVD.name) {
                    avds.push(currentAVD as AndroidAVD);
                }
                currentAVD = {
                    name: trimmed.replace('Name:', '').trim()
                };
            } else if (trimmed.startsWith('Device:')) {
                currentAVD.device = trimmed.replace('Device:', '').trim();
            } else if (trimmed.startsWith('Path:')) {
                currentAVD.path = trimmed.replace('Path:', '').trim();
            } else if (trimmed.startsWith('Target:')) {
                currentAVD.target = trimmed.replace('Target:', '').trim();
            } else if (trimmed.startsWith('Based on:')) {
                const match = trimmed.match(/API level (\d+)/);
                if (match) {
                    currentAVD.apiLevel = match[1];
                }
            } else if (trimmed.startsWith('Tag/ABI:')) {
                currentAVD.abi = trimmed.replace('Tag/ABI:', '').trim();
            }
        }

        // Add the last AVD if exists
        if (currentAVD.name) {
            avds.push(currentAVD as AndroidAVD);
        }

        return avds;
    }

    public async getRunningEmulators(): Promise<string[]> {
        try {
            const adbPath = this.getADBPath();
            if (!adbPath) {
                return [];
            }

            const output = execSync(`"${adbPath}" devices`, { 
                encoding: 'utf-8',
                timeout: 5000 
            });
            
            const lines = output.split('\n');
            const emulators = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('emulator-') && trimmed.includes('device')) {
                    emulators.push(trimmed.split('\t')[0]);
                }
            }
            
            return emulators;
        } catch (error) {
            console.error('Failed to get running emulators:', error);
            return [];
        }
    }

    private getADBPath(): string | null {
        if (!this.sdkPath) {
            return null;
        }
        
        const platformToolsPath = this.joinPath(this.sdkPath, 'platform-tools');
        const adbBin = process.platform === 'win32' ? 'adb.exe' : 'adb';
        const adbPath = this.joinPath(platformToolsPath, adbBin);
        
        return fs.existsSync(adbPath) ? adbPath : null;
    }

    public isSDKInstalled(): boolean {
        return this.sdkPath !== null;
    }
}