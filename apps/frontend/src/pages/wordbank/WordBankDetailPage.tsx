import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Spin, Modal, Tag } from 'antd';
import {
  LockOutlined,
  StarFilled,
  StarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { wordBankService, WordBankProgress } from '@/services/wordBankService';
import RightSidebar from '@/components/RightSidebar';

type GameMode = 'practice' | 'challenge';

// 关卡图标（根据解锁/完成状态和索引显示不同图标）
const chapterIcons = ['🌟', '🔥', '💎', '🏆', '⚡', '🎯', '🌈', '🚀', '👑', '🎮'];

const WordBankDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<WordBankProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWordBankProgress();
    }
  }, [id]);

  const fetchWordBankProgress = async () => {
    try {
      const response = await wordBankService.getWordBankProgress(id!);
      setData(response);
    } catch (error) {
      console.error('获取词库信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter: WordBankProgress['chapters'][0]) => {
    // 找到第一个未锁定的 section 来开始
    const firstUnlocked = chapter.sections.find((s) => s.isUnlocked);
    if (firstUnlocked) {
      setSelectedSection(firstUnlocked.id);
      setModeModalVisible(true);
    }
  };

  const startGame = (mode: GameMode) => {
    setModeModalVisible(false);
    navigate(`/game/${selectedSection}?mode=${mode}`);
  };

  const renderStars = (stars: number, max = 3) => {
    return (
      <div className="flex gap-1 justify-center">
        {Array.from({ length: max }).map((_, i) =>
          i < stars ? (
            <StarFilled key={i} style={{ color: '#FFD700', fontSize: 14 }} />
          ) : (
            <StarOutlined key={i} style={{ color: '#8B949E', fontSize: 14 }} />
          )
        )}
      </div>
    );
  };

  // 判断章节是否解锁（至少有一个 section 解锁）
  const isChapterUnlocked = (chapter: WordBankProgress['chapters'][0]) => {
    return chapter.sections.some((s) => s.isUnlocked);
  };

  // 判断章节是否完成（所有 section 完成）
  const isChapterCompleted = (chapter: WordBankProgress['chapters'][0]) => {
    return chapter.sections.length > 0 && chapter.sections.every((s) => s.isCompleted);
  };

  // 获取章节总星数
  const getChapterStars = (chapter: WordBankProgress['chapters'][0]) => {
    return chapter.sections.reduce((sum, s) => sum + s.stars, 0);
  };

  if (loading) {
    return (
      <>
        <div className="dark-main flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
        <RightSidebar />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="dark-main">
          <div className="text-dark-text-secondary">词库不存在</div>
        </div>
        <RightSidebar />
      </>
    );
  }

  return (
    <>
      <div className="dark-main">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/wordbanks"
            className="text-dark-text-secondary hover:text-dark-text transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <AppstoreOutlined /> 词库
          </Link>
          <span className="text-dark-text-secondary">{'>'}</span>
          <span className="text-dark-accent-light">
            {chapterIcons[0]} {data.wordBank.name}
          </span>
        </div>

        {/* 词库标题区 */}
        <div>
          <h1 className="text-2xl font-bold text-dark-text flex items-center gap-2">
            {chapterIcons[0]} {data.wordBank.name}
          </h1>
          <p className="text-dark-text-secondary mt-1 text-sm">
            {data.wordBank.description || '精选词汇'} · 共 {data.chapters.length} 关
          </p>
        </div>

        {/* 进度概览 */}
        <div className="flex gap-4">
          <div className="stat-card" style={{ flex: 'none', width: 'auto', padding: '12px 24px' }}>
            <div className="stat-value text-lg">{data.progress.completedSections}/{data.progress.totalSections}</div>
            <div className="stat-label text-xs">已过关</div>
          </div>
          <div className="stat-card" style={{ flex: 'none', width: 'auto', padding: '12px 24px' }}>
            <div className="stat-value text-lg">{data.progress.totalStars}/{data.progress.maxStars}</div>
            <div className="stat-label text-xs">星星</div>
          </div>
          <div className="stat-card highlight" style={{ flex: 'none', width: 'auto', padding: '12px 24px' }}>
            <div className="stat-value text-lg">{data.progress.percentage}%</div>
            <div className="stat-label text-xs">完成度</div>
          </div>
          <div className="stat-card" style={{ flex: 'none', width: 'auto', padding: '12px 24px' }}>
            <div className="stat-value text-lg">{data.wordBank.totalWords}</div>
            <div className="stat-label text-xs">总单词</div>
          </div>
        </div>

        {/* 关卡网格 */}
        <div className="chapter-grid">
          {data.chapters.map((chapter, index) => {
            const unlocked = isChapterUnlocked(chapter);
            const completed = isChapterCompleted(chapter);
            const stars = getChapterStars(chapter);
            const icon = chapterIcons[index % chapterIcons.length];

            return (
              <div
                key={chapter.id}
                className={`chapter-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
                onClick={() => unlocked && handleChapterClick(chapter)}
              >
                {/* 关卡图标/锁 */}
                <div className="chapter-card-icon">
                  {unlocked ? (
                    <span>{icon}</span>
                  ) : (
                    <LockOutlined style={{ fontSize: 32, color: '#8B949E' }} />
                  )}
                </div>

                {/* 关卡名称 */}
                <div className="chapter-card-title">
                  第{chapter.order}关
                </div>

                {/* 小节数量 */}
                <div className="chapter-card-subtitle">
                  {chapter.sections.length} 个小节
                </div>

                {/* 星级或锁定提示 */}
                {unlocked ? (
                  <div className="mt-1">
                    {renderStars(stars, 3)}
                  </div>
                ) : (
                  <div className="chapter-card-lock-text">
                    <LockOutlined /> 未解锁
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧信息栏 */}
      <RightSidebar />

      {/* 模式选择弹窗 - 暗色主题 */}
      <Modal
        title={null}
        open={modeModalVisible}
        onCancel={() => setModeModalVisible(false)}
        footer={null}
        centered
        className="dark-modal"
        styles={{
          content: {
            background: '#1C2333',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 0,
          },
          mask: {
            background: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <div style={{ padding: '28px 24px 24px' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
            选择游戏模式
          </h3>
          <div className="flex gap-4">
            <div
              className="mode-card"
              onClick={() => startGame('practice')}
              style={{ flex: 1 }}
            >
              <div className="mode-card-icon">📖</div>
              <div className="text-white font-semibold mb-1">练习模式</div>
              <div className="text-dark-text-secondary text-xs leading-relaxed mb-2">
                显示中英文，适合初学
              </div>
              <Tag color="green" style={{ borderRadius: 4 }}>推荐新手</Tag>
            </div>
            <div
              className="mode-card"
              onClick={() => startGame('challenge')}
              style={{ flex: 1 }}
            >
              <div className="mode-card-icon">🎯</div>
              <div className="text-white font-semibold mb-1">挑战模式</div>
              <div className="text-dark-text-secondary text-xs leading-relaxed mb-2">
                只显示中文，测试记忆
              </div>
              <Tag color="orange" style={{ borderRadius: 4 }}>更高分数</Tag>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WordBankDetailPage;
