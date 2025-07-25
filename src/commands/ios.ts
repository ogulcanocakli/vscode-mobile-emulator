import { IOSSimulatorUtils } from '../utils/iosSim';
import { EmulatorDevice, IOSDevice } from '../types';

export class IOSCommands {
    private simUtils: IOSSimulatorUtils;

    constructor() {
        this.simUtils = new IOSSimulatorUtils();
    }

    public async getAvailableDevices(): Promise<EmulatorDevice[]> {
        if (!this.simUtils.isSimulatorAvailable()) {
            return [];
        }

        try {
            const devices = await this.simUtils.getAvailableDevices();
            
            return devices.map(device => ({
                id: device.udid,
                name: device.name,
                platform: 'ios' as const,
                state: this.mapIOSStateToEmulatorState(device.state),
                osVersion: this.extractIOSVersion(device.runtime)
            }));
        } catch (error) {
            console.error('Failed to get iOS devices:', error);
            return [];
        }
    }

    public async startSimulator(device: EmulatorDevice | IOSDevice): Promise<void> {
        if (!this.simUtils.isSimulatorAvailable()) {
            throw new Error('iOS Simulator is not available on this platform');
        }

        try {
            let iosDevice: IOSDevice;
            
            if ('udid' in device) {
                iosDevice = device;
            } else {
                // Convert EmulatorDevice to IOSDevice
                const allDevices = await this.simUtils.getAvailableDevices();
                const foundDevice = allDevices.find(d => d.udid === device.id);
                
                if (!foundDevice) {
                    throw new Error(`iOS device with ID ${device.id} not found`);
                }
                
                iosDevice = foundDevice;
            }

            await this.simUtils.startSimulator(iosDevice);
        } catch (error) {
            throw new Error(`Failed to start iOS Simulator: ${error}`);
        }
    }

    public async stopSimulator(device: EmulatorDevice | IOSDevice): Promise<void> {
        if (!this.simUtils.isSimulatorAvailable()) {
            throw new Error('iOS Simulator is not available on this platform');
        }

        try {
            let iosDevice: IOSDevice;
            
            if ('udid' in device) {
                iosDevice = device;
            } else {
                const allDevices = await this.simUtils.getAvailableDevices();
                const foundDevice = allDevices.find(d => d.udid === device.id);
                
                if (!foundDevice) {
                    throw new Error(`iOS device with ID ${device.id} not found`);
                }
                
                iosDevice = foundDevice;
            }

            await this.simUtils.stopSimulator(iosDevice);
        } catch (error) {
            throw new Error(`Failed to stop iOS Simulator: ${error}`);
        }
    }

    public async stopAllSimulators(): Promise<void> {
        if (!this.simUtils.isSimulatorAvailable()) {
            return;
        }

        try {
            await this.simUtils.stopAllSimulators();
        } catch (error) {
            console.error('Failed to stop all iOS simulators:', error);
        }
    }

    public async eraseSimulator(device: EmulatorDevice | IOSDevice): Promise<void> {
        if (!this.simUtils.isSimulatorAvailable()) {
            throw new Error('iOS Simulator is not available on this platform');
        }

        try {
            let iosDevice: IOSDevice;
            
            if ('udid' in device) {
                iosDevice = device;
            } else {
                const allDevices = await this.simUtils.getAvailableDevices();
                const foundDevice = allDevices.find(d => d.udid === device.id);
                
                if (!foundDevice) {
                    throw new Error(`iOS device with ID ${device.id} not found`);
                }
                
                iosDevice = foundDevice;
            }

            await this.simUtils.eraseSimulator(iosDevice);
        } catch (error) {
            throw new Error(`Failed to erase iOS Simulator: ${error}`);
        }
    }

    public async getRunningSimulators(): Promise<EmulatorDevice[]> {
        if (!this.simUtils.isSimulatorAvailable()) {
            return [];
        }

        try {
            const runningDevices = await this.simUtils.getRunningSimulators();
            
            return runningDevices.map(device => ({
                id: device.udid,
                name: device.name,
                platform: 'ios' as const,
                state: 'running' as const,
                osVersion: this.extractIOSVersion(device.runtime)
            }));
        } catch (error) {
            console.error('Failed to get running iOS simulators:', error);
            return [];
        }
    }

    public async takeScreenshot(device: EmulatorDevice | IOSDevice): Promise<string | null> {
        if (!this.simUtils.isSimulatorAvailable()) {
            return null;
        }

        try {
            let iosDevice: IOSDevice;
            
            if ('udid' in device) {
                iosDevice = device;
            } else {
                const allDevices = await this.simUtils.getAvailableDevices();
                const foundDevice = allDevices.find(d => d.udid === device.id);
                
                if (!foundDevice) {
                    return null;
                }
                
                iosDevice = foundDevice;
            }

            return await this.simUtils.getSimulatorScreenshot(iosDevice);
        } catch (error) {
            console.error('Failed to take iOS simulator screenshot:', error);
            return null;
        }
    }

    public async getSimulatorStatus(device: EmulatorDevice | IOSDevice): Promise<string> {
        if (!this.simUtils.isSimulatorAvailable()) {
            return 'unavailable';
        }

        try {
            let iosDevice: IOSDevice;
            
            if ('udid' in device) {
                iosDevice = device;
            } else {
                const allDevices = await this.simUtils.getAvailableDevices();
                const foundDevice = allDevices.find(d => d.udid === device.id);
                
                if (!foundDevice) {
                    return 'not_found';
                }
                
                iosDevice = foundDevice;
            }

            return await this.simUtils.getSimulatorStatus(iosDevice);
        } catch (error) {
            console.error('Failed to get iOS simulator status:', error);
            return 'error';
        }
    }

    public isSimulatorAvailable(): boolean {
        return this.simUtils.isSimulatorAvailable();
    }

    private mapIOSStateToEmulatorState(iosState: string): 'offline' | 'online' | 'running' {
        switch (iosState.toLowerCase()) {
            case 'booted':
                return 'running';
            case 'shutdown':
                return 'offline';
            case 'shutting down':
                return 'offline';
            default:
                return 'offline';
        }
    }

    private extractIOSVersion(runtime: string): string {
        // Extract iOS version from runtime string like "iOS 16.2" or "com.apple.CoreSimulator.SimRuntime.iOS-16-2"
        const match = runtime.match(/iOS[- ](\d+)[.-](\d+)/i);
        if (match) {
            return `iOS ${match[1]}.${match[2]}`;
        }
        
        // Fallback for other formats
        const simpleMatch = runtime.match(/(\d+)[.-](\d+)/);
        if (simpleMatch) {
            return `iOS ${simpleMatch[1]}.${simpleMatch[2]}`;
        }
        
        return runtime;
    }

    public dispose(): void {
        // Clean up - stop all simulators if needed
        this.stopAllSimulators().catch(console.error);
    }
}