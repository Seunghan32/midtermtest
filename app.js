const STORAGE_KEY = 'decision-roulette-candidates';

const defaultCandidates = [
  { id: crypto.randomUUID(), name: '짜장면', color: '#D9D3CC' },
  { id: crypto.randomUUID(), name: '치킨', color: '#C9D3C5' },
  { id: crypto.randomUUID(), name: '초밥', color: '#E7CFC4' },
  { id: crypto.randomUUID(), name: '피자', color: '#B9CFE3' },
  { id: crypto.randomUUID(), name: '김밥', color: '#D8D2E7' },
  { id: crypto.randomUUID(), name: '국밥', color: '#E7D7B5' }
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
    saveCandidates();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    const nextCandidates = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCandidates.map((item) => ({ ...item }));
    state.candidates = nextCandidates;
    saveCandidates();
  } catch (error) {
    state.candidates = defaultCandidates.map((item) => ({ ...item }));
    saveCandidates();
  }
}

function saveCandidates() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.candidates));
  } catch (error) {
    console.warn('Unable to save candidates to localStorage:', error);
  }
}

function getColorPalette(count) {
  const palette = ['#D9D3CC', '#C9D3C5', '#E7CFC4', '#B9CFE3', '#D8D2E7', '#E7D7B5', '#B8CFC3', '#E4C7C0', '#C8D5E2', '#CFCBC2'];

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

    const actions = document.createElement('div');
    actions.className = 'candidate-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.textContent = '수정';
    editBtn.addEventListener('click', () => {
      editCandidate(candidate.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '삭제';
    deleteBtn.addEventListener('click', () => {
      removeCandidate(candidate.id);
    });

    actions.append(editBtn, deleteBtn);
    item.append(text, actions);
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

function editCandidate(id) {
  const candidate = state.candidates.find((item) => item.id === id);

  if (!candidate) {
    return;
  }

  const nextValue = window.prompt('후보명을 수정하세요', candidate.name);

  if (nextValue === null) {
    return;
  }

  const trimmed = nextValue.trim();

  if (!trimmed) {
    window.alert('후보 이름을 입력해 주세요.');
    return;
  }

  const duplicate = state.candidates.some(
    (item) => item.id !== id && item.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (duplicate) {
    window.alert('이미 존재하는 후보입니다.');
    return;
  }

  candidate.name = trimmed;
  saveCandidates();
  renderCandidateList();
  renderRoulette();
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
window.addEventListener('beforeunload', saveCandidates);

loadCandidates();
renderCandidateList();
renderRoulette();
updateSpinButtonState();


