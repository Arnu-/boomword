import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Spin } from 'antd';
import { Suspense } from 'react';
import {
  ThunderboltOutlined,
  AppstoreOutlined,
  UserOutlined,
  TrophyOutlined,
  TeamOutlined,
  AimOutlined,
  SettingOutlined,
  LogoutOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useLearningStore } from '@/stores/learningStore';
import AnnouncementBar from '@/components/AnnouncementBar';
import PageTransition from '@/components/PageTransition';

interface SidebarItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  badge?: 'new' | 'dot';
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: '游戏',
    items: [
      { key: '/', icon: <ThunderboltOutlined />, label: '快速开始' },
      { key: '/wordbanks', icon: <AppstoreOutlined />, label: '选择关卡' },
    ],
  },
  {
    title: '个人',
    items: [
      { key: '/profile', icon: <UserOutlined />, label: '个人资料' },
      { key: '/achievements', icon: <TrophyOutlined />, label: '个人成就', badge: 'new' },
    ],
  },
  {
    title: '社区',
    items: [
      { key: '/friends', icon: <TeamOutlined />, label: '好友列表', badge: 'dot' },
      { key: '/challenge', icon: <AimOutlined />, label: '挑战好友' },
    ],
  },
  {
    title: '其他',
    items: [
      { key: '/settings', icon: <SettingOutlined />, label: '设置' },
    ],
  },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const todayStats = useLearningStore((s) => s.todayStats);

  const totalScore = todayStats?.score || 0;
  const userLevel = user?.level || 1;
  const streak = 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dark-layout">
      {/* 顶部导航栏 */}
      <header className="dark-header">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🫧</span>
            <span className="text-lg font-bold text-dark-text">单词泡泡</span>
          </Link>

          <div className="flex items-center gap-2 ml-4">
            <div className="header-badge">
              <span className="header-badge-value">{totalScore}</span>
              <span className="header-badge-label">总积分</span>
            </div>
            <div className="header-badge">
              <span className="header-badge-value">{userLevel}</span>
              <span className="header-badge-label">等级</span>
            </div>
            <div className="header-badge">
              <span className="header-badge-value">{streak}</span>
              <span className="header-badge-label">连击</span>
            </div>
          </div>
        </div>

        <div className="header-user" onClick={() => navigate('/profile')}>
          <div className="header-user-info">
            <div className="header-user-name">{user?.nickname || '用户'}</div>
            <div className="header-user-score">
              <StarFilled /> {totalScore} 分
            </div>
          </div>
          <Avatar src={user?.avatar} icon={<UserOutlined />} size={36} />
        </div>
      </header>

      {/* 左侧导航栏 */}
      <aside className="dark-sidebar">
        <div className="flex-1">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              <div className="dark-sidebar-group-title">{group.title}</div>
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className={`dark-sidebar-item ${location.pathname === item.key ? 'active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge === 'new' && <span className="badge-new">NEW</span>}
                  {item.badge === 'dot' && <span className="badge-dot" />}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-auto px-2 pb-2">
          <div className="dark-sidebar-logout" onClick={handleLogout}>
            <LogoutOutlined />
            <span>退出登录</span>
          </div>
        </div>
      </aside>

      {/* 内容区域 */}
      <div className="dark-content" style={{ paddingBottom: 0 }}>
        <Suspense
          fallback={
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                opacity: 0.6,
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <PageTransition />
        </Suspense>
      </div>

      {/* 底部公告栏 */}
      <AnnouncementBar />
    </div>
  );
};

export default MainLayout;