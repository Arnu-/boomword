import ComingSoon from '@/components/ComingSoon';

const FriendsPage = () => (
  <ComingSoon
    icon="👥"
    title="好友列表"
    description="与好友一起学习，互相督促，共同进步！"
    features={[
      { icon: '🔍', text: '搜索并添加好友' },
      { icon: '📊', text: '查看好友学习动态' },
      { icon: '🏆', text: '好友积分排行榜' },
      { icon: '💬', text: '互动留言与鼓励' },
    ]}
    accentColor="#6366f1"
  />
);

export default FriendsPage;
