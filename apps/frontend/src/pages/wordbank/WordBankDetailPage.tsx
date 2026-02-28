import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Progress, Collapse, Tag, Spin, Modal, message } from 'antd';
import {
  PlayCircleOutlined,
  LockOutlined,
  CheckCircleOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { wordBankService, WordBankProgress } from '@/services/wordBankService';

type GameMode = 'practice' | 'challenge';

const WordBankDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<WordBankProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWordBankProgress();
    }
  }, [id]);

  const fetchWordBankProgress = async () => {
    try {
      const response = await wordBankService.getWordBankProgress(id!);
      setData(response);
    } catch (error) {
      message.error('获取词库信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = (sectionId: string) => {
    setSelectedSection(sectionId);
    setModeModalVisible(true);
  };

  const startGame = (mode: GameMode) => {
    setModeModalVisible(false);
    navigate(`/game/${selectedSection}?mode=${mode}`);
  };

  const renderStars = (stars: number, max = 3) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          i < stars ? (
            <StarFilled key={i} className="text-yellow-400" />
          ) : (
            <StarOutlined key={i} className="text-gray-300" />
          )
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <div>词库不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* 词库信息 */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{data.wordBank.name}</h1>
            <p className="text-gray-500 mt-2">{data.wordBank.description}</p>
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span>共 {data.wordBank.totalWords} 个单词</span>
              <span>|</span>
              <span>
                进度 {data.progress.completedSections}/{data.progress.totalSections} 关
              </span>
              <span>|</span>
              <span>
                星星 {data.progress.totalStars}/{data.progress.maxStars}
              </span>
            </div>
          </div>
        </div>
        <Progress
          percent={data.progress.percentage}
          status="active"
          className="mt-4"
        />
      </Card>

      {/* 章节列表 */}
      <Collapse
        defaultActiveKey={data.chapters.map((c) => c.id)}
        items={data.chapters.map((chapter) => ({
          key: chapter.id,
          label: (
            <div className="flex items-center justify-between w-full pr-4">
              <span className="font-medium">
                第{chapter.order}章 {chapter.name}
              </span>
              <span className="text-gray-500 text-sm">
                {chapter.sections.filter((s) => s.isCompleted).length}/{chapter.sections.length} 关
              </span>
            </div>
          ),
          children: (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {chapter.sections.map((section) => (
                <Card
                  key={section.id}
                  size="small"
                  className={`${
                    section.isUnlocked
                      ? 'cursor-pointer hover:shadow-md transition-shadow'
                      : 'opacity-60'
                  }`}
                  onClick={() => section.isUnlocked && handleStartGame(section.id)}
                >
                  <div className="text-center">
                    {!section.isUnlocked ? (
                      <LockOutlined className="text-3xl text-gray-400 mb-2" />
                    ) : section.isCompleted ? (
                      <CheckCircleOutlined className="text-3xl text-green-500 mb-2" />
                    ) : (
                      <PlayCircleOutlined className="text-3xl text-primary-500 mb-2" />
                    )}
                    <div className="font-medium">
                      {chapter.order}-{section.order} {section.name}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {section.wordCount} 个单词
                    </div>
                    {section.isCompleted && (
                      <div className="mt-2 flex justify-center">
                        {renderStars(section.stars)}
                      </div>
                    )}
                    {section.bestScore > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        最高分: {section.bestScore}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ),
        }))}
      />

      {/* 模式选择弹窗 */}
      <Modal
        title="选择游戏模式"
        open={modeModalVisible}
        onCancel={() => setModeModalVisible(false)}
        footer={null}
        centered
      >
        <div className="grid grid-cols-2 gap-4 py-4">
          <Card
            hoverable
            className="text-center"
            onClick={() => startGame('practice')}
          >
            <div className="text-4xl mb-2">📖</div>
            <div className="font-bold">练习模式</div>
            <div className="text-gray-500 text-sm mt-2">
              显示中英文，适合初学
            </div>
            <Tag color="green" className="mt-2">推荐新手</Tag>
          </Card>
          <Card
            hoverable
            className="text-center"
            onClick={() => startGame('challenge')}
          >
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-bold">挑战模式</div>
            <div className="text-gray-500 text-sm mt-2">
              只显示中文，测试记忆
            </div>
            <Tag color="orange" className="mt-2">更高分数</Tag>
          </Card>
        </div>
      </Modal>
    </div>
  );
};

export default WordBankDetailPage;
