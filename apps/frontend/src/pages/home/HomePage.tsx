import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import {
  ClockCircleOutlined,
  RetweetOutlined,
  CoffeeOutlined,
  ThunderboltFilled,
  TrophyFilled,
  RightOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useLearningStore } from '@/stores/learningStore';
import { gameService } from '@/services/gameService';
import api from '@/services/api';
import RightSidebar from '@/components/RightSidebar';

const HomePage = () => {
  const navigate = useNavigate();
  const { todayStats, setOverview, setTodayStats, setDailyGoal } = useLearningStore();
  const [loading, setLoading] = useState(true);
  const [quickStartLoading, setQuickStartLoading] = useState<'practice' | 'challenge' | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const data = await api.get('/learning/overview');
      setOverview(data.statistics);
      setTodayStats(data.today);

      const goalData = await api.get('/learning/daily-goal');
      setDailyGoal(goalData);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = async (mode: 'practice' | 'challenge') => {
    setQuickStartLoading(mode);
    try {
      const nextSection = await gameService.getNextSection(mode);
      if (!nextSection) {
        message.warning('暂无可用关卡，请先添加词库');
        navigate('/wordbanks');
        return;
      }
      navigate(`/game/${nextSection.sectionId}?mode=${mode}`);
    } catch (error) {
      message.error('获取关卡信息失败，请重试');
    } finally {
      setQuickStartLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="dark-main flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const stats = [
    { label: '今日单词', value: todayStats?.wordsLearned || 0, highlight: false },
    { label: '今日得分', value: todayStats?.score || 0, highlight: true },
    { label: '最高连击', value: 0, highlight: false },
    { label: '正确率', value: '77%', highlight: false },
  ];

  const gameModes = [
    {
      icon: <ClockCircleOutlined style={{ fontSize: 40, color: '#8B949E' }} />,
      title: '限时模式',
      desc: '60秒内尽可能多地消灭泡泡',
    },
    {
      icon: <RetweetOutlined style={{ fontSize: 40, color: '#8B949E' }} />,
      title: '无尽模式',
      desc: '泡泡越来越多，坚持到最后',
    },
    {
      icon: <CoffeeOutlined style={{ fontSize: 40, color: '#8B949E' }} />,
      title: '禅意模式',
      desc: '无压力练习，随时随地学单词',
    },
  ];

  return (
    <>
      {/* 中间主内容区 */}
      <div className="dark-main">
        {/* 英雄区域 */}
        <div className="hero-section">
          <div className="hero-bubbles">
            <div className="hero-bubble hero-bubble-1" />
            <div className="hero-bubble hero-bubble-2" />
            <div className="hero-bubble hero-bubble-3" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
            准备好了吗？
          </h1>
          <p className="text-dark-text-secondary mb-6 relative z-10">
            戳破泡泡，输入单词，赢取高分！
          </p>
          <div className="flex items-center justify-center gap-4 relative z-10">
            {/* 快速开始训练按钮 */}
            <button
              className="quick-start-btn quick-start-practice"
              onClick={() => handleQuickStart('practice')}
              disabled={quickStartLoading !== null}
            >
              {quickStartLoading === 'practice' ? (
                <Spin size="small" />
              ) : (
                <ThunderboltFilled className="quick-start-icon" />
              )}
              <span className="quick-start-text">
                <span className="quick-start-label">快速开始训练</span>
                <span className="quick-start-sub">
                  <BookOutlined /> 练习模式 <RightOutlined />
                </span>
              </span>
            </button>

            {/* 快速开始挑战按钮 */}
            <button
              className="quick-start-btn quick-start-challenge"
              onClick={() => handleQuickStart('challenge')}
              disabled={quickStartLoading !== null}
            >
              {quickStartLoading === 'challenge' ? (
                <Spin size="small" />
              ) : (
                <TrophyFilled className="quick-start-icon" />
              )}
              <span className="quick-start-text">
                <span className="quick-start-label">快速开始挑战</span>
                <span className="quick-start-sub">
                  <TrophyFilled /> 挑战模式 <RightOutlined />
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* 游戏模式卡片 */}
        <div className="flex gap-4">
          {gameModes.map((mode) => (
            <div key={mode.title} className="mode-card" onClick={() => navigate('/wordbanks')}>
              <div className="mode-card-icon">{mode.icon}</div>
              <div className="text-white font-semibold mb-1">{mode.title}</div>
              <div className="text-dark-text-secondary text-xs leading-relaxed">
                {mode.desc}
              </div>
            </div>
          ))}
        </div>

        {/* 数据统计 */}
        <div className="flex gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`stat-card ${stat.highlight ? 'highlight' : ''}`}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧信息栏 */}
      <RightSidebar />
    </>
  );
};

export default HomePage;
