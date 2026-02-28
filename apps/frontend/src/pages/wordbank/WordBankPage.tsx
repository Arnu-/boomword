import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Spin, Empty, Tabs } from 'antd';
import { BookOutlined, StarFilled } from '@ant-design/icons';
import { wordBankService, WordBank, Category } from '@/services/wordBankService';

const WordBankPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wordBanks, setWordBanks] = useState<WordBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, wordBanksData] = await Promise.all([
        wordBankService.getCategories(),
        wordBankService.getWordBanks(),
      ]);
      setCategories(categoriesData);
      setWordBanks(wordBanksData);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWordBanks = activeCategory === 'all'
    ? wordBanks
    : wordBanks.filter((wb) => wb.category?.id === activeCategory);

  const getDifficultyTag = (difficulty: number) => {
    const configs = [
      { color: 'green', text: '入门' },
      { color: 'blue', text: '初级' },
      { color: 'orange', text: '中级' },
      { color: 'red', text: '高级' },
      { color: 'purple', text: '专家' },
    ];
    const config = configs[Math.min(difficulty - 1, 4)];
    return <Tag color={config.color}>{config.text}</Tag>;
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">词库</h1>
      </div>

      {/* 分类标签 */}
      <Tabs
        activeKey={activeCategory}
        onChange={setActiveCategory}
        items={[
          { key: 'all', label: '全部' },
          ...categories.map((cat) => ({
            key: cat.id,
            label: `${cat.name} (${cat.wordBankCount})`,
          })),
        ]}
      />

      {/* 词库列表 */}
      {filteredWordBanks.length === 0 ? (
        <Empty description="暂无词库" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredWordBanks.map((wordBank) => (
            <Col key={wordBank.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                className="card-hover"
                cover={
                  wordBank.coverImage ? (
                    <img
                      alt={wordBank.name}
                      src={wordBank.coverImage}
                      className="h-32 object-cover"
                    />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <BookOutlined className="text-5xl text-white" />
                    </div>
                  )
                }
                onClick={() => navigate(`/wordbanks/${wordBank.id}`)}
              >
                <Card.Meta
                  title={
                    <div className="flex items-center justify-between">
                      <span className="truncate">{wordBank.name}</span>
                      {getDifficultyTag(wordBank.difficulty)}
                    </div>
                  }
                  description={
                    <div>
                      <p className="text-gray-500 truncate mb-2">
                        {wordBank.description || '暂无描述'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {wordBank.totalWords} 个单词
                        </span>
                        {wordBank.category && (
                          <Tag>{wordBank.category.name}</Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default WordBankPage;
