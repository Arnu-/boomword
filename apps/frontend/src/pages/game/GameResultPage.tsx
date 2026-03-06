import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  ReloadOutlined,
  HomeOutlined,
  RightCircleOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  BookOutlined,
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

      setTimeout(() => setShowCard(true), 100);

      // 挑战模式才触发烟花
      if (data.mode === 'challenge') {
        if (data.stars === 3) {
          setTimeout(() => {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }, 400);
        }
        // 关卡最后一节通关烟花
        if (!data.nextSection && data.stars >= 1) {
          setTimeout(() => {
            confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 } });
            setTimeout(() => {
              confetti({ particleCount: 80, spread: 60, origin: { x: 0.2, y: 0.6 } });
              confetti({ particleCount: 80, spread: 60, origin: { x: 0.8, y: 0.6 } });
            }, 300);
          }, 500);
        }
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

  const isPractice = record?.mode === 'practice';

  // 根据模式和表现选择 emoji 和标语
  const getResultMotto = () => {
    if (!record) return { emoji: '💪', text: '继续加油！' };
    if (isPractice) {
      if (accuracy >= 100) return { emoji: '📖', text: '练习完美！' };
      if (accuracy >= 80) return { emoji: '📖', text: '练习不错！' };
      return { emoji: '📖', text: '练习完成！' };
    }
    // 挑战模式
    if (!record.nextSection && record.stars >= 1) return { emoji: '🏆', text: '恭喜通关！' };
    if (record.stars === 3) return { emoji: '🌟', text: '完美通关！' };
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
  const isChapterComplete = !isPractice && !record.nextSection && record.stars >= 1;

  return (
    <div className="game-result-page">
      <div className={`game-result-card ${showCard ? 'game-result-card-show' : ''}`}>

        {/* 模式标签 */}
        <div className="game-result-mode-badge">
          {isPractice ? (
            <span className="game-result-mode-badge-practice">
              <BookOutlined /> 练习模式
            </span>
          ) : (
            <span className="game-result-mode-badge-challenge">
              <ThunderboltOutlined /> 挑战模式
            </span>
          )}
        </div>

        {/* 通关横幅（仅挑战模式最后一节） */}
        {isChapterComplete && (
          <div className="game-result-chapter-complete">
            <TrophyOutlined className="game-result-chapter-trophy" />
            <span>本关全部完成</span>
          </div>
        )}

        {/* 标语 */}
        <div className="game-result-motto">
          <span className="game-result-emoji">{motto.emoji}</span>
          <span>{motto.text}</span>
        </div>

        {/* 得分区域：挑战模式显示分数，训练模式显示正确率 */}
        {isPractice ? (
          <div className="game-result-practice-accuracy">
            <div className="game-result-score-label">正确率</div>
            <div className="game-result-score" style={{ color: accuracy >= 80 ? '#00b894' : accuracy >= 60 ? '#fdcb6e' : '#e17055' }}>
              {accuracy}%
            </div>
          </div>
        ) : (
          <>
            <div className="game-result-score-label">本局得分</div>
            <div className="game-result-score">{record.score}</div>
          </>
        )}

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
          {!isPractice && (
            <div className="game-result-stat">
              <span className="game-result-stat-value text-green-400">{accuracy}%</span>
              <span className="game-result-stat-label">正确率</span>
            </div>
          )}
        </div>

        {/* 训练模式提示：切换挑战模式可解锁 */}
        {isPractice && (
          <div className="game-result-practice-tip">
            <ThunderboltOutlined style={{ color: '#f39c12', marginRight: 6 }} />
            <span>切换<strong>挑战模式</strong>完成后可解锁下一节并计入排行榜</span>
          </div>
        )}

        {/* 挑战模式：下一节提示条 */}
        {!isPractice && record.nextSection && (
          <div className="game-result-next-hint">
            <span className="game-result-next-label">下一节</span>
            <span className="game-result-next-name">{record.nextSection.name}</span>
            <span className="game-result-next-count">{record.nextSection.wordCount} 词</span>
          </div>
        )}

        {/* 按钮区域 */}
        <div className="game-result-actions">
          {/* 挑战模式：下一节按钮 */}
          {!isPractice && record.nextSection && (
            <button
              className="game-result-btn game-result-btn-next"
              onClick={() => navigate(`/game/${record.nextSection!.id}?mode=${record.mode}`)}
            >
              <RightCircleOutlined /> 下一节
            </button>
          )}

          {/* 训练模式：切换挑战模式按钮 */}
          {isPractice && (
            <button
              className="game-result-btn game-result-btn-challenge"
              onClick={() => navigate(`/game/${record.section.id}?mode=challenge`)}
            >
              <ThunderboltOutlined /> 切换挑战模式
            </button>
          )}

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
