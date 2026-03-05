import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  ReloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { gameService, GameRecord } from '@/services/gameService';
import confetti from 'canvas-confetti';

const GameResultPage = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (recordId) {
      fetchGameRecord();
    }
  }, [recordId]);

  const fetchGameRecord = async () => {
    try {
      const data = await gameService.getGameRecord(recordId!);
      setRecord(data);

      // 延迟弹出卡片
      setTimeout(() => setShowCard(true), 100);

      if (data.stars === 3) {
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 400);
      }
    } catch (error) {
      console.error('获取游戏记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAttempts = record ? (record.correctCount + record.wrongCount) : 0;
  const accuracy = totalAttempts > 0
    ? Math.round((record!.correctCount / totalAttempts) * 100)
    : 0;

  // 根据表现选择 emoji 和标语
  const getResultMotto = () => {
    if (!record) return { emoji: '💪', text: '继续加油！' };
    if (record.stars === 3) return { emoji: '🏆', text: '完美通关！' };
    if (record.stars === 2) return { emoji: '🎉', text: '表现不错！' };
    if (record.stars === 1) return { emoji: '👍', text: '再接再厉！' };
    return { emoji: '💪', text: '继续加油！' };
  };

  if (loading) {
    return (
      <div className="game-result-page">
        <Spin size="large" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="game-result-page">
        <div style={{ color: '#E6EDF3', fontSize: 18 }}>游戏记录不存在</div>
      </div>
    );
  }

  const motto = getResultMotto();

  return (
    <div className="game-result-page">
      {/* 弹窗卡片 */}
      <div className={`game-result-card ${showCard ? 'game-result-card-show' : ''}`}>
        {/* 标语 */}
        <div className="game-result-motto">
          <span className="game-result-emoji">{motto.emoji}</span>
          <span>{motto.text}</span>
        </div>

        {/* 本局得分 */}
        <div className="game-result-score-label">本局得分</div>
        <div className="game-result-score">{record.score}</div>

        {/* 统计行 */}
        <div className="game-result-stats">
          <div className="game-result-stat">
            <span className="game-result-stat-value text-blue-300">{record.correctCount}</span>
            <span className="game-result-stat-label">命中</span>
          </div>
          <div className="game-result-stat">
            <span className="game-result-stat-value text-red-400">{record.wrongCount}</span>
            <span className="game-result-stat-label">错误</span>
          </div>
          <div className="game-result-stat">
            <span className="game-result-stat-value text-orange-400">{record.maxCombo}</span>
            <span className="game-result-stat-label">最高连击</span>
          </div>
          <div className="game-result-stat">
            <span className="game-result-stat-value text-green-400">{accuracy}%</span>
            <span className="game-result-stat-label">正确率</span>
          </div>
        </div>

        {/* 按钮 */}
        <div className="game-result-actions">
          <button
            className="game-result-btn game-result-btn-primary"
            onClick={() => navigate(`/game/${record.section.id}?mode=${record.mode}`)}
          >
            <ReloadOutlined /> 再来一局
          </button>
          <button
            className="game-result-btn game-result-btn-secondary"
            onClick={() => navigate('/')}
          >
            <HomeOutlined /> 返回主页
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultPage;