import { useEffect, useState } from 'react';
import { Card, Tabs, Table, Progress, Spin, Empty, Tag } from 'antd';
import { CheckCircleOutlined, BookOutlined } from '@ant-design/icons';
import api from '@/services/api';

interface WordItem {
  id: string;
  english: string;
  chinese: string;
  phonetic?: string;
  masteryLevel: number;
  practiceCount: number;
  correctCount: number;
  accuracy?: number;
  lastPracticeAt: string;
}

interface PaginatedResponse {
  items: WordItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const LearningPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mastered');
  const [masteredData, setMasteredData] = useState<PaginatedResponse | null>(null);
  const [learningData, setLearningData] = useState<PaginatedResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mastered, learning] = await Promise.all([
        api.get('/learning/words/mastered'),
        api.get('/learning/words/learning'),
      ]);
      setMasteredData(mastered);
      setLearningData(learning);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryTag = (level: number) => {
    if (level >= 5) return <Tag color="green">已掌握</Tag>;
    if (level >= 3) return <Tag color="blue">熟悉</Tag>;
    if (level >= 1) return <Tag color="orange">训练中</Tag>;
    return <Tag color="red">未开始</Tag>;
  };

  const columns = [
    {
      title: '单词',
      dataIndex: 'english',
      key: 'english',
      render: (text: string, record: WordItem) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.phonetic && (
            <div className="text-gray-400 text-sm">{record.phonetic}</div>
          )}
        </div>
      ),
    },
    {
      title: '释义',
      dataIndex: 'chinese',
      key: 'chinese',
    },
    {
      title: '掌握程度',
      dataIndex: 'masteryLevel',
      key: 'masteryLevel',
      render: (level: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={(level / 5) * 100}
            size="small"
            showInfo={false}
            className="w-20"
          />
          {getMasteryTag(level)}
        </div>
      ),
    },
    {
      title: '练习次数',
      dataIndex: 'practiceCount',
      key: 'practiceCount',
    },
    {
      title: '正确率',
      key: 'accuracy',
      render: (_: any, record: WordItem) => {
        const accuracy = record.practiceCount > 0
          ? Math.round((record.correctCount / record.practiceCount) * 100)
          : 0;
        return (
          <span className={accuracy >= 80 ? 'text-green-500' : accuracy >= 60 ? 'text-orange-500' : 'text-red-500'}>
            {accuracy}%
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的进度</h1>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'mastered',
            label: (
              <span>
                <CheckCircleOutlined className="mr-1" />
                已掌握 ({masteredData?.pagination.total || 0})
              </span>
            ),
            children: (
              <Card>
                {masteredData && masteredData.items.length > 0 ? (
                  <Table
                    dataSource={masteredData.items}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                      total: masteredData.pagination.total,
                      pageSize: masteredData.pagination.limit,
                    }}
                  />
                ) : (
                  <Empty description="暂无已掌握的单词" />
                )}
              </Card>
            ),
          },
          {
            key: 'learning',
            label: (
              <span>
                <BookOutlined className="mr-1" />
                训练中 ({learningData?.pagination.total || 0})
              </span>
            ),
            children: (
              <Card>
                {learningData && learningData.items.length > 0 ? (
                  <Table
                    dataSource={learningData.items}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                      total: learningData.pagination.total,
                      pageSize: learningData.pagination.limit,
                    }}
                  />
                ) : (
                  <Empty description="暂无训练中的单词" />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default LearningPage;
