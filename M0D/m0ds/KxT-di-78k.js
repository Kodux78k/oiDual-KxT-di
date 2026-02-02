
(()=>{
  const STORAGE_KEYS = {
    archetype: 'KOBLLUX_VOICE_ARCHETYPE',
    config: 'KOBLLUX_VOICES_CONFIG_JSON'
  };

  const ARCHETYPES_BASE = [
    {
      id:'kodux', name:'KODUX',
      tone:'Criador do pulso, metaconsciência',
      modulation:'Grave, confiante, pausas longas, intenção forte.',
      voice:'Reed', rate:0.86, pitch:0.68,
      colorMain:'#F97316',
      colorSoft:'rgba(249,115,22,0.30)',
      colorSecondary:'#FACC15'
    },
    {
      id:'atlas', name:'ATLAS',
      tone:'Pilar da Estrutura, Lógica Pura',
      modulation:'Sólido, direto, sem hesitação, voz profunda.',
      voice:'Rock', rate:0.9, pitch:0.6,
      colorMain:'#0EA5E9',
      colorSoft:'rgba(14,165,233,0.3)',
      colorSecondary:'#38BDF8'
    },
    {
      id:'nova', name:'NOVA',
      tone:'Inspiração e Fluidez, Criativa',
      modulation:'Suave, aérea, acolhedora, ritmo variado.',
      voice:'Samantha', rate:1.05, pitch:1.1,
      colorMain:'#A855F7',
      colorSoft:'rgba(168,85,247,0.3)',
      colorSecondary:'#C084FC'
    },
    {
      id:'vitalis', name:'VITALIS',
      tone:'Energia e Momentum, Ação',
      modulation:'Rápido, enérgico, impulsionador.',
      voice:'Thomas', rate:1.15, pitch:1.0,
      colorMain:'#22C55E',
      colorSoft:'rgba(34,197,94,0.3)',
      colorSecondary:'#4ADE80'
    },
    {
      id:'aion', name:'AION',
      tone:'Guardião do Tempo, Ancestral',
      modulation:'Lento, sábio, cavernoso, ecoante.',
      voice:'Grandpa', rate:0.75, pitch:0.55,
      colorMain:'#64748B',
      colorSoft:'rgba(100,116,139,0.3)',
      colorSecondary:'#94A3B8'
    },
    {
      id:'seraph', name:'SERAPH',
      tone:'Etéreo, Transcendente',
      modulation:'Muito suave, quase sussurrado, angelical.',
      voice:'Moira', rate:0.9, pitch:1.2,
      colorMain:'#F43F5E',
      colorSoft:'rgba(244,63,94,0.3)',
      colorSecondary:'#FB7185'
    }
  ];

  const state = { activeId: 'kodux', configOverrides: null, voicesLoaded:false, browserVoices:[], currentUtterance:null, isSpeaking:false };

  function loadStateFromStorage(){
    try{
      const savedArch = localStorage.getItem(STORAGE_KEYS.archetype);
      if(savedArch) state.activeId = savedArch;
      const cfg = localStorage.getItem(STORAGE_KEYS.config);
      if(cfg) state.configOverrides = JSON.parse(cfg);
    }catch(e){ console.warn('[KOBLLUX_VOICES] loadState', e); }
  }
  function saveArchetype(id){
    state.activeId = id;
    try{ localStorage.setItem(STORAGE_KEYS.archetype, id); }catch(e){}
    const arch = getArchetypeById(id);
    applyArchetypeTheme(arch);
    updateVoiceStatus();
    document.querySelectorAll('.archetype-badge').forEach(b=>{ applyBadgeColors(b, arch); b.textContent = arch.name; });
  }
  function saveConfigOverrides(jsonStr){
    try{
      const parsed = JSON.parse(jsonStr);
      state.configOverrides = parsed;
      localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(parsed));
      applyArchetypeTheme(getArchetypeById(state.activeId));
      updateVoiceStatus('Config de vozes salva (IDE).');
      return true;
    }catch(e){
      console.error('[KOBLLUX_VOICES] JSON inválido', e);
      updateVoiceStatus('JSON inválido na IDE.','err');
      return false;
    }
  }

  function getAllArchetypes(){ return state.configOverrides && Array.isArray(state.configOverrides) ? state.configOverrides : ARCHETYPES_BASE; }
  function getArchetypeById(id){ const list = getAllArchetypes(); return list.find(a=>a.id===id) || list.find(a=>a.id==='kodux') || list[0]; }

  function applyArchetypeTheme(arch){
    if(!arch) arch = getArchetypeById(state.activeId);
    const root = document.documentElement;
    const primary   = arch.colorMain      || '#00f5ff';
    const secondary = arch.colorSecondary || '#ff4bff';
    const soft      = arch.colorSoft      || 'rgba(0,245,255,0.18)';
    root.style.setProperty('--kob-voice-primary',  primary);
    root.style.setProperty('--kob-voice-secondary',secondary);
    root.style.setProperty('--kob-voice-bg-soft', soft);
    root.style.setProperty('--accent', primary);
    root.style.setProperty('--accent-soft', soft);
    root.style.setProperty('--kob-voice-glow', `0 0 18px ${hexToRgba(primary,0.70)}`);
  }

  function hexToRgba(hex, alpha){
    if(!hex) return `rgba(0,0,0,${alpha||1})`;
    let c = hex.replace('#','');
    if(c.length === 3) c = c.split('').map(ch => ch+ch).join('');
    const num = parseInt(c,16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha||1})`;
  }
  function applyBadgeColors(badgeEl, arch){
    const primary = arch.colorMain || '#00f5ff';
    const soft    = arch.colorSoft || 'rgba(0,245,255,0.22)';
    badgeEl.style.borderColor   = hexToRgba(primary,0.85);
    badgeEl.style.color         = primary;
    badgeEl.style.background    = soft;
    badgeEl.style.boxShadow     = `0 0 14px ${hexToRgba(primary,0.55)}`;
  }

  // --- BROWSER VOICES
  function loadBrowserVoices(){ let v = window.speechSynthesis?.getVoices()||[]; if(v.length){ state.browserVoices=v; state.voicesLoaded=true; } }
  function pickBrowserVoice(prefName){
    const voices = state.browserVoices;
    if(!voices || !voices.length) return null;
    if(prefName){
      const exact = voices.find(v => v.name === prefName); if(exact) return exact;
      const loose = voices.find(v => v.name.toLowerCase().includes(prefName.toLowerCase())); if(loose) return loose;
    }
    let v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt-br'));
    if(v) return v;
    v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt'));
    return v || voices[0];
  }

  function stopSpeaking(){ if(window.speechSynthesis) window.speechSynthesis.cancel(); state.isSpeaking=false; state.currentUtterance=null; toggleVoiceBtn(false); }
  function speakText(text, archetypeId){
    if(!('speechSynthesis' in window)){ updateVoiceStatus('TTS nativo não disponível.','warn'); return; }
    if(!text || !text.trim()) return;
    const arch = getArchetypeById(archetypeId || state.activeId);
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickBrowserVoice(arch.voice);
    utter.lang = 'pt-BR';
    if(voice) utter.voice = voice;
    utter.rate  = arch.rate  || 1.0;
    utter.pitch = arch.pitch || 1.0;
    utter.onstart = ()=>{ state.isSpeaking=true; state.currentUtterance=utter; toggleVoiceBtn(true); updateVoiceStatus(`Falando como ${arch.name}…`,'ok'); };
    utter.onend   = ()=>{ state.isSpeaking=false; state.currentUtterance=null; toggleVoiceBtn(false); };
    utter.onerror = (e)=>{ console.error(e); state.isSpeaking=false; state.currentUtterance=null; toggleVoiceBtn(false); updateVoiceStatus('Erro ao falar.','err'); };
    stopSpeaking();
    window.speechSynthesis.speak(utter);
  }

  // DOM Helpers
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

  function updateVoiceStatus(msg, kind){
    const el = qs('#kobVoiceStatus') || qs('#iaStatusText') || qs('#nv-toast');
    if(!el) return;
    if(!msg){ const arch = getArchetypeById(state.activeId); msg = `Arquétipo ativo: ${arch.name}`; }
    el.textContent = msg;
    el.classList.remove('ok','warn','err');
    if(kind) el.classList.add(kind); else el.classList.add('ok');
  }
  function toggleVoiceBtn(isSpeaking){
    const btn = qs('#voiceBtn') || qs('#btnVoice');
    if(!btn) return;
    if(isSpeaking) btn.classList.add('speaking');
    else btn.classList.remove('speaking');
  }

  // Enhance response blocks (compatible com .msg-block.ai)
  function enhanceResponseBlocks(root){
    const container = root || document;
    const blocks = container.querySelectorAll('.response-block, .msg-block.ai');
    blocks.forEach(block=>{
      if(block.dataset.kobTtsInit === '1') return;
      block.dataset.kobTtsInit = '1';
      if(!block.dataset.rawText) block.dataset.rawText = (block.dataset.raw || block.innerText || block.textContent || '').trim();
      if(!block.querySelector('.archetype-badge')){
        const badge = document.createElement('div'); badge.className = 'archetype-badge';
        const arch = getArchetypeById(state.activeId); badge.textContent = arch.name; applyBadgeColors(badge, arch);
        block.appendChild(badge);
      }
      if(!block.querySelector('.block-tts-btn')){
        const btn = document.createElement('button'); btn.type='button'; btn.className='block-tts-btn'; btn.title='Ouvir este trecho'; btn.innerText='▶';
        btn.addEventListener('click', (e)=>{ e.stopPropagation(); const txt = block.dataset.rawText || block.innerText || ''; speakText(txt, state.activeId); btn.classList.add('speaking'); setTimeout(()=>btn.classList.remove('speaking'), 600); });
        block.appendChild(btn);
      }
    });
  }

  // Observer fallback: usa .pages-wrapper ou #chat-container
  function attachBlocksObserver(){
    const pagesWrapper = qs('.pages-wrapper') || qs('#chat-container') || document.body;
    const mo = new MutationObserver(muts=>{
      for(const m of muts){
        if(m.addedNodes && m.addedNodes.length){
          m.addedNodes.forEach(node=>{
            if(node.nodeType === 1) enhanceResponseBlocks(node);
          });
        }
      }
    });
    mo.observe(pagesWrapper, {childList:true, subtree:true});
  }

  function attachTtsClickHandler(){
    document.addEventListener('click', ev=>{
      const ttsBtn = ev.target.closest('.block-tts-btn');
      if(ttsBtn){
        const block = ttsBtn.closest('.response-block') || ttsBtn.closest('.msg-block.ai');
        if(!block) return;
        const txt = block.dataset.rawText || block.innerText || '';
        speakText(txt, state.activeId);
      }
    });
  }

  function attachVoiceBtnHandler(){
    const voiceBtn = qs('#voiceBtn') || qs('#btnVoice');
    if(!voiceBtn) return;
    
    // Clique simples: Fala a última msg
    voiceBtn.addEventListener('click', ()=>{
      if(state.isSpeaking){ stopSpeaking(); return; }
      const blocks = Array.from(document.querySelectorAll('.response-block, .msg-block.ai'));
      if(!blocks.length) { updateVoiceStatus('Nada pra ler ainda.', 'warn'); return; }
      const last = blocks[blocks.length - 1];
      const txt = last.dataset.rawText || last.innerText || '';
      speakText(txt, state.activeId);
    });

    // Clique longo (simulação): Abre painel
    voiceBtn.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
        const p = qs('#iaConfigPanel');
        if(p) p.style.display = (p.style.display==='none' || p.style.display==='') ? 'block' : 'none';
    });
  }

  // BUILD simple IDE panel inside #iaConfigPanel
  function buildVoiceIdePanel(){
    const panel = qs('#iaConfigPanel');
    if(!panel) return;
    // panel.style.display = 'block'; // START HIDDEN (commented out)
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong>KOBLLUX · VOICES</strong>
        <button id="kobClosePanel" class="pill-btn">✕</button>
      </div>
      <div class="ia-config-body"></div>
    `;
    panel.querySelector('#kobClosePanel').addEventListener('click', ()=>{ panel.style.display='none'; });
    let body = panel.querySelector('.ia-config-body');

    const fieldArch = document.createElement('div'); fieldArch.className='ia-field';
    fieldArch.innerHTML = `<label>Voz arquétipa ativa</label><select id="kobArchetypeSelect" style="width:100%;margin-top:6px;background:#222;color:#fff;padding:8px;border-radius:4px;border:1px solid #444;"></select><div id="kobVoiceStatus" style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)"></div>`;
    body.appendChild(fieldArch);

    const select = fieldArch.querySelector('#kobArchetypeSelect');
    getAllArchetypes().forEach(a=>{ const opt=document.createElement('option'); opt.value=a.id; opt.textContent = `${a.name} · ${a.tone}`; select.appendChild(opt); });
    select.value = state.activeId;
    select.addEventListener('change', ()=> saveArchetype(select.value) );

    const fieldIde = document.createElement('div'); fieldIde.className='ia-field';
    fieldIde.innerHTML = `<label>IDE de Vozes (JSON)</label><textarea id="kobVoicesIde" rows="6" style="width:100%;margin-top:6px;border-radius:6px;background:rgba(0,0,0,0.6);padding:8px;color:inherit;font-family:monospace;font-size:0.8rem;"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button id="kobVoicesSaveBtn" class="pill-btn">Salvar IDE</button><button id="kobVoicesResetBtn" class="pill-btn secondary">Reset</button></div>`;
    body.appendChild(fieldIde);
    const ideTextarea = fieldIde.querySelector('#kobVoicesIde');
    ideTextarea.value = JSON.stringify(state.configOverrides || ARCHETYPES_BASE, null, 2);

    fieldIde.querySelector('#kobVoicesSaveBtn').addEventListener('click', ()=>{ const ok = saveConfigOverrides(ideTextarea.value); if(ok) updateVoiceStatus('IDE salva.'); });
    fieldIde.querySelector('#kobVoicesResetBtn').addEventListener('click', ()=>{ state.configOverrides=null; localStorage.removeItem(STORAGE_KEYS.config); ideTextarea.value = JSON.stringify(ARCHETYPES_BASE, null, 2); applyArchetypeTheme(getArchetypeById(state.activeId)); updateVoiceStatus('Resetado.','warn'); });

    updateVoiceStatus();
  }

  function init(){
    loadStateFromStorage();
    loadBrowserVoices();
    if('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = ()=> loadBrowserVoices();
    applyArchetypeTheme( getArchetypeById(state.activeId) );
    enhanceResponseBlocks(document);
    attachBlocksObserver();
    attachTtsClickHandler();
    attachVoiceBtnHandler();
    buildVoiceIdePanel();

    window.KOBLLUXVoices = {
      speak: speakText,
      stop: stopSpeaking,
      getActiveArchetype: ()=> getArchetypeById(state.activeId),
      setActiveArchetype: saveArchetype,
      getAllArchetypes,
      getRawConfig: ()=> ARCHETYPES_BASE,
      getOverrides: ()=> state.configOverrides
    };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
