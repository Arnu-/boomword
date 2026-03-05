import ComingSoon from '@/components/ComingSoon';

const SettingsPage = () => (
  <ComingSoon
    icon="⚙️"
    title="设置"
    description="个性化你的学习体验，让单词泡泡更适合你！"
    features={[
      { icon: '🎨', text: '主题与外观自定义' },
      { icon: '🔔', text: '通知与提醒设置' },
      { icon: '🌐', text: '语言与地区偏好' },
      { icon: '🔒', text: '隐私与账号安全' },
    ]}
    accentColor="#10b981"
  />
);

export default SettingsPage;
