// ==========================================================================
// 1. DOM ELEMENTS DECLARATION (ดึงแผงควบคุมจาก HTML)
// ==========================================================================
const connectionStatus = document.getElementById('connection-status');
const runtimeDisplay = document.getElementById('runtime-display');
const activeIdDisplay = document.getElementById('active-id-display');
const alphaDisplay = document.getElementById('alpha-display');
const triggerSelect = document.getElementById('trigger-select');
const executeBtn = document.getElementById('execute-btn');
const resetBtn = document.getElementById('reset-btn');
const targetObject = document.getElementById('target-object');

// ==========================================================================
// 2. WEBSOCKET INITIALIZATION (เปิดท่อสื่อสาร Real-time)
// ==========================================================================
// กำหนดที่อยู่ของเซิร์ฟเวอร์หลังบ้าน (Backend Server) ที่จะรันบนพอร์ต 3000
const socketUrl = 'ws://localhost:3000';
let socket;

function initWebSocket() {
    socket = new WebSocket(socketUrl);

    // เมื่อเชื่อมต่อสำเร็จ
    socket.onopen = () => {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'status-connected';
        console.log('Successfully connected to Automation Engine Backend.');
    };

    // เมื่อท่อสื่อสารปิดลง (เซิร์ฟเวอร์ดับ หรือหลุด)
    socket.onclose = () => {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'status-disconnected';
        console.log('Disconnected from Backend. Attempting to reconnect in 3s...');
        
        // Auto-reconnect: พยายามเชื่อมต่อใหม่ทุก ๆ 3 วินาที
        setTimeout(initWebSocket, 3000);
    };

    // หัวใจหลัก: รับข้อมูลจากหลังบ้านแล้วเอามาอัปเดตหน้าจอทันที
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // อัปเดตตัวเลข Monitor
            if (data.runtime !== undefined) runtimeDisplay.textContent = data.runtime.toFixed(2);
            if (data.activeTriggerId) activeIdDisplay.textContent = data.activeTriggerId;
            if (data.currentAlpha !== undefined) {
                alphaDisplay.textContent = data.currentAlpha.toFixed(2);
                // สั่งเปลี่ยนความโปร่งแสงของวัตถุจำลองในหน้าเว็บจริง
                targetObject.style.opacity = data.currentAlpha;
            }
        } catch (error) {
            console.error('Error parsing incoming engine data:', error);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error Layout:', error);
    };
}

// ==========================================================================
// 3. EVENT LISTENERS (ดักจับการกระทำของผู้ใช้)
// ==========================================================================

// ส่งคำสั่งให้หลังบ้านรัน Trigger ตาม ID ที่เลือก
executeBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = {
            action: 'EXECUTE_TRIGGER',
            triggerId: triggerSelect.value,
            timestamp: Date.now()
        };
        socket.send(JSON.stringify(payload));
        console.log(`Sent command to execute: ${triggerSelect.value}`);
    } else {
        alert('Cannot execute: Not connected to the backend engine.');
    }
});

// ส่งคำสั่งไปรีเซ็ตค่าระบบที่หลังบ้าน
resetBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = { action: 'RESET_ENGINE' };
        socket.send(JSON.stringify(payload));
        console.log('Sent reset command to engine.');
    }
});

// เริ่มต้นระบบเชื่อมต่อทันทีที่เปิดหน้าเว็บ
initWebSocket();

