import { SoundOutlined } from '@ant-design/icons';

const announcements = [
  '刚刚在四级词汇中获得了1200分的高分！',
  '玩家「学霸小明」达成了20连击的惊人记录！',
  '排行榜更新：「词汇王者」以8888分登顶总榜！',
  '新词库「托福词汇」已上线，快来挑战吧！',
];

const AnnouncementBar = () => {
  const doubled = [...announcements, ...announcements];

  return (
    <div className="announcement-bar">
      <div className="announcement-label">
        <SoundOutlined /> 公告
      </div>
      <div className="announcement-scroll">
        <div className="announcement-track">
          {doubled.map((text, i) => (
            <span key={i} className="announcement-item">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
