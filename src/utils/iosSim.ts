import { execSync } from 'child_process';
import { IOSDevice } from '../types';

export class IOSSimulatorUtils {
    
    constructor() {}

    public isSimulatorAvailable(): boolean {
        // iOS Simulator is only available on macOS
        if (process.platform !== 'darwin') {
            return false;
        }

        try {
            // Check if xcrun and simctl are available
            execSync('xcrun simctl help', { 
                encoding: 'utf-8', 
                timeout: 5000,
                stdio: 'pipe'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    public async getAvailableDevices(): Promise<IOSDevice[]> {
        if (!this.isSimulatorAvailable()) {
            return [];
        }

        try {
            const output = execSync('xcrun simctl list devices --json', { 
                encoding: 'utf-8',
                timeout: 10000 
            });
            
            const data = JSON.parse(output);
            return this.parseDeviceList(data);
        } catch (error) {
            console.error('Failed to get iOS devices:', error);
            return [];
        }
    }

    private parseDeviceList(data: any): IOSDevice[] {
        const devices: IOSDevice[] = [];
        
        if (!data.devices) {
            return devices;
        }

        // Iterate through each runtime version
        for (const runtime in data.devices) {
            const runtimeDevices = data.devices[runtime];
            
            if (Array.isArray(runtimeDevices)) {
                for (const device of runtimeDevices) {
                    // Filter out unavailable devices and focus on iPhone/iPad
                    if (device.isAvailable && 
                        (device.name.includes('iPhone') || device.name.includes('iPad'))) {
                        devices.push({
                            udid: device.udid,
                            name: device.name,
                            runtime: runtime,
                            state: device.state,
                            isAvailable: device.isAvailable
                        });
                    }
                }
            }
        }

        return devices;
    }

    public async getRunningSimulators(): Promise<IOSDevice[]> {
        const allDevices = await this.getAvailableDevices();
        return allDevices.filter(device => device.state === 'Booted');
    }

    public async startSimulator(device: IOSDevice): Promise<void> {
        if (!this.isSimulatorAvailable()) {
            throw new Error('iOS Simulator is not available on this platform');
        }

        try {
            // Boot the device if it's not already running
            if (device.state !== 'Booted') {
                execSync(`xcrun simctl boot "${device.udid}"`, { 
                    encoding: 'utf-8',
                    timeout: 30000 
                });
                
                // Wait a moment for the device to boot
                await this.sleep(2000);
            }

            // Open Simulator app to show the device
            execSync('open -a Simulator', { 
                encoding: 'utf-8',
                timeout: 10000 
            });

        } catch (error) {
            throw new Error(`Failed to start iOS Simulator: ${error}`);
        }
    }

    public async stopSimulator(device: IOSDevice): Promise<void> {
        if (!this.isSimulatorAvailable()) {
            throw new Error('iOS Simulator is not available on this platform');
        }

        try {
            execSync(`xcrun simctl shutdown "${device.udid}"`, { 
                encoding: 'utf-8',
                timeout: 10000 
            });
        } catch (error) {
            throw new Error(`Failed to stop iOS Simulator: ${error}`);
        }
    }

    public async stopAllSimulators(): Promise<void> {
        if (!this.isSimulatorAvailable()) {
            return;
        }

        try {
            execSync('xcrun simctl shutdown all', { 
                encoding: 'utf-8',
                timeout: 15000 
            });
        } catch (error) {
            console.error('Failed to stop all simulators:', error);
        }
    }

    public async eraseSimulator(device: IOSDevice): Promise<void> {
        if (!this.isSimulatorAvailable()) {
            throw new Error('iOS Simulator is not available on this platform');
        }

        try {
            // First shutdown the device
            await this.stopSimulator(device);
            
            // Then erase it
            execSync(`xcrun simctl erase "${device.udid}"`, { 
                encoding: 'utf-8',
                timeout: 30000 
            });
        } catch (error) {
            throw new Error(`Failed to erase iOS Simulator: ${error}`);
        }
    }

    public async getSimulatorScreenshot(device: IOSDevice): Promise<string | null> {
        if (!this.isSimulatorAvailable()) {
            return null;
        }

        try {
            const tempPath = `/tmp/simulator-${device.udid}-screenshot.png`;
            execSync(`xcrun simctl io "${device.udid}" screenshot "${tempPath}"`, { 
                encoding: 'utf-8',
                timeout: 10000 
            });
            return tempPath;
        } catch (error) {
            console.error('Failed to take simulator screenshot:', error);
            return null;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async getSimulatorStatus(device: IOSDevice): Promise<string> {
        if (!this.isSimulatorAvailable()) {
            return 'unavailable';
        }

        try {
            const output = execSync(`xcrun simctl list devices "${device.udid}"`, { 
                encoding: 'utf-8',
                timeout: 5000 
            });
            
            // Parse the output to get current state
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.includes(device.udid)) {
                    const match = line.match(/\(([^)]+)\)$/);
                    if (match) {
                        return match[1].toLowerCase();
                    }
                }
            }
            
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }
}