import { useLocation, Outlet } from 'react-router-dom';

/**
 * 页面切换过渡动画组件
 *
 * 原理：利用 React 的 key 机制 + CSS @keyframes 动画（定义在 styles/index.css）
 * - 每次 pathname 变化，key 改变，React 重新挂载容器 div
 * - 新 div 挂载时自动播放 pageEnter 动画（淡入 + 上移归位）
 * - 纯 CSS 实现，无需 JS 状态机，性能最优，无闪烁
 */
export default function PageTransition() {
  const location = useLocation();

  return (
    /*
     * key={location.pathname} 确保每次路由切换时 React 重新挂载此 div，
     * 从而触发 CSS 动画重新播放，实现流畅的页面进入效果。
     * pageEnter 关键帧定义在 src/styles/index.css 中。
     */
    <div
      key={location.pathname}
      style={{
        animation: 'pageEnter 0.32s cubic-bezier(0.4, 0, 0.2, 1) both',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Outlet />
    </div>
  );
}