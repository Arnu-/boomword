import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Progress, Row, Col, Statistic, Button, Spin } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useLearningStore } from '@/stores/learningStore';
import api from '@/services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { overview, todayStats, dailyGoal, setOverview, setTodayStats, setDailyGoal } = useLearningStore();
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              欢迎回来，{user?.nickname}！
            </h1>
            <p className="text-gray-500 mt-1">
              {dailyGoal?.isCompleted
                ? '恭喜完成今日目标！继续保持'
                : `今日目标：${dailyGoal?.completed || 0}/${dailyGoal?.goal || 50}个单词`}
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate('/wordbanks')}
          >
            开始挑战
          </Button>
        </div>
        {dailyGoal && (
          <Progress
            percent={dailyGoal.percentage}
            status={dailyGoal.isCompleted ? 'success' : 'active'}
            className="mt-4"
          />
        )}
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="已掌握单词"
              value={overview?.masteredCount || 0}
              prefix={<BookOutlined className="text-green-500" />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="训练中单词"
              value={overview?.learningCount || 0}
              prefix={<BookOutlined className="text-blue-500" />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="连续挑战"
              value={overview?.streakDays || 0}
              prefix={<FireOutlined className="text-orange-500" />}
              suffix="天"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="今日得分"
              value={todayStats?.score || 0}
              prefix={<TrophyOutlined className="text-yellow-500" />}
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      {/* 今日战绩 */}
      <Card title="今日战绩">
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {todayStats?.wordsLearned || 0}
              </div>
              <div className="text-gray-500">挑战单词数</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {todayStats?.gamesPlayed || 0}
              </div>
              <div className="text-gray-500">游戏次数</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {Math.floor((todayStats?.duration || 0) / 60)}
              </div>
              <div className="text-gray-500">游戏时长(分钟)</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 快捷入口 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card
            className="card-hover cursor-pointer"
            onClick={() => navigate('/wordbanks')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOutlined className="text-2xl text-blue-500" />
              </div>
              <div>
                <div className="font-bold">词库</div>
                <div className="text-gray-500 text-sm">选择词库开始挑战</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className="card-hover cursor-pointer"
            onClick={() => navigate('/ranking')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrophyOutlined className="text-2xl text-yellow-500" />
              </div>
              <div>
                <div className="font-bold">排行榜</div>
                <div className="text-gray-500 text-sm">查看玩家排名</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className="card-hover cursor-pointer"
            onClick={() => navigate('/wrongbook')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <BookOutlined className="text-2xl text-red-500" />
              </div>
              <div>
                <div className="font-bold">错题本</div>
                <div className="text-gray-500 text-sm">复习错误单词</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
