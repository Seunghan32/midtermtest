const STORAGE_KEY = 'decision-roulette-candidates';

const defaultCandidates = [
  { id: crypto.randomUUID(), name: '짜장면', color: '#4f46e5' },
  { id: crypto.randomUUID(), name: '치킨', color: '#f59e0b' },
  { id: crypto.randomUUID(), name: '초밥', color: '#10b981' },
  { id: crypto.randomUUID(), name: '피자', color: '#ef4444' },
  { id: crypto.randomUUID(), name: '김밥', color: '#8b5cf6' },
  { id: crypto.randomUUID(), name: '국밥', color: '#ec4899' }
];

const state = {
  candidates: [],
  isSpinning: false,
  totalRotation: 0,
  selectedId: null,
};

const candidateForm = document.getElementById('candidate-form');
const candidateInput = document.getElementById('candidate-input');
const candidateList = document.getElementById('candidate-list');
const spinBtn = document.getElementById('spin-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const resetBtn = document.getElementById('reset-btn');
const resultText = document.getElementById('result-text');
const rouletteWheel = document.getElementById('roulette-wheel');
const rouletteLabels = document.getElementById('roulette-labels');

function loadCandidates() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    state.candidates = defaultCandidates.map((item) => ({ ...item }));
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.candidates = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCandidates.map((item) => ({ ...item }));
  } catch (error) {
    state.candidates = defaultCandidates.map((item) => ({ ...item }));
  }
}

function saveCandidates() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.candidates));
}

function getColorPalette(count) {
  const palette = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#84cc16'];

  return Array.from({ length: count }, (_, index) => {
    const candidate = state.candidates[index];
    return candidate?.color || palette[index % palette.length];
  });
}

function renderCandidateList() {
  candidateList.innerHTML = '';

  if (state.candidates.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = '후보를 추가해보세요\n2개 이상이어야 룰렛을 돌릴 수 있어요.';
    candidateList.appendChild(empty);
    return;
  }

  state.candidates.forEach((candidate) => {
    const item = document.createElement('li');
    item.className = 'candidate-item';

    const text = document.createElement('span');
    text.className = 'candidate-text';
    text.textContent = candidate.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '삭제';
    deleteBtn.setAttribute('data-id', candidate.id);

    deleteBtn.addEventListener('click', () => {
      removeCandidate(candidate.id);
    });

    item.append(text, deleteBtn);
    candidateList.appendChild(item);
  });
}

function renderRouletteLabels() {
  rouletteLabels.innerHTML = '';

  if (state.candidates.length === 0) {
    return;
  }

  const angleStep = 360 / state.candidates.length;

  state.candidates.forEach((candidate, index) => {
    const label = document.createElement('div');
    label.className = 'roulette-label';

    const centerAngle = index * angleStep + angleStep / 2;
    const radians = (centerAngle - 90) * (Math.PI / 180);
    const radius = 38;
    const x = 50 + Math.cos(radians) * radius;
    const y = 50 + Math.sin(radians) * radius;

    label.textContent = candidate.name;
    label.style.left = `${x}%`;
    label.style.top = `${y}%`;
    label.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg)`;
    rouletteLabels.appendChild(label);
  });
}

function renderRoulette() {
  const colors = getColorPalette(state.candidates.length);

  if (state.candidates.length === 0) {
    rouletteWheel.style.background = '#f3f4f6';
    rouletteWheel.style.transform = 'rotate(0deg)';
    rouletteLabels.innerHTML = '';
    return;
  }

  const segments = colors.map((color, index) => {
    const start = (360 / colors.length) * index;
    const end = (360 / colors.length) * (index + 1);
    return `${color} ${start}deg ${end}deg`;
  });

  rouletteWheel.style.background = `conic-gradient(${segments.join(', ')})`;
  rouletteWheel.style.transform = `rotate(${state.totalRotation}deg)`;
  renderRouletteLabels();
}

function updateSpinButtonState() {
  const enabled = !state.isSpinning && state.candidates.length >= 2;
  spinBtn.disabled = !enabled;
}

function addCandidate(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    candidateInput.focus();
    return;
  }

  const duplicate = state.candidates.some(
    (candidate) => candidate.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (duplicate) {
    candidateInput.value = '';
    candidateInput.focus();
    return;
  }

  state.candidates.push({
    id: crypto.randomUUID(),
    name: trimmed,
    color: getColorPalette(state.candidates.length + 1)[state.candidates.length],
  });

  candidateInput.value = '';
  saveCandidates();
  renderCandidateList();
  renderRoulette();
  updateSpinButtonState();
  candidateInput.focus();
}

function removeCandidate(id) {
  state.candidates = state.candidates.filter((candidate) => candidate.id !== id);

  if (state.candidates.length < 2) {
    resultText.textContent = '-';
  }

  saveCandidates();
  renderCandidateList();
  renderRoulette();
  updateSpinButtonState();
}

function clearAllCandidates() {
  state.candidates = [];
  state.selectedId = null;
  state.totalRotation = 0;
  resultText.textContent = '-';
  saveCandidates();
  renderCandidateList();
  renderRoulette();
  updateSpinButtonState();
}

function resetAll() {
  state.candidates = [];
  state.selectedId = null;
  state.totalRotation = 0;
  resultText.textContent = '-';
  candidateInput.value = '';
  saveCandidates();
  renderCandidateList();
  renderRoulette();
  updateSpinButtonState();
}

function spinRoulette() {
  if (state.isSpinning || state.candidates.length < 2) {
    return;
  }

  state.isSpinning = true;
  updateSpinButtonState();

  const winnerIndex = Math.floor(Math.random() * state.candidates.length);
  const winner = state.candidates[winnerIndex];
  const segmentSize = 360 / state.candidates.length;
  const selectedCenter = winnerIndex * segmentSize + segmentSize / 2;
  const rotationNeeded = 360 * 8 + (360 - selectedCenter);

  state.totalRotation += rotationNeeded;
  renderRoulette();

  window.setTimeout(() => {
    state.selectedId = winner.id;
    resultText.textContent = winner.name;
    state.isSpinning = false;
    updateSpinButtonState();
  }, 4000);
}

candidateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addCandidate(candidateInput.value);
});

clearAllBtn.addEventListener('click', clearAllCandidates);
resetBtn.addEventListener('click', resetAll);
spinBtn.addEventListener('click', spinRoulette);

loadCandidates();
renderCandidateList();
renderRoulette();
updateSpinButtonState();
