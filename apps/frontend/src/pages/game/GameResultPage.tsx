import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Statistic, Row, Col } from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StarFilled,
  StarOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { gameService, GameRecord } from '@/services/gameService';
import confetti from 'canvas-confetti';

const GameResultPage = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordId) {
      fetchGameRecord();
    }
  }, [recordId]);

  const fetchGameRecord = async () => {
    try {
      const data = await gameService.getGameRecord(recordId!);
      setRecord(data);

      // 满星庆祝动画
      if (data.stars === 3) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error('获取游戏记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex justify-center gap-2 text-4xl">
        {[1, 2, 3].map((i) => (
          i <= stars ? (
            <StarFilled key={i} className="text-yellow-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ) : (
            <StarOutlined key={i} className="text-gray-300" />
          )
        ))}
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <div className="text-white text-xl">游戏记录不存在</div>
      </div>
    );
  }

  const accuracy = record.totalWords > 0
    ? Math.round((record.correctWords / record.totalWords) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">游戏结束</h1>
          
          {/* 星级 */}
          <div className="mb-6">
            {renderStars(record.stars)}
          </div>

          {/* 分数 */}
          <div className="text-5xl font-bold text-primary-600 mb-2">
            {record.score}
          </div>
          <div className="text-gray-500 mb-6">总得分</div>

          {/* 统计数据 */}
          <Row gutter={16} className="mb-6">
            <Col span={8}>
              <Statistic
                title="正确"
                value={record.correctWords}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{ color: '#22c55e' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="错误"
                value={record.wrongWords}
                prefix={<CloseCircleOutlined className="text-red-500" />}
                valueStyle={{ color: '#ef4444' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="正确率"
                value={accuracy}
                suffix="%"
                valueStyle={{ color: accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#f59e0b' : '#ef4444' }}
              />
            </Col>
          </Row>

          <div className="flex items-center justify-center gap-4 text-gray-500 mb-6">
            <div className="flex items-center gap-1">
              <ClockCircleOutlined />
              <span>{formatTime(record.duration)}</span>
            </div>
            <span>|</span>
            <div>
              {record.section.chapter.wordBank.name} - {record.section.name}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              block
            >
              返回首页
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => navigate(`/game/${record.section.id}?mode=${record.mode}`)}
              block
            >
              再来一局
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameResultPage;
