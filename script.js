// script.js — Complete, working version
// Drop into your project (replaces previous versions)

// -----------------------------
// Utility helpers
// -----------------------------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

function safeJsonFetch(path) {
  return fetch(path).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${path} (status ${r.status})`);
    return r.json();
  });
}

// -----------------------------
// App state
// -----------------------------
let JOBS = [];
let SKILLS = [];
let QUIZ = null;

// -----------------------------
// Init — load databases and attach events
// -----------------------------
async function init() {
  try {
    const [jobs, skills, quiz] = await Promise.allSettled([
      safeJsonFetch('jobs.json'),
      safeJsonFetch('skills.json'),
      safeJsonFetch('guideQuiz.json')
    ]);

    if (jobs.status === 'fulfilled') JOBS = jobs.value;
    else console.warn('jobs.json missing:', jobs.reason);

    if (skills.status === 'fulfilled') SKILLS = skills.value;
    else console.warn('skills.json missing:', skills.reason);

    if (quiz.status === 'fulfilled') QUIZ = quiz.value;
    else console.warn('guideQuiz.json missing:', quiz.reason);

  } catch (e) {
    console.error('Error loading DBs:', e);
  }

  attachUi();
  renderRoadmap(); // render whatever is available
}
window.addEventListener('load', init);

// -----------------------------
// UI: Navigation & Theme
// -----------------------------
function showSection(sectionId) {
  $$('.section').forEach(s => s.classList.add('hidden'));
  const sec = document.getElementById(sectionId);
  if (sec) sec.classList.remove('hidden');
}

const themeToggleBtn = $('#themeToggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    // If you'd like to persist theme: localStorage.setItem('dark', ...)
  });
}

// -----------------------------
// Attach general UI events
// -----------------------------
function attachUi() {
  // Role search elements
  const jobSearch = $('#jobSearch');
  const suggestions = $('#suggestions');
  const searchLoader = $('#loader');

  if (jobSearch) {
    jobSearch.addEventListener('input', onJobType);
    jobSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') performRoleSearch(jobSearch.value); });
    // click-outside to hide suggestions
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#suggestions') && !e.target.closest('#jobSearch')) {
        if (suggestions) suggestions.innerHTML = '';
      }
    });
  }

  // If Start Quiz button exists as inline onclick, it's fine; also attach here if present
  const startBtn = document.querySelector('#guide button') || $('#guide button');
  // (HTML may have onclick="startQuiz()"; this is defensive)
  if (startBtn) startBtn.addEventListener('click', startQuiz);
}

// -----------------------------
// Role suggestions & search
// -----------------------------
function onJobType(e) {
  const q = (e.target.value || '').trim().toLowerCase();
  const box = $('#suggestions');
  if (!box) return;
  box.innerHTML = '';
  if (!q) return;

  const matches = JOBS.filter(j => j.title.toLowerCase().includes(q)).slice(0, 8);
  if (matches.length === 0) return;

  matches.forEach(m => {
    const item = el('div', { class: 'suggestion' }, [document.createTextNode(m.title)]);
    item.addEventListener('click', () => {
      $('#jobSearch').value = m.title;
      box.innerHTML = '';
      performRoleSearch(m.title);
    });
    box.appendChild(item);
  });
}

async function performRoleSearch(query) {
  if (!query || !query.trim()) return;
  const q = query.trim().toLowerCase();
  const resultBox = $('#jobResult');
  const loader = $('#loader');
  if (loader) loader.style.display = 'block';
  if (resultBox) resultBox.innerHTML = '';

  // artificial small delay for UX
  await new Promise(r => setTimeout(r, 350));

  let found = JOBS.find(j => j.title.toLowerCase() === q) || JOBS.find(j => j.title.toLowerCase().includes(q));
  if (!found) {
    // fallback: render not found message with suggestions
    const ul = el('div', { class: 'job-card' });
    ul.innerHTML = `<h3>No data found for <em>${escapeHtml(query)}</em></h3>
      <p>Try one of these: ${JOBS.slice(0,6).map(j => j.title).join(', ')}</p>`;
    if (resultBox) resultBox.appendChild(ul);
    if (loader) loader.style.display = 'none';
    return;
  }

  // render found
  const card = el('div', { class: 'job-card' });
  card.innerHTML = `
    <h2>${escapeHtml(found.title)}</h2>
    <div class="meta">
      <div>⏰ ${escapeHtml(found.hours || 'N/A')}</div>
      <div>💼 ${escapeHtml(found.lifestyle || 'N/A')}</div>
      <div>💰 ${escapeHtml(found.income || 'N/A')}</div>
    </div>
    <p style="margin-top:12px">${escapeHtml(found.description || '')}</p>
  `;
  if (resultBox) resultBox.appendChild(card);
  if (loader) loader.style.display = 'none';
}

// -----------------------------
// Roadmap rendering
// -----------------------------
// =======================
// ROADMAP SECTION (NEW)
// =======================
// -----------------------------
// ROADMAP: robust, DOM-ready implementation
// Replace any older roadmap code with this block
// -----------------------------
(function() {
  // State
  let ROADMAPS = null;

  // Helpers
  const $ = sel => document.querySelector(sel);
  const escapeHtml = s => (s||'').toString().replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  // Ensure DOM loaded before we query elements
  document.addEventListener('DOMContentLoaded', async () => {
    const searchEl = $('#roadmapSearch') || $('#roadmapSearch'); // try to find element
    const suggestionsEl = $('#roadmapSuggestions');
    const loaderEl = $('#roadmapLoader');
    const resultEl = $('#roadmapResult');

    if (!searchEl || !suggestionsEl || !resultEl) {
      console.warn('Roadmap: required DOM elements missing. IDs must be: roadmapSearch, roadmapSuggestions, roadmapResult');
      return;
    }

    // load roadmap JSON once
    try {
      const resp = await fetch('roadmap.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      ROADMAPS = await resp.json();
      console.log('Roadmaps loaded:', Array.isArray(ROADMAPS) ? ROADMAPS.length + ' items' : ROADMAPS);
    } catch (err) {
      console.error('Roadmap: failed to load roadmap.json ->', err);
      // fall back: if you had skills.json earlier, try that automatically
      try {
        const r2 = await fetch('skills.json');
        if (r2.ok) {
          ROADMAPS = await r2.json();
          console.log('Loaded skills.json as fallback for roadmaps');
        }
      } catch(e){ /* ignore */ }
      if (!ROADMAPS) {
        resultEl.innerHTML = '<p style="color:var(--accent)">No roadmap data available (roadmap.json missing or path wrong).</p>';
        return;
      }
    }

    // normalize ROADMAPS - accept both shapes:
    // either [{ profession: 'X', skills: [...], steps: [...] }]  OR  [{ title: 'X', steps: [...] }]
    ROADMAPS = ROADMAPS.map(item => {
      if (item.profession) return item;
      if (item.title) return { profession: item.title, skills: item.skills || [], steps: item.steps || item.steps || [] , description: item.description || '' };
      // other shapes -> try to infer
      return {
        profession: item.profession || item.title || item.name || 'Unknown',
        skills: item.skills || item.steps || [],
        steps: item.steps || item.skills || [],
        description: item.description || ''
      };
    });

    // Debounced input handler
    let t = null;
    searchEl.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => handleSearch(searchEl.value.trim().toLowerCase()), 180);
    });

    // handle search: build suggestions with event listeners (no inline onclick)
    function handleSearch(q) {
      suggestionsEl.innerHTML = '';
      if (!q) return;
      const matches = ROADMAPS.filter(r => (r.profession||'').toLowerCase().includes(q)).slice(0, 10);
      if (!matches.length) {
        suggestionsEl.innerHTML = `<div class="suggestion">No matches</div>`;
        return;
      }

      matches.forEach(m => {
        const node = document.createElement('div');
        node.className = 'suggestion';
        node.tabIndex = 0;
        node.dataset.name = m.profession;
        node.innerHTML = `<strong>${escapeHtml(m.profession)}</strong><div style="font-size:12px;color:var(--muted)">${escapeHtml((m.description||'').slice(0,80))}</div>`;
        node.addEventListener('click', () => openRoadmap(m.profession));
        node.addEventListener('keypress', e => { if (e.key === 'Enter') openRoadmap(m.profession); });
        suggestionsEl.appendChild(node);
      });
    }

    // openRoadmap used by suggestions — safe public function
    window.openRoadmap = async function(name) {
      suggestionsEl.innerHTML = '';
      resultEl.innerHTML = '';
      if (loaderEl) loaderEl.innerHTML = 'Loading...';

      // small delay for UX
      await new Promise(r => setTimeout(r, 200));

      // find item (case-insensitive)
      const item = ROADMAPS.find(r => (r.profession||'').toLowerCase() === (name||'').toLowerCase())
                 || ROADMAPS.find(r => (r.profession||'').toLowerCase().includes((name||'').toLowerCase()));

      if (loaderEl) loaderEl.innerHTML = '';

      if (!item) {
        resultEl.innerHTML = `<div class="card"><h3>No roadmap found for ${escapeHtml(name)}</h3></div>`;
        return;
      }

      const skillsHtml = (item.skills || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
      const stepsHtml = (item.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
      resultEl.innerHTML = `
        <div class="card">
          <h2>${escapeHtml(item.profession)}</h2>
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
          ${skillsHtml ? `<h4>Key skills</h4><ul>${skillsHtml}</ul>` : ''}
          ${stepsHtml ? `<h4>Steps to master</h4><ol>${stepsHtml}</ol>` : ''}
        </div>
      `;
    };
  }); // DOMContentLoaded
})();



// -----------------------------
// Quiz: render & submit
// -----------------------------
function startQuiz() {
  const container = $('#guideSection');
  if (!container) return;

  container.innerHTML = ''; // clear
  const quizData = QUIZ || {};
  const questions = quizData.questions || [];

  if (!questions.length) {
    container.innerHTML = '<p>No quiz available (guideQuiz.json missing or invalid).</p>';
    return;
  }

  const form = el('form', { id: 'quizForm' });
  questions.forEach((q, idx) => {
    const qWrap = el('div', { class: 'quiz-question' });
    const qTitle = el('p', {}, [document.createTextNode(`${idx + 1}. ${q.question}`)]);
    qWrap.appendChild(qTitle);

    const optionsWrap = el('div', { class: 'quiz-options' });
    (q.options || []).forEach((opt, oi) => {
      const id = `q${idx}_opt${oi}`;
      const label = el('label', { for: id }, []);
      const input = el('input', { type: 'radio', name: `q${idx}`, id, value: opt.value });
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + opt.text));
      optionsWrap.appendChild(label);
    });

    qWrap.appendChild(optionsWrap);
    form.appendChild(qWrap);
  });

  const submitBtn = el('button', { type: 'button', id: 'submitQuiz' }, [document.createTextNode('Submit Quiz')]);
  submitBtn.addEventListener('click', submitQuiz);
  form.appendChild(submitBtn);

  container.appendChild(form);
  // scroll into view a little
  container.scrollIntoView({ behavior: 'smooth' });
}

async function submitQuiz() {
  // collect answers
  const form = $('#quizForm');
  if (!form) return alert('Quiz form not found.');
  const questions = QUIZ && QUIZ.questions ? QUIZ.questions : [];
  const answers = [];

  for (let i = 0; i < questions.length; i++) {
    const selected = form.querySelector(`input[name="q${i}"]:checked`);
    if (!selected) {
      alert('Please answer all questions before submitting.');
      return;
    }
    answers.push(selected.value);
  }

  // show a loading state in the guideSection
  const guideSection = $('#guideSection');
  const loadingNode = el('div', { class: 'loader' });
  guideSection.appendChild(loadingNode);

  // Replace this block with real backend call when ready.
  // We'll try a fake POST to /api/quiz; if it fails we'll compute a simple fallback result.
  let suggestion = null;
  try {
    const resp = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });

    if (resp.ok) {
      const data = await resp.json();
      suggestion = data.suggestion || JSON.stringify(data);
    } else {
      // backend returned error - fallback
      suggestion = fallbackQuizHeuristic(answers);
    }
  } catch (err) {
    // network error - fallback
    suggestion = fallbackQuizHeuristic(answers);
  } finally {
    // remove loader
    const loader = guideSection.querySelector('.loader');
    if (loader) loader.remove();
  }

  // show result
  guideSection.innerHTML = '';
  const card = el('div', { class: 'job-card' });
  card.innerHTML = `<h3>Your suggestion</h3><p>${escapeHtml(suggestion)}</p>`;
  guideSection.appendChild(card);
}

// Simple heuristic fallback to give a friendly suggestion based on answers
function fallbackQuizHeuristic(answers) {
  // Count semantic categories in answers
  const map = answers.reduce((acc, a) => {
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});

  // heuristics — tune as you like
  if (map.long_training || map.analytical || map.complex_problems) {
    return 'You may suit analytical, long-training or research-heavy careers (e.g., Medicine, Data Science, Research).';
  }
  if (map.creative || map.designing || map.freedom_create) {
    return 'You may suit creative careers (Design, Content, Product Design, Visual Arts).';
  }
  if (map.empathic || map.helping_people || map.impact_people) {
    return 'You may suit people-focused careers (Teaching, Healthcare, Social Work, Counseling).';
  }
  // default
  return 'You have a mixed profile — try internships or short projects in different areas (coding, design, people-facing) and evaluate what energizes you.';
}

// -----------------------------
// Small helpers
// -----------------------------
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
