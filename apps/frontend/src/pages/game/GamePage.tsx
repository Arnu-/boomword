import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { EnterOutlined, LogoutOutlined, SettingOutlined, SoundOutlined, MutedOutlined } from '@ant-design/icons';
import { useGameStore, GameMode, Word } from '@/stores/gameStore';
import { gameService } from '@/services/gameService';
import classNames from 'classnames';
import {
  initAudio,
  playKeyPress,
  playGunshot,
  playMisfire,
  playBubblePop,
  playComboBonus,
  isSoundEnabled,
  setSoundEnabled,
  getMasterVolume,
  setMasterVolume,
} from '@/utils/soundEngine';
import {
  initParticleCanvas,
  destroyParticleCanvas,
  emitExplosion,
} from '@/utils/particleEngine';

// ============ 连击等级配置 ============
const COMBO_LEVELS = [
  { min: 3,  max: 4,  label: 'NICE',    emoji: '✨', color: '#60EFFF', glow: 'rgba(96,239,255,0.6)',   shake: false, rainbow: false, fire: false },
  { min: 5,  max: 6,  label: 'GREAT',   emoji: '🔥', color: '#FFD700', glow: 'rgba(255,215,0,0.7)',    shake: false, rainbow: false, fire: true  },
  { min: 7,  max: 9,  label: 'AWESOME', emoji: '💥', color: '#FF6B35', glow: 'rgba(255,107,53,0.8)',   shake: true,  rainbow: false, fire: true  },
  { min: 10, max: 14, label: 'INSANE',  emoji: '⚡', color: '#FF00FF', glow: 'rgba(255,0,255,0.9)',    shake: true,  rainbow: true,  fire: true  },
  { min: 15, max: 999,label: 'GODLIKE', emoji: '🌈', color: '#FFFFFF', glow: 'rgba(255,255,255,1.0)',  shake: true,  rainbow: true,  fire: true  },
];

const getComboLevel = (combo: number) =>
  COMBO_LEVELS.find(l => combo >= l.min && combo <= l.max) ?? null;

// ============ 连击失败浮层组件 ============
interface MissDisplayProps {
  brokenCombo: number; // 被打断时的连击数（0 = 普通错误，>0 = 连击中断）
  visible: boolean;
}

const MISS_MESSAGES = [
  { min: 0,  max: 0,  text: '输入错误',   sub: 'Wrong!',      emoji: '❌', color: '#FF6B6B' },
  { min: 1,  max: 2,  text: '连击中断',   sub: 'Combo Break!', emoji: '💔', color: '#FF8C42' },
  { min: 3,  max: 6,  text: '连击打断！', sub: 'Combo Lost!',  emoji: '😤', color: '#FF4757' },
  { min: 7,  max: 11, text: '连击崩了！', sub: 'Streak Gone!', emoji: '😱', color: '#FF2D55' },
  { min: 12, max: 999,text: '连击毁灭！', sub: 'DESTROYED!',   emoji: '💀', color: '#FF0040' },
];

const getMissMessage = (brokenCombo: number) =>
  MISS_MESSAGES.slice().reverse().find(m => brokenCombo >= m.min) ?? MISS_MESSAGES[0];

const MissDisplay = ({ brokenCombo, visible }: MissDisplayProps) => {
  if (!visible) return null;
  const msg = getMissMessage(brokenCombo);
  const isHighCombo = brokenCombo >= 7;
  const isEpic = brokenCombo >= 12;

  return (
    <div className={`miss-overlay ${isEpic ? 'miss-epic' : isHighCombo ? 'miss-high' : ''}`}>
      {/* 红色震屏 */}
      {brokenCombo >= 3 && <div className="miss-screen-flash" />}

      {/* 破碎粒子 */}
      {brokenCombo >= 1 && (
        <div className="miss-shards">
          {Array.from({ length: isEpic ? 16 : 8 }).map((_, i) => (
            <div
              key={i}
              className="miss-shard"
              style={{
                '--i': i,
                '--total': isEpic ? 16 : 8,
                '--color': msg.color,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 主体内容 */}
      <div className="miss-main" style={{ '--color': msg.color } as React.CSSProperties}>
        <div className="miss-emoji">{msg.emoji}</div>
        <div className="miss-text">{msg.text}</div>
        {brokenCombo > 0 && (
          <div className="miss-combo-lost">
            <span className="miss-combo-num">x{brokenCombo}</span>
            <span className="miss-combo-label"> 连击归零</span>
          </div>
        )}
        <div className="miss-sub">{msg.sub}</div>
      </div>

      {/* 高连击时的裂纹效果 */}
      {isHighCombo && (
        <div className="miss-cracks">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="miss-crack" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============ 连击浮层组件 ============
interface ComboDisplayProps {
  combo: number;
  visible: boolean;
}

const ComboDisplay = ({ combo, visible }: ComboDisplayProps) => {
  const level = getComboLevel(combo);
  if (!level || !visible) return null;

  const tier = COMBO_LEVELS.indexOf(level); // 0~4

  return (
    <div className={classNames('combo-overlay', `combo-tier-${tier}`, { 'combo-visible': visible })}>
      {/* 震屏遮罩 */}
      {level.shake && <div className="combo-screen-flash" />}

      {/* 火焰粒子背景 */}
      {level.fire && (
        <div className="combo-fire-bg">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="combo-fire-particle" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
      )}

      {/* 彩虹光晕 */}
      {level.rainbow && <div className="combo-rainbow-ring" />}

      {/* 主体文字 */}
      <div className="combo-main" style={{ '--glow': level.glow, '--color': level.color } as React.CSSProperties}>
        <div className="combo-emoji">{level.emoji}</div>
        <div className="combo-number">x{combo}</div>
        <div className="combo-label">{level.label}!</div>
      </div>

      {/* 爆炸光线 */}
      {tier >= 2 && (
        <div className="combo-rays">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="combo-ray" style={{ '--angle': `${i * 45}deg` } as React.CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
};

// 泡泡颜色方案 - 更强烈的玻璃质感
const bubbleColors = [
  {
    bg: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4) 0%, #7BC67E 15%, #4A9E4E 50%, #2E7D32 85%, #1B5E20 100%)',
    shadow: 'rgba(74, 158, 78, 0.6)',
    glow: 'rgba(123, 198, 126, 0.3)',
  },
  {
    bg: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4) 0%, #6EA8E8 15%, #3B6DB5 50%, #1E4A8C 85%, #0D3268 100%)',
    shadow: 'rgba(59, 109, 181, 0.6)',
    glow: 'rgba(110, 168, 232, 0.3)',
  },
  {
    bg: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45) 0%, #E0BE60 15%, #B08A3A 50%, #8E6F2E 85%, #6B5220 100%)',
    shadow: 'rgba(176, 138, 58, 0.6)',
    glow: 'rgba(224, 190, 96, 0.3)',
  },
  {
    bg: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4) 0%, #B898DC 15%, #7E5FB5 50%, #654C93 85%, #4A3570 100%)',
    shadow: 'rgba(126, 95, 181, 0.6)',
    glow: 'rgba(184, 152, 220, 0.3)',
  },
  {
    bg: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4) 0%, #F09898 15%, #C55A5A 50%, #A34545 85%, #7A2F2F 100%)',
    shadow: 'rgba(197, 90, 90, 0.6)',
    glow: 'rgba(240, 152, 152, 0.3)',
  },
];

const getBubbleColor = (difficulty?: number, index?: number) => {
  const d = difficulty || ((index || 0) % 5);
  return bubbleColors[d % bubbleColors.length];
};

const getBubbleSize = (difficulty?: number, english?: string) => {
  const len = english?.length || 4;
  const d = difficulty || 1;
  const base = 70 + d * 12;
  return Math.min(170, Math.max(80, base + len * 8));
};

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

// 泡泡组件 - 带玻璃质感
interface BubbleProps {
  word: Word;
  index: number;
  isPopping: boolean;
  mode: GameMode;
  totalCount: number;
  onPop?: (x: number, y: number, difficulty: number, size: number) => void;
}

const Bubble = ({ word, index, isPopping, mode, totalCount, onPop }: BubbleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const size = getBubbleSize(word.difficulty, word.english);
  const color = getBubbleColor(word.difficulty, index);
  const hash = hashCode(word.id);

  const gridCols = Math.ceil(Math.sqrt(totalCount + 1));
  const gridRow = Math.floor(index / gridCols);
  const gridCol = index % gridCols;

  const cellW = 100 / gridCols;
  const cellH = 100 / Math.ceil(totalCount / gridCols);
  const offsetX = (hash % 40) - 20;
  const offsetY = ((hash >> 4) % 30) - 15;
  const left = `calc(${gridCol * cellW + cellW / 2}% + ${offsetX}px)`;
  const top = `calc(${gridRow * cellH + cellH / 2}% + ${offsetY}px)`;

  const animDelay = (hash % 3000) / 1000;
  const animDuration = 4 + (hash % 2000) / 1000;

  // 爆破时触发粒子和音效
  useEffect(() => {
    if (isPopping && ref.current && onPop) {
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      onPop(cx, cy, word.difficulty || 1, size);
    }
  }, [isPopping]);

  const fontSize = Math.max(11, Math.min(18, size * 0.14));

  return (
    <div
      ref={ref}
      className={classNames('game-bubble', { 'game-bubble-pop': isPopping })}
      style={{
        width: size,
        height: size,
        background: color.bg,
        boxShadow: `
          0 8px 32px ${color.shadow},
          inset 0 -10px 30px rgba(0,0,0,0.25),
          inset 0 10px 30px rgba(255,255,255,0.2),
          0 0 ${15 + (word.difficulty || 1) * 5}px ${color.glow}
        `,
        left,
        top,
        transform: 'translate(-50%, -50%)',
        animationDelay: `${animDelay}s`,
        animationDuration: `${animDuration}s`,
      }}
    >
      {/* 高光椭圆 */}
      <div className="game-bubble-highlight" />
      {/* 小光点 */}
      <div className="game-bubble-sparkle" />
      <div className="game-bubble-content">
        {mode === 'practice' && word.english && (
          <div className="game-bubble-english" style={{ fontSize: fontSize + 2 }}>{word.english}</div>
        )}
        <div
          className="game-bubble-chinese"
          style={{ fontSize: mode === 'practice' ? fontSize - 2 : fontSize }}
        >
          {word.chinese}
        </div>
      </div>
    </div>
  );
};

// 自定义输入组件 - 隐藏原生input，防止复制粘贴，色块光标
interface GameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isShaking: boolean;
  disabled: boolean;
}

const GameInput = ({ value, onChange, onSubmit, isShaking, disabled }: GameInputProps) => {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!disabled && hiddenRef.current) {
      hiddenRef.current.focus();
    }
  }, [disabled]);

  // 全局键盘监听，确保随时可输入
  useEffect(() => {
    const handleGlobalKeyDown = (_e: KeyboardEvent) => {
      if (disabled) return;
      // 如果焦点不在隐藏input上，自动聚焦
      if (document.activeElement !== hiddenRef.current) {
        hiddenRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      playKeyPress();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const raw = (e.target as HTMLInputElement).value;
    const filtered = raw.replace(/[^a-zA-Z]/g, '');
    onChange(filtered);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleContainerClick = () => {
    hiddenRef.current?.focus();
  };

  const chars = value.split('');

  return (
    <div className="game-input-bar">
      <span className="game-input-label">输入英文单词：</span>
      <div
        className={classNames('game-input-display', { 'input-shake': isShaking, 'game-input-focused': focused })}
        onClick={handleContainerClick}
      >
        {/* 隐藏的真实输入框 */}
        <input
          ref={hiddenRef}
          className="game-hidden-input"
          type="text"
          value={value}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onContextMenu={(e) => e.preventDefault()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
        />
        {/* 可视字符展示 */}
        <div className="game-input-chars">
          {chars.length === 0 && !focused && (
            <span className="game-input-placeholder">键入单词，按 Enter 确认</span>
          )}
          {chars.map((ch, i) => (
            <span key={i} className="game-input-char">{ch}</span>
          ))}
          {/* 色块光标 */}
          {focused && <span className="game-input-cursor" />}
        </div>
        {/* 回车提示 */}
        {value.length > 0 && (
          <span className="game-input-enter-hint" onClick={(e) => { e.stopPropagation(); onSubmit(); }}>
            <EnterOutlined /> Enter
          </span>
        )}
      </div>
    </div>
  );
};

const GamePage = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [sectionInfo, setSectionInfo] = useState<{ chapterName: string; sectionName: string; wordBankName: string } | null>(null);
  const audioInitRef = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(isSoundEnabled());
  const [volume, setVolume] = useState(getMasterVolume());
  const settingsRef = useRef<HTMLDivElement>(null);
  const [comboVisible, setComboVisible] = useState(false);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [missVisible, setMissVisible] = useState(false);
  const [missBrokenCombo, setMissBrokenCombo] = useState(0);
  const missTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    status,
    mode,
    gameRecordId,
    words,
    answeredWordIds,
    totalWords,
    score,
    correctCount,
    wrongCount,
    combo,
    maxCombo: _maxCombo,
    elapsedTime,
    userInput,
    isInputShaking,
    poppingWordId,
    startGame,
    markWordAnswered,
    setUserInput,
    shakeInput,
    clearPoppingWord,
    updateElapsedTime,
    resetGame,
    endGame,
    incrementWrong,
  } = useGameStore();

  // 点击外部关闭设置面板
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const handleToggleSound = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    setSoundEnabled(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMasterVolume(v);
  };

  // 初始化音频和粒子系统
  useEffect(() => {
    initParticleCanvas();
    return () => {
      destroyParticleCanvas();
    };
  }, []);

  // 用户交互后初始化音频
  const ensureAudio = useCallback(() => {
    if (!audioInitRef.current) {
      initAudio();
      audioInitRef.current = true;
    }
  }, []);

  const remainingWords = useMemo(() => {
    return words.filter(w => !answeredWordIds.includes(w.id));
  }, [words, answeredWordIds]);

  const timeLimit = Math.max(60, totalWords * 15);
  const remainingTime = Math.max(0, timeLimit - elapsedTime);

  useEffect(() => {
    const initGame = async () => {
      if (!sectionId) return;
      try {
        const gameMode = (searchParams.get('mode') as GameMode) || 'practice';
        const response = await gameService.startGame({ sectionId, mode: gameMode });
        startGame(response.gameRecordId, response.mode as GameMode, response.words);
        if (response.sectionInfo) {
          setSectionInfo({
            chapterName: response.sectionInfo.chapterName,
            sectionName: response.sectionInfo.name,
            wordBankName: response.sectionInfo.wordBankName,
          });
        }
      } catch (error) {
        message.error((error as Error).message);
        navigate(-1);
      }
    };
    initGame();
    return () => {
      resetGame();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sectionId]);

  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(updateElapsedTime, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (poppingWordId) {
      const timer = setTimeout(clearPoppingWord, 500);
      return () => clearTimeout(timer);
    }
  }, [poppingWordId]);

  // 泡泡爆破回调 - 发射粒子 + 播放爆破音
  const handleBubblePop = useCallback((x: number, y: number, difficulty: number, size: number) => {
    emitExplosion(x, y, difficulty, size);
    playBubblePop(difficulty);
  }, []);

  const submitAnswer = useCallback(async () => {
    if (!gameRecordId || !userInput.trim()) return;
    ensureAudio();

    const input = userInput.trim().toLowerCase();
    const matchedWord = remainingWords.find(w => w.english?.toLowerCase() === input);

    if (matchedWord) {
      // 正确 - 子弹出膛音
      playGunshot();

      try {
        const response = await gameService.submitAnswer({
          gameRecordId,
          wordId: matchedWord.id,
          answer: input,
          timeSpent: 0,
        });
        markWordAnswered(matchedWord.id, {
          isCorrect: true,
          score: response.wordScore,
          combo: response.combo,
          maxCombo: response.maxCombo,
        });

        // 连击奖励音
        if (response.combo >= 3) {
          setTimeout(() => playComboBonus(response.combo), 300);
        }

        // 触发连击浮层
        if (response.combo >= 3) {
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          setComboVisible(true);
          const duration = response.combo >= 15 ? 3500 : response.combo >= 10 ? 3000 : response.combo >= 7 ? 2600 : 2200;
          comboTimerRef.current = setTimeout(() => setComboVisible(false), duration);
        }

        if (response.isCompleted) {
          await gameService.endGame({ gameRecordId });
          endGame();
          navigate(`/game/result/${gameRecordId}`, { replace: true });
        }
      } catch (error) {
        message.error((error as Error).message);
      }
    } else {
      // 错误 - 卡壳音 + 上报错误（保留输入框内容）
      playMisfire();
      shakeInput();

      // 上报错误：取当前剩余单词中第一个（最早出现的）作为关联词
      if (gameRecordId && remainingWords.length > 0) {
        const targetWord = remainingWords[0];
        // 记录当前连击数（上报前），用于显示"打断了多少连击"
        const prevCombo = combo;
        try {
          const res = await gameService.reportWrong({
            gameRecordId,
            wordId: targetWord.id,
          });
          // 同步 store 中的 wrongCount 和 combo
          incrementWrong(res.combo);
        } catch {
          // 上报失败时仍在本地记录错误
          incrementWrong(0);
        }
        // 触发失败浮层
        if (missTimerRef.current) clearTimeout(missTimerRef.current);
        setMissBrokenCombo(prevCombo);
        setMissVisible(true);
        const missDuration = prevCombo >= 12 ? 3200 : prevCombo >= 7 ? 2800 : prevCombo >= 3 ? 2400 : 1800;
        missTimerRef.current = setTimeout(() => setMissVisible(false), missDuration);
      }
    }
  }, [gameRecordId, userInput, remainingWords, ensureAudio]);

  const handleQuit = () => {
    Modal.confirm({
      title: '确定退出游戏？',
      content: '退出后当前进度将不会保存',
      okText: '确定退出',
      cancelText: '继续游戏',
      onOk: async () => {
        if (gameRecordId) {
          try { await gameService.endGame({ gameRecordId }); } catch {}
        }
        resetGame();
        navigate(-1);
      },
    });
  };

  const progressPct = totalWords > 0 ? (answeredWordIds.length / totalWords) * 100 : 0;
  const errorPct = totalWords > 0 ? (wrongCount / totalWords) * 100 : 0;

  if (status === 'idle') {
    return (
      <div className="game-page flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  const titleText = sectionInfo
    ? `${sectionInfo.wordBankName} · ${sectionInfo.chapterName} · ${sectionInfo.sectionName}`
    : '单词泡泡';

  return (
    <div className="game-page" onClick={ensureAudio}>
      {/* 连击浮层 */}
      <ComboDisplay combo={combo} visible={comboVisible} />
      {/* 连击失败浮层 */}
      <MissDisplay brokenCombo={missBrokenCombo} visible={missVisible} />

      {/* 顶部状态栏 */}
      <div className="game-topbar">
        <div className="game-topbar-left">
          <div className="game-stat">
            <span className="game-stat-value text-green-400">{score}</span>
            <span className="game-stat-label">得分</span>
          </div>
          <div className="game-stat">
            <span className="game-stat-value text-orange-400">x{combo > 0 ? combo : 1}</span>
            <span className="game-stat-label">连击</span>
          </div>
          <div className="game-stat">
            <span className="game-stat-value text-blue-300">{correctCount}</span>
            <span className="game-stat-label">命中</span>
          </div>
        </div>

        <div className="game-topbar-center">
          <span className="game-title">{titleText}</span>
        </div>

        <div className="game-topbar-right">
          <div className="game-stat">
            <span className="game-stat-value text-yellow-300">{remainingTime}</span>
            <span className="game-stat-label">剩余时间</span>
          </div>
          <div className="game-stat">
            <span className="game-stat-value text-red-400">{wrongCount}</span>
            <span className="game-stat-label">错误</span>
          </div>
          <button className="game-quit-btn" onClick={handleQuit}>
            <LogoutOutlined /> 退出
          </button>
          {/* 设置按钮 */}
          <div className="game-settings-wrapper" ref={settingsRef}>
            <button
              className="game-settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="游戏设置"
            >
              <SettingOutlined />
            </button>
            {showSettings && (
              <div className="game-settings-panel">
                <div className="game-settings-title">游戏设置</div>
                {/* 音效开关 */}
                <div className="game-settings-row">
                  <span className="game-settings-row-label">
                    {sfxEnabled ? <SoundOutlined /> : <MutedOutlined />}
                    <span>游戏音效</span>
                  </span>
                  <button
                    className={classNames('game-settings-toggle', { active: sfxEnabled })}
                    onClick={handleToggleSound}
                  >
                    <span className="game-settings-toggle-knob" />
                  </button>
                </div>
                {/* 音量滑块 */}
                <div className="game-settings-row">
                  <span className="game-settings-row-label">
                    <span>音量</span>
                  </span>
                  <div className="game-settings-slider-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="game-settings-slider"
                      disabled={!sfxEnabled}
                    />
                    <span className="game-settings-volume-pct">{Math.round(volume * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="game-progress-bar">
        <div className="game-progress-fill-green" style={{ width: `${progressPct}%` }} />
        <div className="game-progress-fill-red" style={{ width: `${errorPct}%`, left: `${progressPct}%` }} />
      </div>

      {/* 泡泡区域 */}
      <div className="game-bubble-area">
        {remainingWords.map((word, index) => (
          <Bubble
            key={word.id}
            word={word}
            index={index}
            isPopping={word.id === poppingWordId}
            mode={mode}
            totalCount={remainingWords.length}
            onPop={handleBubblePop}
          />
        ))}

        {remainingWords.length === 0 && status === 'playing' && (
          <div className="text-white text-xl text-center absolute inset-0 flex items-center justify-center">
            🎉 太棒了！所有单词都消除了！
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="game-input-area">
        <GameInput
          value={userInput}
          onChange={(v) => { ensureAudio(); setUserInput(v); }}
          onSubmit={submitAnswer}
          isShaking={isInputShaking}
          disabled={status !== 'playing'}
        />
      </div>
    </div>
  );
};

export default GamePage;