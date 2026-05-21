// Endless Runner Engine — Chrome Dino Style

export const GROUND_Y = 0.75; // Ground at 75% of canvas height
export const GRAVITY = -0.002;
export const JUMP_VEL = 0.05;
export const BASE_SPEED = 0.005;
export const MAX_SPEED = 0.018;

export function createState() {
  return {
    player: { y: 0, vy: 0, jumping: false, width: 0.06, height: 0.12 },
    obstacles: [],
    score: 0,
    speed: BASE_SPEED,
    gameOver: false,
    started: false,
    frame: 0,
  };
}

export function tick(state) {
  if (state.gameOver || !state.started) return state;

  const s = { ...state, obstacles: state.obstacles.map((o) => ({ ...o })), frame: state.frame + 1 };

  // Speed up over time
  s.speed = Math.min(BASE_SPEED + s.frame * 0.000003, MAX_SPEED);

  // Gravity + jump (y positive = above ground)
  s.player = { ...s.player };
  s.player.vy += GRAVITY;
  s.player.y += s.player.vy;
  if (s.player.y <= 0) {
    s.player.y = 0;
    s.player.vy = 0;
    s.player.jumping = false;
  } else {
    s.player.jumping = true;
  }

  // Move obstacles
  for (const o of s.obstacles) {
    o.x -= s.speed;
  }

  // Remove off-screen obstacles
  s.obstacles = s.obstacles.filter((o) => o.x > -0.2);

  // Spawn obstacles (slower rate, wider gaps)
  if (s.obstacles.length === 0 || (s.obstacles[s.obstacles.length - 1].x < 0.5 && Math.random() < 0.008)) {
    const h = 0.08 + Math.random() * 0.12; // shorter obstacles
    s.obstacles.push({ x: 1.05, width: 0.03 + Math.random() * 0.04, height: h });
  }

  // Collision detection (y positive = above ground)
  const px = 0.15;
  const pw = s.player.width;
  const ph = s.player.height;
  const py = GROUND_Y - s.player.y - ph;

  for (const o of s.obstacles) {
    const ox = o.x;
    const ow = o.width;
    const oh = o.height;
    const oy = GROUND_Y - oh;

    if (
      px + pw > ox &&
      px < ox + ow &&
      py + ph > oy
    ) {
      s.gameOver = true;
      break;
    }
  }

  // Score
  if (!s.gameOver) {
    s.score = Math.floor(s.score + s.speed * 100);
  }

  return s;
}

export function jump(state) {
  if (state.gameOver) return state;
  if (!state.started) return { ...state, started: true, player: { ...state.player, y: 0, vy: JUMP_VEL, jumping: true } };
  if (state.player.jumping) return state;
  return { ...state, player: { ...state.player, y: 0, vy: JUMP_VEL, jumping: true } };
}

export function draw(ctx, state, canvas) {
  const W = canvas.width;
  const H = canvas.height;
  const ground = H * GROUND_Y;

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, '#1a1a2e');
  sky.addColorStop(1, '#16213e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, ground);

  // Ground
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(0, ground, W, H - ground);

  // Ground line
  ctx.strokeStyle = '#4a4a5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(W, ground);
  ctx.stroke();

  // Ground dashes (scrolling)
  const dashOffset = (state.frame * state.speed * 200) % 50;
  ctx.strokeStyle = '#3a3a4e';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 30]);
  ctx.lineDashOffset = -dashOffset;
  ctx.beginPath();
  ctx.moveTo(0, ground + 4);
  ctx.lineTo(W, ground + 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Obstacles (cactus-like)
  for (const o of state.obstacles) {
    const ox = o.x * W;
    const ow = o.width * W;
    const oh = o.height * H;
    const oy = ground - oh;

    // Rounded rect for obstacle
    const r = 4;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(ox + r, oy);
    ctx.lineTo(ox + ow - r, oy);
    ctx.arcTo(ox + ow, oy, ox + ow, oy + r, r);
    ctx.lineTo(ox + ow, oy + oh - r);
    ctx.arcTo(ox + ow, oy + oh, ox + ow - r, oy + oh, r);
    ctx.lineTo(ox + r, oy + oh);
    ctx.arcTo(ox, oy + oh, ox, oy + oh - r, r);
    ctx.lineTo(ox, oy + r);
    ctx.arcTo(ox, oy, ox + r, oy, r);
    ctx.closePath();
    ctx.fill();

    // Spikes on top
    ctx.fillStyle = '#dc2626';
    const spikeW = ow / 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const sx = ox + spikeW * i;
      ctx.moveTo(sx, oy);
      ctx.lineTo(sx + spikeW / 2, oy - oh * 0.15);
      ctx.lineTo(sx + spikeW, oy);
      ctx.fill();
    }
  }

  // Player (stick figure runner)
  const px = 0.15 * W;
  const py = ground - state.player.y * H - state.player.height * H;
  const ph = state.player.height * H;

  // Body
  ctx.fillStyle = '#818cf8';
  ctx.fillRect(px - 4, py - ph * 0.6, 10, ph * 0.6);

  // Head
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(px + 1, py - ph * 0.7, ph * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px + 5, py - ph * 0.73, 3, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated)
  const legPhase = (state.frame * 0.2) % (Math.PI * 2);
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  const hipX = px;
  const hipY = py - ph * 0.2;
  const footY = py + 4;

  // If jumping, legs are tucked
  if (state.player.jumping) {
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX - 8, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + 8, py);
    ctx.stroke();
  } else {
    // Running animation
    const legLen = ph * 0.5;
    const leftAngle = Math.sin(legPhase) * 0.6;
    const rightAngle = Math.sin(legPhase + Math.PI) * 0.6;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + Math.sin(leftAngle) * legLen * 0.7, hipY + legLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + Math.sin(rightAngle) * legLen * 0.7, hipY + legLen);
    ctx.stroke();
  }

  // Arms
  const armPhase = state.player.jumping ? -0.5 : Math.sin(legPhase) * 0.5;
  ctx.beginPath();
  ctx.moveTo(px, py - ph * 0.4);
  ctx.lineTo(px + armPhase * 8, py - ph * 0.1);
  ctx.stroke();

  // Score (top right)
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${state.score}`, W - 20, 40);

  // High score
  ctx.font = '12px monospace';
  ctx.fillStyle = '#64748b';
  const best = parseInt(localStorage.getItem('runner-best') || '0');
  ctx.fillText(`HI ${Math.max(best, state.score).toString().padStart(5, '0')}`, W - 20, 62);
}
