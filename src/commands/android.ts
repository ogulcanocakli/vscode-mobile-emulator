import { spawn, ChildProcess, execSync } from 'child_process';
import { AndroidSDKUtils } from '../utils/androidSdk';
import { EmulatorDevice, AndroidAVD } from '../types';

export class AndroidCommands {
    private sdkUtils: AndroidSDKUtils;
    private runningEmulators: Map<string, ChildProcess> = new Map();

    constructor() {
        this.sdkUtils = new AndroidSDKUtils();
    }

    public async getAvailableDevices(): Promise<EmulatorDevice[]> {
        if (!this.sdkUtils.isSDKInstalled()) {
            return [];
        }

        try {
            const avds = await this.sdkUtils.getAVDList();
            const runningEmulators = await this.sdkUtils.getRunningEmulators();
            
            return avds.map(avd => ({
                id: avd.name,
                name: avd.name,
                platform: 'android' as const,
                state: runningEmulators.some(em => em.includes(avd.name)) ? 'running' : 'offline',
                apiLevel: avd.apiLevel,
                osVersion: avd.target
            }));
        } catch (error) {
            console.error('Failed to get Android devices:', error);
            return [];
        }
    }

    public async startEmulator(device: EmulatorDevice | AndroidAVD): Promise<ChildProcess> {
        const emulatorPath = this.sdkUtils.getEmulatorPath();
        if (!emulatorPath) {
            throw new Error('Android emulator not found. Make sure Android SDK is properly installed.');
        }

        const deviceName = 'name' in device && device.name ? device.name : 
                          'id' in device ? device.id : 
                          (device as AndroidAVD).name;
        
        // Check if emulator is already running
        if (this.runningEmulators.has(deviceName)) {
            throw new Error(`Emulator ${deviceName} is already running`);
        }

        try {
            // Start the emulator process
            const emulatorProcess = spawn(emulatorPath, ['-avd', deviceName, '-no-audio'], {
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            // Store the process reference
            this.runningEmulators.set(deviceName, emulatorProcess);

            // Handle process events
            emulatorProcess.on('error', (error) => {
                console.error(`Emulator ${deviceName} error:`, error);
                this.runningEmulators.delete(deviceName);
            });

            emulatorProcess.on('exit', (code) => {
                console.log(`Emulator ${deviceName} exited with code ${code}`);
                this.runningEmulators.delete(deviceName);
            });

            // Give emulator some time to start
            await this.sleep(3000);

            return emulatorProcess;
        } catch (error) {
            throw new Error(`Failed to start Android emulator: ${error}`);
        }
    }

    public async stopEmulator(deviceName: string): Promise<void> {
        const process = this.runningEmulators.get(deviceName);
        
        if (process) {
            try {
                process.kill('SIGTERM');
                this.runningEmulators.delete(deviceName);
            } catch (error) {
                console.error(`Failed to stop emulator ${deviceName}:`, error);
            }
        }

        // Also try to stop via ADB
        try {
            const adbPath = this.getADBPath();
            if (adbPath) {
                const runningEmulators = await this.sdkUtils.getRunningEmulators();
                const targetEmulator = runningEmulators.find(em => em.includes(deviceName));
                
                if (targetEmulator) {
                    execSync(`"${adbPath}" -s ${targetEmulator} emu kill`, { 
                        timeout: 10000 
                    });
                }
            }
        } catch (error) {
            console.error('Failed to stop emulator via ADB:', error);
        }
    }

    public async stopAllEmulators(): Promise<void> {
        // Stop all tracked processes
        for (const [deviceName, process] of this.runningEmulators) {
            try {
                process.kill('SIGTERM');
            } catch (error) {
                console.error(`Failed to stop emulator ${deviceName}:`, error);
            }
        }
        this.runningEmulators.clear();

        // Also stop via ADB
        try {
            const runningEmulators = await this.sdkUtils.getRunningEmulators();
            const adbPath = this.getADBPath();
            
            if (adbPath) {
                for (const emulator of runningEmulators) {
                    try {
                        execSync(`"${adbPath}" -s ${emulator} emu kill`, { 
                            timeout: 5000 
                        });
                    } catch (error) {
                        console.error(`Failed to stop emulator ${emulator}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to stop emulators via ADB:', error);
        }
    }

    public async createAVD(name: string, deviceType: string, systemImage: string): Promise<void> {
        const avdManagerPath = this.sdkUtils.getAVDManagerPath();
        if (!avdManagerPath) {
            throw new Error('AVD Manager not found');
        }

        try {
            execSync(`"${avdManagerPath}" create avd -n "${name}" -k "${systemImage}" -d "${deviceType}"`, {
                encoding: 'utf-8',
                timeout: 30000
            });
        } catch (error) {
            throw new Error(`Failed to create AVD: ${error}`);
        }
    }

    public async deleteAVD(name: string): Promise<void> {
        const avdManagerPath = this.sdkUtils.getAVDManagerPath();
        if (!avdManagerPath) {
            throw new Error('AVD Manager not found');
        }

        try {
            execSync(`"${avdManagerPath}" delete avd -n "${name}"`, {
                encoding: 'utf-8',
                timeout: 10000
            });
        } catch (error) {
            throw new Error(`Failed to delete AVD: ${error}`);
        }
    }

    public async getEmulatorPort(deviceName: string): Promise<number | null> {
        try {
            const runningEmulators = await this.sdkUtils.getRunningEmulators();
            const targetEmulator = runningEmulators.find(em => em.includes(deviceName));
            
            if (targetEmulator) {
                const match = targetEmulator.match(/emulator-(\d+)/);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get emulator port:', error);
            return null;
        }
    }

    public isEmulatorRunning(deviceName: string): boolean {
        return this.runningEmulators.has(deviceName);
    }

    public getRunningEmulators(): string[] {
        return Array.from(this.runningEmulators.keys());
    }

    private getADBPath(): string | null {
        const sdkPath = this.sdkUtils.getSDKPath();
        if (!sdkPath) {
            return null;
        }
        
        const adbBin = process.platform === 'win32' ? 'adb.exe' : 'adb';
        return `${sdkPath}/platform-tools/${adbBin}`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public dispose(): void {
        // Clean up all running emulators
        this.stopAllEmulators();
    }
}