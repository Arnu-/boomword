import { useState, useEffect } from 'react';
import { Form, Input, Button, message, InputNumber, Modal, Progress } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

// ─── 类型定义 ───────────────────────────────────────────────────────────────

interface GameRecord {
  id: string;
  mode: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  maxCombo: number;
  accuracy: number;
  createdAt: string;
  section?: { name: string; chapter?: { name: string; wordBank?: { name: string } } };
}

interface GameStats {
  totalGames: number;
  totalScore: number;
  highestScore: number;
  highestCombo: number;
  averageAccuracy: number;
}

interface RankingItem {
  rank: number;
  userId: string;
  nickname: string;
  avatar?: string;
  score: number;
}

interface WordBankProgress {
  name: string;
  percent: number;
  color: string;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const getModeLabel = (mode: string) => {
  const map: Record<string, string> = {
    practice: '练习模式',
    challenge: '限时挑战',
    speed: '极速模式',
  };
  return map[mode] || mode;
};

const getModeIcon = (mode: string) => {
  const map: Record<string, string> = { practice: '📚', challenge: '⏱️', speed: '⚡' };
  return map[mode] || '🎮';
};

const getRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  return `${days}天前`;
};

const TIPS = [
  '🧠 联想记忆：将新单词与已知单词联系起来，建立记忆网络',
  '🔁 间隔重复：每隔一段时间复习，记忆效果更持久',
  '📖 语境学习：在句子中学习单词，理解更深刻',
  '🎵 音节拆分：把长单词拆成音节，更容易记住',
  '✍️ 动手书写：手写单词能激活更多记忆通道',
];

const DAILY_WORDS = [
  { word: 'wanderlust', phonetic: '/ˈwɒndəlʌst/', meaning: '旅行的渴望' },
  { word: 'serendipity', phonetic: '/ˌserənˈdɪpɪti/', meaning: '意外发现美好事物的能力' },
  { word: 'ephemeral', phonetic: '/ɪˈfemərəl/', meaning: '短暂的，瞬息的' },
  { word: 'resilience', phonetic: '/rɪˈzɪliəns/', meaning: '韧性，恢复力' },
  { word: 'luminous', phonetic: '/ˈluːmɪnəs/', meaning: '发光的，明亮的' },
];

const RANK_AVATARS = ['🦁', '🐯', '🦊', '🐺', '🦝'];

// ─── 子组件 ──────────────────────────────────────────────────────────────────

const StatBadge = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <div className="profile-stat-badge">
    <span className="profile-stat-value" style={{ color }}>{value}</span>
    <span className="profile-stat-label">{label}</span>
  </div>
);

const SectionCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="profile-section-card">
    <div className="profile-section-header">
      <span className="profile-section-icon">{icon}</span>
      <span className="profile-section-title">{title}</span>
    </div>
    {children}
  </div>
);

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [dailyWord] = useState(() => DAILY_WORDS[new Date().getDay() % DAILY_WORDS.length]);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  // 模拟词库进度（实际可从 API 获取）
  const wordBankProgress: WordBankProgress[] = [
    { name: '日常词汇', percent: 35, color: '#6366f1' },
    { name: '八年级词汇', percent: 20, color: '#06b6d4' },
    { name: '四级词汇', percent: 10, color: '#10b981' },
    { name: '六级词汇', percent: 5, color: '#f59e0b' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, statsRes, rankRes] = await Promise.allSettled([
          api.get('/game/history?limit=5'),
          api.get('/game/stats'),
          api.get('/rankings?type=total&pageSize=5'),
        ]);
        if (historyRes.status === 'fulfilled') {
          setGameHistory((historyRes.value as any)?.records || []);
        }
        if (statsRes.status === 'fulfilled') {
          setGameStats(statsRes.value as any);
        }
        if (rankRes.status === 'fulfilled') {
          setRankings((rankRes.value as any)?.list || []);
        }
      } catch (_) {}
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (values: { nickname: string; dailyGoal: number }) => {
    setLoading(true);
    try {
      await api.put('/users/me', values);
      updateUser(values);
      message.success('个人信息已更新');
      setShowEditModal(false);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    setPasswordLoading(true);
    try {
      await api.put('/users/me/password', values);
      message.success('密码修改成功');
      passwordForm.resetFields();
      setShowPasswordModal(false);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const levelTitle = () => {
    const lv = user?.level || 1;
    if (lv <= 5) return '初学者';
    if (lv <= 15) return '入门学徒';
    if (lv <= 30) return '词汇达人';
    if (lv <= 50) return '单词高手';
    return '词汇王者';
  };

  const avatarUrl = user?.avatar
    ? user.avatar
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'user'}&backgroundColor=6366f1`;

  return (
    <div className="profile-page">
      {/* ── 顶部用户横幅 ── */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div className="profile-avatar-wrap">
            <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
            <div className="profile-avatar-ring" />
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-hero-name">{user?.nickname || 'User'}</h2>
            <p className="profile-hero-handle">@{user?.nickname?.toLowerCase() || 'user'}</p>
            <div className="profile-hero-stats">
              <StatBadge value={user?.experience || 0} label="总积分" color="#a78bfa" />
              <div className="profile-stat-divider" />
              <StatBadge value={user?.level || 1} label="等级" color="#60a5fa" />
              <div className="profile-stat-divider" />
              <StatBadge value={gameStats?.totalGames || 0} label="对局数" color="#34d399" />
            </div>
          </div>
          <div className="profile-hero-actions">
            <button className="profile-btn-edit" onClick={() => setShowEditModal(true)}>
              ✏️ 编辑资料
            </button>
            <button className="profile-btn-pwd" onClick={() => setShowPasswordModal(true)}>
              🔒 修改密码
            </button>
          </div>
        </div>
        <div className="profile-hero-badge">
          <span className="profile-level-badge">Lv.{user?.level || 1}</span>
          <span className="profile-title-badge">{levelTitle()}</span>
        </div>
      </div>

      {/* ── 主体内容 ── */}
      <div className="profile-body">
        {/* 左侧主内容 */}
        <div className="profile-main">
          {/* 学习进度 */}
          <SectionCard title="学习进度" icon="📝">
            <div className="profile-progress-list">
              {wordBankProgress.map((wb) => (
                <div key={wb.name} className="profile-progress-item">
                  <div className="profile-progress-meta">
                    <span className="profile-progress-name">{wb.name}</span>
                    <span className="profile-progress-pct" style={{ color: wb.color }}>{wb.percent}%</span>
                  </div>
                  <Progress
                    percent={wb.percent}
                    showInfo={false}
                    strokeColor={wb.color}
                    trailColor="rgba(255,255,255,0.08)"
                    strokeWidth={6}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 近期战绩 */}
          <SectionCard title="近期战绩" icon="🎯">
            {gameHistory.length === 0 ? (
              <div className="profile-empty">暂无游戏记录，快去挑战吧！</div>
            ) : (
              <div className="profile-record-list">
                {gameHistory.map((rec) => (
                  <div key={rec.id} className="profile-record-item">
                    <div className="profile-record-left">
                      <span className="profile-record-icon">{getModeIcon(rec.mode)}</span>
                      <div>
                        <div className="profile-record-mode">{getModeLabel(rec.mode)}</div>
                        <div className="profile-record-time">{getRelativeTime(rec.createdAt)}</div>
                      </div>
                    </div>
                    <div className="profile-record-score">{rec.score}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 游戏统计 */}
          {gameStats && (
            <SectionCard title="游戏统计" icon="📊">
              <div className="profile-stats-grid">
                {[
                  { label: '最高分', value: gameStats.highestScore, icon: '🏆' },
                  { label: '最高连击', value: gameStats.highestCombo, icon: '⚡' },
                  { label: '平均正确率', value: `${gameStats.averageAccuracy}%`, icon: '🎯' },
                  { label: '总对局', value: gameStats.totalGames, icon: '🎮' },
                ].map((s) => (
                  <div key={s.label} className="profile-stats-item">
                    <span className="profile-stats-icon">{s.icon}</span>
                    <span className="profile-stats-val">{s.value}</span>
                    <span className="profile-stats-lbl">{s.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* 右侧边栏 */}
        <div className="profile-sidebar">
          {/* 每日一词 */}
          <div className="profile-daily-word">
            <div className="profile-sidebar-header">
              <span>📖</span> 每日一词
            </div>
            <div className="profile-word-text">{dailyWord.word}</div>
            <div className="profile-word-phonetic">{dailyWord.phonetic}</div>
            <div className="profile-word-meaning">{dailyWord.meaning}</div>
            <button className="profile-word-btn">🎓 学习这个词</button>
          </div>

          {/* 今日热榜 */}
          <div className="profile-ranking-card">
            <div className="profile-sidebar-header">
              <span>🔥</span> 今日热榜
            </div>
            {rankings.length === 0 ? (
              // 占位数据
              [
                { rank: 1, nickname: '星辰大海', score: 8888 },
                { rank: 2, nickname: '词汇王者', score: 7654 },
                { rank: 3, nickname: '泡泡猎手', score: 6543 },
                { rank: 4, nickname: '学霸小明', score: 5432 },
                { rank: 5, nickname: '彩虹战士', score: 4321 },
              ].map((item, i) => (
                <div key={item.rank} className={`profile-rank-item ${item.rank <= 3 ? 'top3' : ''}`}>
                  <span className="profile-rank-no">{item.rank}</span>
                  <span className="profile-rank-avatar">{RANK_AVATARS[i]}</span>
                  <span className="profile-rank-name">{item.nickname}</span>
                  <span className="profile-rank-score">{item.score}</span>
                </div>
              ))
            ) : (
              rankings.map((item, i) => (
                <div key={item.userId} className={`profile-rank-item ${item.rank <= 3 ? 'top3' : ''}`}>
                  <span className="profile-rank-no">{item.rank}</span>
                  <span className="profile-rank-avatar">{RANK_AVATARS[i] || '🎮'}</span>
                  <span className="profile-rank-name">{item.nickname}</span>
                  <span className="profile-rank-score">{item.score}</span>
                </div>
              ))
            )}
          </div>

          {/* 学习小贴士 */}
          <div className="profile-tip-card">
            <div className="profile-sidebar-header">
              <span>💡</span> 学习小贴士
            </div>
            <p className="profile-tip-text">{tip}</p>
            <div className="profile-tip-footer">by With · 通过自然语言生成</div>
          </div>
        </div>
      </div>

      {/* ── 编辑资料弹窗 ── */}
      <Modal
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        title="编辑个人资料"
        className="profile-modal"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ nickname: user?.nickname, dailyGoal: user?.dailyGoal || 50 }}
          onFinish={handleUpdateProfile}
        >
          <Form.Item name="nickname" label="昵称" rules={[{ required: true }, { min: 2, max: 20 }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="dailyGoal" label="每日挑战目标（单词数）" rules={[{ required: true }]}>
            <InputNumber min={10} max={500} step={10} className="w-full" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 修改密码弹窗 ── */}
      <Modal
        open={showPasswordModal}
        onCancel={() => setShowPasswordModal(false)}
        footer={null}
        title="修改密码"
        className="profile-modal"
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次密码输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading} block>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
