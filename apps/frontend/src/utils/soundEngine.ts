/**
 * 游戏音效引擎 - 使用 Web Audio API 合成所有音效
 * 支持音量控制、静音开关、localStorage 持久化
 */

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// ============ 设置持久化 ============
const STORAGE_KEY = 'boomword_sound_settings';

interface SoundSettings {
  enabled: boolean;
  volume: number;
}

const loadSettings = (): SoundSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        enabled: typeof s.enabled === 'boolean' ? s.enabled : true,
        volume: typeof s.volume === 'number' ? Math.max(0, Math.min(1, s.volume)) : 0.85,
      };
    }
  } catch {}
  return { enabled: true, volume: 0.85 };
};

const saveSettings = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: soundEnabled, volume: masterVolume }));
  } catch {}
};

// ============ 音量 & 开关 ============
let { enabled: soundEnabled, volume: masterVolume } = loadSettings();

export const setSoundEnabled = (on: boolean) => {
  soundEnabled = on;
  saveSettings();
};
export const isSoundEnabled = () => soundEnabled;

export const setMasterVolume = (v: number) => {
  masterVolume = Math.max(0, Math.min(1, v));
  saveSettings();
};
export const getMasterVolume = () => masterVolume;

/** 内部音量计算：基础值 × 主音量。静音时返回 0 */
const vol = (v: number) => {
  if (!soundEnabled) return 0;
  return v * masterVolume;
};

// ============ 键盘打字音（机械键盘咔嗒声） ============
export const playKeyPress = () => {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // --- 第一层：短噪声脉冲（模拟按键瞬间的宽频冲击） ---
  const clickDur = 0.012 + Math.random() * 0.006; // 12-18ms 极短脉冲
  const clickBufSize = Math.floor(ctx.sampleRate * 0.04);
  const clickBuf = ctx.createBuffer(1, clickBufSize, ctx.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickBufSize; i++) {
    // 极快衰减的噪声 → 像敲击的瞬态
    clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * clickDur));
  }

  const clickSrc = ctx.createBufferSource();
  clickSrc.buffer = clickBuf;

  // 带通滤波：截取 3000-8000Hz 区间，听起来像塑料/金属碰撞
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 4500 + Math.random() * 2000;
  clickFilter.Q.value = 1.2;

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(vol(0.35), now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  clickSrc.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(ctx.destination);

  // --- 第二层：低频触底撞击（键帽触底的 "thock"） ---
  const thock = ctx.createOscillator();
  const thockGain = ctx.createGain();

  thock.type = 'sine';
  thock.frequency.setValueAtTime(300 + Math.random() * 100, now);
  thock.frequency.exponentialRampToValueAtTime(100, now + 0.015);

  thockGain.gain.setValueAtTime(vol(0.12), now);
  thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  thock.connect(thockGain);
  thockGain.connect(ctx.destination);

  // --- 第三层：极短高频尖刺（弹簧回弹的微弱金属感） ---
  const spring = ctx.createOscillator();
  const springGain = ctx.createGain();

  spring.type = 'triangle';
  spring.frequency.setValueAtTime(6000 + Math.random() * 2000, now + 0.005);
  spring.frequency.exponentialRampToValueAtTime(3000, now + 0.018);

  springGain.gain.setValueAtTime(0, now);
  springGain.gain.setValueAtTime(vol(0.06), now + 0.005);
  springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

  spring.connect(springGain);
  springGain.connect(ctx.destination);

  clickSrc.start(now);
  thock.start(now);
  thock.stop(now + 0.04);
  spring.start(now);
  spring.stop(now + 0.03);
};

// ============ 回车键音 ============
export const playEnterKey = () => {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

  gain.gain.setValueAtTime(vol(0.25), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);
};

// ============ 正确回答 - 子弹出膛音 ============
export const playGunshot = () => {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const dur = 0.4;

  // 白噪声 burst
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol(0.7), now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 3000;
  noiseFilter.Q.value = 0.7;

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // 低频冲击
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();

  sub.type = 'sine';
  sub.frequency.setValueAtTime(150, now);
  sub.frequency.exponentialRampToValueAtTime(40, now + 0.12);

  subGain.gain.setValueAtTime(vol(0.8), now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  sub.connect(subGain);
  subGain.connect(ctx.destination);

  // 金属弹壳高频
  const metal = ctx.createOscillator();
  const metalGain = ctx.createGain();

  metal.type = 'sawtooth';
  metal.frequency.setValueAtTime(4000, now + 0.05);
  metal.frequency.exponentialRampToValueAtTime(1500, now + 0.15);

  metalGain.gain.setValueAtTime(0, now);
  metalGain.gain.setValueAtTime(vol(0.15), now + 0.05);
  metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  metal.connect(metalGain);
  metalGain.connect(ctx.destination);

  noise.start(now);
  sub.start(now);
  sub.stop(now + dur);
  metal.start(now);
  metal.stop(now + dur);
};

// ============ 错误回答 - 卡壳/哑火音 ============
export const playMisfire = () => {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();

  osc1.type = 'square';
  osc1.frequency.setValueAtTime(200, now);
  osc1.frequency.exponentialRampToValueAtTime(60, now + 0.1);

  gain1.gain.setValueAtTime(vol(0.45), now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(120, now);
  osc2.frequency.exponentialRampToValueAtTime(50, now + 0.18);

  gain2.gain.setValueAtTime(vol(0.3), now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;

  osc2.connect(filter);
  filter.connect(gain2);
  gain2.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.18);
  osc2.start(now);
  osc2.stop(now + 0.25);
};

// ============ 泡泡爆破音（按难度不同音色+音量） ============
export const playBubblePop = (difficulty: number = 1) => {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const baseFreq = 300 + difficulty * 80;
  const volumeScale = 0.7 + difficulty * 0.12;
  const dur = 0.25 + difficulty * 0.06;

  // 主爆破音
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq * 2, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + dur * 0.6);

  gain.gain.setValueAtTime(vol(0.5 * volumeScale), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);

  // 碎裂噪声
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (0.025 + difficulty * 0.012)));
  }

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol(0.25 * volumeScale), now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.5);

  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 1000 + difficulty * 500;
  nf.Q.value = 1;

  noiseSrc.connect(nf);
  nf.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // 高难度额外高频泛音
  if (difficulty >= 3) {
    const hi = ctx.createOscillator();
    const hiGain = ctx.createGain();

    hi.type = 'triangle';
    hi.frequency.setValueAtTime(baseFreq * 3, now);
    hi.frequency.exponentialRampToValueAtTime(baseFreq, now + dur * 0.4);

    hiGain.gain.setValueAtTime(vol(0.18 * volumeScale), now);
    hiGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.5);

    hi.connect(hiGain);
    hiGain.connect(ctx.destination);

    hi.start(now);
    hi.stop(now + dur);
  }

  // 高难度低频共振
  if (difficulty >= 4) {
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();

    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(30, now + dur);

    boomGain.gain.setValueAtTime(vol(0.35 * volumeScale), now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    boom.connect(boomGain);
    boomGain.connect(ctx.destination);

    boom.start(now);
    boom.stop(now + dur);
  }

  osc.start(now);
  osc.stop(now + dur);
  noiseSrc.start(now);
};

// ============ 连击奖励音（combo >= 3） ============
export const playComboBonus = (combo: number) => {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const baseNote = 440 + Math.min(combo, 10) * 30;
  const notes = [baseNote, baseNote * 1.25, baseNote * 1.5];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const t = now + i * 0.06;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol(0.2), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  });
};

// 初始化
export const initAudio = () => {
  getCtx();
};
