import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography, Progress, Tooltip } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  TeamOutlined,
  ReadOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { adminStatsApi, type OverviewStats, type DailyStat } from '@/services/adminService';

const { Title, Text } = Typography;

// 简单折线图组件（纯CSS/SVG实现，无需额外图表库）
function MiniLineChart({ data, color, height = 60 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 300;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points.join(' ')}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        fill={`url(#grad-${color.replace('#', '')})`}
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
      />
    </svg>
  );
}

// 统计卡片组件
function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
  trend,
  trendLabel,
  chartData,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  trendLabel?: string;
  chartData?: number[];
}) {
  return (
    <Card
      style={{
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        position: 'relative',
      }}
      bodyStyle={{ padding: '20px 24px 16px' }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: color,
          opacity: 0.06,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>{title}</Text>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {suffix && <span style={{ fontSize: 14, color: '#8c8c8c', marginLeft: 4 }}>{suffix}</span>}
          </div>
          {trend !== undefined && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiseOutlined style={{ color: trend >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 12 }} />
              <Text style={{ fontSize: 12, color: trend >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {trend >= 0 ? '+' : ''}{trend}
              </Text>
              {trendLabel && <Text style={{ fontSize: 12, color: '#bfbfbf' }}>{trendLabel}</Text>}
            </div>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color,
          }}
        >
          {icon}
        </div>
      </div>
      {chartData && chartData.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <MiniLineChart data={chartData} color={color} height={50} />
        </div>
      )}
    </Card>
  );
}

// 游戏模式标签
const modeConfig: Record<string, { label: string; color: string }> = {
  practice: { label: '练习', color: 'blue' },
  challenge: { label: '挑战', color: 'orange' },
  speed: { label: '速度', color: 'red' },
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [gameModeStats, setGameModeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, dailyData, modeData] = await Promise.all([
          adminStatsApi.getOverview(),
          adminStatsApi.getDailyStats(14),
          adminStatsApi.getGameModeStats(),
        ]);
        setOverview(overviewData as OverviewStats);
        setDailyStats(dailyData as DailyStat[]);
        setGameModeStats(modeData as any[]);
      } catch (e) {
        console.error('加载统计数据失败', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 提取折线图数据
  const userChartData = dailyStats.map((d) => d.newUsers);
  const gameChartData = dailyStats.map((d) => d.games);

  // 游戏模式表格列
  const modeColumns = [
    {
      title: '游戏模式',
      dataIndex: 'mode',
      render: (mode: string) => (
        <Tag color={modeConfig[mode]?.color || 'default'}>
          {modeConfig[mode]?.label || mode}
        </Tag>
      ),
    },
    {
      title: '总局数',
      dataIndex: '_count',
      render: (c: any) => <span style={{ fontWeight: 600 }}>{c?.id?.toLocaleString() || 0}</span>,
    },
    {
      title: '平均分',
      dataIndex: '_avg',
      render: (a: any) => Math.round(a?.score || 0),
    },
  ];

  // 近14天数据表格
  const recentColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      render: (d: string) => <Text style={{ fontSize: 13 }}>{d}</Text>,
    },
    {
      title: '新增用户',
      dataIndex: 'newUsers',
      render: (v: number) => (
        <span style={{ color: '#6366f1', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: '游戏局数',
      dataIndex: 'games',
      render: (v: number) => (
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: '平均准确率',
      dataIndex: 'avgAccuracy',
      render: (v: number) => (
        <Progress
          percent={Math.round(v * 100)}
          size="small"
          strokeColor="#10b981"
          style={{ marginBottom: 0, width: 120 }}
        />
      ),
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>
          数据概览
        </Title>
        <Text style={{ color: '#8c8c8c', fontSize: 13 }}>实时掌握平台运营数据</Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="注册用户"
            value={overview?.totalUsers || 0}
            icon={<UserOutlined />}
            color="#6366f1"
            trend={overview?.todayNewUsers}
            trendLabel="今日新增"
            chartData={userChartData}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="游戏总局数"
            value={overview?.totalGames || 0}
            icon={<PlayCircleOutlined />}
            color="#f59e0b"
            trend={overview?.todayGames}
            trendLabel="今日游戏"
            chartData={gameChartData}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="词库总数"
            value={overview?.totalWordBanks || 0}
            icon={<BookOutlined />}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="单词总量"
            value={overview?.totalWords || 0}
            icon={<ReadOutlined />}
            color="#8b5cf6"
          />
        </Col>
      </Row>

      {/* 次要指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#fff7e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fa8c16',
                }}
              >
                <FireOutlined />
              </div>
              <div>
                <Text style={{ color: '#8c8c8c', fontSize: 13, display: 'block' }}>7日活跃用户</Text>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
                  {overview?.activeUsers || 0}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>活跃率</Text>
                <Text style={{ fontSize: 12, color: '#fa8c16' }}>
                  {overview?.totalUsers
                    ? Math.round((overview.activeUsers / overview.totalUsers) * 100)
                    : 0}%
                </Text>
              </div>
              <Progress
                percent={
                  overview?.totalUsers
                    ? Math.round((overview.activeUsers / overview.totalUsers) * 100)
                    : 0
                }
                strokeColor="#fa8c16"
                showInfo={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#f0f5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#2f54eb',
                }}
              >
                <TeamOutlined />
              </div>
              <div>
                <Text style={{ color: '#8c8c8c', fontSize: 13, display: 'block' }}>关卡总数</Text>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
                  {overview?.totalChapters || 0}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                共 <span style={{ color: '#2f54eb', fontWeight: 600 }}>{overview?.totalSections || 0}</span> 个小节
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#52c41a',
                }}
              >
                <TrophyOutlined />
              </div>
              <div>
                <Text style={{ color: '#8c8c8c', fontSize: 13, display: 'block' }}>今日平均分</Text>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
                  {overview?.todayAvgScore || 0}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                平均准确率{' '}
                <span style={{ color: '#52c41a', fontWeight: 600 }}>
                  {Math.round((overview?.todayAvgAccuracy || 0) * 100)}%
                </span>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 近14天趋势 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 600, color: '#1a1a2e' }}>近14天数据趋势</span>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '0 0 8px' }}
          >
            {/* 折线图 SVG */}
            <div style={{ padding: '16px 24px 8px' }}>
              {dailyStats.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 3, borderRadius: 2, background: '#6366f1' }} />
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>新增用户</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 3, borderRadius: 2, background: '#f59e0b' }} />
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>游戏局数</Text>
                    </div>
                  </div>
                  <svg width="100%" height="160" viewBox="0 0 600 160" preserveAspectRatio="none">
                    {/* 网格线 */}
                    {[0, 40, 80, 120, 160].map((y) => (
                      <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#f0f0f0" strokeWidth="1" />
                    ))}
                    {/* 用户折线 */}
                    {(() => {
                      const maxV = Math.max(...userChartData, 1);
                      const pts = userChartData.map((v, i) => {
                        const x = (i / (userChartData.length - 1)) * 600;
                        const y = 150 - (v / maxV) * 130;
                        return `${x},${y}`;
                      });
                      return (
                        <>
                          <defs>
                            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <polygon fill="url(#userGrad)" points={`0,160 ${pts.join(' ')} 600,160`} />
                          <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={pts.join(' ')} strokeLinecap="round" strokeLinejoin="round" />
                          {userChartData.map((v, i) => {
                            const x = (i / (userChartData.length - 1)) * 600;
                            const y = 150 - (v / maxV) * 130;
                            return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
                          })}
                        </>
                      );
                    })()}
                    {/* 游戏折线 */}
                    {(() => {
                      const maxV = Math.max(...gameChartData, 1);
                      const pts = gameChartData.map((v, i) => {
                        const x = (i / (gameChartData.length - 1)) * 600;
                        const y = 150 - (v / maxV) * 130;
                        return `${x},${y}`;
                      });
                      return (
                        <>
                          <defs>
                            <linearGradient id="gameGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <polygon fill="url(#gameGrad)" points={`0,160 ${pts.join(' ')} 600,160`} />
                          <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={pts.join(' ')} strokeLinecap="round" strokeLinejoin="round" />
                          {gameChartData.map((v, i) => {
                            const x = (i / (gameChartData.length - 1)) * 600;
                            const y = 150 - (v / maxV) * 130;
                            return <circle key={i} cx={x} cy={y} r="3" fill="#f59e0b" />;
                          })}
                        </>
                      );
                    })()}
                  </svg>
                  {/* X轴标签 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {dailyStats.filter((_, i) => i % 2 === 0).map((d) => (
                      <Text key={d.date} style={{ fontSize: 11, color: '#bfbfbf' }}>
                        {d.date.slice(5)}
                      </Text>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Table
              dataSource={[...dailyStats].reverse().slice(0, 7)}
              columns={recentColumns}
              rowKey="date"
              size="small"
              pagination={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        {/* 游戏模式分布 */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 600, color: '#1a1a2e' }}>游戏模式分布</span>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {gameModeStats.length > 0 ? (
              <div>
                {/* 饼图（SVG实现） */}
                {(() => {
                  const total = gameModeStats.reduce((s, m) => s + (m._count?.id || 0), 0);
                  const colors = ['#6366f1', '#f59e0b', '#ef4444'];
                  let startAngle = -90;
                  const cx = 80, cy = 80, r = 60;

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        {gameModeStats.map((m, i) => {
                          const pct = (m._count?.id || 0) / total;
                          const angle = pct * 360;
                          const endAngle = startAngle + angle;
                          const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                          const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          startAngle = endAngle;
                          return <path key={m.mode} d={path} fill={colors[i % colors.length]} opacity="0.85" />;
                        })}
                        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
                        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#8c8c8c">总局数</text>
                        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1a1a2e">
                          {total.toLocaleString()}
                        </text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        {gameModeStats.map((m, i) => (
                          <div key={m.mode} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length] }} />
                                <Text style={{ fontSize: 13 }}>{modeConfig[m.mode]?.label || m.mode}</Text>
                              </div>
                              <Text style={{ fontSize: 13, fontWeight: 600 }}>{m._count?.id || 0}</Text>
                            </div>
                            <Progress
                              percent={total ? Math.round(((m._count?.id || 0) / total) * 100) : 0}
                              strokeColor={colors[i % colors.length]}
                              showInfo={false}
                              size="small"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <Table
                  dataSource={gameModeStats}
                  columns={modeColumns}
                  rowKey="mode"
                  size="small"
                  pagination={false}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#bfbfbf' }}>
                暂无游戏数据
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
