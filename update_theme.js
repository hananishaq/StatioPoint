const fs = require('fs');

function updateFile(file) {
    let raw = fs.readFileSync(file, 'utf-8');

    // Change fonts
    raw = raw.replace(/https:\/\/fonts\.googleapis\.com\/css2\?family=Syne:wght@700;800&family=DM\+Mono:wght@400;500&display=swap/g, 
                      'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
    raw = raw.replace(/'Syne',sans-serif/g, "'Outfit', sans-serif");
    raw = raw.replace(/'DM Mono',monospace/g, "'Inter', sans-serif");

    if (file.includes('login.html') || file.includes('signup.html')) {
        raw = raw.replace(/rgba\(245,200,66/g, 'rgba(59,130,246');
        
        // Colors
        raw = raw.replace(/#0A0C10/g, '#FFFFFF'); // Replace dark bg to white (for SVGs, etc)
        // Fix the body background to be slightly off-white
        raw = raw.replace(/body\{min-height:100vh;background:#FFFFFF/g, 'body{min-height:100vh;background:#F8FAFC');
        
        raw = raw.replace(/#111318/g, '#FFFFFF'); // Card bg
        raw = raw.replace(/#252A35/g, '#E2E8F0'); // borders
        raw = raw.replace(/#F5C842/g, '#3B82F6'); // primary blue
        raw = raw.replace(/#181C24/g, '#F1F5F9'); // inputs
        raw = raw.replace(/#F0F2F8/g, '#0F172A'); // main text
        raw = raw.replace(/#A0A8B8/g, '#64748B'); // dim text
        raw = raw.replace(/#ffd000/g, '#2563EB'); // hover primary
        
        // Fix shadows for lighter theme
        raw = raw.replace(/box-shadow:0 40px 80px rgba\(0,0,0,0\.6\)/g, 'box-shadow:0 20px 40px rgba(0,0,0,0.06)');
        
    } else {
        // Admin & Cashier
        // Update variables directly
        raw = raw.replace(/:root\{[^\}]+\}/, ':root{--bg:#F8FAFC;--card:#FFFFFF;--el:#F1F5F9;--border:#E2E8F0;--gold:#3B82F6;--teal:#0EA5E9;--red:#EF4444;--green:#10B981;--txt:#0F172A;--txt2:#334155;--txt3:#64748B;}');
        
        raw = raw.replace(/rgba\(245,200,66/g, 'rgba(59,130,246');
        raw = raw.replace(/#F5C842/g, '#3B82F6');
        raw = raw.replace(/#ffd000/g, '#2563EB');
        
        raw = raw.replace(/color:#0A0C10/g, 'color:#FFFFFF');
        raw = raw.replace(/fill="#0A0C10"/g, 'fill="#FFFFFF"');
        
        raw = raw.replace(/box-shadow:0 8px 24px rgba\(0,0,0,\.4\)/, 'box-shadow:0 8px 24px rgba(0,0,0,.1)');
        raw = raw.replace(/fill="#454D60"/g, 'fill="#64748B"');
    }

    fs.writeFileSync(file, raw);
}

const files = [
    'd:/statiopoint2/frontend/login.html',
    'd:/statiopoint2/frontend/signup.html',
    'd:/statiopoint2/frontend/admin.html',
    'd:/statiopoint2/frontend/cashier.html'
];

files.forEach(updateFile);
console.log("Updated colors and fonts to a clean white/blue theme.");
