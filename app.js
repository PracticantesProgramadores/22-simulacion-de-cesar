const screens = {
  start: document.getElementById('screen-start'),
  direction: document.getElementById('screen-direction'),
  position: document.getElementById('screen-position'),
  distance: document.getElementById('screen-distance'),
  result: document.getElementById('screen-result')
}
const scoreBadge = document.getElementById('scoreBadge')

const state = {
  level: 0,
  challenge: 0,
  totalCorrect: 0,
  levelCorrect: [0,0,0],
  challengesPerLevel: 3,
  gridSize: 7,
  felipe: { x: 3, y: 3 },
  home: { x: 5, y: 5 },
  posData: null,
  distData: null
}

const POS_OBJECTS = [
  { name: 'pelota', emoji: '⚽' },
  { name: 'gato', emoji: '🐱' },
  { name: 'mochila', emoji: '🎒' }
]
const POS_REFERENCES = [
  { name: 'mesa', emoji: '🪑' },
  { name: 'caja', emoji: '📦' },
  { name: 'niño', emoji: '👦' }
]

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'))
  screens[name].classList.add('active')
}

function updateScoreBadge() {
  scoreBadge.textContent = `⭐ ${state.totalCorrect}`
}

function playTone(ok) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(ok ? 880 : 220, ctx.currentTime)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.26)
  } catch(e) {}
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function choice(arr) { return arr[randInt(0, arr.length - 1)] }

function startGame() {
  state.level = 0
  state.challenge = 0
  state.totalCorrect = 0
  state.levelCorrect = [0,0,0]
  updateScoreBadge()
  setupDirectionLevel(true)
  showScreen('direction')
}

function nextChallengeOrLevel() {
  state.challenge++
  if (state.challenge >= state.challengesPerLevel) {
    state.level++
    state.challenge = 0
    if (state.level === 1) { setupPositionLevel(true); showScreen('position') }
    else if (state.level === 2) { setupDistanceLevel(true); showScreen('distance') }
    else { showResult() }
    return
  }
  if (state.level === 0) setupDirectionLevel(false)
  else if (state.level === 1) setupPositionLevel(false)
  else if (state.level === 2) setupDistanceLevel(false)
}

function isAtHome() { return state.felipe.x === state.home.x && state.felipe.y === state.home.y }

function setupDirectionLevel(reset) {
  const grid = document.getElementById('dirGrid')
  const feedback = document.getElementById('dirFeedback')
  const progress = document.getElementById('dirProgress')
  const prompt = document.getElementById('dirPrompt')
  if (reset) {
    state.felipe = { x: Math.floor(state.gridSize/2), y: Math.floor(state.gridSize/2) }
    let hx, hy
    do {
      hx = randInt(0, state.gridSize-1)
      hy = randInt(0, state.gridSize-1)
    } while ((hx === state.felipe.x && hy === state.felipe.y) || (Math.abs(hx - state.felipe.x) + Math.abs(hy - state.felipe.y) < 3))
    state.home = { x: hx, y: hy }
    feedback.textContent = ''
  }
  grid.innerHTML = ''
  for (let y=0; y<state.gridSize; y++) {
    for (let x=0; x<state.gridSize; x++) {
      const cell = document.createElement('div')
      cell.className = 'cell'
      if (x === state.felipe.x && y === state.felipe.y) {
        const a = document.createElement('div')
        a.className = 'avatar'
        a.textContent = '🧑'
        cell.appendChild(a)
      } else if (x === state.home.x && y === state.home.y) {
        const h = document.createElement('div')
        h.className = 'home'
        h.textContent = '🏠'
        cell.appendChild(h)
      }
      grid.appendChild(cell)
    }
  }
  const dx = state.home.x - state.felipe.x
  const dy = state.home.y - state.felipe.y
  const stepsLeft = Math.abs(dx) + Math.abs(dy)
  prompt.textContent = 'Usa las flechas para llegar a la casa'
  progress.textContent = `Faltan ${stepsLeft} paso(s) hasta 🏠`
}

function handleDirectionInput(dir) {
  const feedback = document.getElementById('dirFeedback')
  if (state.level === 0) {
    let moved = false
    if (dir === 'up' && state.felipe.y>0) { state.felipe.y--; moved = true }
    if (dir === 'down' && state.felipe.y<state.gridSize-1) { state.felipe.y++; moved = true }
    if (dir === 'left' && state.felipe.x>0) { state.felipe.x--; moved = true }
    if (dir === 'right' && state.felipe.x<state.gridSize-1) { state.felipe.x++; moved = true }
    if (moved) {
      feedback.textContent = ''
      if (isAtHome()) {
        playTone(true)
        feedback.style.color = 'var(--success)'
        feedback.textContent = '¡Llegaste a la casa!'
        state.totalCorrect++
        state.levelCorrect[0]++
        updateScoreBadge()
        setTimeout(() => { state.level++; state.challenge = 0; setupPositionLevel(true); showScreen('position') }, 700)
      } else {
        setupDirectionLevel(false)
      }
    } else {
      playTone(false)
      feedback.style.color = 'var(--danger)'
      feedback.textContent = 'No puedes salir del tablero'
    }
    return
  }
  // Fallback (no usado en otros niveles)
  playTone(false)
}

document.querySelectorAll('.arrows .btn').forEach(b => {
  b.addEventListener('click', () => {
    const dir = b.getAttribute('data-dir')
    handleDirectionInput(dir)
  })
})

window.addEventListener('keydown', (e) => {
  if (state.level !== 0) return
  const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' }
  const dir = map[e.key]
  if (!dir) return
  e.preventDefault()
  handleDirectionInput(dir)
})

function setupPositionLevel(reset) {
  const area = document.getElementById('posArea')
  const prompt = document.getElementById('posPrompt')
  const feedback = document.getElementById('posFeedback')
  const progress = document.getElementById('posProgress')
  if (reset) feedback.textContent = ''
  area.innerHTML = ''
  const ref = document.createElement('div')
  ref.className = 'ref'
  const refItem = choice(POS_REFERENCES)
  ref.textContent = refItem.emoji
  const obj = document.createElement('div')
  obj.className = 'obj'
  const objItem = choice(POS_OBJECTS)
  obj.textContent = objItem.emoji
  const aw = area.clientWidth
  const ah = area.clientHeight
  const refSize = 120
  const objSize = 90
  const m = 16
  const rx = randInt(m, Math.max(m, aw - refSize - m))
  const ry = randInt(m, Math.max(m, ah - refSize - m))
  const ox = randInt(m, Math.max(m, aw - objSize - m))
  const oy = randInt(m, Math.max(m, ah - objSize - m))
  ref.style.left = rx + 'px'
  ref.style.top = ry + 'px'
  obj.style.left = ox + 'px'
  obj.style.top = oy + 'px'
  area.appendChild(ref)
  area.appendChild(obj)
  let dx = ox - rx
  let dy = oy - ry
  let dist = Math.hypot(dx, dy)
  const q = choice(['dist','vert','horiz'])
  let correctAnswer = ''
  const threshold = Math.min(aw, ah) * 0.35
  const minDelta = Math.round(Math.min(aw, ah) * 0.12)
  if (q === 'dist') {
    // Evitar distancias ambiguas cerca del umbral
    if (Math.abs(dist - threshold) < minDelta) {
      const factor = dist < threshold ? 0.75 : 1.35
      const nx = rx + (dx || minDelta) * factor
      const ny = ry + (dy || minDelta) * factor
      obj.style.left = Math.max(m, Math.min(aw - objSize - m, nx)) + 'px'
      obj.style.top = Math.max(m, Math.min(ah - objSize - m, ny)) + 'px'
      dx = parseFloat(obj.style.left) - rx
      dy = parseFloat(obj.style.top) - ry
      dist = Math.hypot(dx, dy)
    }
    correctAnswer = dist < threshold ? 'CERCA' : 'LEJOS'
  }
  if (q === 'vert') {
    if (Math.abs(dy) < minDelta) {
      const shift = dy >= 0 ? minDelta : -minDelta
      const ny = Math.max(m, Math.min(ah - objSize - m, oy + shift))
      obj.style.top = ny + 'px'
      dy = ny - ry
    }
    correctAnswer = dy < 0 ? 'ARRIBA' : 'ABAJO'
  }
  if (q === 'horiz') {
    if (Math.abs(dx) < minDelta) {
      const shift = dx >= 0 ? minDelta : -minDelta
      const nx = Math.max(m, Math.min(aw - objSize - m, ox + shift))
      obj.style.left = nx + 'px'
      dx = nx - rx
    }
    correctAnswer = dx < 0 ? 'IZQUIERDA' : 'DERECHA'
  }
  const promptText = {
    dist: `¿La ${objItem.name} está CERCA o LEJOS de la ${refItem.name}?`,
    vert: `¿La ${objItem.name} está ARRIBA o ABAJO de la ${refItem.name}?`,
    horiz: `¿La ${objItem.name} está a la IZQUIERDA o a la DERECHA de la ${refItem.name}?`
  }[q]
  prompt.textContent = promptText
  progress.textContent = `Reto ${state.challenge+1} de ${state.challengesPerLevel}`
  const allowed = q === 'dist' ? ['CERCA','LEJOS'] : (q === 'vert' ? ['ARRIBA','ABAJO'] : ['IZQUIERDA','DERECHA'])
  state.posData = { correctAnswer, allowed }
  document.querySelectorAll('#screen-position .btn').forEach(b => {
    const val = b.getAttribute('data-choice')
    b.classList.toggle('hidden', !allowed.includes(val))
  })
}

document.querySelectorAll('#screen-position .btn').forEach(b => {
  b.addEventListener('click', () => {
    const val = b.getAttribute('data-choice')
    const feedback = document.getElementById('posFeedback')
    if (!state.posData) return
    if (val === state.posData.correctAnswer) {
      state.totalCorrect++
      state.levelCorrect[1]++
      playTone(true)
      feedback.style.color = 'var(--success)'
      feedback.textContent = '¡Muy bien!'
      updateScoreBadge()
      setTimeout(nextChallengeOrLevel, 700)
    } else {
      playTone(false)
      feedback.style.color = 'var(--danger)'
      feedback.textContent = 'Intenta otra vez'
    }
  })
})

function pathLengthFromD(d) {
  const coords = Array.from(d.matchAll(/([0-9]+)\s+([0-9]+)/g)).map(m => [parseFloat(m[1]), parseFloat(m[2])])
  let len = 0
  for (let i=1; i<coords.length; i++) {
    const [x1,y1] = coords[i-1]
    const [x2,y2] = coords[i]
    len += Math.hypot(x2-x1, y2-y1)
  }
  return len
}

function shuffle(a) { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

function setupDistanceLevel(reset) {
  const feedback = document.getElementById('distFeedback')
  const progress = document.getElementById('distProgress')
  const prompt = document.getElementById('distPrompt')
  if (reset) feedback.textContent = ''
  const shapes = [
    { d:'M10 90 L30 10 L60 60 L90 20', stroke:'var(--primary)' },
    { d:'M12 85 L50 35 L88 85', stroke:'var(--accent)' },
    { d:'M20 75 L40 50 L80 75', stroke:'var(--danger)' }
  ]
  const order = shuffle(['left','center','right'])
  const assigned = {}
  const ids = { left:'leftSvgPath', center:'centerSvgPath', right:'rightSvgPath' }
  order.forEach((side, idx) => {
    const s = shapes[idx]
    document.getElementById(ids[side]).setAttribute('d', s.d)
    document.getElementById(ids[side]).setAttribute('stroke', s.stroke)
    assigned[side] = { d: s.d, len: pathLengthFromD(s.d) }
  })
  const askLong = Math.random() < 0.5
  prompt.textContent = askLong ? '¿Cuál camino es MÁS LARGO?' : '¿Cuál camino es MÁS CORTO?'
  state.distData = { askLong, lengths: assigned }
  progress.textContent = `Reto ${state.challenge+1} de ${state.challengesPerLevel}`
}

document.querySelectorAll('.path-btn').forEach(b => {
  b.addEventListener('click', () => {
    const side = b.getAttribute('data-side')
    const feedback = document.getElementById('distFeedback')
    const data = state.distData
    if (!data) return
    const vals = Object.values(data.lengths).map(v => v.len)
    const chosen = data.lengths[side].len
    const target = data.askLong ? Math.max(...vals) : Math.min(...vals)
    const ok = Math.abs(chosen - target) < 0.01
    if (ok) {
      state.totalCorrect++
      state.levelCorrect[2]++
      playTone(true)
      feedback.style.color = 'var(--success)'
      feedback.textContent = '¡Muy bien!'
      updateScoreBadge()
      setTimeout(nextChallengeOrLevel, 700)
    } else {
      playTone(false)
      feedback.style.color = 'var(--danger)'
      feedback.textContent = 'Intenta otra vez'
    }
  })
})

function showResult() {
  showScreen('result')
  const stars = document.getElementById('finalStars')
  const text = document.getElementById('finalText')
  const total = state.totalCorrect
  let rating = 1
  if (total >= 7) rating = 3
  else if (total >= 4) rating = 2
  stars.innerHTML = ''
  for (let i=0; i<rating; i++) {
    const s = document.createElement('div')
    s.textContent = '⭐'
    stars.appendChild(s)
  }
  if (rating === 3) text.textContent = '¡Excelente!'
  else if (rating === 2) text.textContent = '¡Muy bien!'
  else text.textContent = 'Sigue practicando'
}

document.getElementById('btnPlay').addEventListener('click', startGame)
document.getElementById('btnRestart').addEventListener('click', () => {
  showScreen('start')
})
