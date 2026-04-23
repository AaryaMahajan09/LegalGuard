// =========================================================
//  LegalGuard — script.js  (kept minimal; CSS does heavy lifting)
// =========================================================

// ---- Tab switching ----
function switchTab(type) {
    const isFile = type === 'file';
    document.getElementById('filePanel').classList.toggle('active', isFile);
    document.getElementById('textPanel').classList.toggle('active', !isFile);
    document.getElementById('filePanel').classList.toggle('hidden', !isFile);
    document.getElementById('textPanel').classList.toggle('hidden', isFile);
    document.getElementById('tabFile').classList.toggle('active', isFile);
    document.getElementById('tabText').classList.toggle('active', !isFile);
}

// ---- File input ----
document.getElementById('fileInput').addEventListener('change', function () {
    if (this.files[0]) showFile(this.files[0]);
});

const dropzone = document.getElementById('dropzone');
dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', ()  => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') showFile(f);
});

function showFile(file) {
    document.getElementById('dropDefault').classList.add('hidden');
    document.getElementById('dropSuccess').classList.remove('hidden');
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
    // Attach file to hidden input
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('fileInput').files = dt.files;
}

function removeFile(e) {
    e.stopPropagation();
    document.getElementById('dropDefault').classList.remove('hidden');
    document.getElementById('dropSuccess').classList.add('hidden');
    document.getElementById('fileInput').value = '';
}

// ---- Scan ----
async function scanDocument() {
    const fileInput = document.getElementById('fileInput');
    const textInput = document.getElementById('textInput');
    const isFileMode = !document.getElementById('filePanel').classList.contains('hidden');

    if (isFileMode && !fileInput.files[0]) { alert("Please select a PDF file first."); return; }
    if (!isFileMode && !textInput.value.trim()) { alert("Please paste some legal text first."); return; }

    setLoading(true);

    const formData = new FormData();
    if (isFileMode) formData.append('file', fileInput.files[0]);
    else            formData.append('text', textInput.value.trim());

    try {
        const res  = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        renderResults(data);
    } catch {
        alert("Error analyzing document. Ensure the Flask server is running.");
        setLoading(false);
    }
}

function setLoading(on) {
    document.getElementById('uploadCard').classList.toggle('hidden', on);
    document.getElementById('loadingSection').classList.toggle('hidden', !on);
    document.getElementById('resultsSection').classList.add('hidden');
}

// ---- Render ----
function renderResults(data) {
    document.getElementById('loadingSection').classList.add('hidden');
    const sec = document.getElementById('resultsSection');
    sec.classList.remove('hidden');

    const score   = data.score   || 0;
    const verdict = data.verdict || '';
    const flags   = data.flags   || [];
    const isHigh  = score > 50;

    // Verdict card class
    const vc = document.getElementById('verdictCard');
    vc.classList.toggle('high', isHigh);
    vc.classList.toggle('safe', !isHigh);

    document.getElementById('verdictBadge').textContent = isHigh ? 'High Risk Contract' : 'Safe Contract';
    document.getElementById('verdictDesc').textContent  = isHigh
        ? 'This contract contains multiple concerning clauses that may impact your rights.'
        : 'No major red flags detected. Review the findings below for minor items.';

    // Score ring animation
    const pct    = score / 100;
    const circum = 314;
    document.getElementById('ringFill').style.strokeDashoffset = circum - circum * pct;

    // Animate score number
    const numEl = document.getElementById('scoreNumber');
    let cur = 0;
    const step = () => {
        cur = Math.min(cur + 2, score);
        numEl.textContent = cur;
        if (cur < score) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    // Risk counts
    const high   = flags.filter(f => f.label === 'High').length;
    const medium = flags.filter(f => f.label === 'Medium').length;
    const low    = flags.filter(f => f.label === 'Low').length;

    document.getElementById('riskCountRow').innerHTML = `
        ${high   ? `<span class="risk-count-chip high"><span class="chip-dot high"></span>${high} High Risk${high>1?'s':''}</span>` : ''}
        ${medium ? `<span class="risk-count-chip medium"><span class="chip-dot medium"></span>${medium} Medium Risk${medium>1?'s':''}</span>` : ''}
        ${low    ? `<span class="risk-count-chip low"><span class="chip-dot low"></span>${low} Low Risk${low>1?'s':''}</span>` : ''}
    `;

    // Donut
    buildDonut(high, medium, low);

    // Bars
    const total = Math.max(high + medium + low, 1);
    document.getElementById('distBars').innerHTML = `
        <div class="bar-row"><span class="bar-label">High</span><div class="bar-track"><div class="bar-fill high" id="barH"></div></div></div>
        <div class="bar-row"><span class="bar-label">Medium</span><div class="bar-track"><div class="bar-fill medium" id="barM"></div></div></div>
        <div class="bar-row"><span class="bar-label">Low</span><div class="bar-track"><div class="bar-fill low" id="barL"></div></div></div>
    `;
    requestAnimationFrame(() => {
        document.getElementById('barH').style.width = (high   / total * 100) + '%';
        document.getElementById('barM').style.width = (medium / total * 100) + '%';
        document.getElementById('barL').style.width = (low    / total * 100) + '%';
    });

    // Findings
    const ICONS = {
        High:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>`,
        Medium: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        Low:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/><circle cx="12" cy="12" r="1"/></svg>`
    };

    document.getElementById('findingsContainer').innerHTML = flags.map((f, i) => `
        <div class="finding-card ${f.label.toLowerCase()}" onclick="toggleFinding(this)">
            <div class="finding-header">
                <div class="finding-icon">${ICONS[f.label] || ICONS.Low}</div>
                <div class="finding-info">
                    <div class="finding-risk-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        ${f.label} Risk
                    </div>
                    <div class="finding-title">${f.issue}</div>
                </div>
                <svg class="finding-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="finding-body">${f.text}</div>
        </div>
    `).join('');
}

function toggleFinding(el) {
    el.classList.toggle('open');
}

function buildDonut(high, medium, low) {
    const total = high + medium + low || 1;
    const cx = 80, cy = 80, r = 55, stroke = 22;
    const circum = 2 * Math.PI * r;
    const slices = [
        { pct: high   / total, color: '#ef4444' },
        { pct: medium / total, color: '#f59e0b' },
        { pct: low    / total, color: '#3b82f6' }
    ];

    let offset = 0;
    const paths = slices.map(s => {
        const dash   = s.pct * circum;
        const gap    = circum - dash;
        const rotate = offset * 360 - 90;
        offset += s.pct;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}"
            stroke-dasharray="${dash} ${gap}"
            stroke-dashoffset="${-rotate / 360 * circum}"
            transform="rotate(${rotate + 90}, ${cx}, ${cy})"
            style="transform-origin:${cx}px ${cy}px; transform:rotate(${rotate}deg)"/>`;
    });

    document.getElementById('donutSvg').innerHTML =
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${stroke}"/>` +
        paths.join('');

    document.getElementById('donutLegend').innerHTML = `
        <div class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>High Risk</div>
        <div class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Medium Risk</div>
        <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>Low Risk</div>
    `;
}

function resetApp() {
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('uploadCard').classList.remove('hidden');
    document.getElementById('fileInput').value = '';
    document.getElementById('textInput').value = '';
    document.getElementById('dropDefault').classList.remove('hidden');
    document.getElementById('dropSuccess').classList.add('hidden');
    document.getElementById('uploadCard').scrollIntoView({ behavior: 'smooth' });
}
