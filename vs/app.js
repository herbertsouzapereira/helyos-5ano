/* =========================================================
   Explorando os Vasos Sanguíneos — lógica do jogo
   ========================================================= */
(function () {
  'use strict';

  const RED = '#E63950', BLUE = '#2F8FE0', PURPLE = '#A15FD9';

  /* ---------------------------------------------------------
     Navegação entre telas
  --------------------------------------------------------- */
  const screens = document.querySelectorAll('.screen');
  function showScreen(id) {
    screens.forEach((s) => s.classList.toggle('active', s.id === id));
    const el = document.getElementById(id);
    if (el) el.scrollTop = 0;
  }

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      playTap();
      const target = btn.getAttribute('data-nav');
      if (target === 'screen-hub') refreshHubBests();
      if (target === 'screen-learn') initLearn();
      if (target === 'screen-quiz') startQuiz();
      if (target === 'screen-match') startMatch();
      showScreen(target);
    });
  });

  /* ---------------------------------------------------------
     Som (Web Audio, sem arquivos externos)
  --------------------------------------------------------- */
  let audioCtx;
  function beep(freq, dur, type, vol) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.12;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* som indisponível, sem problema */ }
  }
  function playTap() { beep(440, 0.05, 'sine', 0.05); }
  function playCorrect() { beep(660, 0.12, 'triangle', 0.12); setTimeout(() => beep(880, 0.15, 'triangle', 0.12), 90); }
  function playWrong() { beep(160, 0.22, 'sawtooth', 0.09); }
  function playWin() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.12), i * 110)); }

  /* ---------------------------------------------------------
     Progresso salvo (localStorage)
  --------------------------------------------------------- */
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
  };
  function getStars() {
    return { quiz: LS.get('vs_stars_quiz', 0), match: LS.get('vs_stars_match', 0), catch: LS.get('vs_stars_catch', 0) };
  }
  function setStars(game, n) {
    const cur = LS.get('vs_stars_' + game, 0);
    if (n > cur) LS.set('vs_stars_' + game, n);
  }
  function refreshHubBests() {
    const s = getStars();
    document.querySelector('[data-best="quiz"]').textContent = 'Melhor: ' + (s.quiz ? '⭐'.repeat(s.quiz) : '—');
    document.querySelector('[data-best="match"]').textContent = 'Melhor: ' + (s.match ? '⭐'.repeat(s.match) : '—');
    document.querySelector('[data-best="catch"]').textContent = 'Melhor: ' + (s.catch ? '⭐'.repeat(s.catch) : '—');
    const total = s.quiz + s.match + s.catch;
    document.getElementById('hub-total-stars').textContent = '⭐'.repeat(total) + ' ' + '☆'.repeat(Math.max(0, 9 - total));
  }
  refreshHubBests();

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ===========================================================
     DESENHOS ANIMADOS (SVG) reaproveitados nos slides
  =========================================================== */
  function loopDiagram(focus) {
    const op = (part) => (!focus || focus === 'all' || focus === part) ? 1 : 0.16;
    return `
    <svg class="svg-diagram" viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg">
      <path d="M258,128 C210,198 90,198 40,128" fill="none" stroke="${BLUE}" stroke-width="9" stroke-linecap="round" opacity="${op('vein')}"/>
      <path d="M40,118 C90,45 210,45 258,118" fill="none" stroke="${RED}" stroke-width="9" stroke-linecap="round" opacity="${op('artery')}"/>
      <g opacity="${op('capillary')}">
        <path d="M258,118 C272,108 282,96 288,82" stroke="${PURPLE}" stroke-width="2" fill="none"/>
        <path d="M258,123 C274,120 286,116 294,108" stroke="${PURPLE}" stroke-width="2" fill="none"/>
        <path d="M258,128 C274,134 286,142 292,152" stroke="${PURPLE}" stroke-width="2" fill="none"/>
        <path d="M258,133 C270,148 278,160 282,172" stroke="${PURPLE}" stroke-width="2" fill="none"/>
        <circle cx="288" cy="82" r="3.4" fill="${PURPLE}"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.3s" repeatCount="indefinite"/></circle>
        <circle cx="294" cy="108" r="3.4" fill="${PURPLE}"><animate attributeName="opacity" values="1;0.2;1" dur="1.3s" repeatCount="indefinite"/></circle>
        <circle cx="292" cy="152" r="3.4" fill="${PURPLE}"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.1s" repeatCount="indefinite"/></circle>
        <circle cx="282" cy="172" r="3.4" fill="${PURPLE}"><animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/></circle>
      </g>
      <text x="40" y="132" font-size="42" text-anchor="middle" opacity="${op('heart')}">🫀</text>
      <text x="278" y="128" font-size="32" text-anchor="middle" opacity="${op('body')}">🧍</text>
      <g opacity="${op('artery')}">
        <animateMotion dur="1.9s" repeatCount="indefinite" path="M40,118 C90,45 210,45 258,118"/>
        <circle r="11" fill="#fff"/><text font-size="9" font-weight="700" fill="${RED}" text-anchor="middle" dy="3">O₂</text>
      </g>
      <g opacity="${op('artery')}">
        <animateMotion dur="1.9s" begin="-0.95s" repeatCount="indefinite" path="M40,118 C90,45 210,45 258,118"/>
        <circle r="11" fill="#fff"/><text font-size="9" font-weight="700" fill="${RED}" text-anchor="middle" dy="3">O₂</text>
      </g>
      <g opacity="${op('vein')}">
        <animateMotion dur="2.2s" repeatCount="indefinite" path="M258,128 C210,198 90,198 40,128"/>
        <circle r="11" fill="#fff"/><text font-size="8" font-weight="700" fill="${BLUE}" text-anchor="middle" dy="3">CO₂</text>
      </g>
      <g opacity="${op('vein')}">
        <animateMotion dur="2.2s" begin="-1.1s" repeatCount="indefinite" path="M258,128 C210,198 90,198 40,128"/>
        <circle r="11" fill="#fff"/><text font-size="8" font-weight="700" fill="${BLUE}" text-anchor="middle" dy="3">CO₂</text>
      </g>
    </svg>`;
  }

  function alveoliDiagram() {
    return `
    <svg class="svg-diagram" viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
      <circle cx="150" cy="95" r="58" fill="#FFE3EC" class="alveolus-circle"/>
      <circle cx="150" cy="95" r="38" fill="#FFC7DA" class="alveolus-circle" style="animation-delay:.2s"/>
      <text x="150" y="107" font-size="30" text-anchor="middle">🫁</text>
      <g>
        <animateMotion dur="2s" repeatCount="indefinite" path="M18,55 Q90,20 128,66"/>
        <circle r="12" fill="${BLUE}"/><text font-size="9" font-weight="700" fill="#fff" text-anchor="middle" dy="3">O₂</text>
      </g>
      <g>
        <animateMotion dur="2.3s" repeatCount="indefinite" path="M128,124 Q90,160 18,132"/>
        <circle r="12" fill="#888"/><text font-size="7.5" font-weight="700" fill="#fff" text-anchor="middle" dy="3">CO₂</text>
      </g>
      <text x="248" y="55" font-size="12" fill="${BLUE}" font-weight="700" text-anchor="middle">entra O₂</text>
      <text x="248" y="150" font-size="12" fill="#888" font-weight="700" text-anchor="middle">sai CO₂</text>
    </svg>`;
  }

  function bottlesVisual() {
    const row = (emoji, n) => Array.from({ length: n }).map((_, i) =>
      `<span class="bottle" style="animation-delay:${(i * 0.12).toFixed(2)}s">${emoji}</span>`).join('');
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div class="bottles-row">${row('🍼', 10)}</div>
      <div style="font-weight:800;color:var(--purple-dark);font-family:'Fredoka';">ou</div>
      <div class="bottles-row">${row('🥛', 5)}</div>
    </div>`;
  }

  function oximeterVisual() {
    return `<div class="oximeter-box">
      <div style="font-size:30px;">🫱</div>
      <div class="oximeter-value">97%</div>
      <div style="font-weight:700;color:var(--muted);font-size:12px;margin-top:4px;">oxigênio no sangue</div>
    </div>`;
  }

  /* ===========================================================
     MODO APRENDER (slides)
  =========================================================== */
  const slidesData = [
    {
      title: 'O Sangue',
      visual: loopDiagram('all'),
      text: `Os <span class="hl">nutrientes absorvidos no intestino</span> e o <span class="hl">gás oxigênio absorvido nos pulmões</span> se misturam ao sangue e são distribuídos para todo o corpo.<br><br>O sangue também recolhe o gás carbônico e outras substâncias que devem ser eliminadas do corpo.`
    },
    {
      title: 'Artérias',
      visual: loopDiagram('artery'),
      text: `São os vasos que <span class="hl-pink">levam o sangue que sai do coração</span> para o resto do corpo. São representadas de <b style="color:${RED}">vermelho</b>.<br><br>Uma artéria pode ter mais de <b>3&nbsp;cm de diâmetro</b>!<span class="pencil-note">✏️ Do jeito que você anotou: elas levam <b>Oxigênio</b>!</span>`
    },
    {
      title: 'Veias',
      visual: loopDiagram('vein'),
      text: `São os vasos que trazem o sangue <span class="hl-pink">de volta de todo o corpo para o coração</span>. São representadas de <b style="color:${BLUE}">azul</b>.<span class="pencil-note">✏️ Do jeito que você anotou: elas trazem <b>Gás Carbônico</b>!</span>`
    },
    {
      title: 'Vasos Capilares',
      visual: loopDiagram('capillary'),
      text: `Existem vasos tão finos que são <span class="hl">mais finos que um fio de cabelo</span> — são os vasos <span class="hl">capilares</span>!<br><br>É neles que o sangue troca oxigênio e nutrientes pelo gás carbônico das células.`
    },
    {
      title: 'Os Alvéolos',
      visual: alveoliDiagram(),
      text: `<span class="pencil-badge">✏️ sua resposta no caderno</span><span class="pencil-note">"O nosso corpo absorve o oxigênio pelos alvéolos."</span><br><br>Os alvéolos são pequenas bolsinhas dentro dos pulmões. É ali que o oxigênio do ar passa para o sangue — e o gás carbônico sai do sangue para ser expirado.`
    },
    {
      title: '5 litros por minuto!',
      visual: bottlesVisual(),
      text: `Nosso coração bombeia cerca de <b>5 litros de sangue por minuto</b>! Isso equivale a <span class="hl">10 garrafinhas de água</span> ou <span class="hl">5 sacos de leite</span>.`
    },
    {
      title: 'O Oxímetro',
      visual: oximeterVisual(),
      text: `Esse aparelho mede a quantidade de gás oxigênio no sangue, sem precisar furar o dedo!<br><br>Uma pessoa saudável tem entre <b>95%</b> e <b>99%</b> de oxigênio dissolvido no sangue.`
    }
  ];

  let learnBuilt = false;
  let slideIndex = 0;
  const track = document.getElementById('slides-track');
  const dotsWrap = document.getElementById('slide-dots');

  function buildLearn() {
    track.innerHTML = slidesData.map((s) => `
      <div class="slide">
        <h3>${s.title}</h3>
        <div class="slide-visual">${s.visual}</div>
        <div class="slide-text">${s.text}</div>
      </div>`).join('');
    dotsWrap.innerHTML = slidesData.map(() => '<span></span>').join('');
    learnBuilt = true;
  }

  function goToSlide(i) {
    slideIndex = Math.max(0, Math.min(slidesData.length - 1, i));
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
    [...dotsWrap.children].forEach((d, idx) => d.classList.toggle('active', idx === slideIndex));
    document.getElementById('slide-prev').disabled = slideIndex === 0;
    const nextBtn = document.getElementById('slide-next');
    if (slideIndex === slidesData.length - 1) {
      nextBtn.textContent = 'Ir jogar 🎮';
    } else {
      nextBtn.textContent = 'Próxima ›';
    }
  }

  function initLearn() {
    if (!learnBuilt) buildLearn();
    goToSlide(0);
  }

  document.getElementById('slide-prev').addEventListener('click', () => { playTap(); goToSlide(slideIndex - 1); });
  document.getElementById('slide-next').addEventListener('click', () => {
    playTap();
    if (slideIndex === slidesData.length - 1) {
      refreshHubBests();
      showScreen('screen-hub');
    } else {
      goToSlide(slideIndex + 1);
    }
  });

  (function enableSwipe() {
    const vp = document.getElementById('slides-viewport');
    let sx = 0, sy = 0, dragging = false;
    vp.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; dragging = true;
    }, { passive: true });
    vp.addEventListener('touchend', (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goToSlide(slideIndex + 1); else goToSlide(slideIndex - 1);
      }
    }, { passive: true });
  })();

  /* ===========================================================
     QUIZ
  =========================================================== */
  const quizPool = [
    { q: 'O que se mistura ao sangue vindo do intestino?', opts: ['Nutrientes', 'Ossos', 'Músculos', 'Cabelo'], correct: 0, explain: 'Isso mesmo! Os nutrientes absorvidos no intestino se misturam ao sangue.' },
    { q: 'De onde vem o gás oxigênio que entra no sangue?', opts: ['Do estômago', 'Dos pulmões', 'Do fígado', 'Dos rins'], correct: 1, explain: 'O oxigênio é absorvido nos pulmões, pelos alvéolos!' },
    { q: 'Como se chamam os vasos que levam o sangue do coração para o corpo?', opts: ['Veias', 'Capilares', 'Artérias', 'Nervos'], correct: 2, explain: 'Artérias! Representadas de vermelho no seu livro.' },
    { q: 'De que cor as artérias são representadas nos desenhos?', opts: ['Azul', 'Vermelho', 'Verde', 'Amarelo'], correct: 1, explain: 'Vermelho é a cor usada para representar as artérias.' },
    { q: 'Como se chamam os vasos que trazem o sangue de volta ao coração?', opts: ['Artérias', 'Veias', 'Capilares', 'Tendões'], correct: 1, explain: 'Veias! Representadas de azul.' },
    { q: 'O que as veias carregam de volta, segundo sua anotação a lápis?', opts: ['Oxigênio', 'Água', 'Gás Carbônico', 'Sal'], correct: 2, explain: 'Exatamente o que você escreveu no caderno: Gás Carbônico!' },
    { q: 'Como são os vasos capilares?', opts: ['Mais grossos que uma mangueira', 'Mais finos que um fio de cabelo', 'Do tamanho de um lápis', 'Invisíveis a olho nu, sempre'], correct: 1, explain: 'Os capilares são finíssimos — mais finos que um fio de cabelo!' },
    { q: 'Pelo que o nosso corpo absorve o oxigênio, segundo sua resposta no caderno?', opts: ['Pelo estômago', 'Pelos alvéolos', 'Pela pele', 'Pelo coração'], correct: 1, explain: 'Isso mesmo, exatamente o que você respondeu: pelos alvéolos!' },
    { q: 'Quantos litros de sangue o coração bombeia por minuto, aproximadamente?', opts: ['1 litro', '5 litros', '20 litros', '100 litros'], correct: 1, explain: '5 litros = 10 garrafinhas de água ou 5 sacos de leite!' },
    { q: 'Para que serve o oxímetro?', opts: ['Medir a temperatura', 'Medir a quantidade de oxigênio no sangue', 'Medir o peso', 'Medir a altura'], correct: 1, explain: 'Ele mede o oxigênio no sangue sem furar o dedo. O normal é entre 95% e 99%.' }
  ];

  let quizQuestions = [];
  let quizIdx = 0;
  let quizScore = 0;
  let quizCorrectCount = 0;

  function startQuiz() {
    quizQuestions = shuffle(quizPool).map((item) => {
      const opts = item.opts.map((text, i) => ({ text, correct: i === item.correct }));
      return { q: item.q, explain: item.explain, opts: shuffle(opts) };
    });
    quizIdx = 0; quizScore = 0; quizCorrectCount = 0;
    document.getElementById('quiz-score-live').textContent = '0';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const item = quizQuestions[quizIdx];
    document.getElementById('quiz-progress').style.width = (quizIdx / quizQuestions.length * 100) + '%';
    document.getElementById('quiz-question').textContent = item.q;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-next').style.display = 'none';
    const optsWrap = document.getElementById('quiz-options');
    optsWrap.innerHTML = '';
    item.opts.forEach((opt) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt.text;
      b.addEventListener('click', () => answerQuiz(opt, b));
      optsWrap.appendChild(b);
    });
  }

  function answerQuiz(opt, btnEl) {
    const item = quizQuestions[quizIdx];
    const allBtns = document.querySelectorAll('#quiz-options .quiz-opt');
    allBtns.forEach((b) => b.classList.add('disabled'));
    if (opt.correct) {
      btnEl.classList.add('correct');
      quizScore += 10; quizCorrectCount++;
      playCorrect();
      document.getElementById('quiz-feedback').textContent = '✅ ' + item.explain;
    } else {
      btnEl.classList.add('wrong');
      allBtns.forEach((b) => { if (b.textContent === item.opts.find(o => o.correct).text) b.classList.add('correct'); });
      playWrong();
      document.getElementById('quiz-feedback').textContent = '❌ ' + item.explain;
    }
    document.getElementById('quiz-score-live').textContent = quizScore;
    document.getElementById('quiz-progress').style.width = ((quizIdx + 1) / quizQuestions.length * 100) + '%';
    document.getElementById('quiz-next').style.display = 'block';
  }

  document.getElementById('quiz-next').addEventListener('click', () => {
    playTap();
    quizIdx++;
    if (quizIdx >= quizQuestions.length) {
      const stars = quizCorrectCount >= 9 ? 3 : quizCorrectCount >= 7 ? 2 : quizCorrectCount >= 4 ? 1 : 0;
      showResults({
        game: 'quiz', stars,
        detail: `Você acertou ${quizCorrectCount} de ${quizQuestions.length} perguntas (${quizScore} pontos).`,
        retryScreen: 'screen-quiz'
      });
    } else {
      renderQuizQuestion();
    }
  });

  /* ===========================================================
     JOGO DE CLASSIFICAR (arraste/toque)
  =========================================================== */
  const matchPool = [
    { text: 'Vaso vermelho que leva o sangue do coração para o corpo', answer: 'arteria' },
    { text: 'Pode ter mais de 3 cm de diâmetro', answer: 'arteria' },
    { text: '✏️ Você anotou que carrega Oxigênio', answer: 'arteria' },
    { text: 'Vaso azul que leva o sangue de volta ao coração', answer: 'veia' },
    { text: '✏️ Você anotou que carrega Gás Carbônico', answer: 'veia' },
    { text: 'Recebe o sangue vindo de todo o corpo', answer: 'veia' },
    { text: 'Mais fino que um fio de cabelo', answer: 'capilar' },
    { text: 'Liga as artérias às veias', answer: 'capilar' },
    { text: 'Onde ocorre a troca de gases com as células', answer: 'capilar' }
  ];

  let matchCorrect = 0, matchWrong = 0, matchTotal = 0, matchSelected = null;

  function startMatch() {
    matchCorrect = 0; matchWrong = 0;
    const items = shuffle(matchPool);
    matchTotal = items.length;
    matchSelected = null;
    document.getElementById('match-score-live').textContent = `0/${matchTotal}`;
    const cardsWrap = document.getElementById('match-cards');
    cardsWrap.innerHTML = '';
    items.forEach((item, i) => {
      const c = document.createElement('button');
      c.className = 'match-card';
      c.textContent = item.text;
      c.dataset.answer = item.answer;
      c.dataset.id = i;
      c.addEventListener('click', () => selectMatchCard(c));
      cardsWrap.appendChild(c);
    });
    document.querySelectorAll('.zone-box').forEach((z) => z.classList.remove('pulse', 'wrong-flash'));
  }

  function selectMatchCard(card) {
    if (card.classList.contains('placed')) return;
    playTap();
    document.querySelectorAll('.match-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    matchSelected = card;
  }

  document.querySelectorAll('.zone-box').forEach((zone) => {
    zone.addEventListener('click', () => {
      if (!matchSelected) { zone.classList.add('wrong-flash'); setTimeout(() => zone.classList.remove('wrong-flash'), 350); return; }
      const isRight = matchSelected.dataset.answer === zone.dataset.zone;
      if (isRight) {
        playCorrect();
        matchSelected.classList.add('placed');
        matchSelected.classList.remove('selected');
        matchCorrect++;
        zone.classList.add('pulse');
        setTimeout(() => zone.classList.remove('pulse'), 400);
        matchSelected = null;
        document.getElementById('match-score-live').textContent = `${matchCorrect}/${matchTotal}`;
        if (matchCorrect >= matchTotal) {
          const stars = matchWrong === 0 ? 3 : matchWrong <= 2 ? 2 : matchWrong <= 4 ? 1 : 0;
          setTimeout(() => showResults({
            game: 'match', stars,
            detail: `Você classificou todos os vasos com ${matchWrong} erro(s).`,
            retryScreen: 'screen-match'
          }), 450);
        }
      } else {
        playWrong();
        matchWrong++;
        zone.classList.add('wrong-flash');
        setTimeout(() => zone.classList.remove('wrong-flash'), 350);
      }
    });
  });

  /* ===========================================================
     CAÇA-OXIGÊNIO
  =========================================================== */
  const catchArea = document.getElementById('catch-area');
  const catchStartBtn = document.getElementById('catch-start');
  const catchTimerBar = document.getElementById('catch-timer');
  let catchScore = 0, catchSpawnId = null, catchEndId = null, catchRunning = false;

  function resetCatchScreen() {
    catchScore = 0;
    catchRunning = false;
    document.getElementById('catch-score-live').textContent = '0';
    catchArea.querySelectorAll('.bubble').forEach((b) => b.remove());
    catchTimerBar.style.transition = 'none';
    catchTimerBar.style.width = '100%';
    catchStartBtn.style.display = 'block';
    if (catchSpawnId) clearInterval(catchSpawnId);
    if (catchEndId) clearTimeout(catchEndId);
  }

  function spawnBubble() {
    const w = catchArea.clientWidth, h = catchArea.clientHeight;
    const isO2 = Math.random() < 0.68;
    const el = document.createElement('div');
    el.className = 'bubble ' + (isO2 ? 'o2' : 'co2');
    el.textContent = isO2 ? 'O₂' : 'CO₂';
    const size = 56;
    const left = Math.random() * Math.max(10, w - size - 20) + 10;
    el.style.left = left + 'px';
    el.style.bottom = '-60px';
    const dur = 3.6 + Math.random() * 1.6;
    el.style.transition = `bottom ${dur}s linear, opacity .2s ease, transform .2s ease`;
    catchArea.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.bottom = (h + 80) + 'px';
    }));
    el.addEventListener('transitionend', (e) => { if (e.propertyName === 'bottom' && el.parentNode) el.remove(); });
    el.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); popBubble(el, isO2); });
    return el;
  }

  function showFloatScore(text, x, y, color) {
    const f = document.createElement('div');
    f.className = 'floatscore';
    f.textContent = text;
    f.style.left = x + 'px';
    f.style.top = y + 'px';
    f.style.color = color;
    catchArea.appendChild(f);
    setTimeout(() => f.remove(), 720);
  }

  function popBubble(el, isO2) {
    if (!catchRunning || el.dataset.popped) return;
    el.dataset.popped = '1';
    const rect = el.getBoundingClientRect();
    const areaRect = catchArea.getBoundingClientRect();
    const x = rect.left - areaRect.left, y = rect.top - areaRect.top;
    if (isO2) { catchScore += 10; playCorrect(); showFloatScore('+10', x, y, '#1F6BB0'); }
    else { catchScore = Math.max(0, catchScore - 5); playWrong(); showFloatScore('-5', x, y, '#C22540'); }
    document.getElementById('catch-score-live').textContent = catchScore;
    el.classList.add('pop');
    setTimeout(() => el.remove(), 200);
  }

  catchStartBtn.addEventListener('click', () => {
    playTap();
    catchArea.querySelectorAll('.bubble').forEach((b) => b.remove());
    catchScore = 0; catchRunning = true;
    document.getElementById('catch-score-live').textContent = '0';
    catchStartBtn.style.display = 'none';
    catchTimerBar.style.transition = 'none';
    catchTimerBar.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      catchTimerBar.style.transition = 'width 30s linear';
      catchTimerBar.style.width = '0%';
    }));
    catchSpawnId = setInterval(spawnBubble, 650);
    spawnBubble();
    catchEndId = setTimeout(endCatch, 30000);
  });

  function endCatch() {
    catchRunning = false;
    if (catchSpawnId) clearInterval(catchSpawnId);
    catchSpawnId = null;
    catchArea.querySelectorAll('.bubble').forEach((b) => b.remove());
    const stars = catchScore >= 150 ? 3 : catchScore >= 90 ? 2 : catchScore >= 40 ? 1 : 0;
    showResults({
      game: 'catch', stars,
      detail: `Você fez ${catchScore} pontos ajudando os alvéolos a respirar!`,
      retryScreen: 'screen-catch'
    });
  }

  document.getElementById('catch-back-btn').addEventListener('click', () => {
    if (catchSpawnId) clearInterval(catchSpawnId);
    if (catchEndId) clearTimeout(catchEndId);
    catchRunning = false;
  });

  /* ===========================================================
     RESULTADOS
  =========================================================== */
  function showResults({ game, stars, detail, retryScreen }) {
    setStars(game, stars);
    document.getElementById('results-medal').textContent = stars >= 3 ? '🥇' : stars === 2 ? '🥈' : stars === 1 ? '🥉' : '💪';
    document.getElementById('results-title').textContent = stars >= 2 ? 'Muito bem!' : stars === 1 ? 'Bom trabalho!' : 'Continue tentando!';
    document.getElementById('results-detail').textContent = detail;
    document.getElementById('results-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('results-retry').onclick = () => {
      playTap();
      if (retryScreen === 'screen-quiz') startQuiz();
      if (retryScreen === 'screen-match') startMatch();
      if (retryScreen === 'screen-catch') resetCatchScreen();
      showScreen(retryScreen);
    };
    document.getElementById('results-hub').onclick = () => {
      playTap();
      refreshHubBests();
      showScreen('screen-hub');
    };
    if (stars >= 2) setTimeout(playWin, 150);
    showScreen('screen-results');
  }

  /* ---------------------------------------------------------
     Início
  --------------------------------------------------------- */
  resetCatchScreen();
  showScreen('screen-home');
})();
