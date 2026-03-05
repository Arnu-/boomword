import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { wordBankService, WordBank } from '@/services/wordBankService';
import RightSidebar from '@/components/RightSidebar';

// 词库图标映射（根据词库名称/索引分配图标）
const bankIcons = ['⭐', '📘', '🎓', '🏆', '📚', '🌍', '📖', '🎯', '💎', '🔥'];

const WordBankPage = () => {
  const navigate = useNavigate();
  const [wordBanks, setWordBanks] = useState<WordBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const wordBanksData = await wordBankService.getWordBanks();
      setWordBanks(wordBanksData);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dark-main flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="dark-main">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-dark-text flex items-center gap-2">
            <AppstoreOutlined /> 选择词库
          </h1>
          <p className="text-dark-text-secondary mt-1 text-sm">
            选择你想要挑战的词库，开始学习之旅！
          </p>
        </div>

        {/* 词库网格 */}
        <div className="wordbank-grid">
          {wordBanks.map((bank, index) => {
            const icon = bankIcons[index % bankIcons.length];
            const chaptersCount = 3; // mock，实际应从 API 获取
            const wordsPerBank = bank.totalWords;
            const progress = Math.floor(Math.random() * 80); // mock 进度

            return (
              <div
                key={bank.id}
                className="wordbank-card"
                onClick={() => navigate(`/wordbanks/${bank.id}`)}
              >
                {/* 顶部颜色条 */}
                <div
                  className="wordbank-card-accent"
                  style={{
                    background: [
                      'linear-gradient(90deg, #6C5CE7, #8B7CF6)',
                      'linear-gradient(90deg, #28A745, #5BD778)',
                      'linear-gradient(90deg, #3B82F6, #60A5FA)',
                      'linear-gradient(90deg, #F59E0B, #FBBF24)',
                      'linear-gradient(90deg, #EF4444, #F87171)',
                      'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                    ][index % 6],
                  }}
                />

                {/* 图标 */}
                <div className="wordbank-card-icon">{icon}</div>

                {/* 名称 */}
                <div className="wordbank-card-name">{bank.name}</div>

                {/* 描述 */}
                <div className="wordbank-card-desc">
                  {bank.description || `${bank.category?.name || '综合'}词汇`}
                </div>

                {/* 统计信息 */}
                <div className="wordbank-card-stats">
                  {chaptersCount} 关卡 · {wordsPerBank} 个单词
                </div>

                {/* 进度条 */}
                <div className="wordbank-card-progress">
                  <div
                    className="wordbank-card-progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: [
                        '#6C5CE7',
                        '#28A745',
                        '#3B82F6',
                        '#F59E0B',
                        '#EF4444',
                        '#8B5CF6',
                      ][index % 6],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RightSidebar />
    </>
  );
};

export default WordBankPage;
