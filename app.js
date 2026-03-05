/* ═══════════════════════════════════════════════════
   VIGÍLIA IA — APP.JS
   Fase 1: Estrutura base, roteamento, canvas, estado
   ═══════════════════════════════════════════════════ */

// ─── ESTADO GLOBAL ───
const STORAGE_KEY = 'vigilia-ia';

const defaultState = {
  // Perfil (quiz)
  nome: '',
  denominacao: '',
  area: '',
  desafio: '',
  nivel: '',
  horario: '',
  // Jornada
  diaAtual: 1,
  diaSelecionado: 1,
  streak: 0,
  checkins: [],       // [1, 2, 3, ...]
  ultimoCheckin: null, // 'YYYY-MM-DD'
  // Orações geradas (cache)
  oracoes: {},        // { 1: 'texto...', 2: 'texto...' }
  // Diário
  diario: [],         // [{ id, titulo, texto, tipo, data }]
  // Pedidos
  pedidos: [],        // [{ id, nome, descricao, area, data }]
  // Agenda
  agenda: [],         // [{ id, titulo, data, tipo, obs }]
  // Config
  apiKey: '',
  quizCompleto: false,
};

let state = {};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state = saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  } catch {
    state = { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetarApp() {
  if (confirm('Tem certeza que deseja reiniciar toda a jornada? Todos os dados serão apagados.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState };
    navigateTo('landing');
  }
}

// ─── DADOS DAS SEMANAS POR ÁREA ───
const SEMANAS = {
  'Finanças': [
    'Arrependimento e limpeza financeira',
    'Declarações de provisão',
    'Decretos de colheita',
  ],
  'Família': [
    'Cura e perdão',
    'Restauração',
    'Unidade e amor',
  ],
  'Saúde': [
    'Quebra de enfermidade',
    'Cura e força',
    'Gratidão',
  ],
  'Direção e Propósito': [
    'Escuta espiritual',
    'Clareza do chamado',
    'Ativação',
  ],
  'Libertação': [
    'Identificação',
    'Quebra de correntes',
    'Consolidação',
  ],
};

function getSemana(dia) {
  if (dia <= 7) return 1;
  if (dia <= 14) return 2;
  return 3;
}

function getTemaSemana(area, dia) {
  const s = getSemana(dia);
  const temas = SEMANAS[area];
  return temas ? temas[s - 1] : '';
}

// ─── NAVEGAÇÃO DE TELAS ───
function navigateTo(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenName);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }

  // Renderizar conteúdo da tela
  if (screenName === 'quiz') renderQuiz();
  if (screenName === 'resultado') renderResultado();
  if (screenName === 'dashboard') initDashboard();
}

// ─── NAVEGAÇÃO DO DASHBOARD (seções) ───
let currentSection = 'jornada';

function showSection(sectionName) {
  currentSection = sectionName;

  // Atualiza nav
  document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionName);
  });

  // Atualiza seções
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('section-' + sectionName);
  if (target) {
    target.classList.add('active');
  }

  // Renderizar conteúdo
  renderSection(sectionName);

  // Fechar sidebar no mobile
  closeSidebar();
}

function renderSection(name) {
  switch (name) {
    case 'jornada':   renderJornada(); break;
    case 'batalha':   renderBatalha(); break;
    case 'diario':    renderDiario(); break;
    case 'pedidos':   renderPedidos(); break;
    case 'versiculo': renderVersiculo(); break;
    case 'progresso': renderProgresso(); break;
    case 'agenda':    renderAgenda(); break;
  }
}

// ─── SIDEBAR MOBILE ───
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

// ─── API KEY ───
function salvarApiKey() {
  const input = document.getElementById('apiKeyInput');
  const key = input.value.trim();
  if (key) {
    state.apiKey = key;
    saveState();
    const banner = document.getElementById('apiBanner');
    banner.style.display = 'none';
    alert('✅ Chave salva com sucesso!');
  }
}

function checkApiKey() {
  const banner = document.getElementById('apiBanner');
  if (!state.apiKey) {
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
    document.getElementById('apiKeyInput').value = state.apiKey;
  }
}

// ═══════════════════════════════════════════════════
// CANVAS — ESTRELAS ANIMADAS
// ═══════════════════════════════════════════════════
function initStarCanvas() {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 160;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        baseOpacity: Math.random() * 0.5 + 0.2,
        opacity: 0,
        speed: Math.random() * 0.015 + 0.004,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
      star.opacity += star.speed * star.dir;
      if (star.opacity >= star.baseOpacity + 0.4) {
        star.dir = -1;
      }
      if (star.opacity <= star.baseOpacity - 0.15) {
        star.dir = 1;
        star.opacity = star.baseOpacity - 0.15;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, star.opacity)})`;
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    resize();
    createStars();
  });

  resize();
  createStars();
  animate();
}

// ═══════════════════════════════════════════════════
// QUIZ — 6 PERGUNTAS DE ONBOARDING
// ═══════════════════════════════════════════════════
let quizStep = 0;

const QUIZ_STEPS = [
  {
    id: 'nome',
    titulo: 'Como você se chama?',
    subtitulo: 'Seu nome será usado em cada oração profética',
    tipo: 'input',
    placeholder: 'Digite seu nome...',
  },
  {
    id: 'denominacao',
    titulo: 'Qual sua denominação?',
    subtitulo: 'Personalizamos o tom espiritual da oração',
    tipo: 'opcoes',
    opcoes: [
      { emoji: '⛪', label: 'Evangélico(a)', value: 'Evangélico(a)' },
      { emoji: '✝️', label: 'Católico(a)', value: 'Católico(a)' },
      { emoji: '🕊️', label: 'Interdenominacional', value: 'Interdenominacional' },
      { emoji: '🤍', label: 'Prefiro não dizer', value: 'Prefiro não dizer' },
    ],
  },
  {
    id: 'area',
    titulo: 'Qual sua área de intercessão?',
    subtitulo: 'Esse será o tema central da sua jornada de 21 dias',
    tipo: 'opcoes',
    opcoes: [
      { emoji: '💰', label: 'Finanças', value: 'Finanças' },
      { emoji: '❤️', label: 'Família', value: 'Família' },
      { emoji: '🏥', label: 'Saúde', value: 'Saúde' },
      { emoji: '🎯', label: 'Direção e Propósito', value: 'Direção e Propósito' },
      { emoji: '⚡', label: 'Libertação', value: 'Libertação' },
    ],
  },
  {
    id: 'desafio',
    titulo: 'Qual seu maior desafio atual?',
    subtitulo: 'Assim cada oração será específica para sua batalha',
    tipo: 'opcoes',
    opcoes: [
      { emoji: '💸', label: 'Dívidas e problemas financeiros', value: 'Dívidas e problemas financeiros' },
      { emoji: '💔', label: 'Relacionamento ou casamento difícil', value: 'Relacionamento ou casamento difícil' },
      { emoji: '🏥', label: 'Doença ou problema de saúde', value: 'Doença ou problema de saúde' },
      { emoji: '🤔', label: 'Decisão importante sem clareza', value: 'Decisão importante sem clareza' },
      { emoji: '⚔️', label: 'Opressão ou batalha espiritual', value: 'Opressão ou batalha espiritual' },
    ],
  },
  {
    id: 'nivel',
    titulo: 'Qual seu nível espiritual?',
    subtitulo: 'Adaptamos a profundidade e linguagem da oração',
    tipo: 'opcoes',
    opcoes: [
      { emoji: '🌱', label: 'Iniciante — estou voltando pra fé', value: 'Iniciante' },
      { emoji: '🔥', label: 'Intermediário — oro regularmente', value: 'Intermediário' },
      { emoji: '⚡', label: 'Guerreiro(a) — vivo em intercessão', value: 'Guerreiro(a)' },
    ],
  },
  {
    id: 'horario',
    titulo: 'Qual seu horário profético?',
    subtitulo: 'Escolha a hora sagrada da sua vigília diária',
    tipo: 'opcoes',
    opcoes: [
      { emoji: '🌑', label: '00h — Meia-Noite do Senhor', sub: 'Atos 16:25', value: '🌑 00h — Meia-Noite do Senhor (Atos 16:25)' },
      { emoji: '🕯️', label: '03h — Hora do Getsêmani', sub: 'Mt 26:36', value: '🕯️ 03h — Hora do Getsêmani (Mt 26:36)' },
      { emoji: '🌊', label: '04h — Hora da Última Guarda', sub: 'Mc 6:48', value: '🌊 04h — Hora da Última Guarda (Mc 6:48)' },
      { emoji: '🌅', label: '05h — Hora da Aurora', sub: 'Sl 119:147', value: '🌅 05h — Hora da Aurora (Sl 119:147)' },
      { emoji: '☀️', label: '06h — Hora Prima', sub: 'Mc 16:2', value: '☀️ 06h — Hora Prima (Mc 16:2)' },
      { emoji: '🔥', label: '09h — Hora de Pentecostes', sub: 'Atos 2:15', value: '🔥 09h — Hora de Pentecostes (Atos 2:15)' },
      { emoji: '✝️', label: '12h — Hora da Cruz', sub: 'Jo 19:14', value: '✝️ 12h — Hora da Cruz (Jo 19:14)' },
      { emoji: '💧', label: '15h — Hora da Misericórdia', sub: 'Atos 3:1', value: '💧 15h — Hora da Misericórdia (Atos 3:1)' },
      { emoji: '🌙', label: '18h — Hora do Sacrifício da Tarde', sub: '1Rs 18:36', value: '🌙 18h — Hora do Sacrifício da Tarde (1Rs 18:36)' },
      { emoji: '⭐', label: '21h — Hora da Guarda da Noite', sub: 'Lm 2:19', value: '⭐ 21h — Hora da Guarda da Noite (Lm 2:19)' },
    ],
  },
];

function renderQuiz() {
  const total = QUIZ_STEPS.length;
  const step = QUIZ_STEPS[quizStep];
  const progress = ((quizStep + 1) / total) * 100;

  // Atualizar barra de progresso
  document.getElementById('quizProgressBar').style.width = progress + '%';
  document.getElementById('quizStepLabel').textContent = `Passo ${quizStep + 1} de ${total}`;

  const content = document.getElementById('quizContent');

  if (step.tipo === 'input') {
    const savedValue = state[step.id] || '';
    content.innerHTML = `
      <h2 class="quiz-title">${step.titulo}</h2>
      <p class="quiz-subtitle">${step.subtitulo}</p>
      <div class="quiz-options">
        <input
          type="text"
          id="quizInput"
          class="input-field"
          placeholder="${step.placeholder}"
          value="${savedValue}"
          autocomplete="off"
          aria-label="${step.titulo}"
        >
        <button class="btn-gold" id="quizInputBtn" style="width:100%;margin-top:8px" onclick="quizSubmitInput()">
          Continuar →
        </button>
      </div>
    `;
    const input = document.getElementById('quizInput');
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') quizSubmitInput();
    });
    // Habilitar/desabilitar botão
    const btn = document.getElementById('quizInputBtn');
    btn.disabled = !input.value.trim();
    btn.style.opacity = input.value.trim() ? '1' : '0.4';
    input.addEventListener('input', () => {
      btn.disabled = !input.value.trim();
      btn.style.opacity = input.value.trim() ? '1' : '0.4';
    });
  } else {
    let opcoesHTML = '';
    for (const op of step.opcoes) {
      const subLine = op.sub ? `<span class="quiz-option-sub">${op.sub}</span>` : '';
      opcoesHTML += `
        <button class="quiz-option" onclick="quizSelectOption('${step.id}', '${op.value.replace(/'/g, "\\'")}')">
          <span class="quiz-option-emoji">${op.emoji}</span>
          <span class="quiz-option-text">
            ${op.label}
            ${subLine}
          </span>
        </button>
      `;
    }
    content.innerHTML = `
      <h2 class="quiz-title">${step.titulo}</h2>
      <p class="quiz-subtitle">${step.subtitulo}</p>
      <div class="quiz-options">${opcoesHTML}</div>
      ${quizStep > 0 ? '<button class="quiz-back" onclick="quizBack()">← Voltar</button>' : ''}
    `;
  }
}

function quizSubmitInput() {
  const input = document.getElementById('quizInput');
  const val = input.value.trim();
  if (!val) return;

  const step = QUIZ_STEPS[quizStep];
  state[step.id] = val;
  saveState();
  quizAdvance();
}

function quizSelectOption(fieldId, value) {
  state[fieldId] = value;
  saveState();
  quizAdvance();
}

function quizAdvance() {
  if (quizStep < QUIZ_STEPS.length - 1) {
    quizStep++;
    renderQuiz();
  } else {
    // Quiz completo
    state.quizCompleto = true;
    saveState();
    navigateTo('resultado');
  }
}

function quizBack() {
  if (quizStep > 0) {
    quizStep--;
    renderQuiz();
  }
}

// ═══════════════════════════════════════════════════
// RESULTADO PÓS-QUIZ — Resumo + Timeline
// ═══════════════════════════════════════════════════
function renderResultado() {
  const el = document.getElementById('resultadoContent');
  const { nome, denominacao, area, desafio, nivel, horario } = state;

  const areaEmojis = {
    'Finanças': '💰', 'Família': '❤️', 'Saúde': '🏥',
    'Direção e Propósito': '🎯', 'Libertação': '⚡',
  };
  const emoji = areaEmojis[area] || '🔥';
  const semanas = SEMANAS[area] || SEMANAS['Finanças'];

  // Extrair só o horário curto para exibir
  const horarioCurto = horario ? horario.split('—')[0].replace(/[^\d:h]/g, '').trim() : '';

  el.innerHTML = `
    <div class="resultado-header" style="animation: fadeUp 0.5s ease-out">
      <div class="icon">🕯️</div>
      <h1><span class="text-gold">${nome}</span>, sua jornada está pronta!</h1>
      <p class="text-muted">${emoji} Área: ${area}</p>
    </div>

    <div class="perfil-grid" style="animation: fadeUp 0.6s ease-out">
      <div class="perfil-card">
        <div class="label">Denominação</div>
        <div class="value">${denominacao}</div>
      </div>
      <div class="perfil-card">
        <div class="label">Desafio</div>
        <div class="value" style="font-size:0.85rem">${desafio}</div>
      </div>
      <div class="perfil-card">
        <div class="label">Nível</div>
        <div class="value">${nivel}</div>
      </div>
      <div class="perfil-card">
        <div class="label">Horário</div>
        <div class="value" style="font-size:0.85rem">${horario.split('—')[1] || horario}</div>
      </div>
    </div>

    <h3 class="text-center" style="margin-bottom:20px; animation: fadeUp 0.7s ease-out">
      Sua Jornada de 21 Dias
    </h3>

    <div class="semanas-timeline" style="animation: fadeUp 0.8s ease-out">
      ${semanas.map((tema, i) => `
        <div class="semana-item">
          <div class="semana-num">${i + 1}</div>
          <div class="semana-info">
            <div class="semana-label">Semana ${i + 1} — Dias ${i * 7 + 1} a ${(i + 1) * 7}</div>
            <div class="semana-tema">${tema}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card-gold text-center" style="margin-bottom:32px; animation: fadeUp 0.9s ease-out">
      <p class="text-gold" style="font-weight:bold; font-size:1.05rem; margin-bottom:4px">
        21 dias de transformação espiritual
      </p>
      <p class="text-muted" style="font-size:0.9rem">
        Cada dia você receberá uma oração profética personalizada com versículos,
        palavra profética e decretos de poder.
      </p>
    </div>

    <button class="btn-gold btn-lg golden-pulse" style="width:100%; animation: fadeUp 1s ease-out"
      onclick="navigateTo('dashboard')">
      Começar minha Jornada Agora 🔥
    </button>
  `;
}

// ═══════════════════════════════════════════════════
// DASHBOARD INIT
// ═══════════════════════════════════════════════════
function initDashboard() {
  checkApiKey();
  showSection(currentSection);
}

// ═══════════════════════════════════════════════════
// 3.1 — JORNADA 21 DIAS (seção principal)
// ═══════════════════════════════════════════════════
let oracaoAtual = '';
let loadingOracao = false;

function renderJornada() {
  const el = document.getElementById('section-jornada');
  const { nome, area, horario, diaAtual, diaSelecionado, streak, checkins } = state;
  const jornadaCompleta = diaAtual > 21;
  const diaVer = Math.min(diaSelecionado || diaAtual, 21);
  const semana = getSemana(diaVer);
  const tema = getTemaSemana(area, diaVer);
  const pct = Math.round((checkins.length / 21) * 100);
  const diaJaConcluido = checkins.includes(diaVer);

  if (jornadaCompleta) {
    el.innerHTML = `
      <div class="jornada-completa">
        <div class="icon">👑</div>
        <h2>Jornada Completa!</h2>
        <p class="text-muted" style="margin-bottom:24px">
          Parabéns, ${nome}! Você completou os 21 dias de jornada profética.<br>
          Que as bênçãos derramadas continuem em sua vida!
        </p>
        <button class="btn-outline" onclick="resetarApp()">Iniciar Nova Jornada</button>
      </div>`;
    return;
  }

  // Grade dos dias
  let diasHTML = '';
  for (let d = 1; d <= 21; d++) {
    const concluido = checkins.includes(d);
    const selecionado = d === diaVer;
    let cls = 'dia-cell pendente';
    if (concluido) cls = 'dia-cell concluido';
    if (selecionado) cls += ' selecionado';
    diasHTML += `<div class="${cls}" onclick="selecionarDia(${d})">${concluido ? '✓' : d}</div>`;
  }

  // Oração cacheada?
  const oracaoCache = state.oracoes[diaVer] || '';

  el.innerHTML = `
    <div class="jornada-header">
      <div class="jornada-info">
        <h2>Olá, <span class="text-gold">${nome}</span></h2>
        <p>${horario || ''} · ${area}</p>
      </div>
      <div class="streak-badge">🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'}</div>
    </div>

    <div class="progress-section">
      <div class="progress-label">
        <span>Semana ${semana} — ${tema}</span>
        <span class="text-gold">Dia ${Math.min(diaAtual,21)} de 21</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <p class="text-muted" style="font-size:0.8rem;margin-top:6px">${checkins.length}/21 vigílias · ${pct}%</p>
    </div>

    <div class="dias-grid">${diasHTML}</div>

    <div class="dias-legenda">
      <span><span class="legenda-dot" style="background:rgba(212,175,55,0.3);border:1px solid var(--gold)"></span> Concluído</span>
      <span><span class="legenda-dot" style="border:2px solid var(--gold);background:var(--bg3)"></span> Selecionado</span>
      <span><span class="legenda-dot" style="border:1px solid var(--border-dim);background:var(--bg)"></span> Pendente</span>
    </div>

    <div class="oracao-section card-gold">
      <h3>Oração do Dia ${diaVer}</h3>
      <p class="oracao-meta">Semana ${semana}: ${tema}</p>
      <div id="oracaoArea"></div>
    </div>
  `;

  // Renderizar área de oração
  const oracaoArea = document.getElementById('oracaoArea');
  if (loadingOracao) {
    oracaoArea.innerHTML = `
      <div class="spinner-container">
        <div class="spinner"></div>
        <p class="spinner-text">O Espírito está se movendo...</p>
      </div>`;
  } else if (oracaoAtual && diaVer === (state._diaOracaoAtual || 0)) {
    oracaoArea.innerHTML = `
      <div class="oracao-output">${oracaoAtual}</div>
      ${!diaJaConcluido ? `<button class="btn-success" onclick="completarVigilia(${diaVer})">✅ Completei minha vigília hoje!</button>` : '<p class="text-gold text-center" style="margin-top:12px">✅ Vigília concluída!</p>'}
    `;
  } else if (oracaoCache) {
    oracaoArea.innerHTML = `
      <div class="oracao-output">${oracaoCache}</div>
      ${!diaJaConcluido ? `<button class="btn-success" onclick="completarVigilia(${diaVer})">✅ Completei minha vigília hoje!</button>` : '<p class="text-gold text-center" style="margin-top:12px">✅ Vigília concluída!</p>'}
    `;
  } else {
    oracaoArea.innerHTML = `
      <button class="btn-gold golden-pulse" style="width:100%" onclick="gerarOracaoDia(${diaVer})">
        ✨ Gerar Oração Profética
      </button>`;
  }
}

function selecionarDia(dia) {
  state.diaSelecionado = dia;
  oracaoAtual = '';
  renderJornada();
}

function completarVigilia(dia) {
  if (!state.checkins.includes(dia)) {
    state.checkins.push(dia);
    state.streak++;
    state.ultimoCheckin = todayStr();
    if (dia >= state.diaAtual) {
      state.diaAtual = Math.min(dia + 1, 22);
      state.diaSelecionado = Math.min(dia + 1, 21);
    }
    saveState();
  }
  oracaoAtual = '';
  renderJornada();
}

async function gerarOracaoDia(dia) {
  if (!state.apiKey) {
    document.getElementById('apiBanner').style.display = 'block';
    alert('Configure sua chave da API Gemini primeiro!');
    return;
  }
  const semana = getSemana(dia);
  const tema = getTemaSemana(state.area, dia);
  const systemPrompt = 'Você é um intercessor profético ungido, com profundo conhecimento bíblico. Gere orações proféticas personalizadas em português brasileiro. Sempre cite versículos REAIS da Bíblia. Tom: profético, ungido, poderoso, específico para a situação da pessoa. Use o nome da pessoa. Seja declarativo e cheio de fé.';
  const userPrompt = `Gere uma oração profética para ${state.nome}, DIA ${dia} de 21, Semana ${semana} — ${tema}. Área: ${state.area} | Desafio: ${state.desafio} | Denominação: ${state.denominacao} | Nível: ${state.nivel}\n\nEstruture EXATAMENTE assim:\n\n📖 VERSÍCULO DO DIA:\n[versículo real completo com referência]\n\n🔥 PALAVRA PROFÉTICA:\n[2-3 linhas — o que Deus está falando hoje para esta pessoa]\n\n🙏 ORAÇÃO PERSONALIZADA:\n[8-10 linhas usando o nome da pessoa, específica, ungida e poderosa]\n\n⚡ DECRETO FINAL:\n[2-3 decretos em primeira pessoa, voz ativa e vitoriosa]`;

  loadingOracao = true;
  state._diaOracaoAtual = dia;
  renderJornada();

  try {
    const text = await callClaude(state.apiKey, userPrompt, systemPrompt);
    oracaoAtual = text;
    state.oracoes[dia] = text;
    saveState();
  } catch (err) {
    oracaoAtual = '';
    alert('Erro ao gerar oração: ' + err.message);
  }
  loadingOracao = false;
  renderJornada();
}

// ═══════════════════════════════════════════════════
// 3.2 — BATALHA ESPIRITUAL
// ═══════════════════════════════════════════════════
let batalhaArea = '';
let batalhaResult = '';
let batalhaLoading = false;

function renderBatalha() {
  const el = document.getElementById('section-batalha');
  const areas = ['Ansiedade', 'Medo', 'Inveja', 'Raiva', 'Vícios', 'Depressão', 'Tentação', 'Dúvida'];

  el.innerHTML = `
    <h2 style="margin-bottom:8px">⚔️ Batalha Espiritual</h2>
    <p class="text-muted" style="margin-bottom:20px">Oração de emergência para momentos de batalha</p>

    <label class="form-label">Área da batalha:</label>
    <div class="chips-container" id="batalhaChips">
      ${areas.map(a => `<button class="chip ${batalhaArea === a ? 'active' : ''}" onclick="setBatalhaArea('${a}')">${a}</button>`).join('')}
    </div>

    <div class="form-group">
      <label class="form-label">Descreva sua situação (opcional):</label>
      <textarea class="input-field" id="batalhaSituacao" placeholder="O que está acontecendo agora..."></textarea>
    </div>

    <button class="btn-gold" style="width:100%" onclick="gerarOracaoBatalha()" ${batalhaLoading ? 'disabled' : ''}>
      ${batalhaLoading ? 'Gerando...' : '⚔️ Orar em Batalha Agora'}
    </button>

    <div id="batalhaOutput" style="margin-top:20px">
      ${batalhaLoading ? '<div class="spinner-container"><div class="spinner"></div><p class="spinner-text">Invocando o poder do Alto...</p></div>' : ''}
      ${batalhaResult ? `<div class="oracao-output">${batalhaResult}</div>` : ''}
    </div>
  `;
}

function setBatalhaArea(area) {
  batalhaArea = area;
  renderBatalha();
}

async function gerarOracaoBatalha() {
  if (!state.apiKey) { alert('Configure sua API key Gemini primeiro!'); return; }
  const situacao = document.getElementById('batalhaSituacao')?.value || '';
  const systemPrompt = 'Você é um guerreiro espiritual e intercessor ungido. Gere orações de batalha espiritual intensas em português brasileiro, com versículos reais. Tom: autoritário, cheio de poder, declarativo.';
  const userPrompt = `Gere uma oração de BATALHA ESPIRITUAL urgente para ${state.nome}.\nÁrea: ${batalhaArea || 'Geral'}\nSituação: ${situacao || 'Não especificada'}\nDenominação: ${state.denominacao}\n\nEstruture:\n📖 VERSÍCULO DE GUERRA:\n[versículo real de batalha]\n\n⚔️ ORAÇÃO DE BATALHA:\n[6-8 linhas intensas, com autoridade]\n\n🛡️ DECLARAÇÃO DE VITÓRIA:\n[3 declarações poderosas em primeira pessoa]`;

  batalhaLoading = true;
  batalhaResult = '';
  renderBatalha();

  try {
    batalhaResult = await callClaude(state.apiKey, userPrompt, systemPrompt);
  } catch (err) {
    alert('Erro: ' + err.message);
  }
  batalhaLoading = false;
  renderBatalha();
}

// ═══════════════════════════════════════════════════
// 3.3 — DIÁRIO DE REVELAÇÕES
// ═══════════════════════════════════════════════════
function renderDiario() {
  const el = document.getElementById('section-diario');
  const tipos = ['Revelação', 'Sonho', 'Palavra', 'Testemunho'];

  let listaHTML = '';
  if (state.diario.length === 0) {
    listaHTML = '<div class="empty-state"><div class="icon">📓</div><p>Nenhuma revelação registrada ainda</p></div>';
  } else {
    listaHTML = [...state.diario].reverse().map(entry => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${entry.titulo}</span>
          <button class="btn-danger-sm" onclick="deletarDiario('${entry.id}')">✕</button>
        </div>
        <p class="list-item-body">${entry.texto}</p>
        <span class="list-item-badge">${entry.tipo}</span>
        <span class="list-item-date" style="margin-left:8px">${formatDate(entry.data)}</span>
      </div>
    `).join('');
  }

  el.innerHTML = `
    <h2 style="margin-bottom:20px">📓 Diário de Revelações</h2>

    <div class="card" style="margin-bottom:24px">
      <div class="form-group">
        <label class="form-label">Título</label>
        <input class="input-field" id="diarioTitulo" placeholder="Ex: Sonho sobre portas abertas...">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea class="input-field" id="diarioTexto" placeholder="Descreva sua revelação, sonho ou palavra..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="input-field" id="diarioTipo">
          ${tipos.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <button class="btn-gold" style="width:100%" onclick="salvarDiario()">Registrar Revelação</button>
    </div>

    ${listaHTML}
  `;
}

function salvarDiario() {
  const titulo = document.getElementById('diarioTitulo').value.trim();
  const texto = document.getElementById('diarioTexto').value.trim();
  const tipo = document.getElementById('diarioTipo').value;
  if (!titulo || !texto) { alert('Preencha título e descrição'); return; }
  state.diario.push({ id: generateId(), titulo, texto, tipo, data: todayStr() });
  saveState();
  renderDiario();
}

function deletarDiario(id) {
  state.diario = state.diario.filter(e => e.id !== id);
  saveState();
  renderDiario();
}

// ═══════════════════════════════════════════════════
// 3.4 — PEDIDOS DE ORAÇÃO
// ═══════════════════════════════════════════════════
function renderPedidos() {
  const el = document.getElementById('section-pedidos');
  const areas = ['Saúde', 'Família', 'Finanças', 'Trabalho', 'Relacionamento', 'Espiritual'];

  let listaHTML = '';
  if (state.pedidos.length === 0) {
    listaHTML = '<div class="empty-state"><div class="icon">🙏</div><p>Nenhum pedido de oração registrado</p></div>';
  } else {
    listaHTML = [...state.pedidos].reverse().map(p => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">🙏 ${p.nome}</span>
          <button class="btn-danger-sm" onclick="deletarPedido('${p.id}')">✕</button>
        </div>
        <p class="list-item-body">${p.descricao}</p>
        <span class="list-item-badge">${p.area}</span>
        <span class="list-item-date" style="margin-left:8px">${formatDate(p.data)}</span>
      </div>
    `).join('');
  }

  el.innerHTML = `
    <h2 style="margin-bottom:8px">🙏 Pedidos de Oração</h2>
    <p class="text-muted" style="margin-bottom:20px">Pedidos são incluídos automaticamente nas orações da Jornada</p>

    <div class="card" style="margin-bottom:24px">
      <div class="form-group">
        <label class="form-label">Nome da pessoa</label>
        <input class="input-field" id="pedidoNome" placeholder="Ex: Minha mãe, João...">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição do pedido</label>
        <textarea class="input-field" id="pedidoDesc" placeholder="Descreva o pedido de oração..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Área</label>
        <select class="input-field" id="pedidoArea">
          ${areas.map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
      </div>
      <button class="btn-gold" style="width:100%" onclick="salvarPedido()">Adicionar Pedido</button>
    </div>

    ${listaHTML}
  `;
}

function salvarPedido() {
  const nome = document.getElementById('pedidoNome').value.trim();
  const descricao = document.getElementById('pedidoDesc').value.trim();
  const area = document.getElementById('pedidoArea').value;
  if (!nome || !descricao) { alert('Preencha nome e descrição'); return; }
  state.pedidos.push({ id: generateId(), nome, descricao, area, data: todayStr() });
  saveState();
  renderPedidos();
}

function deletarPedido(id) {
  state.pedidos = state.pedidos.filter(p => p.id !== id);
  saveState();
  renderPedidos();
}

// ═══════════════════════════════════════════════════
// 3.5 — VERSÍCULO DO DIA
// ═══════════════════════════════════════════════════
let versiculoResult = '';
let versiculoLoading = false;

function renderVersiculo() {
  const el = document.getElementById('section-versiculo');

  el.innerHTML = `
    <h2 style="margin-bottom:8px">📖 Versículo do Dia</h2>
    <p class="text-muted" style="margin-bottom:24px">Receba uma palavra de Deus para o seu dia</p>

    <button class="btn-gold golden-pulse" style="width:100%;margin-bottom:24px" onclick="gerarVersiculo()" ${versiculoLoading ? 'disabled' : ''}>
      ${versiculoLoading ? 'Buscando...' : '📖 Receber Palavra do Dia'}
    </button>

    <div id="versiculoOutput">
      ${versiculoLoading ? '<div class="spinner-container"><div class="spinner"></div><p class="spinner-text">Buscando a Palavra...</p></div>' : ''}
      ${versiculoResult ? `<div class="versiculo-output">${versiculoResult}</div>` : ''}
    </div>
  `;
}

async function gerarVersiculo() {
  if (!state.apiKey) { alert('Configure sua API key Gemini primeiro!'); return; }
  const systemPrompt = 'Você é um pastor e teólogo com profundo conhecimento bíblico. Gere reflexões inspiradoras em português brasileiro usando versículos REAIS da Bíblia.';
  const userPrompt = `Gere um versículo do dia para ${state.nome}. Área de vida: ${state.area}. Nível: ${state.nivel}.\n\nEstruture:\n📖 VERSÍCULO:\n[versículo completo real com referência]\n\n💭 REFLEXÃO:\n[3-4 linhas de reflexão pessoal e aplicação]\n\n🙏 ORAÇÃO CURTA:\n[2-3 linhas de oração baseada no versículo]`;

  versiculoLoading = true;
  versiculoResult = '';
  renderVersiculo();

  try {
    versiculoResult = await callClaude(state.apiKey, userPrompt, systemPrompt);
  } catch (err) {
    alert('Erro: ' + err.message);
  }
  versiculoLoading = false;
  renderVersiculo();
}

// ═══════════════════════════════════════════════════
// 3.6 — MEU PROGRESSO
// ═══════════════════════════════════════════════════
function renderProgresso() {
  const el = document.getElementById('section-progresso');
  const { checkins, streak } = state;
  const completados = checkins.length;
  const restantes = 21 - completados;
  const pct = Math.round((completados / 21) * 100);

  let historicoHTML = '';
  if (checkins.length > 0) {
    historicoHTML = '<h3 style="margin-bottom:12px">Histórico de Vigílias</h3>';
    historicoHTML += [...checkins].sort((a,b) => a-b).map(d => {
      const s = getSemana(d);
      const t = getTemaSemana(state.area, d);
      return `<div class="list-item" style="padding:12px 16px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span><span class="text-gold" style="font-weight:bold">Dia ${d}</span> — Semana ${s}</span>
          <span class="list-item-badge">${t}</span>
        </div>
      </div>`;
    }).join('');
  }

  el.innerHTML = `
    <h2 style="margin-bottom:20px">📊 Meu Progresso</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${completados}</div>
        <div class="stat-label">Dias Completados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">🔥 ${streak}</div>
        <div class="stat-label">Streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${restantes}</div>
        <div class="stat-label">Dias Restantes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${pct}%</div>
        <div class="stat-label">Concluído</div>
      </div>
    </div>

    <div class="progress-section" style="margin-bottom:28px">
      <div class="progress-track" style="height:14px">
        <div class="progress-fill" style="width:${pct}%;height:100%"></div>
      </div>
    </div>

    ${historicoHTML}
  `;
}

// ═══════════════════════════════════════════════════
// 3.7 — AGENDA ESPIRITUAL
// ═══════════════════════════════════════════════════
function renderAgenda() {
  const el = document.getElementById('section-agenda');
  const tipos = ['Vigília', 'Jejum', 'Oração', 'Estudo', 'Encontro'];
  const hoje = todayStr();

  let listaHTML = '';
  if (state.agenda.length === 0) {
    listaHTML = '<div class="empty-state"><div class="icon">📋</div><p>Nenhum evento agendado</p></div>';
  } else {
    const sorted = [...state.agenda].sort((a, b) => a.data.localeCompare(b.data));
    listaHTML = sorted.map(ev => {
      const passado = ev.data < hoje;
      return `
        <div class="list-item ${passado ? 'item-passado' : ''}">
          <div class="list-item-header">
            <span class="list-item-title">${ev.titulo}</span>
            <button class="btn-danger-sm" onclick="deletarAgenda('${ev.id}')">✕</button>
          </div>
          <p class="list-item-body">${ev.obs || 'Sem observação'}</p>
          <span class="list-item-badge">${ev.tipo}</span>
          <span class="list-item-date" style="margin-left:8px">${formatDate(ev.data)}</span>
        </div>`;
    }).join('');
  }

  el.innerHTML = `
    <h2 style="margin-bottom:20px">📋 Agenda Espiritual</h2>

    <div class="card" style="margin-bottom:24px">
      <div class="form-group">
        <label class="form-label">Título do evento</label>
        <input class="input-field" id="agendaTitulo" placeholder="Ex: Vigília de sexta...">
      </div>
      <div class="form-group">
        <label class="form-label">Data</label>
        <input class="input-field" type="date" id="agendaData" value="${hoje}">
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="input-field" id="agendaTipo">
          ${tipos.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <textarea class="input-field" id="agendaObs" placeholder="Detalhes do evento..." style="min-height:60px"></textarea>
      </div>
      <button class="btn-gold" style="width:100%" onclick="salvarAgenda()">Agendar Evento</button>
    </div>

    ${listaHTML}
  `;
}

function salvarAgenda() {
  const titulo = document.getElementById('agendaTitulo').value.trim();
  const data = document.getElementById('agendaData').value;
  const tipo = document.getElementById('agendaTipo').value;
  const obs = document.getElementById('agendaObs').value.trim();
  if (!titulo || !data) { alert('Preencha título e data'); return; }
  state.agenda.push({ id: generateId(), titulo, data, tipo, obs });
  saveState();
  renderAgenda();
}

function deletarAgenda(id) {
  state.agenda = state.agenda.filter(e => e.id !== id);
  saveState();
  renderAgenda();
}

// ═══════════════════════════════════════════════════
// CLAUDE API — chamada direta do browser
// ═══════════════════════════════════════════════════
async function callClaude(apiKey, userPrompt, systemPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `Erro da API: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta gerada.';
}

// ═══════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initStarCanvas();

  // Decidir tela inicial
  if (state.quizCompleto) {
    navigateTo('dashboard');
  } else {
    navigateTo('landing');
  }
});
