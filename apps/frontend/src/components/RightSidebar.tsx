import { BookOutlined, TrophyOutlined, BulbOutlined, UnorderedListOutlined } from '@ant-design/icons';

const dailyWord = {
  english: 'nostalgia',
  phonetic: '/nɒˈstældʒə/',
  chinese: '怀旧，乡愁',
};

const rankList = [
  { rank: 1, name: '星辰大海', score: 8888, emoji: '🦊' },
  { rank: 2, name: '词汇王者', score: 7654, emoji: '🦁' },
  { rank: 3, name: '泡泡猎手', score: 6543, emoji: '🐼' },
  { rank: 4, name: '学霸小明', score: 5432, emoji: '🐨' },
  { rank: 5, name: '彩虹战士', score: 4321, emoji: '🦄' },
];

const activities = [
  { name: '星辰大海', action: '完成了四级词汇第一关', color: '#6C5CE7' },
  { name: '词汇王者', action: '获得七连胜', color: '#F85149' },
  { name: '学霸小明', action: '达成20连击成就', color: '#28A745' },
];

const RightSidebar = () => {
  return (
    <div className="dark-aside">
      {/* 每日一词 */}
      <div className="aside-card">
        <div className="aside-card-title">
          <BookOutlined /> 每日一词
        </div>
        <div className="daily-word">
          <div className="daily-word-en">{dailyWord.english}</div>
          <div className="daily-word-phonetic">{dailyWord.phonetic}</div>
          <div className="daily-word-cn">{dailyWord.chinese}</div>
        </div>
        <button className="btn-outline-sm mt-3">学习这个词</button>
      </div>

      {/* 今日热榜 */}
      <div className="aside-card">
        <div className="aside-card-title">
          <TrophyOutlined /> 今日热榜
        </div>
        <div className="flex flex-col gap-1">
          {rankList.map((item) => (
            <div key={item.rank} className="rank-item">
              <span className={`rank-number ${item.rank <= 3 ? 'top-3' : ''}`}>
                {item.rank}
              </span>
              <span className="rank-avatar">{item.emoji}</span>
              <span className="rank-name">{item.name}</span>
              <span className="rank-score">{item.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 学习小贴士 */}
      <div className="aside-card">
        <div className="aside-card-title">
          <BulbOutlined style={{ color: '#FFD700' }} /> 学习小贴士
        </div>
        <div className="tip-content">
          <span className="tip-highlight">记忆技巧</span>：将单词与图像联系起来，形成生动的画面，有助于长期记忆。
        </div>
      </div>

      {/* 最近动态 */}
      <div className="aside-card">
        <div className="aside-card-title">
          <UnorderedListOutlined /> 最近动态
        </div>
        <div className="flex flex-col gap-1">
          {activities.map((item, i) => (
            <div key={i} className="activity-item">
              <span className="activity-dot" style={{ background: item.color }} />
              <span>
                <span className="activity-name">{item.name}</span>{' '}
                {item.action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
