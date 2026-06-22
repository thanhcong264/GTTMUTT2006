const fs = require('fs');

const csvPath = 'c:/Users/Dell/thanhcong/road-crack-detection/ket_qua_phan_tich_nut_200_doan.csv';
const htmlPath = 'c:/Users/Dell/thanhcong/road-crack-detection/index.html';

const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.trim().split('\n').slice(1); // skip header

let jsArray = 'const realSimData = [\n';
lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 4) {
        jsArray += `    {clip: "${parts[0].trim()}", lyTrinh: "${parts[1].trim()}", pct: ${parseFloat(parts[3].trim())}},\n`;
    }
});
jsArray += '];\n';

const replacement = `
        // Show progress in sidebar
        document.getElementById('video-progress-wrap').style.display = 'block';
        const vpFill = document.getElementById('vp-fill');
        const vpPct = document.getElementById('vp-pct');
        const vpStatus = document.getElementById('vp-status');
        const vpLabel = document.getElementById('vp-label');
        
        let simData = [];
        let currentClip = 1;
        
` + jsArray + `
        
        const simInterval = setInterval(() => {
            let progress = (currentClip / 10) * 100;
            vpFill.style.width = progress + '%';
            vpPct.textContent = progress + '%';
            vpLabel.textContent = \`Phân tích Clip \${currentClip}/10...\`;
            vpStatus.textContent = \`Nhận diện nứt lưới & nứt đơn...\`;
            
            const clipData = realSimData.filter(d => d.clip === \`Clip \${currentClip}\`);
            simData.push(...clipData);
`;

const target = `
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
            vpLabel.textContent = \`Phân tích Clip \${currentClip}/10...\`;
            vpStatus.textContent = \`Nhận diện nứt lưới & nứt đơn...\`;
            
            for(let i=1; i<=20; i++) {
                let startM = (i-1)*50;
                let endM = i*50;
                let crackPct = (Math.random() * 15).toFixed(2);
                simData.push({
                    clip: \`Clip \${currentClip}\`,
                    lyTrinh: \`\${startM}m - \${endM}m\`,
                    pct: parseFloat(crackPct)
                });
            }
`;

let htmlContent = fs.readFileSync(htmlPath, 'utf8');

if (htmlContent.includes(target)) {
    const newHtml = htmlContent.replace(target, replacement);
    fs.writeFileSync(htmlPath, newHtml, 'utf8');
    console.log("Done replacing.");
} else {
    console.log("Target not found.");
}
