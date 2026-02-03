/* =========================================================
   DUAL.INFODOSE v8.1 — KOBLLUX OMEGA (MONOLITH)
   Updated: toggle/open-close state handling (clean)
========================================================= */

const STORAGE = {
  API_KEY: 'di_apiKey',
  MODEL: 'di_modelName',
  SYSTEM_ROLE: 'di_infodoseName',
  USER_ID: 'di_userName',
  BG_IMAGE: 'di_bgImage',
  CUSTOM_CSS: 'di_customCss',
  SOLAR_MODE: 'di_solarMode',
  SOLAR_AUTO: 'di_solarAuto'
};

// KODUX ARQUÉTIPOS
const KODUX = { ARQUETIPOS: { "Atlas":{Essencia:"Planejador"}, "Nova":{Essencia:"Inspira"}, "Vitalis":{Essencia:"Momentum"}, "Pulse":{Essencia:"Emocional"}, "Artemis":{Essencia:"Descoberta"}, "Serena":{Essencia:"Cuidado"}, "Kaos":{Essencia:"Transformador"}, "Genus":{Essencia:"Fabricus"}, "Lumine":{Essencia:"Alegria"}, "Solus":{Essencia:"Sabedoria"}, "Rhea":{Essencia:"Vínculo"}, "Aion":{Essencia:"Tempo"} } };

const FOOTER_TEXTS = { closed:{ritual:["tocar o campo é consentir","registro aguarda presença"],tecnico:["latência detectada","aguardando input"]}, open:{sustentado:["campo ativo","consciência expandida"],estavel:["sinal estabilizado","link neural firme"]}, loading:["sincronizando neuro-link...","buscando no éter...","decodificando sinal..."] };
let lastText = null;
function getRandomText(arr){ if(!arr||arr.length===0)return"Processando..."; let t; do{t=arr[Math.floor(Math.random()*arr.length)];}while(t===lastText&&arr.length>1); lastText=t; return t; }

/* ---------------------------------------------------------
   KOBLLUX CORE (3-6-9-7)
   --------------------------------------------------------- */
const KoblluxCore = {
    async sha256Hex(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join(''); },
    classifyText(s) { const t = (s.match(/[\p{L}\p{N}_-]+/gu)||[]); return {tokens:t, verbs:[], nouns:[], adjs:[]}; }, 
    mapTrinity(pos) { return { UNO: pos.tokens[0]||'NÚCLEO', DUAL: 'relaciona', TRINITY: 'integrado' }; },
    async process(input) { if(!input)return null; const pos=this.classifyText(input); const tri=this.mapTrinity(pos); const seal=await this.sha256Hex(input+new Date().toISOString()); return { raw:input, pos:pos, trinity:tri, seal:seal.slice(0,16), log:`[KOBLLUX ∆7] UNO:${tri.UNO}` }; }
};

/* ---------------------------------------------------------
   UTILS
   --------------------------------------------------------- */
const Utils = {
    copy(btn) { navigator.clipboard.writeText(btn.closest('.msg-block').innerText.replace("content_copy","").trim()); App.showToast("Copiado"); },
    speak(btn) { App.speakText(btn.closest('.msg-block').innerText.replace(/<[^>]*>?/gm, '').trim()); },
    edit(btn) { const b = btn.closest('.msg-block'); document.getElementById('userInput').value = b.innerText.replace("content_copy","").trim(); b.remove(); App.speakText("Editando"); }
};

const DownloadUtils = {
    _getBlock(btn) { return btn.closest('.msg-block'); },
    _getCleanHtml(block) { const clone = block.cloneNode(true); const tools = clone.querySelector('.msg-tools'); if(tools) tools.remove(); return clone.innerHTML; },
    _guessFilename(base, extFallback='txt') { const t = new Date().toISOString().replace(/[:.]/g,'-'); return `ai-output-${t}.${extFallback}`; },
    downloadMessage(btn) { const block=this._getBlock(btn); if(!block)return; const content=this._getCleanHtml(block); const blob=new Blob([content],{type:'text/html;charset=utf-8'}); this.triggerDownload(blob, this._guessFilename(content,'html')); },
    downloadMarkdown(btn) { const block=this._getBlock(btn); if(!block)return; const raw=block.dataset.raw||block.innerText; const blob=new Blob([raw],{type:'text/markdown;charset=utf-8'}); this.triggerDownload(blob, this._guessFilename(raw,'md')); },
    openSandbox(btn) { const block=this._getBlock(btn); if(!block)return; const content=this._getCleanHtml(block); const blob=new Blob([content],{type:'text/html'}); window.open(URL.createObjectURL(blob), '_blank'); },
    async exportPdf(btn) { if(typeof html2pdf==='undefined') return this.openSandbox(btn); const block=this._getBlock(btn); if(!block)return; const content=this._getCleanHtml(block); const div=document.createElement('div'); div.innerHTML=content; div.style.background='white'; div.style.color='black'; div.style.padding='20px'; html2pdf().from(div).save(this._guessFilename(content,'pdf')); },
    triggerDownload(blob, filename) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); }
};

/* ---------------------------------------------------------
   PREVIEW & HTML VIEWER
   --------------------------------------------------------- */
const Preview = {
    async renderPreview(file) {
        if(file.type==='text/html'||file.name.endsWith('.html')){ const t=await file.text(); const b=new Blob([t],{type:'text/html'}); return `<div class="preview-html"><iframe src="${URL.createObjectURL(b)}" sandbox="allow-scripts allow-popups"></iframe></div>`; }
        if(file.type.startsWith('image/')) return `<img src="${URL.createObjectURL(file)}" style="max-width:100%;border-radius:8px">`;
        const t=await file.text(); return `<pre><code>${t.slice(0,500).replace(/</g,'&lt;')}</code></pre>`;
    },
    createHtmlViewer(htmlCode) {
        const id='html-'+Date.now(); const url=URL.createObjectURL(new Blob([htmlCode],{type:'text/html'}));
        return `<div class="html-viewer" id="${id}"><div class="html-viewer-bar"><button class="html-viewer-btn active" onclick="Preview.switch('${id}','p')">Preview</button><button class="html-viewer-btn" onclick="Preview.switch('${id}','c')">Code</button><button class="html-viewer-btn" onclick="Preview.full('${id}','${url}')">Full</button></div><div class="html-viewer-content"><iframe src="${url}" sandbox="allow-scripts allow-popups allow-forms"></iframe><div class="html-viewer-code"><pre><code>${htmlCode.replace(/</g,'&lt;')}</code></pre></div></div></div>`;
    },
    switch(id,m){ const c=document.getElementById(id); if(m==='c')c.classList.add('show-code'); else c.classList.remove('show-code'); },
    full(id,url){ const c=document.getElementById(id); c.classList.add('fullscreen'); c.querySelector('iframe').src=url; const btn=document.createElement('button'); btn.innerText='Exit'; btn.style.position='fixed'; btn.style.top='10px'; btn.style.right='10px'; btn.style.zIndex='9999'; btn.onclick=()=>{c.classList.remove('fullscreen'); btn.remove();}; document.body.appendChild(btn); }
};

/* ---------------------------------------------------------
   MAIN APP CONTROLLER (UPDATED OPEN/CLOSE STATE HANDLING)
   --------------------------------------------------------- */
const App = {
    // default open state now read from localStorage (falling back to true)
    state: { open: localStorage.getItem('di_fieldOpen') === 'false' ? false : true, messages: [], isAutoSolar: true, solarMode: 'night', isProcessing: false, isListening: false, recognition: null },

    init() {
        const s = localStorage;
        document.getElementById('apiKeyInput').value = s.getItem(STORAGE.API_KEY) || '';
        document.getElementById('systemRoleInput').value = s.getItem(STORAGE.SYSTEM_ROLE) || `(KØBLLUX · DUΛL · MØDØ UNØ)\nVocê é Dual.Infodose v8.0.\nUse formatação avançada (Markdown, Chips [ ], Listas).`;
        document.getElementById('inputUserId').value = s.getItem(STORAGE.USER_ID) || 'Viajante Δ';
        document.getElementById('inputModel').value = s.getItem(STORAGE.MODEL) || 'tngtech/deepseek-r1t2-chimera:free';
        this.state.isAutoSolar = s.getItem(STORAGE.SOLAR_AUTO) !== 'false';
        if (this.state.isAutoSolar) this.autoByTime(); else this.setMode(s.getItem(STORAGE.SOLAR_MODE) || 'night');

        this.indexedDB.loadCustomCSS();
        this.indexedDB.loadBackground();
        this.setupVoiceSystem();
        this.bindEvents();
        this.updateUI();
        this.renderDeck();

        // Apply the open/closed visual state AFTER DOM render
        this.setFieldOpen(this.state.open, true);

        setTimeout(() => this.announce("Dual.Infodose v8.0 Online."), 1200);
        if(typeof particlesJS !== 'undefined') particlesJS('particles-js', {particles:{number:{value:30},color:{value:"#ffffff"},opacity:{value:0.5},size:{value:2},line_linked:{enable:true,distance:150,color:"#ffffff",opacity:0.2,width:1}}});
    },

    setupVoiceSystem() {
        if (!('webkitSpeechRecognition' in window)) return;
        this.state.recognition = new webkitSpeechRecognition();
        this.state.recognition.lang = 'pt-BR'; this.state.recognition.continuous = true; this.state.recognition.interimResults = true;
        this.state.recognition.onstart = () => { this.state.isListening = true; document.getElementById('btnVoice').classList.add('listening'); this.showToast("🎙️ Ativo"); };
        this.state.recognition.onend = () => { if (this.state.isListening) try { this.state.recognition.start(); } catch(e){} else document.getElementById('btnVoice').classList.remove('listening'); };
        this.state.recognition.onresult = (e) => { let t=''; for(let i=e.resultIndex;i<e.results.length;++i) t+=e.results[i][0].transcript; document.getElementById('userInput').value=t; };
    },
    toggleVoice() { if (!this.state.recognition) return; if (this.state.isListening) { this.state.isListening=false; this.state.recognition.stop(); } else { document.getElementById('userInput').value=''; try{this.state.recognition.start();}catch(e){} } },

    // ===== PATCH B: HANDLE SEND E ADD MESSAGE ATUALIZADOS =====
    async handleSend() {
        const input = document.getElementById('userInput'); const txt = input.value.trim();
        if (!txt || this.state.isProcessing) return;
        input.value = '';
        // 1) Renderiza user message
        this.addMessage('user', txt);
        // 2) Atualiza footer e fala loading
        const loadingText = getRandomText(FOOTER_TEXTS.loading);
        const fieldHandle = document.getElementById('field-toggle-handle');
        if (fieldHandle) fieldHandle.innerHTML = `<span class="footer-dot pulse"></span> ${loadingText}`;
        this.showToast(loadingText); // fala via toaster
        this.state.isProcessing = true;

        try {
            document.body.classList.add('loading');
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem(STORAGE.API_KEY)}`, 'Content-Type': 'application/json', 'HTTP-Referer': location.origin },
                body: JSON.stringify({ model: document.getElementById('inputModel').value, messages: [ {role:'system',content:document.getElementById('systemRoleInput').value}, ...this.state.messages.slice(-10).map(m=>({role:m.role,content:m.content})), {role:'user',content:txt} ] })
            });
            const data = await res.json();
            const aiContent = data.choices?.[0]?.message?.content || "Sem sinal.";
            if (/^\s*(<!doctype html|<html)/i.test(aiContent)) this.addHTMLViewer(aiContent); else this.addMessage('ai', aiContent);
        } catch (e) { this.announce("Erro conexão."); } 
        finally { document.body.classList.remove('loading'); this.state.isProcessing = false; this.setFieldOpen(this.state.open, true); }
    },

    addMessage(role, text) {
        const c = document.getElementById('chat-container');
        const d = document.createElement('div');
        d.className = `msg-block ${role}`;
        d.dataset.raw = text||'';

        // Marca rawText (útil para TTS)
        d.dataset.rawText = (text || '').replace(/<\/?[^>]+(>|$)/g, ""); 

        if(role === 'ai') d.classList.add('response-block');

        // Markdown para ambos (IA e User, para permitir chips/listas no input do usuário)
        let html = marked.parse(text);
        
        if(role !== 'system') {
            const tools = [];
            tools.push(`<button class="tool-btn" onclick="Utils.copy(this)"><svg><use href="#icon-copy"></use></svg></button>`);
            tools.push(`<button class="tool-btn" onclick="Utils.speak(this)"><svg><use href="#icon-mic"></use></svg></button>`);
            if(role === 'ai'){
                tools.push(`<button class="tool-btn" onclick="DownloadUtils.downloadMessage(this)"><svg><use href="#icon-download"></use></svg></button>`);
                tools.push(`<button class="tool-btn" onclick="DownloadUtils.openSandbox(this)"><svg><use href="#icon-sandbox"></use></svg></button>`);
                tools.push(`<button class="tool-btn" onclick="DownloadUtils.exportPdf(this)"><svg><use href="#icon-pdf"></use></svg></button>`);
                this.state.messages.push({ role: 'assistant', content: text });
            } else {
                tools.push(`<button class="tool-btn" onclick="Utils.edit(this)"><svg><use href="#icon-edit"></use></svg></button>`);
                this.state.messages.push({ role: 'user', content: text });
            }
            html += `<div class="msg-tools">${tools.join('')}</div>`;
        }
        d.innerHTML = html;
        // Botão copiar para code blocks
        if (role === 'ai' || role === 'user') d.querySelectorAll('pre').forEach(pre => { const b=document.createElement('button'); b.className='copy-code-btn'; b.textContent='Copiar'; b.onclick=()=>{navigator.clipboard.writeText(pre.innerText);}; pre.appendChild(b); });
        
        c.appendChild(d); c.scrollTop = c.scrollHeight;
        
        // Dispara evento para o beauty pipeline (Tabelista, Chips, etc)
        document.dispatchEvent(new CustomEvent('infodx:rendered', { detail: { node: d } }));
    },
    
    addHTMLViewer(htmlContent) {
        const c = document.getElementById('chat-container'); const d = document.createElement('div'); d.className = `msg-block ai`;
        d.innerHTML = `<div>HTML Gerado:</div>${Preview.createHtmlViewer(htmlContent)}<div class="msg-tools"><button class="tool-btn" onclick="Utils.copy(this)"><svg><use href="#icon-copy"></use></svg></button></div>`;
        c.appendChild(d); c.scrollTop = c.scrollHeight;
    },

    speakText(text) { if (!text || this.state.isListening) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang='pt-BR'; u.rate=1.1; window.speechSynthesis.speak(u); },
    announce(msg) { this.showToast(msg); },
    showToast(msg) { const t = document.getElementById('nv-toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); this.speakText(msg); },
    setMode(m) { this.state.solarMode=m; document.body.classList.remove('mode-day','mode-sunset','mode-night'); document.body.classList.add(`mode-${m}`); this.updateUI(); localStorage.setItem(STORAGE.SOLAR_MODE, m); },
    cycleSolar() { const n = this.state.solarMode==='day'?'sunset':(this.state.solarMode==='sunset'?'night':'day'); this.state.isAutoSolar=false; this.setMode(n); },
    autoByTime() { const h=new Date().getHours(); this.setMode((h>=6&&h<17)?'day':(h>=17&&h<19)?'sunset':'night'); },
    updateUI() { document.getElementById('statusSolarMode').textContent = `${this.state.solarMode.toUpperCase()} ${this.state.isAutoSolar?'(AUTO)':''}`; document.getElementById('usernameDisplay').textContent = document.getElementById('inputUserId').value; },

    // NEW: central method to set field open/closed elegantly
    setFieldOpen(open, silent = false) {
        // Determine new state
        const newState = (typeof open === 'boolean') ? open : !this.state.open;
        this.state.open = newState;

        // persist
        localStorage.setItem('di_fieldOpen', this.state.open ? 'true' : 'false');

        // DOM elements
        const inputRow = document.querySelector('.input-row');
        const fieldHandle = document.getElementById('field-toggle-handle');
        const sendBtn = document.getElementById('btnSend');
        const userInput = document.getElementById('userInput');

        // Toggle body class for theme-level rules (keeps existing CSS behavior)
        document.body.classList.toggle('field-closed', !this.state.open);

        // Defensive inline styling to ensure proper pointer behavior:
        if (inputRow) {
            if (this.state.open) {
                inputRow.style.pointerEvents = 'auto';
                inputRow.style.opacity = '1';
                inputRow.style.transform = 'translateY(0)';
            } else {
                // Keep sendBtn clickable even when closed
                inputRow.style.pointerEvents = 'none';
                inputRow.style.opacity = '0';
                inputRow.style.transform = 'translateY(20px)';
            }
        }

        // Ensure send button remains clickable always
        if (sendBtn) {
            sendBtn.style.pointerEvents = 'auto';
            // optionally update aria-expanded/collapsed
            sendBtn.setAttribute('aria-pressed', this.state.open ? 'true' : 'false');
        }

        if (userInput) {
            userInput.setAttribute('aria-hidden', this.state.open ? 'false' : 'true');
            if (!this.state.open) userInput.blur();
        }

        // Footer handle text
        if (fieldHandle) fieldHandle.innerHTML = this.state.open ? `<span class="footer-dot pulse"></span> ${getRandomText(FOOTER_TEXTS.open.sustentado)}` : `<span class="footer-dot"></span> ${getRandomText(FOOTER_TEXTS.closed.ritual)}`;

        if (!silent) {
            // Speak ritual text
            this.speakText(getRandomText(FOOTER_TEXTS[this.state.open ? 'open' : 'closed'].ritual || []));
        }
    },

    // backward-compatible alias
    toggleField(f, s) { this.setFieldOpen(typeof f === 'boolean' ? f : undefined, s); },

    async crystallizeSession() {
        if(this.state.messages.length === 0) return;
        const title = this.state.messages.find(m => m.role === 'user')?.content.substring(0, 30) || "Memória";
        await this.indexedDB.saveDeckItem({ id: Date.now(), date: new Date().toLocaleString(), title: title + "...", data: [...this.state.messages] });
        await this.renderDeck(); this.announce("Memória Cristalizada.");
    },
    async renderDeck() {
        const items = await this.indexedDB.getDeck(); const c = document.getElementById('deckList');
        if(!items || items.length === 0) { c.innerHTML = 'Vazio.'; return; }
        c.innerHTML = items.sort((a,b)=>b.id-a.id).map(i => `<div class="deck-item"><div class="deck-info" onclick="App.restoreMemory(${i.id})"><h4>${i.title}</h4><span>${i.date}</span></div><button class="tool-btn" onclick="App.deleteMemory(${i.id})"><svg><use href="#icon-trash"></use></svg></button></div>`).join('');
    },
    async restoreMemory(id) { const items = await this.indexedDB.getDeck(); const i = items.find(x=>x.id===id); if(i){ document.getElementById('chat-container').innerHTML=''; this.state.messages=[]; i.data.forEach(m=>this.addMessage(m.role==='assistant'?'ai':'user',m.content)); toggleDrawer('drawerDeck'); } },
    async deleteMemory(id) { if(confirm("Deletar?")) { await this.indexedDB.deleteDeckItem(id); this.renderDeck(); } },

    bindEvents() {
        // use addEventListener and modern keydown to avoid duplicate triggers
        const sendBtn = document.getElementById('btnSend');
        if (sendBtn) sendBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleSend(); });

        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }

        const fieldHandle = document.getElementById('field-toggle-handle');
        if (fieldHandle) fieldHandle.addEventListener('click', () => this.toggleField());

        const orbToggle = document.getElementById('orbToggle');
        if (orbToggle) orbToggle.addEventListener('click', () => { toggleDrawer('drawerProfile'); });

        const btnCrystallize = document.getElementById('btnCrystallize');
        if (btnCrystallize) btnCrystallize.addEventListener('click', () => this.crystallizeSession());

        const btnCycleSolar = document.getElementById('btnCycleSolar');
        if (btnCycleSolar) btnCycleSolar.addEventListener('click', () => this.cycleSolar());

        const btnAutoSolar = document.getElementById('btnAutoSolar');
        if (btnAutoSolar) btnAutoSolar.addEventListener('click', () => { this.state.isAutoSolar=true; this.autoByTime(); });

        const inputUserId = document.getElementById('inputUserId');
        if (inputUserId) inputUserId.addEventListener('change', (e) => { localStorage.setItem(STORAGE.USER_ID, e.target.value); this.updateUI(); });

        const btnSaveConfig = document.getElementById('btnSaveConfig');
        if (btnSaveConfig) btnSaveConfig.addEventListener('click', () => { localStorage.setItem(STORAGE.API_KEY,document.getElementById('apiKeyInput').value); localStorage.setItem(STORAGE.SYSTEM_ROLE,document.getElementById('systemRoleInput').value); this.indexedDB.saveCustomCSS(document.getElementById('customCssInput').value); toggleDrawer('drawerSettings'); this.announce("Salvo"); });

        const bgUploadInput = document.getElementById('bgUploadInput');
        if (bgUploadInput) bgUploadInput.addEventListener('change', (e) => this.indexedDB.handleBackgroundUpload(e.target.files[0]));

        const btnSettings = document.getElementById('btnSettings');
        if (btnSettings) btnSettings.addEventListener('click', () => toggleDrawer('drawerSettings'));

        const btnDeck = document.getElementById('btnDeck');
        if (btnDeck) btnDeck.addEventListener('click', () => { toggleDrawer('drawerDeck'); this.renderDeck(); });

        const btnClearCss = document.getElementById('btnClearCss');
        if (btnClearCss) btnClearCss.addEventListener('click', () => this.indexedDB.clearAsset(STORAGE.CUSTOM_CSS));

        const btnVoice = document.getElementById('btnVoice');
        if (btnVoice) btnVoice.addEventListener('click', () => this.toggleVoice());

        const btnUploadFile = document.getElementById('btnUploadFile');
        if (btnUploadFile) btnUploadFile.addEventListener('click', () => document.getElementById('fileUploadInput').click());

        const fileUploadInput = document.getElementById('fileUploadInput');
        if (fileUploadInput) fileUploadInput.addEventListener('change', async(e) => {
             const f=e.target.files[0]; if(!f)return;
             const p=document.getElementById('filePreview'); if (p) p.classList.add('active');
             if (p && p.querySelector('span')) p.querySelector('span').textContent=f.name;
             if (p && p.querySelector('.file-actions')) p.querySelector('.file-actions').innerHTML=`<button class="btn-preview primary" onclick="App.confirmUpload('${f.name}')">Enviar</button>`;
        });
    },
    confirmUpload(n){
        const f=document.getElementById('fileUploadInput').files[0];
        const r=new FileReader(); r.onload=async(e)=>{
            const c=e.target.result; const prev=await Preview.renderPreview(f);
            this.addMessage('ai', `<div class="file-header">${n}</div>${prev}`);
            this.state.messages.push({role:'user',content:`[ARQUIVO: ${n}]\n${c}`});
            const fp = document.getElementById('filePreview'); if (fp) fp.classList.remove('active');
        }; r.readAsText(f);
    },

    indexedDB: {
        async getDB() { return new Promise((r,j)=>{const q=indexedDB.open("InfodoseDB",2);q.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('assets'))d.createObjectStore('assets',{keyPath:'id'});if(!d.objectStoreNames.contains('deck'))d.createObjectStore('deck',{keyPath:'id'});};q.onsuccess=e=>r(e.target.result);q.onerror=j;}); },
        async putAsset(i,d){(await this.getDB()).transaction(['assets'],'readwrite').objectStore('assets').put({id:i,...d});},
        async getAsset(i){return new Promise(async r=>(await this.getDB()).transaction(['assets']).objectStore('assets').get(i).onsuccess=e=>r(e.target.result));},
        async clearAsset(i){(await this.getDB()).transaction(['assets'],'readwrite').objectStore('assets').delete(i); if(i===STORAGE.CUSTOM_CSS)document.getElementById('custom-styles').textContent='';},
        async handleBackgroundUpload(f){if(!f)return;await this.putAsset(STORAGE.BG_IMAGE,{blob:f});this.loadBackground();},
        async loadBackground(){const d=await this.getAsset(STORAGE.BG_IMAGE);if(d?.blob)document.getElementById('bg-fake-custom').style.backgroundImage=`url('${URL.createObjectURL(d.blob)}')`;},
        async saveCustomCSS(c){await this.putAsset(STORAGE.CUSTOM_CSS,{css:c});this.loadCustomCSS();},
        async loadCustomCSS(){const d=await this.getAsset(STORAGE.CUSTOM_CSS);if(d?.css){document.getElementById('custom-styles').textContent=d.css;document.getElementById('customCssInput').value=d.css;}},
        async saveDeckItem(i){(await this.getDB()).transaction(['deck'],'readwrite').objectStore('deck').put(i);},
        async getDeck(){return new Promise(async r=>(await this.getDB()).transaction(['deck']).objectStore('deck').getAll().onsuccess=e=>r(e.target.result));},
        async deleteDeckItem(i){(await this.getDB()).transaction(['deck'],'readwrite').objectStore('deck').delete(i);}
    }
};

function toggleDrawer(id) { document.getElementById(id).classList.toggle('open'); }
window.onload = () => App.init();

/* =========================================
   3. BEAUTY PATCH SCRIPTS (INJECTED + TABELISTA)
   ========================================= */
(()=>{'use strict';
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=(s)=>s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  // ===== NEW: replaceInlineIcons() =====
  function replaceInlineIcons(root=document) {
    try {
      const skipSelector = 'pre, code, style, script, .no-icons';
      const rxToken = /:([a-z0-9\-_]+):/ig;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if(!rxToken.test(node.nodeValue)) { rxToken.lastIndex = 0; return NodeFilter.FILTER_REJECT; }
          if(node.parentElement && node.parentElement.closest(skipSelector)) return NodeFilter.FILTER_REJECT;
          rxToken.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        }
      }, false);

      const nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(textNode => {
        const txt = textNode.nodeValue;
        let match, lastIndex = 0;
        const frag = document.createDocumentFragment();
        rxToken.lastIndex = 0;
        while((match = rxToken.exec(txt)) !== null) {
          const before = txt.slice(lastIndex, match.index);
          if(before) frag.appendChild(document.createTextNode(before));
          const iconName = match[1].toLowerCase();
          const spriteId = `icon-${iconName}`;
          if(document.getElementById(spriteId)) {
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('class', 'svg-icon');
            svg.setAttribute('aria-hidden', 'true');
            const use = document.createElementNS(svgNS, 'use');
            use.setAttribute('href', `#${spriteId}`);
            svg.appendChild(use);
            frag.appendChild(svg);
          } else {
            frag.appendChild(document.createTextNode(match[0]));
          }
          lastIndex = rxToken.lastIndex;
        }
        const tail = txt.slice(lastIndex);
        if(tail) frag.appendChild(document.createTextNode(tail));
        if(frag.childNodes.length) textNode.parentNode.replaceChild(frag, textNode);
        rxToken.lastIndex = 0;
      });
    } catch(e) {
      console.warn('replaceInlineIcons error', e);
    }
  }

  // ===== PATCH C: PROCESS TABELISTA =====
  const processTabelista = (root=document) => {
    const blocks = [...(root.querySelectorAll('.msg-block'))];
    blocks.forEach(block => {
      if(block.dataset.tabelista === '1') return;
      const raw = (block.dataset.raw || block.innerText || '').replace(/\r/g, '');
      if(!raw) return;
      
      const paras = raw.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
      if(paras.length < 3) return; // Mínimo 3 parágrafos para ativar
      
      block.dataset.tabelista = '1';

      const headHtml = `<div class="flow-text"><p>${paras[0].replace(/\n/g,'<br>')}</p><p>${paras[1].replace(/\n/g,'<br>')}</p></div>`;

      const rows = paras.slice(2).map((p, idx) => {
        const cols = p.split('/').map(s=>s.trim()).filter(Boolean);
        const cells = cols.map(c => `<td>${esc(c)}</td>`).join('');
        if(cells === '') return `<tr><td>${idx+1}</td><td></td></tr>`;
        return `<tr><td>${idx+1}</td>${cells}</tr>`;
      }).join('');

      const tableHtml = `<div class="list-card"><table class="tabelista"><tbody>${rows}</tbody></table></div>`;
      
      block.innerHTML = headHtml + tableHtml;
    });
  };

  const processInline = (root=document)=>{
    const targets = $$('p, li, h1, h2, h3, h4, h5, h6, td', root).filter(n=>!n.closest('pre, code, .no-beauty'));
    const rxKV = /(^|\s)([A-Za-zÀ-ÿ0-9_]+):(?=\s|$)/g; 
    const rxParen = /\(([^\n)]+)\)/g; 
    const rxChip  = /\[\[([^[\]]+)\]\]|\[([^[\]]+)\]/g; 

    for(const el of targets){
      if(el.dataset.inlineProcessed==='1') continue; el.dataset.inlineProcessed='1';
      let out = el.innerHTML; if(/<pre|<code|contenteditable/i.test(out)) continue;
      out = out.replace(rxKV, (m, sp, key)=> `${sp}<strong class="kv-key">${key}:</strong>`);
      out = out.replace(rxParen, (m, inside)=> `<span class="span-paren">(${inside})</span>`);
      out = out.replace(rxChip, (m, dbl, sgl)=>{ const l=(dbl||sgl||'').trim(); return `<span class="${dbl?'chip-btn':'chip'}" data-chip="${esc(l)}">${esc(l)}</span>`; });
      el.innerHTML = out;
    }
  };

  const processQuestions=(root=document)=>{
    $$('p', root).filter(n=>!n.closest('.q-card, pre, code, .no-beauty')).forEach(p=>{
      const txt = (p.innerText||'').trim();
      if(txt.endsWith('?') && !p.dataset.qProcessed){
        p.dataset.qProcessed='1'; const w=document.createElement('div'); w.className='q-card';
        w.innerHTML = `<div class="q-ico">?</div><div class="q-body">${esc(txt)}</div>`; p.replaceWith(w);
      }
    });
  };

  const enableCopyLists=(root=document)=>{
    $$('.list-card', root).forEach(card=>{
      if(card.querySelector('.copy-badge')) return;
      const b=document.createElement('div'); b.className='copy-badge'; b.textContent='copiar'; card.appendChild(b);
      card.addEventListener('click', e=>{ if(e.target.closest('a,button,.chip,.chip-btn'))return;
        const t=[...card.querySelectorAll('li')].map(li=>li.innerText.trim()).join('\n');
        navigator.clipboard.writeText(t).then(()=>{b.textContent='copiado!';setTimeout(()=>b.textContent='copiar',1200);});
      });
    });
  };

  const wrapLists=(root=document)=>{
    $$('ul,ol',root).filter(el=>!el.closest('nav,.no-beauty,.toolbar')&&!el.classList.contains('ul-neo')).forEach(el=>{
      const isOL=el.tagName==='OL'; el.classList.add(isOL?'ol-neo':'ul-neo');
      if(!el.parentElement.classList.contains('list-card')){ const w=document.createElement('div'); w.className='list-card'; el.replaceWith(w); w.appendChild(el); }
    });
  };

  const renderRawHTML=(root=document)=>{
    $$('pre code', root).forEach(code=>{
      if((code.className||'').includes('language-html-raw')){
        const raw=code.textContent; const box=document.createElement('div'); box.className='raw-html-card';
        box.innerHTML=`<div class="raw-note">HTML/SVG Render</div><div class="raw-slot">${raw}</div>`;
        code.closest('pre').replaceWith(box);
      }
    });
  };

  const runAll = (node) => {
    const root = node || document;
    processTabelista(root); // 1. Tenta converter em tabela primeiro
    processInline(root);    // 2. Transforma chips e inlines (mesmo dentro da tabela)
    replaceInlineIcons(root); // 3. Converte :icon-name: tokens em SVGs (depois do inline)
    processQuestions(root);
    wrapLists(root);
    enableCopyLists(root);
    renderRawHTML(root);
  };

  document.addEventListener('infodx:rendered', (e)=> runAll(e.detail.node));
})();
