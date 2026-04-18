/* ============================
   TURINGVERSE — SCRIPT.JS
   Full TM Simulator Logic (Corrected)
   ============================ */

// ==================== HERO CANVAS ====================
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], cells = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initGrid();
  }

  function initGrid() {
    cells = [];
    const cols = Math.floor(W / 60), rows = Math.floor(H / 60);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          x: c * 60 + 30, y: r * 60 + 30,
          alpha: Math.random() * 0.4,
          char: Math.random() < 0.3 ? '01LR□'[Math.floor(Math.random() * 5)] : '',
          speed: 0.003 + Math.random() * 0.005,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.5
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,245,255,0.04)';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    cells.forEach(cell => {
      if (!cell.char) return;
      cell.alpha = 0.1 + Math.sin(t * cell.speed + cell.phase) * 0.15 + 0.15;
      ctx.font = '12px "Share Tech Mono"';
      ctx.fillStyle = `rgba(0,245,255,${cell.alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText(cell.char, cell.x, cell.y + 5);
    });
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,255,${p.alpha})`;
      ctx.fill();
    });
    const scanY = (Math.sin(t * 0.0005) * 0.5 + 0.5) * H;
    const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, 'rgba(0,245,255,0.06)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 30, W, 60);
  }

  function animate(t) {
    draw(t);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  resize();
  initParticles();
  animate(0);
})();

// ==================== NAV ====================
document.getElementById('navToggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelector('.nav-links').classList.remove('open');
  });
});

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Speed slider — higher value = faster (lower delay)
const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
speedSlider.addEventListener('input', () => {
  const ms = parseInt(speedSlider.value);
  speedDisplay.textContent = ms + 'ms';
});
function getDelay() {
  // slider range 100–2000; higher = faster, so delay = max+min - value
  return 2100 - parseInt(speedSlider.value);
}

// ==================== TM DEFINITIONS (CORRECTED) ====================
const TM_EXAMPLES = {

  // -----------------------------------------------
  // PALINDROME: marks first unmatched, scans to find match at end
  // Works for {w | w = w^R} over {a, b}
  // Strategy:
  //   q0: read leftmost symbol, mark with X(a) or Y(b), go right
  //   q1: scan right past everything to reach right end, look for 'a'
  //   q2: found right end while hunting 'a' — check rightmost
  //   q3: matched 'a' at right, mark X, go back left
  //   q4: scan left back to leftmost X/Y, restart
  //   q5: scan right to right end, look for 'b'
  //   q6: found right end while hunting 'b' — check rightmost
  //   q7: matched 'b' at right, mark Y, go back left
  //   q8: check all consumed — accept
  // -----------------------------------------------
  palindrome: {
    name: "Palindrome Checker",
    defaultInput: "abba",
    transitions: [
      // q0: read first symbol
      { s:"q0", r:"a", w:"X", m:"R", n:"q1" },  // mark a→X, hunt for a at right
      { s:"q0", r:"b", w:"Y", m:"R", n:"q5" },  // mark b→Y, hunt for b at right
      { s:"q0", r:"X", w:"X", m:"R", n:"q8" },  // only X/Y left → accept
      { s:"q0", r:"Y", w:"Y", m:"R", n:"q8" },
      { s:"q0", r:"□", w:"□", m:"R", n:"qA" },  // empty string → accept

      // q1: scan rightward to find right end (hunting for 'a')
      { s:"q1", r:"a", w:"a", m:"R", n:"q1" },
      { s:"q1", r:"b", w:"b", m:"R", n:"q1" },
      { s:"q1", r:"X", w:"X", m:"R", n:"q1" },
      { s:"q1", r:"Y", w:"Y", m:"R", n:"q1" },
      { s:"q1", r:"□", w:"□", m:"L", n:"q2" },  // hit right end

      // q2: at rightmost — must be 'a' (match with left X)
      { s:"q2", r:"a", w:"X", m:"L", n:"q4" },  // match! mark and go back
      { s:"q2", r:"X", w:"X", m:"L", n:"q4" },  // already marked (single char case)
      { s:"q2", r:"b", w:"b", m:"L", n:"qR" },  // mismatch → reject
      { s:"q2", r:"Y", w:"Y", m:"L", n:"qR" },  // mismatch → reject

      // q4: scan leftward back to start (past X/Y/a/b) to q0
      { s:"q4", r:"a", w:"a", m:"L", n:"q4" },
      { s:"q4", r:"b", w:"b", m:"L", n:"q4" },
      { s:"q4", r:"X", w:"X", m:"L", n:"q4" },
      { s:"q4", r:"Y", w:"Y", m:"L", n:"q4" },
      { s:"q4", r:"□", w:"□", m:"R", n:"q0" },  // back to leftmost unprocessed

      // q5: scan rightward to find right end (hunting for 'b')
      { s:"q5", r:"a", w:"a", m:"R", n:"q5" },
      { s:"q5", r:"b", w:"b", m:"R", n:"q5" },
      { s:"q5", r:"X", w:"X", m:"R", n:"q5" },
      { s:"q5", r:"Y", w:"Y", m:"R", n:"q5" },
      { s:"q5", r:"□", w:"□", m:"L", n:"q6" },  // hit right end

      // q6: at rightmost — must be 'b' (match with left Y)
      { s:"q6", r:"b", w:"Y", m:"L", n:"q4" },  // match! mark and go back
      { s:"q6", r:"Y", w:"Y", m:"L", n:"q4" },  // already marked (single char case)
      { s:"q6", r:"a", w:"a", m:"L", n:"qR" },  // mismatch → reject
      { s:"q6", r:"X", w:"X", m:"L", n:"qR" },  // mismatch → reject

      // q8: all remaining must be X or Y (fully consumed) → accept
      { s:"q8", r:"X", w:"X", m:"R", n:"q8" },
      { s:"q8", r:"Y", w:"Y", m:"R", n:"q8" },
      { s:"q8", r:"□", w:"□", m:"R", n:"qA" },
      { s:"q8", r:"a", w:"a", m:"R", n:"qR" },  // unconsumed symbol → reject
      { s:"q8", r:"b", w:"b", m:"R", n:"qR" },
    ],
    acceptState: "qA",
    rejectState: "qR",
    startState: "q0"
  },

  // -----------------------------------------------
  // aⁿbⁿ: classic cross-matching
  // q0: find leftmost a, mark X, scan right for b, mark Y, scan back
  // q3: check all X/Y remain → accept
  // -----------------------------------------------
  anbn: {
    name: "aⁿbⁿ Language",
    defaultInput: "aabb",
    transitions: [
      { s:"q0", r:"a", w:"X", m:"R", n:"q1" },
      { s:"q0", r:"Y", w:"Y", m:"R", n:"q3" },
      { s:"q0", r:"□", w:"□", m:"R", n:"qR" }, // empty → reject (ε not in aⁿbⁿ for n≥1)
      { s:"q0", r:"X", w:"X", m:"R", n:"qR" }, // shouldn't happen
      { s:"q0", r:"b", w:"b", m:"R", n:"qR" }, // b before a → reject

      { s:"q1", r:"a", w:"a", m:"R", n:"q1" },
      { s:"q1", r:"Y", w:"Y", m:"R", n:"q1" },
      { s:"q1", r:"b", w:"Y", m:"L", n:"q2" },
      { s:"q1", r:"□", w:"□", m:"L", n:"qR" }, // no b found → reject
      { s:"q1", r:"X", w:"X", m:"R", n:"qR" },

      { s:"q2", r:"a", w:"a", m:"L", n:"q2" },
      { s:"q2", r:"Y", w:"Y", m:"L", n:"q2" },
      { s:"q2", r:"X", w:"X", m:"R", n:"q0" },

      // q3: verify remaining are all Y (no leftover b or a)
      { s:"q3", r:"Y", w:"Y", m:"R", n:"q3" },
      { s:"q3", r:"□", w:"□", m:"R", n:"qA" },
      { s:"q3", r:"b", w:"b", m:"R", n:"qR" }, // extra b → reject
      { s:"q3", r:"a", w:"a", m:"R", n:"qR" }, // extra a → reject
    ],
    acceptState: "qA",
    rejectState: "qR",
    startState: "q0"
  },

  // -----------------------------------------------
  // ww^R: same as palindrome (they're the same language for even-length)
  // Reusing palindrome logic
  // -----------------------------------------------
  wwr: {
    name: "ww^R Palindrome",
    defaultInput: "abba",
    transitions: [
      { s:"q0", r:"a", w:"X", m:"R", n:"q1" },
      { s:"q0", r:"b", w:"Y", m:"R", n:"q5" },
      { s:"q0", r:"X", w:"X", m:"R", n:"q8" },
      { s:"q0", r:"Y", w:"Y", m:"R", n:"q8" },
      { s:"q0", r:"□", w:"□", m:"R", n:"qA" },

      { s:"q1", r:"a", w:"a", m:"R", n:"q1" },
      { s:"q1", r:"b", w:"b", m:"R", n:"q1" },
      { s:"q1", r:"X", w:"X", m:"R", n:"q1" },
      { s:"q1", r:"Y", w:"Y", m:"R", n:"q1" },
      { s:"q1", r:"□", w:"□", m:"L", n:"q2" },

      { s:"q2", r:"a", w:"X", m:"L", n:"q4" },
      { s:"q2", r:"X", w:"X", m:"L", n:"q4" },
      { s:"q2", r:"b", w:"b", m:"L", n:"qR" },
      { s:"q2", r:"Y", w:"Y", m:"L", n:"qR" },

      { s:"q4", r:"a", w:"a", m:"L", n:"q4" },
      { s:"q4", r:"b", w:"b", m:"L", n:"q4" },
      { s:"q4", r:"X", w:"X", m:"L", n:"q4" },
      { s:"q4", r:"Y", w:"Y", m:"L", n:"q4" },
      { s:"q4", r:"□", w:"□", m:"R", n:"q0" },

      { s:"q5", r:"a", w:"a", m:"R", n:"q5" },
      { s:"q5", r:"b", w:"b", m:"R", n:"q5" },
      { s:"q5", r:"X", w:"X", m:"R", n:"q5" },
      { s:"q5", r:"Y", w:"Y", m:"R", n:"q5" },
      { s:"q5", r:"□", w:"□", m:"L", n:"q6" },

      { s:"q6", r:"b", w:"Y", m:"L", n:"q4" },
      { s:"q6", r:"Y", w:"Y", m:"L", n:"q4" },
      { s:"q6", r:"a", w:"a", m:"L", n:"qR" },
      { s:"q6", r:"X", w:"X", m:"L", n:"qR" },

      { s:"q8", r:"X", w:"X", m:"R", n:"q8" },
      { s:"q8", r:"Y", w:"Y", m:"R", n:"q8" },
      { s:"q8", r:"□", w:"□", m:"R", n:"qA" },
      { s:"q8", r:"a", w:"a", m:"R", n:"qR" },
      { s:"q8", r:"b", w:"b", m:"R", n:"qR" },
    ],
    acceptState: "qA",
    rejectState: "qR",
    startState: "q0"
  },

  // -----------------------------------------------
  // BINARY INCREMENT: move right to end, then carry from right
  // -----------------------------------------------
  increment: {
    name: "Binary Increment",
    defaultInput: "1011",
    transitions: [
      { s:"q0", r:"0", w:"0", m:"R", n:"q0" },
      { s:"q0", r:"1", w:"1", m:"R", n:"q0" },
      { s:"q0", r:"□", w:"□", m:"L", n:"q1" },
      // q1: carry propagation from right
      { s:"q1", r:"1", w:"0", m:"L", n:"q1" }, // 1 + carry = 0, carry
      { s:"q1", r:"0", w:"1", m:"R", n:"qA" }, // 0 + carry = 1, done
      { s:"q1", r:"□", w:"1", m:"R", n:"qA" }, // overflow: prepend 1
    ],
    acceptState: "qA",
    rejectState: "qR",
    startState: "q0"
  },

  // -----------------------------------------------
  // aⁿbⁿcⁿ: mark one a, one b, one c per pass
  // -----------------------------------------------
  anbncn: {
    name: "aⁿbⁿcⁿ Language",
    defaultInput: "aabbcc",
    transitions: [
      { s:"q0", r:"X", w:"X", m:"R", n:"q4" }, // all a's consumed
      { s:"q0", r:"a", w:"X", m:"R", n:"q1" }, // mark one a
      { s:"q0", r:"b", w:"b", m:"R", n:"qR" }, // b before a → reject
      { s:"q0", r:"c", w:"c", m:"R", n:"qR" }, // c before a → reject
      { s:"q0", r:"□", w:"□", m:"R", n:"qR" }, // nothing → reject (n≥1)

      // q1: scan right over a's and Y's to find first unmarked b
      { s:"q1", r:"a", w:"a", m:"R", n:"q1" },
      { s:"q1", r:"Y", w:"Y", m:"R", n:"q1" },
      { s:"q1", r:"b", w:"Y", m:"R", n:"q2" }, // mark one b
      { s:"q1", r:"X", w:"X", m:"R", n:"q1" },
      { s:"q1", r:"c", w:"c", m:"R", n:"qR" }, // no b found → reject
      { s:"q1", r:"□", w:"□", m:"R", n:"qR" },

      // q2: scan right over b's and Z's to find first unmarked c
      { s:"q2", r:"b", w:"b", m:"R", n:"q2" },
      { s:"q2", r:"Z", w:"Z", m:"R", n:"q2" },
      { s:"q2", r:"c", w:"Z", m:"L", n:"q3" }, // mark one c
      { s:"q2", r:"□", w:"□", m:"R", n:"qR" }, // no c found → reject
      { s:"q2", r:"a", w:"a", m:"R", n:"qR" },

      // q3: scan back left to q0
      { s:"q3", r:"b", w:"b", m:"L", n:"q3" },
      { s:"q3", r:"Y", w:"Y", m:"L", n:"q3" },
      { s:"q3", r:"a", w:"a", m:"L", n:"q3" },
      { s:"q3", r:"Z", w:"Z", m:"L", n:"q3" },
      { s:"q3", r:"X", w:"X", m:"L", n:"q3" },
      { s:"q3", r:"□", w:"□", m:"R", n:"q0" }, // back to start

      // q4: all a's marked — verify b's and c's are all marked
      { s:"q4", r:"Y", w:"Y", m:"R", n:"q4" },
      { s:"q4", r:"Z", w:"Z", m:"R", n:"q4" },
      { s:"q4", r:"□", w:"□", m:"R", n:"qA" }, // all consumed → accept
      { s:"q4", r:"b", w:"b", m:"R", n:"qR" }, // leftover b → reject
      { s:"q4", r:"c", w:"c", m:"R", n:"qR" }, // leftover c → reject
      { s:"q4", r:"a", w:"a", m:"R", n:"qR" }, // leftover a → reject
    ],
    acceptState: "qA",
    rejectState: "qR",
    startState: "q0"
  },

  // -----------------------------------------------
  // STRING COPIER: copies w to get ww on tape
  // Input: w (e.g. "ab") → Output: ab□ab
  // Strategy: use markers A/B to track copied chars
  // -----------------------------------------------
  copy: {
    name: "String Copier",
    defaultInput: "ab",
    transitions: [
      // Phase 1: mark each input char, append copy at end
      { s:"q0", r:"a", w:"A", m:"R", n:"q1" }, // mark 'a' as processed
      { s:"q0", r:"b", w:"B", m:"R", n:"q5" }, // mark 'b' as processed
      { s:"q0", r:"A", w:"A", m:"R", n:"q0" }, // skip already-marked
      { s:"q0", r:"B", w:"B", m:"R", n:"q0" },
      { s:"q0", r:"□", w:"□", m:"R", n:"qA" }, // all done → accept

      // q1: find right end to write 'a'
      { s:"q1", r:"a", w:"a", m:"R", n:"q1" },
      { s:"q1", r:"b", w:"b", m:"R", n:"q1" },
      { s:"q1", r:"A", w:"A", m:"R", n:"q1" },
      { s:"q1", r:"B", w:"B", m:"R", n:"q1" },
      { s:"q1", r:"□", w:"a", m:"L", n:"q2" }, // write 'a' at end

      // q2: go back to start
      { s:"q2", r:"a", w:"a", m:"L", n:"q2" },
      { s:"q2", r:"b", w:"b", m:"L", n:"q2" },
      { s:"q2", r:"A", w:"A", m:"L", n:"q2" },
      { s:"q2", r:"B", w:"B", m:"L", n:"q2" },
      { s:"q2", r:"□", w:"□", m:"R", n:"q0" },

      // q5: find right end to write 'b'
      { s:"q5", r:"a", w:"a", m:"R", n:"q5" },
      { s:"q5", r:"b", w:"b", m:"R", n:"q5" },
      { s:"q5", r:"A", w:"A", m:"R", n:"q5" },
      { s:"q5", r:"B", w:"B", m:"R", n:"q5" },
      { s:"q5", r:"□", w:"b", m:"L", n:"q2" }, // write 'b' at end
    ],
    acceptState: "qA",
    rejectState: "qR",
    startState: "q0"
  }
};

// ==================== STATE DIAGRAM RENDERER ====================
class StateDiagramRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.tm = null;
    this.currentState = null;
    this.visitedStates = new Set();
    this.activeTransition = null;
    this.statePositions = {};
    this.animFrame = null;
  }

  loadTM(tm) {
    this.tm = tm;
    this.currentState = tm.startState;
    this.visitedStates = new Set([tm.startState]);
    this.activeTransition = null;
    this.computeLayout();
    this.draw();
  }

  reset(startState) {
    this.currentState = startState;
    this.visitedStates = new Set([startState]);
    this.activeTransition = null;
    this.draw();
  }

  setCurrentState(state, prevState, symbol, write, move) {
    this.activeTransition = prevState ? { from: prevState, to: state, symbol, write, move } : null;
    this.currentState = state;
    this.visitedStates.add(state);
    this.draw();
  }

  getStates() {
    if (!this.tm) return [];
    const states = new Set();
    this.tm.transitions.forEach(t => { states.add(t.s); states.add(t.n); });
    states.add(this.tm.acceptState);
    states.add(this.tm.rejectState);
    return [...states];
  }

  computeLayout() {
    if (!this.canvas || !this.tm) return;
    const states = this.getStates();
    const W = this.canvas.width = this.canvas.offsetWidth || 700;
    const H = this.canvas.height = Math.max(320, this.canvas.offsetHeight || 320);
    this.statePositions = {};

    // Special placement for accept/reject
    const special = [this.tm.acceptState, this.tm.rejectState];
    const regular = states.filter(s => !special.includes(s));

    // Arrange regular states in a circle
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.33;
    regular.forEach((s, i) => {
      const angle = (2 * Math.PI * i / regular.length) - Math.PI / 2;
      this.statePositions[s] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    });

    // Accept at right, reject at bottom-right
    this.statePositions[this.tm.acceptState] = { x: W - 55, y: 55 };
    this.statePositions[this.tm.rejectState] = { x: W - 55, y: H - 55 };
  }

  draw() {
    if (!this.ctx || !this.tm) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#050912';
    ctx.fillRect(0, 0, W, H);

    // Draw transitions (edges)
    const edgeGroups = {};
    this.tm.transitions.forEach(t => {
      const key = `${t.s}__${t.n}`;
      if (!edgeGroups[key]) edgeGroups[key] = [];
      edgeGroups[key].push(t);
    });

    Object.entries(edgeGroups).forEach(([key, transitions]) => {
      const [from, to] = key.split('__');
      const fp = this.statePositions[from];
      const tp = this.statePositions[to];
      if (!fp || !tp) return;

      const isActive = this.activeTransition &&
        this.activeTransition.from === from &&
        this.activeTransition.to === to;

      const isSelf = from === to;
      const label = transitions.map(t => `${t.r}/${t.w},${t.m}`).join('\n');

      this.drawEdge(ctx, fp, tp, label, isActive, isSelf, from, to);
    });

    // Draw states (nodes)
    this.getStates().forEach(state => {
      const pos = this.statePositions[state];
      if (!pos) return;
      this.drawState(ctx, state, pos);
    });
  }

  drawEdge(ctx, fp, tp, label, isActive, isSelf, fromState, toState) {
    const R = 26;
    ctx.save();

    if (isSelf) {
      // Self-loop arc above the node
      const lx = fp.x, ly = fp.y - R;
      ctx.beginPath();
      ctx.arc(lx, ly - 20, 20, 0.3 * Math.PI, 2.7 * Math.PI);
      ctx.strokeStyle = isActive ? '#00f5ff' : 'rgba(0,245,255,0.3)';
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.stroke();

      // Arrow
      this.drawArrowHead(ctx, lx - 12, ly - 10, lx - 5, ly, isActive ? '#00f5ff' : 'rgba(0,245,255,0.3)');

      // Label
      ctx.fillStyle = isActive ? '#00f5ff' : 'rgba(0,245,255,0.6)';
      ctx.font = isActive ? 'bold 10px Share Tech Mono' : '10px Share Tech Mono';
      ctx.textAlign = 'center';
      const lines = label.split('\n');
      lines.forEach((l, i) => ctx.fillText(l, lx, ly - 50 + i * 12));
      ctx.restore();
      return;
    }

    // Compute edge endpoints on circle boundary
    const dx = tp.x - fp.x, dy = tp.y - fp.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist, uy = dy / dist;

    // Check if reverse edge exists
    const reverseKey = `${toState}__${fromState}`;
    const hasReverse = !!Object.keys(this.statePositions).length;

    let sx = fp.x + ux * R, sy = fp.y + uy * R;
    let ex = tp.x - ux * R, ey = tp.y - uy * R;

    // Curve the edge slightly if bidirectional
    const curved = this.isBidirectional(fromState, toState);
    const curveOffset = curved ? 22 : 0;
    const mx = (sx + ex) / 2 - uy * curveOffset;
    const my = (sy + ey) / 2 + ux * curveOffset;

    ctx.beginPath();
    if (curved) {
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, ex, ey);
    } else {
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    }
    ctx.strokeStyle = isActive ? '#00f5ff' : 'rgba(0,245,255,0.25)';
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    if (isActive) ctx.shadowBlur = 8, ctx.shadowColor = '#00f5ff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrowhead at endpoint
    const ax = curved ? (mx + ex) / 2 : sx;
    const ay = curved ? (my + ey) / 2 : sy;
    this.drawArrowHead(ctx, ax, ay, ex, ey, isActive ? '#00f5ff' : 'rgba(0,245,255,0.4)');

    // Label at midpoint
    const lx = curved ? mx : (sx + ex) / 2;
    const ly = curved ? my : (sy + ey) / 2;
    ctx.fillStyle = isActive ? '#ffffff' : 'rgba(0,245,255,0.65)';
    ctx.font = isActive ? 'bold 10px Share Tech Mono' : '10px Share Tech Mono';
    ctx.textAlign = 'center';
    const lines = label.split('\n');
    const lineH = 12;
    const startY = ly - ((lines.length - 1) * lineH) / 2;
    lines.slice(0, 4).forEach((l, i) => {
      ctx.fillText(l, lx, startY + i * lineH);
    });
    if (lines.length > 4) ctx.fillText(`+${lines.length - 4} more`, lx, startY + 4 * lineH);

    ctx.restore();
  }

  isBidirectional(a, b) {
    if (!this.tm) return false;
    const ab = this.tm.transitions.some(t => t.s === a && t.n === b);
    const ba = this.tm.transitions.some(t => t.s === b && t.n === a);
    return ab && ba;
  }

  drawArrowHead(ctx, fromX, fromY, toX, toY, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 8;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - size * Math.cos(angle - 0.4), toY - size * Math.sin(angle - 0.4));
    ctx.lineTo(toX - size * Math.cos(angle + 0.4), toY - size * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawState(ctx, state, pos) {
    const R = 26;
    const isCurrent = state === this.currentState;
    const isAccept = state === (this.tm && this.tm.acceptState);
    const isReject = state === (this.tm && this.tm.rejectState);
    const isStart = state === (this.tm && this.tm.startState);
    const wasVisited = this.visitedStates.has(state);

    ctx.save();

    // Glow for current state
    if (isCurrent) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = isAccept ? '#00ff88' : isReject ? '#ff4466' : '#00f5ff';
    }

    // Outer circle (double ring for accept)
    if (isAccept) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, R + 5, 0, Math.PI * 2);
      ctx.strokeStyle = isCurrent ? '#00ff88' : 'rgba(0,255,136,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);

    if (isCurrent) {
      if (isAccept) ctx.fillStyle = 'rgba(0,255,136,0.25)';
      else if (isReject) ctx.fillStyle = 'rgba(255,68,102,0.25)';
      else ctx.fillStyle = 'rgba(0,245,255,0.2)';
    } else if (wasVisited) {
      ctx.fillStyle = 'rgba(0,245,255,0.06)';
    } else {
      ctx.fillStyle = '#0d1628';
    }
    ctx.fill();

    ctx.strokeStyle = isCurrent
      ? (isAccept ? '#00ff88' : isReject ? '#ff4466' : '#00f5ff')
      : (wasVisited ? 'rgba(0,245,255,0.4)' : 'rgba(0,245,255,0.2)');
    ctx.lineWidth = isCurrent ? 2.5 : 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // State label
    ctx.fillStyle = isCurrent
      ? '#fff'
      : (wasVisited ? 'rgba(0,245,255,0.9)' : 'rgba(0,245,255,0.5)');
    ctx.font = `bold ${state.length > 4 ? 9 : 11}px Share Tech Mono`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatStateName(state), pos.x, pos.y);

    // Start arrow
    if (isStart) {
      ctx.fillStyle = 'rgba(0,245,255,0.7)';
      ctx.font = '10px Share Tech Mono';
      ctx.fillText('→', pos.x - R - 14, pos.y);
    }

    ctx.restore();
  }

  resize() {
    if (!this.canvas) return;
    this.computeLayout();
    this.draw();
  }
}

function formatStateName(s) {
  const map = {
    q0:'q₀', q1:'q₁', q2:'q₂', q3:'q₃', q4:'q₄', q5:'q₅',
    q6:'q₆', q7:'q₇', q8:'q₈', q9:'q₉', q10:'q₁₀',
    qA:'qₐ', qR:'q_r'
  };
  return map[s] || s;
}

// ==================== BASIC TM SIMULATOR ====================
class TMSimulator {
  constructor(options = {}) {
    this.tapeTrackId = options.tapeTrack || 'tapeTrack';
    this.headIndicatorId = options.headIndicator || 'headIndicator';
    this.currentStateElId = options.currentState || 'currentState';
    this.headPosElId = options.headPos || 'headPos';
    this.stepCountElId = options.stepCount || 'stepCount';
    this.resultBoxId = options.resultBox || 'resultBox';
    this.resultValueId = options.resultValue || 'resultValue';
    this.logEntriesId = options.logEntries || 'logEntries';
    this.transitionBodyId = options.transitionBody || 'transitionBody';
    this.tmInputId = options.tmInput || 'tmInput';

    this.tape = [];
    this.head = 0;
    this.state = '';
    this.steps = 0;
    this.running = false;
    this.timer = null;
    this.tm = null;
    this.finished = false;
    this.cellWidth = 58;

    // State diagram
    this.diagram = options.diagramCanvasId ? new StateDiagramRenderer(options.diagramCanvasId) : null;
    this.prevState = null;
  }

  get tapeTrack() { return document.getElementById(this.tapeTrackId); }
  get headIndicator() { return document.getElementById(this.headIndicatorId); }
  get currentStateEl() { return document.getElementById(this.currentStateElId); }
  get headPosEl() { return document.getElementById(this.headPosElId); }
  get stepCountEl() { return document.getElementById(this.stepCountElId); }
  get resultBox() { return document.getElementById(this.resultBoxId); }
  get resultValue() { return document.getElementById(this.resultValueId); }
  get logEntries() { return document.getElementById(this.logEntriesId); }
  get transitionBody() { return document.getElementById(this.transitionBodyId); }
  get tmInput() { return document.getElementById(this.tmInputId); }

  loadTM(tmDef) {
    this.tm = tmDef;
    this.renderTransitionTable();
    if (this.diagram) {
      this.diagram.loadTM(tmDef);
    }
  }

  reset() {
    this.running = false;
    clearInterval(this.timer);
    this.finished = false;
    const input = this.tmInput ? this.tmInput.value.trim() : '';
    this.tape = ['□', ...input.split(''), '□', '□', '□'];
    this.head = 1;
    this.state = this.tm ? this.tm.startState : 'q0';
    this.prevState = null;
    this.steps = 0;
    this.renderTape();
    this.updateInfo();
    this.clearResult();
    const le = this.logEntries;
    if (le) le.innerHTML = '';
    this.addLog(`Initialized: input="${input}", state=${this.formatState(this.state)}`, 'current');
    if (this.diagram) this.diagram.reset(this.state);
  }

  renderTape() {
    const track = this.tapeTrack;
    if (!track) return;
    track.innerHTML = '';
    this.tape.forEach((sym, i) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell' + (i === this.head ? ' active' : '');
      cell.textContent = sym === '□' ? '□' : sym;
      const idx = document.createElement('span');
      idx.className = 'cell-index';
      idx.textContent = i - 1;
      cell.appendChild(idx);
      track.appendChild(cell);
    });
    this.updateHeadIndicator();
  }

  updateHeadIndicator() {
    const indicator = this.headIndicator;
    if (!indicator) return;
    const track = this.tapeTrack;
    if (!track) return;
    const container = track.parentElement;
    if (!container) return;

    // Scroll tape container so active cell is centered
    const cellW = this.cellWidth + 2;
    const leftPad = 32;
    const cellCenter = leftPad + this.head * cellW + cellW / 2;
    const visW = container.clientWidth;
    const targetScroll = cellCenter - visW / 2;

    container.style.overflowX = 'auto';
    container.scrollLeft = Math.max(0, targetScroll);

    // Position indicator relative to container
    const pos = cellCenter - container.scrollLeft - cellW / 2;
    indicator.style.left = (pos + 8) + 'px';
  }

  updateInfo() {
    if (this.currentStateEl) this.currentStateEl.textContent = this.formatState(this.state);
    if (this.headPosEl) this.headPosEl.textContent = this.head - 1;
    if (this.stepCountEl) this.stepCountEl.textContent = this.steps;
  }

  formatState(s) {
    return formatStateName(s);
  }

  clearResult() {
    const rb = this.resultBox;
    if (rb) rb.classList.remove('accept', 'reject');
    const rv = this.resultValue;
    if (rv) rv.textContent = '—';
  }

  setResult(accepted) {
    const rb = this.resultBox;
    if (rb) rb.classList.add(accepted ? 'accept' : 'reject');
    const rv = this.resultValue;
    if (rv) rv.textContent = accepted ? 'ACCEPT ✓' : 'REJECT ✗';
    this.addLog(accepted ? '✓ ACCEPTED' : '✗ REJECTED', accepted ? 'accept' : 'reject');
  }

  addLog(msg, cls = '') {
    const le = this.logEntries;
    if (!le) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (cls ? ' ' + cls : '');
    entry.textContent = msg;
    le.appendChild(entry);
    le.scrollTop = le.scrollHeight;
  }

  findTransition(state, symbol) {
    if (!this.tm) return null;
    return this.tm.transitions.find(t => t.s === state && t.r === symbol) || null;
  }

  highlightTransition(state, symbol) {
    const tb = this.transitionBody;
    if (!tb) return;
    tb.querySelectorAll('tr').forEach(r => r.classList.remove('highlight'));
    tb.querySelectorAll('tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2 &&
          cells[0].textContent === this.formatState(state) &&
          cells[1].textContent === symbol) {
        row.classList.add('highlight');
        row.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  step() {
    if (this.finished) return false;
    if (!this.tm) return false;

    // Expand tape right if needed
    while (this.head >= this.tape.length - 1) this.tape.push('□');
    if (this.head < 0) { this.tape.unshift('□'); this.head = 0; }

    const sym = this.tape[this.head] || '□';
    const trans = this.findTransition(this.state, sym);

    this.highlightTransition(this.state, sym);

    if (!trans) {
      this.addLog(`Step ${this.steps + 1}: state=${this.formatState(this.state)}, read="${sym}" → NO TRANSITION`);
      this.finished = true;
      const accepted = this.state === this.tm.acceptState;
      this.setResult(accepted);
      this.renderTape();
      this.steps++;
      this.updateInfo();
      if (this.diagram) this.diagram.setCurrentState(this.state, this.prevState, sym, sym, '');
      return false;
    }

    this.addLog(`Step ${this.steps + 1}: δ(${this.formatState(this.state)}, ${sym}) = (${this.formatState(trans.n)}, ${trans.w}, ${trans.m})`);

    const oldHead = this.head;
    this.tape[this.head] = trans.w;
    const fromState = this.state;
    this.state = trans.n;
    this.head += trans.m === 'R' ? 1 : -1;
    if (this.head < 0) { this.tape.unshift('□'); this.head = 0; }

    this.steps++;
    this.renderTape();

    const cells = this.tapeTrack ? this.tapeTrack.querySelectorAll('.tape-cell') : [];
    if (cells[oldHead]) cells[oldHead].classList.add('written');

    this.updateInfo();

    // Update state diagram
    if (this.diagram) this.diagram.setCurrentState(trans.n, fromState, sym, trans.w, trans.m);
    this.prevState = fromState;

    if (this.state === this.tm.acceptState || this.state === this.tm.rejectState) {
      this.finished = true;
      this.setResult(this.state === this.tm.acceptState);
      return false;
    }
    return true;
  }

  run(delay) {
    this.running = true;
    const pauseBtn = document.getElementById('pauseBtn');
    const runBtn = document.getElementById('runBtn');
    if (pauseBtn) pauseBtn.disabled = false;
    if (runBtn) runBtn.disabled = true;
    this.timer = setInterval(() => {
      const cont = this.step();
      if (!cont) this.stop();
    }, delay);
  }

  stop() {
    this.running = false;
    clearInterval(this.timer);
    const pauseBtn = document.getElementById('pauseBtn');
    const runBtn = document.getElementById('runBtn');
    if (pauseBtn) pauseBtn.disabled = true;
    if (runBtn) runBtn.disabled = false;
  }

  renderTransitionTable() {
    const tb = this.transitionBody;
    if (!tb || !this.tm) return;
    tb.innerHTML = '';
    this.tm.transitions.forEach(t => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${this.formatState(t.s)}</td><td>${t.r}</td><td>${t.w}</td><td>${t.m}</td><td>${this.formatState(t.n)}</td>`;
      tb.appendChild(row);
    });
  }
}

// ==================== INITIALIZE BASIC TM ====================
const basicTM = new TMSimulator({
  tapeTrack: 'tapeTrack',
  headIndicator: 'headIndicator',
  currentState: 'currentState',
  headPos: 'headPos',
  stepCount: 'stepCount',
  resultBox: 'resultBox',
  resultValue: 'resultValue',
  logEntries: 'logEntries',
  transitionBody: 'transitionBody',
  tmInput: 'tmInput',
  diagramCanvasId: 'stateDiagramCanvas'
});

let currentExample = 'palindrome';

function loadExample(key) {
  currentExample = key;
  const tm = TM_EXAMPLES[key];
  if (!tm) return;
  basicTM.loadTM(tm);
  if (basicTM.tmInput) basicTM.tmInput.value = tm.defaultInput;
  basicTM.reset();
}

document.getElementById('loadExample').addEventListener('click', () => {
  loadExample(document.getElementById('exampleSelect').value);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  basicTM.stop();
  basicTM.reset();
});

document.getElementById('stepBtn').addEventListener('click', () => {
  if (!basicTM.tm) { loadExample(currentExample); return; }
  if (basicTM.finished) basicTM.reset();
  basicTM.step();
});

document.getElementById('runBtn').addEventListener('click', () => {
  if (!basicTM.tm) { loadExample(currentExample); return; }
  if (basicTM.finished) basicTM.reset();
  basicTM.run(getDelay());
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  basicTM.stop();
});

// Redraw diagram on resize
window.addEventListener('resize', () => {
  if (basicTM.diagram) basicTM.diagram.resize();
});

// Load default
loadExample('palindrome');

// ==================== VARIANT TABS ====================
document.querySelectorAll('.vtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.vtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.variant-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('tab-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

// ==================== MULTI-TAPE SIMULATOR ====================
(function initMultiTape() {
  const tapes = [
    { label: 'Tape 1', cells: ['a','a','b','b','□','□','□'], head: 0 },
    { label: 'Tape 2', cells: ['□','□','□','□','□','□','□'], head: 0 }
  ];
  let step = 0;
  const steps_def = [
    { desc: "Init: Read 'a' on T1 at position 0.", t1h:0, t2h:0, t2w:null },
    { desc: "Copy 'a' to T2[0]. Advance both heads.", t1h:1, t2h:1, t2w_pos:0, t2w_val:'a' },
    { desc: "Copy 'a' to T2[1]. Advance both heads.", t1h:2, t2h:2, t2w_pos:1, t2w_val:'a' },
    { desc: "T1 reads 'b'. Now move T2 left to match.", t1h:2, t2h:1, t2w_pos:null },
    { desc: "Match: T1='b', T2 position rewound. Check match.", t1h:3, t2h:0, t2w_pos:null },
    { desc: "Both tapes consumed in sync. ACCEPT aⁿbⁿ.", t1h:4, t2h:0, t2w_pos:null }
  ];

  function render() {
    const container = document.getElementById('mt-tapes');
    if (!container) return;
    container.innerHTML = '';
    tapes.forEach(tape => {
      const row = document.createElement('div');
      row.className = 'mt-tape-row';
      const lbl = document.createElement('div');
      lbl.className = 'mt-tape-label-small';
      lbl.textContent = tape.label;
      row.appendChild(lbl);
      const cells = document.createElement('div');
      cells.className = 'mt-tape-cells';
      tape.cells.forEach((c, ci) => {
        const cell = document.createElement('div');
        cell.className = 'mt-cell' + (ci === tape.head ? ' active' : '');
        cell.textContent = c;
        cells.appendChild(cell);
      });
      row.appendChild(cells);
      container.appendChild(row);
    });
  }

  document.getElementById('mt-run').addEventListener('click', () => {
    if (step >= steps_def.length) return;
    const s = steps_def[step];
    tapes[0].head = s.t1h;
    tapes[1].head = s.t2h;
    if (s.t2w_pos !== null && s.t2w_pos !== undefined) {
      tapes[1].cells[s.t2w_pos] = s.t2w_val;
    }
    document.getElementById('mt-desc').textContent = s.desc;
    render();
    step++;
  });

  document.getElementById('mt-reset').addEventListener('click', () => {
    step = 0;
    tapes[0].cells = ['a','a','b','b','□','□','□']; tapes[0].head = 0;
    tapes[1].cells = ['□','□','□','□','□','□','□']; tapes[1].head = 0;
    document.getElementById('mt-desc').textContent = 'Demonstrating aⁿbⁿ recognition using 2 tapes';
    render();
  });

  render();
})();

// ==================== NTM TREE ====================
(function initNTM() {
  const treeContainer = document.getElementById('treeContainer');
  if (!treeContainer) return;

  const treeData = {
    levels: [
      [{ label: 'q₀\naa', state: 'init' }],
      [{ label: 'q₁\na', state: 'init' }, { label: 'q₂\na', state: 'init' }],
      [{ label: 'q₁\n□', state: 'init' }, { label: 'qR\n□', state: 'reject' },
       { label: 'qA\n□', state: 'accept' }, { label: 'q₂\n□', state: 'init' }],
    ]
  };

  let revealStep = 0;

  function render(step) {
    treeContainer.innerHTML = '';
    treeData.levels.forEach((level, li) => {
      if (li > step) return;
      const row = document.createElement('div');
      row.className = 'tree-level';
      level.forEach(node => {
        const el = document.createElement('div');
        el.className = 'tree-node ' +
          (node.state === 'accept' ? 'accept-node' : node.state === 'reject' ? 'reject-node' : 'active');
        el.innerHTML = node.label.replace('\n', '<br>');
        row.appendChild(el);
      });
      treeContainer.appendChild(row);
    });
  }

  const descs = [
    'Exploring initial state q₀ on input "aa"',
    'Branching: 2 non-deterministic choices at step 1',
    'One branch reaches qA (ACCEPT)! NTM accepts.'
  ];

  document.getElementById('ntm-run').addEventListener('click', () => {
    revealStep = Math.min(revealStep + 1, treeData.levels.length - 1);
    render(revealStep);
    document.getElementById('ntm-desc').textContent = descs[revealStep];
  });

  document.getElementById('ntm-reset').addEventListener('click', () => {
    revealStep = 0;
    render(0);
    document.getElementById('ntm-desc').textContent = 'NTM exploring all computation paths';
  });

  render(0);
})();

// ==================== MULTI-TRACK ====================
(function initMultiTrack() {
  const input = ['a','a','b','b'];
  let stepIdx = 0;

  const steps = [
    { head:0, t2:['□','□','□','□'], desc:'Start at position 0. Track 1 has input, Track 2 empty.' },
    { head:0, t2:['✓','□','□','□'], desc:'Mark position 0 on Track 2: symbol "a" seen.' },
    { head:1, t2:['✓','✓','□','□'], desc:'Move right. Mark position 1 on Track 2.' },
    { head:2, t2:['✓','✓','✗','□'], desc:'Reached "b". Mark Track 2 differently (b-region).' },
    { head:3, t2:['✓','✓','✗','✗'], desc:'Mark position 3. Two ✓ and two ✗ — counts match!' },
    { head:3, t2:['✓','✓','✗','✗'], desc:'Verification complete: n=2 a\'s, n=2 b\'s → ACCEPT' }
  ];

  function render() {
    const container = document.getElementById('mtrack-display');
    if (!container) return;
    const s = steps[Math.min(stepIdx, steps.length - 1)];
    container.innerHTML = `
      <div class="mtrack-tape-display">
        <div class="mtrack-row">
          <div class="mtrack-label">Track 1</div>
          <div class="mtrack-cells">
            ${input.map((c,i) => `<div class="mtrack-cell${i===s.head?' head-here':''}">${c}</div>`).join('')}
          </div>
        </div>
        <div class="mtrack-row">
          <div class="mtrack-label">Track 2</div>
          <div class="mtrack-cells">
            ${s.t2.map((c,i) => `<div class="mtrack-cell track2${i===s.head?' head-here':''}">${c}</div>`).join('')}
          </div>
        </div>
      </div>`;
    document.getElementById('mtrack-desc').textContent = s.desc;
  }

  document.getElementById('mtrack-run').addEventListener('click', () => {
    stepIdx = Math.min(stepIdx + 1, steps.length - 1);
    render();
  });
  document.getElementById('mtrack-reset').addEventListener('click', () => {
    stepIdx = 0;
    render();
  });
  render();
})();

// ==================== TWO-WAY TAPE ====================
(function initTwoWay() {
  let pos = 0;
  const tape = {};
  const INPUT = ['a','b','b','a'];
  INPUT.forEach((c,i) => tape[i] = c);

  function render() {
    const container = document.getElementById('twoway-tape-visual');
    if (!container) return;
    const range = 5;
    container.innerHTML = '';
    for (let i = pos - range; i <= pos + range; i++) {
      const cell = document.createElement('div');
      cell.className = 'tape-cell' + (i === pos ? ' active' : '');
      cell.style.cssText = 'width:44px;height:44px;font-size:1rem;flex-shrink:0;';
      cell.textContent = tape[i] !== undefined ? tape[i] : '□';
      const idx = document.createElement('span');
      idx.className = 'cell-index';
      idx.textContent = i;
      cell.appendChild(idx);
      container.appendChild(cell);
    }
    document.getElementById('twoway-desc').textContent =
      `Head position: ${pos} | Symbol: "${tape[pos] !== undefined ? tape[pos] : '□'}" | Infinite in both directions`;
  }

  document.getElementById('twoway-left').addEventListener('click', () => { pos--; render(); });
  document.getElementById('twoway-right').addEventListener('click', () => { pos++; render(); });
  document.getElementById('twoway-reset').addEventListener('click', () => { pos = 0; render(); });
  render();
})();

// ==================== INTEGER TM ====================
(function initIntegerTM() {
  const funcSelect = document.getElementById('intFunc');
  const intOpDisplay = document.getElementById('intOpDisplay');

  funcSelect.addEventListener('change', () => {
    const ops = { add:'+', mul:'×', monus:'∸' };
    intOpDisplay.textContent = ops[funcSelect.value] || '+';
  });

  document.getElementById('int-compute').addEventListener('click', () => {
    const fn = funcSelect.value;
    const a = parseInt(document.getElementById('intA').value) || 0;
    const b = parseInt(document.getElementById('intB').value) || 0;
    let result, desc;
    if (fn === 'add') { result = a + b; desc = `${a} + ${b} = ${result}`; }
    else if (fn === 'mul') { result = a * b; desc = `${a} × ${b} = ${result}`; }
    else { result = Math.max(a - b, 0); desc = `${a} ∸ ${b} = ${result} (monus)`; }

    const visual = document.getElementById('int-tape-visual');
    visual.innerHTML = '';
    const mkCell = (sym, cls='') => {
      const c = document.createElement('div');
      c.className = `int-cell ${cls}`;
      c.textContent = sym;
      visual.appendChild(c);
    };
    mkCell('□', 'blank');
    for (let i = 0; i < a; i++) mkCell('1');
    mkCell('0', 'sep');
    for (let i = 0; i < b; i++) mkCell('1');
    mkCell('□', 'blank');
    mkCell('→', 'sep');
    mkCell('□', 'blank');
    for (let i = 0; i < result; i++) mkCell('1', 'result');
    mkCell('□', 'blank');

    const resultEl = document.getElementById('intResult');
    resultEl.style.display = 'block';
    resultEl.textContent = `Result: ${desc}`;
    document.getElementById('int-desc').textContent =
      `Unary: ${'1'.repeat(a)} 0 ${'1'.repeat(b)} → ${'1'.repeat(result)}`;
  });
})();

// ==================== UTM SIMULATOR ====================
const UTM_TMS = {
  anbn: TM_EXAMPLES.anbn,
  palindrome: TM_EXAMPLES.palindrome,
  increment: TM_EXAMPLES.increment
};

class UTMSimulator {
  constructor() {
    this.descTapeEl = document.getElementById('utmDescTape');
    this.inputTapeEl = document.getElementById('utmInputTape');
    this.stateTapeEl = document.getElementById('utmStateTape');
    this.utmStateEl = document.getElementById('utmState');
    this.mStateEl = document.getElementById('utmMState');
    this.stepEl = document.getElementById('utmStep');
    this.resultEl = document.getElementById('utmResult');
    this.resultBox = document.getElementById('utmResultBox');
    this.logEl = document.getElementById('utmLog');

    this.tm = null;
    this.tape = [];
    this.head = 0;
    this.state = '';
    this.steps = 0;
    this.timer = null;
    this.finished = false;

    this.updateEncoding();
    document.getElementById('utmTMSelect').addEventListener('change', () => this.updateEncoding());
    document.getElementById('utmInput').addEventListener('input', () => this.updateEncoding());
  }

  getTMKey() { return document.getElementById('utmTMSelect').value; }
  getInput() { return document.getElementById('utmInput').value.trim(); }

  updateEncoding() {
    const key = this.getTMKey();
    const w = this.getInput();
    document.getElementById('utmEncodingValue').textContent =
      `⟨${key}⟩ ⊗ "${w}" → binary ruleset (${(UTM_TMS[key]||{transitions:[]}).transitions.length} rules)`;
  }

  reset() {
    clearInterval(this.timer);
    this.finished = false;
    this.steps = 0;
    const key = this.getTMKey();
    const w = this.getInput();
    this.tm = UTM_TMS[key];
    if (!this.tm) return;
    this.tape = ['□', ...w.split(''), '□', '□', '□'];
    this.head = 1;
    this.state = this.tm.startState;
    this.renderTapes();
    this.updateInfo();
    this.clearResult();
    if (this.logEl) this.logEl.innerHTML = '';
    this.log(`U initialized. Simulating M=${key} on w="${w}"`);
    this.log(`M has ${this.tm.transitions.length} transition rules.`);
  }

  renderSlimTape(el, symbols, activeIdx) {
    if (!el) return;
    el.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'tape-track';
    symbols.forEach((sym, i) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell' + (i === activeIdx ? ' active' : '');
      cell.textContent = sym;
      track.appendChild(cell);
    });
    el.appendChild(track);
  }

  renderTapes() {
    const descSyms = ['⟨M⟩', '⊗', ...this.getInput().split(''), '□'];
    this.renderSlimTape(this.descTapeEl, descSyms, 0);
    this.renderSlimTape(this.inputTapeEl, this.tape, this.head);
    const stateSyms = [this.state, '|', ...this.tm.transitions.slice(0, 5).map(t => t.s + '→' + t.n)];
    this.renderSlimTape(this.stateTapeEl, stateSyms, 0);
  }

  updateInfo() {
    if (this.utmStateEl) this.utmStateEl.textContent = this.steps === 0 ? 'INIT' : 'SIM';
    if (this.mStateEl) this.mStateEl.textContent = formatStateName(this.state);
    if (this.stepEl) this.stepEl.textContent = this.steps;
  }

  clearResult() {
    if (this.resultBox) this.resultBox.classList.remove('accept','reject');
    if (this.resultEl) this.resultEl.textContent = '—';
  }

  setResult(acc) {
    if (this.resultBox) this.resultBox.classList.add(acc ? 'accept' : 'reject');
    if (this.resultEl) this.resultEl.textContent = acc ? 'ACCEPT ✓' : 'REJECT ✗';
    this.log(`U decides: M ${acc ? 'ACCEPTS' : 'REJECTS'} input "${this.getInput()}"`, acc ? 'accept' : 'reject');
  }

  log(msg, cls='') {
    if (!this.logEl) return;
    const e = document.createElement('div');
    e.className = 'log-entry' + (cls ? ' '+cls : '');
    e.textContent = msg;
    this.logEl.appendChild(e);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  step() {
    if (this.finished || !this.tm) return false;
    while (this.head >= this.tape.length - 1) this.tape.push('□');
    const sym = this.tape[this.head] || '□';
    const trans = this.tm.transitions.find(t => t.s === this.state && t.r === sym);

    this.log(`U simulates: M in ${formatStateName(this.state)}, reads "${sym}"${trans
      ? ` → write:"${trans.w}" move:${trans.m} next:${formatStateName(trans.n)}`
      : ' → no matching rule'}`);

    if (!trans) {
      this.finished = true;
      this.setResult(this.state === this.tm.acceptState);
      this.renderTapes();
      this.steps++;
      this.updateInfo();
      return false;
    }

    this.tape[this.head] = trans.w;
    this.state = trans.n;
    this.head += trans.m === 'R' ? 1 : -1;
    if (this.head < 0) { this.tape.unshift('□'); this.head = 0; }
    this.steps++;
    this.renderTapes();
    this.updateInfo();

    if (this.state === this.tm.acceptState || this.state === this.tm.rejectState) {
      this.finished = true;
      this.setResult(this.state === this.tm.acceptState);
      return false;
    }
    return true;
  }

  run() {
    this.timer = setInterval(() => {
      if (!this.step()) clearInterval(this.timer);
    }, getDelay());
  }
}

const utmSim = new UTMSimulator();
utmSim.reset();

document.getElementById('utmReset').addEventListener('click', () => {
  clearInterval(utmSim.timer);
  utmSim.reset();
});
document.getElementById('utmStep').addEventListener('click', () => {
  if (!utmSim.tm) utmSim.reset();
  if (utmSim.finished) utmSim.reset();
  utmSim.step();
});
document.getElementById('utmRun').addEventListener('click', () => {
  if (utmSim.finished) utmSim.reset();
  utmSim.run();
});

// ==================== CHOMSKY HIERARCHY ====================
(function renderChomsky() {
  const container = document.getElementById('hierarchyViz');
  if (!container) return;
  container.innerHTML = `<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" class="chomsky-svg">
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="240" cy="160" rx="220" ry="140" fill="rgba(255,107,53,0.07)" stroke="rgba(255,107,53,0.5)" stroke-width="1.5"/>
    <text x="450" y="48" fill="rgba(255,107,53,0.9)" font-family="Share Tech Mono" font-size="11" text-anchor="end">Type 0</text>
    <text x="450" y="63" fill="rgba(255,107,53,0.7)" font-family="Rajdhani" font-size="11" text-anchor="end">Recursively Enumerable (TM)</text>
    <ellipse cx="240" cy="165" rx="165" ry="105" fill="rgba(155,89,247,0.07)" stroke="rgba(155,89,247,0.5)" stroke-width="1.5"/>
    <text x="395" y="90" fill="rgba(155,89,247,0.9)" font-family="Share Tech Mono" font-size="11" text-anchor="end">Type 1</text>
    <text x="395" y="105" fill="rgba(155,89,247,0.7)" font-family="Rajdhani" font-size="11" text-anchor="end">Context-Sensitive (LBA)</text>
    <ellipse cx="240" cy="170" rx="112" ry="73" fill="rgba(0,245,255,0.07)" stroke="rgba(0,245,255,0.5)" stroke-width="1.5"/>
    <text x="342" y="130" fill="rgba(0,245,255,0.9)" font-family="Share Tech Mono" font-size="11" text-anchor="end">Type 2</text>
    <text x="342" y="145" fill="rgba(0,245,255,0.7)" font-family="Rajdhani" font-size="11" text-anchor="end">Context-Free (PDA)</text>
    <ellipse cx="240" cy="175" rx="62" ry="42" fill="rgba(0,255,136,0.14)" stroke="rgba(0,255,136,0.7)" stroke-width="2"/>
    <text x="240" y="172" fill="rgba(0,255,136,1)" font-family="Share Tech Mono" font-size="11" text-anchor="middle" filter="url(#glow)">Type 3</text>
    <text x="240" y="186" fill="rgba(0,255,136,0.9)" font-family="Rajdhani" font-size="10" text-anchor="middle">Regular (FA)</text>
  </svg>`;
})();

// ==================== EQUIVALENCE DIAGRAM ====================
(function renderEquivalence() {
  const container = document.getElementById('eqDiagram');
  if (!container) return;
  const models = ['λ-Calculus', 'μ-Recursive Fns', 'RAM Machines', 'Post Systems', 'C Programs', 'Markov Algorithms'];
  container.innerHTML = '';

  const center = document.createElement('div');
  center.className = 'eq-node center-node';
  center.textContent = 'Turing Machine';
  container.appendChild(center);

  models.forEach(m => {
    const arrow = document.createElement('div');
    arrow.className = 'eq-arrow';
    arrow.textContent = '⟺';
    container.appendChild(arrow);

    const node = document.createElement('div');
    node.className = 'eq-node';
    node.textContent = m;
    container.appendChild(node);
  });
})();

// ==================== LANGUAGE TESTER ====================
class LanguageTester {
  constructor() {
    this.tape = [];
    this.head = 0;
    this.state = '';
    this.steps = 0;
    this.tm = null;
    this.finished = false;
    this.timer = null;
  }

  test(tmKey, input) {
    clearInterval(this.timer);
    this.tm = TM_EXAMPLES[tmKey];
    if (!this.tm) return;
    this.tape = ['□', ...input.split(''), '□', '□', '□'];
    this.head = 1;
    this.state = this.tm.startState;
    this.steps = 0;
    this.finished = false;
    this.renderTape();
    this.updateInfo();
    const rb = document.getElementById('langResultBox');
    if (rb) rb.classList.remove('accept','reject');
    const re = document.getElementById('langResult');
    if (re) re.textContent = '—';
    const logEl = document.getElementById('langLog');
    if (logEl) logEl.innerHTML = '';
    this.log(`Testing "${input}" on ${this.tm.name}`);

    this.timer = setInterval(() => {
      if (!this.stepOnce()) clearInterval(this.timer);
    }, 350);
  }

  stepOnce() {
    if (this.finished || !this.tm) return false;
    while (this.head >= this.tape.length - 1) this.tape.push('□');
    if (this.head < 0) { this.tape.unshift('□'); this.head = 0; }
    const sym = this.tape[this.head] || '□';
    const trans = this.tm.transitions.find(t => t.s === this.state && t.r === sym);

    if (!trans) {
      this.finished = true;
      const acc = this.state === this.tm.acceptState;
      this.setResult(acc);
      this.renderTape();
      this.steps++;
      this.updateInfo();
      return false;
    }

    this.log(`δ(${formatStateName(this.state)}, ${sym}) = (${formatStateName(trans.n)}, ${trans.w}, ${trans.m})`);
    this.tape[this.head] = trans.w;
    this.state = trans.n;
    this.head += trans.m === 'R' ? 1 : -1;
    if (this.head < 0) { this.tape.unshift('□'); this.head = 0; }
    this.steps++;
    this.renderTape();
    this.updateInfo();

    if (this.state === this.tm.acceptState || this.state === this.tm.rejectState) {
      this.finished = true;
      this.setResult(this.state === this.tm.acceptState);
      return false;
    }
    return true;
  }

  renderTape() {
    const track = document.getElementById('langTapeTrack');
    if (!track) return;
    track.innerHTML = '';
    this.tape.forEach((sym, i) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell' + (i === this.head ? ' active' : '');
      cell.textContent = sym === '□' ? '□' : sym;
      track.appendChild(cell);
    });
  }

  updateInfo() {
    const se = document.getElementById('langState');
    if (se) se.textContent = formatStateName(this.state);
    const ste = document.getElementById('langSteps');
    if (ste) ste.textContent = this.steps;
  }

  setResult(acc) {
    const rb = document.getElementById('langResultBox');
    if (rb) rb.classList.add(acc ? 'accept' : 'reject');
    const re = document.getElementById('langResult');
    if (re) re.textContent = acc ? 'ACCEPT ✓' : 'REJECT ✗';
    this.log(acc ? '✓ String ACCEPTED — in language!' : '✗ String REJECTED — not in language!',
             acc ? 'accept' : 'reject');
  }

  log(msg, cls='') {
    const logEl = document.getElementById('langLog');
    if (!logEl) return;
    const e = document.createElement('div');
    e.className = 'log-entry' + (cls ? ' '+cls : '');
    e.textContent = msg;
    logEl.appendChild(e);
    logEl.scrollTop = logEl.scrollHeight;
  }
}

const langTester = new LanguageTester();

document.getElementById('langTest').addEventListener('click', () => {
  const key = document.getElementById('langSelect').value;
  const input = document.getElementById('langInput').value.trim();
  langTester.test(key, input);
});

function runLangExample(key) {
  const defaults = { anbn:'aabb', palindrome:'abba', anbncn:'aabbcc', wwr:'abba' };
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = key;
  const inp = document.getElementById('langInput');
  if (inp) inp.value = defaults[key] || '';
  langTester.test(key, defaults[key] || '');
  document.getElementById('languages').scrollIntoView({ behavior: 'smooth' });
}

// ==================== MODAL ====================
function closeModal() {
  const mo = document.getElementById('modalOverlay');
  if (mo) mo.classList.remove('active');
}

// ==================== INTERSECTION OBSERVER ====================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      const id = entry.target.id;
      const link = document.querySelector(`[data-section="${id}"]`);
      if (link) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section').forEach(s => {
  s.style.opacity = '1';
  observer.observe(s);
});

// ==================== INIT LOG ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('TuringVerse loaded. All simulators ready.');
});
