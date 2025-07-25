// Emulator Panel JavaScript

// Global variables
let vscode;
let deviceInfo;
let isConnected = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 10;

// Initialize when DOM is ready
function initializeEmulator() {
    vscode = acquireVsCodeApi();
    
    // Get device info from global variable
    deviceInfo = window.deviceInfo;
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup emulator screen
    setupEmulatorScreen();
    
    // Start connection attempt
    attemptConnection();
    
    console.log('Emulator panel initialized for:', deviceInfo.name);
}

function setupEventListeners() {
    // Control buttons
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        sendMessage('refresh');
        updateStatus('Refreshing...');
    });
    
    document.getElementById('screenshotBtn')?.addEventListener('click', () => {
        sendMessage('screenshot');
        updateStatus('Taking screenshot...');
    });
    
    document.getElementById('powerBtn')?.addEventListener('click', () => {
        sendMessage('power');
    });
    
    document.getElementById('homeBtn')?.addEventListener('click', () => {
        sendMessage('home');
    });
    
    document.getElementById('backBtn')?.addEventListener('click', () => {
        sendMessage('back');
    });
    
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        sendMessage('menu');
    });
    
    document.getElementById('volumeUpBtn')?.addEventListener('click', () => {
        sendMessage('volumeUp');
    });
    
    document.getElementById('volumeDownBtn')?.addEventListener('click', () => {
        sendMessage('volumeDown');
    });
    
    // Touch/click events on emulator screen
    const screen = document.getElementById('emulatorScreen');
    if (screen) {
        screen.addEventListener('click', handleScreenTouch);
        screen.addEventListener('touchstart', handleScreenTouch);
        
        // Prevent context menu
        screen.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Listen for messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        handleExtensionMessage(message);
    });
}

function setupEmulatorScreen() {
    const screen = document.getElementById('emulatorScreen');
    if (!screen) return;
    
    // Add platform-specific styling
    screen.classList.add(deviceInfo.platform);
    
    // Update screen content
    updateScreenContent();
}

function handleScreenTouch(event) {
    if (!isConnected) return;
    
    const screen = event.currentTarget;
    const rect = screen.getBoundingClientRect();
    
    // Calculate relative coordinates
    const x = ((event.clientX - rect.left) / rect.width);
    const y = ((event.clientY - rect.top) / rect.height);
    
    // Send touch event
    sendMessage('touch', { x, y });
    
    // Visual feedback
    showTouchFeedback(event.clientX - rect.left, event.clientY - rect.top, screen);
    
    event.preventDefault();
}

function showTouchFeedback(x, y, container) {
    const feedback = document.createElement('div');
    feedback.style.position = 'absolute';
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    feedback.style.width = '20px';
    feedback.style.height = '20px';
    feedback.style.background = 'rgba(255, 255, 255, 0.5)';
    feedback.style.borderRadius = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.pointerEvents = 'none';
    feedback.style.animation = 'touchFeedback 0.3s ease-out forwards';
    
    container.style.position = 'relative';
    container.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 300);
}

function attemptConnection() {
    connectionAttempts++;
    updateStatus('Connecting...', 'connecting');
    
    // Simulate connection attempt
    setTimeout(() => {
        if (connectionAttempts <= maxConnectionAttempts) {
            // Simulate successful connection after a few attempts
            if (connectionAttempts >= 3 || deviceInfo.state === 'running') {
                establishConnection();
            } else {
                updateStatus(`Connection attempt ${connectionAttempts}...`, 'connecting');
                setTimeout(() => attemptConnection(), 2000);
            }
        } else {
            connectionFailed();
        }
    }, 1500);
}

function establishConnection() {
    isConnected = true;
    updateStatus('Connected', 'connected');
    updateScreenContent();
    
    // Enable touch interactions
    const screen = document.getElementById('emulatorScreen');
    if (screen) {
        screen.classList.add('touch-enabled');
    }
    
    sendMessage('log', { message: 'Emulator connection established' });
}

function connectionFailed() {
    isConnected = false;
    updateStatus('Connection failed', 'disconnected');
    
    const screen = document.getElementById('emulatorScreen');
    if (screen) {
        screen.innerHTML = `
            <div class="loading-message">
                <p>❌ Connection Failed</p>
                <p>Unable to connect to ${deviceInfo.name}</p>
                <button onclick="retryConnection()" style="margin-top: 16px; padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer;">
                    Retry Connection
                </button>
            </div>
        `;
    }
}

function retryConnection() {
    connectionAttempts = 0;
    attemptConnection();
}

function updateScreenContent() {
    const screen = document.getElementById('emulatorScreen');
    if (!screen) return;
    
    if (isConnected) {
        screen.innerHTML = `
            <div class="emulator-content connected">
                <div style="text-align: center; padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; color: #fff;">📱 ${deviceInfo.name}</h3>
                    <p style="margin: 8px 0; opacity: 0.8; font-size: 14px;">
                        ${deviceInfo.platform.toUpperCase()} Emulator
                    </p>
                    ${deviceInfo.apiLevel ? `<p style="margin: 8px 0; opacity: 0.6; font-size: 12px;">API Level ${deviceInfo.apiLevel}</p>` : ''}
                    ${deviceInfo.osVersion ? `<p style="margin: 8px 0; opacity: 0.6; font-size: 12px;">${deviceInfo.osVersion}</p>` : ''}
                    <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Click anywhere to interact</p>
                        <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.6;">Use toolbar buttons for device controls</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function updateStatus(text, type = 'connecting') {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = text;
        
        // Update status indicator
        let indicator = statusText.parentElement.querySelector('.status-indicator');
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'status-indicator';
            statusText.parentElement.insertBefore(indicator, statusText);
        }
        
        indicator.className = `status-indicator ${type}`;
    }
}

function sendMessage(command, data = {}) {
    if (vscode) {
        vscode.postMessage({
            command: command,
            ...data
        });
    }
}

function handleExtensionMessage(message) {
    switch (message.command) {
        case 'refresh':
            location.reload();
            break;
            
        case 'keyPressed':
            // Visual feedback for key press
            updateStatus(`Key pressed: ${message.key}`, 'connected');
            setTimeout(() => {
                if (isConnected) {
                    updateStatus('Connected', 'connected');
                }
            }, 1000);
            break;
            
        case 'deviceStateChanged':
            deviceInfo.state = message.state;
            if (message.state === 'running' && !isConnected) {
                attemptConnection();
            } else if (message.state === 'offline' && isConnected) {
                isConnected = false;
                updateStatus('Disconnected', 'disconnected');
                updateScreenContent();
            }
            break;
            
        default:
            console.log('Unknown message from extension:', message);
    }
}

// Add CSS animation for touch feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes touchFeedback {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Global functions for button handlers
window.retryConnection = retryConnection;