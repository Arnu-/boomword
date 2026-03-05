import { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Input, Button, Tag, Avatar, Space, Modal, Tabs,
  Form, Select, Descriptions, Statistic, Row, Col, message,
  Popconfirm, Badge, Typography, Drawer, Progress, Empty, Tooltip,
} from 'antd';
import {
  SearchOutlined, UserOutlined, LockOutlined, EyeOutlined,
  ReloadOutlined, TrophyOutlined, PlayCircleOutlined, BookOutlined,
  CheckCircleOutlined, CloseCircleOutlined, StarFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  adminUserApi,
  type AdminUser,
  type UserDetail,
  type GameRecord,
} from '@/services/adminService';

const { Text, Title } = Typography;
const { Search } = Input;

// 状态配置
const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'success' },
  banned: { label: '封禁', color: 'error' },
  locked: { label: '锁定', color: 'warning' },
  pending: { label: '待激活', color: 'default' },
  deleted: { label: '已删除', color: 'default' },
};

// 角色配置
const roleConfig: Record<string, { label: string; color: string }> = {
  user: { label: '普通用户', color: 'default' },
  admin: { label: '管理员', color: 'blue' },
  super_admin: { label: '超级管理员', color: 'purple' },
};

// 游戏模式配置
const modeConfig: Record<string, { label: string; color: string }> = {
  practice: { label: '练习', color: 'blue' },
  challenge: { label: '挑战', color: 'orange' },
  speed: { label: '速度', color: 'red' },
};

// 掌握度配置
const masteryConfig: Record<string, { label: string; color: string }> = {
  not_learned: { label: '未学习', color: '#d9d9d9' },
  learning: { label: '学习中', color: '#1677ff' },
  mastered: { label: '已掌握', color: '#52c41a' },
  need_review: { label: '需复习', color: '#fa8c16' },
};

// 星级显示
function StarRating({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <span>
      {Array.from({ length: max }).map((_, i) => (
        <StarFilled key={i} style={{ color: i < stars ? '#fadb14' : '#d9d9d9', fontSize: 12 }} />
      ))}
    </span>
  );
}

// 用户详情抽屉
function UserDetailDrawer({
  userId,
  open,
  onClose,
  onRefresh,
}: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [resetPwdVisible, setResetPwdVisible] = useState(false);
  const [resetPwdForm] = Form.useForm();
  const [recordPage, setRecordPage] = useState(1);
  const [recordTotal, setRecordTotal] = useState(0);

  useEffect(() => {
    if (userId && open) {
      fetchDetail(userId);
    }
  }, [userId, open]);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await adminUserApi.getUserDetail(id);
      setDetail(data as UserDetail);
    } catch {
      message.error('加载用户详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchGameRecords = useCallback(async (page = 1) => {
    if (!userId) return;
    setRecordsLoading(true);
    try {
      const data = await adminUserApi.getGameRecords(userId, { page, limit: 10 }) as any;
      setGameRecords(data.items || []);
      setRecordTotal(data.pagination?.total || 0);
      setRecordPage(page);
    } catch {
      message.error('加载游戏记录失败');
    } finally {
      setRecordsLoading(false);
    }
  }, [userId]);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await adminUserApi.getProgress(userId);
      setProgress(data);
    } catch {
      message.error('加载进度失败');
    }
  }, [userId]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'records' && gameRecords.length === 0) fetchGameRecords();
    if (key === 'progress' && !progress) fetchProgress();
  };

  const handleResetPassword = async (values: { newPassword: string }) => {
    if (!userId) return;
    try {
      await adminUserApi.resetPassword(userId, values.newPassword);
      message.success('密码重置成功');
      setResetPwdVisible(false);
      resetPwdForm.resetFields();
    } catch (e: any) {
      message.error(e.message || '重置失败');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!userId) return;
    try {
      await adminUserApi.updateUserStatus(userId, status);
      message.success('状态更新成功');
      fetchDetail(userId);
      onRefresh();
    } catch (e: any) {
      message.error(e.message || '更新失败');
    }
  };

  const gameRecordColumns = [
    {
      title: '词库/关卡',
      dataIndex: 'section',
      render: (s: any) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{s?.chapter?.wordBank?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {s?.chapter?.name} · {s?.name}
          </div>
        </div>
      ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      width: 80,
      render: (m: string) => (
        <Tag color={modeConfig[m]?.color}>{modeConfig[m]?.label || m}</Tag>
      ),
    },
    {
      title: '得分',
      dataIndex: 'score',
      width: 80,
      render: (v: number) => <span style={{ fontWeight: 600, color: '#6366f1' }}>{v}</span>,
    },
    {
      title: '星级',
      dataIndex: 'stars',
      width: 80,
      render: (v: number) => <StarRating stars={v} />,
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      width: 90,
      render: (v: number) => (
        <span style={{ color: v >= 0.8 ? '#52c41a' : v >= 0.6 ? '#fa8c16' : '#ff4d4f' }}>
          {Math.round(v * 100)}%
        </span>
      ),
    },
    {
      title: '用时',
      dataIndex: 'timeUsed',
      width: 80,
      render: (v: number) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            src={detail?.avatarUrl}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {detail?.nickname?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{detail?.nickname || '加载中...'}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              {detail?.email || detail?.phone || '无联系方式'}
            </div>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      width={720}
      extra={
        <Space>
          <Button
            size="small"
            icon={<LockOutlined />}
            onClick={() => setResetPwdVisible(true)}
          >
            重置密码
          </Button>
          {detail?.status === 'active' ? (
            <Popconfirm
              title="确认封禁该用户？"
              onConfirm={() => handleStatusChange('banned')}
            >
              <Button size="small" danger>封禁</Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              type="primary"
              onClick={() => handleStatusChange('active')}
            >
              解封
            </Button>
          )}
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'info',
            label: '基本信息',
            children: (
              <div>
                {/* 统计卡片 */}
                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                  {[
                    { label: '游戏局数', value: detail?.statistics?.totalGames || 0, icon: <PlayCircleOutlined />, color: '#6366f1' },
                    { label: '学习单词', value: detail?.statistics?.totalWords || 0, icon: <BookOutlined />, color: '#10b981' },
                    { label: '获得成就', value: detail?.statistics?.totalAchievements || 0, icon: <TrophyOutlined />, color: '#f59e0b' },
                    { label: '最高分', value: detail?.statistics?.maxScore || 0, icon: <StarFilled />, color: '#ef4444' },
                  ].map((item) => (
                    <Col span={6} key={item.label}>
                      <Card
                        size="small"
                        style={{ borderRadius: 12, textAlign: 'center', border: `1px solid ${item.color}20` }}
                        bodyStyle={{ padding: '12px 8px' }}
                      >
                        <div style={{ fontSize: 20, color: item.color, marginBottom: 4 }}>{item.icon}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{item.value.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{item.label}</div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="用户ID" span={2}>
                    <Text copyable style={{ fontSize: 12 }}>{detail?.id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="昵称">{detail?.nickname}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{detail?.email || '-'}</Descriptions.Item>
                  <Descriptions.Item label="手机">{detail?.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="性别">
                    {{ male: '男', female: '女', unknown: '未知' }[detail?.gender || 'unknown']}
                  </Descriptions.Item>
                  <Descriptions.Item label="年级">{detail?.grade || '-'}</Descriptions.Item>
                  <Descriptions.Item label="角色">
                    <Tag color={roleConfig[detail?.role || 'user']?.color}>
                      {roleConfig[detail?.role || 'user']?.label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Badge
                      status={statusConfig[detail?.status || 'active']?.color as any}
                      text={statusConfig[detail?.status || 'active']?.label}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="游客账号">
                    {detail?.isGuest ? <Tag color="orange">游客</Tag> : <Tag color="green">正式</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="等级">
                    Lv.{detail?.level?.level || 1}（{detail?.level?.totalExp || 0} EXP）
                  </Descriptions.Item>
                  <Descriptions.Item label="连续打卡">
                    {detail?.level?.consecutiveDays || 0} 天
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {detail?.createdAt ? dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录">
                    {detail?.lastLoginAt ? dayjs(detail.lastLoginAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="总得分">{detail?.statistics?.totalScore?.toLocaleString() || 0}</Descriptions.Item>
                  <Descriptions.Item label="平均准确率">
                    {Math.round((detail?.statistics?.avgAccuracy || 0) * 100)}%
                  </Descriptions.Item>
                  <Descriptions.Item label="平均星级">
                    <StarRating stars={Math.round(detail?.statistics?.avgStars || 0)} />
                  </Descriptions.Item>
                  <Descriptions.Item label="错词数">{detail?.statistics?.totalWrongWords || 0}</Descriptions.Item>
                </Descriptions>
              </div>
            ),
          },
          {
            key: 'records',
            label: '游戏记录',
            children: (
              <Table
                dataSource={gameRecords}
                columns={gameRecordColumns}
                rowKey="id"
                loading={recordsLoading}
                size="small"
                pagination={{
                  current: recordPage,
                  total: recordTotal,
                  pageSize: 10,
                  onChange: fetchGameRecords,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                locale={{ emptyText: <Empty description="暂无游戏记录" /> }}
              />
            ),
          },
          {
            key: 'progress',
            label: '学习进度',
            children: progress ? (
              <div>
                {/* 小节完成情况 */}
                <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="已解锁小节" value={progress.sectionStats?.total || 0} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="已完成小节" value={progress.sectionStats?.completed || 0} />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="完成率"
                        value={
                          progress.sectionStats?.total
                            ? Math.round((progress.sectionStats.completed / progress.sectionStats.total) * 100)
                            : 0
                        }
                        suffix="%"
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 单词掌握情况 */}
                <Card size="small" title="单词掌握情况" style={{ marginBottom: 16, borderRadius: 12 }}>
                  <Row gutter={[8, 8]}>
                    {(progress.wordMastery || []).map((m: any) => (
                      <Col span={12} key={m.mastery}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13 }}>{masteryConfig[m.mastery]?.label || m.mastery}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{m._count?.id || 0}</span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: masteryConfig[m.mastery]?.color || '#d9d9d9',
                            opacity: 0.8,
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* 词库进度 */}
                <Card size="small" title="词库学习进度" style={{ borderRadius: 12 }}>
                  {(progress.wordBankProgress || []).length === 0 ? (
                    <Empty description="暂无学习记录" />
                  ) : (
                    (progress.wordBankProgress || []).map((wb: any) => (
                      <div key={wb.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ fontWeight: 500 }}>{wb.wordBank?.name}</Text>
                          <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {wb.learnedCount}/{wb.wordBank?.wordCount} 词
                          </Text>
                        </div>
                        <Progress
                          percent={Math.round(wb.progress * 100)}
                          strokeColor={{ '0%': '#6366f1', '100%': '#8b5cf6' }}
                          size="small"
                        />
                      </div>
                    ))
                  )}
                </Card>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Button onClick={fetchProgress}>加载进度数据</Button>
              </div>
            ),
          },
        ]}
      />

      {/* 重置密码弹窗 */}
      <Modal
        title="重置用户密码"
        open={resetPwdVisible}
        onCancel={() => { setResetPwdVisible(false); resetPwdForm.resetFields(); }}
        onOk={() => resetPwdForm.submit()}
        okText="确认重置"
      >
        <Form form={resetPwdForm} onFinish={handleResetPassword} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  );
}

// 主页面
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchUsers = useCallback(async (p = 1, kw = keyword, st = statusFilter) => {
    setLoading(true);
    try {
      const data = await adminUserApi.getUsers({ page: p, limit: 20, keyword: kw, status: st }) as any;
      setUsers(data.items || []);
      setTotal(data.pagination?.total || 0);
      setPage(p);
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchUsers(1, value, statusFilter);
  };

  const handleStatusFilter = (value: string | undefined) => {
    setStatusFilter(value);
    fetchUsers(1, keyword, value);
  };

  const handleViewUser = (id: string) => {
    setSelectedUserId(id);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'nickname',
      render: (_: any, record: AdminUser) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={36}
            src={record.avatarUrl}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0 }}
          >
            {record.nickname?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {record.nickname}
              {record.isGuest && <Tag color="orange" style={{ marginLeft: 6, fontSize: 11 }}>游客</Tag>}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email || record.phone || '无联系方式'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={roleConfig[role]?.color}>{roleConfig[role]?.label || role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Badge
          status={statusConfig[status]?.color as any}
          text={statusConfig[status]?.label || status}
        />
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 80,
      render: (level: any) => (
        <span style={{ fontWeight: 600, color: '#6366f1' }}>
          Lv.{level?.level || 1}
        </span>
      ),
    },
    {
      title: '游戏局数',
      dataIndex: 'gamesCount',
      width: 90,
      render: (v: number) => <span style={{ color: '#f59e0b', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '学习单词',
      dataIndex: 'wordsCount',
      width: 90,
      render: (v: number) => <span style={{ color: '#10b981', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      width: 120,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : <Text type="secondary">从未</Text>,
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: AdminUser) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewUser(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>用户管理</Title>
        <Text style={{ color: '#8c8c8c', fontSize: 13 }}>管理平台所有用户账号</Text>
      </div>

      <Card
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        {/* 搜索和筛选 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="搜索昵称/邮箱/手机号"
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
          <Select
            placeholder="用户状态"
            allowClear
            style={{ width: 140 }}
            onChange={handleStatusFilter}
            options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchUsers(1)}
          >
            刷新
          </Button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>共 {total} 位用户</Text>
          </div>
        </div>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => fetchUsers(p),
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: false,
          }}
          rowClassName={(record) =>
            record.status === 'banned' ? 'opacity-50' : ''
          }
          locale={{ emptyText: <Empty description="暂无用户数据" /> }}
        />
      </Card>

      {/* 用户详情抽屉 */}
      <UserDetailDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedUserId(null); }}
        onRefresh={() => fetchUsers(page)}
      />
    </div>
  );
}
