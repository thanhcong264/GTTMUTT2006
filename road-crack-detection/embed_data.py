import pandas as pd
import re

csv_path = 'c:/Users/Dell/thanhcong/road-crack-detection/ket_qua_phan_tich_nut_200_doan.csv'
html_path = 'c:/Users/Dell/thanhcong/road-crack-detection/index.html'

df = pd.read_csv(csv_path)

js_array = 'const realSimData = [\n'
for i, row in df.iterrows():
    js_array += f'    {{clip: "{row["Clip_Số"]}", lyTrinh: "{row["Lý_Trình"]}", pct: {row["Tỉ_Lệ_Nứt_(%)"]}}},\n'
js_array += '];\n'

with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

replacement = """
        // Show progress in sidebar
        document.getElementById('video-progress-wrap').style.display = 'block';
        const vpFill = document.getElementById('vp-fill');
        const vpPct = document.getElementById('vp-pct');
        const vpStatus = document.getElementById('vp-status');
        const vpLabel = document.getElementById('vp-label');
        
        let simData = [];
        let currentClip = 1;
        
""" + js_array + """
        
        const simInterval = setInterval(() => {
            let progress = (currentClip / 10) * 100;
            vpFill.style.width = progress + '%';
            vpPct.textContent = progress + '%';
            vpLabel.textContent = `Phân tích Clip ${currentClip}/10...`;
            vpStatus.textContent = `Nhận diện nứt lưới & nứt đơn...`;
            
            // Lấy dữ liệu 20 đoạn của Clip hiện tại từ mảng thật
            const clipData = realSimData.filter(d => d.clip === `Clip ${currentClip}`);
            simData.push(...clipData);
"""

target = """
        // Show progress in sidebar
        document.getElementById('video-progress-wrap').style.display = 'block';
        const vpFill = document.getElementById('vp-fill');
        const vpPct = document.getElementById('vp-pct');
        const vpStatus = document.getElementById('vp-status');
        const vpLabel = document.getElementById('vp-label');
        
        let simData = [];
        let currentClip = 1;
        
        const simInterval = setInterval(() => {
            let progress = (currentClip / 10) * 100;
            vpFill.style.width = progress + '%';
            vpPct.textContent = progress + '%';
            vpLabel.textContent = `Phân tích Clip ${currentClip}/10...`;
            vpStatus.textContent = `Nhận diện nứt lưới & nứt đơn...`;
            
            for(let i=1; i<=20; i++) {
                let startM = (i-1)*50;
                let endM = i*50;
                let crackPct = (Math.random() * 15).toFixed(2);
                simData.push({
                    clip: `Clip ${currentClip}`,
                    lyTrinh: `${startM}m - ${endM}m`,
                    pct: parseFloat(crackPct)
                });
            }
"""

if target in html_content:
    new_html = html_content.replace(target, replacement)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("Done replacing.")
else:
    print("Target not found.")
