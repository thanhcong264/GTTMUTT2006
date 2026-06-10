document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // TAB NAVIGATION LOGIC
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Xóa class active ở tất cả
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Thêm class active cho tab được click
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
            
            // Quan trọng: Phải gọi map.invalidateSize() khi tab map hiển thị
            if (targetId === 'tab-map' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
        });
    });

    // ==========================================
    // IMAGE ANALYSIS LOGIC (Tab 1)
    // ==========================================
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewSection = document.getElementById('preview-section');
    const originalImage = document.getElementById('original-image');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultBox = document.getElementById('result-box');
    const processedImage = document.getElementById('processed-image');
    const resultsPanel = document.getElementById('results-panel');
    
    const blackPctEl = document.getElementById('black-pct');
    const whitePctEl = document.getElementById('white-pct');
    const totalPixelsEl = document.getElementById('total-pixels');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return alert('Vui lòng chọn ảnh hợp lệ.');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            resultBox.classList.add('hidden');
            resultsPanel.classList.add('hidden');
            previewSection.classList.remove('hidden');
            analyzeBtn.textContent = "Phân tích ảnh";
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    analyzeBtn.addEventListener('click', () => {
        analyzeBtn.textContent = "Đang xử lý...";
        analyzeBtn.disabled = true;

        setTimeout(() => {
            const results = processImage(originalImage);
            processedImage.src = results.processedDataUrl;
            blackPctEl.textContent = `${results.blackPercentage.toFixed(2)}%`;
            whitePctEl.textContent = `${results.whitePercentage.toFixed(2)}%`;
            totalPixelsEl.textContent = results.totalPixels.toLocaleString();
            
            resultBox.classList.remove('hidden');
            resultsPanel.classList.remove('hidden');
            analyzeBtn.textContent = "Phân tích hoàn tất!";
        }, 100);
    });

    function processImage(imgElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let whitePixels = 0, blackPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const binaryValue = gray >= 127 ? 255 : 0;
            
            data[i] = data[i+1] = data[i+2] = binaryValue;
            
            if (binaryValue === 255) whitePixels++;
            else blackPixels++;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const totalPixels = whitePixels + blackPixels;
        return {
            processedDataUrl: canvas.toDataURL('image/jpeg', 0.8),
            whitePercentage: (whitePixels / totalPixels) * 100,
            blackPercentage: (blackPixels / totalPixels) * 100,
            totalPixels
        };
    }

    // ==========================================
    // MAP LOGIC (Tab 2)
    // ==========================================
    const roadData = [
        { name: "Quốc lộ 1A (Đoạn qua Hà Nội)", lat1: 20.9000, lon1: 105.8500, lat2: 20.8500, lon2: 105.8600, type: "Nhựa", length: 5.5, crack: 12.5 },
        { name: "Đường Nguyễn Trãi (Hà Nội)", lat1: 20.9930, lon1: 105.8110, lat2: 20.9850, lon2: 105.7950, type: "Nhựa", length: 2.3, crack: 5.0 },
        { name: "Đường Liên Thôn (Đan Phượng)", lat1: 21.0950, lon1: 105.7000, lat2: 21.0960, lon2: 105.7050, type: "Bê tông", length: 0.8, crack: 20.0 },
        { name: "Đường cao tốc Bắc - Nam", lat1: 19.8000, lon1: 105.9000, lat2: 19.7000, lon2: 105.9500, type: "Nhựa", length: 15.0, crack: 2.1 },
        { name: "Hẻm 123 (Quận 1, TP.HCM)", lat1: 10.7760, lon1: 106.7010, lat2: 10.7770, lon2: 106.7020, type: "Bê tông", length: 0.3, crack: 15.0 },
        { name: "Đường ven biển (Đà Nẵng)", lat1: 16.0500, lon1: 108.2300, lat2: 16.0300, lon2: 108.2400, type: "Nhựa", length: 1.2, crack: 8.4 },
        { name: "Đường Phạm Văn Đồng (Hà Nội)", lat1: 21.0460, lon1: 105.7820, lat2: 21.0660, lon2: 105.7820, type: "Nhựa", length: 3.2, crack: 3.5 },
        { name: "Đường Giải Phóng (Hà Nội)", lat1: 20.9850, lon1: 105.8400, lat2: 20.9650, lon2: 105.8450, type: "Nhựa", length: 4.1, crack: 7.2 },
        { name: "Đường Vành đai 3 (Hà Nội)", lat1: 21.0000, lon1: 105.7950, lat2: 20.9800, lon2: 105.8150, type: "Nhựa", length: 6.8, crack: 4.8 }
    ];

    // Render Table & Selectbox
    const tbody = document.querySelector('#road-table tbody');
    const selectBox = document.getElementById('road-select');
    
    roadData.forEach((road, index) => {
        // Add to table
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${road.name}</td>
            <td>${road.type}</td>
            <td>${road.length}</td>
            <td><strong style="color: ${road.crack > 10 ? '#ef4444' : '#10b981'}">${road.crack}%</strong></td>
        `;
        tbody.appendChild(tr);

        // Add to select
        const option = document.createElement('option');
        option.value = index;
        option.textContent = road.name;
        selectBox.appendChild(option);
    });

    // Initialize Leaflet Map (Tọa độ trung tâm VN)
    let map = L.map('map').setView([16.0500, 107.000], 5);
    
    // Sử dụng bản đồ vệ tinh/street miễn phí của OpenStreetMap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Vẽ các đường đỏ trên bản đồ
    const polylineGroups = [];
    roadData.forEach((road) => {
        const latlngs = [
            [road.lat1, road.lon1],
            [road.lat2, road.lon2]
        ];
        // Vẽ nét liền
        const polyline = L.polyline(latlngs, {color: 'red', weight: 5}).addTo(map);
        // Thêm tooltip khi click
        polyline.bindPopup(`<b>${road.name}</b><br>Loại: ${road.type}<br>Tỷ lệ nứt: ${road.crack}%`);
        
        polylineGroups.push({road, polyline});
    });

    // Xử lý sự kiện Selectbox để zoom tới đường
    selectBox.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
            map.setView([16.0500, 107.000], 5);
        } else {
            const selected = roadData[val];
            // Tính trung tâm của đường để zoom vào
            const centerLat = (selected.lat1 + selected.lat2) / 2;
            const centerLon = (selected.lon1 + selected.lon2) / 2;
            map.setView([centerLat, centerLon], 14);
            
            // Mở tooltip
            polylineGroups[val].polyline.openPopup();
        }
    });
});
