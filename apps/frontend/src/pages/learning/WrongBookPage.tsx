import { useEffect, useState } from 'react';
import { Card, Table, Button, Empty, Spin, message, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, ClearOutlined } from '@ant-design/icons';
import api from '@/services/api';

interface WrongWord {
  id: string;
  english: string;
  chinese: string;
  phonetic?: string;
  wrongCount: number;
  lastWrongAt: string;
  wordBank: {
    id: string;
    name: string;
  };
}

interface PaginatedResponse {
  items: WrongWord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const WrongBookPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchWrongWords();
  }, [page]);

  const fetchWrongWords = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wrongbook', {
        params: { page, limit: 20 },
      });
      setData(response);
    } catch (error) {
      message.error('获取错题列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wordId: string) => {
    try {
      await api.delete(`/wrongbook/${wordId}`);
      message.success('已从错题本移除');
      fetchWrongWords();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/wrongbook');
      message.success('已清空错题本');
      fetchWrongWords();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleStartPractice = () => {
    // TODO: 实现错题练习功能
    message.info('错题练习功能开发中');
  };

  const columns = [
    {
      title: '单词',
      dataIndex: 'english',
      key: 'english',
      render: (text: string, record: WrongWord) => (
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
      title: '所属词库',
      dataIndex: ['wordBank', 'name'],
      key: 'wordBank',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '错误次数',
      dataIndex: 'wrongCount',
      key: 'wrongCount',
      sorter: (a: WrongWord, b: WrongWord) => a.wrongCount - b.wrongCount,
      render: (count: number) => (
        <span className={count >= 5 ? 'text-red-500 font-bold' : count >= 3 ? 'text-orange-500' : ''}>
          {count} 次
        </span>
      ),
    },
    {
      title: '最近错误时间',
      dataIndex: 'lastWrongAt',
      key: 'lastWrongAt',
      render: (time: string) => new Date(time).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WrongWord) => (
        <Popconfirm
          title="确定从错题本移除？"
          onConfirm={() => handleRemove(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">错题本</h1>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartPractice}
            disabled={!data || data.items.length === 0}
          >
            开始练习
          </Button>
          <Popconfirm
            title="确定清空错题本？"
            description="此操作不可恢复"
            onConfirm={handleClearAll}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<ClearOutlined />}
              disabled={!data || data.items.length === 0}
            >
              清空
            </Button>
          </Popconfirm>
        </div>
      </div>

      <Card>
        {data && data.items.length > 0 ? (
          <Table
            dataSource={data.items}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              total: data.pagination.total,
              pageSize: data.pagination.limit,
              onChange: setPage,
            }}
          />
        ) : (
          <Empty
            description="错题本为空"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};

export default WrongBookPage;
