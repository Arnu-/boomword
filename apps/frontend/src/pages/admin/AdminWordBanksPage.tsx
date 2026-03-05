import { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Button, Tag, Space, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, Typography, Drawer, Tabs,
  Empty, Switch, Tooltip, Badge, Row, Col, Divider,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined,
  UnorderedListOutlined, SearchOutlined, ReloadOutlined,
  RightOutlined, ArrowLeftOutlined, TagsOutlined,
} from '@ant-design/icons';
import {
  adminWordBankApi, adminChapterApi, adminSectionApi, adminWordApi,
  adminCategoryApi,
  type WordBank, type Chapter, type Section, type Word, type SectionWord, type Category,
} from '@/services/adminService';

const { Text, Title } = Typography;
const { Search } = Input;
const { TextArea } = Input;

// 难度标签
const difficultyConfig: Record<number, { label: string; color: string }> = {
  1: { label: '入门', color: 'green' },
  2: { label: '初级', color: 'cyan' },
  3: { label: '中级', color: 'blue' },
  4: { label: '高级', color: 'orange' },
  5: { label: '专家', color: 'red' },
};

// ==================== 单词选择弹窗 ====================
function WordPickerModal({
  open,
  onClose,
  onSelect,
  excludeIds,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (wordIds: string[]) => void;
  excludeIds: string[];
}) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const fetchWords = useCallback(async (p = 1, kw = keyword) => {
    setLoading(true);
    try {
      const data = await adminWordApi.getWords({ page: p, limit: 10, keyword: kw }) as any;
      setWords(data.items || []);
      setTotal(data.pagination?.total || 0);
      setPage(p);
    } catch {
      message.error('加载单词失败');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    if (open) fetchWords();
  }, [open]);

  const handleOk = () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择至少一个单词');
      return;
    }
    onSelect(selectedRowKeys);
    setSelectedRowKeys([]);
    onClose();
  };

  const columns = [
    {
      title: '英文',
      dataIndex: 'english',
      render: (v: string) => <span style={{ fontWeight: 600, color: '#6366f1' }}>{v}</span>,
    },
    {
      title: '中文',
      dataIndex: 'chinese',
    },
    {
      title: '音标',
      dataIndex: 'phonetic',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '-'}</Text>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 70,
      render: (v: number) => (
        <Tag color={difficultyConfig[v]?.color}>{difficultyConfig[v]?.label || v}</Tag>
      ),
    },
  ];

  return (
    <Modal
      title="选择单词"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      width={700}
      okText={`添加选中 (${selectedRowKeys.length})`}
    >
      <Search
        placeholder="搜索英文/中文"
        allowClear
        onSearch={(v) => { setKeyword(v); fetchWords(1, v); }}
        style={{ marginBottom: 12 }}
      />
      <Table
        dataSource={words.filter((w) => !excludeIds.includes(w.id))}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: (p) => fetchWords(p),
          showTotal: (t) => `共 ${t} 个单词`,
        }}
      />
    </Modal>
  );
}

// ==================== 单词编辑弹窗 ====================
function WordFormModal({
  open,
  word,
  onClose,
  onSuccess,
}: {
  open: boolean;
  word: Word | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (word) {
        form.setFieldsValue({ ...word, tags: word.tags?.join(',') });
      } else {
        form.resetFields();
      }
    }
  }, [open, word]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };
      if (word) {
        await adminWordApi.updateWord(word.id, data);
        message.success('单词更新成功');
      } else {
        await adminWordApi.createWord(data);
        message.success('单词创建成功');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={word ? '编辑单词' : '新建单词'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="english" label="英文" rules={[{ required: true }]}>
              <Input placeholder="English word" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="chinese" label="中文" rules={[{ required: true }]}>
              <Input placeholder="中文释义" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phonetic" label="音标">
              <Input placeholder="/ˈɪŋɡlɪʃ/" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="difficulty" label="难度" initialValue={1}>
              <Select options={Object.entries(difficultyConfig).map(([k, v]) => ({ value: +k, label: v.label }))} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="exampleSentence" label="例句（英文）">
          <TextArea rows={2} placeholder="Example sentence in English" />
        </Form.Item>
        <Form.Item name="exampleChinese" label="例句（中文）">
          <TextArea rows={2} placeholder="例句中文翻译" />
        </Form.Item>
        <Form.Item name="tags" label="标签（逗号分隔）">
          <Input placeholder="名词,动词,常用" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ==================== 小节单词管理 ====================
function SectionWordsPanel({ section, onBack }: { section: Section; onBack: () => void }) {
  const [sectionWords, setSectionWords] = useState<SectionWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [wordFormOpen, setWordFormOpen] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSectionApi.getSectionWords(section.id) as SectionWord[];
      setSectionWords(data);
    } catch {
      message.error('加载单词失败');
    } finally {
      setLoading(false);
    }
  }, [section.id]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const handleAddWords = async (wordIds: string[]) => {
    try {
      await adminSectionApi.batchAddWords(section.id, wordIds);
      message.success(`成功添加 ${wordIds.length} 个单词`);
      fetchWords();
    } catch (e: any) {
      message.error(e.message || '添加失败');
    }
  };

  const handleRemoveWord = async (wordId: string) => {
    try {
      await adminSectionApi.removeWord(section.id, wordId);
      message.success('已移除');
      fetchWords();
    } catch (e: any) {
      message.error(e.message || '移除失败');
    }
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'order',
      width: 60,
      render: (v: number) => <Text type="secondary" style={{ fontSize: 12 }}>#{v}</Text>,
    },
    {
      title: '英文',
      dataIndex: 'word',
      render: (w: Word) => (
        <span style={{ fontWeight: 600, color: '#6366f1', fontSize: 15 }}>{w.english}</span>
      ),
    },
    {
      title: '中文',
      dataIndex: 'word',
      key: 'chinese',
      render: (w: Word) => w.chinese,
    },
    {
      title: '音标',
      dataIndex: 'word',
      key: 'phonetic',
      render: (w: Word) => <Text type="secondary" style={{ fontSize: 12 }}>{w.phonetic || '-'}</Text>,
    },
    {
      title: '难度',
      dataIndex: 'word',
      key: 'difficulty',
      width: 70,
      render: (w: Word) => (
        <Tag color={difficultyConfig[w.difficulty]?.color}>{difficultyConfig[w.difficulty]?.label}</Tag>
      ),
    },
    {
      title: '例句',
      dataIndex: 'word',
      key: 'example',
      render: (w: Word) => (
        <Tooltip title={w.exampleChinese}>
          <Text ellipsis style={{ maxWidth: 200, fontSize: 12 }}>{w.exampleSentence || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: SectionWord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditWord(record.word); setWordFormOpen(true); }}
          >
            编辑
          </Button>
          <Popconfirm title="确认从小节移除？" onConfirm={() => handleRemoveWord(record.wordId)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>移除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="small">返回</Button>
        <div>
          <Title level={5} style={{ margin: 0 }}>{section.name}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>共 {sectionWords.length} 个单词</Text>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setPickerOpen(true)}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
          >
            添加单词
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => { setEditWord(null); setWordFormOpen(true); }}
          >
            新建单词
          </Button>
        </div>
      </div>

      <Table
        dataSource={sectionWords}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={false}
        locale={{ emptyText: <Empty description="暂无单词，点击添加" /> }}
      />

      <WordPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddWords}
        excludeIds={sectionWords.map((sw) => sw.wordId)}
      />

      <WordFormModal
        open={wordFormOpen}
        word={editWord}
        onClose={() => setWordFormOpen(false)}
        onSuccess={() => { fetchWords(); }}
      />
    </div>
  );
}

// ==================== 小节管理面板 ====================
function SectionsPanel({
  chapter,
  onBack,
}: {
  chapter: Chapter;
  onBack: () => void;
}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [form] = Form.useForm();

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminChapterApi.getSections(chapter.id) as Section[];
      setSections(data);
    } catch {
      message.error('加载小节失败');
    } finally {
      setLoading(false);
    }
  }, [chapter.id]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const handleOpenForm = (section?: Section) => {
    setEditSection(section || null);
    if (section) {
      form.setFieldsValue(section);
    } else {
      form.resetFields();
    }
    setFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editSection) {
        await adminChapterApi.updateChapter(editSection.id, values);
        message.success('小节更新成功');
      } else {
        await adminChapterApi.createSection(chapter.id, values);
        message.success('小节创建成功');
      }
      setFormOpen(false);
      fetchSections();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminSectionApi.deleteSection(id);
      message.success('删除成功');
      fetchSections();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  if (selectedSection) {
    return <SectionWordsPanel section={selectedSection} onBack={() => setSelectedSection(null)} />;
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'order',
      width: 60,
      render: (v: number) => <Tag>{v}</Tag>,
    },
    {
      title: '小节名称',
      dataIndex: 'name',
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '单词数',
      dataIndex: '_count',
      width: 90,
      render: (c: any) => (
        <Badge count={c?.sectionWords || 0} showZero color="#6366f1" />
      ),
    },
    {
      title: '时间限制',
      dataIndex: 'timeLimit',
      width: 100,
      render: (v: number) => v ? `${v}秒` : <Text type="secondary">无限制</Text>,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => (
        <Badge status={v ? 'success' : 'default'} text={v ? '启用' : '禁用'} />
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: Section) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => setSelectedSection(record)}
          >
            单词
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenForm(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该小节？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="small">返回</Button>
        <div>
          <Title level={5} style={{ margin: 0 }}>{chapter.name} - 小节管理</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>共 {sections.length} 个小节</Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => handleOpenForm()}
          style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
        >
          新建小节
        </Button>
      </div>

      <Table
        dataSource={sections}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={false}
        locale={{ emptyText: <Empty description="暂无小节" /> }}
      />

      <Modal
        title={editSection ? '编辑小节' : '新建小节'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="小节名称" rules={[{ required: true }]}>
            <Input placeholder="如：第1节" />
          </Form.Item>
          <Form.Item name="timeLimit" label="时间限制（秒，0表示无限制）" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {editSection && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

// ==================== 关卡管理面板 ====================
function ChaptersPanel({
  wordBank,
  onBack,
}: {
  wordBank: WordBank;
  onBack: () => void;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [form] = Form.useForm();

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminWordBankApi.getChapters(wordBank.id) as Chapter[];
      setChapters(data);
    } catch {
      message.error('加载关卡失败');
    } finally {
      setLoading(false);
    }
  }, [wordBank.id]);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  const handleOpenForm = (chapter?: Chapter) => {
    setEditChapter(chapter || null);
    if (chapter) {
      form.setFieldsValue(chapter);
    } else {
      form.resetFields();
    }
    setFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editChapter) {
        await adminChapterApi.updateChapter(editChapter.id, values);
        message.success('关卡更新成功');
      } else {
        await adminWordBankApi.createChapter(wordBank.id, values);
        message.success('关卡创建成功');
      }
      setFormOpen(false);
      fetchChapters();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminChapterApi.deleteChapter(id);
      message.success('删除成功');
      fetchChapters();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  if (selectedChapter) {
    return <SectionsPanel chapter={selectedChapter} onBack={() => setSelectedChapter(null)} />;
  }

  const columns = [
    {
      title: '顺序',
      dataIndex: 'order',
      width: 60,
      render: (v: number) => <Tag color="blue">第{v}关</Tag>,
    },
    {
      title: '关卡名称',
      dataIndex: 'name',
      render: (v: string, record: Chapter) => (
        <div>
          <span style={{ fontWeight: 500 }}>{v}</span>
          {record.description && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '小节数',
      dataIndex: '_count',
      width: 90,
      render: (c: any) => <Badge count={c?.sections || 0} showZero color="#10b981" />,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => (
        <Badge status={v ? 'success' : 'default'} text={v ? '启用' : '禁用'} />
      ),
    },
    {
      title: '操作',
      width: 180,
      render: (_: any, record: Chapter) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<RightOutlined />}
            onClick={() => setSelectedChapter(record)}
          >
            小节
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenForm(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该关卡？将同时删除所有小节" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="small">返回词库</Button>
        <div>
          <Title level={5} style={{ margin: 0 }}>{wordBank.name} - 关卡管理</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>共 {chapters.length} 个关卡</Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => handleOpenForm()}
          style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
        >
          新建关卡
        </Button>
      </div>

      <Table
        dataSource={chapters}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={false}
        locale={{ emptyText: <Empty description="暂无关卡" /> }}
      />

      <Modal
        title={editChapter ? '编辑关卡' : '新建关卡'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="关卡名称" rules={[{ required: true }]}>
            <Input placeholder="如：第一章 基础词汇" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="关卡描述（可选）" />
          </Form.Item>
          {editChapter && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

// ==================== 词库主页面 ====================
export default function AdminWordBanksPage() {
  const [wordBanks, setWordBanks] = useState<WordBank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editWordBank, setEditWordBank] = useState<WordBank | null>(null);
  const [selectedWordBank, setSelectedWordBank] = useState<WordBank | null>(null);
  const [activeTab, setActiveTab] = useState('wordbanks');
  const [form] = Form.useForm();

  // 全局单词管理状态
  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordKeyword, setWordKeyword] = useState('');
  const [wordPage, setWordPage] = useState(1);
  const [wordTotal, setWordTotal] = useState(0);
  const [wordFormOpen, setWordFormOpen] = useState(false);
  const [editWord, setEditWord] = useState<Word | null>(null);

  const fetchWordBanks = useCallback(async (p = 1, kw = keyword, catId = categoryFilter) => {
    setLoading(true);
    try {
      const data = await adminWordBankApi.getWordBanks({ page: p, limit: 15, keyword: kw, categoryId: catId }) as any;
      setWordBanks(data.items || []);
      setTotal(data.pagination?.total || 0);
      setPage(p);
    } catch {
      message.error('加载词库失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminCategoryApi.getCategories() as Category[];
      setCategories(data);
    } catch {
      // 忽略
    }
  }, []);

  const fetchWords = useCallback(async (p = 1, kw = wordKeyword) => {
    setWordsLoading(true);
    try {
      const data = await adminWordApi.getWords({ page: p, limit: 15, keyword: kw }) as any;
      setWords(data.items || []);
      setWordTotal(data.pagination?.total || 0);
      setWordPage(p);
    } catch {
      message.error('加载单词失败');
    } finally {
      setWordsLoading(false);
    }
  }, [wordKeyword]);

  useEffect(() => {
    fetchWordBanks();
    fetchCategories();
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'words' && words.length === 0) fetchWords();
  };

  const handleOpenForm = (wb?: WordBank) => {
    setEditWordBank(wb || null);
    if (wb) {
      form.setFieldsValue(wb);
    } else {
      form.resetFields();
    }
    setFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editWordBank) {
        await adminWordBankApi.updateWordBank(editWordBank.id, values);
        message.success('词库更新成功');
      } else {
        await adminWordBankApi.createWordBank(values);
        message.success('词库创建成功');
      }
      setFormOpen(false);
      fetchWordBanks(page);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminWordBankApi.deleteWordBank(id);
      message.success('删除成功');
      fetchWordBanks(1);
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      await adminWordApi.deleteWord(id);
      message.success('删除成功');
      fetchWords(wordPage);
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  // 如果选中了词库，显示关卡管理
  if (selectedWordBank) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>词库管理</Title>
        </div>
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <ChaptersPanel wordBank={selectedWordBank} onBack={() => setSelectedWordBank(null)} />
        </Card>
      </div>
    );
  }

  const wordBankColumns = [
    {
      title: '词库名称',
      dataIndex: 'name',
      render: (v: string, record: WordBank) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <BookOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{v}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (c: any) => c ? <Tag>{c.name}</Tag> : '-',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (v: number) => (
        <Tag color={difficultyConfig[v]?.color}>{difficultyConfig[v]?.label || v}</Tag>
      ),
    },
    {
      title: '关卡/单词',
      width: 100,
      render: (_: any, record: WordBank) => (
        <span>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>{record._count?.chapters || 0}</span>
          <Text type="secondary"> 关 / </Text>
          <span style={{ color: '#10b981', fontWeight: 600 }}>{record.wordCount}</span>
          <Text type="secondary"> 词</Text>
        </span>
      ),
    },
    {
      title: '学习人数',
      dataIndex: '_count',
      width: 90,
      render: (c: any) => (
        <span style={{ color: '#f59e0b', fontWeight: 500 }}>{c?.userWordBanks || 0}</span>
      ),
    },
    {
      title: '状态',
      width: 100,
      render: (_: any, record: WordBank) => (
        <Space>
          <Badge status={record.isActive ? 'success' : 'default'} text={record.isActive ? '启用' : '禁用'} />
          {record.isFree && <Tag color="green" style={{ fontSize: 11 }}>免费</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: WordBank) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<RightOutlined />}
            onClick={() => setSelectedWordBank(record)}
          >
            关卡
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenForm(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该词库？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const wordColumns = [
    {
      title: '英文',
      dataIndex: 'english',
      render: (v: string) => <span style={{ fontWeight: 600, color: '#6366f1', fontSize: 15 }}>{v}</span>,
    },
    {
      title: '中文',
      dataIndex: 'chinese',
    },
    {
      title: '音标',
      dataIndex: 'phonetic',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '-'}</Text>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (v: number) => (
        <Tag color={difficultyConfig[v]?.color}>{difficultyConfig[v]?.label || v}</Tag>
      ),
    },
    {
      title: '使用小节数',
      dataIndex: '_count',
      width: 100,
      render: (c: any) => (
        <Badge count={c?.sectionWords || 0} showZero color="#8b5cf6" />
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {(tags || []).slice(0, 3).map((t) => (
            <Tag key={t} icon={<TagsOutlined />} style={{ fontSize: 11 }}>{t}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: Word) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditWord(record); setWordFormOpen(true); }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除该单词？" onConfirm={() => handleDeleteWord(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>词库管理</Title>
        <Text style={{ color: '#8c8c8c', fontSize: 13 }}>管理词库、关卡、小节和单词</Text>
      </div>

      <Card
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: '0 0 16px' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          style={{ padding: '0 20px' }}
          items={[
            {
              key: 'wordbanks',
              label: (
                <span>
                  <BookOutlined /> 词库列表
                </span>
              ),
              children: (
                <div style={{ padding: '0 4px' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Search
                      placeholder="搜索词库名称"
                      allowClear
                      onSearch={(v) => { setKeyword(v); fetchWordBanks(1, v, categoryFilter); }}
                      style={{ width: 240 }}
                    />
                    <Select
                      placeholder="按分类筛选"
                      allowClear
                      style={{ width: 160 }}
                      onChange={(v) => { setCategoryFilter(v); fetchWordBanks(1, keyword, v); }}
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    />
                    <Button icon={<ReloadOutlined />} onClick={() => fetchWordBanks(1)}>刷新</Button>
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={() => handleOpenForm()}
                      style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
                    >
                      新建词库
                    </Button>
                  </div>
                  <Table
                    dataSource={wordBanks}
                    columns={wordBankColumns}
                    rowKey="id"
                    loading={loading}
                    size="middle"
                    pagination={{
                      current: page,
                      total,
                      pageSize: 15,
                      onChange: (p) => fetchWordBanks(p),
                      showTotal: (t) => `共 ${t} 个词库`,
                    }}
                    locale={{ emptyText: <Empty description="暂无词库" /> }}
                  />
                </div>
              ),
            },
            {
              key: 'words',
              label: (
                <span>
                  <TagsOutlined /> 单词库
                </span>
              ),
              children: (
                <div style={{ padding: '0 4px' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Search
                      placeholder="搜索英文/中文"
                      allowClear
                      onSearch={(v) => { setWordKeyword(v); fetchWords(1, v); }}
                      style={{ width: 240 }}
                    />
                    <Button icon={<ReloadOutlined />} onClick={() => fetchWords(1)}>刷新</Button>
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={() => { setEditWord(null); setWordFormOpen(true); }}
                      style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
                    >
                      新建单词
                    </Button>
                  </div>
                  <Table
                    dataSource={words}
                    columns={wordColumns}
                    rowKey="id"
                    loading={wordsLoading}
                    size="middle"
                    pagination={{
                      current: wordPage,
                      total: wordTotal,
                      pageSize: 15,
                      onChange: (p) => fetchWords(p),
                      showTotal: (t) => `共 ${t} 个单词`,
                    }}
                    locale={{ emptyText: <Empty description="暂无单词" /> }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 词库表单弹窗 */}
      <Modal
        title={editWordBank ? '编辑词库' : '新建词库'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => form.submit()}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="name" label="词库名称" rules={[{ required: true }]}>
                <Input placeholder="如：高中英语必备词汇" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="code" label="唯一编码" rules={[{ required: true }]}>
                <Input placeholder="如：high_school_en" disabled={!!editWordBank} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
            <Select
              placeholder="选择分类"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="词库描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="difficulty" label="难度" initialValue={1}>
                <Select options={Object.entries(difficultyConfig).map(([k, v]) => ({ value: +k, label: v.label }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sort" label="排序" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isFree" label="是否免费" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="免费" unCheckedChildren="付费" />
              </Form.Item>
            </Col>
          </Row>
          {editWordBank && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 单词表单弹窗 */}
      <WordFormModal
        open={wordFormOpen}
        word={editWord}
        onClose={() => setWordFormOpen(false)}
        onSuccess={() => fetchWords(wordPage)}
      />
    </div>
  );
}
