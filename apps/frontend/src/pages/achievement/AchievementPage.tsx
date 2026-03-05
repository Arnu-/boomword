import { useEffect, useState } from 'react';
import { Spin, Progress, Tooltip } from 'antd';
import api from '@/services/api';

// ─── 类型 ────────────────────────────────────────────────────────────────────

interface Achievement {
  code: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number; percentage: number };
}

interface AchievementProgress {
  totalAchievements: number;
  unlockedCount: number;
  percentage: number;
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; gradient: string }> = {
  combo:           { label: '连击达人', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b22,#ef444422)' },
  total_score:     { label: '得分高手', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f122,#8b5cf622)' },
  words_mastered:  { label: '词汇积累', color: '#10b981', gradient: 'linear-gradient(135deg,#10b98122,#06b6d422)' },
  streak_days:     { label: '连续挑战', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec489922,#f43f5e22)' },
  perfect_games:   { label: '完美游戏', color: '#a78bfa', gradient: 'linear-gradient(135deg,#a78bfa22,#6366f122)' },
  total_games:     { label: '游戏次数', color: '#38bdf8', gradient: 'linear-gradient(135deg,#38bdf822,#06b6d422)' },
  wordbank_completed: { label: '词库完成', color: '#fb923c', gradient: 'linear-gradient(135deg,#fb923c22,#f59e0b22)' },
};

const DAILY_WORDS = [
  { word: 'wanderlust',  phonetic: '/ˈwɒndəlʌst/',    meaning: '旅行的渴望' },
  { word: 'serendipity', phonetic: '/ˌserənˈdɪpɪti/', meaning: '意外发现美好事物的能力' },
  { word: 'ephemeral',   phonetic: '/ɪˈfemərəl/',     meaning: '短暂的，瞬息的' },
  { word: 'resilience',  phonetic: '/rɪˈzɪliəns/',    meaning: '韧性，恢复力' },
  { word: 'luminous',    phonetic: '/ˈluːmɪnəs/',     meaning: '发光的，明亮的' },
];

const TIPS = [
  '🧠 联想记忆：将新单词与已知单词联系起来，建立记忆网络',
  '🔁 间隔重复：每隔一段时间复习，记忆效果更持久',
  '📖 语境学习：在句子中学习单词，理解更深刻',
  '🎵 音节拆分：把长单词拆成音节，更容易记住',
  '✍️ 动手书写：手写单词能激活更多记忆通道',
];

const RANK_AVATARS = ['🦁', '🐯', '🦊', '🐺', '🦝'];

const MOCK_RANKINGS = [
  { rank: 1, nickname: '星辰大海', score: 8888 },
  { rank: 2, nickname: '词汇王者', score: 7654 },
  { rank: 3, nickname: '泡泡猎手', score: 6543 },
  { rank: 4, nickname: '学霸小明', score: 5432 },
  { rank: 5, nickname: '彩虹战士', score: 4321 },
];

// ─── 成就卡片 ─────────────────────────────────────────────────────────────────

const AchievementCard = ({ item }: { item: Achievement }) => {
  const unlocked = item.isUnlocked;

  return (
    <Tooltip
      title={
        unlocked
          ? `🎉 已解锁！${item.unlockedAt ? ' · ' + new Date(item.unlockedAt).toLocaleDateString() : ''}`
          : `进度：${item.progress.current} / ${item.progress.target}`
      }
      placement="top"
    >
      <div className={`ach-card ${unlocked ? 'ach-card--unlocked' : 'ach-card--locked'}`}>
        {/* 解锁光晕 */}
        {unlocked && <div className="ach-card-glow" />}

        {/* 图标区 */}
        <div className="ach-icon-wrap">
          {unlocked ? (
            <span className="ach-icon-emoji">{item.icon}</span>
          ) : (
            <span className="ach-icon-locked">{item.icon}</span>
          )}
          {unlocked && <div className="ach-icon-ring" />}
        </div>

        {/* 文字 */}
        <div className="ach-name">{item.name}</div>
        <div className="ach-desc">{item.description}</div>

        {/* 底部状态 */}
        {unlocked ? (
          <div className="ach-badge-unlocked">✓ 已解锁</div>
        ) : (
          <div className="ach-progress-wrap">
            <Progress
              percent={item.progress.percentage}
              showInfo={false}
              strokeColor="#6366f1"
              trailColor="rgba(255,255,255,0.08)"
              strokeWidth={4}
            />
            <span className="ach-progress-text">
              {item.progress.current}/{item.progress.target}
            </span>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const AchievementPage = () => {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [overallProgress, setOverallProgress] = useState<AchievementProgress | null>(null);
  const [activeType, setActiveType] = useState<string>('all');
  const [rankings] = useState(MOCK_RANKINGS);

  const dailyWord = DAILY_WORDS[new Date().getDay() % DAILY_WORDS.length];
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [achData, progData] = await Promise.allSettled([
          api.get('/achievements'),
          api.get('/achievements/progress'),
        ]);
        if (achData.status === 'fulfilled') setAchievements(achData.value as Achievement[]);
        if (progData.status === 'fulfilled') setOverallProgress(progData.value as AchievementProgress);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // 分组
  const types = ['all', ...Array.from(new Set(achievements.map((a) => a.type)))];
  const filtered = activeType === 'all' ? achievements : achievements.filter((a) => a.type === activeType);

  // 按解锁状态排序：已解锁在前
  const sorted = [...filtered].sort((a, b) => {
    if (a.isUnlocked === b.isUnlocked) return 0;
    return a.isUnlocked ? -1 : 1;
  });

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="ach-page">
      {/* ── 主内容区 ── */}
      <div className="ach-main">
        {/* 标题区 */}
        <div className="ach-header">
          <div>
            <h1 className="ach-title">🏆 个人成就</h1>
            <p className="ach-subtitle">解锁成就，展示你的实力！</p>
          </div>
          {/* 总进度环 */}
          {overallProgress && (
            <div className="ach-overall">
              <div className="ach-overall-ring">
                <Progress
                  type="circle"
                  percent={overallProgress.percentage}
                  width={72}
                  strokeColor={{ '0%': '#6366f1', '100%': '#06b6d4' }}
                  trailColor="rgba(255,255,255,0.08)"
                  format={(p) => (
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{p}%</span>
                  )}
                />
              </div>
              <div className="ach-overall-text">
                <span className="ach-overall-count">{unlockedCount}</span>
                <span className="ach-overall-total">/ {overallProgress.totalAchievements}</span>
                <span className="ach-overall-label">已解锁</span>
              </div>
            </div>
          )}
        </div>

        {/* 分类 Tab */}
        <div className="ach-tabs">
          {types.map((t) => {
            const meta = TYPE_META[t];
            const cnt = t === 'all' ? achievements.length : achievements.filter((a) => a.type === t).length;
            return (
              <button
                key={t}
                className={`ach-tab ${activeType === t ? 'ach-tab--active' : ''}`}
                onClick={() => setActiveType(t)}
                style={activeType === t && meta ? { borderColor: meta.color, color: meta.color } : {}}
              >
                {t === 'all' ? '全部' : (meta?.label || t)}
                <span className="ach-tab-cnt">{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* 成就网格 */}
        <div className="ach-grid">
          {sorted.map((item) => (
            <AchievementCard key={item.code} item={item} />
          ))}
          {sorted.length === 0 && (
            <div className="ach-empty">暂无成就数据</div>
          )}
        </div>
      </div>

      {/* ── 右侧边栏 ── */}
      <div className="ach-sidebar">
        {/* 每日一词 */}
        <div className="profile-daily-word">
          <div className="profile-sidebar-header"><span>📖</span> 每日一词</div>
          <div className="profile-word-text">{dailyWord.word}</div>
          <div className="profile-word-phonetic">{dailyWord.phonetic}</div>
          <div className="profile-word-meaning">{dailyWord.meaning}</div>
          <button className="profile-word-btn">🎓 学习这个词</button>
        </div>

        {/* 今日热榜 */}
        <div className="profile-ranking-card">
          <div className="profile-sidebar-header"><span>🔥</span> 今日热榜</div>
          {rankings.map((item, i) => (
            <div key={item.rank} className={`profile-rank-item ${item.rank <= 3 ? 'top3' : ''}`}>
              <span className="profile-rank-no">{item.rank}</span>
              <span className="profile-rank-avatar">{RANK_AVATARS[i]}</span>
              <span className="profile-rank-name">{item.nickname}</span>
              <span className="profile-rank-score">{item.score}</span>
            </div>
          ))}
        </div>

        {/* 学习小贴士 */}
        <div className="profile-tip-card">
          <div className="profile-sidebar-header"><span>💡</span> 学习小贴士</div>
          <p className="profile-tip-text">{tip}</p>
          <div className="profile-tip-footer">by With · 通过自然语言生成</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementPage;
