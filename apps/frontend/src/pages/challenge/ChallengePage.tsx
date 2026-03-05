import ComingSoon from '@/components/ComingSoon';

const ChallengePage = () => (
  <ComingSoon
    icon="⚔️"
    title="挑战好友"
    description="向好友发起单词对决，看谁才是真正的词汇王者！"
    features={[
      { icon: '🎯', text: '实时 PK 对战模式' },
      { icon: '⏱️', text: '限时挑战，紧张刺激' },
      { icon: '🎖️', text: '胜者获得专属徽章' },
      { icon: '📈', text: '挑战记录与胜率统计' },
    ]}
    accentColor="#ef4444"
  />
);

export default ChallengePage;
