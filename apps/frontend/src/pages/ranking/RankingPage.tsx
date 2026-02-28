import { useEffect, useState } from 'react';
import { Card, Tabs, Table, Avatar, Spin, Tag } from 'antd';
import { TrophyOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import api from '@/services/api';

interface RankingItem {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string | null;
  score: number;
  isCurrentUser: boolean;
}

interface RankingData {
  type: string;
  items: RankingItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MyRank {
  weekly: { rank: number | null; score: number };
  monthly: { rank: number | null; score: number };
  total: { rank: number | null; score: number };
}

const RankingPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState<RankingData | null>(null);
  const [monthlyData, setMonthlyData] = useState<RankingData | null>(null);
  const [totalData, setTotalData] = useState<RankingData | null>(null);
  const [myRank, setMyRank] = useState<MyRank | null>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const [weekly, monthly, total, my] = await Promise.all([
        api.get('/ranking/weekly'),
        api.get('/ranking/monthly'),
        api.get('/ranking/total'),
        api.get('/ranking/my-rank'),
      ]);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setTotalData(total);
      setMyRank(my);
    } catch (error) {
      console.error('获取排行榜失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <CrownOutlined className="text-2xl text-yellow-500" />;
    if (rank === 2) return <CrownOutlined className="text-xl text-gray-400" />;
    if (rank === 3) return <CrownOutlined className="text-lg text-orange-400" />;
    return <span className="text-gray-500">{rank}</span>;
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div className="flex items-center justify-center">
          {getRankIcon(rank)}
        </div>
      ),
    },
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: RankingItem) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span className={record.isCurrentUser ? 'font-bold text-primary-600' : ''}>
            {record.nickname}
            {record.isCurrentUser && <Tag color="blue" className="ml-2">我</Tag>}
          </span>
        </div>
      ),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <span className="font-bold text-orange-500">{score.toLocaleString()}</span>
      ),
    },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'weekly':
        return weeklyData;
      case 'monthly':
        return monthlyData;
      case 'total':
        return totalData;
      default:
        return null;
    }
  };

  const getMyRankInfo = () => {
    if (!myRank) return null;
    switch (activeTab) {
      case 'weekly':
        return myRank.weekly;
      case 'monthly':
        return myRank.monthly;
      case 'total':
        return myRank.total;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const activeData = getActiveData();
  const myRankInfo = getMyRankInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrophyOutlined className="text-yellow-500" />
          排行榜
        </h1>
      </div>

      {/* 我的排名 */}
      {myRankInfo && (
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">我的排名</div>
              <div className="text-3xl font-bold">
                {myRankInfo.rank ? `#${myRankInfo.rank}` : '未上榜'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">我的得分</div>
              <div className="text-3xl font-bold">
                {myRankInfo.score.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 排行榜列表 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'weekly',
            label: '周榜',
            children: (
              <Card>
                <Table
                  dataSource={activeData?.items || []}
                  columns={columns}
                  rowKey="userId"
                  pagination={false}
                  rowClassName={(record) => record.isCurrentUser ? 'bg-primary-50' : ''}
                />
              </Card>
            ),
          },
          {
            key: 'monthly',
            label: '月榜',
            children: (
              <Card>
                <Table
                  dataSource={activeData?.items || []}
                  columns={columns}
                  rowKey="userId"
                  pagination={false}
                  rowClassName={(record) => record.isCurrentUser ? 'bg-primary-50' : ''}
                />
              </Card>
            ),
          },
          {
            key: 'total',
            label: '总榜',
            children: (
              <Card>
                <Table
                  dataSource={activeData?.items || []}
                  columns={columns}
                  rowKey="userId"
                  pagination={false}
                  rowClassName={(record) => record.isCurrentUser ? 'bg-primary-50' : ''}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default RankingPage;
