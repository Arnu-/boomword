import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Feature {
  icon: string;
  text: string;
}

interface ComingSoonProps {
  icon: string;
  title: string;
  description: string;
  features: Feature[];
  accentColor?: string;
}

const ComingSoon = ({
  icon,
  title,
  description,
  features,
  accentColor = '#6366f1',
}: ComingSoonProps) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 粒子背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 解析 accentColor 为 rgb
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [accentColor]);

  return (
    <div className="cs-wrap">
      {/* 粒子画布 */}
      <canvas ref={canvasRef} className="cs-canvas" />

      {/* 背景光晕 */}
      <div
        className="cs-glow"
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${accentColor}22 0%, transparent 65%)` }}
      />

      {/* 主卡片 */}
      <div className="cs-card" style={{ borderColor: `${accentColor}33` }}>
        {/* 顶部装饰条 */}
        <div
          className="cs-card-bar"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />

        {/* 图标 */}
        <div className="cs-icon-wrap">
          <div
            className="cs-icon-bg"
            style={{ background: `${accentColor}18`, boxShadow: `0 0 40px ${accentColor}30` }}
          >
            <span className="cs-icon">{icon}</span>
          </div>
          {/* 旋转光环 */}
          <div
            className="cs-icon-ring"
            style={{
              background: `conic-gradient(${accentColor} 0deg, transparent 120deg, ${accentColor}44 240deg, transparent 360deg)`,
            }}
          />
        </div>

        {/* 标题 */}
        <h1 className="cs-title">{title}</h1>

        {/* 开发中徽章 */}
        <div className="cs-badge" style={{ borderColor: `${accentColor}55`, color: accentColor }}>
          <span className="cs-badge-dot" style={{ background: accentColor }} />
          功能开发中
        </div>

        {/* 描述 */}
        <p className="cs-desc">{description}</p>

        {/* 功能预告卡片 */}
        <div className="cs-features">
          {features.map((f, i) => (
            <div
              key={i}
              className="cs-feature-item"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="cs-feature-icon">{f.icon}</span>
              <span className="cs-feature-text">{f.text}</span>
            </div>
          ))}
        </div>

        {/* 进度条（假装在开发） */}
        <div className="cs-progress-wrap">
          <div className="cs-progress-label">
            <span>开发进度</span>
            <span style={{ color: accentColor }}>敬请期待</span>
          </div>
          <div className="cs-progress-track">
            <div
              className="cs-progress-bar"
              style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}
            />
          </div>
        </div>

        {/* 返回按钮 */}
        <button
          className="cs-back-btn"
          style={{
            background: `${accentColor}18`,
            borderColor: `${accentColor}44`,
            color: accentColor,
          }}
          onClick={() => navigate(-1)}
        >
          ← 返回上一页
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
