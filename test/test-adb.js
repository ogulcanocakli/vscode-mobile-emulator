#!/usr/bin/env node

const { exec } = require('child_process');

console.log('Testing VSCode Mobile Emulator Extension...\n');

// Test 1: Check if ADB is available
console.log('1. Testing ADB availability...');
exec('adb version', (error, stdout, stderr) => {
    if (error) {
        console.log('❌ ADB not found. Please install Android SDK and add ADB to PATH.');
        console.log('   Error:', error.message);
    } else {
        console.log('✅ ADB is available');
        console.log('   Version:', stdout.split('\n')[0]);
        
        // Test 2: Check for connected devices
        console.log('\n2. Testing device connectivity...');
        exec('adb devices', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Error checking devices:', error.message);
                return;
            }
            
            const lines = stdout.split('\n');
            const devices = lines
                .slice(1)
                .filter(line => line.trim() && line.includes('device') && !line.includes('offline'))
                .map(line => line.split('\t')[0]);
            
            if (devices.length === 0) {
                console.log('⚠️  No Android devices/emulators found');
                console.log('   Please start an Android emulator or connect a device');
                console.log('   Raw output:', stdout);
            } else {
                console.log('✅ Found devices:', devices);
                
                // Test 3: Test screen capture (with first device)
                const deviceId = devices[0];
                console.log(`\n3. Testing screen capture with device: ${deviceId}...`);
                
                exec(`adb -s ${deviceId} exec-out screencap -p`, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                    if (error) {
                        console.log('❌ Screen capture failed:', error.message);
                    } else if (stdout && stdout.length > 0) {
                        console.log('✅ Screen capture successful');
                        console.log(`   Screenshot size: ${stdout.length} bytes`);
                        console.log('   Base64 preview:', stdout.toString('base64').substring(0, 50) + '...');
                    } else {
                        console.log('⚠️  Screen capture returned no data');
                    }
                    
                    // Test 4: Test touch simulation
                    console.log(`\n4. Testing touch simulation...`);
                    exec(`adb -s ${deviceId} shell input tap 500 500`, (error, stdout, stderr) => {
                        if (error) {
                            console.log('❌ Touch simulation failed:', error.message);
                        } else {
                            console.log('✅ Touch simulation successful');
                        }
                        
                        console.log('\n✅ Extension testing complete!');
                        console.log('\nTo use the extension:');
                        console.log('1. Open VSCode');
                        console.log('2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)');
                        console.log('3. Type "Start Mobile Emulator"');
                        console.log('4. Select the command to open the embedded emulator');
                    });
                });
            }
        });
    }
});