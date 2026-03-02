/**
 * 粒子爆破特效引擎 - Canvas 2D
 * 在泡泡消除时产生绚丽的粒子爆炸效果
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  type: 'circle' | 'spark' | 'ring';
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animId: number | null = null;

// 初始化 canvas overlay
export const initParticleCanvas = () => {
  if (canvas) return;

  canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');

  const handleResize = () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  window.addEventListener('resize', handleResize);
};

export const destroyParticleCanvas = () => {
  if (animId) cancelAnimationFrame(animId);
  if (canvas) {
    canvas.remove();
    canvas = null;
    ctx = null;
  }
  particles = [];
  animId = null;
};

// 颜色方案 - 与泡泡颜色配套
const difficultyColors: Record<number, string[]> = {
  0: ['#7BC67E', '#4A9E4E', '#A8E6A8', '#2E7D32', '#C8E6C9'],
  1: ['#7BC67E', '#4A9E4E', '#A8E6A8', '#2E7D32', '#C8E6C9'],
  2: ['#5E8FD8', '#3B6DB5', '#90B8F0', '#1E4A8C', '#BBDEFB'],
  3: ['#C9A04E', '#B08A3A', '#E8D080', '#8E6F2E', '#FFF8E1'],
  4: ['#9B7EC8', '#7E5FB5', '#C4A8E0', '#654C93', '#E1BEE7'],
  5: ['#D87E7E', '#C55A5A', '#F0A8A8', '#A34545', '#FFCDD2'],
};

// 发射爆破粒子
export const emitExplosion = (
  x: number,
  y: number,
  difficulty: number = 1,
  bubbleSize: number = 100
) => {
  if (!ctx) return;

  const colors = difficultyColors[difficulty] || difficultyColors[1];
  const count = 15 + difficulty * 8; // 难度越高粒子越多：23-55
  const speed = 2 + difficulty * 0.8; // 难度越高速度越快

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const v = speed * (0.5 + Math.random() * 1.2);
    const type: Particle['type'] = i % 5 === 0 ? 'ring' : i % 3 === 0 ? 'spark' : 'circle';

    particles.push({
      x: x + (Math.random() - 0.5) * bubbleSize * 0.3,
      y: y + (Math.random() - 0.5) * bubbleSize * 0.3,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      radius: type === 'spark' ? 1.5 + Math.random() * 2 : 2 + Math.random() * (3 + difficulty),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.8 + Math.random() * 0.2,
      decay: 0.015 + Math.random() * 0.01,
      gravity: 0.03 + Math.random() * 0.02,
      type,
    });
  }

  // 中心闪光
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    radius: bubbleSize * 0.4,
    color: '#FFFFFF',
    alpha: 0.6,
    decay: 0.05,
    gravity: 0,
    type: 'ring',
  });

  if (!animId) startLoop();
};

const startLoop = () => {
  const loop = () => {
    if (!ctx || !canvas) return;
    if (particles.length === 0) {
      animId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        // 柔光
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 2;
        ctx.fill();
      } else if (p.type === 'spark') {
        // 拖尾火花
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        p.radius += 1.5;
      }

      ctx.restore();
    }

    animId = requestAnimationFrame(loop);
  };
  animId = requestAnimationFrame(loop);
};
