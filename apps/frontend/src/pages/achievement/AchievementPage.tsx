import { useEffect, useState } from 'react';
import { Card, Progress, Spin, Empty, Row, Col, Tag, Tooltip } from 'antd';
import { TrophyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '@/services/api';

interface Achievement {
  code: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface AchievementProgress {
  totalAchievements: number;
  unlockedCount: number;
  percentage: number;
}

const AchievementPage = () => {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const [achievementsData, progressData] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/progress'),
      ]);
      setAchievements(achievementsData);
      setProgress(progressData);
    } catch (error) {
      console.error('获取成就数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByType = (achievements: Achievement[]) => {
    const groups: Record<string, Achievement[]> = {};
    achievements.forEach((a) => {
      if (!groups[a.type]) {
        groups[a.type] = [];
      }
      groups[a.type].push(a);
    });
    return groups;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      words_mastered: '单词掌握',
      streak_days: '连续挑战',
      total_score: '累计得分',
      perfect_games: '满星游戏',
      total_games: '游戏次数',
      wordbank_completed: '词库完成',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const groupedAchievements = groupByType(achievements);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrophyOutlined className="text-yellow-500" />
          成就
        </h1>
      </div>

      {/* 总进度 */}
      {progress && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-gray-500">成就进度</div>
              <div className="text-2xl font-bold">
                {progress.unlockedCount} / {progress.totalAchievements}
              </div>
            </div>
            <div className="text-4xl font-bold text-primary-600">
              {progress.percentage}%
            </div>
          </div>
          <Progress
            percent={progress.percentage}
            status="active"
            strokeColor={{
              '0%': '#3b82f6',
              '100%': '#22c55e',
            }}
          />
        </Card>
      )}

      {/* 成就列表 */}
      {Object.entries(groupedAchievements).map(([type, items]) => (
        <Card key={type} title={getTypeLabel(type)}>
          <Row gutter={[16, 16]}>
            {items.map((achievement) => (
              <Col key={achievement.code} xs={24} sm={12} md={8} lg={6}>
                <Card
                  size="small"
                  className={`${
                    achievement.isUnlocked
                      ? 'border-green-200 bg-green-50'
                      : 'opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {achievement.isUnlocked ? (
                        achievement.icon
                      ) : (
                        <LockOutlined className="text-gray-400" />
                      )}
                    </div>
                    <div className="font-bold">{achievement.name}</div>
                    <Tooltip title={achievement.description}>
                      <div className="text-gray-500 text-sm truncate">
                        {achievement.description}
                      </div>
                    </Tooltip>
                    {achievement.isUnlocked ? (
                      <Tag color="green" className="mt-2">
                        <CheckCircleOutlined /> 已解锁
                      </Tag>
                    ) : (
                      <div className="mt-2">
                        <Progress
                          percent={achievement.progress.percentage}
                          size="small"
                          format={() =>
                            `${achievement.progress.current}/${achievement.progress.target}`
                          }
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ))}

      {achievements.length === 0 && (
        <Empty description="暂无成就数据" />
      )}
    </div>
  );
};

export default AchievementPage;
